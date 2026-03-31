"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { getNotifications } from "@/lib/api";
import {
  BROWSER_NOTIFICATIONS_EVENT,
  browserNotificationsSupported,
  clearLastSeenBrowserNotificationId,
  getBrowserNotificationsMode,
  getBrowserNotificationPermission,
  getBrowserNotificationsEnabled,
  getLastSeenBrowserNotificationId,
  setLastSeenBrowserNotificationId
} from "@/lib/browser-notifications";
import { getProviderMeta } from "@/lib/providers";

const POLL_INTERVAL_MS = 30_000;
const RECENT_BOOTSTRAP_WINDOW_MS = 10 * 60 * 1000;

function getNotificationIcon(item) {
  const providerMeta = getProviderMeta(item?.provider);
  return providerMeta?.logo || undefined;
}

function getNotificationTitle(item) {
  if (item?.kind === "rate_digest") {
    return "Latest 5-hour rate update";
  }

  if (item?.provider?.name) {
    return `${item.provider.name} hit your alert`;
  }

  return "Rate alert triggered";
}

function showBrowserNotification(item) {
  const notification = new window.Notification(getNotificationTitle(item), {
    body: item.message,
    icon: getNotificationIcon(item),
    tag: `hulex-alert-${item._id}`
  });

  notification.onclick = () => {
    window.focus();
    window.location.assign(item?.kind === "rate_digest" ? "/compare" : "/dashboard");
    notification.close();
  };
}

function getFreshNotifications(items, lastSeenId) {
  if (!items.length) {
    return [];
  }

  if (!lastSeenId) {
    const now = Date.now();
    const recentItems = items.filter((item) => {
      const triggeredAt = new Date(item?.triggeredAt || item?.createdAt || 0).getTime();
      return Number.isFinite(triggeredAt) && now - triggeredAt <= RECENT_BOOTSTRAP_WINDOW_MS;
    });

    setLastSeenBrowserNotificationId(items[0]._id);
    return recentItems.reverse();
  }

  const fresh = [];
  for (const item of items) {
    if (item._id === lastSeenId) {
      break;
    }

    fresh.push(item);
  }

  if (fresh.length) {
    setLastSeenBrowserNotificationId(items[0]._id);
  }

  return fresh.reverse();
}

export function BrowserNotificationManager() {
  const { isAuthenticated, isHydrated } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState("");
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    if (!browserNotificationsSupported()) {
      setPermission("unsupported");
      return undefined;
    }

    const syncState = () => {
      setEnabled(getBrowserNotificationsEnabled());
      setMode(getBrowserNotificationsMode());
      setPermission(getBrowserNotificationPermission());
    };

    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener(BROWSER_NOTIFICATIONS_EVENT, syncState);
    document.addEventListener("visibilitychange", syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener(BROWSER_NOTIFICATIONS_EVENT, syncState);
      document.removeEventListener("visibilitychange", syncState);
    };
  }, []);

  useEffect(() => {
    if (
      !isHydrated ||
      !isAuthenticated ||
      !enabled ||
      mode === "web-push" ||
      permission !== "granted" ||
      !browserNotificationsSupported()
    ) {
      return undefined;
    }

    let isCancelled = false;

    const pollNotifications = async () => {
      try {
        const data = await getNotifications();
        const items = data.items || [];
        const freshItems = getFreshNotifications(items, getLastSeenBrowserNotificationId());

        if (isCancelled || !freshItems.length) {
          return;
        }

        freshItems.forEach(showBrowserNotification);
      } catch {
        // Fail quietly and keep polling.
      }
    };

    pollNotifications();
    const intervalId = window.setInterval(pollNotifications, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, isAuthenticated, isHydrated, mode, permission]);

  useEffect(() => {
    if (!enabled) {
      clearLastSeenBrowserNotificationId();
    }
  }, [enabled]);

  return null;
}
