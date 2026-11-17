# %% [markdown]
# # 05 · Export small JSON files for the website
# The website reads only these files. Every number on it comes from notebooks 02–04.

# %%
from pathlib import Path
import json
import pandas as pd

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
OUT = ROOT / "data"
WEB = ROOT / "web" / "public" / "data"
WEB.mkdir(parents=True, exist_ok=True)
results = json.loads((OUT / "results.json").read_text())
W0, W1 = results["window"]

def save(name, obj):
    path = WEB / f"{name}.json"
    path.write_text(json.dumps(obj, separators=(",", ":"), default=float))
    print(f"{name}.json  {path.stat().st_size / 1024:.1f} KB")

def r(x, d=0):
    return None if pd.isna(x) else round(float(x), d)

# %% [markdown]
# ### Monthly series
# One row per month: Nifty close and return, equity inflow, SIP contribution, and whether it was a fall month.

# %%
data = pd.read_parquet(OUT / "monthly.parquet")
data = data[(data["month"] >= W0)].reset_index(drop=True)
fall_months = {f["month"] for f in results["fall_months"]}
monthly = [{"month": m, "nifty": r(n, 0), "nifty_ret": r(nr, 2), "equity": r(e, 0), "sip": r(s, 0),
            "fall": m in fall_months, "in_test": W0 <= m <= W1}
           for m, n, nr, e, s in zip(data["month"], data["nifty_close"], data["nifty_return_pct"],
                                       data["equity_inflow_cr"], data["sip_cr"])]
save("monthly", monthly)
data.tail(3)

# %% [markdown]
# ### The months around each fall

# %%
data = pd.read_parquet(OUT / "fall_windows.parquet")
falls = []
for m, g in data.groupby("fall_month"):
    falls.append({"month": m, "nifty_ret": r(g.loc[g["offset"] == 0, "nifty_return_pct"].iloc[0], 2),
                  "rows": [{"offset": int(o), "month": mm, "equity": r(e, 0), "sip": r(s, 0)}
                           for o, mm, e, s in zip(g["offset"], g["month"], g["equity_inflow_cr"], g["sip_cr"])]})
save("falls", falls)

# %% [markdown]
# ### Where the money goes, by financial year (April to March)
# Equity categories and fund groups, summed per financial year so the chart stays readable.

# %%
def fy(month):
    y, m = int(month[:4]), int(month[5:7])
    start = y if m >= 4 else y - 1
    return f"FY{str(start + 1)[2:]}"            # April 2025 to March 2026 is FY26

data = pd.read_parquet(OUT / "equity_categories.parquet")
data = data[(data["month"] >= W0) & (data["month"] <= W1)]
data["fy"] = data["month"].map(fy)
cats = data.groupby(["fy", "category"])["net_inflow_cr"].sum().round(0).reset_index()
months_in_fy = data.groupby("fy")["month"].nunique().to_dict()

data = pd.read_parquet(OUT / "groups.parquet")
data = data[(data["month"] >= W0) & (data["month"] <= W1)]
data["fy"] = data["month"].map(fy)
groups = data.groupby(["fy", "group"])["net_inflow_cr"].sum().round(0).reset_index()

save("categories", {
    "months_in_fy": months_in_fy,
    "equity": cats.rename(columns={"net_inflow_cr": "inflow"}).to_dict("records"),
    "groups": groups.rename(columns={"net_inflow_cr": "inflow"}).to_dict("records"),
})
cats.pivot(index="category", columns="fy", values="net_inflow_cr")

# %% [markdown]
# ### Headline numbers and test results

# %%
m = pd.read_parquet(OUT / "monthly.parquet")
inside = m[(m["month"] >= W0) & (m["month"] <= W1)]
log = pd.read_csv(OUT / "extraction_log.csv")
latest = inside.iloc[-1]
overview = {
    "window": [W0, W1], "months": int(len(inside)),
    "latest": {"month": latest["month"], "equity": r(latest["equity_inflow_cr"]), "sip": r(latest["sip_cr"]),
               "nifty_ret": r(latest["nifty_return_pct"], 2)},
    "totals": {"equity": r(inside["equity_inflow_cr"].sum()), "sip": r(inside["sip_cr"].sum())},
    "outflow_months": int((inside["equity_inflow_cr"] < 0).sum()),
    "inflow_streak": int((inside["equity_inflow_cr"][::-1] > 0).cummin().sum()),   # months in a row of net inflows, up to the latest
    "sip_growth": {"from": r(inside["sip_cr"].iloc[0]), "to": r(inside["sip_cr"].iloc[-1])},
    "checks": {"run": int(log["checked"].sum()), "failed": int(log["failed"].sum())},
    "results": results,
}
save("overview", overview)
print(json.dumps({k: overview[k] for k in ("latest", "totals", "outflow_months", "inflow_streak", "sip_growth", "checks")}, indent=1))

# %% [markdown]
# ### Check: every file is small and matches the results

# %%
for f in sorted(WEB.glob("*.json")):
    assert f.stat().st_size < 1_000_000, f"{f.name} is too big"
check = json.loads((WEB / "overview.json").read_text())["results"]
assert check["h1"]["verdict"] == results["h1"]["verdict"] and check["h2"]["verdict"] == results["h2"]["verdict"]
print("all files under 1 MB; verdicts match results.json")
