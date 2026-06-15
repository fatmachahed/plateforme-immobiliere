"""
Migration : renomme la valeur 'ferme' en 'ferme_agricole' dans typebienenum.

Usage:
    cd backend
    .\venv\Scripts\python.exe -m app.migrate_ferme_agricole
"""
from sqlalchemy import text
from app.database import engine

with engine.begin() as conn:
    # 1. Ajouter la nouvelle valeur
    conn.execute(text("ALTER TYPE typebienenum ADD VALUE IF NOT EXISTS 'ferme_agricole';"))

with engine.begin() as conn:
    # 2. Migrer les lignes existantes
    result = conn.execute(text(
        "UPDATE annonces SET type_bien = 'ferme_agricole' WHERE type_bien = 'ferme'"
    ))
    print(f"Updated {result.rowcount} rows: ferme -> ferme_agricole")

print("Migration complete. Note: 'ferme' stays in the PostgreSQL enum for backward compat.")
