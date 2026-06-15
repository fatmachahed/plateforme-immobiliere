"""Migration: rename devise enum value 'TND' → 'DT' in the database."""
from app.database import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE annonces ALTER COLUMN devise TYPE VARCHAR USING devise::VARCHAR;"))
    result = conn.execute(text("UPDATE annonces SET devise = 'DT' WHERE devise = 'TND';"))
    print(f"Updated {result.rowcount} rows: TND -> DT")
    conn.execute(text("ALTER TABLE annonces ALTER COLUMN devise TYPE deviseenum USING devise::deviseenum;"))
    print("Migration complete.")
