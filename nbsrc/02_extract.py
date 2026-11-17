# %% [markdown]
# # 02 · Read the AMFI reports and check them
# Turns 91 monthly Excel reports and AMFI's SIP table into two clean tables, and checks every number before we use it.

# %% [markdown]
# ### Find the project folder

# %%
from pathlib import Path
import pandas as pd

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()
RAW_AMFI = ROOT / "data" / "raw" / "amfi"
OUT = ROOT / "data"
pd.set_option("display.width", 160)

# %% [markdown]
# ### Look at one report first
# Each report lists every scheme category with its money in, money out, **net inflow** and **AUM** (assets under management).
# Section headers such as "II Equity Schemes" sit above their categories, and a "Sub Total" row closes each section.

# %%
data = pd.read_excel(RAW_AMFI / "amoct2026repo.xls", sheet_name=0, header=None)   # header=None: we find the header ourselves
data.iloc[22:40, :8]

# %% [markdown]
# ### Find the columns we need
# Column positions differ between older and newer reports, so we find them by their header text:
# the **net inflow** column and the **AUM at month end** column (not the monthly average AUM).

# %%
import re

def find_columns(sheet):
    for i, row in sheet.iterrows():
        text = [str(v).lower() for v in row.tolist()]
        net = [j for j, t in enumerate(text) if "net inflow" in t]
        if net:                                                    # this is the header row
            aum = [j for j, t in enumerate(text)
                   if ("net assets" in t or "aum as on" in t or "net aum" in t) and "average" not in t and "aaum" not in t]
            return i, net[0], aum[0]
    raise ValueError("header row not found")

find_columns(data)   # (header row, net inflow column, AUM column)

# %% [markdown]
# ### Read one report into rows
# We walk down the sheet and keep track of where we are:
# - **part**: A open-ended, B close-ended, C interval schemes
# - **section**: e.g. "Equity Schemes" (newer reports) or "Growth/Equity Oriented Schemes" (older reports)
# - each row is a **category**, a **subtotal**, a part **total** or the **grand total**

# %%
def number(v):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return None if pd.isna(x) else x              # blank cells come back as NaN: treat them as "no number"

def read_report(path, month):
    sheet = pd.read_excel(path, sheet_name=0, header=None)
    header, net_col, aum_col = find_columns(sheet)
    rows, part, section = [], None, None
    for i in range(header + 1, len(sheet)):
        cells = sheet.iloc[i].tolist()
        words = [str(c).strip() for c in cells[:net_col] if isinstance(c, str) and str(c).strip()]   # text cells left of the numbers
        if not words:
            continue
        label = words[-1]                                    # the scheme or section name
        tag = words[0] if len(words) > 1 else ""             # "A", "II", "iv", "12" ...
        low = " ".join(words).lower()
        net, aum = number(cells[net_col]), number(cells[aum_col])
        if low.startswith("grand total"):
            kind = "grand_total"
        elif low.startswith("total"):
            kind = "part_total"
        elif low.startswith("sub total"):
            kind = "subtotal"
        elif net is None:                                    # a heading row: part or section
            if tag in ("A", "B", "C") or "ended" in low or "interval" in low:
                part = {"A": "open", "B": "close", "C": "interval"}.get(tag) or (
                    "open" if "open" in low else "close" if "close" in low else "interval")
                section = None
            elif re.fullmatch(r"[IVX]+", tag):
                section = label
            continue
        else:
            kind = "category"
        if "fund of funds scheme (domestic)" in low:         # a memo line below the grand total, not part of it
            continue
        if part == "interval" and kind == "category" and section is None:
            section = "Interval Schemes"
        rows.append({"month": month, "part": part, "section": section, "kind": kind, "label": label,
                     "net_inflow_cr": net, "aum_cr": aum})
    return pd.DataFrame(rows)

data = read_report(RAW_AMFI / "amoct2026repo.xls", "2026-10")
data[data["section"].fillna("").str.contains("Equity") & (data["part"] == "open")]

# %% [markdown]
# ### Read all 91 reports

# %%
files = pd.read_csv(ROOT / "data" / "raw" / "amfi_files.csv")
files = files[files["kind"] == "xls"]                               # only months with an Excel report
data = pd.concat([read_report(RAW_AMFI / f, m) for f, m in zip(files["file"], files["month"])], ignore_index=True)
print(data["month"].nunique(), "months,", len(data), "rows")
data["kind"].value_counts()

# %% [markdown]
# ### Check 1: every section adds up
# The categories inside each section must add up to that section's subtotal (to within Rs 1 crore of rounding).

# %%
data["block"] = (data["kind"] != "category").cumsum()               # each subtotal closes the categories just above it
cats = data[data["kind"] == "category"].groupby("block")["net_inflow_cr"].sum()
subs = data[data["kind"] == "subtotal"].set_index("block")
check1 = subs.assign(categories=cats.reindex(subs.index - 1).values)   # categories sit in the block before their subtotal
check1["gap"] = (check1["net_inflow_cr"] - check1["categories"]).abs()
print("sections checked:", len(check1), "· failing:", (check1["gap"] > 1).sum())
check1[check1["gap"] > 1][["month", "section", "net_inflow_cr", "categories", "gap"]]

# %% [markdown]
# ### Check 2: the parts add up to the grand total

# %%
parts = data[data["kind"] == "part_total"].groupby("month")["net_inflow_cr"].sum()
grand = data[data["kind"] == "grand_total"].set_index("month")["net_inflow_cr"]
check2 = pd.DataFrame({"parts": parts, "grand_total": grand})
check2["gap"] = (check2["parts"] - check2["grand_total"]).abs()
print("months checked:", len(check2), "· failing:", (check2["gap"] > 1).sum())
check2[check2["gap"] > 1]

# %% [markdown]
# ### Name each section the same way across years
# Older reports say "Growth/Equity Oriented Schemes" and newer ones say "Equity Schemes". We map every section to one group.
# Index funds, ETFs and overseas fund of funds are grouped as **passive & other** (older reports list them together as "Other Schemes").

# %%
def group(part, section):
    s = (section or "").lower()
    if part != "open":
        return "Closed-ended & interval"
    if "equity" in s:
        return "Equity (active)"
    if "debt" in s or "income" in s:
        return "Debt"
    if "hybrid" in s:
        return "Hybrid"
    if "solution" in s or "life cycle" in s:
        return "Solution-oriented & life cycle"
    return "Passive & other"          # index funds, ETFs, overseas FoF, "Other Schemes"

data["group"] = [group(p, s) for p, s in zip(data["part"], data["section"])]
data[data["kind"] == "subtotal"].groupby(["group"])["section"].unique()

# %% [markdown]
# ### Name equity categories the same way across years
# Category names changed a little over the years (Flexi Cap started in late 2020; "Value Fund/Contra Fund" was later split).

# %%
def equity_category(label):
    l = label.lower()
    if "large & mid" in l or "large and mid" in l: return "Large & mid cap"
    if "large cap" in l: return "Large cap"
    if "mid cap" in l: return "Mid cap"
    if "small cap" in l: return "Small cap"
    if "flexi" in l: return "Flexi cap"
    if "multi cap" in l: return "Multi cap"
    if "sector" in l or "thematic" in l: return "Sectoral & thematic"
    if "elss" in l: return "ELSS (tax saver)"
    return "Value, contra, focused & dividend yield"

eq = data[(data["group"] == "Equity (active)") & (data["kind"] == "category")].copy()
eq["category"] = eq["label"].map(equity_category)
eq.groupby("category")["label"].unique()

# %% [markdown]
# ### Build the clean tables
# - `equity`: one row per month with the equity net inflow (the open-ended equity subtotal) and equity AUM
# - `groups`: net inflow per month and group
# - `equity_categories`: net inflow per month and equity category

# %%
equity = (data[(data["group"] == "Equity (active)") & (data["kind"] == "subtotal")]
          .groupby("month")[["net_inflow_cr", "aum_cr"]].sum()
          .rename(columns={"net_inflow_cr": "equity_inflow_cr", "aum_cr": "equity_aum_cr"}))
groups = data[data["kind"] == "subtotal"].groupby(["month", "group"])["net_inflow_cr"].sum().reset_index()
total = data[data["kind"] == "grand_total"].set_index("month")[["net_inflow_cr", "aum_cr"]].rename(
    columns={"net_inflow_cr": "total_inflow_cr", "aum_cr": "total_aum_cr"})
equity_categories = eq.groupby(["month", "category"])["net_inflow_cr"].sum().reset_index()
print(len(equity), "months of equity flows")
equity.tail()

# %% [markdown]
# ### Check 3: compare with figures AMFI and the press reported
# Three months picked before looking at our results: the October 2026 AMFI Monthly Note, and two news reports of AMFI data.

# %%
reported = {"2026-10": 32993.64, "2026-01": 24028.59, "2025-01": 39687.78}   # Rs crore, equity net inflow
for m, value in reported.items():
    ours = equity.loc[m, "equity_inflow_cr"]
    print(m, "reported", value, "· ours", round(ours, 2), "· match" if abs(ours - value) < 1 else "· MISMATCH")

# %% [markdown]
# ### Read the SIP table
# AMFI's page shows months as rows and financial years (April to March) as columns. We turn it into one row per month.

# %%
tables = pd.read_html(RAW_AMFI / "sip_page.html")
sip_wide = tables[0]
sip_wide.columns = [c[-1] if isinstance(c, tuple) else c for c in sip_wide.columns]   # keep the bottom header row
sip_wide = sip_wide.rename(columns={sip_wide.columns[0]: "month_name"})
sip_wide = sip_wide[sip_wide["month_name"] != "Total during FY"]
sip_wide.head(3)

# %%
MONTHS = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}
rows = []
for col in sip_wide.columns[1:]:
    start = int(re.search(r"(\d{4})", col).group(1))            # "FY 2025-26" starts in April 2025
    for name, value in zip(sip_wide["month_name"], sip_wide[col]):
        if pd.isna(value):
            continue
        m = MONTHS[str(name).strip().lower()[:3]]
        year = start if m >= 4 else start + 1                     # January to March belong to the next calendar year
        rows.append({"month": f"{year}-{m:02d}", "sip_cr": float(value)})
sip = pd.DataFrame(rows).sort_values("month").set_index("month")
print(len(sip), "months, from", sip.index.min(), "to", sip.index.max())
sip.tail()

# %% [markdown]
# ### Check 4: SIP figures
# October 2026 must be Rs 32,160 crore (AMFI Monthly Note). AMFI's table shows the same value, Rs 31,002 crore, for
# December 2025 and January 2026. News reports of AMFI data confirm both months, so it is a real coincidence, not a copying error.

# %%
print("Oct 2026:", sip.loc["2026-10", "sip_cr"], "(note: 32,160)")
print("Dec 2025:", sip.loc["2025-12", "sip_cr"], "· Jan 2026:", sip.loc["2026-01", "sip_cr"], "(both reported as 31,002)")
dupes = sip[sip["sip_cr"].duplicated(keep=False)]
dupes

# %% [markdown]
# ### Log every check and save the tables

# %%
log = pd.DataFrame([
    {"check": "categories add up to section subtotals", "checked": len(check1), "failed": int((check1["gap"] > 1).sum())},
    {"check": "parts add up to grand total", "checked": len(check2), "failed": int((check2["gap"] > 1).sum())},
    {"check": "equity inflow matches reported figures", "checked": len(reported),
     "failed": sum(abs(equity.loc[m, "equity_inflow_cr"] - v) >= 1 for m, v in reported.items())},
    {"check": "SIP October 2026 matches the Monthly Note", "checked": 1, "failed": int(sip.loc["2026-10", "sip_cr"] != 32160)},
])
log.to_csv(OUT / "extraction_log.csv", index=False)
data.drop(columns="block").to_parquet(OUT / "report_rows.parquet", index=False)
equity.to_parquet(OUT / "equity.parquet")
groups.to_parquet(OUT / "groups.parquet", index=False)
equity_categories.to_parquet(OUT / "equity_categories.parquet", index=False)
sip.to_parquet(OUT / "sip.parquet")
log
