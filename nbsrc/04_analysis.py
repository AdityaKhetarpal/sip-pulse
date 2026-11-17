# %% [markdown]
# # 04 · Test the pre-registered hypotheses
# The hypotheses and tests were fixed on 17 November 2026, before any data was downloaded
# (see `input/ideas/sip-pulse-plan.md`). This notebook applies them exactly.
#
# - **H1:** in the month after a fall month, equity net inflows are lower than in other months.
# - **H2:** in the month after a fall month, SIP contributions are **not** lower than in other months.
# - **Fall month:** the Nifty 50 closes 5% or more below the previous month-end.

# %%
from pathlib import Path
import json
import numpy as np
import pandas as pd
from scipy import stats

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
OUT = ROOT / "data"
WINDOW = ("2019-04", "2026-10")   # the locked sample
data = pd.read_parquet(OUT / "monthly.parquet")
data = data[(data["month"] >= WINDOW[0]) & (data["month"] <= WINDOW[1])].reset_index(drop=True)
print(len(data), "months:", data["month"].min(), "to", data["month"].max())

# %% [markdown]
# ### Mark the fall months
# The pre-registered rule: a fall of 5% or more. If there were fewer than 3, a backup rule would apply (and be labelled exploratory).

# %%
data["fall"] = data["nifty_return_pct"] <= -5
falls = data[data["fall"]][["month", "nifty_return_pct", "equity_inflow_cr", "sip_cr"]]
RULE = "fell 5% or more" if len(falls) >= 3 else "lowest quarter of monthly returns (backup rule, exploratory)"
if len(falls) < 3:
    data["fall"] = data["nifty_return_pct"] <= data["nifty_return_pct"].quantile(0.25)
print(len(falls), "fall months · rule:", RULE)
falls

# %% [markdown]
# ### Mark the month after each fall
# The test looks at the change from the fall month to the next month. A fall in the last month of the window has no "next month" inside it.

# %%
data["after_fall"] = data["fall"].shift(1, fill_value=False)       # true for the month right after a fall month
usable = data.dropna(subset=["equity_change_pct", "sip_change_pct"])   # April 2019 has no previous month in the reports
after, other = usable[usable["after_fall"]], usable[~usable["after_fall"]]
print(len(after), "months after a fall ·", len(other), "other months")
after[["month", "nifty_return_pct", "equity_inflow_cr", "equity_change_pct", "sip_change_pct"]]

# %% [markdown]
# ### The test: difference in medians with a 90% bootstrap range
# We take the median change in the months after a fall, minus the median change in the other months.
# To see how sure we can be, we resample each group 10,000 times (seed 42) and keep the middle 90% of the differences.

# %%
def median_gap(a, b, n=10_000, seed=42):
    rng = np.random.default_rng(seed)
    a, b = np.asarray(a, float), np.asarray(b, float)
    gap = np.median(a) - np.median(b)
    sims = np.median(rng.choice(a, (n, len(a))), axis=1) - np.median(rng.choice(b, (n, len(b))), axis=1)
    low, high = np.percentile(sims, [5, 95])
    return {"after_fall_median": float(np.median(a)), "other_median": float(np.median(b)),
            "gap": float(gap), "low": float(low), "high": float(high), "n_after": len(a), "n_other": len(b)}

h1 = median_gap(after["equity_change_pct"], other["equity_change_pct"])
h2 = median_gap(after["sip_change_pct"], other["sip_change_pct"])
pd.DataFrame({"H1 equity inflow change (%)": h1, "H2 SIP change (%)": h2}).round(2)

# %% [markdown]
# ### The verdicts, by the rules fixed in advance
# - **H1 is supported** only if the gap is below zero **and** the whole 90% range is below zero. Otherwise it is rejected.
# - **H2 is rejected** only if the gap is below zero and the whole 90% range is below zero. Otherwise it is supported.

# %%
h1["verdict"] = "supported" if (h1["gap"] < 0 and h1["high"] < 0) else "rejected"
h2["verdict"] = "rejected" if (h2["gap"] < 0 and h2["high"] < 0) else "supported"
print("H1 (equity inflows fall after market falls):", h1["verdict"])
print("H2 (SIP contributions do not fall):", h2["verdict"])

# %% [markdown]
# ### Supporting check: rank correlation
# Spearman correlation between the Nifty return and the change in equity inflows, in the same month (t) and with the
# Nifty one month earlier (t−1). Reported for context; it does not decide H1 or H2.

# %%
def spearman(x, y):
    ok = x.notna() & y.notna()
    r, p = stats.spearmanr(x[ok], y[ok])
    return {"rho": float(r), "p": float(p), "n": int(ok.sum())}

corr = {
    "equity_same_month": spearman(data["nifty_return_pct"], data["equity_change_pct"]),
    "equity_next_month": spearman(data["nifty_return_pct"].shift(1), data["equity_change_pct"]),
    "sip_same_month": spearman(data["nifty_return_pct"], data["sip_change_pct"]),
    "sip_next_month": spearman(data["nifty_return_pct"].shift(1), data["sip_change_pct"]),
}
pd.DataFrame(corr).T.round(3)

# %% [markdown]
# ### Robustness: the same test in rupees
# Percentage changes are awkward when inflows were close to zero or negative (2020). So we repeat the test using the
# change in Rs crore. This is a robustness check; the verdicts above stand as pre-registered.

# %%
h1_rupees = median_gap(after["equity_change_cr"], other["equity_change_cr"])
h2_rupees = median_gap(after["sip_change_cr"], other["sip_change_cr"])
pd.DataFrame({"equity change (Rs cr)": h1_rupees, "SIP change (Rs cr)": h2_rupees}).round(0)

# %% [markdown]
# ### What happened after each fall
# For every fall month: the inflows one month before, in the fall month, and in the three months after.

# %%
full = pd.read_parquet(OUT / "monthly.parquet").set_index("month")
windows = []
for m in data.loc[data["fall"], "month"]:
    i = full.index.get_loc(m)
    for k in range(-1, 4):
        if 0 <= i + k < len(full):
            row = full.iloc[i + k]
            windows.append({"fall_month": m, "offset": k, "month": full.index[i + k],
                            "equity_inflow_cr": row["equity_inflow_cr"], "sip_cr": row["sip_cr"],
                            "nifty_return_pct": row["nifty_return_pct"]})
windows = pd.DataFrame(windows)
windows.pivot(index="fall_month", columns="offset", values="equity_inflow_cr").round(0)

# %% [markdown]
# ### Did SIP money keep coming? Count the months
# How many fall months were followed by a lower SIP contribution than the fall month itself?

# %%
w = windows.pivot(index="fall_month", columns="offset", values="sip_cr")
sip_kept = int((w[1] >= w[0]).sum()) if 1 in w else 0
print(f"SIP contribution the month after a fall was at least as high in {sip_kept} of {w[1].notna().sum()} cases")

# %% [markdown]
# ### Found after the test (exploratory): what happens in the fall month itself?
# Not part of the pre-registered test. The correlation above showed equity inflows *rise* when the Nifty falls in the
# same month. We count it directly, and label it exploratory everywhere it is shown.

# %%
same = usable[usable["fall"]]
rose = int((same["equity_change_cr"] > 0).sum())
dip_buying = median_gap(same["equity_change_pct"], usable[~usable["fall"]]["equity_change_pct"])
print(f"Equity inflows rose in the fall month itself in {rose} of {len(same)} fall months")
pd.Series(dip_buying).round(2)

# %% [markdown]
# ### Save the results

# %%
results = {
    "window": list(WINDOW), "months": int(len(data)), "rule": RULE,
    "fall_months": falls.assign(nifty_return_pct=falls["nifty_return_pct"].round(2)).to_dict("records"),
    "h1": h1, "h2": h2, "h1_rupees": h1_rupees, "h2_rupees": h2_rupees,
    "correlation": corr, "sip_held_after_fall": {"count": sip_kept, "of": int(w[1].notna().sum())},
    "pre_registered": "2026-11-17",
    "exploratory_fall_month": {"rose": rose, "of": int(len(same)), **dip_buying},
}
(OUT / "results.json").write_text(json.dumps(results, indent=2, default=str))
windows.to_parquet(OUT / "fall_windows.parquet", index=False)
print(json.dumps({k: results[k] for k in ("h1", "h2")}, indent=1))
