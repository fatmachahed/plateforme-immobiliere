from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
import base64, uuid, os, secrets, json, re, asyncio, io
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy import text

_bcrypt_executor = ThreadPoolExecutor(max_workers=8)

# ── Helpers tokens reset (stockés en DB pour compatibilité multi-workers) ──
def _save_reset_token(db, token: str, email: str, expires: datetime):
    payload = json.dumps({"email": email, "expires": expires.isoformat()})
    key = f"reset_token:{token}"
    existing = db.execute(text("SELECT key FROM settings WHERE key=:k"), {"k": key}).fetchone()
    if existing:
        db.execute(text("UPDATE settings SET value=:v WHERE key=:k"), {"v": payload, "k": key})
    else:
        db.execute(text("INSERT INTO settings (key,value) VALUES (:k,:v)"), {"k": key, "v": payload})
    db.commit()

def _get_reset_token(db, token: str):
    key = f"reset_token:{token}"
    row = db.execute(text("SELECT value FROM settings WHERE key=:k"), {"k": key}).fetchone()
    if not row:
        return None
    return json.loads(row[0])

def _delete_reset_token(db, token: str):
    key = f"reset_token:{token}"
    db.execute(text("DELETE FROM settings WHERE key=:k"), {"k": key})
    db.commit()

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
    metier_artisan:       Optional[str] = None
    profil_particulier:   Optional[str] = None
    sexe:                 Optional[str] = None
    objectif:             Optional[str] = None


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
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)


# ===============================
# NOTIFICATIONS PUSH (PWA)
# ===============================
@router.get("/push/vapid-public-key")
def get_vapid_public_key():
    """Clé publique VAPID — utilisée par le navigateur pour créer l'abonnement push."""
    from app.push_utils import VAPID_PUBLIC_KEY
    return {"key": VAPID_PUBLIC_KEY}


class PushSubscriptionBody(BaseModel):
    endpoint: str
    keys: dict  # { "p256dh": "...", "auth": "..." }

@router.post("/me/push-subscription")
def save_push_subscription(
    body: PushSubscriptionBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Enregistre (ou met à jour) l'abonnement push de cet appareil/navigateur."""
    p256dh = body.keys.get("p256dh")
    auth = body.keys.get("auth")
    if not p256dh or not auth:
        raise HTTPException(400, "Clés d'abonnement invalides.")
    existing = db.query(models.PushSubscription).filter(models.PushSubscription.endpoint == body.endpoint).first()
    if existing:
        existing.user_id = current_user.id
        existing.p256dh = p256dh
        existing.auth = auth
    else:
        db.add(models.PushSubscription(user_id=current_user.id, endpoint=body.endpoint, p256dh=p256dh, auth=auth))
    db.commit()
    return {"ok": True}

@router.delete("/me/push-subscription")
def delete_push_subscription(
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    endpoint = body.get("endpoint")
    if endpoint:
        db.query(models.PushSubscription).filter(
            models.PushSubscription.endpoint == endpoint,
            models.PushSubscription.user_id == current_user.id,
        ).delete()
        db.commit()
    return {"ok": True}


# ===============================
# NUMÉROS DE TÉLÉPHONE SUPPLÉMENTAIRES
# (en plus de users.phone_number, le numéro principal historique —
# l'ajout se fait via /me/phone-numbers/request-otp puis /confirm-otp,
# voir plus bas, la vérification par email étant obligatoire)
# ===============================
@router.get("/me/phone-numbers")
def list_phone_numbers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rows = db.query(models.UserPhoneNumber).filter(
        models.UserPhoneNumber.user_id == current_user.id
    ).order_by(models.UserPhoneNumber.id).all()
    return [{"id": r.id, "numero": r.numero} for r in rows]

@router.delete("/me/phone-numbers/{phone_id}")
def delete_phone_number(
    phone_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    row = db.query(models.UserPhoneNumber).filter(
        models.UserPhoneNumber.id == phone_id,
        models.UserPhoneNumber.user_id == current_user.id,
    ).first()
    if not row:
        raise HTTPException(404, "Numéro introuvable.")
    db.delete(row)
    db.commit()
    return {"ok": True}


# ===============================
# TABLEAU DE BORD STATISTIQUES (agences)
# ===============================
def _parse_stats_dates(date_from: Optional[str], date_to: Optional[str]):
    d_from = None
    d_to = None
    try:
        if date_from: d_from = datetime.fromisoformat(date_from)
    except ValueError: pass
    try:
        if date_to: d_to = datetime.fromisoformat(date_to) + timedelta(days=1)  # inclusif
    except ValueError: pass
    return d_from, d_to

@router.get("/me/agency-stats")
def get_agency_stats(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Statistiques du tableau de bord agence : totaux, contacts par canal,
    et contacts par type de bien (empilé par catégorie vente/location/vacances)."""
    d_from, d_to = _parse_stats_dates(date_from, date_to)

    annonces_q = db.query(models.Annonce).filter(models.Annonce.utilisateur_id == current_user.id)
    nb_annonces = annonces_q.filter(models.Annonce.status == "approuvee").count()
    nb_vues = db.query(func.coalesce(func.sum(models.Annonce.views_count), 0)).filter(
        models.Annonce.utilisateur_id == current_user.id
    ).scalar() or 0

    clicks_q = (
        db.query(models.ContactClick)
        .join(models.Annonce, models.Annonce.id == models.ContactClick.annonce_id)
        .filter(models.Annonce.utilisateur_id == current_user.id)
    )
    if d_from: clicks_q = clicks_q.filter(models.ContactClick.created_at >= d_from)
    if d_to:   clicks_q = clicks_q.filter(models.ContactClick.created_at < d_to)

    par_canal = {"telephone": 0, "whatsapp": 0, "email": 0}
    for canal, count in (
        clicks_q.with_entities(models.ContactClick.canal, func.count(models.ContactClick.id))
        .group_by(models.ContactClick.canal).all()
    ):
        if canal in par_canal: par_canal[canal] = count
    nb_contacts = sum(par_canal.values())
    taux_conversion = round((nb_contacts / nb_vues) * 100, 1) if nb_vues > 0 else 0.0

    # Contacts par type de bien, empilé par catégorie (vente/location/vacances)
    type_rows = (
        db.query(
            models.Annonce.type_bien,
            models.Annonce.categorie,
            func.count(models.ContactClick.id).label("count"),
        )
        .join(models.ContactClick, models.ContactClick.annonce_id == models.Annonce.id)
        .filter(models.Annonce.utilisateur_id == current_user.id)
    )
    if d_from: type_rows = type_rows.filter(models.ContactClick.created_at >= d_from)
    if d_to:   type_rows = type_rows.filter(models.ContactClick.created_at < d_to)
    type_rows = type_rows.group_by(models.Annonce.type_bien, models.Annonce.categorie).all()

    par_type = {}
    for type_bien, categorie, count in type_rows:
        tb = type_bien.value if hasattr(type_bien, "value") else str(type_bien)
        cat = categorie.value if hasattr(categorie, "value") else str(categorie)
        par_type.setdefault(tb, {"vente": 0, "location": 0, "vacances": 0})
        if cat in par_type[tb]: par_type[tb][cat] = count

    return {
        "nb_annonces": nb_annonces,
        "nb_vues": int(nb_vues),
        "nb_contacts": nb_contacts,
        "taux_conversion": taux_conversion,
        "contacts_par_canal": par_canal,
        "contacts_par_type": [{"type_bien": tb, **counts} for tb, counts in par_type.items()],
    }


@router.get("/me/agency-stats/geo")
def get_agency_stats_geo(
    level: str = "gouvernorat",  # gouvernorat | delegation | localite
    parent_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Contacts groupés par zone géographique, pour le graphe avec exploration
    (gouvernorat -> délégation -> localité)."""
    if level not in ("gouvernorat", "delegation", "localite"):
        raise HTTPException(400, "level invalide")
    d_from, d_to = _parse_stats_dates(date_from, date_to)

    if level == "gouvernorat":
        geo_model, geo_id_col, geo_nom = models.Gouvernorat, models.Annonce.gouvernorat_id, models.Gouvernorat.nom
    elif level == "delegation":
        geo_model, geo_id_col, geo_nom = models.Delegation, models.Annonce.delegation_id, models.Delegation.nom
    else:
        geo_model, geo_id_col, geo_nom = models.Localite, models.Annonce.localite_id, models.Localite.nom

    q = (
        db.query(geo_id_col.label("zone_id"), geo_nom.label("nom"), func.count(models.ContactClick.id).label("count"))
        .join(models.ContactClick, models.ContactClick.annonce_id == models.Annonce.id)
        .join(geo_model, geo_model.id == geo_id_col)
        .filter(models.Annonce.utilisateur_id == current_user.id)
    )
    if level == "delegation":
        q = q.filter(models.Annonce.gouvernorat_id == parent_id)
    elif level == "localite":
        q = q.filter(models.Annonce.delegation_id == parent_id)
    if d_from: q = q.filter(models.ContactClick.created_at >= d_from)
    if d_to:   q = q.filter(models.ContactClick.created_at < d_to)
    q = q.group_by(geo_id_col, geo_nom).order_by(func.count(models.ContactClick.id).desc())

    return [{"id": r.zone_id, "nom": r.nom, "count": r.count} for r in q.all()]


# ===============================
# CHECK USERNAME AVAILABILITY
# ===============================
@router.get("/check-username")
def check_username(username: str, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(models.User.username == username).first()
    return {"available": exists is None}


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
def resend_verify_email(body: ResendVerifyBody, request: Request, db: Session = Depends(get_db)):
    _check_rate_limit(request.client.host if request.client else "unknown")
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
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "unknown"

    # Sécurité 1 : vérifier si l'IP est bloquée
    _check_rate_limit(ip)

    user = crud.get_user_by_email(db, form_data.username)

    if not user:
        _record_failed(ip)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    # Vérification bcrypt dans un thread dédié (non-bloquant pour les autres workers)
    loop = asyncio.get_event_loop()
    password_ok = await loop.run_in_executor(
        _bcrypt_executor,
        lambda: pwd_context.verify(form_data.password, user.hashed_password)
    )

    if not password_ok:
        _record_failed(ip)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect.")

    # Sécurité 3 : bloquer si email non vérifié
    if user.is_verified is False:
        raise HTTPException(
            status_code=403,
            detail="Veuillez vérifier votre email avant de vous connecter. Consultez votre boîte mail."
        )

    _clear_attempts(ip)  # Login réussi → reset compteur

    # Rehash si le hash n'est pas déjà en rounds=10 → migrer automatiquement
    if not user.hashed_password.startswith("$2b$10$"):
        new_hash = await loop.run_in_executor(
            _bcrypt_executor,
            lambda: pwd_context.hash(form_data.password[:72])
        )
        user.hashed_password = new_hash

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
# AGENCY REFERENCE
# ===============================

class AgencyReferenceBody(BaseModel):
    reference: str

@router.get("/agency/check-reference")
def check_agency_reference(
    ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Agency).filter(models.Agency.reference == ref).first()
    if existing is None:
        return {"available": True}
    # available if it belongs to the current user's own agency
    own = db.query(models.Agency).filter(models.Agency.user_id == current_user.id).first()
    return {"available": own is not None and own.id == existing.id}


@router.put("/agency/reference")
def update_agency_reference(
    body: AgencyReferenceBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.value != "agence":
        raise HTTPException(status_code=403, detail="Réservé aux comptes Agence")
    agency = db.query(models.Agency).filter(models.Agency.user_id == current_user.id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agence non trouvée")
    # Check uniqueness (exclude own agency)
    conflict = db.query(models.Agency).filter(
        models.Agency.reference == body.reference,
        models.Agency.id != agency.id
    ).first()
    if not re.fullmatch(r"[A-Za-zÀ-ÖØ-öø-ÿ]{3}", body.reference):
        raise HTTPException(status_code=422, detail="La référence doit contenir exactement 3 lettres")
    if conflict:
        raise HTTPException(status_code=400, detail="Cette référence est déjà utilisée par une autre agence")
    agency.reference = body.reference
    db.commit()
    db.refresh(agency)
    return {"reference": agency.reference}


class PromoteurReferenceBody(BaseModel):
    reference: str

@router.get("/promoteur/check-reference")
def check_promoteur_reference(
    ref: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.User).filter(models.User.promoteur_reference == ref).first()
    if existing is None:
        return {"available": True}
    return {"available": existing.id == current_user.id}


@router.put("/promoteur/reference")
def update_promoteur_reference(
    body: PromoteurReferenceBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.value != "promoteur":
        raise HTTPException(status_code=403, detail="Réservé aux comptes Promoteur")
    if not re.fullmatch(r"[A-Za-zÀ-ÖØ-öø-ÿ]{3}", body.reference):
        raise HTTPException(status_code=422, detail="La référence doit contenir exactement 3 lettres")
    conflict = db.query(models.User).filter(
        models.User.promoteur_reference == body.reference,
        models.User.id != current_user.id
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="Cette référence est déjà utilisée par un autre promoteur")
    current_user.promoteur_reference = body.reference
    db.commit()
    db.refresh(current_user)
    return {"reference": current_user.promoteur_reference}


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
# NUMÉROS SUPPLÉMENTAIRES — OTP OBLIGATOIRE
# (même mécanisme que le changement de numéro principal ci-dessus)
# ===============================
_extra_phone_otps: dict = {}

class ExtraPhoneOtpRequest(BaseModel):
    numero: str

@router.post("/me/phone-numbers/request-otp")
def request_extra_phone_otp(
    body: ExtraPhoneOtpRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    numero = (body.numero or "").strip()
    if not numero:
        raise HTTPException(400, "Numéro invalide.")
    otp = str(random.randint(100000, 999999))
    _extra_phone_otps[current_user.id] = {
        "otp": otp,
        "numero": numero,
        "expires": datetime.utcnow() + timedelta(minutes=10),
    }
    try:
        from app.email_utils import send_email
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#0f172a">
          <div style="background:#6366f1;padding:22px 28px;border-radius:10px 10px 0 0">
            <h2 style="color:#fff;margin:0;font-size:17px">Vérification de votre numéro</h2>
          </div>
          <div style="background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <p>Vous avez demandé à ajouter le numéro <strong>{numero}</strong> à votre compte Localizi.</p>
            <div style="text-align:center;margin:24px 0">
              <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#4f46e5;background:#eef2ff;padding:16px 28px;border-radius:12px;display:inline-block">{otp}</div>
            </div>
            <p style="font-size:13px;color:#64748b">Ce code expire dans <strong>10 minutes</strong>. Si vous n'avez pas demandé cet ajout, ignorez cet email.</p>
          </div>
        </div>
        """
        send_email(current_user.email, f"Code de vérification — {otp} — Localizi", html)
    except Exception as e:
        print(f"[ExtraPhoneOTP] Erreur envoi : {e}")
    return {"detail": "Code OTP envoyé à votre adresse email."}

@router.post("/me/phone-numbers/confirm-otp")
def confirm_extra_phone_otp(
    body: PhoneChangeConfirm,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    record = _extra_phone_otps.get(current_user.id)
    if not record:
        raise HTTPException(400, "Aucune demande d'ajout en attente.")
    if datetime.utcnow() > record["expires"]:
        _extra_phone_otps.pop(current_user.id, None)
        raise HTTPException(400, "Le code OTP a expiré. Recommencez.")
    if record["otp"] != body.otp.strip():
        raise HTTPException(400, "Code incorrect.")
    row = models.UserPhoneNumber(user_id=current_user.id, numero=record["numero"])
    db.add(row)
    db.commit()
    db.refresh(row)
    _extra_phone_otps.pop(current_user.id, None)
    return {"id": row.id, "numero": row.numero}


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


class UpdateAgentBody(BaseModel):
    email:  Optional[str] = None
    nom:    Optional[str] = None
    prenom: Optional[str] = None


@router.patch("/me/agents/{agent_id}")
def update_agent(
    agent_id: int,
    body: UpdateAgentBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Modifie les informations d'un agent de l'agence."""
    if current_user.role.value not in ("agence",):
        raise HTTPException(403, "Réservé aux comptes Agence")
    agency = db.query(models.Agency).filter(models.Agency.user_id == current_user.id).first()
    if not agency:
        raise HTTPException(404, "Agence introuvable")
    agent = db.query(models.User).filter(
        models.User.id == agent_id,
        models.User.agence_id == agency.id
    ).first()
    if not agent:
        raise HTTPException(404, "Agent introuvable")
    if body.email is not None:
        existing = db.query(models.User).filter(models.User.email == body.email, models.User.id != agent_id).first()
        if existing:
            raise HTTPException(400, "Cet email est déjà utilisé.")
        agent.email = body.email
    if body.nom    is not None: agent.nom    = body.nom
    if body.prenom is not None: agent.prenom = body.prenom
    db.commit(); db.refresh(agent)
    return {"id": agent.id, "username": agent.username, "email": agent.email,
            "nom": agent.nom, "prenom": agent.prenom, "must_change_password": agent.must_change_password}


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
# CONVENTION SOUMISSION
# ===============================
import json as _json

class ConventionSubmitBody(BaseModel):
    type:      str              # "agence" | "promoteur"
    form_data: Optional[dict] = None

@router.post("/me/convention")
def submit_convention(
    body: ConventionSubmitBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crée ou met à jour la demande de convention de l'utilisateur."""
    existing = db.query(models.ConventionSubmission).filter(
        models.ConventionSubmission.user_id == current_user.id,
        models.ConventionSubmission.type == body.type
    ).first()
    data_str = _json.dumps(body.form_data or {}, ensure_ascii=False)
    if existing:
        existing.status = "soumis"
        existing.form_data = data_str
        existing.submitted_at = datetime.utcnow()
    else:
        sub = models.ConventionSubmission(
            user_id=current_user.id,
            type=body.type,
            status="soumis",
            form_data=data_str,
        )
        db.add(sub)
    db.commit()
    return {"message": "Convention soumise"}


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

    # Stockage sur disque (comme les images d'annonces) plutôt qu'en base64 dans la BDD.
    # L'avatar est compressé/redimensionné en WebP puis servi via une URL /uploads/…,
    # ce qui rend les réponses de login légères et l'affichage instantané + mis en cache.
    avatar_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    try:
        from app.utils.image_processing import compress_image
        buffer = compress_image(io.BytesIO(contents), max_width=400, quality=80)
        data = buffer.getvalue()
        out_ext = "jpg"
    except Exception:
        data = contents
        out_ext = ext
    filename = f"{uuid.uuid4()}.{out_ext}"
    with open(os.path.join(avatar_dir, filename), "wb") as f:
        f.write(data)
    url = f"/uploads/avatars/{filename}"

    crud.update_user(db, current_user.id, {"profile_picture": url})
    return {"profile_picture": url}


# ===============================
# FORGOT PASSWORD
# ===============================
@router.post("/forgot-password")
def forgot_password(body: dict, request: Request, db: Session = Depends(get_db)):
    _check_rate_limit(request.client.host if request.client else "unknown")
    email = body.get("email", "").strip().lower()
    user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Aucun compte n'est associé à cet email.")

    token = secrets.token_urlsafe(32)
    _save_reset_token(db, token, user.email, datetime.utcnow() + timedelta(hours=2))
    link = f"{_FRONTEND_URL}/reset-password?token={token}"

    # Envoi par email (silencieux si SMTP non configuré)
    try:
        from app.email_utils import send_email
        html = f"""
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
          <div style="background:#6366f1;padding:24px 28px;border-radius:10px 10px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">Réinitialisation de mot de passe</h2>
          </div>
          <div style="background:#f8fafc;padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.</p>
            <a href="{link}" style="display:inline-block;background:#6366f1;color:#fff;padding:13px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:15px">
              Réinitialiser mon mot de passe
            </a>
            <p style="margin:20px 0 0;font-size:12px;color:#94a3b8">Ce lien expire dans 2 heures. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          </div>
        </div>"""
        send_email(user.email, "Réinitialisation de votre mot de passe — Localizi", html)
    except Exception:
        pass

    return {"message": "Un lien de réinitialisation a été envoyé à votre adresse email.", "reset_link": link}


# ===============================
# RESET PASSWORD
# ===============================
@router.post("/reset-password")
def reset_password(body: dict, db: Session = Depends(get_db)):
    token = body.get("token", "")
    new_password = body.get("new_password", "")

    if not token or not new_password:
        raise HTTPException(400, "Token et nouveau mot de passe requis")

    _validate_password(new_password)

    token_data = _get_reset_token(db, token)
    if not token_data:
        raise HTTPException(400, "Token invalide ou expiré")

    if datetime.utcnow() > datetime.fromisoformat(token_data["expires"]):
        _delete_reset_token(db, token)
        raise HTTPException(400, "Token expiré. Veuillez refaire la demande.")

    user = db.query(models.User).filter(models.User.email == token_data["email"]).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")

    user.hashed_password = hash_password(new_password)
    db.commit()

    _delete_reset_token(db, token)
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


# ===============================
# PROMOTEURS PUBLICS
# ===============================
@router.get("/promoteurs/public")
def list_public_promoteurs(db: Session = Depends(get_db)):
    """Retourne la liste des promoteurs immobiliers (role=promoteur) avec photo et localisation."""
    from app.enums import RoleEnum
    promoteurs = db.query(models.User).filter(
        models.User.role == RoleEnum.promoteur
    ).all()
    result = []
    for u in promoteurs:
        result.append({
            "id":              u.id,
            "nom":             u.nom_entreprise or u.username,
            "email":           u.email,
            "telephone":       u.phone_number,
            "profile_picture": u.profile_picture,
            "gouvernorat":     u.gouvernorat,
            "localite":        u.localite,
        })
    return result


# ===============================
# AGENTS PUBLICS
# ===============================
@router.get("/agents/public")
def list_public_agents(db: Session = Depends(get_db)):
    """Retourne la liste des agents immobiliers (role=agent) avec photo et localisation."""
    from app.enums import RoleEnum
    agents = db.query(models.User).filter(
        models.User.role == RoleEnum.agent
    ).all()
    result = []
    for u in agents:
        result.append({
            "id":              u.id,
            "nom":             u.nom or u.username,
            "email":           u.email,
            "telephone":       u.phone_number,
            "profile_picture": u.profile_picture,
            "gouvernorat":     u.gouvernorat,
            "localite":        u.localite,
            "type":            "agent",
        })
    return result


# ===============================
# PARTENAIRES PUBLICS
# ===============================
@router.get("/partenaires/public")
def list_public_partenaires(db: Session = Depends(get_db)):
    """Retourne la liste des partenaires (artisans, banques, notaires…) avec photo et localisation."""
    from app.enums import RoleEnum
    partenaires = db.query(models.User).filter(
        models.User.role == RoleEnum.partenaire
    ).all()
    result = []
    for u in partenaires:
        result.append({
            "id":               u.id,
            "nom":              u.nom_entreprise or u.nom or u.username,
            "email":            u.email,
            "telephone":        u.phone_number,
            "profile_picture":  u.profile_picture,
            "gouvernorat":      u.gouvernorat,
            "localite":         u.localite,
            "secteur":          u.secteur_partenaire,
            "metier_artisan":   u.metier_artisan,
            "note":                getattr(u, "note_prestataire", None),
            "nombre_interventions": getattr(u, "nombre_interventions", None) or 0,
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
            "etat_bien":     a.etat_bien.value  if hasattr(a.etat_bien,  "value") else a.etat_bien,
            "duree_type":    a.duree_type,
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
        "adresse":            getattr(user, "adresse", None),
        "role":               role_val,
        "secteur_partenaire": getattr(user, "secteur_partenaire", None),
        "metier_artisan":     getattr(user, "metier_artisan", None),
        "nom_civil":          getattr(user, "nom", None),
        "prenom":             getattr(user, "prenom", None),
        "note":                 getattr(user, "note_prestataire", None),
        "nombre_interventions": getattr(user, "nombre_interventions", None) or 0,
        "annonces":           annonces_list,
        "nb_annonces":        len(annonces_list),
    }



# ===============================
# DEMANDES D'INTERVENTION (prestataires / partenaires)
# ===============================
@router.post("/interventions")
def create_intervention(body: dict, db: Session = Depends(get_db)):
    """Un client envoie une demande d'intervention à un prestataire."""
    prestataire_id = body.get("prestataire_id")
    presta = db.query(models.User).filter(models.User.id == prestataire_id).first()
    if not presta:
        raise HTTPException(404, "Prestataire introuvable.")
    nom = (body.get("client_nom") or "").strip()
    tel = (body.get("client_telephone") or "").strip()
    if not nom:
        raise HTTPException(400, "Votre nom est requis.")
    if not tel and not (body.get("client_email") or "").strip():
        raise HTTPException(400, "Un téléphone ou un email est requis pour vous recontacter.")
    d = models.DemandeIntervention(
        prestataire_id   = prestataire_id,
        client_user_id   = body.get("client_user_id"),
        client_nom       = nom,
        client_email     = (body.get("client_email") or "").strip() or None,
        client_telephone = tel or None,
        message          = (body.get("message") or "").strip() or None,
        status           = "en_attente",
    )
    db.add(d)
    db.commit()
    try:
        from app.push_utils import send_push_to_user
        send_push_to_user(db, prestataire_id, "Nouvelle demande d'intervention",
                           f"{nom} souhaite faire appel à vos services.", "/compte?tab=interventions")
    except Exception:
        pass
    return {"message": "Votre demande a été envoyée au prestataire. Il vous recontactera avec vos coordonnées."}


@router.get("/interventions/mine")
def my_interventions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Le prestataire connecté récupère ses demandes d'intervention reçues."""
    demandes = db.query(models.DemandeIntervention).filter(
        models.DemandeIntervention.prestataire_id == current_user.id
    ).order_by(models.DemandeIntervention.created_at.desc()).all()
    return [{
        "id":               d.id,
        "client_nom":       d.client_nom,
        "client_email":     d.client_email,
        "client_telephone": d.client_telephone,
        "message":          d.message,
        "status":           d.status,
        "created_at":       d.created_at.isoformat() if d.created_at else None,
    } for d in demandes]


@router.patch("/interventions/{demande_id}/status")
def update_intervention_status(
    demande_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Le prestataire marque une demande comme réalisée / en attente.
    Le nombre d'interventions est incrémenté/décrémenté automatiquement."""
    d = db.query(models.DemandeIntervention).filter(
        models.DemandeIntervention.id == demande_id
    ).first()
    if not d:
        raise HTTPException(404, "Demande introuvable.")
    if d.prestataire_id != current_user.id:
        raise HTTPException(403, "Action non autorisée.")
    new_status = body.get("status")
    if new_status not in ("en_attente", "realisee"):
        raise HTTPException(400, "Statut invalide.")
    old = d.status
    if old != new_status:
        if new_status == "realisee" and old != "realisee":
            current_user.nombre_interventions = (current_user.nombre_interventions or 0) + 1
        elif new_status == "en_attente" and old == "realisee":
            current_user.nombre_interventions = max(0, (current_user.nombre_interventions or 0) - 1)
        d.status = new_status
        db.commit()
    return {
        "id": d.id,
        "status": d.status,
        "nombre_interventions": current_user.nombre_interventions or 0,
    }


@router.delete("/interventions/{demande_id}")
def delete_intervention(
    demande_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Le prestataire supprime définitivement une demande (erreur, plus intéressé, etc.).
    Si la demande avait déjà été marquée réalisée, on décrémente le compteur et on supprime
    l'avis client associé s'il existe, pour garder les statistiques cohérentes."""
    d = db.query(models.DemandeIntervention).filter(
        models.DemandeIntervention.id == demande_id
    ).first()
    if not d:
        raise HTTPException(404, "Demande introuvable.")
    if d.prestataire_id != current_user.id:
        raise HTTPException(403, "Action non autorisée.")

    if d.status == "realisee":
        current_user.nombre_interventions = max(0, (current_user.nombre_interventions or 0) - 1)
        reaction = db.query(models.PrestataireReaction).filter(
            models.PrestataireReaction.demande_id == demande_id
        ).first()
        if reaction:
            db.delete(reaction)
            from sqlalchemy import func
            stats = db.query(
                func.avg(models.PrestataireReaction.note).label("avg"),
                func.count(models.PrestataireReaction.id).label("cnt")
            ).filter(models.PrestataireReaction.prestataire_id == current_user.id,
                      models.PrestataireReaction.id != reaction.id).first()
            current_user.note_prestataire = round(float(stats.avg), 2) if stats.avg else None
            current_user.nombre_avis = stats.cnt or 0

    db.delete(d)
    db.commit()
    return {"message": "Demande supprimée.", "nombre_interventions": current_user.nombre_interventions or 0}


# ===============================
# NOTATION DES SERVICES REÇUS (client ayant bénéficié d'une intervention réalisée)
# ===============================
@router.get("/interventions/to-rate")
def interventions_to_rate(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Liste des interventions réalisées, bénéficiées par l'utilisateur connecté,
    et pas encore notées."""
    deja_notees = {
        r.demande_id for r in db.query(models.PrestataireReaction.demande_id).filter(
            models.PrestataireReaction.client_user_id == current_user.id
        ).all()
    }
    demandes = db.query(models.DemandeIntervention).filter(
        models.DemandeIntervention.client_user_id == current_user.id,
        models.DemandeIntervention.status == "realisee",
    ).order_by(models.DemandeIntervention.created_at.desc()).all()

    result = []
    for d in demandes:
        if d.id in deja_notees:
            continue
        presta = d.prestataire
        if not presta:
            continue
        result.append({
            "id":               d.id,
            "prestataire_id":   presta.id,
            "prestataire_nom":  presta.nom_entreprise or presta.nom or presta.username,
            "prestataire_prenom": presta.prenom,
            "role_label":       presta.metier_artisan or ({
                "banques":"votre conseiller bancaire", "assurances":"votre assureur",
                "notaires_avocats":"votre notaire/avocat", "architectes":"votre architecte",
                "artisans":"votre artisan",
            }.get(presta.secteur_partenaire, "ce prestataire")),
            "created_at":       d.created_at.isoformat() if d.created_at else None,
        })
    return result


@router.post("/interventions/{demande_id}/rate")
def rate_intervention(
    demande_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Le client note le service reçu (1 à 5). Recalcule la moyenne du prestataire
    exactement comme pour les notes d'annonces (AVG/COUNT sur les avis)."""
    note = body.get("note")
    if note not in (1, 2, 3, 4, 5):
        raise HTTPException(400, "Note invalide (1 à 5 attendu).")

    d = db.query(models.DemandeIntervention).filter(
        models.DemandeIntervention.id == demande_id
    ).first()
    if not d:
        raise HTTPException(404, "Demande introuvable.")
    if d.client_user_id != current_user.id:
        raise HTTPException(403, "Action non autorisée.")
    if d.status != "realisee":
        raise HTTPException(400, "Cette intervention n'est pas encore marquée comme réalisée.")

    presta = db.query(models.User).filter(models.User.id == d.prestataire_id).first()
    if not presta:
        raise HTTPException(404, "Prestataire introuvable.")

    existing = db.query(models.PrestataireReaction).filter(
        models.PrestataireReaction.demande_id == demande_id
    ).first()
    if existing:
        existing.note = note
    else:
        db.add(models.PrestataireReaction(
            prestataire_id = presta.id,
            demande_id     = demande_id,
            client_user_id = current_user.id,
            note           = note,
        ))
    db.flush()

    from sqlalchemy import func
    stats = db.query(
        func.avg(models.PrestataireReaction.note).label("avg"),
        func.count(models.PrestataireReaction.id).label("cnt")
    ).filter(models.PrestataireReaction.prestataire_id == presta.id).first()
    presta.note_prestataire = round(float(stats.avg), 2) if stats.avg else None
    presta.nombre_avis      = stats.cnt or 0
    db.commit()

    return {"message": "Merci pour votre avis !", "note_prestataire": presta.note_prestataire, "nombre_avis": presta.nombre_avis}
