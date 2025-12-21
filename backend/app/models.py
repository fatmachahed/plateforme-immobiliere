from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime  
from app.enums import (
    RoleEnum, CategorieEnum, TypeBienEnum, EtatBienEnum, StatusEnum,
    TypeAppartementEnum, TypeVillaEnum, TypeOptionVillaEnum,
    TypeTerrainEnum, TitreFoncierEnum, DeviseEnum
)
from sqlalchemy import Enum as SqlEnum            # ----------------------------------------
# Utilisateur
# ----------------------------------------
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SqlEnum(RoleEnum), default=RoleEnum.particulier)
    phone_number = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)  # URL ou path

# ----------------------------------------
# Localisation
# ----------------------------------------
class Gouvernorat(Base):
    __tablename__ = "gouvernorats"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, unique=True)
    delegations = relationship("Delegation", back_populates="gouvernorat")

class Delegation(Base):
    __tablename__ = "delegations"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String)
    gouvernorat_id = Column(Integer, ForeignKey("gouvernorats.id"))
    gouvernorat = relationship("Gouvernorat", back_populates="delegations")
    localites = relationship("Localite", back_populates="delegation")

class Localite(Base):
    __tablename__ = "localites"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String)
    delegation_id = Column(Integer, ForeignKey("delegations.id"))
    delegation = relationship("Delegation", back_populates="localites")

# ----------------------------------------
# Annonce
# ----------------------------------------
class Annonce(Base):
    __tablename__ = "annonces"
    id = Column(Integer, primary_key=True, index=True)
    utilisateur_id = Column(Integer, ForeignKey("users.id"))
    gouvernorat_id = Column(Integer, ForeignKey("gouvernorats.id"))
    delegation_id = Column(Integer, ForeignKey("delegations.id"))
    localite_id = Column(Integer, ForeignKey("localites.id"))

    categorie = Column(SqlEnum(CategorieEnum), nullable=False)
    type_bien = Column(SqlEnum(TypeBienEnum), nullable=False)
    type_appartement = Column(SqlEnum(TypeAppartementEnum), nullable=True)
    type_villa = Column(SqlEnum(TypeVillaEnum), nullable=True)
    type_terrain = Column(SqlEnum(TypeTerrainEnum), nullable=True)
    etat_bien = Column(SqlEnum(EtatBienEnum))
    etage = Column(Integer, nullable=True)
    type_option_villa = Column(SqlEnum(TypeOptionVillaEnum), nullable=True)
    titre = Column(String, nullable=False)
    description = Column(String, nullable=True)
    superficie = Column(Float)
    prix = Column(Numeric(12,2))
    devise = Column(SqlEnum(DeviseEnum), default=DeviseEnum.TND)
    status = Column(SqlEnum(StatusEnum), default=StatusEnum.en_attente)

    nb_pieces = Column(Integer, nullable=True)
    nb_chambres = Column(Integer, nullable=True)
    nb_salles_bain = Column(Integer, nullable=True)
    telephone = Column(String, nullable=True)

    exclusivite = Column(Boolean, default=False)
    modelisation_3d = Column(Boolean, default=False)
    avec_photo = Column(Boolean, default=False)
    annonce_promoteur = Column(Boolean, default=False)
    annonce_agent = Column(Boolean, default=False)
    annonce_particulier = Column(Boolean, default=False)

    titre_foncier = Column(SqlEnum(TitreFoncierEnum), nullable=True)
    terrain_viabilise = Column(Boolean, default=False)
    open_space = Column(Boolean, default=False)
    annee_construction = Column(Integer, nullable=True)

    date_creation = Column(DateTime, default=datetime.utcnow)
    date_mise_a_jour = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    caractere_general = relationship("CaractereGeneral", back_populates="annonce", uselist=False)
    caracteristique_interieure = relationship("CaracteristiqueInterieure", back_populates="annonce", uselist=False)
    cuisine_equipee = relationship("CuisineEquipee", back_populates="annonce", uselist=False)
    etage_options = relationship("EtageOptions", back_populates="annonce", uselist=False)
    properties = relationship("Property", back_populates="annonce")

# ----------------------------------------
# Caractéristiques supplémentaires
# ----------------------------------------
class CaractereGeneral(Base):
    __tablename__ = "caractere_general"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"))
    annonce = relationship("Annonce", back_populates="caractere_general")
    jardin = Column(Boolean, default=False)
    terrasse = Column(Boolean, default=False)
    balcon = Column(Boolean, default=False)
    parking = Column(Boolean, default=False)
    garage = Column(Boolean, default=False)
    ascenseur = Column(Boolean, default=False)
    vue_mer = Column(Boolean, default=False)
    vue_montagne = Column(Boolean, default=False)
    vue_foret = Column(Boolean, default=False)
    piscine = Column(Boolean, default=False)
    concierge = Column(Boolean, default=False)
    cellier = Column(Boolean, default=False)
    meuble = Column(Boolean, default=False)
    facade_exterieure = Column(Boolean, default=False)
    digicode = Column(Boolean, default=False)
    interphone = Column(Boolean, default=False)
    gardien = Column(Boolean, default=False)
    travaux_prevoir = Column(Boolean, default=False)
    fibre_optique = Column(Boolean, default=False)
    relie_onas = Column(Boolean, default=False)

class CaracteristiqueInterieure(Base):
    __tablename__ = "caracteristique_interieure"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"))
    annonce = relationship("Annonce", back_populates="caracteristique_interieure")
    salon_americain = Column(Boolean, default=False)
    antenne_parabolique = Column(Boolean, default=False)
    fibre_optique = Column(Boolean, default=False)
    cheminee = Column(Boolean, default=False)
    climatisation = Column(Boolean, default=False)
    chauffage_central = Column(Boolean, default=False)
    securite = Column(Boolean, default=False)
    vitrage_aluminium = Column(Boolean, default=False)
    double_vitrage = Column(Boolean, default=False)
    porte_blink = Column(Boolean, default=False)

class CuisineEquipee(Base):
    __tablename__ = "cuisine_equipee"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"))
    annonce = relationship("Annonce", back_populates="cuisine_equipee")
    cuisine_equipee = Column(Boolean, default=False)
    refrigerateur = Column(Boolean, default=False)
    four = Column(Boolean, default=False)
    machine_laver = Column(Boolean, default=False)
    microondes = Column(Boolean, default=False)

class EtageOptions(Base):
    __tablename__ = "etage_options"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"))
    annonce = relationship("Annonce", back_populates="etage_options")
    premier_etage = Column(Boolean, default=False)
    dernier_etage = Column(Boolean, default=False)
    rez_de_chaussee = Column(Boolean, default=False)
    plain_pied = Column(Boolean, default=False)

# ----------------------------------------
# Properties et images
# ----------------------------------------
class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"))
    annonce = relationship("Annonce", back_populates="properties")
    address = Column(String)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    image_principale = Column(String, nullable=True)  # URL ou chemin

    # relation vers PropertyImage
    images = relationship("PropertyImage", back_populates="property")


class PropertyImage(Base):
    __tablename__ = "property_images"
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    property = relationship("Property", back_populates="images")
    image = Column(String)

