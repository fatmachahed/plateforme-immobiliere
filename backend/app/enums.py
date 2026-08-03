import enum

class RoleEnum(str, enum.Enum):
    admin = "admin"
    promoteur = "promoteur"
    agence = "agence"
    agent = "agent"
    particulier = "particulier"
    professionnel = "professionnel"
    partenaire = "partenaire"
    manager_commercial = "manager_commercial"  # rôle interne : suivi de l'apport de leads par commercial

class CategorieEnum(str, enum.Enum):
    vente = "vente"
    location = "location"
    vacances = "vacances"

class TypeBienEnum(str, enum.Enum):
    # NOTE: PostgreSQL migration needed:
    #   ALTER TYPE typebienenum ADD VALUE 'villa_maison';
    #   ALTER TYPE typebienenum ADD VALUE 'immobiliers_divers';
    #   ALTER TYPE typebienenum ADD VALUE 'depot_stockage';
    #   ALTER TYPE typebienenum ADD VALUE 'batiment_industriel';
    #   (bord_eau and maison kept in DB for backward compat, but new entries use villa_maison/immobiliers_divers)
    appartement = "appartement"
    duplex = "duplex"
    villa = "villa"
    villa_maison = "villa_maison"
    bureau = "bureau"
    local_commercial = "local_commercial"
    terrain = "terrain"
    ferme_agricole = "ferme_agricole"
    ferme          = "ferme"          # legacy — migré vers ferme_agricole
    immobiliers_divers = "immobiliers_divers"
    immeuble           = "immeuble"
    garage_parking     = "garage_parking"
    depot_stockage     = "depot_stockage"
    batiment_industriel = "batiment_industriel"

class EtatBienEnum(str, enum.Enum):
    nouveau = "nouveau"
    bon_etat = "bon_etat"
    a_renover = "a_renover"
    cours_construction = "cours_construction"

class StatusEnum(str, enum.Enum):
    en_attente = "en_attente"
    approuvee = "approuvee"
    refusee = "refusee"
    vendue = "vendue"
    louee = "louee"

class TypeAppartementEnum(str, enum.Enum):
    studio = "studio"
    s0 = "s0"
    s1 = "s+1"
    s2 = "s+2"
    s3 = "s+3"
    s4 = "s+4"
    duplex = "duplex"
    penthouse = "penthouse"

class TypeVillaEnum(str, enum.Enum):
    r = "r"
    r1 = "r+1"
    r2 = "r+2"
    r3 = "r+3"
    r4 = "r+4"

class TypeOptionVillaEnum(str, enum.Enum):
    aucun = "aucun"
    sous_sol = "sous-sol"
    rez_de_jardin = "rez-de-jardin"

class TypeTerrainEnum(str, enum.Enum):
    agricole = "agricole"
    nu = "nu"
    zone_verte = "zone_verte"
    lotissement = "lotissement"
    commercial = "commercial"
    industriel = "industriel"

class TitreFoncierEnum(str, enum.Enum):
    aucun = "aucun"
    individuel = "individuel"
    indivision = "indivision"

class DeviseEnum(str, enum.Enum):
    DT  = "DT"
    TND = "TND"  # legacy alias — ancienne valeur en base, conservée pour compatibilité
    EUR = "EUR"
    USD = "USD"

class StandingEnum(str, enum.Enum):
    economique      = "economique"
    moyen_standing  = "moyen_standing"
    haut_standing   = "haut_standing"
