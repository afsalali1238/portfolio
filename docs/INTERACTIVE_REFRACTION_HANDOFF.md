# Interactive Refraction Handoff

## The Refraction Engine

**Location:** `/thesis`, with a dedicated laboratory route at `/lab/refraction`.

The engine is a browser-native 2D optical instrument for _The Refraction of Thought_. It treats the interface as a compact measurement plate: an incoming ray crosses a finite polygonal prism, slows according to the selected refractive index, and exits as five discrete Cauchy-dispersed wavelength bands.

The visual direction is laboratory craft, not spectacle: paper and ink tokens, hairline construction grid, restrained spectral strokes, Instrument Serif headings, and a monospace readout. There is no neon gradient or continuous decorative rainbow.

## Files

| File                                             | Responsibility                                                                                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/components/refraction/types.ts`             | Shared vectors, physical constants, presets, spectrum bands, telemetry types.                                                 |
| `src/components/refraction/opticsMath.ts`        | Pure vector math, polygon casting, Snell refraction, total internal reflection, Cauchy dispersion, and spectral path tracing. |
| `src/components/refraction/audioSynthesizer.ts`  | SSR-safe native Web Audio controller for the density hum, boundary click, and dispersion chord.                               |
| `src/components/refraction/RefractionCanvas.tsx` | DPR-aware Canvas 2D renderer, pointer/keyboard beam control, resize/theme/visibility lifecycle.                               |
| `src/components/refraction/TelemetryOverlay.tsx` | DOM telemetry HUD and the density, surface, preset, mute, and band controls.                                                  |
| `src/components/refraction/RefractionEngine.tsx` | SSR-safe component composition, mutable physics state, and audio lifecycle.                                                   |
| `src/routes/thesis.tsx`                          | Manifesto embedding.                                                                                                          |
| `src/routes/lab/refraction.tsx`                  | Standalone laboratory view.                                                                                                   |

## Physics contract

### Geometry

`intersectRaySegment` solves the ray `P(t) = P0 + tD` and a finite segment with 2D cross products. It discards parallel rays, non-positive ray distances, and segment coordinates outside `[0, 1]`. `intersectRayPolygon` tests each prism face and returns the minimum positive impact with a consistently outward unit normal for either winding direction.

### Snell vector form

`refract` face-forwards the supplied polygon normal before evaluating:

- `cos(theta1) = -dot(I, N)`
- `eta = n1 / n2`
- `sin²(theta2) = eta² × (1 - cos²(theta1))`

When the transmitted term exceeds one, it returns the reflected ray and raises the total-internal-reflection telemetry flag. The tracer supports up to four internal bounces before safely ending a pathological path.

### Dispersion model

The red band is the refractive-index control reference at **680 nm**. The other bands use a crown-glass-calibrated, red-anchored Cauchy term. Anchoring preserves `n = 1.000` as an actual vacuum with no false dispersion, while crown glass yields an approximately `Δn = 0.040` red-to-violet spread.

| Band    | Wavelength | Hex       | Output label |
| ------- | ---------: | --------- | ------------ |
| Red     |     680 nm | `#ef4444` | Perception   |
| Amber   |     590 nm | `#f59e0b` | Empathy      |
| Emerald |     520 nm | `#10b981` | Craft        |
| Cyan    |     480 nm | `#0ea5e9` | Rigor        |
| Violet  |     410 nm | `#a855f7` | Becoming     |

## Interaction contract

- **Canvas drag:** changes the incident beam direction, clamped to ±30°.
- **Keyboard:** focus the canvas, then use Up/Down for 1° increments or Shift + Up/Down for 5° increments.
- **Density slider:** adjusts the red-reference refractive index from 1.000 to 2.400.
- **Presets:** Vacuum (1.000), Crown glass (1.520), Diamond (2.400), and Stone wall.
- **Surface response:** prism transmits and disperses; stone wall returns a specular reflection.
- **HUD:** reports physical incident angle, medium index, `v = c/n`, dispersion spread, and transmission/reflection/TIR state.

On narrow screens the canvas has a 3:2 working area, controls stack beneath it, and material presets scroll horizontally.

## Audio contract

Audio is muted by default. `OpticalAudioSynthesizer` constructs its `AudioContext` only in a browser effect, immediately keeps it suspended, and resumes it only in an explicit user gesture. It provides:

1. A 110 Hz sine hum through a Q=2 low-pass filter, with cutoff `200 + 400 × (n - 1)` Hz and gain proportional to density.
2. A 2 ms band-pass noise transient at an interface change.
3. Quiet 440/660/880 Hz sine micro-chimes after a dispersed exit.

All nodes are disconnected and the context is closed on component cleanup.

## Performance and SSR notes

- No Canvas, `window`, animation, observer, or AudioContext call is evaluated at module scope.
- The renderer owns pointer coordinates, ray calculations, and telemetry in a mutable ref; React updates only discrete preset, surface, and mute controls.
- The canvas uses a requestAnimationFrame loop while visible, caps its backing DPR at 2, watches its own size, and repaints palette values after theme changes.
- The DOM HUD writes its output nodes at a restrained cadence rather than scheduling React renders on pointer movement.

## Validation

Run from the repository root:

```bash
pnpm build
pnpm lint
```

The Vite/TanStack build regenerates `src/routeTree.gen.ts` after the standalone `/lab/refraction` route is added.
