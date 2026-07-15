import API_URL from "../config";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Demande la permission et abonne l'utilisateur connecté aux notifications push.
 * Ne fait rien (silencieusement) si le navigateur ne supporte pas les push, si
 * l'utilisateur refuse, ou hors PWA/HTTPS. Ne bloque jamais l'app en cas d'échec. */
export async function subscribeToPushNotifications() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    if (Notification.permission === "denied") return;
    if (Notification.permission === "default") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
    }

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const keyRes = await fetch(`${API_URL}/users/push/vapid-public-key`);
      if (!keyRes.ok) return;
      const { key } = await keyRes.json();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    await fetch(`${API_URL}/users/me/push-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(sub.toJSON()),
    });
  } catch { /* best-effort, jamais bloquant */ }
}

/** Marque définitivement que l'utilisateur a déjà été sollicité pour les
 * notifications, pour ne demander la permission qu'une seule fois par appareil. */
export function hasAlreadyBeenPromptedForPush() {
  return localStorage.getItem("localizi_push_prompted") === "1";
}
export function markPushPrompted() {
  try { localStorage.setItem("localizi_push_prompted", "1"); } catch { /* ignore */ }
}
