from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, crud, database, models
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/properties",
    tags=["Properties"]
)
get_db = database.get_db

# ===============================
# CREATE PROPERTY
# ===============================
@router.post("/", response_model=schemas.PropertyRead)
def create_property(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_property(db, property)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating property: {str(e)}")

# ===============================
# READ ALL PROPERTIES
# ===============================
@router.get("/", response_model=list[schemas.PropertyRead])
def read_properties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_properties(db, skip=skip, limit=limit)

# ===============================
# READ PROPERTY BY ID
# ===============================
@router.get("/{property_id}", response_model=schemas.PropertyRead)
def read_property(property_id: int, db: Session = Depends(get_db)):
    property = crud.get_property(db, property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

# ===============================
# UPDATE PROPERTY
# ===============================
@router.put("/{property_id}", response_model=schemas.PropertyRead)
def update_property(
    property_id: int,
    update_data: schemas.PropertyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    prop = crud.get_property(db, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    annonce = db.query(models.Annonce).filter(models.Annonce.id == prop.annonce_id).first()
    if annonce and annonce.utilisateur_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Action interdite")
    updated = crud.update_property(db, property_id, update_data.dict(exclude_unset=True))
    return updated

# ===============================
# DELETE PROPERTY
# ===============================
@router.delete("/{property_id}")
def delete_property(property_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_property(db, property_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"detail": "Property deleted"}
