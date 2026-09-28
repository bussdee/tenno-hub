/* TENNO.HUB · Relic-Planer
   Datenbasis: offizielle Drop-Tabellen (drops.warframestat.us). Enthält Inhalt aller
   Relics für alle Verfeinerungen + wo die Relics droppen (= nicht im Tresor). */
(function () {
const { L, esc, icon, ui, ts, now, TIER_ORDER, norm, store, drops, items, itemName, marketUrl, wikiUrl, showLayer, sheetHead } = TH;
const $ = s => document.getElementById(s);
const REFS = ['intact', 'exceptional', 'flawless', 'radiant'];
const REF_LBL = { intact: ['Intact', 'Intakt'], exceptional: ['Exceptional', 'Außergewöhnlich'], flawless: ['Flawless', 'Makellos'], radiant: ['Radiant', 'Strahlend'] };
const f = Object.assign({ tier: 'all', avail: 'active', q: '' }, store.get('relic_filter', {}));
const urlQ = new URLSearchParams(location.search).get('q');
if (urlQ) { f.q = urlQ; f.avail = 'all'; }

let D = null, DB = null, fissures = [], limit = 60;

const rarity = c => c >= 20 ? 'common' : c >= 10 ? 'uncommon' : 'rare';
const RAR = { common: L('Common', 'Gewöhnlich'), uncommon: L('Uncommon', 'Ungewöhnlich'), rare: L('Rare', 'Selten') };
const nameOf = en => itemName(en, DB);

function relicMatches(r, nq) {
  if (f.tier !== 'all' && r.tier !== f.tier) return false;
  if (f.avail === 'active' && r.vaulted) return false;
  if (f.avail === 'vaulted' && !r.vaulted) return false;
  if (!nq) return true;
  if (norm(`${r.tier} ${r.name}`).includes(nq)) return true;
  return (r.rewards.intact || []).some(x => norm(x.item + ' ' + nameOf(x.item)).includes(nq));
}

function fissureInfo(tier) {
  const fs = fissures.filter(x => x.tier === tier || (x.tier === 'Omnia'));
  return fs;
}

function card(r, nq) {
  const rw = [...(r.rewards.intact || r.rewards.radiant || [])].sort((a, b) => b.chance - a.chance);
  const fs = fissureInfo(r.tier).filter(x => !x.isStorm);
  return `<article class="card card-accent hover relic t-${r.tier}" data-relic="${esc(r.key)}" tabindex="0" role="button" aria-label="${esc(r.key)}">
    <div class="relic-hd"><div class="flex"><span class="tier">${r.tier}</span><span class="relic-name">${esc(r.name)}</span></div>
      ${r.vaulted ? `<span class="chip">${esc(L('Vaulted', 'Im Tresor'))}</span>` : `<span class="chip ok">${esc(L('Drops', 'Droppt'))}</span>`}</div>
    <div>${rw.map(x => {
      const rar = rarity(x.chance), m = nq && norm(x.item + ' ' + nameOf(x.item)).includes(nq);
      return `<div class="reward${m ? ' match' : ''}"><span class="rar rar-${rar}" title="${esc(RAR[rar])}"></span><span class="name">${esc(nameOf(x.item))}</span><span class="pct">${x.chance}%</span></div>`;
    }).join('')}</div>
    ${fs.length ? `<div class="small void">${icon('fissure')} ${fs.length} ${esc(L(`active ${r.tier} fissures`, `aktive ${r.tier}-Fissuren`))}</div>` : ''}
  </article>`;
}

function render() {
  if (!D) return;
  const nq = norm(f.q.trim());
  const all = [...D.relics.values()];
  const list = all.filter(r => relicMatches(r, nq))
    .sort((a, b) => (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) || a.name.localeCompare(b.name, undefined, { numeric: true }));
  $('count').textContent = `${list.length} Relics`;
  $('tiers').innerHTML = ['all', 'Lith', 'Meso', 'Neo', 'Axi', 'Requiem'].map(t =>
    `<button type="button" data-tier="${t}" aria-pressed="${f.tier === t}" class="t-${t}" style="--c:${t === 'all' ? 'var(--gold)' : 'var(--tc)'}">${t === 'all' ? esc(L('All', 'Alle')) : t}</button>`).join('');
  $('avail').innerHTML = [['active', L('Currently dropping', 'Aktuell erhältlich')], ['vaulted', L('Vaulted', 'Im Tresor')], ['all', L('All', 'Alle')]]
    .map(([k, l]) => `<button type="button" data-avail="${k}" aria-pressed="${f.avail === k}">${esc(l)}</button>`).join('');
  $('grid').innerHTML = list.length ? list.slice(0, limit).map(r => card(r, nq)).join('') +
    (list.length > limit ? `<div class="center" style="grid-column:1/-1"><button class="btn" type="button" data-more>${esc(L(`Show more (${list.length - limit})`, `Mehr anzeigen (${list.length - limit})`))}</button></div>` : '')
    : ui.empty(L('No relics found', 'Keine Relics gefunden'), f.avail === 'active' ? L('The part may only be in vaulted relics – switch to “All”.', 'Das Teil ist evtl. nur in Tresor-Relics – wechsle auf „Alle“.') : '');
}

function renderFissureStrip() {
  const el = $('fisStrip');
  const tiers = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem'];
  el.innerHTML = tiers.map(t => {
    const n = fissures.filter(x => x.tier === t && !x.isStorm && !x.isHard).length, sp = fissures.filter(x => x.tier === t && x.isHard).length;
    return `<a class="stat t-${t}" href="fissures.html#${t}" style="border-color:color-mix(in srgb, var(--tc) 35%, transparent)"><div class="stat-lbl"><span class="tier" style="height:20px">${t}</span></div>
      <div class="stat-val">${n}<span class="dim" style="font-size:14px"> + ${sp} SP</span></div><div class="stat-sub">${esc(L('active fissures', 'aktive Fissuren'))}</div></a>`;
  }).join('');
}

function openRelic(key) {
  const r = D.relics.get(key);
  if (!r) return;
  const base = [...(r.rewards.intact || [])].sort((a, b) => b.chance - a.chance);
  const chance = (item, ref) => (r.rewards[ref] || []).find(x => x.item === item)?.chance;
  const rare = base.find(x => rarity(x.chance) === 'rare');
  const rareR = rare ? (chance(rare.item, 'radiant') || 10) / 100 : 0;
  const where = (D.byItem.get(`${r.tier} ${r.name} Relic`) || []).sort((a, b) => b.chance - a.chance);
  const slugRelic = `${r.tier}_${r.name}_relic`.toLowerCase();
  showLayer('relic', sheetHead(`${r.tier} ${r.name}`, 'relic') + `<div class="sheet-body">
    <div class="flex wrap" style="margin:8px 0 14px">${r.vaulted ? `<span class="chip">${esc(L('Vaulted – only via trade or Prime Resurgence', 'Im Tresor – nur per Handel oder Prime Resurgence'))}</span>` : `<span class="chip ok">${esc(L('Currently dropping', 'Aktuell erhältlich'))}</span>`}
      <a class="btn btn-xs" href="${marketUrl(slugRelic)}" target="_blank" rel="noopener">${icon('external')}warframe.market</a>
      <a class="btn btn-xs" href="${wikiUrl(`${r.tier} ${r.name}`)}" target="_blank" rel="noopener">${icon('book')}Wiki</a></div>
    <h3>${esc(L('Drop chance by refinement', 'Drop-Chance nach Verfeinerung'))}</h3>
    <div class="tbl-wrap"><table class="tbl ref-tbl"><thead><tr><th>${esc(L('Reward', 'Belohnung'))}</th>${REFS.map(x => `<th class="num">${esc(L(...REF_LBL[x]))}</th>`).join('')}</tr></thead>
    <tbody>${base.map(x => `<tr><td><span class="rar rar-${rarity(x.chance)}" style="display:inline-block;margin-right:8px"></span>${esc(nameOf(x.item))}</td>${REFS.map(ref => {
      const c = chance(x.item, ref); return `<td class="num">${c != null ? c + '%' : '–'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
    ${rare ? `<div class="callout gold mt">${icon('info')}<div><p><strong>${esc(L('Radshare (4× Radiant)', 'Radshare (4× Strahlend)'))}</strong></p>
      <p class="small">${esc(L(`Chance that at least one of four radiant relics gives ${nameOf(rare.item)}:`, `Chance, dass mindestens eine von vier strahlenden Relics ${nameOf(rare.item)} gibt:`))} <strong class="gold">${((1 - Math.pow(1 - rareR, 4)) * 100).toFixed(1)}%</strong>
      (${esc(L('solo', 'solo'))}: ${(rareR * 100).toFixed(0)}%). ${esc(L('Radiant costs 100 Void Traces.', 'Strahlend kostet 100 Void-Spuren.'))}</p></div></div>` : ''}
    <h3>${esc(L('Where to get it', 'Wo bekommst du sie'))}</h3>
    ${where.length ? `<div>${where.slice(0, 25).map(w => `<div class="src-row"><div class="src-place">${esc(w.place.replace(/<\/?b>/g, ''))}</div><div class="src-pct ${w.chance >= 10 ? 'hi' : w.chance < 2 ? 'lo' : ''}">${w.chance}%</div></div>`).join('')}</div>`
      : `<p class="muted">${esc(L('Not dropping anywhere right now (vaulted).', 'Droppt derzeit nirgends (im Tresor).'))}</p>`}
  </div>`, 'sheet-right');
}

function saveF() { store.set('relic_filter', { tier: f.tier, avail: f.avail }); }

TH.page({
  id: 'relics', ws: true,
  init() {
    $('q').value = f.q;
    $('q').addEventListener('input', TH.debounce(e => { f.q = e.target.value; limit = 60; render(); }, 140));
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-tier]'), a = e.target.closest('[data-avail]'), r = e.target.closest('[data-relic]');
      if (t) { f.tier = t.dataset.tier; limit = 60; saveF(); render(); }
      else if (a) { f.avail = a.dataset.avail; limit = 60; saveF(); render(); }
      else if (e.target.closest('[data-more]')) { limit += 120; render(); }
      else if (r) openRelic(r.dataset.relic);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset?.relic) openRelic(e.target.dataset.relic); });
    $('grid').innerHTML = ui.skeleton(9, 230);
    Promise.all([drops(), items().catch(() => null)]).then(([d, db]) => { D = d; DB = db; render(); })
      .catch(err => { $('grid').innerHTML = ui.error(err); });
  },
  render(d) { fissures = (d.fissures || []).filter(x => ts(x.expiry) > now()); renderFissureStrip(); if (D) render(); },
  refresh() { if (!D) this.init(); },
});
})();
