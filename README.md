# TENNO.HUB

Warframe-Companion (DE/EN) als statische Progressive Web App – live unter
<https://tenno.familienfabrik.at>.

## Inhalt

- Dashboard mit Weltstatus (Fissuren, Sortie, Archon, Baro, Nightwave, Invasionen, Duviri)
- Relics, Item-Finder, Foundry, Lich, Frame-Beschaffung, Ressourcen
- Übersetzer & Glossar (DE ↔ EN), Roadmap, Daily-Checkliste
- Offline-fähig über Service Worker (`sw.js`) und `manifest.json`

## Struktur

| Pfad | Zweck |
|------|-------|
| `*.html` | Seiten (von Hand gepflegt; `build.py` ist **veraltet**, siehe unten) |
| `css/style.css` | Stylesheet |
| `js/` | Seitenlogik (`core.js`, `shell.js`, `worldstate.js`, …) |
| `icons/` | App-Icons (generiert von `build-icons.py`) |
| `.htaccess` | Apache-Konfiguration (HTTPS, Caching, Security-Header) |

## Build

```sh
python3 build-icons.py  # Icons neu erzeugen
```

> **`build.py` nicht ausführen.** Es ist veraltet: Es erzeugt andere HTML-Dateien als
> die eingecheckten (ohne SEO-/Open-Graph-/PWA-Meta-Tags und ohne `?v=`-Parameter) und
> kennt `foundry`, `itemfinder` und `lich` nicht. Die eingecheckten `*.html` sind die Wahrheit.

## Datenquellen

| Quelle | Genutzt für |
|--------|-------------|
| `api.warframestat.us` | Weltstatus (Fissuren, Invasionen, Zyklen, …), Item-Namen für den Übersetzer |
| `drops.warframestat.us` | Relics, Mod-/Blueprint-Finder |

`warframe.market` wird nicht mehr angesprochen (v1 abgeschaltet, v2 ohne CORS-Header, im Browser nicht nutzbar).

## Deployment

Den Repository-Inhalt (ohne `build*.py`, `README.md`, `HANDOVER.md`) in das Webroot eines
Apache-Servers kopieren. Bei jedem Release die Version `?v=…` in allen HTML-Dateien
und `CACHE_NAME` in `sw.js` gemeinsam erhöhen (aktuell **5.2**).

## Lokal testen

```sh
python3 -m http.server 8000
```
