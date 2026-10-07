// Service Worker: Cache cleanup and self-unregistration
// Ensures users always receive the latest deployed assets and prevents
// "Failed to fetch dynamically imported module" errors after deployments.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Pass all requests directly through to network without interception
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
