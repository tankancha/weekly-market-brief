---
name: market-news-analyst
description: This skill should be used when analyzing recent market-moving news events and their impact on equity markets and commodities. Use this skill when the user requests analysis of major financial news from the past 10 days, wants to understand market reactions to monetary policy decisions (FOMC, ECB, BOJ), needs assessment of geopolitical events' impact on commodities, or requires comprehensive review of earnings announcements from mega-cap stocks. The skill automatically collects news using WebSearch/WebFetch tools, produces impact-ranked analysis, and publishes the report as Markdown to the public "weekly-market-brief" GitHub Pages site (committing the report file and updating the archive manifest). All analysis thinking and output are conducted in English.
---

# Market News Analyst

## Overview

This skill enables comprehensive analysis of market-moving news events from the past 10 days, focusing on their impact on US equity markets and commodities. The skill automatically collects news from trusted sources using WebSearch and WebFetch tools, evaluates market impact magnitude, analyzes actual market reactions, produces a structured English report, and publishes it by committing a Markdown file to the public `weekly-market-brief` repo's `docs/data/reports/` and updating the archive manifest. GitHub Pages renders it at the live site.

## Prerequisites

- **Tools:** WebSearch and WebFetch for news collection; `git` (the routine runs with the public `weekly-market-brief` repo attached, push access) for publishing
- **API Keys:** None required
- **Environment:** Designed for remote execution in Claude Code routines, operating on the attached repo's working tree

## Output

This skill produces a single deliverable: a structured Markdown report committed to the public `weekly-market-brief` repo at `docs/data/reports/YYYY/weekly-market-news-MMDDYYYY.md` (generation date in the filename), with a new entry upserted into `docs/data/index.json`. GitHub Pages auto-redeploys; the report is then live at `https://tankancha.github.io/weekly-market-brief/#YYYY-MM-DD`. No Notion page is created.

## When to Use This Skill

Use this skill when:
- User requests analysis of recent major market news (past 10 days)
- User wants to understand market reactions to specific events (FOMC decisions, earnings, geopolitical)
- User needs comprehensive market news summary with impact assessment
- User asks about correlations between news events and commodity price movements
- User requests analysis of how central bank policy announcements affected markets

Example user requests:
- "Analyze the major market news from the past 10 days"
- "How did the latest FOMC decision impact the market?"
- "What were the most important market-moving events this week?"
- "Analyze recent geopolitical news and commodity price reactions"
- "Review mega-cap tech earnings and their market impact"

## Analysis Workflow

Follow this structured 7-step workflow when analyzing market news:

### Step 1: News Collection via WebSearch/WebFetch

**Objective:** Gather comprehensive news from the past 10 days covering major market-moving events.

**Search Strategy:**

Execute parallel WebSearch queries covering different news categories:

**Monetary Policy:**
- Search: "FOMC meeting past 10 days", "Federal Reserve interest rate", "ECB policy decision", "Bank of Japan"
- Target: Central bank decisions, forward guidance changes, inflation commentary

**Inflation/Economic Data:**
- Search: "CPI inflation report [current month]", "jobs report NFP", "GDP data", "PPI producer prices"
- Target: Major economic data releases and surprises

**Mega-Cap Earnings:**
- Search: "Apple earnings [current quarter]", "Microsoft earnings", "NVIDIA earnings", "Amazon earnings", "Tesla earnings", "Meta earnings", "Google earnings"
- Target: Results, guidance, market reactions for largest companies

**Geopolitical Events:**
- Search: "Middle East conflict oil prices", "Ukraine war", "US China tensions", "trade war tariffs"
- Target: Conflicts, sanctions, trade disputes affecting markets

**Commodity Markets:**
- Search: "oil prices news past week", "gold prices", "OPEC meeting", "natural gas prices", "copper prices"
- Target: Supply disruptions, demand shifts, price movements

**Corporate News:**
- Search: "major M&A announcement", "bank earnings", "tech sector news", "bankruptcy", "credit rating downgrade"
- Target: Large corporate events beyond mega-caps

**Recommended News Sources (Priority Order):**
1. Official sources: FederalReserve.gov, SEC.gov (EDGAR), Treasury.gov, BLS.gov
2. Tier 1 financial news: Bloomberg, Reuters, Wall Street Journal, Financial Times
3. Specialized: CNBC (real-time), MarketWatch (summaries), S&P Global Platts (commodities)

**Search Execution:**
- Use WebSearch for broad topic searches
- Use WebFetch for specific URLs from official sources or major news outlets
- Collect publication dates to ensure news is within 10-day window
- Capture: Event date, source, headline, key details, market context (pre-market, trading hours, after-hours)

**Filtering Criteria:**
- Focus on Tier 1 market-moving events (see references/market_event_patterns.md)
- Prioritize news with clear market impact (price moves, volume spikes)
- Exclude: Stock-specific small-cap news, minor product updates, routine filings

Think in English throughout collection process. Document each significant news item with:
- Date and time
- Event type (monetary policy, earnings, geopolitical, etc.)
- Source reliability tier
- Initial market reaction (if observable)

### Step 2: Load Knowledge Base References

**Objective:** Access domain expertise to inform impact assessment.

Load relevant reference files based on collected news types:

**Always Load:**
- `references/market_event_patterns.md` - Comprehensive patterns for all major event types
- `references/trusted_news_sources.md` - Source credibility assessment

**Conditionally Load (Based on News Collected):**

If **monetary policy news** found:
- Focus on: market_event_patterns.md → Central Bank Monetary Policy Events section
- Key frameworks: Interest rate hike/cut reactions, QE/QT impacts, hawkish/dovish tone

If **geopolitical events** found:
- Load: `references/geopolitical_commodity_correlations.md`
- Focus on: Energy Commodities, Precious Metals, regional frameworks matching event

If **mega-cap earnings** found:
- Load: `references/corporate_news_impact.md`
- Focus on: Specific company sections, sector contagion patterns

If **commodity news** found:
- Load: `references/geopolitical_commodity_correlations.md`
- Focus on: Specific commodity sections (Oil, Gold, Copper, etc.)

**Knowledge Integration:**
Compare collected news against historical patterns to:
- Predict expected market reactions
- Identify anomalies (market reacted differently than historical pattern)
- Assess whether reaction was typical magnitude or outsized
- Determine if contagion occurred as expected

### Step 3: Impact Magnitude Assessment

**Objective:** Rank each news event by market impact significance.

**Impact Assessment Framework:**

For each news item, evaluate across three dimensions:

**1. Asset Price Impact (Primary Factor):**

Measure actual or estimated price movements:

**Equity Markets:**
- Index-level: S&P 500, Nasdaq 100, Dow Jones
  - Severe: ±2%+ in day
  - Major: ±1-2%
  - Moderate: ±0.5-1%
  - Minor: ±0.2-0.5%
  - Negligible: <0.2%

- Sector-level: Specific sector ETFs
  - Severe: ±5%+
  - Major: ±3-5%
  - Moderate: ±1-3%
  - Minor: <1%

- Stock-specific: Individual mega-caps
  - Severe: ±10%+ (and index weight causes index move)
  - Major: ±5-10%
  - Moderate: ±2-5%

**Commodity Markets:**
- Oil (WTI/Brent):
  - Severe: ±5%+
  - Major: ±3-5%
  - Moderate: ±1-3%

- Gold:
  - Severe: ±3%+
  - Major: ±1.5-3%
  - Moderate: ±0.5-1.5%

- Base Metals (Copper, etc.):
  - Severe: ±4%+
  - Major: ±2-4%
  - Moderate: ±1-2%

**Bond Markets:**
- 10-Year Treasury Yield:
  - Severe: ±20bps+ in day
  - Major: ±10-20bps
  - Moderate: ±5-10bps

**Currency Markets:**
- USD Index (DXY):
  - Severe: ±1.5%+
  - Major: ±0.75-1.5%
  - Moderate: ±0.3-0.75%

**2. Breadth of Impact (Multiplier):**

Assess how many markets/sectors affected:

- **Systemic (3x multiplier):** Multiple asset classes, global markets
- **Cross-Asset (2x multiplier):** Equities + commodities, or equities + bonds
- **Sector-Wide (1.5x multiplier):** Entire sector or related sectors
- **Stock-Specific (1x multiplier):** Single company (unless mega-cap with index impact)

**3. Forward-Looking Significance (Modifier):**

- **Regime Change (+50%):** Fundamental market structure shift
- **Trend Confirmation (+25%):** Reinforces existing trajectory
- **Isolated Event (0%):** One-off with limited forward signal
- **Contrary Signal (-25%):** Contradicts prevailing narrative

**Impact Score Calculation:**

```
Impact Score = (Price Impact Score × Breadth Multiplier) × (1 + Forward-Looking Modifier)

Price Impact Score:
- Severe: 10 points
- Major: 7 points
- Moderate: 4 points
- Minor: 2 points
- Negligible: 1 point
```

**Ranking:** After scoring all news items, rank from highest to lowest impact score. This determines report ordering.

### Step 4: Market Reaction Analysis

**Objective:** Analyze how markets actually responded to each event.

For each significant news item (Impact Score >5), conduct detailed reaction analysis:

**Immediate Reaction (Intraday):** Direction, magnitude, timing, volatility (VIX, bid-ask spreads).

**Multi-Asset Response:**
- **Equities:** Index performance, sector rotation, mega-cap moves, growth/value and size divergences
- **Fixed Income:** Treasury yields (2Y/10Y/30Y), curve shape, credit spreads (IG/HY), TIPS breakevens
- **Commodities:** Energy (WTI, Brent, NatGas), precious metals (Gold, Silver), base metals (Cu, Al), agricultural (if relevant)
- **Currencies:** DXY, major pairs, EM currencies, safe havens (JPY, CHF)
- **Derivatives:** VIX, put/call ratios, unusual options activity, futures positioning

**Pattern Comparison:** Classify reaction vs expected historical pattern as **Consistent / Amplified / Dampened / Inverse**. Investigate drivers behind amplification or dampening (positioning, priced-in factors, "good news is bad news" dynamics).

**Anomaly Identification:** Flag reactions that deviate from expected patterns — markets shrugging off major news, outsized reactions to minor news, correlation breakdowns in safe havens.

### Step 5: Correlation and Causation Assessment

**Objective:** Distinguish direct impacts from coincidental timing.

**Multi-Event Analysis:**
- **Reinforcing Events:** Same directional impact → amplified combined move (non-linear)
- **Offsetting Events:** Opposite impacts → identify dominant factor
- **Sequential Events:** Path-dependent reactions (cumulative effects)
- **Coincidental Timing:** Acknowledge attribution uncertainty

**Geopolitical-Commodity Correlations:** For geopolitical events, map conflict/sanction → supply disruption risk; assess actual vs feared supply impact; duration of shock; safe-haven flows; China demand factor for industrial metals.

**Transmission Mechanisms:**
- **Direct:** News → immediate asset price reaction
- **Indirect:** News → economic impact → asset prices (e.g., rate hike → mortgage rates → housing → homebuilder stocks)
- **Sentiment:** News → risk appetite shift → broad asset reallocation
- **Feedback Loops:** Initial reaction creates secondary effects (margin calls, forced selling)

### Step 6: Report Generation

**Objective:** Produce a structured English Markdown report with exactly six top-level sections, ranked by market impact.

**Required Report Structure (strict — do not add or remove top-level sections):**

```markdown
# Weekly Market News — [MM/DD/YYYY]

## Executive Summary

[3-4 sentences covering:]
- Period analyzed (specific dates)
- Number of significant events identified
- Dominant market theme/regime (risk-on/risk-off, sector rotation)
- Top 1-2 highest-impact events

## Market Impact Rankings

| Rank | Event | Date | Impact Score | Asset Classes Affected | Market Reaction |
|------|-------|------|--------------|------------------------|-----------------|
| 1 | [Event] | [Date] | [Score] | [Equities, Commodities, etc.] | [Brief reaction] |
| 2 | ... | ... | ... | ... | ... |

## Detailed Event Analysis

[For each event in rank order, provide comprehensive analysis using the template below.]

### [Rank]. [Event Name] (Impact Score: [X])

**Event Date:** [Date, Time]
**Event Type:** [Monetary Policy / Earnings / Geopolitical / Economic Data / Corporate]
**News Source:** [Source, with credibility tier]

#### Event Summary
[3-4 sentences: what happened, key details, context/surprise factor, forward guidance]

#### Market Reaction

**Immediate (Day-of):**
- **Equities:** S&P 500 [+/-X%], Nasdaq [+/-X%], sector rotation
- **Bonds:** 10Y yield [change], credit spreads
- **Commodities:** Oil [+/-X%], Gold [+/-X%], Copper [+/-X%] (if relevant)
- **Currencies:** USD [+/-X%], other relevant pairs
- **Volatility:** VIX [level/change]

**Follow-Through:** [Sustained, reversed, or consolidated]

**Pattern Comparison:** Expected vs Actual [Consistent / Amplified / Dampened / Inverse] with explanation.

#### Impact Assessment Detail

**Price Impact:** [Severe/Major/Moderate/Minor] — [justification]
**Breadth:** [Systemic/Cross-Asset/Sector/Stock-Specific] — [affected markets]
**Forward Significance:** [Regime Change/Trend Confirmation/Isolated/Contrary] — [rationale]
**Calculated Score:** ([Price Score] × [Breadth Multiplier]) × [Forward Modifier] = [Total]

#### Sector-Specific Impacts
[Which sectors/industries were most affected and why]

#### Commodity Correlation *(include only for geopolitical or commodity-driven events)*
[Commodity affected, price movement, supply/demand mechanism, historical precedent, expected duration]

[Repeat for each ranked event]

## Thematic Synthesis

### Dominant Market Narrative
[Overarching theme across the 10-day period]

### Interconnected Events
[How events related or compounded — reinforcing, offsetting, sequential]

### Market Regime Assessment
**Risk Appetite:** [Risk-On / Risk-Off / Mixed]
**Evidence:** [Sector performance, safe haven flows, credit spreads, VIX]
**Sector Rotation:** [Growth vs Value, Cyclicals vs Defensives, leaders and laggards]

### Commodity Deep Dive *(integrate here rather than a separate section)*
- **Energy:** WTI/Brent level and % change, key drivers, OPEC/inventory/geopolitics
- **Precious Metals:** Gold/Silver moves, safe-haven flows vs real-rate dynamics
- **Base Metals:** Copper as economic barometer, China demand factor
- **Agricultural:** (if relevant — grains, Ukraine, weather)

### Anomalies and Surprises
[Events where market reaction deviated significantly from expectation]

## Forward-Looking Implications

### Market Positioning Insights
[Trend continuation/reversal signals, valuation indications, sentiment extremes]

### Upcoming Catalysts
[Events on horizon: next FOMC, earnings season, geopolitical milestones]

### Risk Scenarios
1. **[Risk Name]:** Description, probability, potential impact
2. **[Risk Name]:** ...
3. [Continue for 3-5 key risks]

## Data Sources & Methodology

### News Sources Consulted
- **Official:** [e.g., FederalReserve.gov, SEC.gov]
- **Tier 1 Financial News:** [e.g., Bloomberg, Reuters, WSJ]
- **Specialized:** [e.g., S&P Global Platts]

### Analysis Period
- **Start Date:** [YYYY-MM-DD]
- **End Date:** [YYYY-MM-DD]
- **Total Days:** 10

### Knowledge Base References
- `market_event_patterns.md`, `geopolitical_commodity_correlations.md`, `corporate_news_impact.md`, `trusted_news_sources.md`

---

*Analysis Date: [YYYY-MM-DD] | Language: English*
```

**Report Quality Standards:**
- Objective, fact-based analysis (no speculation beyond probability-weighted scenarios)
- Quantify price movements with specific percentages
- Cite sources for major claims
- Distinguish between correlation and causation
- Acknowledge uncertainty when attributing market moves to specific news
- Use proper financial terminology; consistent English throughout

### Step 7: Publish to the Site Repo

**Objective:** Commit the finalized report as a Markdown file to the public `weekly-market-brief` repo and upsert its entry into the archive manifest, so GitHub Pages renders it at the live site. **Do NOT call any Notion tools.**

All dates use the report generation date in Asia/Bangkok. Let `YYYY`, `MM`, `DD` be that date; `id` = `YYYY-MM-DD`.

**Procedure:**

1. **Pull first.** Run `git pull --rebase origin main` so you start from the latest committed manifest.

2. **Write the report file** to `docs/data/reports/<YYYY>/weekly-market-news-<MMDDYYYY>.md` (create the `<YYYY>` folder if absent). The body is exactly the 6-section Markdown produced in Step 6, beginning with the H1 `# Weekly Market News — MM/DD/YYYY`. Save as UTF-8 (no BOM).

3. **Upsert the manifest** `docs/data/index.json`:
   - Read it. If missing or unparseable, start from `{ "schema": 1, "site": "Weekly Market Brief", "updated": "", "reports": [] }`.
   - Build the new entry:
     ```jsonc
     {
       "id": "<YYYY-MM-DD>",
       "generated": "<YYYY-MM-DD>",
       "coverageStart": "<YYYY-MM-DD of 7 days before, i.e. generated minus 6 days>",
       "coverageEnd": "<YYYY-MM-DD = generated>",
       "weekOfLabel": "Week of <Mon D>–<D, YYYY>",   // span months if needed, e.g. "Week of Jun 29 – Jul 5, 2026"; use an en-dash "–"
       "year": <YYYY as int>,
       "month": <MM as int 1-12>,
       "title": "Weekly Market News — MM/DD/YYYY",
       "path": "reports/<YYYY>/weekly-market-news-<MMDDYYYY>.md",   // relative to docs/data/
       "summary": "<~160-char plain-text snippet from the Executive Summary>"
     }
     ```
   - **Upsert by `id`:** if an entry with the same `id` already exists, replace it in place; otherwise append. (A re-run on the same day must not duplicate.)
   - Sort `reports` by `generated` **descending** (newest first). **Never reorder or drop unrelated entries.**
   - Set the top-level `updated` to the current ISO-8601 timestamp with the Asia/Bangkok offset.
   - Write the file back as 2-space-indented JSON.

4. **Commit and push:**
   ```
   git add docs/data/
   git commit -m "report: <YYYY-MM-DD>"
   git pull --rebase origin main || true
   git push origin main
   ```
   Do not add `git config user.*` — the routine environment provides the identity. GitHub Pages auto-redeploys on push.

5. **Return** the deep-link URL `https://tankancha.github.io/weekly-market-brief/#<YYYY-MM-DD>`. If the push fails, retry once; if it still fails, surface the error with the full report Markdown so it can be committed manually.

## Key Analysis Principles

1. **Impact Over Noise** — focus on truly market-moving events
2. **Multi-Asset Perspective** — equities, bonds, commodities, currencies
3. **Pattern Recognition** — compare against historical precedents, note unique aspects
4. **Causation Discipline** — rigorous attribution, not coincidental timing
5. **Forward-Looking** — implications, not just backward-looking description
6. **Objectivity** — separate what happened from what "should" happen
7. **Quantification** — specific numbers (%, bps), not vague terms
8. **Source Credibility** — weight official and Tier 1 sources heavily
9. **Breadth Analysis** — individual stock moves significant only if mega-cap/systemic
10. **English Consistency** — all thinking and output in English

## Common Pitfalls to Avoid

- **Over-Attribution:** not every market move is news-driven (flows, technicals, rebalancing)
- **Recency Bias:** latest news isn't always most important — rank by impact, not date
- **Hindsight Bias:** distinguish "obvious in retrospect" from "surprising at the time"
- **Single-Factor Analysis:** markets respond to multiple factors simultaneously
- **Ignoring Magnitude:** quantify the surprise factor (0.1% vs 0.5% CPI miss are different)

## Resources

### references/

**market_event_patterns.md** — Central bank events, inflation/employment/GDP data, geopolitical events, earnings, credit events, commodity-specific events, recession indicators, historical case studies, sentiment analysis framework.

**geopolitical_commodity_correlations.md** — Energy, precious metals, base metals, agricultural, rare earths; regional geopolitical frameworks (Middle East, Russia-Europe, Asia-Pacific, Latin America); correlation summary tables.

**corporate_news_impact.md** — Magnificent 7, financial mega-caps, healthcare, energy, consumer staples, industrials; earnings frameworks, product launches, M&A, regulatory impacts, sector contagion patterns.

**trusted_news_sources.md** — Tier 1-4 source classification, credibility framework, speed vs accuracy trade-offs, recommended search strategies, red-flag sources.

## Important Notes

- All analysis thinking and output in English
- News collection via WebSearch and WebFetch only
- Rank events by impact score (price impact × breadth × forward significance)
- Target analysis period: past 10 days from current date
- Primary subjects: US equity markets and commodities; central bank policy highest priority
- Distinguish correlation vs causation rigorously; quantify all reactions with specific percentages
- **Sole deliverable:** a committed Markdown report at `docs/data/reports/YYYY/weekly-market-news-MMDDYYYY.md` plus an upserted entry in `docs/data/index.json`, in the public `weekly-market-brief` repo. No Notion. No PDF.
- Designed for remote execution (Claude Code routines) operating on the attached repo's working tree

