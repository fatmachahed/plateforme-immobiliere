# app/utils/auth.py
# backend/app/utils/auth.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import models
from app.database import get_db
from app.utils.security import verify_password
from app.config import SECRET_KEY  # import depuis config.py

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h (was 7 days — reduced for security)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  # endpoint FastAPI pour login

def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Authentification utilisateur
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

# Récupérer l'utilisateur actuel via token
from jose.exceptions import ExpiredSignatureError

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Impossible de valider les informations d'identification",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = payload.get("sub")
        if sub is None:
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except JWTError:
        raise credentials_exception
    # sub can be either the user ID (int as string) or email — handle both
    try:
        user = db.query(models.User).filter(models.User.id == int(sub)).first()
    except (ValueError, TypeError):
        user = db.query(models.User).filter(models.User.email == sub).first()
    if user is None:
        raise credentials_exception
    return user

optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

def get_current_user_optional(token: str = Depends(optional_oauth2_scheme), db: Session = Depends(get_db)):
    """Comme get_current_user, mais renvoie None (au lieu de lever 401) si aucun
    token n'est fourni ou s'il est invalide — pour les endpoints publics qui se
    comportent différemment (ex. rattacher un compte) quand l'utilisateur est connecté."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            return None
    except (JWTError, ExpiredSignatureError):
        return None
    try:
        user = db.query(models.User).filter(models.User.id == int(sub)).first()
    except (ValueError, TypeError):
        user = db.query(models.User).filter(models.User.email == sub).first()
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    role_val = current_user.role.value if hasattr(current_user.role, "value") else current_user.role
    if role_val != "admin":
        raise HTTPException(status_code=403, detail="Action réservée aux administrateurs")
    return current_user