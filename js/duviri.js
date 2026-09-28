/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, duviri.js
   Duviri Paradox: Spiral cycle, Circuit, Undercroft info
═══════════════════════════════════════════════════════════════ */

/* Duviri emotion/spiral cycle names */
const DUVIRI_EMOTIONS = {
  joy:     { icon:'😊', color:'#f5d742', en:'Joy',     de:'Freude',   tip_en:'Increased ability strength, colorful world', tip_de:'Erhöhte Fähigkeitsstärke, bunte Welt' },
  anger:   { icon:'😡', color:'#e84040', en:'Anger',   de:'Zorn',     tip_en:'Enemies deal more damage, faster enemy spawn', tip_de:'Feinde verursachen mehr Schaden, schnelleres Spawn' },
  envy:    { icon:'💚', color:'#40c040', en:'Envy',    de:'Neid',     tip_en:'Increased enemy speed and loot drops',          tip_de:'Erhöhte Feindgeschwindigkeit und bessere Beute' },
  sorrow:  { icon:'😢', color:'#4080e8', en:'Sorrow',  de:'Trauer',   tip_en:'Reduced visibility, unique bounty rewards',     tip_de:'Reduzierte Sicht, einzigartige Belohnungen' },
  fear:    { icon:'😨', color:'#9040e8', en:'Fear',    de:'Angst',    tip_en:'Stealth mechanics matter, enemies are alert',   tip_de:'Stealth wichtig, Feinde sind wachsam' },
};

/* ─── Load Duviri data ─── */
async function loadDuviri() {
  const el = document.getElementById('duviriContainer');
  if (el) el.innerHTML = loadHTML(APP.lang==='de'?'Lade Duviri-Daten...':'Loading Duviri...');
  try {
    const d = await apiFetch('duviriCycle');
    APP.cache.duviri = d;
    renderDuviri();
  } catch(e) {
    /* duviriCycle may not exist on all platforms, show static info */
    APP.cache.duviri = { state: 'unknown', expiry: null };
    renderDuviri();
  }
}

function renderDuviri() {
  const d  = APP.cache.duviri;
  const el = document.getElementById('duviriContainer');
  if (!d || !el) return;

  const state   = (d.state||'').toLowerCase();
  const emotion = DUVIRI_EMOTIONS[state] || { icon:'❓', color:'var(--gold)', en: state || 'Unknown', de: state || 'Unbekannt', tip_en:'Check the game for the current cycle.', tip_de:'Aktuellen Zyklus im Spiel prüfen.' };
  const ms      = d.expiry ? until(d.expiry) : 0;
  const lbl     = APP.lang==='de' ? emotion.de : emotion.en;
  const tip     = APP.lang==='de' ? emotion.tip_de : emotion.tip_en;

  el.innerHTML = `
    <!-- Current Spiral Cycle -->
    <div class="duviri-hero" style="--duviri-color:${emotion.color}">
      <div class="duviri-hero-left">
        <div class="card-label">${APP.lang==='de'?'AKTUELLE DUVIRI-SPIRALE':'CURRENT DUVIRI SPIRAL'}</div>
        <div class="duviri-emotion">
          <span class="duviri-icon">${emotion.icon}</span>
          <span class="duviri-name">${lbl}</span>
        </div>
        ${tip ? `<div class="duviri-tip">${tip}</div>` : ''}
      </div>
      <div class="duviri-hero-right">
        <div class="card-label">${APP.lang==='de'?'WECHSEL IN':'CHANGES IN'}</div>
        <div class="duviri-timer" id="duviriTimer">${fmtMsLong(ms)}</div>
      </div>
    </div>

    <!-- Circuit choices if available -->
    ${d.choices?.length ? renderCircuitChoices(d.choices) : renderCircuitInfo()}

    <!-- Undercroft info -->
    ${renderUndercroftInfo()}

    <!-- Quick links -->
    <div class="duviri-links">
      <div class="card-label" style="margin-bottom:10px;">${APP.lang==='de'?'SCHNELLZUGRIFF':'QUICK LINKS'}</div>
      <a href="https://wiki.warframe.com/w/Duviri_Paradox" target="_blank" rel="noopener" class="duviri-link-btn">
        📖 ${APP.lang==='de'?'Wiki: Duviri Paradox':'Wiki: Duviri Paradox'}
      </a>
      <a href="https://wiki.warframe.com/w/The_Circuit" target="_blank" rel="noopener" class="duviri-link-btn">
        ⚡ ${APP.lang==='de'?'Wiki: Der Circuit':'Wiki: The Circuit'}
      </a>
      <a href="https://wiki.warframe.com/w/Undercroft" target="_blank" rel="noopener" class="duviri-link-btn">
        🌀 ${APP.lang==='de'?'Wiki: Undercroft':'Wiki: Undercroft'}
      </a>
    </div>`;

  /* Start countdown */
  if (!d.expiry) return;
  const exp = new Date(d.expiry).getTime();
  if (APP.timers.duviri) clearInterval(APP.timers.duviri);
  APP.timers.duviri = setInterval(() => {
    const te = document.getElementById('duviriTimer');
    if (!te) { clearInterval(APP.timers.duviri); return; }
    const ms = exp - Date.now();
    if (ms <= 0) { clearInterval(APP.timers.duviri); reloadSoon('duviri', loadDuviri); return; }
    te.textContent = fmtMsLong(ms);
  }, 1000);
}

function renderCircuitChoices(choices) {
  if (!choices?.length) return renderCircuitInfo();
  /* API: [{ category:'normal'|'hard', choices:['Excalibur', …] }] */
  const catLbl = { normal: APP.lang==='de'?'Normal · Warframes':'Normal · Warframes',
                   hard:   APP.lang==='de'?'Stahlpfad · Incarnon-Waffen':'Steel Path · Incarnon weapons' };
  const html = choices.map(ch => {
    const names = Array.isArray(ch?.choices) ? ch.choices.join(', ') : (ch?.name || String(ch));
    return `
    <div class="circuit-choice-card">
      <div class="circuit-choice-name">${names}</div>
      ${ch?.category ? `<div class="circuit-choice-cat">${catLbl[ch.category]||ch.category}</div>` : ''}
    </div>`;
  }).join('');
  return `
    <div class="duviri-section">
      <div class="section-header" style="margin-top:0">
        <div class="section-title" style="font-size:13px">⚡ ${APP.lang==='de'?'CIRCUIT, HEUTIGE AUSWAHL':'CIRCUIT, TODAY\'S CHOICES'}</div>
      </div>
      <div class="circuit-choices-grid">${html}</div>
    </div>`;
}

function renderCircuitInfo() {
  return `
    <div class="duviri-section">
      <div class="section-header" style="margin-top:0">
        <div class="section-title" style="font-size:13px">⚡ ${APP.lang==='de'?'THE CIRCUIT':'THE CIRCUIT'}</div>
      </div>
      <div class="info-box">
        <div class="info-icon">💡</div>
        <div class="info-text">
          <div class="info-title">${APP.lang==='de'?'Was ist der Circuit?':'What is The Circuit?'}</div>
          <div class="info-desc" style="font-size:12px" data-en="The Circuit is a <strong>weekly roguelite mode</strong> inside Duviri. Each week you get a random pool of Warframes and weapons to use. Complete rounds to earn <strong>Incarnon Genesis</strong> upgrades, some of the most powerful weapon upgrades in the game!"
               data-de="Der Circuit ist ein <strong>wöchentlicher Roguelite-Modus</strong> in Duviri. Jede Woche bekommst du einen zufälligen Pool aus Warframes und Waffen. Schließe Runden ab für <strong>Incarnon Genesis</strong> Upgrades, einige der mächtigsten Waffen-Upgrades im Spiel!">
            The Circuit is a <strong>weekly roguelite mode</strong> inside Duviri. Each week you get a random pool of Warframes and weapons to use. Complete rounds to earn <strong>Incarnon Genesis</strong> upgrades, some of the most powerful weapon upgrades in the game!
          </div>
        </div>
      </div>
    </div>`;
}

function renderUndercroftInfo() {
  return `
    <div class="duviri-section">
      <div class="section-header" style="margin-top:0">
        <div class="section-title" style="font-size:13px">🌀 UNDERCROFT</div>
      </div>
      <div class="duviri-undercroft-grid">
        <div class="undercroft-card">
          <div class="undercroft-icon">⚔️</div>
          <div class="undercroft-name">${APP.lang==='de'?'Vergeltung (Survival)':'Retribution (Survival)'}</div>
          <div class="undercroft-desc" data-en="Endless survival, kill enemies to keep oxygen flowing. Rewards Voruna parts." data-de="Endloses Überleben, töte Feinde um Sauerstoff zu erhalten. Belohnt Voruna-Teile.">
            Endless survival, kill enemies to keep oxygen flowing. Rewards Voruna parts.
          </div>
        </div>
        <div class="undercroft-card">
          <div class="undercroft-icon">🏆</div>
          <div class="undercroft-name">${APP.lang==='de'?'Duell (Assassination)':'Duel (Assassination)'}</div>
          <div class="undercroft-desc" data-en="Face a powerful boss. Rewards unique mods and Duviri resources." data-de="Besiege einen mächtigen Boss. Belohnt einzigartige Mods und Duviri-Ressourcen.">
            Face a powerful boss. Rewards unique mods and Duviri resources.
          </div>
        </div>
        <div class="undercroft-card">
          <div class="undercroft-icon">🌀</div>
          <div class="undercroft-name">${APP.lang==='de'?'Überschwemmung (Disruption)':'Overflow (Disruption)'}</div>
          <div class="undercroft-desc" data-en="Defend conduits from Demolysts. High standing rewards." data-de="Verteidige Konduits vor Demolysten. Hohe Ansehen-Belohnungen.">
            Defend conduits from Demolysts. High standing rewards.
          </div>
        </div>
        <div class="undercroft-card">
          <div class="undercroft-icon">🔬</div>
          <div class="undercroft-name">${APP.lang==='de'?'Labor (Disruption)':'Laboratory (Disruption)'}</div>
          <div class="undercroft-desc" data-en="Special version with modifier effects. Best for Pathos Clamp farming." data-de="Spezialversion mit Modifikatoren. Beste Quelle für Pathos-Klammer-Farming.">
            Special version with modifier effects. Best for Pathos Clamp farming.
          </div>
        </div>
      </div>
    </div>`;
}
