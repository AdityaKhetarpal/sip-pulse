export const dynamic = "force-static";
import { ImageResponse } from "next/og";
import { overview } from "@/lib/data";

// The picture shown when a link to the site is shared (1200x630). Numbers come from the same data files as the site.
export const alt = "SIP Pulse: when the Nifty falls, the money keeps coming";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const o = overview;
  const n = o.results.fall_months.length;
  const stats = [
    [`${n} of ${n}`, "market falls with money still coming in"],
    [String(o.inflow_streak), "months of inflows in a row"],
    [`₹${Math.round(o.latest.sip).toLocaleString("en-IN")} cr`, "SIP money in a month"],
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0a0d10", color: "#ffffff", padding: "70px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 32 32">
            <rect x="1.5" y="1.5" width="29" height="29" rx="6" fill="none" stroke="#ffffff" strokeWidth="2" />
            <path d="M5 18 H11 L13.5 11 L17 23 L19.5 15 L21 18 H27" fill="none" stroke="#3fcf8e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 32, fontWeight: 700 }}>SIP Pulse</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>When the Nifty falls, the money keeps coming.</div>
          <div style={{ fontSize: 26, color: "#98a2ad" }}>91 months of AMFI mutual fund data, April 2019 to October 2026, put to a locked test</div>
        </div>
        <div style={{ display: "flex", gap: 60 }}>
          {stats.map(([v, l]) => (
            <div key={l} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: "#3fcf8e" }}>{v}</div>
              <div style={{ fontSize: 20, color: "#98a2ad" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
