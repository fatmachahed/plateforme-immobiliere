# main.py - Version CORS FORCÉ pour dev
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn, os

app = FastAPI(title="Real Estate Platform")

# 1. Middleware CORS agressif
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # toutes les origines (développement)
    allow_credentials=True,
    allow_methods=["*"],       # toutes les méthodes HTTP
    allow_headers=["*"],       # tous les headers
)

# 2. Imports après CORS
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.routers import users, annonces, properties, localisation, catalogue, upload, admin

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

# Servir les images uploadées
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# 4. Monter les routeurs
app.include_router(users.router,       tags=["Users"])
app.include_router(annonces.router,    tags=["Annonces"])
app.include_router(properties.router,  tags=["Properties"])
app.include_router(localisation.router,tags=["Localisation"])
app.include_router(catalogue.router,   tags=["Catalogue"])
app.include_router(upload.router,      tags=["Upload"])
app.include_router(admin.router,       tags=["Admin"])

# 5. Routes de test CORS
@app.get("/")
def root():
    return {"message": "API avec CORS activé!"}



@app.get("/test-cors")
def test_cors():
    return {"message": "CORS fonctionne!", "status": "ok"}

@app.get("/health")
def health():
    return {"status": "ok"}

# 6. Gestionnaire OPTIONS global
@app.options("/{path:path}")
async def options_handler(path: str):
    return JSONResponse(
        content={"message": "Preflight OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# 7. Lancer Uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
