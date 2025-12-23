from fastapi import APIRouter
from app.models import (
    TypeBienEnum,
    CategorieEnum,
    EtatBienEnum,
    TypeAppartementEnum,
    TypeVillaEnum,
    TypeTerrainEnum,
    DeviseEnum
)

router = APIRouter(prefix="/catalogue", tags=["Catalogue"])

def enum_to_list(enum):
    return [{"value": e.value, "label": e.name.replace("_", " ").title()} for e in enum]

@router.get("/type-bien")
def get_type_bien():
    return enum_to_list(TypeBienEnum)

@router.get("/categorie")
def get_categories():
    return enum_to_list(CategorieEnum)

@router.get("/etat-bien")
def get_etat_bien():
    return enum_to_list(EtatBienEnum)

@router.get("/type-appartement")
def get_type_appartement():
    return enum_to_list(TypeAppartementEnum)

@router.get("/type-villa")
def get_type_villa():
    return enum_to_list(TypeVillaEnum)
