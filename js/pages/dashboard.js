/* TENNO.HUB · Dashboard – alles Wichtige auf einen Blick */
(function () {
const { L, esc, icon, ui, cd, bar, ts, now, cycles, traderActive, rewardText, splitNode, fmtNum, fmtAgo, nextDaily, nextWeekly, TIER_ORDER, notif } = TH;
const $ = s => document.getElementById(s);

function missionLine(m, i) {
  return `<div class="mission"><span class="mission-n">${i + 1}</span><div class="grow">
    <div class="mission-t">${esc(m.missionType || m.type || '')}</div>
    <div class="mission-s">${esc(m.node || '')}</div>
    ${m.modifier ? `<div class="mission-m">${esc(m.modifier)}</div>` : ''}</div></div>`;
}

function renderHero(d) {
  const b = d.voidTrader, baroOn = traderActive(b);
  const fis = (d.fissures || []).filter(f => ts(f.expiry) > now());
  const nw = d.nightwave;
  $('heroStats').innerHTML = `
    <div class="stat"><div class="stat-lbl">${icon('clock')}${esc(L('Daily reset', 'Tages-Reset'))}</div><div class="stat-val">${cd(nextDaily(), 'short', false)}</div><div class="stat-sub">00:00 UTC</div></div>
    <div class="stat"><div class="stat-lbl">${icon('clock')}${esc(L('Weekly reset', 'Wochen-Reset'))}</div><div class="stat-val">${cd(nextWeekly(), 'long', false)}</div><div class="stat-sub">${esc(L('Monday 00:00 UTC', 'Montag 00:00 UTC'))}</div></div>
    <a class="stat" href="baro.html"><div class="stat-lbl">${icon('coins')}Baro Ki'Teer</div>
      <div class="stat-val">${b ? cd(baroOn ? b.expiry : b.activation, 'long') : '—'}</div>
      <div class="stat-sub">${b ? esc(baroOn ? L(`Here · ${b.location}`, `Da · ${b.location}`) : L(`Arrives · ${b.location}`, `Kommt · ${b.location}`)) : ''}</div></a>
    <a class="stat" href="fissures.html"><div class="stat-lbl">${icon('fissure')}${esc(L('Fissures', 'Fissuren'))}</div>
      <div class="stat-val">${fis.filter(f => !f.isStorm).length}</div>
      <div class="stat-sub">${fis.filter(f => f.isHard).length} ${esc(L('Steel Path', 'Stahlpfad'))} · ${fis.filter(f => f.isStorm).length} Storm</div></a>
    ${nw ? `<a class="stat" href="nightwave.html"><div class="stat-lbl">${icon('radar')}Nightwave</div>
      <div class="stat-val">${(nw.activeChallenges || []).filter(c => ts(c.expiry) > now()).length}</div>
      <div class="stat-sub">${esc(L('active challenges', 'aktive Aufgaben'))}</div></a>` : ''}`;
}

function renderCycles(d) {
  const list = cycles(d);
  if (!list.length) { $('cycles').innerHTML = ui.empty(L('No cycle data', 'Keine Zyklus-Daten')); return; }
  $('cycles').innerHTML = list.map(c => {
    const key = c.nextKey ? `${c.id}_${c.nextKey}` : '';
    const on = key && notif.cfg.on[key];
    return `<div class="card card-accent cycle ${c.cls}">
      <div class="cycle-top"><div class="card-lbl">${esc(c.name)}</div>
        ${key ? `<button class="bell-mini${on ? ' on' : ''}" type="button" data-bell="${key}" title="${esc(L(`Notify before ${c.nextLabel}`, `Vor ${c.nextLabel} benachrichtigen`))}" aria-pressed="${!!on}">${icon('bell')}</button>` : ''}</div>
      <div class="cycle-state">${icon(c.icon)}${esc(c.stateLabel)}</div>
      ${cd(c.expiry)}
      ${bar(c.activation, c.expiry)}
      ${c.nextLabel ? `<div class="cycle-next">${esc(L('Next', 'Danach'))}: ${esc(c.nextLabel)} · ${esc(c.loc)}</div>` : `<div class="cycle-next">${esc(c.loc)}</div>`}
      <div class="cycle-tip">${esc(c.tip)}</div>
    </div>`;
  }).join('');
}

function renderRotations(d) {
  const s = d.sortie, a = d.archonHunt, sp = d.steelPath, arb = d.arbitration, deal = (d.dailyDeals || [])[0];
  const cards = [];
  if (s?.variants?.length) cards.push(`<a class="card hover card-accent" href="sortie.html" style="--accent:var(--gold)">
      <div class="card-hd"><div class="card-lbl">${icon('bolt')}${esc(L('Daily Sortie', 'Tägliche Sortie'))}</div>${cd(s.expiry, 'long')}</div>
      <div class="card-title">${esc(s.boss || '')}</div><div class="card-sub">${esc(s.faction || '')}</div>
      <div class="mission-list">${s.variants.map((v, i) => missionLine(v, i)).join('')}</div></a>`);
  if (a?.missions?.length) cards.push(`<a class="card hover card-accent" href="archon.html" style="--accent:var(--narmer)">
      <div class="card-hd"><div class="card-lbl">${icon('crown')}${esc(L('Archon Hunt', 'Archon-Jagd'))}</div>${cd(a.expiry, 'long')}</div>
      <div class="card-title">${esc(a.boss || '')}</div><div class="card-sub">${esc(a.faction || '')}</div>
      <div class="mission-list">${a.missions.map((m, i) => missionLine(m, i)).join('')}</div></a>`);
  const side = [];
  if (sp?.currentReward) side.push(`<div class="card card-accent" style="--accent:var(--bad)">
      <div class="card-hd"><div class="card-lbl">${icon('steel')}${esc(L("Teshin's weekly offer", 'Teshins Wochenangebot'))}</div>${sp.expiry ? cd(sp.expiry, 'long') : ''}</div>
      <div class="card-title">${esc(sp.currentReward.name || '—')}</div>
      <div class="card-sub">${sp.currentReward.cost ? `${fmtNum(sp.currentReward.cost)} ${esc(L('Steel Essence', 'Stahlessenz'))}` : ''}</div>
      ${sp.incursions?.expiry ? `<div class="card-sub mt">${esc(L('Steel Path incursions reset in', 'Stahlpfad-Invasionen erneuern sich in'))} ${cd(sp.incursions.expiry, 'long')}</div>` : ''}</div>`);
  if (arb?.node && !arb.expired && ts(arb.expiry) > now() && ts(arb.expiry) - now() < 2 * 3600e3) side.push(`<div class="card card-accent" style="--accent:var(--void)">
      <div class="card-hd"><div class="card-lbl">${icon('target')}${esc(L('Arbitration', 'Schiedsgericht'))}</div>${cd(arb.expiry)}</div>
      <div class="card-title">${esc(arb.type || '')}</div><div class="card-sub">${esc(arb.node)} · ${esc(arb.enemy || '')}</div></div>`);
  if (deal && ts(deal.expiry) > now()) side.push(`<div class="card card-accent" style="--accent:var(--purple)">
      <div class="card-hd"><div class="card-lbl">${icon('gift')}${esc(L("Darvo's deal", 'Darvos Angebot'))}</div>${cd(deal.expiry)}</div>
      <div class="card-title">${esc(deal.item)}</div>
      <div class="card-sub"><span class="gold">${deal.salePrice} Platin</span> <s class="dim">${deal.originalPrice}</s> · −${deal.discount}% · ${deal.total ? `${deal.total - (deal.sold || 0)}/${deal.total} ${esc(L('left', 'übrig'))}` : ''}</div></div>`);
  $('rotations').innerHTML = cards.join('') + (side.length ? `<div class="grid">${side.join('')}</div>` : '') || ui.empty(L('No rotation data', 'Keine Rotationsdaten'));
}

function renderFissureSummary(d) {
  const fis = (d.fissures || []).filter(f => ts(f.expiry) > now());
  const tiers = Object.keys(TIER_ORDER);
  $('fisSummary').innerHTML = `<div class="grid-auto sm">${tiers.map(t => {
    const n = fis.filter(f => f.tier === t && !f.isHard && !f.isStorm).length, sp = fis.filter(f => f.tier === t && f.isHard).length, st = fis.filter(f => f.tier === t && f.isStorm).length;
    if (!n && !sp && !st) return '';
    const soon = fis.filter(f => f.tier === t).sort((a, b) => ts(a.expiry) - ts(b.expiry))[0];
    return `<a class="card hover card-accent t-${t}" style="--accent:var(--tc)" href="fissures.html#${t}">
      <div class="card-hd"><span class="tier">${t}</span><span class="dim small">${esc(L('next ends', 'nächste endet'))} ${cd(soon.expiry)}</span></div>
      <div class="flex wrap"><span class="chip">${n} ${esc(L('normal', 'normal'))}</span>${sp ? `<span class="chip steel">${sp} SP</span>` : ''}${st ? `<span class="chip void">${st} Storm</span>` : ''}</div></a>`;
  }).join('')}</div>`;
}

function renderAlertsEvents(d) {
  const alerts = (d.alerts || []).filter(a => ts(a.expiry) > now());
  const events = (d.events || []).filter(e => !e.expiry || ts(e.expiry) > now());
  const out = [];
  for (const a of alerts) out.push(`<div class="card card-accent" style="--accent:var(--warn)">
    <div class="card-hd"><div class="card-lbl">${icon('alert')}${esc(L('Alert', 'Alarm'))}</div>${cd(a.expiry)}</div>
    <div class="card-title" style="font-size:18px">${esc(rewardText(a.mission?.reward) || '—')}</div>
    <div class="card-sub">${esc(a.mission?.type || '')} · ${esc(a.mission?.node || '')}${a.mission?.minEnemyLevel ? ` · Lv ${a.mission.minEnemyLevel}–${a.mission.maxEnemyLevel}` : ''}</div></div>`);
  for (const e of events) {
    const prog = e.maximumScore ? Math.min(100, (e.currentScore || 0) / e.maximumScore * 100) : (typeof e.health === 'number' ? 100 - e.health : null);
    out.push(`<div class="card card-accent" style="--accent:var(--purple)">
      <div class="card-hd"><div class="card-lbl">${icon('star')}${esc(L('Event', 'Event'))}</div>${e.expiry ? cd(e.expiry, 'long') : ''}</div>
      <div class="card-title" style="font-size:18px">${esc(e.description || e.tooltip || 'Event')}</div>
      ${e.node ? `<div class="card-sub">${esc(e.node)}</div>` : ''}
      ${prog != null ? `<div class="progress mt"><i style="width:${prog.toFixed(1)}%"></i></div><div class="card-sub">${prog.toFixed(1)}%</div>` : ''}
      ${(e.rewards || []).length ? `<div class="tags mt">${e.rewards.map(r => rewardText(r)).filter(Boolean).slice(0, 6).map(r => `<span class="chip gold">${esc(r)}</span>`).join('')}</div>` : ''}</div>`);
  }
  $('alertsWrap').hidden = !out.length;
  $('alerts').innerHTML = out.join('');
}

function renderNews(d) {
  const lang = TH.state.lang;
  const news = (d.news || []).filter(n => n.link && !n.mobileOnly)
    .map(n => ({ ...n, msg: (n.translations && n.translations[lang]) || n.message }))
    .filter(n => n.msg).sort((a, b) => TH.ts(b.date) - TH.ts(a.date)).slice(0, 6);
  $('newsWrap').hidden = !news.length;
  $('news').innerHTML = news.map(n => `<a class="card hover" href="${esc(n.link)}" target="_blank" rel="noopener" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
    ${n.imageLink ? `<img src="${esc(n.imageLink)}" alt="" loading="lazy" style="width:100%;aspect-ratio:16/7;object-fit:cover;background:var(--surface-2)" onerror="this.remove()">` : ''}
    <div style="padding:14px 16px"><div class="flex wrap" style="gap:6px;margin-bottom:6px">${n.update ? '<span class="chip gold">Update</span>' : ''}${n.primeAccess ? '<span class="chip purple">Prime Access</span>' : ''}${n.stream ? '<span class="chip void">Stream</span>' : ''}<span class="dim small">${esc(fmtAgo(n.date))}</span></div>
    <div style="font-weight:600">${esc(n.msg)}</div></div></a>`).join('');
}

TH.page({
  id: 'dashboard', ws: true,
  init() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-bell]');
      if (!b) return;
      e.preventDefault();
      const k = b.dataset.bell;
      notif.cfg.on[k] = !notif.cfg.on[k];
      notif.save();
      b.classList.toggle('on', notif.cfg.on[k]);
      b.setAttribute('aria-pressed', String(!!notif.cfg.on[k]));
      document.getElementById('notifDot').hidden = !notif.any();
      TH.toast(notif.cfg.on[k] ? L('Notification on', 'Benachrichtigung an') : L('Notification off', 'Benachrichtigung aus'));
      if (notif.cfg.on[k] && notif.permission === 'default') notif.request();
    });
  },
  render(d) {
    for (const fn of [renderHero, renderCycles, renderRotations, renderFissureSummary, renderAlertsEvents, renderNews]) {
      try { fn(d); } catch (e) { console.error(fn.name, e); }
    }
    $('updated').textContent = L(`Updated ${fmtAgo(TH.ws.at)}`, `Aktualisiert ${fmtAgo(TH.ws.at)}`);
  },
  fail(e) {
    ['cycles', 'rotations'].forEach(id => { $(id).innerHTML = ui.error(e); });
    $('heroStats').innerHTML = '';
  },
  refresh() {},
});
})();
