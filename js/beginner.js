/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, beginner.js  (v4 – weekly reset fix, typo fix)
   Beginner Roadmap · Resource Finder · Daily Checklist
   · Syndicate Standing Calculator
═══════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════
   1. BEGINNER ROADMAP
══════════════════════════════════════════════════════════════ */
const ROADMAP = [
  { id:'ch1', icon:'🚀', en:'Chapter 1, First Steps', de:'Kapitel 1, Erste Schritte', color:'#00e0a0',
    items:[
      {id:'r_tutorial', en:"Complete the Tutorial (Vor's Prize)",            de:"Tutorial abschließen (Vor's Preis)"},
      {id:'r_3frames',  en:"Unlock 3 planets: Mercury, Venus, Earth",        de:"3 Planeten freischalten: Merkur, Venus, Erde"},
      {id:'r_mods',     en:"Understand the Mod system, fuse & rank up a Mod",de:"Das Mod-System verstehen, Mod verschmelzen & aufwerten"},
      {id:'r_arsenal',  en:"Equip a full loadout (Warframe + Primary + Secondary + Melee)", de:"Vollständiges Loadout ausrüsten"},
      {id:'r_market',   en:"Visit the in-game Market & buy one Blueprint",   de:"Markt besuchen & Blueprint kaufen"},
      {id:'r_foundry',  en:"Build something in the Foundry",                  de:"Etwas in der Gießerei bauen"},
    ]},
  { id:'ch2', icon:'⚙️', en:'Chapter 2, Core Systems', de:'Kapitel 2, Kernsysteme', color:'#c8a84b',
    items:[
      {id:'r_junctions', en:"Complete all Planet Junctions up to Jupiter",   de:"Alle Planetenverbindungen bis Jupiter abschließen"},
      {id:'r_orokin',    en:"Install your first Orokin Reactor or Catalyst", de:"Ersten Orokin-Reaktor oder Katalysator einbauen"},
      {id:'r_forma',     en:"Apply your first Forma",                        de:"Ersten Forma anwenden"},
      {id:'r_mr5',       en:"Reach Mastery Rank 5",                          de:"Meisterschaftsrang 5 erreichen"},
      {id:'r_syndicates',en:"Join a Syndicate and earn your first standing",  de:"Syndikat beitreten und erstes Ansehen verdienen"},
      {id:'r_arcanes',   en:"Learn what Arcanes are and how to equip them",  de:"Arcanes kennenlernen und ausrüsten"},
      {id:'r_exilus',    en:"Install an Exilus Adapter on a Warframe",       de:"Exilus-Adapter auf einen Warframe einbauen"},
    ]},
  { id:'ch3', icon:'🌍', en:'Chapter 3, Open Worlds', de:'Kapitel 3, Open Worlds', color:'#58c4f0',
    items:[
      {id:'r_cetus',   en:"Unlock Cetus & Plains of Eidolon (Earth)",        de:"Cetus & Plains of Eidolon freischalten (Erde)"},
      {id:'r_vallis',  en:"Unlock Fortuna & Orb Vallis (Venus)",             de:"Fortuna & Orb Vallis freischalten (Venus)"},
      {id:'r_deimos',  en:"Unlock Necralisk & Cambion Drift (Deimos)",       de:"Necralisk & Cambion Drift freischalten (Deimos)"},
      {id:'r_fishing', en:"Try Fishing in any open world zone",              de:"Angeln in einer Open-World-Zone ausprobieren"},
      {id:'r_mining',  en:"Try Mining in any open world zone",               de:"Bergbau in einer Open-World-Zone ausprobieren"},
      {id:'r_eidolon', en:"Kill your first Eidolon Teralyst at night",       de:"Ersten Eidolon Teralyst nachts besiegen"},
    ]},
  { id:'ch4', icon:'⚡', en:'Chapter 4, Mid-Game Power', de:'Kapitel 4, Mid-Game Stärke', color:'#b57bee',
    items:[
      {id:'r_mr10',       en:"Reach Mastery Rank 10",                         de:"Meisterschaftsrang 10 erreichen"},
      {id:'r_primes',     en:"Build your first complete Prime Warframe",      de:"Ersten kompletten Prime-Warframe bauen"},
      {id:'r_riven',      en:"Obtain and identify your first Riven Mod",      de:"Ersten Riven-Mod erhalten und enthüllen"},
      {id:'r_helminth',   en:"Unlock the Helminth system (after The Sacrifice)",de:"Helminth-System freischalten (nach 'Das Opfer')"},
      {id:'r_galvanized', en:"Equip a Galvanized Mod on a weapon",            de:"Galvanisierten Mod auf eine Waffe ausrüsten"},
      {id:'r_sortie',     en:"Complete your first full Sortie (all 3 missions)",de:"Erste vollständige Sortie abschließen"},
      {id:'r_railjack',   en:"Unlock Railjack (Rising Tide quest)",           de:"Railjack freischalten (Queste 'Steigende Flut')"},
    ]},
  { id:'ch5', icon:'🏆', en:'Chapter 5, Endgame', de:'Kapitel 5, Endgame', color:'#ff9040',
    items:[
      {id:'r_mr20',       en:"Reach Mastery Rank 20",                         de:"Meisterschaftsrang 20 erreichen"},
      {id:'r_steelpath',  en:"Unlock The Steel Path (complete all star chart nodes)",de:"Den Stahlpfad freischalten (alle Sternenkarten-Knoten)"},
      {id:'r_incarnon',   en:"Earn your first Incarnon Genesis from The Circuit",de:"Ersten Incarnon Genesis aus dem Circuit erhalten"},
      {id:'r_archon',     en:"Complete your first Archon Hunt",               de:"Erste Archon-Jagd abschließen"},
      {id:'r_eidolons',   en:"Complete a full Eidolon Tricap",                de:"Vollständigen Eidolon-Tricap abschließen"},
      {id:'r_profittaker',en:"Defeat the Profit-Taker Orb (requires Old Mate rank)",de:"Profit-Taker-Orb besiegen (benötigt 'Alter Freund')"},
      {id:'r_mr30',       en:"Reach Mastery Rank 30, true Tenno!",            de:"Meisterschaftsrang 30 erreichen – echter Tenno!"},
    ]},
];

let _roadmapDone = JSON.parse(localStorage.getItem('th_roadmap') || '[]');
function renderRoadmap() {
  const container = document.getElementById('roadmapContainer');
  if (!container) return;
  const total = ROADMAP.reduce((s,ch) => s + ch.items.length, 0);
  const done  = _roadmapDone.length;
  const pct   = Math.round((done / total) * 100);
  container.innerHTML = `
    <div class="roadmap-progress-bar-wrap">
      <div class="roadmap-progress-header">
        <span class="roadmap-progress-label">${APP.lang==='de'?'Gesamtfortschritt':'Overall Progress'}</span>
        <span class="roadmap-progress-pct">${done} / ${total} (${pct}%)</span>
      </div>
      <div class="roadmap-progress-track">
        <div class="roadmap-progress-fill" style="width:${pct}%"></div>
      </div>
    </div>
    ${ROADMAP.map(ch => renderChapter(ch)).join('')}`;
}
function renderChapter(ch) {
  const total      = ch.items.length;
  const done       = ch.items.filter(i => _roadmapDone.includes(i.id)).length;
  const pct        = Math.round((done / total) * 100);
  const title      = APP.lang==='de' ? ch.de : ch.en;
  const isComplete = done === total;
  const items = ch.items.map(item => {
    const checked = _roadmapDone.includes(item.id);
    const label   = APP.lang==='de' ? item.de : item.en;
    return `<div class="roadmap-item ${checked?'done':''}" onclick="toggleRoadmapItem('${item.id}')">
      <div class="roadmap-checkbox ${checked?'checked':''}">${checked?'✓':''}</div>
      <div class="roadmap-item-label">${label}</div>
    </div>`;
  }).join('');
  return `<div class="roadmap-chapter ${isComplete?'complete':''}">
    <div class="roadmap-chapter-header" onclick="toggleChapter('${ch.id}')">
      <span class="roadmap-ch-icon">${ch.icon}</span>
      <span class="roadmap-ch-title" style="color:${ch.color}">${title}</span>
      <span class="roadmap-ch-count">${done}/${total}</span>
      <div class="roadmap-ch-bar-wrap">
        <div class="roadmap-ch-bar-fill" style="width:${pct}%; background:${ch.color}"></div>
      </div>
      <span class="roadmap-ch-toggle" id="cht-${ch.id}">▼</span>
    </div>
    <div class="roadmap-items" id="chi-${ch.id}">${items}</div>
  </div>`;
}
function toggleChapter(id) {
  const el    = document.getElementById('chi-'+id);
  const arrow = document.getElementById('cht-'+id);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (arrow) arrow.textContent = open ? '▶' : '▼';
}
function toggleRoadmapItem(id) {
  const idx = _roadmapDone.indexOf(id);
  if (idx >= 0) _roadmapDone.splice(idx, 1);
  else _roadmapDone.push(id);
  localStorage.setItem('th_roadmap', JSON.stringify(_roadmapDone));
  renderRoadmap();
}
function resetRoadmap() {
  if (!confirm(APP.lang==='de'?'Gesamten Fortschritt zurücksetzen?':'Reset all roadmap progress?')) return;
  _roadmapDone = [];
  localStorage.setItem('th_roadmap', '[]');
  renderRoadmap();
}

/* ══════════════════════════════════════════════════════════════
   2. RESOURCE FINDER
══════════════════════════════════════════════════════════════ */
const RESOURCE_DB = [
  { en:'Neurodes', de:'Neurodendriten', type:'resource', icon:'🟢',
    locations:[
      {en:'Earth, Everest (Defense) – best early farm', de:'Erde, Everest (Verteidigung) – bestes frühes Farm'},
      {en:'Lua, any mission', de:'Lua, jede Mission'},
      {en:'Deimos, Cambion Drift bounties', de:'Deimos, Cambion Drift Kopfgelder'},
    ], tip_en:'Rare drop on Earth. Defense missions give rotation bonuses.',
       tip_de:'Seltener Drop auf Erde. Verteidigungsmissionen geben Rotations-Boni.' },

  { en:'Orokin Cell', de:'Orokin-Zelle', type:'resource', icon:'🟡',
    locations:[
      /* FIX: "Sargas" (not "Sargus") */
      {en:'Saturn, General Sargas Ruk (boss) or Tethys (Survival)', de:'Saturn, General Sargas Ruk (Boss) oder Tethys (Überleben)'},
      {en:'Ceres, Lt. Lech Kril & Captain Vor (boss)', de:'Ceres, Lt. Lech Kril & Captain Vor (Boss)'},
    ], tip_en:'Best farmed by killing bosses. Nekros increases drop chance.',
       tip_de:'Am besten durch Boss-Kills. Nekros erhöht die Drop-Chance.' },

  { en:'Argon Crystal', de:'Argon-Kristall', type:'resource', icon:'🔷',
    locations:[
      {en:'Void, any mission (⚠ Argon Crystals DECAY after 24 h!)', de:'Leere, jede Mission (⚠ Argon-Kristalle ZERFALLEN nach 24 h!)'},
      {en:'Leere, Ani or Mot (Survival) for large quantities', de:'Leere, Ani oder Mot (Überleben) für große Mengen'},
    ], tip_en:'⚠ Decay after 24 hours! Only farm right before crafting.',
       tip_de:'⚠ Zerfallen nach 24 Stunden! Nur farmen wenn direkt benötigt.' },

  { en:'Neural Sensor', de:'Neuraler Sensor', type:'resource', icon:'🔵',
    locations:[
      {en:'Jupiter, Alad V (boss) or Galilea (Survival)', de:'Jupiter, Alad V (Boss) oder Galilea (Überleben)'},
      {en:'Jupiter, Themisto (Assassination) – kill Alad V repeatedly', de:'Jupiter, Themisto (Attentat) – Alad V wiederholt töten'},
    ], tip_en:'Drop from Jupiter enemies and Alad V boss.',
       tip_de:'Drop von Jupiter-Feinden und Alad V Boss.' },

  { en:'Control Module', de:'Steuermodul', type:'resource', icon:'🔴',
    locations:[
      {en:'Neptune, Proteus (Survival) or any Neptune mission', de:'Neptun, Proteus (Überleben) oder jede Neptun-Mission'},
      {en:'Europa, any mission', de:'Europa, jede Mission'},
      {en:'Void, any mission (common drop)', de:'Leere, jede Mission (häufiger Drop)'},
    ], tip_en:'Very common in Void missions.',
       tip_de:'Sehr häufig in Void-Missionen.' },

  { en:'Morphics', de:'Morphics', type:'resource', icon:'🟠',
    locations:[
      {en:'Mercury, Captain Vor (boss) at Tolstoj, or any Mercury mission', de:'Merkur, Captain Vor (Boss) bei Tolstoj, oder jede Merkur-Mission'},
      {en:'Mars, any mission', de:'Mars, jede Mission'},
    ], tip_en:'One of the most needed early resources. Farm Mercury boss.',
       tip_de:'Eine der am meisten benötigten frühen Ressourcen. Merkur-Boss farmen.' },

  { en:'Plastids', de:'Plastoide', type:'resource', icon:'🟤',
    locations:[
      {en:'Saturn, Cassini (Capture) – fastest farm', de:'Saturn, Cassini (Gefangennahme) – schnellstes Farm'},
      {en:'Uranus, any mission', de:'Uranus, jede Mission'},
      {en:'Phobos, any mission', de:'Phobos, jede Mission'},
    ], tip_en:'Cassini on Saturn is the fastest farm.',
       tip_de:'Cassini auf Saturn ist das schnellste Farm.' },

  { en:'Polymer Bundle', de:'Polymer-Bündel', type:'resource', icon:'⚪',
    locations:[
      {en:'Mercury, any mission (very common)', de:'Merkur, jede Mission (sehr häufig)'},
      {en:'Venus, any mission', de:'Venus, jede Mission'},
      {en:'Uranus, any mission', de:'Uranus, jede Mission'},
    ], tip_en:'Extremely common early game resource.',
       tip_de:'Extrem häufige frühe Ressource.' },

  { en:'Ferrite', de:'Ferrit', type:'resource', icon:'⚫',
    locations:[
      {en:'Mercury, any mission (common)', de:'Merkur, jede Mission (häufig)'},
      {en:'Earth, any mission', de:'Erde, jede Mission'},
      {en:'Neptune, any mission (late game)', de:'Neptun, jede Mission (Endgame)'},
    ], tip_en:'Very common. You will naturally accumulate plenty.',
       tip_de:'Sehr häufig. Sammelt sich automatisch an.' },

  { en:'Alloy Plate', de:'Legierungsplatte', type:'resource', icon:'🔘',
    locations:[
      {en:'Venus, any mission (common)', de:'Venus, jede Mission (häufig)'},
      {en:'Jupiter, any mission', de:'Jupiter, jede Mission'},
      {en:'Sedna, any mission (large quantities)', de:'Sedna, jede Mission (große Mengen)'},
    ], tip_en:'Very common. Sedna gives the most per run.',
       tip_de:'Sehr häufig. Sedna gibt die meisten pro Run.' },

  { en:'Gallium', de:'Gallium', type:'resource', icon:'🟣',
    locations:[
      {en:'Mars, Tharsis (Defense) or any Mars mission', de:'Mars, Tharsis (Verteidigung) oder jede Mars-Mission'},
      {en:'Uranus, any mission', de:'Uranus, jede Mission'},
    ], tip_en:'Uncommon drop on Mars and Uranus.',
       tip_de:'Seltener Drop auf Mars und Uranus.' },

  { en:'Tellurium', de:'Tellur', type:'resource', icon:'🌊',
    locations:[
      {en:'Archwing missions – best source', de:'Archwing-Missionen – beste Quelle'},
      {en:'Uranus, Ophelia (Survival) with Archwing section', de:'Uranus, Ophelia (Überleben) mit Archwing-Abschnitt'},
      {en:'Salacia (Neptune), Archwing Exterminate', de:'Salacia (Neptun), Archwing-Vernichtung'},
    ], tip_en:'Only drops in Archwing combat zones.',
       tip_de:'Droppt nur in Archwing-Kampfzonen.' },

  { en:'Oxium', de:'Oxium', type:'resource', icon:'🔆',
    locations:[
      {en:'Jupiter, Io (Defense) – Oxium Ospreys spawn here', de:'Jupiter, Io (Verteidigung) – Oxium-Drohnen spawnen hier'},
      {en:'⚠ Kill Oxium Ospreys before they self-destruct!', de:'⚠ Oxium-Drohnen töten bevor sie sich selbst zerstören!'},
    ], tip_en:'⚠ Ospreys must be killed before self-destructing or they drop nothing!',
       tip_de:'⚠ Drohnen müssen getötet werden bevor sie sich selbst zerstören!' },

  /* Warframes */
  { en:'Rhino', de:'Rhino', type:'warframe', icon:'🦏',
    locations:[{en:'Venus, Jackal boss at Fossa', de:'Venus, Jackal-Boss bei Fossa'}],
    tip_en:'Best starter Warframe. Iron Skin is near-immortal.',
    tip_de:'Bester Starter-Warframe. Iron Skin macht ihn fast unsterblich.' },

  { en:'Mag', de:'Mag', type:'warframe', icon:'🧲',
    locations:[{en:'Phobos, The Sergeant boss at Iliad', de:'Phobos, The Sergeant Boss bei Iliad'}],
    tip_en:'Strong crowd control and shield manipulation.',
    tip_de:'Starke Feindkontrolle und Schild-Manipulation.' },

  { en:'Volt', de:'Volt', type:'warframe', icon:'⚡',
    locations:[
      {en:'Dojo, Tenno Lab Research (requires Clan)', de:'Dojo, Tenno Labor Forschung (benötigt Clan)'},
      {en:'OR: Teshin (Steel Path) for Volt Prime Relics', de:'ODER: Teshin (Stahlpfad) für Volt Prime Relics'},
    ], tip_en:'Requires a Clan Dojo. Great early speedster.',
       tip_de:'Benötigt ein Clan-Dojo. Toller Geschwindigkeits-Frame.' },

  { en:'Ash', de:'Ash', type:'warframe', icon:'🗡️',
    locations:[
      {en:'Manics – found in Grineer Sealab tileset missions', de:'Manics – in Grineer-Sealab-Tileset-Missionen'},
    ], tip_en:'Manics are rare. Bring patience.',
       tip_de:'Manics sind selten. Geduld mitbringen.' },

  { en:'Mesa', de:'Mesa', type:'warframe', icon:'🤠',
    locations:[
      {en:'Mutalist Alad V, Eris (Mutalist Coordinates needed)', de:'Mutalisten-Alad V, Eris (Mutalisten-Koordinaten benötigt)'},
      {en:'Build Mutalist Coordinates from Invasion rewards', de:'Mutalisten-Koordinaten aus Invasionsbelohnungen bauen'},
    ], tip_en:'Farm Invasions for Mutalist Coordinates!',
       tip_de:'Invasionen für Mutalisten-Koordinaten farmen!' },

  { en:'Nekros', de:'Nekros', type:'warframe', icon:'💀',
    locations:[{en:'Lephantis boss, Deimos, Magnacidium', de:'Lephantis Boss, Deimos, Magnacidium'}],
    tip_en:'Desecrate doubles loot. ESSENTIAL for farming.',
    tip_de:'Desecrate verdoppelt Loot. ESSENTIELL fürs Farming.' },

  /* Mods */
  { en:'Serration', de:'Aufsatz', type:'mod', icon:'⬟',
    locations:[
      {en:'General drop, any mission (uncommon)', de:'Allgemeiner Drop, jede Mission (ungewöhnlich)'},
      {en:'Steel Meridian Syndicate offerings', de:'Steel Meridian Syndikatsangebote'},
      {en:'Trade chat or warframe.market', de:'Handelschat oder warframe.market'},
    ], tip_en:'Most important damage mod for primary weapons. Max rank = +165% damage!',
       tip_de:'Wichtigster Schaden-Mod für Primärwaffen. Max-Rang = +165% Schaden!' },

  { en:'Vitality', de:'Vitalität', type:'mod', icon:'❤️',
    locations:[
      {en:'General drop, very common (any mission)', de:'Allgemeiner Drop, sehr häufig (jede Mission)'},
      {en:"Often given in Tutorial / Vor's Prize", de:"Oft im Tutorial / Vor's Preis gegeben"},
    ], tip_en:'Single most important Warframe survivability mod. Always max this.',
       tip_de:'Wichtigster Überlebens-Mod für Warframes. Immer auf Max.' },

  { en:'Streamline', de:'Stromlinienform', type:'mod', icon:'⬟',
    locations:[
      {en:'Orokin-Leere, treasure rooms (rare)', de:'Orokin-Leere, Schatzkammern (selten)'},
      {en:'Trade chat or warframe.market', de:'Handelschat oder warframe.market'},
    ], tip_en:'Reduces Ability Energy cost. Essential for ability-heavy frames.',
       tip_de:'Reduziert Energie-Kosten. Essenziell für Fähigkeits-Frames.' },

  { en:'Flow', de:'Fluss', type:'mod', icon:'⬟',
    locations:[
      {en:'Orokin-Leere, general drop', de:'Orokin-Leere, allgemeiner Drop'},
      {en:'Trade chat or warframe.market', de:'Handelschat oder warframe.market'},
    ], tip_en:'Increases maximum Energy pool. Use with Streamline.',
       tip_de:'Erhöht den maximalen Energievorrat. Mit Stromlinienform kombinieren.' },
];

let _resFilter = 'all';
let _resSearchTimer = null;
function setResFilter(f, btn) {
  _resFilter = f;
  document.querySelectorAll('.res-filter-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderResGrid(document.getElementById('resSearch')?.value || '');
}
function onResSearch(v) {
  if (_resSearchTimer) clearTimeout(_resSearchTimer);
  _resSearchTimer = setTimeout(() => renderResGrid(v), 120);
}
function renderResGrid(query) {
  const grid = document.getElementById('resGrid');
  if (!grid) return;
  const q = (query||'').trim().toLowerCase();
  let results = RESOURCE_DB;
  if (_resFilter !== 'all') results = results.filter(r => r.type === _resFilter);
  if (q.length >= 2) {
    results = results.filter(r =>
      r.en.toLowerCase().includes(q) || r.de.toLowerCase().includes(q) ||
      r.locations.some(l => (APP.lang==='de'?l.de:l.en).toLowerCase().includes(q))
    );
  }
  if (!results.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${APP.lang==='de'?'Keine Ergebnisse':'No results'}</div>`;
    return;
  }
  grid.innerHTML = results.map(r => {
    const name = APP.lang==='de' ? r.de : r.en;
    const tip  = APP.lang==='de' ? r.tip_de : r.tip_en;
    const locs = r.locations.map(l => `
      <div class="res-loc-row">
        <span class="res-loc-bullet">▸</span>
        <span>${APP.lang==='de' ? l.de : l.en}</span>
      </div>`).join('');
    const typeLabel = {resource:APP.lang==='de'?'Ressource':'Resource', warframe:'Warframe', mod:'Mod'}[r.type] || r.type;
    return `<div class="res-card">
      <div class="res-card-top">
        <span class="res-icon">${r.icon}</span>
        <div>
          <div class="res-name">${name}</div>
          <div class="res-type-badge res-type-${r.type}">${typeLabel}</div>
        </div>
        <a class="res-wiki-btn"
           href="https://wiki.warframe.com/w/${r.en.replace(/ /g,'_')}"
           target="_blank" rel="noopener" title="Warframe Wiki">📖</a>
      </div>
      <div class="res-locs">${locs}</div>
      ${tip ? `<div class="res-tip">${tip}</div>` : ''}
    </div>`;
  }).join('');
}
function initResourceFinder() {
  renderResGrid(document.getElementById('resSearch')?.value || '');
}

/* ══════════════════════════════════════════════════════════════
   3. DAILY CHECKLIST
   FIX: Weekly items stored separately with weekly UTC reset
══════════════════════════════════════════════════════════════ */
const DAILY_ITEMS = [
  { id:'d_sortie',    group:'daily',   priority:'high',   icon:'⚡',
    en:'Complete the Daily Sortie (3 missions)',
    de:'Tägliche Sortie abschließen (3 Missionen)',
    reward_en:'Exilus Adapter / Anasa / Legendary Core / Riven Mod',
    reward_de:'Exilus-Adapter / Anasa / Legendärer Kern / Riven-Mod',
    tip_en:'Best single daily. Takes ~20 min. Never skip if you have time.',
    tip_de:'Beste tägliche Aktivität. Dauert ca. 20 Min. Nie überspringen.' },
  { id:'d_synthesis', group:'daily',   priority:'medium', icon:'🔬',
    en:'Complete your Simaris Daily Synthesis Target',
    de:'Simaris Tages-Synthese-Ziel abschließen',
    reward_en:'Standing with Cephalon Simaris (unique Mods)',
    reward_de:'Ansehen bei Cephalon Simaris (einzigartige Mods)',
    tip_en:'Talk to Simaris in any Relay.',
    tip_de:'Mit Simaris in einem Relay sprechen.' },
  { id:'d_challenges',group:'daily',   priority:'high',   icon:'◉',
    en:'Complete active Nightwave Daily Challenges',
    de:'Aktive Nightwave-Tages-Herausforderungen abschließen',
    reward_en:'Nightwave Standing (buy Helmets, Forma, Arcanes)',
    reward_de:'Nightwave-Ansehen (Helme, Forma, Arcanes kaufen)',
    tip_en:'Dailies give 1000 standing each.',
    tip_de:'Tages-Challenges geben je 1000 Ansehen.' },
  { id:'d_invasions', group:'daily',   priority:'medium', icon:'⚔',
    en:'Check Invasions for Fieldron / Detonite / Mutagen',
    de:'Invasionen auf Fieldron / Detonit / Mutagen prüfen',
    reward_en:'Fieldron Samples, Detonite Injectors, Mutagen Samples',
    reward_de:'Fieldron-Proben, Detonit-Injektoren, Mutagen-Proben',
    tip_en:'Always needed for Clan research.',
    tip_de:'Werden immer für Clan-Forschung gebraucht.' },
  { id:'d_arbitration',group:'daily',  priority:'low',    icon:'🎯',
    en:'Run Arbitration (if good mission type)',
    de:'Schiedsgericht durchführen (wenn guter Missionstyp)',
    reward_en:'Vitus Essence, Aura Mods, Arcanes',
    reward_de:'Vitus-Essenz, Aura-Mods, Arcanes',
    tip_en:'Only one life! Best: Survival, Defense, Interception.',
    tip_de:'Nur ein Leben! Beste Typen: Überleben, Verteidigung, Unterbrechung.' },
  /* WEEKLY — stored in separate th_weekly key (ISO week reset) */
  { id:'w_nightwave', group:'weekly',  priority:'high',   icon:'◉',
    en:'Complete Weekly Nightwave Challenges',
    de:'Wöchentliche Nightwave-Herausforderungen abschließen',
    reward_en:'3 000 standing each · Elite weekly: 5 000 each',
    reward_de:'Je 3 000 Ansehen · Elite-Wöchentlich: je 5 000',
    tip_en:'Elite challenges are harder but worth 5 000 standing.',
    tip_de:'Elite-Herausforderungen geben 5 000 Ansehen.' },
  { id:'w_circuit',   group:'weekly',  priority:'medium', icon:'🌀',
    en:'Complete The Circuit (Duviri) – earn Incarnon Genesis',
    de:'Den Circuit (Duviri) abschließen – Incarnon Genesis verdienen',
    reward_en:'Incarnon Genesis weapon upgrades (weekly rotation)',
    reward_de:'Incarnon Genesis Waffen-Upgrades (wöchentliche Rotation)',
    tip_en:'New rotation every week. Check which Incarnon is available.',
    tip_de:'Neue Rotation jede Woche. Prüfen welcher Incarnon verfügbar ist.' },
  /* STANDING CAPS */
  { id:'s_syndicate', group:'standing',priority:'medium', icon:'🏛',
    en:'Hit your Syndicate Standing cap',
    de:'Syndikat-Ansehen-Cap erreichen',
    reward_en:'Exclusive Syndicate Weapons, Augment Mods, Arcanes',
    reward_de:'Exklusive Syndikat-Waffen, Augment-Mods, Arcanes',
    tip_en:'Equip your Syndicate Sigil (Appearance tab) to earn standing.',
    tip_de:'Syndikat-Sigil ausrüsten (Erscheinungs-Tab) um Ansehen zu verdienen.' },
  { id:'s_cetus',     group:'standing',priority:'low',    icon:'🌙',
    en:'Farm Cetus Standing (Ostron) up to daily cap',
    de:'Cetus-Ansehen (Ostron) bis zum Tages-Cap farmen',
    reward_en:'Warframe parts, Arcanes, Eidolon Hunt gear',
    reward_de:'Warframe-Teile, Arcanes, Eidolon-Jagd-Ausrüstung',
    tip_en:'Cetus bounties give Standing, resources and parts simultaneously.',
    tip_de:'Cetus-Kopfgelder geben Ansehen, Ressourcen und Teile gleichzeitig.' },
  { id:'s_fortuna',   group:'standing',priority:'low',    icon:'❄️',
    en:'Farm Fortuna Standing (Solaris United) up to daily cap',
    de:'Fortuna-Ansehen (Solaris United) bis zum Tages-Cap farmen',
    reward_en:'Kitgun parts, MOA companions, Profit-Taker gear',
    reward_de:'Kitgun-Teile, MOA-Begleiter, Profit-Taker-Ausrüstung',
    tip_en:'Orb Vallis bounties are the fastest source.',
    tip_de:'Orb-Vallis-Kopfgelder sind die schnellste Quelle.' },
];

const DAILY_GROUPS = {
  daily:    { en:'Daily Activities',     de:'Tägliche Aktivitäten',     icon:'☀️', color:'var(--gold)' },
  weekly:   { en:'Weekly Activities',    de:'Wöchentliche Aktivitäten', icon:'📅', color:'var(--void)' },
  standing: { en:'Standing Caps',        de:'Ansehen-Caps',             icon:'🏆', color:'var(--purple)' },
};
const PRIORITY_CHIP = {
  high:   { cls:'prio-high',   en:'Must Do',     de:'Pflicht' },
  medium: { cls:'prio-medium', en:'Recommended', de:'Empfohlen' },
  low:    { cls:'prio-low',    en:'Optional',    de:'Optional' },
};

/* Separate storage: daily items vs weekly items */
function _getISOWeek() {
  const d  = new Date();
  const ms = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const wd = new Date(ms);
  wd.setUTCDate(wd.getUTCDate() + 4 - (wd.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(wd.getUTCFullYear(), 0, 1));
  return `${wd.getUTCFullYear()}-W${Math.ceil(((wd - yearStart) / 86400000 + 1) / 7)}`;
}
let _dailyDone  = _loadDailyDone();
let _weeklyDone = _loadWeeklyDone();

function _loadDailyDone() {
  try {
    const raw  = localStorage.getItem('th_daily');
    if (!raw) return { date:'', items:[] };
    const data = JSON.parse(raw);
    const todayUTC = new Date().toISOString().slice(0, 10);
    if (data.date !== todayUTC) return { date: todayUTC, items:[] };
    return data;
  } catch(e) { return { date:'', items:[] }; }
}
function _saveDailyDone() {
  _dailyDone.date = new Date().toISOString().slice(0, 10);
  localStorage.setItem('th_daily', JSON.stringify(_dailyDone));
}
function _loadWeeklyDone() {
  try {
    const raw  = localStorage.getItem('th_weekly');
    if (!raw) return { week:'', items:[] };
    const data = JSON.parse(raw);
    if (data.week !== _getISOWeek()) return { week: _getISOWeek(), items:[] };
    return data;
  } catch(e) { return { week:'', items:[] }; }
}
function _saveWeeklyDone() {
  _weeklyDone.week = _getISOWeek();
  localStorage.setItem('th_weekly', JSON.stringify(_weeklyDone));
}
function _isDone(id, group) {
  return group === 'weekly'
    ? _weeklyDone.items.includes(id)
    : _dailyDone.items.includes(id);
}

function renderDailyChecklist() {
  const container = document.getElementById('dailyContainer');
  if (!container) return;
  const nonWeekly = DAILY_ITEMS.filter(i => i.group !== 'weekly');
  const done      = nonWeekly.filter(i => _isDone(i.id, i.group)).length;
  const now       = new Date();
  const nextMid   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const msLeft    = nextMid - now;

  container.innerHTML = `
    <div class="daily-top-bar">
      <div class="daily-progress-chip">📊 ${done}/${nonWeekly.length} ${APP.lang==='de'?'heute erledigt':'done today'}</div>
      <div class="daily-reset-bar">
        <span>🕛 ${APP.lang==='de'?'Nächster Reset in':'Next reset in'}: <strong id="dailyResetTimer">${fmtMsLong(msLeft)}</strong></span>
      </div>
      <button class="daily-reset-btn" onclick="resetDaily()">↺ ${APP.lang==='de'?'Heute zurücksetzen':'Reset today'}</button>
    </div>
    ${Object.entries(DAILY_GROUPS).map(([groupKey, group]) => {
      const items     = DAILY_ITEMS.filter(i => i.group === groupKey);
      const groupDone = items.filter(i => _isDone(i.id, groupKey)).length;
      return `<div class="daily-group">
        <div class="daily-group-header">
          <span class="daily-group-icon">${group.icon}</span>
          <span class="daily-group-title" style="color:${group.color}">${APP.lang==='de'?group.de:group.en}</span>
          <span class="daily-group-count">${groupDone}/${items.length}</span>
        </div>
        ${items.map(item => {
          const checked = _isDone(item.id, item.group);
          const prio    = PRIORITY_CHIP[item.priority] || PRIORITY_CHIP.low;
          const label   = APP.lang==='de' ? item.de   : item.en;
          const reward  = APP.lang==='de' ? item.reward_de : item.reward_en;
          const tip     = APP.lang==='de' ? item.tip_de   : item.tip_en;
          return `<div class="daily-item ${checked?'done':''}" onclick="toggleDailyItem('${item.id}','${item.group}')">
            <div class="daily-checkbox ${checked?'checked':''}">${checked?'✓':''}</div>
            <div class="daily-body">
              <div class="daily-item-top">
                <span class="daily-item-icon">${item.icon}</span>
                <span class="daily-item-label">${label}</span>
                <span class="daily-prio ${prio.cls}">${APP.lang==='de'?prio.de:prio.en}</span>
              </div>
              <div class="daily-reward">◆ ${reward}</div>
              <div class="daily-tip">${tip}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('')}`;

  if (APP.timers.dailyReset) clearInterval(APP.timers.dailyReset);
  APP.timers.dailyReset = setInterval(() => {
    const el = document.getElementById('dailyResetTimer');
    if (!el) { clearInterval(APP.timers.dailyReset); return; }
    const ms = nextMid - Date.now();
    if (ms <= 0) { _dailyDone = _loadDailyDone(); renderDailyChecklist(); return; }
    el.textContent = fmtMsLong(ms);
  }, 1000);
}

function toggleDailyItem(id, group) {
  if (group === 'weekly') {
    const idx = _weeklyDone.items.indexOf(id);
    if (idx >= 0) _weeklyDone.items.splice(idx, 1);
    else _weeklyDone.items.push(id);
    _saveWeeklyDone();
  } else {
    const idx = _dailyDone.items.indexOf(id);
    if (idx >= 0) _dailyDone.items.splice(idx, 1);
    else _dailyDone.items.push(id);
    _saveDailyDone();
  }
  renderDailyChecklist();
}
function resetDaily() {
  if (!confirm(APP.lang==='de'?'Heutige Checkliste zurücksetzen?':'Reset today\'s checklist?')) return;
  _dailyDone.items = [];
  _saveDailyDone();
  renderDailyChecklist();
}

/* ══════════════════════════════════════════════════════════════
   4. SYNDICATE STANDING CALCULATOR
══════════════════════════════════════════════════════════════ */
const SYNDICATES = [
  { id:'steel',    en:'Steel Meridian',    de:'Steel Meridian',    color:'#e03030' },
  { id:'arbiters', en:'Arbiters of Hexis', de:'Arbiters of Hexis', color:'#ffe080' },
  { id:'cephalon', en:'Cephalon Suda',     de:'Cephalon Suda',     color:'#80e0ff' },
  { id:'perrin',   en:'The Perrin Sequence',de:'The Perrin Sequence',color:'#80ff80' },
  { id:'red',      en:'Red Veil',          de:'Red Veil',          color:'#ff4060' },
  { id:'loka',     en:'New Loka',          de:'New Loka',          color:'#a0ff80' },
];

function renderSyndicateCalc() {
  const el = document.getElementById('syndicateCalc');
  if (!el) return;
  const mr = parseInt(document.getElementById('synMR')?.value || '1', 10);
  /* Standing cap formula: 16 000 × (MR + 1) */
  const cap     = 16000 * (Math.max(0, mr) + 1);
  const capFmt  = cap.toLocaleString();
  el.innerHTML = `
    <div class="syn-cap-result">
      <span class="syn-cap-label">${APP.lang==='de'?'Täglicher Cap bei MR':'Daily cap at MR'} ${mr}:</span>
      <span class="syn-cap-value">◉ ${capFmt} ${APP.lang==='de'?'Ansehen':'Standing'}</span>
    </div>
    <div class="syn-tip">${APP.lang==='de'
      ?'Trage dein Syndikat-Sigil (Erscheinungs-Tab) um während Missionen Ansehen zu verdienen.'
      :'Equip your Syndicate Sigil (Appearance tab) to earn standing during missions.'}</div>
    <div class="syn-grid">
      ${SYNDICATES.map(s => `
        <div class="syn-card">
          <div class="syn-dot" style="background:${s.color}"></div>
          <div class="syn-name">${APP.lang==='de'?s.de:s.en}</div>
          <div class="syn-cap-mini">≤ ${capFmt}</div>
        </div>`).join('')}
    </div>
    <div class="syn-note">${APP.lang==='de'
      ?'Alliierte Syndikat-Fraktionen erhalten 50 % Ihres Ansehens als Bonus-Ansehen.'
      :'Allied syndicates receive 50% of your earned standing as bonus standing.'}</div>`;
}
