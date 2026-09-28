/* TENNO.HUB · Tägliche & wöchentliche Checkliste – mit Live-Infos, automatischem Reset */
(function () {
const { L, esc, icon, ui, store, cd, ts, now, nextDaily, nextWeekly, utcDay, utcWeek, fmtNum, rewardText } = TH;
const $ = s => document.getElementById(s);

const TASKS = {
  daily: [
    { id: 'login', ic: 'gift', en: 'Claim daily login reward', de: 'Tägliche Login-Belohnung abholen', sub: ['Platinum discounts, boosters and Forma possible.', 'Platin-Rabatte, Booster und Forma möglich.'] },
    { id: 'sortie', ic: 'bolt', en: 'Complete the Sortie', de: 'Sortie abschließen', sub: ['3 missions · random reward (Riven, Exilus, Legendary Core …) · MR 4', '3 Missionen · Zufallsbelohnung (Riven, Exilus, Legendärer Kern …) · MR 4'],
      live: d => d.sortie?.boss ? L(`${d.sortie.boss} · ${d.sortie.faction}`, `${d.sortie.boss} · ${d.sortie.faction}`) : '' },
    { id: 'nwdaily', ic: 'radar', en: 'Nightwave daily challenges', de: 'Nightwave-Tagesaufgaben', sub: ['1,000 standing each', 'Je 1.000 Ansehen'],
      live: d => { const n = (d.nightwave?.activeChallenges || []).filter(c => c.isDaily && ts(c.expiry) > now()); return n.length ? L(`${n.length} active: ${n.map(c => c.title).join(', ')}`, `${n.length} aktiv: ${n.map(c => c.title).join(', ')}`) : ''; } },
    { id: 'standing', ic: 'trophy', en: 'Reach your syndicate standing cap', de: 'Syndikats-Tageslimit an Ansehen erreichen', sub: ['Wear the syndicate sigil · open-world syndicates each have their own cap', 'Syndikats-Sigil tragen · Open-World-Syndikate haben jeweils eigene Limits'], calc: true },
    { id: 'incursions', ic: 'steel', en: 'Steel Path incursions', de: 'Stahlpfad-Invasionen (Incursions)', sub: ['5 marked Steel Path nodes · 5 Steel Essence each', '5 markierte Stahlpfad-Knoten · je 5 Stahlessenz'] },
    { id: 'simaris', ic: 'target', en: 'Simaris synthesis target', de: 'Simaris-Synthese-Ziel', sub: ['Standing for Simaris offerings (Relay)', 'Ansehen für Simaris-Angebote (Relais)'] },
    { id: 'darvo', ic: 'coins', en: "Check Darvo's daily deal", de: 'Darvos Tagesangebot prüfen', sub: ['Discounted item in the Market', 'Reduzierter Artikel im Markt'],
      live: d => { const x = (d.dailyDeals || [])[0]; return x ? `${x.item} · ${x.salePrice} Platin (−${x.discount}%)` : ''; } },
    { id: 'invasions', ic: 'swords', en: 'Check invasions (Reactor, Catalyst, Forma …)', de: 'Invasionen prüfen (Reaktor, Katalysator, Forma …)', sub: ['Also Fieldron, Detonite, Mutagen for clan research', 'Auch Fieldron, Detonit, Mutagen für Clan-Forschung'],
      live: d => { const hot = (d.invasions || []).filter(i => !i.completed && /reactor|catalyst|reaktor|katalysator|forma|wraith|vandal/i.test([i.attacker?.reward, i.defender?.reward].map(rewardText).join(' '))); return hot.length ? L(`${hot.length} valuable invasion(s) active!`, `${hot.length} wertvolle Invasion(en) aktiv!`) : ''; } },
  ],
  weekly: [
    { id: 'archon', ic: 'crown', en: 'Archon Hunt', de: 'Archon-Jagd', sub: ['Archon Shard · Steel Path: 2', 'Archon-Scherbe · Stahlpfad: 2'], live: d => d.archonHunt?.boss || '' },
    { id: 'nwweekly', ic: 'radar', en: 'Nightwave weekly & elite challenges', de: 'Nightwave Wochen- & Elite-Aufgaben', sub: ['Weekly 4,500 · Elite 7,000 standing', 'Wöchentlich 4.500 · Elite 7.000 Ansehen'] },
    { id: 'circuit', ic: 'spiral', en: 'The Circuit (normal + Steel Path)', de: 'Der Circuit (normal + Stahlpfad)', sub: ['Warframe parts and Incarnon Genesis', 'Warframe-Teile und Incarnon Genesis'],
      live: d => { const h = (d.duviriCycle?.choices || []).find(c => /hard/i.test(c.category || c.categoryKey)); return h ? `SP: ${h.choices.join(', ')}` : ''; } },
    { id: 'netracells', ic: 'target', en: 'Netracells (5×)', de: 'Netrazellen (5×)', sub: ['Albrecht’s Laboratories · Archon Shards and Arcanes', 'Albrechts Laboratorien · Archon-Scherben und Arcanes'] },
    { id: 'archimedea', ic: 'shield', en: 'Deep / Temporal Archimedea', de: 'Deep / Temporal Archimedea', sub: ['High-level challenge with modifiers', 'Schwere Herausforderung mit Modifikatoren'] },
    { id: 'kahl', ic: 'swords', en: "Kahl's Garrison mission", de: 'Kahls Garnison-Mission', sub: ['Stock for Chipper (Drifter camp)', 'Vorrat für Chipper (Drifter-Lager)'] },
    { id: 'maroo', ic: 'star', en: "Maroo's Ayatan treasure hunt", de: 'Maroos Ayatan-Schatzsuche', sub: ['Maroo’s Bazaar (Mars) · guaranteed Ayatan Sculpture', 'Maroos Basar (Mars) · garantierte Ayatan-Skulptur'] },
    { id: 'clem', ic: 'skull', en: 'Help Clem', de: 'Clem helfen', sub: ['Weekly Clem mission from your inbox', 'Wöchentliche Clem-Mission aus deinem Posteingang'] },
    { id: 'palladino', ic: 'coins', en: 'Palladino: Riven Slivers trade', de: 'Palladino: Riven-Splitter-Tausch', sub: ['Iron Wake (Earth)', 'Iron Wake (Erde)'] },
    { id: 'teshin', ic: 'steel', en: "Teshin's weekly offer", de: 'Teshins Wochenangebot', sub: ['Steel Path Honors rotation', 'Stahlpfad-Ehren-Rotation'], live: d => d.steelPath?.currentReward ? `${d.steelPath.currentReward.name} · ${d.steelPath.currentReward.cost} ${L('Steel Essence', 'Stahlessenz')}` : '' },
  ],
};

function state() {
  const s = store.get('checklist', { day: '', week: '', d: [], w: [] });
  if (s.day !== utcDay()) { s.day = utcDay(); s.d = []; }
  if (s.week !== utcWeek()) { s.week = utcWeek(); s.w = []; }
  return s;
}
let S = state(), last = null;
let hidden = new Set(store.get('checklist_hidden', []));
let editing = false;

function list(kind, d) {
  const done = kind === 'daily' ? S.d : S.w;
  return TASKS[kind].filter(t => editing || !hidden.has(t.id)).map(t => {
    const on = done.includes(t.id), live = d && t.live ? t.live(d) : '';
    return `<label class="card task${on ? ' done' : ''}${hidden.has(t.id) ? ' dim' : ''}">
      ${editing ? `<input type="checkbox" class="check" data-hide="${t.id}" ${!hidden.has(t.id) ? 'checked' : ''} title="${esc(L('Show on list', 'Auf Liste zeigen'))}">`
                : `<input type="checkbox" class="check" data-task="${kind}:${t.id}" ${on ? 'checked' : ''}>`}
      <div class="grow"><div class="task-t">${icon(t.ic)} ${esc(L(t.en, t.de))}</div><div class="task-s">${esc(L(...t.sub))}</div>
      ${live ? `<div class="task-live">${icon('info')} ${esc(live)}</div>` : ''}
      ${t.calc ? `<div class="task-live">${esc(L('Your cap', 'Dein Limit'))}: <strong>${fmtNum(16000 + 500 * (+store.get('mr', 10) || 0))}</strong> (MR ${store.get('mr', 10)}) · ${esc(L('formula', 'Formel'))} 16.000 + 500 × MR</div>` : ''}</div></label>`;
  }).join('');
}

function render(d) {
  if (d) last = d;
  S = state();
  const vis = k => TASKS[k].filter(t => !hidden.has(t.id));
  const dd = vis('daily').filter(t => S.d.includes(t.id)).length, wd = vis('weekly').filter(t => S.w.includes(t.id)).length;
  $('stats').innerHTML = `
    <div class="stat"><div class="stat-lbl">${icon('sun')}${esc(L('Today', 'Heute'))}</div><div class="stat-val">${dd} / ${vis('daily').length}</div><div class="progress mt"><i style="width:${vis('daily').length ? dd / vis('daily').length * 100 : 0}%"></i></div></div>
    <div class="stat"><div class="stat-lbl">${icon('clock')}${esc(L('Daily reset', 'Tages-Reset'))}</div><div class="stat-val">${cd(nextDaily(), 'short', false)}</div></div>
    <div class="stat"><div class="stat-lbl">${icon('check')}${esc(L('This week', 'Diese Woche'))}</div><div class="stat-val">${wd} / ${vis('weekly').length}</div><div class="progress mt"><i style="width:${vis('weekly').length ? wd / vis('weekly').length * 100 : 0}%"></i></div></div>
    <div class="stat"><div class="stat-lbl">${icon('clock')}${esc(L('Weekly reset', 'Wochen-Reset'))}</div><div class="stat-val">${cd(nextWeekly(), 'long', false)}</div></div>`;
  $('daily').innerHTML = list('daily', last);
  $('weekly').innerHTML = list('weekly', last);
  $('edit').innerHTML = `${icon(editing ? 'check' : 'settings')}${esc(editing ? L('Done', 'Fertig') : L('Customize', 'Anpassen'))}`;
  $('editHint').hidden = !editing;
}

TH.page({
  id: 'daily', ws: true,
  init() {
    $('mr').value = store.get('mr', 10);
    $('mr').addEventListener('input', e => { store.set('mr', Math.max(0, Math.min(40, +e.target.value || 0))); render(); });
    $('edit').addEventListener('click', () => { editing = !editing; render(); });
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.task) {
        const [k, id] = t.dataset.task.split(':'); const arr = k === 'daily' ? S.d : S.w;
        t.checked ? arr.push(id) : arr.splice(arr.indexOf(id), 1);
        store.set('checklist', S); render();
      } else if (t.dataset.hide) {
        t.checked ? hidden.delete(t.dataset.hide) : hidden.add(t.dataset.hide);
        store.set('checklist_hidden', [...hidden]); render();
      }
    });
    /* Reset um Mitternacht UTC auch bei offener Seite */
    let day = utcDay();
    TH.tickHooks.add(() => { if (utcDay() !== day) { day = utcDay(); render(); } });
    render();
  },
  render,
});
})();
