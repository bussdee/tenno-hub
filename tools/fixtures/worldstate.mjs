/* Nachgebildete Antwort von api.warframestat.us/pc/ – Feldnamen exakt wie
   warframe-worldstate-parser v5 (Invasion.attacker/defender, CambionCycle.state …).
   Zeiten relativ zu „jetzt“, damit Countdowns realistisch laufen. */
export function mockWorldstate(lang = 'en') {
  const now = Date.now(), iso = ms => new Date(now + ms).toISOString();
  const M = 60e3, H = 3600e3, D = 24 * H;
  const de = lang === 'de';
  const T = (en, d) => de ? d : en;
  const fis = (id, tier, node, type, enemy, exp, extra = {}) => ({ id, activation: iso(-20 * M), expiry: iso(exp), node, missionType: type, missionTypeKey: extra.key || type, enemy, enemyKey: enemy, tier, tierNum: { Lith: 1, Meso: 2, Neo: 3, Axi: 4, Requiem: 5, Omnia: 6 }[tier], isStorm: false, isHard: false, ...extra });
  return {
    timestamp: iso(0),
    news: [
      { id: 'n1', message: 'Warframe: 1999 – Prime Resurgence', translations: { de: 'Warframe: 1999 – Prime Resurgence' }, link: 'https://www.warframe.com/news', imageLink: 'https://example.invalid/a.jpg', date: iso(-2 * D), update: true, primeAccess: false, stream: false, mobileOnly: false },
      { id: 'n2', message: 'Devstream 190', translations: { de: 'Devstream 190' }, link: 'https://www.warframe.com/news/devstream', imageLink: '', date: iso(-5 * D), update: false, stream: true, mobileOnly: false },
    ],
    events: [{ id: 'e1', description: T('Thermia Fractures', 'Thermia-Brüche'), node: 'Orb Vallis (Venus)', expiry: iso(3 * D), maximumScore: 100, currentScore: 42, rewards: [{ items: ['Opticor Vandal'], countedItems: [] }] }],
    alerts: [{ id: 'a1', expiry: iso(2 * H), mission: { type: T('Survival', 'Überleben'), node: 'Kappa (Sedna)', minEnemyLevel: 30, maxEnemyLevel: 40, reward: { items: ['Orokin Catalyst'], countedItems: [], credits: 20000 } } }],
    sortie: { id: 's1', activation: iso(-6 * H), expiry: iso(18 * H), boss: 'Vay Hek', faction: 'Grineer', variants: [
      { missionType: T('Exterminate', 'Vernichtung'), modifier: T('Radiation Hazard', 'Strahlungsgefahr'), modifierDescription: T('Radiation damage over time', 'Strahlungsschaden über Zeit'), node: 'Cervantes (Earth)' },
      { missionType: T('Spy', 'Spionage'), modifier: T('Augmented Enemy Armor', 'Verstärkte Rüstung'), node: 'Charybdis (Sedna)' },
      { missionType: T('Assassination', 'Attentat'), modifier: T('Eximus Stronghold', 'Eximus-Festung'), node: 'Oro (Earth)' }] },
    archonHunt: { id: 'ah1', activation: iso(-2 * D), expiry: iso(5 * D), boss: 'Archon Nira', faction: 'Narmer', missions: [
      { node: 'Rhea (Saturn)', type: T('Interception', 'Abfangen') }, { node: 'Kappa (Sedna)', type: T('Disruption', 'Störung') }, { node: 'Everest (Earth)', type: T('Assassination', 'Attentat') }] },
    archimedeas: [{ id: 'ar1', type: 'Deep Archimedea', typeKey: 'C T_LAB', missions: [
      { faction: 'Murmur', missionType: T('Survival', 'Überleben'), deviation: { name: 'Fractured Ranks', description: '' }, risks: [{ name: 'Commanding Culverins', isHard: false }, { name: 'Voidburn', isHard: true }] }],
      personalModifiers: [{ name: 'Framecurse Syndrome', description: '' }] }],
    syndicateMissions: [
      { id: 'sy1', syndicate: 'Ostrons', syndicateKey: 'Ostrons', expiry: iso(80 * M), nodes: [], jobs: [
        { type: T('Capture the Grineer Commander', 'Grineer-Kommandanten gefangen nehmen'), enemyLevels: [5, 15], standingStages: [370, 370, 370], minMR: 0, rewardPool: ['Vauban Chassis Blueprint', '300 Endo', 'Riven Sliver'] },
        { type: 'Eidolon', enemyLevels: [30, 50], standingStages: [1000, 1000, 1000, 1000, 1000], minMR: 5, rewardPool: ['Arcane Energize', 'Arcane Grace'], timeBound: 'night' }] },
      { id: 'sy2', syndicate: 'Solaris United', syndicateKey: 'Solaris United', expiry: iso(80 * M), nodes: [], jobs: [
        { type: 'Feed the Beast', enemyLevels: [15, 25], standingStages: [800, 800, 800], minMR: 0, rewardPool: ['Gyromag Systems', 'Toroid'] }] },
    ],
    fissures: [
      fis('f1', 'Lith', 'Hepit (Void)', T('Capture', 'Gefangennahme'), 'Corrupted', 25 * M, { key: 'Capture' }),
      fis('f2', 'Meso', 'Io (Jupiter)', T('Defense', 'Verteidigung'), 'Corpus', 50 * M, { key: 'Defense' }),
      fis('f3', 'Neo', 'Xini (Eris)', T('Interception', 'Abfangen'), 'Infested', 70 * M, { key: 'Interception' }),
      fis('f4', 'Axi', 'Apollo (Lua)', T('Disruption', 'Störung'), 'Corrupted', 3 * M, { key: 'Disruption' }),
      fis('f5', 'Requiem', 'Taveuni (Kuva Fortress)', T('Survival', 'Überleben'), 'Grineer', 90 * M, { key: 'Survival' }),
      fis('f6', 'Omnia', 'Tuvul Commons (Zariman)', T('Void Cascade', 'Void-Kaskade'), 'Crossfire', 110 * M, { key: 'Void Cascade' }),
      fis('f7', 'Axi', 'Mot (Void)', T('Survival', 'Überleben'), 'Corrupted', 55 * M, { key: 'Survival', isHard: true }),
      fis('f8', 'Neo', 'Korm\'s Belt (Earth Proxima)', T('Skirmish', 'Scharmützel'), 'Grineer', 40 * M, { key: 'Skirmish', isStorm: true }),
    ],
    invasions: [
      { id: 'i1', node: 'Cervantes (Earth)', desc: T('Grineer Offensive', 'Grineer-Offensive'), eta: '8h 12m', completed: false, completion: 62.5, requiredRuns: 3, vsInfestation: false,
        attacker: { faction: 'Grineer', factionKey: 'Grineer', reward: { items: ['Karak Wraith Barrel'], countedItems: [] } },
        defender: { faction: 'Corpus', factionKey: 'Corpus', reward: { items: [], countedItems: [{ count: 3, type: 'Fieldron' }] } } },
      { id: 'i2', node: 'Kiliken (Ceres)', desc: T('Infested Outbreak', 'Infizierter Ausbruch'), eta: '2h', completed: false, completion: 30, requiredRuns: 3, vsInfestation: true,
        attacker: { faction: 'Infested', factionKey: 'Infested', reward: undefined },
        defender: { faction: 'Grineer', factionKey: 'Grineer', reward: { items: ['Orokin Reactor Blueprint'], countedItems: [] } } },
    ],
    voidTrader: { id: 'b1', activation: iso(-20 * H), expiry: iso(28 * H), character: "Baro Ki'Teer", location: 'Larunda Relay (Mercury)', inventory: [
      { item: 'Primed Continuity', ducats: 350, credits: 110000 }, { item: 'Prisma Grakata', ducats: 525, credits: 300000 }, { item: 'Primed Flow', ducats: 400, credits: 100000 }] },
    dailyDeals: [{ id: 'dd1', item: 'Soma Prime', expiry: iso(9 * H), originalPrice: 200, salePrice: 150, total: 200, sold: 120, discount: 25 }],
    nightwave: { id: 'nw', season: 14, phase: 1, expiry: iso(60 * D), activeChallenges: [
      { id: 'c1', isDaily: true, isElite: false, title: T('Mercenary', 'Söldner'), desc: T('Kill 150 Enemies', 'Töte 150 Gegner'), reputation: 1000, expiry: iso(10 * H) },
      { id: 'c2', isDaily: false, isElite: false, title: T('Sabotage', 'Sabotage'), desc: T('Complete 3 Sabotage missions', 'Schließe 3 Sabotage-Missionen ab'), reputation: 4500, expiry: iso(4 * D) },
      { id: 'c3', isDaily: false, isElite: true, title: T('Eliminator', 'Eliminator'), desc: T('Kill 500 Enemies with Headshots', 'Töte 500 Gegner per Kopfschuss'), reputation: 7000, expiry: iso(4 * D) }] },
    arbitration: { id: 'arb', activation: iso(-10 * M), expiry: iso(50 * M), node: 'Hydron (Sedna)', type: T('Defense', 'Verteidigung'), enemy: 'Grineer', expired: false },
    steelPath: { activation: iso(-3 * D), expiry: iso(4 * D), currentReward: { name: 'Umbra Forma Blueprint', cost: 150 }, incursions: { id: 'inc', activation: iso(-5 * H), expiry: iso(19 * H) } },
    cetusCycle: { id: 'cc', activation: iso(-30 * M), expiry: iso(70 * M), isDay: true, state: 'day' },
    vallisCycle: { id: 'vc', activation: iso(-2 * M), expiry: iso(4 * M), isWarm: true, state: 'warm' },
    cambionCycle: { id: 'cb', activation: iso(-30 * M), expiry: iso(70 * M), state: 'fass' },
    zarimanCycle: { id: 'zc', activation: iso(-60 * M), expiry: iso(90 * M), isCorpus: true, state: 'corpus' },
    earthCycle: { id: 'ec', activation: iso(-1 * H), expiry: iso(3 * H), isDay: false, state: 'night' },
    duviriCycle: { id: 'du', activation: iso(-40 * M), expiry: iso(80 * M), state: 'sorrow', choices: [
      { category: 'normal', categoryKey: 'EXC_NORMAL', choices: ['Excalibur', 'Trinity', 'Nova', 'Ash', 'Frost'] },
      { category: 'hard', categoryKey: 'EXC_HARD', choices: ['Braton', 'Lato', 'Skana', 'Paris', 'Kunai'] }] },
  };
}
