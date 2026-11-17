# %% [markdown]
# # 03 · Put the tables in DuckDB and build the monthly view in SQL
# Each table is loaded into `data`, written to DuckDB, then joined in SQL.

# %%
from pathlib import Path
import pandas as pd
import duckdb

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
OUT = ROOT / "data"
con = duckdb.connect(str(OUT / "sip_pulse.duckdb"))   # small local SQL database (not committed; rebuilt each run)

# %% [markdown]
# ### Load equity flows

# %%
data = pd.read_parquet(OUT / "equity.parquet").reset_index()           # one row per month
con.execute("CREATE OR REPLACE TABLE equity AS SELECT * FROM data")
data.head(3)

# %% [markdown]
# ### Load SIP contributions

# %%
data = pd.read_parquet(OUT / "sip.parquet").reset_index()
con.execute("CREATE OR REPLACE TABLE sip AS SELECT * FROM data")
data.tail(3)

# %% [markdown]
# ### Load Nifty 50 month-end closes

# %%
data = pd.read_csv(OUT / "raw" / "nifty" / "nifty50_monthly.csv", dtype={"month": str})
con.execute("CREATE OR REPLACE TABLE nifty AS SELECT month, nifty_close FROM data")
data.tail(3)

# %% [markdown]
# ### Load groups and equity categories

# %%
data = pd.read_parquet(OUT / "groups.parquet")
con.execute("CREATE OR REPLACE TABLE groups AS SELECT * FROM data")
data = pd.read_parquet(OUT / "equity_categories.parquet")
con.execute("CREATE OR REPLACE TABLE equity_categories AS SELECT * FROM data")
print("loaded")

# %% [markdown]
# ### The monthly view
# One row per month with equity inflow, SIP contribution and the Nifty, plus:
# - `nifty_return_pct`: Nifty change from the previous month-end
# - `equity_change_pct`: change in equity inflow from last month, divided by the **size** of last month's inflow
#   (equity inflows were negative in 2020; dividing by a negative number would flip the sign)
# - `equity_change_cr` and `sip_change_cr`: the same changes in rupees (crore)
# - `sip_share_pct`: SIP contribution as a share of equity net inflow. SIP money also goes into hybrid and index funds,
#   so this is a rough guide, not an exact split

# %%
con.execute("""
CREATE OR REPLACE VIEW monthly AS
WITH joined AS (
    SELECT n.month,
           n.nifty_close,
           e.equity_inflow_cr,
           e.equity_aum_cr,
           s.sip_cr
    FROM nifty n
    LEFT JOIN equity e USING (month)
    LEFT JOIN sip s USING (month)
)
SELECT month,
       nifty_close,
       100 * (nifty_close / LAG(nifty_close) OVER w - 1)                                  AS nifty_return_pct,
       equity_inflow_cr,
       equity_inflow_cr - LAG(equity_inflow_cr) OVER w                                    AS equity_change_cr,
       100 * (equity_inflow_cr - LAG(equity_inflow_cr) OVER w) / ABS(LAG(equity_inflow_cr) OVER w) AS equity_change_pct,
       sip_cr,
       sip_cr - LAG(sip_cr) OVER w                                                        AS sip_change_cr,
       100 * (sip_cr / LAG(sip_cr) OVER w - 1)                                            AS sip_change_pct,
       100 * sip_cr / NULLIF(equity_inflow_cr, 0)                                         AS sip_share_pct,
       equity_aum_cr
FROM joined
WINDOW w AS (ORDER BY month)
ORDER BY month
""")
data = con.execute("SELECT * FROM monthly WHERE month >= '2019-04'").df()
print(len(data), "months")
data.tail()

# %% [markdown]
# ### Months when equity funds saw net outflows
# These are the months where a percentage change is least meaningful, so we list them.

# %%
data = con.execute("SELECT month, equity_inflow_cr, nifty_return_pct FROM monthly WHERE equity_inflow_cr < 0 ORDER BY month").df()
data

# %% [markdown]
# ### Equity category mix by month

# %%
con.execute("""
CREATE OR REPLACE VIEW category_mix AS
SELECT month, category, net_inflow_cr,
       100 * net_inflow_cr / SUM(net_inflow_cr) OVER (PARTITION BY month) AS share_pct
FROM equity_categories
ORDER BY month, category
""")
data = con.execute("""
SELECT category, ROUND(SUM(net_inflow_cr)) AS total_inflow_cr
FROM category_mix
GROUP BY category
ORDER BY total_inflow_cr DESC
""").df()
data

# %%
con.execute("SELECT * FROM monthly").df().to_parquet(OUT / "monthly.parquet", index=False)
con.close()
print("saved data/monthly.parquet")
