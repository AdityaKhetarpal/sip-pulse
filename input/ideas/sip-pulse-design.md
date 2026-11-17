---
title: "When the Nifty 50 falls, do Indian mutual fund inflows keep coming or dry up?"
type: design
created: 2026-11-17
updated: 2026-11-17
tags: [fintech, india, mutual-funds, sip, time-series]
status: approved
author: mixed
---

# SIP Pulse: do mutual fund flows follow the market?

## Research question
When the Nifty 50 falls in a month, do SIP contributions and equity mutual fund net inflows fall in that month
or the next one?

- **Positive result:** after months with a fall of 5% or more, equity net inflows drop noticeably (we measure how much),
  while SIP contributions hold steady. This would show that lump-sum money follows the market and SIP money does not.
- **Null result:** flows move with the market no more than chance would suggest. This would support the
  "SIP discipline" story. It is just as worth publishing.

## Why now (short)
- October 2026: equity inflows fell 13.87% month on month to Rs 32,994 crore, yet it was the 68th month in a row of inflows.
  SIP contributions were Rs 32,160 crore (+8.9% year on year) from 10.00 crore contributing SIP accounts.
- News reports describe each month on its own. Few people check across many months whether flows actually react to market falls.

## Method
1. **Get the data:** download the AMFI Monthly Notes (PDF), one per month.
2. **Extract:** pull the flow tables out of the PDFs (pdfplumber), one row per month and category.
3. **Check:** each month's extracted totals must match the headline numbers in the same note. Where two notes overlap on a month,
   both must give the same value; we use the latest note.
4. **Store and query:** load into DuckDB and compute monthly changes, year-on-year changes and categories in SQL.
5. **Analyse:**
   - Correlation of flows with the Nifty 50 return in the same month and the month before.
   - "Event windows": flows in the 3 months after each month with a fall of 5% or more, compared with the other months.
   - With only about 2 years of months, every result carries a confidence range and a sample-size warning.
6. **Website:** export small JSON files to a Next.js site on Vercel built with GSAP, Vanta and Lenis.
   The homepage answers the main question with one number and one chart.

Rejected alternatives: forecasting flows (too few months for an honest forecast); fund-level analysis (out of scope).

## Data sources
- **AMFI Monthly Note** (amfiindia.com → Research & Information → AMFI Monthly). Each note covers 6–7 months of flows by
  category, SIP contributions, SIP accounts, SIP assets and folios. Notes found online go back to January 2025, so the
  flow history runs from about mid-2024 to October 2026 (roughly 28 months).
- **Nifty 50 monthly closes:** NSE index history, or Yahoo Finance `^NSEI` as a fallback. `^NSEI` is a price index,
  not the total-return index AMFI's chart uses; the site will say which one we use.
- Every source gets its URL, download date and terms written down in `data/SOURCES.md`.

## Build style
Notebooks in Google Colab, given cell by cell in the chat: `###` text cells, small cells, the DataFrame named `data`,
inline comments. Aditya runs each cell. The repo (`sip-pulse`) holds the notebooks, data and website. Commits are in
Aditya's name only.

Notebooks: 01 acquire · 02 extract and check · 03 SQL in DuckDB · 04 analysis · 05 export for the website.

## Output
- ☑ GitHub repo + live website on Vercel
- ☑ Substack write-up with the numbers
- ☐ Phase 2: an "Ask the AMFI notes" assistant (RAG with checked citations), only after the dashboard is live

## Expected results / measured numbers for the CV
Months covered; flow reaction after market falls (in Rs crore and %); correlation with confidence range;
the share of equity inflow that comes through SIPs; extraction accuracy (share of months that pass the check in step 3).

## Risks
- **PDF table extraction errors:** guarded by the total check in step 3; any month that fails is fixed by hand and logged.
- **Few market falls in about 28 months:** results may be weak. We say so plainly rather than overclaim.
- **Correlation is not cause:** the site says "moves with", never "caused by".
- **Not investment advice:** this goes in the footer. We never recommend funds.
- **AMFI's terms of use:** we check them and credit AMFI on every chart.
- **Note formats change over time:** older notes may lay out tables differently. The extractor handles each layout,
  or that month is entered by hand and logged.

## Feasibility
About 1–2 weeks. Free tools only: Colab, DuckDB, pandas, pdfplumber, Next.js on Vercel Hobby. No API keys.

## Not investigated
Individual fund performance or recommendations; predicting markets; investor demographics; state-wise data;
SIP stoppage ratios (the notes don't report new or stopped SIPs); the RAG assistant (phase 2).

## Skills used along the way
- brainstorming-research (this doc)
- fintech checklist (data, SQL, export, deploy rules)
- Website stage: design-council (direction), then design-critique, design-review and ux-copy (every page, before deploy)
- Bright Data: skipped, since AMFI PDFs download directly
- rag-pipeline: phase 2

## Next step
After approval → writing-research-plan → notebook 01, cell by cell.
