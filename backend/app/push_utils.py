# backend/app/push_utils.py
"""Notifications push (Web Push / PWA) — annonce approuvée/refusée,
nouvelle demande de contact, nouvelle demande d'intervention, etc."""
import os
import json
from pywebpush import webpush, WebPushException
from sqlalchemy.orm import Session
from app import models

# Clés VAPID — générées une fois pour ce projet. À terme, régénérer et stocker
# via variables d'environnement (VAPID_PRIVATE_KEY_PEM / VAPID_PUBLIC_KEY) si
# besoin de les faire tourner ; ces valeurs par défaut fonctionnent telles quelles.
VAPID_PRIVATE_KEY_PEM = os.environ.get("VAPID_PRIVATE_KEY_PEM", """-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgcfIntWU0WiNXoyNd
d0R0PUMx70K5G3RkW9fJn1eiwd2hRANCAASrK3b04UFNQITMlqaY71fKpo93PWUd
hqYL43wu/rO7sEzxbPEbyvDHqzcJTpYV5ZTOBobSnFIrfGyPupIZ5L19
-----END PRIVATE KEY-----""")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "BKsrdvThQU1AhMyWppjvV8qmj3c9ZR2GpgvjfC7-s7uwTPFs8RvK8MerNwlOlhXllM4GhtKcUit8bI-6khnkvX0")
VAPID_CLAIMS_SUB = os.environ.get("VAPID_CONTACT_EMAIL", "mailto:contact@localizi.tn")


def send_push_to_user(db: Session, user_id: int, title: str, body: str, url: str = "/"):
    """Envoie une notification push à tous les appareils abonnés de cet utilisateur.
    Best-effort : ne lève jamais d'exception vers l'appelant (une notif ratée ne
    doit jamais casser l'action métier qui la déclenche)."""
    if not user_id:
        return
    subs = db.query(models.PushSubscription).filter(models.PushSubscription.user_id == user_id).all()
    if not subs:
        return
    payload = json.dumps({"title": title, "body": body, "url": url})
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY_PEM,
                vapid_claims={"sub": VAPID_CLAIMS_SUB},
            )
        except WebPushException as e:
            status = getattr(e.response, "status_code", None)
            if status in (404, 410):
                # Abonnement expiré/révoqué côté navigateur — on le retire.
                try:
                    db.delete(sub)
                    db.commit()
                except Exception:
                    db.rollback()
        except Exception:
            pass  # jamais bloquant
