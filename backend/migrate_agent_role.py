from app.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    conn.execute(text("ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'agent'"))
    conn.commit()
    print("Migration done: 'agent' added to roleenum")
