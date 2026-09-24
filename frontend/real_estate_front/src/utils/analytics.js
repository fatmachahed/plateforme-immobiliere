// Google Analytics 4 — chargé uniquement si le visiteur a cliqué
// « Accepter tous les cookies » dans le bandeau (CookieBanner).
// Les changements de page React sont suivis par GA4 lui-même
// (mesure améliorée « history events », activée dans le flux Web).

export const COOKIE_KEY = "localizi_cookies_accepted";
const GA_ID = import.meta.env.VITE_GA_ID || "G-FWV3T340JM";

let loaded = false;

function hasConsent() {
  try { return localStorage.getItem(COOKIE_KEY) === "all"; }
  catch { return false; }
}

export function loadAnalytics() {
  if (loaded || !GA_ID || typeof window === "undefined") return;
  // Pas de mesure en développement local : ne pas polluer les statistiques
  if (/^(localhost|127\.|192\.168\.)/.test(window.location.hostname)) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
}

/** Au démarrage de l'app : charge GA4 si le consentement a déjà été donné. */
export function initAnalytics() {
  if (hasConsent()) loadAnalytics();
}
