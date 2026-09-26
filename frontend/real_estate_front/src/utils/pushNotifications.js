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

/** Demande la permission et abonne l'utilisateur connecté aux notifications push.
 * Retourne "granted" | "denied" | "default" | "unsupported" | "error".
 * Ne bloque jamais l'app en cas d'échec. Pour que la demande de permission
 * s'affiche de façon fiable, l'appeler depuis un clic de l'utilisateur. */
export async function subscribeToPushNotifications() {
  try {
    if (!isPushSupported()) return "unsupported";
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return "error";

    if (Notification.permission === "denied") return "denied";
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return perm;
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const keyRes = await fetch(`${API_URL}/users/push/vapid-public-key`);
      if (!keyRes.ok) return "error";
      const { key } = await keyRes.json();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    const res = await fetch(`${API_URL}/users/me/push-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sub.toJSON()),
    });
    return res.ok ? "granted" : "error";
  } catch { return "error"; /* best-effort, jamais bloquant */ }
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
