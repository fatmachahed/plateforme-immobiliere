import API_URL from "../config";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Le navigateur sait-il recevoir des notifications push ? */
export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Raison du dernier échec d'abonnement (affichée à l'admin pour diagnostic). */
export let lastPushError = "";

/** Rejette la promesse si elle ne se résout pas dans le délai (évite un bouton bloqué). */
function withTimeout(promise, ms, etape) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`délai dépassé (${etape})`)), ms)),
  ]);
}

/** Demande la permission et abonne l'utilisateur connecté aux notifications push.
 * renouveler : remplace l'abonnement existant de l'appareil par un neuf.
 * Retourne "granted" | "denied" | "default" | "unsupported" | "error" ; en cas
 * d'échec, la raison est dans lastPushError. Ne bloque jamais l'app.
 * Pour que la demande de permission s'affiche de façon fiable, l'appeler
 * depuis un clic de l'utilisateur. */
export async function subscribeToPushNotifications({ renouveler = false } = {}) {
  lastPushError = "";
  try {
    if (!isPushSupported()) { lastPushError = "navigateur non compatible"; return "unsupported"; }
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) { lastPushError = "non connecté"; return "error"; }

    if (Notification.permission === "denied") return "denied";
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { lastPushError = `permission : ${perm}`; return perm; }
    }

    const reg = await withTimeout(navigator.serviceWorker.ready, 10000, "service worker");
    let sub = await reg.pushManager.getSubscription();
    // Sur demande explicite (bouton), on repart d'un abonnement neuf : un abonnement
    // que le navigateur croit valide peut avoir été invalidé côté service push (HTTP 410).
    if (sub && renouveler) {
      try { await sub.unsubscribe(); } catch { /* ignore */ }
      sub = null;
    }
    if (!sub) {
      const keyRes = await fetch(`${API_URL}/users/push/vapid-public-key`);
      if (!keyRes.ok) { lastPushError = `clé VAPID : HTTP ${keyRes.status}`; return "error"; }
      const { key } = await keyRes.json();
      sub = await withTimeout(reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }), 15000, "abonnement push");
    }

    const res = await fetch(`${API_URL}/users/me/push-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sub.toJSON()),
    });
    if (!res.ok) { lastPushError = `enregistrement : HTTP ${res.status}`; return "error"; }
    return "granted";
  } catch (e) {
    lastPushError = `${e?.name || "Erreur"} : ${e?.message || e}`;
    return "error"; /* best-effort, jamais bloquant */
  }
}

/** Si la permission est déjà accordée, ré-enregistre silencieusement l'abonnement
 * de cet appareil pour le compte connecté (changement de compte, abonnement
 * expiré puis recréé…). Ne demande jamais rien à l'utilisateur. */
export function syncPushSubscriptionIfGranted() {
  if (isPushSupported() && Notification.permission === "granted") {
    subscribeToPushNotifications();
  }
}

/** Marque définitivement que l'utilisateur a déjà été sollicité pour les
 * notifications, pour ne demander la permission qu'une seule fois par appareil. */
export function hasAlreadyBeenPromptedForPush() {
  return localStorage.getItem("localizi_push_prompted") === "1";
}
export function markPushPrompted() {
  try { localStorage.setItem("localizi_push_prompted", "1"); } catch { /* ignore */ }
}
