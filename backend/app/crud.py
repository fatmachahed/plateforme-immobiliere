from sqlalchemy.orm import Session
from app import models, schemas
from app.utils.security import hash_password, verify_password



# ===============================
# UTILISATEUR
# ===============================
def create_user(db: Session, user: schemas.UserCreate, verify_token: str = None):
    hashed_pwd = hash_password(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd,
        role=user.role,
        phone_number=user.phone_number,
        nom=getattr(user, "nom", None),
        prenom=getattr(user, "prenom", None),
        profile_picture=user.profile_picture,
        gouvernorat=user.gouvernorat,
        localite=user.localite,
        adresse=getattr(user, "adresse", None),
        matricule_fiscal=getattr(user, "matricule_fiscal", None),
        registre_commerce=getattr(user, "registre_commerce", None),
        secteur_partenaire=getattr(user, "secteur_partenaire", None),
        metier_artisan=getattr(user, "metier_artisan", None),
        objectif=getattr(user, "objectif", None),
        is_verified=False,
        email_verify_token=verify_token,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first() 

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user(db: Session, user_id: int, update_data: dict):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    for key, value in update_data.items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db.delete(db_user)
    db.commit()
    return db_user

from sqlalchemy.orm import Session
from app import models

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# ===============================
# LOCALISATION
# ===============================
# Gouvernorat
def create_gouvernorat(db: Session, name: str):
    db_gouv = models.Gouvernorat(nom=name)
    db.add(db_gouv)
    db.commit()
    db.refresh(db_gouv)
    return db_gouv

def get_gouvernorats(db: Session):
    return db.query(models.Gouvernorat).all()

# Delegation
def create_delegation(db: Session, name: str, gouvernorat_id: int):
    db_del = models.Delegation(nom=name, gouvernorat_id=gouvernorat_id)
    db.add(db_del)
    db.commit()
    db.refresh(db_del)
    return db_del

def get_delegations(db: Session, gouvernorat_id: int = None):
    query = db.query(models.Delegation)
    if gouvernorat_id:
        query = query.filter(models.Delegation.gouvernorat_id == gouvernorat_id)
    return query.all()

# Localite
def create_localite(db: Session, name: str, delegation_id: int):
    db_loc = models.Localite(nom=name, delegation_id=delegation_id)
    db.add(db_loc)
    db.commit()
    db.refresh(db_loc)
    return db_loc

def get_localites(db: Session, delegation_id: int = None):
    query = db.query(models.Localite)
    if delegation_id:
        query = query.filter(models.Localite.delegation_id == delegation_id)
    return query.all()

# ===============================
# ANNONCE
# ===============================
def _extract_caract(data: dict) -> tuple:
    CARACT_GEN = [
        "jardin","terrasse","balcon","parking","garage","ascenseur",
        "vue_mer","vue_montagne","vue_foret","piscine","concierge","cellier",
        "meuble","digicode","interphone","gardien","relie_onas","animaux_admis",
    ]
    CARACT_INT_MAP = {
        "salon_americain":"salon_americain","fibre_optique":"fibre_optique",
        "cheminee":"cheminee","climatisation":"climatisation",
        "chauffage_centrale":"chauffage_central","securite":"securite",
        "double_vitrage":"double_vitrage","porte_blindee":"porte_blink",
        "internet":"internet","tv":"tv",
    }
    cg  = {k: data.pop(k, False) for k in CARACT_GEN}
    ci  = {mv: data.pop(sk, False) for sk, mv in CARACT_INT_MAP.items()}
    ml  = data.pop("machine_laver", False)
    ceq = data.pop("cuisine_equipee", False)
    return cg, ci, ml, ceq


def _safe_set(obj, key, value):
    if hasattr(type(obj), key):
        setattr(obj, key, value)


# Codes gouvernorat → préfixe référence
_GOV_CODES = {
    "Tunis":"TN","Ariana":"AR","Ben Arous":"BA","Manouba":"MB",
    "Nabeul":"NB","Zaghouan":"ZG","Bizerte":"BZ","Béja":"BJ","Beja":"BJ",
    "Jendouba":"JD","Le Kef":"LK","Kef":"LK","Siliana":"SL",
    "Sousse":"SS","Monastir":"MN","Mahdia":"MH","Sfax":"SF",
    "Kairouan":"KR","Kasserine":"KS","Sidi Bouzid":"SB",
    "Gabès":"GB","Gabes":"GB","Médenine":"MD","Medenine":"MD",
    "Tataouine":"TT","Gafsa":"GF","Tozeur":"TZ","Kébili":"KB","Kebili":"KB",
}

def _generate_reference(db, gouvernorat_id: int, utilisateur_id: int = None) -> str:
    """Génère une référence unique basée sur la référence agence (si agence) ou le gouvernorat."""
    prefix = None
    # Priorité 1 : référence de l'agence connectée
    if utilisateur_id:
        agency = db.query(models.Agency).filter(models.Agency.user_id == utilisateur_id).first()
        if agency and agency.reference:
            prefix = agency.reference.upper()
    # Priorité 2 : référence du promoteur
    if not prefix and utilisateur_id:
        user = db.query(models.User).filter(models.User.id == utilisateur_id).first()
        if user and user.promoteur_reference:
            prefix = user.promoteur_reference.upper()
    # Fallback : code gouvernorat
    if not prefix:
        gov = db.query(models.Gouvernorat).filter(models.Gouvernorat.id == gouvernorat_id).first()
        prefix = "TN"
        if gov:
            prefix = _GOV_CODES.get(gov.nom, gov.nom[:2].upper())
    # Numéro séquentiel unique pour ce préfixe
    count = db.query(models.Annonce).filter(
        models.Annonce.reference.like(f"{prefix}%")
    ).count()
    ref = f"{prefix}{str(count + 1).zfill(2)}"
    while db.query(models.Annonce).filter(models.Annonce.reference == ref).first():
        count += 1
        ref = f"{prefix}{str(count + 1).zfill(2)}"
    return ref

def create_annonce(
    db: Session,
    annonce,
    utilisateur_id: int
):
    data = annonce.dict()
    cg, ci, ml, ceq = _extract_caract(data)
    chambres_coloc = data.pop("chambres_coloc", []) or []
    # Convertir genre_coloc (liste) en chaîne CSV pour stockage
    genre_coloc_raw = data.pop("genre_coloc", []) or []
    if isinstance(genre_coloc_raw, list):
        data["genre_coloc"] = ",".join(genre_coloc_raw) if genre_coloc_raw else None
    db_annonce = models.Annonce(**data, utilisateur_id=utilisateur_id)
    db.add(db_annonce)
    db.flush()
    # Générer la référence après flush (on a l'id et le gouvernorat_id)
    if not db_annonce.reference and db_annonce.gouvernorat_id:
        try:
            db_annonce.reference = _generate_reference(db, db_annonce.gouvernorat_id, utilisateur_id)
        except Exception:
            db_annonce.reference = f"AN{str(db_annonce.id).zfill(6)}"
    cg_obj = models.CaractereGeneral(annonce_id=db_annonce.id)
    db.add(cg_obj)
    for k, v in cg.items(): _safe_set(cg_obj, k, v)
    ci_obj = models.CaracteristiqueInterieure(annonce_id=db_annonce.id)
    db.add(ci_obj)
    for k, v in ci.items(): _safe_set(ci_obj, k, v)
    ce_obj = models.CuisineEquipee(annonce_id=db_annonce.id)
    db.add(ce_obj)
    _safe_set(ce_obj, "cuisine_equipee", ceq)
    _safe_set(ce_obj, "machine_laver", ml)
    # Chambres colocation
    for ch in chambres_coloc:
        ch_data = ch if isinstance(ch, dict) else ch.dict()
        db.add(models.ChambreColocation(
            annonce_id=db_annonce.id,
            numero_chambre=ch_data.get("numero_chambre", 0),
            capacite=ch_data.get("capacite", 1),
            places_occupees=ch_data.get("places_occupees", 0),
            prix_par_place=ch_data.get("prix_par_place", 0),
        ))
    db.commit()
    db.refresh(db_annonce)
    return db_annonce
def get_annonces_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Annonce).filter(models.Annonce.utilisateur_id == user_id).offset(skip).limit(limit).all()

def get_annonce(db: Session, annonce_id: int):
    return db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()

def get_annonces(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Annonce).offset(skip).limit(limit).all()

def update_annonce(db: Session, annonce_id: int, update_data: dict):
    db_annonce = get_annonce(db, annonce_id)
    if not db_annonce:
        return None
    cg, ci, ml, ceq = _extract_caract(update_data)
    # Chambres colocation : supprimer les anciennes et recréer
    chambres_coloc = update_data.pop("chambres_coloc", None)
    # genre_coloc : convertir liste → CSV
    genre_coloc_raw = update_data.pop("genre_coloc", None)
    if genre_coloc_raw is not None:
        if isinstance(genre_coloc_raw, list):
            update_data["genre_coloc"] = ",".join(str(g) for g in genre_coloc_raw if g)
        else:
            update_data["genre_coloc"] = genre_coloc_raw
    # Gestion prix barré : si le prix soumis est inférieur au prix actuel,
    # sauvegarder l'actuel dans prix_ancien avant de l'écraser.
    # Si le prix monte ou reste identique, effacer prix_ancien.
    if "prix" in update_data and update_data["prix"] is not None:
        try:
            nouveau = float(update_data["prix"])
            actuel = float(db_annonce.prix) if db_annonce.prix else None
            if actuel is not None and nouveau < actuel:
                db_annonce.prix_ancien = actuel   # on mémorise AVANT d'écraser
            elif actuel is not None and nouveau >= actuel:
                db_annonce.prix_ancien = None     # hausse → on retire le barré
        except (TypeError, ValueError):
            pass
    # Mise à jour champs principaux
    for key, value in update_data.items():
        if hasattr(db_annonce, key):
            setattr(db_annonce, key, value)
    # CaractereGeneral
    cg_obj = db_annonce.caractere_general
    if cg_obj is None:
        cg_obj = models.CaractereGeneral(annonce_id=annonce_id)
        db.add(cg_obj)
    for k, v in cg.items(): _safe_set(cg_obj, k, v)
    # CaracteristiqueInterieure
    ci_obj = db_annonce.caracteristique_interieure
    if ci_obj is None:
        ci_obj = models.CaracteristiqueInterieure(annonce_id=annonce_id)
        db.add(ci_obj)
    for k, v in ci.items(): _safe_set(ci_obj, k, v)
    # CuisineEquipee
    ce_obj = db_annonce.cuisine_equipee
    if ce_obj is None:
        ce_obj = models.CuisineEquipee(annonce_id=annonce_id)
        db.add(ce_obj)
    _safe_set(ce_obj, "cuisine_equipee", ceq)
    _safe_set(ce_obj, "machine_laver", ml)
    # Chambres colocation : remplacer si fournies
    if chambres_coloc is not None:
        db.query(models.ChambreColocation).filter(
            models.ChambreColocation.annonce_id == annonce_id
        ).delete()
        for i, ch in enumerate(chambres_coloc):
            ch_data = ch if isinstance(ch, dict) else ch.dict()
            db.add(models.ChambreColocation(
                annonce_id=annonce_id,
                numero_chambre=ch_data.get("numero_chambre", i + 1),
                capacite=ch_data.get("capacite", 1),
                places_occupees=ch_data.get("places_occupees", 0),
                prix_par_place=ch_data.get("prix_par_place", 0),
            ))
    db.commit()
    db.refresh(db_annonce)
    return db_annonce
def delete_annonce(db: Session, annonce_id: int):
    db_annonce = get_annonce(db, annonce_id)
    if not db_annonce:
        return None
    db.delete(db_annonce)
    db.commit()
    return db_annonce

# ===============================
# CARACTÉRISTIQUES SUPPLÉMENTAIRES
# ===============================
def create_caractere_general(db: Session, caractere_data: dict):
    db_obj = models.CaractereGeneral(**caractere_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_caractere_general(db: Session, annonce_id: int):
    return db.query(models.CaractereGeneral).filter(models.CaractereGeneral.annonce_id == annonce_id).first()

def update_caractere_general(db: Session, annonce_id: int, update_data: dict):
    obj = get_caractere_general(db, annonce_id)
    if not obj:
        return None
    for key, value in update_data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_caractere_general(db: Session, annonce_id: int):
    obj = get_caractere_general(db, annonce_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj

# ===============================
# CARACTÉRISTIQUE INTERIEURE
# ===============================
def create_caracteristique_interieure(db: Session, data: dict):
    db_obj = models.CaracteristiqueInterieure(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_caracteristique_interieure(db: Session, annonce_id: int):
    return db.query(models.CaracteristiqueInterieure).filter(models.CaracteristiqueInterieure.annonce_id == annonce_id).first()

def update_caracteristique_interieure(db: Session, annonce_id: int, update_data: dict):
    obj = get_caracteristique_interieure(db, annonce_id)
    if not obj:
        return None
    for key, value in update_data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_caracteristique_interieure(db: Session, annonce_id: int):
    obj = get_caracteristique_interieure(db, annonce_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj

# ===============================
# CUISINE EQUIPEE
# ===============================
def create_cuisine_equipee(db: Session, data: dict):
    db_obj = models.CuisineEquipee(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_cuisine_equipee(db: Session, annonce_id: int):
    return db.query(models.CuisineEquipee).filter(models.CuisineEquipee.annonce_id == annonce_id).first()

def update_cuisine_equipee(db: Session, annonce_id: int, update_data: dict):
    obj = get_cuisine_equipee(db, annonce_id)
    if not obj:
        return None
    for key, value in update_data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_cuisine_equipee(db: Session, annonce_id: int):
    obj = get_cuisine_equipee(db, annonce_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj

# ===============================
# ETAGE OPTIONS
# ===============================
def create_etage_options(db: Session, data: dict):
    db_obj = models.EtageOptions(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_etage_options(db: Session, annonce_id: int):
    return db.query(models.EtageOptions).filter(models.EtageOptions.annonce_id == annonce_id).first()

def update_etage_options(db: Session, annonce_id: int, update_data: dict):
    obj = get_etage_options(db, annonce_id)
    if not obj:
        return None
    for key, value in update_data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_etage_options(db: Session, annonce_id: int):
    obj = get_etage_options(db, annonce_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj

# ===============================
# PROPERTY
# ===============================
def create_property(db: Session, property: schemas.PropertyCreate):
    db_obj = models.Property(**property.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_property(db: Session, property_id: int):
    return db.query(models.Property).filter(models.Property.id == property_id).first()

def get_properties(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Property).offset(skip).limit(limit).all()

def update_property(db: Session, property_id: int, update_data: dict):
    obj = get_property(db, property_id)
    if not obj:
        return None
    for key, value in update_data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_property(db: Session, property_id: int):
    obj = get_property(db, property_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj

# ===============================
# PROPERTY IMAGE
# ===============================
def create_property_image(db: Session, data: dict):
    db_obj = models.PropertyImage(**data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_property_images(db: Session, property_id: int):
    return db.query(models.PropertyImage).filter(models.PropertyImage.property_id == property_id).all()

def delete_property_image(db: Session, image_id: int):
    db_obj = db.query(models.PropertyImage).filter(models.PropertyImage.id == image_id).first()
    if not db_obj:
        return None
    db.delete(db_obj)
    db.commit()
    return db_obj
