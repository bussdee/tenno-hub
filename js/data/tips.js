/* TENNO.HUB · Kuratierte Farm-Tipps
   Ergänzen die Live-Drop-Tabellen um Erfahrungswissen. Schlüssel = englischer Item-Name
   (Anzeige-Namen kommen aus der offiziellen Übersetzungsdatenbank). */
window.TH_TIPS = {
  'Neurodes':        { en: 'Best farm: Earth or Lua caches and enemy drops. Nekros (Desecrate) and Resource Boosters help.', de: 'Bester Farm: Erde oder Lua (Behälter und Gegner). Nekros (Entweihen) und Ressourcen-Booster helfen.' },
  'Orokin Cell':     { en: 'Bosses on Saturn (Sargas Ruk) and Ceres (Lech Kril & Vor) drop them reliably. Saturn/Tethys and Ceres/Gabii are good spots.', de: 'Bosse auf Saturn (Sargas Ruk) und Ceres (Lech Kril & Vor) droppen sie zuverlässig. Saturn/Tethys und Ceres/Gabii sind gute Orte.' },
  'Argon Crystal':   { en: 'Only in the Void. Argon Crystals lose half of your stock at every daily reset – farm them right before you build.', de: 'Nur in der Leere. Argon-Kristalle zerfallen bei jedem Tages-Reset zur Hälfte – erst kurz vor dem Bauen farmen.' },
  'Neural Sensors':  { en: 'Jupiter (Alad V on Themisto). Kill Alad V repeatedly or run Jupiter survival.', de: 'Jupiter (Alad V auf Themisto). Alad V wiederholt töten oder Jupiter-Überleben laufen.' },
  'Control Module':  { en: 'Common in the Void, Europa and Neptune.', de: 'Häufig in der Leere, auf Europa und Neptun.' },
  'Morphics':        { en: 'Mercury, Mars and Phobos. Often needed early – Mercury boss runs are fastest.', de: 'Merkur, Mars und Phobos. Früh oft benötigt – Merkur-Boss-Runs sind am schnellsten.' },
  'Plastids':        { en: 'Saturn, Uranus, Phobos, Eris. Short Capture missions on Saturn are fast.', de: 'Saturn, Uranus, Phobos, Eris. Kurze Gefangennahme-Missionen auf Saturn sind schnell.' },
  'Tellurium':       { en: 'Uranus and Grineer Archwing/Railjack missions. Use a Resource Booster – it is rare.', de: 'Uranus sowie Grineer-Archwing/Railjack-Missionen. Ressourcen-Booster nutzen – selten.' },
  'Oxium':           { en: 'Dropped by Oxium Ospreys (Corpus). Kill them before they self-destruct! Jupiter/Io (Defense) is popular.', de: 'Von Oxium-Ospreys (Corpus). Vor der Selbstzerstörung töten! Jupiter/Io (Verteidigung) ist beliebt.' },
  'Gallium':         { en: 'Mars and Uranus. Rare drop – bring Nekros or a Resource Drop Chance Booster.', de: 'Mars und Uranus. Seltener Drop – Nekros oder Ressourcen-Dropchancen-Booster mitnehmen.' },
  'Kuva':            { en: 'Kuva Survival and Kuva Flood on the Kuva Fortress give the best rate. Steel Path Teshin shop sells Kuva too.', de: 'Kuva-Überleben und Kuva-Flut auf der Kuva-Festung bringen am meisten. Teshins Stahlpfad-Shop verkauft ebenfalls Kuva.' },
  'Serration':       { en: 'Most important primary damage mod (+165% at max rank). Often cheap on warframe.market.', de: 'Wichtigster Schadens-Mod für Primärwaffen (+165% auf Max-Rang). Auf warframe.market oft günstig.' },
  'Vitality':        { en: 'Core survivability mod for every Warframe. Very common drop.', de: 'Grundlegender Überlebens-Mod für jeden Warframe. Sehr häufiger Drop.' },
  'Streamline':      { en: 'Reduces ability energy cost. Void missions and Orokin enemies.', de: 'Reduziert die Energiekosten von Fähigkeiten. Void-Missionen und Orokin-Gegner.' },
  'Forma Blueprint': { en: 'You never have enough. Build every Forma blueprint immediately. Relics, Nightwave shop and Sorties.', de: 'Man hat nie genug. Jede Forma-Blaupause sofort bauen. Relics, Nightwave-Shop und Sorties.' },
  'Rhino':           { en: 'The best beginner tank. Parts drop from the Jackal on Venus/Fossa.', de: 'Der beste Anfänger-Tank. Teile droppen vom Jackal auf Venus/Fossa.' },
  'Nekros':          { en: 'Desecrate gives extra loot from corpses – ideal farming frame. Lephantis (Orokin Derelict Assassination).', de: 'Entweihen gibt Extra-Beute von Leichen – idealer Farm-Frame. Lephantis (Orokin-Wrack-Attentat).' },
  'Mesa':            { en: 'Mutalist Alad V on Eris. Mutalist Alad V Nav Coordinates come from Invasions and Eris enemies.', de: 'Mutalist Alad V auf Eris. Die Navigations-Koordinaten kommen aus Invasionen und von Eris-Gegnern.' },
};

/* Währungen & Systeme – nicht in Drop-Tabellen, daher als Leitfaden */
window.TH_GUIDES = [
  { en: 'Platinum', de: 'Platin', ic: 'coins',
    tip: ['Premium currency. Spend it on slots and potatoes – never on Warframes you can farm.', 'Premium-Währung. Für Slots und Kartoffeln ausgeben – nie für Warframes, die man farmen kann.'],
    src: [['Trade Prime parts, mods and arcanes with players (warframe.market)', 'Prime-Teile, Mods und Arcanes mit Spielern handeln (warframe.market)'], ['Daily login rewards: discount coupons (up to 75 %)', 'Tägliche Login-Belohnung: Rabattgutscheine (bis 75 %)']] },
  { en: 'Ducats', de: 'Dukaten', ic: 'coins',
    tip: ["Currency for Baro Ki'Teer.", "Währung für Baro Ki'Teer."],
    src: [['Trade Prime parts at the Ducat Kiosk in any Relay', 'Prime-Teile am Dukaten-Kiosk in jedem Relais eintauschen'], ['Common 15 · Uncommon 25–45 · Rare 45–100', 'Gewöhnlich 15 · Ungewöhnlich 25–45 · Selten 45–100']] },
  { en: 'Steel Essence', de: 'Stahlessenz', ic: 'steel',
    tip: ["Steel Path currency – Teshin sells Umbra Forma, Kuva, Arcane Adapters and more.", 'Stahlpfad-Währung – Teshin verkauft Umbra-Forma, Kuva, Arcane-Adapter und mehr.'],
    src: [['Acolytes in Steel Path missions', 'Akolythen in Stahlpfad-Missionen'], ['Daily Steel Path Incursions', 'Tägliche Stahlpfad-Invasionen (Incursions)']] },
  { en: 'Vitus Essence', de: 'Vitus-Essenz', ic: 'target',
    tip: ['Arbitration currency for Galvanized mods, Aura mods and Arcanes.', 'Schiedsgerichts-Währung für Galvanisierte Mods, Aura-Mods und Arcanes.'],
    src: [['Arbitration Drones and rotation rewards', 'Schiedsgerichts-Drohnen und Rotationsbelohnungen']] },
  { en: 'Orokin Reactor / Catalyst', de: 'Orokin Reaktor / Katalysator', ic: 'bolt',
    tip: ['Doubles mod capacity. Never buy full price – wait for free sources.', 'Verdoppelt die Mod-Kapazität. Nie zum vollen Preis kaufen – auf kostenlose Quellen warten.'],
    src: [['Nightwave Cred Offerings', 'Nightwave-Angebote (Creds)'], ['Invasions and Alerts (watch the dashboard!)', 'Invasionen und Alarme (Dashboard im Blick behalten!)'], ['Sortie rewards', 'Sortie-Belohnungen']] },
  { en: 'Archon Shard', de: 'Archon-Scherbe', ic: 'crown',
    tip: ['Permanent Warframe upgrades via the Helminth.', 'Dauerhafte Warframe-Verbesserungen über das Helminth.'],
    src: [['Weekly Archon Hunt', 'Wöchentliche Archon-Jagd'], ['Netracells and Deep Archimedea (Zariman)', 'Netrazellen und Deep Archimedea (Zariman)']] },
];
