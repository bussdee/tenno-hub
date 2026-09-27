/* ═══════════════════════════════════════════════════════════════
   TENNO.HUB, lich.js  (new feature v4)
   Kuva Lich & Sister of Parvos Tracker
   All data stored locally in localStorage – no API needed.
═══════════════════════════════════════════════════════════════ */

/* ── Static data ── */
const KUVA_WEAPONS = [
  'Kuva Ayanga','Kuva Bramma','Kuva Brakk','Kuva Chakkhurr',
  'Kuva Drakgoon','Kuva Grattler','Kuva Hek','Kuva Hind',
  'Kuva Karak','Kuva Kohm',
  'Kuva Nukor','Kuva Ogris','Kuva Quartakk','Kuva Shildeg',
  'Kuva Sobek','Kuva Tonkor','Kuva Twin Stubbas',
  'Kuva Zarr','Kuva Zylok',
].sort();
const TENET_WEAPONS = [
  'Tenet Agendus','Tenet Arca Plasmor','Tenet Cycron','Tenet Detron',
  'Tenet Diplos','Tenet Envoy','Tenet Flux Rifle','Tenet Glaxion',
  'Tenet Grigori','Tenet Livia','Tenet Plinx','Tenet Quanta',
  'Tenet Quartakk','Tenet Spirex','Tenet Tetra','Tenet Thesis',
].sort();
const ELEMENTS = [
  'Heat','Cold','Electricity','Toxin',
  'Radiation','Magnetic','Viral','Corrosive',
  'Blast','Gas',
];
const REQUIEM_MODS = [
  'Ris','Fass','Vome','Netra','Khra','Jahu','Lohk','Oull',
].sort();
const LICH_FACTIONS = [
  { id:'lich',   en:'Kuva Lich',          de:'Kuva-Lich',          color:'#ff4040' },
  { id:'sister', en:'Sister of Parvos',   de:'Schwester des Parvos',color:'#ff80e0' },
];

/* ── Storage ── */
const STORAGE_KEY = 'th_liches';
let _liches = [];
function _save()  { localStorage.setItem(STORAGE_KEY, JSON.stringify(_liches)); }
function _load()  {
  try { _liches = JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }
  catch(e) { _liches = []; }
}

/* ── Render ── */
function initLich() {
  _load();
  renderLichList();
  renderLichForm();
}

function renderLichList() {
  const el = document.getElementById('lichListContainer');
  if (!el) return;
  if (!_liches.length) {
    el.innerHTML = `<div class="empty-state">${APP.lang==='de'?'Noch kein Lich oder Schwester erstellt. Nutze das Formular unten!':'No Lich or Sister tracked yet. Use the form below!'}</div>`;
    return;
  }
  el.innerHTML = _liches.map((l,i) => lichCardHTML(l, i)).join('');
}

function lichCardHTML(l, idx) {
  const faction = LICH_FACTIONS.find(f => f.id === l.type) || LICH_FACTIONS[0];
  const seq     = l.requiems || [null, null, null]; /* 3 requiem slots */
  const slotHTML = seq.map((mod, si) => {
    const opts = REQUIEM_MODS.map(m => `<option value="${m}" ${m===mod?'selected':''}>${m}</option>`).join('');
    const status = l.verified?.[si];
    return `<div class="requiem-slot ${status||'unknown'}">
      <div class="req-pos">${si+1}</div>
      <select class="req-select" onchange="setRequiem(${idx},${si},this.value)">
        <option value="">— ${APP.lang==='de'?'unbekannt':'unknown'} —</option>
        ${opts}
      </select>
      <div class="req-status-btns">
        <button class="req-verify-btn ${status==='correct'?'on':''}"
                onclick="setVerified(${idx},${si},'correct')" title="${APP.lang==='de'?'Korrekt':'Correct'}">✓</button>
        <button class="req-verify-btn wrong ${status==='wrong'?'on':''}"
                onclick="setVerified(${idx},${si},'wrong')" title="${APP.lang==='de'?'Falsch':'Wrong'}">✕</button>
      </div>
    </div>`;
  }).join('');
  const thrall = l.thralls||0;
  const isComplete = seq.every(m => m) && l.verified?.every(v => v==='correct');
  return `<div class="lich-card ${l.type} ${isComplete?'lich-complete':''}">
    <div class="lich-card-head">
      <div>
        <div class="lich-type-badge" style="color:${faction.color}">
          ${APP.lang==='de'?faction.de:faction.en}
        </div>
        <div class="lich-name">${l.name||APP.lang==='de'?'Unbenannt':'Unnamed'}</div>
      </div>
      <div class="lich-card-actions">
        <button class="lich-delete-btn" onclick="confirmDeleteLich(${idx})" title="${APP.lang==='de'?'Löschen':'Delete'}">🗑</button>
      </div>
    </div>
    <div class="lich-info-row">
      <div class="lich-info-chip">
        <div class="lich-chip-label">${APP.lang==='de'?'Waffe':'Weapon'}</div>
        <div class="lich-chip-val">${l.weapon||'—'}</div>
      </div>
      <div class="lich-info-chip">
        <div class="lich-chip-label">${APP.lang==='de'?'Element':'Element'}</div>
        <div class="lich-chip-val">${l.element||'—'}</div>
      </div>
      <div class="lich-info-chip">
        <div class="lich-chip-label">${APP.lang==='de'?'Valenz-Bonus':'Valence Bonus'}</div>
        <div class="lich-chip-val">${l.bonus||'?'}%</div>
      </div>
    </div>
    <div class="lich-section-label">${APP.lang==='de'?'REQUIEM-SEQUENZ':'REQUIEM SEQUENCE'}</div>
    <div class="requiem-slots">${slotHTML}</div>
    ${isComplete
      ? `<div class="lich-complete-banner">✓ ${APP.lang==='de'?'Sequenz vollständig! Jetzt besiegen oder verschmelzen!':'Sequence complete! Ready to vanquish or convert!'}</div>`
      : ''}
    <div class="lich-thrall-row">
      <span class="lich-thrall-label">${APP.lang==='de'?'Thralls besiegt:':'Thralls defeated:'}</span>
      <button class="thrall-btn minus" onclick="changeThrall(${idx},-1)">−</button>
      <span class="thrall-count" id="thrall-${idx}">${thrall}</span>
      <button class="thrall-btn" onclick="changeThrall(${idx},+1)">+</button>
      <span class="thrall-hint">/10 ${APP.lang==='de'?'für Requiem-Hinweis':'for Requiem hint'}</span>
    </div>
    ${l.notes ? `<div class="lich-notes-display">📝 ${l.notes}</div>` : ''}
  </div>`;
}

function setRequiem(lichIdx, slot, mod) {
  if (!_liches[lichIdx]) return;
  if (!_liches[lichIdx].requiems) _liches[lichIdx].requiems = [null,null,null];
  _liches[lichIdx].requiems[slot] = mod || null;
  _save();
  renderLichList();
}
function setVerified(lichIdx, slot, status) {
  if (!_liches[lichIdx]) return;
  if (!_liches[lichIdx].verified) _liches[lichIdx].verified = [null,null,null];
  _liches[lichIdx].verified[slot] = status;
  _save();
  renderLichList();
}
function changeThrall(lichIdx, delta) {
  if (!_liches[lichIdx]) return;
  _liches[lichIdx].thralls = Math.max(0, (_liches[lichIdx].thralls||0) + delta);
  _save();
  const el = document.getElementById(`thrall-${lichIdx}`);
  if (el) el.textContent = _liches[lichIdx].thralls;
}
function confirmDeleteLich(idx) {
  const name = _liches[idx]?.name || 'this entry';
  if (!confirm(APP.lang==='de'?`${name} wirklich löschen?`:`Delete "${name}"?`)) return;
  _liches.splice(idx, 1);
  _save();
  renderLichList();
}

/* ── Add form ── */
function renderLichForm() {
  const el = document.getElementById('lichFormContainer');
  if (!el) return;
  const factionOpts = LICH_FACTIONS.map(f =>
    `<option value="${f.id}">${APP.lang==='de'?f.de:f.en}</option>`).join('');
  el.innerHTML = `
    <div class="lich-form">
      <div class="lich-form-title">➕ ${APP.lang==='de'?'Lich / Schwester hinzufügen':'Add Lich / Sister'}</div>
      <div class="lich-form-grid">
        <div class="lich-form-group">
          <label>${APP.lang==='de'?'Typ':'Type'}</label>
          <select id="lfType">${factionOpts}</select>
        </div>
        <div class="lich-form-group">
          <label>${APP.lang==='de'?'Name (optional)':'Name (optional)'}</label>
          <input id="lfName" type="text" placeholder="${APP.lang==='de'?'Lich-Name...':'Lich name...'}" class="lich-form-input">
        </div>
        <div class="lich-form-group">
          <label>${APP.lang==='de'?'Waffe':'Weapon'}</label>
          <select id="lfWeapon">
            <option value="">— ${APP.lang==='de'?'wählen':'select'} —</option>
            <optgroup label="Kuva Weapons">
              ${KUVA_WEAPONS.map(w=>`<option value="${w}">${w}</option>`).join('')}
            </optgroup>
            <optgroup label="Tenet Weapons">
              ${TENET_WEAPONS.map(w=>`<option value="${w}">${w}</option>`).join('')}
            </optgroup>
          </select>
        </div>
        <div class="lich-form-group">
          <label>${APP.lang==='de'?'Element':'Element'}</label>
          <select id="lfElement">
            <option value="">— ${APP.lang==='de'?'wählen':'select'} —</option>
            ${ELEMENTS.map(e=>`<option value="${e}">${e}</option>`).join('')}
          </select>
        </div>
        <div class="lich-form-group">
          <label>${APP.lang==='de'?'Valenz-Bonus (%)':'Valence Bonus (%)'}</label>
          <input id="lfBonus" type="number" min="25" max="60" step="0.1"
                 placeholder="z.B. 52.3" class="lich-form-input">
        </div>
        <div class="lich-form-group">
          <label>${APP.lang==='de'?'Notizen (optional)':'Notes (optional)'}</label>
          <input id="lfNotes" type="text" placeholder="${APP.lang==='de'?'Eigene Notizen...':'Own notes...'}" class="lich-form-input">
        </div>
      </div>
      <button class="lich-add-btn" onclick="addLich()">
        ➕ ${APP.lang==='de'?'Hinzufügen':'Add'}
      </button>
    </div>
    <div class="lich-guide">
      <div class="lich-guide-title">📖 ${APP.lang==='de'?'Kurzanleitung':'Quick Guide'}</div>
      <div class="lich-guide-steps">
        <div class="lich-guide-step"><span>1</span>${APP.lang==='de'
          ?'Töte einen Larvling (auf einem Lich-Node) um einen Lich zu erschaffen. Die erschienene Waffe ist seine Waffe.'
          :'Kill a Larvling (on a Lich node) to create a Lich. The weapon shown is its weapon.'}</div>
        <div class="lich-guide-step"><span>2</span>${APP.lang==='de'
          ?'Besiege Thralls in Lich-kontrollierten Missionen um Requiem-Hinweise zu erhalten. 10 Thralls = 1 vollständiger Hinweis.'
          :'Defeat Thralls in Lich-controlled missions to get Requiem hints. 10 Thralls = 1 full hint.'}</div>
        <div class="lich-guide-step"><span>3</span>${APP.lang==='de'
          ?'Trage die 3 Requiem-Mods in deiner Parazon in der richtigen Reihenfolge. Probiere bis du die richtige Sequenz gefunden hast.'
          :'Equip the 3 Requiem Mods in your Parazon in the correct order. Test until you find the right sequence.'}</div>
        <div class="lich-guide-step"><span>4</span>${APP.lang==='de'
          ?'Töte den Lich 3× mit der korrekten Sequenz dann erscheint er im letzten Knoten. Vernichte (Waffe) oder konvertiere (Begleiter).'
          :'Kill the Lich 3× with the correct sequence, then face it at the final node. Vanquish (get weapon) or Convert (become ally).'}</div>
      </div>
    </div>`;
}

function addLich() {
  const type    = document.getElementById('lfType')?.value;
  const name    = document.getElementById('lfName')?.value?.trim();
  const weapon  = document.getElementById('lfWeapon')?.value;
  const element = document.getElementById('lfElement')?.value;
  const bonus   = parseFloat(document.getElementById('lfBonus')?.value || '0');
  const notes   = document.getElementById('lfNotes')?.value?.trim();
  _liches.push({
    type    : type || 'lich',
    name    : name || null,
    weapon  : weapon || null,
    element : element || null,
    bonus   : bonus || null,
    notes   : notes || null,
    requiems: [null, null, null],
    verified: [null, null, null],
    thralls : 0,
    created : Date.now(),
  });
  _save();
  renderLichList();
  /* Reset form fields */
  ['lfName','lfBonus','lfNotes'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
  toast(APP.lang==='de' ? '✓ Lich hinzugefügt!' : '✓ Lich added!');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
