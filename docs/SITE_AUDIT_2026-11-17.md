# forthe.tech — product, UI/UX and brand audit

**Reviewed:** 17 November 2026  
**Scope:** all public routes, shared navigation, mobile interaction patterns, brand and share assets, metadata, accessibility affordances, and code health.

## Executive rating

### 8.7 / 10 — distinctive, credible, and now materially more coherent

This is not a generic portfolio. The editorial dark-laboratory system, strong writing, real case-study inventory, and unusually considered interactive thesis give it a clear point of view. The most important gap was not the visual language itself; it was consistency. A new circular/pixel brand existed in the repository while the running site, SVG favicon, legacy social cards, and structured data still pointed at the previous prism identity.

The work in this change set makes the new identity authoritative and resolves the highest-impact interaction defects discovered during the review.

| Area                      | Rating | Assessment                                                                                                            |
| ------------------------- | -----: | --------------------------------------------------------------------------------------------------------------------- |
| Brand coherence           |    9.1 | One current logo system is now used in UI, browser icons, social cards, structured data, and the OG generator.        |
| Visual direction          |    8.8 | The restrained obsidian palette, editorial type, imagery, and optics motif are memorable and well differentiated.     |
| Information architecture  |    8.5 | Home, Work, Manifesto, Notes, and identity/contact are understandable in one pass.                                    |
| Navigation & task UX      |    8.6 | Shared navigation is predictable; mobile focus handling and direct email contact are now sound.                       |
| Catalogue UX              |    8.6 | Grid/table filtering is useful, and card controls are now valid, independently actionable links.                      |
| Content & case studies    |    8.9 | Strong voice, concrete context, and a substantial project catalogue; more outcome evidence would make it exceptional. |
| Accessibility             |    8.6 | Semantic landmarks, skip links, focus styles, reduced-motion paths, and a now-inert mobile drawer are solid.          |
| SEO & sharing             |    9.0 | Canonicals, schema, social metadata, current share cards, favicon fallbacks, and a web manifest are in place.         |
| Performance & engineering |    8.8 | Tested drawing/math units, image sizing, lazy media, and strict type/lint health are strong foundations.              |

## Route-by-route review

| Route family               | Rating | What works                                                                                                                                   | Next opportunity                                                                                  |
| -------------------------- | -----: | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/`                        |    9.0 | The hero is distinctive, its main claim is clear, and featured work flows naturally into the thesis and origin.                              | Validate the interactive field on lower-powered physical phones before adding any more animation. |
| `/works`                   |    8.7 | Useful filters, a compact table alternative, rich imagery, and meaningful project labels make scanning easy.                                 | Consider a short “results” dimension or outcome chip for the strongest builds.                    |
| `/works/:id`               |    8.8 | The telemetry header, project narrative, media, source/live actions, related notes, and next/previous links form a good case-study sequence. | Add concrete before/after evidence or user signals where available.                               |
| `/notes` and note articles |    8.8 | Editorial hierarchy, reading progress, platform links, related-build context, and dedicated social cards now feel considered.                | Publish consistently enough that the dispatch list becomes a reliable return path.                |
| `/thesis`                  |    9.0 | This is the flagship experience: the alternate immersive treatment has a clear purpose and includes a non-animated reading path.             | Validate its interaction on lower-powered physical phones before adding more motion.              |
| `/the-man-behind`          |    8.6 | Clear location, live time, direct email, social paths, and a memorable visual establish a human author.                                      | A brief availability/response expectation would reduce contact uncertainty.                       |
| `/lab/refraction`          |    8.5 | A focused, credible experimental surface that fits the main thesis.                                                                          | Add a one-line “what to try first” hint for first-time visitors.                                  |
| error/404 and redirects    |    8.5 | They remain on-brand and provide clear recovery actions.                                                                                     | No urgent change.                                                                                 |

## Findings resolved in this pass

### Brand and browser identity

1. **Two competing logo systems were live.** The app UI and SVG favicon used the old prism, while the repository already contained the new circle-and-pixel mark.
   - Replaced the shared React mark and wordmark with the current brand-pack assets.
   - Updated the thesis footer/header treatment and the legacy discussion footer.
   - Updated structured data to use the current mark and a named-person author identity.
   - Updated the social-card generator and all existing checked-in OG cards.

2. **Favicon variants disagreed.** The PNG/app icon already used the new brand, but the first-preference SVG favicon was the old prism.
   - Rebuilt `favicon.svg` and `favicon.ico` around the new small mark.
   - Added explicit SVG, PNG, ICO, and Apple-touch links with a one-time cache-busting query.
   - Added 192px and 512px app icons plus `site.webmanifest`.

### Interaction and accessibility

3. **The Work grid contained nested links.** A case-study anchor wrapped title/action anchors and external links, producing invalid HTML and unreliable keyboard/screen-reader behavior.
   - Rebuilt cards as semantic articles with separate image, title, case-study, source, and live-site controls.

4. **The visually hidden mobile menu could remain in the keyboard tab order.**
   - Applied `inert` and `aria-hidden` while the shared drawer is closed.
   - Corrected the menu trigger to always meet the 44px touch-target expectation.

5. **The Notes index inherited a horizontal row pattern for multi-line cards.**
   - Made dispatch cards explicitly vertical and easier to scan.

6. **The footer email looked like plain text.**
   - Made it a keyboard-focusable `mailto:` action with a touch-friendly target.

7. **The Thesis used its own header implementation.** Its layout, brand scale, navigation styling, and mobile drawer could drift from every other route.
   - Replaced it with the exact shared `SiteHeader` used across the public site, with no thesis-specific adapter left in the route.
   - Removed thesis-only header overrides so shared navigation remains the single standard.
   - Hid the drawer trigger at desktop widths, where the complete navigation is already visible; it remains available only on mobile.

### Sharing and metadata

8. **Several published articles had individual share-card assets but still emitted the generic home image.**
   - Pointed Dispatches 01–06 to their own card assets where available.
   - Added and pointed the identity page to its own branded share card.
   - Created and connected dedicated 1200×630 cards for Dispatches 07 and 08.

### Positioning, proof, and conversion

9. **The strongest product value was present but not immediately explicit.**
   - Added a plain-language hero positioning statement for Afsal Ali as an independent product maker in Dubai.
   - Reframed featured work as selected case studies built around specific human friction.
   - Made the observed outcome visible on featured work and near the top of every project case study.
   - Added role context to flagship work and a clear end-of-case-study engagement prompt.

10. **The contact route was available but not consistently surfaced at decision points.**

- Added a shared desktop and mobile “Start a conversation” action to the standard site navigation.
- Added direct, accessible email actions on the hero, at the end of case studies, and in the shared footer.
- Updated author metadata and structured data from a generic organization entry to Afsal Ali as a `Person` with a clear professional description.

## Important follow-up, not a launch blocker

1. **Collect outcome proof for selected projects.** Even one metric, before/after quote, adoption detail, or short screen recording per flagship case study would improve persuasion more than extra UI detail.
2. **Test real-device ergonomics.** Specifically test the hero and thesis on an entry-level Android device, iPhone Safari, keyboard-only desktop navigation, and a screen reader before major traffic is driven there.
3. **Keep the brand pack canonical.** Future mark, favicon, PWA, and social changes should start from `public/brand/`, rather than redrawing the logo in component code.

## Verification performed

- TypeScript: `pnpm typecheck`
- Lint: `pnpm lint`
- Unit tests: `pnpm test` — **52 passing tests**
- Production build: `pnpm build`
- Server-rendered metadata checks for home, work, notes, identity, and thesis routes
- Inspected favicon, Apple-touch, manifest, structured-data logo, and all checked-in social-card dimensions

The automated checks validate implementation quality; the real-device checks above remain the final qualitative sign-off for motion and tactile feel.
