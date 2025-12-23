# main.py - Version CORS FORCÉ pour dev
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
import uvicorn

app = FastAPI(title="Real Estate Platform")

# 1. Middleware CORS agressif
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # toutes les origines (développement)
    allow_credentials=True,
    allow_methods=["*"],       # toutes les méthodes HTTP
    allow_headers=["*"],       # tous les headers
)

# 2. Middleware HTTP supplémentaire pour forcer les headers CORS
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Forcer les headers CORS
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    
    # Gestion OPTIONS preflight
    if request.method == "OPTIONS":
        return JSONResponse(
            content={"message": "Preflight OK"},
            status_code=200,
            headers=dict(response.headers)
        )
    
    return response

# 3. Imports après CORS
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.routers import users, annonces, properties, localisation, catalogue

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

# 4. Monter les routeurs (sans changer les chemins existants)
app.include_router(users.router, tags=["Users"])
app.include_router(annonces.router, tags=["Annonces"])
app.include_router(properties.router, tags=["Properties"])
app.include_router(localisation.router, tags=["Localisation"])
app.include_router(catalogue.router,tags=['Catalogue'])

# 5. Routes de test CORS
@app.get("/")
def root():
    return {"message": "API avec CORS activé!"}

@app.get("/test-cors")
def test_cors():
    return {"message": "CORS fonctionne!", "status": "ok"}

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
