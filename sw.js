/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB  sw.js  v5
   - Bumped to 'tenno-hub-v5' → deletes all old caches on activate
   - skipWaiting + clients.claim = takes over IMMEDIATELY
   - forceRefresh message: clears ALL caches on demand
═══════════════════════════════════════════════════════════════ */
const CACHE_NAME = 'tenno-hub-v6';

const STATIC_ASSETS = [
  '/', '/index.html',
  '/fissures.html', '/nightwave.html', '/invasions.html',
  '/relics.html', '/baro.html', '/sortie.html', '/archon.html',
  '/duviri.html', '/translator.html', '/glossary.html',
  '/acquisition.html', '/roadmap.html', '/resources.html',
  '/daily.html', '/lich.html', '/foundry.html', '/itemfinder.html',
  '/404.html',
  '/css/style.css',
  '/js/core.js', '/js/shell.js', '/js/worldstate.js',
  '/js/beginner.js', '/js/relics.js', '/js/duviri.js',
  '/js/glossary.js', '/js/translator.js', '/js/acquisition.js',
  '/js/lich.js', '/js/foundry.js', '/js/itemfinder.js',
  '/manifest.json',
];

/* ── Install: pre-cache static assets ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // take over immediately
  );
});

/* ── Activate: delete ALL old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim()) // control all open pages
  );
});

/* ── Message: force refresh from UI button ── */
self.addEventListener('message', e => {
  if (e.data?.type === 'FORCE_REFRESH') {
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => {
      // Notify all clients to reload
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ type: 'RELOAD' }))
      );
    });
  }
});

/* ── Fetch: network-first for API, cache-first for assets ── */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAPI = url.hostname.endsWith('warframestat.us') ||
                url.hostname === 'api.warframe.market' ||
                url.hostname === 'drops.warframestat.us';
  const isFont = url.hostname === 'fonts.googleapis.com' ||
                 url.hostname === 'fonts.gstatic.com';

  if (isAPI) {
    /* Network-first → fall back to cache */
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else if (isFont) {
    /* Cache-first for fonts */
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  } else {
    /* Network-first for HTML/CSS/JS → always try fresh, fall back to cache */
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(c => c || fetch(e.request)))
    );
  }
});
