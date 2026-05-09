from app.utils.auth import get_current_user # backend/app/routers/annonces.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from app import schemas, crud, database
from app import models

router = APIRouter(
    prefix="/annonces",
    tags=["Annonces"]
)

get_db = database.get_db

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
        query = query.filter(models.Annonce.type_bien == type_bien)
    if gouvernorat_id:
        query = query.filter(models.Annonce.gouvernorat_id == gouvernorat_id)
    if prix_min is not None:
        query = query.filter(models.Annonce.prix >= prix_min)
    if prix_max is not None:
        query = query.filter(models.Annonce.prix <= prix_max)

    # Boost d'abord, puis date décroissante
    annonces = query.order_by(
        desc(models.Annonce.boost_level),
        desc(models.Annonce.date_creation)
    ).offset(skip).limit(limit).all()

    result = []
    for a in annonces:
        lat = lng = img = None
        gov = dele = None
        if a.property:
            lat = a.property.latitude
            lng = a.property.longitude
            img = a.property.image_principale
        if a.gouvernorat:
            gov = a.gouvernorat.nom
        if a.delegation:
            dele = a.delegation.nom
        result.append(schemas.AnnoncePublic(
            id=a.id, titre=a.titre, prix=float(a.prix), devise=a.devise.value if hasattr(a.devise, 'value') else a.devise,
            superficie=a.superficie, categorie=a.categorie.value if hasattr(a.categorie, 'value') else a.categorie,
            type_bien=a.type_bien.value if hasattr(a.type_bien, 'value') else a.type_bien,
            boost_level=a.boost_level or 0, views_count=a.views_count or 0,
            date_creation=a.date_creation, latitude=lat, longitude=lng,
            image_principale=img, gouvernorat=gov, delegation=dele,
            nb_pieces=a.nb_pieces, nb_chambres=a.nb_chambres
        ))
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
@router.get("/", response_model=list[schemas.AnnonceRead])
def read_annonces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return crud.get_annonces(db, skip=skip, limit=limit)
    return crud.get_annonces_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

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
        "concierge":"Concierge","cellier":"Cellier","meuble":"Meublé",
        "digicode":"Digicode","interphone":"Interphone","gardien":"Gardien",
        "relie_onas":"Relié ONAS",
    }
    if a.caractere_general:
        for k, label in feat_labels.items():
            if getattr(a.caractere_general, k, False):
                features.append(label)
    ci_labels = {
        "salon_americain":"Salon américain","fibre_optique":"Fibre optique",
        "cheminee":"Cheminée","climatisation":"Climatisation",
        "chauffage_central":"Chauffage central","securite":"Sécurité",
        "double_vitrage":"Double vitrage","porte_blink":"Porte blindée",
    }
    if a.caracteristique_interieure:
        for k, label in ci_labels.items():
            if getattr(a.caracteristique_interieure, k, False):
                features.append(label)
    if a.cuisine_equipee and a.cuisine_equipee.cuisine_equipee:
        features.append("Cuisine équipée")

    # Images (main first, then extras)
    images = []
    if prop:
        if prop.image_principale:
            images.append(prop.image_principale)
        for img in prop.images:
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
        "exclusivite":     a.exclusivite,
        "user": {
            "id":           user.id           if user else None,
            "username":     user.username     if user else None,
            "phone_number": user.phone_number if user else None,
            "email":        user.email        if user else None,
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

    return crud.update_annonce(db, annonce_id, update_data.dict(exclude_unset=True))




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

