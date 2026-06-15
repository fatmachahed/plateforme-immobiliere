// URL de l'API — en dev : localhost, en prod : variable Vercel
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export default API_URL;

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
