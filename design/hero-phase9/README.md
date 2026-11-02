# Hero — phase 9: the composition, per viewport

Every previous phase was judged at 1440, 1024 and 390. Those three widths were fine. The hero
was not: it broke at **320**, at **640**, at **768** and at **1023**, and the brief for this pass
was simply _"fix the hero … also for mobile and other view"_.

So this phase is a survey, not a redesign. Nothing about the drawing's intent changed — one beam,
one glass, one fan. What changed is that the composition is now built from measurements that hold
at every width, and there is a harness that checks all of them instead of three.

## What was actually broken

### 1. The portrait glass did not scale, and was not fitted to anything (320–767 px)

The portrait triangle was a fixed preference — `clamp(min(w, h) · 0.24, 76, 108)` — pinned 6 px
from the right edge, with no gutter and no relationship to the type beside it. Two things fell
out of that:

| viewport | glass before | right gap | glass now  | right gap | gap to the type it shares a band with |
| -------- | ------------ | --------- | ---------- | --------- | ------------------------------------- |
| 320      | 77 px        | **6 px**  | **79 px**  | 8 px      | 63 px                                 |
| 360      | 86 px        | **6 px**  | **84 px**  | 9 px      | 76 px                                 |
| 375      | 90 px        | **6 px**  | **86 px**  | 10 px     | 81 px                                 |
| 390      | 94 px        | **6 px**  | **87 px**  | 10 px     | 88 px                                 |
| 414      | 99 px        | **6 px**  | **90 px**  | 11 px     | 96 px                                 |
| 480      | 108 px       | **6 px**  | **99 px**  | 12 px     | 122 px                                |
| 640      | 108 px       | 50 px     | **135 px** | 17 px     | 167 px                                |

- **It stopped scaling above 414 px.** 360 and 480 drew the same 108 px triangle; a 640 px
  tablet in portrait got exactly the phone's thumbnail, because the cap was a constant. The cap
  now scales with the frame (`0.34 · min(w, h)`, 76–160 px) and the actual limit is the slot.
- **Its base was tangent to the closing line.** The apex is pinned to the top edge, so the
  triangle's height is exactly `0.866 · size`; at 360–414 that put the base 1–9 px off the
  italic's line box. The size is now solved against _both_ bounds in closed form — the margin
  beside the headline, and the room between the top edge and the italic's first line (10 px of
  base clearance) — so the clearance is structural, not luck. (An earlier attempt iterated
  size ↔ band and could settle on a size that no longer fitted its own band; a closed form
  cannot.)

The triangle also stops being pinned 6 px from the frame: it squares up to a real gutter
(`max(8, 0.026 · w)`), which is what the desktop composition already did.

The headline also steps down at `sm` — `4.5rem → 4.6rem` for the h1 and `2.6rem → 3rem` for the
italic — because between 640 and 767 px the frame is still one column and the old scale spent
75 % of it on the closing line alone.

### 2. The fan painted the whole page on a phone

The portrait fan was full-bleed and full-strength in every direction, including straight down
through the paragraph, the buttons and the stat panel. On desktop that is the point (the copy has
its own column and the dissolve thins what crosses it). On a 390 px screen there is no second
column, so the light had to be contained instead:

- **copy damping** — a lane that runs through type now loses 55 % of its alpha on portrait
  (desktop keeps the original 16 %, unchanged);
- **height containment** — a portrait lane fades with the height it exits the frame at: full
  strength beside the display type, half by the time it is level with the paragraph, a quarter by
  the buttons. Lanes that leave through the right edge near the glass carry the dispersion; lanes
  that would run the height of the section arrive quiet.

### 3. The drafting plate was not on the grid

`hero-layout.ts` measured the `Container`'s **border box**, which includes `px-6 md:px-10`. The
12 column rules therefore sat 24–40 px outside the content grid, i.e. one gutter to the left of
the headline they are supposed to register with — visible as rules that start beside the text
rather than under it, and as crop marks in the page margin. The measurement now subtracts the
computed padding, so the plate, the columns and the copy share one grid at every breakpoint.

### 4. Smaller things

- The incident run is now _checked_ rather than assumed: `npm run sweep` asserts it never
  crosses the body copy or the CTA row at any width. (Crossing the two display lines is the
  design — on portrait the run rises from the lower-left and passes behind both of them, which
  is what the dissolve exists for.)
- `resize()`'s fallback layout was missing `thesisLine.bottom`, which `tsc` had been failing on
  before this pass (`npm run build` was unaffected because Vite strips types).

## How it is verified

There is no browser in this environment, so the pass is a **model plus a harness**, and it says so:

```bash
cd scripts/hero-qa
npm i
npm run sweep          # every viewport → design/hero-phase9/*.png, exits 1 on a layout failure
npm run check          # the engine invariants, on the measured captures
```

`sweep.mts` transcribes `Hero.tsx`'s responsive CSS into a layout model (real fonts, real
`fontBoundingBox` metrics), renders the engine over it **with an offscreen plate surface** — the
same contract the browser shell provides, so the stills include the copy-safe plate stencil — and
asserts, per viewport:

1. the glass is whole and inside the frame;
2. the glass does not sit on the type it shares a band with;
3. the incident run never crosses the body copy or the CTA row;
4. portrait: no lane reaches the stat panel at strength.

It also prints a calibration table against `data/layout-*.json`, so the model can be judged
rather than trusted:

```
model vs measured capture (px):
  1024x768       heroH 720 → 720 (+0)   copyRight 558 → 525 (-33)   tilesTop 537 → 536 (-1)
  1440x780       heroH 720 → 720 (+0)   copyRight 785 → 684 (-101)  tilesTop 537 → 536 (-1)
  390x820        heroH 697 → 697 (+0)   copyRight 366 → 366 (+0)    tilesTop 452 → 449 (-3)
```

Section height and tile position track the real page within 3 px. `copyRight` differs at desktop
because the model reports the longest _line_ while the capture includes the copy column's box;
at 390 they agree exactly. Viewport height is modelled as the hero's own height, which is what
`hero-layout.ts` passes the engine — the captures record the same thing.

**Not run here:** `tools/hero-qa.mjs`, `hero-contrast.mjs`, `hero-audit.mjs`, `hero-perf.mjs` and
the browser screenshot pass all need Chromium, which this sandbox cannot launch (no NSS/NSPR).
The four measured captures in `data/` are therefore the previous pass's; their `container` and
`columns` fields were re-derived by hand from the padding fix above, and nothing else in them was
touched. A browser pass is still the right final check — `npm run sweep` is what should shrink to
a diff against it.

## Judgement calls

- **The glass stays beside the words on portrait, not beside the paragraph.** A phone has no
  second column, so "the empty side" is the margin next to the display type. Sizing from the
  _tallest_ line available made the triangle shrink to fit a gap that was never its own.
- **The fan is contained on portrait, not removed.** §3 of the original handoff says "keep the
  fan on mobile; do not strip the effect" — the fade is a containment, and the stills show the
  dispersion still crossing the frame beside the copy.
- **Desktop geometry is untouched** except for the plate grid. The 1024/1440/1920 renders are the
  same composition as phase 8, with the rules moved onto the content grid.
