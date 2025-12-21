from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.routers import users, annonces, properties

# Crée les tables si elles n'existent pas (uniquement dev)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Real Estate Platform")

# Routes
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(annonces.router, prefix="/annonces", tags=["Annonces"])
app.include_router(properties.router, prefix="/properties", tags=["Properties"])

@app.get("/")
def root():
    return {"message": "Bienvenue sur l'API Real Estate Platform!"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        return {"status": "ok", "message": "Connexion DB réussie"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur DB: {str(e)}")
