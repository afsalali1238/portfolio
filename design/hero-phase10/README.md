# Hero Phase 10 — Scroll-Linked Light

Scroll-scrubbed optical coupling for the hero prism (`src/components/sections/hero-ray.ts` + `src/components/sections/HeroPrism.tsx`). Moving the scrollbar down and up smoothly and reversibly moves the incident beam, prism entry point, internal refraction leg, prism body, and dispersion fan together across `0 → 1` of the hero's scroll range.

## Direction & Scope

- **Direction (`SCROLL_LIFTS_LIGHT = true`)**: Scrolling down lifts the optical chain upward (`0 → 1`); scrolling back up lowers it smoothly back to the exact resting composition (`1 → 0`).
- **Scope (`Plan A + Plan B`)**:
  - **Plan A — Facet slide & live refraction**: Scroll moves the parametric facet landing `entryU` along `topV → leftV` (`0.26 → 0.56` on wide viewports; `0.56 → 0.18` on portrait viewports, lifting the entry away from the lede), walks the incident `source` back along `geo.beamAngle` onto the `x = 0` or `y = 0` frame edge ($C^0$ across the `(0, 0)` corner), and re-runs `tracePrism` so internal refraction, spectral exit hairs, and `fanOrigin` stay physically coupled.
  - **Plan B — Safe vertical travel (`scrollBand`)**: `buildGeometry()` solves `scrollBand = { up, down }` once per layout against the top edge, the stat-tile ceiling, horizontal `24 px` clearance from every shared-band text box, and headline overlap so the incident beam still crosses the display `<h1>` at `p = 1` without ever crossing the body copy (`lede` or `cta`). On portrait viewports (`top = 10 px`), `scrollBand.up = 0` and all motion comes cleanly from Plan A.

## Architecture & Guarantees

| Requirement                      | Implementation                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sticky header scroll progress    | `resize()` caches `heroDocTop = rect.top + window.scrollY`; `onScroll` computes `p = clamp((heroDocTop - rect.top) / heroH, 0, 1)` so `scrollY = 0` maps strictly to `p = 0` even below the sticky `<SiteHeader />`.                                                                                           |
| Frame-rate-independent smoothing | `scrollEase += (scrollTarget - scrollEase) * (1 - exp(-dtMs / 140))` using real `dtMs` (`τ = 140 ms`), snapping within `5e-4`.                                                                                                                                                                                 |
| Idle throttle & touch drift      | `SCROLL_WAKE_MS = 400`: `frame()` runs at full `60 fps` while scrolling/easing and suppresses autonomous mobile drift (`scrollOwnsField`), cleanly releasing `autonomous` if `scrollProgress > 0.02` arrives mid-drift.                                                                                        |
| Parked pointer re-projection     | `onScroll` re-projects `(pointerPageX - window.scrollX, pointerPageY - window.scrollY)` against `rect` only when inside `[0, cssW] × [-40, cssH + 40]`, releasing cleanly once scrolled past the hero.                                                                                                         |
| Pointer precedence               | Inside the glass (`pointerInGlass > 0`), `entryU`, internal multi-bounce/TIR path, and `fanOrigin` blend toward the pointer trace via `pointerInGlass` and hand back smoothly to `scrollEntryU` upon pointer release.                                                                                          |
| `prefers-reduced-motion`         | `HeroPrism.tsx` skips scroll coupling under `prefersReduced`, and `ray.paintStill()` resets live scroll state before painting and restoring `scrollTarget` — byte-identical whether called before or after `setScroll(1)`.                                                                                     |
| Zero per-frame heap Churn        | Pre-allocated live vertex/source/hit/exit/leg scratch structs (`liveSourceScratch`, `liveTopScratch`, `scrollLegBuf`, `solveSourceInto`), bucketed gradient cache (`SCROLL_CACHE_BUCKETS = 32`), and live `rayExit(...) * OVERSHOOT` strand recomputation in `fillStrand` reusing `Float32Array` `strandBufs`. |

## Verification

Headless verification via `@napi-rs/canvas` in `scripts/hero-qa/` (same environment note as Phase 9 — Chromium lacks system `libnspr4`/`libnss3` in this container, so all checks, composite sweeps, and benchmarks run directly against the engine + `@fontsource` fonts):

- **`npm run check` (`scripts/hero-qa/check.mts`)**: **33 / 33 invariants pass** across all 4 measured captures (`1024x768`, `1440x780-dark`, `1440x780`, `390x820`), including 5 new Phase 10 scroll invariants (`scrollBand` containment & body-copy clearance across `p ∈ {0, 0.5, 1}`, `entryU ∈ [0.12, 0.86]` + byte-identical `paintStill()`, `dtMs`-independent convergence & `0 → 1 → 0` reversibility, `pointerInGlass` precedence & hand-back, and strand root/tip bleed + `Float32Array` buffer reuse).
- **`npm run sweep` (`scripts/hero-qa/sweep.mts`)**: **17 viewports × 3 scroll states (`p ∈ {0, 0.5, 1}`) = 51 / 51 compositions clean**, zero glass clips, zero shared-band type collisions, zero body-copy beam crossings, and portrait stat-panel containment preserved at every `p`.
- **`npm run bench` (`scripts/hero-qa/bench.mts` at `1440×720`)**:
  - `still`: median **2.59–2.81 ms**
  - `live`: median **2.98–3.00 ms**
  - `scroll`: median **2.80–2.91 ms** (p95 **3.37–3.61 ms**, well within the `≤ 4.00 ms` budget)

### Scroll Travel Summary (`sweep.mts`)

| Viewport                  | Hero (`W×H`) | Glass    | `p = 0` (`y`, `u`) | `p = 0.5` (`y`, `u`) | `p = 1.0` (`y`, `u`) |
| ------------------------- | ------------ | -------- | ------------------ | -------------------- | -------------------- |
| `320x700`                 | `320×710`    | `79 px`  | `y=50 (u=0.56)`    | `y=36 (u=0.37)`      | `y=23 (u=0.18)`      |
| `390x820` (light & dark)  | `390×697`    | `87 px`  | `y=54 (u=0.56)`    | `y=39 (u=0.37)`      | `y=24 (u=0.18)`      |
| `640x900`                 | `640×724`    | `135 px` | `y=79 (u=0.56)`    | `y=55 (u=0.37)`      | `y=32 (u=0.18)`      |
| `768x1024`                | `768×684`    | `217 px` | `y=295 (u=0.26)`   | `y=251 (u=0.41)`     | `y=207 (u=0.56)`     |
| `1024x768`                | `1024×720`   | `230 px` | `y=308 (u=0.26)`   | `y=258 (u=0.41)`     | `y=207 (u=0.56)`     |
| `1440x780` (light & dark) | `1440×720`   | `230 px` | `y=323 (u=0.26)`   | `y=261 (u=0.41)`     | `y=198 (u=0.56)`     |
| `1920x1080`               | `1920×720`   | `230 px` | `y=323 (u=0.26)`   | `y=260 (u=0.41)`     | `y=198 (u=0.56)`     |

## Artifacts in `design/hero-phase10/`

- **Flagship scroll triptychs (`p = 0`, `p = 0.5`, `p = 1`)**:
  - `1440x780-{p0,p05,p1}.png` & `1440x780-dark-{p0,p05,p1}.png`
  - `1024x768-{p0,p05,p1}.png`
  - `390x820-{p0,p05,p1}.png` & `390x820-dark-{p0,p05,p1}.png`
- **Full 17-viewport scrolled sweep (`p = 1`)**: `*-p1.png` across `320x700` through `1920x1080` (pass `--all-frames` to `sweep.mts` to emit `p0` and `p05` for all 17 viewports).
- **Measured-capture engine plates (`check.mts`)**: `phase10-engine-{1024x768,1440x780,1440x780-dark,390x820}{,-catch,-scroll}.png`.
