/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, shell.js  v5.2 — Sidebar + grouped mobile nav
   - Desktop (>1024px):  fixed sidebar, always visible
   - Tablet  (769-1024): hamburger toggles sidebar as overlay
   - Mobile  (<768px):   5-tab bottom nav + slide-up submenus
   Adding a new page: add one entry to NAV_GROUPS below.
═══════════════════════════════════════════════════════════════ */
(function buildShell() {
  const PAGE        = document.documentElement.dataset.page || '';
  const currentLang = localStorage.getItem('th_lang') || ((navigator.language||'').toLowerCase().startsWith('de') ? 'de' : 'en');
  const currentPlat = localStorage.getItem('th_platform') || 'pc';

  /* ── Navigation groups ── */
  const NAV_GROUPS = [
    { id:'live',  en:'Live',   de:'Live',   icon:'🌍', items: [
      { id:'dashboard',   href:'index.html',       icon:'⬡', en:'Dashboard',   de:'Dashboard' },
      { id:'fissures',    href:'fissures.html',    icon:'◈', en:'Fissures',    de:'Fissuren' },
      { id:'nightwave',   href:'nightwave.html',   icon:'◉', en:'Nightwave',   de:'Nightwave' },
      { id:'invasions',   href:'invasions.html',   icon:'⚔', en:'Invasions',   de:'Invasionen' },
      { id:'duviri',      href:'duviri.html',      icon:'🌀', en:'Duviri',      de:'Duviri' },
    ]},
    { id:'tasks', en:'Tasks',  de:'Tasks',  icon:'📋', items: [
      { id:'daily',       href:'daily.html',       icon:'✅', en:'Daily',       de:'Daily' },
      { id:'sortie',      href:'sortie.html',      icon:'⚡', en:'Sortie',      de:'Sortie' },
      { id:'archon',      href:'archon.html',      icon:'🦅', en:'Archon Hunt', de:'Archon-Jagd' },
      { id:'baro',        href:'baro.html',        icon:'💰', en:"Baro Ki'Teer", de:"Baro Ki'Teer" },
    ]},
    { id:'gear',  en:'Gear',   de:'Gear',   icon:'⚙',  items: [
      { id:'relics',      href:'relics.html',      icon:'⬟', en:'Relics',      de:'Relics' },
      { id:'itemfinder',  href:'itemfinder.html',  icon:'🔎', en:'Mod Finder',  de:'Mod-Finder' },
      { id:'acquisition', href:'acquisition.html', icon:'🎯', en:'Frames',      de:'Frames' },
      { id:'lich',        href:'lich.html',        icon:'💀', en:'Lich/Sister', de:'Lich/Sister' },
      { id:'foundry',     href:'foundry.html',     icon:'🏗', en:'Foundry',     de:'Gießerei' },
    ]},
    { id:'info',  en:'Info',   de:'Info',   icon:'📚', items: [
      { id:'roadmap',     href:'roadmap.html',     icon:'🗺', en:'Roadmap',     de:'Roadmap' },
      { id:'resources',   href:'resources.html',   icon:'🔍', en:'Resources',   de:'Ressourcen' },
      { id:'translator',  href:'translator.html',  icon:'🔤', en:'Translator',  de:'Übersetzer' },
      { id:'glossary',    href:'glossary.html',    icon:'📖', en:'Glossary',    de:'Glossar' },
    ]},
  ];

  /* Flat list for keyboard shortcuts */
  const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);
  /* Which group is the current page in? */
  const currentGroupId = NAV_GROUPS.find(g => g.items.some(i => i.id === PAGE))?.id ?? '';

  /* ── Logo SVG ── */
  const LOGO = `<svg class="logo-glyph" viewBox="0 0 36 36" fill="none">
    <polygon points="18,2 34,10.5 34,27.5 18,35 2,27.5 2,10.5" fill="none" stroke="#c8a84b" stroke-width="1.5" opacity=".85"/>
    <polygon points="18,8 28,13.5 28,24.5 18,30 8,24.5 8,13.5"  fill="none" stroke="#58c4f0" stroke-width="1"   opacity=".5"/>
    <circle cx="18" cy="19" r="2.3" fill="#c8a84b"/>
    <line x1="18" y1="8"    x2="18" y2="12"   stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
    <line x1="18" y1="26"   x2="18" y2="30"   stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
    <line x1="8"  y1="13.5" x2="11.5" y2="15.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
    <line x1="28" y1="22.5" x2="24.5" y2="24.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
    <line x1="28" y1="13.5" x2="24.5" y2="15.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
    <line x1="8"  y1="22.5" x2="11.5" y2="24.5" stroke="#c8a84b" stroke-width="1.5" opacity=".7"/>
  </svg>`;

  /* ── Sidebar (desktop + tablet overlay) ── */
  const sidebarHTML = NAV_GROUPS.map(g => {
    const items = g.items.map(n =>
      `<a class="sidebar-item${n.id === PAGE ? ' current' : ''}" href="${n.href}">
        <span class="sidebar-icon">${n.icon}</span>
        <span data-en="${n.en}" data-de="${n.de}">${currentLang === 'de' ? n.de : n.en}</span>
      </a>`
    ).join('');
    return `<div class="sidebar-group">
      <div class="sidebar-group-lbl" data-en="${g.en}" data-de="${g.de}">${currentLang === 'de' ? g.de : g.en}</div>
      ${items}
    </div>`;
  }).join('');

  /* ── Mobile: 5-tab bottom nav ──
     Tab 1: Home (direct link to dashboard)
     Tabs 2-5: Group tabs (each opens slide-up submenu)            */
  const homeActive = PAGE === 'dashboard';

  /* Live group on mobile excludes Dashboard (it has its own Home tab) */
  const MOBILE_GROUPS = NAV_GROUPS.map(g => ({
    ...g,
    items: g.id === 'live' ? g.items.filter(i => i.id !== 'dashboard') : g.items,
  }));

  const mobileTabsHTML = MOBILE_GROUPS.map(g => {
    const gActive = !homeActive && g.items.some(i => i.id === PAGE);
    return `<button class="mb-tab${gActive ? ' current' : ''}" type="button"
              onclick="toggleMobileGroup('${g.id}',this)" data-group="${g.id}">
      <span class="mb-icon">${g.icon}</span>
      <span data-en="${g.en}" data-de="${g.de}">${currentLang === 'de' ? g.de : g.en}</span>
    </button>`;
  }).join('');

  /* ── Mobile: slide-up submenus ── */
  const mobilePanelsHTML = MOBILE_GROUPS.map(g => {
    const panelItems = g.items.map(n =>
      `<a class="mb-panel-item${n.id === PAGE ? ' current' : ''}" href="${n.href}">
        <span class="mb-panel-icon">${n.icon}</span>
        <span data-en="${n.en}" data-de="${n.de}">${currentLang === 'de' ? n.de : n.en}</span>
      </a>`
    ).join('');
    return `<div class="mb-group-panel" id="mbPanel_${g.id}">
      <div class="mb-panel-title" data-en="${g.en}" data-de="${g.de}">${currentLang === 'de' ? g.de : g.en}</div>
      <div class="mb-panel-grid">${panelItems}</div>
    </div>`;
  }).join('');

  /* ── Full shell HTML ── */
  const html = `
<header>
  <button class="hamburger-btn" id="hamburgerBtn" onclick="toggleSidebar()"
          title="Navigation öffnen/schließen" type="button" aria-label="Toggle navigation">
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <rect x="0" y="0"  width="18" height="2" rx="1" fill="currentColor"/>
      <rect x="0" y="6"  width="18" height="2" rx="1" fill="currentColor"/>
      <rect x="0" y="12" width="18" height="2" rx="1" fill="currentColor"/>
    </svg>
  </button>
  <a class="logo-link" href="index.html" title="TENNO.HUB Home">
    ${LOGO}
    <div class="logo-stack">
      <div class="logo-text">TENNO.HUB</div>
      <div class="logo-sub">Warframe Companion · familienfabrik.at</div>
    </div>
  </a>
  <div class="header-right">
    <div class="control-group" id="platformSel">
      <button class="ctrl-btn ${currentPlat==='pc'?'active ':'' }" data-platform="pc"  onclick="setPlatform('pc',this)">PC</button>
      <button class="ctrl-btn ${currentPlat==='ps4'?'active ':'' }" data-platform="ps4" onclick="setPlatform('ps4',this)">PSN</button>
      <button class="ctrl-btn ${currentPlat==='xb1'?'active ':'' }" data-platform="xb1" onclick="setPlatform('xb1',this)">XBX</button>
      <button class="ctrl-btn ${currentPlat==='swi'?'active ':'' }" data-platform="swi" onclick="setPlatform('swi',this)">NSW</button>
    </div>
    <div class="control-group">
      <button class="ctrl-btn ${currentLang==='en'?'active':''}" id="btnEN" onclick="setLang('en')">EN</button>
      <button class="ctrl-btn ${currentLang==='de'?'active':''}" id="btnDE" onclick="setLang('de')">DE</button>
    </div>
    <button class="icon-btn" id="bellBtn" onclick="toggleNotifDrawer()" title="Notifications">
      🔔<span class="notif-badge" id="notifBadge"></span>
    </button>
    <button class="icon-btn hdr-desktop-only" onclick="clearAPICache()" title="Cache leeren">🗑</button>
    <button class="icon-btn hdr-desktop-only" onclick="toggleHotkeyHelp()" title="Tastaturkürzel (?)">⌨</button>
  </div>
</header>

<!-- ═══ SIDEBAR (desktop always-on + tablet overlay) ═════════ -->
<nav class="sidebar-nav" id="sidebarNav" aria-label="Hauptnavigation">
  ${sidebarHTML}
  <div class="sidebar-footer">
    <button class="sidebar-footer-btn" onclick="forceRefresh()" title="App vollständig aktualisieren">
      🔄 <span data-en="Force Refresh" data-de="App aktualisieren">App aktualisieren</span>
    </button>
    <button class="sidebar-footer-btn" onclick="clearAPICache()" title="Nur API-Daten neu laden">
      🗑 <span data-en="Clear API Cache" data-de="API-Cache leeren">API-Cache leeren</span>
    </button>
    <button class="sidebar-footer-btn" onclick="toggleHotkeyHelp()" title="Tastaturkürzel">
      ⌨ <span data-en="Shortcuts" data-de="Shortcuts">Shortcuts</span>
    </button>
    <div class="sidebar-version">v5.2</div>
  </div>
</nav>
<div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()" aria-hidden="true"></div>

<!-- ═══ STALE / OFFLINE BARS ══════════════════════════════════ -->
<div id="staleBar" class="stale-bar">
  <span id="staleBarMsg"></span>
  <button onclick="clearAPICache()" type="button">↻ Retry</button>
</div>

<!-- ═══ NOTIFICATION DRAWER ══════════════════════════════════ -->
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

<!-- ═══ HOTKEY MODAL ═════════════════════════════════════════ -->
<div class="hotkey-modal" id="hotkeyModal">
  <div class="hotkey-backdrop" onclick="toggleHotkeyHelp()"></div>
  <div class="hotkey-panel">
    <div class="hotkey-title">⌨ <span data-en="Keyboard Shortcuts" data-de="Tastaturkürzel">Keyboard Shortcuts</span></div>
    <div class="hotkey-grid">
      <kbd>/</kbd>      <span data-en="Focus search input"    data-de="Suche fokussieren">Focus search input</span>
      <kbd>R</kbd>      <span data-en="Refresh data"          data-de="Daten aktualisieren">Refresh data</span>
      <kbd>T</kbd>      <span data-en="Toggle DE / EN"        data-de="DE / EN wechseln">Toggle DE / EN</span>
      <kbd>B</kbd>      <span data-en="Toggle sidebar"        data-de="Sidebar ein/aus">Toggle sidebar</span>
      <kbd>? / F1</kbd> <span data-en="This shortcuts panel"  data-de="Dieses Panel">This shortcuts panel</span>
      <kbd>1 … ${NAV_ITEMS.length}</kbd> <span data-en="Jump to nav item N" data-de="Zu Nav-Eintrag N springen">Jump to nav item N</span>
      <kbd>Esc</kbd>    <span data-en="Close panel / sidebar" data-de="Panel / Sidebar schließen">Close panel / sidebar</span>
    </div>
    <button class="hotkey-close" onclick="toggleHotkeyHelp()"
            data-en="Close" data-de="Schließen">Close</button>
  </div>
</div>

<!-- ═══ SYSTEM BARS ══════════════════════════════════════════ -->
<div class="offline-bar" id="offlineBar">
  📵 <span data-en="You are offline – showing cached data" data-de="Du bist offline – zeige gecachte Daten">You are offline – showing cached data</span>
</div>
<div class="toast-wrap" id="toastWrap"></div>

<!-- ═══ MOBILE: slide-up group panels ════════════════════════ -->
${mobilePanelsHTML}
<div class="mb-overlay" id="mbOverlay" onclick="closeAllMobilePanels()"></div>

<!-- ═══ MOBILE BOTTOM NAV ════════════════════════════════════ -->
<nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
  <a class="mb-home-btn${homeActive ? ' current' : ''}" href="index.html">
    <span class="mb-icon">⬡</span>
    <span data-en="Home" data-de="Home">${currentLang === 'de' ? 'Home' : 'Home'}</span>
  </a>
  ${mobileTabsHTML}
</nav>

<!-- ═══ STATUS BAR ════════════════════════════════════════════ -->
<div class="status-bar">
  <div class="status-live" id="sbLive"><div class="status-dot"></div><span id="sbLiveTxt">LIVE</span></div>
  <span id="sbPlatform">PC</span>
  <span class="status-api">warframestat.us</span>
  <span id="sbClock"></span>
  <a href="https://familienfabrik.at" target="_blank"
     style="margin-left:auto;opacity:.4;color:inherit;text-decoration:none;font-size:10px;">
    familienfabrik.at
  </a>
</div>`;

  /* ── Inject ── */
  document.body.insertAdjacentHTML('afterbegin', html);

  /* ════════════════════════════════════════════════════════════
     SIDEBAR LOGIC
  ════════════════════════════════════════════════════════════ */
  window.toggleSidebar = function () {
    const nav     = document.getElementById('sidebarNav');
    const overlay = document.getElementById('sidebarOverlay');
    const open    = nav.classList.toggle('open');
    overlay.classList.toggle('open', open);
    localStorage.setItem('th_sidebar', open ? 'open' : 'closed');
  };

  window.closeSidebar = function () {
    document.getElementById('sidebarNav')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('open');
  };

  /* Restore sidebar open state on tablet (desktop is CSS-controlled) */
  if (window.innerWidth <= 1024 && localStorage.getItem('th_sidebar') === 'open') {
    document.getElementById('sidebarNav')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('open');
  }

  /* ════════════════════════════════════════════════════════════
     MOBILE GROUP PANEL LOGIC
  ════════════════════════════════════════════════════════════ */
  window.toggleMobileGroup = function (groupId, btn) {
    const panel   = document.getElementById('mbPanel_' + groupId);
    const overlay = document.getElementById('mbOverlay');
    const wasOpen = panel?.classList.contains('open');

    /* Close all panels first */
    document.querySelectorAll('.mb-group-panel').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.mb-tab').forEach(b => b.setAttribute('aria-expanded', 'false'));
    overlay?.classList.remove('active');

    if (!wasOpen && panel) {
      panel.classList.add('open');
      overlay?.classList.add('active');
      btn?.setAttribute('aria-expanded', 'true');
    }
  };

  window.closeAllMobilePanels = function () {
    document.querySelectorAll('.mb-group-panel').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.mb-tab').forEach(b => b.setAttribute('aria-expanded', 'false'));
    document.getElementById('mbOverlay')?.classList.remove('active');
  };

  /* Close panels on outside click / Escape */
  document.addEventListener('click', e => {
    const nav = document.querySelector('.mobile-bottom-nav');
    if (!nav) return;
    const panels = document.querySelectorAll('.mb-group-panel.open');
    if (!panels.length) return;
    /* Click outside nav AND outside panels → close */
    if (!nav.contains(e.target) && ![...panels].some(p => p.contains(e.target))) {
      closeAllMobilePanels();
    }
  });

})();
