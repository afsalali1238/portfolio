# Brand Guide audit — 18 November 2026

Source of truth: `design/brand/forthe.tech-brand-guide-v1.html` (forthe.tech Brand Guide v1).
It has six sections: Cover, The mark, Versions, Colour, Type, and Rules and voice.

The guide's drawings are now encoded in `src/lib/brand.ts`. `scripts/generate-brand.mjs` builds every brand file, favicon, and app icon from that module. `src/lib/brand.test.ts` decodes the guide HTML itself and fails if the code, the checked-in pack, or the token files drift from it.

## Headline finding

The site was showing **two different identities**, and the primary surfaces used the wrong one.

| Surface | Before | Guide |
| --- | --- | --- |
| Header, footer, mobile drawer, thesis footer | Half-disc + pixel-grid mark; serif `forthe.tech` wordmark | Prism mark; `for the tech.` in DM Sans 600 |
| `favicon.svg` (what modern browsers prefer) | Pixel-grid mark | Prism, small cut |
| All 28 share cards (`public/og/*.png`) | Pixel-grid lockup | Prism lockup, colour on ink |
| Person schema avatar | Pixel-grid mark | Prism |
| Colours in those files | `#F7F5EF`, `#E67E54`, `#16100C`, `#A8471B` | Bone `#EEEAE1`, clay `#D96346`, ink `#0B0C0E`, clay deep `#AE4024` |
| `apple-touch-icon`, `icon-192/512`, `public/brand/svg/*` | Prism (correct) | Prism |

PR #32 "unified" the brand around the pixel-grid files at the root of `public/brand/` and the legacy `forthe.tech-brand-sheet.pdf` (Inter type, `#E67E54`). Only `public/brand/svg/` and `public/brand/png/` matched the guide. All 12 SVGs there are byte-identical to the guide's drawings.

## Audit by guide section

### 1 · The mark

| Rule | Finding | Action |
| --- | --- | --- |
| Prism geometry (n 1.505, apex 55°, rays −4/−16.5/−29°) | Off-guide mark in header, footer, favicon, OG | Geometry encoded once in `brand.ts`; tests compare it with the guide's paths |
| Small cut below 24 px | The small cut (of the old mark) was used at 28 px | `LogoMark` picks the cut from rendered height |
| Never below 16 px | — | `LogoMark` enforces the 16 px floor |
| Clear space X = wordmark cap height | Mark and wordmark placed separately with ad-hoc 12 px gaps | Header, footer and drawer use the guide's single lockup drawing; X ≈ 0.52 × lockup height. The 88 px bar and the OG padding keep it clear |
| Nothing drawn inside the glass | Pass | — |

### 2 · Versions

| Rule | Finding | Action |
| --- | --- | --- |
| Colour on ink: primary for header, footer, share cards | Not used | Now used on all three |
| Four versions (ink/bone × colour/mono) | Mark, small mark and lockup existed; no standalone wordmark | Generated `wordmark_*.svg` in all four versions |
| Deep rays on bone | Pass in `svg/` | Pinned by tests |

### 3 · Colour

| Rule | Finding | Action |
| --- | --- | --- |
| Palette (10 swatches) | `tokens.css` matched, plus four unused extras (`--ochre*`, `--soft-slate*`) | Extras removed; tests pin both token files to the guide |
| "Colour appears only in the mark and the full stop" | Clay used as UI accent: active-nav underline, link and card hovers, header CTA hover, primary-button hover, drop caps, status and chip dots, outcome rule, man-behind accents | `--lit` is now bone. Every UI accent above is bone or grey |
| Grey = labels on ink; line = rules and outlines | `--fg-faint` was line `#55585E`. It coloured `.t-label`, eyebrows, footer text and muted-foreground at **2.74:1** contrast (fails WCAG AA) | `--text-faint` is grey `#9A9EA5` (**7.28:1**) |
| Contrast figures | Re-measured: clay on ink 5.43:1; deep rays on bone 4.92 / 4.10 / 5.03:1 | Matches the guide |

### 4 · Type

| Rule | Finding | Action |
| --- | --- | --- |
| Self-host all three families | Pass (`@fontsource`) | — |
| Wordmark never falls back; ship outlines | The old serif wordmark was outlined, but it was the wrong design | The guide's outlined DM Sans wordmark |
| Labels: 12–14 px, uppercase, 0.12 em, grey on ink | Header nav 11 px / 0.14 em; header CTA 10 px / 0.08 em; eyebrows 0.108 em; footer and chips 1 px tracking; Work badges and filters 10 px | All moved to 12 px / 0.12 em, grey |
| Display 44 px and up; italic second clause | Pass on hero and thesis. The thesis OG card lacked the italic | OG generator supports `*italic*`; thesis card now matches the page |
| Sentence case headlines; lower-case name | The hero, home OG and reading view said "For the tech." | Now `for the tech.` |

### 5 · Rules and voice

| Rule | Finding | Action |
| --- | --- | --- |
| No glow, gradient, extra rays on the mark | Pass once the old mark is gone | — |
| Place on ink or bone only | Pass | — |
| No lockup below 14 px type | — | `Lockup` falls back to the mark alone below 14 px type |
| Lower-case name, full stop included | Header and footer `aria-label` was `forthe.tech — home` | Now `for the tech. — home` |

## Also fixed (found during visual QA)

- **Desktop hamburger was still visible on `main`.** The `@media (min-width: 768px) { .header-actions { display: none } }` rule came *before* `.header-actions { display: flex }`, so the later rule won. PR #32's CSS check missed this. Fixed by reordering, and confirmed in rendered screenshots at 800 and 1440 px.
- Active nav item sat about 4 px above its neighbours because its underline was in flow. The underline is now absolutely positioned.
- With 12 px labels, Work card badges collided at 1024 px (−7 px). The platform badge now reads "Phone" / "Web" (+44 px clearance).
- The footer link "The Man Behind" wrapped. Footer links and contact items are now `nowrap` in a wrapping row.
- Share-card URLs now carry `?v=brand-v1` (`OG_IMAGE_VERSION` in `src/lib/site.ts`), so social platforms re-fetch them. Favicon links moved to `?v=3`.

## Files

- **Added:**
  - `src/lib/brand.ts`, `src/lib/brand.test.ts`
  - `scripts/generate-brand.mjs`
  - `design/brand/forthe.tech-brand-guide-v1.html`
  - `public/brand/svg/wordmark_*.svg`
- **Regenerated:**
  - `public/brand/svg/*`, `public/brand/png/*`
  - `favicon.svg/.png/.ico` (16/32/48), `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`
  - all 28 `public/og/*.png`
- **Removed (off-guide):** these are recoverable from `63cedac` if ever needed.
  - root-level `public/brand/{mark,wordmark,lockup,avatar}-*` (21 files)
  - `forthe.tech-brand-sheet.pdf`
- **Updated:**
  - `LogoMark.tsx` (`LogoMark`, `Lockup`, `Wordmark`), `SiteHeader`, `SiteFooter`, `Icons.tsx` (`Brand`)
  - `__root.tsx`, `site.ts`
  - `tokens.css`, `styles.css`, `app.css`
  - `Works.tsx`, `FeaturedWorks.tsx`, `works/$id.tsx`
  - `Hero.tsx`, `ReadingView.tsx`, `index.tsx`
  - `generate-og.mjs`, `public/brand/README.txt`

## Regenerating

```bash
node scripts/generate-brand.mjs        # brand pack, favicons, app icons
corepack pnpm build:og                 # share cards
# Without Edge installed, point both at any Chromium: THESIS_CHROMIUM=/path/to/chrome
```

## Open decisions (not changed)

1. **Hero and thesis artwork use extra spectrum hues** (`ochre`, `soft-slate` in `hero-ray.ts`) and a radial wash. The guide's "no gradient, no extra rays" rule is written for the mark, and this is illustration. A strict reading would cut the artwork to clay/gold/slate only.
2. **`MatrixSilhouette` on /the-man-behind** uses its own zinc/emerald/red control palette and 10–11 px labels. It's an embedded interactive piece and needs its own pass.
3. **`/lab/refraction`** telemetry uses 9–10 px labels and a clay accent. It's an internal lab page.
4. **Title-case page names** ("The Man Behind", "The Refraction of Thought") are kept as proper names. The guide's sentence-case rule would make them "The man behind".
5. **Stacked lockup.** The guide recommends it for square posts and title slides, but the supplied pack has no stacked drawing. One should be drawn to the guide's clear-space rule before it's used.
