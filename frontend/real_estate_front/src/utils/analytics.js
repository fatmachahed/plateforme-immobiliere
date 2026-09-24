// Google Analytics 4 + Microsoft Clarity — chargés uniquement si le visiteur a cliqué
// « Accepter tous les cookies » dans le bandeau (CookieBanner).
// Les changements de page React sont suivis par GA4 lui-même
// (mesure améliorée « history events », activée dans le flux Web).

export const COOKIE_KEY = "localizi_cookies_accepted";
const GA_ID = import.meta.env.VITE_GA_ID || "G-FWV3T340JM";
const CLARITY_ID = import.meta.env.VITE_CLARITY_ID || "ync9pnthin";

let loaded = false;

function hasConsent() {
  try { return localStorage.getItem(COOKIE_KEY) === "all"; }
  catch { return false; }
}

export function loadAnalytics() {
  if (loaded || typeof window === "undefined") return;
  // Pas de mesure en développement local : ne pas polluer les statistiques
  if (/^(localhost|127\.|192\.168\.)/.test(window.location.hostname)) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);

  addScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);

  // Clarity : enregistrements de sessions + cartes de chaleur
  window.clarity = window.clarity || function clarity() { (window.clarity.q = window.clarity.q || []).push(arguments); };
  addScript(`https://www.clarity.ms/tag/${CLARITY_ID}`);
}

function addScript(src) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

/** Choix enregistré : "all" | "essential" | null (pas encore répondu). */
export function getConsent() {
  try { return localStorage.getItem(COOKIE_KEY); }
  catch { return null; }
}

/** Enregistre le choix du visiteur (bandeau ou page Cookies). */
export function setConsent(value) {
  const before = getConsent();
  try { localStorage.setItem(COOKIE_KEY, value); } catch { /* stockage indisponible */ }
  if (value === "all") { loadAnalytics(); return; }
  // Retrait du consentement : recharger la page pour décharger les scripts déjà
  // en cours d'exécution ; initAnalytics() efface ensuite leurs cookies.
  if (before === "all") window.location.reload();
}

function deleteTrackingCookies() {
  const host = window.location.hostname;
  const domains = ["", host, "." + host.replace(/^www\./, "")];
  document.cookie.split(";").map(c => c.split("=")[0].trim())
    .filter(name => /^(_ga|_gid|_gat|_clck|_clsk|CLID)/.test(name))
    .forEach(name => domains.forEach(d => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? "; domain=" + d : ""}`;
    }));
}

/** Au démarrage de l'app : charge GA4 et Clarity si le consentement a déjà été donné.
 *  Sinon, efface d'éventuels cookies GA4 / Clarity restants (fait ici, avant tout
 *  script de mesure, sinon GA4 les réécrit en quittant la page). */
export function initAnalytics() {
  if (hasConsent()) loadAnalytics();
  else deleteTrackingCookies();
}
