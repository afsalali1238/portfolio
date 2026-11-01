# Phase 8 — the beam crosses the page

The request was three things at once: **make the line wavy**, **let it pass behind the
letters**, and **centre the composition** — without breaking the optics that make the prism
feel real. Phase 7 had shipped a beam that started at the full stop of the closing sentence
and ran to the glass: a leader line, not light. This pass turns it into one luminous beam
that enters at the frame edge, crosses the headline, and lands on the entry facet.

Everything below lives in `src/components/sections/hero-ray.ts` unless stated otherwise.

## 1. One anchor, everything derived from it

The composition now hangs off a single point: **where the beam lands on the left facet**.

```
entry landing (left facet, u = 0.26 wide / 0.56 portrait)
  ├─ the glass is hung so the landing sits on its facet
  ├─ the beam is a straight run back from the landing to the frame edge
  └─ the dispersion origin is the traced exit of the refracted ray
```

Because the prism's position is solved from the landing, the beam and the glass cannot drift
apart, and because the origin is the *traced* exit, the fan cannot drift from the glass
either. Moving one number moves the whole picture coherently.

| viewport | beam source | landing on the left facet | dispersion origin |
| --- | --- | --- | --- |
| 1440 | left frame edge, (0, 65) | (897, 278) | base facet, (948, 425) |
| 1024 | left frame edge, (0, 109) | (678, 269) | base facet, (729, 417) |
| 390 | lower left, (2, 135) | (311, 55) | right facet, (365, 57) |

The prism sits at `max(62.5 % of width, copy right + half-width + 22)` on wide screens — the
copy-side constraint is now derived from **only the text rects that share the glass's vertical
band**, not from the widest text on the page. The CTA row is 80 px below the glass, and it used
to shove the prism to the right for no reason.

### Why the beam descends from upper-left

A beam entering the left facet from the left **must** descend into it, otherwise the incident
ray crosses the prism's own left facet before it reaches the entry point and the geometry stops
describing a prism. That fixes the family of usable approach angles. Inside that family the
resting outcome is a property of the triangle, not a design choice — §2 measures it.

The entry point is placed near the apex (`u = 0.26`) because that is what makes the reflected
leg a clean vertical drop through the middle of the glass. Entering lower on the facet makes
that leg long and flat, and it ends up doubling the base rim.

## 2. The physics, stated precisely

Measured from `geometry().restOptics` on the checked-in layouts — the invariant suite asserts
every one of these relationships, so the table cannot drift from the code:

| layout | incidence θ1 | refracted θ2 | first facet @ angle from normal | critical | outcome |
| --- | --- | --- | --- | --- | --- |
| 1440 · 1024 | 16.7° | 11.0° | right @ 49.0° | 41.8° | **TIR at the right facet**, exits the base at 106.7° |
| 390 | 44.4° | 27.8° | right @ 32.2° | 41.8° | refracts straight out of the right facet at 23.0° |

The wide-screen resting beam arrives shallowly, so the internal ray strikes the far facet well
past its critical angle and is totally internally reflected. That is the honest outcome for
this composition, and it is why the dispersion origin sits on the **base** facet instead of
being pinned to the right one. QA asserts the consequence rather than the assumption: whenever
`restOptics.tir` is true, the exit facet is not the reflecting facet.

The portrait beam arrives more steeply from below and refracts straight out — a different but
equally real solution.

Both are traced by the same `tracePrism`, and the resting drawing strokes the legs that trace
returned. The fan is still an artistic exaggeration of the *dispersion* that follows; it is not
a wavelength-by-wavelength projection.

## 3. The wavy beam

The old beam had **0.4 px** of wobble — invisible. The new one is a real travelling wave, but
it is drawn as an *illustration*, and the code says so:

- **The optical axis is straight.** Incidence, the hinge on the facet, the Fresnel ghost and
  everything the ray tracer consumes come from the straight source → entry chord. The physics
  never sees the ripple.
- **The ripple is an illustration of the electromagnetic field**, not the path of a photon.
  Visible light is 400–700 nm — five orders of magnitude below one pixel — so a page-scale
  drawing is necessarily a magnification. `BEAM_WAVE` states this in the constant that owns it.
- **The envelope is exactly zero at both ends.** `smoothstep` in, `smoothstep` out; at `s = 0`
  the ripple is 0, at `s = 1` it is 0 to the last float. The wave therefore cannot detach from
  the frame edge and cannot tug the beam off the hinge the tracer computed.
- **One wavelength, not a braid.** 2 cycles across the run plus a 26 % second harmonic, so the
  crests are not identical. A single sine reads as a bent wire; this reads as a field.
- **Amplitude is a true bound**: 1.8–2.1 % of the run, clamped to 5–19 px (≈ 19 px at 1440,
  ≈ 7 px on a phone), normalised by the harmonic sum so `amp` is a ceiling, not an estimate.
- **Speed**: 0.16 Hz — a crest crosses the whole run in about six seconds. Not jitter.

The beam is drawn as: a straight, three-step bloom (19 / 11 px on ink, 14 / 8 px on paper), the
rippled field (a 5 px body pass plus the 1.8 px hairline), a hot 0.9 px filament, and a photon
packet climbing the same curve. Hovering the headline eases all of it up over 160 ms
(`beamGlow`) instead of snapping.

**Neutral before the prism**: `beamGrad` is warm white `255,251,241` on ink and neutral silver
`105,99,90` on paper. Colour starts at the exit facet.

## 4. Light behind the letters, type above the light

The canvas was already behind the content (`HeroPrism` `z-0`, `Container` `z-10`). The change
that makes the beam read as *behind the type* is the layer order inside the canvas:

```
plate → fan → beam → dissolve → glass · spectral exit · entry spark → core → interaction
```

`drawDissolve` paints paper-coloured radial stencils over the type boxes, one per line, sized
to the line. Because the beam is painted **before** it, the beam is thinned exactly where it
crosses a word and stays bright in the gaps between glyphs, inside counters, and around the
line — light separated by type, not light over type. Because the glass and the refracted leg
are painted **after** it, the glass stays crisp; QA pins that with a geometric clearance check
(the glass, its vertices, the entry hinge and the whole refracted leg must be ≥ 4 px clear of
every text and tile rect — verified on all four captured layouts).

The layer order is data (`SCENE_LAYERS`), exposed through `geometry().layers`, and asserted by
the suite, so the painting and the invariant cannot drift apart.

## 5. The resting ray is traced

`buildGeometry` now runs `tracePrism` on the resting axis and stores `restOptics`. The resting
drawing strokes **those legs**; the pointer's trace cross-fades over them by pointer depth.
There is no composed chord left in the engine, so the still, the reduced-motion frame, the
first frame of interaction and the fully-interacted frame are all real refractions.

## 6. Portrait

The copy is full width, so there is no quiet band to land in and no upper-left corner to enter
from. Portrait flips the vertical: the glass sits in the top-right corner (sized 76–108 px so
it fits a 390 px frame *and* clears the display type, both measured), and the beam **rises**
from the lower-left frame edge at 14° into the entry facet. Incidence ≈ 14° — again a real
solution, and this one refracts straight out of the right facet. The fan still falls down the
page as a curtain.

## 7. What is still illustrative

- The **full-bleed fan** is an artistic exaggeration of dispersion, with bounded turn/spread
  during interaction. It is not a wavelength-by-wavelength simulation.
- The short Cauchy-index rays at the exit *are* ordered by refractive index, but their length
  and the broad field around them are composition.
- The **ripple** is an illustration of the field (see §2).
- The **caustic pool** and the bloom are light-art, not photometry.

## Stills

Composited offline from the same captured layouts, with the page's real fonts and tokens. There
is no browser in this sandbox, so these are faithful proxies rather than screenshots — the
type is redrawn at the rects `hero-layout.ts` measured on the live page:

```
cd scripts/hero-qa
npm run compose                          # every layout → design/hero-phase8
npm run compose -- 1440x780-dark live    # one layout, pointer inside the glass
```

`compose.mts` reads the fonts straight out of `node_modules/@fontsource`, so it needs no setup.
When a browser *is* available, `tools/hero-qa.mjs` is still the better answer: it measures the
live DOM and screenshots the real page.

| file | what |
| --- | --- |
| `phase8-page-1440x780.png` | composed, light |
| `phase8-page-1440x780-dark.png` | composed, dark |
| `phase8-page-1440x780-dark-live.png` | pointer parked inside the glass: TIR → base exit |
| `phase8-page-1024x768.png` | composed, 1024 |
| `phase8-page-390x820.png` | composed, portrait |

## Measured

```
cd scripts/hero-qa && HERO_PHASE=qa npm run check
```

27 invariants per captured layout (108 total). New or rewritten in this pass:

```
✓ the resting ray is a real refraction, not a composed chord   (Snell on the resting legs)
✓ the source is outside the entry plane, at the frame edge
✓ the beam crosses the headline, and the type stays above it   (incl. layer order + DOM z)
✓ everything painted over the type is clear of it              (geometry, not pixels)
✓ the illustrated field is wavy, bounded, and lands exactly on the hinge
✓ reduced motion paints one stable, complete still             (byte-identical paints)
✓ entry and exit ride the facets the trace names               (was: hard-coded corners)
```

```
cd scripts/hero-qa && npm run bench
```

Engine cost, same harness, same machine, interleaved runs at 1440×720:

| | baseline (`main`) | phase 8 |
| --- | --- | --- |
| composed still | **2.92–2.94 ms** | **2.92–2.95 ms** |
| live (pointer, 200 frames) | **3.10–3.24 ms** | **3.11–3.17 ms** |

No regression; the 2.4 ms figure in the phase 7 notes was not reproducible on this machine for
either build, so it is not claimed here.
