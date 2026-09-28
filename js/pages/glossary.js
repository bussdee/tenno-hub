/* TENNO.HUB · Glossar – Warframe-Jargon verständlich erklärt (EN/DE) */
(function () {
const { L, esc, ui, norm, isDE } = TH;
const $ = s => document.getElementById(s);
const G = window.TH_GLOSSARY || [], CATS = window.TH_GLOSSARY_CATS || {};
let q = '', cat = 'all';

function render() {
  const used = new Set(G.map(g => g.cat));
  $('cats').innerHTML = Object.entries(CATS).filter(([k]) => k === 'all' || used.has(k))
    .map(([k, v]) => `<button type="button" data-cat="${k}" aria-pressed="${cat === k}">${esc(L(v.en, v.de))}</button>`).join('');
  const nq = norm(q);
  const list = G.filter(g => (cat === 'all' || g.cat === cat) && (!nq || norm(`${g.term} ${g.termDe} ${g.en} ${g.de}`).includes(nq)))
    .sort((a, b) => (isDE() ? a.termDe : a.term).localeCompare(isDE() ? b.termDe : b.term, 'de'));
  $('count').textContent = `${list.length} ${L('terms', 'Begriffe')}`;
  $('grid').innerHTML = list.length ? list.map(g => {
    const main = isDE() ? g.termDe : g.term, alt = isDE() ? g.term : g.termDe;
    return `<article class="card term"><div class="flex between" style="align-items:flex-start"><div class="term-name">${esc(main)}</div>
      <span class="chip">${esc(L(CATS[g.cat]?.en || g.cat, CATS[g.cat]?.de || g.cat))}</span></div>
      ${alt !== main ? `<div class="term-de">${esc(isDE() ? 'EN' : 'DE')}: ${esc(alt)}</div>` : ''}
      <p>${esc(L(g.en, g.de))}</p></article>`;
  }).join('') : ui.empty(L('No terms found', 'Keine Begriffe gefunden'));
}

TH.page({
  id: 'glossary',
  init() {
    $('q').addEventListener('input', TH.debounce(e => { q = e.target.value; render(); }, 100));
    document.addEventListener('click', e => { const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; render(); } });
  },
  render,
});
})();
