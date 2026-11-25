// Sofra service worker: keeps the app working offline once it has been opened.
// Strategy: network first, so a phone always gets the newest version when it is online;
// the saved copy is used only when the network is unavailable.
// Bump VERSION whenever you publish changes, so installed phones refresh straight away.
const VERSION = 'sofra-v8';
const CORE = [
  './',
  'index.html',
  'styles.css',
  'recipes.js',
  'recipes-tr.js',
  'i18n.js',
  'subs.js',
  'pantry.js',
  'diet.js',
  'draw.js',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-64.png'
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  // cache: 'reload' skips the browser's HTTP cache, so the saved copy is the fresh one.
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  let hadOld = false;
  const ready = (async () => {
    const keys = await caches.keys();
    hadOld = keys.some(k => k !== VERSION);
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })();
  event.waitUntil(ready);
  // Pages still showing an older version reload onto the new one. This must start only after
  // activation has finished: a reload started during activation would wait on it forever.
  ready.then(() => {
    if (!hadOld) return;
    setTimeout(() => {
      self.clients.matchAll({ type: 'window' })
        .then(wins => wins.forEach(w => { try { w.navigate(w.url).catch(() => {}); } catch (e) {} }))
        .catch(() => {});
    }, 0);
  });
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      // no-cache: always check with the server (cheap when nothing changed).
      const res = await fetch(req, sameOrigin ? { cache: 'no-cache' } : undefined);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch (e) {
      const cached = (await cache.match(req, { ignoreSearch: true })) ||
                     (req.mode === 'navigate' ? await cache.match('./') : undefined);
      if (cached) return cached;
      throw e;
    }
  })());
});
