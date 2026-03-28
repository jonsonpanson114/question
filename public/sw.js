const CACHE_NAME = "dojo-v1";
const urlsToCache = [
  "/",
  "/practice",
  "/practice/history",
  "/practice/casual",
  "/practice/oneonone",
  "/practice/introspect",
  "/practice/book",
];

let notificationTimeouts = [];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SCHEDULE_NOTIFICATION") {
    scheduleNotification(e.data.time, e.data.title, e.data.body);
  }
});

function scheduleNotification(targetTime, title, body) {
  const now = Date.now();
  const delay = targetTime - now;

  if (delay <= 0) {
    // 既に過ぎている場合は即時通知
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.svg",
    });
    return;
  }

  // 既存のタイマーをクリア
  notificationTimeouts.forEach(id => clearTimeout(id));
  notificationTimeouts = [];

  // 新しいタイマーをセット
  const timeoutId = setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: "/icon-192.svg",
    });
  }, delay);

  notificationTimeouts.push(timeoutId);
}

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(e.request).then((fetchResponse) => {
        const clonedResponse = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, clonedResponse);
        });
        return fetchResponse;
      });
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.delete(CACHE_NAME));
});

// Push event handler - receives push notifications from server
self.addEventListener("push", (e) => {
  if (!e.data) return;

  try {
    const data = e.data.json();

    const options = {
      body: data.body,
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      vibrate: [200, 100, 200],
      tag: data.type || "default",
      requireInteraction: true,
      data: {
        url: data.url || "/practice",
        type: data.type || "default",
      },
      actions: [
        {
          action: "practice",
          title: "練習を始める",
          icon: "/icon-192.svg",
        },
        {
          action: "close",
          title: "閉じる",
        },
      ],
    };

    e.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error("Push event error:", error);
  }
});

// Notification click handler
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  if (e.action === "practice") {
    // Open practice page
    e.waitUntil(
      clients.openWindow("/practice")
    );
  } else if (e.action === "close") {
    // Just close the notification
    return;
  } else {
    // Default action: open the URL from notification data
    const urlToOpen = e.notification.data?.url || "/";
    e.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Handle subscription refresh
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
    })
    .then((subscription) => {
      // Send new subscription to server
      return fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      });
    })
    .catch((error) => {
      console.error("Subscription refresh failed:", error);
    })
  );
});
