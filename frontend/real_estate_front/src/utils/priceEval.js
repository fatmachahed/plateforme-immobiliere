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

/* Surface prise en compte pour le prix/m² : superficie habitable + superficie
   du jardin si le bien en a un (sinon 0). Centralisé ici pour que TOUTES les
   pages (carte, profil agent/promoteur, détail annonce, création d'annonce)
   calculent exactement le même prix/m² à partir des mêmes champs, au lieu
   que chacune fasse son propre "prix / superficie" sans le jardin. */
export function getSurfaceTotale(a) {
  const base   = Number(a?.superficie ?? a?.area) || 0;
  const jardin = Number(a?.surface_jardin) || 0;
  return base + jardin;
}

/* Prix/m² d'une annonce, sur la surface totale (habitable + jardin). */
export function getPrixM2(a) {
  const prix = Number(a?.prix) || 0;
  const surf = getSurfaceTotale(a);
  return (prix > 0 && surf > 0) ? prix / surf : null;
}

export function getEvalLevel(prixM2, refPrixM2, count) {
  if (!count || count < EVAL_MIN_SAMPLE || !refPrixM2 || !prixM2 || refPrixM2 <= 0) return EVAL_LEVELS[0];
  if (prixM2 < EVAL_OUTLIER_THRESHOLD) return EVAL_LEVELS[0];
  const r = prixM2 / refPrixM2;
  if (r >= 1.30) return EVAL_LEVELS[1];
  if (r >= 1.10) return EVAL_LEVELS[2];
  if (r >= 0.90) return EVAL_LEVELS[3];
  if (r >= 0.70) return EVAL_LEVELS[4];
  return EVAL_LEVELS[5];
}

/* Clé de segmentation : gouvernorat + délégation (plus précis qu'un simple
   gouvernorat — deux délégations du même gouvernorat peuvent avoir des
   marchés très différents) + type de bien (un appartement ne se compare
   jamais à un duplex, une villa ou un terrain — chaque type a sa propre
   économie de prix/m²) + catégorie (vente/location/vacances — pas
   comparables entre elles) + durée de location pour les vacances
   (nuitée/semaine/mois/an) + regroupement état du bien (neuf/en construction
   vs bon état/à rénover) pour vente/location.
   Doit rester identique à celle du backend (GET /annonces/market-stats,
   voir backend/app/routers/annonces.py) et entre toutes les pages front. */
export function statsKey({ gouvernorat, delegation, categorie, etat, etat_bien, duree_type, type, type_bien }) {
  const typeVal = type_bien ?? type ?? "";
  const etatVal = etat_bien ?? etat;
  const etatGroup = (etatVal === "nouveau" || etatVal === "cours_construction") ? "neuf" : "ancien";
  if (categorie === "vacances") return `${gouvernorat}|${delegation}|${typeVal}|vacances|${duree_type || "nuit"}`;
  return `${gouvernorat}|${delegation}|${typeVal}|${categorie}|${etatGroup}`;
}

/* Médiane d'une liste de nombres — utilisée comme référence de prix/m² au
   lieu de la moyenne : plus robuste aux annonces à prix extrême (bien de
   luxe isolé, erreur de saisie) qui, sinon, faussent la référence utilisée
   pour évaluer les autres annonces du même groupe. */
export function median(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* Construit la table de stats { [statsKey]: {values, count} } à partir d'une
   liste d'annonces déjà chargée côté client (utilisé par CartePage et
   CreerAnnonce qui ont déjà la liste en mémoire). Les prix/m² individuels
   sont conservés (pas juste une somme) pour pouvoir calculer la médiane. */
export function buildMarketStats(annonces) {
  const stats = {};
  (annonces || []).forEach(a => {
    if (!a.gouvernorat || !a.delegation || !a.categorie || !(a.type_bien || a.type)) return;
    const prixM2 = getPrixM2(a);
    if (!prixM2) return;
    // Exclu de la référence : un prix/m² aberrant (< 10) ne doit jamais
    // fausser l'évaluation des autres annonces du même groupe.
    if (prixM2 < EVAL_OUTLIER_THRESHOLD) return;
    const key = statsKey(a);
    if (!stats[key]) stats[key] = { values: [], count: 0 };
    stats[key].values.push(prixM2);
    stats[key].count += 1;
  });
  return stats;
}
