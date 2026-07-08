import { useEffect, useState } from "react";

/**
 * Source unique de vérité pour le comparateur d'annonces (max 4 biens).
 *
 * Avant ce module, chaque page (carte, détail annonce, vue liste, profil
 * agent, favoris) réimplémentait sa propre logique avec des clés
 * localStorage différentes ("localizi_compare_meta" vs "localizi_cdata"),
 * et certaines pages écrasaient l'état d'autres pages au montage. Résultat :
 * un bien ajouté depuis une interface pouvait disparaître du comparateur en
 * ouvrant une autre interface, et le bouton "Ajouter" pouvait rester actif
 * alors que le bien y était déjà — d'où des doublons.
 *
 * Toute lecture/écriture du comparateur doit passer par ce module.
 */

const IDS_KEY  = "localizi_compare";
const META_KEY = "localizi_compare_meta";
const MAX_COMPARE = 4;

const EVT_UPDATED     = "compare-updated";
const EVT_SHOW_POPUP  = "compare-show-popup";

function readIds() {
  try {
    const arr = JSON.parse(localStorage.getItem(IDS_KEY) || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch { return []; }
}

function readMeta() {
  try {
    const arr = JSON.parse(localStorage.getItem(META_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** Réconcilie meta/ids : dédoublonne, tronque à MAX_COMPARE, meta = source des ids affichables. */
function writeState(ids, meta) {
  const seen = new Set();
  const cleanMeta = meta.filter(m => {
    const k = String(m.id);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, MAX_COMPARE);
  const cleanIds = cleanMeta.map(m => String(m.id));
  localStorage.setItem(IDS_KEY, JSON.stringify(cleanIds));
  localStorage.setItem(META_KEY, JSON.stringify(cleanMeta));
  window.dispatchEvent(new Event(EVT_UPDATED));
  return { ids: cleanIds, meta: cleanMeta };
}

export function getCompareIds() { return readIds(); }
export function getCompareMeta() { return readMeta(); }
export function getCompareCount() { return readIds().length; }
export function isInCompare(id) { return readIds().includes(String(id)); }

/**
 * Ajoute un bien au comparateur (idempotent : n'ajoute jamais de doublon,
 * même si appelé deux fois de suite avec un état React local désynchronisé).
 * `item` doit contenir au minimum { id }, idéalement aussi titre/prix/devise/
 * image/gouvernorat/delegation/categorie pour l'aperçu du popup.
 * Retourne { added, alreadyIn, maxReached, count }.
 */
export function addToCompare(item) {
  const id = String(item.id);
  const ids = readIds();
  if (ids.includes(id)) {
    return { added: false, alreadyIn: true, maxReached: false, count: ids.length };
  }
  if (ids.length >= MAX_COMPARE) {
    return { added: false, alreadyIn: false, maxReached: true, count: ids.length };
  }
  const meta = readMeta().filter(m => String(m.id) !== id);
  meta.push({
    id: item.id,
    titre: item.titre ?? null,
    prix: item.prix ?? null,
    devise: item.devise ?? null,
    image: item.image ?? null,
    gouvernorat: item.gouvernorat ?? null,
    delegation: item.delegation ?? null,
    categorie: item.categorie ?? null,
  });
  const next = writeState([...ids, id], meta);
  if (next.ids.length >= 2) window.dispatchEvent(new CustomEvent(EVT_SHOW_POPUP));
  return { added: true, alreadyIn: false, maxReached: false, count: next.ids.length };
}

/** Retire un bien du comparateur. Idempotent. */
export function removeFromCompare(id) {
  const rid = String(id);
  const ids = readIds().filter(i => i !== rid);
  const meta = readMeta().filter(m => String(m.id) !== rid);
  const next = writeState(ids, meta);
  return next.ids.length;
}

/** Bascule l'état d'un bien dans le comparateur. Retourne le résultat de add/remove. */
export function toggleCompare(item) {
  const id = String(item.id);
  if (isInCompare(id)) {
    removeFromCompare(id);
    return { added: false, alreadyIn: false, maxReached: false, count: getCompareCount() };
  }
  return addToCompare(item);
}

export function clearCompare() {
  localStorage.removeItem(IDS_KEY);
  localStorage.removeItem(META_KEY);
  window.dispatchEvent(new Event(EVT_UPDATED));
}

/** Hook : état "ce bien est-il dans le comparateur ?", toujours synchronisé. */
export function useIsInCompare(id) {
  const [inCompare, setInCompare] = useState(() => isInCompare(id));
  useEffect(() => {
    const sync = () => setInCompare(isInCompare(id));
    sync();
    window.addEventListener(EVT_UPDATED, sync);
    return () => window.removeEventListener(EVT_UPDATED, sync);
  }, [id]);
  return inCompare;
}

/** Hook : liste des biens comparés (métadonnées), toujours synchronisée. */
export function useCompareMeta() {
  const [meta, setMeta] = useState(() => getCompareMeta());
  useEffect(() => {
    const sync = () => setMeta(getCompareMeta());
    sync();
    window.addEventListener(EVT_UPDATED, sync);
    return () => window.removeEventListener(EVT_UPDATED, sync);
  }, []);
  return meta;
}

/** Hook : nombre de biens comparés, toujours synchronisé (pour badge/icône). */
export function useCompareCount() {
  const [count, setCount] = useState(() => getCompareCount());
  useEffect(() => {
    const sync = () => setCount(getCompareCount());
    sync();
    window.addEventListener(EVT_UPDATED, sync);
    return () => window.removeEventListener(EVT_UPDATED, sync);
  }, []);
  return count;
}

/** Hook : écoute l'ouverture du popup "2 biens ajoutés" déclenché depuis n'importe quelle page. */
export function useCompareShowPopup(onShow) {
  useEffect(() => {
    window.addEventListener(EVT_SHOW_POPUP, onShow);
    return () => window.removeEventListener(EVT_SHOW_POPUP, onShow);
  }, [onShow]);
}
