# The Refraction of Thought

**for the tech. — An interactive manifesto in six movements.**

A complete, server-rendered TanStack Start / React 19 experience at **`/thesis`**. The root route redirects to `/thesis` for convenient previewing.

The workspace was empty, so the project, PageShell, SEO metadata, structured data, and discussion footer have been scaffolded here rather than modifying an existing repository.

The production-hardening pass preserves the original visual direction and is verified in Chromium, Firefox, and WebKit. See [the verification report](qa/VERIFICATION.md) for evidence, measurements, and remaining manual checks.

## Run

Requires **Node 22.22+** and **pnpm 10**. Dependencies and the Nitro release candidate are pinned in `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm dev
# http://localhost:3000/thesis
```

The development server binds to `0.0.0.0:3000` and permits the Arena `.e2b.app` preview hostname.

The refreshed source bundle includes source, configuration, the lockfile and final QA reports/captures. It excludes dependencies and generated build/cache directories; install and rebuild after extracting it.

### Production / Nitro SSR

```sh
pnpm build
HOST=0.0.0.0 PORT=3000 pnpm start
```

`pnpm build` builds the browser bundle, SSR service, and Nitro Node server, then runs strict TypeScript checking. The deployment output is `.output/`. This is a build artifact, not source; rebuild it after installing dependencies.

## The experience

- **One pinned stage:** native scrolling through a 600-viewport-height track. `svh` stabilizes mobile browser chrome, with a `vh` fallback.
- **One visual clock:** a single `requestAnimationFrame` scheduler drives the canvas, editorial fades, chapter rail, and HUD. Scroll damping is the frame-rate-independent equivalent of a `0.08` lerp at 60 Hz.
- **Story-locked optics:** ignition, an incident vector, mirror/wall/absorption interactions, glass, compressed wavefronts, five-band Cauchy dispersion, and unbounded emergence.
- **Native navigation:** chapter numerals, left/right arrow keys, surface tabs, a beginning CTA, and return-to-origin controls. There is no wheel interception or synthetic scroll container around the document.
- **Opt-in sound:** the sound toggle creates Web Audio only after a user gesture. Ignition and a warm 110 Hz resonance are synthesized locally. No audio assets or microphone access.
- **Reading view:** a light-paper native dialog holds the complete original text. Focus is contained and restored, Escape closes it, and chapter links return to the corresponding visual state.
- **Field notes:** the discussion form saves, reloads, and deletes notes in this browser's `localStorage`. This is explicitly labeled in the UI. It is **not a shared or server-backed comments system**.

## Architecture

```text
src/
├── components/
│   ├── PageShell.tsx
│   ├── DiscussionFooter.tsx
│   ├── fieldNotes.ts             # Validated, bounded local storage + fallback IDs
│   ├── fieldNotes.test.ts        # 9 storage / compatibility tests
│   ├── FailureView.tsx           # Friendly recoverable route-error screen
│   ├── Icons.tsx
│   └── scrollytelling/
│       ├── ScrollyStage.tsx       # Native track, stage controls, focus hand-offs
│       ├── useStageRuntime.ts    # Owned clock, preferences, geometry, lifecycle
│       ├── runtimeMath.ts        # Damping / track coordinates / canvas budgets
│       ├── runtimeMath.test.ts   # 13 geometry, budget, damping and lock tests
│       ├── scrollLock.ts         # Reference-counted, idempotent document locks
│       ├── OpticsCanvas.tsx      # DPR-aware procedural canvas renderer
│       ├── opticsEngine.ts       # Pure vector maths, Snell, Cauchy, particles
│       ├── opticsEngine.test.ts  # 11 unit tests
│       ├── EditorialBeats.tsx    # Verse transitions and four surface states
│       ├── ChapterRail.tsx       # Clickable, keyboard-accessible chapter rail
│       ├── Telemetry.tsx         # Refractive-index / velocity instrumentation
│       ├── ReadingView.tsx       # Complete, motion-free reading dialog
│       ├── soundDirector.ts      # Lazy, bounded Web Audio lifecycle
│       ├── soundDirector.test.ts # 10 lifecycle, race, and failure-path tests
│       └── story.ts              # Chapter timing and original manifesto copy
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   └── thesis.tsx                # Metadata, LD+JSON, PageShell, discussion
├── styles/
│   ├── app.css                   # Typography, stage, metrology, responsive UI
│   ├── compact.css               # Short-screen reading and mobile scrims
│   └── accessibility.css         # Contrast and forced-colour adjustments
└── router.tsx
qa/
├── smoke.mjs                     # 15 interaction / responsive checks + axe
├── hardening.mjs                 # 48 cross-engine / server hardening checks
├── results.json                  # Actual most-recent smoke result
├── hardening-results.json        # Actual most-recent hardening result + metrics
├── hardening-baseline.json       # Confirmed pre-fix regressions
├── dependency-audit.json         # Package audit at verification time
├── VERIFICATION.md               # Findings, evidence and reproduction
└── screenshots/                  # QA captures, not runtime dependencies
```

## Chapter timing

| R           | Chapter            | Optical event                                  |
| ----------- | ------------------ | ---------------------------------------------- |
| 0.000–0.080 | Prologue           | Coordinate field; tap to disturb the stillness |
| 0.080–0.220 | I · The dark       | 120-particle ignition at R ≥ 0.100             |
| 0.220–0.380 | II · The light     | White incident ray; pointer tilt ±15°          |
| 0.380–0.540 | III · What we meet | Mirror → wall → void → glass                   |
| 0.540–0.720 | IV · The bend      | Snell refraction and wavefront compression     |
| 0.720–0.880 | V · The colours    | Red / amber / emerald / cyan / violet          |
| 0.880–1.000 | VI · Becoming      | Spectral emergence beyond the viewport         |

Progress is measured against **the track**, not the entire page. This deliberately excludes the discussion footer so that R reaches 1.000 before the pinned stage releases.

## Physics and artistic calibration

Ray/triangle intersections and refraction at **both** glass boundaries are computed, not hard-coded line endpoints. The pure maths handles total internal reflection and maintains unit-length directions.

- Reference index: **n = 1.520**, giving **v = 0.658c**.
- The incident ray rotates as it approaches the prism. A 69.7° incidence gives a 38.1° transmitted angle: a physically derived **31.6° bend**, approximately the requested 32°.
- Cauchy's equation uses an **illustrative high-dispersion glass**, calibrated to n(520 nm) = 1.520.
- Spectral separation after emergence and the specified **24 → 8 px** wavefront spacing are exaggerated for visual legibility; this is kinetic art rather than a quantitative laboratory simulation.
- The user's original text is preserved. The reading view includes a clarification that refraction also occurs when leaving a denser medium.

## Performance and access

- Canvas DPR capped at 2, with a **4-million-pixel / 8192px-dimension budget per backing store**. Static metrology is cached; hidden/zero-sized canvases are never drawn. Context restoration, font readiness and DPR changes are handled.
- Idle editorial attribute writes dropped from **1,080/second to zero** in the measured Chromium baseline; idle writes also measured zero in Firefox and WebKit. The standard-motion canvas remains animated; this is not a claim of zero idle CPU.
- Editorial/rail DOM updates run only when progress changes; telemetry is throttled to 80ms. Inactive text does not retain forced compositor layers.
- Fixed 120-particle allocation, no per-frame React state updates for progress.
- Pauses rendering/audio in hidden tabs, while the reading view is open, or when the stage leaves the viewport.
- Reduced-motion preference removes particles/pulsing and scroll damping; canvas work becomes event-driven, with no idle RAF. Live preference changes are observed.
- Resizing/orientation preserves track progress. Document-relative coordinates work when the track is not the first item on the page.
- Audio mute fades and suspends the context. A 2-second resume deadline prevents a blocked or device-less browser from leaving the sound control busy forever. Unmount stops/disconnects all owned sources and observers.
- Desktop copy is spatially separate from the optics. Mobile copy has a strong dark scrim.
- Very short/landscape screens get a scrollable chapter column so copy is never inaccessible behind the viewport edge.
- Native controls, focus-visible styling, current-step semantics, scene announcements and explicit system colours in forced-colour mode. Keyboard shortcuts respect editable fields and modifiers.
- The reader wraps Tab/Shift+Tab, restores focus, and owns a reference-counted scroll lock. Chapter changes, discussion navigation, skip link and return-to-origin preserve usable keyboard focus.
- No-JavaScript full-text fallback; local-note controls remain disabled until hydration so a JS-disabled form cannot accidentally GET-submit personal text.
- Notes are validated and bounded (20 notes; 40-character names; 600-character messages), safely escaped, synchronized between tabs and given compatibility-safe IDs. Storage denial degrades to visit-only notes.
- Fonts (Instrument Serif, DM Sans, IBM Plex Mono) are self-hosted from bundled font packages. The runtime has **no external font, image, analytics, or audio requests**.

## Production responses

Nitro precompresses static JS/CSS with **Brotli and gzip**, serves hashed assets immutably, and varies every asset representation on `Accept-Encoding`. Conditional ETag requests are tested. HTML is revalidated with `Cache-Control: no-cache`.

The production configuration adds `nosniff`, a strict-origin referrer policy, a camera/microphone/geolocation denial policy, and a limited CSP (`base-uri`, `object-src`, `form-action`). The main JS response measured **343,337 → 95,220 bytes** with Brotli (72.3% smaller). The two primary serif fonts are preloaded locally.

This is a baseline policy, not a complete deployment security review. Strict script/style CSP requires nonces for Start's inline hydration; HSTS and `frame-ancestors` must be configured for the real publishing environment. Deliberately no frame-blocking header is sent in this embeddable Arena preview.

## Verify

```sh
pnpm test                 # 43 unit tests
pnpm check                # Strict TypeScript, including unused/fallthrough checks
pnpm format:check         # Source formatting
pnpm build                # Browser + SSR + Nitro + TypeScript
pnpm audit                # Known advisories at the time of the run

# With the production app running in another terminal:
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:browser         # 15 smoke / responsive checks
pnpm test:hardening       # 48 cross-engine / server checks
# Or both suites plus unit tests:
pnpm test:all
# Override the server with BASE_URL=https://your-host.example
```

The smoke suite covers the full story, optics, horizontal touch steering, all surfaces, reader/focus, local notes, standard/reduced motion, no-JS fallback and five small-screen layouts. Hardening adds three browser engines, lifecycle/unmount cleanup, forced colours, high DPI, resize, keyboard focus, blocked APIs, audio races/timeouts, cross-tab storage and HTTP compression/caching/headers.

Headless Firefox on Linux needs a working audio output (a virtual PulseAudio null sink is sufficient) for native playback-lifecycle tests. This run used a null sink, not physical speakers. The unsupported/stalled-audio fallbacks are tested separately. See [QA reproduction](qa/VERIFICATION.md#reproduce) for setup.

**21 axe state/engine scans found zero detected violations.** Canvas/background contrast still needs manual review; these results are not formal WCAG certification. Browser timing measurements in the JSON are local, unthrottled diagnostics—not Lighthouse, field Core Web Vitals or performance guarantees.

To format source: `pnpm format`.

## Before publishing

1. Review the canonical `https://forthe.tech/thesis` and organization metadata in `src/routes/thesis.tsx`.
2. Connect the field-note form to a real backend only if a public/shared discussion is desired. Add moderation, consent, and rate limiting at that point.
3. When integrating into an existing app, reuse its actual PageShell, schema, and discussion component; keep the stage's local progress measurement.
4. Run a real-device Safari/Android and assistive-technology pass in addition to the included Chromium, Firefox and WebKit automation. Browser-engine emulation is not real-device coverage.
