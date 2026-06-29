import os
import smtplib
import json
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.base import MIMEBase
from email import encoders

SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)

# Logo Localizi — chargé une seule fois en mémoire pour les emails CID
_LOGO_PATH = Path(__file__).parent.parent.parent / "frontend" / "real_estate_front" / "src" / "assets" / "logo_localizi.png"
try:
    _LOGO_BYTES = _LOGO_PATH.read_bytes()
except Exception:
    _LOGO_BYTES = None

LOGO_IMG_HTML = (
    '<span style="font-size:28px;font-weight:900;letter-spacing:-1px;'
    'font-family:Arial,sans-serif;vertical-align:middle">'
    '<span style="color:#0f172a">LOCAL</span>'
    '<span style="color:#6366f1">IZI</span>'
    '<span style="color:#0f172a">.TN</span>'
    '</span>'
)

SOCIAL_FOOTER_HTML = """
<div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
  <p style="font-size:12px;color:#9ca3af;margin:0 0 12px;font-family:Arial,sans-serif;">Suivez-nous sur les réseaux sociaux</p>
  <div style="display:inline-flex;gap:10px;align-items:center;justify-content:center;">
    <a href="https://www.facebook.com/localizi.tn" target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#1877F2;text-decoration:none;">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" width="16" height="16" alt="Facebook"
           style="filter:invert(1);display:block;"/>
    </a>
    <a href="https://www.instagram.com/localizi.tn" target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);text-decoration:none;">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" width="16" height="16" alt="Instagram"
           style="filter:invert(1);display:block;"/>
    </a>
    <a href="https://www.linkedin.com/company/localizi-tn" target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#0A66C2;text-decoration:none;">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg" width="16" height="16" alt="LinkedIn"
           style="filter:invert(1);display:block;"/>
    </a>
    <a href="https://www.youtube.com/@localizi.tn" target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#FF0000;text-decoration:none;">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg" width="16" height="16" alt="YouTube"
           style="filter:invert(1);display:block;"/>
    </a>
    <a href="https://localizi.tn" target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#6366f1;text-decoration:none;">
      <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/internetexplorer.svg" width="14" height="14" alt="Site web"
           style="filter:invert(1);display:block;"/>
    </a>
  </div>
  <p style="font-size:11px;color:#9ca3af;margin:12px 0 0;font-family:Arial,sans-serif;">© Localizi.tn — Immobilier en Tunisie</p>
</div>
"""


def send_email(to_email: str, subject: str, html_body: str,
               attachment: tuple = None) -> bool:
    """Envoie un email HTML avec le logo Localizi en pièce jointe inline (CID)."""
    if not SMTP_HOST or not SMTP_USER or not to_email:
        return False

    # Structure : multipart/related pour logo CID + multipart/mixed pour pièces jointes
    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"] = f"Localizi.tn <{SMTP_FROM}>"
    msg["To"] = to_email

    # Partie HTML
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    if attachment:
        img_bytes, mime_type, filename = attachment
        main_type, sub_type = mime_type.split("/", 1) if "/" in mime_type else ("application", "octet-stream")
        part = MIMEBase(main_type, sub_type)
        part.set_payload(img_bytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(part)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[send_email] Erreur : {e}")
        return False


def annonce_matches_criteria(annonce, criteres: dict) -> bool:
    """Compare une annonce aux critères JSON sauvegardés (mêmes clés que FilterPanel)."""
    try:
        if criteres.get("categories"):
            cats = criteres["categories"]
            cat_val = annonce.categorie.value if hasattr(annonce.categorie, "value") else annonce.categorie
            if isinstance(cats, list) and cats and cat_val not in cats:
                return False

        if criteres.get("type"):
            type_val = annonce.type_bien.value if hasattr(annonce.type_bien, "value") else annonce.type_bien
            if criteres["type"] != type_val:
                return False

        if criteres.get("govNom"):
            gouv_nom = getattr(annonce.gouvernorat, "nom", None) if getattr(annonce, "gouvernorat", None) else None
            if gouv_nom and criteres["govNom"] != gouv_nom:
                return False

        prix = float(annonce.prix) if annonce.prix is not None else None
        if criteres.get("prixMin") not in (None, "") and prix is not None:
            if prix < float(criteres["prixMin"]):
                return False
        if criteres.get("prixMax") not in (None, "") and prix is not None:
            if prix > float(criteres["prixMax"]):
                return False

        surface = float(annonce.superficie) if annonce.superficie is not None else None
        if criteres.get("surfaceMin") not in (None, "") and surface is not None:
            if surface < float(criteres["surfaceMin"]):
                return False
        if criteres.get("surfaceMax") not in (None, "") and surface is not None:
            if surface > float(criteres["surfaceMax"]):
                return False

        return True
    except Exception:
        return False


def notify_saved_searches_for_annonce(db, annonce):
    """Vérifie les recherches sauvegardées et envoie UNE SEULE alerte email par utilisateur."""
    from app import models

    searches = db.query(models.SavedSearch).filter(models.SavedSearch.email_alert == True).all()

    # Grouper les alertes correspondantes par user_id pour éviter les doublons
    matched_by_user: dict = {}  # user_id -> list[nom_recherche]
    for s in searches:
        try:
            criteres = json.loads(s.criteres) if s.criteres else {}
        except Exception:
            continue
        if not annonce_matches_criteria(annonce, criteres):
            continue
        nom = s.nom or "Ma recherche"
        by_user = matched_by_user.setdefault(s.user_id, [])
        if nom not in by_user:
            by_user.append(nom)

    frontend = os.environ.get('FRONTEND_URL', '')
    for user_id, noms in matched_by_user.items():
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user or not user.email:
            continue
        noms_str = ", ".join(f"« {n} »" for n in noms)
        subject = "Une nouvelle annonce correspond à votre alerte"
        html = f"""
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:24px">
          <div style="text-align:center;padding:16px 0 20px">
            {LOGO_IMG_HTML}
          </div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px">
            <h2 style="color:#0f172a;margin:0 0 16px;font-size:18px">Une nouvelle annonce correspond à votre alerte</h2>
            <p style="margin:0 0 8px">Bonjour <strong>{user.username or ''}</strong>,</p>
            <p style="margin:0 0 12px;color:#374151">L'annonce <strong>{annonce.titre}</strong> correspond aux critères de votre recherche sauvegardée {noms_str}.</p>
            <p style="margin:0 0 20px"><strong>Prix :</strong> {annonce.prix} DT</p>
            <div>
              <a href="{frontend}/voir-annonce/{annonce.id}"
                 style="display:inline-block;padding:11px 20px;background:#6366f1;color:#fff;
                        text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;margin-right:10px;">Voir l'annonce</a>
              <a href="{frontend}/dashboard?tab=alertes"
                 style="display:inline-block;padding:11px 20px;background:#f1f5f9;color:#0f172a;
                        text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:1px solid #e2e8f0;">Mes recherches</a>
            </div>
          </div>
          {SOCIAL_FOOTER_HTML}
        </div>
        """
        send_email(user.email, subject, html)
