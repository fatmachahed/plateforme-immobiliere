# backend/app/config.py
import os
from dotenv import load_dotenv

# Charge le fichier .env à la racine du projet
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

# Vérification si les variables existent
if not SECRET_KEY or not DATABASE_URL:
    raise ValueError("Les variables d'environnement SECRET_KEY et DATABASE_URL doivent être définies dans .env")
