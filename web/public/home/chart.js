// SIP Pulse home charts: plain SVG strings, so the same code draws the build-time picture (Node) and the live,
// readable chart in the browser. Colours come from the page's tokens (home.css).

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const label = (m) => `${MONTHS[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
export const inr = (v) => Math.round(v).toLocaleString("en-IN");
const short = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${Math.round(v)}`);
const money = (v) => (v === 0 ? "0" : `${v < 0 ? "−" : ""}₹${short(Math.abs(v))}`);
const f1 = (v) => v.toFixed(1);

/** The 91-month chart. Bars: net money into equity funds. Green line: SIP money. Red bands: fall months.
 *  opts.axes false draws the picture alone (the hero window). Returns { svg, geo } where geo maps x to a month. */
export function pulse(data, W, opts = {}) {
  const axes = opts.axes !== false;
  const narrow = W < 560;
  const H = opts.height ?? (narrow ? 280 : 340);
  const L = axes ? (narrow ? 44 : 54) : 4, R = axes ? 8 : 4, T = 10, B = axes ? 26 : 6;
  const top = Math.max(...data.map((d) => Math.max(d.equity ?? 0, d.sip ?? 0)));
  const bottom = Math.min(0, ...data.map((d) => d.equity ?? 0));
  const step = 10000;
  const ymax = Math.ceil(top / step) * step, ymin = Math.floor(bottom / step) * step;
  const n = data.length, bw = (W - L - R) / n;
  const x = (i) => L + i * bw + bw / 2;
  const y = (v) => T + (H - T - B) * (1 - (v - ymin) / (ymax - ymin));
  let s = "";
  data.forEach((d, i) => { if (d.fall) s += `<rect class="c-band" x="${f1(x(i) - bw / 2)}" y="${T}" width="${f1(bw)}" height="${H - T - B}"/>`; });
  if (axes) {
    for (let v = ymin; v <= ymax; v += step) s += `<line class="c-grid" x1="${L}" x2="${W - R}" y1="${f1(y(v))}" y2="${f1(y(v))}"/><text x="${L - 6}" y="${f1(y(v) + 4)}" text-anchor="end">${money(v)}</text>`;
    data.forEach((d, i) => { if (d.month.endsWith("-01")) s += `<text x="${f1(x(i))}" y="${H - 6}" text-anchor="middle">${narrow ? "’" + d.month.slice(2, 4) : d.month.slice(0, 4)}</text>`; });
  }
  data.forEach((d, i) => {
    if (d.equity == null) return;
    const y0 = y(0), y1 = y(d.equity);
    s += `<rect class="${d.equity < 0 ? "c-bar c-bar--neg" : "c-bar"}" data-i="${i}" x="${f1(x(i) - bw * 0.36)}" width="${f1(Math.max(1, bw * 0.72))}" y="${f1(Math.min(y0, y1))}" height="${f1(Math.abs(y1 - y0))}"/>`;
  });
  s += `<line class="c-zero" x1="${L}" x2="${W - R}" y1="${f1(y(0))}" y2="${f1(y(0))}"/>`;
  const sip = data.map((d, i) => `${i ? "L" : "M"}${f1(x(i))},${f1(y(d.sip))}`).join("");
  s += `<path class="c-sip" d="${sip}" pathLength="1"/>`;
  s += `<g class="c-cursor" hidden><line y1="${T}" y2="${H - B}"/><circle r="4"/></g>`;
  const svg = `<svg class="c-pulse" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"${axes ? "" : " preserveAspectRatio=\"none\""} aria-hidden="true" focusable="false">${s}</svg>`;
  return { svg, geo: { L, bw, n, x, y } };
}

/** A small five-month chart for one fall: the month before, the fall, three after. Bars: equity inflows; line: SIP. */
export function fallMini(rows, W = 400, H = 220, top = null) {
  const L = 8, R = 8, T = 16, B = 30;
  // top: one scale shared by every fall's chart, so they compare across years
  const vmax = top ?? Math.ceil(Math.max(...rows.map((r) => Math.max(r.equity, r.sip))) / 5000) * 5000;
  const n = rows.length, bw = (W - L - R) / n;
  const x = (i) => L + i * bw + bw / 2;
  const y = (v) => T + (H - T - B) * (1 - v / vmax);
  let s = "";
  rows.forEach((r, i) => {
    if (r.offset === 0) s += `<rect class="c-band" x="${f1(x(i) - bw / 2)}" y="${T - 8}" width="${f1(bw)}" height="${H - T - B + 8}"/>`;
    s += `<rect class="c-bar" x="${f1(x(i) - bw * 0.3)}" width="${f1(bw * 0.6)}" y="${f1(y(r.equity))}" height="${f1(y(0) - y(r.equity))}"/>`;
    s += `<text x="${f1(x(i))}" y="${H - 9}" text-anchor="middle">${MONTHS[+r.month.slice(5, 7) - 1]}</text>`;
  });
  s += `<line class="c-zero" x1="${L}" x2="${W - R}" y1="${f1(y(0))}" y2="${f1(y(0))}"/>`;
  s += `<path class="c-sip c-sip--still" d="${rows.map((r, i) => `${i ? "L" : "M"}${f1(x(i))},${f1(y(r.sip))}`).join("")}"/>`;
  rows.forEach((r, i) => { s += `<circle class="c-dot" cx="${f1(x(i))}" cy="${f1(y(r.sip))}" r="3.5"/>`; });
  return `<svg class="c-mini" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${s}</svg>`;
}

/** SIP money each month as one line, stretched to its box (its labels are HTML beside it, so they never shrink). */
export function sipGrowth(data, W = 520, H = 300) {
  const v = data.map((d) => d.sip), vmax = Math.max(...v) * 1.04;
  const x = (i) => W * (i / (data.length - 1));
  const y = (s) => H * (1 - s / vmax);
  const d = data.map((m, i) => `${i ? "L" : "M"}${f1(x(i))},${f1(y(m.sip))}`).join("");
  const s = `<path class="c-area" d="${d}L${W},${H}L0,${H}Z"/><path class="c-sip c-sip--still" d="${d}" vector-effect="non-scaling-stroke"/>` +
    `<line class="c-zero" x1="0" x2="${W}" y1="${H}" y2="${H}" vector-effect="non-scaling-stroke"/>`;
  return `<svg class="c-growth" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${s}</svg>`;
}

/** One locked-test answer as a picture: the two medians as bars, then the gap with its 90% range against zero. */
export function range(t, W = 640, H = 480) {
  const L = 250, R = 56;
  const lo = Math.min(-5, t.low, t.after_fall_median, t.other_median), hi = Math.max(5, t.high, t.after_fall_median, t.other_median);
  const pad = (hi - lo) * 0.08, a = lo - pad, b = hi + pad;
  const x = (v) => L + (W - L - R) * ((v - a) / (b - a));
  const p = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}%`;
  const bar = (yy, v, cls, name) =>
    `<text class="c-k" x="${L - 18}" y="${yy + 28}" text-anchor="end">${name}</text>` +
    `<rect class="${cls}" x="${f1(Math.min(x(0), x(v)))}" y="${yy}" width="${f1(Math.abs(x(v) - x(0)))}" height="40"/>` +
    // a short negative bar has no room for its figure on the left (the row's name is there): it goes right of zero
    (v < 0 && x(v) - 10 - 90 < L ? `<text class="c-v" x="${f1(x(0) + 10)}" y="${yy + 28}" text-anchor="start">${p(v)}</text>`
      : `<text class="c-v" x="${f1(v < 0 ? x(v) - 10 : x(v) + 10)}" y="${yy + 28}" text-anchor="${v < 0 ? "end" : "start"}">${p(v)}</text>`);
  let s = `<line class="c-zero" x1="${f1(x(0))}" x2="${f1(x(0))}" y1="60" y2="${H - 70}"/>`;
  s += bar(96, t.after_fall_median, "c-bar c-bar--fall", t.fallName ?? "After a fall");
  s += bar(176, t.other_median, "c-bar", "Other months");
  const gy = 330;
  s += `<text class="c-k" x="${L - 18}" y="${gy + 8}" text-anchor="end">Gap, 90% range</text>`;
  s += `<line class="c-range" x1="${f1(x(t.low))}" x2="${f1(x(t.high))}" y1="${gy}" y2="${gy}"/>`;
  s += `<line class="c-range" x1="${f1(x(t.low))}" x2="${f1(x(t.low))}" y1="${gy - 16}" y2="${gy + 16}"/><line class="c-range" x1="${f1(x(t.high))}" x2="${f1(x(t.high))}" y1="${gy - 16}" y2="${gy + 16}"/>`;
  s += `<circle class="c-gap" cx="${f1(x(t.gap))}" cy="${gy}" r="10"/>`;
  s += `<text class="c-s" x="${f1(x(t.low))}" y="${gy + 52}" text-anchor="middle">${p(t.low)}</text><text class="c-s" x="${f1(x(t.high))}" y="${gy + 52}" text-anchor="middle">${p(t.high)}</text>`;
  s += `<text class="c-s" x="${f1(x(0))}" y="44" text-anchor="middle">0</text>`;
  return `<svg class="c-range-chart" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${s}</svg>`;
}

/** The live chart in the browser: redraws at its box's width; hover, tap or arrow keys read a month. */
export function mount(el, data) {
  const plot = el.querySelector("[data-plot]");
  const out = el.querySelector("[data-readout]");
  const idle = out.textContent;
  let geo, hover = null;
  const draw = () => {
    const W = Math.max(300, Math.round(plot.clientWidth));
    const H = Math.max(220, Math.round(plot.clientHeight));
    const r = pulse(data, W, { height: H });
    plot.innerHTML = r.svg; geo = r.geo; show(hover);
  };
  const show = (i) => {
    hover = i;
    const g = plot.querySelector(".c-cursor");
    plot.querySelectorAll(".c-bar.is-on").forEach((b) => b.classList.remove("is-on"));
    if (i == null) { if (g) g.hidden = true; out.textContent = idle; return; }
    const d = data[i];
    if (g) {
      g.hidden = false;
      g.querySelector("line").setAttribute("x1", geo.x(i)); g.querySelector("line").setAttribute("x2", geo.x(i));
      g.querySelector("circle").setAttribute("cx", geo.x(i)); g.querySelector("circle").setAttribute("cy", geo.y(d.sip));
    }
    plot.querySelector(`.c-bar[data-i="${i}"]`)?.classList.add("is-on");
    const ret = d.nifty_ret == null ? "" : `, Nifty <span class="${d.fall ? "is-fall" : ""}">${d.nifty_ret > 0 ? "+" : ""}${d.nifty_ret.toFixed(1)}%</span>`;
    out.innerHTML = `<b>${label(d.month)}</b>${ret}, into equity funds <b>₹${inr(d.equity)} crore</b>, SIPs <b>₹${inr(d.sip)} crore</b>`;
  };
  const pick = (cx) => {
    const r = plot.getBoundingClientRect();
    const px = ((cx - r.left) / r.width) * plot.clientWidth;
    show(Math.max(0, Math.min(geo.n - 1, Math.floor((px - geo.L) / geo.bw))));
  };
  plot.addEventListener("pointermove", (e) => pick(e.clientX));
  plot.addEventListener("pointerdown", (e) => pick(e.clientX));
  plot.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") show(null); });
  plot.addEventListener("blur", () => show(null));
  plot.addEventListener("keydown", (e) => {
    const n = data.length;
    if (e.key === "Home") { e.preventDefault(); show(0); }
    else if (e.key === "End") { e.preventDefault(); show(n - 1); }
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const st = e.key === "ArrowRight" ? 1 : -1;
      show(Math.max(0, Math.min(n - 1, (hover ?? (st > 0 ? -1 : n)) + st)));
    }
  });
  new ResizeObserver(draw).observe(plot);
  draw();
}
