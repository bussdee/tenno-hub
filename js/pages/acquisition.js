/* TENNO.HUB · Warframes – alle Frames mit Live-Fundorten ihrer Bauteile
   Quellen: offizielle Drop-Tabellen (Bauteile + Prime-Relics) und @wfcd/items (Namen, Beschreibung). */
(function () {
const { L, esc, icon, ui, norm, drops, fetchJSON, imgUrl, wikiUrl, isDE, showLayer, sheetHead, marketUrl } = TH;
const $ = s => document.getElementById(s);
const PARTS = [['Blueprint', 'Blaupause'], ['Neuroptics Blueprint', 'Neuroptik'], ['Chassis Blueprint', 'Chassis'], ['Systems Blueprint', 'Systeme']];
/* Frames, deren Teile NICHT (vollständig) in den Drop-Tabellen stehen */
const QUEST = {
  'Mirage': 'Hidden Messages', 'Limbo': 'The Limbo Theorem', 'Chroma': 'The New Strange', 'Inaros': 'Sands of Inaros',
  'Titania': 'The Silver Grove', 'Atlas': 'The Jordas Precept', 'Nidus': 'The Glast Gambit', 'Octavia': "Octavia's Anthem",
  'Harrow': 'Chains of Harrow', 'Revenant': 'Mask of the Revenant', 'Protea': 'The Deadlock Protocol', 'Jade': 'Jade Shadows',
  'Yareli': 'The Waverider', 'Excalibur Umbra': 'The Sacrifice',
};
const DOJO = ['Banshee', 'Nezha', 'Wukong', 'Zephyr', 'Volt'];

let FR = [], D = null, q = '', src = 'all';

function partSources(name) {
  const res = {};
  for (const [p] of PARTS) {
    const rows = (D?.byItem.get(`${name} ${p}`) || []).slice().sort((a, b) => b.chance - a.chance);
    if (rows.length) res[p] = rows;
  }
  return res;
}
function sourceKind(f) {
  if (QUEST[f.en]) return 'quest';
  if (DOJO.includes(f.en)) return 'dojo';
  if (!D) return 'unknown';
  const ps = partSources(f.en);
  const places = Object.values(ps).flat().map(r => r.place);
  if (!places.length) return 'other';
  if (places.some(p => /Bounty|Isolation Vault|Endless/.test(p))) return 'bounty';
  if (places.some(p => /Assassination|Conclave|Kuva Lich|Sister/.test(p))) return 'boss';
  return 'mission';
}
const KIND = {
  all: ['All', 'Alle'], boss: ['Boss', 'Boss'], mission: ['Missions', 'Missionen'], bounty: ['Bounties', 'Kopfgelder'],
  quest: ['Quest', 'Quest'], dojo: ['Clan Dojo', 'Clan-Dojo'], other: ['Vendor / other', 'Händler / Sonstiges'],
};

function card(f) {
  const k = sourceKind(f);
  const ps = D ? partSources(f.en) : {};
  const best = Object.values(ps).flat().sort((a, b) => b.chance - a.chance)[0];
  const hint = QUEST[f.en] ? L(`Quest: ${QUEST[f.en]}`, `Quest: ${QUEST[f.en]}`)
    : DOJO.includes(f.en) ? L('Research in the Tenno Lab (Clan Dojo)', 'Forschung im Tenno-Labor (Clan-Dojo)')
    : best ? best.place.replace(/, Rotation [ABC]$/, '') : D ? L('Vendor, quest or special source – see wiki', 'Händler, Quest oder Sonderquelle – siehe Wiki') : '';
  return `<article class="card hover item" data-frame="${esc(f.en)}" tabindex="0" role="button" style="align-items:flex-start">
    <img class="item-img" src="${imgUrl(f.img)}" alt="" loading="lazy" style="width:56px;height:56px">
    <div class="item-main"><div class="item-en" style="font-size:17px">${esc(isDE() ? f.de : f.en)}</div>
      <div class="tags" style="margin:4px 0 6px"><span class="chip gold">${esc(L(...KIND[k] || KIND.other))}</span>${f.prime ? `<span class="chip ${f.prime.v ? '' : 'ok'}">Prime${f.prime.v ? ' · ' + esc(L('vaulted', 'Tresor')) : ''}</span>` : ''}</div>
      <div class="small muted">${esc(hint)}</div></div></article>`;
}

function render() {
  $('kinds').innerHTML = Object.entries(KIND).map(([k, v]) => `<button type="button" data-src="${k}" aria-pressed="${src === k}">${esc(L(...v))}</button>`).join('');
  const nq = norm(q);
  const list = FR.filter(f => (!nq || norm(f.en + ' ' + f.de).includes(nq)) && (src === 'all' || sourceKind(f) === src));
  $('count').textContent = `${list.length} Warframes`;
  $('grid').innerHTML = list.length ? list.map(card).join('') : ui.empty(L('No Warframes found', 'Keine Warframes gefunden'));
}

function open(name) {
  const f = FR.find(x => x.en === name);
  if (!f) return;
  const ps = D ? partSources(f.en) : {};
  const primeParts = f.prime ? PARTS.map(([p, pde]) => [p, pde, (D?.byItem.get(`${f.en} Prime ${p}`) || []).filter(r => / Relic$/.test(r.place)).sort((a, b) => b.chance - a.chance)]) : [];
  showLayer('frame', sheetHead(isDE() ? f.de : f.en, 'frame') + `<div class="sheet-body">
    <div class="flex" style="align-items:flex-start;margin:10px 0"><img src="${imgUrl(f.img)}" alt="" width="96" height="96" style="object-fit:contain;border-radius:12px;background:var(--surface-2)">
      <p class="muted small" style="margin:0">${esc(isDE() ? f.desc[1] : f.desc[0])}</p></div>
    <div class="grid-2" style="gap:8px">${[['Health', 'Gesundheit', f.hp], ['Shield', 'Schild', f.sh], ['Armor', 'Rüstung', f.ar], ['Energy', 'Energie', f.en_]].map(([a, b, v]) =>
      `<div class="stat"><div class="stat-lbl">${esc(L(a, b))}</div><div class="stat-val" style="font-size:20px">${v}</div></div>`).join('')}</div>
    ${QUEST[f.en] ? `<div class="callout gold mt">${icon('book')}<p>${esc(L(`Obtained through the quest “${QUEST[f.en]}”. Replay or buy the blueprints from the Market / Cephalon Simaris depending on the quest.`, `Erhältlich über die Quest „${QUEST[f.en]}“. Je nach Quest Blaupausen danach im Markt oder bei Cephalon Simaris.`))}</p></div>` : ''}
    ${DOJO.includes(f.en) ? `<div class="callout gold mt">${icon('hammer')}<p>${esc(L('Research all blueprints in the Tenno Lab of your Clan Dojo.', 'Alle Blaupausen im Tenno-Labor deines Clan-Dojos erforschen.'))}</p></div>` : ''}
    ${PARTS.map(([p, pde]) => ps[p] ? `<h3>${esc(L(p.replace(' Blueprint', ''), pde))}</h3>${ps[p].slice(0, 6).map(r => `<div class="src-row"><div class="src-place">${esc(r.place)}</div><div class="src-pct ${r.chance >= 10 ? 'hi' : ''}">${r.chance}%</div></div>`).join('')}` : '').join('')}
    ${!Object.keys(ps).length && !QUEST[f.en] && !DOJO.includes(f.en) ? `<p class="muted mt">${esc(L('Not in the drop tables – usually a vendor (syndicate / open world), special quest or event. Check the wiki.', 'Nicht in den Drop-Tabellen – meist ein Händler (Syndikat / Open World), eine Spezial-Quest oder ein Event. Siehe Wiki.'))}</p>` : ''}
    ${f.prime ? `<h3>${esc(L('Prime relics', 'Prime-Relics'))}</h3>${f.prime.v ? `<p class="muted small">${esc(L('Vaulted – relics only via trade or Prime Resurgence.', 'Im Tresor – Relics nur per Handel oder Prime Resurgence.'))}</p>` : ''}
      ${primeParts.map(([p, pde, rows]) => rows.length ? `<div class="src-row"><div class="src-place"><strong>${esc(L(p.replace(' Blueprint', ''), pde))}</strong><small>${rows.slice(0, 6).map(r => esc(r.place.replace(' Relic', ''))).join(' · ')}</small></div><span></span></div>` : '').join('')}
      <div class="btn-row"><a class="btn btn-sm" href="relics.html?q=${encodeURIComponent(f.en + ' Prime')}">${icon('relic')}${esc(L('Open in relic planner', 'Im Relic-Planer öffnen'))}</a>
      <a class="btn btn-sm" href="${marketUrl(f.en.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_prime_set')}" target="_blank" rel="noopener">${icon('coins')}warframe.market</a></div>` : ''}
    <div class="btn-row"><a class="btn btn-sm" href="${wikiUrl(f.en)}" target="_blank" rel="noopener">${icon('book')}Wiki</a></div>
  </div>`, 'sheet-right');
}

TH.page({
  id: 'acquisition',
  init() {
    $('q').addEventListener('input', TH.debounce(e => { q = e.target.value; render(); }, 120));
    document.addEventListener('click', e => {
      const s = e.target.closest('[data-src]'), c = e.target.closest('[data-frame]');
      if (s) { src = s.dataset.src; render(); } else if (c) open(c.dataset.frame);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset?.frame) open(e.target.dataset.frame); });
    $('grid').innerHTML = ui.skeleton(9, 96);
    TH.fetchJSON('data/frames.json?v=' + TH.VERSION).then(fr => { FR = fr; render(); return drops(); })
      .then(d => { D = d; render(); })
      .catch(e => { if (!FR.length) $('grid').innerHTML = ui.error(e); else TH.toast(L('Drop tables unavailable', 'Drop-Tabellen nicht erreichbar'), { type: 'err' }); });
  },
  render() { if (FR.length) render(); },
});
})();
