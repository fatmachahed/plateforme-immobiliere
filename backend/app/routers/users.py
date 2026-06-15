from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import base64, uuid, os, secrets, json, re
from datetime import datetime, timedelta

from app import schemas, crud, database, models
from app.utils.auth import create_access_token, get_current_user
from app.utils.security import hash_password
from passlib.context import CryptContext
from pydantic import BaseModel

# In-memory token store for password reset (replace with DB in production)
_reset_tokens: dict = {}  # token -> {email, expires}

# In-memory OTP store for phone change: { user_id: {otp, new_phone, expires} }
_phone_otps: dict = {}

# ── Sécurité 1 : Rate limiting login ─────────────────────────────────────────
# { ip_address: {"count": int, "blocked_until": datetime | None} }
_login_attempts: dict = {}
_MAX_ATTEMPTS   = 5
_BLOCK_MINUTES  = 5

def _check_rate_limit(ip: str):
    """Lève HTTP 429 si l'IP est bloquée. Appelé avant chaque tentative de login."""
    now = datetime.utcnow()
    rec = _login_attempts.get(ip)
    if rec and rec.get("blocked_until") and now < rec["blocked_until"]:
        remaining = int((rec["blocked_until"] - now).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Trop de tentatives. Réessayez dans {remaining} minute(s)."
        )

def _record_failed(ip: str):
    """Incrémente le compteur d'échecs ; bloque l'IP après _MAX_ATTEMPTS."""
    now = datetime.utcnow()
    rec = _login_attempts.setdefault(ip, {"count": 0, "blocked_until": None})
    rec["count"] += 1
    if rec["count"] >= _MAX_ATTEMPTS:
        rec["blocked_until"] = now + timedelta(minutes=_BLOCK_MINUTES)
        rec["count"] = 0  # reset le compteur pour le prochain cycle

def _clear_attempts(ip: str):
    """Réinitialise le compteur après un login réussi."""
    _login_attempts.pop(ip, None)

# ── Sécurité 2 : Validation force du mot de passe ────────────────────────────
_PWD_RULES = [
    (r'.{5,}',        "au moins 5 caractères"),
    (r'[0-9]',        "au moins un chiffre"),
    (r'[A-Z]',        "au moins une majuscule"),
    (r'[a-z]',        "au moins une minuscule"),
    (r'[^a-zA-Z0-9]', "au moins un caractère spécial"),
]

def _validate_password(pwd: str):
    for pattern, msg in _PWD_RULES:
        if not re.search(pattern, pwd):
            raise HTTPException(status_code=400, detail=f"Mot de passe faible : {msg}.")

# ── Sécurité 3 : Email de vérification ───────────────────────────────────────
_FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

def _send_verify_email(email: str, token: str):
    """Envoie le lien de vérification. Silencieux si SMTP non configuré."""
    try:
        from app.email_utils import send_email
        link = f"{_FRONTEND_URL}/verify-email/{token}"
        html = f"""
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
          <div style="background:#6366f1;padding:24px 28px;border-radius:10px 10px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">Confirmez votre adresse email</h2>
          </div>
          <div style="background:#f8fafc;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <p style="margin:0 0 20px">Bienvenue sur <strong>Localizi</strong> ! Cliquez sur le bouton ci-dessous pour activer votre compte.</p>
            <a href="{link}" style="display:inline-block;background:#6366f1;color:#fff;padding:13px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:15px">
              Vérifier mon email
            </a>
            <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
          </div>
        </div>
        """
        send_email(email, "Confirmez votre adresse email — Localizi", html)
    except Exception as e:
        print(f"[VerifyEmail] Erreur envoi : {e}")

class UserUpdateBody(BaseModel):
    username:             Optional[str] = None
    phone_number:         Optional[str] = None
    profile_picture:      Optional[str] = None
    adresse:              Optional[str] = None
    gouvernorat:          Optional[str] = None
    localite:             Optional[str] = None
    matricule_fiscal:     Optional[str] = None
    registre_commerce:    Optional[str] = None
    nom:                  Optional[str] = None
    prenom:               Optional[str] = None
    nom_entreprise:       Optional[str] = None


class CreateAgentBody(BaseModel):
    username:    str
    email:       str
    password:    str
    nom:         Optional[str] = None
    prenom:      Optional[str] = None

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
    existing = crud.get_user_by_email(db, user.email)
    if existing:
        # Si le compte existe mais n'est pas vérifié → renvoyer un nouveau lien
        if existing.is_verified is False:
            new_token = secrets.token_urlsafe(32)
            existing.email_verify_token = new_token
            db.commit()
            _send_verify_email(existing.email, new_token)
            raise HTTPException(
                status_code=400,
                detail="Un compte non vérifié existe déjà avec cet email. Un nouveau lien de vérification vient d'être envoyé."
            )
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    # Vérifier username déjà utilisé
    existing_username = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris.")

    # Sécurité 2 : validation force du mot de passe côté serveur
    _validate_password(user.password)

    # Sécurité 3 : token de vérification email
    verify_token = secrets.token_urlsafe(32)
    new_user = crud.create_user(db, user, verify_token=verify_token)
    _send_verify_email(new_user.email, verify_token)
    return new_user


# ===============================
# VERIFY EMAIL
# ===============================
@router.get("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email_verify_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Lien de vérification invalide ou expiré.")
    user.is_verified = True
    user.email_verify_token = None
    db.commit()
    return {"detail": "Email vérifié avec succès. Vous pouvez maintenant vous connecter."}


# ===============================
# RESEND VERIFY EMAIL
# ===============================
class ResendVerifyBody(BaseModel):
    email: str

@router.post("/resend-verify-email")
def resend_verify_email(body: ResendVerifyBody, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, body.email)
    # Réponse générique pour ne pas révéler si l'email existe
    if not user or user.is_verified:
        return {"detail": "Si cet email est enregistré et non vérifié, un email a été envoyé."}
    new_token = secrets.token_urlsafe(32)
    user.email_verify_token = new_token
    db.commit()
    _send_verify_email(user.email, new_token)
    return {"detail": "Email de vérification renvoyé."}


# ===============================
# LOGIN
# ===============================
@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "unknown"

    # Sécurité 1 : vérifier si l'IP est bloquée
    _check_rate_limit(ip)

    user = crud.get_user_by_email(db, form_data.username)

    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        _record_failed(ip)  # Incrémenter le compteur d'échecs
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    # Sécurité 3 : bloquer si email non vérifié
    if user.is_verified is False:
        raise HTTPException(
            status_code=403,
            detail="Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte mail."
        )

    _clear_attempts(ip)  # Login réussi → reset compteur

    # Mettre à jour last_login
    user.last_login = datetime.utcnow()
    db.commit()

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
# PHONE CHANGE OTP
# ===============================
import random

class PhoneChangeRequest(BaseModel):
    new_phone: str

class PhoneChangeConfirm(BaseModel):
    otp: str

@router.post("/me/request-phone-change")
def request_phone_change(
    body: PhoneChangeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    otp = str(random.randint(100000, 999999))
    _phone_otps[current_user.id] = {
        "otp": otp,
        "new_phone": body.new_phone,
        "expires": datetime.utcnow() + timedelta(minutes=10),
    }
    try:
        from app.email_utils import send_email
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
          <div style="background:#6366f1;padding:22px 28px;border-radius:10px 10px 0 0">
            <h2 style="color:#fff;margin:0;font-size:17px">Vérification de votre nouveau numéro</h2>
          </div>
          <div style="background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <p>Vous avez demandé à associer le numéro <strong>{body.new_phone}</strong> à votre compte Localizi.</p>
            <div style="text-align:center;margin:24px 0">
              <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#4f46e5;background:#eef2ff;padding:16px 28px;border-radius:12px;display:inline-block">{otp}</div>
            </div>
            <p style="font-size:13px;color:#64748b">Ce code expire dans <strong>10 minutes</strong>. Si vous n'avez pas demandé ce changement, ignorez cet email.</p>
          </div>
        </div>
        """
        send_email(current_user.email, f"Code de vérification — {otp} — Localizi", html)
    except Exception as e:
        print(f"[PhoneOTP] Erreur envoi : {e}")
    return {"detail": "Code OTP envoyé à votre adresse email."}

@router.post("/me/confirm-phone-change")
def confirm_phone_change(
    body: PhoneChangeConfirm,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = _phone_otps.get(current_user.id)
    if not record:
        raise HTTPException(status_code=400, detail="Aucune demande de changement en attente.")
    if datetime.utcnow() > record["expires"]:
        _phone_otps.pop(current_user.id, None)
        raise HTTPException(status_code=400, detail="Le code OTP a expiré. Recommencez.")
    if record["otp"] != body.otp.strip():
        raise HTTPException(status_code=400, detail="Code incorrect.")
    updated = crud.update_user(db, current_user.id, {"phone_number": record["new_phone"]})
    _phone_otps.pop(current_user.id, None)
    return updated


# ===============================
# AGENTS DE L'AGENCE
# ===============================
@router.get("/me/agents")
def list_agents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Liste les agents rattachés à l'agence du user connecté."""
    if current_user.role.value not in ("agence",):
        raise HTTPException(403, "Réservé aux comptes Agence")
    agency = db.query(models.Agency).filter(models.Agency.user_id == current_user.id).first()
    if not agency:
        agency = models.Agency(user_id=current_user.id, nom=current_user.username, email=current_user.email or "")
        db.add(agency); db.commit(); db.refresh(agency)
    agents = db.query(models.User).filter(models.User.agence_id == agency.id).all()
    return [
        {
            "id":             a.id,
            "username":       a.username,
            "email":          a.email,
            "nom":            a.nom,
            "prenom":         a.prenom,
            "phone_number":   a.phone_number,
            "profile_picture":a.profile_picture,
            "must_change_password": a.must_change_password,
            "is_blocked":     a.is_blocked,
        }
        for a in agents
    ]


@router.post("/me/agents")
def create_agent(
    body: CreateAgentBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crée un compte Agent rattaché à l'agence du user connecté."""
    if current_user.role.value not in ("agence",):
        raise HTTPException(403, "Réservé aux comptes Agence")
    agency = db.query(models.Agency).filter(models.Agency.user_id == current_user.id).first()
    if not agency:
        agency = models.Agency(user_id=current_user.id, nom=current_user.username, email=current_user.email or "")
        db.add(agency); db.commit(); db.refresh(agency)
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(400, "Cet email est déjà utilisé.")
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(400, "Ce nom d'utilisateur est déjà pris.")

    from app.utils.security import hash_password as hp
    new_agent = models.User(
        username=body.username,
        email=body.email,
        hashed_password=hp(body.password),
        role=models.RoleEnum.agent,
        nom=body.nom or None,
        prenom=body.prenom or None,
        nom_entreprise=current_user.nom_entreprise or agency.nom,
        matricule_fiscal=current_user.matricule_fiscal,
        agence_id=agency.id,
        must_change_password=True,
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    return {
        "id":       new_agent.id,
        "username": new_agent.username,
        "email":    new_agent.email,
        "nom":      new_agent.nom,
        "prenom":   new_agent.prenom,
        "must_change_password": new_agent.must_change_password,
    }


@router.delete("/me/agents/{agent_id}")
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Supprime (ou désactive) un agent de l'agence."""
    if current_user.role.value not in ("agence",):
        raise HTTPException(403, "Réservé aux comptes Agence")
    agency = db.query(models.Agency).filter(models.Agency.user_id == current_user.id).first()
    agent = db.query(models.User).filter(
        models.User.id == agent_id,
        models.User.agence_id == agency.id
    ).first()
    if not agent:
        raise HTTPException(404, "Agent introuvable")
    db.delete(agent)
    db.commit()
    return {"message": "Agent supprimé"}


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


# ===============================
# SAVED SEARCHES (ALERTES)
# ===============================
class SavedSearchBody(BaseModel):
    nom:        Optional[str] = None
    criteres:   dict
    email_alert: bool = True

@router.get("/me/saved-searches")
def get_saved_searches(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    searches = db.query(models.SavedSearch).filter(models.SavedSearch.user_id == current_user.id)\
                 .order_by(models.SavedSearch.created_at.desc()).all()
    return [
        {
            "id":          s.id,
            "nom":         s.nom,
            "criteres":    json.loads(s.criteres) if s.criteres else {},
            "email_alert": s.email_alert,
            "created_at":  s.created_at.isoformat(),
        }
        for s in searches
    ]

@router.post("/me/saved-searches")
def create_saved_search(body: SavedSearchBody, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    s = models.SavedSearch(
        user_id=current_user.id,
        nom=body.nom or "Ma recherche",
        criteres=json.dumps(body.criteres, ensure_ascii=False),
        email_alert=body.email_alert,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id, "detail": "Recherche sauvegardée"}

@router.put("/me/saved-searches/{search_id}")
def update_saved_search(
    search_id: int,
    body: SavedSearchBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    s = db.query(models.SavedSearch).filter(
        models.SavedSearch.id == search_id,
        models.SavedSearch.user_id == current_user.id
    ).first()
    if not s:
        raise HTTPException(404, "Alerte non trouvée")
    if body.nom is not None:
        s.nom = body.nom
    s.criteres   = json.dumps(body.criteres, ensure_ascii=False)
    s.email_alert = body.email_alert
    db.commit()
    db.refresh(s)
    return {"id": s.id, "detail": "Alerte mise à jour"}


@router.patch("/me/saved-searches/{search_id}/toggle")
def toggle_saved_search(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    s = db.query(models.SavedSearch).filter(
        models.SavedSearch.id == search_id,
        models.SavedSearch.user_id == current_user.id
    ).first()
    if not s:
        raise HTTPException(404, "Alerte non trouvée")
    s.email_alert = not s.email_alert
    db.commit()
    return {"id": s.id, "email_alert": s.email_alert}


@router.delete("/me/saved-searches/{search_id}")
def delete_saved_search(search_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    s = db.query(models.SavedSearch).filter(
        models.SavedSearch.id == search_id,
        models.SavedSearch.user_id == current_user.id
    ).first()
    if not s:
        raise HTTPException(404, "Alerte non trouvée")
    db.delete(s)
    db.commit()
    return {"detail": "Alerte supprimée"}


# ===============================
# AGENCES PUBLIQUES
# ===============================
@router.get("/agencies/public")
def list_public_agencies(db: Session = Depends(get_db)):
    """Retourne la liste des agences/agents (role=agence uniquement) avec photo et localisation."""
    from app.enums import RoleEnum
    result = []
    seen_ids = set()

    # 1. Agences créées par l'admin (table Agency) — utilisateur associé doit avoir role agence
    agencies = db.query(models.Agency).filter(models.Agency.abonnement_actif == True).all()
    for ag in agencies:
        user = db.query(models.User).filter(models.User.id == ag.user_id).first()
        if not user:
            continue
        role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
        if role_val != "agence":
            continue
        seen_ids.add(user.id)
        result.append({
            "id":              user.id,
            "nom":             ag.nom,
            "email":           ag.email or user.email,
            "telephone":       ag.telephone or user.phone_number,
            "profile_picture": user.profile_picture,
            "gouvernorat":     user.gouvernorat,
            "localite":        user.localite,
        })

    # 2. Utilisateurs inscrits avec role agence (non déjà listés)
    agences = db.query(models.User).filter(
        models.User.role == RoleEnum.agence
    ).all()
    for u in agences:
        if u.id in seen_ids:
            continue
        result.append({
            "id":              u.id,
            "nom":             u.username,
            "email":           u.email,
            "telephone":       u.phone_number,
            "profile_picture": u.profile_picture,
            "gouvernorat":     u.gouvernorat,
            "localite":        u.localite,
        })

    return result


@router.get("/{user_id}/public-profile")
def get_agent_public_profile(user_id: int, db: Session = Depends(get_db)):
    """Retourne le profil public d'un agent/agence avec ses annonces approuvées."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")

    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    agency = db.query(models.Agency).filter(models.Agency.user_id == user_id).first()
    nom       = agency.nom       if agency else user.username
    email     = agency.email     if agency else user.email
    telephone = agency.telephone if agency else user.phone_number

    annonces_q = db.query(models.Annonce).filter(
        models.Annonce.utilisateur_id == user_id,
        models.Annonce.status == "approuvee",
        models.Annonce.anonyme == False,
    ).order_by(models.Annonce.date_creation.desc()).all()

    annonces_list = []
    for a in annonces_q:
        prop = a.property
        gov  = a.gouvernorat.nom if a.gouvernorat else None
        del_ = a.delegation.nom  if a.delegation  else None
        annonces_list.append({
            "id":            a.id,
            "titre":         a.titre,
            "prix":          float(a.prix) if a.prix else 0,
            "devise":        a.devise.value    if hasattr(a.devise,    "value") else str(a.devise),
            "categorie":     a.categorie.value if hasattr(a.categorie, "value") else str(a.categorie),
            "type_bien":     a.type_bien.value if hasattr(a.type_bien, "value") else str(a.type_bien),
            "superficie":    float(a.superficie) if a.superficie else None,
            "nb_pieces":     a.nb_pieces,
            "nb_chambres":   a.nb_chambres,
            "gouvernorat":   gov,
            "delegation":    del_,
            "image":         prop.image_principale if prop else None,
            "date_creation": a.date_creation.isoformat(),
            "views_count":   a.views_count or 0,
        })

    return {
        "id":              user.id,
        "nom":             nom,
        "email":           email,
        "telephone":       telephone,
        "profile_picture": user.profile_picture,
        "gouvernorat":     user.gouvernorat,
        "localite":        user.localite,
        "adresse":         getattr(user, "adresse", None),
        "role":            role_val,
        "annonces":        annonces_list,
        "nb_annonces":     len(annonces_list),
    }

