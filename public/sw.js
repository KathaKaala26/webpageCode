/* Katha & Kaala service worker
 * - Pages: network-first, falls back to the last cached copy, then /offline.html
 * - Build assets (/_next/static): cache-first (they're content-hashed)
 * - Artwork images & fonts: stale-while-revalidate, capped in size
 * - Never caches checkout, orders, admin or API calls.
 */
const VERSION = "kk-v1";
const SHELL = `${VERSION}-shell`;
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const IMAGES = `${VERSION}-images`;

const PRECACHE = [
  "/",
  "/shop",
  "/pattachitra",
  "/more-about-us",
  "/books",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const NEVER_CACHE = [/^\/api\//, /^\/admin/, /^\/checkout/, /^\/order\//];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function networkFirstPage(req) {
  try {
    const res = await fetch(req);
    if (res.ok && res.type === "basic") {
      const copy = res.clone();
      caches.open(PAGES).then((c) => c.put(req, copy).then(() => trim(PAGES, 40)));
    }
    return res;
  } catch {
    const cached = (await caches.match(req, { ignoreSearch: false })) || (await caches.match(req, { ignoreSearch: true }));
    return cached || caches.match("/offline.html");
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok) {
    const copy = res.clone();
    caches.open(cacheName).then((c) => c.put(req, copy));
  }
  return res;
}

async function staleWhileRevalidate(req, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(req, res.clone()).then(() => trim(cacheName, max));
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (NEVER_CACHE.some((r) => r.test(url.pathname))) return;
    if (req.mode === "navigate") return event.respondWith(networkFirstPage(req));
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))
      return event.respondWith(cacheFirst(req, ASSETS));
    if (url.pathname.startsWith("/_next/image")) return event.respondWith(staleWhileRevalidate(req, IMAGES, 150));
    return; // let the browser handle everything else (RSC payloads etc.)
  }

  if (url.hostname === "static.wixstatic.com") return event.respondWith(staleWhileRevalidate(req, IMAGES, 150));
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com")
    return event.respondWith(staleWhileRevalidate(req, ASSETS, 30));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
