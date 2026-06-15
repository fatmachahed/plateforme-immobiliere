"""Migration: add TND back to deviseenum in PostgreSQL (legacy compat)."""
from app.database import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("ALTER TYPE deviseenum ADD VALUE IF NOT EXISTS 'TND';"))
    print("Done: TND added to deviseenum.")
