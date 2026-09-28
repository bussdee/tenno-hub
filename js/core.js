/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · core.js  v4.2
   Shared APP state · API fetch · i18n · timers · toast · boot
═══════════════════════════════════════════════════════════════ */

const APP = {
  platform : localStorage.getItem('th_platform') || 'pc',
  lang     : localStorage.getItem('th_lang') || ((navigator.language||navigator.userLanguage||'').toLowerCase().startsWith('de') ? 'de' : 'en'),
  notifs   : JSON.parse(localStorage.getItem('th_notifs')  || '{}'),
  doneNW   : JSON.parse(localStorage.getItem('th_nw_done') || '[]'),
  timers   : {},
  cache    : {},
};

const WS_API   = 'https://api.warframestat.us';
const MKT_API  = 'https://api.warframe.market/v1';
const DROP_API = 'https://drops.warframestat.us/data';

/* ── Cache TTL map (ms) ── */
const CACHE_TTL = {
  default      :  5 * 60000,  fissures    :  3 * 60000,
  sortie       : 60 * 60000,  nightwave   : 60 * 60000,
  invasions    : 10 * 60000,  voidTrader  : 30 * 60000,
  duviriCycle  : 10 * 60000,  cetusCycle  : 10 * 60000,
  vallisCycle  :  5 * 60000,  cambionCycle: 10 * 60000,
  earthCycle   : 30 * 60000,  steelPath   : 60 * 60000,
  archonHunt   : 60 * 60000,  relics      : 60 * 60000,
};

/* ── Resilient API fetch ── */
async function apiFetch(endpoint) {
  const cacheKey = `th_api_${APP.platform}_${APP.lang}_${endpoint}`;
  const ttl      = CACHE_TTL[endpoint] || CACHE_TTL.default;
  const url      = `${WS_API}/${APP.platform}/${endpoint}?language=${APP.lang}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 12000);
      const res  = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      clearTimeout(tid);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      try { localStorage.setItem(cacheKey, JSON.stringify({ data, _cachedAt: Date.now() })); } catch(e) {}
      _hideStaleBar();
      return data;
    } catch (e) {
      if (attempt === 1) {
        try {
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const entry = JSON.parse(raw);
            if (Date.now() - entry._cachedAt < ttl * 12) {
              _showStaleBar(endpoint, entry._cachedAt);
              return entry.data;
            }
          }
        } catch(ce) {}
        throw e;
      }
    }
  }
}

/* ── Stale banner ── */
function _showStaleBar(endpoint, cachedAt) {
  const bar = document.getElementById('staleBar');
  if (!bar) return;
  bar.classList.add('visible');
  const age = Math.round((Date.now() - cachedAt) / 60000);
  const msg = document.getElementById('staleBarMsg');
  if (msg) msg.textContent = APP.lang === 'de'
    ? `⚠ API nicht erreichbar – gecachte Daten (vor ${age} Min.)`
    : `⚠ API unreachable – cached data (${age} min old)`;
}
function _hideStaleBar() {
  document.getElementById('staleBar')?.classList.remove('visible');
}
function clearAPICache() {
  Object.keys(localStorage).filter(k => k.startsWith('th_api_')).forEach(k => localStorage.removeItem(k));
  toast(APP.lang === 'de' ? '🗑 Cache geleert, lade neu…' : '🗑 Cache cleared, reloading…');
  setTimeout(() => { if (typeof pageInit === 'function') pageInit(); }, 300);
}

/* ── Force full refresh: clears SW cache + localStorage API data + reloads ── */
async function forceRefresh() {
  toast(APP.lang === 'de' ? '🔄 Vollständige Aktualisierung…' : '🔄 Full refresh…');
  // 1. Clear API localStorage cache
  Object.keys(localStorage).filter(k => k.startsWith('th_api_')).forEach(k => localStorage.removeItem(k));
  // 2. Tell SW to wipe all caches
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'FORCE_REFRESH' });
    await new Promise(r => setTimeout(r, 400));
  } else {
    // No SW: wipe browser caches directly
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  }
  // 3. Hard reload (bypass cache)
  window.location.reload(true);
}

/* ── Listen for SW RELOAD message ── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'RELOAD') window.location.reload(true);
  });
}

/* ── Time helpers ── */
const _pad = n => String(n).padStart(2, '0');
function fmtMs(ms, forceH = false) {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60), sc = s % 60;
  return (h > 0 || forceH) ? `${h}:${_pad(m)}:${_pad(sc)}` : `${_pad(m)}:${_pad(sc)}`;
}
function fmtMsLong(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400),
        h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  if (d > 0) return `${d}d ${h}h ${_pad(m)}m`;
  if (h > 0) return `${h}h ${_pad(m)}m ${_pad(sc)}s`;
  return `${_pad(m)}m ${_pad(sc)}s`;
}
function until(expiry) { return new Date(expiry).getTime() - Date.now(); }
function nextWeeklyReset() {
  // Next Monday 00:00 UTC
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const daysUntilMon = dow === 0 ? 1 : (8 - dow) % 7 || 7;
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMon));
  return next.getTime();
}

/* ── Throttled reload after a countdown hits zero ──
   Die API liefert kurz nach Ablauf oft noch den alten Datensatz (oder es
   greift der Stale-Cache) → ohne Drossel würde jede Sekunde neu geladen. */
const _lastReload = {};
function reloadSoon(key, fn, minGap = 30000) {
  const wait = Math.max(0, (_lastReload[key] || 0) + minGap - Date.now());
  clearTimeout(APP.timers['reload_' + key]);
  APP.timers['reload_' + key] = setTimeout(() => { _lastReload[key] = Date.now(); fn(); }, wait);
}

/* ── FIX: DE_MISSION – offizielle deutsche Client-Begriffe ──────
   Quelle: Warframe DE-Client (Stand 2024)
── */
const DE_MISSION = {
  // Korrekte offizielle Begriffe aus dem deutschen Warframe-Client
  'Exterminate'     : 'Vernichtung',
  'Extermination'   : 'Vernichtung',
  'Survival'        : 'Überleben',
  'Defense'         : 'Verteidigung',
  'Mobile Defense'  : 'Mobile Verteidigung',
  'Excavation'      : 'Ausgrabung',
  'Disruption'      : 'Disruption',        // im DE-Client identisch
  'Spy'             : 'Spionage',
  'Rescue'          : 'Rettung',
  'Capture'         : 'Gefangennahme',
  'Assassination'   : 'Attentat',
  'Interception'    : 'Unterbrechung',
  'Sabotage'        : 'Sabotage',
  'Infested Salvage': 'Verseuchte Bergung',
  'Defection'       : 'Überlaufen',
  'Hijack'          : 'Kapern',             // offiziell "Kapern", NICHT "Entführung"
  'Rush'            : 'Ansturm',
  'Assault'         : 'Angriff',
  'Pursuit'         : 'Verfolgung',
  'Railjack'        : 'Railjack',
  'Skirmish'        : 'Scharmützel',
  'Volatile'        : 'Volatil',
  'Mirror Defense'  : 'Spiegelverteidigung',
  'Cascade'         : 'Kaskade',
  'Alchemy'         : 'Alchemie',
  'Netracell'       : 'Netrazelle',
  'Omnia'           : 'Omnia',
};

/* ── DE_PLANET – offizielle deutsche Client-Planetennamen ── */
const DE_PLANET = {
  Earth           : 'Erde',
  Mercury         : 'Merkur',
  Venus           : 'Venus',
  Mars            : 'Mars',
  Phobos          : 'Phobos',
  Ceres           : 'Ceres',
  Jupiter         : 'Jupiter',
  Europa          : 'Europa',
  Saturn          : 'Saturn',
  Uranus          : 'Uranus',
  Neptune         : 'Neptun',
  Pluto           : 'Pluto',
  Sedna           : 'Sedna',
  Eris            : 'Eris',
  Lua             : 'Lua',
  'Kuva Fortress' : 'Kuva-Festung',
  Void            : 'Leere',            // offiziell "Leere" im DE-Client!
  Zariman         : 'Zariman',          // Eigenname, bleibt gleich
  Deimos          : 'Deimos',
  'Orb Vallis'    : 'Orb Vallis',
  'Plains of Eidolon': 'Eidolon-Ebene',
  'Cambion Drift' : 'Cambion-Drift',
  'Sanctuary'     : 'Heiligtum',
};

const DE_CYCLE = {
  Day: 'Tag', Night: 'Nacht', Warm: 'Warm', Cold: 'Kalt', Vome: 'Vome', Fass: 'Fass',
  Corpus: 'Corpus', Grineer: 'Grineer',
};
const CYCLE_ICON = {
  Day:'☀️', Night:'🌙', Warm:'🔥', Cold:'❄️', Vome:'🟣', Fass:'🔴',
  Corpus:'🔷', Grineer:'⚙️',
};
const FACTION_CLS = {
  Grineer:'f-grineer', Corpus:'f-corpus', Infestation:'f-infestation',
  Infested:'f-infestation', Tenno:'f-tenno', Corrupted:'f-corrupted',
  Orokin:'f-corrupted', Narmer:'f-corrupted',
};

function tM(k) { return (APP.lang==='de' && k) ? (DE_MISSION[k] || k) : (k || ''); }
function tP(node) {
  if (!node) return '';
  const parts  = node.replace(/\s*\(.*?\)\s*$/, '').trim().split('/');
  const planet = parts[0]?.trim() || '';
  const n      = parts.slice(1).join('/').trim() || planet;
  const tp     = APP.lang==='de' ? (DE_PLANET[planet] || planet) : planet;
  return parts.length > 1 ? `${tp} / ${n}` : n;
}
function tC(k) { return (APP.lang==='de' && k) ? (DE_CYCLE[k] || k) : (k || ''); }

/* ── i18n ── */
function applyI18n() {
  const lang = APP.lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    el.innerHTML = lang === 'de' ? (el.dataset.de || el.dataset.en) : el.dataset.en;
  });
}

/* ── Platform & Language ── */
function setPlatform(p, btn) {
  APP.platform = p;
  localStorage.setItem('th_platform', p);
  document.querySelectorAll('#platformSel .ctrl-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const sb = document.getElementById('sbPlatform');
  if (sb) sb.textContent = p.toUpperCase();
  if (typeof pageInit === 'function') pageInit();
}
function setLang(l) {
  APP.lang = l;
  localStorage.setItem('th_lang', l);
  ['btnEN','btnDE'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.classList.toggle('active', b.id === `btn${l.toUpperCase()}`);
  });
  applyI18n();
  if (typeof pageRefresh === 'function') pageRefresh();
}

/* ── Boot (called once per page at end of inline script) ── */
function bootPage() {
  // Persist detected language on first visit
  if (!localStorage.getItem('th_lang')) {
    localStorage.setItem('th_lang', APP.lang);
    applyI18n();
  }
  // Daily API cache clear (new day = fresh world state data)
  const today = new Date().toDateString();
  if (localStorage.getItem('th_last_day') !== today) {
    localStorage.setItem('th_last_day', today);
    Object.keys(localStorage).filter(k => k.startsWith('th_api_')).forEach(k => localStorage.removeItem(k));
    console.log('[TENNO.HUB] New day – API cache cleared');
  }
  // Platform
  const p = APP.platform;
  document.querySelectorAll('#platformSel .ctrl-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.platform === p);
  });
  const sbP = document.getElementById('sbPlatform');
  if (sbP) sbP.textContent = p.toUpperCase();
  // Language (already set by shell.js visually – just sync state)
  applyI18n();
  updateBell();
  syncNotifUI();
  _updateOnlineStatus();
  if (typeof pageInit === 'function') pageInit();
}

/* ── Toast ── */
function toast(msg, dur = 3500) {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), dur);
}

/* ── Clipboard ── */
function copyText(text, btn) {
  navigator.clipboard?.writeText(text).then(() => {
    const orig = btn.textContent; btn.textContent = '✓'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('ok'); }, 1400);
  }).catch(() => {});
}

/* ── HTML helpers ── */
function errHTML(e, showRetry = true) {
  const msg = APP.lang==='de'
    ? 'API nicht erreichbar. Bitte in 1 Min. erneut versuchen.'
    : 'API temporarily unreachable. Please try again in a minute.';
  return `<div class="error-state" style="grid-column:1/-1">
    <div class="error-icon">⚠</div>
    <div><strong>${e.message}</strong><br><small>${msg}</small>${showRetry
      ? `<br><button class="err-retry-btn" onclick="pageInit()">↻ Retry</button>` : ''}</div>
  </div>`;
}
function emptyHTML(msg) { return `<div class="empty-state">${msg}</div>`; }
function loadHTML(msg = 'LOADING…') {
  return `<div class="loading-state" style="grid-column:1/-1">
    <div class="loading-spinner"></div><span>${msg}</span></div>`;
}

/* ── Notifications ── */
function toggleNotifDrawer() {
  const d = document.getElementById('notifDrawer');
  if (!d) return;
  const open = d.classList.toggle('open');
  document.getElementById('bellBtn')?.classList.toggle('active', open);
  if (open) {
    if ('Notification' in window && Notification.permission !== 'granted')
      document.getElementById('notifPermBtn').style.display = 'block';
    syncNotifUI();
  }
}
function syncNotifUI() {
  Object.keys(APP.notifs).forEach(k => {
    document.getElementById('nt_' + k)?.classList.toggle('on', !!APP.notifs[k]);
  });
  updateBell();
}
function toggleNt(key, el) {
  APP.notifs[key] = !APP.notifs[key];
  el.classList.toggle('on', APP.notifs[key]);
  localStorage.setItem('th_notifs', JSON.stringify(APP.notifs));
  updateBell();
}
function quickNt(key, btn) {
  APP.notifs[key] = !APP.notifs[key];
  btn.classList.toggle('on', APP.notifs[key]);
  btn.textContent = (APP.notifs[key] ? '🔔' : '🔕') + ' ' + (APP.lang === 'de' ? 'Alarm' : 'Alert');
  document.getElementById('nt_' + key)?.classList.toggle('on', APP.notifs[key]);
  localStorage.setItem('th_notifs', JSON.stringify(APP.notifs));
  updateBell();
  toast(APP.notifs[key] ? '🔔 Alert aktiviert' : '🔕 Alert deaktiviert');
}
function updateBell() {
  const any = Object.values(APP.notifs).some(v => v);
  document.getElementById('bellBtn')?.classList.toggle('active', any);
  const nb = document.getElementById('notifBadge');
  if (nb) nb.style.display = any ? 'block' : 'none';
}
async function askNotifPerm() {
  const p = await Notification.requestPermission();
  if (p === 'granted') {
    document.getElementById('notifPermBtn').style.display = 'none';
    toast('🔔 ' + (APP.lang==='de' ? 'Browser-Benachrichtigungen aktiviert!' : 'Notifications enabled!'));
  }
}
function sendNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(`TENNO.HUB – ${title}`, { body }); } catch(e) {}
}
/* Pro Ereignis nur einmal benachrichtigen (auch über mehrere Tabs/Reloads) */
function notifyOnce(id, title, body) {
  try {
    const sent = JSON.parse(localStorage.getItem('th_notif_sent') || '[]');
    if (sent.includes(id)) return;
    sent.push(id);
    localStorage.setItem('th_notif_sent', JSON.stringify(sent.slice(-50)));
  } catch(e) {}
  toast(`🔔 ${title}: ${body}`, 6000);
  sendNotif(title, body);
}
document.addEventListener('click', e => {
  const d = document.getElementById('notifDrawer');
  if (!d?.classList.contains('open')) return;
  if (!d.contains(e.target) && !document.getElementById('bellBtn')?.contains(e.target)) {
    d.classList.remove('open');
    document.getElementById('bellBtn')?.classList.remove('active');
  }
});

/* ── Hotkey Modal ── */
function toggleHotkeyHelp() {
  document.getElementById('hotkeyModal')?.classList.toggle('open');
}

/* ── Offline detection ── */
function _updateOnlineStatus() {
  document.getElementById('offlineBar')?.classList.toggle('visible', !navigator.onLine);
}
window.addEventListener('online',  _updateOnlineStatus);
window.addEventListener('offline', _updateOnlineStatus);

/* ── Status bar clock ── */
setInterval(() => {
  const el = document.getElementById('sbClock');
  if (el) el.textContent = new Date().toLocaleTimeString();
}, 1000);

/* ── Keyboard shortcuts ── */
document.addEventListener('keydown', e => {
  const tag = (e.target?.tagName || '').toLowerCase();
  const typing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
  if (e.key === 'Escape') {
    ['notifDrawer','hotkeyModal'].forEach(id =>
      document.getElementById(id)?.classList.remove('open'));
    document.getElementById('bellBtn')?.classList.remove('active');
    if (typeof closeSidebar === 'function') closeSidebar();
    if (typeof closeAllMobilePanels === 'function') closeAllMobilePanels();
    if (typing) e.target.blur();
    return;
  }
  if (typing) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === '/') {
    e.preventDefault();
    document.querySelector('.search-input, #relicSearch, #transInput, #resSearch, #acqSearch, #baroSearch')?.focus();
    return;
  }
  if (e.key === '?' || e.key === 'F1') { e.preventDefault(); toggleHotkeyHelp(); return; }
  if (e.key === 'r' || e.key === 'R') {
    if (typeof pageRefresh === 'function') pageRefresh();
    toast(APP.lang === 'de' ? '↻ Aktualisiere…' : '↻ Refreshing…');
    return;
  }
  if (e.key === 't' || e.key === 'T') { setLang(APP.lang === 'en' ? 'de' : 'en'); return; }
  if (e.key === 'b' || e.key === 'B') {
    if (typeof toggleSidebar === 'function') toggleSidebar();
    return;
  }
  if (/^[1-9]$/.test(e.key)) {
    const links = document.querySelectorAll('nav.sidebar-nav .sidebar-item');
    const idx   = parseInt(e.key, 10) - 1;
    if (links[idx]) window.location.href = links[idx].getAttribute('href');
  }
});

/* ── Mobile More Menu (legacy stub – replaced by shell.js v5 group panels) ── */
function toggleMobileMore() { /* noop – handled in shell.js */ }
document.addEventListener('click', e => {
  const mm = document.getElementById('mbMoreMenu');
  if (!mm?.classList.contains('open')) return;
  if (!mm.contains(e.target) && !document.getElementById('mbMoreBtn')?.contains(e.target))
    mm.classList.remove('open');
});

/* ── Service Worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
