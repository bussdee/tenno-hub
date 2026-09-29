# HANDOVER – TENNO.HUB, API-Anbindung & Bugfix-Release

Übergabe an einen neuen Chat **mit Netzwerkzugang zu den APIs**.
Stand: 2026-09-29 · Basis-Commit `c21707a` · Branch `claude/tender-wright-21b5at`

> **Diese Datei ist reine Dokumentation.** Im Analyse-Chat wurde am Code, an den HTML-Seiten und an der Konfiguration **nichts geändert**. Alles unten ist ein Befund oder ein Vorschlag, noch nichts ist umgesetzt.
> **Nicht ins Webroot kopieren:** `HANDOVER.md` (wie `README.md` und `build*.py`) gehört nicht auf den Live-Server.

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
| B2 | `completion` = String oder Zahl, Bereich 0–100 oder −100..100? | |
| B3 | Knotenformat der Fissuren/Invasionen/Sortie | |
| B4 | Form von `duviriCycle.choices` | |
| B6 | Gibt es `/pc/relics`? Sonst Quelle + Feldnamen für Relics + Vault-Status | |
| B7 | Form von `market/v1/items`; lebt v1 noch? | |
| B8 | Orders-Endpunkt v1 vs. v2 | |
| B10 | Ist `chance` bei Relics eine Zahl? | |
| – | CORS-Header vorhanden? Rate-Limits? | |

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
| B2 | `worldstate.js:493` | `((inv.completion\|\|0) + 100) / 2`. Ist `completion` ein String (`'56.7'`), wird daraus `'56.7100'/2 = 28.35`. Bei Bereich 0–100 ist die Formel ebenfalls falsch (50–100 statt 0–100). | Rechenfehler BELEGT, Feldtyp UNGEPRÜFT |
| B3 | `worldstate.js:312-315`, `:498-501`, `core.js:218-225` (`tP`) | Planet-Trennung erwartet `Planet / Node`. Kommt `Cinxia (Ceres)`, entfernt die Regex `\s*\(.*?\)\s*$` den Planeten; er fehlt, `DE_PLANET` greift nie. | UNGEPRÜFT |
| B4 | `duviri.js:95` | `${ch.name\|\|ch}` gibt `[object Object]`, falls `choices` Objekte `{category, choices:[…]}` sind. | UNGEPRÜFT |
| B5 | `worldstate.js:12-16`, `:25` | `Promise.all`: fällt ein Pflicht-Zyklus aus, erscheint gar keiner; fehlt einer, wirft `buildCycleList` einen TypeError. | BELEGT |
| B6 | `relics.js:26-34` | Ruft `warframestat.us/<platform>/relics` auf. Diesen Endpunkt gibt es nach Erinnerung des Analyse-Chats dort nicht. Die angenommene Form (`relicName`, `state`, `rewards[].item`) ähnelt `drops.warframestat.us/data/relics.json` (dort `itemName`, kein Vault-Status). Die Relic-Seite könnte nie funktioniert haben. | UNGEPRÜFT, **zuerst prüfen** |
| B7 | `translator.js:94-96` | Erwartet `payload.items.en/.de`; ob `market/v1` das noch liefert oder v1 abgeschaltet ist (Nachfolger v2, anderes Format), ist offen. Fallback `warframestat.us/items` fängt es teilweise ab. | UNGEPRÜFT |
| B8 | `relics.js:182-190` | Preisabfrage nur über `market/v1`, ohne Fallback. | UNGEPRÜFT |
| B9 | `relics.js:148` | Zwei öffnende `<div class="refine-table-scroll">`, nur eine schließende. | BELEGT |
| B10 | `relics.js:76` | `rw.chance?.toFixed(2)` wirft bei String-`chance` und bricht die ganze Liste ab. | UNGEPRÜFT |
| B11 | `worldstate.js:303`, `:484` | `${n} active` ist in DE nicht lokalisiert. | BELEGT |
| B12 | `worldstate.js` allgemein | Viele API-Strings landen ungeescaped per `innerHTML` (`${b.location}`, `${c.title}` …). Heute gering, **wird zum XSS-Einfallstor, sobald die Quelle konfigurierbar wird.** | BELEGT |

### 4c. Deployment und Projektpflege

| # | Datei | Problem | Status |
|---|---|---|---|
| C1 | `build.py` | **Veraltet.** `python3 build.py` erzeugt für alle 15 Seiten *andere* HTML-Dateien als die committeten (und würde SEO-, Open-Graph-, JSON-LD-, PWA-Meta-Tags und `?v=`-Parameter entfernen). `foundry.html`, `itemfinder.html`, `lich.html` fehlen im Generator. `README.md:17` behauptet trotzdem „generiert von build.py". Der Analyse-Chat hat es einmal ausgeführt und sofort per `git checkout -- '*.html'` zurückgesetzt. **Nicht ausführen.** | BELEGT |
| C2 | HTML `<script>`, `.htaccess:26-27` | Nur `core.js`/`shell.js` haben `?v=5.1`; alle anderen JS ohne Parameter, aber `.htaccess` cached JS eine Woche → nach Deploy bis zu einer Woche alter Code im Browser. | BELEGT |
| C3 | `.htaccess:65` | `AddType application/manifest+json .webmanifest .json` macht **alle** `.json` zu `manifest+json`. | BELEGT |
| C4 | `.htaccess:26-27` | `ExpiresByType application/javascript` greift nicht, wenn der Server `.js` als `text/javascript` ausliefert. | UNGEPRÜFT (Serverkonfig unbekannt) |
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
