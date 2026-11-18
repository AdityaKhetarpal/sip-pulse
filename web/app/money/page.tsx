import type { Metadata } from "next";
import MoneyBars from "@/components/MoneyBars";
import { categories, overview, inr, monthLong } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/money" },
  title: "Where the money goes",
  description: "Net money into Indian mutual funds by financial year: equity categories (large, mid, small cap, flexi cap, sectoral) and fund groups, April 2019 to October 2026.",
};

const GROUP_ORDER = ["Equity (active)", "Hybrid", "Passive & other", "Debt", "Solution-oriented & life cycle", "Closed-ended & interval"];

export default function Money() {
  const m = categories.months_in_fy;
  const years = Object.keys(m).sort();
  const latestFull = [...years].reverse().find((y) => m[y] === 12) ?? years[years.length - 1];
  const eq = categories.equity.map((r) => ({ fy: r.fy, key: r.category, inflow: r.inflow }));
  const topOf = (y: string) => [...categories.equity.filter((r) => r.fy === y)].sort((a, b) => b.inflow - a.inflow)[0];
  const top = topOf(latestFull);
  const label = (y: string) => `FY${y.slice(2)}`;

  return (
    <div className="wrap">
      <div className="head">
        <h1>Where the money goes</h1>
        <p>
          Net money into each kind of equity fund, by financial year (April to March). In {label(latestFull)}, the most went to <b>{top.category.toLowerCase()}</b> funds
          (₹{inr(top.inflow)} crore). Green is money in, red is money out.
        </p>
      </div>

      <section className="card">
        <h2>Equity funds by category</h2>
        <p className="small">Pick a year. {label(years[0])} starts in {monthLong(overview.window[0])}; {label(years[years.length - 1])} runs only to {monthLong(overview.window[1])}.</p>
        <MoneyBars rows={eq} months={m} initial={latestFull} />
        <p className="source">
          Source: AMFI monthly reports, open-ended equity schemes. Flexi cap funds started in late 2020, so earlier years have none.
          &ldquo;Value, contra, focused &amp; dividend yield&rdquo; groups four smaller categories that AMFI split differently over the years.
        </p>
      </section>

      <section className="section">
        <h2>All fund groups, year by year</h2>
        <p className="sub">
          Net money in, ₹ crore. Debt funds swing the most because companies park and pull cash in liquid funds, so they say little about
          individual investors. Passive includes index funds and ETFs.
        </p>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Data table" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr><th>Group</th>{years.map((y) => <th key={y} className="num">{label(y)}{m[y] < 12 ? "*" : ""}</th>)}</tr>
            </thead>
            <tbody>
              {GROUP_ORDER.map((g) => (
                <tr key={g}>
                  <td>{g}</td>
                  {years.map((y) => {
                    const v = categories.groups.find((r) => r.fy === y && r.group === g)?.inflow ?? 0;
                    return <td key={y} className={`num${v < 0 ? " neg" : ""}`}>{v < 0 ? "−" : ""}{inr(Math.abs(v))}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="source">* Part year. Source: AMFI monthly reports. The table scrolls sideways on small screens.</p>
      </section>
    </div>
  );
}
