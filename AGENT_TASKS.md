# Original agent-ready execution prompts

These prompts are preserved verbatim from the production brief. The implementation is complete in this project; this file is retained for future integration or delegation.

## Agent Task 1: The Optics Canvas Engine (`OpticsCanvas.tsx` & `opticsEngine.ts`)

```text
Build a high-performance 60fps HTML5 Canvas 2D visual engine that takes a continuous scroll progress value R in [0.0, 1.0] and renders:
1. R in [0.0, 0.2]: Void space with pulsing crosshair [0,0]. At R=0.1 or on canvas click, trigger a radial Big Bang particle explosion (120 particles decaying outward).
2. R in [0.2, 0.38]: Launch a crisp horizontal white incident beam from left to right. Support optional pointer tilt (+/- 15°).
3. R in [0.38, 0.54]: Show micro-interactions with mirror (reflection), wall (shattering noise), and void (absorption), then introduce the glass prism.
4. R in [0.54, 0.72]: Beam enters the prism; render compressed wavefronts (24px to 8px) bending downward by 32° (Snell's Law: n=1.52).
5. R in [0.72, 0.88]: Beam splits into 5 Cauchy spectral bands (Red, Amber, Emerald, Cyan, Violet).
6. R in [0.88, 1.0]: Dispersed rays break through the right prism boundary and fan across the canvas into infinity.
Keep CPU usage minimal, handle devicePixelRatio scaling, and guard with typeof window === 'undefined' for SSR.
```

## Agent Task 2: Sticky Pinned Stage & Editorial Layout (`ScrollyStage.tsx` & `EditorialBeats.tsx`)

```text
Build the sticky pinned scrollytelling layout for TanStack Start / React 19:
1. Outer track: a scrollable div with height: 600vh.
2. Sticky stage: position: sticky; top: 0; width: 100vw; height: 100vh; overflow: hidden.
3. Track scroll progress R in [0.0, 1.0] with requestAnimationFrame damping (lerp 0.08).
4. Left column: render the 6 editorial text beats with smooth opacity and translate-y transitions so only the active beat is prominent.
5. Right margin: render the minimal vertical ChapterRail with clickable roman numerals (I to VI).
6. Ensure full mobile responsiveness: on mobile, center text with a dark backdrop scrim.
```

## Agent Task 3: Integration into `src/routes/thesis.tsx`

```text
Replace the static layout of `src/routes/thesis.tsx` with `<ScrollyStage />`.
Keep SEO metadata, LD+JSON schema, PageShell, and bottom discussion footer intact.
Verify that `pnpm build` compiles cleanly with Nitro SSR and 0 errors.
```
