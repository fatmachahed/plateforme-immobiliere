"""Migration: add missing values to typebienenum in PostgreSQL.

Run with:
    cd backend
    .\\venv\\Scripts\\python.exe -m app.migrate_typebien_enum
"""
from app.database import engine
from sqlalchemy import text

MISSING_VALUES = [
    "villa_maison",
    "immobiliers_divers",
    "depot_stockage",
]

with engine.begin() as conn:
    for val in MISSING_VALUES:
        conn.execute(text(f"ALTER TYPE typebienenum ADD VALUE IF NOT EXISTS '{val}';"))
        print(f"OK: '{val}' ajouté à typebienenum.")

print("Migration terminée.")
