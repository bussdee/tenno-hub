/* TENNO.HUB · Nightwave – Aufgaben abhaken, Ansehen zusammenrechnen */
(function () {
const { L, esc, icon, ui, cd, ts, now, store, fmtNum } = TH;
const $ = s => document.getElementById(s);
let done = new Set(store.get('nw_done', []));
let last = null;

const kind = c => c.isDaily ? 'daily' : c.isElite ? 'elite' : 'weekly';
const KIND = {
  daily:  { en: 'Daily', de: 'Täglich', chip: 'void' },
  weekly: { en: 'Weekly', de: 'Wöchentlich', chip: 'gold' },
  elite:  { en: 'Elite weekly', de: 'Elite wöchentlich', chip: 'purple' },
};

function render(d) {
  last = d;
  const nw = d.nightwave;
  const list = (nw?.activeChallenges || []).filter(c => ts(c.expiry) > now());
  if (!list.length) { $('nw').innerHTML = ui.empty(L('No active Nightwave season', 'Keine aktive Nightwave-Saison')); $('nwStats').innerHTML = ''; return; }
  /* Erledigt-Liste auf aktuelle Aufgaben beschränken */
  const ids = new Set(list.map(c => c.id));
  done = new Set([...done].filter(id => ids.has(id)));
  store.set('nw_done', [...done]);

  const total = list.reduce((s, c) => s + (c.reputation || 0), 0);
  const got = list.filter(c => done.has(c.id)).reduce((s, c) => s + (c.reputation || 0), 0);
  $('nwStats').innerHTML = `
    <div class="stat"><div class="stat-lbl">${icon('radar')}${esc(L('Season', 'Saison'))}</div><div class="stat-val">${nw.season ?? '—'}${nw.phase != null ? ` · ${esc(L('Phase', 'Phase'))} ${nw.phase}` : ''}</div></div>
    <div class="stat"><div class="stat-lbl">${icon('check')}${esc(L('Done', 'Erledigt'))}</div><div class="stat-val">${list.filter(c => done.has(c.id)).length} / ${list.length}</div></div>
    <div class="stat"><div class="stat-lbl">${icon('trophy')}${esc(L('Standing', 'Ansehen'))}</div><div class="stat-val">${fmtNum(got)} <span class="dim" style="font-size:15px">/ ${fmtNum(total)}</span></div>
      <div class="progress mt"><i style="width:${total ? (got / total * 100).toFixed(1) : 0}%"></i></div></div>
    <div class="stat"><div class="stat-lbl">${icon('clock')}${esc(L('Weekly reset', 'Wochen-Reset'))}</div><div class="stat-val">${cd(TH.nextWeekly(), 'long', false)}</div></div>`;

  const groups = ['daily', 'weekly', 'elite'].map(k => [k, list.filter(c => kind(c) === k).sort((a, b) => ts(a.expiry) - ts(b.expiry))]).filter(([, xs]) => xs.length);
  $('nw').innerHTML = groups.map(([k, xs]) => `
    <div class="group-hd"><h2>${esc(L(KIND[k].en, KIND[k].de))}</h2><span class="chip ${KIND[k].chip}">${fmtNum(xs.reduce((s, c) => s + (c.reputation || 0), 0))} ${esc(L('Standing', 'Ansehen'))}</span></div>
    <div class="grid-auto lg">${xs.map(c => `<label class="card nw${done.has(c.id) ? ' done' : ''}">
      <input type="checkbox" class="check" data-nw="${esc(c.id)}" ${done.has(c.id) ? 'checked' : ''}>
      <div class="grow"><div class="nw-title">${esc(c.title)}</div><div class="nw-desc">${esc(c.desc)}</div>
      <div class="nw-meta"><span class="chip ${KIND[k].chip}">+${fmtNum(c.reputation)}</span><span>${icon('clock')} ${cd(c.expiry, 'long')}</span></div></div></label>`).join('')}</div>`).join('');
}

TH.page({
  id: 'nightwave', ws: true,
  init() {
    document.addEventListener('change', e => {
      const id = e.target.dataset?.nw;
      if (!id) return;
      e.target.checked ? done.add(id) : done.delete(id);
      store.set('nw_done', [...done]);
      if (last) render(last);
    });
  },
  render,
  fail(e) { $('nw').innerHTML = ui.error(e); },
});
})();
