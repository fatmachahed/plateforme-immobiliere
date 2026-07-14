import { useEffect, useState } from "react";
import API_URL from "../config";

/**
 * Feature flags globaux (ex: affichage des "Lieux"/POI, du boost…).
 * Source de vérité = backend (table settings), PAS localStorage — sinon
 * chaque appareil/navigateur garde sa propre valeur et un admin qui désactive
 * une fonctionnalité sur PC ne voit pas le changement sur mobile.
 */
const DEFAULTS = { poi_enabled: true, boost_enabled: true, require_region_to_show_map_pins: false };

let cache = null;
let inflight = null;

function readLocalFallback() {
  try {
    return {
      poi_enabled:   localStorage.getItem("lz_poi_enabled")   !== "0",
      boost_enabled: localStorage.getItem("lz_boost_enabled") !== "0",
      require_region_to_show_map_pins: localStorage.getItem("lz_require_region_to_show_map_pins") === "1",
    };
  } catch { return { ...DEFAULTS }; }
}

export function fetchFeatureFlags(force = false) {
  if (cache && !force) return Promise.resolve(cache);
  if (inflight && !force) return inflight;
  inflight = fetch(`${API_URL}/admin/feature-flags`)
    .then(r => r.ok ? r.json() : null)
    .then(data => { cache = data ? { ...DEFAULTS, ...data } : readLocalFallback(); return cache; })
    .catch(() => { cache = readLocalFallback(); return cache; })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Force la valeur en cache immédiatement (après une sauvegarde admin), sans refetch. */
export function setFeatureFlagsCache(flags) {
  cache = { ...DEFAULTS, ...(cache || {}), ...flags };
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState(() => cache || readLocalFallback());
  useEffect(() => {
    let alive = true;
    fetchFeatureFlags().then(f => { if (alive) setFlags(f); });
    return () => { alive = false; };
  }, []);
  return flags;
}
