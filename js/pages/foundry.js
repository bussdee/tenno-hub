/* TENNO.HUB · Gießerei-Timer – echte Bauzeiten aus der Item-Datenbank, Benachrichtigung bei Fertigstellung */
(function () {
const { L, esc, icon, ui, store, toast, items, norm, cd, bar, now, notif, isDE } = TH;
const $ = s => document.getElementById(s);
const H = 3600e3;
const PRESETS = [['12 h', 12 * H], ['23,5 h', 23.5 * H], ['24 h', 24 * H], ['3 T', 72 * H]];

/* gleicher Speicher-Schlüssel wie v5 – alte Einträge (startMs/doneMs) umwandeln */
let builds = (store.get('foundry', []) || []).map((b, i) => b.end ? b : ({ id: b.id || Date.now() + i, name: b.name || '?', start: b.startMs || now(), end: b.doneMs || now() }));
const save = () => store.set('foundry', builds);
let DB = null;

function render() {
  builds.sort((a, b) => a.end - b.end);
  $('list').innerHTML = builds.length ? builds.map(b => {
    const done = b.end <= now();
    return `<article class="card${done ? ' build-done' : ''}">
      <div class="card-hd"><div class="grow"><div class="card-title" style="font-size:19px">${esc(b.name)}</div>
        <div class="card-sub">${esc(done ? L('Ready to claim!', 'Fertig – abholen!') : L(`Ready ${TH.fmtTime(b.end)}`, `Fertig ${TH.fmtTime(b.end)}`))}</div></div>
        <button class="icon-btn sm" type="button" data-del="${b.id}" aria-label="${esc(L('Remove', 'Entfernen'))}">${icon(done ? 'check' : 'trash')}</button></div>
      <div class="flex between"><span style="font-size:22px">${done ? `<span class="ok">${icon('check')} ${esc(L('Done', 'Fertig'))}</span>` : cd(b.end, 'long', false)}</span></div>
      <div class="mt">${bar(b.start, b.end)}</div></article>`;
  }).join('') : ui.empty(L('Nothing in the Foundry', 'Nichts in der Gießerei'), L('Add what you are building to get a notification when it is done.', 'Trage ein, was du baust – du wirst benachrichtigt, wenn es fertig ist.'));
  $('presets').innerHTML = PRESETS.map(([l, ms]) => `<button type="button" data-ms="${ms}">${l}</button>`).join('');
}

function suggest(v) {
  const box = $('sugg');
  const nq = norm(v);
  if (!DB || nq.length < 2) { box.innerHTML = ''; return; }
  const hits = DB.list.filter(i => i.bt && i.k.includes(nq)).slice(0, 8);
  box.innerHTML = hits.map(i => `<button type="button" class="chip-btn" data-pick="${esc(i.en)}">${esc(isDE() ? i.de : i.en)} · ${Math.round(i.bt / 360) / 10} h</button>`).join('');
}

TH.page({
  id: 'foundry',
  init() {
    items().then(db => { DB = db; }).catch(() => {});
    $('name').addEventListener('input', TH.debounce(e => suggest(e.target.value), 120));
    $('addForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('name').value.trim(), hrs = parseFloat(String($('hours').value).replace(',', '.'));
      if (!name || !(hrs > 0)) { toast(L('Enter a name and duration', 'Name und Dauer eingeben'), { type: 'err' }); return; }
      builds.push({ id: Date.now(), name, start: now(), end: now() + hrs * H });
      save(); $('name').value = ''; $('sugg').innerHTML = ''; render();
      if (notif.permission === 'default') notif.request();
    });
    document.addEventListener('click', e => {
      const p = e.target.closest('[data-pick]'), m = e.target.closest('[data-ms]'), d = e.target.closest('[data-del]');
      if (p) {
        const it = DB.byEn.get(p.dataset.pick.toLowerCase());
        $('name').value = isDE() ? it.de : it.en; $('hours').value = Math.round(it.bt / 360) / 10; $('sugg').innerHTML = '';
      } else if (m) $('hours').value = +m.dataset.ms / H;
      else if (d) { builds = builds.filter(b => String(b.id) !== d.dataset.del); save(); render(); }
    });
    /* Fertigstellung melden */
    TH.tickHooks.add(t => {
      for (const b of builds) if (b.end <= t && t - b.end < 6 * H) notif.send('fd_' + b.id, L('Foundry', 'Gießerei'), L(`${b.name} is ready`, `${b.name} ist fertig`), 'foundry.html');
      if (builds.some(b => b.end <= t && !document.querySelector(`[data-del="${b.id}"]`)?.closest('.build-done'))) render();
    });
  },
  render,
});
})();
