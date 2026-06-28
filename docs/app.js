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
        html += `<li class="week"><a href="#${r.id}" data-id="${r.id}"` +
                (r.summary ? ` title="${escapeAttr(r.summary)}"` : '') +
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
  els.meta.textContent = formatMeta(entry);

  const md = await fetchText('./data/' + entry.path);
  if (md == null) {
    els.title.textContent = entry.title || 'Report';
    els.report.innerHTML = '<p class="error-state">This report could not be loaded (' +
      escapeHtml(entry.path) + '). It may not have been published yet.</p>';
    return;
  }

  const html = DOMPurify.sanitize(marked.parse(md));
  els.report.innerHTML = html;
  wrapTables();

  // Use the document H1 as the header title, then strip it from the body to avoid duplication.
  const h1 = els.report.querySelector('h1');
  els.title.textContent = (h1 && h1.textContent.trim()) || entry.title || 'Report';
  if (h1) h1.remove();

  document.title = (entry.title || 'Weekly Market Brief') + ' · Weekly Market Brief';
  els.report.scrollIntoView({ block: 'start' });
  els.report.parentElement.scrollTop = 0;
  window.scrollTo(0, 0);
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
