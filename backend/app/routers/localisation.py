# app/routers/localisation.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Gouvernorat, Delegation, Localite 


router = APIRouter(
    prefix="/localisation",
    tags=["localisation"]
)

@router.get("/gouvernorats")
def read_gouvernorats(db: Session = Depends(get_db)):
    return db.query(Gouvernorat).all()

@router.get("/delegations")
def read_delegations(gouvernorat_id: int, db: Session = Depends(get_db)):
    return db.query(Delegation).filter(Delegation.gouvernorat_id == gouvernorat_id).all()

@router.get("/localites")
def read_localites(delegation_id: int, db: Session = Depends(get_db)):
    return db.query(Localite).filter(Localite.delegation_id == delegation_id).all()

from sqlalchemy import func

@router.get("/search")
def search_localisation(q: str, db: Session = Depends(get_db)):
    """
    Hiérarchie : gouvernorat → délégation → localité.
    Retourne le premier niveau trouvé avec ses parents.
    """
    if not q or len(q.strip()) < 2:
        return None
    ql = f"%{q.strip().lower()}%"

    # 1 — Gouvernorat
    gov = db.query(Gouvernorat).filter(func.lower(Gouvernorat.nom).like(ql)).first()
    if gov:
        return {
            "type": "gouvernorat",
            "gouvernorat_id": gov.id,
            "gouvernorat": gov.nom,
            "delegation_id": None,
            "delegation": None,
            "localite_id": None,
            "localite": None,
        }

    # 2 — Délégation
    delg = db.query(Delegation).filter(func.lower(Delegation.nom).like(ql)).first()
    if delg:
        gouvernorat = db.query(Gouvernorat).filter(Gouvernorat.id == delg.gouvernorat_id).first()
        return {
            "type": "delegation",
            "gouvernorat_id": gouvernorat.id if gouvernorat else None,
            "gouvernorat": gouvernorat.nom if gouvernorat else None,
            "delegation_id": delg.id,
            "delegation": delg.nom,
            "localite_id": None,
            "localite": None,
        }

    # 3 — Localité
    loc = db.query(Localite).filter(func.lower(Localite.nom).like(ql)).first()
    if loc:
        delegation = db.query(Delegation).filter(Delegation.id == loc.delegation_id).first()
        gouvernorat = db.query(Gouvernorat).filter(
            Gouvernorat.id == delegation.gouvernorat_id
        ).first() if delegation else None
        return {
            "type": "localite",
            "gouvernorat_id": gouvernorat.id if gouvernorat else None,
            "gouvernorat": gouvernorat.nom if gouvernorat else None,
            "delegation_id": delegation.id if delegation else None,
            "delegation": delegation.nom if delegation else None,
            "localite_id": loc.id,
            "localite": loc.nom,
        }

    return None


@router.get("/search-suggestions")
def search_localisation_suggestions(q: str, limit: int = 10, db: Session = Depends(get_db)):
    """Suggestions multiples (pas juste la première) pour la recherche rapide
    gouvernorat/délégation/localité dans le formulaire de création d'annonce.
    Chaque résultat renvoie la chaîne complète (localité, délégation, gouvernorat)."""
    if not q or len(q.strip()) < 2:
        return []
    ql = f"%{q.strip().lower()}%"
    results = []

    # 1 — Localités (le cas le plus fréquent : quartier/ville précis)
    loc_rows = (
        db.query(Localite, Delegation, Gouvernorat)
        .join(Delegation, Delegation.id == Localite.delegation_id)
        .join(Gouvernorat, Gouvernorat.id == Delegation.gouvernorat_id)
        .filter(func.lower(Localite.nom).like(ql))
        .order_by(Localite.nom)
        .limit(limit)
        .all()
    )
    for loc, delg, gov in loc_rows:
        results.append({
            "gouvernorat_id": gov.id, "gouvernorat": gov.nom,
            "delegation_id": delg.id, "delegation": delg.nom,
            "localite_id": loc.id, "localite": loc.nom,
        })

    remaining = limit - len(results)
    if remaining > 0:
        # 2 — Délégations
        delg_rows = (
            db.query(Delegation, Gouvernorat)
            .join(Gouvernorat, Gouvernorat.id == Delegation.gouvernorat_id)
            .filter(func.lower(Delegation.nom).like(ql))
            .order_by(Delegation.nom)
            .limit(remaining)
            .all()
        )
        for delg, gov in delg_rows:
            results.append({
                "gouvernorat_id": gov.id, "gouvernorat": gov.nom,
                "delegation_id": delg.id, "delegation": delg.nom,
                "localite_id": None, "localite": None,
            })

    remaining = limit - len(results)
    if remaining > 0:
        # 3 — Gouvernorats
        gov_rows = (
            db.query(Gouvernorat)
            .filter(func.lower(Gouvernorat.nom).like(ql))
            .order_by(Gouvernorat.nom)
            .limit(remaining)
            .all()
        )
        for gov in gov_rows:
            results.append({
                "gouvernorat_id": gov.id, "gouvernorat": gov.nom,
                "delegation_id": None, "delegation": None,
                "localite_id": None, "localite": None,
            })

    return results