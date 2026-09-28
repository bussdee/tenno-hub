/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · Service Worker v6
   - App-Shell vorab gecacht → startet offline
   - Seiten: Netzwerk zuerst (3 s), dann Cache
   - Statische Dateien: Cache zuerst (versioniert über ?v=)
   - Drop-Tabellen: Stale-While-Revalidate (max. 12 h alt, dann im Hintergrund erneuert)
   - Item-Bilder & Schriften: Cache zuerst (begrenzt)
   - Update: neuer SW wartet, App zeigt „Aktualisieren“ → SKIP_WAITING
   Die PRECACHE-Zeile wird von tools/build-pages.mjs geschrieben.
═══════════════════════════════════════════════════════════════ */
/* @precache */ const PRECACHE = {"v":"6.0.0","files":["./","index.html","fissures.html","nightwave.html","invasions.html","bounties.html","duviri.html","daily.html","sortie.html","archon.html","baro.html","relics.html","itemfinder.html","translator.html","foundry.html","lich.html","roadmap.html","acquisition.html","glossary.html","404.html","css/app.css","js/app.js","js/pages/dashboard.js","js/pages/fissures.js","js/pages/nightwave.js","js/pages/invasions.js","js/pages/bounties.js","js/pages/duviri.js","js/pages/daily.js","js/pages/sortie.js","js/pages/baro.js","js/pages/relics.js","js/data/tips.js","js/pages/itemfinder.js","js/pages/translator.js","js/pages/foundry.js","js/pages/lich.js","js/data/roadmap.js","js/pages/roadmap.js","js/pages/acquisition.js","js/data/glossary.js","js/pages/glossary.js","manifest.json","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/mark.svg","data/frames.json"],"hash":"c651e1dac9"};

const SHELL = `th-shell-${PRECACHE.v}-${PRECACHE.hash}`;
const DATA = 'th-data-v1';
const IMG = 'th-img-v1';
const FONT = 'th-font-v1';
const KEEP = [SHELL, DATA, IMG, FONT];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE.files.map(f => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!KEEP.includes(k)) await caches.delete(k);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const hit = wins.find(w => w.url.startsWith(self.registration.scope));
    if (hit) { await hit.focus(); return hit.navigate?.(url); }
    return self.clients.openWindow(url);
  })());
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

async function networkFirstPage(e) {
  const cache = await caches.open(SHELL);
  try {
    const pre = await e.preloadResponse;
    if (pre) { cache.put(e.request, pre.clone()); return pre; }
    const res = await Promise.race([
      fetch(e.request),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3500)),
    ]);
    if (res.ok) cache.put(e.request, res.clone());
    return res;
  } catch {
    return (await cache.match(e.request, { ignoreSearch: true }))
      || (await cache.match('index.html'))
      || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(req, cacheName, { ignoreSearch = false, max = 0 } = {}) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req, { ignoreSearch });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') {
      await cache.put(req, res.clone());
      if (max) trim(cacheName, max);
    }
    return res;
  } catch (err) {
    const any = ignoreSearch ? null : await cache.match(req, { ignoreSearch: true });
    if (any) return any;
    throw err;
  }
}

async function staleWhileRevalidate(req, maxAgeMs) {
  const cache = await caches.open(DATA);
  const hit = await cache.match(req);
  const age = hit ? Date.now() - Number(hit.headers.get('x-th-cached') || 0) : Infinity;
  const refresh = fetch(req).then(async res => {
    if (!res.ok) return res;
    const body = await res.clone().blob();
    const headers = new Headers(res.headers);
    headers.set('x-th-cached', String(Date.now()));
    await cache.put(req, new Response(body, { status: res.status, statusText: res.statusText, headers }));
    return res;
  });
  if (hit) {
    if (age > maxAgeMs) refresh.catch(() => {});
    return hit;
  }
  return refresh;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') { e.respondWith(networkFirstPage(e)); return; }
    if (url.pathname.endsWith('/sw.js')) return;
    e.respondWith(cacheFirst(req, SHELL, { ignoreSearch: true }));
    return;
  }
  if (url.hostname === 'drops.warframestat.us' || url.hostname === 'raw.githubusercontent.com') {
    e.respondWith(staleWhileRevalidate(req, 12 * 3600e3));
    return;
  }
  if (url.hostname === 'cdn.warframestat.us' || url.hostname.endsWith('warframe.com') && req.destination === 'image') {
    e.respondWith(cacheFirst(req, IMG, { max: 400 }).catch(() => new Response('', { status: 404 })));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, FONT, { max: 30 }));
    return;
  }
  /* api.warframestat.us, warframe.market: direkt ans Netz – die App cacht selbst */
});
