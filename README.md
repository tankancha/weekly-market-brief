# Weekly Market Brief

A self-hosted, static reading page for the weekly impact-ranked market-news digest, with a
browsable historical archive (Year ▸ Month ▸ Week). Published via **GitHub Pages** from `docs/`.

**Live:** https://tankancha.github.io/weekly-market-brief/

## Architecture

- **One repo, two roles.** This repo holds **both** the generating skill
  (`.claude/skills/market-news-analyst/`) and the published site (`docs/`).
- **Weekly cloud routine** (Claude.com, Sundays 18:00 Asia/Bangkok): runs the
  `market-news-analyst` skill, collects the past 7 days of market-moving news via
  WebSearch, writes the report as Markdown, updates the manifest, and `git push`es.
  GitHub Pages auto-redeploys.
- **Static client render.** `docs/index.html` + `docs/app.js` fetch `docs/data/index.json`,
  build the archive tree, and render the selected report's Markdown (marked + DOMPurify)
  in a reading pane. No server, no build step.

## Layout

```
docs/
├── index.html              # sidebar + reading pane shell
├── styles.css              # light document reading theme
├── app.js                  # manifest → tree → markdown render; #id deep-links
├── .nojekyll               # REQUIRED — serve .md raw, don't let Jekyll process it
├── robots.txt
└── data/
    ├── index.json          # manifest of all reports (newest-first)
    └── reports/YYYY/weekly-market-news-MMDDYYYY.md
```

## Manifest (`docs/data/index.json`)

```jsonc
{ "schema": 1, "site": "Weekly Market Brief", "updated": "<ISO>",
  "reports": [ {
    "id": "2026-06-28",                       // = generation date; deep-link key (#2026-06-28)
    "generated": "2026-06-28",
    "coverageStart": "2026-06-22", "coverageEnd": "2026-06-28",
    "weekOfLabel": "Week of Jun 22–28, 2026",
    "year": 2026, "month": 6,
    "title": "Weekly Market News — 06/28/2026",
    "path": "reports/2026/weekly-market-news-06282026.md",   // relative to docs/data/
    "brief": {                                  // powers the 1-minute "cockpit" view
      "headline": "<1–2 sentence plain-text takeaway>",
      "regime":   { "tone": "risk-on|risk-off|mixed", "label": "…", "evidence": "…" },
      "stats":    [ { "label": "S&P 500", "value": "+0.9%", "dir": "up|down|flat" } ],  // 4–6
      "events":   [ { "rank": 1, "title": "…", "score": 31.5, "assets": "Energy·Eq·FX", "reaction": "…", "detail": "…" } ],  // up to 5
      "catalysts":[ "Name · timing" ],          // 1–4
      "risks":    [ { "label": "…", "prob": "25%", "impact": "Severe" } ]  // 0–3, optional
    }
  } ] }
```

The weekly routine **upserts by `id`** (replace-if-exists, else append), sorts newest-first,
and bumps `updated` — it never overwrites unrelated entries.

## Notion (deprecated)

Earlier digests were published as Notion sub-pages under a "Weekly Market News" parent.
That path is retired; the webpage is now the sole deliverable. Pre-migration reports were
backfilled into `docs/data/reports/`.

## Local preview

`fetch()` needs http(s), so serve the folder (don't open `index.html` via `file://`):

```bash
cd docs && python -m http.server 8000   # → http://localhost:8000/
```
