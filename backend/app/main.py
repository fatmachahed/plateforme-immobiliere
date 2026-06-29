# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn, os

app = FastAPI(title="Real Estate Platform", docs_url=None, redoc_url=None)  # désactive Swagger en prod

# 1. Headers de sécurité sur toutes les réponses
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://accounts.google.com; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob: https:; "
        "connect-src 'self' https://nominatim.openstreetmap.org https://translate.googleapis.com https://api.mymemory.translated.net; "
        "frame-src https://accounts.google.com"
    )
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# 2. CORS — configurable via CORS_ORIGINS (virgule-séparées)
_cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# 2. Imports après CORS
from sqlalchemy.orm import Session
from app.database import Base, engine, get_db
from app.routers import users, annonces, properties, localisation, catalogue, upload, admin, auth_google

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

# ── Migration automatique : ajouter les colonnes manquantes ──
from sqlalchemy import text
with engine.connect() as conn:
    migrations = [
        # Table des recherches sauvegardées
        """
        CREATE TABLE IF NOT EXISTS saved_searches (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            nom VARCHAR,
            criteres TEXT NOT NULL,
            email_alert BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """,
        # Champ anonyme sur les annonces (publication anonyme)
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS anonyme BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS accompagnement BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS duree_type VARCHAR;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS duree_valeur VARCHAR;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS capacite_accueil INTEGER;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS secteur_partenaire VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS metier_artisan VARCHAR;",
        "ALTER TABLE caractere_general ADD COLUMN IF NOT EXISTS animaux_admis BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS accompagnement_agence_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS gouvernorat VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS localite VARCHAR;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS hauteur_immeuble VARCHAR;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS emplacement_garage VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS adresse VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;",
        # Sécurité : vérification email
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR;",
        # Dates de création / mise à jour
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();",
        "ALTER TABLE caracteristique_interieure ADD COLUMN IF NOT EXISTS internet BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE caracteristique_interieure ADD COLUMN IF NOT EXISTS tv BOOLEAN DEFAULT FALSE;",
        # Nouveaux champs immeuble
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS nb_appartements INTEGER;",
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS orientation_immeuble VARCHAR;",
        # Référence annonce (code gouvernorat + numéro séquentiel)
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS reference VARCHAR UNIQUE;",
        # Champs professionnels utilisateurs
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS matricule_fiscal VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS registre_commerce VARCHAR;",
        # Référence unique agence
        "ALTER TABLE agencies ADD COLUMN IF NOT EXISTS reference VARCHAR UNIQUE;",
        # Migrer devise DT → TND dans les annonces existantes
        "UPDATE annonces SET devise = 'TND' WHERE devise = 'DT';",
        # Backfill références agences existantes sans référence
        """
        UPDATE agencies SET reference = 'AGC' || LPAD(id::text, 4, '0')
        WHERE reference IS NULL;
        """,
        # Table des demandes de contact anonyme
        """
        CREATE TABLE IF NOT EXISTS contact_requests (
            id SERIAL PRIMARY KEY,
            annonce_id INTEGER REFERENCES annonces(id) ON DELETE CASCADE,
            nom VARCHAR NOT NULL,
            email VARCHAR,
            telephone VARCHAR,
            message VARCHAR,
            lu BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """,
        # Table des messages du formulaire de contact
        """
        CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            nom VARCHAR NOT NULL,
            email VARCHAR,
            sujet VARCHAR,
            message VARCHAR,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """,
        # Ajout statuts vendue/louee dans l'enum PostgreSQL
        "ALTER TYPE statusenum ADD VALUE IF NOT EXISTS 'vendue';",
        "ALTER TYPE statusenum ADD VALUE IF NOT EXISTS 'louee';",
    ]
    for sql in migrations:
        try:
            conn.execute(text(sql))
        except Exception as e:
            print(f"[Migration] {e}")
    conn.commit()

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
app.include_router(auth_google.router, tags=["Auth"])

# 5. Health check (utilisé par Docker et le monitoring)
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

# 6. Route formulaire de contact (POST /contact)
from fastapi import Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import html as _html  # pour échapper les inputs utilisateur dans les emails
from app import models

class ContactBody(BaseModel):
    nom:       str
    email:     Optional[str] = None
    telephone: Optional[str] = None
    sujet:     Optional[str] = None
    message:   Optional[str] = None
    image:     Optional[str] = None  # base64 data URL (ex: "data:image/png;base64,...")

@app.post("/contact", tags=["Contact"])
def submit_contact(body: ContactBody, db: Session = Depends(get_db)):
    """Enregistre un message depuis le formulaire de contact et envoie un email à l'admin."""
    msg = models.ContactMessage(
        nom=body.nom,
        email=body.email,
        sujet=body.sujet,
        message=body.message,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Envoi email à l'admin si SMTP configuré
    admin_email = os.environ.get("ADMIN_EMAIL", os.environ.get("SMTP_FROM", "localizi.tn@gmail.com"))
    if admin_email:
        from app.email_utils import send_email
        import base64, uuid, mimetypes
        # Échapper tous les inputs utilisateur pour éviter l'injection HTML dans l'email
        safe_nom      = _html.escape(body.nom      or "")
        safe_email    = _html.escape(body.email    or "")
        safe_tel      = _html.escape(body.telephone or "")
        safe_message  = _html.escape(body.message  or "")
        sujet_label   = _html.escape(body.sujet    or "Message de contact")

        # Décoder l'image base64 en bytes pour pièce jointe
        import base64 as b64mod, mimetypes
        image_attachment = None  # (bytes, mime_type, filename)
        image_note_html = ""
        if body.image and body.image.startswith("data:"):
            try:
                header, b64data = body.image.split(",", 1)
                mime_type = header.split(";")[0].replace("data:", "")
                ext = mimetypes.guess_extension(mime_type) or ".jpg"
                if ext == ".jpe": ext = ".jpg"
                img_bytes = b64mod.b64decode(b64data)
                filename = f"capture_signalement{ext}"
                image_attachment = (img_bytes, mime_type, filename)
                image_note_html = "<p style='font-size:12px;color:#64748b;margin-top:16px'>📎 Capture d'écran en pièce jointe.</p>"
            except Exception as e:
                print(f"[Contact] Erreur décodage image : {e}")

        html = f"""
        <div style="font-family:sans-serif;max-width:580px;margin:0 auto;color:#0f172a">
          <div style="background:#6366f1;padding:24px 28px;border-radius:10px 10px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">📩 Nouveau message — Localizi</h2>
          </div>
          <div style="background:#f8fafc;padding:24px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#64748b;width:110px">De :</td>
                  <td style="padding:8px 0;font-weight:600">{safe_nom}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Email :</td>
                  <td style="padding:8px 0">{safe_email or "—"}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Téléphone :</td>
                  <td style="padding:8px 0">{safe_tel or "—"}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Sujet :</td>
                  <td style="padding:8px 0;font-weight:600">{sujet_label}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
            <p style="font-size:14px;line-height:1.7;white-space:pre-wrap">{safe_message}</p>
            {image_note_html}
            <p style="font-size:11px;color:#94a3b8;margin-top:20px">Message #{msg.id} reçu via Localizi</p>
          </div>
        </div>
        """
        send_email(admin_email, f"[Localizi] {sujet_label} — {safe_nom}", html,
                   attachment=image_attachment)

        # Accusé de réception à l'expéditeur
        if body.email:
            html_ack = f"""
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0f172a">
              <div style="background:#6366f1;padding:22px 28px;border-radius:10px 10px 0 0">
                <h2 style="color:#fff;margin:0;font-size:17px">Votre message a bien été reçu ✓</h2>
              </div>
              <div style="background:#f8fafc;padding:22px 28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px">
                <p>Bonjour {body.nom},</p>
                <p>Nous avons bien reçu votre message concernant <strong>«&nbsp;{sujet_label}&nbsp;»</strong>
                   et nous vous répondrons dans les meilleurs délais.</p>
                <p style="color:#64748b;font-size:13px">L'équipe Localizi</p>
              </div>
            </div>
            """
            send_email(body.email, "Nous avons bien reçu votre message — Localizi", html_ack)

    return {"detail": "Message enregistré avec succès.", "id": msg.id}

@app.get("/health")
def health():
    return {"status": "ok"}

# Lancer Uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
