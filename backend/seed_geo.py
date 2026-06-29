"""
Seed script : crée toutes les tables + insère gouvernorats, délégations, localités
Usage : python seed_geo.py
"""
import os, sys
from dotenv import load_dotenv
load_dotenv()

from app.database import engine, Base
from app.models import *  # noqa
import pandas as pd
from sqlalchemy.orm import Session

def run():
    print("Création des tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables créées.")

    df = pd.read_excel("data/tunisie.xlsx")
    df.columns = ["gouvernorat", "delegation", "localite"]
    df = df.dropna(subset=["gouvernorat", "delegation", "localite"])
    df["gouvernorat"] = df["gouvernorat"].str.strip().str.title()
    df["delegation"]  = df["delegation"].str.strip().str.title()
    df["localite"]    = df["localite"].str.strip().str.title()

    with Session(engine) as db:
        # Vérifier si déjà peuplé
        if db.query(Gouvernorat).count() > 0:
            print("Données géographiques déjà présentes, abandon.")
            return

        gov_cache = {}
        del_cache = {}

        for _, row in df.iterrows():
            gov_name = row["gouvernorat"]
            del_name = row["delegation"]
            loc_name = row["localite"]

            if gov_name not in gov_cache:
                gov = Gouvernorat(nom=gov_name)
                db.add(gov)
                db.flush()
                gov_cache[gov_name] = gov.id

            gov_id = gov_cache[gov_name]
            del_key = (gov_id, del_name)

            if del_key not in del_cache:
                dele = Delegation(nom=del_name, gouvernorat_id=gov_id)
                db.add(dele)
                db.flush()
                del_cache[del_key] = dele.id

            del_id = del_cache[del_key]
            loc = Localite(nom=loc_name, delegation_id=del_id)
            db.add(loc)

        db.commit()

    gov_count = len(gov_cache)
    del_count = len(del_cache)
    loc_count = len(df)
    print(f"Seed terminé : {gov_count} gouvernorats, {del_count} délégations, {loc_count} localités.")

if __name__ == "__main__":
    run()
