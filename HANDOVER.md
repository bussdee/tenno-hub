# HANDOVER – TENNO.HUB v5.2 (Bugfix-Release)

Stand: 2026-09-29 · Branch `claude/tender-wright-21b5at` · Basis-Commit `c21707a` · Release **5.2**
Projektordner: `Websites/tenno.familienfabrik.at` (Git-Checkout dieser Branch). LIVE: `https://tenno.familienfabrik.at` (Apache, statische PWA, kein Build-System).

> **Nicht ins Webroot kopieren:** `HANDOVER.md`, `README.md`, `build.py`, `build-icons.py`, `.gitignore`, `.git/`.
> **`build.py` nicht ausführen** (veraltet, würde die HTML-Dateien zerstören, siehe C1). Die eingecheckten HTML-Dateien sind die Wahrheit.
> **Kein Pull Request** ohne ausdrückliche Bitte des Nutzers. Das LIVE-Deployment macht der Nutzer.

## Kurzfassung

Ausgangslage: Die API war im alten Chat nur durch eine Netzwerksperre der Cloud-Sitzung blockiert. Die Live-Prüfung (Anhang A, Abschnitt 3/3a) zeigte dann echte Fehler: Die Live-APIs liefern zum Teil andere Formate, als der Code erwartet, `market/v1` ist abgeschaltet und `market/v2` sendet keine CORS-Header.

Entscheidung des Nutzers: **Zu kompliziert, Marktpreise/Proxy fliegen raus.** Umgesetzt wurde deshalb ein gezielter Bugfix-Release ohne neue Architektur.

**Bewusst nicht gebaut** (waren im ursprünglichen Vorschlag): zentrale `js/api.js` mit Provider-Konfiguration, `status.html`, Proxy für warframe.market, CI/Playwright-Tests, Änderungen an `.htaccess`.

## Was in 5.2 geändert wurde

| ID | Änderung | Datei |
|---|---|---|
| B3 | Knotenformat `Node (Planet)` wird erkannt (`splitNode`/`tP`), Planet erscheint wieder (DE: „Neptun / Laomedeia“); Fissuren, Invasionen, Sortie, Archon, Alarme, Arbitration nutzen `tP` | `core.js`, `worldstate.js` |
| B2 | Invasions-Fortschritt = `completion` (0–100, geklemmt) statt `(c+100)/2` | `worldstate.js` |
| B13 | Invasionen lesen `attacker/defender.faction` und `.reward` (vorher `?` und immer „Nur Credits“) | `worldstate.js` |
| B18 (neu) | Cambion: Live-API sendet `state:"vome"\|"fass"`, Code las `active` → zeigte immer „Fass“ | `worldstate.js` |
| B5 | Zyklen per `Promise.allSettled`: fällt einer aus, erscheinen die anderen | `worldstate.js` |
| B4 | Duviri-Circuit: Gruppen `{category, choices:[…]}` werden gerendert (Warframes / Stahlpfad · Waffen), `DualToxocyst` → „Dual Toxocyst“ | `duviri.js` |
| B6, B13b | Relics: Quelle `drops.warframestat.us/data/relics.json` (Feld `itemName`), nur Intact-Zeilen, Seltenheit aus Intact-Chance abgeleitet (API markiert alles Nicht-Seltene „Uncommon“), 24-h-Cache (~340 KB) | `relics.js` |
| B1 | Intact-Rare 3 % → **2 %** (Summe 99,99 %) | `relics.js` |
| B9 | Doppeltes `<div class="refine-table-scroll">` entfernt | `relics.js` |
| B7, B8, A11 | **Market entfernt**: Preisabfrage samt UI, `MKT_API`, mkt-CSS, Market-Host im Service Worker | `relics.js`, `relics.html`, `core.js`, `style.css`, `sw.js` |
| B7 | Übersetzer: eine Quelle `api.warframestat.us/items?language=…&only=name,uniqueName,category,type` (~300 KB je Sprache statt 56 MB), Skins/Glyphen/Sigils/Gegner/Nodes/Relics ausgeblendet, Duplikate entfernt, 24-h-Cache, alter Cache bei API-Ausfall; MKT-Links entfernt | `translator.js`, `translator.html` |
| B17 (neu) | Mod-Finder: Live-Daten haben `enemies[].enemyName`, Code las `drops[].location` → **alle 648 Mods hatten 0 Quellen**. Cache-Schlüssel `th_drops_mods_v2` → `v3` (alte leere Listen liegen bis zu 24 h in Nutzer-Browsern) | `itemfinder.js` |
| B14 | Fissuren-Stufe `Omnia`: Filter-Button und Badge-Stil | `fissures.html`, `style.css` |
| B11 | „35 active“ → „35 aktiv“ in DE | `worldstate.js` |
| A1 | Stale-Leiste **pro Endpunkt**: bleibt sichtbar, solange irgendein Endpunkt aus dem Cache kommt | `core.js` |
| A2–A5 | Service Worker: fasst nur noch GET und gleiche Origin an, **API-Antworten werden nicht mehr gecacht** (einzige Cache-Ebene: localStorage in `core.js`); Vor-Cache tolerant (`allSettled`), relative Pfade, `ignoreSearch` für `?v=`, kein `respondWith(undefined)` mehr (Fallback `404.html`) | `sw.js` |
| A6 | Tageswechsel löscht nur noch Cache-Einträge älter als 24 h (vorher alles, also auch den Stale-Fallback) | `core.js` |
| A7 | Kein Wiederholversuch bei HTTP 4xx (außer 429); 5xx/Timeout weiter 2 Versuche | `core.js` |
| A8 | `errHTML` escaped die Fehlermeldung (`escHTML`); auch in allen angefassten Render-Funktionen | `core.js` u. a. |
| A9 | Statusleiste zeigt LIVE / **STALE** (gelb) / **OFFLINE** (rot) statt immer LIVE | `core.js`, `shell.js`, `style.css` |
| C2, C5 | Einheitliches `?v=5.2` an CSS, `core.js`, `shell.js` **und** allen seitenspezifischen Skripten in allen 19 HTML-Dateien; Versionsangaben vereinheitlicht (siehe unten) | `*.html`, `sw.js`, JS-Kopfzeilen |
| C1 | README: `build.py` als veraltet gekennzeichnet, Datenquellen und Deploy-Regeln ergänzt | `README.md` |

## Bewusst offen / nicht gemacht

| ID | Stand |
|---|---|
| B16 | **Vault-Status fehlt.** Die drops-API hat keinen; `api.warframestat.us/items` hat `vaulted` (3089× true, 31× fehlt, nie false), Bedeutung ungeklärt. Der Vault-Filter (er hat nie funktioniert) und das Badge sind entfernt. Wieder einbauen erst, wenn die Semantik geprüft ist. |
| B12 | Escaping nur in den angefassten Render-Funktionen. Andere Seiten setzen API-Strings weiter per `innerHTML`. Unkritisch, solange die Quellen feste Konstanten bleiben; **Pflicht, sobald Hosts konfigurierbar werden.** |
| A10 | Kein allgemeiner Umgang mit vollem localStorage (Relics/Übersetzer nutzen eigene kompakte Caches, das Risiko sinkt, ist aber nicht behandelt). |
| C3, C4 | `.htaccess` unverändert (lokal nicht testbar, Fehler wäre ein 500 auf LIVE). C3: `AddType manifest+json` gilt für **alle** `.json`. C4: `.js` kommt als `text/javascript` ohne `Expires`; die Regel für `application/javascript` greift nicht. Folge: JS wird nur heuristisch gecacht, mit `?v=5.2` an jedem Skript ist das unkritisch. |
| C6, C7 | Toter Code in `nextWeeklyReset()`; keine Tests/CI. |
| – | Mod-Finder zeigt `chance` roh. Die Gesamtchance ist vermutlich `enemyModDropChance × chance / 100` (z. B. 15 % × 12,5 %). Nicht verifiziert, Anzeige unverändert. |
| – | Baro: Inventar-Felder (`item`, `ducats`, `credits`) sind **ungeprüft**, weil Baro erst ab 2026-10-02 da ist. Erste Prüfung dann. |
| – | Invasion mit Infested-Angreifer zeigt „Nur Credits“ (Infested gibt keine Belohnung); Text unverändert. |
| – | Konsole der Live-Seite zeigte einmal `ERR_CERT_AUTHORITY_INVALID` (nicht zugeordnet, Zertifikat der Seite ist gültig). |
| – | Statische Texte nennen weiter die Website warframe.market als Handelsplatz (`beginner.js`, `itemfinder.js`); das ist kein API-Aufruf. |

**Korrektur zum Anhang:** B15 (Arbitration-Platzhalter) ist **kein Fehler**, `renderArbitration` behandelt `node:"SolNode000"`/`expired`/`type:"Unknown"` bereits als „Keine Daten“. B10 war **nicht bestätigt** (`chance` ist eine Zahl).

## Versionsmarker (alle gemeinsam ändern)

| Marker | Ort | Wert |
|---|---|---|
| Asset-Version | `?v=` an CSS, `core.js`, `shell.js` und jedem seitenspezifischen JS in allen 19 `*.html` | `5.2` |
| Service-Worker-Cache | `CACHE_NAME` in `sw.js` (alte Caches werden beim Aktivieren gelöscht) | `tenno-hub-5.2` |
| Anzeige | Sidebar-Fuß (`sidebar-version` in `shell.js`) | `v5.2` |
| Kommentare | Kopfzeile von `core.js`, `worldstate.js`, `shell.js`, `sw.js`, `relics.js`, `translator.js`, `itemfinder.js` | `v5.2` |
| Nicht angefasst | Kopfzeile `acquisition.js` (`v4.2`), `css/style.css:1195` (`v4.3`); nur Kommentare | – |

Beim nächsten Release: `grep -rn "5\.2" *.html js sw.js`, alle Fundstellen prüfen und gemeinsam erhöhen.

## Deploy (was auf den Server gehört)

Das Paket `tenno-hub-5.2-deploy.zip` (im Projektordner, per `.gitignore` nicht im Repo) enthält genau das Folgende, Pfade relativ zum Webroot:

- alle 19 `*.html` (404, acquisition, archon, baro, daily, duviri, fissures, foundry, glossary, index, invasions, itemfinder, lich, nightwave, relics, resources, roadmap, sortie, translator)
- `css/style.css`
- `js/core.js`, `js/duviri.js`, `js/itemfinder.js`, `js/relics.js`, `js/shell.js`, `js/translator.js`, `js/worldstate.js`
- `sw.js`

**Nicht** hochladen (unverändert oder nicht für den Server): `js/acquisition.js`, `js/beginner.js`, `js/foundry.js`, `js/glossary.js`, `js/lich.js`, `.htaccess`, `manifest.json`, `sitemap.xml`, `robots.txt`, `icons/`, `social/`, `README.md`, `HANDOVER.md`, `build*.py`.

Nach dem Upload: Browser und Service Worker halten kurz den alten Stand. Die neuen `?v=5.2`-URLs und der neue `CACHE_NAME` lösen das beim ersten Laden; sonst hilft der Sidebar-Knopf „App aktualisieren“ oder ein Hard-Reload.

## Test-Checkliste 5.2 (auf LIVE, nach dem Deploy)

Nur, was sich geändert hat. Im Browser mit DE-Sprache; Konsole (F12) offen, es soll **kein Fehler** erscheinen.

1. **Version:** Sidebar-Fuß zeigt `v5.2`. F12 → Application → Cache Storage: nur `tenno-hub-5.2` (kein `tenno-hub-v6`). Im Seitenquelltext stehen `?v=5.2` an allen Skripten.
2. **Fissuren:** Karten zeigen „Planet / Node“ (z. B. „Neptun / Laomedeia“), Zähler „N aktiv“, es gibt einen **Omnia**-Filter.
3. **Invasionen:** Fraktionsnamen statt „?“; Belohnungen sind nicht überall „Nur Credits“ (z. B. „3× Fieldron“); Fortschritt liegt zwischen 0 und 100 %.
4. **Duviri:** „Circuit, heutige Auswahl“ zeigt Namen mit Kategorie (Warframes / Stahlpfad · Waffen), **kein** „[object Object]“.
5. **Dashboard:** 5 Zyklus-Karten; Cambion zeigt dieselbe Phase (Vome/Fass) wie `https://api.warframestat.us/pc/cambionCycle` (Feld `state`).
6. **Relics:** ca. 799 Relics; „Lith A1“ hat Intact-Rare **2,00 %**; Verfeinerungs-Rechner öffnet, Spaltensummen ≈ 100 %; **kein** Vault-Filter, **kein** Marktpreis-Block.
7. **Übersetzer:** Status „✓ N Items geladen (warframestat.us)“ (N ≈ 4400); „serration“ → „Einkerbung“; zweiter Aufruf lädt sofort (Cache); kein „MKT“-Link.
8. **Mod-Finder:** „serration“ zeigt „8 Drop-Quellen“ (nicht 0). Blueprint-Reiter funktioniert.
9. **Statusleiste:** unten „LIVE“. F12 → Network → „Offline“ → „OFFLINE“ (rot) plus Offline-Leiste; Seiten laden aus dem Cache. Wieder online → „LIVE“.
10. **Kontrolle unverändert:** Sortie, Archon, Nightwave, Baro, Daily, Foundry, Lich laden ohne Fehler.

Beim ersten Besuch von Baro (ab 2026-10-02): Inventar zeigt Namen, Ducats und Credits (Felder sind bisher ungeprüft).

## Wie in diesem Release validiert wurde

- `node --check` für alle 12 JS-Dateien und `sw.js`; HTML-Tag-Balance für alle 19 Seiten (vorher/nachher identisch, 0 Auffälligkeiten); CSS-Klammerbilanz.
- Funktionstest im echten Browser (lokaler Server auf dem Projektordner, echte Live-APIs): Fissuren, Invasionen, Duviri, Dashboard, Relics (inkl. Rechner, Filter, Suche), Übersetzer (inkl. API-Ausfall mit/ohne Cache), Mod-Finder (648/648 Mods mit Quellen), Blueprints (206/206), Service Worker (43 Einträge, keine API-Antworten, Offline-Auslieferung und 404-Fallback bei gestopptem Server), Stale-/Offline-Status, HTTP-404-ohne-Retry, 503-mit-Retry.
- **Nicht** getestet: LIVE-Server selbst, `.htaccess`, Baro-Inventar, iOS/Safari, echte Handys.

---

# Anhang A – Analyse und Live-Prüfung (Stand vor dem Release 5.2)

Der folgende Teil ist die ursprüngliche Analyse mit den Ergebnissen der Live-Prüfung vom 2026-09-29. Die Status-Spalten beschreiben den Stand **vor** Release 5.2. Maßgeblich für den heutigen Stand sind die Tabellen oben. Abschnitte 5–7 (Vorschlag, Deployment, Fragen) sind durch die Entscheidung des Nutzers überholt.

## Analyse-Chat: Kopf (historisch)

Übergabe des Analyse-Chats an einen Chat **mit Netzwerkzugang zu den APIs**. Damals war am Code noch nichts geändert; das ist mit Release 5.2 überholt.

## 0. Auftrag des Nutzers

Die API-Anbindung soll **kontrollierbar und erweiterbar** sein, damit eine **bugfreie Version LIVE** (Apache, `https://tenno.familienfabrik.at`) und **auf GitHub** gestellt werden kann. Im alten Chat war die API „immer blockiert".

Regeln:
- Erst prüfen, dann ändern. Alles, was von der Antwortform der Live-API abhängt, ist unten als **UNGEPRÜFT** markiert und muss zuerst gegen die echte API bestätigt werden.
- **Kein Pull Request** ohne ausdrückliche Bitte des Nutzers.
- **`build.py` nicht ausführen** (siehe C1). Die committeten HTML-Dateien sind die Wahrheit.
- Pfad: statische PWA, Apache, kein Build-System, kein `package.json`.

## 1. Warum die API im alten Chat blockiert war

**Kein Code-Fehler.** Die Cloud-Sitzung hatte eine Netzwerk-Policy, die die Hosts sperrte. Gemessen mit `curl`, alle vier Hosts: `CONNECT tunnel failed, response 403`:
`api.warframestat.us`, `drops.warframestat.us`, `api.warframe.market`, `content.warframe.com`.

Wenn du in diesem Chat die Hosts erreichst, gilt das nicht mehr. **Prüfe das als Allererstes** (Abschnitt 3). Erreichst du sie nicht, melde das dem Nutzer, statt am Code zu raten.

## 2. Aufbau heute

Drei getrennte Netzwerkpfade ohne gemeinsame Logik:

| Pfad | Datei | Ziel | Robustheit |
|---|---|---|---|
| `apiFetch()` | `js/core.js:31-63` | `api.warframestat.us` (Worldstate, Relics, Duviri) | 12 s Timeout, 2 Versuche, localStorage-Fallback |
| `fetchWithTimeout()` | `js/translator.js:39-53` | `api.warframe.market/v1/items`, dann `warframestat.us/items` | Timeout + ein Fallback |
| rohes `fetch()` | `js/relics.js:182` (Markt), `js/itemfinder.js:236`, `:412` (Drops) | `api.warframe.market`, `drops.warframestat.us` | **kein** Timeout/Retry/Fallback |

Hosts stehen fest in `js/core.js:15-17`. `DROP_API` (`core.js:17`) wird nirgends benutzt, `itemfinder.js` hat eine eigene `DROPS_BASE`.

Weitere Fakten, die man wissen muss:
- Header, Navigation, Statusleiste, Stale-/Offline-Leiste werden **zur Laufzeit von `js/shell.js` erzeugt**. Die HTML-Seiten enthalten nur `<main>`-Inhalt plus ein kleines Inline-Skript (`pageInit`, `pageRefresh`, `bootPage()`).
- Skript-Reihenfolge je Seite: `core.js?v=5.1`, seitenspezifisches JS (ohne `?v`), `shell.js?v=5.1`, danach das Inline-Skript.
- localStorage-Schlüssel des API-Caches: Präfix `th_api_` (`th_api_<platform>_<lang>_<endpoint>`). `clearAPICache()` und `bootPage()` verlassen sich auf dieses Präfix.
- 19 HTML-Seiten (18 Inhaltsseiten + `404.html`). Seiten-IDs stehen in `<html data-page="...">`.
- Playwright und Chromium waren in der Cloud-Umgebung vorhanden. Lokal ggf. selbst installieren.

## 3. ERSTER SCHRITT: Live-API prüfen

Die folgenden Befehle bestätigen oder widerlegen alle UNGEPRÜFT-Punkte. **Ergebnisse hier eintragen**, bevor irgendetwas geändert wird.

```sh
# Erreichbarkeit + Format (Ergebnis-Spalte unten ausfüllen)
curl -sS -m 20 -o /dev/null -w "%{http_code}\n" "https://api.warframestat.us/pc/fissures?language=en"
curl -sS "https://api.warframestat.us/pc/fissures?language=en"  | head -c 1200        # B3: Knotenformat "Node (Planet)" oder "Planet / Node"?
curl -sS "https://api.warframestat.us/pc/invasions"             | head -c 1500        # B2: Typ und Wertebereich von "completion"
curl -sS "https://api.warframestat.us/pc/duviriCycle"           | head -c 1500        # B4: Form von "choices"
curl -sS -o /dev/null -w "%{http_code}\n" "https://api.warframestat.us/pc/relics"     # B6: existiert der Endpunkt?
curl -sS "https://drops.warframestat.us/data/relics.json"       | head -c 1500        # B6: alternative Quelle, Feldnamen (itemName? state?)
curl -sS "https://api.warframe.market/v1/items"                 | head -c 600         # B7: payload.items = Objekt {en,de,...} oder Array?
curl -sS "https://api.warframe.market/v2/items"                 | head -c 800         # B7/B8: v2 als Ersatz? Feld i18n?
curl -sS "https://drops.warframestat.us/data/modLocations.json" | head -c 600         # itemfinder
curl -sS "https://drops.warframestat.us/data/blueprintLocations.json" | head -c 600   # itemfinder
```

Ebenfalls prüfen: ob die Antworten `Access-Control-Allow-Origin` senden (Browser-CORS), ob Rate-Limits (`429`, `Retry-After`) auftreten und ob die Endpunkte `cetusCycle`, `vallisCycle`, `cambionCycle`, `earthCycle`, `zarimanCycle`, `sortie`, `archonHunt`, `voidTrader`, `steelPath`, `nightwave`, `arbitration`, `alerts` alle antworten (die App ruft genau diese auf).

| Punkt | Frage | Ergebnis (ausfüllen) |
|---|---|---|
| B2 | `completion` = String oder Zahl, Bereich 0–100 oder −100..100? | **Zahl (float).** Aktive Invasionen 31,7 und 82,9 → Bereich **0–100**. Abgeschlossene (`completed:true`) liegen leicht **negativ** (−0,23 … −1,15). Formel `(c+100)/2` ergäbe für 82,9 → 91,5 %. Stichprobe n = 6. |
| B3 | Knotenformat der Fissuren/Invasionen/Sortie | **`Node (Planet)`**, z. B. `Pago (Kuva Fortress)`, in 27/27 Fissuren, 6/6 Invasionen, Sortie-Varianten, `voidTrader.location`. Kein `/` vorhanden. Der Code streicht die Klammer und verliert den Planeten. |
| B4 | Form von `duviriCycle.choices` | **Array von Objekten** `{category, categoryKey, choices:[Namen…]}`, 2 Einträge (`normal`, `hard`). `${ch.name\|\|ch}` ergibt `[object Object]`. |
| B6 | Gibt es `/pc/relics`? Sonst Quelle + Feldnamen für Relics + Vault-Status | **`/pc/relics` → 404** `{"error":"No such worldstate field"}`. Alternative `drops.warframestat.us/data/relics.json` (2,4 MB, 200): `{relics:[{tier, relicName, state, rewards:[{itemName, rarity, chance}]}]}`. 3194 Zeilen = je Relic 4 Zeilen; **`state` ist die Veredelungsstufe** (Intact/Exceptional/Flawless/Radiant), **kein Vault-Status**; Belohnungsname heißt `itemName`, nicht `item`. Vault-Status nur in `api.warframestat.us/items` (Typ `Relic`, Feld `vaulted`, 56-MB-Datei), siehe 3a. |
| B7 | Form von `market/v1/items`; lebt v1 noch? | **v1 ist tot:** `/v1/items` → 404. v2 `/v2/items` → 200, `{apiVersion, data:[{id, slug, gameRef, tags, i18n:{en:{name,icon,thumb}}}], error}`, 3892 Items, 1,6 MB. `i18n` enthält nur `en`; mit Request-Header `Language: de` zusätzlich `de`. **Aber kein CORS** (siehe letzte Zeile). |
| B8 | Orders-Endpunkt v1 vs. v2 | v1 `/items/<slug>/orders` → **403 „Deprecated“**. v2: `/v2/orders/item/<slug>` (598 KB, alle Orders) und `/v2/orders/item/<slug>/top` (5 KB, `data:{sell:[],buy:[]}`). Felder: `type` (statt `order_type`), `platinum`, `user.status` (`ingame`/`online`/`offline`), kein `payload`-Wrapper. Ebenfalls **kein CORS**. |
| B10 | Ist `chance` bei Relics eine Zahl? | In der einzigen funktionierenden Quelle (drops) **immer Zahl** (int oder float, 19 166 Belohnungen). String-Fall nicht beobachtet, `.toFixed` wirft dort nicht. Das reale Problem ist der Feldname (`rw.item` statt `itemName`, `relics.js:75`). |
| – | CORS-Header vorhanden? Rate-Limits? | `api.warframestat.us` und `drops.warframestat.us`: `access-control-allow-origin: *`. **`api.warframe.market`: kein ACAO, `OPTIONS` → 405.** Im echten Browser (Origin `https://tenno.familienfabrik.at`) blockiert: v1 items, v2 items, v2 items + `Language`-Header, v2 orders/top, v2 orders/top + `Platform`-Header (alle „Failed to fetch“); warframestat und drops → 200. Rate-Limits: keine `RateLimit`/`Retry-After`-Header; 25 parallele Abrufe → alle 200; kein 429 beobachtet (nur Stichprobe). |

## 3a. Ergebnisse der Live-Prüfung (2026-09-29)

Geprüft mit `curl` (Origin-Header `https://tenno.familienfabrik.at`) und einem echten `fetch()` im Browser auf der Live-Origin. Rohantworten lagen nur im Session-Scratchpad und sind **nicht** im Repo. **Vor dem Bauen von Fixtures die Formate erneut abrufen**, sie können sich ändern.

**Erreichbarkeit:** Alle vier Hosts antworten, die 403-Netzwerksperre aus Abschnitt 1 gilt hier nicht. Alle 15 von der App genutzten Worldstate-Endpunkte (`fissures`, `invasions`, `duviriCycle`, `cetusCycle`, `vallisCycle`, `cambionCycle`, `earthCycle`, `zarimanCycle`, `sortie`, `archonHunt`, `voidTrader`, `steelPath`, `nightwave`, `arbitration`, `alerts`) liefern HTTP 200 (`alerts` leeres Array `[]`, `voidTrader` ohne Inventar, Baro erst ab 2026-10-02). Latenz 0,2–0,5 s.

| Ziel | HTTP | Größe | CORS |
|---|---|---|---|
| `api.warframestat.us/pc/*` | 200 (`/pc/relics`: **404**) | 2 B–8,5 KB | `*` |
| `api.warframestat.us/items` (Translator-Fallback) | 200 | **56 MB** | nicht geprüft |
| `drops.warframestat.us/data/relics.json` | 200 | 2,4 MB | `*` |
| `drops.warframestat.us/data/modLocations.json`, `blueprintLocations.json` | 200 | 0,99 MB / 0,12 MB | `*` |
| `api.warframe.market/v1/items` | **404** | – | keiner |
| `api.warframe.market/v1/items/<slug>/orders` | **403 „Deprecated“** | – | keiner |
| `api.warframe.market/v2/items` | 200 | 1,6 MB | **keiner**, `OPTIONS` → 405 |
| `api.warframe.market/v2/orders/item/<slug>[/top]` | 200 | 598 KB / 5 KB | **keiner** |

**Neue Befunde aus der Live-Prüfung** (nicht im Analyse-Chat enthalten):

| # | Datei:Zeile | Befund | Status |
|---|---|---|---|
| A11 | `relics.js:182`, `translator.js:39-53` | `api.warframe.market` ist aus dem Browser **nicht nutzbar**: v1 abgeschaltet, v2 ohne CORS-Header. Preisabfrage und Translator-Primärquelle scheitern also unabhängig vom Code. Ein Provider-Fallback (Abschnitt 5, Punkt 2) hilft für Market **nicht**; nötig wäre ein serverseitiger Proxy (z. B. Apache `mod_proxy` auf dem eigenen Host) oder das Feature entfällt. Der Translator-Fallback `warframestat.us/items` ist **56 MB**. | BELEGT (curl + Browser) |
| B13 | `worldstate.js:496-497` | Liest `inv.attackerReward`/`inv.defenderReward`. Live steht die Belohnung in `inv.attacker.reward`/`inv.defender.reward` (Struktur `{items, countedItems, credits}`, passt zu `rewardStr`). Ergebnis: immer „Credits only“. | BELEGT (Code + Live-Form) |
| B13b | `relics.js:75` | `rw.item` existiert in der drops-Quelle nicht, dort `itemName`. Zusammen mit B6 zeigt die Relic-Liste (falls sie Daten bekäme) leere Namen. | BELEGT |
| B14 | `worldstate.js:7`, `css/style.css:337`, `fissures.html:62-68` | Live kommen die Stufen `Requiem` (4×) und `Omnia` (3×) vor. `Omnia` hat Sortierung (`TIER_ORD`), aber keinen Filter-Button und keine Regel `.tier-badge.Omnia`. | BELEGT (Grep) |
| B15 | `worldstate.js:146-152` | `/pc/arbitration` liefert derzeit einen Platzhalter (`node: SolNode000`, `expired: true`, `expiry: +275760-09-13…`). `renderArbitration` behandelt das bereits korrekt als „Keine Daten“. | **KEIN FEHLER** (nachträglich im Code geprüft) |
| B16 | `relics.js` (Vault) | `api.warframestat.us/items` (Typ `Relic`, 3120 Einträge) hat ein Feld `vaulted`: 3089× `true`, 31× fehlend, **nie `false`**. Ob „fehlend“ = „nicht vaulted“ gilt und ob die Daten aktuell sind, ist **nicht** geklärt. | UNGEPRÜFT (Semantik) |
| B2b | `worldstate.js:493` | Abgeschlossene Invasionen haben negative `completion` (bis −1,15). Sie werden per `!i.completed` (`:482`) ausgefiltert, die Bereichsgrenze 0–100 gilt also nur für aktive. | BELEGT |
| B1b | `relics.js:11` | B1 gegen Live-Daten bestätigt: Intact hat Rare = **2 %**, Summe 99,99 % (790 von 790 Standard-Relics). Exceptional 4 % (99,99), Flawless 6 % (100). | BELEGT (Live) |
| C3b | `.htaccess:65` | Live bestätigt: `manifest.json` kommt als `application/manifest+json` (`max-age=86400`). | BELEGT (Live) |

**Nicht geklärt:** In der Konsole der Live-Seite erschien einmal `net::ERR_CERT_AUTHORITY_INVALID` (Ressource nicht zugeordnet). Das Zertifikat von `tenno.familienfabrik.at` selbst ist gültig (Let's Encrypt, bis 2026-11-27, `curl` verifiziert es), alle 5 Seitenressourcen luden mit 200.

**Konsequenz für Abschnitt 5 (Vorschlag, nichts umgesetzt):**
- Punkt 2 (API-Schicht): `market` braucht Proxy-Entscheidung, sonst nur `worldstate` und `drops` mit Fallback-Kette.
- Punkt 5 (Bugfixes) wächst um B13, B13b, B14 und um die Formatänderungen aus B2/B3/B4/B6.
- Die offene Frage 1 in Abschnitt 7 ändert sich: Market-Preise und Translator lassen sich ohne serverseitigen Proxy nicht reparieren.

## 4. Befunde

**BELEGT** = im Code gelesen, nachgerechnet oder ausgeführt. **UNGEPRÜFT** = hängt vom Live-Format ab (Abschnitt 3).

### 4a. API-Schicht

| # | Datei:Zeile | Problem | Status |
|---|---|---|---|
| A1 | `core.js:76-78` (Aufruf `:45`) | `_hideStaleBar()` läuft nach **jedem** Erfolg. Liefert ein Endpunkt Stale-Daten, ein anderer Frische, verschwindet die Warnung fälschlich (Startseite mit vielen parallelen Abrufen). | BELEGT |
| A2 | `sw.js:65-83` | SW cached alle API-Antworten dauerhaft ohne Ablauf und liefert sie bei Fehlern als „live" aus. Die Stale-Leiste erfährt nichts. Zwei Cache-Ebenen mit widersprüchlicher Logik. | BELEGT |
| A3 | `sw.js:82` | `caches.match()` ohne Treffer → `respondWith(undefined)` → TypeError. | BELEGT |
| A4 | `sw.js:63-102` | Kein Filter auf GET; `cache.put` mit Nicht-GET wirft. | BELEGT |
| A5 | `sw.js:9-29` | `addAll` ist atomar: fehlt **eine** Datei, schlägt die SW-Installation komplett fehl, lautlos (`core.js:449` `.catch(() => {})`). Absolute Pfade (`/index.html`) gehen nur im Domain-Root. | BELEGT |
| A6 | `core.js:267-271` | Beim ersten Aufruf pro Tag wird der **gesamte** API-Cache gelöscht, genau dann fehlt bei API-Ausfall der Stale-Fallback. | BELEGT |
| A7 | `core.js:35-60` | Auch bei nicht behebbaren Fehlern (HTTP 404) wird 2 s gewartet und wiederholt. | BELEGT |
| A8 | `core.js:307-316` | `errHTML` schreibt `e.message` ungeescaped per `innerHTML`; Meldung enthält weder Host noch Endpunkt. | BELEGT |
| A9 | `shell.js:225`, `:227` | Statusleiste zeigt immer „LIVE" (grün), auch offline/stale/API-Ausfall; Host fest `warframestat.us`. | BELEGT |
| A10 | `core.js:44` | `localStorage.setItem` großer Antworten (Relics) kann das Kontingent füllen; Fehler wird verschluckt. | BELEGT (Verhalten) |

### 4b. Darstellung und Daten

| # | Datei:Zeile | Problem | Status |
|---|---|---|---|
| B1 | `relics.js:11` | `RELIC_CHANCES.intact.R = 3` → Summe 3×25,33 + 2×11 + 3 = **101 %**. Korrekt: 2 % (Summe 99,99 %). Die anderen drei Stufen summieren korrekt auf ≈100 %. | BELEGT |
| B2 | `worldstate.js:493` | `((inv.completion\|\|0) + 100) / 2`. Ist `completion` ein String (`'56.7'`), wird daraus `'56.7100'/2 = 28.35`. Bei Bereich 0–100 ist die Formel ebenfalls falsch (50–100 statt 0–100). | BELEGT, Live bestätigt 2026-09-29 (Zahl, aktiv 0–100, s. 3) |
| B3 | `worldstate.js:312-315`, `:498-501`, `core.js:218-225` (`tP`) | Planet-Trennung erwartet `Planet / Node`. Kommt `Cinxia (Ceres)`, entfernt die Regex `\s*\(.*?\)\s*$` den Planeten; er fehlt, `DE_PLANET` greift nie. | **BESTÄTIGT** Live 2026-09-29: Format ist `Node (Planet)` (s. 3) |
| B4 | `duviri.js:95` | `${ch.name\|\|ch}` gibt `[object Object]`, falls `choices` Objekte `{category, choices:[…]}` sind. | **BESTÄTIGT** Live 2026-09-29 (s. 3) |
| B5 | `worldstate.js:12-16`, `:25` | `Promise.all`: fällt ein Pflicht-Zyklus aus, erscheint gar keiner; fehlt einer, wirft `buildCycleList` einen TypeError. | BELEGT |
| B6 | `relics.js:26-34` | Ruft `warframestat.us/<platform>/relics` auf. Diesen Endpunkt gibt es nach Erinnerung des Analyse-Chats dort nicht. Die angenommene Form (`relicName`, `state`, `rewards[].item`) ähnelt `drops.warframestat.us/data/relics.json` (dort `itemName`, kein Vault-Status). Die Relic-Seite könnte nie funktioniert haben. | **BESTÄTIGT** Live 2026-09-29: `/pc/relics` → 404, die Relic-Seite lädt heute keine Daten (s. 3, 3a) |
| B7 | `translator.js:94-96` | Erwartet `payload.items.en/.de`; ob `market/v1` das noch liefert oder v1 abgeschaltet ist (Nachfolger v2, anderes Format), ist offen. Fallback `warframestat.us/items` fängt es teilweise ab. | **BESTÄTIGT** Live 2026-09-29: v1 tot (404), v2 anderes Format, kein CORS (s. 3, 3a) |
| B8 | `relics.js:182-190` | Preisabfrage nur über `market/v1`, ohne Fallback. | **BESTÄTIGT** Live 2026-09-29: v1 → 403 „Deprecated“, v2 ohne CORS (s. 3, 3a) |
| B9 | `relics.js:148` | Zwei öffnende `<div class="refine-table-scroll">`, nur eine schließende. | BELEGT |
| B10 | `relics.js:76` | `rw.chance?.toFixed(2)` wirft bei String-`chance` und bricht die ganze Liste ab. | **NICHT BESTÄTIGT** Live 2026-09-29: `chance` ist in der Live-Quelle eine Zahl (s. 3); Ursache für leere Relic-Karten ist eher `rw.item` (s. 3a, B13) |
| B11 | `worldstate.js:303`, `:484` | `${n} active` ist in DE nicht lokalisiert. | BELEGT |
| B12 | `worldstate.js` allgemein | Viele API-Strings landen ungeescaped per `innerHTML` (`${b.location}`, `${c.title}` …). Heute gering, **wird zum XSS-Einfallstor, sobald die Quelle konfigurierbar wird.** | BELEGT |

### 4c. Deployment und Projektpflege

| # | Datei | Problem | Status |
|---|---|---|---|
| C1 | `build.py` | **Veraltet.** `python3 build.py` erzeugt für alle 15 Seiten *andere* HTML-Dateien als die committeten (und würde SEO-, Open-Graph-, JSON-LD-, PWA-Meta-Tags und `?v=`-Parameter entfernen). `foundry.html`, `itemfinder.html`, `lich.html` fehlen im Generator. `README.md:17` behauptet trotzdem „generiert von build.py". Der Analyse-Chat hat es einmal ausgeführt und sofort per `git checkout -- '*.html'` zurückgesetzt. **Nicht ausführen.** | BELEGT |
| C2 | HTML `<script>`, `.htaccess:26-27` | Nur `core.js`/`shell.js` haben `?v=5.1`; alle anderen JS ohne Parameter, aber `.htaccess` cached JS eine Woche → nach Deploy bis zu einer Woche alter Code im Browser. | BELEGT (Konfiguration). Live-Server liefert `.js` aber ohne `Expires`/`Cache-Control` aus, s. C4 |
| C3 | `.htaccess:65` | `AddType application/manifest+json .webmanifest .json` macht **alle** `.json` zu `manifest+json`. | BELEGT |
| C4 | `.htaccess:26-27` | `ExpiresByType application/javascript` greift nicht, wenn der Server `.js` als `text/javascript` ausliefert. | **BESTÄTIGT** Live 2026-09-29: `.js` kommt als `text/javascript` ohne `Expires`/`Cache-Control`; die Regel greift nicht (s. 3a) |
| C5 | `core.js:2`, `worldstate.js:2`, `sw.js:2,7`, `shell.js:159` | Widersprüchliche Versionsangaben (`v4.2`, `v4`, SW-Kommentar `v5` / `CACHE_NAME` `v6`, Sidebar `v5.0`, Param `5.1`). | BELEGT |
| C6 | `core.js:129-140` | `nextWeeklyReset()` enthält toten Code (`wd`, `ys`, `wn`); Ergebnis (nächster Montag 00:00 UTC) ist korrekt. | BELEGT, harmlos |
| C7 | Repo | Keine Tests, kein CI. | BELEGT |

Alle 12 JS-Dateien und `sw.js` bestehen `node --check`, das beweist nur, dass sie parsen.

## 5. Vorschlag für die Umsetzung (nichts davon ist gemacht)

Reihenfolge nach Risiko. Der Nutzer hat noch nicht festgelegt, ob alles oder nur ein Teil umgesetzt werden soll, **vorher nachfragen**.

1. **Live-API prüfen** (Abschnitt 3), Tabelle ausfüllen, danach B2/B3/B4/B6/B7/B8/B10 bestätigen oder verwerfen.
2. **Zentrale API-Schicht `js/api.js`**, Aufrufer bleiben kompatibel:
   - Provider-Liste je Art (`worldstate`, `market`, `drops`) mit Fallback-Reihenfolge, in **einer** Konfiguration.
   - Fehlerklassen (offline, Timeout, HTTP, 429 mit `Retry-After`, CORS/Blockade, kein JSON, falsche Form), Circuit-Breaker, Deduplizierung paralleler Aufrufe, Diagnose-Log.
   - `apiFetch(endpoint)` als Kompatibilitäts-Wrapper behalten, damit `worldstate.js`, `duviri.js`, `relics.js` unverändert weiterlaufen. Cache-Präfix `th_api_` beibehalten.
   - **Eine** Cache-Ebene mit Stale-Hinweis **pro Endpunkt** (löst A1, A2, A6). Der Service Worker fasst API-Aufrufe nicht mehr an.
   - Antwortform-Prüfer je Endpunkt, damit Formatänderungen klar gemeldet werden statt `undefined` anzuzeigen.
   - Translator, Relics-Markt und Itemfinder auf dieselbe Schicht umstellen (drei Pfade → einer).
3. **`status.html`** als Diagnose-Seite: jeden Endpunkt testen, Host, Latenz, Fehlerklasse und Form-Check anzeigen, Provider umstellen, Bericht kopieren. Statusleiste in `shell.js` an den echten Zustand koppeln (LIVE / STALE / OFFLINE) und auf `status.html` verlinken (löst A9).
4. **Escaping** aller API-Strings (B12) **bevor** Provider umstellbar sind. Provider-Überschreibung per URL-Parameter nur für Loopback-Hosts erlauben, sonst Überschreibung nur per UI mit https-Pflicht und sichtbarem Banner. Sonst kann ein präparierter Link fremde Daten in `innerHTML` einspeisen.
5. **Bugfixes:** B1, B2, B3, B4, B5, B9, B10, B11; A3, A4, A5 (`Promise.allSettled` statt `addAll`, relative Pfade, GET-Filter), A7, A8.
6. **Deployment-Hygiene:** einheitliches `?v=` in allen 19 HTML-Dateien (per Skript, mit Diff prüfen), `CACHE_NAME` erhöhen, neue Dateien in `STATIC_ASSETS`, `build.py` entweder reparieren oder in README als veraltet kennzeichnen (C1).
7. **Tests + CI:** Playwright gegen synthetische Antworten (Fixtures nach dem *bestätigten* Live-Format, nicht nach Erinnerung), Routing der API-Hosts per `page.route` (Service Worker im Test blockieren: `serviceWorkers: 'block'`), Szenarien: alles ok, API down, primärer Provider down / Fallback ok, Stale-Cache, 429, kaputtes JSON. Kleines GitHub-Actions-Workflow: `node --check` + Smoke-Test. Grenze: Synthetische Daten beweisen nur, dass die App mit dem *angenommenen* Format richtig umgeht.

Zusätzlich beim Testen beachten: Dashboard ruft parallel 8 Loader auf (`index.html`), `zarimanCycle` ist absichtlich optional (`.catch(()=>null)`), `duviri.js` fällt bei Fehler auf statische Anzeige zurück.

## 6. Deployment

- **GitHub:** Änderungen auf den Arbeitsbranch pushen, PR nur auf Wunsch.
- **LIVE:** laut `README.md` Repo-Inhalt ins Webroot des Apache-Servers kopieren (ohne `build*.py`, `README.md`, **`HANDOVER.md`**). Das erledigt der Nutzer, nicht der Chat.
- Nach einem Deploy: Browser/SW halten alten Code, siehe C2. Deshalb `?v=` erhöhen und `CACHE_NAME` in `sw.js` erhöhen.

## 7. Offene Fragen an den Nutzer

1. Alles aus Abschnitt 5 umsetzen oder nur die belegten Bugfixes ohne neue API-Schicht?
2. Soll ein GitHub-Actions-Workflow (CI) ins Repo?
3. Soll `HANDOVER.md` dauerhaft im Repo bleiben oder nach der Übergabe wieder entfernt werden?
