# Production hardening — verification

**The Refraction of Thought · `/thesis` · 13 November 2026**

Verified against the rebuilt **production Nitro SSR server**, not just Vite development mode. The existing story, optics choreography, typography and layout are preserved.

## Result

| Gate                                 | Result                                                    |
| ------------------------------------ | --------------------------------------------------------- |
| Frozen-lockfile dependency install   | Passed                                                    |
| Production build + strict TypeScript | Passed; zero errors                                       |
| Formatting check                     | Passed                                                    |
| Unit regressions                     | **43 / 43 passed** in 10 suites                           |
| Chromium story / responsive smoke    | **15 / 15 passed**                                        |
| Cross-engine / server hardening      | **48 / 48 passed**                                        |
| Axe state/engine scans               | **21 scans; zero detected violations**                    |
| Uncaught browser / console errors    | **0** in both browser suites                              |
| External runtime requests            | **0** in all three hardening engines                      |
| Dependency audit                     | **0 known advisories** in the 188-dependency audit result |

### Browser engines

| Engine                | Engine-specific hardening groups | Browser errors |
| --------------------- | -------------------------------- | -------------- |
| Chromium 145.0.7632.6 | 15 / 15                          | 0              |
| Firefox 146.0.1       | 15 / 15                          | 0              |
| WebKit 26.0           | 15 / 15                          | 0              |

The hardening total also includes two HTTP/server groups and one aggregate error/request check. Playwright engine versions are pinned by the project's test dependency. Linux WebKit is not a substitute for Safari on an actual Apple device.

## Confirmed findings and fixes

| Before hardening                                                                               | Implemented and regression-tested                                                                                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1,080 editorial attribute mutations during one idle second                                     | Progress-change-only DOM writes; telemetry throttled to 80ms; **zero idle editorial mutations** in each engine                                          |
| Forced-colour mode hid the canvas and crashed `drawImage` on a zero-sized source               | Zero-size guards at renderer resize/draw boundaries; explicit system colours; static, readable forced-colour mode; live recovery                        |
| `crypto.randomUUID` missing → note submission threw                                            | Web Crypto byte-ID fallback, then a non-security local ID fallback                                                                                      |
| JS-disabled local-only form could submit using default GET                                     | All fields and submit button stay disabled until hydration; visible no-JS explanation                                                                   |
| Silent Web Audio work could survive mute; asynchronous resume could outlive visibility/unmount | Fade + suspend on mute; hidden/modal/lifecycle suspension; owned graph cleanup; guards for late resumes                                                 |
| Native resume could remain pending without an audio device                                     | **2-second deadline**, released busy control, accessible unavailable notice; late completion cannot revive muted audio                                  |
| Dialog and page focus behavior differed by engine                                              | Explicit Tab/Shift+Tab wrapping; immediate owned lock release; exact prior-style restoration; focus restoration and chapter/discussion/return hand-offs |
| Resize and nested document coordinates were insufficiently covered                             | Geometry-preserving orientation/viewport changes and track-local document-relative seeks, tested with 240px of preceding content                        |
| Raw static JS with no negotiated compression                                                   | Brotli + gzip assets, immutable caching, `Vary: Accept-Encoding` on all representations, ETag/304 coverage                                              |
| No configured response hardening headers                                                       | `nosniff`, referrer policy, permissions policy and a limited embedding-safe CSP                                                                         |

Additional protections: canvas DPR ≤ 2, backing stores ≤ 4 million pixels and ≤ 8192px per dimension; context/DPR/font recovery; inactive chapter `inert` state and focus transfer; no persistent forced compositor layers for inactive text; storage size/type/date/ID validation; 20-note cap; duplicate-ID filtering; cross-tab synchronization; safe React text escaping; no-Canvas / blocked-storage / no-audio fallback coverage. The canvas budget is **per backing store**, not a cap on total browser/compositor memory.

## Production transfer measurements

These are **raw HTTP response-body bytes**, with decompression equality checked—not fetch's auto-decoded sizes.

| Asset                | Identity  | Brotli   | Gzip      | Brotli reduction |
| -------------------- | --------- | -------- | --------- | ---------------- |
| `index-DhU6z9Np.css` | 37,971 B  | 7,927 B  | 9,109 B   | 79.1%            |
| `index-Dfhm0NaN.js`  | 343,337 B | 95,220 B | 109,819 B | 72.3%            |
| `thesis-CiVWm5Of.js` | 55,643 B  | 16,045 B | 18,525 B  | 71.2%            |

The original baseline's main JS was 342,334 B without content encoding. The final main JS is 343,337 B uncompressed and **95,220 B with Brotli**. Both compressed formats were decoded and compared byte-for-byte; conditional ETags return 304. HTML uses `Cache-Control: no-cache`; hashed assets retain one-year immutable caching. The primary serif fonts are preloaded and all fonts are self-hosted.

### Local rendering / loading diagnostics

| Engine   | Idle editorial mutations / 1s | Canvas draws / 1s | Initial LCP sample | Initial CLS sample |
| -------- | ----------------------------- | ----------------- | ------------------ | ------------------ |
| Chromium | 0                             | 60                | 100 ms             | 0.00022            |
| Firefox  | 0                             | 60                | 198 ms             | 0.00000            |
| WebKit   | 0                             | 21                | 262 ms             | 0.00000            |

The standard-motion optical field intentionally remains animated; **zero DOM writes does not mean zero CPU**. Reduced-motion mode leaves no idle RAF and no idle draws. Rendering and audio pause in the reader, during tested page lifecycle/visibility events, when fully offscreen, and after client-side unmount. Unmount checks include active ResizeObserver/IntersectionObserver counts, pending RAF, closed audio and restored document overflow.

These timings and one-second draw counts are unthrottled, local headless-Linux diagnostics, not field Core Web Vitals, Lighthouse scores, battery measurements or a 60fps guarantee. WebKit's software-headless draw count is lower; real-device Safari smoothness remains a manual release check. A nonzero but very small Chromium initial CLS sample is recorded rather than rounded to zero.

## Coverage detail

- All seven states, six chapter transitions, all four surface interactions, both prism boundaries, five spectral wavelengths, pointer steering and native progress damping.
- Responsive smoke: **390×844, 375×667, 320×568, 768×1024, 844×390**; no horizontal overflow or inaccessible chapter clipping in tested states. Chromium touch steering did not move the document.
- High DPI: **2560×1440 CSS px at DPR 1.5** (physical 4K) and **390×844 at DPR 4**, tested in every engine; backing stores stayed within budget. Pure tests additionally cover 7680×4320 and extreme dimension inputs. A synthetic 2560×1440-at-DPR-4 compositor exhausted the constrained WebKit sandbox during the first pass; this run does not claim arbitrary 10K physical-screen coverage.
- Reader focus wrapping/restoration, Escape, full copy, repeated open/close, preserved scroll coordinates, pre-existing lock styles and chapter-return navigation.
- Editable-field/modifier-safe shortcuts, rail arrow-key focus, inactive chapter focus transfer, discussion hand-off, return-to-origin and skip-link focus.
- Audio opt-in, native context state transitions, mute suspension, blocked/unavailable APIs, stalled resume, late completion, partial setup failure and destroy races. Audio was routed to a **PulseAudio null sink**, not physical speakers; subjective sound quality was not evaluated.
- Normal/reduced motion including live preference switches; initial and toggled forced colours; zero-sized canvas, simulated context loss/restoration and unavailable Canvas 2D.
- Missing UUID / missing Web Crypto, whitespace validation, escaped HTML-like text, cross-tab save/delete/clear, blocked browser storage, persisted local notes and the disabled no-JS form.
- Lifecycle/visibility and 2D context-loss events are explicitly dispatched test events; this is not a full OS sleep/BFCache or real GPU-loss stress test.

## Reproduce

Requires Node 22.22+ and pnpm 10. From `your-creative-showcase`:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm format:check
pnpm check
pnpm build
HOST=0.0.0.0 PORT=3000 pnpm start
# Leave that server running; in another terminal:
pnpm test:all
pnpm audit
```

`BASE_URL` can point either browser suite at another production server. Native audio-lifecycle tests need a working system output. For device-less Linux CI, install PulseAudio using the system package manager, then optionally run a private local test sink in a separate terminal:

```sh
mkdir -p /tmp/refraction-qa-audio
chmod 700 /tmp/refraction-qa-audio
pulseaudio --daemonize=no --exit-idle-time=-1 --use-pid-file=no -n \
  --load='module-null-sink sink_name=qa' \
  --load='module-native-protocol-unix socket=/tmp/refraction-qa-audio/native auth-anonymous=1'
# In the test terminal:
PULSE_SERVER=unix:/tmp/refraction-qa-audio/native pnpm test:all
```

The app itself has no PulseAudio dependency; this is only a headless browser test fixture. Unavailable/stalled audio is also tested explicitly, independently of this fixture.

## Evidence and limitations

- `results.json` — smoke run started **2026-11-13T07:45:08.720Z**.
- `hardening-results.json` — hardening run started **2026-11-13T07:45:25.125Z**, including engine versions, individual results, incomplete axe counts, byte sizes, timings and canvas sizes.
- `hardening-baseline.json` — independently reproduced pre-fix issues.
- `dependency-audit.json`, `build.log`, `test-run.log` — raw audit/build/test evidence.
- `screenshots/` — final standard, responsive, reader, discussion and three-engine forced-colour captures. Test scripts regenerate them; they are not runtime assets.

**Still manual / outside this continuation:** real-device iOS Safari and Android (including mobile browser chrome, zoom and low-power rendering); VoiceOver/NVDA/TalkBack; canvas-over-background contrast and subjective audio comfort. Axe incomplete findings remain visible in the JSON; zero detected violations is **not a WCAG certification**.

The CSP deliberately does not restrict framing in the Arena preview. A stricter nonce-based script/style policy, HSTS and final frame-ancestor policy require review in the actual deployment environment. Canonical/organization metadata still requires publishing approval. The Nitro release candidate remains lockfile-pinned.

Field notes remain **browser-local**, not shared comments. No backend, moderation service, analytics, external media or deployment work was added.
