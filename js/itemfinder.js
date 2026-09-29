/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · itemfinder.js  v5.2
   Live Mod & Item Finder via drops.warframestat.us
   → Alle Mods aus den echten Warframe Drop-Tabellen
═══════════════════════════════════════════════════════════════ */

const DROPS_BASE = 'https://drops.warframestat.us/data';
const IF_CACHE_KEY = 'th_drops_mods_v3';   // v3: v2 held mods without drop sources (live data uses enemies[], not drops[])
const IF_BP_CACHE_KEY = 'th_drops_bps_v1';
const IF_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

let _ifAllMods  = null;   // { modName → [{place, rarity, chance}] }
let _ifAllBps   = null;   // { itemName → [{place, rarity, chance}] } (Blueprints/Teile via blueprintLocations.json)
let _ifLoading  = false;
let _ifSearch   = '';
let _ifMode     = 'mod';  // 'mod' | 'bp' | 'item'
let _ifTimer    = null;

/* ── Static Item DB (currencies, upgrades) ── */
const ITEM_DB = [
  { en:'Platinum',          de:'Platin',           cat:'currency', icon:'◆',
    tip_en:'Premium currency. Buy Warframe/weapon slots, Reactors, Catalysts. NEVER buy Warframes – farm them!',
    tip_de:'Premium-Währung. Für Slots, Reaktoren, Katalysatoren ausgeben. NIEMALS Warframes kaufen – farmen!',
    sources:[
      {en:'Buy from in-game Market',                  de:'Im Spiel-Markt kaufen'},
      {en:'Trade Prime parts, Arcanes, Rivens with other players', de:'Prime-Teile, Arcanes, Rivens mit anderen Spielern handeln'},
      {en:'warframe.market – best prices',             de:'warframe.market – beste Preise'},
    ]},
  { en:'Ducats',            de:'Dukaten',           cat:'currency', icon:'⬟',
    tip_en:"Used exclusively to buy from Baro Ki'Teer.",
    tip_de:"Ausschließlich für Käufe bei Baro Ki'Teer.",
    sources:[
      {en:'Trade Prime parts at Ducat Kiosk in any Relay', de:'Prime-Teile am Dukaten-Kiosk in jedem Relay tauschen'},
      {en:'Common Prime = 15 ◆ · Uncommon = 45 ◆ · Rare = 100 ◆', de:'Gewöhnlich = 15 ◆ · Ungewöhnlich = 45 ◆ · Selten = 100 ◆'},
    ]},
  { en:'Credits',           de:'Credits',           cat:'currency', icon:'₿',
    tip_en:'The Index on Neptune is the fastest Credit farm.',
    tip_de:'Der Index auf Neptun ist das schnellste Credit-Farm.',
    sources:[
      {en:'Any mission (scales with level)',            de:'Jede Mission (skaliert mit Level)'},
      {en:'The Index – Neptune (best farm)',            de:'The Index – Neptun (bestes Farm)'},
      {en:'Void Credit Caches',                        de:'Leere-Credit-Caches'},
    ]},
  { en:'Steel Essence',     de:'Stahlessenz',       cat:'currency', icon:'⚔',
    tip_en:'Steel Path currency. Buy Arcanes, Kuva, Relic Packs from Teshin.',
    tip_de:'Stahlpfad-Währung. Bei Teshin Arcanes, Kuva, Relic-Packs kaufen.',
    sources:[
      {en:'Acolyte kills in Steel Path missions',       de:'Acolyten-Kills in Stahlpfad-Missionen'},
      {en:'Daily Steel Path Acolyte (guaranteed 6)',    de:'Täglicher Stahlpfad-Acolyte (garantiert 6)'},
    ]},
  { en:'Vitus Essence',     de:'Vitus-Essenz',      cat:'currency', icon:'✦',
    tip_en:'Buy Galvanized Mods, Aura Mods and Archon Shards from Arbiters of Hexis.',
    tip_de:'Galvanisierte Mods, Aura-Mods und Archon-Scherben bei Arbiters of Hexis kaufen.',
    sources:[
      {en:'Arbitration missions – from Arbitration Drones', de:'Arbitrierungs-Missionen – von Arbitrierungs-Drohnen'},
      {en:'~2–4 Vitus per Arbitration run',             de:'~2–4 Vitus pro Arbitrierungs-Run'},
    ]},
  { en:'Kuva',              de:'Kuva',              cat:'currency', icon:'🔴',
    tip_en:'Used to reroll Riven Mods and obtain Kuva Weapons.',
    tip_de:'Zum Neu-Würfeln von Riven-Mods und zum Erhalten von Kuva-Waffen.',
    sources:[
      {en:'Kuva Siphon missions on Kuva Fortress',      de:'Kuva-Siphon-Missionen auf der Kuva-Festung'},
      {en:'Kuva Survival (best rate – 300/min)',        de:'Kuva-Überleben (beste Rate – 300/Min.)'},
      {en:"Teshin (Steel Path) – 6 000 per Essence",    de:'Teshin (Stahlpfad) – 6.000 pro Essenz'},
    ]},
  { en:'Forma',             de:'Forma',             cat:'crafting', icon:'◇',
    tip_en:'You will NEVER have enough. Always build the Blueprint immediately when you get one.',
    tip_de:'Du wirst NIE genug haben. Den Blueprint immer sofort bauen wenn du einen bekommst.',
    sources:[
      {en:'Void Relic drops (all tiers, very common)',  de:'Void-Relic-Drops (alle Tiers, sehr häufig)'},
      {en:'Nightwave Shop (10 Wolf Credits)',           de:'Nightwave-Shop (10 Wolfs-Credits)'},
      {en:'Sortie reward',                             de:'Sortie-Belohnung'},
      {en:'Market – 3-pack for 35 Platinum',           de:'Markt – 3er-Pack für 35 Platin'},
    ]},
  { en:'Orokin Reactor',    de:'Orokin-Reaktor',    cat:'upgrade',  icon:'⚡',
    tip_en:"Doubles mod capacity on Warframes. NEVER buy with Plat – wait for Alerts or Nightwave.",
    tip_de:'Verdoppelt Mod-Kapazität bei Warframes. NIEMALS mit Platin kaufen – auf Alarme oder Nightwave warten.',
    sources:[
      {en:'Alerts (rare – always check TENNO.HUB!)',   de:'Alarme (selten – immer TENNO.HUB prüfen!)'},
      {en:'Nightwave Shop (50 Wolf Credits)',           de:'Nightwave-Shop (50 Wolfs-Credits)'},
      {en:'Sortie reward (rotation C)',                de:'Sortie-Belohnung (Rotation C)'},
      {en:'Market – 20 Platinum (emergency only)',     de:'Markt – 20 Platin (nur im Notfall)'},
    ]},
  { en:'Orokin Catalyst',   de:'Orokin-Katalysator', cat:'upgrade', icon:'🔵',
    tip_en:"Doubles mod capacity on weapons. Same advice as Reactor – wait for free sources.",
    tip_de:'Verdoppelt Mod-Kapazität bei Waffen. Gleicher Tipp wie Reaktor – auf kostenlose Quellen warten.',
    sources:[
      {en:'Alerts (rare)',                             de:'Alarme (selten)'},
      {en:'Nightwave Shop (50 Wolf Credits)',           de:'Nightwave-Shop (50 Wolfs-Credits)'},
      {en:'Sortie reward',                             de:'Sortie-Belohnung'},
      {en:'Market – 20 Platinum',                     de:'Markt – 20 Platin'},
    ]},
  { en:'Exilus Adapter',    de:'Exilus-Adapter',    cat:'upgrade',  icon:'◈',
    tip_en:'Free Blueprint in Market – craft it instead of buying the finished item (75 Plat).',
    tip_de:'Kostenloser Blueprint im Markt – bauen statt fertiges Item kaufen (75 Platin).',
    sources:[
      {en:'Sortie reward (most common)',               de:'Sortie-Belohnung (häufigste)'},
      {en:'Arbitration Shop (Vitus Essence)',          de:'Arbitrierungs-Shop (Vitus-Essenz)'},
      {en:'Nightwave Shop (50 Wolf Credits)',          de:'Nightwave-Shop (50 Wolfs-Credits)'},
      {en:'Craft from Blueprint – Market: free BP',    de:'Aus Blueprint bauen – Markt: kostenloser BP'},
    ]},
  { en:'Riven Mod',         de:'Riven-Mod',         cat:'mod',      icon:'⬟',
    tip_en:'Random weapon-specific mods. Value varies wildly. Unveil by completing a hidden challenge.',
    tip_de:'Zufällige waffenspezifische Mods. Wert variiert stark. Durch versteckte Herausforderung enthüllen.',
    sources:[
      {en:'Sortie reward (A/B/C rotations)',           de:'Sortie-Belohnung (A/B/C-Rotationen)'},
      {en:'Nightwave Shop (150 Wolf Credits)',         de:'Nightwave-Shop (150 Wolfs-Credits)'},
      {en:'Trade with other players',                  de:'Mit anderen Spielern handeln'},
    ]},
  { en:'Arcane Energize',   de:'Arcane Energize',   cat:'arcane',   icon:'✦',
    tip_en:'Best energy Arcane. On Energy Orb pickup → 150 energy to self and nearby allies.',
    tip_de:'Bester Energie-Arcane. Bei Energierotkugel-Aufnahme → 150 Energie für dich und nahegelegene Verbündete.',
    sources:[
      {en:'Eidolon Hydrolyst (Tricap) – rarest Teralyst drop', de:'Eidolon Hydrolyst (Tricap) – seltenster Teralyst-Drop'},
      {en:'Trade / warframe.market (expensive)',       de:'Handel / warframe.market (teuer)'},
    ]},
  { en:'Archon Shard',      de:'Archon-Scherbe',    cat:'upgrade',  icon:'🔷',
    tip_en:'Unique stat boost per Warframe. Earn from Archon Hunt (weekly) or Steel Path shop.',
    tip_de:'Einzigartiger Stat-Boost pro Warframe. Aus Archon-Jagd (wöchentlich) oder Stahlpfad-Shop.',
    sources:[
      {en:'Archon Hunt – weekly reward',               de:'Archon-Jagd – wöchentliche Belohnung'},
      {en:'Teshin Steel Path Shop (Steel Essence)',    de:'Teshin Stahlpfad-Shop (Stahlessenz)'},
    ]},
  { en:'Wolf Credits',      de:'Wolfs-Credits',     cat:'currency', icon:'◉',
    tip_en:'Nightwave currency. Spend in Nightwave shop on Forma, Reactors, Catalysts, Rare mods.',
    tip_de:'Nightwave-Währung. Im Nightwave-Shop für Forma, Reaktoren, Katalysatoren, Seltene Mods ausgeben.',
    sources:[
      {en:'Level up Nightwave Tier (50 per tier)',     de:'Nightwave-Tier aufsteigen (50 pro Tier)'},
    ]},
];

const ITEM_CAT_LABELS = {
  all:      { en:'All',       de:'Alle'      },
  currency: { en:'Currency',  de:'Währungen' },
  crafting: { en:'Crafting',  de:'Crafting'  },
  upgrade:  { en:'Upgrades',  de:'Upgrades'  },
  arcane:   { en:'Arcanes',   de:'Arcanes'   },
  mod:      { en:'Mods',      de:'Mods'      },
};

let _ifItemCat = 'all';

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */
function initItemFinder() {
  _renderModeModes();
  if (_ifMode === 'mod') _loadModData();
  else if (_ifMode === 'bp') _loadBpData();
  else renderItemFinder();
}

function _renderModeModes() {
  const bar = document.getElementById('ifModeBar');
  if (!bar) return;
  bar.innerHTML = `
    <button class="if-mode-btn res-filter-btn ${_ifMode==='mod'?'on':''}"
            onclick="setIfMode('mod',this)"
            data-en="⬟ All Mods (Live)" data-de="⬟ Alle Mods (Live)">⬟ All Mods (Live)</button>
    <button class="if-mode-btn res-filter-btn ${_ifMode==='bp'?'on':''}"
            onclick="setIfMode('bp',this)"
            data-en="📐 Blueprints (Live)" data-de="📐 Blueprints (Live)">📐 Blueprints (Live)</button>
    <button class="if-mode-btn res-filter-btn ${_ifMode==='item'?'on':''}"
            onclick="setIfMode('item',this)"
            data-en="◆ Items &amp; Currencies" data-de="◆ Items &amp; Währungen">◆ Items &amp; Currencies</button>`;
}

function setIfMode(mode, btn) {
  _ifMode = mode;
  _ifSearch = '';
  const inp = document.getElementById('ifSearch');
  if (inp) inp.value = '';
  document.querySelectorAll('.if-mode-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  _renderCatBar();
  if (mode === 'mod') _loadModData();
  else if (mode === 'bp') _loadBpData();
  else renderItemFinder();
}

function _renderCatBar() {
  const bar = document.getElementById('ifCatBar');
  if (!bar) return;
  if (_ifMode === 'item') {
    const cats = Object.entries(ITEM_CAT_LABELS);
    bar.innerHTML = cats.map(([id, lbl]) =>
      `<button class="res-filter-btn ${_ifItemCat===id?'on':''}"
               onclick="setIfItemCat('${id}',this)">
        ${APP.lang==='de'?lbl.de:lbl.en}
      </button>`
    ).join('');
  } else {
    bar.innerHTML = '';
  }
}

function setIfItemCat(cat, btn) {
  _ifItemCat = cat;
  document.querySelectorAll('#ifCatBar .res-filter-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderItemFinder();
}

/* ══════════════════════════════════════════════════════════════
   MOD DATA – live from drops.warframestat.us
══════════════════════════════════════════════════════════════ */
async function _loadModData() {
  const grid = document.getElementById('ifGrid');
  if (!grid) return;

  // Try localStorage cache first
  try { localStorage.removeItem('th_drops_mods_v2'); } catch(e) {}   // stale, empty-source copy from older releases
  try {
    const raw = localStorage.getItem(IF_CACHE_KEY);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < IF_CACHE_TTL) {
        _ifAllMods = data;
        _renderModGrid();
        return;
      }
    }
  } catch(e) {}

  if (_ifLoading) return;
  _ifLoading = true;
  grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
    <div class="loading-spinner"></div>
    <span>${APP.lang==='de'
      ? 'Lade Mod-Daten von drops.warframestat.us…<br><small>Wird lokal gecacht (24h)</small>'
      : 'Loading mod data from drops.warframestat.us…<br><small>Will be cached locally (24h)</small>'}</span>
  </div>`;

  try {
    /* modLocations.json: { modLocations: [{modName, drops:[{location,rarity,chance}]}] }
       Fallback: try all.json subset if modLocations fails */
    const res = await fetch(`${DROPS_BASE}/modLocations.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status} – drops.warframestat.us`);
    const raw = await res.json();

    // Build modName → [{place, rarity, chance}] lookup (modLocations format)
    _ifAllMods = {};
    const entries = raw.modLocations || raw.mods || (Array.isArray(raw) ? raw : []);
    entries.forEach(entry => {
      /* Live modLocations.json: entry = { modName, enemies:[{enemyName, enemyModDropChance, rarity, chance}] }
         (older format: drops:[{location/enemy, rarity, chance}]) 
         Fallback for old array format: { place/location, rewards:[{itemName, rarity, chance}] } */
      if (entry.modName) {
        // New format: modName-keyed
        const name = entry.modName;
        if (!_ifAllMods[name]) _ifAllMods[name] = [];
        (entry.enemies || entry.drops || []).forEach(d => {
          _ifAllMods[name].push({
            place:  d.enemyName || d.location || d.enemy || d.place || '?',
            rarity: d.rarity  || 'Unknown',
            chance: parseFloat(d.chance || d.dropChance || 0),
          });
        });
      } else {
        // Legacy format: location-keyed
        const place = entry.place || entry.location || '?';
        (entry.rewards || entry.mods || []).forEach(r => {
          const name = r.itemName || r.item || r.modName || r.name || '';
          if (!name) return;
          if (!_ifAllMods[name]) _ifAllMods[name] = [];
          _ifAllMods[name].push({
            place,
            rarity: r.rarity || 'Unknown',
            chance: parseFloat(r.chance || r.dropChance || 0),
          });
        });
      }
    });

    // Persist to localStorage
    try {
      localStorage.setItem(IF_CACHE_KEY, JSON.stringify({ data: _ifAllMods, ts: Date.now() }));
    } catch(e) {}

    _renderModGrid();
  } catch(e) {
    grid.innerHTML = `<div class="error-state" style="grid-column:1/-1">
      <div class="error-icon">⚠</div>
      <div><strong>${e.message}</strong><br>
      <small>${APP.lang==='de'
        ? 'Mod-Daten konnten nicht geladen werden. Bitte versuche es später erneut.'
        : 'Could not load mod data. Please try again later.'}</small>
      <br><button class="err-retry-btn" onclick="_loadModData()">↻ Retry</button></div>
    </div>`;
  } finally {
    _ifLoading = false;
  }
}

function _renderModGrid() {
  const grid = document.getElementById('ifGrid');
  if (!grid || !_ifAllMods) return;

  const q = (_ifSearch || '').trim().toLowerCase();

  if (!q) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div style="font-size:32px;margin-bottom:10px">🔎</div>
      <div>${APP.lang==='de'
        ? `<strong>${Object.keys(_ifAllMods).length.toLocaleString()} Mods</strong> geladen. Tippe einen Namen um zu suchen.`
        : `<strong>${Object.keys(_ifAllMods).length.toLocaleString()} mods</strong> loaded. Type a name to search.`}</div>
      <div style="font-size:11px;margin-top:6px;color:var(--text3)">${
        APP.lang==='de' ? 'Beispiele: Serration · Vitality · Streamline · Stretch'
                        : 'Examples: Serration · Vitality · Streamline · Stretch'}</div>
    </div>`;
    return;
  }

  const results = Object.entries(_ifAllMods)
    .filter(([name]) => name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aExact = a[0].toLowerCase() === q;
      const bExact = b[0].toLowerCase() === q;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });

  if (!results.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      ${APP.lang==='de'
        ? `Kein Mod „${q}" gefunden. Versuche den englischen Namen.`
        : `No mod "${q}" found. Try the English name.`}
    </div>`;
    return;
  }

  const RARITY_CLS = { Common:'rc-common', Uncommon:'rc-uncommon', Rare:'rc-rare', Legendary:'rc-rare' };
  const RARITY_DE  = { Common:'Gewöhnlich', Uncommon:'Ungewöhnlich', Rare:'Selten', Legendary:'Legendär' };

  grid.innerHTML = results.slice(0, 40).map(([name, drops]) => {
    // Sort drops: best chance first
    const sorted = [...drops].sort((a, b) => b.chance - a.chance);
    const shown  = sorted.slice(0, 8);
    const more   = sorted.length - shown.length;

    const rows = shown.map(d => {
      const rar = APP.lang==='de' ? (RARITY_DE[d.rarity]||d.rarity) : d.rarity;
      const cls = RARITY_CLS[d.rarity] || 'rc-uncommon';
      return `<div class="if-drop-row">
        <span class="relic-rarity-chip ${cls}">${rar}</span>
        <span class="if-drop-place">${d.place}</span>
        <span class="if-drop-chance">${d.chance > 0 ? d.chance.toFixed(2)+'%' : '?'}</span>
      </div>`;
    }).join('');

    const wiki = name.replace(/ /g,'_');
    return `<div class="res-card">
      <div class="res-card-top">
        <span class="res-icon">⬟</span>
        <div style="flex:1">
          <div class="res-name">${name}</div>
          <div style="font-size:11px;color:var(--text3)">${sorted.length} ${APP.lang==='de'?'Drop-Quellen':'drop sources'}</div>
        </div>
        <a class="res-wiki-btn" href="https://wiki.warframe.com/w/${wiki}" target="_blank" rel="noopener" title="Wiki">📖</a>
      </div>
      <div class="if-drop-list">
        <div class="if-drop-header">
          <span>${APP.lang==='de'?'Seltenheit':'Rarity'}</span>
          <span>${APP.lang==='de'?'Ort':'Location'}</span>
          <span>%</span>
        </div>
        ${rows}
        ${more > 0 ? `<div style="font-size:11px;color:var(--text3);padding:4px 0">+${more} ${APP.lang==='de'?'weitere Quellen…':'more sources…'}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  if (results.length > 40) {
    grid.innerHTML += `<div class="empty-state" style="grid-column:1/-1;padding:12px">${
      APP.lang==='de'
        ? `${results.length - 40} weitere Treffer. Bitte präzisieren.`
        : `${results.length - 40} more results. Please refine your search.`
    }</div>`;
  }
}

/* ══════════════════════════════════════════════════════════════
   BLUEPRINT / PART FINDER – live from drops.warframestat.us
   Erweitert die Suche über Mods hinaus auf Warframe-/Waffenteile,
   die von Gegnern droppen (blueprintLocations.json).
══════════════════════════════════════════════════════════════ */
async function _loadBpData() {
  const grid = document.getElementById('ifGrid');
  if (!grid) return;

  try {
    const raw = localStorage.getItem(IF_BP_CACHE_KEY);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < IF_CACHE_TTL) {
        _ifAllBps = data;
        _renderBpGrid();
        return;
      }
    }
  } catch(e) {}

  if (_ifLoading) return;
  _ifLoading = true;
  grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1">
    <div class="loading-spinner"></div>
    <span>${APP.lang==='de'
      ? 'Lade Blueprint-Daten von drops.warframestat.us…<br><small>Wird lokal gecacht (24h)</small>'
      : 'Loading blueprint data from drops.warframestat.us…<br><small>Will be cached locally (24h)</small>'}</span>
  </div>`;

  try {
    /* blueprintLocations.json: { blueprintLocations: [{ itemName, enemies:[{enemyName, chance, rarity}] }] } */
    const res = await fetch(`${DROPS_BASE}/blueprintLocations.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status} – drops.warframestat.us`);
    const raw = await res.json();

    _ifAllBps = {};
    const entries = raw.blueprintLocations || (Array.isArray(raw) ? raw : []);
    entries.forEach(entry => {
      const name = entry.itemName;
      if (!name) return;
      if (!_ifAllBps[name]) _ifAllBps[name] = [];
      (entry.enemies || []).forEach(d => {
        _ifAllBps[name].push({
          place:  d.enemyName || d.location || '?',
          rarity: d.rarity || 'Unknown',
          chance: parseFloat(d.chance || 0),
        });
      });
    });

    try {
      localStorage.setItem(IF_BP_CACHE_KEY, JSON.stringify({ data: _ifAllBps, ts: Date.now() }));
    } catch(e) {}

    _renderBpGrid();
  } catch(e) {
    grid.innerHTML = `<div class="error-state" style="grid-column:1/-1">
      <div class="error-icon">⚠</div>
      <div><strong>${e.message}</strong><br>
      <small>${APP.lang==='de'
        ? 'Blueprint-Daten konnten nicht geladen werden. Bitte versuche es später erneut.'
        : 'Could not load blueprint data. Please try again later.'}</small>
      <br><button class="err-retry-btn" onclick="_loadBpData()">↻ Retry</button></div>
    </div>`;
  } finally {
    _ifLoading = false;
  }
}

function _renderBpGrid() {
  const grid = document.getElementById('ifGrid');
  if (!grid || !_ifAllBps) return;

  const q = (_ifSearch || '').trim().toLowerCase();

  if (!q) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div style="font-size:32px;margin-bottom:10px">📐</div>
      <div>${APP.lang==='de'
        ? `<strong>${Object.keys(_ifAllBps).length.toLocaleString()} Blueprints/Teile</strong> geladen. Tippe einen Namen um zu suchen.`
        : `<strong>${Object.keys(_ifAllBps).length.toLocaleString()} blueprints/parts</strong> loaded. Type a name to search.`}</div>
      <div style="font-size:11px;margin-top:6px;color:var(--text3)">${
        APP.lang==='de' ? 'Beispiele: Ash Chassis · Braton Prime · Orthos Blueprint'
                        : 'Examples: Ash Chassis · Braton Prime · Orthos Blueprint'}</div>
    </div>`;
    return;
  }

  const results = Object.entries(_ifAllBps)
    .filter(([name]) => name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aExact = a[0].toLowerCase() === q;
      const bExact = b[0].toLowerCase() === q;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return a[0].localeCompare(b[0]);
    });

  if (!results.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      ${APP.lang==='de'
        ? `Kein Blueprint/Teil „${q}" gefunden. Versuche den englischen Namen.`
        : `No blueprint/part "${q}" found. Try the English name.`}
    </div>`;
    return;
  }

  const RARITY_CLS = { Common:'rc-common', Uncommon:'rc-uncommon', Rare:'rc-rare', Legendary:'rc-rare' };
  const RARITY_DE  = { Common:'Gewöhnlich', Uncommon:'Ungewöhnlich', Rare:'Selten', Legendary:'Legendär' };

  grid.innerHTML = results.slice(0, 40).map(([name, drops]) => {
    const sorted = [...drops].sort((a, b) => b.chance - a.chance);
    const shown  = sorted.slice(0, 8);
    const more   = sorted.length - shown.length;

    const rows = shown.map(d => {
      const rar = APP.lang==='de' ? (RARITY_DE[d.rarity]||d.rarity) : d.rarity;
      const cls = RARITY_CLS[d.rarity] || 'rc-uncommon';
      return `<div class="if-drop-row">
        <span class="relic-rarity-chip ${cls}">${rar}</span>
        <span class="if-drop-place">${d.place}</span>
        <span class="if-drop-chance">${d.chance > 0 ? d.chance.toFixed(2)+'%' : '?'}</span>
      </div>`;
    }).join('');

    const wiki = name.replace(/ /g,'_');
    return `<div class="res-card">
      <div class="res-card-top">
        <span class="res-icon">📐</span>
        <div style="flex:1">
          <div class="res-name">${name}</div>
          <div style="font-size:11px;color:var(--text3)">${sorted.length} ${APP.lang==='de'?'Drop-Quellen':'drop sources'}</div>
        </div>
        <a class="res-wiki-btn" href="https://wiki.warframe.com/w/${wiki}" target="_blank" rel="noopener" title="Wiki">📖</a>
      </div>
      <div class="if-drop-list">
        <div class="if-drop-header">
          <span>${APP.lang==='de'?'Seltenheit':'Rarity'}</span>
          <span>${APP.lang==='de'?'Gegner':'Enemy'}</span>
          <span>%</span>
        </div>
        ${rows}
        ${more > 0 ? `<div style="font-size:11px;color:var(--text3);padding:4px 0">+${more} ${APP.lang==='de'?'weitere Quellen…':'more sources…'}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  if (results.length > 40) {
    grid.innerHTML += `<div class="empty-state" style="grid-column:1/-1;padding:12px">${
      APP.lang==='de'
        ? `${results.length - 40} weitere Treffer. Bitte präzisieren.`
        : `${results.length - 40} more results. Please refine your search.`
    }</div>`;
  }
}

/* ══════════════════════════════════════════════════════════════
   ITEM FINDER
══════════════════════════════════════════════════════════════ */
function renderItemFinder() {
  const grid = document.getElementById('ifGrid');
  if (!grid) return;
  _renderCatBar();

  const q   = (_ifSearch || '').trim().toLowerCase();
  let list  = ITEM_DB;
  if (_ifItemCat !== 'all') list = list.filter(i => i.cat === _ifItemCat);
  if (q.length >= 1) {
    list = list.filter(i =>
      i.en.toLowerCase().includes(q) || i.de.toLowerCase().includes(q) ||
      i.sources.some(s => (APP.lang==='de'?s.de:s.en).toLowerCase().includes(q))
    );
  }

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${
      APP.lang==='de' ? 'Keine Ergebnisse.' : 'No results.'
    }</div>`;
    return;
  }

  grid.innerHTML = list.map(item => {
    const name    = APP.lang==='de' ? item.de : item.en;
    const tip     = APP.lang==='de' ? item.tip_de : item.tip_en;
    const sources = item.sources.map(s =>
      `<div class="res-loc-row"><span class="res-loc-bullet">▸</span><span>${APP.lang==='de'?s.de:s.en}</span></div>`
    ).join('');
    return `<div class="res-card">
      <div class="res-card-top">
        <span class="res-icon">${item.icon}</span>
        <div class="res-name">${name}</div>
        <a class="res-wiki-btn"
           href="https://wiki.warframe.com/w/${item.en.replace(/ /g,'_')}"
           target="_blank" rel="noopener">📖</a>
      </div>
      <div class="res-locs">${sources}</div>
      ${tip ? `<div class="res-tip">${tip}</div>` : ''}
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════════════════════
   SEARCH (shared for both modes)
══════════════════════════════════════════════════════════════ */
function onIfSearch(v) {
  _ifSearch = v;
  if (_ifTimer) clearTimeout(_ifTimer);
  _ifTimer = setTimeout(() => {
    if (_ifMode === 'mod') _renderModGrid();
    else if (_ifMode === 'bp') _renderBpGrid();
    else renderItemFinder();
  }, 200);
}
