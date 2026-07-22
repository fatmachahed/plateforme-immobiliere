// URL de l'API — en dev : localhost, en prod : variable Vercel
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export default API_URL;

/** Image de secours neutre affichée quand une annonce n'a AUCUNE photo —
 * ne jamais remplacer par une photo de stock (ex: Unsplash), qui donne
 * l'impression trompeuse qu'une vraie photo a été fournie. */
export const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
      <rect width="100%" height="100%" fill="#e2e8f0"/>
      <g fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M225 195 L300 135 L375 195 V285 H225 Z" transform="translate(0,-10)"/>
      </g>
      <text x="50%" y="72%" font-family="Arial, sans-serif" font-size="22" fill="#64748b" text-anchor="middle">Aucune photo disponible</text>
    </svg>`
  );

/**
 * Résout l'URL d'affichage d'une image.
 * - URL absolue (http), data:base64 ou blob: → renvoyée telle quelle
 * - chemin relatif (/uploads/…) → préfixé par l'origine de l'API
 */
export function imgUrl(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Normalise l'affichage de la devise */
export function fmtDevise(devise) {
  if (!devise) return "TND";
  return devise === "TND" ? "TND" : devise;
}

// ── Taux de conversion approximatifs (mis à jour régulièrement) ──
// 1 TND ≈ 0.29 EUR ≈ 0.32 USD
export const RATES = {
  TND: { EUR: 0.29, USD: 0.32 },
  EUR: { TND: 3.45, USD: 1.08 },
  USD: { TND: 3.12, EUR: 0.93 },
};

/** Convertit un prix d'une devise à une autre */
export function convertPrice(price, fromDevise, toDevise) {
  if (!price || !fromDevise || !toDevise) return null;
  const from = fromDevise === "TND" ? "TND" : fromDevise;
  const to   = toDevise   === "TND" ? "TND" : toDevise;
  if (from === to) return Number(price);
  const rate = RATES[from]?.[to];
  if (!rate) return null;
  return Math.round(Number(price) * rate);
}

/**
 * Retourne une chaîne d'approximation dans les deux autres devises.
 * Ex: pour 100 000 TND → "≈ 29 000 € · 32 000 $"
 */
export function fmtPriceApprox(price, devise) {
  if (!price || !devise) return "";
  const p = Number(price);
  const d = devise === "TND" ? "TND" : devise;
  const fmt = n => n.toLocaleString("fr-TN");
  if (d === "TND") {
    const eur = Math.round(p * RATES.TND.EUR);
    const usd = Math.round(p * RATES.TND.USD);
    return `≈ ${fmt(eur)} € · ${fmt(usd)} $`;
  }
  if (d === "EUR") {
    const usd = Math.round(p * RATES.EUR.USD);
    const tnd = Math.round(p * RATES.EUR.TND);
    return `≈ ${fmt(usd)} $ · ${fmt(tnd)} TND`;
  }
  if (d === "USD") {
    const eur = Math.round(p * RATES.USD.EUR);
    const tnd = Math.round(p * RATES.USD.TND);
    return `≈ ${fmt(eur)} € · ${fmt(tnd)} TND`;
  }
  return "";
}
