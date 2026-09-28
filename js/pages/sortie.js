/* TENNO.HUB · Sortie & Archon-Jagd (gleiche Darstellung, zwei Seiten) */
(function () {
const { L, esc, icon, ui, cd, bar, ts } = TH;
const $ = s => document.getElementById(s);
const isArchon = document.documentElement.dataset.page === 'archon';

const INFO = isArchon ? {
  key: 'archonHunt', accent: 'var(--narmer)', ic: 'crown',
  reward: L('Guaranteed Archon Shard (Tauforged chance). Steel Path: 2 shards.', 'Garantierte Archon-Scherbe (Chance auf Tauforged). Stahlpfad: 2 Scherben.'),
  req: L('Requires: The New War + Veilbreaker quest', 'Voraussetzung: Quests „The New War“ + „Veilbreaker“'),
} : {
  key: 'sortie', accent: 'var(--gold)', ic: 'bolt',
  reward: L('Random reward: Riven Mod, Exilus Adapter, Legendary Core, Kuva, Endo, Forma …', 'Zufällige Belohnung: Riven-Mod, Exilus-Adapter, Legendärer Kern, Kuva, Endo, Forma …'),
  req: L('Requires: Mastery Rank 4 + The War Within quest', 'Voraussetzung: Meisterschaftsrang 4 + Quest „Der innere Krieg“'),
};

function render(d) {
  const s = d[INFO.key];
  const ms = s?.variants || s?.missions || [];
  if (!ms.length) { $('main-card').innerHTML = ui.empty(L('No data available', 'Keine Daten verfügbar')); return; }
  $('main-card').innerHTML = `
    <div class="card card-accent" style="--accent:${INFO.accent};padding:24px">
      <div class="flex between wrap">
        <div><div class="card-lbl">${icon(INFO.ic)}${esc(isArchon ? L('This week', 'Diese Woche') : L('Today', 'Heute'))}</div>
          <div class="card-title" style="font-size:34px;margin-top:6px">${esc(s.boss || '')}</div>
          <div class="card-sub">${esc(s.faction || '')}</div></div>
        <div class="center"><div class="card-lbl">${esc(L('Resets in', 'Reset in'))}</div><div style="font-size:24px;margin-top:6px">${cd(s.expiry, 'long')}</div></div>
      </div>
      <div class="mt">${bar(s.activation || ts(s.expiry) - (isArchon ? 7 : 1) * 864e5, s.expiry)}</div>
    </div>
    <div class="grid-3 mt">${ms.map((m, i) => `<div class="card card-accent" style="--accent:${INFO.accent}">
      <div class="card-lbl">${esc(L('Mission', 'Mission'))} ${i + 1}${i === ms.length - 1 ? ` · ${esc(L('reward', 'Belohnung'))}` : ''}</div>
      <div class="card-title mt" style="margin-top:8px">${esc(m.missionType || m.type || '')}</div>
      <div class="card-sub">${icon('pin')} ${esc(m.node || '')}</div>
      ${m.modifier ? `<div class="callout gold mt" style="margin-bottom:0;padding:10px 12px">${icon('alert')}<div><strong>${esc(m.modifier)}</strong>${m.modifierDescription ? `<p class="small muted">${esc(m.modifierDescription)}</p>` : ''}</div></div>` : ''}
    </div>`).join('')}</div>
    <div class="callout mt">${icon('trophy')}<div><p><strong>${esc(INFO.reward)}</strong></p><p class="small muted">${esc(INFO.req)}</p></div></div>`;
  if (isArchon) renderArchimedea(d);
}

function renderArchimedea(d) {
  const el = $('archimedea');
  const list = d.archimedeas || [];
  if (!el) return;
  el.hidden = !list.length;
  el.innerHTML = list.length ? `<div class="section-head"><h2>${icon('shield')}${esc(L('Archimedea this week', 'Archimedea diese Woche'))}</h2></div>
    <div class="grid-auto lg">${list.map(a => `<div class="card">
      <div class="card-lbl">${esc(/lab/i.test(a.typeKey || a.type) ? 'Deep Archimedea' : /hex/i.test(a.typeKey || a.type) ? 'Temporal Archimedea' : (a.type || 'Archimedea'))}</div>
      <div class="mission-list">${(a.missions || []).map((m, i) => `<div class="mission"><span class="mission-n">${i + 1}</span><div class="grow">
        <div class="mission-t">${esc(m.missionType || '')} <span class="dim">· ${esc(m.faction || '')}</span></div>
        ${m.deviation?.name ? `<div class="mission-m">${esc(m.deviation.name)}</div>` : ''}
        ${(m.risks || []).length ? `<div class="tags" style="margin-top:4px">${m.risks.map(r => `<span class="chip${r.isHard ? ' bad' : ''}" title="${esc(r.description || '')}">${esc(r.name || '')}</span>`).join('')}</div>` : ''}</div></div>`).join('')}</div>
      ${(a.personalModifiers || []).length ? `<div class="card-lbl mt">${esc(L('Personal modifiers', 'Persönliche Modifikatoren'))}</div><div class="tags" style="margin-top:6px">${a.personalModifiers.map(p => `<span class="chip" title="${esc(p.description || '')}">${esc(p.name || '')}</span>`).join('')}</div>` : ''}
    </div>`).join('')}</div>` : '';
}

TH.page({ id: isArchon ? 'archon' : 'sortie', ws: true, render, fail(e) { $('main-card').innerHTML = ui.error(e); } });
})();
