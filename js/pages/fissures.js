/* TENNO.HUB · Void-Fissuren mit Filtern, Gruppierung und Wächter */
(function () {
const { L, esc, icon, ui, cd, bar, ts, now, TIER_ORDER, store, norm } = TH;
const $ = s => document.getElementById(s);
const f = Object.assign({ mode: 'normal', tier: 'all', type: '', q: '' }, store.get('fis_filter', {}));
if (location.hash && TIER_ORDER[location.hash.slice(1)]) f.tier = location.hash.slice(1);

const MODES = [['normal', () => L('Normal', 'Normal')], ['steel', () => L('Steel Path', 'Stahlpfad')], ['storm', () => 'Void Storm (Railjack)'], ['all', () => L('All', 'Alle')]];
let data = [];

function matches(x) {
  if (f.mode === 'normal' && (x.isHard || x.isStorm)) return false;
  if (f.mode === 'steel' && !x.isHard) return false;
  if (f.mode === 'storm' && !x.isStorm) return false;
  if (f.tier !== 'all' && x.tier !== f.tier) return false;
  if (f.type && (x.missionTypeKey || x.missionType) !== f.type) return false;
  if (f.q && !norm(`${x.node} ${x.missionType} ${x.enemy}`).includes(norm(f.q))) return false;
  return true;
}

function renderFilters() {
  const base = data.filter(x => f.mode === 'all' || (f.mode === 'normal' ? !x.isHard && !x.isStorm : f.mode === 'steel' ? x.isHard : x.isStorm));
  $('modes').innerHTML = MODES.map(([k, lbl]) => `<button type="button" data-mode="${k}" aria-pressed="${f.mode === k}" style="--c:${k === 'steel' ? '#ff8a7a' : k === 'storm' ? 'var(--void)' : 'var(--gold)'}">${esc(lbl())}</button>`).join('');
  $('tiers').innerHTML = `<button type="button" data-tier="all" aria-pressed="${f.tier === 'all'}">${esc(L('All tiers', 'Alle Stufen'))} <span class="n">${base.length}</span></button>` +
    Object.keys(TIER_ORDER).map(t => {
      const n = base.filter(x => x.tier === t).length;
      return `<button type="button" data-tier="${t}" aria-pressed="${f.tier === t}" class="t-${t}" style="--c:var(--tc)"${!n ? ' disabled style="opacity:.4"' : ''}>${t} <span class="n">${n}</span></button>`;
    }).join('');
  const types = [...new Set(data.map(x => x.missionTypeKey || x.missionType))].sort();
  const labels = new Map(data.map(x => [x.missionTypeKey || x.missionType, x.missionType]));
  $('type').innerHTML = `<option value="">${esc(L('All mission types', 'Alle Missionstypen'))}</option>` +
    types.map(t => `<option value="${esc(t)}" ${f.type === t ? 'selected' : ''}>${esc(labels.get(t))}</option>`).join('');
}

function card(x) {
  return `<div class="card card-accent fis t-${x.tier}">
    <div class="fis-top"><span class="tier">${esc(x.tier)}</span>${cd(x.expiry)}</div>
    <div class="fis-node">${esc(x.node)}</div>
    <div class="tags"><span class="chip">${esc(x.missionType)}</span><span class="chip fac fac-${norm(x.enemyKey || x.enemy).replace(/\s+/g, '-')}">${esc(x.enemy || '')}</span>
      ${x.isHard ? `<span class="chip steel">${icon('steel')}${esc(L('Steel Path', 'Stahlpfad'))}</span>` : ''}${x.isStorm ? `<span class="chip void">${icon('storm')}Void Storm</span>` : ''}</div>
    ${bar(x.activation, x.expiry)}
  </div>`;
}

function renderList() {
  const list = data.filter(matches).sort((a, b) => (TIER_ORDER[a.tier] || 9) - (TIER_ORDER[b.tier] || 9) || ts(a.expiry) - ts(b.expiry));
  $('count').textContent = `${list.length} ${L('active', 'aktiv')}`;
  if (!list.length) { $('list').innerHTML = ui.empty(L('No matching fissures', 'Keine passenden Fissuren'), L('Try another filter – new fissures appear every few minutes.', 'Probier einen anderen Filter – alle paar Minuten erscheinen neue Fissuren.')); return; }
  const groups = {};
  list.forEach(x => (groups[x.tier] ||= []).push(x));
  $('list').innerHTML = Object.entries(groups).map(([t, xs]) => `<section class="fis-group" id="${t}">
    <div class="fis-group-hd"><span class="tier t-${t}">${t}</span><span class="n">${xs.length}</span></div>
    <div class="grid-auto">${xs.map(card).join('')}</div></section>`).join('');
}

function save() { store.set('fis_filter', { mode: f.mode, tier: f.tier, type: f.type }); }

TH.page({
  id: 'fissures', ws: true,
  init() {
    document.addEventListener('click', e => {
      const m = e.target.closest('[data-mode]'), t = e.target.closest('[data-tier]');
      if (m) { f.mode = m.dataset.mode; f.tier = 'all'; save(); renderFilters(); renderList(); }
      if (t) { f.tier = t.dataset.tier; save(); renderFilters(); renderList(); }
    });
    $('type').addEventListener('change', e => { f.type = e.target.value; save(); renderList(); });
    $('q').addEventListener('input', TH.debounce(e => { f.q = e.target.value; renderList(); }, 120));
  },
  render(d) {
    data = (d.fissures || []).filter(x => ts(x.expiry) > now());
    renderFilters(); renderList();
  },
  fail(e) { $('list').innerHTML = ui.error(e); },
});
})();
