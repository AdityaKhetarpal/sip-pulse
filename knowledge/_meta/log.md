# Log

- 2026-11-17 · sip-pulse-plan · **Change after pre-registration, made before any data was downloaded or seen.**
  Data source and sample changed from the AMFI Monthly Notes (PDF, Jan 2025 to Oct 2026, about 28 months) to AMFI monthly
  report Excel files plus AMFI's SIP contribution table (April 2019 to October 2026, 91 months). Reason: an official
  one-file-per-month Excel series was found that is longer, avoids PDF extraction errors and covers more market falls.
  H1, H2, the 5% fall definition, the bootstrap settings and the falsification rules are unchanged. Approved by Aditya.

- 2026-11-17 · sip-pulse-plan · **Method detail, decided after the data was read and before the test was run.**
  Equity net inflows were negative from July 2020 to February 2021, so a plain % change would flip sign. The pre-registered
  "month-on-month % change" is computed as (this month − last month) / |last month|. As a robustness check, the same test
  is also reported in Rs crore. Verdicts use the pre-registered % metric.
- 2026-11-17 · sip-pulse-plan · **Exploratory finding, reported separately from the test.** The same-month correlation
  (Spearman −0.40) led to a count of fall months in which equity inflows rose. This was not pre-registered and is labelled
  exploratory wherever it is shown.
- 2026-11-18 · website · **Design revision, no change to data or verdicts.** New typefaces, ruled answer rows, one animation,
  keyboard-readable charts, SEO metadata. Recorded in DESIGN.md.
