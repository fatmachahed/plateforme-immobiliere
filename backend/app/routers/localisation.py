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
    Searches gouvernorats, delegations, and localites by name.
    Returns the full hierarchy for the first match found.
    Priority: localite > delegation > gouvernorat
    """
    if not q or len(q.strip()) < 2:
        return None
    ql = f"%{q.strip().lower()}%"

    # 1 — Localité
    from app import models
    loc = db.query(models.Localite).filter(
        func.lower(models.Localite.nom).like(ql)
    ).first()
    if loc:
        delegation = db.query(models.Delegation).filter(models.Delegation.id == loc.delegation_id).first()
        gouvernorat = db.query(models.Gouvernorat).filter(models.Gouvernorat.id == delegation.gouvernorat_id).first() if delegation else None
        return {
            "type": "localite",
            "gouvernorat_id": gouvernorat.id if gouvernorat else None,
            "gouvernorat": gouvernorat.nom if gouvernorat else None,
            "delegation_id": delegation.id if delegation else None,
            "delegation": delegation.nom if delegation else None,
            "localite_id": loc.id,
            "localite": loc.nom,
        }

    # 2 — Délégation
    delg = db.query(models.Delegation).filter(
        func.lower(models.Delegation.nom).like(ql)
    ).first()
    if delg:
        gouvernorat = db.query(models.Gouvernorat).filter(models.Gouvernorat.id == delg.gouvernorat_id).first()
        return {
            "type": "delegation",
            "gouvernorat_id": gouvernorat.id if gouvernorat else None,
            "gouvernorat": gouvernorat.nom if gouvernorat else None,
            "delegation_id": delg.id,
            "delegation": delg.nom,
            "localite_id": None,
            "localite": None,
        }

    # 3 — Gouvernorat
    gov = db.query(models.Gouvernorat).filter(
        func.lower(models.Gouvernorat.nom).like(ql)
    ).first()
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

    return None