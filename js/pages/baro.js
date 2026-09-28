/* TENNO.HUB · Baro Ki'Teer – Ankunft, Inventar mit Suche & Sortierung */
(function () {
const { L, esc, icon, ui, cd, ts, now, traderActive, fmtNum, norm, notif, items, itemName, imgUrl } = TH;
const $ = s => document.getElementById(s);
let sort = 'ducats', q = '', last = null, db = null;

function renderInv(inv) {
  const nq = norm(q);
  const rows = inv.map(x => ({ ...x, shown: itemName(x.item, db) }))
    .filter(x => !nq || norm(x.item + ' ' + x.shown).includes(nq))
    .sort((a, b) => sort === 'name' ? a.shown.localeCompare(b.shown) : (b[sort] || 0) - (a[sort] || 0));
  $('inv').innerHTML = rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr>
      <th><button type="button" data-sort="name">${esc(L('Item', 'Gegenstand'))}${sort === 'name' ? ' ▾' : ''}</button></th>
      <th class="num"><button type="button" data-sort="ducats">${esc(L('Ducats', 'Dukaten'))}${sort === 'ducats' ? ' ▾' : ''}</button></th>
      <th class="num"><button type="button" data-sort="credits">Credits${sort === 'credits' ? ' ▾' : ''}</button></th></tr></thead>
    <tbody>${rows.map(x => {
      const it = db?.byEn.get(String(x.item).toLowerCase());
      return `<tr><td><div class="flex">${it?.img ? `<img src="${imgUrl(it.img)}" alt="" width="32" height="32" loading="lazy" style="object-fit:contain">` : ''}<div><div style="font-weight:600">${esc(x.shown)}</div>${x.shown !== x.item ? `<div class="small dim">${esc(x.item)}</div>` : ''}</div></div></td>
        <td class="num ducat">${fmtNum(x.ducats)}</td><td class="num">${fmtNum(x.credits)}</td></tr>`;
    }).join('')}</tbody></table></div>`
    : ui.empty(L('No matches', 'Keine Treffer'));
}

async function render(d) {
  last = d;
  const b = d.voidTrader;
  if (!b) { $('hero').innerHTML = ui.empty(L('No data', 'Keine Daten')); return; }
  const on = traderActive(b);
  const bell = notif.cfg.on.baro;
  $('hero').innerHTML = `<div class="card card-accent glow-gold baro-hero">
    <div class="card-lbl" style="justify-content:center">${icon('coins')}${esc(on ? L('Baro is here · leaves in', 'Baro ist da · reist ab in') : L('Baro arrives in', 'Baro kommt in'))}</div>
    ${cd(on ? b.expiry : b.activation, 'long')}
    <div class="card-sub">${icon('pin')} ${esc(b.location || '')} · ${esc(TH.fmtTime(on ? b.expiry : b.activation))}</div>
    <div class="btn-row" style="justify-content:center;margin-top:16px">
      <button class="btn${bell ? ' btn-primary' : ''}" type="button" id="baroBell">${icon('bell')}${esc(bell ? L('Notification on', 'Benachrichtigung an') : L('Notify me on arrival', 'Bei Ankunft benachrichtigen'))}</button></div></div>`;
  $('invWrap').hidden = !on || !(b.inventory || []).length;
  if (on && b.inventory?.length) {
    if (!db) { try { db = await items(); } catch {} }
    $('invCount').textContent = `${b.inventory.length} ${L('items', 'Artikel')}`;
    renderInv(b.inventory);
  }
}

TH.page({
  id: 'baro', ws: true,
  init() {
    document.addEventListener('click', e => {
      const s = e.target.closest('[data-sort]');
      if (s) { sort = s.dataset.sort; if (last?.voidTrader) renderInv(last.voidTrader.inventory || []); }
      if (e.target.closest('#baroBell')) {
        notif.cfg.on.baro = !notif.cfg.on.baro; notif.save();
        if (notif.cfg.on.baro && notif.permission === 'default') notif.request();
        document.getElementById('notifDot').hidden = !notif.any();
        if (last) render(last);
      }
    });
    $('q').addEventListener('input', TH.debounce(e => { q = e.target.value; if (last?.voidTrader) renderInv(last.voidTrader.inventory || []); }, 120));
  },
  render,
  fail(e) { $('hero').innerHTML = ui.error(e); },
});
})();
