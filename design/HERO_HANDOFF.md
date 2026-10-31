# HANDOFF — Hero: Tesla × Pink Floyd dispersion field, integrated

**Repo** `afsalali1238/portfolio` · **Base** `main` @ `d7208e6` · **Stack** TanStack Start + React 19 + Tailwind 4 + Vite 8 · **Target** `src/components/sections/`

## 0. Creative contract

One continuous, physically coherent light chain that occupies the **entire** hero and reads as part of the page, not a graphic beside it:

> a coherent ray leaves the last sentence of the headline → enters a glass prism → refracts through internal caustics → erupts at an incandescent core → disperses into a full-height spectral fan braided with Tesla plasma → the light visibly grounds on the four stat tiles.

Non-negotiables:
1. **No seam.** No hard vertical veil. The background dissolves behind type and resumes beyond it.
2. **Layout-derived geometry.** Positions come from measured DOM rects, never from `%` of the section.
3. **Continuity invariant.** Every strand's first vertex is *exactly* the exit point; envelope is 0 at both ends.
4. **Electric, not noisy.** Plasma density is deliberate: dense at the core, calm at the frame edges.
5. **60 fps or it doesn't ship.** No `shadowBlur` in any loop.

## 1. Starting point (already in `main`)

```
src/components/sections/
  Hero.tsx          # section + copy + stat tiles + 2 veil divs
  HeroPrism.tsx     # lifecycle shell (~170 lines) — keep, extend
  hero-ray.ts       # DOM-free engine (~605 lines) — replace internals
```

Current engine API (`createHeroRay`):

```ts
resize(w, h)                 // rebuild geometry
setTheme(dark: boolean)
setPointer(x, y, active)     // container-relative CSS px
addSurge(x, y, at)           // now = performance.now()
paint(ctx, dtMs, now)        // advance + draw
paintStill(ctx)              // composed still for reduced motion
geometry()                   // debug: vertices, hit, exit, targets
```

`Ctx` is a structural subset of `CanvasRenderingContext2D` so the engine also runs in node. **Keep that property** — it powers the headless QA harness in §10.

## 2. Architecture

```
hero-ray.ts        pure drawing engine (no React, no DOM, no window)
hero-layout.ts     NEW — reads DOM rects, returns a LayoutSnapshot
HeroPrism.tsx      shell: sizing, DPR, rAF, IO, theme, pointer → engine
```

Data flow:

```
ResizeObserver ─┐
MutationObserver(theme) ─┼─▶ shell ─▶ engine.resize/setTheme/setLayout
pointermove ────┘                       │
                                        ▼
                             paint(ctx, dt)  →  4 layers
```

`hero-layout.ts`:

```ts
export type LayoutSnapshot = {
  heroW: number; heroH: number;
  copyRight: number;                       // h1/p right edge, hero-relative
  thesisLine: { left: number; right: number; baselineY: number };
  tiles: { x: number; top: number; bottom: number; cx: number }[]; // 4
  container: { left: number; right: number };
  columns: number[];                       // 12 column x-positions
};

export function measureHero(hero: HTMLElement): LayoutSnapshot;
```

Add stable hooks in `Hero.tsx` (no visual change): `data-hero-copy`, `data-hero-thesis`, `data-hero-tiles` on the stats grid, and `data-hero-tile` on each `StatLink`.

## 3. Geometry contract

Prism (desktop):

```
size  = clamp(min(heroW, heroH) * 0.30, 96, 190)
cx    = container.right - size * 2.05
cy    = heroH * 0.47
V_top   = (cx,            cy - size * 0.88)
V_left  = (cx - size*0.52, cy + size * 0.58)
V_right = (cx + size*0.52, cy + size * 0.58)
```

Facet-parametric entry/exit — **never** free-floating offsets:

```
P_in   = V_top + t·(V_left  − V_top),   t = 0.30        // rides the incident facet
P_exit = V_top + u·(V_right − V_top),   u = 0.52        // the sole dispersion origin
```

Incident ray source (full-bleed, copy-safe):

```
S = (thesisLine.right + 6, thesisLine.baselineY)        // it leaves the sentence's period
```

Clamp `S.x ≤ container.right` and require `|P_in − S| ≥ 180px`, else fall back to `S = (copyRight + 40, heroH * 0.06)` entering from the top edge.

Strand generation — the continuity invariant:

```
E(s) = pow(sin(π·s), 0.9)                     // E(0)=E(1)=0 exactly
off(s) = ( A·sin(2π·f·s − ω·t + φ)
         + 0.26A·sin(2π·2.3f·s + 1.35ω·t) ) · E(s)
P(s)  = P_exit + s·(T_k − P_exit) + off(s)·n̂   where n̂ ⟂ (T_k − P_exit)
```

`A` = 6–12 px (not the old 14–26: at ~700 px span that read as hairlines). `φ = k·0.55` — keep phase scatter small or strands cross lanes and the fan stops reading as dispersion.

Fan targets — full-bleed, off-canvas:

```
T_k = ( heroW + 80,  lerp(-0.02·heroH, 1.02·heroH, k / (N−1)) )
```

**Do not** retarget bands to node positions (v2 bug: it broke angular order and produced crossings).

Mobile (`heroW < 768`): portrait variant — prism at `(0.78w, 0.13h)`, size `clamp(min(w,h)*0.26, 72, 110)`, targets spread `y ∈ [−0.05h, 0.55h]`. Keep the fan; do not strip the effect.

## 4. Palette

Seven bands, print-graded so hues read as pigment on `#F7F4EE` (light) and as light on `#1B1815` (dark). Clay is always the flagship.

| # | Band | Light | α | Dark | α | Width |
|---|---|---|---|---|---|---|
| 0 | Red | `#B03A2B` | .46 | `#E86A55` | .62 | 1.05 |
| 1 | Amber | `#BF6A18` | .54 | `#F0A544` | .70 | 1.25 |
| 2 | **Clay (flagship)** | `#A8471B` | **.92** | `#E67E54` | **1.0** | **2.20** |
| 3 | Emerald | `#2F7D5E` | .44 | `#31C89A` | .58 | 1.10 |
| 4 | Cyan | `#2A6F86` | .40 | `#39C0DA` | .56 | 1.05 |
| 5 | Cobalt | `#33518E` | .36 | `#5A8AF0` | .52 | 1.00 |
| 6 | Violet | `#5B4A8C` | .32 | `#9B7BF0` | .48 | 0.95 |

Ink/clay tokens stay authoritative for text; these are only for the field. Glow alphas = band α × 0.22 for the corona pass.

## 5. Layer order (back → front)

| # | Layer | Notes |
|---|---|---|
| 1 | **Drafting plate** | 12 column rules at 4% ink, corner crop marks on `container`, baseline ticks, caustic ellipse under the glass, 2.5% grain, corner vignette. **Pre-render to an offscreen canvas** on resize/theme only. |
| 2 | **Spectral body** | 7 volumetric ribbons: tapered polygon ±(0.5 → 14px) along each strand, linear gradient along `P_exit→T_k`, α .035–.09. Cached gradients (rebuild only on geometry/theme change). |
| 3 | **Tesla plasma** | Per band: 3-pass stroke (6px @ α·.12 → 2px @ α·.55 → 0.9px @ α·.95 white-hot core), 3 dendritic branches at s = .36/.64/.82, angle ±(0.55–0.90 rad), length 24–46% of span, jitter quantised to 24 fps via a time bucket. Suppress branches when `dist < 70px`. |
| 4 | **Prism & core** | Glass: white-only gradient fill (α .52→.10) — *any warm stop in the shell makes it look like beige paper*; 1.3px ink edge at 40%; bright inner edge on the incident facet; 3 internal chords to `u = .42/.52/.62`; caustic radial pooling at `P_exit`; core bloom white→clay→transparent at `r = size·0.28`; 1.9px white point; 4 orbiting micro-sparks. |
| 5 | **Grounding filaments** | From the fan ray nearest each tile to that tile's top-centre: hairline + terminal node. Reasons the fan into the catalogue. |
| 6 | **Atmosphere** | 14–24 motes (α .04–.10), photon packets on the incident beam, flourish ring on click. |

Type always renders above (`z-10`); the canvas is `z-0` and `pointer-events-none`.

## 6. Blending (this is the whole point)

Replace the two veil divs in `Hero.tsx` with a **dissolve mask in the engine**:

```
for each text rect R (h1 lines, lede, CTA row):
  d = distance from point to R
  alphaMul *= smoothstep(clamp((d − 8) / 40, 0, 1))   // 0 at the box, 1 at 48px away
```

Apply to layers 2–3 (body + plasma) only; keep plate, glass, core and filaments at full strength. Result: lines pass behind words, fade out, resume — the page and the drawing share one plane, with zero legibility cost.

Plus one soft radial paper lift (`paper` @ 0.35, `r = 0.55·max(w,h)`) centred on the copy block — a radial gradient has no edge, so it can't create a visible seam.

## 7. Interaction

| Trigger | Response | Timing |
|---|---|---|
| Idle | ribbons undulate, photons climb the beam, core breathes | 1.5 Hz core, 0.15–0.25 Hz strands |
| Pointer move over hero | core attracts real Tesla arcs (2 chords + branches); strands lean ≤10px within 170px | τ = 90 ms follow |
| Pointer idle 2.6 s | lean + arcs release | ease-out |
| Click / tap | surge: `E=1` → amplitude ×1.35, glow ×1.6, white-out core 80 ms, shockwave ring 8→238px, decay `exp(−t/280)`, ≤950 ms | |
| Hover a stat tile | that tile's grounding filament + its band surge; other bands dim to 0.45 | 150 ms |
| Hover the headline | incident ray brightens ×1.3 | 150 ms |
| `prefers-reduced-motion` | one composed still via `paintStill`, no rAF ever | |

## 8. Performance rules

- **Zero `shadowBlur`.** Pre-render one 64×64 radial glow sprite per theme; `drawImage` it scaled for corona.
- Cache every gradient (per band, per theme, per geometry version); invalidate on resize/theme only.
- Pre-render the drafting plate to an offscreen canvas.
- Flat `Float32Array` point buffers per strand (`STRAND_STEPS = 40`); no per-frame object allocation.
- `dpr = min(devicePixelRatio, 2)`; context transform absorbs it, all maths in CSS px.
- Pause on `IntersectionObserver` (< 2% visible), `visibilitychange`, `blur`.
- Budget: **≤ 4 ms** CPU per frame at 1440×800 @1× CPU throttle; ≤ 12 ms at 6× throttle. Log paint cost behind `?heroDebug=1`.
- `ResizeObserver` → rAF-coalesced resize, never per event.

## 9. Headless QA (how to see it without a browser)

```bash
mkdir -p /tmp/render && cd /tmp/render && npm init -y && npm i @napi-rs/canvas
node --experimental-strip-types render.mts   # imports src/.../hero-ray.ts directly
```

```ts
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { createHeroRay } from "/path/to/src/components/sections/hero-ray.ts";

const W = 1440, H = 780;
const ray = createHeroRay();
ray.setTheme(false); ray.resize(W, H);
const layer = createCanvas(W, H);
ray.paintStill(layer.getContext("2d") as any);

// composite over paper, then draw the real type on top using @fontsource .woff files
```

Register `@fontsource/instrument-serif/files/*-latin-400-normal.woff` with `GlobalFonts.registerFromPath` for a faithful mock. Always composite **with type** — the composition is meaningless without it.

## 10. Build order

| Phase | Deliverable | Checkpoint |
|---|---|---|
| 1 | `hero-layout.ts` + engine `setLayout()`; prism & ray in register at 3 widths | stills at 1440/1024/390 |
| 2 | Spectral ribbons + Tesla plasma at full density | still + 3 frames from a synthetic motion reel |
| 3 | Glass, core, filaments, plate, atmosphere | light + dark stills |
| 4 | Dissolve mask; delete veil divs from `Hero.tsx` | type-contrast check |
| 5 | Interaction: arcs, lean, surge, tile coupling | manual pass |
| 6 | Perf + a11y audit, `paintStill` frame | throttled profile |

Ship in that order — each phase ends with a rendering you can actually judge.

## 11. Acceptance criteria

- [ ] Light 1440×780, dark 1440×780, mobile 390×820 all look composed **with type**, no seam at any width.
- [ ] `grep -c shadowBlur src/components/sections/*.ts*` → `0`
- [ ] ≤ 4 ms/frame; no long task > 50 ms on resize.
- [ ] Reduced motion → exactly one `paintStill`, zero rAF.
- [ ] Every strand's `P(0)` equals `P_exit` within 0.01px (unit check against `geometry()`).
- [ ] Hovering each stat tile brightens exactly one band.
- [ ] `npx tsc --noEmit` clean; `npx eslint src/components/sections src/routes/index.tsx` clean; `npm run build` green.

## 12. Gotchas learned the hard way

1. Hard vertical veil ⇒ the seam you're complaining about. Dissolve, don't mask.
2. Warm gradient stops in the glass shell ⇒ the prism looks like a beige paper cut-out. Shell stays white; warmth only in caustics.
3. Retargeting bands to constellation nodes ⇒ crossing rays, broken spectrum order. Keep `T_k` ordered.
4. `A` above ~14px over 700px ⇒ hairlines; below ~5px ⇒ wires. 6–12 is the window.
5. `shadowBlur` inside per-item loops ⇒ 20 ms frames and the auto-DPR fallback makes it *worse*. Sprites.
6. Prism below ~0.22·min(w,h) ⇒ reads as a diagram, not glass.
7. Fan on `heroW < 768` ⇒ stubs behind text; portrait it instead of deleting it.
8. Canvas `width` assignment per resize event ⇒ layout thrash. Coalesce in rAF.

## 13. Repo hygiene

- Prettier: `printWidth 100`, double quotes, semicolons, all trailing commas.
- `eslint src` is **already red on main** (128 pre-existing prettier errors in `src/routes/notes/*`). Your hero work must be clean when linted directly; a separate `npx prettier --write src` commit would green CI, and CI gates on `tsc → eslint → build`, so it currently can't pass regardless of the hero.
- Delete `design/frames/*.png` (~870 KB) if you don't want reference stills in the repo.
