# %% [markdown]
# # 01 · Get the data
# Downloads AMFI's monthly reports (April 2019 to October 2026), AMFI's SIP contribution table and Nifty 50 monthly closes.
# Runs in Google Colab or GitHub Actions. Files are saved under `data/raw/`.

# %% [markdown]
# ### Find the project folder
# The notebook can run from inside `notebooks/` (GitHub Actions) or from the project folder (Colab). Both lead to the same `ROOT`.

# %%
from pathlib import Path   # Path makes folder paths easy to work with

ROOT = Path.cwd().parent if Path.cwd().name == "notebooks" else Path.cwd()   # the sip-pulse folder
RAW_AMFI = ROOT / "data" / "raw" / "amfi"      # AMFI files go here
RAW_NIFTY = ROOT / "data" / "raw" / "nifty"    # Nifty 50 file goes here
RAW_AMFI.mkdir(parents=True, exist_ok=True)    # create the folders if they don't exist yet
RAW_NIFTY.mkdir(parents=True, exist_ok=True)
print(ROOT)

# %% [markdown]
# ### Build the list of months
# One AMFI monthly report per month, from April 2019 to October 2026.
# Each file name follows one pattern: "am" + short month + year + "repo.xls", for example `amoct2026repo.xls`.

# %%
import pandas as pd   # pandas works with tables

months = pd.period_range("2019-04", "2026-10", freq="M")    # every month in our window
data = pd.DataFrame({"month": months})                      # one row per month
data["code"] = data["month"].dt.strftime("%b%Y").str.lower()   # e.g. "oct2026"
print(len(data), "months")                                  # should print 91
data.head()

# %% [markdown]
# ### Download the monthly reports
# For each month we try the Excel file first. A few months were re-issued as "reporevised", so that name is tried next,
# and the PDF is the last resort. We wait 1 second between requests so we don't overload AMFI's server.

# %%
import requests, time   # requests downloads files; time lets us pause

HEADERS = {"User-Agent": "Mozilla/5.0 (sip-pulse research project; github.com/AdityaKhetarpal/sip-pulse)"}
BASE = "https://portal.amfiindia.com/spages/"

def download(code):
    for name in [f"am{code}repo.xls", f"am{code}reporevised.xls", f"am{code}repo.pdf"]:   # names to try, in order
        path = RAW_AMFI / name
        if path.exists() and path.stat().st_size > 1000:   # already downloaded: skip it
            return name, "already there"
        try:
            r = requests.get(BASE + name, headers=HEADERS, timeout=60)
        except requests.RequestException as e:
            continue                                        # network hiccup: try the next name
        time.sleep(1)                                       # be polite
        if r.status_code == 200 and len(r.content) > 1000 and not r.content[:200].lower().startswith(b"<!doctype html"):
            path.write_bytes(r.content)                     # a real file (not an error page): save it
            return name, "downloaded"
    return None, "failed"

results = [download(c) for c in data["code"]]
data["file"] = [r[0] for r in results]                       # which file we got for each month
data["status"] = [r[1] for r in results]
data["status"].value_counts()

# %% [markdown]
# ### Check what we got
# Every month should have an Excel file. Any month that only has a PDF, or nothing, is listed here.

# %%
data["kind"] = data["file"].fillna("").str.extract(r"\.(\w+)$", expand=False)   # xls or pdf
print(data["kind"].value_counts(dropna=False))
data[(data["kind"] != "xls")][["month", "file", "status"]]

# %%
data.to_csv(ROOT / "data" / "raw" / "amfi_files.csv", index=False)   # keep the list of files for notebook 02

# %% [markdown]
# ### Save AMFI's SIP contribution table
# AMFI's mutual-fund page has the SIP contribution for every month since April 2016.
# We save the whole page now and read the table from it in notebook 02.

# %%
SIP_URL = "https://www.amfiindia.com/mutual-fund"
r = requests.get(SIP_URL, headers=HEADERS, timeout=60)
print(r.status_code, len(r.text), "characters")
(RAW_AMFI / "sip_page.html").write_text(r.text, encoding="utf-8")   # keep a copy so the analysis can be repeated
print("SIP table found in the page:", "3,122" in r.text or "3122" in r.text)   # April 2016 = Rs 3,122 crore

# %% [markdown]
# ### Download Nifty 50 monthly closes
# To work out each month's market return we need the Nifty 50 close at the end of every month.
# We start in March 2019 so that April 2019 has a previous month to compare with.
# Daily closes are downloaded and the last trading day of each month is kept, which avoids any doubt about how monthly bars are dated.

# %%
import yfinance as yf

for attempt in range(3):                                     # Yahoo sometimes refuses the first request
    daily = yf.download("^NSEI", start="2019-03-01", end="2026-11-01", interval="1d", auto_adjust=False, progress=False)
    if len(daily) > 1000:
        break
    time.sleep(10)
print(len(daily), "trading days")

# %%
close = daily["Close"]
close = close.iloc[:, 0] if isinstance(close, pd.DataFrame) else close    # newer yfinance returns one column per ticker
data = close.groupby(close.index.to_period("M")).last().to_frame("nifty_close")   # last close of each month
data["last_day"] = close.groupby(close.index.to_period("M")).apply(lambda s: s.index.max().date())   # which day that was
data.index.name = "month"
data.to_csv(RAW_NIFTY / "nifty50_monthly.csv")
print(len(data), "months")                                   # should print 92 (March 2019 to October 2026)
data.tail()

# %% [markdown]
# ### Write down where the data came from

# %%
from datetime import date

sources = f"""# Data sources (downloaded {date.today()})

- **AMFI monthly report** (Excel), April 2019 to October 2026: `https://portal.amfiindia.com/spages/am<mon><yyyy>repo.xls`.
  Listed at https://www.amfiindia.com/research-information/amfi-monthly. The file used for each month is in `raw/amfi_files.csv`.
- **AMFI month-wise SIP contribution table**: https://www.amfiindia.com/mutual-fund (saved copy: `raw/amfi/sip_page.html`).
- **Nifty 50**: Yahoo Finance, ticker `^NSEI`, daily closes; the last trading day of each month is used. This is the price index,
  not the total-return index.
- Terms: AMFI data is used for research and education and credited on every chart (https://www.amfiindia.com/terms-of-use).
"""
(ROOT / "data" / "SOURCES.md").write_text(sources)
print(sources)
