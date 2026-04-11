"use client";

import { useEffect, useState } from "react";
import {
  BROWSER_NOTIFICATIONS_EVENT,
  browserNotificationsSupported,
  disableBrowserNotifications,
  enableBrowserNotifications,
  getBrowserNotificationPermission,
  getBrowserNotificationsEnabled
} from "@/lib/browser-notifications";

export function BrowserAlertsInline() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState("default");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const isSupported = browserNotificationsSupported();
      setSupported(isSupported);
      setEnabled(isSupported ? getBrowserNotificationsEnabled() : false);
      setPermission(isSupported ? getBrowserNotificationPermission() : "unsupported");
    };

    syncState();
    window.addEventListener("storage", syncState);
    window.addEventListener(BROWSER_NOTIFICATIONS_EVENT, syncState);

    return () => {
      window.removeEventListener("storage", syncState);
      window.removeEventListener(BROWSER_NOTIFICATIONS_EVENT, syncState);
    };
  }, []);

  if (!supported) {
    return null;
  }

  const handleToggle = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      if (enabled && permission === "granted") {
        await disableBrowserNotifications();
        setMessage("Browser updates turned off for this device.");
        return;
      }

      const result = await enableBrowserNotifications();
      if (!result.ok) {
        setMessage(result.error || "Could not enable browser updates.");
        return;
      }

      setMessage(
        result.mode === "web-push"
          ? "Background rate updates are on for this browser."
          : "Browser updates are on while this tab stays available."
      );
    } finally {
      setIsSubmitting(false);
      setEnabled(getBrowserNotificationsEnabled());
      setPermission(getBrowserNotificationPermission());
    }
  };

  return (
    <div className="browser-alerts-inline">
      <div className="browser-alerts-inline-copy">
        <strong>Automatic browser updates</strong>
        <span>
          {enabled && permission === "granted"
            ? "This browser is set to receive rate digests."
            : "Turn on background rate updates for this device."}
        </span>
        {message ? <span>{message}</span> : null}
      </div>

      <button
        className="button button-ghost button-small"
        disabled={isSubmitting}
        onClick={handleToggle}
        type="button"
      >
        {isSubmitting
          ? "Updating..."
          : enabled && permission === "granted"
            ? "Turn off"
            : "Enable"}
      </button>
    </div>
  );
}
