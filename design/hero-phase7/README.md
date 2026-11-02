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

| viewport       | sweep        | why                                                              |
| -------------- | ------------ | ---------------------------------------------------------------- |
| 1440 / 1024    | −166° → 164° | strands reach the top, right, bottom and **both left corners**   |
| 390 (portrait) | 12° → 178°   | the copy is full-width, so the light falls down the page instead |

Every strand's length is the distance from the origin to the frame along its own lane, overshot
by 6%: tips leave the canvas rather than stopping inside it. Three **ghost** strands cross the
copy itself at 40% weight — they are what stops the left half of the hero from reading as
"the graphic ran out".

The origin is placed at the hero's optical centre-right (`0.665·w`, `0.44·h`), which is the
closest it can come to the middle without the glass landing on the paragraph — the prism's
position is then _derived_ from it, so the two can never drift apart.

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

A zero-length dash with a round cap _is_ a dot, so the whole continuum is one gradient stroke —
the alpha ramp in `strandGrads` is what hides the hand-over between stretches.

The staircase is scaled per strand by `resolve` (0.75–1.3): strands with room in front of them
resolve early, strands that have to cross the copy stay beaded for longer. That is why the field
looks _alive_ on the right and _distant_ on the left, instead of like a symmetric firework.

## 2b. One line comes out of the dot

The whole fan is a continuum read at once. On top of it, **one** stroke is read as a gesture:

- a single point of light at the origin (the seed dot, which then stays pinned in the core);
- a bright head that leaves it and **draws the line** along its lane over ~1.9 s, decelerating
  into the lane so it settles rather than stops;
- once grown, the heaviest stroke in the field — clay, 2.1 px body, a 10 px haze and a hot core,
  where every other strand is still specks, dashes or a 1 px hairline.

It always takes the lane that leaves the glass horizontally (portrait: straight down), and it
takes the clay hue regardless of which band it landed on: it is the accent of the hero, not a
member of the fan. The growth rides the scene clock, so a composed still (`t = 4.6 s`) is always
the finished line and reduced motion never sees a half-drawn one.

Stills: `phase7-page-1440x780-growth.png` catches it mid-draw, `phase7-page-1440x780.png` is the
finished line.

## 3. A prism that reads as glass

The old triangle was an outline with a few chords. It is now built as an object:

- a **caustic pool** of warm light on the paper under the base;
- a body gradient plus **three faces at three values** (near face lit, far face shaded, a warm
  tint at the exit corner), separated by a **fold that ramps over ~12 px** instead of a polygon
  seam — a seam is a one-pixel value step, and on ink that reads as a hairline crossing the
  body, which is exactly the tangle this pass removed;
- **one ray through the body** — the light crosses the glass undispersed, and the colours only
  peel off in the last quarter, where the beam meets the exit facet. The left flank therefore
  carries a single line: one ray in, and nothing else inside the glass;
- a **double rim**: ink edge outside, white highlight just inside — two hairlines at two values
  is what makes a shape read as a material;
- a specular streak along the incident facet and a glint at each vertex;
- and a luminous origin: corona, bloom, two thin flares and four orbiting sparks.

The prism is equilateral and apex-up, and both the entry and the exit are **parametric points on
its facets** (`exit` is `u = 0.56` down the right facet, `entry` is `u = 0.40` down the left),
so the light physically rides the geometry rather than floating beside it.

### The glass is a keep-clear zone

The prism plus 18 px is a zone no strand may be drawn through. A lane that merely grazes the
body keeps its origin at the core — the fan still converges on the point of light, which is
what the composition hangs on. A lane that would _cross_ the body (more than 20 px of it
inside) opens on the far side instead, so the field leaves the glass from its rim rather than
showing through it. On paper the nearly opaque body hid most of that anyway; on ink it did
not, and a cable of near-parallel hairlines across the body was the thing making the left
facet read as a knot. QA pins the rule: every crossing lane's stroke must open outside the
triangle, and the incident ray must actually be drawn.

## 4. The current catches the cursor

The field is charged, not decorated:

- every strand within 360 px leans toward the pointer — each sample moves a fraction of _its
  own_ distance, so the strand bows into a smooth lens and can never overshoot;
- a **36 px standoff** keeps the strands wrapping the cursor instead of pinching into a knot;
- the two nearest strands throw a jittered filament across that gap (a random walk with one
  clean break, quantised to 24 fps, so it snaps like discharge);
- the caught stretch shivers and brightens, the contact point blooms, and the pointer itself
  carries a hot point, a ring and three orbiting sparks;
- a click still sends a wavefront through the whole field.

Hovering a stat tile dims every other hue to 42% and lights that tile's own band — and the
grounding filaments only appear then, so the idle still has no leader lines to explain.

## Stills

| file                              | what                                        |
| --------------------------------- | ------------------------------------------- |
| `phase7-page-1440x780.png`        | composed with type, light                   |
| `phase7-page-1440x780-dark.png`   | composed with type, dark                    |
| `phase7-page-1024x768.png`        | composed with type, 1024                    |
| `phase7-page-390x820.png`         | composed with type, portrait                |
| `phase7-engine-*.png`             | the engine alone (from the invariant suite) |
| `phase7-engine-*-catch.png`       | the engine with the pointer live            |
| `phase7-page-1440x780-growth.png` | the prime line mid-draw (0.7 s in)          |

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
✓ one prime line grows out of the dot, on the open lane
✓ the glass stays clear: crossings open past the rim, one ray through the body
```

Engine cost, measured headlessly at 1440×720 through the same `Ctx` subset:

|                 | ms/frame |
| --------------- | -------- |
| 21 strands live | **2.4**  |
| composed still  | **1.9**  |

No `shadowBlur`, no allocation in the frame loop, one cached raster for the drafting plate.

## Files

- `src/components/sections/hero-ray.ts` — the engine, rewritten for this composition.
- `src/components/sections/HeroPrism.tsx` — pointer stays attached while the cursor rests in the
  hero, re-projects on scroll, releases after 45 s idle or on leave.
- `src/components/sections/hero-layout.ts` — unchanged; the composition still comes from measured
  rects, never from percentages.
- `scripts/hero-qa/check.mts` — the invariants above, plus stills.

## Phase 8 — the beam crosses the page

The pointing sentence-start beam and the fixed right-facet exit described above were replaced
in phase 8: the beam now enters at the frame edge, crosses the headline, lands near the apex,
and the resting ray is a real refraction — in these layouts the refracted ray is totally
internally reflected at the far facet and leaves through the base, so the fan originates
there. See `../hero-phase8/README.md` for the current composition. The sections above are kept
as the design history that explains how the field, the glass and the interaction were built.

## Interactive optics update

The incident beam is neutral and dominant; the quiet-side lanes are now deliberately much
fainter, with at most two visible companions. On portrait the beam starts above and to the
left of the glass, so it actually approaches the entry face. The core and full-bleed sweep
remain an artistic composition, not a literal narrow projection of the spectrum.

When a pointer enters the triangle, the current releases over a 180 ms time constant. Its
projection moves the entry point, and `tracePrism` refracts the incoming direction with
`n = 1.5`, intersects the real triangle facets, and reflects at the critical angle until a
ray can leave. The fan follows that exit; short Cauchy-index spectral rays appear only
outside it. A Schlick reflection and a moving caustic give the boundary and base a local
response. The resting ray cross-fades to the traced path with pointer depth to avoid a jump
at the surface. The broad fan's turn and spread are bounded artistic exaggerations to retain
the composition, not a wavelength-by-wavelength simulation of the whole background.

The QA harness tests Snell's law on the actual internal leg, critical-angle reflection,
beam dominance, catch release, and the live fan's exit and frame coverage in addition to the
original composition checks. Set `HERO_PHASE=qa` when running it to write temporary review
stills without replacing the checked-in phase 7 reference images.
