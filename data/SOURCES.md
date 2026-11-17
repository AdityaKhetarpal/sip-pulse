# Data sources (downloaded 2026-11-17)

- **AMFI monthly report** (Excel), April 2019 to October 2026: `https://portal.amfiindia.com/spages/am<mon><yyyy>repo.xls`.
  Listed at https://www.amfiindia.com/research-information/amfi-monthly. The file used for each month is in `raw/amfi_files.csv`.
- **AMFI month-wise SIP contribution table**: https://www.amfiindia.com/mutual-fund (saved copy: `raw/amfi/sip_page.html`).
- **Nifty 50**: Yahoo Finance, ticker `^NSEI`, daily closes; the last trading day of each month is used. This is the price index,
  not the total-return index.
- Terms: AMFI data is used for research and education and credited on every chart (https://www.amfiindia.com/terms-of-use).
