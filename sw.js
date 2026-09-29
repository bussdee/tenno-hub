/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB  sw.js  v5.2
   - Only same-origin GET requests are handled here. API hosts
     (warframestat.us, drops.warframestat.us), fonts and the counter script
     go straight to the network: the one and only stale-data layer for API
     answers is the localStorage cache in core.js (it knows how old the data
     is and shows the stale banner / STALE status).
   - Precache is best-effort: one missing file no longer breaks the install.
   - Paths are relative to sw.js, so this also works outside the domain root.
   - skipWaiting + clients.claim = takes over immediately; a new CACHE_NAME
     deletes all old caches on activate.
   - FORCE_REFRESH message: clears ALL caches on demand.
═══════════════════════════════════════════════════════════════ */
const CACHE_NAME = 'tenno-hub-5.2';

const STATIC_ASSETS = [
  './', 'index.html',
  'fissures.html', 'nightwave.html', 'invasions.html',
  'relics.html', 'baro.html', 'sortie.html', 'archon.html',
  'duviri.html', 'translator.html', 'glossary.html',
  'acquisition.html', 'roadmap.html', 'resources.html',
  'daily.html', 'lich.html', 'foundry.html', 'itemfinder.html',
  '404.html',
  'css/style.css',
  'js/core.js', 'js/shell.js', 'js/worldstate.js',
  'js/beginner.js', 'js/relics.js', 'js/duviri.js',
  'js/glossary.js', 'js/translator.js', 'js/acquisition.js',
  'js/lich.js', 'js/foundry.js', 'js/itemfinder.js',
  'manifest.json',
];

/* ── Install: pre-cache static assets (each one on its own) ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => Promise.allSettled(STATIC_ASSETS.map(u => c.add(u))))
      .then(() => self.skipWaiting()) // take over immediately
  );
});

/* ── Activate: delete ALL old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
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

/* ── Fetch: network-first for our own files, cache only as offline fallback ── */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // cache.put() rejects non-GET
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // APIs, fonts, counter: not ours

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        /* offline: ignoreSearch so js/core.js?v=5.2 finds the precached js/core.js */
        caches.match(req, { ignoreSearch: true }).then(hit =>
          hit ||
          (req.mode === 'navigate' ? caches.match('404.html') : null) ||
          Response.error()
        )
      )
  );
});
