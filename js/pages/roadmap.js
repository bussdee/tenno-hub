/* TENNO.HUB · Einsteiger-Roadmap – 5 Kapitel, Fortschritt lokal gespeichert */
(function () {
const { L, esc, icon, store } = TH;
const $ = s => document.getElementById(s);
const R = window.TH_ROADMAP || [];
let done = new Set(store.get('roadmap', []));
const open = new Set(store.get('roadmap_open', null) ?? [R.find(ch => ch.items.some(i => !done.has(i.id)))?.id].filter(Boolean));

function render() {
  const total = R.reduce((s, c) => s + c.items.length, 0), n = R.reduce((s, c) => s + c.items.filter(i => done.has(i.id)).length, 0);
  $('overall').innerHTML = `<div class="flex between"><strong>${esc(L('Overall progress', 'Gesamtfortschritt'))}</strong><span class="mono">${n} / ${total} · ${Math.round(n / total * 100)}%</span></div>
    <div class="progress mt"><i style="width:${n / total * 100}%"></i></div>`;
  $('chapters').innerHTML = R.map((ch, idx) => {
    const c = ch.items.filter(i => done.has(i.id)).length, full = c === ch.items.length;
    return `<details class="card chapter" data-ch="${ch.id}" style="--accent:${ch.color}" ${open.has(ch.id) ? 'open' : ''}>
      <summary><span class="chapter-n">${full ? '✓' : idx + 1}</span>
        <div class="grow"><div style="font:700 19px/1.2 var(--font-d);letter-spacing:.03em">${esc(L(ch.en, ch.de).replace(/^(Chapter|Kapitel) \d+,\s*/, ''))}</div>
        <div class="progress" style="margin-top:8px;height:5px"><i style="width:${c / ch.items.length * 100}%;background:${ch.color}"></i></div></div>
        <span class="mono small dim">${c}/${ch.items.length}</span>${icon('down')}</summary>
      <div class="chapter-body">${ch.items.map(i => `<label class="task${done.has(i.id) ? ' done' : ''}">
        <input type="checkbox" class="check" data-rm="${i.id}" ${done.has(i.id) ? 'checked' : ''}><div class="task-t">${esc(L(i.en, i.de))}</div></label>`).join('')}</div>
    </details>`;
  }).join('');
}

TH.page({
  id: 'roadmap',
  init() {
    document.addEventListener('change', e => {
      const id = e.target.dataset?.rm;
      if (!id) return;
      e.target.checked ? done.add(id) : done.delete(id);
      store.set('roadmap', [...done]); render();
    });
    document.addEventListener('toggle', e => {
      const ch = e.target.dataset?.ch;
      if (!ch) return;
      e.target.open ? open.add(ch) : open.delete(ch);
      store.set('roadmap_open', [...open]);
    }, true);
    $('reset').addEventListener('click', () => {
      if (!confirm(L('Reset all roadmap progress?', 'Gesamten Roadmap-Fortschritt zurücksetzen?'))) return;
      done = new Set(); store.set('roadmap', []); render();
    });
  },
  render,
});
})();
