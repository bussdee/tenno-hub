/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · app.js  v6
   Kern der App: Zustand, i18n, Speicher, API-Schicht, globaler Ticker,
   Shell (Header, Navigation, Suche), Benachrichtigungen, PWA.
   Jede Seite lädt app.js + js/pages/<seite>.js und ruft TH.page({...}) auf.
═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

const VERSION = '6.0.0';
const WS_URL    = 'https://api.warframestat.us/pc/';
const DROPS_URL = ['https://drops.warframestat.us/data/all.slim.json',
                   'https://raw.githubusercontent.com/WFCD/warframe-drop-data/main/data/all.slim.json'];
const MARKET_V2 = 'https://api.warframe.market/v2';
const IMG_CDN   = 'https://cdn.warframestat.us/img/';

/* ═══ Speicher (localStorage kann in privaten Fenstern werfen) ═══ */
const store = {
  get(k, def) {
    try { const v = localStorage.getItem('th_' + k); return v == null ? def : JSON.parse(v); }
    catch { return def; }
  },
  set(k, v) { try { localStorage.setItem('th_' + k, JSON.stringify(v)); } catch {} },
  del(k)    { try { localStorage.removeItem('th_' + k); } catch {} },
};

/* Migration der alten v5-Schlüssel (th_lang war roh gespeichert, nicht JSON) */
(function migrate() {
  try {
    if (store.get('schema', 0) >= 6) return;
    const rawLang = localStorage.getItem('th_lang');
    if (rawLang === 'de' || rawLang === 'en') localStorage.setItem('th_lang', JSON.stringify(rawLang));
    ['th_platform', 'th_sidebar', 'th_last_day', 'th_notifs'].forEach(k => localStorage.removeItem(k));
    Object.keys(localStorage).filter(k => k.startsWith('th_api_')).forEach(k => localStorage.removeItem(k));
    store.set('schema', 6);
  } catch {}
})();

/* ═══ Sprache ═══ */
const detected = (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en';
const state = {
  lang: store.get('lang', detected) === 'de' ? 'de' : 'en',
};
const L = (en, de) => state.lang === 'de' ? (de ?? en) : en;
const isDE = () => state.lang === 'de';

/* ═══ Helfer ═══ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ESC[c]);
const ts  = v => v ? new Date(v).getTime() : 0;
const now = () => Date.now();
const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const fmtNum = n => Number(n || 0).toLocaleString(isDE() ? 'de-DE' : 'en-US');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');

const pad = n => String(n).padStart(2, '0');
/* short: 1:02:03 / 02:03  ·  long: 2T 3h 04m / 3h 04m 05s */
function fmtDur(ms, mode = 'short') {
  if (!(ms > 0)) return mode === 'short' ? '0:00' : '0s';
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
        m = Math.floor(s % 3600 / 60), sec = s % 60;
  if (mode === 'short') {
    const H = d * 24 + h;
    return H > 0 ? `${H}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
  }
  const D = isDE() ? 'T' : 'd';
  if (d > 0) return `${d}${D} ${h}h ${pad(m)}m`;
  if (h > 0) return `${h}h ${pad(m)}m ${pad(sec)}s`;
  return `${m}m ${pad(sec)}s`;
}
function fmtTime(t) {
  return new Date(t).toLocaleString(isDE() ? 'de-DE' : 'en-GB',
    { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function fmtAgo(t) {
  const m = Math.round((now() - ts(t)) / 60000);
  if (m < 1) return L('just now', 'gerade eben');
  if (m < 60) return L(`${m} min ago`, `vor ${m} Min.`);
  const h = Math.round(m / 60);
  if (h < 48) return L(`${h} h ago`, `vor ${h} Std.`);
  return L(`${Math.round(h / 24)} days ago`, `vor ${Math.round(h / 24)} Tagen`);
}
/* "Tolstoj (Mercury)" → {node:'Tolstoj', planet:'Mercury'} */
function splitNode(s) {
  const m = String(s || '').match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { node: m[1], planet: m[2] } : { node: String(s || ''), planet: '' };
}
/* Nächster Wochenreset: Montag 00:00 UTC */
function nextWeekly() {
  const d = new Date(), dow = d.getUTCDay();
  const add = ((8 - dow) % 7) || 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + add);
}
function nextDaily() {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}
const utcDay  = () => new Date().toISOString().slice(0, 10);
const utcWeek = () => new Date(nextWeekly() - 7 * 864e5).toISOString().slice(0, 10);

/* ═══ Icons (eigene, schlanke Linien-Icons im 24er-Raster) ═══ */
const ICONS = {
  home:     '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  radar:    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18 6"/>',
  fissure:  '<path d="M12 2 20 12 12 22 4 12Z"/><path d="m12 7-2 5 3 1-1 4"/>',
  moon:     '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  swords:   '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4M5 21l-2-2"/>',
  target:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  spiral:   '<path d="M12 12a1.5 1.5 0 1 1 1.5-1.5A3.5 3.5 0 0 1 10 14a5 5 0 0 1-5-5 6.5 6.5 0 0 1 6.5-6.5A8 8 0 0 1 19.5 10.5 9.5 9.5 0 0 1 10 20"/>',
  check:    '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m8 12 3 3 5-6"/>',
  bolt:     '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
  crown:    '<path d="m3 8 4 4 5-7 5 7 4-4-2 11H5Z"/>',
  coins:    '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.7-2.7-3-6-3"/>',
  relic:    '<path d="M12 2 21 7v10l-9 5-9-5V7Z"/><path d="m12 7 4.5 2.5v5L12 17l-4.5-2.5v-5Z"/>',
  search:   '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  lang:     '<path d="M4 5h9M8.5 3v2M11 5c-1 4-3.5 7-7 9M6 9c1.5 2.5 3.5 4 6 5"/><path d="m13 21 4-9 4 9M14.5 18h5"/>',
  book:     '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M4 19.5V21.5M8 7h8M8 11h6"/>',
  map:      '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/>',
  frame:    '<path d="M12 2c3 2 5 5 5 9l-2 3v6l-3 2-3-2v-6l-2-3c0-4 2-7 5-9Z"/><path d="M10 9h4"/>',
  skull:    '<path d="M12 3a8 8 0 0 0-5 14.2V21h10v-3.8A8 8 0 0 0 12 3Z"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><path d="M10 21v-2M14 21v-2"/>',
  hammer:   '<path d="m15 12-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9"/><path d="m17.6 15 4.4-4.4-6.6-6.6-2.4 2.4 1 1-3 3"/>',
  bell:     '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  refresh:  '<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  copy:     '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  x:        '<path d="M18 6 6 18M6 6l12 12"/>',
  menu:     '<path d="M4 6h16M4 12h16M4 18h16"/>',
  grid:     '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  chevron:  '<path d="m9 6 6 6-6 6"/>',
  down:     '<path d="m6 9 6 6 6-6"/>',
  clock:    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  alert:    '<path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17v.5"/>',
  offline:  '<path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2-1.5M2 8.8a15 15 0 0 1 4.2-2.7M22 8.8A15 15 0 0 0 10.7 5"/><path d="M12 20h.01"/>',
  trophy:   '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  shield:   '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  star:     '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z"/>',
  news:     '<path d="M4 4h13v16H6a2 2 0 0 1-2-2Z"/><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3"/>',
  storm:    '<path d="M4 14a5 5 0 0 1 2-9.6A6 6 0 0 1 17.7 6 4.5 4.5 0 0 1 19 14.8"/><path d="m13 11-3 5h4l-3 5"/>',
  steel:    '<path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  sparkle:  '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  filter:   '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
  plus:     '<path d="M12 5v14M5 12h14"/>',
  trash:    '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  upload:   '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
  phone:    '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  share:    '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/>',
  pin:      '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
  gift:     '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13"/><path d="M12 8c-1.5-4-6-4-6-1.5S9 8 12 8c3 0 6 .5 6-1.5S13.5 4 12 8"/>',
};
const icon = (name, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
function injectSprite() {
  if (document.getElementById('thSprite')) return;
  const defs = Object.entries(ICONS).map(([k, v]) =>
    `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<svg id="thSprite" width="0" height="0" style="position:absolute" aria-hidden="true">${defs}</svg>`);
}

/* ═══ Navigation (eine Quelle für Sidebar, Mobil-Menü, Suche) ═══ */
const NAV = [
  { id: 'live', en: 'Live', de: 'Live', items: [
    { id: 'dashboard', href: 'index.html',     icon: 'home',    en: 'Dashboard',  de: 'Dashboard',  kw: 'home start übersicht overview cycles zyklen' },
    { id: 'fissures',  href: 'fissures.html',  icon: 'fissure', en: 'Fissures',   de: 'Fissuren',   kw: 'void relic riss lith meso neo axi requiem omnia steel storm' },
    { id: 'nightwave', href: 'nightwave.html', icon: 'radar',   en: 'Nightwave',  de: 'Nightwave',  kw: 'nora challenges herausforderungen standing ansehen' },
    { id: 'invasions', href: 'invasions.html', icon: 'swords',  en: 'Invasions',  de: 'Invasionen', kw: 'fieldron detonite mutagen reactor catalyst' },
    { id: 'bounties',  href: 'bounties.html',  icon: 'target',  en: 'Bounties',   de: 'Kopfgelder', kw: 'ostron solaris entrati cetus fortuna necralisk holdfasts cavia syndicate' },
    { id: 'duviri',    href: 'duviri.html',    icon: 'spiral',  en: 'Duviri',     de: 'Duviri',     kw: 'circuit incarnon spiral undercroft' },
  ]},
  { id: 'tasks', en: 'Rotations', de: 'Rotationen', items: [
    { id: 'daily',  href: 'daily.html',  icon: 'check', en: 'Checklist',   de: 'Checkliste',  kw: 'daily weekly täglich wöchentlich standing syndikat' },
    { id: 'sortie', href: 'sortie.html', icon: 'bolt',  en: 'Sortie',      de: 'Sortie',      kw: 'daily mission' },
    { id: 'archon', href: 'archon.html', icon: 'crown', en: 'Archon Hunt', de: 'Archon-Jagd', kw: 'shard scherbe archimedea weekly' },
    { id: 'baro',   href: 'baro.html',   icon: 'coins', en: "Baro Ki'Teer", de: "Baro Ki'Teer", kw: 'void trader ducats dukaten primed' },
  ]},
  { id: 'tools', en: 'Tools', de: 'Werkzeuge', items: [
    { id: 'relics',     href: 'relics.html',     icon: 'relic',  en: 'Relics',      de: 'Relics',       kw: 'prime part teil refinement verfeinerung radiant vaulted' },
    { id: 'itemfinder', href: 'itemfinder.html', icon: 'search', en: 'Drop Finder', de: 'Drop-Finder',  kw: 'where farm wo farmen resource ressource mod blueprint drop' },
    { id: 'translator', href: 'translator.html', icon: 'lang',   en: 'Translator',  de: 'Übersetzer',   kw: 'deutsch english names namen übersetzung' },
    { id: 'foundry',    href: 'foundry.html',    icon: 'hammer', en: 'Foundry',     de: 'Gießerei',     kw: 'build timer bauzeit' },
    { id: 'lich',       href: 'lich.html',       icon: 'skull',  en: 'Lich / Sister', de: 'Lich / Schwester', kw: 'kuva tenet requiem murmur' },
  ]},
  { id: 'guides', en: 'Guides', de: 'Guides', items: [
    { id: 'roadmap',     href: 'roadmap.html',     icon: 'map',   en: 'Roadmap',  de: 'Roadmap',  kw: 'beginner anfänger progression fortschritt' },
    { id: 'acquisition', href: 'acquisition.html', icon: 'frame', en: 'Warframes', de: 'Warframes', kw: 'frames farm acquisition beschaffung' },
    { id: 'glossary',    href: 'glossary.html',    icon: 'book',  en: 'Glossary', de: 'Glossar',  kw: 'terms begriffe jargon' },
  ]},
];
const NAV_ITEMS = NAV.flatMap(g => g.items);
const MOBILE_TABS = ['dashboard', 'fissures', 'daily', 'relics'];

/* ═══ Toast ═══ */
function toast(msg, opts = {}) {
  const wrap = $('#toasts');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast' + (opts.type ? ' toast-' + opts.type : '');
  el.setAttribute('role', 'status');
  el.innerHTML = `<span>${esc(msg)}</span>` + (opts.action ? `<button type="button" class="toast-act">${esc(opts.action)}</button>` : '');
  if (opts.action) el.querySelector('button').onclick = () => { opts.onAction?.(); el.remove(); };
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); }, opts.duration || 3200);
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    if (btn) { btn.classList.add('ok'); setTimeout(() => btn.classList.remove('ok'), 1200); }
    toast(L(`Copied: ${text}`, `Kopiert: ${text}`));
  } catch { toast(L('Copy failed', 'Kopieren fehlgeschlagen'), { type: 'err' }); }
}

/* ═══ HTTP ═══ */
async function fetchJSON(url, { timeout = 15000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json', ...headers } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(L('Timeout', 'Zeitüberschreitung'));
    /* fetch meldet Netzwerk-/CORS-Fehler als TypeError mit browserabhängigem englischem Text */
    if (e.name === 'TypeError') throw new Error(L('Server not reachable – check your connection', 'Server nicht erreichbar – Verbindung prüfen'));
    throw e;
  } finally { clearTimeout(tid); }
}

/* ═══ Worldstate: EIN Request für alles, geteilt, mit Stale-While-Revalidate ═══
   Vorher: bis zu 10 Einzel-Requests pro Seitenaufruf. Jetzt: ein Request,
   60 s frisch, danach im Hintergrund erneuert; bei Ausfall bis 24 h alte Daten. */
const WS_FRESH = 60e3, WS_MAX_STALE = 24 * 3600e3;
const ws = {
  data: null, at: 0, stale: false, error: null, inflight: null, listeners: new Set(),
  key: () => 'ws_' + state.lang,
  load() {
    const c = store.get(this.key(), null);
    if (c?.data && now() - c.at < WS_MAX_STALE) { this.data = c.data; this.at = c.at; }
  },
  get(force = false) {
    if (!this.data) this.load();
    const age = now() - this.at;
    if (this.data && !force && age < WS_FRESH) return Promise.resolve(this.data);
    const p = this.fetch();
    return this.data && !force ? Promise.resolve(this.data) : p;
  },
  fetch() {
    if (this.inflight) return this.inflight;
    this.inflight = fetchJSON(`${WS_URL}?language=${state.lang}`, { timeout: 15000 })
      .then(d => {
        if (!d || typeof d !== 'object' || !d.timestamp) throw new Error(L('Invalid response', 'Ungültige Antwort'));
        this.data = d; this.at = now(); this.stale = false; this.error = null;
        store.set(this.key(), { at: this.at, data: d });
        this.emit();
        return d;
      })
      .catch(e => {
        this.error = e;
        if (!this.data) this.load();
        this.stale = !!this.data;
        this.emit();
        if (!this.data) throw e;
        return this.data;
      })
      .finally(() => { this.inflight = null; });
    return this.inflight;
  },
  on(fn) { this.listeners.add(fn); if (this.data) fn(this.data); },
  emit() { updateStatus(); this.listeners.forEach(fn => { try { fn(this.data); } catch (e) { console.error(e); } }); },
};

/* ═══ Drop-Daten (offizielle Drop-Tabellen, ~280 KB gzip, 24 h im SW-Cache) ═══ */
let dropsPromise = null;
function drops() {
  if (dropsPromise) return dropsPromise;
  dropsPromise = (async () => {
    let lastErr;
    for (const url of DROPS_URL) {
      try {
        const raw = await fetchJSON(url, { timeout: 30000 });
        if (Array.isArray(raw) && raw.length > 1000) return indexDrops(raw);
        throw new Error('empty');
      } catch (e) { lastErr = e; }
    }
    dropsPromise = null;
    throw lastErr;
  })();
  return dropsPromise;
}
const RELIC_RE = /^(Lith|Meso|Neo|Axi|Requiem) (\S+) Relic(?: \((Exceptional|Flawless|Radiant)\))?$/;
function indexDrops(rows) {
  const byItem = new Map(), relics = new Map(), dropping = new Set();
  for (const r of rows) {
    const item = r.item, place = r.place, chance = +r.chance || 0;
    const rm = RELIC_RE.exec(place);
    if (rm) {
      const key = `${rm[1]} ${rm[2]}`;
      let rel = relics.get(key);
      if (!rel) relics.set(key, rel = { tier: rm[1], name: rm[2], key, rewards: {} });
      const ref = (rm[3] || 'Intact').toLowerCase();
      (rel.rewards[ref] ||= []).push({ item, chance });
    }
    const im = RELIC_RE.exec(item);
    if (im) dropping.add(`${im[1]} ${im[2]}`);
    if (rm && rm[3]) continue;            /* verfeinerte Relic-Zeilen nicht doppelt in der Item-Suche */
    const base = item.replace(/^\d+X\s+/i, '').replace(/^[\d,]+\s+(?=Endo|Credits|Kuva)/, '');
    let list = byItem.get(base);
    if (!list) byItem.set(base, list = []);
    list.push({ place: place.replace(/<\/?b>/g, ''), chance, rarity: r.rarity, qty: item !== base ? item : '' });
  }
  for (const rel of relics.values()) rel.vaulted = !dropping.has(rel.key);
  return { byItem, relics, names: [...byItem.keys()] };
}

/* ═══ Item-Datenbank (EN↔DE, Kategorie, Market-Slug, Bild) ═══ */
let itemsPromise = null;
function items() {
  if (itemsPromise) return itemsPromise;
  itemsPromise = fetchJSON('data/items.json?v=' + VERSION, { timeout: 30000 }).then(d => {
    const list = d.items.map(([en, de, cat, slug, img, bt]) => ({ en, de, cat, slug, img, bt: bt || 0, k: norm(en) + '\u0001' + norm(de) }));
    const byEn = new Map(list.map(i => [i.en.toLowerCase(), i]));
    return { list, byEn, version: d.v };
  }).catch(e => { itemsPromise = null; throw e; });
  return itemsPromise;
}
/* Anzeige-Name eines englischen Item-Namens in der aktuellen Sprache */
function itemName(en, db) {
  if (!isDE() || !db) return en;
  const qty = String(en).match(/^(\d+X|[\d,.]+)\s+(.+)$/);
  if (qty && !db.byEn.has(String(en).toLowerCase())) return `${qty[1]} ${itemName(qty[2], db)}`;
  const hit = db.byEn.get(String(en).toLowerCase());
  if (hit) return hit.de;
  const m = String(en).match(/^(.*?) Blueprint$/);
  if (m && db.byEn.get(m[1].toLowerCase())) return db.byEn.get(m[1].toLowerCase()).de + ' Blaupause';
  return en;
}
const imgUrl = f => f ? IMG_CDN + encodeURIComponent(f) : '';
const marketUrl = slug => `https://warframe.market/${isDE() ? 'de/' : ''}items/${slug}`;
const wikiUrl = en => `https://wiki.warframe.com/w/${encodeURIComponent(String(en).replace(/ /g, '_'))}`;

/* ═══ warframe.market (v2) – Preise sind optional; bei CORS/Fehler nur Link ═══ */
async function marketPrice(slug) {
  const d = await fetchJSON(`${MARKET_V2}/orders/item/${encodeURIComponent(slug)}/top`, { timeout: 10000, headers: { Platform: 'pc', Crossplay: 'true' } });
  const sell = (d?.data?.sell || []).filter(o => o.user?.status === 'ingame' || o.user?.status === 'online');
  const buy  = (d?.data?.buy  || []);
  return {
    sell: sell.map(o => o.platinum).sort((a, b) => a - b),
    buy:  buy.map(o => o.platinum).sort((a, b) => b - a),
  };
}

/* ═══ Globaler Ticker: EIN Intervall für alle Countdowns ═══
   Elemente: data-exp="<ms>" [data-fmt="long"] [data-start="<ms>" für Balken via --p] */
let refetchQueued = false;
const tickHooks = new Set();
function tick() {
  const t = now();
  let expired = false;
  for (const el of document.querySelectorAll('[data-exp]')) {
    const exp = +el.dataset.exp;
    const rem = exp - t;
    if (el.dataset.bar != null) {
      const start = +el.dataset.start;
      const p = exp > start ? Math.min(1, Math.max(0, (t - start) / (exp - start))) : 1;
      el.style.setProperty('--p', p.toFixed(4));
      continue;
    }
    el.textContent = fmtDur(rem, el.dataset.fmt || 'short');
    if (rem <= 0 && !el.dataset.done) { el.dataset.done = '1'; if (el.dataset.ws != null) expired = true; }
    el.classList.toggle('soon', rem > 0 && rem < 5 * 60e3);
  }
  tickHooks.forEach(fn => { try { fn(t); } catch (e) { console.error(e); } });
  if (expired && !refetchQueued) {
    refetchQueued = true;
    setTimeout(() => { refetchQueued = false; ws.fetch(); }, 4000);
  }
}
/* Countdown-Markup */
const cd = (exp, fmt = 'short', fromWS = true) =>
  `<span class="cd" data-exp="${ts(exp)}" data-fmt="${fmt}"${fromWS ? ' data-ws' : ''}>${fmtDur(ts(exp) - now(), fmt)}</span>`;
const bar = (start, exp) => {
  const s = ts(start), e = ts(exp), p = e > s ? Math.min(1, Math.max(0, (now() - s) / (e - s))) : 0;
  return `<div class="bar" data-bar data-start="${s}" data-exp="${e}" style="--p:${p.toFixed(4)}"><i></i></div>`;
};

/* ═══ Status-Leiste (veraltete Daten / offline) ═══ */
function updateStatus() {
  const b = $('#statusBanner');
  if (!b) return;
  let msg = '';
  if (!navigator.onLine) msg = L('You are offline – showing saved data.', 'Du bist offline – gespeicherte Daten werden angezeigt.');
  else if (ws.stale && ws.data) msg = L(`API unreachable – data from ${fmtAgo(ws.at)}.`, `API nicht erreichbar – Daten von ${fmtAgo(ws.at)}.`);
  b.hidden = !msg;
  b.querySelector('span').textContent = msg;
  const dot = $('#liveDot');
  if (dot) {
    dot.classList.toggle('stale', !!msg);
    dot.title = ws.at ? L(`Updated ${fmtAgo(ws.at)}`, `Aktualisiert ${fmtAgo(ws.at)}`) : '';
  }
}

/* ═══ Standard-Zustände ═══ */
const ui = {
  loading: (msg = L('Loading…', 'Lade…')) => `<div class="state state-loading"><span class="spinner"></span>${esc(msg)}</div>`,
  empty: (msg, sub = '') => `<div class="state state-empty">${icon('info')}<div><strong>${esc(msg)}</strong>${sub ? `<p>${esc(sub)}</p>` : ''}</div></div>`,
  error: (e, retry = true) => `<div class="state state-error">${icon('alert')}<div><strong>${esc(L('Could not load data', 'Daten konnten nicht geladen werden'))}</strong>
    <p>${esc(e?.message || e || '')}</p>${retry ? `<button class="btn btn-sm" type="button" data-action="retry">${icon('refresh')}${esc(L('Try again', 'Erneut versuchen'))}</button>` : ''}</div></div>`,
  skeleton: (n = 3, h = 120) => `<div class="grid-auto">${Array.from({ length: n }, () => `<div class="skel" style="height:${h}px"></div>`).join('')}</div>`,
  chip: (txt, cls = '') => `<span class="chip ${cls}">${esc(txt)}</span>`,
};

/* ═══ Benachrichtigungen ═══
   Laufen, solange TENNO.HUB geöffnet ist (auch als installierte App im Hintergrund-Tab).
   Echte Push-Nachrichten bei geschlossener App bräuchten einen eigenen Server. */
const NOTIF_DEFS = [
  { id: 'cetus_night',  en: 'Cetus night begins',     de: 'Cetus: Nacht beginnt',     group: 'cycles' },
  { id: 'cetus_day',    en: 'Cetus day begins',       de: 'Cetus: Tag beginnt',       group: 'cycles' },
  { id: 'vallis_warm',  en: 'Orb Vallis warm',        de: 'Orb Vallis: warm',         group: 'cycles' },
  { id: 'vallis_cold',  en: 'Orb Vallis cold',        de: 'Orb Vallis: kalt',         group: 'cycles' },
  { id: 'cambion_vome', en: 'Cambion Drift: Vome',    de: 'Cambion-Drift: Vome',      group: 'cycles' },
  { id: 'cambion_fass', en: 'Cambion Drift: Fass',    de: 'Cambion-Drift: Fass',      group: 'cycles' },
  { id: 'baro',         en: "Baro Ki'Teer arrives",   de: "Baro Ki'Teer kommt an",    group: 'events' },
  { id: 'alerts',       en: 'New alerts',             de: 'Neue Alarme',              group: 'events' },
  { id: 'invasion_rare',en: 'Invasions with Reactor/Catalyst/Forma/weapon parts', de: 'Invasionen mit Reaktor/Katalysator/Forma/Waffenteilen', group: 'events' },
];
const notif = {
  cfg: store.get('notif', { on: {}, fissures: [], lead: 5 }),
  seen: new Set(store.get('notif_seen', [])),
  save() { store.set('notif', this.cfg); },
  mark(id) {
    this.seen.add(id);
    store.set('notif_seen', [...this.seen].slice(-300));
  },
  get permission() { return 'Notification' in window ? Notification.permission : 'unsupported'; },
  async request() {
    if (!('Notification' in window)) { toast(L('Not supported in this browser', 'Von diesem Browser nicht unterstützt'), { type: 'err' }); return false; }
    const p = await Notification.requestPermission();
    renderNotifPanel();
    return p === 'granted';
  },
  async send(id, title, body, url) {
    if (this.seen.has(id)) return;
    this.mark(id);
    toast(`${title} – ${body}`, { duration: 6000 });
    if (this.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: id, data: { url: url || 'index.html' } };
      if (reg) reg.showNotification('TENNO.HUB · ' + title, opts);
      else new Notification('TENNO.HUB · ' + title, opts);
    } catch {}
  },
  any() { return Object.values(this.cfg.on).some(Boolean) || this.cfg.fissures.length > 0; },
};

/* Auswertung bei jedem Worldstate-Update und jede Sekunde für Zyklus-Vorwarnungen */
function evalNotifs(d) {
  if (!d || !notif.any()) return;
  const on = notif.cfg.on;
  if (on.baro && d.voidTrader && traderActive(d.voidTrader))
    notif.send('baro_' + ts(d.voidTrader.activation), "Baro Ki'Teer", L(`is at ${d.voidTrader.location}`, `ist bei ${d.voidTrader.location}`), 'baro.html');
  if (on.alerts) for (const a of d.alerts || []) {
    if (ts(a.expiry) < now()) continue;
    const r = rewardText(a.mission?.reward);
    notif.send('alert_' + a.id, L('New alert', 'Neuer Alarm'), `${r} · ${a.mission?.type || ''}`, 'index.html');
  }
  if (on.invasion_rare) for (const inv of d.invasions || []) {
    if (inv.completed) continue;
    const txt = [inv.attacker?.reward, inv.defender?.reward, inv.attackerReward, inv.defenderReward].map(rewardText).join(' ');
    if (/reactor|catalyst|reaktor|katalysator|forma|wraith|vandal|exilus/i.test(txt))
      notif.send('inv_' + inv.id, L('Valuable invasion', 'Wertvolle Invasion'), `${txt.trim()} · ${inv.node}`, 'invasions.html');
  }
  for (const rule of notif.cfg.fissures) {
    for (const f of d.fissures || []) {
      if (ts(f.expiry) < now()) continue;
      if (rule.tier && rule.tier !== f.tier) continue;
      if (rule.type && norm(f.missionTypeKey || f.missionType) !== norm(rule.type)) continue;
      if (rule.mode === 'steel' && !f.isHard) continue;
      if (rule.mode === 'normal' && (f.isHard || f.isStorm)) continue;
      if (rule.mode === 'storm' && !f.isStorm) continue;
      notif.send('fis_' + f.id, L('Fissure found', 'Fissur gefunden'), `${f.tier} · ${f.missionType} · ${f.node}${f.isHard ? ' · SP' : ''}`, 'fissures.html');
    }
  }
}
let lastCycleCheck = 0;
function evalCycleNotifs(t) {
  if (t - lastCycleCheck < 5000 || !ws.data || !notif.any()) return;
  lastCycleCheck = t;
  const lead = (notif.cfg.lead ?? 5) * 60e3;
  for (const c of cycles(ws.data)) {
    const key = `${c.id}_${c.nextKey}`;
    if (!notif.cfg.on[key]) continue;
    const rem = ts(c.expiry) - t;
    if (rem > 0 && rem <= lead)
      notif.send(`cyc_${key}_${ts(c.expiry)}`, c.name, L(`${c.nextLabel} in ${Math.ceil(rem / 60e3)} min`, `${c.nextLabel} in ${Math.ceil(rem / 60e3)} Min.`), 'index.html');
  }
}

/* ═══ Worldstate-Normalisierung (robust gegen alte/neue API-Felder) ═══ */
function traderActive(b) {
  if (!b) return false;
  if (typeof b.active === 'boolean') return b.active;
  return ts(b.activation) <= now() && ts(b.expiry) > now();
}
function rewardText(r) {
  if (!r) return '';
  if (typeof r === 'string') return r;
  /* Parser v5: countedItems enthält auch die Einträge aus items (count 1) – nur ohne countedItems auf items zurückfallen */
  const counted = (r.countedItems || []).map(i => `${i.count > 1 ? i.count + '× ' : ''}${i.type}`);
  const parts = counted.length ? counted : [...(r.items || [])];
  if (!parts.length && r.credits) parts.push(`${fmtNum(r.credits)} Cr`);
  return parts.join(', ');
}
function cycles(d) {
  const out = [];
  const mk = (id, name, loc, st, exp, act, cur, nxt, curLabel, nextLabel, tip, ic) =>
    out.push({ id, name, loc, state: cur, stateKey: cur, nextKey: nxt, stateLabel: curLabel, nextLabel, expiry: exp, activation: act, tip, icon: ic, cls: `cyc-${cur}` });
  const c = d.cetusCycle;
  if (c?.expiry) {
    const day = c.isDay ?? c.state === 'day';
    mk('cetus', 'Cetus', L('Plains of Eidolon', 'Ebenen von Eidolon'), 0, c.expiry, c.activation || ts(c.expiry) - (day ? 100 : 50) * 60e3,
      day ? 'day' : 'night', day ? 'night' : 'day', day ? L('Day', 'Tag') : L('Night', 'Nacht'), day ? L('Night', 'Nacht') : L('Day', 'Tag'),
      day ? L('Bounties, mining, fishing – Eidolons only at night', 'Kopfgelder, Bergbau, Angeln – Eidolons erst nachts') : L('Eidolon hunts, Vomvalysts', 'Eidolon-Jagd, Vomvalysten'), day ? 'sun' : 'moon');
  }
  const v = d.vallisCycle;
  if (v?.expiry) {
    const warm = v.isWarm ?? v.state === 'warm';
    mk('vallis', 'Orb Vallis', 'Fortuna', 0, v.expiry, v.activation || ts(v.expiry) - (warm ? 400e3 : 1200e3),
      warm ? 'warm' : 'cold', warm ? 'cold' : 'warm', warm ? L('Warm', 'Warm') : L('Cold', 'Kalt'), warm ? L('Cold', 'Kalt') : L('Warm', 'Warm'),
      L('Some fish and wildlife only appear in this cycle', 'Manche Fische und Wildtiere gibt es nur in diesem Zyklus'), warm ? 'sun' : 'storm');
  }
  const cb = d.cambionCycle;
  if (cb?.expiry) {
    const st = String(cb.state || cb.active || '').toLowerCase() === 'vome' ? 'vome' : 'fass';
    mk('cambion', L('Cambion Drift', 'Cambion-Drift'), 'Deimos', 0, cb.expiry, cb.activation || ts(cb.expiry) - (st === 'fass' ? 100 : 50) * 60e3,
      st, st === 'vome' ? 'fass' : 'vome', st === 'vome' ? 'Vome' : 'Fass', st === 'vome' ? 'Fass' : 'Vome',
      L('Fish and some resources depend on the cycle', 'Fische und manche Ressourcen hängen vom Zyklus ab'), st === 'vome' ? 'moon' : 'sun');
  }
  const z = d.zarimanCycle;
  if (z?.expiry) {
    const corpus = z.isCorpus ?? String(z.state).toLowerCase() === 'corpus';
    mk('zariman', 'Zariman', 'Chrysalith', 0, z.expiry, z.activation || ts(z.expiry) - 150 * 60e3,
      corpus ? 'corpus' : 'grineer', corpus ? 'grineer' : 'corpus', corpus ? 'Corpus' : 'Grineer', corpus ? 'Grineer' : 'Corpus',
      L('Controls the enemy faction in Zariman missions', 'Bestimmt die Gegner-Fraktion in Zariman-Missionen'), 'shield');
  }
  const e = d.earthCycle;
  if (e?.expiry) {
    const day = e.isDay ?? e.state === 'day';
    mk('earth', L('Earth', 'Erde'), L('Star chart', 'Sternenkarte'), 0, e.expiry, e.activation || ts(e.expiry) - 4 * 3600e3,
      day ? 'day' : 'night', day ? 'night' : 'day', day ? L('Day', 'Tag') : L('Night', 'Nacht'), day ? L('Night', 'Nacht') : L('Day', 'Tag'),
      L('Affects lighting and some spawns on Earth', 'Beeinflusst Beleuchtung und einige Spawns auf der Erde'), day ? 'sun' : 'moon');
  }
  const du = d.duviriCycle;
  if (du?.expiry && du.state) {
    const S = DUVIRI_MOODS[String(du.state).toLowerCase()] || { en: du.state, de: du.state };
    mk('duviri', 'Duviri', L('Spiral', 'Spirale'), 0, du.expiry, du.activation || ts(du.expiry) - 2 * 3600e3,
      String(du.state).toLowerCase(), '', L(S.en, S.de), '', L(S.tipEn || '', S.tipDe || ''), 'spiral');
  }
  return out;
}
const DUVIRI_MOODS = {
  joy:    { en: 'Joy',    de: 'Freude',  tipEn: 'Happy residents, bright world',  tipDe: 'Fröhliche Bewohner, helle Welt' },
  anger:  { en: 'Anger',  de: 'Wut',     tipEn: 'Aggressive Dax, fire everywhere', tipDe: 'Aggressive Dax, überall Feuer' },
  envy:   { en: 'Envy',   de: 'Neid',    tipEn: 'Greenish world, Dax envy each other', tipDe: 'Grüne Welt, neidische Dax' },
  sorrow: { en: 'Sorrow', de: 'Trauer',  tipEn: 'Rainy, melancholic world',         tipDe: 'Verregnete, melancholische Welt' },
  fear:   { en: 'Fear',   de: 'Angst',   tipEn: 'Dark, frightened residents',       tipDe: 'Dunkel, verängstigte Bewohner' },
};
const TIER_ORDER = { Lith: 1, Meso: 2, Neo: 3, Axi: 4, Requiem: 5, Omnia: 6 };

/* ═══ Shell ═══ */
function navLabel(n) { return L(n.en, n.de); }
function buildShell(pageId) {
  injectSprite();
  const group = NAV.find(g => g.items.some(i => i.id === pageId));
  const sidebar = NAV.map(g => `
    <div class="nav-group">
      <div class="nav-group-lbl">${esc(L(g.en, g.de))}</div>
      ${g.items.map(n => `<a class="nav-link${n.id === pageId ? ' current' : ''}" href="${n.href}"${n.id === pageId ? ' aria-current="page"' : ''}>${icon(n.icon)}<span>${esc(navLabel(n))}</span></a>`).join('')}
    </div>`).join('');

  const tabs = MOBILE_TABS.map(id => NAV_ITEMS.find(n => n.id === id)).map(n =>
    `<a class="tab${n.id === pageId ? ' current' : ''}" href="${n.href}">${icon(n.icon)}<span>${esc(navLabel(n))}</span></a>`).join('');
  const moreCurrent = !MOBILE_TABS.includes(pageId);

  document.body.insertAdjacentHTML('afterbegin', `
<a class="skip" href="#main">${esc(L('Skip to content', 'Zum Inhalt springen'))}</a>
<header class="topbar">
  <a class="brand" href="index.html" aria-label="TENNO.HUB">
    <svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d98b"/><stop offset="1" stop-color="#b8903a"/></linearGradient></defs>
      <path d="M18 2 32 10v16l-14 8-14-8V10Z" fill="none" stroke="url(#bg1)" stroke-width="2"/>
      <path d="M18 9 26 13.5v9L18 27l-8-4.5v-9Z" fill="none" stroke="#6fd3ff" stroke-width="1.4" opacity=".75"/>
      <circle cx="18" cy="18" r="3" fill="url(#bg1)"/></svg>
    <span class="brand-txt"><b>TENNO</b><i>.HUB</i></span>
  </a>
  <button class="searchbar" type="button" data-action="palette" aria-label="${esc(L('Search', 'Suchen'))}">
    ${icon('search')}<span>${esc(L('Search pages & items…', 'Seiten & Items suchen…'))}</span><kbd>Ctrl K</kbd>
  </button>
  <div class="topbar-actions">
    <span class="live-dot" id="liveDot" aria-hidden="true"></span>
    <button class="icon-btn only-mobile" type="button" data-action="palette" aria-label="${esc(L('Search', 'Suchen'))}">${icon('search')}</button>
    <div class="seg" role="group" aria-label="${esc(L('Language', 'Sprache'))}">
      <button type="button" data-lang="de" aria-pressed="${isDE()}">DE</button>
      <button type="button" data-lang="en" aria-pressed="${!isDE()}">EN</button>
    </div>
    <button class="icon-btn" type="button" id="installBtn" data-action="install" hidden aria-label="${esc(L('Install app', 'App installieren'))}" title="${esc(L('Install app', 'App installieren'))}">${icon('download')}</button>
    <button class="icon-btn" type="button" data-action="notifs" aria-label="${esc(L('Notifications', 'Benachrichtigungen'))}" title="${esc(L('Notifications', 'Benachrichtigungen'))}">${icon('bell')}<span class="badge-dot" id="notifDot" hidden></span></button>
    <button class="icon-btn hide-mobile" type="button" data-action="settings" aria-label="${esc(L('Settings', 'Einstellungen'))}" title="${esc(L('Settings', 'Einstellungen'))}">${icon('settings')}</button>
  </div>
</header>
<div class="status-banner" id="statusBanner" hidden role="status">${icon('offline')}<span></span><button type="button" class="btn btn-xs" data-action="refresh">${icon('refresh')}${esc(L('Retry', 'Neu laden'))}</button></div>
<nav class="sidebar" aria-label="${esc(L('Main navigation', 'Hauptnavigation'))}">
  ${sidebar}
  <div class="sidebar-foot">
    <button class="nav-link" type="button" data-action="settings">${icon('settings')}<span>${esc(L('Settings', 'Einstellungen'))}</span></button>
    <button class="nav-link" type="button" data-action="install-help">${icon('phone')}<span>${esc(L('Install as app', 'Als App installieren'))}</span></button>
    <div class="sidebar-meta">v${VERSION} · <a href="https://familienfabrik.at" target="_blank" rel="noopener">familienfabrik.at</a></div>
  </div>
</nav>
<nav class="tabbar" aria-label="${esc(L('Quick navigation', 'Schnellnavigation'))}">
  ${tabs}
  <button class="tab${moreCurrent ? ' current' : ''}" type="button" data-action="menu">${icon('grid')}<span>${esc(L('More', 'Mehr'))}</span></button>
</nav>
<div id="toasts" class="toasts" aria-live="polite"></div>
<div id="layer"></div>`);

  document.body.insertAdjacentHTML('beforeend', `
<footer class="footer">
  <div>TENNO.HUB v${VERSION} · ${esc(L('Fan project, not affiliated with Digital Extremes.', 'Fanprojekt, nicht mit Digital Extremes verbunden.'))}</div>
  <div>${esc(L('Data', 'Daten'))}: <a href="https://docs.warframestat.us" target="_blank" rel="noopener">warframestat.us</a> · <a href="https://warframe.market" target="_blank" rel="noopener">warframe.market</a> · <a href="https://wiki.warframe.com" target="_blank" rel="noopener">Warframe Wiki</a> · <a href="https://familienfabrik.at" target="_blank" rel="noopener">familienfabrik.at</a></div>
</footer>`);
  if (group) document.body.dataset.group = group.id;
}

/* ═══ Overlays: Menü, Suche, Einstellungen, Benachrichtigungen ═══ */
let openLayer = null;
function showLayer(kind, html, cls = '') {
  const layer = $('#layer');
  layer.innerHTML = `<div class="overlay ${cls}" data-kind="${kind}"><div class="overlay-bg" data-action="close"></div>
    <div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  openLayer = kind;
  document.documentElement.classList.add('noscroll');
  requestAnimationFrame(() => layer.firstElementChild?.classList.add('open'));
  const f = layer.querySelector('[autofocus]') || layer.querySelector('button, input, a');
  f?.focus({ preventScroll: true });
}
function closeLayer() {
  const layer = $('#layer');
  if (!layer?.firstElementChild) return;
  layer.firstElementChild.classList.remove('open');
  openLayer = null;
  document.documentElement.classList.remove('noscroll');
  setTimeout(() => { if (!openLayer) layer.innerHTML = ''; }, 200);
}
const sheetHead = (title, ic) => `<div class="sheet-head"><h2>${ic ? icon(ic) : ''}${esc(title)}</h2><button class="icon-btn" type="button" data-action="close" aria-label="${esc(L('Close', 'Schließen'))}">${icon('x')}</button></div>`;

function openMenu() {
  showLayer('menu', sheetHead(L('All pages', 'Alle Seiten'), 'grid') + `<div class="menu-groups">${NAV.map(g => `
    <div class="menu-group"><div class="nav-group-lbl">${esc(L(g.en, g.de))}</div><div class="menu-grid">
    ${g.items.map(n => `<a class="menu-tile${n.id === TH.pageId ? ' current' : ''}" href="${n.href}">${icon(n.icon)}<span>${esc(navLabel(n))}</span></a>`).join('')}
    </div></div>`).join('')}
    <div class="menu-group"><div class="menu-grid">
      <button class="menu-tile" type="button" data-action="settings">${icon('settings')}<span>${esc(L('Settings', 'Einstellungen'))}</span></button>
      <button class="menu-tile" type="button" data-action="install-help">${icon('phone')}<span>${esc(L('Install app', 'App installieren'))}</span></button>
    </div></div></div>`, 'sheet-bottom');
}

/* ─── Befehls-Palette: Seiten + 6.000 Items (EN/DE) ─── */
function openPalette(initial = '') {
  showLayer('palette', `
    <div class="palette-input">${icon('search')}<input id="palQ" type="search" autocomplete="off" spellcheck="false" autofocus
      placeholder="${esc(L('Pages, items, mods, Prime parts… (EN or DE)', 'Seiten, Items, Mods, Prime-Teile… (DE oder EN)'))}" value="${esc(initial)}"><kbd>Esc</kbd></div>
    <div class="palette-results" id="palRes" role="listbox"></div>
    <div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> ${esc(L('navigate', 'wählen'))}</span><span><kbd>Enter</kbd> ${esc(L('open', 'öffnen'))}</span></div>`, 'overlay-top');
  const q = $('#palQ'), res = $('#palRes');
  let sel = 0, rows = [];
  const render = async () => {
    const term = norm(q.value.trim());
    const pages = NAV_ITEMS.filter(n => !term || norm(`${n.en} ${n.de} ${n.kw}`).includes(term)).slice(0, term ? 5 : 20);
    rows = pages.map(n => ({ href: n.href, html: `${icon(n.icon)}<span class="pr-main">${esc(navLabel(n))}</span><span class="pr-sub">${esc(L('Page', 'Seite'))}</span>` }));
    if (term.length >= 2) {
      try {
        const db = await items();
        if (norm(q.value.trim()) !== term) return;
        const hits = [];
        for (const it of db.list) {
          const i = it.k.indexOf(term);
          if (i < 0) continue;
          const score = (it.k.startsWith(term) || it.k.includes('\u0001' + term) ? 0 : 1) + it.en.length / 100;
          hits.push([score, it]);
          if (hits.length > 400) break;
        }
        hits.sort((a, b) => a[0] - b[0]);
        for (const [, it] of hits.slice(0, 12)) {
          const main = isDE() ? it.de : it.en, sub = isDE() ? it.en : it.de;
          rows.push({ href: `itemfinder.html?q=${encodeURIComponent(it.en)}`, copy: main, html:
            `${it.img ? `<img src="${imgUrl(it.img)}" alt="" loading="lazy" width="28" height="28">` : icon('search')}
             <span class="pr-main">${esc(main)}${sub !== main ? `<small>${esc(sub)}</small>` : ''}</span><span class="pr-sub">${esc(catLabel(it.cat))}</span>` });
        }
      } catch {}
    }
    sel = Math.min(sel, Math.max(0, rows.length - 1));
    res.innerHTML = rows.length ? rows.map((r, i) => `<a class="pal-row${i === sel ? ' sel' : ''}" role="option" href="${r.href}">${r.html}</a>`).join('')
      : `<div class="pal-empty">${esc(L('Nothing found', 'Nichts gefunden'))}</div>`;
  };
  q.addEventListener('input', debounce(() => { sel = 0; render(); }, 90));
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % Math.max(1, rows.length);
      $$('.pal-row', res).forEach((r, i) => r.classList.toggle('sel', i === sel));
      $$('.pal-row', res)[sel]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && rows[sel]) { e.preventDefault(); location.href = rows[sel].href; }
  });
  render();
}
function catLabel(c) {
  return ({ frame: 'Warframe', weapon: L('Weapon', 'Waffe'), mod: 'Mod', arcane: 'Arcane', resource: L('Resource', 'Ressource'),
    part: L('Component', 'Bauteil'), companion: L('Companion', 'Begleiter'), misc: L('Other', 'Sonstiges') })[c] || c;
}

/* ─── Benachrichtigungs-Panel ─── */
function renderNotifPanel() {
  const perm = notif.permission;
  const row = d => `<label class="switch-row"><span>${esc(L(d.en, d.de))}</span>
    <input type="checkbox" class="switch" data-notif="${d.id}" ${notif.cfg.on[d.id] ? 'checked' : ''}></label>`;
  const rules = notif.cfg.fissures.map((r, i) => `<div class="rule">${icon('fissure')}<span>${esc([r.tier || L('Any tier', 'Jede Stufe'), r.type || L('any mission', 'jede Mission'), r.mode === 'steel' ? L('Steel Path', 'Stahlpfad') : r.mode === 'normal' ? L('Normal', 'Normal') : r.mode === 'storm' ? 'Void Storm' : ''].filter(Boolean).join(' · '))}</span>
    <button class="icon-btn sm" type="button" data-rule-del="${i}" aria-label="${esc(L('Remove', 'Entfernen'))}">${icon('trash')}</button></div>`).join('');
  const types = ['Survival', 'Defense', 'Interception', 'Excavation', 'Disruption', 'Capture', 'Exterminate', 'Rescue', 'Sabotage', 'Spy', 'Mobile Defense', 'Void Cascade', 'Void Flood', 'Void Armageddon', 'Alchemy', 'Hijack', 'Skirmish', 'Volatile', 'Orphix'];
  showLayer('notifs', sheetHead(L('Notifications', 'Benachrichtigungen'), 'bell') + `
    <div class="sheet-body">
      ${perm !== 'granted' ? `<div class="callout">${icon('info')}<div><p>${esc(perm === 'denied'
        ? L('Browser notifications are blocked. Allow them in the site settings of your browser – you will still see in-app notices.', 'Browser-Benachrichtigungen sind blockiert. Erlaube sie in den Website-Einstellungen deines Browsers – Hinweise in der App siehst du trotzdem.')
        : L('Allow browser notifications to be alerted even when TENNO.HUB is in the background.', 'Erlaube Browser-Benachrichtigungen, um auch bei TENNO.HUB im Hintergrund informiert zu werden.'))}</p>
        ${perm === 'default' ? `<button class="btn btn-primary" type="button" data-action="notif-perm">${icon('bell')}${esc(L('Allow notifications', 'Benachrichtigungen erlauben'))}</button>` : ''}</div></div>` : ''}
      <h3>${esc(L('World cycles', 'Weltzyklen'))}</h3>
      <label class="switch-row"><span>${esc(L('Warn before change', 'Vorwarnung vor Wechsel'))}</span>
        <select data-notif-lead>${[1, 3, 5, 10, 15].map(m => `<option value="${m}" ${notif.cfg.lead === m ? 'selected' : ''}>${m} ${esc(L('min', 'Min.'))}</option>`).join('')}</select></label>
      ${NOTIF_DEFS.filter(d => d.group === 'cycles').map(row).join('')}
      <h3>${esc(L('Events', 'Ereignisse'))}</h3>
      ${NOTIF_DEFS.filter(d => d.group === 'events').map(row).join('')}
      <h3>${esc(L('Fissure watch', 'Fissur-Wächter'))}</h3>
      <p class="muted">${esc(L('Get notified when a matching fissure appears.', 'Werde benachrichtigt, sobald eine passende Fissur erscheint.'))}</p>
      <div class="rules">${rules || `<p class="muted small">${esc(L('No rules yet.', 'Noch keine Regeln.'))}</p>`}</div>
      <div class="rule-form">
        <select id="nrTier"><option value="">${esc(L('Any tier', 'Jede Stufe'))}</option>${Object.keys(TIER_ORDER).map(t => `<option>${t}</option>`).join('')}</select>
        <select id="nrType"><option value="">${esc(L('Any mission', 'Jede Mission'))}</option>${types.map(t => `<option>${t}</option>`).join('')}</select>
        <select id="nrMode"><option value="">${esc(L('Normal + SP', 'Normal + SP'))}</option><option value="normal">Normal</option><option value="steel">${esc(L('Steel Path', 'Stahlpfad'))}</option><option value="storm">Void Storm</option></select>
        <button class="btn" type="button" data-action="rule-add">${icon('plus')}${esc(L('Add', 'Hinzufügen'))}</button>
      </div>
      <p class="muted small">${esc(L('Notifications work while TENNO.HUB is open (also as installed app in the background).', 'Benachrichtigungen funktionieren, solange TENNO.HUB geöffnet ist (auch als installierte App im Hintergrund).'))}</p>
    </div>`, 'sheet-right');
}
function updateNotifDot() { const d = $('#notifDot'); if (d) d.hidden = !notif.any(); }

/* ─── Einstellungen ─── */
function openSettings() {
  showLayer('settings', sheetHead(L('Settings', 'Einstellungen'), 'settings') + `
    <div class="sheet-body">
      <h3>${esc(L('Language', 'Sprache'))}</h3>
      <div class="seg seg-lg"><button type="button" data-lang="de" aria-pressed="${isDE()}">Deutsch</button><button type="button" data-lang="en" aria-pressed="${!isDE()}">English</button></div>
      <p class="muted small">${esc(L('Item names follow the official German game client.', 'Item-Namen entsprechen dem offiziellen deutschen Spiel-Client.'))}</p>
      <h3>${esc(L('Your data', 'Deine Daten'))}</h3>
      <p class="muted">${esc(L('Checklists, Lich tracker and Foundry timers are stored only on this device. Move them to another device with export/import.', 'Checklisten, Lich-Tracker und Gießerei-Timer liegen nur auf diesem Gerät. Mit Export/Import nimmst du sie auf ein anderes Gerät mit.'))}</p>
      <div class="btn-row">
        <button class="btn" type="button" data-action="export">${icon('download')}${esc(L('Export', 'Exportieren'))}</button>
        <label class="btn">${icon('upload')}${esc(L('Import', 'Importieren'))}<input type="file" accept="application/json" data-action="import" hidden></label>
      </div>
      <h3>${esc(L('App', 'App'))}</h3>
      <div class="btn-row">
        <button class="btn" type="button" data-action="install-help">${icon('phone')}${esc(L('Install as app', 'Als App installieren'))}</button>
        <button class="btn" type="button" data-action="shortcuts">${icon('keyboard')}${esc(L('Shortcuts', 'Tastenkürzel'))}</button>
        <button class="btn" type="button" data-action="hard-refresh">${icon('refresh')}${esc(L('Reload app & data', 'App & Daten neu laden'))}</button>
      </div>
      <p class="muted small">TENNO.HUB v${VERSION} · ${esc(L('Worldstate', 'Weltstatus'))}: ${ws.at ? esc(fmtAgo(ws.at)) : '—'}</p>
    </div>`, 'sheet-right');
}

function openShortcuts() {
  const k = [['Ctrl K', L('Search', 'Suche')], ['/', L('Search / filter', 'Suche / Filter')], ['T', L('Toggle DE / EN', 'DE / EN umschalten')],
             ['R', L('Refresh data', 'Daten aktualisieren')], ['G → D/F/N/R', L('Go to Dashboard / Fissures / Nightwave / Relics', 'Gehe zu Dashboard / Fissuren / Nightwave / Relics')],
             ['?', L('This help', 'Diese Hilfe')], ['Esc', L('Close', 'Schließen')]];
  showLayer('keys', sheetHead(L('Keyboard shortcuts', 'Tastenkürzel'), 'keyboard') +
    `<div class="sheet-body"><dl class="keys">${k.map(([a, b]) => `<dt><kbd>${esc(a)}</kbd></dt><dd>${esc(b)}</dd>`).join('')}</dl></div>`, 'overlay-center');
}

/* ─── Export / Import lokaler Daten ─── */
const LOCAL_KEYS = ['lich', 'foundry', 'roadmap', 'checklist', 'nw_done', 'notif', 'lang', 'fav_relics'];
function exportData() {
  const out = { app: 'tenno.hub', v: VERSION, at: new Date().toISOString(), data: {} };
  LOCAL_KEYS.forEach(k => { const v = store.get(k, undefined); if (v !== undefined) out.data[k] = v; });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
  a.download = `tenno-hub-${utcDay()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function importData(file) {
  try {
    const j = JSON.parse(await file.text());
    if (j?.app !== 'tenno.hub' || typeof j.data !== 'object') throw new Error('format');
    Object.entries(j.data).forEach(([k, v]) => { if (LOCAL_KEYS.includes(k)) store.set(k, v); });
    toast(L('Data imported – reloading…', 'Daten importiert – lade neu…'));
    setTimeout(() => location.reload(), 800);
  } catch { toast(L('Invalid file', 'Ungültige Datei'), { type: 'err' }); }
}

/* ═══ PWA: Installation & Updates ═══ */
let deferredInstall = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstall = e;
  const b = $('#installBtn'); if (b) b.hidden = false;
});
window.addEventListener('appinstalled', () => {
  deferredInstall = null;
  const b = $('#installBtn'); if (b) b.hidden = true;
  toast(L('TENNO.HUB installed!', 'TENNO.HUB installiert!'));
});
async function install() {
  if (deferredInstall) {
    deferredInstall.prompt();
    await deferredInstall.userChoice.catch(() => null);
    deferredInstall = null;
    const b = $('#installBtn'); if (b) b.hidden = true;
  } else installHelp();
}
function installHelp() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const steps = isStandalone() ? [L('TENNO.HUB is already running as an app. 🎉', 'TENNO.HUB läuft bereits als App. 🎉')]
    : ios ? [L('Open this page in Safari.', 'Öffne diese Seite in Safari.'),
             L('Tap the Share button (square with arrow).', 'Tippe auf „Teilen“ (Quadrat mit Pfeil).'),
             L('Choose “Add to Home Screen”.', 'Wähle „Zum Home-Bildschirm“.')]
    : [L('Chrome / Edge / Samsung Internet: tap the install icon in the address bar or the menu (⋮) → “Install app”.', 'Chrome / Edge / Samsung Internet: Installations-Symbol in der Adressleiste oder Menü (⋮) → „App installieren“.'),
       L('Firefox Android: menu → “Install”.', 'Firefox Android: Menü → „Installieren“.'),
       L('Desktop: install icon on the right side of the address bar.', 'Desktop: Installations-Symbol rechts in der Adressleiste.')];
  showLayer('install', sheetHead(L('Install TENNO.HUB', 'TENNO.HUB installieren'), 'phone') + `<div class="sheet-body">
    <p>${esc(L('As an app TENNO.HUB starts in full screen, works offline and can notify you in the background.', 'Als App startet TENNO.HUB im Vollbild, funktioniert offline und kann dich im Hintergrund benachrichtigen.'))}</p>
    <ol class="steps">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    ${deferredInstall ? `<button class="btn btn-primary" type="button" data-action="install">${icon('download')}${esc(L('Install now', 'Jetzt installieren'))}</button>` : ''}
  </div>`, 'overlay-center');
}
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const ask = w => toast(L('A new version is available.', 'Eine neue Version ist verfügbar.'), {
      action: L('Update', 'Aktualisieren'), duration: 15000, onAction: () => w.postMessage({ type: 'SKIP_WAITING' }) });
    if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) ask(w); });
    });
    setInterval(() => reg.update().catch(() => {}), 60 * 60e3);
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
async function hardRefresh() {
  toast(L('Reloading…', 'Lade neu…'));
  Object.keys(localStorage).filter(k => k.startsWith('th_ws_')).forEach(k => localStorage.removeItem(k));
  try { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } catch {}
  try { const regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r => r.update())); } catch {}
  location.reload();
}

/* ═══ Sprache umschalten ═══ */
function setLang(l) {
  if (l === state.lang) return;
  state.lang = l;
  store.set('lang', l);
  document.documentElement.lang = l;
  applyStatic();
  $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  /* Shell neu beschriften: einfachster robuster Weg ist ein Neuaufbau */
  $$('.skip, .topbar, .sidebar, .tabbar, .footer, #statusBanner, #toasts, #layer').forEach(e => e.remove());
  buildShell(TH.pageId);
  if (deferredInstall) $('#installBtn').hidden = false;
  updateNotifDot();
  ws.data = null; ws.at = 0; ws.load();
  if (TH._page?.ws) {
    if (ws.data) TH._page.render?.(ws.data);
    ws.get(true).catch(e => TH._page.fail?.(e));
  } else TH._page?.render?.();
}
/* Statische Texte: <x data-de="…">English</x> */
function applyStatic() {
  $$('[data-de]').forEach(el => {
    if (el.dataset.en == null) el.dataset.en = el.innerHTML;
    el.innerHTML = isDE() ? el.dataset.de : el.dataset.en;
  });
  $$('[data-de-ph]').forEach(el => {
    if (el.dataset.enPh == null) el.dataset.enPh = el.placeholder;
    el.placeholder = isDE() ? el.dataset.dePh : el.dataset.enPh;
  });
  const t = document.querySelector('meta[name="th-title-de"]');
  if (t) { if (!document.documentElement.dataset.titleEn) document.documentElement.dataset.titleEn = document.title; document.title = isDE() ? t.content : document.documentElement.dataset.titleEn; }
}

/* ═══ Globale Ereignisse ═══ */
let gPending = 0;
function onKey(e) {
  const tag = (e.target?.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
  if (e.key === 'Escape') { if (openLayer) closeLayer(); else if (typing) e.target.blur(); return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  if (gPending && now() - gPending < 1200) {
    gPending = 0;
    const map = { d: 'index.html', f: 'fissures.html', n: 'nightwave.html', r: 'relics.html', b: 'baro.html', s: 'sortie.html', c: 'daily.html', i: 'itemfinder.html', t: 'translator.html' };
    if (map[e.key.toLowerCase()]) location.href = map[e.key.toLowerCase()];
    return;
  }
  if (e.key === 'g') { gPending = now(); return; }
  if (e.key === '/') {
    const s = $('main input[type="search"], main .search input');
    e.preventDefault();
    if (s) s.focus(); else openPalette();
  } else if (e.key === '?') openShortcuts();
  else if (e.key === 't' || e.key === 'T') setLang(isDE() ? 'en' : 'de');
  else if (e.key === 'r' || e.key === 'R') refresh();
}
function refresh() {
  toast(L('Refreshing…', 'Aktualisiere…'), { duration: 1200 });
  if (TH._page?.ws) ws.fetch().catch(() => {});
  TH._page?.refresh?.();
}
function onClick(e) {
  const t = e.target.closest('[data-action], [data-lang], [data-copy], [data-rule-del]');
  if (!t) return;
  if (t.dataset.lang) { setLang(t.dataset.lang); return; }
  if (t.dataset.copy != null) { e.preventDefault(); copyText(t.dataset.copy, t); return; }
  if (t.dataset.ruleDel != null) { notif.cfg.fissures.splice(+t.dataset.ruleDel, 1); notif.save(); updateNotifDot(); renderNotifPanel(); return; }
  switch (t.dataset.action) {
    case 'palette': e.preventDefault(); openPalette(); break;
    case 'menu': openMenu(); break;
    case 'close': closeLayer(); break;
    case 'settings': openSettings(); break;
    case 'notifs': renderNotifPanel(); break;
    case 'notif-perm': notif.request(); break;
    case 'install': install(); break;
    case 'install-help': installHelp(); break;
    case 'shortcuts': openShortcuts(); break;
    case 'export': exportData(); break;
    case 'hard-refresh': hardRefresh(); break;
    case 'refresh': refresh(); break;
    case 'retry': TH._page?.refresh?.(); if (TH._page?.ws) ws.fetch().catch(() => {}); break;
    case 'rule-add': {
      const r = { tier: $('#nrTier').value, type: $('#nrType').value, mode: $('#nrMode').value };
      notif.cfg.fissures.push(r); notif.save(); updateNotifDot(); renderNotifPanel();
      if (notif.permission === 'default') notif.request();
      if (ws.data) evalNotifs(ws.data);
      break;
    }
  }
}
function onChange(e) {
  const t = e.target;
  if (t.dataset.notif) {
    notif.cfg.on[t.dataset.notif] = t.checked; notif.save(); updateNotifDot();
    if (t.checked && notif.permission === 'default') notif.request();
  } else if (t.dataset.notifLead != null) { notif.cfg.lead = +t.value; notif.save(); }
  else if (t.dataset.action === 'import' && t.files?.[0]) importData(t.files[0]);
}

/* ═══ Seiten-Lebenszyklus ═══
   TH.page({ id, ws:true|false, render(data), refresh(), init() }) */
function page(def) {
  TH._page = def;
  TH.pageId = def.id;
  document.documentElement.lang = state.lang;
  buildShell(def.id);
  applyStatic();
  updateNotifDot();
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('keydown', onKey);
  /* Nicht ladbare Item-Bilder durch Platzhalter ersetzen statt „kaputtem Bild“ */
  document.addEventListener('error', e => {
    const img = e.target;
    if (img?.tagName !== 'IMG') return;
    if (img.classList.contains('item-img')) img.outerHTML = `<div class="item-img ph">${icon('relic')}</div>`;
    else img.style.visibility = 'hidden';
  }, true);
  window.addEventListener('online', () => { updateStatus(); if (def.ws) ws.fetch().catch(() => {}); });
  window.addEventListener('offline', updateStatus);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && def.ws && now() - ws.at > WS_FRESH) ws.fetch().catch(() => {});
  });
  try { def.init?.(); } catch (e) { console.error(e); }
  if (def.ws) {
    ws.listeners.add(d => { if (d) def.render?.(d); });
    ws.load();
    if (ws.data) def.render?.(ws.data);
    ws.get().catch(e => def.fail?.(e));
    setInterval(() => { if (document.visibilityState === 'visible') ws.fetch().catch(() => {}); }, 90e3);
  } else def.render?.();
  /* Benachrichtigungen werten auf allen Seiten aus – Worldstate dafür im Hintergrund */
  ws.listeners.add(evalNotifs);
  tickHooks.add(evalCycleNotifs);
  if (!def.ws && notif.any()) { ws.load(); ws.get().catch(() => {}); setInterval(() => ws.fetch().catch(() => {}), 120e3); }
  setInterval(tick, 1000);
  updateStatus();
  registerSW();
  if (isStandalone()) document.documentElement.classList.add('standalone');
}

/* Öffentliche API */
window.TH = {
  VERSION, page, store, state, L, isDE, esc, $, $$, icon, ui, toast, copyText, debounce, norm,
  ws, drops, items, itemName, imgUrl, marketUrl, wikiUrl, marketPrice, fetchJSON,
  fmtDur, fmtTime, fmtAgo, fmtNum, splitNode, nextWeekly, nextDaily, utcDay, utcWeek, ts, now,
  cd, bar, cycles, traderActive, rewardText, catLabel, TIER_ORDER, DUVIRI_MOODS, NAV_ITEMS,
  openPalette, showLayer, closeLayer, sheetHead, notif, renderNotifPanel, tickHooks, applyStatic,
  pageId: '', _page: null,
};
})();
