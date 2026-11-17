# SIP Pulse: design decisions (design council, 17 Nov 2026)

One question: **when the Nifty 50 falls, do Indian mutual fund inflows keep coming?**
Readers: recruiters and hiring managers at banks and fintechs (30 seconds), and Indian retail investors (a few minutes).

## Hadid: movement through space
- **Opening screen = the answer.** A full-height first screen with the verdict in one sentence, one big number and the test it rests on.
  No "welcome" text.
- **Rooms in order:** Answer → the 91-month record (one chart, with fall months shaded) → the fall months up close
  (one small chart per fall, flows in the 3 months after) → method and limits. Each room answers one smaller question.
- Charts reveal as you scroll (GSAP, a stagger of about 80 ms). With "reduce motion" on, everything simply appears.

## Ive: material
- The material is a **ledger of money moving**: tabular figures, exact rupee amounts, thin rules.
- Two themes from the same tokens: paper-white and ink-dark. No cream or off-white backgrounds.
- Corner radius 6px: precise, not soft. Numbers use tabular figures so columns line up.

## Rams: restraint
- Three type sizes only: display (the answer), title, body. Captions use the body size in a muted colour.
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
- Hover or tap any month on a chart to read its exact values. The hint text says so once, under the chart.
- Fall months are shaded with a legend entry ("Nifty fell 5% or more"), so the shading needs no explanation elsewhere.
- Plain words: "money in", "fall month", "SIP" explained once on first use (a monthly automatic investment).
- Phone first: charts fit 360px wide; anything wider scrolls inside its own box with a visible hint.

## Tensions, resolved
- **Rams vs Ingels:** the only animation that stays is the pulse line, because it carries the finding.
- **Hadid vs Rams:** dramatic structure (a full-height answer, rooms) with a quiet surface (three sizes, one accent).
