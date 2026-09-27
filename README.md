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
| `*.html` | Seiten (generiert von `build.py`) |
| `css/style.css` | Stylesheet |
| `js/` | Seitenlogik (`core.js`, `shell.js`, `worldstate.js`, …) |
| `icons/` | App-Icons (generiert von `build-icons.py`) |
| `.htaccess` | Apache-Konfiguration (HTTPS, Caching, Security-Header) |

## Build

```sh
python3 build.py        # HTML-Seiten neu erzeugen
python3 build-icons.py  # Icons neu erzeugen
```

## Deployment

Den Repository-Inhalt (ohne `build*.py`, `README.md`) in das Webroot eines
Apache-Servers kopieren.

## Lokal testen

```sh
python3 -m http.server 8000
```
