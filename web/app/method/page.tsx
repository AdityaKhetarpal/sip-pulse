import type { Metadata } from "next";
import { overview, monthLong, monthName, pct, inr } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/method" },
  title: "How we tested it",
  description: "The pre-registered test behind SIP Pulse: hypotheses fixed before any data was seen, definitions, verdicts, robustness checks, data checks and limits.",
};

const GH = "https://github.com/AdityaKhetarpal/sip-pulse";

export default function Method() {
  const o = overview, r = o.results;
  const c = r.correlation;
  const row = (name: string, t: typeof r.h1, unit: "%" | "cr") => {
    const f = (v: number) => (unit === "%" ? pct(v) : `${v < 0 ? "−" : "+"}₹${inr(Math.abs(v))} cr`);
    return (
      <tr>
        <td>{name}</td>
        <td className="num">{f(t.after_fall_median)}</td>
        <td className="num">{f(t.other_median)}</td>
        <td className="num">{f(t.gap)}</td>
        <td className="num">{f(t.low)} to {f(t.high)}</td>
      </tr>
    );
  };

  return (
    <div className="wrap">
      <div className="head">
        <h1>How we tested it</h1>
        <p>
          The question, the definitions and the rules for each verdict were written down and locked on {r.pre_registered}, before we downloaded any data, so the answer couldn&apos;t
          bend to fit. Everything below can be checked in the <a href={GH}>notebooks on GitHub</a>.
        </p>
      </div>

      <div className="prose">
        <h2>The two hypotheses</h2>
        <ul>
          <li><b>H1:</b> in the month after a fall month, equity net inflows are lower than in other months.</li>
          <li><b>H2:</b> in the month after a fall month, SIP contributions are <em>not</em> lower than in other months.</li>
        </ul>
        <p><b>Fall month:</b> the Nifty 50 closes 5% or more below the previous month-end. There were {r.fall_months.length}: {r.fall_months.map((f) => `${monthName(f.month)} (${pct(f.nifty_return_pct)})`).join(", ")}.</p>
        <p>
          <b>How &ldquo;lower&rdquo; is judged:</b> we take the median month-on-month change in the months after a fall, minus the median in all other
          months. To see how sure we can be, we resample both groups 10,000 times and keep the middle 90% of the results. H1 counts as supported only if that
          whole range is below zero. H2 is rejected only if its whole range is below zero.
        </p>

        <h2>Results</h2>
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Data table" style={{ maxWidth: 820 }}>
        <table>
          <thead>
            <tr><th>Measure</th><th className="num">After a fall</th><th className="num">Other months</th><th className="num">Gap</th><th className="num">90% range of the gap</th></tr>
          </thead>
          <tbody>
            {row("H1: equity inflows, % change", r.h1, "%")}
            {row("H2: SIP contributions, % change", r.h2, "%")}
            {row("Check: equity inflows, ₹ change", r.h1_rupees, "cr")}
            {row("Check: SIP contributions, ₹ change", r.h2_rupees, "cr")}
          </tbody>
        </table>
      </div>
      <div className="prose" style={{ marginTop: 18 }}>
        <ul>
          <li><b>H1: not supported.</b> Inflows were lower after falls, but the range includes zero, so with {r.h1.n_after} falls the drop could be chance.</li>
          <li><b>H2: rejected.</b> SIPs dipped slightly after falls (about 1%), and the range stays below zero. Small, but consistent.</li>
          <li>
            <b>Context (not part of the verdict):</b> rank correlation between the Nifty&apos;s monthly return and the change in equity inflows is{" "}
            {c.equity_same_month.rho.toFixed(2)} in the same month (p {c.equity_same_month.p < 0.001 ? "< 0.001" : `= ${c.equity_same_month.p.toFixed(3)}`}) and{" "}
            {c.equity_next_month.rho.toFixed(2)} a month later (p = {c.equity_next_month.p.toFixed(2)}). Inflows rise when the market falls, in the same month.
          </li>
        </ul>

        <h2>Found after the test</h2>
        <p>
          The same-month correlation led us to count how often equity inflows rose in the fall month itself: {r.exploratory_fall_month.rose} of{" "}
          {r.exploratory_fall_month.of}. This wasn&apos;t part of the locked test, so it is labelled &ldquo;found after the test&rdquo; everywhere it appears.
          Its 90% range ({pct(r.exploratory_fall_month.low)} to {pct(r.exploratory_fall_month.high)}) just touches zero.
        </p>

        <h2>Changes after locking, and why</h2>
        <ul>
          <li>
            <b>Better data, found before anything was downloaded.</b> The plan first used AMFI&apos;s monthly notes (about 28 months, read from PDFs). We then
            found AMFI&apos;s one-file-per-month Excel reports and its SIP table, covering {o.months} months including the 2020 crash. The hypotheses and rules
            didn&apos;t change.
          </li>
          <li>
            <b>Percent change when inflows were negative.</b> Equity inflows were below zero for {o.outflow_months} months in 2020–21, and a plain percent change
            flips sign there. So the change is divided by the <em>size</em> of last month&apos;s figure, and the same test is repeated in rupees (table above).
          </li>
        </ul>
        <p className="small">Both are recorded in the project&apos;s <a href={`${GH}/blob/main/knowledge/_meta/log.md`}>change log</a>.</p>

        <h2>Data and checks</h2>
        <ul>
          <li><b>Equity inflows and AUM:</b> AMFI monthly report (Excel), one per month, {monthLong(o.window[0])} to {monthLong(o.window[1])}; the open-ended equity schemes subtotal.</li>
          <li><b>SIP contributions:</b> AMFI&apos;s month-wise SIP table. AMFI rounds these to the nearest crore.</li>
          <li><b>Nifty 50:</b> close on the last trading day of each month, from Yahoo Finance (<code>^NSEI</code>). This is the price index, not the total-return index.</li>
          <li>
            <b>{o.checks.run} checks, {o.checks.failed} failed:</b> every scheme category adds up to its section subtotal, every section adds up to the grand total,
            three months match figures AMFI and the press published, October 2026 SIP matches AMFI&apos;s monthly note, and we count{" "}
            {o.inflow_streak} months of inflows in a row, exactly what AMFI reported for October 2026.
          </li>
        </ul>

        <h2>Limits</h2>
        <ul>
          <li><b>Only {r.fall_months.length} falls.</b> Small samples give wide ranges; that is why H1 can&apos;t be confirmed.</li>
          <li><b>Moving together isn&apos;t cause.</b> Flows can also move with bonuses, tax deadlines and new fund launches in the same months.</li>
          <li><b>SIP money isn&apos;t all equity.</b> Some goes to hybrid and index funds, so SIPs and equity inflows can&apos;t be subtracted from each other.</li>
          <li><b>Industry totals only.</b> Nothing here is about a single fund, and nothing here is a recommendation.</li>
        </ul>

        <h2>Rebuild it yourself</h2>
        <p>
          Five notebooks, in order: <a href={`${GH}/blob/main/notebooks/01_acquire.ipynb`}>01 get the data</a>,{" "}
          <a href={`${GH}/blob/main/notebooks/02_extract.ipynb`}>02 read and check</a>, <a href={`${GH}/blob/main/notebooks/03_sql.ipynb`}>03 SQL in DuckDB</a>,{" "}
          <a href={`${GH}/blob/main/notebooks/04_analysis.ipynb`}>04 the test</a>, <a href={`${GH}/blob/main/notebooks/05_export.ipynb`}>05 export</a>. The locked{" "}
          <a href={`${GH}/blob/main/input/ideas/sip-pulse-plan.md`}>plan</a> and <a href={`${GH}/blob/main/input/ideas/sip-pulse-design.md`}>design</a> are in the repo.
        </p>
      </div>
    </div>
  );
}
