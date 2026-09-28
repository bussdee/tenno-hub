/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, translator.js
   DE / EN item name translator via warframe.market API
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
  if (['primary','secondary','melee','sentinels'].includes(cat)) return 'weapon';
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
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(tid);
    return res;
  } catch(e) {
    clearTimeout(tid);
    throw e;
  }
}

/* ─── Build item list from warframe.market v2 items ─── */
function buildTransItems(items) {
  return items.map(i => {
    let cat = 'other';
    for (const tag of i.tags) { if (TAG_CAT[tag]) { cat = TAG_CAT[tag]; break; } }
    if (cat === 'other') {
      const n = i.en.toLowerCase();
      if (n.endsWith(' neuroptics')||n.endsWith(' chassis')||n.endsWith(' systems')) cat='warframe';
    }
    return { url:i.slug, en:i.en, de:i.de, cat };
  });
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

  setStatus(APP.lang==='de' ? 'Lade Datenbank...' : 'Loading database...');
  showBar(true); setBar(10);

  /* ── Attempt 1: warframe.market (preferred, has real DE translations) ── */
  try {
    setStatus(APP.lang==='de' ? 'Verbinde mit warframe.market...' : 'Connecting to warframe.market...');
    setBar(40);
    _transItems = buildTransItems(await mktItems());

    setBar(100);
    setTimeout(() => showBar(false), 600);
    setStatus(`✓ ${_transItems.length} ${APP.lang==='de'?'Items geladen (warframe.market)':'items loaded (warframe.market)'}`);
    window._transLoaded = true;
    runTransSearch('');

  } catch(primaryErr) {
    /* ── Attempt 2: warframestat.us /items as fallback ── */
    setStatus(APP.lang==='de'
      ? 'warframe.market nicht erreichbar, versuche Fallback...'
      : 'warframe.market unavailable, trying fallback...');
    setBar(30);
    try {
      const [resEN, resDE] = await Promise.all([
        fetchWithTimeout(`${WS_API}/items?language=en`, 12000),
        fetchWithTimeout(`${WS_API}/items?language=de`, 12000),
      ]);
      if (!resEN.ok) throw new Error(`Fallback HTTP ${resEN.status}`);
      setBar(65);
      const dataEN = await resEN.json();
      const dataDE = await resDE.json();
      setBar(85);

      const enArr = Array.isArray(dataEN) ? dataEN : (dataEN.payload?.items || []);
      const deArr = Array.isArray(dataDE) ? dataDE : (dataDE.payload?.items || []);

      const deNameMap = {};
      deArr.forEach(i => { if (i.uniqueName) deNameMap[i.uniqueName] = i.name; });

      _transItems = enArr
        .filter(i => i.name && i.uniqueName)
        .map(i => ({
          url: i.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          en:  i.name,
          de:  deNameMap[i.uniqueName] || i.name,
          cat: guessCatFromItem(i),
        }));

      setBar(100);
      setTimeout(() => showBar(false), 600);
      setStatus(`✓ ${_transItems.length} ${APP.lang==='de'?'Items geladen (Fallback)':'items loaded (fallback)'}`);
      window._transLoaded = true;
      runTransSearch('');

    } catch(fallbackErr) {
      showBar(false);
      const msg = APP.lang==='de'
        ? 'Beide APIs nicht erreichbar. Bitte Seite neu laden.'
        : 'Both APIs unreachable. Please reload the page.';
      setStatus('⚠ ' + msg);
      if (grid) grid.innerHTML = `
        <div class="error-state" style="grid-column:1/-1">
          <div class="error-icon">⚠</div>
          <div>
            <strong>${msg}</strong><br>
            <small style="opacity:.7">warframe.market: ${primaryErr.message}</small><br><br>
            <button onclick="loadTranslator()" style="margin-top:8px;padding:7px 14px;background:rgba(200,168,75,.1);border:1px solid var(--gold);border-radius:4px;color:var(--gold);cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px;">
              ↻ ${APP.lang==='de'?'Erneut versuchen':'Retry'}
            </button>
          </div>
        </div>`;
    }
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
        <div class="trans-en">${item.en}</div>
        <div class="trans-de ${isSame?'same':''}">${item.de}</div>
        <div class="trans-cat-lbl">${catLabel}</div>
      </div>
      <div class="trans-btns">
        <button class="copy-btn" onclick="copyText('${item.en.replace(/'/g,"\\'")}',this)">EN</button>
        ${!isSame?`<button class="copy-btn" onclick="copyText('${item.de.replace(/'/g,"\\'")}',this)">DE</button>`:''}
        <a class="market-link" href="https://warframe.market/items/${item.url}" target="_blank" rel="noopener">MKT</a>
      </div>
    </div>`;
  }).join('');
}
