import {
  deleteWebPushSubscription,
  getWebPushConfig,
  registerWebPushSubscription
} from "@/lib/api";

const ENABLED_KEY = "hulex-browser-notifications-enabled";
const LAST_SEEN_KEY = "hulex-browser-notifications-last-seen";
const MODE_KEY = "hulex-browser-notifications-mode";
export const BROWSER_NOTIFICATIONS_EVENT = "hulex:browser-notifications-change";
const SERVICE_WORKER_PATH = "/hulex-web-push-sw.js";

function emitBrowserNotificationsChange() {
  window.dispatchEvent(new Event(BROWSER_NOTIFICATIONS_EVENT));
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function webPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function browserNotificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationsEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ENABLED_KEY) === "true";
}

export function getBrowserNotificationsMode() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(MODE_KEY) || "";
}

export function getBrowserNotificationPermission() {
  if (!browserNotificationsSupported()) {
    return "unsupported";
  }

  return window.Notification.permission;
}

export async function enableBrowserNotifications() {
  if (!browserNotificationsSupported()) {
    return { ok: false, permission: "unsupported", error: "Browser notifications are not supported here." };
  }

  const permission = await window.Notification.requestPermission();
  if (permission !== "granted") {
    window.localStorage.removeItem(ENABLED_KEY);
    emitBrowserNotificationsChange();
    return { ok: false, permission, error: "Browser notification permission was not granted." };
  }

  let mode = "poll";

  if (webPushSupported()) {
    try {
      const config = await getWebPushConfig();

      if (config?.supported && config.publicKey) {
        const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: "/"
        });
        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(config.publicKey)
          });
        }

        await registerWebPushSubscription(subscription.toJSON());
        mode = "web-push";
      }
    } catch (error) {
      console.error("Web push registration failed:", error);
    }
  }

  window.localStorage.setItem(ENABLED_KEY, "true");
  window.localStorage.setItem(MODE_KEY, mode);
  emitBrowserNotificationsChange();
  return { ok: true, permission, mode };
}

export async function disableBrowserNotifications() {
  if (typeof window === "undefined") {
    return;
  }

  if (webPushSupported()) {
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription?.endpoint) {
        await deleteWebPushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
    } catch (error) {
      console.error("Web push unsubscribe failed:", error);
    }
  }

  window.localStorage.removeItem(ENABLED_KEY);
  window.localStorage.removeItem(MODE_KEY);
  emitBrowserNotificationsChange();
}

export function getLastSeenBrowserNotificationId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(LAST_SEEN_KEY) || "";
}

export function setLastSeenBrowserNotificationId(notificationId) {
  if (typeof window === "undefined" || !notificationId) {
    return;
  }

  window.localStorage.setItem(LAST_SEEN_KEY, notificationId);
}

export function clearLastSeenBrowserNotificationId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(LAST_SEEN_KEY);
}
