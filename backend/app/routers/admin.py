from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from passlib.context import CryptContext
from app import models, database
from app.utils.auth import get_current_admin
from app.enums import RoleEnum
from app.email_utils import notify_saved_searches_for_annonce

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(prefix="/admin", tags=["Admin"])
get_db = database.get_db


# ── Stats globales ──────────────────────────────────────────
@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    total_annonces  = db.query(func.count(models.Annonce.id)).scalar() or 0
    approuvees      = db.query(func.count(models.Annonce.id)).filter(models.Annonce.status == "approuvee").scalar() or 0
    en_attente      = db.query(func.count(models.Annonce.id)).filter(models.Annonce.status == "en_attente").scalar() or 0
    refusees        = db.query(func.count(models.Annonce.id)).filter(models.Annonce.status == "refusee").scalar() or 0
    total_users     = db.query(func.count(models.User.id)).scalar() or 0

    # Par type de bien
    by_type = db.query(models.Annonce.type_bien, func.count(models.Annonce.id))\
        .group_by(models.Annonce.type_bien).all()

    # Par catégorie
    by_cat = db.query(models.Annonce.categorie, func.count(models.Annonce.id))\
        .group_by(models.Annonce.categorie).all()

    # Top gouvernorats
    top_gov = db.query(models.Gouvernorat.nom, func.count(models.Annonce.id))\
        .join(models.Annonce, models.Annonce.gouvernorat_id == models.Gouvernorat.id)\
        .group_by(models.Gouvernorat.nom)\
        .order_by(desc(func.count(models.Annonce.id)))\
        .limit(5).all()

    return {
        "total_annonces": total_annonces,
        "approuvees":     approuvees,
        "en_attente":     en_attente,
        "refusees":       refusees,
        "total_users":    total_users,
        "by_type":        [{"type": t, "count": c} for t, c in by_type],
        "by_categorie":   [{"categorie": cat, "count": c} for cat, c in by_cat],
        "top_gouvernorats": [{"nom": n, "count": c} for n, c in top_gov],
    }


# ── Liste toutes les annonces (avec info user) ───────────────
@router.get("/annonces")
def list_annonces(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    q = db.query(models.Annonce)
    if status:
        q = q.filter(models.Annonce.status == status)
    q = q.order_by(desc(models.Annonce.date_creation))
    annonces = q.offset(skip).limit(limit).all()

    result = []
    for a in annonces:
        user = db.query(models.User).filter(models.User.id == a.utilisateur_id).first()
        gov  = a.gouvernorat.nom if a.gouvernorat else None
        del_ = a.delegation.nom  if a.delegation  else None
        loc_ = a.localite.nom    if a.localite    else None
        prop = a.property
        result.append({
            "id":           a.id,
            "titre":        a.titre,
            "categorie":    a.categorie.value if hasattr(a.categorie, "value") else str(a.categorie),
            "type_bien":    a.type_bien.value  if hasattr(a.type_bien,  "value") else str(a.type_bien),
            "status":       a.status.value     if hasattr(a.status,     "value") else str(a.status),
            "prix":         float(a.prix) if a.prix else 0,
            "superficie":   float(a.superficie) if a.superficie else None,
            "devise":       a.devise.value     if hasattr(a.devise,     "value") else str(a.devise),
            "gouvernorat":  gov,
            "delegation":   del_,
            "localite":     loc_,
            "date_creation":a.date_creation.isoformat(),
            "utilisateur_id": a.utilisateur_id,
            "user_name":    user.username if user else None,
            "user_email":   user.email    if user else None,
            "latitude":     prop.latitude  if prop else None,
            "longitude":    prop.longitude if prop else None,
            "address":      prop.address   if prop else None,
            "boost_level":    a.boost_level or 0,
            "views_count":    a.views_count  or 0,
            "description":    a.description,
            "accompagnement": a.accompagnement or False,
            "anonyme":        a.anonyme or False,
            "accompagnement_agence_id":  a.accompagnement_agence_id,
            "accompagnement_agence_nom": (
                db.query(models.User.username).filter(models.User.id == a.accompagnement_agence_id).scalar()
                if a.accompagnement_agence_id else None
            ),
        })
    return result


# ── Changer le statut d'une annonce ─────────────────────────
class StatusUpdate(BaseModel):
    status:  str
    message: Optional[str] = None

@router.put("/annonces/{annonce_id}/status")
def update_annonce_status(
    annonce_id: int,
    body: StatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    if body.status not in ("approuvee", "refusee", "en_attente"):
        raise HTTPException(400, "Statut invalide")
    a = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not a:
        raise HTTPException(404, "Annonce non trouvée")
    was_approved = (a.status.value if hasattr(a.status, "value") else a.status) == "approuvee"
    a.status = body.status
    db.commit()
    db.refresh(a)
    if body.status == "approuvee" and not was_approved:
        try:
            notify_saved_searches_for_annonce(db, a)
        except Exception:
            pass
    return {"id": a.id, "status": body.status, "message": body.message}


# ── Supprimer une annonce (admin) ────────────────────────────
@router.delete("/annonces/{annonce_id}")
def admin_delete_annonce(
    annonce_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    a = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not a:
        raise HTTPException(404, "Annonce non trouvée")
    db.delete(a)
    db.commit()
    return {"detail": "Annonce supprimée"}


# ── Liste des utilisateurs ───────────────────────────────────
@router.get("/users")
def list_users(
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return [
        {
            "id":         u.id,
            "username":   u.username,
            "email":      u.email,
            "role":       u.role.value if hasattr(u.role, "value") else str(u.role),
            "is_blocked": bool(u.is_blocked),
            "nb_annonces": db.query(func.count(models.Annonce.id))
                            .filter(models.Annonce.utilisateur_id == u.id).scalar() or 0,
        }
        for u in users
    ]


# ── Bloquer / débloquer un utilisateur ──────────────────────
@router.put("/users/{user_id}/block")
def toggle_block_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "Utilisateur non trouvé")
    if u.id == admin.id:
        raise HTTPException(400, "Impossible de bloquer votre propre compte")
    u.is_blocked = not bool(u.is_blocked)
    db.commit()
    return {"id": u.id, "is_blocked": u.is_blocked}


# ── Modifier un utilisateur ──────────────────────────────────
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email:    Optional[str] = None
    role:     Optional[str] = None

@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "Utilisateur non trouvé")
    if body.username:  u.username = body.username
    if body.email:     u.email    = body.email
    if body.role:
        try:
            u.role = RoleEnum(body.role)
        except ValueError:
            raise HTTPException(400, f"Rôle invalide : {body.role}")
    db.commit()
    db.refresh(u)
    return {"id": u.id, "username": u.username, "email": u.email, "role": u.role.value if hasattr(u.role,"value") else str(u.role)}


# ── Supprimer un utilisateur ─────────────────────────────────
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "Utilisateur non trouvé")
    if u.id == admin.id:
        raise HTTPException(400, "Impossible de supprimer votre propre compte")
    db.delete(u)
    db.commit()
    return {"detail": "Utilisateur supprimé"}


# ── Pydantic models for agencies ────────────────────────────
class AgencyCreate(BaseModel):
    nom: str
    email: str
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    matricule: Optional[str] = None
    frais_mensuel: float = 50.0
    username: str
    password: str
    role: Optional[str] = "agence"


class AgencyUpdate(BaseModel):
    abonnement_actif: Optional[bool] = None
    note_admin: Optional[str] = None
    frais_mensuel: Optional[float] = None
    abonnement_expire_at: Optional[str] = None


# ── GET /admin/agencies ─────────────────────────────────────
@router.get("/agencies")
def list_agencies(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    agencies = db.query(models.Agency).order_by(desc(models.Agency.created_at)).all()
    result = []
    for ag in agencies:
        user = db.query(models.User).filter(models.User.id == ag.user_id).first()
        nb_annonces = (
            db.query(func.count(models.Annonce.id))
            .filter(models.Annonce.utilisateur_id == ag.user_id)
            .scalar() or 0
        )
        result.append({
            "id":                  ag.id,
            "user_id":             ag.user_id,
            "nom":                 ag.nom,
            "email":               ag.email,
            "telephone":           ag.telephone,
            "adresse":             ag.adresse,
            "matricule":           ag.matricule,
            "reference":           ag.reference,
            "frais_mensuel":       ag.frais_mensuel,
            "abonnement_actif":    ag.abonnement_actif,
            "abonnement_expire_at": ag.abonnement_expire_at.isoformat() if ag.abonnement_expire_at else None,
            "note_admin":          ag.note_admin,
            "created_at":          ag.created_at.isoformat() if ag.created_at else None,
            "username":            user.username if user else None,
            "nb_annonces":         nb_annonces,
        })
    return result


# ── POST /admin/agencies ─────────────────────────────────────
@router.post("/agencies")
def create_agency(
    body: AgencyCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(400, f"Le nom d'utilisateur '{body.username}' est déjà utilisé.")
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(400, f"L'email '{body.email}' est déjà utilisé.")

    user = models.User(
        username=body.username,
        email=body.email,
        hashed_password=_pwd.hash(body.password),
        role=RoleEnum.agence,
        phone_number=body.telephone,
    )
    db.add(user)
    db.flush()

    agency = models.Agency(
        user_id=user.id,
        nom=body.nom,
        email=body.email,
        telephone=body.telephone,
        adresse=body.adresse,
        matricule=body.matricule,
        frais_mensuel=body.frais_mensuel,
        abonnement_actif=True,
    )
    db.add(agency)
    db.commit()
    db.refresh(agency)

    # Générer la référence unique basée sur l'ID
    agency.reference = f"AGC{str(agency.id).zfill(4)}"
    db.commit()
    db.refresh(agency)

    return {
        "id":               agency.id,
        "user_id":          user.id,
        "nom":              agency.nom,
        "email":            agency.email,
        "telephone":        agency.telephone,
        "matricule":        agency.matricule,
        "reference":        agency.reference,
        "frais_mensuel":    agency.frais_mensuel,
        "abonnement_actif": True,
        "note_admin":       None,
        "created_at":       agency.created_at.isoformat() if agency.created_at else None,
        "username":         user.username,
        "nb_annonces":      0,
    }


# ── PATCH /admin/agencies/{id} ──────────────────────────────
@router.patch("/agencies/{agency_id}")
def update_agency(
    agency_id: int,
    body: AgencyUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    ag = db.query(models.Agency).filter(models.Agency.id == agency_id).first()
    if not ag:
        raise HTTPException(404, "Agence non trouvée")
    if body.abonnement_actif is not None:
        ag.abonnement_actif = body.abonnement_actif
    if body.note_admin is not None:
        ag.note_admin = body.note_admin
    if body.frais_mensuel is not None:
        ag.frais_mensuel = body.frais_mensuel
    if body.abonnement_expire_at is not None:
        try:
            ag.abonnement_expire_at = datetime.fromisoformat(body.abonnement_expire_at)
        except Exception:
            pass
    db.commit()
    db.refresh(ag)
    return {
        "id":               ag.id,
        "abonnement_actif": ag.abonnement_actif,
        "note_admin":       ag.note_admin,
        "frais_mensuel":    ag.frais_mensuel,
    }
