/* TENNO.HUB · Drop-Finder: „Wo bekomme ich …?“ für jedes Item (EN oder DE)
   Ersetzt den alten Mod-/Item-Finder und den Ressourcen-Finder. */
(function () {
const { L, esc, icon, ui, norm, drops, items, itemName, imgUrl, marketUrl, wikiUrl, catLabel, isDE } = TH;
const $ = s => document.getElementById(s);
const TIPS = window.TH_TIPS || {}, GUIDES = window.TH_GUIDES || [];
const POPULAR = ['Orokin Cell', 'Neurodes', 'Argon Crystal', 'Forma Blueprint', 'Serration', 'Rhino Neuroptics Blueprint', 'Neural Sensors', 'Kuva', 'Oxium', 'Arcane Energize'];
const KINDS = [['all', 'All', 'Alle'], ['mission', 'Missions', 'Missionen'], ['bounty', 'Bounties', 'Kopfgelder'], ['relic', 'Relics', 'Relics'], ['enemy', 'Enemies', 'Gegner'], ['vendor', 'Syndicates & other', 'Syndikate & Sonstiges']];

let D = null, DB = null, q = new URLSearchParams(location.search).get('q') || '', kind = 'all';
const expanded = new Set();

function placeKind(p) {
  if (/ Relic( \(|$)/.test(p)) return 'relic';
  if (/Bounty|Endless: Tier|Isolation Vault|Arcana Vault/.test(p)) return 'bounty';
  if (/\(|Rotation|\//.test(p)) return 'mission';
  if (/, (Neutral|Friendly|Respected|Honored|Revered|Exalted|Rank|Offerings)|Syndicate|Holdfasts|Ostron|Solaris|Entrati|Necraloid|Cavia|Hex/.test(p)) return 'vendor';
  return 'enemy';
}
function splitPlace(p) {
  const m = p.match(/^(.*?),\s*(Rotation [ABC])$/);
  return m ? { main: m[1], rot: m[2] } : { main: p, rot: '' };
}

function search(term) {
  const nq = norm(term);
  if (nq.length < 2) return [];
  const hits = [];
  const lang = TH.state.lang;
  if (D._keyLang !== lang) {
    D._keys = D.names.map(name => { const de = DB ? itemName(name, DB) : name; return [name, de, norm(name) + '\u0001' + norm(de)]; });
    D._keyLang = lang;
  }
  for (const [name, de, k] of D._keys) {
    const i = k.indexOf(nq);
    if (i < 0) continue;
    const exact = norm(name) === nq || norm(de) === nq;
    hits.push({ name, de, score: exact ? 0 : (i === 0 || k.includes('\u0001' + nq)) ? 1 : 2 });
  }
  hits.sort((a, b) => a.score - b.score || a.name.length - b.name.length);
  return hits.slice(0, 30);
}

function sources(name) {
  const rows = (D.byItem.get(name) || []).filter(r => kind === 'all' || placeKind(r.place) === kind);
  return rows.sort((a, b) => b.chance - a.chance);
}

function card(h) {
  const it = DB?.byEn.get(h.name.toLowerCase());
  const src = sources(h.name);
  const all = expanded.has(h.name);
  const tip = TIPS[h.name];
  const shown = isDE() ? h.de : h.name, alt = isDE() ? h.name : h.de;
  const kinds = [...new Set((D.byItem.get(h.name) || []).map(r => placeKind(r.place)))];
  return `<article class="card">
    <div class="item" style="padding:0 0 12px">
      ${it?.img ? `<img class="item-img" src="${imgUrl(it.img)}" alt="" loading="lazy">` : `<div class="item-img ph">${icon('search')}</div>`}
      <div class="item-main"><div class="item-en">${esc(shown)}</div>${alt !== shown ? `<div class="small dim">${esc(alt)}</div>` : ''}
        <div class="tags" style="margin-top:6px">${it ? `<span class="chip">${esc(catLabel(it.cat))}</span>` : ''}${kinds.map(k => `<span class="chip void">${esc(L(...KINDS.find(x => x[0] === k).slice(1)))}</span>`).join('')}</div></div>
      <div class="item-actions">
        <button class="icon-btn sm" type="button" data-copy="${esc(shown)}" title="${esc(L('Copy name', 'Namen kopieren'))}">${icon('copy')}</button>
        ${it?.slug ? `<a class="icon-btn sm" href="${marketUrl(it.slug)}" target="_blank" rel="noopener" title="warframe.market">${icon('coins')}</a>` : ''}
        <a class="icon-btn sm" href="${wikiUrl(h.name.replace(/ Blueprint$/, ''))}" target="_blank" rel="noopener" title="Wiki">${icon('book')}</a></div>
    </div>
    ${tip ? `<div class="callout gold" style="padding:10px 12px;margin-bottom:10px">${icon('star')}<p>${esc(L(tip.en, tip.de))}</p></div>` : ''}
    ${src.length ? src.slice(0, all ? 200 : 6).map(r => {
      const p = splitPlace(r.place);
      return `<div class="src-row"><div class="src-place">${esc(p.main)}<small>${esc([p.rot, r.qty].filter(Boolean).join(' · '))}</small></div>
        <div class="src-pct ${r.chance >= 10 ? 'hi' : r.chance < 1 ? 'lo' : ''}">${r.chance}%</div></div>`;
    }).join('') : `<p class="muted small">${esc(L('No sources for this filter.', 'Keine Quellen für diesen Filter.'))}</p>`}
    ${src.length > 6 ? `<button class="btn btn-sm mt" type="button" data-expand="${esc(h.name)}">${icon(all ? 'down' : 'chevron')}${esc(all ? L('Show less', 'Weniger') : L(`All ${src.length} sources`, `Alle ${src.length} Quellen`))}</button>` : ''}
  </article>`;
}

function guideCards(nq) {
  const gs = GUIDES.filter(g => !nq || norm(g.en + ' ' + g.de).includes(nq));
  return gs.map(g => `<article class="card card-accent"><div class="card-hd"><div class="card-lbl">${icon(g.ic)}${esc(L('Guide', 'Leitfaden'))}</div></div>
    <div class="card-title" style="font-size:20px">${esc(L(g.en, g.de))}</div><p class="muted mt">${esc(L(...g.tip))}</p>
    ${g.src.map(s => `<div class="src-row"><div class="src-place">${esc(L(...s))}</div><span></span></div>`).join('')}</article>`).join('');
}

function render() {
  if (!D) return;
  $('kinds').innerHTML = KINDS.map(([k, en, de]) => `<button type="button" data-kind="${k}" aria-pressed="${kind === k}">${esc(L(en, de))}</button>`).join('');
  const nq = norm(q.trim());
  if (nq.length < 2) {
    $('results').innerHTML = `<div class="card" style="grid-column:1/-1"><div class="card-lbl">${icon('star')}${esc(L('Popular searches', 'Beliebte Suchen'))}</div>
      <div class="chips mt">${POPULAR.map(p => `<button type="button" data-q="${esc(p)}">${esc(itemName(p, DB))}</button>`).join('')}</div></div>` + guideCards('');
    $('count').textContent = `${D.names.length.toLocaleString()} ${L('items in the drop tables', 'Items in den Drop-Tabellen')}`;
    return;
  }
  const hits = search(q);
  $('count').textContent = `${hits.length}${hits.length === 30 ? '+' : ''} ${L('matches', 'Treffer')}`;
  $('results').innerHTML = (guideCards(nq) + hits.map(card).join('')) ||
    ui.empty(L('Nothing found in the drop tables', 'Nichts in den Drop-Tabellen gefunden'), L('Tip: try the English or German name, or a part of it (e.g. “Neuroptics”).', 'Tipp: Englischen oder deutschen Namen oder einen Teil davon probieren (z. B. „Neuroptik“).'));
}

function setQ(v) {
  q = v; $('q').value = v;
  const u = new URL(location.href);
  v ? u.searchParams.set('q', v) : u.searchParams.delete('q');
  history.replaceState(null, '', u);
  render();
}

TH.page({
  id: 'itemfinder',
  init() {
    $('q').value = q;
    $('q').addEventListener('input', TH.debounce(e => setQ(e.target.value), 180));
    document.addEventListener('click', e => {
      const k = e.target.closest('[data-kind]'), x = e.target.closest('[data-expand]'), p = e.target.closest('[data-q]');
      if (k) { kind = k.dataset.kind; render(); }
      else if (x) { const n = x.dataset.expand; expanded.has(n) ? expanded.delete(n) : expanded.add(n); render(); }
      else if (p) { setQ(p.dataset.q); $('q').focus(); }
    });
    $('results').innerHTML = ui.loading(L('Loading official drop tables…', 'Lade offizielle Drop-Tabellen…'));
    Promise.all([drops(), items().catch(() => null)]).then(([d, db]) => { D = d; DB = db; render(); })
      .catch(err => { $('results').innerHTML = ui.error(err); });
  },
  render() { if (D) render(); },
  refresh() { if (!D) this.init(); },
});
})();
