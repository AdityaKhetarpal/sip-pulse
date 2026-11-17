---
title: "SIP Pulse: do mutual fund flows follow the market?"
type: plan
created: 2026-11-17
updated: 2026-11-17  # sample changed before any data was seen, see knowledge/_meta/log.md
status: pre-registered
author: mixed
design: "[[sip-pulse-design]]"
---

# SIP Pulse: research plan

**Research question:** when the Nifty 50 falls in a month, do SIP contributions and equity mutual fund net inflows fall in that month
or the next one?

**Hypothesis (pre-registered 2026-11-17, locked):**
- **H1 (equity flows follow the market):** in the month after a "fall month", equity net inflows are lower than in the other months.
- **H2 (SIPs don't):** SIP contributions in the month after a fall month are not lower than in the other months.

**Definitions (fixed now, before we see the data):**
- **Fall month:** a month in which the Nifty 50 closes 5% or more below the previous month's close.
  - If the sample has fewer than 3 fall months, a fall month instead means a month in the lowest quarter of monthly returns.
    Any result from this backup rule is labelled *exploratory*.
- **Equity net inflows:** the open-ended "Equity Schemes" subtotal net inflow in AMFI's monthly report, in Rs crore.
  (For example, October 2026 = 32,993.64.)
- **SIP contributions:** the month-wise SIP contribution table on amfiindia.com/mutual-fund, in Rs crore.
- **"Lower":** we compare the median month-on-month % change after fall months with the median for all other months.
  The difference gets a 90% bootstrap range (10,000 resamples, seed 42).

**What would disprove it:**
- **H1 is rejected** if the difference is zero or positive, or if its 90% range includes zero.
- **H2 is rejected** if SIP contributions after fall months are lower and the 90% range is entirely below zero.
- **Supporting check:** the Spearman correlation between the Nifty return in month t−1 and the change in equity inflows in month t.
  We report it with its p-value, but it doesn't decide H1 or H2 by itself.

**When data collection stops:**
- Every month from April 2019 to October 2026 (91 months). The window starts at April 2019, the first month with an Excel
  report, after SEBI's 2018 scheme recategorisation, so the categories are consistent.
- November 2026 (out around 10 December) is a held-back check. It is reported separately and never added to the main test.

**Method:** read AMFI's monthly report Excel files and its SIP table, and check that each month's subtotal plus the other categories equals the Grand Total. Then store them in DuckDB,
compute changes in SQL, and run the comparison and correlation in pandas and scipy.

**Output:** GitHub repo + Vercel website + Substack write-up. **Language:** English.

---

## Data sources
- AMFI monthly report Excel, April 2019 to October 2026: `https://portal.amfiindia.com/spages/am<mon><yyyy>repo.xls`
  (for example `amoct2026repo.xls`). *To download in Colab.* Any month whose link differs gets logged and its PDF is used instead.
- AMFI SIP contribution table, April 2016 to October 2026: https://www.amfiindia.com/mutual-fund. *To read in Colab.*
- Used only to cross-check: the AMFI Monthly Note for October 2026 (equity Rs 32,994 crore; SIP Rs 32,160 crore).
- Nifty 50 monthly closes: NSE index history, or Yahoo Finance `^NSEI` as a fallback. *To download in Colab.*
- `data/SOURCES.md`: the URL, download date and terms note for each source.

## Tasks (Colab notebooks, cell by cell in the chat)

### Task 1: Get the data (`notebooks/01_acquire.ipynb`)
- [ ] Set up Colab and the folders (`data/raw/amfi/`, `data/raw/nifty/`)
- [ ] Make the list of monthly report URLs, April 2019 to October 2026 (91)
- [ ] Download the Excel files, skipping files already there; log any that fail
- [ ] Save the SIP table page → `data/raw/amfi/sip_page.html`
- [ ] Download the Nifty 50 monthly closes → `data/raw/nifty/nifty50_monthly.csv`
- [ ] Write `data/SOURCES.md`

### Task 2: Extract and check (`notebooks/02_extract.ipynb`)
- [ ] Open one Excel report and find the rows we need (Equity Schemes subtotal, sub-categories, Grand Total)
- [ ] Read every month → `data` (month, category, net_inflow_cr, aum_cr)
- [ ] Read the SIP table → `data` (month, sip_contribution_cr)
- [ ] Check that each month's categories add up to the Grand Total, and October 2026 matches the Monthly Note; any failure is fixed by hand and logged in `data/extraction_log.csv`
- [ ] Save `data/flows.parquet` and `data/sip.parquet`

### Task 3: SQL in DuckDB (`notebooks/03_sql.ipynb`)
- [ ] Load flows, SIP and Nifty into `data/sip_pulse.duckdb`
- [ ] View `monthly`: one row per month with equity_inflow, sip_contribution, nifty_close and nifty_return
- [ ] Add month-on-month and year-on-year changes, and the SIP share of equity inflow
- [ ] View `category_mix`: inflow by sub-category per month

### Task 4: Test the hypothesis (`notebooks/04_analysis.ipynb`)
- [ ] Mark the fall months using the fixed definition (or the backup rule, labelled exploratory)
- [ ] Test H1: median difference plus the 90% bootstrap range
- [ ] Test H2: the same for SIP contributions
- [ ] Spearman correlation (t−1 and t)
- [ ] Write a verdict for each hypothesis: confirmed / rejected / inconclusive
- [ ] Save `data/results.json`

### Task 5: Export (`notebooks/05_export.ipynb`)
- [ ] Write `web/public/data/{overview,flows,categories,results}.json`
- [ ] Check every file is under 1 MB and that the numbers match `results.json`

### Task 6: Website (Next.js on Vercel)
- [ ] design-council session → one design direction (GSAP, Vanta, Lenis)
- [ ] Pages: Answer (homepage), Flows, Where the money goes, Method & limits
- [ ] ux-copy pass on every page
- [ ] design-critique and design-review (accessibility, phone, dark mode) → fix → screenshots
- [ ] Ask Aditya before deploying → Vercel project with root folder `web`

### Task 7: Write-up
- [ ] README: question, data, method, results with measured numbers, limits, live link
- [ ] 3 CV bullets with the real numbers
- [ ] Substack draft for Aditya to edit and publish

## Done when
- [ ] All 91 monthly reports (April 2019 to October 2026) are downloaded, or each failure is logged
- [ ] 100% of months pass the total check in Task 2, or are fixed by hand and logged
- [ ] H1 and H2 each have a written verdict with the numbers
- [ ] The site is live, readable on a phone in dark and light mode, with no sideways scrolling and every chart sourced
- [ ] All commits are in Aditya's name only

## Changes log
Any change to the definitions above after sign-off goes in `knowledge/_meta/log.md`, and the result is labelled exploratory.
