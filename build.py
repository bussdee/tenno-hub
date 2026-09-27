#!/usr/bin/env python3
"""
TENNO.HUB Multi-Page Builder (v3.1)
Run:  python3 build.py
Generates all .html pages from PAGES.
"""

import os

OUT = os.path.dirname(__file__)

# Navigation: (file, icon, EN label, DE label)
# Note: sortie.html, archon.html, baro.html still exist but are accessed via dashboard cards.
NAV = [
    ("index.html",       "⬡", "Dashboard",   "Dashboard"),
    ("fissures.html",    "◈", "Fissures",    "Fissuren"),
    ("relics.html",      "⬟", "Relics",      "Relics"),
    ("nightwave.html",   "◉", "Nightwave",   "Nightwave"),
    ("duviri.html",      "🌀", "Duviri",      "Duviri"),
    ("invasions.html",   "⚔", "Invasions",   "Invasionen"),
    ("translator.html",  "🔤", "Translator",  "Übersetzer"),
    ("glossary.html",    "📖", "Glossary",    "Glossar"),
    ("acquisition.html", "🎯", "Frames",      "Frames"),
    ("roadmap.html",     "🗺", "Roadmap",     "Roadmap"),
    ("resources.html",   "🔍", "Resources",   "Ressourcen"),
    ("daily.html",       "✅", "Daily",       "Daily"),
]

# Pages that exist but are NOT in the main nav (accessed via dashboard cards)
HIDDEN_PAGES = ["sortie.html", "archon.html", "baro.html"]

# Items shown directly in the mobile bottom nav. Rest goes into the "More" drawer.
MOBILE_TOP = ["index.html", "fissures.html", "daily.html", "translator.html"]


def _resolve_current(current_file):
    """Hidden pages (sortie/archon/baro) highlight Dashboard in the nav."""
    return "index.html" if current_file in HIDDEN_PAGES else current_file


def nav_html(current_file):
    cur = _resolve_current(current_file)
    items = []
    for (f, icon, en, de) in NAV:
        cls = 'nav-btn current' if f == cur else 'nav-btn'
        items.append(
            f'<a class="{cls}" href="{f}">'
            f'<span class="nav-icon">{icon}</span> '
            f'<span data-en="{en}" data-de="{de}">{en}</span>'
            f'</a>'
        )
    return '\n  '.join(items)


def mobile_nav_html(current_file):
    cur = _resolve_current(current_file)
    top_items = []
    for f in MOBILE_TOP:
        entry = next((n for n in NAV if n[0] == f), None)
        if not entry:
            continue
        _, icon, en, de = entry
        cls = 'mb-btn current' if f == cur else 'mb-btn'
        top_items.append(
            f'<a class="{cls}" href="{f}">'
            f'<span class="mb-icon">{icon}</span>'
            f'<span data-en="{en}" data-de="{de}">{en}</span>'
            f'</a>'
        )
    more_items = []
    for (f, icon, en, de) in NAV:
        if f in MOBILE_TOP:
            continue
        cls = 'current' if f == cur else ''
        more_items.append(
            f'<a class="{cls}" href="{f}">'
            f'<span style="font-size:16px">{icon}</span>'
            f'<span data-en="{en}" data-de="{de}">{en}</span>'
            f'</a>'
        )
    is_more_current = cur not in MOBILE_TOP
    more_btn = (
        f'<button id="mbMoreBtn" class="mb-btn{" current" if is_more_current else ""}" '
        f'onclick="toggleMobileMore()" type="button">'
        f'<span class="mb-icon">⋯</span>'
        f'<span data-en="More" data-de="Mehr">More</span>'
        f'</button>'
    )
    drawer = (
        f'<div class="mb-more-menu" id="mbMoreMenu">'
        + ''.join(more_items)
        + '</div>'
    )
    return '\n  '.join(top_items) + '\n  ' + more_btn + '\n  ' + drawer


def shell(current_file, title_en, title_de, scripts, body_content):
    """Generates a complete HTML page."""
    script_tags = '\n'.join(f'<script src="js/{s}"></script>' for s in scripts)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0,viewport-fit=cover">
<meta name="theme-color" content="#070a10">
<meta name="description" content="TENNO.HUB · Warframe Companion (DE/EN) · familienfabrik.at">
<title>TENNO.HUB · {title_en}</title>
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700;800;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
</head>
<body>

<!-- HEADER -->
<header>
  <a class="logo-link" href="index.html" title="TENNO.HUB Home">
    <svg class="logo-glyph" viewBox="0 0 36 36" fill="none">
      <polygon points="18,2 34,10.5 34,27.5 18,35 2,27.5 2,10.5" fill="none" stroke="#c8a84b" stroke-width="1.5" opacity=".85"/>
      <polygon points="18,8 28,13.5 28,24.5 18,30 8,24.5 8,13.5" fill="none" stroke="#58c4f0" stroke-width="1" opacity=".5"/>
      <circle cx="18" cy="19" r="2.3" fill="#c8a84b"/>
      <line x1="18" y1="8"  x2="18" y2="12" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
      <line x1="18" y1="26" x2="18" y2="30" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
      <line x1="8"  y1="13.5" x2="11.5" y2="15.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
      <line x1="28" y1="22.5" x2="24.5" y2="24.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
      <line x1="28" y1="13.5" x2="24.5" y2="15.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
      <line x1="8"  y1="22.5" x2="11.5" y2="24.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
    </svg>
    <div class="logo-stack">
      <div class="logo-text">TENNO.HUB</div>
      <div class="logo-sub">Warframe Companion · familienfabrik.at</div>
    </div>
  </a>
  <div class="header-right">
    <div class="control-group" id="platformSel">
      <button class="ctrl-btn active" data-platform="pc"  onclick="setPlatform('pc',this)">PC</button>
      <button class="ctrl-btn"        data-platform="ps4" onclick="setPlatform('ps4',this)">PSN</button>
      <button class="ctrl-btn"        data-platform="xb1" onclick="setPlatform('xb1',this)">XBX</button>
      <button class="ctrl-btn"        data-platform="swi" onclick="setPlatform('swi',this)">NSW</button>
    </div>
    <div class="control-group">
      <button class="ctrl-btn active" id="btnEN" onclick="setLang('en')">EN</button>
      <button class="ctrl-btn"        id="btnDE" onclick="setLang('de')">DE</button>
    </div>
    <button class="icon-btn" id="bellBtn" onclick="toggleNotifDrawer()" title="Notifications">
      🔔<span class="notif-badge" id="notifBadge"></span>
    </button>
    <button class="icon-btn" onclick="clearAPICache()" title="Clear cache and reload">🗑</button>
  </div>
</header>

<!-- DESKTOP NAV -->
<nav>
  {nav_html(current_file)}
</nav>

<!-- STALE DATA BANNER -->
<div id="staleBar" class="stale-bar">
  <span id="staleBarMsg"></span>
  <button onclick="clearAPICache()" type="button">↻ Retry</button>
</div>

<!-- NOTIFICATION DRAWER -->
<div class="notif-drawer" id="notifDrawer">
  <div class="notif-drawer-title">🔔 <span data-en="Notifications" data-de="Benachrichtigungen">Notifications</span></div>
  <button class="notif-perm-btn" id="notifPermBtn" style="display:none" onclick="askNotifPerm()">
    <span data-en="Enable Browser Notifications" data-de="Browser-Benachrichtigungen aktivieren">Enable Browser Notifications</span>
  </button>
  <div class="notif-row"><div><div class="notif-label">Cetus Night</div><div class="notif-desc">Plains of Eidolon</div></div><div class="toggle" id="nt_cetus_night" onclick="toggleNt('cetus_night',this)"></div></div>
  <div class="notif-row"><div><div class="notif-label">Cetus Day</div><div class="notif-desc">Plains of Eidolon</div></div><div class="toggle" id="nt_cetus_day" onclick="toggleNt('cetus_day',this)"></div></div>
  <div class="notif-row"><div><div class="notif-label" data-en="Vallis Warm" data-de="Vallis Warm">Vallis Warm</div><div class="notif-desc">Orb Vallis</div></div><div class="toggle" id="nt_vallis_warm" onclick="toggleNt('vallis_warm',this)"></div></div>
  <div class="notif-row"><div><div class="notif-label" data-en="Vallis Cold" data-de="Vallis Kalt">Vallis Cold</div><div class="notif-desc">Orb Vallis</div></div><div class="toggle" id="nt_vallis_cold" onclick="toggleNt('vallis_cold',this)"></div></div>
  <div class="notif-row"><div><div class="notif-label">Deimos Vome</div><div class="notif-desc">Cambion Drift</div></div><div class="toggle" id="nt_deimos_vome" onclick="toggleNt('deimos_vome',this)"></div></div>
  <div class="notif-row"><div><div class="notif-label">Deimos Fass</div><div class="notif-desc">Cambion Drift</div></div><div class="toggle" id="nt_deimos_fass" onclick="toggleNt('deimos_fass',this)"></div></div>
  <div class="notif-row"><div><div class="notif-label" data-en="Baro Ki'Teer arrives" data-de="Baro Ki'Teer kommt">Baro Ki'Teer arrives</div><div class="notif-desc">Void Trader</div></div><div class="toggle" id="nt_baro" onclick="toggleNt('baro',this)"></div></div>
</div>

<!-- MAIN -->
<main>
  <div class="section-header">
    <div class="section-title" data-en="{title_en}" data-de="{title_de}">{title_en}</div>
    <div class="section-badge" id="pageBadge"></div>
    <button class="btn-sm" onclick="pageRefresh()" title="Refresh (R)">↻ <span data-en="Refresh" data-de="Neu laden">Refresh</span></button>
  </div>
{body_content}
</main>

<!-- TOAST -->
<div class="toast-wrap" id="toastWrap"></div>

<!-- MOBILE BOTTOM NAV -->
<nav class="mobile-bottom-nav">
  {mobile_nav_html(current_file)}
</nav>

<!-- STATUS BAR (desktop only) -->
<div class="status-bar">
  <div class="status-live"><div class="status-dot"></div><span>LIVE</span></div>
  <span id="sbPlatform">PC</span>
  <span class="status-api">warframestat.us</span>
  <span id="sbClock"></span>
  <a href="https://familienfabrik.at" target="_blank" style="margin-left:auto;opacity:.4;color:inherit;text-decoration:none;font-size:10px;">familienfabrik.at</a>
</div>

{script_tags}
<script>
/* Page boot: restore platform + language from localStorage */
(function() {{
  const p = localStorage.getItem('th_platform') || 'pc';
  APP.platform = p;
  document.getElementById('sbPlatform').textContent = p.toUpperCase();
  document.querySelectorAll('#platformSel .ctrl-btn').forEach(b => {{
    b.classList.toggle('active', b.dataset.platform === p);
  }});
  const l = localStorage.getItem('th_lang') || 'en';
  APP.lang = l;
  document.documentElement.lang = l;
  document.getElementById('btnEN').classList.toggle('active', l==='en');
  document.getElementById('btnDE').classList.toggle('active', l==='de');
  updateBell();
  syncNotifUI();
  applyI18n();
  if (typeof pageInit === 'function') pageInit();
}})();
</script>
</body>
</html>"""


PAGES = {}

# index.html
PAGES["index.html"] = dict(
    title_en="WORLD STATE",
    title_de="WELTZUSTAND",
    scripts=["core.js", "worldstate.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">ℹ️</div>
    <div class="info-text">
      <div class="info-title" data-en="What am I looking at?" data-de="Was sehe ich hier?">What am I looking at?</div>
      <div class="info-desc"
           data-en="Live <strong>day/night and weather cycles</strong> for all open-world zones plus a quick view of today's Sortie, this week's Archon Hunt and Baro's status. Click any card for details."
           data-de="Live <strong>Tag/Nacht- und Wetterzyklen</strong> für alle Open-World-Zonen plus Schnellansicht von heutiger Sortie, dieser Woche Archon-Jagd und Baro-Status. Karten anklicken für Details.">
        Live cycles plus today's Sortie, Archon Hunt and Baro status.
      </div>
    </div>
  </div>

  <div class="cycle-grid" id="cycleGrid">
    <div class="loading-state" style="grid-column:1/-1"><div class="loading-spinner"></div><span>LOADING CYCLES...</span></div>
  </div>

  <div class="dash-mini-grid">
    <a class="dash-mini sortie" href="sortie.html" id="dashSortie">
      <div class="dash-mini-loading">Loading Sortie...</div>
    </a>
    <a class="dash-mini archon" href="archon.html" id="dashArchon">
      <div class="dash-mini-loading">Loading Archon Hunt...</div>
    </a>
    <a class="dash-mini baro" href="baro.html" id="dashBaro">
      <div class="dash-mini-loading">Loading Baro...</div>
    </a>
  </div>

  <div class="dash-grid">
    <div>
      <div class="section-header" style="margin-top:0">
        <div class="section-title" style="font-size:13px" data-en="ARBITRATION" data-de="SCHIEDSGERICHT">ARBITRATION</div>
      </div>
      <div class="info-box" style="padding:10px 14px;margin-bottom:12px">
        <div class="info-icon" style="font-size:14px">ℹ️</div>
        <div class="info-text">
          <div class="info-desc" style="font-size:11px"
               data-en="<strong>High-level endless mission, one life only!</strong> Rotates hourly. Rewards: Vitus Essence, Aura Mods, Arcanes. Requires MR8+."
               data-de="<strong>Hochstufige Endlos-Mission, nur ein Leben!</strong> Wechselt stündlich. Belohnungen: Vitus-Essenz, Aura-Mods, Arcanes. Benötigt MR8+.">
            High-level endless mission, one life only.
          </div>
        </div>
      </div>
      <div id="arbContainer"><div class="loading-state"><div class="loading-spinner"></div></div></div>
    </div>
    <div>
      <div class="section-header" style="margin-top:0">
        <div class="section-title" style="font-size:13px" data-en="ACTIVE ALERTS" data-de="AKTIVE ALARME">ACTIVE ALERTS</div>
      </div>
      <div class="info-box" style="padding:10px 14px;margin-bottom:12px">
        <div class="info-icon" style="font-size:14px">ℹ️</div>
        <div class="info-text">
          <div class="info-desc" style="font-size:11px"
               data-en="<strong>Time-limited missions</strong> with special rewards (Helmets, Credits, Resources). They expire after a few hours!"
               data-de="<strong>Zeitlich begrenzte Missionen</strong> mit besonderen Belohnungen (Helme, Credits, Ressourcen). Laufen nach wenigen Stunden ab!">
            Time-limited missions with special rewards.
          </div>
        </div>
      </div>
      <div id="alertsContainer"><div class="loading-state"><div class="loading-spinner"></div></div></div>
    </div>
  </div>

  <script>
  function pageInit() {
    loadCycles(); loadArbitration(); loadAlerts();
    loadSortie(); loadArchon(); loadBaro();
  }
  function pageRefresh() {
    loadCycles(); loadArbitration(); loadAlerts();
    loadSortie(); loadArchon(); loadBaro();
  }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# fissures.html
PAGES["fissures.html"] = dict(
    title_en="VOID FISSURES",
    title_de="VOID-FISSUREN",
    scripts=["core.js", "worldstate.js"],
    body="""
  <div class="info-box gold">
    <div class="info-icon">💡</div>
    <div class="info-text">
      <div class="info-title" data-en="How Void Fissures work" data-de="Wie Void-Fissuren funktionieren">How Void Fissures work</div>
      <div class="info-desc"
           data-en="Bring a matching <strong>Relic</strong> (Lith/Meso/Neo/Axi) into a Fissure mission to crack it and receive Prime parts. Collect 10 Reactant from enemies to open your Relic. <strong>Requiem</strong> Fissures are for Kuva Liches. <strong>Steel Path</strong> Fissures are harder but give bonus rewards."
           data-de="Nimm ein passendes <strong>Relic</strong> (Lith/Meso/Neo/Axi) in eine Fissur-Mission um Prime-Teile zu erhalten. Sammle 10 Reaktant von Feinden um dein Relic zu öffnen. <strong>Requiem</strong>-Fissuren sind für Kuva-Liches.">
        Bring a matching Relic into a Fissure mission to receive Prime parts.
      </div>
    </div>
  </div>

  <div id="fissureCountBadge" class="section-badge" style="margin-bottom:10px"></div>
  <div class="filter-row">
    <button class="tier-btn f-all on"   onclick="setFissureFilter('all',this)"    data-en="ALL" data-de="ALLE">ALL</button>
    <button class="tier-btn f-Lith"     onclick="setFissureFilter('Lith',this)">LITH</button>
    <button class="tier-btn f-Meso"     onclick="setFissureFilter('Meso',this)">MESO</button>
    <button class="tier-btn f-Neo"      onclick="setFissureFilter('Neo',this)">NEO</button>
    <button class="tier-btn f-Axi"      onclick="setFissureFilter('Axi',this)">AXI</button>
    <button class="tier-btn f-Requiem"  onclick="setFissureFilter('Requiem',this)">REQUIEM</button>
    <button class="tier-btn f-Omnia"    onclick="setFissureFilter('Omnia',this)">OMNIA</button>
    <button class="tier-btn f-steel"    onclick="setFissureFilter('steel',this)">⚔ <span data-en="STEEL PATH" data-de="STAHLPFAD">STEEL PATH</span></button>
  </div>

  <div class="fissure-grid" id="fissureGrid">
    <div class="loading-state" style="grid-column:1/-1"><div class="loading-spinner"></div><span>LOADING FISSURES...</span></div>
  </div>

  <script>
  function pageInit()    { loadFissures(); }
  function pageRefresh() { loadFissures(); }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# relics.html
PAGES["relics.html"] = dict(
    title_en="RELIC PLANNER",
    title_de="RELIC-PLANER",
    scripts=["core.js", "worldstate.js", "relics.js"],
    body="""
  <div class="relic-search-hero">
    <div class="relic-search-title" data-en="PRIME PART FINDER" data-de="PRIME-TEILE FINDER">PRIME PART FINDER</div>
    <div class="relic-search-sub"
         data-en="Search any Prime part to find which Relics contain it, see drop chances per refinement level, and see which Relics are in an <strong>active Fissure right now</strong>."
         data-de="Suche nach einem Prime-Teil und finde alle Relics die es enthalten, mit Drop-Chancen pro Verfeinerungsstufe. Direkt sichtbar: welche Relics sind <strong>gerade in einer aktiven Fissur</strong>.">
      Search any Prime part to find which Relics contain it.
    </div>
    <input class="search-input" id="relicSearch" type="text"
           placeholder="e.g. Saryn, Neuroptics, Vasto, Forma..."
           autocomplete="off" spellcheck="false"
           oninput="onRelicSearch(this.value)">
    <div class="relic-filter-row">
      <span style="font-size:10px;color:var(--text3);font-family:'Share Tech Mono',monospace;align-self:center;letter-spacing:1px;margin-right:4px">TIER:</span>
      <button class="relic-tier-btn on"  onclick="setRelicTierFilter('all',this)"     data-en="ALL" data-de="ALLE">ALL</button>
      <button class="relic-tier-btn"     onclick="setRelicTierFilter('Lith',this)">LITH</button>
      <button class="relic-tier-btn"     onclick="setRelicTierFilter('Meso',this)">MESO</button>
      <button class="relic-tier-btn"     onclick="setRelicTierFilter('Neo',this)">NEO</button>
      <button class="relic-tier-btn"     onclick="setRelicTierFilter('Axi',this)">AXI</button>
      <button class="relic-tier-btn"     onclick="setRelicTierFilter('Requiem',this)">REQUIEM</button>
    </div>
    <div class="relic-status" id="relicStatus">Loading relic database...</div>
    <div class="relic-load-track"><div class="relic-load-bar" id="relicLoadBar"></div></div>
  </div>

  <div class="info-box gold" style="margin-bottom:16px">
    <div class="info-icon">💡</div>
    <div class="info-text">
      <div class="info-title" data-en="Drop chance by refinement" data-de="Drop-Chance nach Verfeinerung">Drop chance by refinement</div>
      <div class="info-desc"
           data-en="<strong>Intact:</strong> Rare=2% · <strong>Exceptional:</strong> Rare=4% · <strong>Flawless:</strong> Rare=6% · <strong>Radiant:</strong> Rare=10%. Refining costs Void Traces. Radiant is best for rare parts."
           data-de="<strong>Intact:</strong> Selten=2% · <strong>Exceptional:</strong> Selten=4% · <strong>Flawless:</strong> Selten=6% · <strong>Radiant:</strong> Selten=10%. Verfeinern kostet Void-Spuren.">
        Refine with Void Traces for better odds.
      </div>
    </div>
  </div>

  <div class="relic-grid" id="relicGrid"></div>

  <script>
  function pageInit()    { loadFissures(); loadRelicDB(); }
  function pageRefresh() { loadFissures(); }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# sortie.html
PAGES["sortie.html"] = dict(
    title_en="DAILY SORTIE",
    title_de="TÄGLICHE SORTIE",
    scripts=["core.js", "worldstate.js"],
    body="""
  <div class="info-box gold">
    <div class="info-icon">💡</div>
    <div class="info-text">
      <div class="info-title" data-en="What is a Sortie?" data-de="Was ist eine Sortie?">What is a Sortie?</div>
      <div class="info-desc"
           data-en="<strong>3 high-level missions in a row</strong>, each with a special modifier (e.g. Radiation Hazard, Augmented Enemy Armor). Complete all 3 for a daily reward: Exilus Adapters, Anasa Sculptures, Legendary Cores, Riven Mods, or Resources. Resets at midnight UTC."
           data-de="<strong>3 Hochstufenmissionen hintereinander</strong>, jede mit einem speziellen Modifikator. Alle 3 abschließen für eine tägliche Belohnung. Reset um Mitternacht UTC.">
        3 high-level missions in a row, each with a special modifier.
      </div>
    </div>
  </div>
  <div id="sortieContainer"><div class="loading-state"><div class="loading-spinner"></div><span>LOADING SORTIE...</span></div></div>

  <script>
  function pageInit()    { loadSortie(); }
  function pageRefresh() { loadSortie(); }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# nightwave.html
PAGES["nightwave.html"] = dict(
    title_en="NIGHTWAVE",
    title_de="NIGHTWAVE",
    scripts=["core.js", "worldstate.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">💡</div>
    <div class="info-text">
      <div class="info-title" data-en="What is Nightwave?" data-de="Was ist Nightwave?">What is Nightwave?</div>
      <div class="info-desc"
           data-en="Complete <strong>daily, weekly and elite weekly challenges</strong> from Nora Night to earn Standing. Spend Standing in the Cred Offerings shop for exclusive Helmets, Mods, Forma and Arcanes. Tick off challenges as you complete them, saved in your browser."
           data-de="Schließe <strong>tägliche, wöchentliche und Elite-Herausforderungen</strong> für Nora Night ab, um Ansehen zu verdienen. Kaufe damit exklusive Helme, Mods, Forma und Arcanes.">
        Complete challenges to earn Standing.
      </div>
    </div>
  </div>
  <div id="nightwaveContainer"><div class="loading-state"><div class="loading-spinner"></div><span>LOADING NIGHTWAVE...</span></div></div>

  <script>
  function pageInit()    { loadNightwave(); }
  function pageRefresh() { loadNightwave(); }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# archon.html (NEW)
PAGES["archon.html"] = dict(
    title_en="ARCHON HUNT",
    title_de="ARCHON-JAGD",
    scripts=["core.js", "worldstate.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">🛡</div>
    <div class="info-text">
      <div class="info-title" data-en="What is the Archon Hunt?" data-de="Was ist die Archon-Jagd?">What is the Archon Hunt?</div>
      <div class="info-desc"
           data-en="Once per week, take down one of the three Archons (Boreal, Amar, Nira) in a <strong>3-mission chain</strong>. Reward: <strong>Archon Shards</strong>, permanent stat upgrades you slot into your Warframes via the Helminth. Required quest: <strong>Veilbreaker</strong>."
           data-de="Einmal pro Woche legst du einen der drei Archons (Boreal, Amar, Nira) in einer <strong>3-Missions-Kette</strong> um. Belohnung: <strong>Archon-Shards</strong>, permanente Stat-Upgrades die du in deine Warframes über die Helminth einsetzt. Vorausgesetzt: Quest <strong>Veilbreaker</strong>.">
        Once per week, take down an Archon for Archon Shards.
      </div>
    </div>
  </div>
  <div id="archonContainer"><div class="loading-state"><div class="loading-spinner"></div><span>LOADING ARCHON HUNT...</span></div></div>

  <script>
  function pageInit()    { loadArchon(); }
  function pageRefresh() { loadArchon(); }
  setInterval(pageRefresh, 300000);
  </script>
"""
)

# duviri.html
PAGES["duviri.html"] = dict(
    title_en="DUVIRI PARADOX",
    title_de="DUVIRI PARADOX",
    scripts=["core.js", "duviri.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">💡</div>
    <div class="info-text">
      <div class="info-title" data-en="What is Duviri?" data-de="Was ist Duviri?">What is Duviri?</div>
      <div class="info-desc"
           data-en="Duviri is an <strong>open world trapped in a time loop</strong>. The Spiral cycle changes gameplay each rotation. Inside lies <strong>The Circuit</strong>, a weekly roguelite mode rewarding <strong>Incarnon Genesis</strong> weapon upgrades, some of the most powerful in the game."
           data-de="Duviri ist eine <strong>Open World in einer Zeitschleife</strong>. Der Spiral-Zyklus beeinflusst das Gameplay. Im Inneren liegt <strong>Der Circuit</strong>, ein wöchentlicher Roguelite-Modus mit <strong>Incarnon Genesis</strong> Waffen-Upgrades.">
        Open world in a time loop. The Circuit gives Incarnon Genesis upgrades.
      </div>
    </div>
  </div>
  <div id="duviriContainer"><div class="loading-state"><div class="loading-spinner"></div><span>LOADING DUVIRI...</span></div></div>

  <script>
  function pageInit()    { loadDuviri(); }
  function pageRefresh() { loadDuviri(); }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# invasions.html
PAGES["invasions.html"] = dict(
    title_en="INVASIONS",
    title_de="INVASIONEN",
    scripts=["core.js", "worldstate.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">💡</div>
    <div class="info-text">
      <div class="info-title" data-en="How Invasions work" data-de="Wie Invasionen funktionieren">How Invasions work</div>
      <div class="info-desc"
           data-en="Two factions are at war. <strong>Pick a side</strong> and complete 3 missions to claim their reward. You can complete both sides if both offer rewards! Great for farming <strong>Fieldron, Detonite Injector and Mutagen Mass</strong> for Clan research."
           data-de="Zwei Fraktionen bekämpfen sich. <strong>Wähle eine Seite</strong> und schließe 3 Missionen ab. Falls beide Seiten Belohnungen bieten, kannst du beide abschließen! Toll für <strong>Fieldron, Detonit-Injektor und Mutagenmasse</strong> für die Clan-Forschung.">
        Two factions at war. Pick a side, complete 3 missions.
      </div>
    </div>
  </div>
  <div style="margin-bottom:10px" id="invasionCountBadge" class="section-badge"></div>
  <div class="invasion-grid" id="invasionGrid">
    <div class="loading-state" style="grid-column:1/-1"><div class="loading-spinner"></div><span>LOADING INVASIONS...</span></div>
  </div>

  <script>
  function pageInit()    { loadInvasions(); }
  function pageRefresh() { loadInvasions(); }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# baro.html
PAGES["baro.html"] = dict(
    title_en="BARO KI'TEER",
    title_de="BARO KI'TEER",
    scripts=["core.js", "worldstate.js"],
    body="""
  <div class="info-box gold">
    <div class="info-icon">💡</div>
    <div class="info-text">
      <div class="info-title" data-en="Who is Baro Ki'Teer?" data-de="Wer ist Baro Ki'Teer?">Who is Baro Ki'Teer?</div>
      <div class="info-desc"
           data-en="The <strong>Void Trader</strong> visits a Relay every 2 weeks for exactly 48 hours, selling exclusive <strong>Primed Mods</strong>, rare weapons and cosmetics, only buyable with <strong>Ducats + Credits</strong>. Get Ducats by selling Prime parts at the Ducat Kiosk in any Relay."
           data-de="Der <strong>Void-Händler</strong> besucht alle 2 Wochen für 48 Stunden ein Relay und verkauft exklusive <strong>Primed Mods</strong>, seltene Waffen und Kosmetika, nur kaufbar mit <strong>Ducats + Credits</strong>.">
        Void Trader visits every 2 weeks. Sells exclusive Primed Mods.
      </div>
    </div>
  </div>
  <div id="baroContainer"><div class="loading-state"><div class="loading-spinner"></div><span>LOADING BARO DATA...</span></div></div>

  <script>
  function pageInit()    { loadBaro(); }
  function pageRefresh() { loadBaro(); }
  setInterval(pageRefresh, 120000);
  </script>
"""
)

# translator.html
PAGES["translator.html"] = dict(
    title_en="DE / EN NAME TRANSLATOR",
    title_de="DE / EN NAMENS-ÜBERSETZER",
    scripts=["core.js", "translator.js"],
    body="""
  <div class="translator-hero">
    <div class="translator-title" data-en="DE / EN NAME TRANSLATOR" data-de="DE / EN NAMENS-ÜBERSETZER">DE / EN NAME TRANSLATOR</div>
    <div class="translator-sub"
         data-en="The biggest problem for German players: English builds use English item names, but the German game client shows <strong>completely different names</strong> that are not simple translations. Search in either language to instantly find the correct Mod, Warframe or Weapon name."
         data-de="Das größte Problem für deutsche Spieler: Englische Builds verwenden englische Namen, das deutsche Spiel zeigt aber <strong>völlig andere Namen</strong> die keine direkten Übersetzungen sind. Suche in beiden Sprachen um sofort den richtigen Namen zu finden.">
      English builds use English names. The German client shows different names. Search in either language.
    </div>
    <input class="search-input" id="transInput" type="text"
           placeholder="Search EN or DE... e.g. Serration / Aufsatz, Ash, Vasto..."
           autocomplete="off" spellcheck="false"
           oninput="onTransSearch(this.value)">
    <div class="cat-row">
      <button class="cat-btn on"  onclick="setTransCat('all',this)"      data-en="All"       data-de="Alle">All</button>
      <button class="cat-btn"     onclick="setTransCat('mod',this)">Mods</button>
      <button class="cat-btn"     onclick="setTransCat('warframe',this)">Warframes</button>
      <button class="cat-btn"     onclick="setTransCat('weapon',this)"   data-en="Weapons"   data-de="Waffen">Weapons</button>
      <button class="cat-btn"     onclick="setTransCat('resource',this)" data-en="Resources" data-de="Ressourcen">Resources</button>
    </div>
    <div class="trans-status" id="transStatus"></div>
    <div class="trans-load-track" id="transLoadTrack"><div class="trans-load-fill" id="transLoadBarFill"></div></div>
  </div>
  <div class="trans-grid" id="transGrid"></div>

  <script>
  function pageInit()    { loadTranslator(); }
  function pageRefresh() { /* nothing to refresh */ }
  </script>
"""
)

# glossary.html (NEW)
PAGES["glossary.html"] = dict(
    title_en="WARFRAME GLOSSARY",
    title_de="WARFRAME-GLOSSAR",
    scripts=["core.js", "glossary.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">📖</div>
    <div class="info-text">
      <div class="info-title" data-en="The jargon, demystified" data-de="Der Fachjargon, entschlüsselt">The jargon, demystified</div>
      <div class="info-desc"
           data-en="Warframe veterans throw around terms like <strong>Lich, Riven, Galvanized, Incarnon, Eidolon</strong> as if everyone knows them. This glossary explains the most common terms in plain language, with German equivalents."
           data-de="Warframe-Veteranen werfen mit Begriffen wie <strong>Lich, Riven, Galvanized, Incarnon, Eidolon</strong> um sich, als wären sie selbstverständlich. Dieses Glossar erklärt die wichtigsten Begriffe in klarer Sprache, mit deutschen Entsprechungen.">
        Plain-language explanations for Warframe jargon.
      </div>
    </div>
  </div>
  <input class="search-input" id="glossSearch" type="text"
         style="margin-bottom:14px;max-width:480px;display:block"
         placeholder="Search a term, e.g. Lich, Riven, Forma..."
         autocomplete="off" spellcheck="false"
         oninput="onGlossSearch(this.value)">
  <div class="filter-row" style="margin-bottom:16px">
    <button class="res-filter-btn gloss-filter-btn on" onclick="setGlossFilter('all',this)"      data-en="All"        data-de="Alle">All</button>
    <button class="res-filter-btn gloss-filter-btn"    onclick="setGlossFilter('system',this)"   data-en="Systems"    data-de="Systeme">Systems</button>
    <button class="res-filter-btn gloss-filter-btn"    onclick="setGlossFilter('gear',this)"     data-en="Gear"       data-de="Ausrüstung">Gear</button>
    <button class="res-filter-btn gloss-filter-btn"    onclick="setGlossFilter('enemy',this)"    data-en="Enemies"    data-de="Gegner">Enemies</button>
    <button class="res-filter-btn gloss-filter-btn"    onclick="setGlossFilter('activity',this)" data-en="Activities" data-de="Aktivitäten">Activities</button>
    <button class="res-filter-btn gloss-filter-btn"    onclick="setGlossFilter('economy',this)"  data-en="Economy"    data-de="Wirtschaft">Economy</button>
  </div>
  <div id="glossaryGrid" class="glossary-grid"></div>

  <script>
  function pageInit()    { initGlossary(); }
  function pageRefresh() { initGlossary(); }
  </script>
"""
)

# acquisition.html (NEW)
PAGES["acquisition.html"] = dict(
    title_en="WARFRAME ACQUISITION",
    title_de="WARFRAME-AKQUISE",
    scripts=["core.js", "acquisition.js"],
    body="""
  <div class="info-box gold">
    <div class="info-icon">🎯</div>
    <div class="info-text">
      <div class="info-title" data-en="Where do Warframes come from?" data-de="Woher kommen Warframes?">Where do Warframes come from?</div>
      <div class="info-desc"
           data-en="Each Warframe has a specific source: a <strong>boss drop</strong>, a <strong>quest reward</strong>, <strong>Clan Dojo research</strong>, or a special mission type. This list shows the fastest path to every base frame."
           data-de="Jede Warframe hat eine bestimmte Quelle: ein <strong>Boss-Drop</strong>, eine <strong>Questbelohnung</strong>, eine <strong>Clan-Dojo-Forschung</strong> oder ein spezieller Missionstyp. Diese Liste zeigt den schnellsten Weg zu jedem Basis-Frame.">
        The fastest path to every base Warframe.
      </div>
    </div>
  </div>
  <input class="search-input" id="acqSearch" type="text"
         style="margin-bottom:14px;max-width:480px;display:block"
         placeholder="e.g. Rhino, Saryn, Jackal, Earth..."
         autocomplete="off" spellcheck="false"
         oninput="onAcqSearch(this.value)">
  <div class="filter-row" style="margin-bottom:16px">
    <button class="res-filter-btn acq-filter-btn on" onclick="setAcqFilter('all',this)"     data-en="All"     data-de="Alle">All</button>
    <button class="res-filter-btn acq-filter-btn"    onclick="setAcqFilter('boss',this)"    data-en="Boss"    data-de="Boss">Boss</button>
    <button class="res-filter-btn acq-filter-btn"    onclick="setAcqFilter('dojo',this)"    data-en="Dojo"    data-de="Dojo">Dojo</button>
    <button class="res-filter-btn acq-filter-btn"    onclick="setAcqFilter('quest',this)"   data-en="Quest"   data-de="Queste">Quest</button>
    <button class="res-filter-btn acq-filter-btn"    onclick="setAcqFilter('mission',this)" data-en="Mission" data-de="Mission">Mission</button>
    <button class="res-filter-btn acq-filter-btn"    onclick="setAcqFilter('login',this)"   data-en="Login"   data-de="Login">Login</button>
  </div>
  <div id="acqGrid" class="acq-grid"></div>

  <script>
  function pageInit()    { initAcquisition(); }
  function pageRefresh() { initAcquisition(); }
  </script>
"""
)

# roadmap.html
PAGES["roadmap.html"] = dict(
    title_en="BEGINNER ROADMAP",
    title_de="EINSTEIGER-ROADMAP",
    scripts=["core.js", "beginner.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">🗺</div>
    <div class="info-text">
      <div class="info-title" data-en="Your progression guide" data-de="Dein Fortschritts-Guide">Your progression guide</div>
      <div class="info-desc"
           data-en="Warframe throws a lot at you at once. This roadmap breaks progression into <strong>5 logical chapters</strong> so you always know what to tackle next. Tick off milestones, your progress saves automatically in your browser."
           data-de="Warframe überwältigt neue Spieler. Diese Roadmap teilt den Fortschritt in <strong>5 logische Kapitel</strong> ein, damit du immer weißt was als nächstes kommt. Hake Meilensteine ab, wird automatisch gespeichert.">
        5 logical chapters. Progress saves in your browser.
      </div>
    </div>
  </div>
  <div style="text-align:right;margin-bottom:12px">
    <button class="btn-sm" onclick="resetRoadmap()">↺ <span data-en="Reset all progress" data-de="Fortschritt zurücksetzen">Reset all progress</span></button>
  </div>
  <div id="roadmapContainer"></div>

  <script>
  function pageInit()    { renderRoadmap(); }
  function pageRefresh() { renderRoadmap(); }
  </script>
"""
)

# resources.html
PAGES["resources.html"] = dict(
    title_en="RESOURCE FINDER",
    title_de="RESSOURCEN-FINDER",
    scripts=["core.js", "beginner.js"],
    body="""
  <div class="info-box gold">
    <div class="info-icon">🔍</div>
    <div class="info-text">
      <div class="info-title" data-en="Where do I find...?" data-de="Wo finde ich...?">Where do I find...?</div>
      <div class="info-desc"
           data-en="Search for any resource, Warframe frame part or key Mod to find <strong>the best farming location, which boss drops it, and pro tips</strong>. No more wiki searching for common items."
           data-de="Suche nach einer Ressource, einem Warframe-Teil oder einem wichtigen Mod um <strong>den besten Farming-Ort, welcher Boss es droppt und Profi-Tipps</strong> zu finden.">
        Best farming location and tips for any resource or Warframe part.
      </div>
    </div>
  </div>
  <input class="search-input" id="resSearch" type="text"
         style="margin-bottom:14px;max-width:480px;display:block"
         placeholder="e.g. Neurodes, Rhino, Neuroptics, Orokin Cell, Serration..."
         autocomplete="off" spellcheck="false"
         oninput="onResSearch(this.value)">
  <div class="res-filter-row">
    <button class="res-filter-btn on" onclick="setResFilter('all',this)"      data-en="All"        data-de="Alle">All</button>
    <button class="res-filter-btn"    onclick="setResFilter('resource',this)" data-en="Resources"  data-de="Ressourcen">Resources</button>
    <button class="res-filter-btn"    onclick="setResFilter('warframe',this)" data-en="Warframes"  data-de="Warframes">Warframes</button>
    <button class="res-filter-btn"    onclick="setResFilter('mod',this)"      data-en="Mods"       data-de="Mods">Mods</button>
  </div>
  <div id="resGrid" class="res-grid"></div>

  <script>
  function pageInit()    { initResourceFinder(); }
  function pageRefresh() { initResourceFinder(); }
  </script>
"""
)

# daily.html
PAGES["daily.html"] = dict(
    title_en="DAILY CHECKLIST",
    title_de="TAGES-CHECKLISTE",
    scripts=["core.js", "beginner.js"],
    body="""
  <div class="info-box">
    <div class="info-icon">✅</div>
    <div class="info-text">
      <div class="info-title" data-en="What to do every day" data-de="Was täglich zu tun ist">What to do every day</div>
      <div class="info-desc"
           data-en="Warframe has many <strong>daily-resetting activities</strong> with reward caps. This checklist ensures you never miss free resources, Standing or rewards. Resets automatically at <strong>midnight UTC</strong> (items marked Weekly reset on Mondays)."
           data-de="Warframe hat viele <strong>täglich zurücksetzende Aktivitäten</strong> mit Caps. Diese Checkliste stellt sicher dass du keine kostenlosen Ressourcen oder Belohnungen verpasst. Setzt automatisch um <strong>Mitternacht UTC</strong> zurück (Wöchentliche Items montags).">
        Daily-resetting activities with reward caps. Resets at midnight UTC.
      </div>
    </div>
  </div>
  <div id="dailyContainer"></div>

  <script>
  function pageInit()    { renderDailyChecklist(); }
  function pageRefresh() { renderDailyChecklist(); }
  </script>
"""
)


if __name__ == "__main__":
    generated = []
    for filename, cfg in PAGES.items():
        html = shell(
            current_file = filename,
            title_en     = cfg["title_en"],
            title_de     = cfg["title_de"],
            scripts      = cfg["scripts"],
            body_content = cfg["body"],
        )
        out_path = os.path.join(OUT, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        generated.append(filename)
        print(f"  OK  {filename}")

    print(f"\n{len(generated)} pages generated in {OUT}")
