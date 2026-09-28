#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB · tools/build-icons.mjs
   Rendert App-Icons, Maskable-Icon, Badge und Social-Vorschaubild
   mit Chromium (Playwright) aus SVG/HTML.   Aufruf: npm run build:icons
═══════════════════════════════════════════════════════════════ */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(join(process.execPath, '..', '..', 'lib', 'node_modules', 'playwright'))); }

const LOGO = (stroke = 1) => `
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8e3a8"/><stop offset="1" stop-color="#bf953d"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6fd3ff" stop-opacity=".35"/><stop offset="1" stop-color="#6fd3ff" stop-opacity="0"/></radialGradient></defs>
  <circle cx="50" cy="50" r="34" fill="url(#glow)"/>
  <path d="M50 14 81 32v36L50 86 19 68V32Z" fill="none" stroke="url(#g)" stroke-width="${4.2 * stroke}" stroke-linejoin="round"/>
  <path d="M50 30 67 40v20L50 70 33 60V40Z" fill="none" stroke="#6fd3ff" stroke-width="${3.2 * stroke}" stroke-linejoin="round"/>
  <path d="M50 14v16M81 32 67 40M81 68l-14-8M50 86V70M19 68l14-8M19 32l14 8" stroke="url(#g)" stroke-width="${2.2 * stroke}" opacity=".6"/>
  <circle cx="50" cy="50" r="7" fill="url(#g)"/>`;

const BG = `<defs><radialGradient id="bg" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="#16233a"/><stop offset=".6" stop-color="#0b111c"/><stop offset="1" stop-color="#06080d"/></radialGradient></defs>`;
const appIcon = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${BG}<rect width="100" height="100" ${pad ? '' : 'rx="22"'} fill="url(#bg)"/>
  <g transform="translate(${pad ? 18 : 8} ${pad ? 18 : 8}) scale(${pad ? .64 : .84})">${LOGO()}</g></svg>`;
const badge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 8 86 29v42L50 92 14 71V29Z" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"/><path d="M50 30 67 40v20L50 70 33 60V40Z" fill="#fff"/></svg>`;

const og = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Rajdhani:wght@700&display=block" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Inter,sans-serif;color:#e9edf5;
background:radial-gradient(700px 400px at 85% 10%,rgba(98,205,255,.25),transparent 60%),radial-gradient(700px 420px at 0% 100%,rgba(226,189,102,.22),transparent 60%),linear-gradient(135deg,#111a29,#06080d)}
.wrap{position:absolute;inset:0;padding:70px 80px;display:flex;flex-direction:column;justify-content:center}
h1{font:700 92px/1 Rajdhani,'DejaVu Sans',sans-serif;letter-spacing:4px;margin:0}h1 b{background:linear-gradient(180deg,#f8e3a8,#c9a045);-webkit-background-clip:text;color:transparent}h1 i{font-style:normal;color:#62cdff}
p{font-size:31px;color:#aab4c6;margin:18px 0 34px;max-width:640px;line-height:1.3}
.tags{display:flex;gap:12px;flex-wrap:wrap;max-width:660px}.tags span{padding:10px 18px;border-radius:99px;border:1px solid rgba(160,190,230,.2);background:rgba(255,255,255,.05);font-size:22px;font-weight:700}
svg{position:absolute;right:50px;top:125px;width:380px;height:380px;filter:drop-shadow(0 0 40px rgba(226,189,102,.35))}</style></head>
<body><svg viewBox="0 0 100 100">${LOGO(.8)}</svg><div class="wrap"><h1><b>TENNO</b><i>.HUB</i></h1>
<p>Warframe-Begleiter · Live-Weltstatus, Relics, Drops &amp; DE/EN-Übersetzer</p>
<div class="tags"><span>Fissuren</span><span>Baro</span><span>Nightwave</span><span>Relic-Planer</span><span>Drop-Finder</span><span>PWA</span></div></div></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
async function render(svgOrHtml, w, h, out, transparent = false) {
  const html = svgOrHtml.startsWith('<!doctype') ? svgOrHtml
    : `<!doctype html><html><body style="margin:0;background:transparent">${svgOrHtml.replace('<svg ', `<svg width="${w}" height="${h}" `)}</body></html>`;
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(html, { waitUntil: 'networkidle' }).catch(() => page.setContent(html));
  await page.screenshot({ path: join(ROOT, out), omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
  console.log('  ✓', out);
}
mkdirSync(join(ROOT, 'social'), { recursive: true });
await render(appIcon(false), 192, 192, 'icons/icon-192.png', true);
await render(appIcon(false), 512, 512, 'icons/icon-512.png', true);
await render(appIcon(true), 512, 512, 'icons/icon-maskable-512.png');
await render(appIcon(true), 192, 192, 'icons/icon-maskable-192.png');
await render(appIcon(true), 180, 180, 'icons/apple-touch-icon.png');
await render(appIcon(false), 32, 32, 'icons/favicon.png', true);
await render(badge, 96, 96, 'icons/badge-96.png', true);
await render(og, 1200, 630, 'social/og-image.png');
await browser.close();
