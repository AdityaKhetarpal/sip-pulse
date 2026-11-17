"use client";
import { useEffect, useRef, useState } from "react";
import type { Month } from "@/lib/data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (m: string) => `${MONTHS[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const inr = (v: number) => Math.round(v).toLocaleString("en-IN");
const short = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${Math.round(v)}`);
const money = (v: number) => (v === 0 ? "0" : `${v < 0 ? "−" : ""}₹${short(Math.abs(v))}`);
const level = (v: number) => `${(v / 1000).toFixed(1)}k`;

/**
 * The main chart. Bars: net money into equity funds each month. Green line: SIP contributions (drawn like a heartbeat
 * on load). Red bands: months the Nifty 50 fell 5% or more. A thin panel below shows the Nifty itself.
 * Hover or tap a month to read its numbers. The chart redraws at the width of its box, so labels stay readable on phones.
 */
export default function PulseChart({ data }: { data: Month[] }) {
  const box = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const [W, setW] = useState(900);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // draw the SIP line once, like a heartbeat monitor
  useEffect(() => {
    const path = line.current;
    if (!path || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    let tween: { kill: () => void } | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      import("gsap").then(({ gsap }) => {
        tween = gsap.to(path, { strokeDashoffset: 0, duration: 2.4, ease: "power1.inOut", onComplete: () => { path.style.strokeDasharray = "none"; } });
      });
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(path);
    // never leave the line hidden
    const t = setTimeout(() => { path.style.strokeDashoffset = "0"; }, 4000);
    return () => { io.disconnect(); tween?.kill(); clearTimeout(t); };
  }, [W]);

  const narrow = W < 560;
  const H = narrow ? 300 : 360, NH = narrow ? 70 : 84, GAP = 26;
  const L = narrow ? 48 : 54, R = 8, T = 10, B = 24;
  const top = Math.max(...data.map((d) => Math.max(d.equity ?? 0, d.sip ?? 0)));
  const bottom = Math.min(0, ...data.map((d) => d.equity ?? 0));
  const step = 10000;
  const ymax = Math.ceil(top / step) * step, ymin = Math.floor(bottom / step) * step;
  const n = data.length;
  const bw = (W - L - R) / n;
  const x = (i: number) => L + i * bw + bw / 2;
  const y = (v: number) => T + (H - T - B) * (1 - (v - ymin) / (ymax - ymin));
  const ticks: number[] = [];
  for (let v = ymin; v <= ymax; v += step) ticks.push(v);

  const nifty = data.map((d) => d.nifty ?? 0);
  const nmin = Math.min(...nifty) * 0.95, nmax = Math.max(...nifty) * 1.02;
  const ny0 = H + GAP;
  const ny = (v: number) => ny0 + NH * (1 - (v - nmin) / (nmax - nmin));

  const sipPath = data.map((d, i) => (d.sip == null ? "" : `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.sip).toFixed(1)}`)).join("");
  const niftyPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${ny(d.nifty ?? 0).toFixed(1)}`).join("");
  const years = data.map((d, i) => [d.month, i] as const).filter(([m]) => m.endsWith("-01"));
  const total = H + GAP + NH + 22;
  const h = hover != null ? data[hover] : null;

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.floor((px - L) / bw))));
  };

  return (
    <div ref={box} className="chart-box">
      <div className="legend">
        <span><i className="l-bar" />Net money into equity funds</span>
        <span><i className="l-line" />SIP contributions</span>
        <span><i className="l-band" />Nifty 50 fell 5% or more that month</span>
      </div>
      <svg className="chart" width={W} height={total} viewBox={`0 0 ${W} ${total}`} role="img"
        aria-label="Monthly equity fund inflows and SIP contributions, April 2019 to October 2026, with market-fall months marked"
        onMouseMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
        onTouchMove={(e) => pick(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}>
        {data.map((d, i) => d.fall && <rect key={`f${i}`} x={x(i) - bw / 2} y={T} width={bw} height={ny0 + NH - T} fill="var(--fall-band)" />)}
        <g className="axis">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
              <text x={L - 6} y={y(t) + 4} textAnchor="end">{money(t)}</text>
            </g>
          ))}
        </g>
        {data.map((d, i) => d.equity == null ? null : (
          <rect key={i} x={x(i) - bw * 0.36} width={Math.max(1, bw * 0.72)}
            y={Math.min(y(d.equity), y(0))} height={Math.abs(y(d.equity) - y(0))}
            fill={d.equity < 0 ? "var(--bar-neg)" : "var(--bar)"} opacity={hover == null || hover === i ? 1 : 0.75} />
        ))}
        <line className="zero" x1={L} x2={W - R} y1={y(0)} y2={y(0)} />
        <path ref={line} d={sipPath} fill="none" stroke="var(--money)" strokeWidth={narrow ? 2.2 : 2.6} strokeLinejoin="round" strokeLinecap="round" />
        {years.map(([m, i]) => (
          <text key={m} x={x(i)} y={H - 6} textAnchor="middle">{narrow ? `’${m.slice(2, 4)}` : m.slice(0, 4)}</text>
        ))}
        <text x={L} y={ny0 - 8}>Nifty 50</text>
        <path d={niftyPath} fill="none" stroke="var(--ink)" strokeWidth={1.4} strokeLinejoin="round" />
        <text x={L - 6} y={ny(nmax / 1.02) + 4} textAnchor="end">{level(nmax / 1.02)}</text>
        <text x={L - 6} y={ny(nmin / 0.95) + 4} textAnchor="end">{level(nmin / 0.95)}</text>
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={ny0 + NH} stroke="var(--muted)" strokeDasharray="3 3" />
            {h?.sip != null && <circle cx={x(hover)} cy={y(h.sip)} r={4} fill="var(--money)" />}
            <circle cx={x(hover)} cy={ny(h?.nifty ?? 0)} r={3} fill="var(--ink)" />
          </g>
        )}
      </svg>
      <div className="readout" aria-live="polite">
        {h ? (
          <>
            <b>{label(h.month)}</b>
            {h.nifty_ret != null && <> · Nifty <span className={h.fall ? "f" : undefined}>{h.nifty_ret > 0 ? "+" : ""}{h.nifty_ret.toFixed(1)}%</span></>}
            {h.equity != null && <> · into equity funds <b>₹{inr(h.equity)} cr</b></>}
            {h.sip != null && <> · SIPs <b>₹{inr(h.sip)} cr</b></>}
          </>
        ) : "Hover or tap a month to see its numbers. Amounts are ₹ crore per month."}
      </div>
    </div>
  );
}
