from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import base64, uuid, os, secrets
from datetime import datetime, timedelta

from app import schemas, crud, database, models
from app.utils.auth import create_access_token, get_current_user
from app.utils.security import hash_password
from passlib.context import CryptContext
from pydantic import BaseModel

# In-memory token store for password reset (replace with DB in production)
_reset_tokens: dict = {}  # token -> {email, expires}

class UserUpdateBody(BaseModel):
    username: Optional[str] = None
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

get_db = database.get_db
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ===============================
# REGISTER (CREATE USER)
# ===============================
@router.post("/", response_model=schemas.UserRead)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Vérifier email déjà utilisé
    if crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    # Vérifier username déjà utilisé
    existing_username = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris.")

    return crud.create_user(db, user)


# ===============================
# LOGIN
# ===============================
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, form_data.username)

    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "phone_number": user.phone_number,
            "profile_picture": user.profile_picture,
        }
    }


# ===============================
# ME (profil connecté)
# ===============================
@router.get("/me", response_model=schemas.UserRead)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ===============================
# UPDATE ME
# ===============================
@router.put("/me", response_model=schemas.UserRead)
def update_me(
    body: UserUpdateBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    updated = crud.update_user(db, current_user.id, update_data)
    return updated


# ===============================
# UPLOAD PROFILE PICTURE
# ===============================
# ===============================
# FAVORIS
# ===============================
@router.get("/me/favoris")
def get_favoris(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    favoris = db.query(models.Favori).filter(models.Favori.user_id == current_user.id).all()
    result = []
    for f in favoris:
        a = db.query(models.Annonce).filter(models.Annonce.id == f.annonce_id).first()
        if not a:
            continue
        prop = a.property
        gov  = a.gouvernorat.nom if a.gouvernorat else None
        result.append({
            "id":           a.id,
            "titre":        a.titre,
            "prix":         float(a.prix),
            "devise":       a.devise.value    if hasattr(a.devise,    "value") else str(a.devise),
            "gouvernorat":  gov,
            "type_bien":    a.type_bien.value if hasattr(a.type_bien, "value") else str(a.type_bien),
            "categorie":    a.categorie.value if hasattr(a.categorie, "value") else str(a.categorie),
            "status":       a.status.value    if hasattr(a.status,    "value") else str(a.status),
            "image":        prop.image_principale if prop else None,
            "date_creation":a.date_creation.isoformat(),
        })
    return result

@router.post("/me/favoris/{annonce_id}")
def add_favori(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not db.query(models.Annonce).filter(models.Annonce.id == annonce_id).first():
        raise HTTPException(404, "Annonce non trouvée")
    existing = db.query(models.Favori).filter(
        models.Favori.user_id == current_user.id,
        models.Favori.annonce_id == annonce_id
    ).first()
    if existing:
        return {"message": "Déjà en favoris"}
    db.add(models.Favori(user_id=current_user.id, annonce_id=annonce_id))
    db.commit()
    return {"message": "Ajouté aux favoris"}

@router.delete("/me/favoris/{annonce_id}")
def remove_favori(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    f = db.query(models.Favori).filter(
        models.Favori.user_id == current_user.id,
        models.Favori.annonce_id == annonce_id
    ).first()
    if not f:
        raise HTTPException(404, "Favori non trouvé")
    db.delete(f)
    db.commit()
    return {"message": "Retiré des favoris"}


# ===============================
# UPLOAD AVATAR
# ===============================
@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5 MB)")

    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise HTTPException(status_code=400, detail="Format non supporté")

    b64 = base64.b64encode(contents).decode()
    data_url = f"data:image/{ext};base64,{b64}"

    crud.update_user(db, current_user.id, {"profile_picture": data_url})
    return {"profile_picture": data_url}


# ===============================
# FORGOT PASSWORD
# ===============================
@router.post("/forgot-password")
def forgot_password(body: dict, db: Session = Depends(get_db)):
    email = body.get("email", "").strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}

    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        "email": user.email,
        "expires": datetime.utcnow() + timedelta(hours=2),
    }

    # In production: send email. For now: return token in response for demo
    return {
        "message": "Lien de réinitialisation généré.",
        "reset_token": token,  # Remove in production, use email
        "demo_link": f"http://localhost:5173/reset-password?token={token}",
    }


# ===============================
# RESET PASSWORD
# ===============================
@router.post("/reset-password")
def reset_password(body: dict, db: Session = Depends(get_db)):
    token = body.get("token", "")
    new_password = body.get("new_password", "")

    if not token or not new_password:
        raise HTTPException(400, "Token et nouveau mot de passe requis")

    if len(new_password) < 6:
        raise HTTPException(400, "Le mot de passe doit contenir au moins 6 caractères")

    token_data = _reset_tokens.get(token)
    if not token_data:
        raise HTTPException(400, "Token invalide ou expiré")

    if datetime.utcnow() > token_data["expires"]:
        del _reset_tokens[token]
        raise HTTPException(400, "Token expiré. Veuillez refaire la demande.")

    user = db.query(models.User).filter(models.User.email == token_data["email"]).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")

    user.hashed_password = hash_password(new_password)
    db.commit()

    del _reset_tokens[token]
    return {"message": "Mot de passe réinitialisé avec succès"}


# ===============================
# DEMANDES DE CONTACT REÇUES
# ===============================
@router.get("/me/contact-requests")
def get_my_contact_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retourne toutes les demandes de contact pour les annonces anonymes de l'utilisateur."""
    # Récupérer les annonces de l'utilisateur
    annonces = db.query(models.Annonce).filter(
        models.Annonce.utilisateur_id == current_user.id
    ).all()
    annonce_ids = [a.id for a in annonces]
    if not annonce_ids:
        return []

    requests = db.query(models.ContactRequest).filter(
        models.ContactRequest.annonce_id.in_(annonce_ids)
    ).order_by(models.ContactRequest.created_at.desc()).all()

    # Enrichir avec les infos de l'annonce
    annonces_map = {a.id: a for a in annonces}
    return [
        {
            "id":          r.id,
            "annonce_id":  r.annonce_id,
            "annonce_titre": annonces_map.get(r.annonce_id, {}).titre if hasattr(annonces_map.get(r.annonce_id), 'titre') else "",
            "nom":         r.nom,
            "email":       r.email,
            "telephone":   r.telephone,
            "message":     r.message,
            "lu":          r.lu,
            "created_at":  r.created_at.isoformat(),
        }
        for r in requests
    ]


@router.put("/me/contact-requests/{request_id}/lu")
def mark_contact_request_lu(
    request_id: int,
    lu: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Marque une demande comme lue."""
    req = db.query(models.ContactRequest).filter(models.ContactRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Demande non trouvée")
    # Vérifier que c'est bien une annonce de l'utilisateur
    annonce = db.query(models.Annonce).filter(
        models.Annonce.id == req.annonce_id,
        models.Annonce.utilisateur_id == current_user.id
    ).first()
    if not annonce:
        raise HTTPException(403, "Action interdite")
    req.lu = lu
    db.commit()
    return {"detail": "Marqué comme lu" if lu else "Marqué comme non lu"}
