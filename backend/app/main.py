# main.py
from fastapi import FastAPI, Request, Depends
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
        # Date de livraison prévue (mois, YYYY-MM) pour les biens "en construction"
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS livraison_prevue VARCHAR;",
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
        # Référence unique promoteur
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS promoteur_reference VARCHAR UNIQUE;",
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
        # Nouveau type de bien "duplex" — mêmes caractéristiques que appartement
        "ALTER TYPE typebienenum ADD VALUE IF NOT EXISTS 'duplex';",
        # Nouveau type de bien "penthouse" — mêmes caractéristiques que appartement
        "ALTER TYPE typebienenum ADD VALUE IF NOT EXISTS 'penthouse';",
        # Rôle interne "manager commercial" — suivi de l'apport de leads
        "ALTER TYPE roleenum ADD VALUE IF NOT EXISTS 'manager_commercial';",
        # Traçabilité : quel manager commercial a apporté ce lead/annonce
        "ALTER TABLE annonces ADD COLUMN IF NOT EXISTS commercial_id INTEGER REFERENCES users(id);",
        # Table paramètres plateforme (clé-valeur JSON)
        """
        CREATE TABLE IF NOT EXISTS settings (
            key VARCHAR PRIMARY KEY,
            value TEXT NOT NULL
        );
        """,
        # Superficies jardin/terrasse/piscine + nb places garage : persistées en
        # champs structurés (avant, seulement injectées dans le texte de
        # description générée, donc perdues si l'utilisateur écrivait sa propre
        # description).
        "ALTER TABLE caractere_general ADD COLUMN IF NOT EXISTS surface_jardin FLOAT;",
        "ALTER TABLE caractere_general ADD COLUMN IF NOT EXISTS surface_terrasse FLOAT;",
        "ALTER TABLE caractere_general ADD COLUMN IF NOT EXISTS surface_piscine FLOAT;",
        "ALTER TABLE caractere_general ADD COLUMN IF NOT EXISTS nb_places_garage INTEGER;",
        # Ordre d'affichage des photos (glisser-déposer côté création/édition d'annonce)
        "ALTER TABLE property_images ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 0;",
        # Notifications push (PWA) — abonnements par utilisateur/appareil
        """
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            endpoint VARCHAR UNIQUE NOT NULL,
            p256dh VARCHAR NOT NULL,
            auth VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """,
        # Numéros de téléphone supplémentaires (en plus de users.phone_number)
        """
        CREATE TABLE IF NOT EXISTS user_phone_numbers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            numero VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """,
        # OTP de vérification de numéro (principal ou supplémentaire) — en base
        # car partagé entre les workers uvicorn (une mémoire process perdrait
        # la demande si request/confirm tombent sur deux workers différents)
        """
        CREATE TABLE IF NOT EXISTS pending_phone_otps (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            kind VARCHAR NOT NULL,
            numero VARCHAR NOT NULL,
            otp VARCHAR NOT NULL,
            expires_at TIMESTAMP NOT NULL
        );
        """,
        # Suivi des clics de contact (téléphone/whatsapp/email) — tableau de bord agence
        """
        CREATE TABLE IF NOT EXISTS contact_clicks (
            id SERIAL PRIMARY KEY,
            annonce_id INTEGER REFERENCES annonces(id) ON DELETE CASCADE,
            canal VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        """,
        "CREATE INDEX IF NOT EXISTS ix_contact_clicks_annonce_id ON contact_clicks (annonce_id);",
        # Normalise les emails existants en minuscule (Gmail et la plupart des
        # fournisseurs traitent Nom@x.com et nom@x.com comme la même adresse).
        # Idempotent (ne touche que les lignes encore en majuscules) et
        # ignore volontairement les groupes d'emails qui entreraient en
        # collision une fois passés en minuscule (deux comptes distincts avec
        # le même email dans une casse différente) — ceux-là nécessitent une
        # fusion manuelle (transfert des annonces vers un seul compte) avant
        # de pouvoir être normalisés sans violer la contrainte d'unicité.
        """
        UPDATE users
        SET email = lower(email)
        WHERE email <> lower(email)
          AND lower(email) NOT IN (
              SELECT lower(email) FROM users GROUP BY lower(email) HAVING count(*) > 1
          );
        """,
        # Nouvelle localité "JARDINS DE CARTHAGE" (gouvernorat TUNIS, délégation
        # EL KRAM) — absente du référentiel initial, demandée pour apparaître
        # partout où les localités sont listées/recherchées (carte, création
        # d'annonce étape 2...), puisque ces pages lisent toutes cette même
        # table en base sans liste en dur côté frontend.
        """
        INSERT INTO localites (nom, delegation_id)
        SELECT 'JARDINS DE CARTHAGE', d.id
        FROM delegations d
        JOIN gouvernorats g ON g.id = d.gouvernorat_id
        WHERE g.nom = 'TUNIS' AND d.nom = 'EL KRAM'
          AND NOT EXISTS (
              SELECT 1 FROM localites l
              WHERE l.delegation_id = d.id AND l.nom = 'JARDINS DE CARTHAGE'
          );
        """,
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

# 5a. Sitemap XML dynamique — pages statiques + une entrée par annonce
# approuvée. Les fiches annonce s'ouvrent en popup au-dessus de /carte (pas
# de page à part), mais chacune a désormais son propre title/description/
# JSON-LD (voir Seo dans AnnonceDetailModal.jsx) et une URL lisible et
# stable (/annonce/{id}/{type}/{slug}) — sans les lister ici, Google n'a
# aucune chance de découvrir/indexer les milliers de fiches individuelles,
# qui sont justement le contenu le plus spécifique (et donc le plus
# atteignable en référencement) du site.
import re as _re
import unicodedata as _unicodedata
from fastapi.responses import Response as _XmlResponse

_SITEMAP_TYPE_LBL = {
    "appartement": "appartement", "duplex": "duplex", "penthouse": "penthouse", "villa": "villa-maison",
    "villa_maison": "villa-maison", "maison": "villa-maison", "immeuble": "immeuble",
    "terrain": "terrain", "local_commercial": "local-commercial", "bureau": "bureau",
    "ferme_agricole": "ferme-agricole", "ferme": "ferme-agricole",
    "garage_parking": "garage-parking", "depot_stockage": "depot-stockage",
    "batiment_industriel": "batiment-industriel", "immobiliers_divers": "immobiliers-divers",
}

def _slugify(value: str) -> str:
    value = _unicodedata.normalize("NFD", value or "")
    value = "".join(c for c in value if _unicodedata.category(c) != "Mn")  # retire les accents
    value = value.lower()
    value = _re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:80] or "annonce"

@app.get("/sitemap.xml", tags=["SEO"])
def sitemap(db: Session = Depends(get_db)):
    base = "https://www.localizi.tn"
    static_paths = [
        "", "carte", "vendre", "trouver-un-agent", "trouver-un-promoteur",
        "trouver-un-prestataire", "comment-ca-marche", "apropos", "faq",
        "contact", "abonnements",
    ]
    urls = [f"{base}/{p}" if p else base for p in static_paths]
    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        body.append(f"<url><loc>{u}</loc><changefreq>weekly</changefreq></url>")

    annonces = (
        db.query(models.Annonce.id, models.Annonce.titre, models.Annonce.type_bien, models.Annonce.date_mise_a_jour)
        .filter(models.Annonce.status == "approuvee")
        .all()
    )
    for a in annonces:
        type_bien_val = a.type_bien.value if hasattr(a.type_bien, "value") else str(a.type_bien)
        type_slug = _SITEMAP_TYPE_LBL.get(type_bien_val, "bien")
        title_slug = _slugify(a.titre)
        lastmod = a.date_mise_a_jour.strftime("%Y-%m-%d") if a.date_mise_a_jour else None
        loc = f"{base}/annonce/{a.id}/{type_slug}/{title_slug}"
        lastmod_tag = f"<lastmod>{lastmod}</lastmod>" if lastmod else ""
        body.append(f"<url><loc>{loc}</loc>{lastmod_tag}<changefreq>weekly</changefreq></url>")

    # Profils pro (agent/agence/promoteur/prestataire) ayant au moins une
    # annonce approuvée — les profils vides seraient du contenu trop pauvre
    # pour Google (thin content), donc volontairement exclus.
    _PROFILE_PREFIX = {"partenaire": "prestataire", "promoteur": "promoteur"}
    pros = (
        db.query(models.User.id, models.User.role)
        .filter(models.User.role.in_(["agent", "agence", "promoteur", "partenaire"]))
        .filter(db.query(models.Annonce.id).filter(
            models.Annonce.utilisateur_id == models.User.id,
            models.Annonce.status == "approuvee",
            models.Annonce.anonyme == False,
        ).exists())
        .all()
    )
    for p in pros:
        role_val = p.role.value if hasattr(p.role, "value") else str(p.role)
        prefix = _PROFILE_PREFIX.get(role_val, "agent")
        body.append(f"<url><loc>{base}/{prefix}/{p.id}</loc><changefreq>weekly</changefreq></url>")

    body.append("</urlset>")
    return _XmlResponse(content="".join(body), media_type="application/xml")

# 6. Route formulaire de contact (POST /contact)
from fastapi import Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import html as _html  # pour échapper les inputs utilisateur dans les emails
import json as _main_json
from app import models

# 5b. Config publique des offres d'abonnement (après imports Depends/Session)
_DEFAULT_PLANS_CONFIG = {
    "particulier": {"gratuit": True, "essentiel": True, "investisseur": True},
    "agent":       {"gratuit": True, "starter": True, "pro": True, "expert": True},
    "agence":      {"gratuit": True, "start": True, "pro": True, "power": True},
    "promoteur":   {"gratuit-promo": True, "basic": True, "standard": True, "premium": True},
    "partenaire":  {"smart": True, "bronze": True, "silver": True, "gold": True},
}

@app.get("/plans-config", tags=["Plans"])
def get_plans_config_public(db: Session = Depends(get_db)):
    row = db.execute(text("SELECT value FROM settings WHERE key = 'plans_config'")).fetchone()
    if not row:
        return _DEFAULT_PLANS_CONFIG
    return _main_json.loads(row[0])

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
