/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, foundry.js  (new feature v4)
   Foundry Build Timer Tracker – all data in localStorage
═══════════════════════════════════════════════════════════════ */

const FOUNDRY_KEY = 'th_foundry';
let _builds = [];
function _fSave() { localStorage.setItem(FOUNDRY_KEY, JSON.stringify(_builds)); }
function _fLoad() {
  try { _builds = JSON.parse(localStorage.getItem(FOUNDRY_KEY)||'[]'); }
  catch(e) { _builds = []; }
}

/* ── Build duration presets (ms) ── */
const BUILD_PRESETS = [
  { label:'12h', ms: 12 * 3600000 },
  { label:'24h', ms: 24 * 3600000 },
  { label:'3d',  ms: 72 * 3600000 },
  { label:'7d',  ms: 168* 3600000 },
];

/* ── Common Warframe build times ── */
const COMMON_ITEMS = [
  { en:'Warframe Component',  de:'Warframe-Komponente',   ms: 12 * 3600000 },
  { en:'Warframe (full)',     de:'Warframe (vollständig)',ms: 72 * 3600000 },
  { en:'Primary Weapon',      de:'Primärwaffe',           ms: 24 * 3600000 },
  { en:'Secondary Weapon',    de:'Sekundärwaffe',         ms: 24 * 3600000 },
  { en:'Melee Weapon',        de:'Nahkampfwaffe',         ms: 24 * 3600000 },
  { en:'Sentinel',            de:'Sentinel',              ms: 24 * 3600000 },
  { en:'Orokin Reactor',      de:'Orokin-Reaktor',        ms: 24 * 3600000 },
  { en:'Orokin Catalyst',     de:'Orokin-Katalysator',    ms: 24 * 3600000 },
  { en:'Forma Blueprint',     de:'Forma-Blueprint',       ms: 24 * 3600000 },
  { en:'Exilus Adapter',      de:'Exilus-Adapter',        ms: 24 * 3600000 },
  { en:'Kavat',               de:'Kavat',                 ms: 24 * 3600000 },
  { en:'Kubrow',              de:'Kubrow',                ms: 24 * 3600000 },
  { en:'Archwing',            de:'Archwing',              ms: 24 * 3600000 },
  { en:'Necramech',           de:'Necramech',             ms: 72 * 3600000 },
  { en:'K-Drive',             de:'K-Drive',               ms: 24 * 3600000 },
];

/* ── Init ── */
function initFoundry() {
  _fLoad();
  renderFoundryForm();
  renderFoundryList();
  startFoundryTimers();
}

/* ── Form ── */
function renderFoundryForm() {
  const el = document.getElementById('foundryFormContainer');
  if (!el) return;
  const presetOpts = COMMON_ITEMS.map(p =>
    `<option value="${p.ms}">${APP.lang==='de'?p.de:p.en} (${p.ms>=72*3600000?p.ms/3600000/24+'d':p.ms/3600000+'h'})</option>`
  ).join('');
  el.innerHTML = `
    <div class="foundry-form">
      <div class="foundry-form-title">➕ ${APP.lang==='de'?'Neuen Build starten':'Start new build'}</div>
      <div class="foundry-form-grid">
        <div class="foundry-form-group foundry-form-full">
          <label>${APP.lang==='de'?'Item-Name':'Item name'}</label>
          <input id="ffName" type="text" class="foundry-form-input"
                 placeholder="${APP.lang==='de'?'z.B. Rhino Chassis':'e.g. Rhino Chassis'}">
        </div>
        <div class="foundry-form-group">
          <label>${APP.lang==='de'?'Vorgabe wählen':'Preset'}</label>
          <select id="ffPreset" onchange="applyPreset()" class="foundry-form-input">
            <option value="">— ${APP.lang==='de'?'oder manuell':'or manual'} —</option>
            ${presetOpts}
          </select>
        </div>
        <div class="foundry-form-group">
          <label>${APP.lang==='de'?'Bauzeit (Stunden)':'Build time (hours)'}</label>
          <input id="ffHours" type="number" min="1" max="720" step="0.5"
                 class="foundry-form-input" placeholder="z.B. 72">
        </div>
        <div class="foundry-form-group">
          <label>${APP.lang==='de'?'Gestartet (leer = jetzt)':'Started (empty = now)'}</label>
          <input id="ffStart" type="datetime-local" class="foundry-form-input">
        </div>
        <div class="foundry-form-group">
          <label>${APP.lang==='de'?'Kategorie':'Category'}</label>
          <select id="ffCat" class="foundry-form-input">
            <option value="warframe">${APP.lang==='de'?'Warframe':'Warframe'}</option>
            <option value="weapon">${APP.lang==='de'?'Waffe':'Weapon'}</option>
            <option value="component">${APP.lang==='de'?'Komponente':'Component'}</option>
            <option value="misc">${APP.lang==='de'?'Sonstiges':'Misc'}</option>
          </select>
        </div>
      </div>
      <button class="foundry-add-btn" onclick="addBuild()">
        ▶ ${APP.lang==='de'?'In Bauauftrag geben':'Start Build'}
      </button>
    </div>`;
}

function applyPreset() {
  const sel = document.getElementById('ffPreset');
  const hrs = document.getElementById('ffHours');
  const nm  = document.getElementById('ffName');
  if (!sel || !hrs) return;
  const ms = parseInt(sel.value || '0', 10);
  if (!ms) return;
  hrs.value = (ms / 3600000).toFixed(1);
  /* Also auto-fill name if empty */
  if (nm && !nm.value) {
    const preset = COMMON_ITEMS.find(p => p.ms === ms);
    if (preset) nm.value = APP.lang==='de' ? preset.de : preset.en;
  }
}

function addBuild() {
  const name  = (document.getElementById('ffName')?.value||'').trim();
  const hours = parseFloat(document.getElementById('ffHours')?.value||'0');
  const cat   = document.getElementById('ffCat')?.value || 'misc';
  const startEl = document.getElementById('ffStart')?.value;
  if (!name) { toast(APP.lang==='de'?'⚠ Bitte einen Namen eingeben!':'⚠ Please enter a name!'); return; }
  if (!hours || hours <= 0) { toast(APP.lang==='de'?'⚠ Bitte eine Bauzeit eingeben!':'⚠ Please enter build time!'); return; }
  const startMs = startEl ? new Date(startEl).getTime() : Date.now();
  const doneMs  = startMs + hours * 3600000;
  _builds.unshift({ id: Date.now(), name, cat, hours, startMs, doneMs });
  _fSave();
  renderFoundryList();
  startFoundryTimers();
  /* Reset */
  ['ffName','ffHours','ffStart'].forEach(id => { const e = document.getElementById(id); if (e) e.value=''; });
  const sel = document.getElementById('ffPreset');
  if (sel) sel.value = '';
  toast(`▶ ${name} ${APP.lang==='de'?'gestartet!':'started!'}`);
}

/* ── List ── */
const CAT_ICON = { warframe:'🎭', weapon:'⚔', component:'🔩', misc:'📦' };
function renderFoundryList() {
  const el = document.getElementById('foundryListContainer');
  if (!el) return;
  if (!_builds.length) {
    el.innerHTML = `<div class="empty-state">${APP.lang==='de'?'Keine aktiven Builds. Füge oben einen hinzu!':'No active builds. Add one above!'}</div>`;
    return;
  }
  const now = Date.now();
  /* Sort: in-progress first, then done */
  const sorted = [..._builds].sort((a,b) => {
    const aDone = a.doneMs <= now;
    const bDone = b.doneMs <= now;
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.doneMs - b.doneMs;
  });
  el.innerHTML = sorted.map(b => buildCardHTML(b, now)).join('');
}
function buildCardHTML(b, now) {
  const done   = b.doneMs <= now;
  const ms     = done ? 0 : b.doneMs - now;
  const total  = b.hours * 3600000;
  const pct    = done ? 100 : Math.min(100, ((now - b.startMs) / total) * 100);
  const doneDate = new Date(b.doneMs).toLocaleString();
  const icon   = CAT_ICON[b.cat] || '📦';
  return `<div class="foundry-card ${done?'build-done':''}">
    <div class="foundry-card-head">
      <div class="foundry-card-title">
        <span class="foundry-icon">${icon}</span>
        <span class="foundry-name">${b.name}</span>
        ${done ? `<span class="build-ready-badge">✓ ${APP.lang==='de'?'FERTIG':'READY'}</span>` : ''}
      </div>
      <button class="foundry-del-btn" onclick="removeBuild(${b.id})" title="${APP.lang==='de'?'Entfernen':'Remove'}">🗑</button>
    </div>
    <div class="foundry-bar-wrap">
      <div class="foundry-bar-track">
        <div class="foundry-bar-fill ${done?'bar-done':''}" id="fpb-${b.id}" style="width:${pct.toFixed(1)}%"></div>
      </div>
      <span class="foundry-pct">${pct.toFixed(0)}%</span>
    </div>
    <div class="foundry-meta">
      <span class="foundry-timer" id="fpt-${b.id}">${done
        ? (APP.lang==='de'?'Bereit zum Abholen!':'Ready to claim!')
        : fmtMsLong(ms)}</span>
      <span class="foundry-done-date">${APP.lang==='de'?'Fertig':'Done'}: ${doneDate}</span>
    </div>
  </div>`;
}

function removeBuild(id) {
  _builds = _builds.filter(b => b.id !== id);
  _fSave();
  renderFoundryList();
}

/* ── Live countdown timers ── */
function startFoundryTimers() {
  if (APP.timers.foundry) clearInterval(APP.timers.foundry);
  APP.timers.foundry = setInterval(() => {
    const now = Date.now();
    let anyChange = false;
    _builds.forEach(b => {
      const tEl = document.getElementById(`fpt-${b.id}`);
      const pEl = document.getElementById(`fpb-${b.id}`);
      if (!tEl) return;
      const ms = b.doneMs - now;
      if (ms <= 0) {
        if (!tEl.textContent.includes('Ready') && !tEl.textContent.includes('Bereit')) {
          anyChange = true; /* Re-render to flip to done state */
        }
        tEl.textContent = APP.lang==='de'?'Bereit zum Abholen!':'Ready to claim!';
        if (pEl) { pEl.style.width='100%'; pEl.classList.add('bar-done'); }
      } else {
        tEl.textContent = fmtMsLong(ms);
        if (pEl) {
          const total = b.hours * 3600000;
          const pct   = Math.min(100, ((now - b.startMs) / total) * 100);
          pEl.style.width = pct.toFixed(2) + '%';
        }
      }
    });
    if (anyChange) renderFoundryList();
  }, 5000); /* Update every 5 seconds */
}
