import psycopg2
import os
from sqlalchemy import text 

# app/test_db.py
from app.database import engine, Base, SessionLocal

def test_connection():
    try:
        # Crée les tables (si elles n'existent pas)
        Base.metadata.create_all(bind=engine)
        print("Connexion à la DB réussie et tables créées.")
        
        # Tester la session
        db = SessionLocal()
        db.execute(text("SELECT 1"))  # simple requête
        db.close()
        print("Session DB OK !")
    except Exception as e:
        print(f"Erreur de connexion à la DB : {e}")

if __name__ == "__main__":
    test_connection()
