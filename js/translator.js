/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, translator.js  (v5.2)
   DE / EN item name translator via api.warframestat.us
   (warframe.market is not usable from the browser: v1 is shut down, v2 sends no CORS headers)
═══════════════════════════════════════════════════════════════ */

const TAG_CAT = {
  mod:'mod', warframe:'warframe', primary:'weapon', secondary:'weapon',
  melee:'weapon', shotgun:'weapon', rifle:'weapon', pistol:'weapon',
  bow:'weapon', 'archwing gun':'weapon', 'archwing melee':'weapon',
  'sentinel weapon':'weapon', resource:'resource', fish:'resource', gem:'resource',
};

function guessCatFromItem(i) {
  const tags = i.tags || [];
  for (const tag of tags) { if (TAG_CAT[tag]) return TAG_CAT[tag]; }
  const cat = (i.category||'').toLowerCase();
  if (cat === 'mods')      return 'mod';
  if (cat === 'warframes') return 'warframe';
  if (['primary','secondary','melee','sentinels','arch-gun','arch-melee'].includes(cat)) return 'weapon';
  if (cat === 'resources') return 'resource';
  const n = (i.name||'').toLowerCase();
  if (n.endsWith(' neuroptics')||n.endsWith(' chassis')||n.endsWith(' systems')) return 'warframe';
  return 'other';
}

const CAT_META = {
  mod:      { icon:'⬟', cls:'dot-mod',      label:'Mod',      labelDE:'Mod' },
  warframe: { icon:'⬡', cls:'dot-warframe', label:'Warframe', labelDE:'Warframe' },
  weapon:   { icon:'◈', cls:'dot-weapon',   label:'Weapon',   labelDE:'Waffe' },
  resource: { icon:'◆', cls:'dot-resource', label:'Resource', labelDE:'Ressource' },
  other:    { icon:'○', cls:'dot-other',    label:'Other',    labelDE:'Sonstiges' },
};

let _transSearchTimer = null;
let _transCatFilter = 'all';
let _transItems = [];

/* ─── Fetch with timeout helper ─── */
async function fetchWithTimeout(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' },
    });
  } finally {
    clearTimeout(tid);
  }
}

/* ─── Data source ───────────────────────────────────────────────
   api.warframestat.us/items is 56 MB per language in full. `only=` limits it to
   the four fields we need (~300 KB gzip per language). The result is cached
   locally for 24 h. Skins, glyphs, sigils, enemies, nodes and relics are dropped:
   they are ~12,000 of ~17,700 entries and only clutter a name lookup. */
const TRANS_CACHE_KEY  = 'th_trans_v1';
const TRANS_CACHE_TTL  = 24 * 60 * 60 * 1000;
const TRANS_SKIP_CATS  = new Set(['skins','glyphs','sigils','enemy','node','relics']);
const TRANS_FIELDS     = 'name,uniqueName,category,type';

async function _fetchItemList(lang) {
  const res = await fetchWithTimeout(`${WS_API}/items?language=${lang}&only=${TRANS_FIELDS}`, 30000);
  if (!res.ok) throw new Error(`HTTP ${res.status} – warframestat.us`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Unexpected response – warframestat.us');
  return data;
}

/* ─── Load translator database ─── */
async function loadTranslator() {
  window._transLoaded = false;
  const statusEl = document.getElementById('transStatus');
  const barEl    = document.getElementById('transLoadBarFill');
  const grid     = document.getElementById('transGrid');
  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }
  function setBar(p)      { if (barEl) barEl.style.width = p + '%'; }
  function showBar(v)     { if (barEl) barEl.parentElement.style.display = v ? 'block' : 'none'; }
  function done(items, note) {
    _transItems = items;
    setBar(100);
    setTimeout(() => showBar(false), 600);
    setStatus(`✓ ${items.length} ${APP.lang==='de'?'Items geladen':'items loaded'} (${note})`);
    window._transLoaded = true;
    runTransSearch(document.getElementById('transInput')?.value || '');
  }

  setStatus(APP.lang==='de' ? 'Lade Datenbank...' : 'Loading database...');
  showBar(true); setBar(10);

  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(TRANS_CACHE_KEY)); } catch(e) {}
  if (cached?.data?.length && Date.now() - cached.ts < TRANS_CACHE_TTL) {
    done(cached.data, APP.lang==='de' ? 'lokaler Cache' : 'local cache');
    return;
  }

  try {
    setStatus(APP.lang==='de' ? 'Verbinde mit warframestat.us...' : 'Connecting to warframestat.us...');
    const [enArr, deArr] = await Promise.all([_fetchItemList('en'), _fetchItemList('de')]);
    setBar(85);

    const deNameMap = {};
    deArr.forEach(i => { if (i.uniqueName && i.name) deNameMap[i.uniqueName] = i.name; });

    /* several internal entries share one name (e.g. mod variants): keep one line per en/de/category */
    const seen = new Set();
    const items = enArr
      .filter(i => i.name && i.uniqueName && !TRANS_SKIP_CATS.has((i.category||'').toLowerCase()))
      .map(i => ({ en: i.name, de: deNameMap[i.uniqueName] || i.name, cat: guessCatFromItem(i) }))
      .filter(i => { const k = `${i.en}|${i.de}|${i.cat}`; if (seen.has(k)) return false; seen.add(k); return true; });
    if (!items.length) throw new Error('Empty item list – warframestat.us');

    try { localStorage.setItem(TRANS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: items })); } catch(e) {}
    done(items, 'warframestat.us');

  } catch(err) {
    /* API down: an expired local copy is better than nothing */
    if (cached?.data?.length) {
      done(cached.data, APP.lang==='de' ? 'lokaler Cache, evtl. veraltet' : 'local cache, may be outdated');
      return;
    }
    showBar(false);
    const msg = APP.lang==='de'
      ? 'API nicht erreichbar. Bitte Seite neu laden.'
      : 'API unreachable. Please reload the page.';
    setStatus('⚠ ' + msg);
    if (grid) grid.innerHTML = `
      <div class="error-state" style="grid-column:1/-1">
        <div class="error-icon">⚠</div>
        <div>
          <strong>${escHTML(msg)}</strong><br>
          <small style="opacity:.7">warframestat.us: ${escHTML(err.message)}</small><br><br>
          <button onclick="loadTranslator()" style="margin-top:8px;padding:7px 14px;background:rgba(200,168,75,.1);border:1px solid var(--gold);border-radius:4px;color:var(--gold);cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;">
            ↻ ${APP.lang==='de'?'Erneut versuchen':'Retry'}
          </button>
        </div>
      </div>`;
  }
}

/* ─── Search ─── */
function onTransSearch(v) {
  if (_transSearchTimer) clearTimeout(_transSearchTimer);
  _transSearchTimer = setTimeout(() => runTransSearch(v), 120);
}

function setTransCat(c, btn) {
  _transCatFilter = c;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  runTransSearch(document.getElementById('transInput')?.value||'');
}

function runTransSearch(q) {
  const grid = document.getElementById('transGrid');
  if (!grid) return;
  if (!_transItems.length) { grid.innerHTML=''; return; }

  const query = q.trim().toLowerCase();
  let results = _transItems;

  if (_transCatFilter !== 'all') results = results.filter(i => i.cat===_transCatFilter);

  if (query.length < 2) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${
      APP.lang==='de'?'Mindestens 2 Zeichen eingeben...':'Type at least 2 characters...'
    }</div>`;
    return;
  }

  results = results.filter(i =>
    i.en.toLowerCase().includes(query) || i.de.toLowerCase().includes(query)
  );

  /* Score: exact → startsWith → contains */
  const score = s => s===query?0:s.startsWith(query)?1:2;
  results.sort((a,b) => {
    const aS = Math.min(score(a.en.toLowerCase()), score(a.de.toLowerCase()));
    const bS = Math.min(score(b.en.toLowerCase()), score(b.de.toLowerCase()));
    return aS - bS;
  });
  results = results.slice(0, 80);

  if (!results.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">${
      APP.lang==='de'?'Keine Ergebnisse':'No results'
    }</div>`;
    return;
  }

  grid.innerHTML = results.map(item => {
    const meta  = CAT_META[item.cat] || CAT_META.other;
    const isSame = item.de === item.en;
    const catLabel = APP.lang==='de' ? meta.labelDE : meta.label;
    return `<div class="trans-item">
      <div class="trans-cat-dot ${meta.cls}" title="${catLabel}">${meta.icon}</div>
      <div class="trans-names">
        <div class="trans-en">${escHTML(item.en)}</div>
        <div class="trans-de ${isSame?'same':''}">${escHTML(item.de)}</div>
        <div class="trans-cat-lbl">${catLabel}</div>
      </div>
      <div class="trans-btns">
        <button class="copy-btn" data-copy="${escHTML(item.en)}" onclick="copyText(this.dataset.copy,this)">EN</button>
        ${!isSame?`<button class="copy-btn" data-copy="${escHTML(item.de)}" onclick="copyText(this.dataset.copy,this)">DE</button>`:''}
      </div>
    </div>`;
  }).join('');
}
