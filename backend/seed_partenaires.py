"""
Script de seed : crée des comptes partenaires fictifs pour tester la page
"Trouver un prestataire".

Usage :
    cd backend
    python seed_partenaires.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models import User
from app.enums import RoleEnum
from app.utils.security import hash_password

FAKE_PARTENAIRES = [
    # ── BANQUES ──
    {"username":"banque_zitouna",    "email":"zitouna@fake.tn",    "nom":"Banque Zitouna",           "secteur":"banques",           "metier":None,                         "gouvernorat":"Tunis",        "localite":"Tunis"},
    {"username":"banque_biat",       "email":"biat@fake.tn",       "nom":"BIAT – Agence Lac",        "secteur":"banques",           "metier":None,                         "gouvernorat":"Tunis",        "localite":"Les Berges du Lac"},
    {"username":"banque_attijari",   "email":"attijari@fake.tn",   "nom":"Attijari Bank Sfax",       "secteur":"banques",           "metier":None,                         "gouvernorat":"Sfax",         "localite":"Sfax"},
    {"username":"banque_stb",        "email":"stb@fake.tn",        "nom":"STB – Agence Sousse",      "secteur":"banques",           "metier":None,                         "gouvernorat":"Sousse",       "localite":"Sousse"},

    # ── ASSURANCES ──
    {"username":"star_assurance",    "email":"star@fake.tn",       "nom":"STAR Assurances",          "secteur":"assurances",        "metier":None,                         "gouvernorat":"Tunis",        "localite":"La Marsa"},
    {"username":"gat_assurance",     "email":"gat@fake.tn",        "nom":"GAT Assurances",           "secteur":"assurances",        "metier":None,                         "gouvernorat":"Tunis",        "localite":"Ariana"},
    {"username":"lloyd_assurance",   "email":"lloyd@fake.tn",      "nom":"Lloyd Tunisien",           "secteur":"assurances",        "metier":None,                         "gouvernorat":"Sfax",         "localite":"Sfax"},

    # ── NOTAIRES / AVOCATS ──
    {"username":"maitre_ben_ali",    "email":"benali@fake.tn",     "nom":"Maître Sami Ben Ali",      "secteur":"notaires_avocats",  "metier":None,                         "gouvernorat":"Tunis",        "localite":"Centre-ville"},
    {"username":"maitre_chaabane",   "email":"chaabane@fake.tn",   "nom":"Maître Leila Chaabane",    "secteur":"notaires_avocats",  "metier":None,                         "gouvernorat":"Tunis",        "localite":"Menzah"},
    {"username":"cabinet_jridii",    "email":"jridii@fake.tn",     "nom":"Cabinet Jridii & Associés","secteur":"notaires_avocats",  "metier":None,                         "gouvernorat":"Sousse",       "localite":"Sousse"},
    {"username":"maitre_trabelsi",   "email":"trabelsi@fake.tn",   "nom":"Maître Khaled Trabelsi",   "secteur":"notaires_avocats",  "metier":None,                         "gouvernorat":"Sfax",         "localite":"Sfax"},

    # ── ARCHITECTES ──
    {"username":"arch_mrad",         "email":"mrad@fake.tn",       "nom":"Arch. Mehdi Mrad",         "secteur":"architectes",       "metier":None,                         "gouvernorat":"Tunis",        "localite":"Carthage"},
    {"username":"arch_studio_bab",   "email":"studiobab@fake.tn",  "nom":"Studio Bab Design",        "secteur":"architectes",       "metier":None,                         "gouvernorat":"Tunis",        "localite":"Tunis"},
    {"username":"arch_nacef",        "email":"nacef@fake.tn",       "nom":"Cabinet Nacef Architecture","secteur":"architectes",      "metier":None,                         "gouvernorat":"Monastir",     "localite":"Monastir"},
    {"username":"arch_sfax_design",  "email":"sfaxdesign@fake.tn", "nom":"Sfax Architecture & Design","secteur":"architectes",      "metier":None,                         "gouvernorat":"Sfax",         "localite":"Sfax"},

    # ── ARTISANS — Maçon ──
    {"username":"macon_karim",       "email":"karim_macon@fake.tn","nom":"Karim Ben Salah",          "secteur":"artisans",          "metier":"Maçon / Gros œuvre",         "gouvernorat":"Tunis",        "localite":"Ariana"},
    {"username":"macon_bechir",      "email":"bechir_macon@fake.tn","nom":"Béchir Gros Œuvre",       "secteur":"artisans",          "metier":"Maçon / Gros œuvre",         "gouvernorat":"Sfax",         "localite":"Sfax"},

    # ── ARTISANS — Plombier ──
    {"username":"plombier_mourad",   "email":"mourad_plomb@fake.tn","nom":"Mourad Plomberie",        "secteur":"artisans",          "metier":"Plombier",                   "gouvernorat":"Tunis",        "localite":"Manouba"},
    {"username":"plombier_hichem",   "email":"hichem_plomb@fake.tn","nom":"Hichem & Fils Plomberie", "secteur":"artisans",          "metier":"Plombier",                   "gouvernorat":"Sousse",       "localite":"Sousse"},

    # ── ARTISANS — Électricien ──
    {"username":"elec_tarek",        "email":"tarek_elec@fake.tn", "nom":"Tarek Électricité",        "secteur":"artisans",          "metier":"Électricien",                "gouvernorat":"Tunis",        "localite":"Ben Arous"},
    {"username":"elec_foued",        "email":"foued_elec@fake.tn", "nom":"Foued Installations Élec.","secteur":"artisans",          "metier":"Électricien",                "gouvernorat":"Nabeul",       "localite":"Nabeul"},

    # ── ARTISANS — Peintre ──
    {"username":"peintre_ali",       "email":"ali_peintre@fake.tn","nom":"Ali Décoration & Peinture","secteur":"artisans",          "metier":"Peintre en bâtiment",        "gouvernorat":"Tunis",        "localite":"La Soukra"},

    # ── ARTISANS — Carreleur ──
    {"username":"carreleur_slim",    "email":"slim_carrel@fake.tn","nom":"Slim Carrelage Pro",       "secteur":"artisans",          "metier":"Carreleur",                  "gouvernorat":"Monastir",     "localite":"Monastir"},

    # ── ARTISANS — Menuisier ──
    {"username":"menuisier_maher",   "email":"maher_menu@fake.tn", "nom":"Maher Menuiserie Bois",    "secteur":"artisans",          "metier":"Menuisier",                  "gouvernorat":"Tunis",        "localite":"Tunis"},
    {"username":"menuisier_jamel",   "email":"jamel_menu@fake.tn", "nom":"Jamel Ébénisterie",        "secteur":"artisans",          "metier":"Menuisier",                  "gouvernorat":"Sfax",         "localite":"Sfax"},

    # ── ARTISANS — Climaticien ──
    {"username":"clim_sami",         "email":"sami_clim@fake.tn",  "nom":"Sami Clim & Chauffage",    "secteur":"artisans",          "metier":"Climaticien / Chauffagiste", "gouvernorat":"Tunis",        "localite":"Ariana"},

    # ── ARTISANS — Géomètre ──
    {"username":"geometre_fares",    "email":"fares_geo@fake.tn",  "nom":"Farès Géomètre Expert",    "secteur":"artisans",          "metier":"Géomètre / Topographe",      "gouvernorat":"Tunis",        "localite":"Tunis"},

    # ── ARTISANS — Expert immobilier ──
    {"username":"expert_immo_rym",   "email":"rym_expert@fake.tn", "nom":"Rym Ben Naceur – Expert",  "secteur":"artisans",          "metier":"Expert immobilier",          "gouvernorat":"Tunis",        "localite":"Les Berges du Lac"},

    # ── ARTISANS — Photographe ──
    {"username":"photo_nader",       "email":"nader_photo@fake.tn","nom":"Nader Immo Photos",        "secteur":"artisans",          "metier":"Photographe immobilier",     "gouvernorat":"Tunis",        "localite":"La Marsa"},

    # ── ARTISANS — Serrurier ──
    {"username":"serrurier_zied",    "email":"zied_serr@fake.tn",  "nom":"Zied Serrurerie Métallerie","secteur":"artisans",         "metier":"Serrurier / Métallier",      "gouvernorat":"Sousse",       "localite":"Sousse"},
]

def seed():
    db = SessionLocal()
    added = 0
    skipped = 0

    for p in FAKE_PARTENAIRES:
        exists = db.query(User).filter(
            (User.username == p["username"]) | (User.email == p["email"])
        ).first()

        if exists:
            skipped += 1
            print(f"  [SKIP] {p['username']} déjà existant")
            continue

        user = User(
            username         = p["username"],
            email            = p["email"],
            hashed_password  = hash_password("Localizi2024!"),
            role             = RoleEnum.partenaire,
            nom              = p["nom"],
            secteur_partenaire = p["secteur"],
            metier_artisan   = p["metier"],
            gouvernorat      = p["gouvernorat"],
            localite         = p["localite"],
            phone_number     = "+216 20 000 000",
            is_verified      = True,
            is_blocked       = False,
        )
        db.add(user)
        added += 1
        print(f"  [OK]   {p['nom']} ({p['secteur']}{'/' + p['metier'] if p['metier'] else ''})")

    db.commit()
    db.close()
    print(f"\nSeed termine : {added} compte(s) cree(s), {skipped} ignore(s).")

if __name__ == "__main__":
    seed()
