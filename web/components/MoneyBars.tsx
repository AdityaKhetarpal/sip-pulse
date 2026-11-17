"use client";
import { useState } from "react";

type Row = { fy: string; key: string; inflow: number };
const inr = (v: number) => Math.round(v).toLocaleString("en-IN");

/** Diverging bars: money in (green) or out (red) per category, for one financial year at a time. */
export default function MoneyBars({ rows, months, initial }: { rows: Row[]; months: Record<string, number>; initial: string }) {
  const years = Object.keys(months).sort();
  const [fy, setFy] = useState(initial);
  const shown = rows.filter((r) => r.fy === fy).sort((a, b) => b.inflow - a.inflow);
  const max = Math.max(...rows.map((r) => Math.abs(r.inflow)), 1);
  const lo = Math.min(0, ...rows.map((r) => r.inflow));
  const span = max - lo;
  const K = 70;                               // bars use 70% of the track, leaving room for the value label
  const zero = (-lo / span) * K;
  const label = (y: string) => `FY${y.slice(2)}`;

  return (
    <div>
      <div className="fy-pick" role="group" aria-label="Financial year">
        {years.map((y) => (
          <button key={y} type="button" aria-pressed={y === fy} onClick={() => setFy(y)}>
            {label(y)}{months[y] < 12 ? ` (${months[y]} mo)` : ""}
          </button>
        ))}
      </div>
      <div className="dbars">
        {shown.map((r) => {
          const w = (Math.abs(r.inflow) / span) * K;
          const left = r.inflow >= 0 ? zero : zero - w;
          return (
            <div key={r.key} className="dbar">
              <span>{r.key}</span>
              <div className="track" style={{ ["--zero" as string]: `${zero}%` }}>
                <div className={`fill${r.inflow < 0 ? " neg" : ""}`} style={{ left: `${left}%`, width: `${Math.max(w, 0.4)}%` }} />
                <span className="val" style={r.inflow >= 0 ? { left: `calc(${left + w}% + 6px)` } : { left: `calc(${zero}% + 6px)` }}>
                  {r.inflow < 0 ? "−" : ""}₹{inr(Math.abs(r.inflow))} cr
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
