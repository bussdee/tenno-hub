/* TENNO.HUB · DE/EN-Übersetzer – offizielle Client-Namen, offline verfügbar */
(function () {
const { L, esc, icon, ui, norm, items, imgUrl, marketUrl, wikiUrl, catLabel, store } = TH;
const $ = s => document.getElementById(s);
const CATS = ['all', 'mod', 'frame', 'weapon', 'part', 'arcane', 'resource', 'companion', 'misc'];
let DB = null, q = new URLSearchParams(location.search).get('q') || '', cat = store.get('tr_cat', 'all'), onlyDiff = store.get('tr_diff', false);

function render() {
  $('cats').innerHTML = CATS.map(c => `<button type="button" data-cat="${c}" aria-pressed="${cat === c}">${esc(c === 'all' ? L('All', 'Alle') : catLabel(c))}</button>`).join('') +
    `<span class="sep"></span><button type="button" data-diff aria-pressed="${onlyDiff}" style="--c:var(--void)">${esc(L('Only different names', 'Nur abweichende Namen'))}</button>`;
  if (!DB) return;
  const nq = norm(q.trim());
  if (nq.length < 2) {
    $('count').textContent = `${DB.list.length.toLocaleString()} ${L('names', 'Namen')} · @wfcd/items ${DB.version}`;
    $('grid').innerHTML = ui.empty(L('Type at least 2 letters – English or German.', 'Mindestens 2 Buchstaben eingeben – Deutsch oder Englisch.'),
      L('Example: “Serration” → “Einkerbung”, “Streamline” → “Stromlinie”.', 'Beispiel: „Einkerbung“ → „Serration“, „Stromlinie“ → „Streamline“.'));
    return;
  }
  const hits = [];
  for (const it of DB.list) {
    if (cat !== 'all' && it.cat !== cat) continue;
    if (onlyDiff && it.en === it.de) continue;
    const i = it.k.indexOf(nq);
    if (i < 0) continue;
    const en = norm(it.en), de = norm(it.de);
    hits.push([en === nq || de === nq ? 0 : en.startsWith(nq) || de.startsWith(nq) ? 1 : 2, it]);
  }
  hits.sort((a, b) => a[0] - b[0] || a[1].en.length - b[1].en.length);
  $('count').textContent = `${hits.length} ${L('matches', 'Treffer')}`;
  $('grid').innerHTML = hits.length ? hits.slice(0, 90).map(([, it]) => `<div class="card item">
    ${it.img ? `<img class="item-img" src="${imgUrl(it.img)}" alt="" loading="lazy">` : `<div class="item-img ph">${icon('lang')}</div>`}
    <div class="item-main">
      <div class="flex" style="gap:6px"><span class="chip" style="padding:1px 6px">EN</span><span class="item-en">${esc(it.en)}</span></div>
      <div class="flex" style="gap:6px;margin-top:4px"><span class="chip gold" style="padding:1px 6px">DE</span><span class="item-de${it.de === it.en ? ' same' : ''}">${esc(it.de)}</span></div>
      <div class="small dim" style="margin-top:4px">${esc(catLabel(it.cat))}</div></div>
    <div class="item-actions" style="flex-direction:column">
      <button class="btn btn-xs" type="button" data-copy="${esc(it.en)}">${icon('copy')}EN</button>
      <button class="btn btn-xs" type="button" data-copy="${esc(it.de)}">${icon('copy')}DE</button></div>
    <div class="item-actions" style="flex-direction:column">
      <a class="icon-btn sm" href="itemfinder.html?q=${encodeURIComponent(it.en)}" title="${esc(L('Where to get', 'Wo bekommen'))}">${icon('search')}</a>
      ${it.slug ? `<a class="icon-btn sm" href="${marketUrl(it.slug)}" target="_blank" rel="noopener" title="warframe.market">${icon('coins')}</a>` : `<a class="icon-btn sm" href="${wikiUrl(it.en)}" target="_blank" rel="noopener" title="Wiki">${icon('book')}</a>`}</div>
  </div>`).join('') + (hits.length > 90 ? `<p class="muted small center" style="grid-column:1/-1">${esc(L('Showing 90 – refine your search.', '90 angezeigt – Suche verfeinern.'))}</p>` : '')
  : ui.empty(L('No matches', 'Keine Treffer'));
}

function setQ(v) {
  q = v;
  const u = new URL(location.href);
  v ? u.searchParams.set('q', v) : u.searchParams.delete('q');
  history.replaceState(null, '', u);
  render();
}

TH.page({
  id: 'translator',
  init() {
    $('q').value = q;
    $('q').addEventListener('input', TH.debounce(e => setQ(e.target.value), 120));
    document.addEventListener('click', e => {
      const c = e.target.closest('[data-cat]');
      if (c) { cat = c.dataset.cat; store.set('tr_cat', cat); render(); }
      if (e.target.closest('[data-diff]')) { onlyDiff = !onlyDiff; store.set('tr_diff', onlyDiff); render(); }
    });
    $('grid').innerHTML = ui.loading(L('Loading name database…', 'Lade Namensdatenbank…'));
    items().then(db => { DB = db; render(); }).catch(e => { $('grid').innerHTML = ui.error(e); });
  },
  render,
});
})();
