"""
Import / synchronisation du flux XML Century 21 Tunisie -> annonces Localizi.

Usage (depuis backend/) :
    python import_century21.py                      # simulation : rapport, AUCUNE écriture en base
    python import_century21.py --file feed.xml      # simulation à partir d'un fichier local
    python import_century21.py --apply              # écrit en base (création / mise à jour / retrait)

Règles (validées avec le client) :
  - 1 compte "agence" par agence Century 21 (créé au premier import, téléphone renseigné)
  - nouvelles annonces : statut en_attente (validation manuelle) ; une annonce déjà
    validée/refusée n'est jamais remise en attente par un ré-import
  - annonces disparues du flux : statut "supprimee" (soft delete)
  - prix à 0 dans le flux : affiché 1 DT
  - photos : URL Century 21 conservées telles quelles (pas de copie)
  - fiche d'origine : URL ajoutée à la fin de la description
  - position : les points du flux sont ceux du quartier ; on les écarte de ~100-250 m
    (décalage déterministe par annonce -> stable d'un import à l'autre)
"""
import argparse
import collections
import hashlib
import json
import math
import re
import secrets
import sys
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET

FEED_URL = "https://century21.tn/property-feed/facebook/all/"
SOURCE = "century21"

# Agences prises en charge : une par compte. Les autres (ex. Blue Lagoon, ou sans agence)
# sont ignorées et listées dans le rapport.
AGENCE_DEFAUT = "CENTURY 21 Blue Lagoon"
AGENCES = [
    "CENTURY 21 Invest", "CENTURY 21 Barros", "CENTURY 21 Prestige", "CENTURY 21 Infinity",
    "CENTURY 21 Excellence", "CENTURY 21 Challenge", "CENTURY 21 Karaouli", "CENTURY 21 Masters",
    "CENTURY 21 Horizon", "CENTURY 21 Patrimoine", "CENTURY 21 Alliance", "CENTURY 21 Blue Lagoon",
]

# property_type du flux -> TypeBienEnum
TYPE_MAP = {
    "appartement": "appartement", "villa": "villa_maison", "rdc de villa": "villa_maison",
    "etage de villa": "villa_maison", "bureau": "bureau", "cabinet medical": "bureau",
    "local commercial": "local_commercial", "terrain villa": "terrain", "terrain promoteur": "terrain",
    "duplex": "duplex", "triplex": "triplex", "penthouse": "penthouse", "immeuble": "immeuble",
    "depot": "depot_stockage", "fond de commerce": "immobiliers_divers",
}
# Types voulant un type S+N
TYPES_SPLUS = {"appartement", "duplex", "triplex", "penthouse"}

GOV_ALIAS = {"mannouba": "manouba"}

# Villes / quartiers du flux qui ne sont pas des délégations officielles -> (gouvernorat, délégation)
CITY_TO_DELEG = {
    "les berges du lac": ("tunis", "la marsa"),
    "berges du lac": ("tunis", "la marsa"),
    "jardins de carthage": ("tunis", "el kram"),
    "ennasr": ("ariana", "ariana ville"),
    "ain zaghouan": ("tunis", "la marsa"),
    "gammarth": ("tunis", "la marsa"),
    "aouina": ("ariana", "la soukra"),
    "centre urbain nord": ("tunis", "el menzah"),
    "cite el khadra": ("tunis", "cite el khadra"),
    "marsa": ("tunis", "la marsa"),
    "cite mahrajene": ("tunis", "el menzah"),
    "mutuelleville": ("tunis", "el menzah"),
    "notre dame": ("tunis", "el menzah"),
    "charguia": ("ariana", "la soukra"),
    "midoun": ("medenine", "midoun"),
    "djerba midoun": ("medenine", "midoun"),
    # El Menzah 9 / Jardins d'El Menzah sont côté gouvernorat de l'Ariana
    ("ariana", "el menzah"): ("ariana", "ariana ville"),
    ("ariana", "jardins d el menzah"): ("ariana", "ariana ville"),
}

PHONE_RE = re.compile(r"(?<![\d.])(?:\+?216[ .-]*)?([2-579]\d[ .-]?\d{3}[ .-]?\d{3}|[2-579]\d(?:[ .-]\d{2}){3})(?![\d])")


def norm(s):
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode().lower()
    return " ".join(re.sub(r"[^a-z0-9+ ]", " ", s).split())


def txt(el, tag):
    e = el.find(tag)
    return (e.text or "").strip() if e is not None and e.text else ""


def to_num(s, default=None):
    try:
        return float(s.replace(" ", "").replace(",", "."))
    except (ValueError, AttributeError):
        return default


def fetch(path=None):
    if path:
        return open(path, "rb").read()
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "LocaliziImport/1.0"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


# ---------------------------------------------------------------- géographie
class Geo:
    """Index gouvernorat / délégation / localité (noms normalisés) -> ids ou noms."""

    def __init__(self, rows):
        # rows : (gov_nom, deleg_nom, loc_nom, gov_id, deleg_id, loc_id)
        self.loc = collections.defaultdict(list)
        self.deleg = {}
        self.gov = {}
        for g, d, l, gid, did, lid in rows:
            ng, nd, nl = norm(g), norm(d), norm(l)
            self.gov[ng] = (g, gid)
            self.deleg[(ng, nd)] = (d, did, gid)
            self.loc[(ng, nl)].append((l, lid, did, nd))

    @classmethod
    def from_excel(cls, path="data/tunisie.xlsx"):
        import pandas as pd
        df = pd.read_excel(path)
        df.columns = ["g", "d", "l"]
        df = df.dropna()
        rows = [(str(g).strip().title(), str(d).strip().title(), str(l).strip().title(), None, None, None)
                for g, d, l in df.itertuples(index=False)]
        return cls(rows)

    @classmethod
    def from_db(cls, db):
        from app import models as m
        rows = []
        for loc in db.query(m.Localite).all():
            d = loc.delegation
            rows.append((d.gouvernorat.nom, d.nom, loc.nom, d.gouvernorat_id, d.id, loc.id))
        return cls(rows)

    def resolve(self, region, city, neighborhood, addr1):
        """Retourne (gov, deleg, loc, niveau) ; chaque élément = (nom, id) ou None."""
        ng = GOV_ALIAS.get(norm(region), norm(region))
        gov = self.gov.get(ng)
        # Candidats par ordre de fiabilité : quartier, adresse, ville. Pour chacun on teste la
        # localité puis la délégation, et le premier qui aboutit l'emporte (le quartier prime
        # donc sur une adresse contradictoire). Variante : "Les berges du Lac 2" -> "berges du lac".
        cands = []
        for raw in (neighborhood, addr1, city):
            for part in re.split(r",", raw or ""):
                p = norm(part)
                for v in (p, re.sub(r"^les ", "", re.sub(r" \d+$", "", p))):
                    if v and v not in ("tunisie", "tunisia") and v not in cands:
                        cands.append(v)
        for c in cands:
            hits = self.loc.get((ng, c)) if ng else None
            if hits:
                l, lid, did, nd = hits[0]
                d = self.deleg[(ng, nd)]
                return gov, (d[0], d[1]), (l, lid), "localite"
            tgt = CITY_TO_DELEG.get((ng, c)) or CITY_TO_DELEG.get(c)
            key = (tgt[0], tgt[1]) if tgt else (ng, c)
            if key in self.deleg:
                d = self.deleg[key]
                return self.gov.get(key[0]), (d[0], d[1]), None, "delegation"
        return gov, None, None, "gouvernorat" if gov else "aucun"


# ---------------------------------------------------------------- décalage des points
def jitter(lat, lng, key, group_size):
    """Décale (lat, lng) de 100 à ~250 m, de façon déterministe pour une clé donnée."""
    radius = 100 + min(150, 12 * math.sqrt(group_size))
    h = hashlib.sha256(f"{SOURCE}:{key}".encode()).digest()
    u1 = int.from_bytes(h[:8], "big") / 2**64
    u2 = int.from_bytes(h[8:16], "big") / 2**64
    r = radius * math.sqrt(u1)
    theta = 2 * math.pi * u2
    dlat = (r * math.cos(theta)) / 111_320
    dlng = (r * math.sin(theta)) / (111_320 * math.cos(math.radians(lat)))
    return round(lat + dlat, 7), round(lng + dlng, 7)


# ---------------------------------------------------------------- transformation
def detect_categorie(titre, desc, prix):
    t = norm(titre)
    if re.search(r"\blouer\b|\blocation\b", t):
        return "location", "titre"
    if re.search(r"\bvendre\b|\bvente\b", t):
        return "vente", "titre"
    d = norm(desc)[:400]
    if re.search(r"\blouer\b|\blocation\b", d):
        return "location", "description"
    if re.search(r"\bvendre\b|\bvente\b", d):
        return "vente", "description"
    if prix and prix > 0:
        return ("vente" if prix >= 30000 else "location"), "prix"
    return "vente", "defaut"


def detect_type(property_type, titre):
    k = norm(property_type)
    if k in TYPE_MAP:
        return TYPE_MAP[k], "flux"
    t = norm(titre)
    for pat, v in [(r"fonds? de commerce|fond de commerce", "immobiliers_divers"), (r"triplex", "triplex"),
                   (r"duplex", "duplex"), (r"penthouse", "penthouse"), (r"terrain|lot ", "terrain"),
                   (r"immeuble", "immeuble"), (r"villa", "villa_maison"), (r"bureau|open space|plateau", "bureau"),
                   (r"local|boutique|magasin|commercial", "local_commercial"), (r"depot|entrepot", "depot_stockage"),
                   (r"appartement|studio|s\+ ?\d", "appartement")]:
        if re.search(pat, t):
            return v, "titre"
    return "immobiliers_divers", "defaut"


def extract_phone(desc):
    m = PHONE_RE.search(desc or "")
    if not m:
        return None
    d = re.sub(r"\D", "", m.group(1))
    return f"+216 {d[:2]} {d[2:5]} {d[5:]}"


def clean_int(s, lo=0, hi=30):
    v = to_num(s)
    return int(v) if v is not None and lo <= v <= hi else None


def transform(el):
    sid = txt(el, "home_listing_id")
    titre = txt(el, "name") or "Annonce Century 21"
    desc = txt(el, "description")
    prix_flux = to_num(txt(el, "price"), 0) or 0
    prix = prix_flux if prix_flux > 0 else 1.0           # règle client : prix à 0 -> 1 DT
    categorie, cat_src = detect_categorie(titre, desc, prix_flux)
    type_bien, type_src = detect_type(txt(el, "property_type"), titre)
    comp = {c.get("name"): (c.text or "").strip() for c in el.iter("component")}
    url = txt(el, "url")

    t_norm = norm(titre)
    type_app = None
    if type_bien in TYPES_SPLUS:
        m = re.search(r"s ?\+ ?(\d)", t_norm)
        if m and int(m.group(1)) <= 4:
            type_app = f"s+{m.group(1)}" if int(m.group(1)) else "s0"
        elif "studio" in t_norm:
            type_app = "studio"
    type_bureau = None
    if type_bien == "bureau":
        m = re.search(r"\bh ?\+ ?(\d)\b", t_norm)
        type_bureau = f"H+{m.group(1)}" if m else ("Open Space" if "open space" in t_norm else None)

    imgs, seen = [], set()
    for u in el.findall("image/url"):
        link = (u.text or "").strip()
        base = link.split("?")[0]
        if link and base not in seen:
            seen.add(base)
            imgs.append(link.split("?")[0])

    corps = desc
    if url:
        corps = f"{desc}\n\nVoir l'annonce sur Century 21 : {url}".strip()

    beds = clean_int(txt(el, "num_beds"))
    return {
        "source_id": sid,
        "reference": f"C21-{sid}",
        # annonce sans agence dans le flux -> rattachée à Blue Lagoon (décision client)
        "agence": txt(el, "agent_company") or AGENCE_DEFAUT,
        "titre": titre[:250],
        "description": corps,
        "categorie": categorie, "categorie_src": cat_src,
        "type_bien": type_bien, "type_src": type_src,
        "type_appartement": type_app, "type_bureau": type_bureau,
        "prix": prix, "prix_flux_zero": prix_flux == 0,
        "superficie": to_num(txt(el, "area_size"), 0) or 0,
        "nb_pieces": clean_int(txt(el, "num_rooms")),
        "nb_chambres": beds,
        "nb_salles_bain": clean_int(txt(el, "num_baths"), 0, 15),
        "annee_construction": (clean_int(txt(el, "year_built"), 1900, 2035)),
        "telephone": extract_phone(desc),
        "source_url": url or None,
        "images": imgs,
        "lat": to_num(txt(el, "latitude")), "lng": to_num(txt(el, "longitude")),
        "region": comp.get("region", ""), "city": comp.get("city", ""),
        "addr1": comp.get("addr1", ""), "neighborhood": txt(el, "neighborhood"),
        "address": ", ".join(x for x in (comp.get("addr1") or txt(el, "neighborhood"), comp.get("city")) if x),
    }


def build(xml_bytes, geo):
    root = ET.fromstring(xml_bytes)
    items = [transform(e) for e in root.findall("listing")]

    # coordonnées de repli : médiane des annonces du même quartier/ville
    by_place = collections.defaultdict(list)
    for it in items:
        if it["lat"] and it["lng"]:
            by_place[norm(it["neighborhood"] or it["city"])].append((it["lat"], it["lng"]))
    groups = collections.Counter((it["lat"], it["lng"]) for it in items if it["lat"] and it["lng"])

    for it in items:
        it["geo"] = geo.resolve(it["region"], it["city"], it["neighborhood"], it["addr1"])
        it["coord_src"] = "flux"
        if not (it["lat"] and it["lng"]):
            pts = by_place.get(norm(it["neighborhood"] or it["city"])) or by_place.get(norm(it["city"]))
            if pts:
                pts = sorted(pts)
                it["lat"], it["lng"] = pts[len(pts) // 2]
                it["coord_src"] = "repli_quartier"
            else:
                it["coord_src"] = "aucune"
        if it["lat"] and it["lng"]:
            size = groups.get((it["lat"], it["lng"]), 1) if it["coord_src"] == "flux" else 20
            it["lat_pub"], it["lng_pub"] = jitter(it["lat"], it["lng"], it["source_id"], size)
        else:
            it["lat_pub"] = it["lng_pub"] = 0.0
    return items


def report(items):
    c = collections.Counter
    out = {
        "total": len(items),
        "agences": c(i["agence"] or "(aucune)" for i in items),
        "categorie": c(i["categorie"] for i in items),
        "categorie_source": c(i["categorie_src"] for i in items),
        "type_bien": c(i["type_bien"] for i in items),
        "type_source": c(i["type_src"] for i in items),
        "prix_zero_devenu_1DT": sum(i["prix_flux_zero"] for i in items),
        "vente_prix_suspect(<30000 ou >20M)": sum(1 for i in items if i["categorie"] == "vente" and not i["prix_flux_zero"] and (i["prix"] < 30000 or i["prix"] > 20_000_000)),
        "location_prix_suspect(>20000)": sum(1 for i in items if i["categorie"] == "location" and i["prix"] > 20000),
        "telephone_extrait": sum(1 for i in items if i["telephone"]),
        "sans_photo": sum(1 for i in items if not i["images"]),
        "coordonnees": c(i["coord_src"] for i in items),
        "niveau_geo": c(i["geo"][3] for i in items),
        "ignorees_agence_non_listee": [i["source_id"] for i in items if i["agence"] not in AGENCES],
    }
    unmatched = c((i["region"], i["city"], i["neighborhood"]) for i in items if i["geo"][3] in ("gouvernorat", "aucun"))
    out["geo_non_resolu_top"] = unmatched.most_common(25)
    # décalage : distance moyenne / max entre point publié et point du flux
    d = []
    for i in items:
        if i["lat"] and i["lat_pub"]:
            d.append(math.hypot((i["lat_pub"] - i["lat"]) * 111320,
                                (i["lng_pub"] - i["lng"]) * 111320 * math.cos(math.radians(i["lat"]))))
    out["decalage_m"] = {"moy": round(sum(d) / len(d)), "max": round(max(d))} if d else None
    pub = collections.Counter((i["lat_pub"], i["lng_pub"]) for i in items if i["lat_pub"])
    out["points_distincts_apres_decalage"] = len(pub)
    # téléphone par agence (le plus fréquent)
    tel = collections.defaultdict(collections.Counter)
    for i in items:
        if i["telephone"]:
            tel[i["agence"]][i["telephone"]] += 1
    out["telephone_agence"] = {a: tel[a].most_common(3) for a in AGENCES}
    return out


# ---------------------------------------------------------------- écriture en base
def agence_phones(items):
    tel = collections.defaultdict(collections.Counter)
    for i in items:
        if i["telephone"]:
            tel[i["agence"]][i["telephone"]] += 1
    return {a: (tel[a].most_common(1)[0][0] if tel[a] else None) for a in AGENCES}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")


def ensure_accounts(db, items):
    from app import models as m
    from app.security import get_password_hash as hash_password
    phones = agence_phones(items)
    users = {}
    for nom in AGENCES:
        email = f"{slug(nom)}@localizi.tn"
        u = db.query(m.User).filter(m.User.email == email).first()
        if not u:
            u = m.User(username=slug(nom), email=email, role=m.RoleEnum.agence,
                       hashed_password=hash_password(secrets.token_urlsafe(24)),
                       nom_entreprise=nom, phone_number=phones[nom], is_verified=True,
                       must_change_password=True)
            db.add(u)
            db.flush()
            db.add(m.Agency(user_id=u.id, nom=nom, email=email, telephone=phones[nom],
                            reference=f"AGC{u.id:04d}", abonnement_actif=True, frais_mensuel=0.0))
            print(f"  compte créé : {email} ({phones[nom]})")
        elif phones[nom] and not u.phone_number:
            u.phone_number = phones[nom]
        users[nom] = u
    return users


def apply(items, geo_db, db):
    from datetime import datetime
    from app import models as m
    users = ensure_accounts(db, items)
    existing = {a.source_id: a for a in db.query(m.Annonce).filter(m.Annonce.source == SOURCE).all()}
    feed_ids = {i["source_id"] for i in items if i["agence"] in AGENCES}
    stats = collections.Counter()

    # garde-fou : un flux anormalement vide ne doit pas retirer tout le catalogue
    if existing and len(feed_ids) < 0.5 * len(existing):
        print(f"ABANDON : le flux ne contient que {len(feed_ids)} annonces pour {len(existing)} en base.")
        return

    for it in items:
        if it["agence"] not in AGENCES:
            stats["ignorees"] += 1
            continue
        gov, deleg, loc, _ = geo_db.resolve(it["region"], it["city"], it["neighborhood"], it["addr1"])
        a = existing.get(it["source_id"])
        fields = dict(
            titre=it["titre"], description=it["description"],
            categorie=it["categorie"], type_bien=it["type_bien"],
            type_appartement=it["type_appartement"], type_bureau=it["type_bureau"],
            prix=it["prix"], devise="DT", superficie=it["superficie"],
            nb_pieces=it["nb_pieces"], nb_chambres=it["nb_chambres"], nb_salles_bain=it["nb_salles_bain"],
            annee_construction=it["annee_construction"],
            telephone=it["telephone"] or users[it["agence"]].phone_number,
            gouvernorat_id=gov[1] if gov else None,
            delegation_id=deleg[1] if deleg else None,
            localite_id=loc[1] if loc else None,
            source_url=it["source_url"], localisation_exacte=False,
        )
        if a is None:
            a = m.Annonce(source=SOURCE, source_id=it["source_id"], reference=it["reference"],
                          utilisateur_id=users[it["agence"]].id, status="en_attente", **fields)
            db.add(a)
            db.flush()
            stats["creees"] += 1
        else:
            for k, v in fields.items():
                setattr(a, k, v)
            if a.status == m.StatusEnum.supprimee:      # réapparue dans le flux
                a.status = m.StatusEnum.en_attente
                stats["reactivees"] += 1
            stats["mises_a_jour"] += 1
            a.date_mise_a_jour = datetime.utcnow()

        prop = a.property or m.Property(annonce_id=a.id)
        prop.address = it["address"]
        prop.latitude, prop.longitude = it["lat_pub"], it["lng_pub"]
        prop.image_principale = it["images"][0] if it["images"] else None
        db.add(prop)
        db.flush()
        for old in list(prop.images):
            db.delete(old)
        for n, url in enumerate(it["images"]):
            db.add(m.PropertyImage(property_id=prop.id, image=url, ordre=n))

    for sid, a in existing.items():
        if sid not in feed_ids and a.status != m.StatusEnum.supprimee:
            a.status = m.StatusEnum.supprimee
            stats["retirees"] += 1
    db.commit()
    print("Résultat :", dict(stats))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", help="fichier XML local au lieu du téléchargement")
    ap.add_argument("--apply", action="store_true", help="écrire en base (sinon simulation)")
    ap.add_argument("--report", help="écrire le rapport JSON dans ce fichier")
    args = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    xml = fetch(args.file)
    db = None
    try:                      # référentiel réel (lecture seule en simulation)
        from app.database import SessionLocal
        db = SessionLocal()
        geo = Geo.from_db(db)
    except Exception as e:
        if args.apply:
            raise
        print(f"Base inaccessible ({e.__class__.__name__}) : référentiel lu dans data/tunisie.xlsx")
        db, geo = None, Geo.from_excel()
    items = build(xml, geo)
    rep = report(items)
    txt_rep = json.dumps(rep, ensure_ascii=False, indent=1, default=str)
    if args.report:
        open(args.report, "w", encoding="utf-8").write(txt_rep)
    print(txt_rep)
    if args.apply:
        apply(items, geo, db)
        db.close()
    else:
        if db:
            db.close()
        print("\nSIMULATION — rien n'a été écrit en base (utiliser --apply).")


if __name__ == "__main__":
    main()
