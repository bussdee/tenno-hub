/* TENNO.HUB · Kopfgelder (Ostron, Solaris United, Entrati, Zariman, Holdfasts …) */
(function () {
const { L, esc, icon, ui, cd, ts, now, fmtNum, norm } = TH;
const $ = s => document.getElementById(s);

const META = {
  'Ostrons':         { hub: 'Cetus', world: L('Plains of Eidolon', 'Ebenen von Eidolon'), color: '#ffb35c' },
  'Solaris United':  { hub: 'Fortuna', world: 'Orb Vallis', color: '#5cc8ff' },
  'Entrati':         { hub: 'Necralisk', world: L('Cambion Drift', 'Cambion-Drift'), color: '#c38bff' },
  'The Holdfasts':   { hub: 'Chrysalith', world: 'Zariman', color: '#f0d27a' },
  'Cavia':           { hub: 'Sanctum Anatomica', world: 'Albrecht', color: '#7fe0b0' },
  'The Hex':         { hub: 'Höllvania', world: '1999', color: '#ff7a9c' },
};
const meta = s => META[s.syndicateKey] || META[s.syndicate] || { hub: '', world: '', color: 'var(--gold)' };

let q = '';

function render(d) {
  const list = (d.syndicateMissions || []).filter(s => (s.jobs || []).length && ts(s.expiry) > now());
  if (!list.length) { $('list').innerHTML = ui.empty(L('No bounties available', 'Keine Kopfgelder verfügbar')); return; }
  const nq = norm(q);
  const html = list.map(s => {
    const m = meta(s);
    const jobs = s.jobs.filter(j => !nq || norm((j.rewardPool || []).join(' ') + ' ' + j.type).includes(nq));
    if (nq && !jobs.length) return '';
    return `<section class="card card-accent" style="--accent:${m.color}">
      <div class="card-hd"><div><div class="card-lbl">${esc(m.hub)} · ${esc(m.world)}</div><div class="card-title">${esc(s.syndicate)}</div></div>
        <div class="center"><div class="card-lbl">${esc(L('New bounties in', 'Neue Kopfgelder in'))}</div>${cd(s.expiry, 'long')}</div></div>
      ${jobs.map((j, i) => {
        const stand = (j.standingStages || []).reduce((a, b) => a + b, 0);
        const rewards = j.rewardPool || [];
        return `<details class="bounty-job"${nq ? ' open' : ''}>
          <summary>${icon('chevron')}<div class="grow"><div style="font-weight:600">${esc(j.type || L('Bounty', 'Kopfgeld'))}${j.isVault ? ` <span class="chip purple">Vault</span>` : ''}</div>
            <div class="small dim">Lv ${(j.enemyLevels || []).join('–')} · ${fmtNum(stand)} ${esc(L('Standing', 'Ansehen'))}${j.minMR ? ` · MR ${j.minMR}+` : ''}${j.timeBound ? ` · ${esc(j.timeBound === 'day' ? L('Day only', 'Nur tagsüber') : L('Night only', 'Nur nachts'))}` : ''}</div></div>
            <span class="chip">${rewards.length} ${esc(L('rewards', 'Belohnungen'))}</span></summary>
          <div class="bounty-rewards">${rewards.map(r => `<span class="chip${nq && norm(r).includes(nq) ? ' gold' : ''}">${esc(r)}</span>`).join('') || `<span class="dim small">${esc(L('Rewards unknown', 'Belohnungen unbekannt'))}</span>`}</div>
        </details>`;
      }).join('')}
    </section>`;
  }).join('');
  $('list').innerHTML = html || ui.empty(L('No bounty rewards match your search', 'Keine Belohnung passt zur Suche'));
}

let last = null;
TH.page({
  id: 'bounties', ws: true,
  init() { $('q').addEventListener('input', TH.debounce(e => { q = e.target.value.trim(); if (last) render(last); }, 150)); },
  render(d) { last = d; render(d); },
  fail(e) { $('list').innerHTML = ui.error(e); },
});
})();
