"""
Script de création / promotion admin — Localizi
Exécuter depuis le dossier backend :
    python create_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL    = "admin@localizi.tn"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@2025!"   # ← changez ce mot de passe après la première connexion

db = SessionLocal()

try:
    # Vérifie si l'admin existe déjà
    existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()

    if existing:
        # Promotion de l'utilisateur existant
        existing.role = "admin"
        existing.hashed_password = pwd_context.hash(ADMIN_PASSWORD)
        db.commit()
        print(f"[OK] Utilisateur existant promu admin : {ADMIN_EMAIL}")
    else:
        # Création d'un nouvel admin
        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            hashed_password=pwd_context.hash(ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print("[OK] Compte admin cree avec succes !")

    print()
    print("=" * 42)
    print(f"  Email    : {ADMIN_EMAIL}")
    print(f"  Password : {ADMIN_PASSWORD}")
    print(f"  URL      : http://localhost:5173/login")
    print("=" * 42)
    print("[!] Changez le mot de passe apres connexion !")

except Exception as e:
    db.rollback()
    print(f"[ERREUR] {e}")
finally:
    db.close()
