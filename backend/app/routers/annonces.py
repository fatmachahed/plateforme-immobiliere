from app.utils.auth import get_current_user # backend/app/routers/annonces.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime, timedelta
from app import schemas, crud, database
from app import models

router = APIRouter(
    prefix="/annonces",
    tags=["Annonces"]
)

get_db = database.get_db

# ===============================
# STATS MARCHÉ (prix moyen/m² par gouvernorat), pour la barre d'évaluation prix
# ===============================
@router.get("/market-stats")
def get_market_stats(db: Session = Depends(get_db)):
    """Prix moyen au m² par gouvernorat + délégation (plus précis qu'un simple
    gouvernorat — deux délégations d'un même gouvernorat peuvent avoir des
    marchés très différents), SEGMENTÉ par catégorie (vente/location/
    vacances — un loyer ne se compare pas à un prix de vente), par durée de
    location pour les vacances (nuitée/semaine/mois/an), et par état du bien
    (neuf/en construction vs bon état/à rénover). Clé retournée :
    "{gouvernorat}|{delegation}|{categorie}|{etat_ou_duree}" — voir statsKey()
    côté front (utils/priceEval.js) qui doit rester cohérente avec ce
    regroupement."""
    from sqlalchemy import func, case
    etat_group = case(
        (models.Annonce.etat_bien.in_(["nouveau", "cours_construction"]), "neuf"),
        else_="ancien",
    )
    sous_cle = case(
        (models.Annonce.categorie == "vacances", func.coalesce(models.Annonce.duree_type, "nuit")),
        else_=etat_group,
    )
    rows = (
        db.query(
            models.Gouvernorat.nom.label("gouvernorat"),
            models.Delegation.nom.label("delegation"),
            models.Annonce.categorie.label("categorie"),
            sous_cle.label("sous_cle"),
            func.avg(models.Annonce.prix / models.Annonce.superficie).label("avg_prix_m2"),
            func.count(models.Annonce.id).label("count"),
        )
        .join(models.Gouvernorat, models.Gouvernorat.id == models.Annonce.gouvernorat_id)
        .join(models.Delegation, models.Delegation.id == models.Annonce.delegation_id)
        .filter(
            models.Annonce.status == "approuvee",
            models.Annonce.prix > 0,
            models.Annonce.superficie > 0,
            # Exclut les prix/m² aberrants (< 10, erreur de saisie ou prix
            # symbolique) — ne doivent jamais fausser la moyenne de référence
            # utilisée pour évaluer les autres annonces du même groupe.
            (models.Annonce.prix / models.Annonce.superficie) >= 10,
        )
        .group_by(models.Gouvernorat.nom, models.Delegation.nom, models.Annonce.categorie, sous_cle)
        .all()
    )
    cat_val = lambda c: c.value if hasattr(c, "value") else str(c)
    return {
        f"{r.gouvernorat}|{r.delegation}|{cat_val(r.categorie)}|{r.sous_cle}": {"avg_prix_m2": float(r.avg_prix_m2), "count": r.count}
        for r in rows
    }

# ===============================
# SUIVI DES CLICS DE CONTACT (téléphone / whatsapp / email)
# Alimente le tableau de bord statistiques des agences (voir routers/users.py)
# ===============================
@router.post("/{annonce_id}/contact-click")
def track_contact_click(annonce_id: int, body: dict, db: Session = Depends(get_db)):
    canal = body.get("canal")
    if canal not in ("telephone", "whatsapp", "email"):
        raise HTTPException(400, "Canal invalide")
    if not db.query(models.Annonce.id).filter(models.Annonce.id == annonce_id).first():
        raise HTTPException(404, "Annonce non trouvée")
    db.add(models.ContactClick(annonce_id=annonce_id, canal=canal))
    db.commit()
    return {"ok": True}

# ===============================
# HISTORIQUE ADRESSES (utilisateur connecté)
# ===============================
@router.get("/my-addresses")
def get_my_addresses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retourne les adresses uniques déjà utilisées par l'utilisateur avec le nb de biens."""
    from sqlalchemy import func
    rows = (
        db.query(
            models.Property.address,
            models.Property.latitude,
            models.Property.longitude,
            func.count(models.Annonce.id).label("count")
        )
        .join(models.Annonce, models.Annonce.id == models.Property.annonce_id)
        .filter(
            models.Annonce.utilisateur_id == current_user.id,
            models.Property.address != None,
            models.Property.address != "",
        )
        .group_by(models.Property.address, models.Property.latitude, models.Property.longitude)
        .order_by(func.count(models.Annonce.id).desc())
        .all()
    )
    return [{"address": r.address, "latitude": r.latitude, "longitude": r.longitude, "count": r.count} for r in rows]

# ===============================
# CREATE
# ===============================
@router.post("/", response_model=schemas.AnnonceRead)
def create_annonce(
    annonce: schemas.AnnonceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_annonce(
        db=db,
        annonce=annonce,
        utilisateur_id=current_user.id
    )

# ===============================
# PUBLIC SEARCH (no auth required, boost ordering)
# ===============================
@router.get("/public", response_model=list[schemas.AnnoncePublic])
def search_annonces_public(
    categorie: Optional[str] = None,
    type_bien: Optional[str] = None,
    gouvernorat_id: Optional[int] = None,
    prix_min: Optional[float] = None,
    prix_max: Optional[float] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(models.Annonce).filter(
        models.Annonce.status == "approuvee"
    )
    if categorie:
        query = query.filter(models.Annonce.categorie == categorie)
    if type_bien:
        if type_bien == "villa_maison":
            query = query.filter(models.Annonce.type_bien.in_(["villa", "maison", "villa_maison"]))
        else:
            query = query.filter(models.Annonce.type_bien == type_bien)
    if gouvernorat_id:
        query = query.filter(models.Annonce.gouvernorat_id == gouvernorat_id)
    if prix_min is not None:
        query = query.filter(models.Annonce.prix >= prix_min)
    if prix_max is not None:
        query = query.filter(models.Annonce.prix <= prix_max)

    # Boost d'abord, puis date de refresh/modification décroissante
    annonces = query.order_by(
        desc(models.Annonce.boost_level),
        desc(models.Annonce.date_mise_a_jour),
        desc(models.Annonce.date_creation)
    ).offset(skip).limit(limit).all()

    # Même mapping que get_annonce_detail
    FEAT_GEN = {"jardin":"Jardin","terrasse":"Terrasse","balcon":"Balcon","parking":"Parking",
        "garage":"Garage","ascenseur":"Ascenseur","vue_mer":"Vue sur mer","vue_montagne":"Vue montagne",
        "vue_foret":"Vue forêt","piscine":"Piscine","concierge":"Concierge","cellier":"Chambre rangement",
        "meuble":"Meublé","digicode":"Digicode","interphone":"Interphone","gardien":"Gardien",
        "relie_onas":"Relié ONAS","animaux_admis":"Animaux admis"}
    FEAT_INT = {"salon_americain":"Salon américain","fibre_optique":"Fibre optique",
        "cheminee":"Cheminée","climatisation":"Climatisation","chauffage_central":"Chauffage central",
        "securite":"Sécurité","double_vitrage":"Double vitrage","porte_blink":"Porte blindée",
        "internet":"Internet","tv":"TV"}

    result = []
    for a in annonces:
        lat = lng = img = None
        gov = dele = None
        if a.property:
            lat = a.property.latitude
            lng = a.property.longitude
            img = a.property.image_principale
        loc  = None
        addr = None
        if a.gouvernorat:
            gov = a.gouvernorat.nom
        if a.delegation:
            dele = a.delegation.nom
        if a.localite:
            loc = a.localite.nom
        if a.property:
            addr = a.property.address

        # Construire le tableau complet des images
        all_images = []
        if a.property:
            if a.property.image_principale:
                all_images.append(a.property.image_principale)
            for pimg in (a.property.images or []):
                if pimg.image and pimg.image != a.property.image_principale:
                    all_images.append(pimg.image)

        # Calculer les features
        feats = []
        if a.caractere_general:
            for k, lbl in FEAT_GEN.items():
                if getattr(a.caractere_general, k, False): feats.append(lbl)
        if a.caracteristique_interieure:
            for k, lbl in FEAT_INT.items():
                if getattr(a.caracteristique_interieure, k, False): feats.append(lbl)
        if a.cuisine_equipee:
            if a.cuisine_equipee.cuisine_equipee: feats.append("Cuisine équipée")
            if getattr(a.cuisine_equipee, "machine_laver", False): feats.append("Machine à laver")

        result.append(schemas.AnnoncePublic(
            id=a.id, titre=a.titre, prix=float(a.prix), devise=a.devise.value if hasattr(a.devise, 'value') else a.devise,
            superficie=a.superficie, categorie=a.categorie.value if hasattr(a.categorie, 'value') else a.categorie,
            type_bien=a.type_bien.value if hasattr(a.type_bien, 'value') else a.type_bien,
            boost_level=a.boost_level or 0, spotlight_active=a.spotlight_active or False, views_count=a.views_count or 0,
            date_creation=a.date_creation, latitude=lat, longitude=lng,
            image_principale=img, gouvernorat=gov, delegation=dele,
            localite=loc, address=addr,
            nb_pieces=a.nb_pieces, nb_chambres=a.nb_chambres, nb_salles_bain=a.nb_salles_bain,
            type_appartement=str(a.type_appartement.value) if a.type_appartement else None,
            type_villa=str(a.type_villa.value) if a.type_villa else None,
            type_bureau=a.type_bureau,
            etage=a.etage,
            nb_appartements=a.nb_appartements,
            hauteur_immeuble=a.hauteur_immeuble,
            emplacement_garage=a.emplacement_garage,
            duree_type=a.duree_type,
            duree_valeur=a.duree_valeur, capacite_accueil=a.capacite_accueil,
            features=feats,
            colocation=a.colocation or False,
            places_totales=a.places_totales,
            places_occupees=a.places_occupees,
            profil_coloc=a.profil_coloc,
            rating_avg=a.rating_avg,
            rating_count=a.rating_count or 0,
            images=all_images,
            date_mise_a_jour=a.date_mise_a_jour,
            etat_bien=a.etat_bien.value if a.etat_bien and hasattr(a.etat_bien, "value") else (str(a.etat_bien) if a.etat_bien else None),
            titre_foncier=bool(a.titre_foncier) if a.titre_foncier is not None else None,
            prix_ancien=float(a.prix_ancien) if a.prix_ancien else None,
        ))
    return result


@router.get("/at-point")
def get_annonces_at_point(
    lat: float,
    lng: float,
    exclude_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Retourne toutes les annonces approuvées au même point GPS (±0.0001°, ~11m)."""
    from sqlalchemy import func
    annonces = (
        db.query(models.Annonce)
        .join(models.Property, models.Property.annonce_id == models.Annonce.id)
        .filter(
            models.Annonce.status == "approuvee",
            models.Property.latitude  == lat,
            models.Property.longitude == lng,
        )
        .order_by(models.Annonce.boost_level.desc(), models.Annonce.date_creation.desc())
        .all()
    )
    result = []
    for a in annonces:
        if exclude_id and a.id == exclude_id:
            continue
        prop = a.property
        img  = prop.image_principale if prop else None
        gov  = a.gouvernorat.nom if a.gouvernorat else None
        result.append({
            "id":        a.id,
            "titre":     a.titre,
            "prix":      float(a.prix),
            "devise":    a.devise.value if hasattr(a.devise, "value") else str(a.devise),
            "type_bien": a.type_bien.value if hasattr(a.type_bien, "value") else str(a.type_bien),
            "categorie": a.categorie.value if hasattr(a.categorie, "value") else str(a.categorie),
            "superficie": a.superficie,
            "nb_pieces":  a.nb_pieces,
            "image_principale": img,
            "gouvernorat": gov,
            "date_creation": a.date_creation.isoformat(),
        })
    return result


@router.get("/map-pins")
def get_map_pins(
    categorie: Optional[str] = None,
    type_bien: Optional[str] = None,
    gouvernorat_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Données légères pour afficher les punaises sur la carte."""
    query = db.query(models.Annonce).filter(
        models.Annonce.status == "approuvee"
    )
    if categorie:
        query = query.filter(models.Annonce.categorie == categorie)
    if type_bien:
        if type_bien == "villa_maison":
            query = query.filter(models.Annonce.type_bien.in_(["villa", "maison", "villa_maison"]))
        else:
            query = query.filter(models.Annonce.type_bien == type_bien)
    if gouvernorat_id:
        query = query.filter(models.Annonce.gouvernorat_id == gouvernorat_id)

    annonces = query.order_by(desc(models.Annonce.boost_level)).all()

    pins = []
    for a in annonces:
        if a.property and a.property.latitude and a.property.longitude:
            pins.append({
                "id": a.id,
                "titre": a.titre,
                "prix": float(a.prix),
                "devise": a.devise.value if hasattr(a.devise, 'value') else str(a.devise),
                "type_bien": a.type_bien.value if hasattr(a.type_bien, 'value') else str(a.type_bien),
                "boost_level": a.boost_level or 0,
                "latitude": a.property.latitude,
                "longitude": a.property.longitude,
            })
    return pins


# ===============================
# READ ALL
# ===============================
@router.get("/")
def read_annonces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retourne les annonces avec image_principale incluse directement."""
    annonces = crud.get_annonces_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

    result = []
    for a in annonces:
        prop = a.property  # relation 1-to-1
        result.append({
            "id":              a.id,
            "titre":           a.titre,
            "categorie":       a.categorie.value if hasattr(a.categorie, "value") else str(a.categorie),
            "type_bien":       a.type_bien.value  if hasattr(a.type_bien,  "value") else str(a.type_bien),
            "status":          a.status.value     if hasattr(a.status,     "value") else str(a.status),
            "prix":            float(a.prix) if a.prix else 0,
            "superficie":      float(a.superficie) if a.superficie else None,
            "devise":          a.devise.value if hasattr(a.devise, "value") else str(a.devise),
            "description":     a.description,
            "date_creation":   a.date_creation.isoformat(),
            "date_mise_a_jour":a.date_mise_a_jour.isoformat() if a.date_mise_a_jour else None,
            "boost_level":     a.boost_level or 0,
            "views_count":     a.views_count  or 0,
            "utilisateur_id":  a.utilisateur_id,
            "gouvernorat_id":  a.gouvernorat_id,
            "delegation_id":   a.delegation_id,
            "localite_id":     a.localite_id,
            "nb_pieces":       a.nb_pieces,
            "nb_chambres":     a.nb_chambres,
            "nb_salles_bain":  a.nb_salles_bain,
            "anonyme":                  a.anonyme or False,
            "accompagnement":           a.accompagnement or False,
            "accompagnement_agence_id": a.accompagnement_agence_id,
            "accompagnement_agence_nom": (
                a.accompagnement_agence.username
                if a.accompagnement_agence else None
            ),
            "duree_type":        a.duree_type,
            "duree_valeur":      a.duree_valeur,
            "capacite_accueil":  a.capacite_accueil,
            # Image principale depuis la relation property (1-to-1)
            "image_principale": prop.image_principale if prop else None,
            "properties": [{
                "id":              prop.id,
                "annonce_id":      prop.annonce_id,
                "address":         prop.address,
                "latitude":        prop.latitude,
                "longitude":       prop.longitude,
                "image_principale":prop.image_principale,
            }] if prop else [],
        })
    return result

# ===============================
# RICH DETAIL (for detail page)
# ===============================
@router.get("/{annonce_id}/detail")
def get_annonce_detail(annonce_id: int, db: Session = Depends(get_db)):
    a = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not a:
        raise HTTPException(404, "Annonce non trouvée")

    # Increment views
    a.views_count = (a.views_count or 0) + 1
    db.commit()

    prop = a.property
    gov  = a.gouvernorat.nom if a.gouvernorat else None
    dele = a.delegation.nom  if a.delegation  else None
    loc  = a.localite.nom    if a.localite    else None
    user = a.utilisateur

    # Features from caractere_general
    features = []
    feat_labels = {
        "jardin":"Jardin","terrasse":"Terrasse","balcon":"Balcon","parking":"Parking",
        "garage":"Garage","ascenseur":"Ascenseur","vue_mer":"Vue sur mer",
        "vue_montagne":"Vue montagne","vue_foret":"Vue forêt","piscine":"Piscine",
        "concierge":"Concierge","cellier":"Chambre rangement","meuble":"Meublé",
        "digicode":"Digicode","interphone":"Interphone","gardien":"Gardien",
        "relie_onas":"Relié ONAS","animaux_admis":"Animaux admis",
    }
    if a.caractere_general:
        cg = a.caractere_general
        for k, label in feat_labels.items():
            if getattr(cg, k, False):
                if k == "jardin" and cg.surface_jardin:
                    label = f"{label} ({cg.surface_jardin:g} m²)"
                elif k == "terrasse" and cg.surface_terrasse:
                    label = f"{label} ({cg.surface_terrasse:g} m²)"
                elif k == "piscine" and cg.surface_piscine:
                    label = f"{label} ({cg.surface_piscine:g} m³)"
                elif k == "garage" and cg.nb_places_garage and cg.nb_places_garage > 1:
                    label = f"{label} ({cg.nb_places_garage} places)"
                features.append(label)
    ci_labels = {
        "salon_americain":"Salon américain","fibre_optique":"Fibre optique",
        "cheminee":"Cheminée","climatisation":"Climatisation",
        "chauffage_central":"Chauffage central","securite":"Sécurité",
        "double_vitrage":"Double vitrage","porte_blink":"Porte blindée",
        "internet":"Internet","tv":"TV",
    }
    if a.caracteristique_interieure:
        for k, label in ci_labels.items():
            if getattr(a.caracteristique_interieure, k, False):
                features.append(label)
    if a.cuisine_equipee:
        if a.cuisine_equipee.cuisine_equipee: features.append("Cuisine équipée")
        if a.cuisine_equipee.machine_laver:   features.append("Machine à laver")

    # Images (main first, then extras)
    images = []
    if prop:
        if prop.image_principale:
            images.append(prop.image_principale)
        for img in sorted(prop.images, key=lambda x: (x.ordre or 0, x.id)):
            if img.image and img.image != prop.image_principale:
                images.append(img.image)

    return {
        "id":              a.id,
        "titre":           a.titre,
        "prix":            float(a.prix),
        "devise":          a.devise.value          if hasattr(a.devise,          "value") else str(a.devise),
        "superficie":      a.superficie,
        "categorie":       a.categorie.value       if hasattr(a.categorie,       "value") else str(a.categorie),
        "type_bien":       a.type_bien.value        if hasattr(a.type_bien,        "value") else str(a.type_bien),
        "type_appartement":a.type_appartement.value if a.type_appartement and hasattr(a.type_appartement,"value") else (str(a.type_appartement) if a.type_appartement else None),
        "type_villa":      a.type_villa.value       if a.type_villa      and hasattr(a.type_villa,      "value") else (str(a.type_villa)      if a.type_villa      else None),
        "type_terrain":    a.type_terrain.value     if a.type_terrain    and hasattr(a.type_terrain,    "value") else (str(a.type_terrain)    if a.type_terrain    else None),
        "etat_bien":       a.etat_bien.value        if a.etat_bien       and hasattr(a.etat_bien,       "value") else (str(a.etat_bien)       if a.etat_bien       else None),
        "etage":           a.etage,
        "description":     a.description,
        "status":          a.status.value           if hasattr(a.status,          "value") else str(a.status),
        "gouvernorat":     gov,
        "delegation":      dele,
        "localite":        loc,
        "gouvernorat_id":  a.gouvernorat_id,
        "delegation_id":   a.delegation_id,
        "localite_id":     a.localite_id,
        "address":         prop.address     if prop else None,
        "latitude":        prop.latitude    if prop else None,
        "longitude":       prop.longitude   if prop else None,
        "property_id":     prop.id          if prop else None,
        "nb_pieces":       a.nb_pieces,
        "nb_chambres":     a.nb_chambres,
        "nb_salles_bain":  a.nb_salles_bain,
        "telephone":       a.telephone,
        "boost_level":     a.boost_level    or 0,
        "views_count":     a.views_count    or 0,
        "date_creation":   a.date_creation.isoformat(),
        "images":          images,
        "features":        features,
        "annee_construction": a.annee_construction,
        "exclusivite":        a.exclusivite or False,
        "titre_foncier":      a.titre_foncier.value if a.titre_foncier and hasattr(a.titre_foncier,"value") else (str(a.titre_foncier) if a.titre_foncier else None),
        "terrain_viabilise":  a.terrain_viabilise or False,
        "type_option_villa":  a.type_option_villa.value if a.type_option_villa and hasattr(a.type_option_villa,"value") else (str(a.type_option_villa) if a.type_option_villa else None),
        "hauteur_immeuble":     a.hauteur_immeuble,
        "nb_appartements":      a.nb_appartements,
        "orientation_immeuble": a.orientation_immeuble,
        "emplacement_garage":   a.emplacement_garage,
        "reference":            a.reference,
        "anonyme":              a.anonyme or False,
        "accompagnement":       a.accompagnement or False,
        "standing":             a.standing.value if a.standing and hasattr(a.standing,"value") else (str(a.standing) if a.standing else None),
        "open_space":           a.open_space or False,
        "modelisation_3d":      a.modelisation_3d or False,
        "type_bureau":          a.type_bureau,
        "vocation_terrain":     a.vocation_terrain,
        "duree_type":           a.duree_type,
        "duree_valeur":         a.duree_valeur,
        "capacite_accueil":     a.capacite_accueil,
        "terrain_viabilise":    a.terrain_viabilise or False,
        "date_mise_a_jour":     a.date_mise_a_jour.isoformat() if a.date_mise_a_jour else None,
        "rating_avg":           a.rating_avg,
        "rating_count":         a.rating_count or 0,
        "boost_expires_at":     a.boost_expires_at.isoformat() if a.boost_expires_at else None,
        "spotlight_active":     a.spotlight_active or False,
        "spotlight_expires_at": a.spotlight_expires_at.isoformat() if a.spotlight_expires_at else None,
        "prix_ancien":          float(a.prix_ancien) if a.prix_ancien else None,
        "caractere_general": {k: getattr(a.caractere_general, k, False) for k in ["jardin","terrasse","balcon","parking","garage","ascenseur","vue_mer","vue_montagne","vue_foret","piscine","concierge","cellier","meuble","facade_exterieure","digicode","interphone","gardien","travaux_prevoir","relie_onas","animaux_admis"]} if a.caractere_general else None,
        "caracteristique_interieure": {k: getattr(a.caracteristique_interieure, k, False) for k in ["salon_americain","antenne_parabolique","fibre_optique","cheminee","climatisation","chauffage_central","securite","vitrage_aluminium","double_vitrage","porte_blink","internet","tv"]} if a.caracteristique_interieure else None,
        "cuisine_equipee": {k: getattr(a.cuisine_equipee, k, False) for k in ["cuisine_equipee","refrigerateur","four","machine_laver","microondes"]} if a.cuisine_equipee else None,
        "etage_options": {k: getattr(a.etage_options, k, False) for k in ["premier_etage","dernier_etage","rez_de_chaussee","plain_pied"]} if a.etage_options else None,
        "colocation":           a.colocation or False,
        "places_totales":       a.places_totales,
        "places_occupees":      a.places_occupees,
        "profil_coloc":         a.profil_coloc,
        "genre_coloc":          [g for g in (a.genre_coloc or "").split(",") if g] if a.genre_coloc else [],
        "chambres_colocation":  [
            {
                "numero_chambre":  ch.numero_chambre,
                "capacite":        ch.capacite,
                "places_occupees": ch.places_occupees,
                "prix_par_place":  ch.prix_par_place or 0,
                "disponibles":     max(0, ch.capacite - ch.places_occupees),
            }
            for ch in (a.chambres_colocation or [])
        ],
        "user": {
            "id":              user.id              if user else None,
            "username":        user.username        if user else None,
            "role":            user.role.value      if user and hasattr(user.role, "value") else (str(user.role) if user else None),
            "phone_number":    user.phone_number    if user else None,
            "phone_numbers":   [p.numero for p in db.query(models.UserPhoneNumber).filter(models.UserPhoneNumber.user_id == user.id).order_by(models.UserPhoneNumber.id).all()] if user else [],
            "email":           user.email           if user else None,
            "profile_picture": user.profile_picture if user else None,
        } if user else None,
    }


# ===============================
# READ BY ID
# ===============================
@router.get("/{annonce_id}", response_model=schemas.AnnonceRead)
def read_annonce(annonce_id: int, db: Session = Depends(get_db)):
    annonce = crud.get_annonce(db, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    return annonce

# ===============================
# UPDATE
# ===============================
@router.put("/{annonce_id}", response_model=schemas.AnnonceRead)
def update_annonce(
    annonce_id: int,
    update_data: schemas.AnnonceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = crud.get_annonce(db, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")

    if annonce.utilisateur_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Action interdite")

    data = update_data.dict(exclude_unset=True)

    # Détecter baisse de prix → envoyer emails aux abonnés
    if "prix" in data and annonce.prix and float(data["prix"]) < float(annonce.prix):
        ancien_prix = float(annonce.prix)
        nouveau_prix = float(data["prix"])
        devise = annonce.devise or "TND"
        titre  = annonce.titre or "Annonce"
        pct    = round((1 - nouveau_prix / ancien_prix) * 100)
        alerts = db.query(models.PrixAlert).filter(models.PrixAlert.annonce_id == annonce_id).all()
        if alerts:
            from app.email_utils import send_email
            for alert in alerts:
                html = f"""
                <div style="font-family:sans-serif;max-width:580px;margin:auto">
                  <h2 style="color:#6366f1">Baisse de prix — {titre}</h2>
                  <p>Le bien que vous surveillez vient de baisser de <strong style="color:#ef4444">{pct}%</strong> !</p>
                  <table style="border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:6px 12px;color:#64748b">Ancien prix</td><td style="padding:6px 12px;text-decoration:line-through;color:#94a3b8">{int(ancien_prix):,} {devise}</td></tr>
                    <tr><td style="padding:6px 12px;color:#64748b">Nouveau prix</td><td style="padding:6px 12px;font-weight:700;font-size:18px;color:#0f172a">{int(nouveau_prix):,} {devise}</td></tr>
                  </table>
                  <a href="http://localhost:5173/annonce/{annonce_id}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Voir l'annonce</a>
                  <p style="margin-top:24px;font-size:12px;color:#94a3b8">Pour ne plus recevoir ces alertes, contactez-nous.</p>
                </div>
                """
                send_email(alert.email, f"Baisse de prix : {titre} (-{pct}%)", html)

    # Si le propriétaire modifie une annonce refusée → repasse en attente
    current_status = annonce.status.value if hasattr(annonce.status, "value") else annonce.status
    if current_user.role != "admin" and current_status == "refusee":
        data["status"] = "en_attente"
        annonce.refus_raisons = None
        annonce.refus_message = None
        db.flush()

    return crud.update_annonce(db, annonce_id, data)


# ===============================
# ALERTE BAISSE DE PRIX
# ===============================
@router.post("/{annonce_id}/prix-alert")
def subscribe_prix_alert(
    annonce_id: int,
    body: dict,
    db: Session = Depends(get_db)
):
    email = (body.get("email") or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Email invalide")
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    existing = db.query(models.PrixAlert).filter(
        models.PrixAlert.annonce_id == annonce_id,
        models.PrixAlert.email == email
    ).first()
    if existing:
        return {"ok": True, "message": "Vous êtes déjà abonné à cette alerte."}
    alert = models.PrixAlert(annonce_id=annonce_id, email=email)
    db.add(alert)
    db.commit()
    # Email de confirmation
    from app.email_utils import send_email
    titre = annonce.titre or "Annonce"
    send_email(email, f"Alerte prix activée — {titre}", f"""
    <div style="font-family:sans-serif;max-width:580px;margin:auto">
      <h2 style="color:#6366f1">Alerte activée</h2>
      <p>Vous recevrez un email dès que le prix de <strong>{titre}</strong> baisse.</p>
      <a href="http://localhost:5173/annonce/{annonce_id}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Voir l'annonce</a>
    </div>
    """)
    return {"ok": True, "message": "Alerte activée. Vous recevrez un email en cas de baisse de prix."}


# ===============================
# TOGGLE ACCOMPAGNEMENT
# ===============================
@router.patch("/{annonce_id}/accompagnement")
def update_accompagnement(
    annonce_id: int,
    body: dict = {},
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Active/désactive accompagnement et met à jour l'agence choisie."""
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")

    # Si "accompagnement" fourni dans le body → set direct, sinon toggle
    if "accompagnement" in body:
        annonce.accompagnement = bool(body["accompagnement"])
    else:
        annonce.accompagnement = not (annonce.accompagnement or False)

    # Agence choisie (optionnel)
    if "agence_id" in body:
        annonce.accompagnement_agence_id = body["agence_id"] or None

    db.commit()
    db.refresh(annonce)
    agence_nom = annonce.accompagnement_agence.username if annonce.accompagnement_agence else None
    return {
        "id": annonce_id,
        "accompagnement": annonce.accompagnement,
        "accompagnement_agence_id": annonce.accompagnement_agence_id,
        "accompagnement_agence_nom": agence_nom,
    }


# ===============================
# STATUT PUBLICATION — vendue / louee / remettre en ligne
# ===============================
@router.patch("/{annonce_id}/statut-publication")
def set_statut_publication(
    annonce_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from app.enums import StatusEnum
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")
    nouveau_statut = body.get("statut")
    if nouveau_statut not in [s.value for s in StatusEnum]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    annonce.status = StatusEnum(nouveau_statut)
    db.commit()
    db.refresh(annonce)
    return {"id": annonce_id, "status": annonce.status}


# ===============================
# SPOTLIGHT — badge "À ne pas manquer" (7 jours)
# ===============================
@router.patch("/{annonce_id}/spotlight")
def spotlight_annonce(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")
    annonce.spotlight_active = True
    annonce.spotlight_expires_at = datetime.utcnow() + timedelta(days=7)
    db.commit()
    return {"id": annonce_id, "spotlight_active": True, "spotlight_expires_at": annonce.spotlight_expires_at}


# REFRESH — remonte l'annonce en tête de liste
# ===============================
@router.patch("/{annonce_id}/refresh")
def refresh_annonce(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")
    annonce.date_mise_a_jour = datetime.utcnow()
    db.commit()
    return {"id": annonce_id, "date_mise_a_jour": annonce.date_mise_a_jour}


# ===============================
# COLOCATION — mettre à jour places_occupees
# ===============================
@router.patch("/{annonce_id}/colocation")
def update_colocation(
    annonce_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")
    if "places_occupees" in body:
        val = int(body["places_occupees"])
        tot = annonce.places_totales or 0
        annonce.places_occupees = max(0, min(val, tot))
    db.commit()
    db.refresh(annonce)
    return {
        "id": annonce_id,
        "places_totales":  annonce.places_totales,
        "places_occupees": annonce.places_occupees,
        "places_disponibles": (annonce.places_totales or 0) - (annonce.places_occupees or 0),
    }


# ===============================
# REACTION / NOTE VISITEUR (anonyme)
# ===============================
@router.post("/{annonce_id}/reaction")
def save_reaction(
    annonce_id: int,
    body: schemas.AnnonceReactionCreate,
    db: Session = Depends(get_db)
):
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    existing = db.query(models.AnnonceReaction).filter(
        models.AnnonceReaction.annonce_id == annonce_id,
        models.AnnonceReaction.session_key == body.session_key
    ).first()
    if existing:
        existing.note = body.note
    else:
        db.add(models.AnnonceReaction(annonce_id=annonce_id, session_key=body.session_key, note=body.note))
    db.flush()
    # Recalcul de la moyenne
    from sqlalchemy import func
    stats = db.query(
        func.avg(models.AnnonceReaction.note).label("avg"),
        func.count(models.AnnonceReaction.id).label("cnt")
    ).filter(models.AnnonceReaction.annonce_id == annonce_id).first()
    annonce.rating_avg   = round(float(stats.avg), 2) if stats.avg else None
    annonce.rating_count = stats.cnt or 0
    db.commit()
    return {"rating_avg": annonce.rating_avg, "rating_count": annonce.rating_count}


# ===============================
# STATS PROPRIÉTAIRE (vues + favoris + note)
# ===============================
@router.get("/{annonce_id}/stats", response_model=schemas.AnnonceStatsRead)
def get_annonce_stats(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")
    favoris_count = db.query(models.Favori).filter(models.Favori.annonce_id == annonce_id).count()
    return schemas.AnnonceStatsRead(
        id=annonce_id,
        views_count=annonce.views_count or 0,
        favoris_count=favoris_count,
        rating_avg=annonce.rating_avg,
        rating_count=annonce.rating_count or 0,
    )


# ===============================
# DELETE
# ===============================
@router.delete("/{annonce_id}")
def delete_annonce(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = crud.get_annonce(db, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")

    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")

    crud.delete_annonce(db, annonce_id)
    return {"detail": "Annonce supprimée"}


# ===============================
# DEMANDE DE CONTACT ANONYME
# ===============================
@router.post("/{annonce_id}/contact-request", status_code=201)
def contact_request(
    annonce_id: int,
    body: schemas.ContactRequestCreate,
    db: Session = Depends(get_db)
):
    """Envoie une demande de contact au propriétaire d'une annonce anonyme."""
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if not (body.email or body.telephone):
        raise HTTPException(status_code=400, detail="Email ou téléphone requis pour que le propriétaire puisse vous contacter")
    req = models.ContactRequest(
        annonce_id = annonce_id,
        nom        = body.nom,
        email      = body.email,
        telephone  = body.telephone,
        message    = body.message,
    )
    db.add(req)
    db.commit()
    try:
        from app.push_utils import send_push_to_user
        send_push_to_user(db, annonce.utilisateur_id, "Nouvelle demande de contact",
                           f"{body.nom} s'intéresse à votre annonce « {annonce.titre} ».", "/compte?tab=contacts")
    except Exception:
        pass
    return {"detail": "Demande envoyée. Le propriétaire vous contactera prochainement."}


@router.get("/{annonce_id}/contact-requests")
def get_contact_requests(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Liste les demandes de contact pour une annonce (propriétaire uniquement)."""
    annonce = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    if annonce.utilisateur_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Action interdite")
    reqs = db.query(models.ContactRequest).filter(models.ContactRequest.annonce_id == annonce_id).all()
    return [{"id":r.id,"nom":r.nom,"email":r.email,"telephone":r.telephone,
             "message":r.message,"created_at":r.created_at.isoformat(),"lu":r.lu} for r in reqs]

