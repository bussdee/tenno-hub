#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · tools/check.mjs – End-to-End-Prüfung aller Seiten
   Startet einen lokalen Server, öffnet jede Seite in Chromium (Desktop + Mobil,
   DE + EN) mit nachgebildeter Worldstate-API und meldet JS-Fehler.
   Optional: --shots  → Screenshots nach tools/.shots/
             --store  → Manifest-Screenshots nach social/
   Aufruf:  npm run check [-- --shots]
═══════════════════════════════════════════════════════════════ */
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mockWorldstate } from './fixtures/worldstate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(process.execPath, '..', '..', 'lib', 'node_modules', 'playwright'))); }
const SHOTS = process.argv.includes('--shots'), STORE = process.argv.includes('--store');
const DROPS = process.env.DROPS_FILE || join(ROOT, 'tools', 'fixtures', 'all.slim.json');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = join(ROOT, p);
  if (!f.startsWith(ROOT) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404, { 'Content-Type': 'text/html' }); res.end(readFileSync(join(ROOT, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}/`;

const PAGES = ['index.html', 'fissures.html', 'nightwave.html', 'invasions.html', 'bounties.html', 'duviri.html', 'daily.html', 'sortie.html', 'archon.html', 'baro.html',
  'relics.html', 'itemfinder.html?q=orokin', 'translator.html?q=serration', 'foundry.html', 'lich.html', 'roadmap.html', 'acquisition.html', 'glossary.html', '404.html', 'does-not-exist.html'];

const browser = await chromium.launch();
let failures = 0;
async function run(viewport, lang, mobile) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: STORE ? (mobile ? 2 : 1) : 1, locale: lang === 'de' ? 'de-DE' : 'en-US', serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { localStorage.setItem('th_lang', JSON.stringify(l)); } catch {} }, lang);
  await ctx.route('https://api.warframestat.us/**', r => r.fulfill({ json: mockWorldstate(new URL(r.request().url()).searchParams.get('language') || 'en') }));
  await ctx.route(/drops\.warframestat\.us|raw\.githubusercontent\.com/, r => existsSync(DROPS) ? r.fulfill({ path: DROPS, contentType: 'application/json' }) : r.fulfill({ status: 503 }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|cdn\.warframestat\.us|zentrale\.familienfabrik\.at|warframe\.market|warframe\.com/, r => r.abort());
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/net::ERR_FAILED|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(p.startsWith('relics') || p.startsWith('itemfinder') || p.startsWith('acquisition') ? 2500 : 900);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const errorStates = await page.locator('.state-error').count();
    if (overflow) errors.push('horizontaler Überlauf');
    if (errorStates) errors.push(`${errorStates}× Fehlerzustand gerendert`);
    const tag = `${mobile ? 'mobil ' : 'desktop'} ${lang} ${p}`;
    if (errors.length) { failures++; console.log('✗', tag, '\n   ' + errors.join('\n   ')); } else console.log('✓', tag);
    if (SHOTS) { mkdirSync(join(ROOT, 'tools', '.shots'), { recursive: true }); await page.screenshot({ path: join(ROOT, 'tools', '.shots', `${mobile ? 'm' : 'd'}-${lang}-${p.replace(/[^a-z]+/gi, '_')}.png`), fullPage: !mobile }); }
    await page.close();
  }
  await ctx.close();
}

async function storeShots() {
  const wide = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE', serviceWorkers: 'block' });
  const narrow = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE', serviceWorkers: 'block' });
  for (const ctx of [wide, narrow]) {
    await ctx.addInitScript(() => localStorage.setItem('th_lang', '"de"'));
    await ctx.route('https://api.warframestat.us/**', r => r.fulfill({ json: mockWorldstate('de') }));
    await ctx.route(/drops\.warframestat\.us|raw\.githubusercontent\.com/, r => r.fulfill({ path: DROPS, contentType: 'application/json' }));
    await ctx.route(/cdn\.warframestat\.us|zentrale|warframe\.market/, r => r.abort());
  }
  const shot = async (ctx, url, out, wait = 1500) => { const p = await ctx.newPage(); await p.goto(BASE + url); await p.waitForTimeout(wait); await p.screenshot({ path: join(ROOT, out) }); await p.close(); console.log('  ✓', out); };
  await shot(wide, 'index.html', 'social/screen-wide.png');
  await shot(narrow, 'index.html', 'social/screen-mobile-1.png');
  await shot(narrow, 'fissures.html', 'social/screen-mobile-2.png');
  await shot(narrow, 'relics.html?q=saryn', 'social/screen-mobile-3.png', 3000);
}

try {
  if (STORE) await storeShots();
  else {
    await run({ width: 1440, height: 900 }, 'de', false);
    await run({ width: 390, height: 844 }, 'en', true);
    if (!process.argv.includes('--quick')) { await run({ width: 1440, height: 900 }, 'en', false); await run({ width: 390, height: 844 }, 'de', true); }
  }
} finally { await browser.close(); server.close(); }
console.log(failures ? `\n${failures} Seite(n) mit Problemen` : '\nAlle Seiten fehlerfrei.');
process.exit(failures ? 1 : 0);
