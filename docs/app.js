/* Weekly Market Brief — reads docs/data/index.json, builds the Year > Month > Week
 * archive tree, and renders the selected report's Markdown in the reading pane.
 * Cache-bust every fetch so the GitHub Pages CDN never serves a stale manifest/report. */

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const els = {
  archive: document.getElementById('archive'),
  report:  document.getElementById('report'),
  title:   document.getElementById('rhead-title'),
  eyebrow: document.getElementById('rhead-eyebrow'),
  meta:    document.getElementById('rhead-meta'),
  sidebar: document.getElementById('sidebar'),
  navToggle: document.getElementById('nav-toggle'),
  scrim:   document.getElementById('scrim'),
};

let REPORTS = [];   // newest-first
let BY_ID = {};

const mdCache = {};
const REGIME_CLASS = { 'risk-on': 'on', 'risk-off': 'off', 'mixed': 'mixed' };
const esc = escapeHtml;   // reuse the existing escaping implementation

/* ─── fetch helpers ──────────────────────────────────────── */

function bust(url) {
  const sep = url.includes('?') ? '&' : '?';
  return url + sep + 'v=' + Date.now();
}
async function fetchJSON(url) {
  try {
    const r = await fetch(bust(url), { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}
async function fetchText(url) {
  try {
    const r = await fetch(bust(url), { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.text();         // raw markdown source
  } catch (e) { return null; }
}

const CARET = '<svg class="caret" viewBox="0 0 12 12" fill="none"><path d="M4 2.5L7.5 6 4 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ─── archive tree ───────────────────────────────────────── */

function buildTree(reports) {
  if (!reports.length) {
    els.archive.innerHTML = '<div class="archive-empty">No reports yet.</div>';
    return;
  }
  // Group: year -> month -> [reports]
  const years = [];
  const yIdx = {}, mIdx = {};
  for (const r of reports) {                 // already newest-first
    if (!(r.year in yIdx)) { yIdx[r.year] = { year: r.year, months: [] }; years.push(yIdx[r.year]); }
    const yk = r.year, mk = r.year + '-' + r.month;
    if (!(mk in mIdx)) { mIdx[mk] = { month: r.month, items: [] }; yIdx[yk].months.push(mIdx[mk]); }
    mIdx[mk].items.push(r);
  }

  const newest = reports[0];
  let html = '';
  for (const y of years) {
    const yOpen = y.year === newest.year ? ' open' : '';
    html += `<details class="year"${yOpen}><summary>${CARET}<span>${y.year}</span></summary>`;
    for (const m of y.months) {
      const mOpen = (y.year === newest.year && m.month === newest.month) ? ' open' : '';
      html += `<details class="month"${mOpen}><summary>${CARET}<span>${MONTHS[m.month - 1]}</span>` +
              `<span class="month-count">${m.items.length}</span></summary><ul class="weeks">`;
      for (const r of m.items) {
        const tip = (r.brief && r.brief.headline) || '';
        html += `<li class="week"><a href="#${r.id}" data-id="${r.id}"` +
                (tip ? ` title="${escapeAttr(tip)}"` : '') +
                `>${escapeHtml(r.weekOfLabel || r.id)}</a></li>`;
      }
      html += `</ul></details>`;
    }
    html += `</details>`;
  }
  els.archive.innerHTML = html;
}

function setActive(id) {
  els.archive.querySelectorAll('a[aria-current]').forEach(a => a.removeAttribute('aria-current'));
  const a = els.archive.querySelector(`a[data-id="${cssEscape(id)}"]`);
  if (!a) return;
  a.setAttribute('aria-current', 'true');
  // Expand ancestor <details> so the active item is visible
  let el = a.parentElement;
  while (el && el !== els.archive) {
    if (el.tagName === 'DETAILS') el.open = true;
    el = el.parentElement;
  }
}

/* ─── report rendering ───────────────────────────────────── */

async function loadReport(id) {
  const entry = BY_ID[id];
  if (!entry) { showFirstReport(); return; }
  setActive(id);
  els.eyebrow.textContent = entry.weekOfLabel || 'Weekly Market Brief';
  els.title.textContent = entry.title || 'Report';
  els.meta.textContent = formatMeta(entry);
  document.title = (entry.title || 'Weekly Market Brief') + ' · Weekly Market Brief';

  const ck = document.getElementById('cockpit');
  const revealBtn = document.getElementById('revealBtn');
  const report = els.report;
  report.hidden = true; report.innerHTML = '';
  revealBtn.classList.remove('open');
  revealBtn.querySelector('.rl').textContent = 'Read full analysis';

  if (entry.brief) {
    ck.hidden = false; revealBtn.hidden = false;
    renderCockpit(ck, entry.brief);
  } else {
    ck.hidden = true; revealBtn.hidden = true;
    await revealFull(entry, report, revealBtn);
  }
  window.scrollTo(0, 0);
}

function renderCockpit(ck, b) {
  const tone = REGIME_CLASS[(b.regime && b.regime.tone) || 'mixed'] || 'mixed';
  const tiles = (b.stats || []).map(s =>
    `<div class="ck-tile"><div class="tl">${esc(s.label)}</div><div class="tv num ${s.dir==='up'?'up':s.dir==='down'?'down':''}">${esc(s.value)}</div></div>`).join('');
  const events = (b.events || []).map(e =>
    `<div class="ck-ev"><div class="ck-ev-head"><span class="ck-rank${e.rank===1?' r1':''}">${e.rank}</span>`+
    `<span class="ck-ev-title">${esc(e.title)}</span><span class="ck-ev-assets">${esc(e.assets||'')}</span>`+
    `<span class="ck-ev-score num">${esc(String(e.score))}</span><span class="ck-chev">▸</span></div>`+
    `<div class="ck-ev-detail"><div class="inner">${esc(e.detail||'')}`+
    (e.reaction?`<div class="ck-ev-reaction">${esc(e.reaction)}</div>`:'')+
    `</div></div></div>`).join('');
  const catalysts = (b.catalysts||[]).map(c=>`<span class="ck-chip">${esc(c)}</span>`).join('');
  const risks = (b.risks||[]).map(r=>`<span class="rb">${esc(r.label)} · <span class="num">${esc(r.prob)}</span> · ${esc(r.impact)}</span>`).join('');
  const reg = b.regime || {};
  ck.innerHTML =
    `<div class="ck-top"><div class="ck-headline">${esc(b.headline||'')}</div>`+
    `<div class="ck-regime ${tone}"><div class="rl">Regime</div><div class="rv">${esc(reg.label||'—')}</div></div></div>`+
    (tiles?`<div class="ck-tiles">${tiles}</div>`:'')+
    (events?`<div class="ck-seclabel">Top ${b.events.length} impact-ranked events</div>${events}`:'')+
    (catalysts?`<div class="ck-fwd"><span class="lbl">Watch next</span>${catalysts}</div>`:'')+
    (risks?`<div class="ck-risk"><span class="lbl">Key risk</span>${risks}</div>`:'');
  ck.querySelectorAll('.ck-ev').forEach(ev =>
    ev.querySelector('.ck-ev-head').addEventListener('click', () => ev.classList.toggle('open')));
  animateTiles(ck);
}

function animateTiles(scope){
  scope.querySelectorAll('.ck-tile .tv').forEach(el=>{
    const raw=el.textContent.trim();
    // Only animate clean single values (e.g. "+0.9%", "−6.8%", "$77"); leave
    // ranges ("−2.64% → +1.75%"), suffixes ("4.2% YoY") and "~"-prefixed values static.
    const m=/^([+\-−]?)\$?(\d+(?:\.\d+)?)(%?)$/.exec(raw);
    if(!m)return;
    const sign=m[1], numStr=m[2], unit=m[3], target=parseFloat(numStr), hasDollar=raw.includes('$');
    const dec=(numStr.split('.')[1]||'').length;     // preserve original precision
    let i=0; const steps=24;
    const t=setInterval(()=>{ i++;
      if(i>=steps){ clearInterval(t); el.textContent=raw; return; }   // settle to the exact original
      el.textContent=sign+(hasDollar?'$':'')+(target*i/steps).toFixed(dec)+unit;
    },14);
  });
}
async function revealFull(entry, report, btn){
  let html = mdCache[entry.id];
  if(!html){
    const md = await fetchText('./data/' + entry.path);
    if(md==null){ report.hidden=false; report.innerHTML='<p class="error-state">This report could not be loaded.</p>'; return; }
    let body = md.replace(/^#\s+.*\n/,'');                 // drop the H1 (already in the header)
    html = DOMPurify.sanitize(marked.parse(body));
    mdCache[entry.id]=html;
  }
  report.innerHTML=html; report.hidden=false; wrapTables();
}

function wrapTables() {
  els.report.querySelectorAll('table').forEach(t => {
    if (t.parentElement && t.parentElement.classList.contains('table-wrap')) return;
    const w = document.createElement('div');
    w.className = 'table-wrap';
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });
}

function formatMeta(entry) {
  const bits = [];
  if (entry.generated) bits.push('Published ' + prettyDate(entry.generated));
  if (entry.coverageStart && entry.coverageEnd)
    bits.push('Covers ' + prettyDate(entry.coverageStart) + ' – ' + prettyDate(entry.coverageEnd));
  return bits.join('  ·  ');
}
function prettyDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return iso || '';
  return MONTHS[+m[2] - 1].slice(0, 3) + ' ' + (+m[3]) + ', ' + m[1];
}

function showFirstReport() {
  if (REPORTS.length) loadReport(REPORTS[0].id);
}

function showEmptyState() {
  els.eyebrow.textContent = 'Weekly Market Brief';
  els.title.textContent = 'Weekly Market Brief';
  els.meta.textContent = '';
  document.getElementById('cockpit').hidden = true;
  document.getElementById('revealBtn').hidden = true;
  els.report.hidden = false;
  els.report.innerHTML =
    '<div class="empty-hero"><h2>No reports published yet</h2>' +
    '<p>The first brief lands Sunday evening (18:00 Asia/Bangkok). ' +
    'Past digests will appear in the archive on the left.</p></div>';
}

/* ─── small escape utils ─────────────────────────────────── */

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
function cssEscape(s) {
  return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&');
}

/* ─── routing ────────────────────────────────────────────── */

function currentHashId() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')).trim();
  return h && BY_ID[h] ? h : null;
}
function onHashChange() {
  const id = currentHashId();
  if (id) loadReport(id);
  else showFirstReport();
  closeDrawer();
}

/* ─── mobile drawer ──────────────────────────────────────── */

function openDrawer()  { document.body.classList.add('nav-open');  els.scrim.hidden = false; els.navToggle?.setAttribute('aria-expanded','true'); }
function closeDrawer() { document.body.classList.remove('nav-open'); els.scrim.hidden = true;  els.navToggle?.setAttribute('aria-expanded','false'); }

/* ─── init ───────────────────────────────────────────────── */

(async () => {
  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: false });
    // Disable GFM strikethrough: these reports use "~" for "approximately"
    // (e.g. ~$80, ~33%), which single-tilde strikethrough would wrongly strike out.
    marked.use({ tokenizer: { del() { return undefined; } } });
  }

  els.navToggle?.addEventListener('click', () =>
    document.body.classList.contains('nav-open') ? closeDrawer() : openDrawer());
  els.scrim?.addEventListener('click', closeDrawer);
  // Close the drawer when a week is tapped (link still updates the hash).
  els.archive.addEventListener('click', e => { if (e.target.closest('a[data-id]')) closeDrawer(); });

  document.getElementById('revealBtn').addEventListener('click', async function(){
    const id = currentHashId() || (REPORTS[0] && REPORTS[0].id);
    const entry = BY_ID[id]; if(!entry) return;
    const opening = els.report.hidden;
    if(opening){ await revealFull(entry, els.report, this); this.classList.add('open'); this.querySelector('.rl').textContent='Hide full analysis'; }
    else { els.report.hidden=true; this.classList.remove('open'); this.querySelector('.rl').textContent='Read full analysis'; }
  });

  const manifest = await fetchJSON('./data/index.json');
  if (!manifest || !Array.isArray(manifest.reports) || !manifest.reports.length) {
    buildTree([]);
    showEmptyState();
    return;
  }

  REPORTS = manifest.reports.slice().sort((a, b) => (a.generated < b.generated ? 1 : -1)); // newest-first
  BY_ID = {};
  REPORTS.forEach(r => { BY_ID[r.id] = r; });

  buildTree(REPORTS);
  window.addEventListener('hashchange', onHashChange);

  const id = currentHashId();
  loadReport(id || REPORTS[0].id);
})();
