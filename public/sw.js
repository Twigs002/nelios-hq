// Nelio's HQ service worker - offline app SHELL only.
// POPIA: never cache seller data. We cache static assets (brand, icons, Next
// build chunks) and an offline fallback page. Navigations are network-first and
// their responses are NEVER stored; dynamic/auth/API routes are pass-through.

const CACHE = "nhq-shell-v1";
const SHELL = ["/offline", "/brand/quay1-logo-blue.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/icon" ||
    url.pathname === "/apple-icon" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Static assets: cache-first, refresh in background. Safe, no PII.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        const fetchAndUpdate = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fetchAndUpdate;
      }),
    );
    return;
  }

  // Page navigations: network-first, fall back to the offline page. Never store
  // the response (it may contain seller data).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((r) => r || Response.error())),
    );
    return;
  }

  // Everything else (API, data): straight to the network, nothing cached.
});
