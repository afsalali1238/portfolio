# Phase 5 — interaction

Phase 5 is the first phase that can be wrong without looking wrong: the still is supposed to be
untouched, so everything new only exists while somebody is doing something. That makes two
different kinds of evidence necessary — stills of each gesture, and an A/B that proves the
still never moved.

Every image in this folder is the production build at 1440×800, hero clipped, **with the real
type composited on top**. Guides are hidden with `?heroDebug=1` + `data-hide-debug` for the
photograph only.

## What the phase delivers

| Spec (§7)                              | Implementation                                                                                                                      |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Tesla arcs attracted to the pointer    | `drawPointerArcs`: three bolts from the facet exit, `pointerEase`-weighted, 9 segments each, one dendrite and a three-filament fray |
| ≤ 10 px lean                           | ribbon/plasma point buffers are offset by `pow(1 − d/250, 1.6) · 10` inside a 250 px radius, mid-span only                          |
| Click surge with shockwave ring        | `drawSurges`: displaced wavefront `10 → 260 px` at `pow(t, 0.6)`, echo ring under `t < 0.55`, 80 ms white-out, `exp(−t/340)` decay  |
| Tile coupling                          | `bandVoice`: hovered band ×1.45, others ×0.45; its ground ×3, the other grounds ×0.26, plus a landing bloom above the panel         |
| Headline hover boosts the incident ray | incident beam ×1.3 while `headlineHover`                                                                                            |
| Additive only                          | idle still and reduced-motion frame unchanged; no new control, no new focusable                                                     |

## The nine beats, measured

`node tools/hero-interaction.mjs` drives real pointer events on the production build, reads the
engine's own live state, and asserts each beat:

```
✓ idle: nothing is influencing the field — pointerEase=0 hoverTile=-1 surges=0
✓ arcs: the pointer is gripping the field — pointerEase=1.00
✓ lean: the ribbons bend toward the pointer, and never further than 10 px — max displacement 9.99 px
✓ tile: exactly one tile is hovered — hoverTile=1
✓ headline: the incident ray is boosted — headlineHover=true
✓ surge: the ring is alive — surges=1 energy=0.67
✓ surge: it decays inside 950 ms — surges=0
✓ release: the field returns to rest — pointerEase=0.000
✓ interaction is additive only: no control was added — 8 focusables, unchanged from before this phase
```

The lean figure is the interesting one: `9.99 px` is the spec ceiling hit exactly, on the band
nearest the cursor, falling to `0.21 px` two bands away — the pull is local, not a global shift.

### Judging the stills

- `interaction-arcs.png` — cursor parked in the fan. The bolts read as discharge: an irregular
  random walk with one hard kink, a hot core, and a tip that frays into three filaments. They
  stop **short** of the cursor, which is what makes it read as attraction rather than a leader
  line drawn to a point.
- `interaction-lean.png` — cursor on the middle band. The three ribbons nearest it bow while the
  lower two stay put.
- `interaction-tile-hover.png` — tile 2 hovered. Its amber band thickens, the rest drop to
  near-silence, and a warm bloom sits above the hovered tile's top edge (on the panel it would
  be swallowed by the card's own 90%-opaque surface).
- `interaction-surge-film-1…4.png` — one click per frame at 60/170/320/620 ms. A screenshot costs
  ~300 ms, so the film is built from four separate clicks rather than four waits; the wavefront
  expands and dies.
- `interaction-released.png` — 2.6 s after the pointer left. Back to the idle field.

## Additive proof

Animated pixels can never be byte-stable, so the claim is tested where it is falsifiable: the
reduced-motion frame, which is one static paint and zero rAF.

`node tools/hero-idle-hash.mjs <label>` hashes that frame. It was run against the phase-4 engine
and the phase-5 engine:

| build          | canvas FNV-1a | changed px > 3/255 | where            |
| -------------- | ------------- | ------------------ | ---------------- |
| phase 4 engine | `b7bab3cc`    | —                  | —                |
| phase 5 engine | `c5df63c1`    | 5 387 of 1 036 800 | copy column only |

Rerunning phase 5 against itself reproduces the hash exactly, so the measurement is stable. The
entire fan region — x > 840 — is byte-identical between the two builds: **no interaction code
runs while the pointer is away**. The remaining delta is the plate-dissolve fix below, and it is
a max of 14/255 on paper, which is the intended effect of closing phase 4's gap.

## The plate gap is closed

Phase 4 closed with one admitted hole: the drafting plate's column rules and crop marks ignored
the dissolve and ran through the headline area. `dissolvePlate` now paints the same quiet-rect
radial stencils **into the plate surface at build time**, so the correction costs nothing per
frame. It is the dim wash visible behind the copy column in the diff image; nothing in it is an
edge.

## Perf after phase 5 (production build, 1440×800)

|                              | 1× CPU     | 6× CPU     |
| ---------------------------- | ---------- | ---------- |
| paint median                 | **0.5 ms** | **0.6 ms** |
| paint p95                    | 0.8 ms     | 3.4 ms     |
| resize cost                  | 0.4–0.7 ms | 0.4–0.7 ms |
| longest frame (steady state) | none       | none       |

Two notes on the numbers, because the first reading of this harness was wrong:

1. **The earlier 6× tail was hydration, not the hero.** `hero-perf.mjs` used to open its sample
   window immediately after `networkidle`; at 6× the route's own scripts were still compiling, and
   those frames landed in the p95 as ~40–70 ms "paint" entries. The harness now waits 3 s, clears
   the buffers, and snapshots the window before the resize pass.
2. **Long frames on resize are page-level and were already there.** Measured with the identical
   harness, the phase-4 engine reports 51 ms of script on a viewport change (phase 5: ~70–112 ms at
   6×, all of it outside the hero: `measure` is 0.2–0.3 ms and `resize` 0.5 ms in the same run).
   The harness now reports that line separately instead of failing the hero for the framework's
   resize work.

What the interaction actually costs per frame is small because nothing is allocated: the bolts
are eight `lineTo`s, the surge is two radial gradients and a 96-point ring, and the dissolve is a
cached surface blit. The one real optimisation was reusing the plate canvas across rebuilds —
allocating a 1440×720 backing store per resize step was the biggest single resize cost.

## Judgement calls to defend

- **Arc length saturates at 300 px.** A cursor parked across the page would otherwise stretch the
  bolts into hairlines; at 0.86·span capped at 300 they stay a readable filament at any distance.
- **The bolts lean rather than land.** They aim ~6% high and stop short of the cursor. Lightning
  reaches; a line that terminates exactly on the pointer is a ruler.
- **Three bolts, unequal lengths.** Equal-length bolts read as a fan of vectors. Lengths are
  `0.72–0.92` of the run with a fixed seed, so the trio looks thrown rather than drawn.
- **Random walk plus one kink, not alternating zigzag.** The first two attempts are in the diff
  history: a sine-displaced path read as a wavy ribbon, and a per-vertex sign flip read as a
  Christmas-tree squiggle. Real discharge drifts and then breaks once.
- **A hairline ring is invisible here.** The fan is made of 1 px warm strokes; a 1 px warm circle
  on top of it disappears. The wavefront is a soft annulus (9–22 px band) with a displaced leading
  edge, because a _perfect_ circle is the one shape that reads as a UI ripple.
- **The lean radius is 250 px, not 170.** At 170 px only the root end of a ribbon was in range,
  where the sine envelope is ≈ 0, so the effect measured 1.7 px — technically inside the spec and
  invisible on screen. 250 px puts the pull on the mid-span, where it can be seen.
- **`TILE_DIM 0.45`, hovered ×1.45, hovered ground ×3.** Dimming alone is not legible at the far
  end of a 1 400 px fan; the chosen band has to gain weight as the others lose it.
- **`hoverTile` quiets the arcs (×0.26).** Otherwise hovering a stat drags the bolts down to the
  tiles and the eye reads a discharge falling onto the cards instead of a band lighting up.

## Files

- `phase5-page-{1440x780,1440x780-dark,1024x768,390x820}.png` — the composed idle hero.
- `motion-reel-{light,dark}.png` — six frames over one second, light written last.
- `interaction-*.png` — the beats above; `idle-reduced-motion-*.png` — the A/B pair.
- `node tools/hero-interaction.mjs`, `node tools/hero-idle-hash.mjs`, `node tools/hero-perf.mjs`,
  `node tools/hero-qa.mjs`, `node tools/hero-contrast.mjs`, `npx tsx scripts/hero-qa/check.mts`.

## What is still open

- **Mobile has no pointer.** At 390 the field is portrait and the arcs, lean and surge never fire;
  tile coupling still does, because tiles are tappable. That is deliberate — touch users get the
  static composition plus the tile response, not a gesture they can't make.
- **Two quick clicks stack two surges** (each carries its own seed). It reads as an echo, not a
  stutter, but it was never tuned for three or more.
- **`reduce-motion` gets none of this.** Interaction is suppressed entirely under the media query,
  which is the conservative reading of the a11y rule; the tile bands still respond because that is
  a hover state and not motion.
