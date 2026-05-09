from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ------------------------------
# UTILISATEUR
# ------------------------------
class UserBase(BaseModel):
    username: str
    email: str
    role: Optional[str] = "particulier"
    phone_number: Optional[str] = None
    profile_picture: Optional[str] = None

class UserCreate(UserBase):
    password: str  # mot de passe en clair pour la création

class UserRead(UserBase):
    id: int
    class Config:
        orm_mode = True

class UserLogin(BaseModel):
    email: str
    password: str

# ------------------------------
# LOCALISATION
# ------------------------------
class GouvernoratBase(BaseModel):
    nom: str

class GouvernoratRead(GouvernoratBase):
    id: int
    delegations: List['DelegationRead'] = []
    class Config:
        orm_mode = True

class DelegationBase(BaseModel):
    nom: str
    gouvernorat_id: int

class DelegationRead(DelegationBase):
    id: int
    localites: List['LocaliteRead'] = []
    class Config:
        orm_mode = True

class LocaliteBase(BaseModel):
    nom: str
    delegation_id: int

class LocaliteRead(LocaliteBase):
    id: int
    class Config:
        orm_mode = True

# ------------------------------
# ANNONCE
# ------------------------------
class AnnonceBase(BaseModel):
    # utilisateur_id: int
    gouvernorat_id: int
    delegation_id: int
    localite_id: int
    categorie: str
    type_bien: str
    titre: str
    description: Optional[str] = None
    superficie: float
    prix: float
    devise: str = "TND"
    status: str = "en_attente"

class AnnonceCreate(AnnonceBase):
    type_appartement: Optional[str] = None
    type_villa: Optional[str] = None
    type_terrain: Optional[str] = None
    etat_bien: Optional[str] = None
    etage: Optional[int] = None
    type_option_villa: Optional[str] = None
    nb_pieces: Optional[int] = None
    nb_chambres: Optional[int] = None
    nb_salles_bain: Optional[int] = None
    telephone: Optional[str] = None
    annee_construction: Optional[int] = None


class AnnonceUpdate(BaseModel):
    gouvernorat_id: Optional[int] = None
    delegation_id: Optional[int] = None
    localite_id: Optional[int] = None
    categorie: Optional[str] = None
    type_bien: Optional[str] = None
    titre: Optional[str] = None
    description: Optional[str] = None
    superficie: Optional[float] = None
    prix: Optional[float] = None
    devise: Optional[str] = None
    status: Optional[str] = None
    type_appartement: Optional[str] = None
    type_villa: Optional[str] = None
    type_terrain: Optional[str] = None
    etat_bien: Optional[str] = None
    etage: Optional[int] = None
    type_option_villa: Optional[str] = None
    nb_pieces: Optional[int] = None
    nb_chambres: Optional[int] = None
    nb_salles_bain: Optional[int] = None
    telephone: Optional[str] = None
    annee_construction: Optional[int] = None

    class Config:
        from_attributes = True

class PropertyRead(BaseModel):
    id: int
    annonce_id: int
    address: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    image_principale: Optional[str] = None

    class Config:
        orm_mode = True

class AnnonceRead(AnnonceBase):
    id: int
    date_creation: datetime
    date_mise_a_jour: datetime
    boost_level: int = 0
    views_count: int = 0
    properties: List[PropertyRead] = []

    class Config:
        orm_mode = True

class AnnoncePublic(BaseModel):
    """Données publiques pour l'affichage liste/carte."""
    id: int
    titre: str
    prix: float
    devise: str
    superficie: float
    categorie: str
    type_bien: str
    boost_level: int = 0
    views_count: int = 0
    date_creation: datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_principale: Optional[str] = None
    gouvernorat: Optional[str] = None
    delegation: Optional[str] = None
    nb_pieces: Optional[int] = None
    nb_chambres: Optional[int] = None

    class Config:
        from_attributes = True

class MapPin(BaseModel):
    """Données légères pour les punaises de carte."""
    id: int
    titre: str
    prix: float
    devise: str
    type_bien: str
    boost_level: int = 0
    latitude: float
    longitude: float

    class Config:
        orm_mode = True

# ------------------------------
# PROPERTY & IMAGES
# ------------------------------
class PropertyBase(BaseModel):
    annonce_id: int
    address: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    image_principale: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_principale: Optional[str] = None

    class Config:
        from_attributes = True

class PropertyRead(PropertyBase):
    id: int
    class Config:
        orm_mode = True

class PropertyImageBase(BaseModel):
    property_id: int
    image: str

class PropertyImageCreate(PropertyImageBase):
    pass

class PropertyImageRead(PropertyImageBase):
    id: int
    class Config:
        orm_mode = True

# ------------------------------
# AUTHENTIFICATION / JWT
# ------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    


from enum import Enum

class EnumResponse(BaseModel):
    value: str
    label: str

