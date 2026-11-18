# SIP Pulse: design decisions (design council, 17 Nov 2026)

One question: **when the Nifty 50 falls, do Indian mutual fund inflows keep coming?**
Readers: recruiters and hiring managers at banks and fintechs (30 seconds), and Indian retail investors (a few minutes).

## Hadid: movement through space
- **Opening screen = the answer, then the evidence.** The verdict as a condensed headline and two sentences, then the 91-month chart
  directly under it, in the first screen on a laptop. No stat strip, no "welcome" text.
- **Rooms in order:** the answer and the 91-month chart, the passbook (eight figures, one ruled line each), three questions
  and answers as ruled rows, then the fall months up close and the method. Each room answers one smaller question.
- Nothing fades in as you scroll. Sections are simply there.

## Ive: material
- The material is a **passbook**: tabular figures, exact rupee amounts, ruled lines, label on the left and amount on the right.
- Type: **Anek Latin** at a condensed width (78% for the headline, 84–88% for titles and amounts) and **Mukta** for reading.
  Both were drawn for Indian scripts, which suits an Indian money story; neither is a default web font.
- Two themes from the same tokens: paper-white and ink-dark. No cream or off-white backgrounds.
- Corner radius 6px: precise, not soft. Numbers use tabular figures so columns line up.

## Rams: restraint
- Three type sizes only: display (the answer), title, body (17px). Captions use 15px in a muted colour.
- Labels are sentence case. No all-caps tags, no eyebrow lines above headings, no "A · B · C" strings, no arrows on links.
- Colour carries meaning only:
  - **ink** for flows;
  - **one accent (green)** for money coming in;
  - **red only for market-fall months**;
  - muted grey for the rest.
- No logo wall, no icons for decoration, no pill buttons, no gradient blobs.
- Every chart has a title that is a sentence (the finding), labelled axes with units, and a source and date line.

## Ingels: delight that does a job
- **The pulse.** On load, the SIP contribution line draws itself like a heartbeat monitor (GSAP stroke animation).
  It is the product's name *and* the main finding (the line keeps going through every fall).
- Vanta (NET, very faint) sits behind the opening screen only, as "the market's noise" behind a steady line. It is
  switched off on phones and with reduced motion.
- Lenis gives smooth scrolling between rooms.

## Norman: it teaches itself
- Hover, tap, or focus the chart and use the arrow keys to read any month's exact values. The hint says so once, under the chart.
- Fall months are shaded with a legend entry ("Nifty fell 5% or more"), so the shading needs no explanation elsewhere.
- Plain words: "money in", "fall month", "SIP" explained once on first use (a monthly automatic investment).
- Phone first: charts fit 360px wide; anything wider scrolls inside its own box with a visible hint.

## Tensions, resolved
- **Rams vs Ingels:** the only animation that stays is the pulse line, because it carries the finding.
- **Hadid vs Rams:** dramatic structure (a big headline that leads straight into the chart, rooms) with a quiet surface (three sizes, one accent).

## Revision, 18 Nov 2026 (decision record)
Decided by Aditya: enhance the live site with the frontend-design, design-council, design-critique, design-review,
accessibility-review, portfolio-audit and portfolio-story skills. What changed and why:
- **Type:** IBM Plex Sans replaced by Anek Latin (condensed) and Mukta. Plex read as a generic fintech default.
- **Opening screen:** the four-number stat strip is gone; the chart now follows the headline, and the figures moved to the passbook.
- **Answers:** three identical cards became ruled question-and-answer rows.
- **Motion:** one moment only, the SIP line drawing itself. The scroll fade-ups were removed. Lenis and the faint Vanta net stay.
- **Copy:** the exploratory finding now says plainly that it wasn't tested and that its range includes zero.
- **Accessibility (WCAG 2.1 AA):** charts take keyboard focus and arrow keys; tables that scroll sideways are focusable regions;
  buttons are at least 44px tall; axe-core reports no violations on any page in light or dark mode.
- **Search:** sitemap, robots, a canonical URL per page, a Twitter card and Dataset JSON-LD on the home page.
- Not changed: palette meaning (ink, one green, red only for falls), the mark, the data and every verdict.

## Change log
- 2026-11-18: revision above.
- 2026-11-17: first design (design council).
