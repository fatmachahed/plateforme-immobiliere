# Read as Latin-1 so ALL bytes are preserved:
# - raw Latin-1 bytes (0xE8='e') stay as their correct char
# - U+FFFD (EF BF BD) becomes 'i?½' (3 Latin-1 chars)

INFILE  = r'C:\Users\ASUS ZenBook\plateforme-immobiliere\frontend\real_estate_front\src\pages\CreerAnnonce.jsx'

with open(INFILE, 'rb') as fh:
    raw = fh.read()

# Decode as Latin-1 (lossless for any byte sequence)
text = raw.decode('latin-1')

# U+FFFD bytes EF BF BD decode as Latin-1 to these 3 chars:
F = '\xef\xbf\xbd'   # = 'ï¿½'  — represents one corrupted char slot

before = text.count(F)
print(f'FFFD patterns before: {before}')

fixes = [
    # === TYPE DE BIEN ===
    (f'D{F}p{F}t de stockage',   'Dépôt de stockage'),
    (f'd{F}p{F}t de stockage',   'dépôt de stockage'),

    # === ÉTAT DU BIEN ===
    (f'Bon {F}tat',              'Bon état'),
    (f'{F} r{F}nover',           'À rénover'),

    # price eval bar
    (f'Aucune {F}valuation',     'Aucune évaluation'),
    (f'Prix tr{F}s {F}lev{F}',   'Prix très élevé'),
    (f'Prix {F}lev{F}',          'Prix élevé'),
    (f'Prix {F}quitable',        'Prix équitable'),
    (f'Tr{F}s bon prix',         'Très bon prix'),

    # === ANCIENNETÉ ===
    (f'Anciennet{F} du bien',    'Ancienneté du bien'),
    (f"D'un an {F} 5 ans",       "D'un an à 5 ans"),
    (f'De 5 ans {F} 10 ans',     'De 5 ans à 10 ans'),
    (f'De 10 ans {F} 20 ans',    'De 10 ans à 20 ans'),
    (f'De 20 ans {F} 30 ans',    'De 20 ans à 30 ans'),
    (f'De 30 ans {F} 50 ans',    'De 30 ans à 50 ans'),
    (f'De 50 ans {F} 70 ans',    'De 50 ans à 70 ans'),
    (f'De 70 ans {F} 100 ans',   'De 70 ans à 100 ans'),

    # === STEPS LABELS ===
    (f'Type & Caract{F}ristiques',  'Type & Caractéristiques'),
    (f'Pr{F}sentation',             'Présentation'),
    (f'Pr{F}visualisation',         'Prévisualisation'),
    (f'R{F}capitulatif',            'Récapitulatif'),
    (f'Pr{F}c{F}dent',              'Précédent'),

    # === BANNIÈRE ===
    (f'{F} r{F}diger, valoriser et acc{F}l{F}rer', 'à rédiger, valoriser et accélérer'),
    (f'Notre {F}quipe peut vous aider',  'Notre équipe peut vous aider'),
    (f'Oui, je veux {F}tre accompagn{F}(e)', 'Oui, je veux être accompagné(e)'),
    (f'Banni{F}re accompagnement',       'Bannière accompagnement'),

    # === LEAFLET ===
    (f'{F} OpenStreetMap',           '© OpenStreetMap'),
    (f'D{F}placez l\'emplacement',   'Déplacez l\'emplacement'),

    # === SELECT PLACEHOLDERS ===
    (f'S{F}lectionner{F}',   'Sélectionner…'),
    (f'S{F}lectionner… *', 'Sélectionner… *'),
    (f'S{F}lectionner…', 'Sélectionner…'),
    (f'S{F}lectionner',      'Sélectionner'),
    (f'S{F}lectionnez{F}',   'Sélectionnez…'),
    (f'S{F}lectionnez…', 'Sélectionnez…'),
    (f'S{F}lectionnez',      'Sélectionnez'),
    (f'Toutes les d{F}l{F}gations', 'Toutes les délégations'),
    (f'Toutes les localit{F}s',     'Toutes les localités'),

    # === ÉTAGE ===
    (f'{F}tage du bien',         'Étage du bien'),
    (f'RDC (Rez-de-chauss{F}e)', 'RDC (Rez-de-chaussée)'),
    (f'1er {F}tage',             '1er étage'),
    (f'2{F}me {F}tage',          '2ème étage'),
    (f'3{F}me {F}tage',          '3ème étage'),
    (f'4{F}me+',                 '4ème+'),
    (f'rez-de-chauss{F}e',       'rez-de-chaussée'),
    (f'e {F}tage',               'e étage'),

    # === ÉTAT SECTION ===
    (f'{F}tat du bien',   'État du bien'),

    # === DESCRIPTION GENERATION - ETAT ===
    (f'Livr{F} en {F}tat neuf',           'Livré en état neuf'),
    (f'excellent {F}tat g{F}n{F}ral',     'excellent état général'),
    (f'pr{F}t {F} l\'emm{F}nagement',     'prêt à l\'emménagement'),
    (f'N{F}cessitant des travaux de r{F}novation', 'Nécessitant des travaux de rénovation'),
    (f'livraison est pr{F}vue prochainement', 'livraison est prévue prochainement'),

    # === LOCALISATION ===
    (f'D{F}l{F}gation',          'Délégation'),
    (f'Localit{F}',              'Localité'),
    (f'Zone g{F}ographique',     'Zone géographique'),

    # === PIÈCES ===
    (f'Pi{F}ces & espaces',   'Pièces & espaces'),
    (f'Pi{F}ce(s)',            'Pièce(s)'),
    (f'pi{F}ce',              'pièce'),
    (f'Pi{F}ces',             'Pièces'),

    # === CARACTÉRISTIQUES ===
    (f'Caract{F}ristiques',          'Caractéristiques'),
    (f'Sp{F}cificit{F}s commerciales', 'Spécificités commerciales'),
    (f'Capacit{F} d\'accueil',       'Capacité d\'accueil'),

    # === FEATURES ===
    (f'Vue sur for{F}t',             'Vue sur forêt'),
    (f'vue sur la for{F}t',          'vue sur la forêt'),
    (f'Meubl{F}',                    'Meublé'),
    (f'Cuisine {F}quip{F}e',         'Cuisine équipée'),
    (f'cuisine enti{F}rement {F}quip{F}e', 'cuisine entièrement équipée'),
    (f'Chemin{F}e',                  'Cheminée'),
    (f'Porte blind{F}e',             'Porte blindée'),
    (f'S{F}curit{F}',                'Sécurité'),
    (f'Machine {F} laver',           'Machine à laver'),
    (f'Salon am{F}ricain',           'Salon américain'),
    (f'Reli{F} ONAS',                'Relié ONAS'),

    # === feat.includes ===
    (f'feat.includes("Meubl{F}")',              'feat.includes("Meublé")'),
    (f'feat.includes("Cuisine {F}quip{F}e")',   'feat.includes("Cuisine équipée")'),
    (f'feat.includes("Vue sur for{F}t")',        'feat.includes("Vue sur forêt")'),
    (f'feat.includes("Chemin{F}e")',             'feat.includes("Cheminée")'),
    (f'feat.includes("Porte blind{F}e")',        'feat.includes("Porte blindée")'),
    (f'feat.includes("S{F}curit{F}")',           'feat.includes("Sécurité")'),
    (f'feat.includes("Machine {F} laver")',      'feat.includes("Machine à laver")'),
    (f'feat.includes("Salon am{F}ricain")',      'feat.includes("Salon américain")'),
    (f'feat.includes("Reli{F} ONAS")',           'feat.includes("Relié ONAS")'),

    # === TERRAIN VOCATION ===
    (f'R{F}sidentielle',                 'Résidentielle'),
    (f'Touristique / H{F}teli{F}re',     'Touristique / Hôtelière'),
    (f'Touristique/H{F}teli{F}re',       'Touristique/Hôtelière'),
    (f'Non d{F}finie',                   'Non définie'),
    (f'non_d{F}finie',                   'non_definie'),
    (f'Incompatibilit{F}',               'Incompatibilité'),

    # === EXTÉRIEUR ===
    (f'En ext{F}rieur',       'En extérieur'),
    (f'Espaces ext{F}rieurs', 'Espaces extérieurs'),
    (f'Commodit{F}s',         'Commodités'),
    (f'Int{F}rieur &amp; {F}quipements', 'Intérieur &amp; équipements'),

    # === PRÉSENTATION ===
    (f'IA Assist{F}e',                   'IA Assistée'),
    (f'Sugg{F}rer un titre avec l\'IA',  'Suggérer un titre avec l\'IA'),
    (f'D{F}crivez votre bien',           'Décrivez votre bien'),
    (f'luminosit{F}',                    'luminosité'),
    (f'points forts{F}',                 'points forts…'),

    # === M² ===
    (f'/m{F}',          '/m²'),
    (f'(m{F})',         '(m²)'),
    (f'Prix au m{F}',   'Prix au m²'),
    (f' m{F}',          ' m²'),
    (f'placeholder="m{F}"', 'placeholder="m²"'),
    (f'Surface (m{F})', 'Surface (m²)'),

    # === PHOTOS ===
    (f'Glissez-d{F}posez',                 'Glissez-déposez'),
    (f'ou cliquez pour parcourir {F} JPG', 'ou cliquez pour parcourir — JPG'),

    # === ÉVALUATION ===
    (f'{F}valuation de march{F}', 'Évaluation de marché'),
    (f'Aper{F}u en direct',       'Aperçu en direct'),
    (f'Titre de l\'annonce{F}',   "Titre de l'annonce…"),

    # === AI STRIP ===
    (f'G{F}n{F}rer avec l\'IA',  'Générer avec l\'IA'),
    (f'G{F}n{F}ration{F}',       'Génération…'),
    (f'R{F}daction rapide',      'Rédaction rapide'),
    (f'G{F}n{F}rer',             'Générer'),

    # === TOAST MESSAGES ===
    (f'Veuillez s{F}lectionner', 'Veuillez sélectionner'),
    (f'Veuillez compl{F}ter',    'Veuillez compléter'),
    (f'Dur{F}e',                 'Durée'),
    (f's{F}lectionner',          'sélectionner'),

    # === DESCRIPTION ===
    (f'id{F}alement situ{F}',              'idéalement situé'),
    (f'en location saisonni{F}re',         'en location saisonnière'),
    (f'{F} louer',                         'à louer'),
    (f'{F} vendre',                        'à vendre'),
    (f'ce bien b{F}n{F}ficie de',          'ce bien bénéficie de'),
    (f'opportunit{F} {F} saisir',          'opportunité à saisir'),
    (f"N'h{F}sitez pas",                   "N'hésitez pas"),
    (f'{F} vocation commerciale',          'à vocation commerciale'),
    (f'{F} vocation industrielle',         'à vocation industrielle'),
    (f'id{F}alement',                      'idéalement'),

    # === ÉCONOMIQUE ===
    (f'{F}conomique',  'Économique'),

    # === VALIDATION ===
    (f'{F}tape',      'étape'),
    (f'trop {F}lev{F}', 'trop élevé'),
    (f'au m² doit {F}tre sup{F}rieur {F} 0', 'au m² doit être supérieur à 0'),

    # === PREVIEW / CHARGEMENT ===
    (f'Chargement de l\'annonce{F}', "Chargement de l'annonce…"),
    (f'Cr{F}er une annonce',         'Créer une annonce'),

    # === IDENTITY ===
    (f'Identit{F} masqu{F}e',        'Identité masquée'),
    (f'Propri{F}taire',              'Propriétaire'),
    (f'soumise {F} une approbation', 'soumise à une approbation'),
    (f'd{F}lai : 24h',               'délai : 24h'),
    (f'publi{F}e',                   'publiée'),
    (f'Votre nom et coordonn{F}es',  'Votre nom et coordonnées'),

    # === NUITÉE ===
    (f'Par nuit{F}e',   'Par nuitée'),
    (f'nuit{F}e(s)',    'nuitée(s)'),
    (f'nuit{F}e',       'nuitée'),

    # === AGENT ===
    (f'{F} Peu importe',   '— Peu importe'),

    # === MISC ===
    (f'affect{F} par notre {F}quipe', 'affecté par notre équipe'),
    (f'apr{F}s la publication',       'après la publication'),
    (f'de r{F}f{F}rence',             'de référence'),
    (f'annonces de r{F}f{F}rence',    'annonces de référence'),
    (f'{F}quipe',                     'équipe'),
    (f'{F}quip',                      'équip'),
    (f'Vous avez d{F}j{F}',           'Vous avez déjà'),
    (f'{F} cette adresse',            'à cette adresse'),
    (f'Vos adresses pr{F}c{F}dentes', 'Vos adresses précédentes'),
    (f'R{F}sidentielle',              'Résidentielle'),
    (f'Identit{F} masqu{F}e {F} les visiteurs', 'Identité masquée — les visiteurs'),
]

applied = 0
for old, new in fixes:
    if old in text:
        text = text.replace(old, new)
        applied += 1

print(f'Applied {applied} fixes')
after = text.count(F)
print(f'FFFD patterns after: {after} (fixed {before - after})')

with open(INFILE, 'w', encoding='utf-8') as fh:
    fh.write(text)

print('Saved as UTF-8. Done.')
