/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, relics.js  (v5.2 – drops.warframestat.us, refinement
   calculator)

   Source: DROP_API/relics.json  (core.js)
     { relics:[ { tier, relicName, state, rewards:[{ itemName, rarity, chance }] } ] }
   Every relic appears 4x (state = Intact | Exceptional | Flawless | Radiant),
   i.e. `state` is the refinement level, NOT a vault flag. The API has no
   vault status, so the page does not offer a vault filter.
   The API labels every non-rare reward "Uncommon", so the rarity shown here
   is derived from the Intact chance (25.33 → Common, 11 → Uncommon, 2 → Rare).
═══════════════════════════════════════════════════════════════ */

let _allRelics   = [];
let _relicFilter = { tier:'all', query:'' };

/* ── Drop chance tables per refinement ── */
const RELIC_CHANCES = {
  intact:     { C:25.33, C2:25.33, C3:25.33, U1:11, U2:11, R:2   },  /* 3 common, 2 uncommon, 1 rare; sums to 99.99 */
  exceptional:{ C:23.33, C2:23.33, C3:23.33, U1:13, U2:13, R:4   },
  flawless:   { C:20,    C2:20,    C3:20,    U1:17, U2:17, R:6   },
  radiant:    { C:16.67, C2:16.67, C3:16.67, U1:20, U2:20, R:10  },
};
const RELIC_TIERS = ['Lith','Meso','Neo','Axi','Requiem'];

const RELICS_CACHE_KEY = 'th_relics_v1';
const RELICS_CACHE_TTL = 24 * 60 * 60 * 1000;   // 24h – relic tables rarely change

/* ════════════════════════════════════════════════════════════════
   LOAD
════════════════════════════════════════════════════════════════ */
/* raw drops.warframestat.us payload → [{ tier, name, rewards:[{item, chance, rarity}] }] */
function _normalizeRelics(raw) {
  const rows = Array.isArray(raw) ? raw : (raw?.relics || []);
  const seen = new Set();
  const out  = [];
  rows.forEach(r => {
    if (r.state && r.state !== 'Intact') return;          // 3 more rows per relic = refinement levels
    const key = `${r.tier}|${r.relicName}`;
    if (!r.relicName || seen.has(key)) return;
    seen.add(key);
    const rewards = (r.rewards || []).map(rw => {
      const chance = Number(rw.chance);
      const c = Number.isFinite(chance) ? chance : 0;
      return { item: rw.itemName || rw.item || '', chance: c,
               rarity: c >= 20 ? 'Common' : c >= 10 ? 'Uncommon' : 'Rare' };
    }).sort((a, b) => b.chance - a.chance);
    out.push({ tier: r.tier || '', name: r.relicName, rewards });
  });
  const ord = t => { const i = RELIC_TIERS.indexOf(t); return i < 0 ? 99 : i; };
  out.sort((a, b) => ord(a.tier) - ord(b.tier) ||
                     a.name.localeCompare(b.name, undefined, { numeric:true }));
  return out;
}

async function _fetchRelicList() {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(RELICS_CACHE_KEY)); } catch(e) {}
  if (cached?.data?.length && Date.now() - cached.ts < RELICS_CACHE_TTL) return cached.data;

  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 20000);
    let res;
    try { res = await fetch(`${DROP_API}/relics.json`, { signal: ctrl.signal, headers: { Accept:'application/json' } }); }
    finally { clearTimeout(tid); }
    if (!res.ok) throw new Error(`HTTP ${res.status} – drops.warframestat.us`);
    const data = _normalizeRelics(await res.json());
    if (!data.length) throw new Error('Empty relic list – drops.warframestat.us');
    try { localStorage.setItem(RELICS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch(e) {}
    _hideStaleBar('relics');
    return data;
  } catch(e) {
    /* API down: an expired local copy is better than an empty page */
    if (cached?.data?.length) { _showStaleBar('relics', cached.ts); return cached.data; }
    throw e;
  }
}

async function loadRelics() {
  const grid = document.getElementById('relicGrid');
  if (grid) grid.innerHTML = loadHTML(APP.lang==='de'?'Lade Relic-Daten...':'Loading relic data...');
  try {
    _allRelics = await _fetchRelicList();
    renderRelics();
  } catch(e) {
    if (grid) grid.innerHTML = errHTML(e);
  }
}

function renderRelics() {
  const q    = _relicFilter.query.toLowerCase().trim();
  const grid = document.getElementById('relicGrid');
  if (!grid) return;
  let list = _allRelics;
  if (_relicFilter.tier !== 'all') list = list.filter(r => r.tier === _relicFilter.tier);
  if (q.length >= 2)
    list = list.filter(r =>
      (r.name||'').toLowerCase().includes(q) ||
      (r.tier||'').toLowerCase().includes(q) ||
      (r.rewards||[]).some(rw => (rw.item||'').toLowerCase().includes(q))
    );
  const cntEl = document.getElementById('relicCountBadge');
  if (cntEl) cntEl.textContent = `${list.length} ${APP.lang==='de'?'Relics':'relics'}`;
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${APP.lang==='de'?'Keine Relics gefunden':'No relics found'}</div>`;
    return;
  }
  grid.innerHTML = list.slice(0, 120).map((r,i) => relicCardHTML(r,i)).join('');
}

/* Lookup map: relicKey → relic object, populated on each render */
const _relicIndex = {};

function relicCardHTML(r, idx) {
  const key      = `${r.tier||'X'}_${(r.name||'').replace(/[^a-zA-Z0-9]/g,'_')}_${idx}`;
  _relicIndex[key] = r;
  const rewards  = r.rewards || [];
  const rewardRows = rewards.map(rw => {
    const rarity = rw.rarity || 'Common';
    return `<div class="relic-reward-row rarity-${rarity.toLowerCase()}">
      <span class="relic-reward-name">${escHTML(rw.item)}</span>
      <span class="relic-reward-pct">${Number(rw.chance).toFixed(2)}%</span>
      <span class="relic-rarity-chip rc-${rarity.toLowerCase()}">${rarity}</span>
    </div>`;
  }).join('');
  /* The refinement table maps the 6 rewards onto the standard 3/2/1 split */
  const refineBtn = rewards.length === 6 ? `
    <button class="relic-refine-btn" onclick="openRefineCalc('${key}')">
      🔮 ${APP.lang==='de'?'Verfeinerungs-Rechner':'Refinement Calc'}
    </button>` : '';
  return `<div class="relic-card ${escHTML((r.tier||'').toLowerCase())}">
    <div class="relic-card-head">
      <div>
        <span class="tier-badge ${escHTML(r.tier)}">${escHTML(r.tier)}</span>
        <span class="relic-name">${escHTML(r.name)}</span>
      </div>
    </div>
    <div class="relic-rewards">${rewardRows||`<div class="relic-no-rewards">${APP.lang==='de'?'Keine Drops bekannt':'No drops known'}</div>`}</div>
    ${refineBtn}
  </div>`;
}

function setRelicFilter(key, val, btn) {
  _relicFilter[key] = val;
  document.querySelectorAll('.tier-filter-btn').forEach(b => b.classList.remove('on'));
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
  const modal = document.getElementById('refineModal');
  const body  = document.getElementById('refineModalBody');
  if (!modal || !body) return;
  const rewards   = r.rewards || [];
  const refLevels = ['intact','exceptional','flawless','radiant'];
  const refLabels = { intact:'Intact', exceptional:'Exceptional', flawless:'Flawless', radiant:'Radiant ✦' };
  /* rewards are sorted by Intact chance: first 3 = common, next 2 = uncommon, last 1 = rare */
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
    const rarity = rw.rarity || 'Common';
    const cells  = refLevels.map(ref =>
      `<td class="ref-pct">${pctAtRef(idx, ref).toFixed(2)}%</td>`
    ).join('');
    return `<tr>
      <td class="ref-item-name">
        <span class="relic-rarity-chip rc-${rarity.toLowerCase()}">${rarity[0]}</span>
        ${escHTML(rw.item)}
      </td>
      ${cells}
    </tr>`;
  }).join('');
  body.innerHTML = `
    <div class="refine-relic-title"><span class="tier-badge ${escHTML(r.tier)}">${escHTML(r.tier)}</span> ${escHTML(r.name)}</div>
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
}
function closeRefineModal() {
  document.getElementById('refineModal')?.classList.remove('open');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRefineModal();
});
