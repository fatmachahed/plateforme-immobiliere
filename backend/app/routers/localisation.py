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