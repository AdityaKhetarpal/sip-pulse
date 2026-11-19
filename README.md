# SIP Pulse

**When the Nifty 50 falls, do Indian mutual fund inflows keep coming or dry up?**

Live site: **[sip-pulse.vercel.app](https://sip-pulse.vercel.app)**

91 months of AMFI data (April 2019 to October 2026) set against the Nifty 50, with a test locked **before** any data was
downloaded: [design](input/ideas/sip-pulse-design.md) · [plan](input/ideas/sip-pulse-plan.md) · [change log](knowledge/_meta/log.md).

## Results

| | |
|---|---|
| Months analysed | 91 (April 2019 to October 2026), 7 "fall months" where the Nifty 50 fell 5% or more |
| Equity inflows in fall months | Positive in **7 of 7**: at least ₹8,113 crore went in, even in March 2020 (Nifty −23.3%) |
| H1: equity inflows drop the month after a fall | **Not supported.** Median −13.9% vs +3.0% in other months, but the 90% bootstrap range (−31.2% to +8.5%) includes zero |
| H2: SIPs don't drop the month after a fall | **Rejected.** A small, consistent dip: −1.0% vs +1.6% (90% range −4.7% to −0.9%), about ₹310 crore |
| Found after the test (exploratory) | Equity inflows **rose in the fall month itself** in 6 of 7 falls; Spearman ρ = −0.40 (p < 0.001) between Nifty return and change in inflows in the same month |
| SIP contributions | ₹8,238 crore (April 2019) → ₹32,160 crore (October 2026) a month |
| Data checks | 741 run, 0 failed (section subtotals, grand totals, published figures, a 68-month inflow streak matching AMFI) |

## How it works

```
AMFI monthly reports (91 Excel files) ─┐
AMFI SIP table (HTML)                  ├─► 01 acquire ─► 02 read & check ─► 03 SQL (DuckDB) ─► 04 locked test ─► 05 export ─► website
Nifty 50 month-end closes (Yahoo)      ┘
```

| Notebook | What it does |
|---|---|
| [01_acquire](notebooks/01_acquire.ipynb) | Downloads AMFI's 91 monthly reports, the SIP table and Nifty 50 closes (run in GitHub Actions) |
| [02_extract](notebooks/02_extract.ipynb) | Reads every report by header text (layouts changed over the years) and runs 741 checks |
| [03_sql](notebooks/03_sql.ipynb) | Loads each table into `data`, writes it to DuckDB and builds the monthly view in SQL |
| [04_analysis](notebooks/04_analysis.ipynb) | The pre-registered test: medians, 10,000-sample bootstrap ranges, Spearman correlation, rupee robustness check |
| [05_export](notebooks/05_export.ipynb) | Writes the small JSON files the website reads |

Website: a static Next.js export on Vercel. The home page is plain HTML built on the taste-skill kit by `web/scripts/build-home.mjs` from the exported data (custom SVG charts, the SIP line draws itself once); the inner pages are Next.js.
Design decisions: [DESIGN.md](DESIGN.md) · copy: [docs/copy.md](docs/copy.md).

## Run it

```bash
pip install -r requirements.txt
python scripts/run_notebooks.py 01 02 03 04 05     # 01 needs internet access to amfiindia.com and Yahoo Finance
cd web && npm install && npm run build && npx serve out   # npm run home rebuilds only the home page
```

## Data

- [AMFI monthly reports](https://www.amfiindia.com/research-information/amfi-monthly) and [AMFI SIP data](https://www.amfiindia.com/mutual-fund),
  used for research and education and credited on every chart. Raw files are in `data/raw/`; see [data/SOURCES.md](data/SOURCES.md).
- Nifty 50: Yahoo Finance `^NSEI`, close on the last trading day of each month (price index, not total return).

## Limits

- Only 7 fall months, so ranges are wide; that's why H1 can't be confirmed.
- Correlation isn't cause: bonuses, tax deadlines and fund launches also move flows.
- SIP money also goes to hybrid and index funds, so SIP and equity inflows aren't directly comparable.
- Industry totals only. Analysis for education, not investment advice. Not affiliated with AMFI or NSE.
