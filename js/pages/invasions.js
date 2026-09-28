/* TENNO.HUB · Invasionen – beide Seiten, Fortschritt, wertvolle Belohnungen hervorgehoben */
(function () {
const { L, esc, icon, ui, rewardText, norm, store } = TH;
const $ = s => document.getElementById(s);
const HOT = /reactor|catalyst|reaktor|katalysator|forma|wraith|vandal|exilus|orokin/i;
let onlyHot = store.get('inv_hot', false);
let last = null;

const facCls = f => 'fac fac-' + norm(f).replace(/\s+/g, '-');
const facColor = f => ({ grineer: 'var(--grineer)', corpus: 'var(--corpus)', infested: 'var(--infested)', infestation: 'var(--infested)', corrupted: 'var(--corrupted)' })[norm(f)] || 'var(--text-3)';

function side(inv, which) {
  /* neue API: inv.attacker = {faction, reward}; alte API: attackingFaction / attackerReward */
  const o = inv[which] || {};
  const faction = o.faction || inv[which === 'attacker' ? 'attackingFaction' : 'defendingFaction'] || '?';
  const factionKey = o.factionKey || faction;
  const reward = rewardText(o.reward || inv[which === 'attacker' ? 'attackerReward' : 'defenderReward']);
  return { faction, factionKey, reward };
}

function render(d) {
  last = d;
  const all = (d.invasions || []).filter(i => !i.completed);
  const list = all.map(inv => ({ inv, a: side(inv, 'attacker'), b: side(inv, 'defender') }))
    .filter(x => !onlyHot || HOT.test(x.a.reward + ' ' + x.b.reward))
    .sort((x, y) => Number(HOT.test(y.a.reward + y.b.reward)) - Number(HOT.test(x.a.reward + x.b.reward)));
  $('count').textContent = `${all.length} ${L('active', 'aktiv')}`;
  $('hot').setAttribute('aria-pressed', String(onlyHot));
  if (!list.length) { $('list').innerHTML = ui.empty(onlyHot ? L('No valuable invasions right now', 'Gerade keine wertvollen Invasionen') : L('No active invasions', 'Keine aktiven Invasionen')); return; }
  $('list').innerHTML = list.map(({ inv, a, b }) => {
    const p = Math.max(0, Math.min(100, Number(inv.completion) || 50));
    const infested = inv.vsInfestation || /infest/i.test(b.factionKey + a.factionKey);
    const rew = (s, r) => s.reward ? `<div class="inv-reward${HOT.test(s.reward) ? ' hot' : ''}">${esc(s.reward)}</div>` : `<div class="inv-reward dim">${esc(infested && r ? '—' : L('Credits only', 'Nur Credits'))}</div>`;
    return `<div class="card inv">
      <div class="flex between wrap"><div><div style="font-weight:700">${icon('pin')} ${esc(inv.node)}</div><div class="small dim">${esc(inv.desc || '')}</div></div>
        ${inv.eta && !/infinity|-/i.test(inv.eta) ? `<span class="chip">${icon('clock')}${esc(inv.eta)}</span>` : ''}</div>
      <div class="inv-sides">
        <div class="inv-side"><div class="${facCls(a.factionKey)}">${esc(a.faction)}</div>${rew(a)}</div>
        <div class="inv-vs">VS</div>
        <div class="inv-side r"><div class="${facCls(b.factionKey)}">${esc(b.faction)}</div>${rew(b, true)}</div>
      </div>
      <div><div class="inv-bar"><i style="width:${p}%;background:${facColor(a.factionKey)}"></i><i style="width:${100 - p}%;background:${facColor(b.factionKey)}"></i></div>
        <div class="flex between small dim mt" style="margin-top:6px"><span>${p.toFixed(1)}%</span><span>${esc(L(`${inv.requiredRuns || 3} runs needed per side`, `${inv.requiredRuns || 3} Runs pro Seite nötig`))}</span><span>${(100 - p).toFixed(1)}%</span></div></div>
    </div>`;
  }).join('');
}

TH.page({
  id: 'invasions', ws: true,
  init() {
    $('hot').addEventListener('click', () => { onlyHot = !onlyHot; store.set('inv_hot', onlyHot); if (last) render(last); });
  },
  render,
  fail(e) { $('list').innerHTML = ui.error(e); },
});
})();
