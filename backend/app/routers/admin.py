from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from passlib.context import CryptContext
from app import models, database
from app.utils.auth import get_current_admin
from app.enums import RoleEnum
from app.email_utils import notify_saved_searches_for_annonce, send_email, LOGO_IMG_HTML
import json as _json, os as _os, re as _re

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)

router = APIRouter(prefix="/admin", tags=["Admin"])
get_db = database.get_db


def _make_agency_reference(db: Session, nom: str) -> str:
    """Référence courte à 3 lettres (ex. AGC), dérivée du nom de l'agence.
    Sert de préfixe pour la référence des annonces (AGC + numéro séquentiel,
    ex. AGC01) — elle ne doit donc contenir aucun chiffre."""
    letters = _re.sub(r"[^A-Za-z]", "", nom or "").upper()
    base = (letters[:3] or "AGC").ljust(3, "X")
    candidate = base
    idx = 1
    while db.query(models.Agency).filter(models.Agency.reference == candidate).first():
        candidate = (base[:2] + chr(ord("A") + (idx - 1) % 26))
        idx += 1
        if idx > 26:
            candidate = base  # cas extrême, laissé à corriger manuellement par l'admin
            break
    return candidate


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
            "reference":    a.reference,
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
            "image_principale": prop.image_principale if prop else None,
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
            "commercial_id":  a.commercial_id,
            "commercial_nom": (lambda c: (f"{c.prenom or ''} {c.nom or ''}".strip() or c.username) if c else None)(
                db.query(models.User).filter(models.User.id == a.commercial_id).first() if a.commercial_id else None
            ),
        })
    return result


# ── Corriger la référence d'une annonce ─────────────────────
class AnnonceReferenceUpdate(BaseModel):
    reference: str

@router.patch("/annonces/{annonce_id}/reference")
def update_annonce_reference(
    annonce_id: int,
    body: AnnonceReferenceUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    a = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not a:
        raise HTTPException(404, "Annonce non trouvée")
    ref = _re.sub(r"[^A-Za-z0-9]", "", body.reference).upper()
    if not ref:
        raise HTTPException(400, "La référence ne peut pas être vide.")
    conflict = db.query(models.Annonce).filter(models.Annonce.reference == ref, models.Annonce.id != annonce_id).first()
    if conflict:
        raise HTTPException(400, f"La référence '{ref}' est déjà utilisée par une autre annonce.")
    a.reference = ref
    db.commit()
    db.refresh(a)
    return {"id": a.id, "reference": a.reference}


# ── Affecter/modifier le manager commercial d'une annonce ───
class AnnonceCommercialUpdate(BaseModel):
    commercial_id: Optional[int] = None

@router.patch("/annonces/{annonce_id}/commercial")
def update_annonce_commercial(
    annonce_id: int,
    body: AnnonceCommercialUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    a = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not a:
        raise HTTPException(404, "Annonce non trouvée")
    if body.commercial_id:
        commercial = db.query(models.User).filter(
            models.User.id == body.commercial_id,
            models.User.role == models.RoleEnum.manager_commercial,
        ).first()
        if not commercial:
            raise HTTPException(400, "Manager commercial invalide.")
    a.commercial_id = body.commercial_id
    db.commit()
    db.refresh(a)
    commercial_nom = None
    if a.commercial_id:
        c = db.query(models.User).filter(models.User.id == a.commercial_id).first()
        commercial_nom = f"{c.prenom or ''} {c.nom or ''}".strip() or c.username if c else None
    return {"id": a.id, "commercial_id": a.commercial_id, "commercial_nom": commercial_nom}


# ── Réaffecter le propriétaire d'une annonce ─────────────────
class AnnonceOwnerUpdate(BaseModel):
    utilisateur_id: int

@router.patch("/annonces/{annonce_id}/owner")
def update_annonce_owner(
    annonce_id: int,
    body: AnnonceOwnerUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    a = db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first()
    if not a:
        raise HTTPException(404, "Annonce non trouvée")
    new_owner = db.query(models.User).filter(models.User.id == body.utilisateur_id).first()
    if not new_owner:
        raise HTTPException(400, "Utilisateur introuvable.")
    a.utilisateur_id = new_owner.id
    db.commit()
    db.refresh(a)
    return {"id": a.id, "utilisateur_id": a.utilisateur_id, "user_name": new_owner.username, "user_email": new_owner.email}


# ── Changer le statut d'une annonce ─────────────────────────
class StatusUpdate(BaseModel):
    status:   str
    message:  Optional[str] = None
    raisons:  Optional[list] = None   # list of refusal reason strings

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
    if body.status == "approuvee":
        has_image = bool(a.property and (a.property.image_principale or (a.property.images and len(a.property.images) > 0)))
        if not has_image:
            raise HTTPException(400, "Impossible d'approuver une annonce sans aucune photo.")
    was_approved = (a.status.value if hasattr(a.status, "value") else a.status) == "approuvee"
    a.status = body.status
    if body.status == "refusee":
        a.refus_raisons = _json.dumps(body.raisons or [], ensure_ascii=False)
        a.refus_message = body.message or ""
    db.commit()
    db.refresh(a)
    if body.status == "approuvee" and not was_approved:
        try:
            notify_saved_searches_for_annonce(db, a)
        except Exception:
            pass
        try:
            from app.push_utils import send_push_to_user
            send_push_to_user(db, a.utilisateur_id, "Annonce approuvée ✅",
                               f"Votre annonce « {a.titre} » est maintenant en ligne.", "/compte?tab=annonces&statut=approuvee")
        except Exception:
            pass
    if body.status == "refusee":
        try:
            from app.push_utils import send_push_to_user
            send_push_to_user(db, a.utilisateur_id, "Annonce refusée",
                               f"Votre annonce « {a.titre} » n'a pas été approuvée. Consultez les raisons.", "/compte?tab=annonces")
        except Exception:
            pass
        try:
            owner = db.query(models.User).filter(models.User.id == a.utilisateur_id).first()
            if owner and owner.email:
                raisons = body.raisons or []
                frontend = _os.environ.get("FRONTEND_URL", "")
                raisons_html = "".join(f"<li>{r}</li>" for r in raisons) if raisons else ""
                msg_html = f"<p style='margin-top:8px;color:#374151'>{body.message}</p>" if body.message else ""
                html = f"""
                <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#f8fafc;padding:24px">
                  <div style="text-align:center;padding:16px 0 20px">
                    {LOGO_IMG_HTML}
                  </div>
                  <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
                    <h2 style="color:#dc2626;margin:0 0 16px;font-size:20px">Annonce refusée</h2>
                    <p style="margin:0 0 8px">Bonjour <strong>{owner.username or ''}</strong>,</p>
                    <p style="margin:0 0 16px;color:#374151">Votre annonce <strong>« {a.titre} »</strong> a été refusée par notre équipe de modération.</p>
                    {"<p style='font-weight:700;margin:0 0 8px;color:#0f172a'>Raison(s) du refus :</p><ul style='margin:0 0 16px;padding-left:20px;color:#374151;line-height:1.8'>" + raisons_html + "</ul>" if raisons_html else ""}
                    {msg_html}
                    <p style="margin:16px 0;color:#6b7280;font-size:13px">
                      Vous pouvez modifier votre annonce et la resoumettre pour validation.
                    </p>
                    <a href="{frontend}/modifier_annonce/{a.id}"
                       style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
                              text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                      Modifier mon annonce
                    </a>
                  </div>
                  <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:16px">© Localizi.tn</p>
                </div>"""
                send_email(owner.email, f"Votre annonce « {a.titre} » a été refusée", html)
        except Exception as _e:
            import traceback; traceback.print_exc()
            print(f"[REFUS EMAIL ERROR] {_e}")
    return {"id": a.id, "status": body.status}


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


# ── Détail complet d'un utilisateur (vue admin en lecture seule) ─────
@router.get("/users/{user_id}/detail")
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(404, "Utilisateur non trouvé")

    annonces = db.query(models.Annonce).filter(models.Annonce.utilisateur_id == u.id).order_by(desc(models.Annonce.date_creation)).all()
    annonces_list = [{
        "id": a.id,
        "reference": a.reference,
        "titre": a.titre,
        "categorie": a.categorie.value if hasattr(a.categorie, "value") else str(a.categorie),
        "type_bien": a.type_bien.value if hasattr(a.type_bien, "value") else str(a.type_bien),
        "status": a.status.value if hasattr(a.status, "value") else str(a.status),
        "prix": float(a.prix) if a.prix else 0,
        "devise": a.devise.value if hasattr(a.devise, "value") else str(a.devise),
        "gouvernorat": a.gouvernorat.nom if a.gouvernorat else None,
        "views_count": a.views_count or 0,
        "date_creation": a.date_creation.isoformat() if a.date_creation else None,
    } for a in annonces]

    agence = None
    if u.agence_id:
        ag = db.query(models.Agency).filter(models.Agency.id == u.agence_id).first()
        if ag:
            agence = {"id": ag.id, "nom": ag.nom}

    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "phone_number": u.phone_number,
        "role": u.role.value if hasattr(u.role, "value") else str(u.role),
        "nom": u.nom,
        "prenom": u.prenom,
        "nom_entreprise": u.nom_entreprise,
        "agence": agence,
        "profile_picture": u.profile_picture,
        "gouvernorat": u.gouvernorat,
        "localite": u.localite,
        "adresse": u.adresse,
        "matricule_fiscal": u.matricule_fiscal,
        "registre_commerce": u.registre_commerce,
        "is_blocked": bool(u.is_blocked),
        "is_verified": bool(u.is_verified),
        "secteur_partenaire": u.secteur_partenaire,
        "metier_artisan": u.metier_artisan,
        "note_prestataire": u.note_prestataire,
        "nombre_avis": u.nombre_avis,
        "nombre_interventions": u.nombre_interventions,
        "profil_particulier": u.profil_particulier,
        "sexe": u.sexe,
        "objectif": u.objectif,
        "promoteur_reference": u.promoteur_reference,
        "last_login": u.last_login.isoformat() if u.last_login else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "updated_at": u.updated_at.isoformat() if u.updated_at else None,
        "annonces": annonces_list,
        "stats": {
            "total": len(annonces_list),
            "approuvees": sum(1 for a in annonces_list if a["status"] == "approuvee"),
            "en_attente": sum(1 for a in annonces_list if a["status"] == "en_attente"),
            "refusees": sum(1 for a in annonces_list if a["status"] == "refusee"),
            "vues": sum(a["views_count"] for a in annonces_list),
        },
    }


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
            "id":           u.id,
            "username":     u.username,
            "email":        u.email,
            "phone_number": u.phone_number,
            "role":       u.role.value if hasattr(u.role, "value") else str(u.role),
            "is_blocked": bool(u.is_blocked),
            "is_verified": bool(u.is_verified),
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "updated_at": u.updated_at.isoformat() if u.updated_at else None,
            "note_prestataire":     getattr(u, "note_prestataire", None),
            "nombre_interventions": getattr(u, "nombre_interventions", None) or 0,
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
    phone_number: Optional[str] = None
    role:     Optional[str] = None
    note_prestataire:     Optional[float] = None
    nombre_interventions: Optional[int]   = None

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
    if body.phone_number is not None: u.phone_number = body.phone_number
    if body.role:
        try:
            u.role = RoleEnum(body.role)
        except ValueError:
            raise HTTPException(400, f"Rôle invalide : {body.role}")
    if body.note_prestataire is not None:
        u.note_prestataire = body.note_prestataire
    if body.nombre_interventions is not None:
        u.nombre_interventions = body.nombre_interventions
    db.commit()
    db.refresh(u)
    return {"id": u.id, "username": u.username, "email": u.email, "phone_number": u.phone_number, "role": u.role.value if hasattr(u.role,"value") else str(u.role)}


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
    reference: Optional[str] = None


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

    # Référence courte à 3 lettres (ex. AGC), dérivée du nom — pas de chiffres,
    # pour que la référence des annonces reste "AGC01" et non "AGC000101".
    agency.reference = _make_agency_reference(db, agency.nom)
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
    if body.reference is not None:
        ref = _re.sub(r"[^A-Za-z]", "", body.reference).upper()
        if not ref:
            raise HTTPException(400, "La référence doit contenir au moins une lettre.")
        existing = db.query(models.Agency).filter(models.Agency.reference == ref, models.Agency.id != agency_id).first()
        if existing:
            raise HTTPException(400, f"La référence '{ref}' est déjà utilisée par une autre agence.")
        ag.reference = ref
    db.commit()
    db.refresh(ag)
    return {
        "id":               ag.id,
        "abonnement_actif": ag.abonnement_actif,
        "note_admin":       ag.note_admin,
        "frais_mensuel":    ag.frais_mensuel,
        "reference":        ag.reference,
    }


# ── Conventions ─────────────────────────────────────────────
import json as _json

@router.get("/conventions")
def list_conventions(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    rows = db.query(models.ConventionSubmission).order_by(
        models.ConventionSubmission.submitted_at.desc()
    ).all()
    result = []
    for r in rows:
        u = r.user
        try:
            data = _json.loads(r.form_data or "{}")
        except Exception:
            data = {}
        result.append({
            "id":           r.id,
            "type":         r.type,
            "status":       r.status,
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
            "updated_at":   r.updated_at.isoformat()   if r.updated_at   else None,
            "user": {
                "id":           u.id,
                "username":     u.username,
                "email":        u.email,
                "nom":          u.nom,
                "prenom":       u.prenom,
                "nom_entreprise": u.nom_entreprise,
                "phone_number": u.phone_number,
            },
            "form_data": data,
        })
    return result


class ConventionStatusBody(BaseModel):
    status: str  # soumis / accepte / refuse


_DEFAULT_PLANS_CONFIG = {
    "particulier": {"gratuit": True, "essentiel": True, "investisseur": True},
    "agent":       {"gratuit": True, "starter": True, "pro": True, "expert": True},
    "agence":      {"gratuit": True, "start": True, "pro": True, "power": True},
    "promoteur":   {"gratuit-promo": True, "basic": True, "standard": True, "premium": True},
    "partenaire":  {"smart": True, "bronze": True, "silver": True, "gold": True},
}

@router.get("/plans-config")
def get_plans_config(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    row = db.execute(text("SELECT value FROM settings WHERE key = 'plans_config'")).fetchone()
    if not row:
        return _DEFAULT_PLANS_CONFIG
    return _json.loads(row[0])

@router.put("/plans-config")
def update_plans_config(
    config: dict,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    existing = db.execute(text("SELECT key FROM settings WHERE key = 'plans_config'")).fetchone()
    if existing:
        db.execute(text("UPDATE settings SET value = :v WHERE key = 'plans_config'"), {"v": _json.dumps(config)})
    else:
        db.execute(text("INSERT INTO settings (key, value) VALUES ('plans_config', :v)"), {"v": _json.dumps(config)})
    db.commit()
    return {"ok": True}


# ── Feature flags (activation globale de fonctionnalités) ──────
# Stockées en base (table settings) au lieu du localStorage : sinon chaque
# navigateur/appareil garde sa propre valeur et un admin qui désactive une
# fonctionnalité sur PC ne voit pas le changement sur mobile (et vice versa).
_DEFAULT_FEATURE_FLAGS = {
    "poi_enabled": True,
    "boost_enabled": True,
    # Si False (par défaut) : tous les biens sont affichés sur la carte quel que soit
    # le nombre d'annonces — utile au lancement, quand le volume est encore faible.
    # Si True : la carte n'affiche des points qu'après sélection d'un gouvernorat,
    # ce qui limite la charge une fois que le nombre d'annonces devient important.
    "require_region_to_show_map_pins": False,
}

@router.get("/feature-flags")
def get_feature_flags(db: Session = Depends(get_db)):
    """Lecture publique — utilisée par toutes les pages (carte, navbar, etc.)."""
    row = db.execute(text("SELECT value FROM settings WHERE key = 'feature_flags'")).fetchone()
    if not row:
        return _DEFAULT_FEATURE_FLAGS
    return {**_DEFAULT_FEATURE_FLAGS, **_json.loads(row[0])}

@router.put("/feature-flags")
def update_feature_flags(
    flags: dict,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    current_row = db.execute(text("SELECT value FROM settings WHERE key = 'feature_flags'")).fetchone()
    current = _json.loads(current_row[0]) if current_row else dict(_DEFAULT_FEATURE_FLAGS)
    current.update(flags)
    if current_row:
        db.execute(text("UPDATE settings SET value = :v WHERE key = 'feature_flags'"), {"v": _json.dumps(current)})
    else:
        db.execute(text("INSERT INTO settings (key, value) VALUES ('feature_flags', :v)"), {"v": _json.dumps(current)})
    db.commit()
    return current


@router.patch("/conventions/{convention_id}/status")
def update_convention_status(
    convention_id: int,
    body: ConventionStatusBody,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_admin),
):
    row = db.query(models.ConventionSubmission).filter(
        models.ConventionSubmission.id == convention_id
    ).first()
    if not row:
        raise HTTPException(404, "Convention introuvable")
    if body.status not in ("soumis", "accepte", "refuse"):
        raise HTTPException(400, "Statut invalide")
    row.status = body.status
    db.commit()
    return {"id": row.id, "status": row.status}

