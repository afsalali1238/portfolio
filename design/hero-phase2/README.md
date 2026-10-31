# Hero — phase 2: spectral body + Tesla plasma

Phase 2 adds the discharge. The field is now the full chain up to the fan:
ray → glass → core → **ribbon + plasma braid** → off-canvas.

## What to judge

| File                                       | What it is                                                      |
| ------------------------------------------ | --------------------------------------------------------------- |
| `phase2-page-1440x780.png`                 | light, live page, clipped to the hero                           |
| `phase2-page-1440x780-dark.png`            | same, `.dark` — this is where the plasma is strongest           |
| `phase2-page-1024x768.png`                 | the narrow desktop where the veil seam was worst before         |
| `phase2-page-390x820.png`                  | portrait variant                                                |
| `motion-reel.png` / `motion-reel-dark.png` | six frames across one second of the real loop                   |
| `phase2-engine-*.png`                      | the canvas layer alone, for diffing what the engine contributes |

The reel is the important one. The page clock is frozen and stepped at 16.67 ms, so those
frames are what the loop actually produces — not a still that happened to look good.

## What changed since phase 1

- **Plasma (layer 3).** Per band: an ionised haze, a coloured channel, and a discharge core,
  drawn as an angular polyline through nine anchors — current takes the shortest path between
  strike points, so the channel breaks rather than undulating. Three discharge knots brighten
  where the current pools. Three dendritic forks, one level deep, tapering over three runs.
- Jitter is read from a **24 fps bucket** via a hash, never `Math.random`, so a frame is
  reproducible: the reel and the browser see the same crackle for the same bucket. No
  allocation inside a frame.
- **Density is graded by band** (§0.4: dense at the core, calm at the frame edges): the
  plasma weight per band scales the whole pass, and the strand envelope scales it too.
- **Light-theme hot core is a saturated filament, not white.** A white discharge on cream is
  invisible; on ink it stays white-hot. Same read, inverted.
- **Branches stay out of the type column** (`x < 0.86·heroW`) and out of the core radius.

## Numbers

|               | 1× CPU     | 6× CPU                                                      |
| ------------- | ---------- | ----------------------------------------------------------- |
| paint median  | **0.5 ms** | **3.1 ms**                                                  |
| paint p95     | 0.8 ms     | 6.9 ms                                                      |
| longest frame | none       | 60 ms, of which **script ≤ 6 ms** (rest is software raster) |
| resize cost   | 0.3–1.1 ms | 0.3–3.7 ms                                                  |
| budget (§8)   | ≤ 4 ms     | ≤ 12 ms                                                     |

Resize was the real find this phase. Two fixes, both in `HeroPrism.tsx`:

1. The baseline probe span in `hero-layout.ts` mutated the DOM and forced a synchronous
   layout on every measure — 40–70 ms per resize gesture. The baseline is now derived from
   the line box and the font's own ascent/descent via one detached measuring canvas.
2. The canvas backing store was reallocated on every resize event (155 ms at worst). Layout
   is now measured on every observer callback (sub-millisecond) while the backing store
   commits once the drag goes quiet, on idle, and only if the surface changed by >2%.

Long frames during a 6×-throttled resize are **render, not script** — measured with the Long
Animation Frame API (`script ≤ 6 ms · raster ≤ 69 ms`). That is the compositor rasterising a
full-hero canvas in software; the JS-side budget is met with room to spare.

Regenerate:

```bash
npm run dev
npm i -D playwright-core && npx playwright-core install chromium
node tools/hero-qa.mjs            # page stills + reduced-motion audit
node tools/hero-motion-reel.mjs   # frames + contact sheet (HERO_DARK=1 for dark)
node tools/hero-perf.mjs          # perf (HERO_THROTTLE=6 for throttle)
cd scripts/hero-qa && npm i && npm run check   # invariants + engine-only stills
```
