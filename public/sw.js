/* HomeVault service worker — offline-first app shell.
   Scope is the origin root; all shell URLs are root-absolute so they resolve
   identically no matter which SPA path the page was served from. */
const VERSION = 'homevault-v3.0.0';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const ORIGIN = self.location.origin;
const url = (path) => new URL(path, ORIGIN).href;
const SHELL_URL = url('/index.html');
const ROOT_URL = url('/');

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-256.png',
  '/icon-384.png',
  '/icon-512.png',
  '/maskable-icon-192.png',
  '/maskable-icon-512.png',
].map(url);

self.addEventListener('install', (event) => {
  // Skip waiting immediately so the SW controls the page on the very first
  // visit. Chrome evaluates installability only once a fetch-handling SW is
  // active and controlling — waiting for a second navigation delays
  // beforeinstallprompt indefinitely.
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        SHELL_ASSETS.map(async (asset) => {
          try {
            const res = await fetch(new Request(asset, { cache: 'reload' }));
            if (res && res.ok) await cache.put(asset, res.clone());
          } catch (err) {
            /* offline at install time — runtime caching fills the gap */
          }
        }),
      );
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch (err) {
          /* navigation preload unsupported */
        }
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/** Documents: network-first, cache fallback so the app opens offline. */
async function handleDocument(event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preload = await event.preloadResponse;
    if (preload) {
      cache.put(SHELL_URL, preload.clone());
      return preload;
    }
    const fresh = await fetch(event.request);
    if (fresh && fresh.ok) cache.put(SHELL_URL, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = (await cache.match(SHELL_URL)) || (await cache.match(ROOT_URL));
    if (cached) return cached;
    return new Response('<!doctype html><title>HomeVault</title><p>Offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

/** Same-origin assets: cache-first against a version-scoped cache. */
async function handleAsset(request) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res && res.ok && res.type === 'basic') cache.put(request, res.clone());
    return res;
  } catch (err) {
    const fallback = await cache.match(request, { ignoreSearch: true });
    if (fallback) return fallback;
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

/** Cross-origin fonts: stale-while-revalidate, always resolving to a Response. */
async function handleThirdParty(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  if (hit) return hit;
  const res = await network;
  return res || new Response('', { status: 504, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const target = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleDocument(event));
    return;
  }

  if (target.origin === self.location.origin) {
    event.respondWith(handleAsset(request));
    return;
  }

  if (/(^|\.)(googleapis|gstatic)\.com$/.test(target.hostname)) {
    event.respondWith(handleThirdParty(request));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || ROOT_URL;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(target).catch(() => undefined);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
