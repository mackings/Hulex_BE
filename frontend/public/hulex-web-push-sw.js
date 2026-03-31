self.__HULEX_PUSH_CACHE__ = "hulex-web-push-cache-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "Hulex notification";
  const options = {
    body: payload.body || "",
    icon: payload.icon || undefined,
    tag: payload.tag || "hulex-web-push",
    data: {
      url: payload.url || "/dashboard"
    }
  };

  event.waitUntil(
    caches
      .open(self.__HULEX_PUSH_CACHE__)
      .then((cache) =>
        cache.put(
          "/__hulex_last_push__",
          new Response(
            JSON.stringify({
              receivedAt: Date.now(),
              title,
              body: options.body,
              tag: options.tag,
              url: options.data.url,
              icon: options.icon || ""
            }),
            {
              headers: {
                "content-type": "application/json",
                "cache-control": "no-store"
              }
            }
          )
        )
      )
      .then(() => self.registration.showNotification(title, options))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => {
        try {
          return new URL(client.url).pathname === targetUrl;
        } catch {
          return false;
        }
      });

      if (matchingClient) {
        return matchingClient.focus();
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
