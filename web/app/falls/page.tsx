import type { Metadata } from "next";
import { falls, overview, monthName, monthLong, inr, pct } from "@/lib/data";

export const metadata: Metadata = {
  title: "Every fall",
  description: "Each month since April 2019 that the Nifty 50 fell 5% or more, and what happened to equity fund inflows and SIP contributions around it.",
};

/** Five small bars: equity inflow from the month before the fall to three months after. */
function Bars({ rows }: { rows: { offset: number; equity: number | null }[] }) {
  const W = 300, H = 120, T = 18, B = 18;
  const vals = rows.map((r) => r.equity ?? 0);
  const max = Math.max(...vals, 1), min = Math.min(0, ...vals);
  const y = (v: number) => T + (H - T - B) * (1 - (v - min) / (max - min));
  const bw = W / 5;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Equity inflows around the fall month">
      {rows.map((r, i) => r.equity == null ? null : (
        <g key={r.offset}>
          <rect x={i * bw + bw * 0.18} width={bw * 0.64} y={Math.min(y(r.equity), y(0))} height={Math.max(1, Math.abs(y(r.equity) - y(0)))}
            fill={r.offset === 0 ? "var(--fall)" : "var(--bar)"} opacity={r.offset === 0 ? 0.85 : 1} />
          <text x={i * bw + bw / 2} y={Math.min(y(r.equity), y(0)) - 4} textAnchor="middle">{(r.equity / 1000).toFixed(1)}k</text>
          <text x={i * bw + bw / 2} y={H - 3} textAnchor="middle">{r.offset === 0 ? "fall" : r.offset > 0 ? `+${r.offset}` : r.offset}</text>
        </g>
      ))}
      <line className="zero" x1={0} x2={W} y1={y(0)} y2={y(0)} />
    </svg>
  );
}

export default function Falls() {
  const ex = overview.results.exploratory_fall_month;
  const list = [...falls].sort((a, b) => a.nifty_ret - b.nifty_ret);
  return (
    <div className="wrap">
      <div className="head">
        <div className="kicker">{falls.length} fall months · {monthLong(overview.window[0])} to {monthLong(overview.window[1])}</div>
        <h1>Every fall, month by month</h1>
        <p>
          A fall month is any month the Nifty 50 closed 5% or more below the month before. There were {falls.length}. For each one: net money into equity
          funds and SIP contributions, from the month before to three months after. Biggest fall first.
        </p>
      </div>

      <p className="sub" data-reveal>
        The pattern: in {ex.rose} of {ex.of} falls, equity inflows went up in the fall month itself (the red bar), then eased off in the months that followed.
        SIP contributions barely move. February 2025 is the exception: inflows were already sliding before the fall and kept sliding.
      </p>

      <div className="grid g2" style={{ marginTop: 20 }}>
        {list.map((f) => (
          <article key={f.month} className="card fall-card" data-reveal>
            <div className="meta">
              <h2 style={{ margin: 0 }}>{monthName(f.month)}</h2>
              <span className="drop">Nifty {pct(f.nifty_ret)}</span>
            </div>
            <Bars rows={f.rows} />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Month</th><th className="num">Into equity funds</th><th className="num">SIPs</th></tr>
                </thead>
                <tbody>
                  {f.rows.map((r) => (
                    <tr key={r.offset} style={r.offset === 0 ? { fontWeight: 600 } : undefined}>
                      <td style={{ whiteSpace: "nowrap" }}>{monthName(r.month)}{r.offset === 0 && <span className="small"> · fall</span>}</td>
                      <td className={`num${(r.equity ?? 0) < 0 ? " neg" : ""}`}>{r.equity == null ? "–" : `₹${inr(r.equity)} cr`}</td>
                      <td className="num">{r.sip == null ? "–" : `₹${inr(r.sip)} cr`}</td>
                    </tr>
                  ))}
                  {f.rows.length < 5 && (
                    <tr><td colSpan={3} className="small">Later months come after {monthLong(overview.window[1])}, the end of the test.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
      <p className="source" style={{ marginTop: 18 }}>
        Source: AMFI monthly reports (open-ended equity schemes, net inflow) and AMFI SIP data; Nifty 50 month-end closes from Yahoo Finance. ₹ crore per month.
      </p>
    </div>
  );
}
