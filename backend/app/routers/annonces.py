from app.utils.auth import get_current_user # backend/app/routers/annonces.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, database                     
from app import models

router = APIRouter(
    prefix="/annonces",
    tags=["Annonces"]
)

get_db = database.get_db

# ===============================
# CREATE
# ===============================
@router.post("/", response_model=schemas.AnnonceRead)
def create_annonce(
    annonce: schemas.AnnonceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_annonce(
        db=db,
        annonce=annonce,
        utilisateur_id=current_user.id
    )

# ===============================
# READ ALL
# ===============================
@router.get("/", response_model=list[schemas.AnnonceRead])
def read_annonces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return crud.get_annonces(db, skip=skip, limit=limit)
    return crud.get_annonces_by_user(db, user_id=current_user.id, skip=skip, limit=limit)

# ===============================
# READ BY ID
# ===============================
@router.get("/{annonce_id}", response_model=schemas.AnnonceRead)
def read_annonce(annonce_id: int, db: Session = Depends(get_db)):
    annonce = crud.get_annonce(db, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    return annonce

# ===============================
# UPDATE
# ===============================
@router.put("/{annonce_id}", response_model=schemas.AnnonceRead)
def update_annonce(
    annonce_id: int,
    update_data: schemas.AnnonceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = crud.get_annonce(db, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")

    if annonce.utilisateur_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Action interdite")

    return crud.update_annonce(db, annonce_id, update_data.dict(exclude_unset=True))




# ===============================
# DELETE
# ===============================
@router.delete("/{annonce_id}")
def delete_annonce(
    annonce_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    annonce = crud.get_annonce(db, annonce_id)
    if not annonce:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")

    if annonce.utilisateur_id != current_user.id:
        raise HTTPException(status_code=403, detail="Action interdite")

    crud.delete_annonce(db, annonce_id)
    return {"detail": "Annonce supprimée"}

