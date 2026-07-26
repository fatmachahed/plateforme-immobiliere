/* Logique partagée de la barre d'évaluation prix ("Bon prix", "Prix élevé"...),
   utilisée par CartePage.jsx, AgentProfile.jsx et CreerAnnonce.jsx.
   Centralisée ici pour que les 3 pages restent cohérentes (auparavant chacune
   avait sa propre copie, qui avait divergé — l'une d'elles ne segmentait ni
   par catégorie ni par état, et n'appliquait aucun seuil d'échantillon). */

export const EVAL_LEVELS = [
  { key:"none",  label:"Aucune évaluation", segs:0, color:"#d1d5db" },
  { key:"high3", label:"Prix très élevé",   segs:1, color:"#dc2626" },
  { key:"high2", label:"Prix élevé",        segs:2, color:"#f59e0b" },
  { key:"fair",  label:"Prix équitable",    segs:3, color:"#3b82f6" },
  { key:"good",  label:"Bon prix",          segs:4, color:"#16a34a" },
  { key:"great", label:"Très bon prix",     segs:5, color:"#15803d" },
];

// En dessous, la moyenne n'est pas assez fiable (peut n'être que le bien lui-même)
export const EVAL_MIN_SAMPLE = 3;

// Prix/m² (ou /nuit, /mois selon la catégorie) en dessous de ce seuil = valeur
// aberrante (erreur de saisie, prix symbolique...) — jamais évalué soi-même,
// et jamais compté comme référence pour évaluer les autres biens du groupe.
export const EVAL_OUTLIER_THRESHOLD = 10;

export function getEvalLevel(prixM2, govAvg, count) {
  if (!count || count < EVAL_MIN_SAMPLE || !govAvg || !prixM2 || govAvg <= 0) return EVAL_LEVELS[0];
  if (prixM2 < EVAL_OUTLIER_THRESHOLD) return EVAL_LEVELS[0];
  const r = prixM2 / govAvg;
  if (r >= 1.30) return EVAL_LEVELS[1];
  if (r >= 1.10) return EVAL_LEVELS[2];
  if (r >= 0.90) return EVAL_LEVELS[3];
  if (r >= 0.70) return EVAL_LEVELS[4];
  return EVAL_LEVELS[5];
}

/* Clé de segmentation : gouvernorat + catégorie (vente/location/vacances —
   pas comparables entre elles) + durée de location pour les vacances
   (nuitée/semaine/mois/an) + regroupement état du bien (neuf/en construction
   vs bon état/à rénover) pour vente/location.
   Doit rester identique à celle du backend (GET /annonces/market-stats,
   voir backend/app/routers/annonces.py) et entre toutes les pages front. */
export function statsKey({ gouvernorat, categorie, etat, etat_bien, duree_type }) {
  const etatVal = etat_bien ?? etat;
  const etatGroup = (etatVal === "nouveau" || etatVal === "cours_construction") ? "neuf" : "ancien";
  if (categorie === "vacances") return `${gouvernorat}|vacances|${duree_type || "nuit"}`;
  return `${gouvernorat}|${categorie}|${etatGroup}`;
}

/* Construit la table de stats { [statsKey]: {sum, count} } à partir d'une
   liste d'annonces déjà chargée côté client (utilisé par CartePage et
   CreerAnnonce qui ont déjà la liste en mémoire). */
export function buildMarketStats(annonces) {
  const stats = {};
  (annonces || []).forEach(a => {
    if (!a.gouvernorat || !a.categorie || !a.prix || !a.superficie && !a.area) return;
    const area = a.superficie ?? a.area;
    if (!area || area <= 0) return;
    const prixM2 = a.prix / area;
    // Exclu de la moyenne de référence : un prix/m² aberrant (< 10) ne doit
    // jamais fausser l'évaluation des autres annonces du même groupe.
    if (prixM2 < EVAL_OUTLIER_THRESHOLD) return;
    const key = statsKey(a);
    if (!stats[key]) stats[key] = { sum: 0, count: 0 };
    stats[key].sum   += prixM2;
    stats[key].count += 1;
  });
  return stats;
}
