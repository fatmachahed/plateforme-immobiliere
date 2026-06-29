from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import urllib.request
import urllib.parse
import json
import secrets
import string

from app import models, database
from app.utils.auth import create_access_token
from app.enums import RoleEnum

router = APIRouter(prefix="/auth", tags=["Auth"])
get_db = database.get_db


class GoogleTokenBody(BaseModel):
    access_token: str  # Google OAuth2 access token


def verify_google_token(access_token: str) -> dict:
    """Verify Google access token via Google's userinfo endpoint."""
    url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={urllib.parse.quote(access_token)}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        if "error" in data:
            raise HTTPException(status_code=400, detail=f"Token Google invalide : {data['error']}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Token Google invalide : {e}")


def random_password(length: int = 32) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(secrets.choice(chars) for _ in range(length))


@router.post("/google")
def google_login(body: GoogleTokenBody, db: Session = Depends(get_db)):
    info = verify_google_token(body.access_token)

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email non disponible depuis Google.")

    if info.get("email_verified") not in (True, "true"):
        raise HTTPException(status_code=400, detail="Email Google non vérifié.")

    user = db.query(models.User).filter(models.User.email == email).first()
    is_new = user is None

    if not user:
        # Créer le compte automatiquement
        from app.utils.security import hash_password
        name = info.get("name") or info.get("given_name") or email.split("@")[0]
        username = name.replace(" ", "_").lower()

        # S'assurer que le username est unique
        base = username
        counter = 1
        while db.query(models.User).filter(models.User.username == username).first():
            username = f"{base}_{counter}"
            counter += 1

        user = models.User(
            username=username,
            email=email,
            hashed_password=hash_password(random_password()),
            role=RoleEnum.particulier,
            profile_picture=info.get("picture"),
            objectif="autre",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_new": is_new,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "phone_number": user.phone_number,
            "profile_picture": user.profile_picture,
        },
    }
