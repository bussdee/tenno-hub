# TENNO.HUB

Warframe-Begleiter (DE/EN) als installierbare Web-App (PWA) – live unter
<https://tenno.familienfabrik.at>.

## Funktionen

| Bereich | Seiten |
|---|---|
| **Live** | Dashboard (Zyklen, Sortie, Archon, Baro, Stahlpfad, Darvo, Alarme, Events, News), Void-Fissuren, Nightwave, Invasionen, Kopfgelder, Duviri/Circuit |
| **Rotationen** | Tages-/Wochen-Checkliste mit Live-Infos, Sortie, Archon-Jagd + Archimedea, Baro Ki'Teer |
| **Werkzeuge** | Relic-Planer (Verfeinerung, Tresor-Status, Farm-Orte), Drop-Finder, DE/EN-Übersetzer, Gießerei-Timer, Lich-/Schwester-Tracker |
| **Guides** | Einsteiger-Roadmap, Warframes (Fundorte aller Bauteile), Glossar |

Dazu: Suche über alle Seiten und ~6.300 Items (Strg+K), Benachrichtigungen
(Zyklen, Baro, Alarme, Fissur-Wächter), Offline-Betrieb, Export/Import der lokalen Daten.

## Datenquellen

- **Weltstatus:** `api.warframestat.us/pc/?language=de|en` – *ein* Request für alles, 60 s Cache, Stale-While-Revalidate.
- **Drop-Tabellen:** `drops.warframestat.us/data/all.slim.json` (Fallback: GitHub) – Relics, Drop-Finder, Warframe-Fundorte.
- **Namen EN↔DE, Bilder, Bauzeiten:** `data/items.json` + `data/frames.json`, generiert aus [`@wfcd/items`](https://www.npmjs.com/package/@wfcd/items) (offizielle Client-Übersetzungen).
- **Preise/Links:** warframe.market.

## Struktur

```
*.html            generierte Seiten (nicht von Hand bearbeiten → tools/build-pages.mjs)
css/app.css       Design-System
js/app.js         Kern: API-Schicht, Ticker, i18n, Shell, Suche, Benachrichtigungen, PWA
js/pages/*.js     eine Datei pro Seite
js/data/*.js      kuratierte Inhalte (Glossar, Roadmap, Farm-Tipps)
data/*.json       generierte Item-/Frame-Daten
sw.js             Service Worker (Precache-Liste wird vom Build eingestempelt)
tools/            Build- und Prüfskripte (werden nicht ausgeliefert)
```

## Entwicklung

```sh
npm install                 # lädt @wfcd/items (nur für build:data)
npm run build:data          # data/items.json + data/frames.json neu erzeugen
npm run build:pages         # alle HTML-Seiten, sitemap.xml, sw.js-Precache
node tools/build-icons.mjs  # Icons + Social-Bild (braucht Playwright/Chromium)
npm run check               # alle Seiten in Chromium prüfen (Desktop/Mobil, DE/EN)
npm run serve               # lokal unter http://localhost:8080
```

## Deployment

Ins Webroot (Apache) kopieren: alle `*.html`, `css/`, `js/`, `data/`, `icons/`,
`social/`, `sw.js`, `manifest.json`, `robots.txt`, `sitemap.xml`, `.htaccess`.
**Nicht** kopieren: `tools/`, `node_modules/`, `package*.json`, `*.md`.

Nach jeder Änderung `npm run build:pages` ausführen – das stempelt einen neuen
Service-Worker-Hash ein, damit installierte Apps „Neue Version verfügbar“ anzeigen.
