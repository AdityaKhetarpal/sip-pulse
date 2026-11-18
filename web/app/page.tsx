import Link from "next/link";
import Vanta from "@/components/Vanta";
import PulseChart from "@/components/PulseChart";
import { monthly, overview, crore, lakhCrore, monthLong, pct } from "@/lib/data";

const LD = {"@context": "https://schema.org", "@type": "Dataset", "name": "SIP Pulse: Indian mutual fund flows during Nifty 50 falls", "description": "Monthly net inflows into open-ended equity mutual funds and SIP contributions in India, April 2019 to October 2026, with the months the Nifty 50 fell 5% or more and a pre-registered test of what happened after them.", "url": "https://sip-pulse.vercel.app", "temporalCoverage": "2019-04/2026-10", "keywords": ["mutual funds", "SIP", "AMFI", "Nifty 50", "India"], "isBasedOn": ["https://www.amfiindia.com/research-information/amfi-monthly"], "sameAs": "https://github.com/AdityaKhetarpal/sip-pulse", "creator": {"@type": "Person", "name": "Aditya Khetarpal", "url": "https://www.linkedin.com/in/adityakhetarpal"}};

export default function Home() {
  const o = overview;
  const r = o.results;
  const test = monthly.filter((m) => m.in_test);
  const nFalls = r.fall_months.length;
  const lowest = Math.min(...r.fall_months.map((f) => f.equity_inflow_cr));
  const ex = r.exploratory_fall_month;
  const kept = r.fall_months.filter((f) => f.equity_inflow_cr > 0).length;

  // the passbook: what happened, one line each, label on the left and the amount on the right
  const ledger: [string, string][] = [
    [`Months checked, ${monthLong(o.window[0])} to ${monthLong(o.window[1])}`, `${o.months}`],
    ["Months the Nifty 50 fell 5% or more", `${nFalls}`],
    ["Fall months with more money going into equity funds than coming out", `${kept} of ${nFalls}`],
    ["Smallest net inflow in a fall month", crore(lowest)],
    [`Months in a row of net inflows, up to ${monthLong(o.latest.month)}`, `${o.inflow_streak}`],
    [`SIP money in ${monthLong(o.window[0])}`, crore(o.sip_growth.from)],
    [`SIP money in ${monthLong(o.latest.month)}`, crore(o.latest.sip)],
    ["Data checks that failed", `${o.checks.failed} of ${o.checks.run}`],
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <section className="hero">
        <Vanta />
        <div className="wrap">
          <h1 className="display">When the Nifty falls, the money keeps coming.</h1>
          <p className="lead">
            In all {nFalls} months since 2019 that the Nifty 50 fell 5% or more, more money went into equity mutual funds than came out.
            SIPs, the fixed amounts people invest every month, dipped about 1% the month after and then kept growing.
          </p>
        </div>
      </section>

      <div className="wrap">
        <section className="chart-room" aria-labelledby="chart-title">
          <h2 id="chart-title" className="sr-only">Monthly money into equity funds and SIPs</h2>
          <PulseChart data={test} />
          <p className="source">
            Grey bars: net money into active equity funds each month, money in minus money out. They went negative for {o.outflow_months} months in
            2020–21. Green line: SIP contributions. Red bands: the {nFalls} fall months. Source: AMFI monthly reports and AMFI SIP data; Nifty 50
            month-end closes from Yahoo Finance. Over the whole period, {lakhCrore(o.totals.equity)} went into equity funds and {lakhCrore(o.totals.sip)} came
            through SIPs.
          </p>
        </section>

        <section className="section split">
          <div>
            <h2>The record, line by line</h2>
            <p className="sub">
              Every figure comes from AMFI&apos;s monthly reports. Amounts are ₹ crore in one month.
            </p>
            <div className="actions">
              <Link className="btn" href="/falls">See every fall</Link>
              <Link className="btn ghost" href="/method">How we tested it</Link>
            </div>
          </div>
          <dl className="ledger">
            {ledger.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className="section">
          <h2>Three questions, three answers</h2>
          <p className="sub">
            The first two were written down as a test before we downloaded any data, so we couldn&apos;t move the goalposts. The third turned up
            afterwards and is labelled that way.
          </p>
          <div className="answers">
            <article className="answer">
              <p className="status locked">Locked test</p>
              <h3 className="q">Do equity inflows drop the month after a fall?</h3>
              <div>
                <p className="a">Not clearly.</p>
                <p className="small">
                  They fell a median {pct(r.h1.after_fall_median)}, against {pct(r.h1.other_median)} in other months. With only {r.h1.n_after} falls,
                  that&apos;s within chance: the 90% range runs from {pct(r.h1.low)} to {pct(r.h1.high)}.
                </p>
              </div>
            </article>
            <article className="answer">
              <p className="status locked">Locked test</p>
              <h3 className="q">Do SIPs hold up the month after a fall?</h3>
              <div>
                <p className="a">Almost: they dip a little.</p>
                <p className="small">
                  A median {pct(r.h2.after_fall_median)}, against {pct(r.h2.other_median)} in other months: about
                  ₹{Math.abs(Math.round(r.h2_rupees.gap / 10) * 10).toLocaleString("en-IN")} crore. Small but consistent: the whole 90% range
                  ({pct(r.h2.low)} to {pct(r.h2.high)}) is below zero.
                </p>
              </div>
            </article>
            <article className="answer">
              <p className="status">Found after the test</p>
              <h3 className="q">What happens in the fall month itself?</h3>
              <div>
                <p className="a">Inflows usually rose.</p>
                <p className="small">
                  Equity inflows went up in {ex.rose} of {ex.of} fall months, by a median {pct(ex.after_fall_median)}: people put in more while
                  prices were lower, then slowed down the next month. This wasn&apos;t part of the locked test, and its 90% range
                  ({pct(ex.low)} to {pct(ex.high)}) still includes zero, so treat it as a lead rather than a finding.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="callout">
            <p>
              <b>What this means for an investor:</b> during the falls since 2019, people investing through mutual funds mostly kept going, and many
              added money. That describes what happened. It doesn&apos;t predict the next fall, and it isn&apos;t advice.
            </p>
            <p style={{ margin: 0 }}><Link href="/falls">See each fall month by month</Link></p>
          </div>
        </section>
      </div>
    </>
  );
}
