/* TENNO.HUB · Lich-/Schwester-Tracker – Requiem-Reihenfolge knacken, lokal gespeichert */
(function () {
const { L, esc, icon, ui, store, toast } = TH;
const $ = s => document.getElementById(s);
const REQ = ['Fass', 'Jahu', 'Khra', 'Lohk', 'Netra', 'Ris', 'Vome', 'Xata'];
const ELEMENTS = [['Heat', 'Hitze'], ['Cold', 'Kälte'], ['Electricity', 'Elektrizität'], ['Toxin', 'Gift'], ['Radiation', 'Strahlung'], ['Magnetic', 'Magnetismus'], ['Viral', 'Viral'], ['Corrosive', 'Korrosion'], ['Blast', 'Explosion'], ['Gas', 'Gas'], ['Impact', 'Einschlag']];
const TYPES = { lich: ['Kuva Lich', 'Kuva-Lich', 'var(--grineer)'], sister: ['Sister of Parvos', 'Schwester von Parvos', 'var(--corpus)'], coda: ['Technocyte Coda', 'Technocyte Coda', 'var(--infested)'] };

/* Alte v5-Daten übernehmen */
let list = store.get('lich', null);
if (!list) {
  try { list = JSON.parse(localStorage.getItem('th_liches') || '[]'); } catch { list = []; }
  list = list.map((l, i) => ({
    id: l.created || Date.now() + i, type: l.type || 'lich', name: l.name || '', weapon: l.weapon || '', element: l.element || '',
    pct: l.bonus || '', thralls: l.thralls || 0, tried: [],
    slots: [0, 1, 2].map(k => ({ mod: (l.requiems || [])[k] || '', st: (l.verified || [])[k] === true || (l.verified || [])[k] === 'ok' ? 'ok' : (l.verified || [])[k] === false || (l.verified || [])[k] === 'no' ? 'no' : '' })),
  }));
  store.set('lich', list);
}
const save = () => store.set('lich', list);

function card(l) {
  const [en, de, color] = TYPES[l.type] || TYPES.lich;
  const known = l.slots.filter(s => s.st === 'ok').length;
  return `<article class="card card-accent" style="--accent:${color}" data-id="${l.id}">
    <div class="card-hd"><div><div class="card-lbl">${esc(L(en, de))}</div><div class="card-title">${esc(l.name || L('Unnamed', 'Ohne Namen'))}</div>
      <div class="card-sub">${esc(l.weapon || '—')}${l.element ? ` · ${esc(L(...(ELEMENTS.find(e => e[0] === l.element) || [l.element, l.element])))}` : ''}${l.pct ? ` · +${esc(l.pct)}%` : ''}</div></div>
      <button class="icon-btn sm" type="button" data-del="${l.id}" aria-label="${esc(L('Delete', 'Löschen'))}">${icon('trash')}</button></div>
    <div class="card-lbl" style="margin:6px 0 8px">${esc(L('Requiem sequence', 'Requiem-Reihenfolge'))} · ${known}/3</div>
    <div class="slots">${l.slots.map((s, i) => `<div class="slot ${s.st}">
      <div class="dim small">${i + 1}.</div>
      <select data-slot="${i}" aria-label="${esc(L(`Slot ${i + 1}`, `Platz ${i + 1}`))}"><option value="">?</option>${REQ.map(r => `<option ${s.mod === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      <div class="flex" style="justify-content:center;gap:4px">
        <button class="icon-btn sm${s.st === 'ok' ? ' on' : ''}" type="button" data-st="${i}:ok" title="${esc(L('Confirmed', 'Bestätigt'))}" style="color:var(--ok)">✓</button>
        <button class="icon-btn sm" type="button" data-st="${i}:no" title="${esc(L('Wrong', 'Falsch'))}" style="color:var(--bad)">✗</button></div></div>`).join('')}</div>
    ${l.tried?.length ? `<div class="small dim mt">${esc(L('Ruled out', 'Ausgeschlossen'))}: ${l.tried.map(esc).join(', ')}</div>` : ''}
    <div class="flex between mt"><span class="small muted">${esc(L('Thralls killed', 'Getötete Thralls'))}</span>
      <div class="flex"><button class="icon-btn sm" type="button" data-thrall="-1">−</button><strong class="mono">${l.thralls || 0}</strong><button class="icon-btn sm" type="button" data-thrall="1">+</button></div></div>
  </article>`;
}

function render() {
  $('list').innerHTML = list.length ? list.map(card).join('') : ui.empty(L('No nemesis tracked yet', 'Noch kein Nemesis erfasst'), L('Add your Lich, Sister or Coda below.', 'Füge unten deinen Lich, deine Schwester oder deine Coda hinzu.'));
  $('type').innerHTML = Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${esc(L(v[0], v[1]))}</option>`).join('');
  $('element').innerHTML = `<option value="">—</option>` + ELEMENTS.map(e => `<option value="${e[0]}">${esc(L(e[0], e[1]))}</option>`).join('');
}

const find = el => list.find(l => String(l.id) === el.closest('[data-id]')?.dataset.id);

TH.page({
  id: 'lich',
  init() {
    $('addForm').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      list.unshift({ id: Date.now(), type: fd.get('type'), name: fd.get('name').trim(), weapon: fd.get('weapon').trim(), element: fd.get('element'), pct: fd.get('pct'), slots: [{ mod: '', st: '' }, { mod: '', st: '' }, { mod: '', st: '' }], tried: [], thralls: 0 });
      save(); e.target.reset(); render(); toast(L('Added', 'Hinzugefügt'));
    });
    document.addEventListener('change', e => {
      if (e.target.dataset.slot == null) return;
      const l = find(e.target); if (!l) return;
      l.slots[+e.target.dataset.slot] = { mod: e.target.value, st: '' }; save(); render();
    });
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-st], [data-thrall], [data-del]');
      if (!t) return;
      const l = find(t); if (!l) return;
      if (t.dataset.del != null) {
        if (!confirm(L('Delete this entry?', 'Diesen Eintrag löschen?'))) return;
        list = list.filter(x => x !== l);
      } else if (t.dataset.thrall) l.thralls = Math.max(0, (l.thralls || 0) + +t.dataset.thrall);
      else {
        const [i, st] = t.dataset.st.split(':');
        const s = l.slots[+i];
        if (st === 'no' && s.mod) { l.tried = [...new Set([...(l.tried || []), `${+i + 1}. ${s.mod}`])]; l.slots[+i] = { mod: '', st: '' }; }
        else s.st = s.st === st ? '' : st;
      }
      save(); render();
    });
  },
  render,
});
})();
