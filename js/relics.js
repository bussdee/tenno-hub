/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, relics.js  (v5 – drops.warframestat.us relics.json,
   warframe.market v2 prices + vaulted status, refinement calculator)
═══════════════════════════════════════════════════════════════ */

let _allRelics   = [];
let _relicFilter = { tier:'all', vaulted:'both', query:'' };

/* ── Drop chance tables per refinement ── */
const RELIC_CHANCES = {
  intact:     { C:25.33, C2:25.33, C3:25.33, U1:11, U2:11, R:2   },  /* 3 common, 2 uncommon, 1 rare */
  exceptional:{ C:23.33, C2:23.33, C3:23.33, U1:13, U2:13, R:4   },
  flawless:   { C:20,    C2:20,    C3:20,    U1:17, U2:17, R:6   },
  radiant:    { C:16.67, C2:16.67, C3:16.67, U1:20, U2:20, R:10  },
};
const RELIC_TIERS = ['Lith','Meso','Neo','Axi','Requiem'];

/* ════════════════════════════════════════════════════════════════
   RELICS  (drops.warframestat.us, 24h lokal gecacht)
════════════════════════════════════════════════════════════════ */
const RELIC_CACHE_KEY = 'th_drops_relics_v1';
const RELIC_CACHE_TTL = 24 * 3600000;

async function loadRelics() {
  const grid = document.getElementById('relicGrid');
  if (grid) grid.innerHTML = loadHTML(APP.lang==='de'?'Lade Relic-Daten...':'Loading relic data...');
  try {
    _allRelics = await _fetchRelics();
    renderRelics();
    _applyVaultedStatus();   // best effort, braucht warframe.market
  } catch(e) {
    if (grid) grid.innerHTML = errHTML(e);
  }
}

/* drops.warframestat.us/data/relics.json:
   { relics: [{ tier, relicName, state:'Intact'|'Exceptional'|'Flawless'|'Radiant',
                rewards:[{ itemName, rarity, chance }] }] }  – ein Eintrag pro Verfeinerung */
async function _fetchRelics() {
  try {
    const c = JSON.parse(localStorage.getItem(RELIC_CACHE_KEY) || 'null');
    if (c && Date.now() - c.ts < RELIC_CACHE_TTL && c.relics?.length) return c.relics;
  } catch(e) {}
  const res = await fetch(`${DROP_API}/relics.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status} – drops.warframestat.us`);
  const raw = await res.json();
  const byKey = {};
  (raw.relics || []).forEach(r => {
    const key = `${r.tier} ${r.relicName}`;
    const rel = byKey[key] ||= { tier: r.tier, name: r.relicName, isVaulted: null, rewards: [], chances: {} };
    const state = (r.state || 'Intact').toLowerCase();
    (r.rewards || []).forEach(rw => {
      (rel.chances[rw.itemName] ||= {})[state] = rw.chance;
      if (state === 'intact') rel.rewards.push({ item: rw.itemName, rarity: rw.rarity, chance: rw.chance });
    });
  });
  const relics = Object.values(byKey).sort((a,b) =>
    RELIC_TIERS.indexOf(a.tier) - RELIC_TIERS.indexOf(b.tier) || a.name.localeCompare(b.name, undefined, { numeric:true }));
  try { localStorage.setItem(RELIC_CACHE_KEY, JSON.stringify({ ts: Date.now(), relics })); } catch(e) {}
  return relics;
}

/* Tresor-Status steht nicht in den Drop-Daten → aus warframe.market (Feld `vaulted`) */
async function _applyVaultedStatus() {
  try {
    const bySlug = {};
    (await mktItems()).forEach(i => { bySlug[i.slug] = i.vaulted; });
    _allRelics.forEach(r => {
      const v = bySlug[`${r.tier} ${r.name} relic`.toLowerCase().replace(/[^a-z0-9]+/g, '_')];
      if (typeof v === 'boolean') r.isVaulted = v;
    });
    renderRelics();
  } catch(e) { console.warn('[relics] vaulted status unavailable:', e.message); }
}

function renderRelics() {
  const q    = _relicFilter.query.toLowerCase().trim();
  const grid = document.getElementById('relicGrid');
  if (!grid) return;
  let list = _allRelics;
  if (_relicFilter.tier !== 'all')    list = list.filter(r => r.tier === _relicFilter.tier);
  if (_relicFilter.vaulted === 'unvaulted') list = list.filter(r => r.isVaulted === false);
  if (_relicFilter.vaulted === 'vaulted')   list = list.filter(r => r.isVaulted === true);
  if (q.length >= 2)
    list = list.filter(r =>
      (r.name||'').toLowerCase().includes(q) ||
      (r.tier||'').toLowerCase().includes(q) ||
      (r.rewards||[]).some(rw => (rw.item||'').toLowerCase().includes(q))
    );
  const cntEl = document.getElementById('relicCountBadge');
  if (cntEl) cntEl.textContent = `${list.length} ${APP.lang==='de'?'Relics':'relics'}`;
  if (!list.length) {
    const noVault = _relicFilter.vaulted !== 'both' && !_allRelics.some(r => r.isVaulted !== null);
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${noVault
      ? (APP.lang==='de'?'Tresor-Status derzeit nicht verfügbar (warframe.market nicht erreichbar)':'Vaulted status unavailable (warframe.market unreachable)')
      : (APP.lang==='de'?'Keine Relics gefunden':'No relics found')}</div>`;
    return;
  }
  grid.innerHTML = list.slice(0, 120).map((r,i) => relicCardHTML(r,i)).join('');
}

/* Lookup map: relicKey → relic object, populated on each render */
const _relicIndex = {};

function relicCardHTML(r, idx) {
  const key      = `${r.tier||'X'}_${(r.name||'').replace(/[^a-zA-Z0-9]/g,'_')}_${idx}`;
  _relicIndex[key] = r;
  const rewards  = (r.rewards||[]).sort((a,b) => b.chance - a.chance);
  const vaultBadge = r.isVaulted ? `<span class="relic-vaulted">🔒 ${APP.lang==='de'?'Tresorraum':'Vaulted'}</span>` : '';
  const rewardRows = rewards.map(rw => {
    const rarity = rw.rarity || (rw.chance >= 20 ? 'Common' : rw.chance >= 10 ? 'Uncommon' : 'Rare');
    return `<div class="relic-reward-row rarity-${rarity.toLowerCase()}">
      <span class="relic-reward-name">${rw.item||''}</span>
      <span class="relic-reward-pct">${rw.chance?.toFixed(2)||'?'}%</span>
      <span class="relic-rarity-chip rc-${rarity.toLowerCase()}">${rarity}</span>
    </div>`;
  }).join('');
  return `<div class="relic-card ${r.tier?.toLowerCase()||''}">
    <div class="relic-card-head">
      <div>
        <span class="tier-badge ${r.tier}">${r.tier}</span>
        <span class="relic-name">${r.name||''}</span>
      </div>
      ${vaultBadge}
    </div>
    <div class="relic-rewards">${rewardRows||`<div class="relic-no-rewards">${APP.lang==='de'?'Keine Drops bekannt':'No drops known'}</div>`}</div>
    <button class="relic-refine-btn" onclick="openRefineCalc('${key}')">
      🔮 ${APP.lang==='de'?'Verfeinerungs-Rechner':'Refinement Calc'}
    </button>
  </div>`;
}

function setRelicFilter(key, val, btn) {
  _relicFilter[key] = val;
  const group = key==='tier' ? '.tier-filter-btn' : '.vault-filter-btn';
  document.querySelectorAll(group).forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderRelics();
}
function onRelicSearch(v) {
  _relicFilter.query = v;
  if (_relicFilter._searchTimer) clearTimeout(_relicFilter._searchTimer);
  _relicFilter._searchTimer = setTimeout(renderRelics, 150);
}

/* ════════════════════════════════════════════════════════════════
   REFINEMENT CALCULATOR
   Shows drop % for all 4 refinement levels side by side
════════════════════════════════════════════════════════════════ */
function openRefineCalc(key) {
  const r = _relicIndex[key];
  if (!r) { console.warn('Relic not found:', key); return; }
  {
  const modal = document.getElementById('refineModal');
  const body  = document.getElementById('refineModalBody');
  if (!modal || !body) return;
  const rewards  = (r.rewards||[]).sort((a,b) => b.chance - a.chance);
  const refLevels = ['intact','exceptional','flawless','radiant'];
  const refLabels = { intact:'Intact', exceptional:'Exceptional', flawless:'Flawless', radiant:'Radiant ✦' };
  /* Build chance table: each reward's % at each refinement level */
  /* rarities: first 3 = common, next 2 = uncommon, last 1 = rare */
  function pctAtRef(idx, ref) {
    const ch = RELIC_CHANCES[ref];
    if (idx === 0) return ch.C;
    if (idx === 1) return ch.C2;
    if (idx === 2) return ch.C3;
    if (idx === 3) return ch.U1;
    if (idx === 4) return ch.U2;
    return ch.R;
  }
  const rows = rewards.map((rw, idx) => {
    const rarity = rw.rarity || (rw.chance >= 20 ? 'Common' : rw.chance >= 10 ? 'Uncommon' : 'Rare');
    const cells  = refLevels.map(ref => {
      const real = r.chances?.[rw.item]?.[ref];
      return `<td class="ref-pct">${(typeof real === 'number' ? real : pctAtRef(idx, ref)).toFixed(2)}%</td>`;
    }).join('');
    return `<tr>
      <td class="ref-item-name">
        <span class="relic-rarity-chip rc-${rarity.toLowerCase()}">${rarity[0]}</span>
        ${rw.item||''}
      </td>
      ${cells}
    </tr>`;
  }).join('');
  body.innerHTML = `
    <div class="refine-relic-title"><span class="tier-badge ${r.tier}">${r.tier}</span> ${r.name||''}</div>
    <div class="refine-table-scroll"><table class="refine-table">
      <thead>
        <tr>
          <th>${APP.lang==='de'?'Drop':'Drop'}</th>
          ${refLevels.map(ref=>`<th class="ref-col">${refLabels[ref]}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="refine-note">${APP.lang==='de'
      ?'Radianter Relic gibt der gewählten Drop-Rotations-Belohnung die höchste Chance auf den seltenen Drop.'
      :'Radiant Relic gives the highest chance for the rare drop when traded in a public squad.'}</div>`;
  modal.classList.add('open');
  } // end openRefineCalc
}
function closeRefineModal() {
  document.getElementById('refineModal')?.classList.remove('open');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRefineModal();
});

/* ════════════════════════════════════════════════════════════════
   WARFRAME MARKET PRICE CHECK
════════════════════════════════════════════════════════════════ */
let _mktSearchTimer = null;
async function mktSearch(q) {
  const res = document.getElementById('mktResults');
  if (!res) return;
  const query = (q||'').trim().toLowerCase();
  if (query.length < 3) { res.innerHTML = ''; return; }
  res.innerHTML = loadHTML(APP.lang==='de'?'Suche...':'Searching...');
  let slug = query.replace(/[^a-z0-9]+/g,'_');
  try {
    /* Name (EN oder DE) → slug über die Itemliste auflösen */
    const items = await mktItems();
    const score = n => { n = n.toLowerCase(); return n === query ? 0 : n.startsWith(query) ? 1 : n.includes(query) ? 2 : 9; };
    const best  = items
      .map(i => ({ i, s: Math.min(score(i.en), score(i.de)) }))
      .filter(x => x.s < 9)
      .sort((a,b) => a.s - b.s || a.i.en.length - b.i.en.length)[0]?.i;
    if (!best) {
      res.innerHTML = `<div class="mkt-no-res">${APP.lang==='de'?'Kein Item gefunden':'No item found'} – <a href="https://warframe.market" target="_blank" rel="noopener">warframe.market öffnen</a></div>`;
      return;
    }
    slug = best.slug;
    const top    = await mktFetch(`/orders/item/${encodeURIComponent(slug)}/top`);
    const orders = (top?.sell || [])
      .filter(o => !o.user?.status || o.user.status === 'ingame')
      .sort((a,b) => a.platinum - b.platinum)
      .slice(0, 5);
    const title = APP.lang==='de' ? best.de : best.en;
    if (!orders.length) {
      res.innerHTML = `<div class="mkt-item-title">${title}</div><div class="mkt-no-res">${APP.lang==='de'?'Keine In-Game-Verkäufer online':'No in-game sellers online'} – <a href="https://warframe.market/items/${slug}" target="_blank" rel="noopener">warframe.market öffnen</a></div>`;
      return;
    }
    const avg    = Math.round(orders.reduce((s,o)=>s+o.platinum,0) / orders.length);
    const lowest = orders[0].platinum;
    res.innerHTML = `
      <div class="mkt-item-title">${title}</div>
      <div class="mkt-price-summary">
        <div class="mkt-price-stat">
          <div class="mkt-price-val">${lowest} ◆</div>
          <div class="mkt-price-label">${APP.lang==='de'?'Niedrigster In-Game':'Lowest In-Game'}</div>
        </div>
        <div class="mkt-price-stat">
          <div class="mkt-price-val">${avg} ◆</div>
          <div class="mkt-price-label">${APP.lang==='de'?'Ø Top 5':'Avg Top 5'}</div>
        </div>
      </div>
      <div class="mkt-orders">
        ${orders.map(o=>`
          <div class="mkt-order">
            <span class="mkt-seller">${o.user?.ingameName||'?'}</span>
            <span class="mkt-plat">${o.platinum} ◆</span>
            <span class="mkt-qty">${APP.lang==='de'?'Anz.':'Qty'}: ${o.quantity}</span>
            <span class="mkt-status-dot" title="in-game"></span>
          </div>`).join('')}
      </div>
      <a class="mkt-open-link" href="https://warframe.market/items/${slug}" target="_blank" rel="noopener">
        🔗 warframe.market
      </a>`;
  } catch(e) {
    res.innerHTML = `<div class="mkt-no-res">${APP.lang==='de'?'Fehler':'Error'}: ${e.message} – <a href="https://warframe.market/items/${slug}" target="_blank" rel="noopener">warframe.market öffnen</a></div>`;
  }
}
function onMktSearch(v) {
  if (_mktSearchTimer) clearTimeout(_mktSearchTimer);
  _mktSearchTimer = setTimeout(() => mktSearch(v), 600);
}
