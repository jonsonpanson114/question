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
