#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · tools/build-data.mjs
   Erzeugt data/items.json aus @wfcd/items (offizielle DE-Client-Namen).
   Aufruf:  npm run build:data
   Format:  { v, n, items: [[en, de, cat, slug, img, buildSeconds?], …] }
     cat  = frame | weapon | mod | arcane | resource | part | companion | misc
     slug = warframe.market url_name ('' wenn nicht handelbar)
     img  = Dateiname auf cdn.warframestat.us/img ('' wenn keiner)
═══════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(ROOT, 'node_modules', '@wfcd', 'items');
const JSON_DIR = join(PKG, 'data', 'json');
const load = f => JSON.parse(readFileSync(join(JSON_DIR, f), 'utf8'));

const DE = load('i18n/de.json');
const deName = u => DE[u]?.name?.trim() || '';

/* Welche Dateien → welche Kategorie. Skins, Glyphen, Sigils, Gegner, Knoten
   und Quests sind für Übersetzer/Drop-Finder irrelevant und bleiben draußen. */
const FILES = {
  'Warframes.json': 'frame', 'Archwing.json': 'frame',
  'Primary.json': 'weapon', 'Secondary.json': 'weapon', 'Melee.json': 'weapon',
  'Arch-Gun.json': 'weapon', 'Arch-Melee.json': 'weapon', 'SentinelWeapons.json': 'weapon',
  'Mods.json': 'mod', 'Arcanes.json': 'arcane',
  'Resources.json': 'resource', 'Fish.json': 'resource',
  'Sentinels.json': 'companion', 'Pets.json': 'companion',
  'Gear.json': 'misc', 'Misc.json': 'misc', 'Railjack.json': 'misc',
};

const toSlug = n => n.toLowerCase().replace(/&/g, 'and').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

mkdirSync(join(ROOT, 'data'), { recursive: true });
const out = new Map();           // en name → row
const byUnique = new Map();      // uniqueName → {en, de}

function add(en, de, cat, slug = '', img = '', bt = 0) {
  en = (en || '').trim();
  if (!en || en.length < 2 || /^\//.test(en)) return;
  de = (de || '').trim() || en;
  const prev = out.get(en);
  if (prev) {
    /* bessere Infos nachtragen, niemals Kategorie verschlechtern */
    if (!prev[3] && slug) prev[3] = slug;
    if (!prev[4] && img) prev[4] = img;
    if (prev[1] === prev[0] && de !== en) prev[1] = de;
    return;
  }
  out.set(en, bt ? [en, de, cat, slug, img, bt] : [en, de, cat, slug, img]);
}

for (const [file, cat] of Object.entries(FILES)) {
  for (const it of load(file)) {
    if (!it?.name) continue;
    /* Beginner-/Flawed-/Conclave-Varianten tragen denselben Namen – egal, dedupe */
    const slug = it.marketInfo?.urlName || (it.tradable ? toSlug(it.name) : (it.isPrime && (cat === 'frame' || cat === 'weapon') ? toSlug(it.name) + '_set' : ''));
    const c = cat === 'misc' && (it.type === 'Resource' || /\/MiscItems\//.test(it.uniqueName)) ? 'resource' : cat;
    add(it.name, deName(it.uniqueName), c, slug, it.imageName || '', +it.buildTime || 0);
    byUnique.set(it.uniqueName, { en: it.name, de: deName(it.uniqueName) || it.name, cat });
  }
}

/* Bauteile: vollständiger Name steht in drops[].type ("Rhino Neuroptics Blueprint").
   Deutsch: "<Eltern-DE> <Bauteil-DE>" + " Blaupause" wo nötig. */
const BP_DE = deName('/Lotus/Types/Recipes/WarframeRecipes/RhinoBlueprint') || 'Blaupause';
for (const c of load('Components.json')) {
  const parentU = (c.parentUniqueNames || [])[0];
  const parent = byUnique.get(parentU);
  if (!parent || !c.name) continue;
  const full = (c.drops || []).find(d => d.type)?.type
    || (c.name === 'Blueprint' ? `${parent.en} Blueprint` : `${parent.en} ${c.name}`);
  if (!full.startsWith(parent.en)) continue;
  const compDe = deName(c.uniqueName) || c.name;
  let de = c.name === 'Blueprint' ? `${parent.de} ${BP_DE}` : `${parent.de} ${compDe}`;
  if (c.name !== 'Blueprint' && / Blueprint$/.test(full)) de += ` ${BP_DE}`;
  const slug = c.tradable ? toSlug(full) : '';
  add(full, de, 'part', slug, c.imageName || '');
}

/* Warframe-Übersicht für die Beschaffungs-Seite */
const WF = load('Warframes.json');
const frames = WF.filter(w => w.productCategory === 'Suits' && !w.isPrime).map(w => {
  const prime = WF.find(p => p.name === `${w.name} Prime`);
  const d = DE[w.uniqueName] || {};
  return {
    en: w.name, de: d.name || w.name, img: w.imageName || '', rel: w.releaseDate || '',
    desc: [String(w.description || '').trim(), String(d.description || w.description || '').trim()],
    hp: +w.health || 0, sh: +w.shield || 0, ar: +w.armor || 0, en_: +w.power || 0,
    prime: prime ? { v: prime.vaulted === true } : null,
  };
}).sort((a, b) => a.en.localeCompare(b.en));
writeFileSync(join(ROOT, 'data', 'frames.json'), JSON.stringify(frames));
console.log(`data/frames.json ${frames.length} Warframes`);

const items = [...out.values()].sort((a, b) => a[0].localeCompare(b[0]));
const pkgVersion = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8')).version;
const payload = { v: pkgVersion, n: items.length, items };

const file = join(ROOT, 'data', 'items.json');
writeFileSync(file, JSON.stringify(payload));
const counts = items.reduce((m, r) => (m[r[2]] = (m[r[2]] || 0) + 1, m), {});
console.log(`data/items.json  ${items.length} items  (${(JSON.stringify(payload).length / 1024).toFixed(0)} KB)  @wfcd/items ${pkgVersion}`);
console.log(counts);
