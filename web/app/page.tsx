import Link from "next/link";
import Vanta from "@/components/Vanta";
import PulseChart from "@/components/PulseChart";
import { monthly, overview, crore, lakhCrore, monthLong, pct } from "@/lib/data";

export default function Home() {
  const o = overview;
  const r = o.results;
  const test = monthly.filter((m) => m.in_test);
  const nFalls = r.fall_months.length;
  const lowest = Math.min(...r.fall_months.map((f) => f.equity_inflow_cr));
  const ex = r.exploratory_fall_month;

  return (
    <>
      <section className="hero">
        <Vanta />
        <div className="wrap">
          <div className="kicker">India · mutual funds · {o.months} months of AMFI data</div>
          <h1 className="display">When the Nifty falls, the money keeps coming.</h1>
          <p className="lead">
            We checked every month from {monthLong(o.window[0])} to {monthLong(o.window[1])}. In all {nFalls} months the Nifty 50 fell 5% or more,
            more money went into equity funds than came out (at least {crore(lowest)}). SIPs, the fixed monthly investments people set up once,
            dipped by about 1% the month after, then kept growing.
          </p>
          <div className="stats">
            <div className="stat"><b>{nFalls} of {nFalls}</b><span>fall months with money still flowing into equity funds</span></div>
            <div className="stat"><b>{o.inflow_streak}</b><span>months in a row of net inflows, up to {monthLong(o.latest.month)}</span></div>
            <div className="stat"><b>{crore(o.latest.sip)}</b><span>SIP money in {monthLong(o.latest.month)}, up from {crore(o.sip_growth.from)} in {monthLong(o.window[0])}</span></div>
            <div className="stat"><b>{o.checks.failed} of {o.checks.run}</b><span>data checks failed</span></div>
          </div>
          <div className="actions">
            <Link className="btn" href="/falls">See every fall</Link>
            <Link className="btn ghost" href="/method">How we tested it</Link>
          </div>
        </div>
      </section>

      <div className="wrap">
        <section className="section" data-reveal>
          <h2>SIP money rose from {crore(o.sip_growth.from)} to {crore(o.sip_growth.to)} a month, through every fall.</h2>
          <p className="sub">
            The grey bars are net money into active equity funds each month: money in minus money out. They swing hard, and went negative for{" "}
            {o.outflow_months} months in 2020–21. The green line is SIP contributions. Red bands mark the {nFalls} months the Nifty 50 fell 5% or more.
          </p>
          <PulseChart data={test} />
          <p className="source">
            Source: AMFI monthly reports (equity schemes, open-ended) and AMFI SIP data; Nifty 50 month-end closes from Yahoo Finance.{" "}
            {monthLong(o.window[0])} to {monthLong(o.window[1])}. Total over the period: {lakhCrore(o.totals.equity)} into equity funds,{" "}
            {lakhCrore(o.totals.sip)} through SIPs.
          </p>
        </section>

        <section className="section" data-reveal>
          <h2>Three answers</h2>
          <p className="sub">
            The first two were fixed as a test before we saw any data, so we couldn&apos;t move the goalposts. The third turned up afterwards and is labelled that way.
          </p>
          <div className="grid g3" style={{ marginTop: 18 }}>
            <article className="card verdict">
              <span className="tag locked">Locked test</span>
              <div className="q">Do equity inflows drop the month after a fall?</div>
              <div className="a">Not clearly.</div>
              <p className="small">
                They fell a median {pct(r.h1.after_fall_median)} against {pct(r.h1.other_median)} in other months. With only {r.h1.n_after} falls,
                that&apos;s within chance: the 90% range runs from {pct(r.h1.low)} to {pct(r.h1.high)}.
              </p>
            </article>
            <article className="card verdict">
              <span className="tag locked">Locked test</span>
              <div className="q">Do SIPs hold up the month after a fall?</div>
              <div className="a">Almost: a small dip.</div>
              <p className="small">
                A median {pct(r.h2.after_fall_median)} against {pct(r.h2.other_median)} in other months, about ₹{Math.abs(Math.round(r.h2_rupees.gap / 10) * 10).toLocaleString("en-IN")} crore.
                Small, but consistent: the 90% range ({pct(r.h2.low)} to {pct(r.h2.high)}) stays below zero.
              </p>
            </article>
            <article className="card verdict found">
              <span className="tag">Found after the test</span>
              <div className="q">What happens in the fall month itself?</div>
              <div className="a">People buy the dip.</div>
              <p className="small">
                Equity inflows went <em>up</em> in {ex.rose} of {ex.of} fall months, by a median {pct(ex.after_fall_median)}. Investors put in more
                while prices were lower, then slowed down the next month.
              </p>
            </article>
          </div>
        </section>

        <section className="section" data-reveal>
          <div className="callout">
            <p style={{ margin: 0 }}>
              <b>What this means for an investor:</b> during the falls since 2019, the people investing through mutual funds mostly kept going, and many
              added money. That describes what happened; it doesn&apos;t predict the next fall, and it isn&apos;t advice.{" "}
              <Link href="/falls">See each fall month by month →</Link>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
