"""Lien avec le CRM de prospection (application locale, hors de ce dépôt).

Le CRM envoie les emails / téléphones de ses prospects ; on renvoie l'activité
des comptes localizi.tn correspondants (inscription, connexions, annonces).
Rien n'est renvoyé pour un contact qui n'a pas de compte.

Accès par clé dédiée (CRM_API_KEY dans .env), jamais par un compte admin :
la clé ne donne accès qu'à cette route, en lecture seule.
"""
import os
import re
import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, database

router = APIRouter(prefix="/crm", tags=["CRM"])
get_db = database.get_db


def require_crm_key(authorization: Optional[str] = Header(None)):
    expected = os.getenv("CRM_API_KEY", "")
    if not expected:
        raise HTTPException(status_code=503, detail="Lien CRM non configuré (CRM_API_KEY absente du serveur).")
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not secrets.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="Clé CRM invalide.")


def phone_key(numero: Optional[str]) -> Optional[str]:
    """8 derniers chiffres : +216 22 123 456, 0021622123456 et 22123456 correspondent.
    Les numéros de remplissage (20000000, 11111111…) sont ignorés."""
    digits = re.sub(r"\D", "", numero or "")
    if len(digits) < 8:
        return None
    key = digits[-8:]
    return None if len(set(key)) <= 2 else key


class Contact(BaseModel):
    ref: str = Field(max_length=100)               # id du prospect côté CRM, renvoyé tel quel
    email: Optional[str] = Field(None, max_length=255)
    telephones: list[str] = Field(default_factory=list, max_length=5)


class ActiviteRequest(BaseModel):
    contacts: list[Contact] = Field(max_length=5000)


@router.post("/activite", dependencies=[Depends(require_crm_key)])
def activite(body: ActiviteRequest, db: Session = Depends(get_db)):
    # Index email / téléphone → utilisateur
    emails = {c.email.strip().lower() for c in body.contacts if c.email and c.email.strip()}
    by_email = {}
    if emails:
        for u in db.query(models.User).filter(func.lower(models.User.email).in_(emails)):
            by_email[u.email.lower()] = u

    wanted_phones = {k for c in body.contacts for t in c.telephones if (k := phone_key(t))}
    by_phone = {}
    if wanted_phones:
        owners = {}  # numéro → {user_id: user}
        for u in db.query(models.User).filter(models.User.phone_number.isnot(None)):
            if (k := phone_key(u.phone_number)) in wanted_phones:
                owners.setdefault(k, {})[u.id] = u
        extra = (db.query(models.UserPhoneNumber, models.User)
                   .join(models.User, models.UserPhoneNumber.user_id == models.User.id))
        for num, u in extra:
            if (k := phone_key(num.numero)) in wanted_phones:
                owners.setdefault(k, {})[u.id] = u
        # Un numéro partagé par plusieurs comptes est ambigu : pas de rattachement
        by_phone = {k: next(iter(us.values())) for k, us in owners.items() if len(us) == 1}

    matches = {}  # ref → (user, via)
    for c in body.contacts:
        u, via = None, None
        if c.email and (u := by_email.get(c.email.strip().lower())):
            via = "email"
        else:
            for t in c.telephones:
                if (k := phone_key(t)) and (u := by_phone.get(k)):
                    via = "telephone"
                    break
        if u:
            matches[c.ref] = (u, via)

    if not matches:
        return {"date": datetime.utcnow().isoformat() + "Z", "resultats": []}

    # Statistiques groupées pour tous les comptes trouvés (quelques requêtes, pas une par prospect)
    user_ids = {u.id for u, _ in matches.values()}
    LE = models.LoginEvent
    since_30d = datetime.utcnow() - timedelta(days=30)
    nb_30j = dict(db.query(LE.user_id, func.count(LE.id))
                    .filter(LE.user_id.in_(user_ids), LE.succes.is_(True), LE.created_at >= since_30d)
                    .group_by(LE.user_id))
    nb_total = dict(db.query(LE.user_id, func.count(LE.id))
                      .filter(LE.user_id.in_(user_ids), LE.succes.is_(True))
                      .group_by(LE.user_id))
    last_event = {}
    for e in (db.query(LE).filter(LE.user_id.in_(user_ids), LE.succes.is_(True))
                .order_by(LE.user_id, LE.created_at.desc())
                .distinct(LE.user_id)):
        last_event[e.user_id] = e
    annonces = dict(db.query(models.Annonce.utilisateur_id, func.count(models.Annonce.id))
                      .filter(models.Annonce.utilisateur_id.in_(user_ids))
                      .group_by(models.Annonce.utilisateur_id))

    def iso(dt):
        return dt.isoformat() + "Z" if dt else None  # stocké en UTC

    resultats = []
    for ref, (u, via) in matches.items():
        e = last_event.get(u.id)
        resultats.append({
            "ref": ref,
            "trouve_par": via,
            "user_id": u.id,
            "username": u.username,
            "role": u.role.value if hasattr(u.role, "value") else str(u.role),
            "email_verifie": bool(u.is_verified),
            "bloque": bool(u.is_blocked),
            "inscrit_le": iso(u.created_at),
            "derniere_connexion": iso(u.last_login),
            "connexions_30j": nb_30j.get(u.id, 0),
            "connexions_total": nb_total.get(u.id, 0),
            "dernier_appareil": f"{e.appareil} · {e.navigateur} · {e.os}" if e else None,
            "nb_annonces": annonces.get(u.id, 0),
        })
    return {"date": datetime.utcnow().isoformat() + "Z", "resultats": resultats}
