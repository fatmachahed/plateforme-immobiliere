import os
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER)


def send_email(to_email: str, subject: str, html_body: str,
               attachment: tuple = None) -> bool:
    """
    Envoie un email HTML.
    attachment : tuple optionnel (bytes, mime_type, filename)
                 ex: (img_bytes, "image/jpeg", "capture.jpg")
    """
    if not SMTP_HOST or not SMTP_USER or not to_email:
        return False

    if attachment:
        msg = MIMEMultipart("mixed")
    else:
        msg = MIMEMultipart("alternative")

    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
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
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
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
    """Vérifie les recherches sauvegardées et envoie une alerte email si l'annonce correspond."""
    from app import models

    searches = db.query(models.SavedSearch).filter(models.SavedSearch.email_alert == True).all()
    for s in searches:
        try:
            criteres = json.loads(s.criteres) if s.criteres else {}
        except Exception:
            continue
        if not annonce_matches_criteria(annonce, criteres):
            continue
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        if not user or not user.email:
            continue
        subject = f"Nouvelle annonce correspondant à votre alerte « {s.nom or 'Ma recherche'} »"
        html = f"""
        <div style="font-family:sans-serif;max-width:520px">
          <h2 style="color:#0f172a">Une nouvelle annonce correspond à votre alerte</h2>
          <p>Bonjour {user.username or ''},</p>
          <p>L'annonce <strong>{annonce.titre}</strong> correspond aux critères de votre recherche sauvegardée
             « {s.nom or 'Ma recherche'} ».</p>
          <p><strong>Prix :</strong> {annonce.prix} DT</p>
          <p><a href="{os.environ.get('FRONTEND_URL', '')}/annonce/{annonce.id}"
                style="display:inline-block;margin-top:10px;padding:10px 18px;background:#6366f1;color:#fff;
                       text-decoration:none;border-radius:8px;">Voir l'annonce</a></p>
        </div>
        """
        send_email(user.email, subject, html)
