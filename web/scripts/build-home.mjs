// Builds the SIP Pulse home page (public/index.html) from the data in public/data, on the taste-skill kit in
// public/assets. Run before `next build`: npm run build does it. Every number on the page comes from the data.
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { createHash } from "node:crypto";
import { transformSync } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pulse, fallMini, range, sipGrowth, label, inr } from "../public/home/chart.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => JSON.parse(readFileSync(join(root, "public/data", f), "utf8"));
const monthly = read("monthly.json").filter((m) => m.in_test);
const falls = read("falls.json");
const o = read("overview.json");
const r = o.results;

const FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const long = (m) => `${FULL[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const crore = (v) => `₹${inr(v)} crore`;
const pct = (v, d = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(d)}%`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const nFalls = r.fall_months.length;
const kept = r.fall_months.filter((f) => f.equity_inflow_cr > 0).length;
const lowest = Math.min(...r.fall_months.map((f) => f.equity_inflow_cr));
const ex = r.exploratory_fall_month;
const sipGap = Math.abs(Math.round(r.h2_rupees.gap / 10) * 10);
const first = o.window[0], last = o.latest.month;

const ARROW = `<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>`;
const MARK = `<svg class="sp-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 18 H11 L13.5 11 L17 23 L19.5 15 L21 18 H27" fill="none" stroke="var(--p-accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const DOTS = `<span class="ui-dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
const MAIN = "See every fall";

// the list pane: the twelve latest months, newest first
const recent = monthly.slice(-12).reverse();
const rows = recent.map((m) => `
          <li class="ui-win__row" data-row><span class="ui-avatar" data-tone="${m.fall ? 2 : 4}">${m.month.slice(2, 4)}</span><span class="ui-win__who">${label(m.month)}</span><span class="ui-win__sub">Nifty ${pct(m.nifty_ret)} · ₹${inr(m.equity)} cr in</span><span class="ui-win__st${m.fall ? " is-you" : " is-done"}" data-st>${m.fall ? "Fall" : "Inflow"}</span><span class="ui-win__age">SIP ₹${(m.sip / 1000).toFixed(1)}k</span></li>`).join("");

// the four deepest falls with a full window (the month before and three after), no two windows sharing a fall
const idx = (m) => +m.slice(0, 4) * 12 + +m.slice(5, 7);
const deepest = [...falls].filter((f) => f.rows.length === 5).sort((a, b) => a.nifty_ret - b.nifty_ret)
  .reduce((keep, f) => (keep.some((g) => Math.abs(idx(g.month) - idx(f.month)) < 3) ? keep : [...keep, f]), []).slice(0, 4);
const fallCols = deepest.map((f) => {
  const at = f.rows.find((x) => x.offset === 0);
  return `
          <div class="falls__col">
            <p class="falls__month">${label(f.month)}<span class="falls__drop">Nifty ${pct(f.nifty_ret)}</span></p>
            <p class="falls__fig">₹${inr(at.equity)} crore<span>into equity funds</span></p>
            <div class="falls__plot" role="img" aria-label="Equity inflows and SIP money from ${label(f.rows[0].month)} to ${label(f.rows.at(-1).month)}, with ${label(f.month)} marked">${fallMini(f.rows, 300, 240)}</div>
          </div>`;
}).join("");

const steps = [
  { t: { ...r.h1, fallName: "After a fall" }, h: "Equity inflows dip after a fall, maybe by chance",
    p: `A median ${pct(r.h1.after_fall_median)} the month after, against ${pct(r.h1.other_median)} in other months. With ${r.h1.n_after} falls, the gap’s 90% range still crosses zero.`,
    a: `Equity inflows the month after a fall: median ${pct(r.h1.after_fall_median)}, other months ${pct(r.h1.other_median)}, gap 90% range ${pct(r.h1.low)} to ${pct(r.h1.high)}` },
  { t: { ...r.h2, fallName: "After a fall" }, h: "SIP money dips about 1% after a fall",
    p: `A median ${pct(r.h2.after_fall_median)} against ${pct(r.h2.other_median)}: about ₹${inr(sipGap)} crore a month. The whole 90% range sits below zero.`,
    a: `SIP money the month after a fall: median ${pct(r.h2.after_fall_median)}, other months ${pct(r.h2.other_median)}, gap 90% range ${pct(r.h2.low)} to ${pct(r.h2.high)}` },
  { t: { ...ex, fallName: "In the fall month" }, h: "Inflows rose in the fall month itself",
    p: `Up in ${ex.rose} of ${ex.of} fall months, a median ${pct(ex.after_fall_median)}. Found after the locked test, and its range includes zero, so it is a lead, not a finding.`,
    a: `Equity inflows in the fall month: median ${pct(ex.after_fall_median)}, other months ${pct(ex.other_median)}, gap 90% range ${pct(ex.low)} to ${pct(ex.high)}` },
];
const stepHtml = steps.map((s) => `
          <li class="mo-pc__step">
            <h3>${s.h}</h3>
            <p>${s.p}</p>
            <figure class="mo-pc__visual" role="img" aria-label="${esc(s.a)}">${range(s.t)}</figure>
          </li>`).join("");

const ledger = [
  [`Months checked, ${long(first)} to ${long(last)}`, `${o.months}`],
  ["Months the Nifty 50 fell 5% or more", `${nFalls}`],
  ["Fall months with net money into equity funds", `${kept} of ${nFalls}`],
  ["Smallest net inflow in a fall month", crore(lowest)],
  [`Months in a row of net inflows, to ${label(last)}`, `${o.inflow_streak}`],
  [`SIP money in ${long(first)}`, crore(o.sip_growth.from)],
  [`SIP money in ${long(last)}`, crore(o.latest.sip)],
  ["Data checks that failed", `${o.checks.failed} of ${o.checks.run}`],
].map(([k, v]) => `<li><span class="rows__name">${k}</span><span class="rows__value">${v}</span></li>`).join("\n            ");

const hero = pulse(monthly, 880, { axes: false, height: 300 }).svg;
const live = pulse(monthly, 700, { height: 380 }).svg;

const LD = { "@context": "https://schema.org", "@type": "Dataset", name: "SIP Pulse: Indian mutual fund flows during Nifty 50 falls", description: `Monthly net inflows into open-ended equity mutual funds and SIP contributions in India, ${long(first)} to ${long(last)}, with the months the Nifty 50 fell 5% or more and a pre-registered test of what happened after them.`, url: "https://sip-pulse.vercel.app", temporalCoverage: `${first}/${last}`, keywords: ["mutual funds", "SIP", "AMFI", "Nifty 50", "India"], isBasedOn: ["https://www.amfiindia.com/research-information/amfi-monthly"], sameAs: "https://github.com/AdityaKhetarpal/sip-pulse", creator: { "@type": "Person", name: "Aditya Khetarpal", url: "https://www.linkedin.com/in/adityakhetarpal" } };

// the block start.mjs brand printed (kept in scripts/brand.html): its kit stylesheets are bundled and minified into
// one file with a content hash in its name (cached for a year), its :root palette stays inline; the Google Fonts
// links are swapped for the same two families self-hosted (public/fonts)
const brandRaw = readFileSync(join(root, "scripts/brand.html"), "utf8").replace(/<!--.*?-->\n?/g, "");
const kitCss = [...brandRaw.matchAll(/<link rel="stylesheet" href="assets\/([^"]+)">/g)].map((m) => "assets/" + m[1]);
const palette = brandRaw.match(/<style>[\s\S]*?<\/style>/)[0];
for (const f of readdirSync(join(root, "public/home"))) if (/^site-.*\.css$/.test(f)) unlinkSync(join(root, "public/home", f));
const bundle = (name, files) => {
  const css = files.map((f) => readFileSync(join(root, "public", f), "utf8")).join("\n");
  const out = transformSync(css, { loader: "css", minify: true }).code;
  const file = `site-${name}.${createHash("sha256").update(out).digest("hex").slice(0, 10)}.css`;
  writeFileSync(join(root, "public/home", file), out);
  return `<link rel="stylesheet" href="/home/${file}">`;
};
// the order is the kit's: its stylesheets, the palette, the fragments' own CSS (ui.js and moments.js look for these
// three by name, so they stay separate files), then the diagram and the page's own CSS
// motion.css stays its own file too: the checker and the kit find the micro-interaction layer by that name
const STYLES = [
  bundle("kit", kitCss.filter((f) => !f.endsWith("motion/motion.css"))),
  '<link rel="stylesheet" href="/assets/motion/motion.css">',
  palette,
  '<link rel="stylesheet" href="/assets/ui/base.css">',
  '<link rel="stylesheet" href="/assets/ui/window/fragment.css">',
  '<link rel="stylesheet" href="/assets/moments/pinned-chapters/moment.css">',
  bundle("page", ["assets/diagrams/diagram.css", "home/home.css"]),
].join("\n");
const FONTS = `<link rel="preload" href="/fonts/instrument-sans-latin-standard-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/fonts/fonts.css">`;

const html = `<!doctype html>
<html lang="en-IN" data-type="software" data-radius="sharp" data-ground="sage" data-buttons="solid" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SIP Pulse: Indian mutual fund inflows in Nifty 50 falls</title>
<meta name="description" content="${o.months} months of AMFI data, ${long(first)} to ${long(last)}: what equity fund inflows and SIP money did in the ${nFalls} months the Nifty 50 fell 5% or more, with a locked test.">
<meta property="og:type" content="website">
<meta property="og:title" content="SIP Pulse: fund inflows held in ${nFalls} Nifty falls">
<meta property="og:description" content="Equity funds took in more than they paid out in every fall month since 2019. ${o.months} months of AMFI data, tested.">
<meta property="og:image" content="https://sip-pulse.vercel.app/share.jpg">
<meta property="og:url" content="https://sip-pulse.vercel.app/">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="https://sip-pulse.vercel.app/">
<meta name="author" content="Aditya Khetarpal">
<meta name="site-kind" content="software">
<meta name="page-type" content="software">
${FONTS}
${STYLES}
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
<script src="/assets/backgrounds/backgrounds.js"></script>
<script>document.documentElement.classList.add('mo-js');setTimeout(()=>document.documentElement.classList.add('mo-safe'),2500)</script>
<link rel="modulepreload" href="/assets/moments/moments.js">
<link rel="modulepreload" href="/assets/moments/lib.js">
<link rel="modulepreload" href="/assets/moments/pinned-chapters/moment.js">
<link rel="modulepreload" href="/assets/system.js">
<link rel="modulepreload" href="/assets/motion/motion.js">
<link rel="modulepreload" href="/assets/layout/layout.js">
<link rel="modulepreload" href="/assets/ui/ui.js">
<link rel="modulepreload" href="/home/chart.js">
<link rel="preload" href="/data/monthly.json" as="fetch" crossorigin>
<script type="application/ld+json">${JSON.stringify(LD)}</script>
<script>window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };</script>
<script defer src="/_vercel/speed-insights/script.js"></script>
</head>
<body>
<!-- type: software (a fintech data study; site-kind software)
     deal: hero centred, nav-centre, close-word, footer-dark, rhythm space, buttons solid, mark: the client's own SIP Pulse mark,
     palette: the client's own colours (start.mjs brand), type instrument, radius sharp, ground sage, no effect (the caustics shader was taken out for speed, 19 Nov 2026)
     moments: pinned-chapters (#answers)
     Generated by scripts/build-home.mjs from public/data: edit the script, not this file. -->
<header class="nav nav--centre">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Skip to content</a>
    <a class="nav__logo" href="#top">${MARK}SIP Pulse</a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__item">
        <a class="nav__link" href="#record">Record <svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
        <div class="nav__menu">
          <div class="wrap grid">
            <div class="menu-col span-3">
              <p class="t-label">On this page</p>
              <a href="#record">Every month<span>Inflows, SIPs and the Nifty</span></a>
              <a href="#ledger">The record<span>Eight figures from AMFI</span></a>
              <a href="#answers">The locked test<span>Three questions answered</span></a>
            </div>
            <div class="menu-col span-3">
              <p class="t-label">Pages</p>
              <a href="/falls/">Every fall<span>Seven months, before and after</span></a>
              <a href="/money/">Where the money goes<span>Fund categories by year</span></a>
              <a href="/method/">How we tested it<span>The rules, fixed in advance</span></a>
            </div>
          </div>
        </div>
      </div>
      <div class="nav__item"><a class="nav__link" href="#answers">Answers</a></div>
      <div class="nav__item"><a class="nav__link" href="#falls">Falls</a></div>
      <div class="nav__item"><a class="nav__link" href="#questions">Questions</a></div>
      <div class="nav__item"><a class="nav__link" href="/method/">Method</a></div>
    </nav>
    <div class="nav__actions">
      <a class="btn btn--primary" href="/falls/">${MAIN}</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>
<main id="top">
  <section class="hero hero--centred" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text">
      <div class="hero__c">
        <h1 id="hero-h">Fund inflows held in ${nFalls} Nifty falls</h1>
        <p class="hero__lead">In each month since 2019 that the Nifty 50 fell 5% or more, equity funds took in more money than they paid out.</p>
        <div class="btn-row"><a class="btn btn--primary" href="/falls/">${MAIN}${ARROW}</a><a class="btn btn--secondary" href="/method/">Read the method</a></div>
      </div>
      <div class="hero__window" role="img" aria-label="Chart of monthly net money into equity funds and SIP money, ${long(first)} to ${long(last)}: SIP money rises from ${crore(o.sip_growth.from)} to ${crore(o.latest.sip)}, and the ${nFalls} fall months are marked">
        <div class="ly-piece ui ui-panel hero-win" aria-hidden="true">
          <div class="ui-win__bar">${DOTS}<span class="ui-win__crumb">SIP Pulse <i>/</i> <b>Equity funds and SIPs</b></span><span class="ui-spacer"></span><span class="hero-win__src">${label(first)} to ${label(last)}</span></div>
          <div class="hero-win__key"><span><i class="k-bar"></i>Into equity funds</span><span><i class="k-line"></i>SIP money</span><span><i class="k-band"></i>Fall month</span></div>
          <div class="hero-win__plot">${hero}</div>
        </div>
      </div>
    </div></div>
  </section>

  <section class="section" id="record" aria-labelledby="record-h">
    <div class="wrap">
      <div class="grid grid--top">
        <h2 class="span-5" id="record-h">Every month since April 2019</h2>
        <p class="span-6 start-7 muted">Grey bars are net money into active equity funds, the green line is SIP money, and red bands mark fall months. Hover, tap or use the arrow keys to read any month. <a class="link" href="https://github.com/AdityaKhetarpal/sip-pulse">Get the notebooks</a></p>
      </div>
      <div class="ui app fill" role="group" aria-label="The latest twelve months beside the 91-month chart">
        <div class="app__pane app__pane--list">
          <div class="ui ui-panel ui-win" data-ui="window" aria-label="The latest twelve months">
            <div class="ui-win__bar">${DOTS}<span class="ui-win__crumb">SIP Pulse <i>/</i> <b>Months</b></span><span class="ui-spacer"></span></div>
            <div class="ui-win__body">
              <nav class="ui-win__side" aria-hidden="true">
                <span class="ui-win__nav is-on">All months<em>${o.months}</em></span>
                <span class="ui-win__nav">Fall months<em>${nFalls}</em></span>
                <span class="ui-win__nav">Outflows<em>${o.outflow_months}</em></span>
              </nav>
              <div class="ui-win__main">
                <div class="ui-win__cols" aria-hidden="true"><span>Month</span><span>Nifty, equity inflow</span><span>Type</span><span>SIP</span></div>
                <ul class="ui-win__rows">${rows}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="app__pane app__pane--open">
          <div class="ui ui-panel live" data-live>
            <div class="ui-win__bar"><span class="ui-win__crumb">Equity funds and SIPs <i>/</i> <b>₹ crore a month</b></span><span class="ui-spacer"></span><span class="hero-win__src">AMFI</span></div>
            <div class="live__plot" data-plot tabindex="0" role="img" aria-label="Monthly equity fund inflows and SIP money, ${long(first)} to ${long(last)}, with the fall months marked. Use the left and right arrow keys to step through the months.">${live}</div>
            <p class="live__readout" data-readout aria-live="polite">Latest, ${label(last)}: into equity funds ₹${inr(o.latest.equity)} crore, SIPs ₹${inr(o.latest.sip)} crore.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="ledger" aria-labelledby="ledger-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="section-head span-5">
          <h2 id="ledger-h">Inflows and SIPs in eight lines</h2>
          <p>Every figure comes from AMFI’s monthly reports. Amounts are ₹ crore in one month.</p>
          <div class="panel"><div class="ui ui-panel sip-chart" role="img" aria-label="SIP money each month, from ${crore(o.sip_growth.from)} in ${long(first)} to ${crore(o.latest.sip)} in ${long(last)}"><div class="sip-chart__ends" aria-hidden="true"><span>${label(first)}<b>₹${inr(o.sip_growth.from)} cr</b></span><span>${label(last)}<b>₹${inr(o.latest.sip)} cr</b></span></div>${sipGrowth(monthly)}</div></div>
        </div>
        <ul class="rows span-6 start-7">
            ${ledger}
        </ul>
      </div>
    </div>
  </section>

  <section class="section" id="answers" style="--h: 2" data-moment="pinned-chapters" aria-labelledby="answers-h">
    <div class="wrap mo-pc__grid">
      <div class="mo-pc__text">
        <h2 id="answers-h">Three answers on inflows and SIPs</h2>
        <ol class="mo-pc__steps">${stepHtml}
        </ol>
      </div>
      <div class="mo-pc__visuals frame"></div>
    </div>
  </section>

  <section class="section" id="falls" aria-labelledby="falls-h">
    <div class="wrap">
      <div class="section-head">
        <h2 id="falls-h">The four deepest Nifty falls, month by month</h2>
        <p>Each chart runs from the month before a fall to three months after. Bars are equity inflows, the line is SIP money.</p>
      </div>
      <div class="ui ui-panel falls fill">
        <div class="ui-win__bar">${DOTS}<span class="ui-win__crumb">SIP Pulse <i>/</i> <b>Deepest falls</b></span><span class="ui-spacer"></span><span class="hero-win__src">₹ crore a month</span></div>
        <div class="falls__cols">${fallCols}
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="questions" aria-labelledby="questions-h">
    <div class="wrap">
      <div class="grid grid--top fill">
        <div class="section-head span-5">
          <h2 id="questions-h">Questions about the data</h2>
          <div class="panel"><div class="dg" data-diagram data-dg-still><script type="application/json">{"layout": "fanin", "alt": "AMFI monthly reports, AMFI SIP data and Nifty 50 closes go into DuckDB, where 741 checks run before the locked test.", "sources": [{"label": "AMFI monthly reports", "icon": "xlsx", "sub": "91 Excel files"}, {"label": "AMFI SIP data", "icon": "xlsx", "sub": "SIP table"}, {"label": "Nifty 50 closes", "icon": "ui:chart-line", "sub": "Yahoo Finance"}], "target": {"label": "DuckDB", "icon": "si:duckdb"}, "then": {"label": "Locked test", "icon": "si:scipy", "meta": "741 checks"}}</script></div></div>
        </div>
        <div class="faq span-6 start-7">
          <div class="faq__item"><h3>Which months count as Nifty falls?</h3><p>A month the Nifty 50 closed 5% or more below the previous month-end. ${nFalls} months since ${long(first)} qualify.</p></div>
          <div class="faq__item"><h3>What is an SIP?</h3><p>A systematic investment plan: a fixed amount invested every month, set up once and paid automatically.</p></div>
          <div class="faq__item"><h3>Where do the inflow figures come from?</h3><p>AMFI’s monthly reports and SIP data, read into DuckDB, with Nifty 50 month-end closes from Yahoo Finance. ${o.checks.run} checks ran; ${o.checks.failed} failed.</p></div>
          <div class="faq__item"><h3>Which inflow tests were fixed in advance?</h3><p>The two tests on the month after a fall, written down before any download. The fall-month finding came later.</p></div>
        </div>
      </div>
    </div>
  </section>
</main>
<footer class="footer closing footer--dark ground-inverse" id="contact" aria-labelledby="close-h">
  <div class="wrap">
    <div class="closing__cta close--word">
      <div class="section-head--split">
        <div><h2 id="close-h">Every fall month, side by side</h2><p class="t-lead">All ${nFalls}, each with the month before and three after, in ₹ crore.</p></div>
        <a class="btn btn--primary" href="/falls/">${MAIN}${ARROW}</a>
      </div>
      <p class="close__word" aria-hidden="true">SIP Pulse</p>
    </div>
    <div class="closing__links">
      <div class="grid">
        <div class="span-4 stack-4">
          <a class="nav__logo" href="#top">${MARK}SIP Pulse</a>
          <p class="footer__lede">Indian mutual fund flows against the Nifty 50, from AMFI data.</p>
        </div>
        <div class="span-3 start-7 footer__col"><h3>Pages</h3><ul><li><a href="/falls/">Every fall</a></li><li><a href="/money/">Where the money goes</a></li><li><a href="/method/">How we tested it</a></li><li><a href="https://www.linkedin.com/in/adityakhetarpal">Aditya Khetarpal on LinkedIn</a></li></ul></div>
        <div class="span-3 start-10 footer__col"><h3>Data</h3><ul><li><a href="https://www.amfiindia.com/research-information/amfi-monthly">AMFI monthly reports</a></li><li><a href="https://www.amfiindia.com/mutual-fund">AMFI SIP data</a></li><li><a href="https://finance.yahoo.com/quote/%5ENSEI/history/">Nifty 50 closes, Yahoo Finance</a></li><li><a href="https://github.com/AdityaKhetarpal/sip-pulse">Notebooks on GitHub</a></li></ul></div>
      </div>
      <div class="footer__legal">
        <span>&copy; 2026 SIP Pulse. For education, not investment advice. Not affiliated with AMFI or NSE.</span>
        <div class="socials"></div>
      </div>
    </div>
  </div>
</footer>
<script type="module" src="/assets/system.js"></script>
<script type="module" src="/assets/motion/motion.js"></script>
<script type="module" src="/assets/layout/layout.js"></script>
<script type="module" src="/assets/diagrams/mount.js"></script>
<script type="module">
import { mount } from "/home/chart.js";
const el = document.querySelector("[data-live]");
fetch("/data/monthly.json").then((r) => r.json()).then((all) => mount(el, all.filter((m) => m.in_test))).catch(() => {});
</script>
</body>
</html>
`;

writeFileSync(join(root, "public/index.html"), html);
console.log(`wrote public/index.html (${(html.length / 1024).toFixed(0)} kB)`);
