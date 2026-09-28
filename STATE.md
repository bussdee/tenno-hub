# STATE – Übergabe

**Version:** 6.0.0 (Branch `claude/wizardly-gates-tyxqyg`, noch nicht in `main`, noch nicht live)

## Was v6 gemacht hat
- Komplette Neuarchitektur: `js/app.js` + `js/pages/*`, Seiten aus `tools/build-pages.mjs` (altes, veraltetes `build.py` entfernt).
- API: 1 Worldstate-Request statt bis zu 10 pro Seite; Feldnamen nach warframe-worldstate-parser v5
  (u. a. behoben: Invasionen nutzten alte Felder, Cambion-Zyklus zeigte immer „Fass“, Relic-Seite rief nicht existierenden Endpunkt `/pc/relics` auf).
- Plattform-Auswahl entfernt (Worldstate ist seit Cross-Save plattformübergreifend).
- Deutsche Namen jetzt aus offiziellen Client-Daten (vorher u. a. falsch: Serration=„Aufsatz“ → „Einkerbung“).
- Inhaltliche Korrekturen: Syndikats-Limit 16.000 + 500×MR; Stahlpfad-Kachel = Teshins Wochenangebot; Warframe-Fundorte aus Drop-Tabellen statt fehlerhafter Handliste.
- Neu: Kopfgelder, News/Events/Darvo, Archimedea, Suche (Strg+K), Fissur-Wächter, Gießerei mit echten Bauzeiten, Export/Import, Update-Hinweis, Installations-Button/Anleitung.
- `resources.html` + `itemfinder.html` → ein Drop-Finder (301 in `.htaccess`).

## Validiert
- `tools/check.mjs`: alle 19 Seiten Desktop/Mobil, DE/EN ohne JS-Fehler/Überlauf – **mit nachgebildeter Worldstate-API**
  (Container hatte keinen Zugriff auf warframestat.us). Drop-Tabellen mit echter Datei getestet.
- Interaktionen (Suche, Sprachwechsel, Glocken, Fissur-Wächter, Relic-/Frame-Details, Checkliste, Gießerei) geprüft.

## Offen
1. **Gegen die echten APIs prüfen** (warframestat.us, drops, warframe.market inkl. CORS) und Normalisierung in `js/app.js` (`cycles`, `rewardText`, `traderActive`) sowie Seiten anpassen.
2. Manifest-Screenshots aus echten Daten erzeugen (`social/screen-*.png`, dann in `manifest.json` eintragen).
3. PR nach `main`, danach Deployment (siehe README).

## Versionsmarker
`package.json` → `version` (von build-pages in Seiten `?v=`, `sw.js` und Footer übernommen; `js/app.js` → `VERSION` von Hand gleich halten).
