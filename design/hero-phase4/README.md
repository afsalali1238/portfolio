# Hero — phase 4: the dissolve, and the veils are gone

Phase 4's job was to kill the seam. The two gradient veil divs are deleted from `Hero.tsx`;
the engine now thins the light where the words are instead of hiding the field behind a
gradient.

## What the dissolve does

Applied to the body and plasma layers only — the plate, glass, core and filaments stay at full
strength, which is what keeps the chain readable as one object:

1. **Per-rect radial stencils** at 0.5 → 0, one per quiet rect. A blurred _rectangle_ still
   reads as a rectangle once the field behind it has structure; a radial has no edge at all.
   This replaced a `filter: blur()` + `fillRect` approach that left a faint soft box around the
   copy — visible in the first phase-4 still.
2. **The type's ink extent** at 0.1, inset by 6 px: a halo, not a patch.
3. **A radial paper lift** at 0.35 centred on the copy block — §6's, and radial by construction,
   so it cannot produce a seam.

Because every pass is a gradient falling to zero, the dissolve has no boundary to find. The
field passes behind the type, fades, and resumes.

## Proven, not asserted

`tools/hero-contrast.mjs` measures both phase-4 checkpoints:

- **Contrast.** It hides the hero's text, photographs what is actually behind it, resolves each
  text colour to sRGB (the theme tokens are `oklch` — a regex reads those as near-black and
  produced eleven false failures before I fixed it), walks ancestors _only inside the hero_ to
  find real surfaces (the filled button, the tile panel), and then computes WCAG ratios.
- **Seam.** It samples a row band in the gap between the copy and the tiles — exactly where the
  old veils cut across — and reports the largest step between neighbouring 24 px windows. A
  veil edge is a cliff; a ray crossing a row is a thin line, and only the cliff fails.

Result, all three widths × both themes (36 text samples, 6 seam measurements):

|                | contrast floor cleared | worst seam step |
| -------------- | ---------------------- | --------------- |
| 1440×780 light | 13/13                  | 1.85/255        |
| 1440×780 dark  | 13/13                  | 3.26/255        |
| 1024×768 light | 13/13                  | 2.02/255        |
| 1024×768 dark  | 13/13                  | 3.34/255        |
| 390×820 light  | 13/13                  | 2.09/255        |
| 390×820 dark   | 13/13                  | 0.95/255        |

The thesis line is the tightest at 4.72:1 (dark) and 5.06:1 (light) against a 3:1 floor for
large text; body copy clears 4.5:1 by a wide margin. Budget for the seam is 4/255.

## What is still open

- **The drafting plate's column rules and corner crop marks do not follow the dissolve.** They
  are faint (4% ink) and pass behind the headline — visible if you look for them at 1440, around
  the left edge of "For". §6 does not cover the plate, but the honest reading of "no seam" is that
  _nothing_ should cross the words. My own pass lives in `paintPlate`, and applying it there is a
  ~10-line change — say the word and it goes in.
- The tile panel and buttons keep their own surfaces; the dissolving field behind them is
  invisible, which is why contrast there is measured against the surface, not the drawing.

## Perf after phase 4 (production build, 1440×800)

|               | 1× CPU     | 6× CPU                                     |
| ------------- | ---------- | ------------------------------------------ |
| paint median  | **0.5 ms** | **0.9 ms**                                 |
| paint p95     | 1.7 ms     | 19.2 ms                                    |
| resize cost   | 0.4–0.7 ms | 0.3–6.3 ms                                 |
| longest frame | none       | 147 ms — **script ≤ 9 ms**, raster ≤ 64 ms |

The dissolve costs ~0.4 ms median per frame (three gradient fills over the quiet zones).
p95 at 6× stays ~19 ms: that tail is the full-hero raster, not the script, and was already there
in phase 3.
