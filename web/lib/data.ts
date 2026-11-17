import monthlyJson from "@/public/data/monthly.json";
import fallsJson from "@/public/data/falls.json";
import categoriesJson from "@/public/data/categories.json";
import overviewJson from "@/public/data/overview.json";

export type Month = { month: string; nifty: number | null; nifty_ret: number | null; equity: number | null; sip: number | null; fall: boolean; in_test: boolean };
export type Fall = { month: string; nifty_ret: number; rows: { offset: number; month: string; equity: number | null; sip: number | null }[] };
type Test = { after_fall_median: number; other_median: number; gap: number; low: number; high: number; n_after: number; n_other: number; verdict?: string };

export const monthly = monthlyJson as Month[];
export const falls = fallsJson as Fall[];
export const categories = categoriesJson as {
  months_in_fy: Record<string, number>;
  equity: { fy: string; category: string; inflow: number }[];
  groups: { fy: string; group: string; inflow: number }[];
};
export const overview = overviewJson as unknown as {
  window: [string, string]; months: number;
  latest: { month: string; equity: number; sip: number; nifty_ret: number };
  totals: { equity: number; sip: number };
  outflow_months: number; inflow_streak: number;
  sip_growth: { from: number; to: number };
  checks: { run: number; failed: number };
  results: {
    rule: string; months: number; pre_registered: string;
    fall_months: { month: string; nifty_return_pct: number; equity_inflow_cr: number; sip_cr: number }[];
    h1: Test; h2: Test; h1_rupees: Test; h2_rupees: Test;
    correlation: Record<string, { rho: number; p: number; n: number }>;
    sip_held_after_fall: { count: number; of: number };
    exploratory_fall_month: Test & { rose: number; of: number };
  };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** "2026-10" -> "Oct 2026" */
export const monthName = (m: string) => `${MONTHS[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
/** "2026-10" -> "October 2026" */
export const monthLong = (m: string) => `${FULL[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
/** Indian digit grouping: 1532307 -> "15,32,307" */
export const inr = (v: number, d = 0) => v.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });
/** "₹32,160 crore" */
export const crore = (v: number) => `₹${inr(Math.round(v))} crore`;
/** 1532307 crore -> "₹15.3 lakh crore" */
export const lakhCrore = (v: number) => `₹${(v / 1e5).toFixed(1)} lakh crore`;
export const pct = (v: number, d = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}%`;
