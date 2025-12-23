# backend/app/insert_localisation.py
import pandas as pd
from app.database import SessionLocal, engine
from app.models import Gouvernorat, Delegation, Localite

# Créer une session DB
db = SessionLocal()

# Lire le fichier Excel
df = pd.read_excel("data/tunisie.xlsx")

for _, row in df.iterrows():
    # Vérifier ou créer gouvernorat
    gouv = db.query(Gouvernorat).filter_by(nom=row["Gouvernorat"]).first()
    if not gouv:
        gouv = Gouvernorat(nom=row["Gouvernorat"])
        db.add(gouv)
        db.commit()
        db.refresh(gouv)

    # Vérifier ou créer délégation
    delg = db.query(Delegation).filter_by(nom=row["Délégation"], gouvernorat_id=gouv.id).first()
    if not delg:
        delg = Delegation(nom=row["Délégation"], gouvernorat_id=gouv.id)
        db.add(delg)
        db.commit()
        db.refresh(delg)

    # Vérifier ou créer localité
    local = db.query(Localite).filter_by(nom=row["Localité"], delegation_id=delg.id).first()
    if not local:
        local = Localite(nom=row["Localité"], delegation_id=delg.id)
        db.add(local)
        db.commit()

db.close()
print("Insertion terminée !")
