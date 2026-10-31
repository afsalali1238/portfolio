# Hero — phase 1 stills

Judged **with type**, at three widths, because the composition is meaningless without it.

| File                            | What it is                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `phase1-page-1440x780.png`      | light, live page, clipped to the hero (1440×720)                                                          |
| `phase1-page-1440x780-dark.png` | same, `.dark`                                                                                             |
| `phase1-page-1024x768.png`      | the width where the veil seam was most visible before                                                     |
| `phase1-page-390x820.png`       | portrait variant: glass high-right, fan kept                                                              |
| `phase1-engine-*.png`           | the engine's own layer only (node-canvas), for diffing what the canvas contributes vs. what the page does |

Regenerate:

```bash
npm run dev                                       # shell 1
npm i -D playwright-core && npx playwright-core install chromium
node tools/hero-qa.mjs                            # layouts + page stills + reduced-motion audit
cd scripts/hero-qa && npm i && npm run check      # invariants + engine-only stills
```

`scripts/hero-qa/data/layout-*.json` are the measured DOM snapshots the node renderer uses —
real rects, captured from the live page at each breakpoint, not hand-tuned numbers.
