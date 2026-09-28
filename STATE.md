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
- Frühere Sitzung: Seiten nur mit nachgebauter Worldstate-API geprüft – **das zählt nicht als Validierung**. Mock (`tools/fixtures/worldstate.mjs`) ist entfernt.
- Sitzung 2026-09-28: **Echte APIs aus dem Container nicht erreichbar** – der Netzwerk-Policy-Proxy lehnt ab (403 auf CONNECT):
  `api.warframestat.us`, `drops.warframestat.us`, `cdn.warframestat.us`, `api.warframe.market` (außerdem `zentrale.familienfabrik.at`).
  Daher **nicht** geprüft: echte Worldstate-Antwort, CORS-Header (Origin tenno.familienfabrik.at), Seiten mit echten Daten, Manifest-Screenshots.
- Stattdessen Feldnamen gegen den Quellcode von `warframe-worldstate-parser@5.5.6` + `warframe-worldstate-data@3.16.10` (npm, darauf läuft api.warframestat.us) abgeglichen –
  Cycles (isDay/isWarm/isCorpus/state, Cambion fass/vome, Duviri-Zustände + choices normal/hard), Sortie (variants), archonHunt (missions mit `type`), archimedeas,
  syndicateMissions (Syndikatsnamen), fissures, invasions (attacker/defender), voidTrader, dailyDeals, nightwave, arbitration (Platzhalter SolNode000 mit expired=true), steelPath, news, events, alerts: passen.
  **Einziger Fehler gefunden:** `countedItems` enthält im Parser auch die `items` → `rewardText` hat Belohnungen doppelt gelistet (behoben).
  Unsicher: Getter (`active`, `eta`, `expired`) sind nur in der Antwort, wenn die API sie serialisiert – Code fällt bei `active` auf Zeitstempel zurück, `eta` ist optional.
- Fehlerfall mit echter (blockierter) Verbindung in Chromium geprüft: keine JS-Fehler, kein Überlauf, Fehlerkarte mit „Erneut versuchen“; Netzwerkfehler jetzt übersetzt statt „Failed to fetch“.

## Offen
1. **In einer Umgebung mit Netzzugang** (Domains oben in der Netzwerk-Freigabe der Umgebung erlauben) `npm run check -- --shots` ausführen und Screenshots ansehen.
   `tools/check.mjs` nutzt jetzt nur die echten APIs und bricht mit Exit-Code 2 ab, wenn sie nicht erreichbar sind.
2. CORS prüfen: `curl -sI -H 'Origin: https://tenno.familienfabrik.at' 'https://api.warframe.market/v2/orders/item/serration/top'` (+ Preflight wegen Headern `Platform`/`Crossplay`).
   Ohne `Access-Control-Allow-Origin` → `marketPrice` in `js/app.js` und Aufrufer entfernen, nur Links behalten.
3. Manifest-Screenshots: `npm run check -- --store` (erzeugt `social/screen-wide.png`, `social/screen-mobile-1..3.png`), dann in `manifest.json` → `screenshots` eintragen
   (`form_factor: "wide"` 1440×900 bzw. `"narrow"` 780×1688).
4. PR nach `main`, danach Deployment (siehe README).

## Versionsmarker
`package.json` → `version` (von build-pages in Seiten `?v=`, `sw.js` und Footer übernommen; `js/app.js` → `VERSION` von Hand gleich halten).
