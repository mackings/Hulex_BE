"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { compareRates, getNotifications } from "@/lib/api";
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
const DIGEST_INTERVAL_MS =
  Number(process.env.NEXT_PUBLIC_RATE_DIGEST_INTERVAL_MINUTES || 5) * 60 * 1000;
const RECENT_BOOTSTRAP_WINDOW_MS = 10 * 60 * 1000;
const LOCAL_DIGEST_LAST_SHOWN_KEY = "hulex-browser-notifications-last-digest-at";
const DIGEST_DEFAULT_QUERY = {
  fromCurrency: "USD",
  toCurrency: "NGN",
  fromCountry: "US",
  toCountry: "NG",
  amount: "100"
};

function getNotificationIcon(item) {
  const providerMeta = getProviderMeta(item?.provider);
  return providerMeta?.logo || undefined;
}

function getNotificationTitle(item) {
  if (item?.kind === "rate_digest") {
    return "Latest rate update";
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

function getLastLocalDigestTimestamp() {
  if (typeof window === "undefined") {
    return 0;
  }

  return Number(window.localStorage.getItem(LOCAL_DIGEST_LAST_SHOWN_KEY) || 0);
}

function setLastLocalDigestTimestamp(value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_DIGEST_LAST_SHOWN_KEY, String(value));
}

function buildLocalDigestMessage(result) {
  const bestProvider = result?.stats?.bestRate;
  const runnerUp = (result?.providers || [])[1] || null;
  const bestAmount = Number(bestProvider?.receivedAmount || 0);
  const runnerUpAmount = Number(runnerUp?.receivedAmount || 0);
  const leadAmount = Math.max(bestAmount - runnerUpAmount, 0);
  const bestName = bestProvider?.name || "Top provider";
  const targetCode = result?.query?.target?.code || DIGEST_DEFAULT_QUERY.toCurrency;

  if (!runnerUp || !leadAmount) {
    return `${bestName} currently leads USD to NGN with the strongest payout.`;
  }

  return `${bestName} leads USD to NGN by ${leadAmount.toLocaleString("en-US", {
    maximumFractionDigits: 0
  })} ${targetCode} right now.`;
}

function showLocalDigestNotification(result) {
  const bestProvider = result?.stats?.bestRate;
  const title = "Latest rate update";
  const message = buildLocalDigestMessage(result);
  const notification = new window.Notification(title, {
    body: message,
    icon: getNotificationIcon({ provider: bestProvider }),
    tag: "hulex-local-rate-digest"
  });

  notification.onclick = () => {
    window.focus();
    window.location.assign("/compare");
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
      !enabled ||
      permission !== "granted" ||
      !browserNotificationsSupported()
    ) {
      return undefined;
    }

    let isCancelled = false;

    const pollNotifications = async () => {
      if (!isAuthenticated) {
        return;
      }

      try {
        const data = await getNotifications();
        const items = data.items || [];
        const freshItems = getFreshNotifications(items, getLastSeenBrowserNotificationId()).filter(
          (item) => mode !== "web-push" || item?.deliveryStatus !== "sent"
        );

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
    if (
      !isHydrated ||
      !enabled ||
      permission !== "granted" ||
      !browserNotificationsSupported()
    ) {
      return undefined;
    }

    let cancelled = false;

    const maybeShowDigest = async () => {
      const now = Date.now();
      const lastShownAt = getLastLocalDigestTimestamp();

      if (lastShownAt && now - lastShownAt < DIGEST_INTERVAL_MS) {
        return;
      }

      try {
        const result = await compareRates(DIGEST_DEFAULT_QUERY);
        if (cancelled || !result?.stats?.bestRate) {
          return;
        }

        showLocalDigestNotification(result);
        setLastLocalDigestTimestamp(now);
      } catch {
        // Fail quietly and retry on next interval.
      }
    };

    maybeShowDigest();
    const intervalId = window.setInterval(maybeShowDigest, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [enabled, isHydrated, permission]);

  useEffect(() => {
    if (!enabled) {
      clearLastSeenBrowserNotificationId();
      setLastLocalDigestTimestamp(0);
    }
  }, [enabled]);

  return null;
}
