# Phase 7 — the field becomes the hero

Phase 1–6 built a beautiful object on the right-hand side of the page. Phase 7 makes the
dispersion **the section**: the light is no longer an illustration beside the copy, it is the
ground the copy sits on, and the prism is the centrepiece everything radiates from.

Four things changed. All of them live in `src/components/sections/hero-ray.ts`; the shell
(`HeroPrism.tsx`) only gained pointer bookkeeping.

## 1. Full-bleed, from a single point

The fan used to be a wedge aimed off the right edge. It is now a **~330° sweep** (246° would
still have left two dead corners) around one incandescent origin — the exit point on the
prism's right facet:

| viewport      | sweep         | why                                                                 |
| ------------- | ------------- | ------------------------------------------------------------------- |
| 1440 / 1024   | −166° → 164°  | strands reach the top, right, bottom and **both left corners**        |
| 390 (portrait) | 12° → 178°   | the copy is full-width, so the light falls down the page instead     |

Every strand's length is the distance from the origin to the frame along its own lane, overshot
by 6%: tips leave the canvas rather than stopping inside it. Three **ghost** strands cross the
copy itself at 40% weight — they are what stops the left half of the hero from reading as
"the graphic ran out".

The origin is placed at the hero's optical centre-right (`0.665·w`, `0.44·h`), which is the
closest it can come to the middle without the glass landing on the paragraph — the prism's
position is then *derived* from it, so the two can never drift apart.

## 2. Dot → dots → line

Every strand is born as a speck and coalesces. Six overlapping stretches of each strand carry
their own stroke pattern:

```
0.00–0.06   specks, 17 px apart
0.05–0.12   specks, 12 px apart
0.11–0.19   specks, 8.5 px apart     ← the dots are nearly touching
0.18–0.27   dashes 7 / 6
0.26–0.40   dashes 14 / 4
0.39–1.00   one continuous filament
```

A zero-length dash with a round cap *is* a dot, so the whole continuum is one gradient stroke —
the alpha ramp in `strandGrads` is what hides the hand-over between stretches.

The staircase is scaled per strand by `resolve` (0.75–1.3): strands with room in front of them
resolve early, strands that have to cross the copy stay beaded for longer. That is why the field
looks *alive* on the right and *distant* on the left, instead of like a symmetric firework.

## 3. A prism that reads as glass

The old triangle was an outline with a few chords. It is now built as an object:

- a **caustic pool** of warm light on the paper under the base;
- a body gradient plus **three faces at three values** (near face lit, far face shaded, a warm
  tint at the exit corner);
- the **dispersion happening inside the glass** — seven hairlines leaving the entry point and
  converging on the exit, so the colours are explained, not asserted;
- a **double rim**: ink edge outside, white highlight just inside — two hairlines at two values
  is what makes a shape read as a material;
- a specular streak along the incident facet and a glint at each vertex;
- and a luminous origin: corona, bloom, two thin flares and four orbiting sparks.

The prism is equilateral and apex-up, and both the entry and the exit are **parametric points on
its facets** (`exit` is `u = 0.56` down the right facet, `entry` is `u = 0.40` down the left),
so the light physically rides the geometry rather than floating beside it.

## 4. The current catches the cursor

The field is charged, not decorated:

- every strand within 360 px leans toward the pointer — each sample moves a fraction of *its
  own* distance, so the strand bows into a smooth lens and can never overshoot;
- a **36 px standoff** keeps the strands wrapping the cursor instead of pinching into a knot;
- the two nearest strands throw a jittered filament across that gap (a random walk with one
  clean break, quantised to 24 fps, so it snaps like discharge);
- the caught stretch shivers and brightens, the contact point blooms, and the pointer itself
  carries a hot point, a ring and three orbiting sparks;
- a click still sends a wavefront through the whole field.

Hovering a stat tile dims every other hue to 42% and lights that tile's own band — and the
grounding filaments only appear then, so the idle still has no leader lines to explain.

## Stills

| file                                   | what                                        |
| -------------------------------------- | ------------------------------------------- |
| `phase7-page-1440x780.png`             | composed with type, light                   |
| `phase7-page-1440x780-dark.png`        | composed with type, dark                    |
| `phase7-page-1024x768.png`             | composed with type, 1024                    |
| `phase7-page-390x820.png`              | composed with type, portrait               |
| `phase7-engine-*.png`                  | the engine alone (from the invariant suite) |
| `phase7-engine-*-catch.png`            | the engine with the pointer live            |

The `page` stills are composed offline from the same captured layouts the invariant suite uses
(type is redrawn at the measured rects, so it is a faithful — not pixel-identical — proxy for
the browser).

## Measured

```
cd scripts/hero-qa && npm i && npm run check
```

Fifteen invariants per captured layout, including the four new contracts:

```
✓ fan stays in angular order (no two strands swap lanes)
✓ every strand leaves the frame instead of stopping inside it
✓ the field is full-bleed: targets reach all four edges
✓ the prism is an equilateral triangle built on its own centroid
✓ the origin sits on the exit facet, not beside it
✓ dots resolve into a line: every lit strand ends as a continuous filament
✓ the current catches the pointer, and never overshoots it
```

Engine cost, measured headlessly at 1440×720 through the same `Ctx` subset:

|                  | ms/frame |
| ---------------- | -------- |
| 21 strands live  | **2.4**  |
| composed still   | **1.9**  |

No `shadowBlur`, no allocation in the frame loop, one cached raster for the drafting plate.

## Files

- `src/components/sections/hero-ray.ts` — the engine, rewritten for this composition.
- `src/components/sections/HeroPrism.tsx` — pointer stays attached while the cursor rests in the
  hero, re-projects on scroll, releases after 45 s idle or on leave.
- `src/components/sections/hero-layout.ts` — unchanged; the composition still comes from measured
  rects, never from percentages.
- `scripts/hero-qa/check.mts` — the invariants above, plus stills.
