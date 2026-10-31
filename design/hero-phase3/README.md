# Hero — phase 3: full coverage, plate, filaments, atmosphere

Phase 3 was pulled sideways, on purpose. The handoff's phase plan puts the plate, glass, core,
filaments and atmosphere here — but the brief also asked for the field to occupy the **whole**
hero, not the right third. So this phase delivers both, and coverage is the headline result.

## What changed

**Coverage — the field now reaches every edge of the hero.**

The fan was always wide; what was missing was the _other half_. A prism has three exits, and
until now only one was drawn:

1. **The fan** (refraction) — leaves the right edge, spread over the full height.
2. **The reflected ray** — part of the beam never refracts. It falls from the incident facet
   past the copy's right edge, then runs the gutter above the catalogue and off the left edge.
   Every stat tile taps off it.
3. **The specular exit** — light leaving through the apex, crossing the top margin and off the
   left edge. It is what keeps the upper-left of the page from being dead paper.

Neither exit ray is free-drawn: both are Catmull-Rom splines through **waypoints sampled from
the measured layout**, and the corridor they take is chosen so they never enter a text box.
That is now an invariant, not an intention — `check.mts` samples the exact curve the engine
draws (`buildPath` is exported for that reason) and fails if any sample lands in a quiet rect.

Portrait is honest about its limit: on a 390 px screen the copy is full-width, so the only
corridor is the strip above the headline. The apex ray takes it, the reflection becomes a
corner flare, and the tiles get self-contained stubs instead of taps across the page. The
check encodes that asymmetry rather than pretending it away.

**The rest of the phase:**

- **Drafting plate** (layer 1) — 12 column rules at 4% ink, crop marks on the container,
  baseline ticks, the caustic ellipse under the glass, grain. Rasterised **once per
  geometry/theme** onto an offscreen surface and blitted. No vignette, no border: §0 forbids an
  edge around the field, and a vignette reads as exactly that.
- **Grounding filaments** (layer 5) — one per tile, from its tap on the reflected ray to its
  top-centre, with a bright terminal node and a faint ring. The fan is now visibly reasoned
  into the catalogue.
- **Core** — a clay corona at `size·0.62`, the white→clay bloom at `size·0.28`, the point, and
  four orbiting micro-sparks. Its strength follows the ledger's `balance`, which is measured
  from where the copy actually ends.
- **Atmosphere** — 18–24 motes drifting on a deterministic hash (no state, no allocation), and
  photon packets that ride the _whole_ chain by arc length: up the beam, through the glass, out
  along the clay lane, so their speed is constant across the segments.
- **`ledger`** — a new measured object on the layout snapshot: merged quiet rects, baseline
  ticks, and the balance. Every layer reads from it, so the drawing and the type can never
  disagree about where the words are.

## Numbers (production build, 1440×800)

|               | 1× CPU     | 6× CPU                                      |
| ------------- | ---------- | ------------------------------------------- |
| paint median  | **0.5 ms** | **3.7 ms**                                  |
| paint p95     | 1.6 ms     | 17.9 ms                                     |
| resize cost   | 0.3–2.6 ms | 0.3–10.2 ms                                 |
| longest frame | none       | 124 ms — **script ≤ 7 ms**, raster ≤ 136 ms |
| budget (§8)   | ≤ 4 ms     | ≤ 12 ms                                     |

p95 at 6× rose from 6.9 → 17.9 ms: the plate blit plus two more full-width rays is real work.
It is still under the 6× budget on the median, and the remaining long frames are raster. If we
want the tail down, the next lever is dropping resolution above 2.2 M device pixels (already
capped) or shortening the exit-ray passes.

## Judge it in this order

1. `phase3-page-1440x780.png` — light. The three exits should read as one light chain.
2. `phase3-page-1440x780-dark.png` — the same composition with light as the medium.
3. `phase3-page-1024x768.png` — the width where the veil seam was worst before phase 4.
4. `phase3-page-390x820.png` — portrait: top strip, corner flare, stubs.
5. `motion-reel-light.png` / `motion-reel-dark.png` — six frames across one second, real loop.
6. `phase3-engine-*.png` — the canvas layer alone.
