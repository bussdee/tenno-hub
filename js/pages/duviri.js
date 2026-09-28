/* TENNO.HUB · Duviri – Spiralstimmung und Circuit-Wochenauswahl */
(function () {
const { L, esc, icon, ui, cd, bar, ts, now, DUVIRI_MOODS, items, itemName, imgUrl } = TH;
const $ = s => document.getElementById(s);

async function choiceTiles(names) {
  let db = null;
  try { db = await items(); } catch {}
  return names.map(n => {
    const it = db?.byEn.get(String(n).toLowerCase()) || db?.byEn.get(`${n} prime`.toLowerCase());
    const shown = itemName(n, db);
    return `<div class="card item" style="padding:10px 12px">
      ${it?.img ? `<img class="item-img" src="${imgUrl(it.img)}" alt="" loading="lazy">` : `<div class="item-img ph">${icon('spiral')}</div>`}
      <div class="item-main"><div class="item-en">${esc(shown)}</div>${shown !== n ? `<div class="small dim">${esc(n)}</div>` : ''}</div>
      <a class="icon-btn sm" href="${TH.wikiUrl(n)}" target="_blank" rel="noopener" title="Wiki">${icon('external')}</a></div>`;
  }).join('');
}

async function render(d) {
  const du = d.duviriCycle;
  if (!du?.state) { $('mood').innerHTML = ui.empty(L('No Duviri data', 'Keine Duviri-Daten')); return; }
  const st = String(du.state).toLowerCase(), m = DUVIRI_MOODS[st] || { en: du.state, de: du.state };
  $('mood').innerHTML = `<div class="card card-accent cycle cyc-${st}" style="padding:24px">
    <div class="flex between wrap"><div><div class="card-lbl">${esc(L('Current spiral', 'Aktuelle Spirale'))}</div>
      <div class="cycle-state" style="font-size:34px;margin-top:8px">${icon('spiral')}${esc(L(m.en, m.de))}</div>
      <div class="cycle-tip mt">${esc(L(m.tipEn || '', m.tipDe || ''))}</div></div>
      <div class="center"><div class="card-lbl">${esc(L('Changes in', 'Wechsel in'))}</div><div style="font-size:26px;margin-top:6px">${cd(du.expiry)}</div></div></div>
    <div class="mt">${bar(du.activation || ts(du.expiry) - 2 * 3600e3, du.expiry)}</div>
    <div class="small dim mt">${esc(L('Order: Joy → Anger → Envy → Sorrow → Fear, every 2 hours.', 'Reihenfolge: Freude → Wut → Neid → Trauer → Angst, alle 2 Stunden.'))}</div></div>`;

  const cats = du.choices || [];
  const normal = cats.find(c => /normal|EXC_NORMAL/i.test(c.category || c.categoryKey))?.choices || [];
  const hard = cats.find(c => /hard|EXC_HARD/i.test(c.category || c.categoryKey))?.choices || [];
  $('circuit').innerHTML = `
    <div class="section-head"><h2>${icon('frame')}${esc(L('Circuit – Warframes this week', 'Circuit – Warframes dieser Woche'))}</h2>${cd(TH.nextWeekly(), 'long', false)}</div>
    <p class="muted">${esc(L('Normal Circuit: pick one of these frames and earn its component blueprints from reward tiers.', 'Normaler Circuit: Wähle einen dieser Frames und verdiene seine Bauteil-Blaupausen über die Belohnungsstufen.'))}</p>
    <div class="grid-auto sm">${normal.length ? await choiceTiles(normal) : ui.empty(L('No data', 'Keine Daten'))}</div>
    <div class="section-head mt-lg"><h2>${icon('steel')}${esc(L('Steel Path Circuit – Incarnon Genesis', 'Stahlpfad-Circuit – Incarnon Genesis'))}</h2></div>
    <p class="muted">${esc(L('Steel Path Circuit: choose one weapon and earn its Incarnon Genesis adapter.', 'Stahlpfad-Circuit: Wähle eine Waffe und verdiene ihren Incarnon-Genesis-Adapter.'))}</p>
    <div class="grid-auto sm">${hard.length ? await choiceTiles(hard) : ui.empty(L('No data', 'Keine Daten'))}</div>`;
}

TH.page({ id: 'duviri', ws: true, render, fail(e) { $('mood').innerHTML = ui.error(e); } });
})();
