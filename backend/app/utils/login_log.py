"""Journal des connexions : IP réelle du visiteur, appareil, navigateur, pays.

Le site est derrière Cloudflare puis Nginx : `request.client.host` est donc
l'IP du conteneur Nginx, pas celle du visiteur. On lit d'abord les en-têtes
posés par Cloudflare (CF-Connecting-IP, CF-IPCountry), puis ceux de Nginx.
"""
import logging
import re
from typing import Optional

from fastapi import Request
from sqlalchemy.orm import Session

from app import models

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """IP réelle du visiteur (Cloudflare > Nginx > connexion directe)."""
    h = request.headers
    ip = h.get("cf-connecting-ip") or h.get("x-real-ip")
    if not ip and h.get("x-forwarded-for"):
        ip = h["x-forwarded-for"].split(",")[0]
    if not ip and request.client:
        ip = request.client.host
    return (ip or "unknown").strip()[:64]


# Ordre important : Edge/Opera/Samsung contiennent aussi "Chrome" et "Safari".
_BROWSERS = [
    ("Edge", r"Edg(?:e|A|iOS)?/"), ("Opera", r"OPR/|Opera"),
    ("Samsung Internet", r"SamsungBrowser/"), ("Facebook (app)", r"FBAN|FBAV"),
    ("Instagram (app)", r"Instagram"), ("Firefox", r"Firefox/|FxiOS/"),
    ("Chrome", r"Chrome/|CriOS/"), ("Safari", r"Safari/"),
]
_OS = [
    ("Android", r"Android"), ("iOS", r"iPhone|iPad|iPod"), ("Windows", r"Windows"),
    ("macOS", r"Mac OS X|Macintosh"), ("Linux", r"Linux"),
]


def parse_user_agent(ua: str) -> tuple[str, str, str]:
    """Renvoie (appareil, navigateur, os) à partir du User-Agent."""
    ua = ua or ""
    navigateur = next((n for n, p in _BROWSERS if re.search(p, ua)), "Autre")
    os_name = next((n for n, p in _OS if re.search(p, ua)), "Autre")
    if re.search(r"iPad|Tablet", ua) or (os_name == "Android" and "Mobile" not in ua):
        appareil = "Tablette"
    elif re.search(r"Mobi|iPhone|Android", ua):
        appareil = "Mobile"
    elif os_name in ("Windows", "macOS", "Linux"):
        appareil = "Ordinateur"
    else:
        appareil = "Autre"
    return appareil, navigateur, os_name


def log_login_event(
    db: Session,
    request: Request,
    *,
    email: Optional[str],
    methode: str,
    succes: bool,
    user: Optional[models.User] = None,
    motif: Optional[str] = None,
) -> None:
    """Enregistre une tentative de connexion. Ne fait jamais échouer le login."""
    try:
        ua = request.headers.get("user-agent", "")[:500]
        appareil, navigateur, os_name = parse_user_agent(ua)
        pays = request.headers.get("cf-ipcountry")
        db.add(models.LoginEvent(
            user_id=user.id if user else None,
            email=(email or "").strip().lower()[:255] or None,
            methode=methode,
            succes=succes,
            motif=motif,
            ip=get_client_ip(request),
            pays=pays[:8] if pays else None,
            appareil=appareil,
            navigateur=navigateur,
            os=os_name,
            user_agent=ua,
        ))
        db.commit()
    except Exception:
        logger.exception("Échec de l'enregistrement du journal de connexion")
        db.rollback()
