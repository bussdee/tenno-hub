#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · tools/build-pages.mjs
   Erzeugt alle *.html-Seiten aus EINER Konfiguration (Kopfbereich, SEO,
   Social-Tags, Skripte). Seiteninhalte werden per JS gerendert.
   Aufruf:  npm run build:pages
═══════════════════════════════════════════════════════════════ */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const SITE = 'https://tenno.familienfabrik.at/';
const ANALYTICS = '<script defer src="https://zentrale.familienfabrik.at/funk/zaehler.js" data-projekt="tenno"></script>';

/* Zweisprachiger Text: t('English', 'Deutsch') → <span data-de="…">English</span> */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const t = (en, de, tag = 'span', attrs = '') => `<${tag}${attrs ? ' ' + attrs : ''} data-de="${esc(de)}">${en}</${tag}>`;
const ic = n => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const head = (icon, en, de, subEn, subDe, actions = '') => `
  <div class="page-head">
    <div><h1>${ic(icon)}${t(en, de)}</h1>${subEn ? t(subEn, subDe, 'p') : ''}</div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ''}
  </div>`;
const search = (id, en, de) => `<label class="search">${ic('search')}<span class="sr-only">${en}</span><input id="${id}" type="search" autocomplete="off" spellcheck="false" placeholder="${esc(en)}" data-de-ph="${esc(de)}"></label>`;
const count = id => `<span class="chip" id="${id}">…</span>`;
const skel = (n = 6, h = 140) => `<div class="grid-auto">${'<div class="skel" style="height:' + h + 'px"></div>'.repeat(n)}</div>`;

const PAGES = [
  { id: 'dashboard', file: 'index.html', icon: 'home', title: ['Live World State', 'Live-Weltstatus'],
    desc: ['Free Warframe companion: live cycles, Void Fissures, Sortie, Archon Hunt, Baro Ki\'Teer, Nightwave, invasions, relic planner and DE/EN translator. Installable as app.', 'Kostenloser Warframe-Begleiter: Live-Zyklen, Void-Fissuren, Sortie, Archon-Jagd, Baro Ki\'Teer, Nightwave, Invasionen, Relic-Planer und DE/EN-Übersetzer. Als App installierbar.'],
    scripts: ['pages/dashboard.js'],
    body: `
  <section class="hero">
    <div class="hero-top">
      <div><div class="eyebrow">${ic('radar')}${t('Warframe companion', 'Warframe-Begleiter')}</div>
        <h1>${t('World state', 'Weltstatus')}</h1><p class="muted" id="updated" style="margin:6px 0 0"></p></div>
      <div class="page-actions"><a class="btn btn-sm" href="daily.html">${ic('check')}${t('Checklist', 'Checkliste')}</a>
        <button class="btn btn-sm" type="button" data-action="notifs">${ic('bell')}${t('Alerts', 'Benachrichtigungen')}</button></div>
    </div>
    <div class="hero-grid" id="heroStats">${'<div class="skel" style="height:86px"></div>'.repeat(4)}</div>
  </section>
  <section class="section"><div class="section-head"><h2>${ic('sun')}${t('World cycles', 'Weltzyklen')}</h2></div>
    <div class="cycles" id="cycles">${'<div class="skel" style="height:190px"></div>'.repeat(5)}</div></section>
  <section class="section"><div class="section-head"><h2>${ic('bolt')}${t('Rotations', 'Rotationen')}</h2><a class="more" href="daily.html">${t('Checklist', 'Checkliste')}${ic('chevron')}</a></div>
    <div class="grid-3" id="rotations">${'<div class="skel" style="height:280px"></div>'.repeat(3)}</div></section>
  <section class="section"><div class="section-head"><h2>${ic('fissure')}${t('Void Fissures', 'Void-Fissuren')}</h2><a class="more" href="fissures.html">${t('All fissures', 'Alle Fissuren')}${ic('chevron')}</a></div>
    <div id="fisSummary"></div></section>
  <section class="section" id="alertsWrap" hidden><div class="section-head"><h2>${ic('alert')}${t('Alerts & events', 'Alarme & Events')}</h2></div>
    <div class="grid-auto" id="alerts"></div></section>
  <section class="section" id="newsWrap" hidden><div class="section-head"><h2>${ic('news')}${t('News', 'Neuigkeiten')}</h2></div>
    <div class="grid-auto" id="news"></div></section>` },

  { id: 'fissures', file: 'fissures.html', icon: 'fissure', title: ['Void Fissures', 'Void-Fissuren'],
    desc: ['All active Warframe Void Fissures live – filter by relic tier, Steel Path, Void Storm and mission type. Get notified when your fissure appears.', 'Alle aktiven Warframe-Void-Fissuren live – Filter nach Relic-Stufe, Stahlpfad, Void Storm und Missionstyp. Benachrichtigung, wenn deine Fissur erscheint.'],
    scripts: ['pages/fissures.js'],
    body: head('fissure', 'Void Fissures', 'Void-Fissuren', 'Crack relics for Prime parts. Bring a matching relic and collect 10 Reactant.', 'Relics für Prime-Teile öffnen. Passendes Relic mitnehmen und 10 Reaktant sammeln.',
      `${count('count')}<button class="btn btn-sm" type="button" data-action="notifs">${ic('bell')}${t('Fissure watch', 'Fissur-Wächter')}</button>`) + `
  <div class="toolbar"><div class="chips" id="modes"></div></div>
  <div class="toolbar"><div class="chips" id="tiers"></div></div>
  <div class="toolbar">${search('q', 'Search node, mission, faction…', 'Knoten, Mission, Fraktion suchen…')}<select id="type" style="max-width:260px"></select></div>
  <div id="list">${skel(9)}</div>` },

  { id: 'nightwave', file: 'nightwave.html', icon: 'radar', title: ['Nightwave', 'Nightwave'],
    desc: ['Current Nightwave challenges with standing overview – tick them off, progress is saved on your device.', 'Aktuelle Nightwave-Aufgaben mit Ansehens-Übersicht – abhaken, der Fortschritt wird auf deinem Gerät gespeichert.'],
    scripts: ['pages/nightwave.js'],
    body: head('radar', 'Nightwave', 'Nightwave', 'Tick off challenges – your progress stays on this device.', 'Aufgaben abhaken – dein Fortschritt bleibt auf diesem Gerät.') + `
  <div class="hero-grid mb" id="nwStats"></div>
  <div id="nw">${skel(6, 110)}</div>` },

  { id: 'invasions', file: 'invasions.html', icon: 'swords', title: ['Invasions', 'Invasionen'],
    desc: ['Active Warframe invasions with rewards for both sides – Orokin Reactors, Catalysts and weapon parts highlighted.', 'Aktive Warframe-Invasionen mit Belohnungen beider Seiten – Orokin-Reaktoren, Katalysatoren und Waffenteile hervorgehoben.'],
    scripts: ['pages/invasions.js'],
    body: head('swords', 'Invasions', 'Invasionen', 'Pick a side, finish 3 missions, get the reward. Valuable rewards are highlighted.', 'Seite wählen, 3 Missionen abschließen, Belohnung erhalten. Wertvolle Belohnungen sind hervorgehoben.',
      `${count('count')}<div class="chips"><button type="button" id="hot" aria-pressed="false">${ic('star')}${t('Only valuable', 'Nur wertvolle')}</button></div>`) + `
  <div class="grid-auto lg" id="list">${skel(6, 170)}</div>` },

  { id: 'bounties', file: 'bounties.html', icon: 'target', title: ['Bounties', 'Kopfgelder'],
    desc: ['Current open-world bounties for Cetus, Fortuna, Necralisk, Zariman and more – including all reward pools.', 'Aktuelle Open-World-Kopfgelder für Cetus, Fortuna, Necralisk, Zariman und mehr – inklusive aller Belohnungen.'],
    scripts: ['pages/bounties.js'],
    body: head('target', 'Bounties', 'Kopfgelder', 'All syndicate bounties with level, standing and reward pool. Search for a reward to find the right bounty.', 'Alle Syndikats-Kopfgelder mit Stufe, Ansehen und Belohnungen. Suche nach einer Belohnung, um das passende Kopfgeld zu finden.') + `
  <div class="toolbar">${search('q', 'Search reward, e.g. Arcane, Gyre, Toroid…', 'Belohnung suchen, z. B. Arcane, Gyre, Toroid…')}</div>
  <div class="grid-auto lg" id="list">${skel(4, 260)}</div>` },

  { id: 'duviri', file: 'duviri.html', icon: 'spiral', title: ['Duviri & Circuit', 'Duviri & Circuit'],
    desc: ['Current Duviri spiral and this week\'s Circuit choices – Warframes and Incarnon Genesis weapons.', 'Aktuelle Duviri-Spirale und die Circuit-Auswahl dieser Woche – Warframes und Incarnon-Genesis-Waffen.'],
    scripts: ['pages/duviri.js'],
    body: head('spiral', 'Duviri & Circuit', 'Duviri & Circuit', 'The Duviri spiral changes every 2 hours, the Circuit rotation every Monday.', 'Die Duviri-Spirale wechselt alle 2 Stunden, die Circuit-Rotation jeden Montag.') + `
  <div id="mood"><div class="skel" style="height:190px"></div></div>
  <section class="section" id="circuit"></section>` },

  { id: 'daily', file: 'daily.html', icon: 'check', title: ['Checklist', 'Checkliste'],
    desc: ['Daily and weekly Warframe checklist with live info and automatic reset at 00:00 UTC.', 'Tägliche und wöchentliche Warframe-Checkliste mit Live-Infos und automatischem Reset um 00:00 UTC.'],
    scripts: ['pages/daily.js'],
    body: head('check', 'Checklist', 'Checkliste', 'Resets automatically: daily at 00:00 UTC, weekly on Monday.', 'Setzt sich automatisch zurück: täglich um 00:00 UTC, wöchentlich am Montag.',
      `<label class="flex small muted">${t('Mastery Rank', 'Meisterschaftsrang')} <input id="mr" class="input" type="number" min="0" max="40" style="height:36px;width:76px"></label>
       <button class="btn btn-sm" type="button" id="edit"></button>`) + `
  <div class="hero-grid mb" id="stats"></div>
  <p class="muted small" id="editHint" hidden>${t('Uncheck tasks you do not want to see.', 'Entferne den Haken bei Aufgaben, die du nicht sehen willst.')}</p>
  <div class="group-hd"><h2>${ic('sun')}${t('Daily', 'Täglich')}</h2></div><div class="task-list" id="daily"></div>
  <div class="group-hd"><h2>${ic('clock')}${t('Weekly', 'Wöchentlich')}</h2></div><div class="task-list" id="weekly"></div>` },

  { id: 'sortie', file: 'sortie.html', icon: 'bolt', title: ['Daily Sortie', 'Tägliche Sortie'],
    desc: ['Today\'s Warframe Sortie: boss, missions, modifiers and reset timer.', 'Heutige Warframe-Sortie: Boss, Missionen, Modifikatoren und Reset-Timer.'],
    scripts: ['pages/sortie.js'],
    body: head('bolt', 'Daily Sortie', 'Tägliche Sortie', 'Three missions in a row with special conditions. Reward after the third mission.', 'Drei Missionen hintereinander mit Spezialbedingungen. Belohnung nach der dritten Mission.') + `
  <div id="main-card"><div class="skel" style="height:320px"></div></div>` },

  { id: 'archon', file: 'archon.html', icon: 'crown', title: ['Archon Hunt', 'Archon-Jagd'],
    desc: ['This week\'s Archon Hunt and Archimedea missions with modifiers.', 'Die Archon-Jagd und Archimedea-Missionen dieser Woche mit Modifikatoren.'],
    scripts: ['pages/sortie.js'],
    body: head('crown', 'Archon Hunt', 'Archon-Jagd', 'Weekly three-mission chain against an Archon – reward: Archon Shards.', 'Wöchentliche Drei-Missionen-Kette gegen einen Archon – Belohnung: Archon-Scherben.') + `
  <div id="main-card"><div class="skel" style="height:320px"></div></div>
  <section class="section" id="archimedea" hidden></section>` },

  { id: 'baro', file: 'baro.html', icon: 'coins', title: ["Baro Ki'Teer", "Baro Ki'Teer"],
    desc: ["When and where Baro Ki'Teer arrives – and his full inventory with Ducat and Credit prices.", "Wann und wo Baro Ki'Teer ankommt – und sein komplettes Inventar mit Dukaten- und Credit-Preisen."],
    scripts: ['pages/baro.js'],
    body: head('coins', "Baro Ki'Teer", "Baro Ki'Teer", 'The Void Trader visits a relay every two weeks for 48 hours.', 'Der Void-Händler besucht alle zwei Wochen für 48 Stunden ein Relais.') + `
  <div id="hero"><div class="skel" style="height:230px"></div></div>
  <section class="section" id="invWrap" hidden>
    <div class="section-head"><h2>${ic('coins')}${t('Inventory', 'Inventar')}</h2><span class="chip" id="invCount"></span></div>
    <div class="toolbar">${search('q', 'Search inventory…', 'Inventar durchsuchen…')}</div>
    <div id="inv"></div></section>` },

  { id: 'relics', file: 'relics.html', icon: 'relic', title: ['Relic Planner', 'Relic-Planer'],
    desc: ['Find the relic for every Prime part: drop chances per refinement, vaulted status, where to farm relics and active fissures.', 'Finde das Relic für jedes Prime-Teil: Drop-Chancen je Verfeinerung, Tresor-Status, Farm-Orte der Relics und aktive Fissuren.'],
    scripts: ['pages/relics.js'],
    body: head('relic', 'Relic Planner', 'Relic-Planer', 'Search a Prime part or relic. Click a relic for refinement chances and where to farm it.', 'Suche ein Prime-Teil oder Relic. Klicke ein Relic für Verfeinerungs-Chancen und Farm-Orte.', count('count')) + `
  <div class="hero-grid mb" id="fisStrip"></div>
  <div class="toolbar">${search('q', 'e.g. Saryn Prime, Neuroptics, Axi S…', 'z. B. Saryn Prime, Neuroptik, Axi S…')}</div>
  <div class="toolbar"><div class="chips" id="tiers"></div><span class="sep"></span><div class="chips" id="avail"></div></div>
  <div class="grid-auto" id="grid"></div>` },

  { id: 'itemfinder', file: 'itemfinder.html', icon: 'search', title: ['Drop Finder', 'Drop-Finder'],
    desc: ['Where to farm anything in Warframe: resources, mods, blueprints and Prime parts – from the official drop tables, searchable in German and English.', 'Wo farme ich was in Warframe: Ressourcen, Mods, Blaupausen und Prime-Teile – aus den offiziellen Drop-Tabellen, auf Deutsch und Englisch durchsuchbar.'],
    scripts: ['data/tips.js', 'pages/itemfinder.js'],
    body: head('search', 'Drop Finder', 'Drop-Finder', 'Where do I get…? Official drop tables for every mission, bounty, relic and enemy – searchable in German and English.', 'Wo bekomme ich …? Offizielle Drop-Tabellen aller Missionen, Kopfgelder, Relics und Gegner – auf Deutsch und Englisch durchsuchbar.', count('count')) + `
  <div class="toolbar">${search('q', 'Item, resource, mod or part (EN or DE)…', 'Item, Ressource, Mod oder Bauteil (DE oder EN)…')}</div>
  <div class="toolbar"><div class="chips" id="kinds"></div></div>
  <div class="grid-auto lg" id="results"></div>` },

  { id: 'translator', file: 'translator.html', icon: 'lang', title: ['DE / EN Translator', 'DE / EN-Übersetzer'],
    desc: ['Translate Warframe item names between the German and English game client – mods, Warframes, weapons, parts and resources. Works offline.', 'Warframe-Item-Namen zwischen deutschem und englischem Spiel-Client übersetzen – Mods, Warframes, Waffen, Bauteile und Ressourcen. Funktioniert offline.'],
    scripts: ['pages/translator.js'],
    body: head('lang', 'DE / EN Translator', 'DE / EN-Übersetzer', 'Builds and guides use English names – the German client often uses completely different ones. Official names from the game data.', 'Builds und Guides nutzen englische Namen – der deutsche Client oft völlig andere. Offizielle Namen aus den Spieldaten.', count('count')) + `
  <div class="toolbar">${search('q', 'e.g. Serration, Einkerbung, Primed Continuity…', 'z. B. Einkerbung, Serration, Primed Kontinuität…')}</div>
  <div class="toolbar"><div class="chips" id="cats"></div></div>
  <div class="grid-auto lg" id="grid"></div>` },

  { id: 'foundry', file: 'foundry.html', icon: 'hammer', title: ['Foundry Timers', 'Gießerei-Timer'],
    desc: ['Track your Warframe foundry build timers with exact build times and get notified when items are ready.', 'Behalte deine Warframe-Gießerei-Bauzeiten im Blick – mit exakten Bauzeiten und Benachrichtigung bei Fertigstellung.'],
    scripts: ['pages/foundry.js'],
    body: head('hammer', 'Foundry Timers', 'Gießerei-Timer', 'Start a timer for everything you build – with exact build times from the game data.', 'Starte einen Timer für alles, was du baust – mit exakten Bauzeiten aus den Spieldaten.') + `
  <form class="card mb" id="addForm" autocomplete="off">
    <div class="form-grid">
      <label class="field">${t('What are you building?', 'Was baust du?')}<input class="input" id="name" placeholder="Rhino, Forma, Orokin Reactor…" data-de-ph="Rhino, Forma, Orokin Reaktor…"></label>
      <label class="field">${t('Duration (hours)', 'Dauer (Stunden)')}<input class="input" id="hours" inputmode="decimal" placeholder="24"></label>
      <button class="btn btn-primary" type="submit">${ic('plus')}${t('Start timer', 'Timer starten')}</button>
    </div>
    <div class="chips mt" id="sugg"></div>
    <div class="flex wrap mt small muted">${t('Presets', 'Vorlagen')}: <div class="chips" id="presets"></div></div>
  </form>
  <div class="grid-auto" id="list"></div>` },

  { id: 'lich', file: 'lich.html', icon: 'skull', title: ['Lich / Sister Tracker', 'Lich-/Schwester-Tracker'],
    desc: ['Track your Kuva Lich, Sister of Parvos or Technocyte Coda: weapon, element and Requiem sequence.', 'Verfolge deinen Kuva-Lich, deine Schwester von Parvos oder Technocyte Coda: Waffe, Element und Requiem-Reihenfolge.'],
    scripts: ['pages/lich.js'],
    body: head('skull', 'Lich / Sister Tracker', 'Lich-/Schwester-Tracker', 'Note the Requiem mods you tested – confirmed ✓ or wrong ✗. Saved on this device.', 'Notiere getestete Requiem-Mods – bestätigt ✓ oder falsch ✗. Gespeichert auf diesem Gerät.') + `
  <div class="grid-auto lg" id="list"></div>
  <form class="card mt-lg" id="addForm" autocomplete="off">
    <div class="card-lbl mb">${ic('plus')}${t('New nemesis', 'Neuer Nemesis')}</div>
    <div class="form-grid">
      <label class="field">${t('Type', 'Typ')}<select id="type" name="type"></select></label>
      <label class="field">${t('Name', 'Name')}<input class="input" name="name"></label>
      <label class="field">${t('Weapon', 'Waffe')}<input class="input" name="weapon" placeholder="Kuva Bramma"></label>
      <label class="field">${t('Element', 'Element')}<select id="element" name="element"></select></label>
      <label class="field">${t('Bonus %', 'Bonus %')}<input class="input" name="pct" inputmode="numeric" placeholder="60"></label>
      <button class="btn btn-primary" type="submit">${ic('plus')}${t('Add', 'Hinzufügen')}</button>
    </div>
  </form>` },

  { id: 'roadmap', file: 'roadmap.html', icon: 'map', title: ['Beginner Roadmap', 'Einsteiger-Roadmap'],
    desc: ['Warframe beginner roadmap in 5 chapters – from the tutorial to Steel Path. Progress saved on your device.', 'Warframe-Einsteiger-Roadmap in 5 Kapiteln – vom Tutorial bis zum Stahlpfad. Fortschritt auf deinem Gerät gespeichert.'],
    scripts: ['data/roadmap.js', 'pages/roadmap.js'],
    body: head('map', 'Beginner Roadmap', 'Einsteiger-Roadmap', 'Warframe throws a lot at you at once – five chapters tell you what to do next.', 'Warframe wirft viel auf einmal auf dich – fünf Kapitel zeigen dir, was als Nächstes kommt.',
      `<button class="btn btn-sm btn-danger" type="button" id="reset">${ic('refresh')}${t('Reset', 'Zurücksetzen')}</button>`) + `
  <div class="card mb" id="overall"></div>
  <div class="grid" id="chapters"></div>` },

  { id: 'acquisition', file: 'acquisition.html', icon: 'frame', title: ['Warframes', 'Warframes'],
    desc: ['Every Warframe with live drop locations for all components and Prime relics.', 'Jeder Warframe mit Live-Fundorten aller Bauteile und Prime-Relics.'],
    scripts: ['pages/acquisition.js'],
    body: head('frame', 'Warframes', 'Warframes', 'Where do I get this frame? Click a Warframe for the drop locations of every component.', 'Wo bekomme ich diesen Frame? Klicke einen Warframe für die Fundorte aller Bauteile.', count('count')) + `
  <div class="toolbar">${search('q', 'Search Warframe…', 'Warframe suchen…')}</div>
  <div class="toolbar"><div class="chips" id="kinds"></div></div>
  <div class="grid-auto" id="grid"></div>` },

  { id: 'glossary', file: 'glossary.html', icon: 'book', title: ['Glossary', 'Glossar'],
    desc: ['Warframe jargon explained in plain words – English and German terms.', 'Warframe-Fachbegriffe verständlich erklärt – mit englischen und deutschen Begriffen.'],
    scripts: ['data/glossary.js', 'pages/glossary.js'],
    body: head('book', 'Glossary', 'Glossar', 'Riven, Galvanized, Incarnon, Eidolon … explained in plain words.', 'Riven, Galvanisiert, Incarnon, Eidolon … verständlich erklärt.', count('count')) + `
  <div class="toolbar">${search('q', 'Search term…', 'Begriff suchen…')}</div>
  <div class="toolbar"><div class="chips" id="cats"></div></div>
  <div class="grid-auto" id="grid"></div>` },

  { id: 'notfound', file: '404.html', icon: 'fissure', title: ['Page not found', 'Seite nicht gefunden'], noindex: true,
    desc: ['This page does not exist.', 'Diese Seite existiert nicht.'], scripts: [],
    body: `<div class="card center" style="max-width:560px;margin:8vh auto;padding:40px 24px">
    <div style="font:700 88px/1 var(--font-d);color:var(--gold);opacity:.35">404</div>
    ${t('Tenno, this node does not exist.', 'Tenno, dieser Knoten existiert nicht.', 'h1', 'style="margin:10px 0"')}
    ${t('The page was vaulted, moved or never existed.', 'Die Seite wurde eingelagert, verschoben oder hat nie existiert.', 'p', 'class="muted"')}
    <div class="btn-row" style="justify-content:center"><a class="btn btn-primary" href="/">${ic('home')}${t('To the dashboard', 'Zum Dashboard')}</a>
      <button class="btn" type="button" data-action="palette">${ic('search')}${t('Search', 'Suchen')}</button></div></div>` },
];

function page(p) {
  const url = SITE + (p.file === 'index.html' ? '' : p.file);
  const title = `${p.title[0]} · TENNO.HUB`, titleDe = `${p.title[1]} · TENNO.HUB`;
  const scripts = ['app.js', ...p.scripts].map(s => `<script src="js/${s}?v=${VERSION}"></script>`).join('\n');
  const ld = p.id === 'dashboard' ? `
<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebApplication', name: 'TENNO.HUB', url: SITE,
    description: p.desc[0], applicationCategory: 'GameApplication', operatingSystem: 'Any', inLanguage: ['de', 'en'],
    isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    author: { '@type': 'Organization', name: 'familienfabrik.at', url: 'https://familienfabrik.at' } })}</script>` : '';
  return `<!DOCTYPE html>
<html lang="de" data-page="${p.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="th-title-de" content="${esc(titleDe)}">
<meta name="description" content="${esc(p.desc[1])}">
${p.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#06080d">
<meta name="color-scheme" content="dark">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="TENNO.HUB">
<meta name="application-name" content="TENNO.HUB">
<link rel="manifest" href="manifest.json">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="icons/favicon.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TENNO.HUB">
<meta property="og:title" content="${esc(titleDe)}">
<meta property="og:description" content="${esc(p.desc[1])}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}social/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="de_DE">
<meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.warframestat.us" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Rajdhani:wght@600;700&display=swap">
<link rel="stylesheet" href="css/app.css?v=${VERSION}">${ld}
</head>
<body>
<main id="main">
${p.body}
</main>
<noscript><div class="callout" style="margin:16px">TENNO.HUB benötigt JavaScript. / TENNO.HUB requires JavaScript.</div></noscript>
${scripts}
${ANALYTICS}
</body>
</html>
`;
}

for (const p of PAGES) {
  writeFileSync(join(ROOT, p.file), page(p));
  console.log(`  ✓ ${p.file}`);
}

/* Alte URL: resources.html → Drop-Finder (zusätzlich 301 in .htaccess) */
writeFileSync(join(ROOT, 'resources.html'), `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><title>TENNO.HUB</title><meta name="robots" content="noindex">
<link rel="canonical" href="${SITE}itemfinder.html"><meta http-equiv="refresh" content="0; url=itemfinder.html">
<script>location.replace('itemfinder.html' + location.search);</script></head>
<body><a href="itemfinder.html">Drop-Finder</a></body></html>
`);

/* Sitemap */
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.filter(p => !p.noindex).map(p => `  <url><loc>${SITE}${p.file === 'index.html' ? '' : p.file}</loc><lastmod>${today}</lastmod><changefreq>${['dashboard', 'fissures', 'invasions', 'baro', 'bounties'].includes(p.id) ? 'hourly' : 'weekly'}</changefreq><priority>${p.id === 'dashboard' ? '1.0' : '0.7'}</priority></url>`).join('\n')}
</urlset>
`);
console.log(`\n${PAGES.length} Seiten + resources.html-Weiterleitung + sitemap.xml · v${VERSION}`);

/* Service Worker: Version + Precache-Liste einstempeln (jede Änderung → neuer SW → Update-Hinweis) */
const precache = {
  v: VERSION,
  files: ['./', ...PAGES.map(p => p.file), 'css/app.css', 'js/app.js', ...new Set(PAGES.flatMap(p => p.scripts.map(s => 'js/' + s))),
    'manifest.json', 'icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/mark.svg', 'data/frames.json'],
};
const h = createHash('sha256');
for (const f of precache.files) if (f !== './' && existsSync(join(ROOT, f))) h.update(readFileSync(join(ROOT, f)));
h.update(readFileSync(join(ROOT, 'data', 'items.json')));
precache.hash = h.digest('hex').slice(0, 10);
const swPath = join(ROOT, 'sw.js');
const sw = readFileSync(swPath, 'utf8').replace(/\/\* @precache \*\/[^\n]*/, `/* @precache */ const PRECACHE = ${JSON.stringify(precache)};`);
writeFileSync(swPath, sw);
console.log(`sw.js: ${precache.files.length} Dateien vorab gecacht`);
