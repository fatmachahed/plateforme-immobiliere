from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from app.enums import (
    RoleEnum, CategorieEnum, TypeBienEnum, EtatBienEnum, StatusEnum,
    TypeAppartementEnum, TypeVillaEnum, TypeOptionVillaEnum,
    TypeTerrainEnum, TitreFoncierEnum, DeviseEnum, StandingEnum
)
from sqlalchemy import Enum as SqlEnum


# ----------------------------------------
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
    nom          = Column(String, nullable=True)   # nom civil (particuliers / agents)
    prenom       = Column(String, nullable=True)   # prénom civil (particuliers / agents)
    nom_entreprise    = Column(String,  nullable=True)  # nom entreprise (agents)
    agence_id         = Column(Integer, ForeignKey("agencies.id"), nullable=True)  # agent rattaché à une agence
    must_change_password = Column(Boolean, default=False, nullable=True)  # forcer changement mdp à la connexion
    profile_picture = Column(String, nullable=True)  # URL ou path
    gouvernorat = Column(String, nullable=True)       # pour professionnels
    localite    = Column(String, nullable=True)       # pour professionnels
    adresse          = Column(String, nullable=True)   # adresse physique (agences)
    matricule_fiscal = Column(String, nullable=True)   # matricule fiscal professionnel
    registre_commerce= Column(String, nullable=True)   # registre de commerce professionnel
    is_blocked         = Column(Boolean, default=False, nullable=True)
    secteur_partenaire = Column(String, nullable=True)
    metier_artisan     = Column(String, nullable=True)
    # Qualification des prestataires / partenaires / artisans
    note_prestataire     = Column(Float,   nullable=True)   # note /5 attribuée au prestataire (moyenne)
    nombre_avis          = Column(Integer, default=0, nullable=True)  # nb d'avis ayant servi au calcul de la moyenne
    nombre_interventions = Column(Integer, default=0, nullable=True)  # nb d'interventions réalisées
    is_verified        = Column(Boolean, default=False, nullable=True)
    email_verify_token = Column(String, nullable=True)
    profil_user        = Column(String, nullable=True)   # etudiant | parent | couple
    profil_particulier = Column(String, nullable=True)   # etudiant | parent | couple | investisseur | ...
    sexe               = Column(String, nullable=True)   # homme | femme | non_precise
    objectif           = Column(String, nullable=True)   # achete | vend | loue | met_location
    promoteur_reference= Column(String, nullable=True, unique=True)  # ref 3 lettres promoteur
    last_login         = Column(DateTime, nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow, nullable=True)
    updated_at         = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)

    # [AJOUT] Relation vers les annonces de l'utilisateur
    annonces = relationship("Annonce", foreign_keys="[Annonce.utilisateur_id]", back_populates="utilisateur")
    favoris  = relationship("Favori", back_populates="user", cascade="all, delete-orphan")


# ----------------------------------------
# Localisation
# ----------------------------------------
class Gouvernorat(Base):
    __tablename__ = "gouvernorats"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, unique=True)
    delegations = relationship("Delegation", back_populates="gouvernorat")
    # [AJOUT] Relation inverse pour filtrer les annonces par gouvernorat
    annonces = relationship("Annonce", back_populates="gouvernorat")


class Delegation(Base):
    __tablename__ = "delegations"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String)
    gouvernorat_id = Column(Integer, ForeignKey("gouvernorats.id"))
    gouvernorat = relationship("Gouvernorat", back_populates="delegations")
    localites = relationship("Localite", back_populates="delegation")
    # [AJOUT] Relation inverse pour filtrer les annonces par délégation
    annonces = relationship("Annonce", back_populates="delegation")


class Localite(Base):
    __tablename__ = "localites"
    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String)
    delegation_id = Column(Integer, ForeignKey("delegations.id"))
    delegation = relationship("Delegation", back_populates="localites")
    # [AJOUT] Relation inverse pour filtrer les annonces par localité
    annonces = relationship("Annonce", back_populates="localite")


# ----------------------------------------
# Annonce
# ----------------------------------------
class Annonce(Base):
    __tablename__ = "annonces"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, nullable=True, unique=True, index=True)  # ex: TN0001, SF0012
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
    prix = Column(Numeric(12, 2))
    devise = Column(SqlEnum(DeviseEnum), default=DeviseEnum.DT)
    status = Column(SqlEnum(StatusEnum), default=StatusEnum.en_attente)
    refus_raisons  = Column(String, nullable=True)   # JSON list of reasons
    refus_message  = Column(String, nullable=True)   # free text from admin

    nb_pieces = Column(Integer, nullable=True)
    nb_chambres = Column(Integer, nullable=True)
    nb_salles_bain = Column(Integer, nullable=True)
    telephone = Column(String, nullable=True)

    exclusivite = Column(Boolean, default=False)
    modelisation_3d = Column(Boolean, default=False)
    anonyme = Column(Boolean, default=False)         # publication anonyme
    accompagnement = Column(Boolean, default=False)  # demande d'accompagnement professionnel
    accompagnement_agence_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # professionnel choisi
    # Immeuble
    hauteur_immeuble    = Column(String,  nullable=True)  # ex: "R+5"
    nb_appartements     = Column(Integer, nullable=True)  # nombre d'appartements
    orientation_immeuble= Column(String,  nullable=True)  # nord | sud | est | ouest …
    # Garage/Parking
    emplacement_garage = Column(String, nullable=True) # "en_exterieur" | "en_sous_sol"
    # Bureau
    type_bureau = Column(String, nullable=True)  # "H0" | "H+1" | ... | "Open Space"
    # Standing (appartement, villa, immeuble, local_commercial, bureau)
    standing = Column(SqlEnum(StandingEnum), nullable=True)  # economique | moyen_standing | haut_standing
    # [SUPPRIME] avec_photo → déductible depuis property.images (évite incohérence)
    # [SUPPRIME] annonce_promoteur / annonce_agent / annonce_particulier
    #            → déductible depuis utilisateur.role (évite redondance et incohérence)

    titre_foncier = Column(SqlEnum(TitreFoncierEnum), nullable=True)
    terrain_viabilise = Column(Boolean, default=False)
    open_space = Column(Boolean, default=False)
    annee_construction = Column(Integer, nullable=True)
    duree_type        = Column(String,  nullable=True)  # nuit/semaine/mois/annee
    duree_valeur      = Column(String,  nullable=True)  # ex: '3'
    capacite_accueil  = Column(Integer, nullable=True)  # nb personnes (vacances)

    # ── Terrain ──
    vocation_terrain  = Column(String, nullable=True)  # residentielle | commerciale | industrielle | agricole | touristique | mixte

    # ── Notes / réactions ──
    rating_avg   = Column(Float,   nullable=True)
    rating_count = Column(Integer, default=0)

    # ── Colocation ──
    colocation        = Column(Boolean, default=False)
    places_totales    = Column(Integer, nullable=True)
    places_occupees   = Column(Integer, nullable=True)
    profil_coloc      = Column(String,  nullable=True)
    genre_coloc       = Column(String,  nullable=True)   # ex: "homme,femme" or "homme"

    # Boost / abonnement (0=gratuit, 1=standard, 2=premium, 3=boost)
    boost_level = Column(Integer, default=0)
    boost_expires_at = Column(DateTime, nullable=True)
    # Spotlight — badge "À ne pas manquer" sur carte + résultats
    spotlight_active = Column(Boolean, default=False)
    spotlight_expires_at = Column(DateTime, nullable=True)
    views_count = Column(Integer, default=0)
    prix_ancien = Column(Numeric(12, 2), nullable=True)

    date_creation = Column(DateTime, default=datetime.utcnow)
    date_mise_a_jour = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # [AJOUT] Relations inverses vers localisation et utilisateur
    utilisateur = relationship("User", foreign_keys=[utilisateur_id], back_populates="annonces")
    accompagnement_agence = relationship("User", foreign_keys=[accompagnement_agence_id])
    gouvernorat = relationship("Gouvernorat", back_populates="annonces")
    delegation = relationship("Delegation", back_populates="annonces")
    localite = relationship("Localite", back_populates="annonces")

    # Relations vers caractéristiques (1-to-1)
    caractere_general = relationship("CaractereGeneral", back_populates="annonce", uselist=False)
    caracteristique_interieure = relationship("CaracteristiqueInterieure", back_populates="annonce", uselist=False)
    cuisine_equipee = relationship("CuisineEquipee", back_populates="annonce", uselist=False)
    etage_options = relationship("EtageOptions", back_populates="annonce", uselist=False)

    # [MODIFIE] 1-to-1 avec Property (une annonce = un bien immobilier)
    property = relationship("Property", back_populates="annonce", uselist=False)

    # Détail des chambres en colocation
    chambres_colocation = relationship("ChambreColocation", back_populates="annonce", cascade="all, delete-orphan")
    # Réactions / notes visiteurs
    reactions = relationship("AnnonceReaction", back_populates="annonce", cascade="all, delete-orphan")


# ----------------------------------------
# Demandes de convention (agence / promoteur)
# ----------------------------------------
class ConventionSubmission(Base):
    __tablename__ = "convention_submissions"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    type         = Column(String, nullable=False)   # "agence" | "promoteur"
    status       = Column(String, default="soumis") # soumis / accepte / refuse
    form_data    = Column(String, nullable=True)    # JSON string
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


# ----------------------------------------
# Réactions / notes anonymes sur annonce
# ----------------------------------------
class AnnonceReaction(Base):
    __tablename__ = "annonce_reactions"
    id          = Column(Integer, primary_key=True, index=True)
    annonce_id  = Column(Integer, ForeignKey("annonces.id", ondelete="CASCADE"), nullable=False)
    session_key = Column(String(120), nullable=False)
    note        = Column(Integer, nullable=False)
    created_at  = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("annonce_id", "session_key", name="uq_reaction_annonce_session"),)
    annonce = relationship("Annonce", back_populates="reactions")


# ----------------------------------------
# Chambres colocation
# ----------------------------------------
class ChambreColocation(Base):
    __tablename__ = "chambres_colocation"
    id             = Column(Integer, primary_key=True, index=True)
    annonce_id     = Column(Integer, ForeignKey("annonces.id", ondelete="CASCADE"), nullable=False)
    numero_chambre  = Column(Integer, nullable=False)
    capacite        = Column(Integer, nullable=False, default=1)
    places_occupees = Column(Integer, nullable=False, default=0)
    prix_par_place  = Column(Float,   nullable=True,  default=0)

    annonce = relationship("Annonce", back_populates="chambres_colocation")


# ----------------------------------------
# Caractéristiques supplémentaires
# ----------------------------------------
class CaractereGeneral(Base):
    __tablename__ = "caractere_general"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"))
    annonce = relationship("Annonce", back_populates="caractere_general")
    jardin = Column(Boolean, default=False)
    surface_jardin = Column(Float, nullable=True)
    terrasse = Column(Boolean, default=False)
    surface_terrasse = Column(Float, nullable=True)
    balcon = Column(Boolean, default=False)
    parking = Column(Boolean, default=False)
    garage = Column(Boolean, default=False)
    nb_places_garage = Column(Integer, nullable=True)
    ascenseur = Column(Boolean, default=False)
    vue_mer = Column(Boolean, default=False)
    vue_montagne = Column(Boolean, default=False)
    vue_foret = Column(Boolean, default=False)
    piscine = Column(Boolean, default=False)
    surface_piscine = Column(Float, nullable=True)
    concierge = Column(Boolean, default=False)
    cellier = Column(Boolean, default=False)
    meuble = Column(Boolean, default=False)
    facade_exterieure = Column(Boolean, default=False)
    digicode = Column(Boolean, default=False)
    interphone = Column(Boolean, default=False)
    gardien = Column(Boolean, default=False)
    travaux_prevoir = Column(Boolean, default=False)
    relie_onas = Column(Boolean, default=False)
    animaux_admis = Column(Boolean, default=False)


class CaracteristiqueInterieure(Base):
    __tablename__ = "caracteristique_interieure"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"))
    annonce = relationship("Annonce", back_populates="caracteristique_interieure")
    salon_americain = Column(Boolean, default=False)
    antenne_parabolique = Column(Boolean, default=False)
    # [CONSERVE] fibre_optique uniquement ici (supprimé de CaractereGeneral)
    fibre_optique = Column(Boolean, default=False)
    cheminee = Column(Boolean, default=False)
    climatisation = Column(Boolean, default=False)
    chauffage_central = Column(Boolean, default=False)
    securite = Column(Boolean, default=False)
    vitrage_aluminium = Column(Boolean, default=False)
    double_vitrage = Column(Boolean, default=False)
    porte_blink = Column(Boolean, default=False)
    internet = Column(Boolean, default=False)
    tv = Column(Boolean, default=False)


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
# Property et images
# ----------------------------------------
class Property(Base):
    __tablename__ = "properties"
    id = Column(Integer, primary_key=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id"), unique=True)  # [AJOUT] unique=True → garantit 1-to-1
    annonce = relationship("Annonce", back_populates="property")
    address = Column(String)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    image_principale = Column(String, nullable=True)  # URL aperçu rapide (gardé intentionnellement)

    images = relationship("PropertyImage", back_populates="property")


class PropertyImage(Base):
    __tablename__ = "property_images"
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    property = relationship("Property", back_populates="images")
    image = Column(String)


# ----------------------------------------
# Favoris
# ----------------------------------------
class Favori(Base):
    __tablename__ = "favoris"
    id = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    annonce_id = Column(Integer, ForeignKey("annonces.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "annonce_id", name="uq_favori_user_annonce"),)

    user    = relationship("User",    back_populates="favoris")
    annonce = relationship("Annonce")


# ----------------------------------------
# Agences
# ----------------------------------------
class Agency(Base):
    __tablename__ = "agencies"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    nom = Column(String, nullable=False)
    email = Column(String, nullable=True)
    telephone = Column(String, nullable=True)
    adresse = Column(String, nullable=True)
    matricule = Column(String, nullable=True)
    reference = Column(String, unique=True, nullable=True, index=True)
    frais_mensuel = Column(Float, default=50.0)
    abonnement_actif = Column(Boolean, default=True)
    abonnement_expire_at = Column(DateTime, nullable=True)
    note_admin = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], backref="agency")


# ----------------------------------------
# Demandes de contact anonyme
# ----------------------------------------
class ContactRequest(Base):
    __tablename__ = "contact_requests"
    id           = Column(Integer, primary_key=True)
    annonce_id   = Column(Integer, ForeignKey("annonces.id"), nullable=False)
    nom          = Column(String, nullable=False)
    email        = Column(String, nullable=True)
    telephone    = Column(String, nullable=True)
    message      = Column(String, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    lu           = Column(Boolean, default=False)

    annonce = relationship("Annonce")


# ----------------------------------------
# Recherches sauvegardées (alertes acheteur/locataire)
# ----------------------------------------
class SavedSearch(Base):
    __tablename__ = "saved_searches"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nom          = Column(String, nullable=True)
    criteres     = Column(String, nullable=False)  # JSON string des filtres
    email_alert  = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="saved_searches")


# ----------------------------------------
# Messages de contact (formulaire Contact)
# ----------------------------------------
# ----------------------------------------
# Alertes baisse de prix
# ----------------------------------------
class PrixAlert(Base):
    __tablename__ = "prix_alerts"
    id         = Column(Integer, primary_key=True, index=True)
    annonce_id = Column(Integer, ForeignKey("annonces.id", ondelete="CASCADE"), nullable=False)
    email      = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("annonce_id", "email", name="uq_prix_alert"),)

    annonce = relationship("Annonce", backref="prix_alerts", foreign_keys=[annonce_id])


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id         = Column(Integer, primary_key=True)
    nom        = Column(String, nullable=False)
    email      = Column(String, nullable=True)
    sujet      = Column(String, nullable=True)
    message    = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ----------------------------------------
# Demandes d'intervention (prestataires / partenaires)
# ----------------------------------------
class DemandeIntervention(Base):
    __tablename__ = "demandes_intervention"
    id               = Column(Integer, primary_key=True, index=True)
    prestataire_id   = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    client_user_id   = Column(Integer, ForeignKey("users.id"), nullable=True)  # si le client est connecté
    client_nom       = Column(String, nullable=True)
    client_email     = Column(String, nullable=True)
    client_telephone = Column(String, nullable=True)
    message          = Column(String, nullable=True)
    status           = Column(String, default="en_attente")  # en_attente | realisee
    created_at       = Column(DateTime, default=datetime.utcnow)

    prestataire = relationship("User", foreign_keys=[prestataire_id])


# ----------------------------------------
# Notes des prestataires (par les clients ayant bénéficié d'une intervention réalisée)
# ----------------------------------------
class PrestataireReaction(Base):
    __tablename__ = "prestataire_reactions"
    id             = Column(Integer, primary_key=True, index=True)
    prestataire_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    demande_id     = Column(Integer, ForeignKey("demandes_intervention.id", ondelete="CASCADE"), nullable=False, unique=True)
    client_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note           = Column(Integer, nullable=False)  # 1 à 5
    created_at     = Column(DateTime, default=datetime.utcnow)

    prestataire = relationship("User", foreign_keys=[prestataire_id])
    demande     = relationship("DemandeIntervention", foreign_keys=[demande_id])
