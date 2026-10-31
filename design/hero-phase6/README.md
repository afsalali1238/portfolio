# Phase 6 — release audit

Phase 6 adds no drawing. It answers the questions a render cannot, and it turns the handoff's
§11 checklist into things a script asserts. `node tools/hero-audit.mjs` is the new runnable:
twelve checks, exit code 1 on failure, so it can gate a release.

Final state: **all twelve audit checks pass, on four consecutive runs.**

## §11 acceptance criteria, measured

| Criterion (handoff §11)                                  | Evidence                                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Light 1440, dark 1440, mobile 390 composed **with type** | `phase6-page-{1440x780,1440x780-dark,1024x768,390x820}.png`, judged with the real type on top                                  |
| No seam at any width                                     | worst background step **3.25/255** against a 4/255 budget, across 3 widths × 2 themes                                          |
| `grep -c shadowBlur src/components/sections/*.ts*` → 0   | **0** in all ten files                                                                                                         |
| ≤ 4 ms/frame                                             | **0.50 ms** median idle, **0.60 ms** median while arcs + lean + surges are live (p95 0.80 / 2.10)                              |
| No long task > 50 ms on resize                           | **0 long tasks** across six viewport steps; hero's own resize share 0.5–1.6 ms, canvas commit deferred to the 140 ms idle slot |
| Reduced motion → one `paintStill`, zero rAF              | **0 rAF calls** through load + resize + pointer move; 718 310 painted pixels; `pointerEase 0`, `surges 0`                      |
| `P(0) = P_exit` within 0.01 px, all seven strands        | invariant suite green on all 4 captured layouts                                                                                |
| Hovering each stat tile brightens exactly one band       | `hoverTile` + `bandVoice` ×1.45 / ×0.45, asserted in `hero-interaction.mjs`                                                    |
| `tsc --noEmit` / `eslint` / `npm run build` clean        | all three clean (build: 27 sitemap URLs)                                                                                       |

## The twelve audit checks

```
✓ canvas is decorative: aria-hidden, untabbable, and cannot eat clicks — aria-hidden=true pointer-events=none
✓ every hero control is reachable by Tab — 6 hero stops: a, a, a, a, a, a
✓ every focus stop has a visible ring (outline or box-shadow) — 0 stop(s) without a ring
✓ each stat tile has a full spoken label — "16 builds — Total shipped. See them." · … · "8 builds — For wife, friends, me. See them."
✓ tile value clears 3:1 against its own surface — 17.44:1
✓ reduce-motion stays at zero rAF through a resize and a pointer move — rAF calls: 0
✓ reduce-motion still paints a composed frame after the resize — 718 310 painted pixels
✓ reduce-motion suppresses interaction state — pointerEase=0 surges=0
✓ an idle frame stays under the 4 ms budget — median 0.50 ms · p95 0.80 ms
✓ a frame with arcs, lean and surges stays under the 4 ms budget — median 0.60 ms · p95 2.10 ms
✓ a drag-rate resize debounces the backing store instead of reallocating per event — 1–2 allocations across 6 widths
✓ interaction does not degrade the median frame — idle 0.50 ms → interacting 0.60 ms
```

Two of these exist because the first version of them lied:

- **The tab-order check silently passed on three stops.** The hero is not first in the tab order,
  so "tab nine times" only ever reached the nav. It now walks the document until the section is
  entered _and_ left, with a hard cap, and finds all six.
- **The resize check first asserted "the backing store never moves mid-drag".** That is not what
  the shell does — it debounces to the first idle slot 140 ms after the last event, so a fast drag
  can commit once or twice. The assertion now measures the real guarantee: no long task, at most
  two reallocations across six width steps, and the store settled on the final CSS size.

## What changed in the engine during this phase

Nothing visual — the reduced-motion frame this phase is **pixel-identical to phase 5's**
(canvas hash `c5df63c1`; max channel delta 1/255, mean 0.000). Two fixes landed underneath:

1. **The plate canvas is reused across rebuilds.** Allocating a fresh 1440×720 backing store on
   every resize step was the largest single resize cost. This briefly broke the frame in a way
   worth recording: the shell hands out one canvas, so a cached _veil_ surface (my first attempt
   at caching the dissolve stencils) overwrote the plate and silently deleted the drafting grid
   and its crop marks. Caught by diffing the static frame against phase 5, reverted to painting
   the stencils into the plate at build time — the construction phase 5 shipped.
2. **`hero-perf.mjs` measures the steady state.** It used to open its sample window at
   `networkidle`; at 6× the route's own scripts were still compiling, and those frames entered the
   p95 as 40–70 ms "paint" entries. The phase-4 engine measured with the same fixed harness reports
   the same shape of numbers, which is why the harness — not the engine — was the problem.

## Perf, final

|                           | 1× CPU      | 6× CPU      |
| ------------------------- | ----------- | ----------- |
| paint median, idle        | **0.50 ms** | **0.60 ms** |
| paint p95, idle           | 0.80 ms     | 1.4–2.1 ms  |
| paint median, interacting | 0.60 ms     | 0.70 ms     |
| long tasks, steady state  | none        | none        |
| canvas commit on resize   | ≤ 2.1 ms    | ≤ 2.1 ms    |

Interaction costs about **0.1 ms** a frame: eight `lineTo`s per bolt, two radial gradients and a
96-point ring per surge, and a cached-surface blit for the plate. Nothing is allocated per frame.

## What I would still fix, in order

1. **The prism's caustic halo is an ellipse, and it is the one drawn shape that reads as a shape.**
   Visible as a faint ring under the thesis line at 1440, roughly `y ≈ 480`. It is far inside the
   contrast budget (that haziness is ~2% wash) and the seam auditor ignores it because it has no
   edge, but if a single line ever needs to go, it is this one.
2. **Mobile gets no pointer interaction.** Deliberate (§7 assumes a cursor), and tile coupling
   still works on tap, but it means the surge has never been judged on a device.
3. **Two clicks stack two surges.** Reads as an echo; untested beyond two.
4. **The lean is proven by measurement, not by eye.** 9.99 px on the nearest band is exactly the
   spec ceiling, and at 1× zoom it is a subtle bend — correct, but the least visible thing in the
   phase. Worth a look on a real display before shipping.

## Files

- `phase6-page-*.png` — the audited compositions, type on top.
- `motion-reel-{light,dark}.png` — one second, six frames, light written last.
- `interaction-*.png` — the phase-5 beats re-shot against this build.
- `idle-reduced-motion.png` — the deterministic frame the audit hashes.
- `node tools/hero-audit.mjs` — this phase's runner. Others: `hero-qa.mjs`, `hero-interaction.mjs`,
  `hero-idle-hash.mjs`, `hero-perf.mjs`, `hero-contrast.mjs`, `npx tsx scripts/hero-qa/check.mts`.

## Where the whole thing ended up

Six phases, each ending in a render that could be judged. The field now spans the full hero, from
the last full stop of the sentence to all four edges; the copy sits on a dissolve rather than a
veil; the stat tiles are grounded by light and respond when touched; and with the pointer away it
is a printed plate. Every claim on this page is a number produced by a script in `tools/`.
