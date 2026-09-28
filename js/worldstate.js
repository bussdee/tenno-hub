/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, worldstate.js  (v4 – all bugs fixed)
   Cycles, Fissures, Sortie, Nightwave, Invasions, Baro,
   Arb, Alerts, Archon, Steel Path Acolyte
═══════════════════════════════════════════════════════════════ */

const TIER_ORD = { Lith:1, Meso:2, Neo:3, Axi:4, Requiem:5, Omnia:6 };

/* ═══ CYCLES ═══════════════════════════════════════════════════ */
async function loadCycles() {
  try {
    const [cetus, vallis, cambion, earth, zariman] = await Promise.all([
      apiFetch('cetusCycle'), apiFetch('vallisCycle'),
      apiFetch('cambionCycle'), apiFetch('earthCycle'),
      apiFetch('zarimanCycle').catch(()=>null),
    ]);
    APP.cache.cycles = {cetus, vallis, cambion, earth, zariman};
    renderCycles();
  } catch(e) {
    document.getElementById('cycleGrid').innerHTML = errHTML(e);
  }
}

function buildCycleList() {
  const {cetus, vallis, cambion, earth, zariman} = APP.cache.cycles;
  // API liefert cambionCycle.state ('vome'|'fass'); 'active' ist nur ein Legacy-Feld
  const isVome = (cambion.state || cambion.active) === 'vome';
  const list = [
    { id:'cetus', loc:'PLAINS OF EIDOLON',
      state:cetus.isDay?'Day':'Night', cls:cetus.isDay?'day':'night',
      expiry:cetus.expiry, next:cetus.isDay?'Night':'Day',
      ntKey:cetus.isDay?'cetus_night':'cetus_day', total:cetus.isDay?6000000:3000000,
      tip: APP.lang==='de'
        ? (cetus.isDay?'Tag: Bounties, Gara, Mining, Angeln':'Nacht: Eidolons jagen! Teralyst → Gantulyst → Hydrolyst')
        : (cetus.isDay?'Day: Bounties, Gara, Mining, Fishing':'Night: Hunt Eidolons! Teralyst → Gantulyst → Hydrolyst') },
    { id:'vallis', loc:'ORB VALLIS',
      state:vallis.isWarm?'Warm':'Cold', cls:vallis.isWarm?'warm':'cold',
      expiry:vallis.expiry, next:vallis.isWarm?'Cold':'Warm',
      ntKey:vallis.isWarm?'vallis_cold':'vallis_warm', total:vallis.isWarm?400000:1200000,
      tip: APP.lang==='de'
        ? (vallis.isWarm?'Warm: Profit-Taker, Index, Angeln (Hotpoint)':'Kalt: Thermia-Frakturen, Exploiter Orb')
        : (vallis.isWarm?'Warm: Profit-Taker, Index, Fishing (Hotpoint)':'Cold: Thermia Fractures, Exploiter Orb') },
    { id:'cambion', loc:'CAMBION DRIFT (DEIMOS)',
      state:isVome?'Vome':'Fass', cls:isVome?'vome':'fass',
      expiry:cambion.expiry, next:isVome?'Fass':'Vome',
      ntKey:isVome?'deimos_fass':'deimos_vome', total:isVome?3000000:6000000,
      tip: APP.lang==='de'
        ? (isVome?'Vome: Fischen, Ressourcen sammeln':'Fass: Necramech-Farming, Vault-Runs')
        : (isVome?'Vome: Fishing, Resource gathering':'Fass: Necramech farming, Vault runs') },
    { id:'earth', loc:'EARTH',
      state:earth.isDay?'Day':'Night', cls:earth.isDay?'day':'night',
      expiry:earth.expiry, next:earth.isDay?'Night':'Day',
      ntKey:null, total:14400000,
      tip: APP.lang==='de'
        ? (earth.isDay?'Tag: Oro, Argon':'Nacht: Sentient-Außenposten')
        : (earth.isDay?'Day: Oro, Argon':'Night: Sentient Outposts') },
  ];
  if (zariman) {
    list.push({ id:'zariman', loc:'ZARIMAN TEN-ZERO',
      state:zariman.isCorpus?'Corpus':'Grineer', cls:zariman.isCorpus?'warm':'cold',
      expiry:zariman.expiry, next:zariman.isCorpus?'Grineer':'Corpus',
      ntKey:null, total:9000000,
      tip: APP.lang==='de'
        ? 'Fraktions-Kontrollphase auf dem Zariman. Beeinflusst welche Fraktion in Missionen vorherrscht.'
        : 'Faction control phase on the Zariman. Affects which faction dominates missions.' });
  }
  return list;
}

function renderCycles() {
  const cycles = buildCycleList();
  document.getElementById('cycleGrid').innerHTML = cycles.map(c => {
    const ms   = until(c.expiry);
    const pct  = Math.max(0, Math.min(100, (ms / c.total) * 100)).toFixed(1);
    const ntOn = APP.notifs[c.ntKey];
    return `<div class="cycle-card ${c.cls}" id="cc-${c.id}">
      <div class="cycle-location">${c.loc}</div>
      <div class="cycle-state-row">
        <span class="cycle-icon">${CYCLE_ICON[c.state]||''}</span>
        <span class="cycle-state">${tC(c.state)}</span>
      </div>
      <div class="cycle-next">${APP.lang==='de'?'Nächste Phase:':'Next:'} ${tC(c.next)}</div>
      <div class="cycle-timer" id="ct-${c.id}">${fmtMs(ms,true)}</div>
      <div class="cycle-bar">
        <span class="cycle-bar-label">${APP.lang==='de'?'verbleibend':'remaining'}</span>
        <div class="cycle-bar-track"><div class="cycle-bar-fill" id="cp-${c.id}" style="width:${pct}%"></div></div>
        <span class="cycle-bar-pct">${pct}%</span>
      </div>
      <div class="cycle-tip">${c.tip}</div>
      ${c.ntKey ? `<button class="notif-micro ${ntOn?'on':''}" id="cntb-${c.ntKey}"
        onclick="quickNt('${c.ntKey}',this)">${ntOn?'🔔':'🔕'} ${APP.lang==='de'?'Alarm':'Alert'}</button>` : ''}
    </div>`;
  }).join('');
  startCycleTimer(cycles);
}

function startCycleTimer(cycles) {
  if (APP.timers.cycles) clearInterval(APP.timers.cycles);
  APP.timers.cycles = setInterval(() => {
    let reload = false;
    cycles.forEach(c => {
      const el = document.getElementById(`ct-${c.id}`);
      const pe = document.getElementById(`cp-${c.id}`);
      if (!el) { reload = true; return; }
      const ms = until(c.expiry);
      if (ms <= 0) {
        reload = true;
        if (c.ntKey && APP.notifs[c.ntKey])
          notifyOnce(`${c.ntKey}_${c.expiry}`, c.loc, `${tC(c.next)} ${APP.lang==='de'?'hat begonnen':'has started'}`);
        return;
      }
      el.textContent = fmtMs(ms, true);
      if (pe) pe.style.width = Math.max(0, (ms / c.total) * 100).toFixed(2) + '%';
    });
    if (reload) { clearInterval(APP.timers.cycles); reloadSoon('cycles', loadCycles); }
  }, 1000);
}

/* ═══ WEEKLY RESET COUNTDOWN ═══════════════════════════════════ */
function renderWeeklyReset() {
  const el = document.getElementById('weeklyResetTimer');
  if (!el) return;
  const ms = nextWeeklyReset() - Date.now();
  el.textContent = fmtMsLong(ms);
  if (APP.timers.weeklyReset) clearInterval(APP.timers.weeklyReset);
  APP.timers.weeklyReset = setInterval(() => {
    const e2 = document.getElementById('weeklyResetTimer');
    if (!e2) { clearInterval(APP.timers.weeklyReset); return; }
    const rem = nextWeeklyReset() - Date.now();
    e2.textContent = fmtMsLong(Math.max(0, rem));
  }, 1000);
}

/* ═══ ARBITRATION ═══════════════════════════════════════════════ */
async function loadArbitration() {
  try {
    const d = await apiFetch('arbitration');
    APP.cache.arb = d;
    renderArbitration();
  } catch(e) {
    const el = document.getElementById('arbContainer');
    if (el) el.innerHTML = errHTML(e);
  }
}

const ARB_BONUS = {
  Grineer:    { icon:'🎯', en:'Grineer enemies · Warframe buff vs Grineer active',      de:'Gegner: Grineer · Warframe-Buff gegen Grineer aktiv' },
  Corpus:     { icon:'🎯', en:'Corpus enemies · Warframe buff vs Corpus active',         de:'Gegner: Corpus · Warframe-Buff gegen Corpus aktiv' },
  Infestation:{ icon:'🎯', en:'Infested enemies · Warframe buff vs Infested active',     de:'Gegner: Infizierte · Warframe-Buff aktiv' },
  Corrupted:  { icon:'🎯', en:'Corrupted enemies · Warframe buff vs Corrupted active',   de:'Gegner: Korrumpierte · Warframe-Buff aktiv' },
};

function renderArbitration() {
  const a  = APP.cache.arb;
  const el = document.getElementById('arbContainer');
  // Manche Worldstate-Antworten liefern einen Platzhalter-Datensatz
  // (node:"SolNode000", expired:true, expiry weit in der Zukunft) statt
  // einfach leer zu sein - das als "keine Daten" behandeln, nicht rendern.
  if (!a?.node || a.expired || a.type === 'Unknown') { if (el) el.innerHTML = emptyHTML(APP.lang==='de'?'Keine Daten':'No data'); return; }
  const ms    = until(a.expiry);
  const bonus = ARB_BONUS[a.enemy] || { icon:'⚠', en:a.enemy||'', de:a.enemy||'' };
  if (el) el.innerHTML = `
    <div class="arb-card">
      <div class="arb-top">
        <div>
          <div class="card-label">${APP.lang==='de'?'AKTUELLE MISSION':'CURRENT MISSION'}</div>
          <div class="arb-mission">${tM(a.type||'')} · ${tP(a.node||'')}</div>
          <div class="arb-enemy">${bonus.icon} ${APP.lang==='de'?bonus.de:bonus.en}</div>
        </div>
        <div class="arb-timer-wrap">
          <div class="card-label">${APP.lang==='de'?'VERBLEIBEND':'REMAINING'}</div>
          <div class="arb-timer" id="arbTimer">${fmtMs(ms,true)}</div>
        </div>
      </div>
      <div class="arb-info-row">
        <div class="arb-info-chip">⚠ ${APP.lang==='de'?'Nur ein Leben!':'One life only!'}</div>
        <div class="arb-info-chip">◆ ${APP.lang==='de'?'Vitus-Essenz, Aura-Mods':'Vitus Essence, Aura Mods'}</div>
        <div class="arb-info-chip">🏆 ${APP.lang==='de'?'Min. MR8':'Min. MR8'}</div>
      </div>
    </div>`;
  const exp = new Date(a.expiry).getTime();
  if (APP.timers.arb) clearInterval(APP.timers.arb);
  APP.timers.arb = setInterval(() => {
    const te = document.getElementById('arbTimer');
    if (!te) { clearInterval(APP.timers.arb); return; }
    const ms = exp - Date.now();
    if (ms<=0) { clearInterval(APP.timers.arb); reloadSoon('arb', loadArbitration); return; }
    te.textContent = fmtMs(ms, true);
  }, 1000);
}

/* ═══ ALERTS ════════════════════════════════════════════════════ */
async function loadAlerts() {
  try {
    const d = await apiFetch('alerts');
    APP.cache.alerts = d;
    renderAlerts();
  } catch(e) {
    const el = document.getElementById('alertsContainer');
    if (el) el.innerHTML = errHTML(e);
  }
}
function renderAlerts() {
  const active = (APP.cache.alerts||[]).filter(a => until(a.expiry) > 0);
  const el     = document.getElementById('alertsContainer');
  if (!active.length) {
    if (el) el.innerHTML = emptyHTML(APP.lang==='de'?'Keine aktiven Alarme':'No active alerts');
    return;
  }
  if (el) el.innerHTML = active.map(a => {
    const r = a.mission?.reward;
    const items = [...(r?.items||[]), ...(r?.countedItems||[]).map(i=>`${i.count}× ${i.type}`)];
    const reward = items.join(', ') || `${(r?.credits||0).toLocaleString()} Cr`;
    const ms = until(a.expiry);
    return `<div class="alert-item">
      <div>
        <div class="alert-reward-name">${reward}</div>
        <div class="alert-meta">${tM(a.mission?.type||'')} · ${tP(a.mission?.node||'')}</div>
      </div>
      <div class="alert-timer" id="alT-${a.id}">${fmtMs(ms,true)}</div>
    </div>`;
  }).join('');
  if (APP.timers.alerts) clearInterval(APP.timers.alerts);
  APP.timers.alerts = setInterval(() => {
    let reload = false;
    active.forEach(a => {
      const te = document.getElementById(`alT-${a.id}`);
      if (!te) return;
      const ms = until(a.expiry);
      if (ms<=0) { reload=true; return; }
      te.textContent = fmtMs(ms, true);
    });
    if (reload) { clearInterval(APP.timers.alerts); reloadSoon('alerts', loadAlerts); }
  }, 1000);
}

/* ═══ STEEL PATH ACOLYTE ════════════════════════════════════════ */
async function loadSteelPath() {
  const el = document.getElementById('steelPathContainer');
  if (!el) return;
  try {
    const d = await apiFetch('steelPath');
    APP.cache.steelPath = d;
    renderSteelPath();
  } catch(e) {
    el.innerHTML = errHTML(e, false);
  }
}
function renderSteelPath() {
  const el = document.getElementById('steelPathContainer');
  if (!el) return;
  const d = APP.cache.steelPath;
  if (!d) { el.innerHTML = emptyHTML('No Steel Path data'); return; }
  const acolyte = d.currentReward || {};
  const ms = d.expiry ? until(d.expiry) : 0;
  el.innerHTML = `
    <div class="sp-card">
      <div class="sp-top">
        <div>
          <div class="card-label">${APP.lang==='de'?'WÖCHENTLICHES TESHIN-ANGEBOT':'WEEKLY TESHIN OFFERING'}</div>
          <div class="sp-reward">${acolyte.name || '—'}</div>
          ${acolyte.cost ? `<div class="sp-cost">◆ ${acolyte.cost} Steel Essence</div>` : ''}
        </div>
        ${ms > 0 ? `<div class="sp-timer-wrap">
          <div class="card-label">${APP.lang==='de'?'WECHSEL IN':'ROTATES IN'}</div>
          <div class="sp-timer" id="spTimer">${fmtMsLong(ms)}</div>
        </div>` : ''}
      </div>
      <div class="sp-info">${APP.lang==='de'
        ? 'Wöchentlich wechselnde Belohnung in Teshins Stahlpfad-Ehrungen, bezahlt mit Stahlessenz.'
        : 'Weekly rotating reward in Teshin\'s Steel Path Honors, paid with Steel Essence.'}</div>
    </div>`;
  if (ms > 0) {
    const exp = new Date(d.expiry).getTime();
    if (APP.timers.steelPath) clearInterval(APP.timers.steelPath);
    APP.timers.steelPath = setInterval(() => {
      const te = document.getElementById('spTimer');
      if (!te) { clearInterval(APP.timers.steelPath); return; }
      const rem = exp - Date.now();
      if (rem <= 0) { clearInterval(APP.timers.steelPath); reloadSoon('steelPath', loadSteelPath); return; }
      te.textContent = fmtMsLong(rem);
    }, 1000);
  }
}

/* ═══ FISSURES ══════════════════════════════════════════════════ */
let fissureFilter = 'all';
async function loadFissures() {
  try {
    const d = await apiFetch('fissures');
    APP.cache.fissures = d;
    renderFissures();
  } catch(e) {
    const el = document.getElementById('fissureGrid');
    if (el) el.innerHTML = errHTML(e);
  }
}
function renderFissures() {
  let list = (APP.cache.fissures||[]).filter(f => until(f.expiry) > 0);
  list.sort((a,b) => {
    const ao = (TIER_ORD[a.tier]||9) + (a.isHard?100:0);
    const bo = (TIER_ORD[b.tier]||9) + (b.isHard?100:0);
    return ao - bo;
  });
  if (fissureFilter==='steel') list = list.filter(f => f.isHard);
  else if (fissureFilter==='storm') list = list.filter(f => f.isStorm);
  else if (fissureFilter!=='all') list = list.filter(f => f.tier===fissureFilter);

  const cntEl = document.getElementById('fissureCountBadge');
  if (cntEl) cntEl.textContent = `${list.length} active`;
  const grid = document.getElementById('fissureGrid');
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${APP.lang==='de'?'KEINE FISSUREN AKTIV':'NO FISSURES ACTIVE'}</div>`;
    return;
  }
  grid.innerHTML = list.map(f => {
    const ms = until(f.expiry);
    const _fParts  = (f.node||'').split('/');
    const planet   = _fParts.length > 1 ? _fParts[0].trim() : '';
    const node     = (_fParts.length > 1 ? _fParts.slice(1).join('/') : _fParts[0] || '?').replace(/\s*\(.*?\)\s*$/, '').trim();
    const loc      = (planet ? `${APP.lang==='de'?(DE_PLANET[planet]||planet):planet} / ` : '') + node;
    return `<div class="fissure-card ${f.tier}">
      <div class="fissure-top">
        <span class="tier-badge ${f.tier}">${f.tier}</span>
        <span class="fissure-timer" id="fT-${f.id}">${fmtMs(ms,true)}</span>
      </div>
      <div class="fissure-node">${loc}</div>
      <div class="fissure-tags">
        <span class="tag-sm">${tM(f.missionType||'')}</span>
        <span class="tag-sm">${f.enemy||''}</span>
        ${f.isHard?`<span class="tag-sm steel">⚔ STEEL PATH</span>`:''}
        ${f.isStorm?`<span class="tag-sm storm">🌌 ${APP.lang==='de'?'VOID STORM':'VOID STORM'}</span>`:''}
      </div>
    </div>`;
  }).join('');
  if (APP.timers.fissures) clearInterval(APP.timers.fissures);
  APP.timers.fissures = setInterval(() => {
    let reload = false;
    list.forEach(f => {
      const te = document.getElementById(`fT-${f.id}`);
      if (!te) { reload=true; return; }
      const ms = until(f.expiry);
      if (ms<=0) { reload=true; return; }
      te.textContent = fmtMs(ms, true);
    });
    if (reload) { clearInterval(APP.timers.fissures); reloadSoon('fissures', loadFissures); }
  }, 1000);
}
function setFissureFilter(f, btn) {
  fissureFilter = f;
  document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderFissures();
}

/* ═══ SORTIE ════════════════════════════════════════════════════ */
async function loadSortie() {
  try {
    const d = await apiFetch('sortie');
    APP.cache.sortie = d;
    renderSortie();
  } catch(e) {
    const el = document.getElementById('sortieContainer');
    if (el) el.innerHTML = errHTML(e);
  }
}
function renderSortie() {
  const s = APP.cache.sortie;
  if (!s) return;
  renderDashSortie();
  const el = document.getElementById('sortieContainer');
  if (!el) return;
  if (!s?.variants?.length) { el.innerHTML = emptyHTML('No data'); return; }
  const resetMs   = until(s.expiry);
  const missions  = s.variants.map((v,i) => `
    <div class="sortie-mission-card">
      <div class="card-label">MISSION ${i+1}</div>
      <div class="sortie-type">${tM(v.missionType||'')}</div>
      <div class="sortie-node">${tP(v.node||'')}</div>
      <div class="sortie-mod-label">${APP.lang==='de'?'MODIFIKATOR':'MODIFIER'}</div>
      <div class="sortie-mod">${v.modifier||''}</div>
    </div>`).join('');
  el.innerHTML = `
    <div class="sortie-meta">
      <div>
        <div class="card-label">BOSS</div>
        <div class="sortie-boss">${s.boss||''}</div>
        <div class="sortie-faction">${s.faction||''}</div>
      </div>
      <div class="sortie-reset-wrap">
        <div class="card-label">${APP.lang==='de'?'RESET IN':'RESETS IN'}</div>
        <div class="sortie-reset" id="sortieTimer">${fmtMsLong(resetMs)}</div>
      </div>
    </div>
    <div class="sortie-missions-grid">${missions}</div>`;
  const exp = new Date(s.expiry).getTime();
  if (APP.timers.sortie) clearInterval(APP.timers.sortie);
  APP.timers.sortie = setInterval(() => {
    const te = document.getElementById('sortieTimer');
    if (!te) { clearInterval(APP.timers.sortie); return; }
    const ms = exp - Date.now();
    if (ms<=0) { clearInterval(APP.timers.sortie); reloadSoon('sortie', loadSortie); return; }
    te.textContent = fmtMsLong(ms);
  }, 1000);
}
function renderDashSortie() {
  const el = document.getElementById('dashSortie');
  if (!el) return;
  const s = APP.cache.sortie;
  if (!s?.variants?.length) { el.innerHTML = `<div class="dash-mini-loading">${APP.lang==='de'?'Lade Sortie...':'Loading Sortie...'}</div>`; return; }
  const resetMs  = until(s.expiry);
  const missions = s.variants.map((v,i) => `<div>${i+1}. ${tM(v.missionType||'')}, ${v.modifier||''}</div>`).join('');
  el.innerHTML   = `
    <div class="dash-mini-head"><span>⚡</span><span>${APP.lang==='de'?'TÄGLICHE SORTIE':'DAILY SORTIE'}</span><span class="arrow">→</span></div>
    <div class="dash-mini-title">${s.boss||''}</div>
    <div class="dash-mini-sub">${s.faction||''} · <span class="dash-mini-timer" id="dashSortieTimer">${fmtMsLong(resetMs)}</span></div>
    <div class="dash-mini-list">${missions}</div>`;
}

/* ═══ NIGHTWAVE ═════════════════════════════════════════════════ */
async function loadNightwave() {
  try {
    const d = await apiFetch('nightwave');
    APP.cache.nightwave = d;
    renderNightwave();
  } catch(e) {
    const el = document.getElementById('nightwaveContainer');
    if (el) el.innerHTML = errHTML(e);
  }
}
function renderNightwave() {
  const nw = APP.cache.nightwave;
  const el = document.getElementById('nightwaveContainer');
  if (!nw?.activeChallenges?.length) {
    if (el) el.innerHTML = emptyHTML(APP.lang==='de'?'Keine Nightwave-Daten':'No Nightwave data');
    return;
  }
  const challenges = nw.activeChallenges.filter(c => until(c.expiry) > 0);
  const tDE = {daily:'TÄGLICH', weekly:'WÖCHENTLICH', elite:'ELITE'};
  const tEN = {daily:'DAILY',   weekly:'WEEKLY',       elite:'ELITE'};
  const html = challenges.map(c => {
    const done = APP.doneNW.includes(c.id);
    const type = c.isDaily?'daily':(c.isElite?'elite':'weekly');
    const lbl  = APP.lang==='de' ? (tDE[type]||type) : (tEN[type]||type);
    return `<div class="nw-card ${done?'done':''}" id="nw-${c.id}" onclick="toggleNWDone('${c.id}')">
      <div class="nw-checkbox">${done?'✓':''}</div>
      <div class="nw-body">
        <div class="nw-type-chip ${type}">${lbl}</div>
        <div class="nw-title">${c.title||''}</div>
        <div class="nw-desc">${c.desc||''}</div>
        <div class="nw-standing">◉ ${(c.reputation||0).toLocaleString()} ${APP.lang==='de'?'Ansehen':'Standing'}</div>
      </div>
    </div>`;
  }).join('');
  const done          = APP.doneNW.filter(id => challenges.find(c=>c.id===id)).length;
  const total         = challenges.length;
  const totalStanding = challenges.reduce((s,c)=>s+(c.reputation||0),0);
  if (el) el.innerHTML = `
    <div class="nw-info-bar">
      <div>
        <div class="nw-season">${nw.season?`${APP.lang==='de'?'Saison':'Season'} ${nw.season}`:'Nora Night'}</div>
        <div class="nw-count">${total} ${APP.lang==='de'?'Herausforderungen':'challenges'} · ${totalStanding.toLocaleString()} ${APP.lang==='de'?'Ansehen max.':'Standing max'}</div>
      </div>
      <div class="nw-progress-note">${done}/${total} ${APP.lang==='de'?'erledigt':'done'} · ${APP.lang==='de'?'lokal gespeichert':'saved locally'}</div>
    </div>
    <div class="nw-grid">${html||emptyHTML('No challenges')}</div>`;
}
function toggleNWDone(id) {
  const idx = APP.doneNW.indexOf(id);
  if (idx>=0) APP.doneNW.splice(idx,1);
  else APP.doneNW.push(id);
  localStorage.setItem('th_nw_done', JSON.stringify(APP.doneNW));
  renderNightwave();
}

/* ═══ INVASIONS ═════════════════════════════════════════════════ */
async function loadInvasions() {
  try {
    const d = await apiFetch('invasions');
    APP.cache.invasions = d;
    renderInvasions();
  } catch(e) {
    const el = document.getElementById('invasionGrid');
    if (el) el.innerHTML = errHTML(e);
  }
}
function renderInvasions() {
  const active = (APP.cache.invasions||[]).filter(i => !i.completed);
  const cntEl  = document.getElementById('invasionCountBadge');
  if (cntEl) cntEl.textContent = `${active.length} active`;
  const grid = document.getElementById('invasionGrid');
  if (!grid) return;
  if (!active.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${APP.lang==='de'?'KEINE AKTIVEN INVASIONEN':'NO ACTIVE INVASIONS'}</div>`;
    return;
  }
  grid.innerHTML = active.map(inv => {
    /* API liefert completion bereits als 0–100 % (Fortschritt Angreifer) */
    const pct    = Math.min(100, Math.max(0, Number(inv.completion) || 0));
    /* FIX: empty reward shows "Credits only" instead of lone "," */
    const aR = rewardStr(inv.attackerReward) || (APP.lang==='de'?'Nur Credits':'Credits only');
    const dR = rewardStr(inv.defenderReward) || (APP.lang==='de'?'Nur Credits':'Credits only');
    const _iParts  = (inv.node||'').split('/');
    const planet   = _iParts.length > 1 ? _iParts[0].trim() : '';
    const node     = (_iParts.length > 1 ? _iParts.slice(1).join('/') : _iParts[0] || '?').replace(/\s*\(.*?\)\s*$/, '').trim();
    const loc      = (planet ? `${APP.lang==='de'?(DE_PLANET[planet]||planet):planet} / ` : '') + node;
    return `<div class="invasion-card">
      <div class="invasion-node">📍 ${loc}</div>
      <div class="invasion-vs-row">
        <div class="inv-faction-col">
          <div class="inv-name ${FACTION_CLS[inv.attackingFaction]||''}">${inv.attackingFaction||'?'}</div>
          <div class="inv-reward">${aR}</div>
        </div>
        <div class="inv-vs">VS</div>
        <div class="inv-faction-col inv-faction-right">
          <div class="inv-name ${FACTION_CLS[inv.defendingFaction]||''}">${inv.defendingFaction||'?'}</div>
          <div class="inv-reward">${dR}</div>
        </div>
      </div>
      <div class="inv-bar-wrap">
        <span class="inv-bar-side">◀</span>
        <div class="inv-bar"><div class="inv-bar-fill" style="width:${pct}%"></div></div>
        <span class="inv-bar-side">▶</span>
      </div>
      <div class="inv-pct-row">
        <span class="inv-pct inv-pct-atk">${inv.attackingFaction||''}</span>
        <span class="inv-pct inv-pct-val">${pct.toFixed(1)}%</span>
        <span class="inv-pct inv-pct-def">${inv.defendingFaction||''}</span>
      </div>
    </div>`;
  }).join('');
}
function rewardStr(r) {
  if (!r) return '';
  const items = [...(r.items||[]), ...(r.countedItems||[]).map(i=>`${i.count}× ${i.type}`)];
  return items.join(', ') || (r.credits ? `${r.credits.toLocaleString()} Cr` : '');
}

/* ═══ BARO KI'TEER ══════════════════════════════════════════════ */
let _baroFilter = '';
async function loadBaro() {
  try {
    const d = await apiFetch('voidTrader');
    APP.cache.baro = d;
    renderBaro();
  } catch(e) {
    const el = document.getElementById('baroContainer');
    if (el) el.innerHTML = errHTML(e);
  }
}
function renderBaro() {
  const b = APP.cache.baro;
  if (!b) return;
  renderDashBaro();
  const el = document.getElementById('baroContainer');
  if (!el) { applyI18n(); return; }
  const isActive = baroIsActive(b);
  if (!isActive) {
    const ms = until(b.activation);
    el.innerHTML = `
      <div class="baro-hero">
        <div class="card-label">${APP.lang==='de'?'BARO IST UNTERWEGS – ANKUNFT IN':'BARO IS TRAVELING – ARRIVES IN'}</div>
        <div class="baro-countdown" id="baroTimer">${fmtMsLong(ms)}</div>
        <div class="baro-loc">📍 ${b.location||''}</div>
        <div class="baro-hint" data-en="Collect Prime parts and trade them at Ducat Kiosks in any Relay to get Ducats!"
             data-de="Sammle Prime-Teile und tausche sie an Ducat-Kiosken in einem Relay gegen Ducats!">
          Collect Prime parts and trade them at Ducat Kiosks in any Relay to get Ducats!
        </div>
      </div>`;
    const act = new Date(b.activation).getTime();
    if (APP.timers.baro) clearInterval(APP.timers.baro);
    APP.timers.baro = setInterval(() => {
      const te = document.getElementById('baroTimer');
      if (!te) { clearInterval(APP.timers.baro); return; }
      const ms = act - Date.now();
      if (ms<=0) {
        clearInterval(APP.timers.baro);
        if (APP.notifs.baro) notifyOnce(`baro_${b.activation}`, "Baro Ki'Teer", `${APP.lang==='de'?'ist angekommen':'has arrived'}: ${b.location||''}`);
        reloadSoon('baro', loadBaro);
        return;
      }
      te.textContent = fmtMsLong(ms);
    }, 1000);
  } else {
    const deptMs = until(b.expiry);
    renderBaroInventory(b, _baroFilter);
    el.innerHTML = `
      <div class="baro-hero">
        <div class="card-label">${APP.lang==='de'?'BARO IST ANWESEND':'BARO IS PRESENT'}</div>
        <div class="baro-loc-big">📍 ${b.location||''}</div>
        <div class="baro-dept">${APP.lang==='de'?'Abreise in':'Departs in'}: <strong id="baroTimer">${fmtMsLong(deptMs)}</strong></div>
      </div>
      <div class="baro-search-row">
        <input id="baroSearch" class="search-input" type="search"
               placeholder="${APP.lang==='de'?'Inventar durchsuchen...':'Search inventory...'}"
               oninput="filterBaroInventory(this.value)" value="${_baroFilter}">
        <span class="baro-inv-count" id="baroInvCount">${(b.inventory||[]).length} items</span>
      </div>
      <div class="baro-inv-grid" id="baroInvGrid"></div>`;
    renderBaroInventory(b, _baroFilter);
    const exp = new Date(b.expiry).getTime();
    if (APP.timers.baro) clearInterval(APP.timers.baro);
    APP.timers.baro = setInterval(() => {
      const te = document.getElementById('baroTimer');
      if (!te) { clearInterval(APP.timers.baro); return; }
      const ms = exp - Date.now();
      if (ms<=0) { clearInterval(APP.timers.baro); reloadSoon('baro', loadBaro); return; }
      te.textContent = fmtMsLong(ms);
    }, 1000);
  }
  applyI18n();
}
function filterBaroInventory(q) {
  _baroFilter = q;
  renderBaroInventory(APP.cache.baro, q);
}
function renderBaroInventory(b, q='') {
  const grid = document.getElementById('baroInvGrid');
  const cnt  = document.getElementById('baroInvCount');
  if (!grid) return;
  const query = (q||'').trim().toLowerCase();
  const inv   = (b.inventory||[]).filter(item =>
    !query || (item.item||'').toLowerCase().includes(query)
  );
  if (cnt) cnt.textContent = `${inv.length} / ${(b.inventory||[]).length} items`;
  if (!inv.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${APP.lang==='de'?'Keine Treffer':'No matches'}</div>`;
    return;
  }
  grid.innerHTML = inv.map(item => `
    <div class="baro-item">
      <div class="baro-item-name">${item.item||''}</div>
      <div class="baro-prices">
        <span class="baro-ducat">◆ ${item.ducats||0}</span>
        <span class="baro-credit">₿ ${(item.credits||0).toLocaleString()}</span>
      </div>
    </div>`).join('');
}

// API's "active" Flag ist nicht immer verlässlich vorhanden -> anhand der
// Zeitstempel selbst nachrechnen, falls active fehlt oder kein Boolean ist.
function baroIsActive(b) {
  return typeof b.active === 'boolean'
    ? b.active
    : (until(b.activation) <= 0 && until(b.expiry) > 0);
}
function renderDashBaro() {
  const el = document.getElementById('dashBaro');
  if (!el) return;
  const b = APP.cache.baro;
  if (!b) { el.innerHTML = `<div class="dash-mini-loading">${APP.lang==='de'?'Lade Baro...':'Loading Baro...'}</div>`; return; }
  if (!baroIsActive(b)) {
    const ms = until(b.activation);
    el.innerHTML = `
      <div class="dash-mini-head"><span>◆</span><span>BARO KI'TEER</span><span class="arrow">→</span></div>
      <div class="dash-mini-title">${APP.lang==='de'?'Unterwegs':'Traveling'}</div>
      <div class="dash-mini-sub">📍 ${b.location||'?'} · <span class="dash-mini-timer">${fmtMsLong(ms)}</span></div>
      <div class="dash-mini-list">${APP.lang==='de'?'Prime-Teile sammeln, an Ducat-Kiosken tauschen.':'Collect Prime parts, trade at Ducat Kiosks.'}</div>`;
  } else {
    const deptMs = until(b.expiry);
    const items  = (b.inventory||[]).length;
    el.innerHTML = `
      <div class="dash-mini-head"><span>◆</span><span>BARO KI'TEER</span><span class="arrow">→</span></div>
      <div class="dash-mini-title baro-present">${APP.lang==='de'?'Anwesend!':'Present!'}</div>
      <div class="dash-mini-sub">📍 ${b.location||''} · ${APP.lang==='de'?'Abreise':'Departs'} <span class="dash-mini-timer">${fmtMsLong(deptMs)}</span></div>
      <div class="dash-mini-list">${items} ${APP.lang==='de'?'Items im Inventar':'items in inventory'}</div>`;
  }
}

/* ═══ ARCHON HUNT ════════════════════════════════════════════════ */
async function loadArchon() {
  const el = document.getElementById('archonContainer');
  if (el) el.innerHTML = loadHTML(APP.lang==='de'?'Lade Archon-Jagd...':'Loading Archon Hunt...');
  try {
    const d = await apiFetch('archonHunt');
    APP.cache.archon = d;
    renderArchon();
  } catch(e) {
    if (el) el.innerHTML = errHTML(e);
  }
}
function renderArchon() {
  const a = APP.cache.archon;
  if (!a) return;
  renderDashArchon();
  const el = document.getElementById('archonContainer');
  if (!el) return;
  if (!a.boss) { el.innerHTML = emptyHTML(APP.lang==='de'?'Keine aktive Archon-Jagd':'No active Archon Hunt'); return; }
  const ms       = until(a.expiry);
  const missions = (a.missions||[]).map((m,i) => `
    <div class="archon-mission-card">
      <div class="archon-mission-num">MISSION ${i+1}</div>
      <div class="archon-mission-type">${tM(m.type||'')}</div>
      <div class="archon-mission-node">${tP(m.node||'')}</div>
      ${m.modifier ? `<div class="archon-mission-mod">⚠ ${m.modifier}</div>` : ''}
    </div>`).join('');
  el.innerHTML = `
    <div class="archon-hero">
      <div>
        <div class="card-label">${APP.lang==='de'?'AKTUELLER ARCHON':'CURRENT ARCHON'}</div>
        <div class="archon-boss-name">${a.boss}</div>
        <div class="archon-faction">${a.faction||'Narmer'}</div>
      </div>
      <div class="archon-timer-wrap">
        <div class="card-label">${APP.lang==='de'?'RESET IN':'RESETS IN'}</div>
        <div class="archon-timer" id="archonTimer">${fmtMsLong(ms)}</div>
      </div>
    </div>
    <div class="archon-missions">${missions}</div>`;
  const exp = new Date(a.expiry).getTime();
  if (APP.timers.archon) clearInterval(APP.timers.archon);
  APP.timers.archon = setInterval(() => {
    const te = document.getElementById('archonTimer');
    if (!te) { clearInterval(APP.timers.archon); return; }
    const ms = exp - Date.now();
    if (ms<=0) { clearInterval(APP.timers.archon); reloadSoon('archon', loadArchon); return; }
    te.textContent = fmtMsLong(ms);
  }, 1000);
}
function renderDashArchon() {
  const el = document.getElementById('dashArchon');
  if (!el) return;
  const a = APP.cache.archon;
  if (!a?.boss) { el.innerHTML = `<div class="dash-mini-loading">${APP.lang==='de'?'Lade Archon-Jagd...':'Loading Archon Hunt...'}</div>`; return; }
  const ms          = until(a.expiry);
  const missionList = (a.missions||[]).map((m,i) => `<div>${i+1}. ${tM(m.type||'')}</div>`).join('');
  el.innerHTML = `
    <div class="dash-mini-head"><span>🛡</span><span>${APP.lang==='de'?'ARCHON-JAGD':'ARCHON HUNT'}</span><span class="arrow">→</span></div>
    <div class="dash-mini-title">${a.boss}</div>
    <div class="dash-mini-sub">${a.faction||'Narmer'} · <span class="dash-mini-timer">${fmtMsLong(ms)}</span></div>
    <div class="dash-mini-list">${missionList}</div>`;
}
