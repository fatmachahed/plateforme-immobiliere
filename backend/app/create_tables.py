from app.database import engine, Base
from app.models import *  # tous tes modèles Django convertis en SQLAlchemy

def create_all_tables():
    print("Création des tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables créées avec succès !")

if __name__ == "__main__":
    create_all_tables()