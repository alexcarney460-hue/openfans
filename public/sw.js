// OpenFans Service Worker v1.0.0
const CACHE_NAME = "openfans-cache-v1";

const PRE_CACHE_URLS = ["/offline.html", "/", "/login", "/explore"];

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".avif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
];

// ── Message handler: controlled skipWaiting via update banner ────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Install: pre-cache offline page and key routes ──────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_URLS);
    })
  );
});

// ── Activate: clean up old caches, claim clients ────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ── Fetch: route requests to the correct caching strategy ───────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache non-GET requests (POST, PUT, DELETE, etc.)
  if (request.method !== "GET") {
    return;
  }

  // API requests: network-only, never cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Supabase auth endpoints: network-only
  if (url.pathname.startsWith("/auth/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: cache-first with network fallback
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Next.js static chunks: cache-first (immutable hashed filenames)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Next.js image optimization: network-first (dynamic query params)
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation requests: network-first with offline fallback
  // Skip caching authenticated dashboard pages to prevent stale content after logout
  if (request.mode === "navigate") {
    if (url.pathname.startsWith("/dashboard")) {
      event.respondWith(
        fetch(request).catch(() => caches.match("/offline.html"))
      );
      return;
    }
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(networkFirst(request));
});

// ── Strategies ──────────────────────────────────────────────────────────────

/**
 * Cache-first: serve from cache, fall back to network (and update cache).
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 408, statusText: "Offline" });
  }
}

/**
 * Network-first for navigation: try network, fall back to cache,
 * then serve the offline page as last resort.
 */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return caches.match("/offline.html");
  }
}

/**
 * Network-first: try network, fall back to cache.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("", { status: 408, statusText: "Offline" });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}
