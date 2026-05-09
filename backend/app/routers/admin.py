from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from pydantic import BaseModel
from app import models, database
from app.utils.auth import get_current_admin

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
        prop = a.property
        result.append({
            "id":           a.id,
            "titre":        a.titre,
            "categorie":    a.categorie.value if hasattr(a.categorie, "value") else str(a.categorie),
            "type_bien":    a.type_bien.value  if hasattr(a.type_bien,  "value") else str(a.type_bien),
            "status":       a.status.value     if hasattr(a.status,     "value") else str(a.status),
            "prix":         float(a.prix),
            "devise":       a.devise.value     if hasattr(a.devise,     "value") else str(a.devise),
            "gouvernorat":  gov,
            "date_creation":a.date_creation.isoformat(),
            "utilisateur_id": a.utilisateur_id,
            "user_name":    user.username if user else None,
            "user_email":   user.email    if user else None,
            "latitude":     prop.latitude  if prop else None,
            "longitude":    prop.longitude if prop else None,
            "address":      prop.address   if prop else None,
            "boost_level":  a.boost_level or 0,
            "views_count":  a.views_count  or 0,
            "description":  a.description,
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
    a.status = body.status
    db.commit()
    db.refresh(a)
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
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return [
        {
            "id":       u.id,
            "username": u.username,
            "email":    u.email,
            "role":     u.role.value if hasattr(u.role, "value") else str(u.role),
            "nb_annonces": db.query(func.count(models.Annonce.id))
                            .filter(models.Annonce.utilisateur_id == u.id).scalar() or 0,
        }
        for u in users
    ]
