from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS nom_entreprise VARCHAR"))
    conn.commit()
    print("Migration done: nom_entreprise added to users")
