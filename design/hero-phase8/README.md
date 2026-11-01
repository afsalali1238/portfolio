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
  └─ the dispersion origin is the first far-facet contact of the refracted ray
```

Because the prism's position is solved from the landing, the beam and the glass cannot drift
apart, and because the origin is the first *traced far-facet contact*, the fan cannot drift from the glass
either. Moving one number moves the whole picture coherently.

| viewport | prism centre | beam source | landing on the left facet | dispersion origin |
| --- | --- | --- | --- | --- |
| 1440 | (1008, 300) · 70 % of the column | left frame edge, (0, 38) | (975, 265) | right facet (composed emission) |
| 1024 | (753, 302) · 75 % | left frame edge, (0, 95) | (720, 267) | right facet (composed emission) |
| 390 | (333, 57) · corner | lower left, (0, 135) | (311, 55) | right facet |

### The glass is centre-right of the *column*, not of the viewport

The prism is the right-hand anchor of a left-aligned composition, so its position is measured
against the content column (`.mx-auto max-w-6xl`), not against the window. That is what makes it
read the same on a 1024 laptop and a 1920 monitor instead of drifting further right as the
window grows:

```
centreX = clamp(band + halfW + 24, column.left + 0.75·column, frame − halfW − 2 %)
```

- **band** is the copy that actually shares the glass's vertical band — the display type — not
  the widest text on the page. The lede and CTA row sit below it and must not shove the glass.
- **The size is part of that budget.** Below `lg` the hero's copy is still one full-width column,
  so the glass has no column of its own to sit in. Its size is capped by the room left beside
  the words, `min(preferred, frame − 24 − copyRight − margin)`; without that cap the right
  vertex clipped the frame around 840 px wide. The triangle's half-width is exactly `size / 2`,
  which makes the budget a single subtraction.
- **The source is allowed to sit exactly on the frame boundary.** On a very wide window the run
  reaches the top edge before the left edge; the ripple's envelope is zero there, so the light
  fades in from the edge rather than starting in mid-air.

A width sweep from 640 to 2560 px keeps all of it true: no clipped vertex, the column-relative
position between 55 % and 88 %, an incident span above 240 px, and a source on the frame edge
at every width.

### Why the beam descends from upper-left

A beam entering the left facet from the left **must** descend into it, otherwise the incident
ray crosses the prism's own left facet before it reaches the entry point and the geometry stops
describing a prism. That fixes the family of usable approach angles. Inside that family the
resting outcome is a property of the triangle, not a design choice — §2 measures it.

The entry point remains near the apex (`u = 0.26`). Its physical trace still contains a
reflected downward leg on desktop, but that leg is no longer painted at rest.

## 2. The physics, stated precisely

Measured from `geometry().restOptics` on the checked-in layouts — the invariant suite asserts
every one of these relationships, so the table cannot drift from the code:

| layout | incidence θ1 | refracted θ2 | first facet @ angle from normal | critical | outcome |
| --- | --- | --- | --- | --- | --- |
| 1440 · 1024 | 16.7° | 11.0° | right @ 49.0° | 41.8° | **TIR at the right facet**, exits the base at 106.7° |
| 390 | 44.4° | 27.8° | right @ 32.2° | 41.8° | refracts straight out of the right facet at 23.0° |

The wide-screen physical trace undergoes TIR at the far facet and exits through the base.
`restOptics` retains this record unchanged, including Snell's law and the reflecting facet;
interaction still paints the true traced legs and emits at the actual traced exit.

**The resting composition is deliberately not that physical through-ray.** Its origin is
`restOptics.legs[0].to`, the first far-facet contact (`restingOrigin: "refracted-facet"`).
No internal legs are painted at rest. Seven short wavelength-ordered rays leave this contact.
Where the first contact is TIR, the illustration substitutes a signed internal sine of 0.42
(a subcritical angle), then applies Cauchy's index per wavelength. This is an explicit artistic
licence to show dispersion on the right flank, not a claim that a TIR facet transmits light.
The live calculation never substitutes this angle and retains the `|sinOut| >= 1` skip.

Portrait already transmits at the right facet, so its resting rays use the first traced leg's
actual incoming direction. Short caps are `prismSize * 0.22`; the full-bleed fan remains an
artistic exaggeration, not a simulation.

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
line — light separated by type, not light over type. Because the glass and the short spectral rays
are painted **after** it, the glass stays crisp; QA pins that with a geometric clearance check
(the glass, its vertices, the entry hinge and the short spectral rays must be ≥ 4 px clear of
every text and tile rect — verified on all four captured layouts).

The layer order is data (`SCENE_LAYERS`), exposed through `geometry().layers`, and asserted by
the suite, so the painting and the invariant cannot drift apart.

## 5. Clear glass at rest; true multi-segment optics on interaction

`buildGeometry` stores the complete `restOptics` trace but uses its first far-facet contact
for the resting origin. The drawing paints no internal traced legs at rest, only a neutral
entry hinge extending 2 px into the glass. Body, facets, fold ramp, rim, specular streak,
vertex glints and caustic pool remain. Pointer depth fades in the live legs (including TIR),
while the resting spectrum fades out and the live spectrum fades in at the true exit.
Reduced motion paints a stable, complete resting composition.

The QA geometry exposes the same internal-segment selection, hinge and spectral-ray helper
consumed by the painter. Checks require no resting internal legs, an entry hinge, at least
three distinct wavelength-monotone rays outside the triangle, and clearance from text/tile
rects for all resting exit rays. No grain-sensitive hairline pixel-diff assertion is used.

## 6. Portrait

The copy is full width, so there is no quiet band to land in and no upper-left corner to enter
from. Portrait flips the vertical: the glass sits in the top-right corner (sized 76–108 px so
it fits a 390 px frame *and* clears the display type, both measured), and the beam **rises**
from the lower-left frame edge at 14° into the entry facet. The approach angle is −14°; incidence is 44.4° from the normal, and this
refracts straight out of the right facet. The fan still falls down the
page as a curtain.

## 7. What is still illustrative

- The **full-bleed fan** is an artistic exaggeration of dispersion, with bounded turn/spread
  during interaction. It is not a wavelength-by-wavelength simulation.
- The short Cauchy-index rays are ordered by refractive index. Their length and the broad
  field are composition; the resting desktop TIR contact uses an illustrative angle (§2).
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

28 invariants per captured layout (112 total). New or rewritten in this pass:

```
✓ the resting ray is a real refraction, not a composed chord   (Snell on the resting legs)
✓ the source is outside the entry plane, at the frame edge
✓ the beam crosses the headline, and the type stays above it   (incl. layer order + DOM z)
✓ everything painted over the type is clear of it              (geometry, not pixels)
✓ the glass is whole and centre-right, sized to the room it has
✓ the illustrated field is wavy, bounded, and lands exactly on the hinge
✓ reduced motion paints one stable, complete still             (byte-identical paints)
✓ entry and exit ride the facets the trace names               (was: hard-coded corners)
✓ the incident beam is drawn along the legs the trace returned  (was: sampled on a chord)
```

```
cd scripts/hero-qa && npm run bench
```

Engine cost at 1440×720 in this session (medians, same harness before/after):

| | before | clear resting glass + resting spectrum |
| --- | --- | --- |
| composed still | 3.50 ms | 3.50 ms |
| live | 3.82 ms | 3.69 ms |

112 checks pass across the four captured layouts. Full-bleed coverage, prime-lane tolerance,
physical trace invariants, catch release and stable reduced-motion paints remain asserted.
The catch test now compares equal scene clocks (30 × 16 ms), rather than a settled t=4.6s
wave against a live t=0.48s wave. ESLint, TypeScript and production build pass.
These refreshed stills are offline compositions, not browser screenshots; real-browser visual
review and the tablet/very-wide layout sweep remain owed.
