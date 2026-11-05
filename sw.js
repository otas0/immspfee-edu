const CACHE = 'immspfee-edu-__BUILD__';
// Keep aligned with index.html modulepreload + scripts/stamp-build REQUIRED.
const PRECACHE = [
  './',
  './index.html',
  './css/edu.css',
  './js/app.js',
  './js/fmt.js',
  './js/i18n.js',
  './js/curricula/index.js',
  './js/sims/registry.js',
  './assets/immspfee-education-logo.png',
  './assets/edu-mono-32.png',
  './assets/edu-mono-180.png',
  './assets/edu-mono-512.png',
];

function isCode(url) {
  return (
    url.pathname.endsWith('.js')
    || url.pathname.endsWith('.mjs')
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/')
    || url.pathname.endsWith('/immspfee-edu')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Scripts and HTML must track GitHub Pages deploys. A stale registry with a
  // newer curriculum leaves Ready lessons on an empty stage. Bypass the HTTP
  // cache too — fetch() alone can still return a disk-cached module.
  if (req.mode === 'navigate' || isCode(url)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) {
        fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); }).catch(() => {});
        return cached;
      }
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }),
  );
});
