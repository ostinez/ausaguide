const CACHE_NAME = "ausaguide-offline-cache-v1";
const OFFLINE_URLS = [
  "/",
  "/tours",
  "/auth",
  "/index.html",
  "/offline.html",
  "/logo-mark.png",
  "/logo-primary.png",
  "/vite.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Gracefully attempt caching of crucial URLs individually
      return Promise.allSettled(
        OFFLINE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url} during install:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip caching for Supabase API, Sentry, PostHog, or Hot Module Reloading (Vite)
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("sentry") ||
    url.hostname.includes("posthog") ||
    url.pathname.includes("@vite") ||
    url.pathname.includes("@react-refresh") ||
    url.pathname.includes("hmr") ||
    event.request.url.includes("ws://") ||
    event.request.url.includes("wss://")
  ) {
    return;
  }

  // Handle navigation requests (page loads / refreshes)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version of the page
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fall back to index.html for SPA routes (e.g. /tours, /auth)
            return caches.match("/index.html").then((indexResponse) => {
              if (indexResponse) {
                return indexResponse;
              }
              // If index.html is not available, show offline.html
              return caches.match("/offline.html");
            });
          });
        })
    );
    return;
  }

  // Stale-While-Revalidate caching strategy for other static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in the background and update cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Silently catch network errors while offline
          });
        return cachedResponse;
      }

      // Cache miss: fetch from network
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});

