/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · acquisition.js  v4.2
   Every obtainable Warframe with source, location, parts & tips.
   Offizielle deutsche Client-Begriffe verwendet.
═══════════════════════════════════════════════════════════════ */

const ACQUISITION = [

  /* ── STARTER / BOSS DROPS ─────────────────────────────────── */
  { frame:'Excalibur',  icon:'⚔️',  source:'boss',    boss:'Lt. Lech Kril & Vor',    planet:'Ceres',   node:'Exta',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'One of the 3 starter frames. Blueprint free in Market. Or just buy all parts from the boss.',
    tip_de:'Einer der 3 Starter-Frames. Blueprint gratis im Markt. Boss auf Ceres farmen.' },
  { frame:'Mag',        icon:'🧲',  source:'boss',    boss:'The Sergeant',           planet:'Phobos',  node:'Iliad',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Starter frame. The Sergeant is the easiest boss in the game.',
    tip_de:'Starter-Frame. The Sergeant ist der einfachste Boss im Spiel.' },
  { frame:'Volt',       icon:'⚡',  source:'dojo',    boss:'Tenno Labor Forschung',  planet:'Clan Dojo', node:'Tenno Labor',
    parts:['BP','Neuroptics','Chassis','Systems – alle im Dojo'],
    tip_en:'Requires a Clan Dojo with Tenno Lab. Best early speedster.',
    tip_de:'Benötigt Clan-Dojo mit Tenno Labor. Bester Geschwindigkeits-Frame für Anfänger.' },
  { frame:'Rhino',      icon:'🦏',  source:'boss',    boss:'The Jackal',             planet:'Venus',   node:'Fossa',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Iron Skin makes him near-immortal. Best early-game tank.',
    tip_de:'Iron Skin macht ihn fast unsterblich. Bester Early-Game-Tank.' },
  { frame:'Frost',      icon:'❄️',  source:'boss',    boss:'Lt. Lech Kril',          planet:'Ceres',   node:'Exta',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Snow Globe protects Defense objectives. Drops alongside Excalibur.',
    tip_de:'Snow Globe schützt Verteidigungsziele. Dropped zusammen mit Excalibur auf Ceres.' },
  { frame:'Ember',      icon:'🔥',  source:'boss',    boss:'General Sargas Ruk',     planet:'Saturn',  node:'Tethys',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Fire damage specialist. World on Fire used to dominate, now World of Fire with Immolation.',
    tip_de:'Feuer-Spezialistin. Stark gegen Infizierte.' },
  { frame:'Trinity',    icon:'💊',  source:'boss',    boss:'Ambulas',                planet:'Pluto',   node:'Hades',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Best healer/support frame. Energy Vampire + Blessing = squad carries.',
    tip_de:'Beste Heilerin/Support. Energy Vampire + Blessing = Squad trägt alles.' },
  { frame:'Saryn',      icon:'🐍',  source:'boss',    boss:'Kela De Thaym',          planet:'Sedna',   node:'Merrow',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Top-tier nuker. Spores + Miasma wipe entire rooms.',
    tip_de:'Top-Tier-Nuker. Sporen + Miasma räumen ganze Räume.' },
  { frame:'Loki',       icon:'🌫️', source:'boss',    boss:'Hyena Pack',             planet:'Neptune', node:'Psamathe',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Invisibility specialist. Best for Spy, Rescue, Stealth.',
    tip_de:'Unsichtbarkeits-Spezialist. Bester Frame für Spionage, Rettung, Stealth.' },
  { frame:'Nyx',        icon:'🧠',  source:'boss',    boss:'Phorid (Invasion boss)', planet:'Varies', node:'Invasion-Event',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Phorid replaces the boss node during Infested invasion events.',
    tip_de:'Phorid ersetzt den Boss-Node während Infizierte-Invasions-Events.' },
  { frame:'Vauban',     icon:'🔧',  source:'quest',   boss:'Nightwave / Login',      planet:'Nightwave Shop', node:'Wolf Creds / Login',
    parts:['BP','Neuroptics','Chassis','Systems – alle via Nightwave-Shop'],
    tip_en:'Crowd control engineer. Buy parts with Wolf Credits in the Nightwave shop.',
    tip_de:'Crowd-Control-Ingenieur. Teile mit Wolf-Credits im Nightwave-Shop kaufen.' },
  { frame:'Ash',        icon:'🗡️', source:'mission', boss:'Manic enemies',          planet:'Grineer Sealab', node:'Alle Grineer-Sealab-Missionen',
    parts:['BP (20%)','Neuroptics (22.5%)','Chassis (22.5%)','Systems (22.5%) – alle Manic-Drops'],
    tip_en:'Manics are rare spawns in Grineer Sealab missions. Bring a Nekros.',
    tip_de:'Manics sind seltene Spawns in Grineer-Sealab-Missionen. Nekros mitbringen.' },
  { frame:'Oberon',     icon:'🌿',  source:'mission', boss:'Eximus enemies',         planet:'Any high-level', node:'Eximus-Gegner (1.01% je Teil)',
    parts:['BP','Neuroptics','Chassis','Systems – alle 1.01% Drop von Eximus'],
    tip_en:'Very low drop rate from Eximus enemies. Rare and grindy farm.',
    tip_de:'Sehr niedrige Drop-Rate von Eximus-Gegnern. Seltenes und aufwendiges Farmen.' },
  { frame:'Zephyr',     icon:'🦅',  source:'dojo',    boss:'Tenno Labor Forschung',  planet:'Clan Dojo', node:'Tenno Labor',
    parts:['BP','Neuroptics','Chassis','Systems – alle im Dojo'],
    tip_en:'Air-based movement frame. Turbulence deflects projectiles.',
    tip_de:'Luft-basierter Bewegungs-Frame. Turbulence lenkt Projektile ab.' },
  { frame:'Banshee',    icon:'🔊',  source:'dojo',    boss:'Tenno Labor Forschung',  planet:'Clan Dojo', node:'Tenno Labor',
    parts:['BP','Neuroptics','Chassis','Systems – alle im Dojo'],
    tip_en:'Sound-based crowd control. Sonar marks weak points.',
    tip_de:'Klang-basierte Crowd Control. Sonar markiert Schwachpunkte.' },
  { frame:'Hydroid',    icon:'🌊',  source:'boss',    boss:'Councilor Vay Hek',      planet:'Earth',   node:'Oro',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Water/pirate theme. Puddle makes him invulnerable and spawns extra tentacles.',
    tip_de:'Wasser/Piraten-Thema. Pfütze macht ihn unverwundbar und spawnt Tentakel.' },
  { frame:'Valkyr',     icon:'🐯',  source:'boss',    boss:'Alad V',                 planet:'Jupiter', node:'Themisto',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Berserker frame. Hysteria grants invulnerability + claws. Each Alad V kill drops one part (~35,000 Credits each if bought directly).',
    tip_de:'Berserker-Frame. Hysteria macht unverwundbar + Krallen. Jeder Alad-V-Kill droppt ein Teil (~35.000 Credits pro Teil direkt kaufbar).' },
  { frame:'Mesa',       icon:'🤠',  source:'boss',    boss:'Mutalist Alad V',        planet:'Eris',    node:'Naeglar (via Mutalist Coordinates)',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Peacemaker is one of the best DPS skills in the game. Requires Mutalist Coordinates from Invasions.',
    tip_de:'Peacemaker ist eine der besten Schadens-Fähigkeiten. Benötigt Mutalisten-Koordinaten aus Invasionen.' },
  { frame:'Nekros',     icon:'💀',  source:'boss',    boss:'Lephantis',              planet:'Deimos',  node:'Magnacidium',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Desecrate doubles loot. ESSENTIAL farming companion. Always wanted in groups.',
    tip_de:'Desecrate verdoppelt Loot. ESSENTIELL fürs Farmen. Immer in Gruppen gefragt.' },
  { frame:'Mirage',     icon:'🎭',  source:'quest',   boss:'The Hidden Messages',    planet:'Quest',   node:'Cephalon Fragment hunt',
    parts:['BP (questbasiert)','Neuroptics','Chassis','Systems – alle durch Quest'],
    tip_en:'Quest: collect all 3 Cephalon Fragments. Hall of Mirrors is insane DPS.',
    tip_de:'Quest: Alle 3 Cephalon-Fragmente sammeln. Hall of Mirrors = extremer DPS.' },
  { frame:'Limbo',      icon:'🎩',  source:'quest',   boss:'Limbo Theorem',          planet:'Quest',   node:'Void / Solar Rail',
    parts:['BP (questbasiert)','Neuroptics','Chassis','Systems – alle durch Quest'],
    tip_en:'Rift Dimension mechanic – powerful but complex. Solo quest.',
    tip_de:'Dimensionsspalt-Mechanik – mächtig aber komplex. Solo-Quest.' },
  { frame:'Chroma',     icon:'🐉',  source:'quest',   boss:'The New Strange',        planet:'Quest',   node:'Cephalon Simaris',
    parts:['BP (questbasiert)','Neuroptics','Chassis','Systems – alle durch Quest'],
    tip_en:'Dragon-themed tank/DPS. Elemental Ward and Vex Armor are insanely strong.',
    tip_de:'Drachen-thematischer Tank/DPS. Elemental Ward + Vex Armor = enormer Schaden.' },
  { frame:'Equinox',    icon:'☯️',  source:'boss',    boss:'Tyl Regor',              planet:'Uranus',  node:'Titania',
    parts:['Day BP','Day Neuroptics','Day Chassis','Day Systems','Night BP','Night Neuroptics','Night Chassis','Night Systems – 8 Teile!'],
    tip_en:'8 parts total (Day + Night halves). Most grind-heavy frame to obtain.',
    tip_de:'8 Teile gesamt (Tag + Nacht-Hälften). Aufwendigster Frame zum Farmen.' },
  { frame:'Wukong',     icon:'🐒',  source:'dojo',    boss:'Tenno Labor Forschung',  planet:'Clan Dojo', node:'Tenno Labor',
    parts:['BP','Neuroptics','Chassis','Systems – alle im Dojo'],
    tip_en:'Defy makes him hard to kill. Clone companion.',
    tip_de:'Defy macht ihn schwer zu töten. Klon-Begleiter.' },
  { frame:'Ivara',      icon:'🏹',  source:'mission', boss:'Spy missions (Rotationen B&C)', planet:'Various', node:'Spionage Missionen Rota B/C',
    parts:['BP (Lua Rotation C)','Neuroptics (Rotation B&C)','Chassis (Rotation B&C)','Systems (Rotation B&C)'],
    tip_en:'Spy rotation drops – very slow farm. Prowl = permanent invisibility and looting arrows.',
    tip_de:'Spionage-Rotations-Drops – sehr langsames Farmen. Prowl = permanente Unsichtbarkeit.' },
  { frame:'Inaros',     icon:'🏺',  source:'quest',   boss:'Sands of Inaros',        planet:'Baro Ki\'Teer / Quest', node:'25 Ducats bei Baro',
    parts:['BP (via Baro Ki\'Teer, 100 Dukaten + 25.000 Cr)','dann Quest für alle Teile'],
    tip_en:'Buy the Blueprint from Baro Ki\'Teer for 100 Ducats, then complete the quest.',
    tip_de:"Blueprint bei Baro Ki'Teer für 100 Dukaten kaufen, dann Quest abschließen." },
  { frame:'Titania',    icon:'🧚',  source:'quest',   boss:'The Silver Grove',       planet:'Quest',   node:'Earth (Archwing required)',
    parts:['BP + alle Teile durch Quest'],
    tip_en:'Complete The Silver Grove quest on Earth. Razorwing = Archwing-style shrinking.',
    tip_de:'The Silver Grove auf Erde abschließen. Razorwing = Archwing-artiges Schrumpfen.' },
  { frame:'Nezha',      icon:'🔥',  source:'dojo',    boss:'Tenno Labor Forschung',  planet:'Clan Dojo', node:'Tenno Labor',
    parts:['BP','Neuroptics','Chassis','Systems – alle im Dojo'],
    tip_en:'Fast agile frame with strong CC. Warding Halo provides armor.',
    tip_de:'Schneller, agiler Frame mit starker CC. Warding Halo bietet Panzerung.' },
  { frame:'Atlas',      icon:'🪨',  source:'quest',   boss:'The Jordas Precept',     planet:'Quest',   node:'Archwing Quest',
    parts:['BP + alle Teile durch Quest'],
    tip_en:'Rock golem. Complete The Jordas Precept quest (requires Archwing).',
    tip_de:'Stein-Golem. The Jordas Precept-Quest abschließen (Archwing benötigt).' },
  { frame:'Octavia',    icon:'🎵',  source:'mission', boss:'Orokin Derelict / Lua',  planet:'Multiple', node:'Lua Music Puzzle',
    parts:['BP (Lua Musik-Puzzle)','Neuroptics (Orokin-Wrack Verteidigung)','Chassis (Lua Spionage)','Systems (Orokin-Wrack Überleben)'],
    tip_en:'Music-based DPS. Mallet + Resonator = unstoppable CC. Parts spread across missions.',
    tip_de:'Musik-basierter DPS. Mallet + Resonator = unaufhaltbare CC. Teile über Missionen verteilt.' },
  { frame:'Harrow',     icon:'⛪',  source:'mission', boss:'Verschiedene Quellen',   planet:'Various', node:'Pago / Defection / Void',
    parts:['BP (Kuva-Festung Pago Spionage)','Neuroptics (Void-Fissur Rot. C)','Chassis (Defection-Missionen)','Systems (Incursion-Missionen)'],
    tip_en:'Multi-source farm. Thurible converts enemy kills into energy.',
    tip_de:'Multi-Quellen-Farm. Thurible wandelt Feindtötungen in Energie um.' },
  { frame:'Khora',      icon:'🐈',  source:'mission', boss:'Sanctuary Onslaught',    planet:'Star Chart', node:'Heiligtum Onslaught (regulär)',
    parts:['BP (Rotation C)','Neuroptics (Rotation C)','Chassis (Rotation C)','Systems (Rotation C)'],
    tip_en:'Regular (not Elite!) Sanctuary Onslaught only. Whipclaw DPS.',
    tip_de:'Nur reguläres Heiligtum-Onslaught (NICHT Elite!). Whipclaw für DPS.' },
  { frame:'Revenant',   icon:'🧛',  source:'mission', boss:'Quills / Eidolon Teralyst', planet:'Cetus / Plains', node:'Eidolon-Ebene',
    parts:['BP (Quills-Angebote)','Neuroptics (Teralyst-Drops)','Chassis + Systems (Quills-Angebote)'],
    tip_en:'Mesmer Skin makes him near-immune to damage. Parts split between Quills and Eidolons.',
    tip_de:'Mesmer Skin macht ihn fast immun. Teile zwischen Quills und Eidolons aufgeteilt.' },
  { frame:'Garuda',     icon:'🦅',  source:'mission', boss:'Vox Solaris Kopfgelder', planet:'Venus',   node:'Orb Vallis',
    parts:['Alle Teile aus Fortuna-Kopfgeldern'],
    tip_en:'Health-sacrificing DPS. Bloodletting replenishes Energy from Health.',
    tip_de:'Gesundheits-opfernder DPS. Bloodletting wandelt Gesundheit in Energie.' },
  { frame:'Wisp',       icon:'✨',  source:'boss',    boss:'Ropalolyst',             planet:'Jupiter', node:'The Ropalolyst',
    parts:['BP','Neuroptics','Chassis','Systems'],
    tip_en:'Passive invisibility while airborne. Motes grant squad buffs.',
    tip_de:'Passive Unsichtbarkeit in der Luft. Motes geben Squad-Buffs.' },
  { frame:'Baruuk',     icon:'☮️',  source:'mission', boss:'Vox Solaris Ansehen',    planet:'Venus',   node:'Orb Vallis / Fortuna',
    parts:['BP und Teile via Solaris-United-Ansehen (Old Mate Rang)'],
    tip_en:'Pacifist frame. Buy from Vox Solaris once you reach Old Mate rank.',
    tip_de:'Pazifist-Frame. Bei Vox Solaris ab Old-Mate-Rang kaufen.' },
  { frame:'Hildryn',    icon:'🛡️', source:'boss',    boss:'Exploiter Orb',          planet:'Venus',   node:'Orb Vallis (Thermia-Frakturen)',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Shield-based tanky caster. Requires Thermia Fracture event.',
    tip_de:'Schild-basierter Tank/Caster. Benötigt Thermia-Fraktur-Event.' },
  { frame:'Grendel',    icon:'🍖',  source:'mission', boss:'Spezieller Schlüssel',   planet:'Lua',     node:'Lua-Schlüssel-Missionen',
    parts:['Alle Teile via Lua-Key-Missionen (von Arbitern of Hexis kaufen)'],
    tip_en:'Buy keys from Arbiters of Hexis, then complete the locked Lua missions.',
    tip_de:'Schlüssel bei Arbiters of Hexis kaufen, dann gesperrte Lua-Missionen abschließen.' },
  { frame:'Protea',     icon:'⏪',  source:'quest',   boss:'Deadlock Protocol',      planet:'Quest → Corpus Schiff', node:'Granum Void',
    parts:['BP (Quest)','Neuroptics/Chassis/Systems (Granum-Void-Rotationen)'],
    tip_en:'Anchor rewinds your health/energy. Complete Deadlock Protocol first.',
    tip_de:'Anchor setzt Gesundheit/Energie zurück. Erst Deadlock Protocol abschließen.' },
  { frame:'Xaku',       icon:'🦴',  source:'mission', boss:'Void Storm Missionen',   planet:'Leere',   node:'Void Storm Railjack',
    parts:['Alle Teile aus Void-Storm-Belohnungsrotationen'],
    tip_en:'Three-in-one frame. Accuse makes enemies fight each other.',
    tip_de:'Drei-in-einem-Frame. Accuse lässt Feinde gegeneinander kämpfen.' },
  { frame:'Lavos',      icon:'🧪',  source:'mission', boss:'Otak / Son Token-System',planet:'Deimos',  node:'Necralisk Bounties',
    parts:['Alle Teile via Entrati-Ansehen Bounties (Deimos)'],
    tip_en:'Chemistry-based frame. No energy – uses cooldowns instead.',
    tip_de:'Chemie-Frame. Keine Energie – verwendet stattdessen Abklingzeiten.' },
  { frame:'Caliban',    icon:'🤖',  source:'mission', boss:'Sentient-Gegner',        planet:'Zariman Ten Zero', node:'Angels of Zariman Bounties',
    parts:['Alle Teile aus Zariman-Kopfgeldern'],
    tip_en:'Sentient-hybrid tank. Requires Angels of Zariman update content.',
    tip_de:'Sentient-Hybrid-Tank. Benötigt Angels-of-Zariman-Inhalt.' },
  { frame:'Citrine',    icon:'💎',  source:'mission', boss:'Effervo Geology / Cavia',planet:'Deimos',  node:'Holdfasts Bounties + Effervo',
    parts:['Alle Teile via Holdfasts Bounties und Effervo-Missionen'],
    tip_en:'Crystal support. Shards on kill that buff allies.',
    tip_de:'Kristall-Support. Scherben beim Kill die Verbündete buffen.' },
  { frame:'Dagath',     icon:'🌙',  source:'mission', boss:'Duviri / Chrysalith',    planet:'Duviri',  node:'Duviri Paradox-Wellen',
    parts:['Alle Teile aus Duviri-Paradox-Wellen-Rotationen'],
    tip_en:'Duviri-exclusive frame. Spectral horse companion.',
    tip_de:'Duviri-exklusiver Frame. Geisterpferd als Begleiter.' },
  { frame:'Qorvex',     icon:'🏗️', source:'mission', boss:'Cavia / Effervo',        planet:'Deimos',  node:'Effervo + Cavia Bounties',
    parts:['Alle Teile via Cavia-Ansehen und Effervo-Missionen'],
    tip_en:'Concrete/radiation tank. Chyrinka Pillar creates irradiated zones.',
    tip_de:'Beton/Strahlung-Tank. Chyrinka-Säulen erschaffen bestrahlte Zonen.' },

  /* ── MISSING FRAMES (2019–2025 additions) ────────────────── */
  { frame:'Nova',      icon:'⚛️',  source:'boss',    boss:'The Raptor',             planet:'Europa',  node:'Naamah',
    parts:['BP (Markt, kostenlos)','Neuroptics','Chassis','Systems'],
    tip_en:'Farm The Raptor on Europa. All 4 parts drop from the same boss.',
    tip_de:'The Raptor auf Europa farmen. Alle 4 Teile droppen vom selben Boss.' },
  { frame:'Nidus',     icon:'🦠',  source:'quest',   boss:'The Glast Gambit',       planet:'Orokin Derelict', node:'Infested Salvage',
    parts:['BP aus Quest (The Glast Gambit)','Neuroptics/Chassis/Systems: Infested Salvage (Rotation C)'],
    tip_en:'Complete The Glast Gambit quest for the Blueprint. Farm Infested Salvage (Orokin Derelict) for parts.',
    tip_de:'Quest "The Glast Gambit" abschließen für den Blueprint. Teile aus Infested Salvage (Orokin Derelict) farmen.' },
  { frame:'Gauss',     icon:'⚡',  source:'mission', boss:'Kelpie, Sedna',          planet:'Sedna',   node:'Kelpie (Disruption)',
    parts:['BP · Neuroptics · Chassis · Systems – alle aus Kelpie Disruption'],
    tip_en:'All parts from the Disruption mission on Kelpie, Sedna. Bring a speedster to collect conduits.',
    tip_de:'Alle Teile aus der Disruption-Mission auf Kelpie, Sedna. Conduits schnell sammeln.' },
  { frame:'Sevagoth',  icon:'💀',  source:'mission', boss:'Void Storm',             planet:'Void',    node:'Beliath / Ur / Kappa / Alator',
    parts:['BP · Neuroptics · Chassis · Systems – alle aus Void Storm Rotationen'],
    tip_en:'All parts from Void Storm missions (Steel Path). Higher rotation = better part chance.',
    tip_de:'Alle Teile aus Void Storm Missionen (Steel Path). Höhere Rotation = bessere Chance.' },
  { frame:'Yareli',    icon:'🌊',  source:'quest',   boss:'Waverider Quest',        planet:'Fortuna / Warframe Market', node:'Waverider-Quest',
    parts:['Alle Teile aus dem Waverider Quest (K-Drive Challenges) – oder Markt'],
    tip_en:'Complete the Waverider quest (K-Drive challenges). Alternatively buy all parts on Warframe Market.',
    tip_de:'Waverider Quest (K-Drive Challenges) abschließen. Alternativ alle Teile am Warframe Market kaufen.' },
  { frame:'Gyre',      icon:'🌀',  source:'mission', boss:'Conjunction Survival',   planet:'Zariman', node:'Tuvul Commons / Everview Arc',
    parts:['BP · Neuroptics · Chassis · Systems – Conjunction Survival (Zariman)'],
    tip_en:'All parts from Conjunction Survival on Zariman. Buy Entrati Lanthorn to unlock the missions.',
    tip_de:'Alle Teile aus Conjunction Survival (Zariman). Entrati Lanthorn kaufen um die Missionen freizuschalten.' },
  { frame:'Styanax',   icon:'🛡️', source:'mission', boss:'Zariman / Login',        planet:'Zariman', node:'Zariman-Rotationen',
    parts:['BP · Neuroptics · Chassis · Systems – Login-Meilensteine ODER Zariman Missionen'],
    tip_en:'Available as login milestone reward OR farm from Zariman mission rotations.',
    tip_de:'Als Login-Meilenstein-Belohnung ODER aus Zariman Missionen farmen.' },
  { frame:'Voruna',    icon:'🐺',  source:'mission', boss:'Conjunction Survival',   planet:'Zariman', node:'Tuvul Commons / Everview Arc',
    parts:['BP · Neuroptics · Chassis · Systems – Conjunction Survival (Zariman)'],
    tip_en:'All parts from Conjunction Survival on Zariman. Same source as Gyre.',
    tip_de:'Alle Teile aus Conjunction Survival (Zariman). Gleiche Quelle wie Gyre.' },
  { frame:'Kullervo',  icon:'⚔️',  source:'mission', boss:"Kullervo's Hold",        planet:'Duviri',  node:"Kullervo's Hold",
    parts:["BP · Neuroptics · Chassis · Systems – Kullervo's Hold (Duviri)"],
    tip_en:"Farm Kullervo's Hold in the Duviri Paradox. Requires completing the main Duviri quest.",
    tip_de:"Kullervo's Hold im Duviri Paradox farmen. Erfordert den Abschluss der Duviri-Hauptquest." },
  { frame:'Dante',     icon:'📚',  source:'mission', boss:'Albrecht Laboratories',  planet:'Deimos',  node:'Sanctum Anatomica',
    parts:['BP · Neuroptics · Chassis · Systems – Albrecht Laboratories Rotationen'],
    tip_en:'Farm Albrecht Laboratories (Sanctum Anatomica) on Deimos. Requires Whispers in the Walls completion.',
    tip_de:'Albrecht Laboratories (Sanctum Anatomica) auf Deimos farmen. Erfordert Abschluss von Whispers in the Walls.' },
  { frame:'Jade',      icon:'💚',  source:'quest',   boss:'Jade Shadows',           planet:'Hollvania', node:'Hollvania Missionen',
    parts:['BP · Neuroptics · Chassis · Systems – Jade Shadows Quest & Hollvania Missionen'],
    tip_en:'Complete Jade Shadows quest for the Blueprint, then farm Hollvania missions for parts.',
    tip_de:'Jade Shadows Quest für Blueprint abschließen, dann Hollvania Missionen für Teile farmen.' },
  { frame:'Koumei',    icon:'🎲',  source:'mission', boss:'1999 / Höllvania',       planet:'Earth 1999', node:'Techrot Encore Missionen',
    parts:['BP · Neuroptics · Chassis · Systems – 1999 Techrot-Rotationen'],
    tip_en:'Farm 1999 missions (Techrot Encore update) in Hollvania. Requires "Jade Shadows" completion.',
    tip_de:'1999-Missionen (Techrot Encore Update) in Höllvania farmen. Erfordert "Jade Shadows" Abschluss.' },
  { frame:'Cyte-09',   icon:'🤖',  source:'mission', boss:'1999 / Bellum (Europa)', planet:'Europa 1999', node:'Bellum Missionen',
    parts:['BP · Neuroptics · Chassis · Systems – 1999 Europa Rotationen'],
    tip_en:'Farm Bellum missions in the 1999 Europa tileset. Requires Techrot Encore DLC.',
    tip_de:'Bellum-Missionen im 1999-Europa-Tileset farmen. Erfordert Techrot Encore DLC.' },
];

const ACQ_SOURCE_META = {
  boss:    { en:'Boss Drop',  de:'Boss-Drop',  cls:'src-boss' },
  dojo:    { en:'Clan Dojo',  de:'Clan-Dojo',  cls:'src-dojo' },
  quest:   { en:'Quest',      de:'Queste',     cls:'src-quest' },
  mission: { en:'Mission',    de:'Mission',    cls:'src-mission' },
  login:   { en:'Login',      de:'Login',      cls:'src-login' },
};

let _acqFilter = 'all';
let _acqSearch = '';
let _acqSearchTimer = null;

function initAcquisition() { renderAcquisition(); }

function onAcqSearch(v) {
  _acqSearch = (v || '').trim().toLowerCase();
  if (_acqSearchTimer) clearTimeout(_acqSearchTimer);
  _acqSearchTimer = setTimeout(renderAcquisition, 150);
}

function setAcqFilter(f, btn) {
  _acqFilter = f;
  document.querySelectorAll('.acq-filter-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderAcquisition();
}

function renderAcquisition() {
  const grid = document.getElementById('acqGrid');
  if (!grid) return;

  let list = ACQUISITION;

  if (_acqFilter !== 'all')
    list = list.filter(f => f.source === _acqFilter);

  if (_acqSearch.length >= 1)
    list = list.filter(f =>
      f.frame.toLowerCase().includes(_acqSearch) ||
      (f.boss  || '').toLowerCase().includes(_acqSearch) ||
      (f.planet|| '').toLowerCase().includes(_acqSearch) ||
      (f.parts || []).some(p => p.toLowerCase().includes(_acqSearch))
    );

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${
      APP.lang === 'de' ? 'Keine Ergebnisse.' : 'No results.'
    }</div>`;
    return;
  }

  grid.innerHTML = list.map(f => {
    const src    = ACQ_SOURCE_META[f.source] || ACQ_SOURCE_META.mission;
    const tip    = APP.lang === 'de' ? f.tip_de : f.tip_en;
    const planet = APP.lang === 'de' ? (DE_PLANET[f.planet] || f.planet) : f.planet;
    const parts  = (f.parts || []).map(p =>
      `<div class="acq-drop-item">▸ ${p}</div>`
    ).join('');

    return `<div class="acq-card">
      <div class="acq-card-top">
        <div class="acq-frame-name"><span>${f.icon}</span> ${f.frame}</div>
        <span class="acq-source-badge ${src.cls}">${APP.lang === 'de' ? src.de : src.en}</span>
      </div>
      <div class="acq-boss-loc">
        <div class="acq-boss-name">${f.boss || ''}</div>
        <div class="acq-loc">📍 ${planet}${f.node ? ` / ${f.node}` : ''}</div>
      </div>
      <div class="acq-drop-list">${parts}</div>
      ${tip ? `<div class="acq-tip">${tip}</div>` : ''}
    </div>`;
  }).join('');
}
