# CLAUDE.md — weekly-market-brief

Operational notes for any agent (especially the weekly cloud routine) working in this repo.

## What this repo is
- A **public** repo holding both the `market-news-analyst` skill (`.claude/skills/…`) and the
  GitHub Pages site (`docs/`). The skill generates the report; the site renders it.
- Pages serves from `docs/` on `main`. Pushing to `main` redeploys.

## Publishing a weekly report (the routine's job)
1. `git pull --rebase origin main` first — start from the latest manifest.
2. Write the report to `docs/data/reports/<YYYY>/weekly-market-news-<MMDDYYYY>.md`
   (`<MMDDYYYY>` = generation date, Asia/Bangkok; create the year folder if absent).
   The body is the same 6-section Markdown, H1 `# Weekly Market News — MM/DD/YYYY`.
3. **Upsert** `docs/data/index.json`: read it (missing → `{schema,site,reports:[]}`), build the
   new entry (all manifest fields, incl. a computed `weekOfLabel` and a ~160-char `summary`),
   **replace any entry with the same `id`, else append**, sort `reports` by `generated`
   descending, bump `updated`. Write back as 2-space JSON. **Never reorder/drop other entries.**
4. `git add docs/data/ && git commit -m "report: <YYYY-MM-DD>" && git pull --rebase origin main || true && git push origin main`
5. Return the deep-link URL: `https://tankancha.github.io/weekly-market-brief/#<YYYY-MM-DD>`

## Gotchas (do not trip on these)
- **`.nojekyll` must stay** (root and `docs/`). Without it, GitHub Pages runs Jekyll, which
  processes `.md` files — then `fetch('….md').text()` returns HTML or 404 and reports break.
- The client fetches reports as **raw text** (`.text()`, not `.json()`) and **cache-busts**
  every request (`?v=Date.now()`); keep that — the CDN otherwise serves a stale manifest.
- The manifest write is **append/upsert + sort**, never a blind overwrite (that would erase history).
- Keep this repo **public** — free Pages + the routine's `git pull` both depend on it.
- Do **NOT** call any Notion tools. The publication target is the committed Markdown + `index.json`.
- Don't add `git config user.*` in the routine — the cloud env provides the identity.
