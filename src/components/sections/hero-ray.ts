/**
 * hero-ray — the drawing engine behind the hero's dispersion field.
 *
 * Phase 6 composition: the field is the hero, not a graphic beside it.
 *
 *   the closing sentence of the headline emits a coherent ray
 *     → it strikes the left facet of a glass prism
 *     → inside the glass it splits into seven hues
 *     → they leave the right facet at one incandescent point
 *     → and that point disperses in every direction that has room,
 *       growing from specks of dust into whole strands of light,
 *       until the strands cross the entire section and leave the frame.
 *
 * What changed in this revision, and why:
 *
 *   1. **Full-bleed.** The dispersion is no longer a wedge pinned to the right third of the
 *      page. The core is the section's centrepiece and the fan sweeps ~250° around it, so
 *      strands reach the top edge, the right edge, the bottom edge and both left corners.
 *      Myriad faint ghost strands cross the copy so the field never reads as "cut off at
 *      the left".
 *   2. **Dot → dots → line.** Every strand is born as a single point of light and coalesces:
 *      sparse specks, then denser specks, then dashes, then a continuous filament. That
 *      continuum is what makes it look like light finding its path instead of a fan of
 *      vector lines.
 *   3. **A prism that reads as glass.** Three shaded faces, a real rim (ink edge + inner
 *      white), the dispersion visible *inside* the glass as it splits, a caustic pool under
 *      the base and glints at the vertices.
 *   4. **The current catches the cursor.** Strands within reach bend toward the pointer, and
 *      the nearest ones throw a jittered filament at it, so the field behaves like charge
 *      rather than like a picture.
 *
 * Three invariants this file exists to protect:
 *
 *   1. Layout-derived geometry. Every position comes from a LayoutSnapshot measured off the
 *      real DOM (see ./hero-layout). Nothing is a percentage of the section — except the
 *      sweep of the fan, which is a direction, not a position.
 *   2. Continuity. Each strand's displacement envelope E(s) = sin(πs)^0.85 is exactly 0 at
 *      both ends, so P(0) is the exit point to the last float and no tip detaches.
 *   3. Legibility. The dissolve thins everything that crosses a type box, so the field can
 *      be full-bleed without ever costing a word its contrast.
 *
 * No canvas shadow blur anywhere: every soft edge is a gradient or a cached sprite, and every
 * gradient is cached per geometry version and theme.
 *
 * The engine is framework-free and DOM-free (Ctx is a structural subset of the browser's
 * CanvasRenderingContext2D) so the same code paints in React and renders headlessly.
 */

import type { LayoutSnapshot } from "./hero-layout";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** Samples per strand. 48 is smooth at 1400 px of throw and cheap at 26 strands. */
const STRAND_STEPS = 48;
/** Lane overshoot as a fraction: tips must leave the frame, not stop inside it. */
const OVERSHOOT = 1.06;
/** Strands per hue. Three gives each band a spine plus a pair of satellites. */
const BAND_STRANDS = 3;
/** Hard ceiling on the buffer pool (bands × strands + ghosts). */
const MAX_STRANDS = 28;

/**
 * The dot → line continuum, as a staircase of stroke patterns along the strand.
 *
 * Each row is a stretch of the strand (fractions of its length) drawn with its own dash
 * pattern. A zero-length dash with a round cap is a dot, so the first three rows read as
 * specks that get denser and closer to touching; by the fifth row they are dashes, and the
 * last row is a continuous filament. The ranges deliberately overlap a little — the alpha
 * ramp in the strand gradient does the blending, so the seams never show.
 */
type Region = { from: number; to: number; dash: [number, number] | null; width: number };
const REGIONS: readonly Region[] = [
  { from: 0.0, to: 0.062, dash: [0.01, 17], width: 1.35 },
  { from: 0.052, to: 0.118, dash: [0.01, 12], width: 1.45 },
  { from: 0.108, to: 0.186, dash: [0.01, 8.5], width: 1.5 },
  { from: 0.176, to: 0.272, dash: [7, 6], width: 1.25 },
  { from: 0.262, to: 0.4, dash: [14, 4], width: 1.1 },
  { from: 0.39, to: 1.0, dash: null, width: 1 },
];

/* --------------------------------------------------------------- plasma constants */

/** Dendritic fork sites along s, as fractions of the strand's span. */
const FORK_AT = [0.46, 0.72] as const;
const FORK_STEPS = 10;
const FORK_RUNS = [0.45, 0.34, 0.21] as const;
/** The channel is a polyline through this many anchors: sparse enough to stay angular. */
const STRIKE_ANCHORS = 9;
const STRIKE_REACH_MAX = 88;
/** Jitter is quantised to 24 fps, so the current crackles at a deliberate cadence. */
const JITTER_FPS = 24;

/* ---------------------------------------------------------------- interaction */

/**
 * The prime line: one strand leaves the origin as a single dot and grows into a line. The
 * growth is on the scene clock, so a still (time = 4.6 s) is always the finished line.
 */
const PRIME_DELAY_S = 0.45;
const PRIME_DRAW_S = 1.9;

/** A surge's whole life, and the pointer's follow time constant. */
const SURGE_LIFE_MS = 950;
const POINTER_TAU_MS = 80;
/** How far the current reaches for the cursor, and how far it may drag a strand. */
const CATCH_RADIUS = 360;
const CATCH_MAX = 132;
/** How close the bowed strands are allowed to come to the cursor, in px. */
const CATCH_STANDOFF = 36;
/** The filament stops short of the cursor: attracted, never grabbed. */
const CATCH_GAP = 10;
/** Hovering a tile dims every other band to this fraction. */
const TILE_DIM = 0.42;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Rgb = readonly [number, number, number];

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

const rgba = (c: Rgb, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(4)})`;

/** Paper and ink, print-graded. Kept local: the field never borrows the text tokens. */
const PAPER: Rgb = [247, 244, 238];
const INK: Rgb = [27, 24, 21];

export type BandSpec = {
  name: string;
  light: Rgb;
  lightAlpha: number;
  dark: Rgb;
  darkAlpha: number;
  /** spine stroke width, CSS px */
  width: number;
  /** displacement amplitude at mid-span, in px */
  amplitude: number;
  /** spatial cycles along the strand */
  cycles: number;
  /** undulation rate, Hz (0.15–0.25 keeps the field calm) */
  hz: number;
  /** peak ribbon half-width, CSS px */
  ribbon: number;
  /** ribbon body alpha at full span */
  ribbonAlpha: number;
  /** how much of the band's alpha the plasma pass is allowed to use */
  plasma: number;
  flagship?: boolean;
};

/**
 * Seven bands, red → violet, clay carrying the light. Hue reads as pigment on paper and as
 * light on ink; clay is the only band allowed to be heavy.
 */
export const BANDS: readonly BandSpec[] = [
  {
    name: "red",
    light: [176, 58, 43],
    lightAlpha: 0.5,
    dark: [232, 106, 85],
    darkAlpha: 0.6,
    width: 1.05,
    amplitude: 8.5,
    cycles: 1.05,
    hz: 0.19,
    ribbon: 15,
    ribbonAlpha: 0.062,
    plasma: 0.8,
  },
  {
    name: "amber",
    light: [191, 106, 24],
    lightAlpha: 0.56,
    dark: [240, 165, 68],
    darkAlpha: 0.68,
    width: 1.25,
    amplitude: 9.5,
    cycles: 0.95,
    hz: 0.17,
    ribbon: 18,
    ribbonAlpha: 0.074,
    plasma: 0.9,
  },
  {
    name: "clay",
    light: [168, 71, 27],
    lightAlpha: 0.94,
    dark: [230, 126, 84],
    darkAlpha: 1,
    width: 2.1,
    amplitude: 12,
    cycles: 0.82,
    hz: 0.15,
    ribbon: 26,
    ribbonAlpha: 0.1,
    plasma: 1.0,
    flagship: true,
  },
  {
    name: "emerald",
    light: [47, 125, 94],
    lightAlpha: 0.46,
    dark: [49, 200, 154],
    darkAlpha: 0.56,
    width: 1.1,
    amplitude: 10.5,
    cycles: 0.9,
    hz: 0.21,
    ribbon: 20,
    ribbonAlpha: 0.07,
    plasma: 0.9,
  },
  {
    name: "cyan",
    light: [42, 111, 134],
    lightAlpha: 0.42,
    dark: [57, 192, 218],
    darkAlpha: 0.54,
    width: 1.05,
    amplitude: 9,
    cycles: 1.0,
    hz: 0.23,
    ribbon: 17,
    ribbonAlpha: 0.062,
    plasma: 0.85,
  },
  {
    name: "cobalt",
    light: [51, 81, 142],
    lightAlpha: 0.38,
    dark: [90, 138, 240],
    darkAlpha: 0.5,
    width: 1,
    amplitude: 8,
    cycles: 1.1,
    hz: 0.25,
    ribbon: 15,
    ribbonAlpha: 0.054,
    plasma: 0.8,
  },
  {
    name: "violet",
    light: [91, 74, 140],
    lightAlpha: 0.34,
    dark: [155, 123, 240],
    darkAlpha: 0.46,
    width: 0.95,
    amplitude: 6.5,
    cycles: 1.2,
    hz: 0.18,
    ribbon: 13,
    ribbonAlpha: 0.046,
    plasma: 0.75,
  },
];

/* ------------------------------------------------------------------ geometry contract */

/** Minimum length of the incident ray before it is rerouted to the top edge. */
const ENTRY_MIN_SPAN = 96;

type Vec = { x: number; y: number };

export type Strand = {
  index: number;
  band: number;
  /** radians, canvas space (y down) */
  angle: number;
  dir: Vec;
  normal: Vec;
  /** length from the core to the frame edge, already overshot */
  length: number;
  amplitude: number;
  cycles: number;
  hz: number;
  phase: number;
  width: number;
  /** ribbon half-width in px, 0 for a hairline */
  ribbon: number;
  /** static damping: strands that graze the copy are quieter */
  alpha: number;
  /**
   * How far along the strand the specks resolve into a continuous filament, as a multiplier
   * on the shared REGIONS staircase. Strands with room in front of them (pointing right,
   * out of the frame) resolve early; strands that have to cross the copy stay unresolved,
   * so the field reads as light still finding its way on the quiet side of the page.
   */
  resolve: number;
  ghost: boolean;
};

export type HeroGeometry = {
  heroW: number;
  heroH: number;
  mobile: boolean;
  prismSize: number;
  /** apex, bottom-left, bottom-right */
  topV: Vec;
  leftV: Vec;
  rightV: Vec;
  /** centre of the prism's own triangle */
  prismCenter: Vec;
  /** where the beam meets the incident facet */
  hit: Vec;
  /** the sole dispersion origin: P(0) of every strand, on the exit facet */
  exit: Vec;
  /** the beam's origin */
  source: Vec;
  /** how far the beam had to be rerouted to reach the facet */
  entryMode: "sentence" | "top-edge";
  /** the dispersion origin == exit; named because the copy talks about the core */
  core: Vec;
  strands: Strand[];
  /** one tip per strand, off the frame edge */
  targets: Vec[];
  /** unit normal per strand, ⟂ to its lane: cached so the plasma pass never recomputes it */
  normals: Vec[];
  /** strand span per index, in px */
  spans: number[];
  /** one grounding filament per tile: the nearest strand point above its centre */
  grounds: { from: Vec; to: Vec; band: number }[];
  /** the angular sweep of the fan, in degrees: QA + the docs quote it */
  sweep: { from: number; to: number };
  /** index of the prime strand: the one line that grows out of the dot */
  prime: number;
};

const onFacet = (a: Vec, b: Vec, t: number): Vec => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Deterministic hash → [0, 1). Used for plasma jitter so a frame can be reproduced exactly:
 * the motion reel and the browser see the same crackle for the same bucket.
 */
const hash = (seed: number, frame: number) => {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(frame + 0x165667b1, 0xc2b2ae35);
  x ^= x >>> 15;
  x = Math.imul(x, 0x2545f491);
  x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
};

/** Distance along a ray before it leaves the hero's box. `from` must be inside. */
const rayExit = (from: Vec, dir: Vec, w: number, h: number) => {
  let best = Number.POSITIVE_INFINITY;
  if (Math.abs(dir.x) > 1e-6) {
    const t = ((dir.x > 0 ? w : 0) - from.x) / dir.x;
    if (t > 0) best = Math.min(best, t);
  }
  if (Math.abs(dir.y) > 1e-6) {
    const t = ((dir.y > 0 ? h : 0) - from.y) / dir.y;
    if (t > 0) best = Math.min(best, t);
  }
  return Number.isFinite(best) ? best : Math.hypot(w, h);
};

/* ------------------------------------------------------------------------- context */

/** Minimal 2D context surface — satisfied by both DOM canvas and node-canvas. */
export type Ctx = {
  save(): void;
  restore(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  ellipse?(
    x: number,
    y: number,
    rx: number,
    ry: number,
    rotation: number,
    a0: number,
    a1: number,
  ): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
  fill(): void;
  stroke(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): Gradient;
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
  ): Gradient;
  globalAlpha: number;
  lineWidth: number;
  lineCap: string;
  lineJoin: string;
  fillStyle: string | Gradient;
  strokeStyle: string | Gradient;
  setLineDash?(segments: number[]): void;
  /** stencil passes only: a blurred clip stands in for a soft mask */
  filter?: string;
  translate?(x: number, y: number): void;
  scale?(x: number, y: number): void;
  rotate?(angle: number): void;
  /** offscreen plates only */
  drawImage?(image: unknown, dx: number, dy: number): void;
  /** debug overlay only */
  font?: string;
  textAlign?: string;
  fillText?(text: string, x: number, y: number): void;
};

export type Gradient = { addColorStop(stop: number, color: string): void };

export type HeroRay = ReturnType<typeof createHeroRay>;

/**
 * An offscreen surface, provided by the shell (browser) or the harness (node-canvas). The
 * engine owns what is on it, never where it lives — that keeps it DOM-free.
 */
export type Surface = { ctx: Ctx; width: number; height: number; image?: unknown };
export type SurfaceFactory = (width: number, height: number) => Surface | null;

export type HeroRayOptions = { createSurface?: SurfaceFactory };

export function createHeroRay(options: HeroRayOptions = {}) {
  let geo: HeroGeometry | null = null;
  let layout: LayoutSnapshot | null = null;
  let version = 0;

  let isDark = false;
  let time = 0;
  let surgeEnergy = 0;
  let debug = false;

  let pointerActive = false;
  let pointerX = 0;
  let pointerY = 0;
  let leanX = 0;
  let leanY = 0;

  /**
   * Interaction state. All of it is additive and decays to rest, so the still, the reel and
   * the reduced-motion frame all come out identical to the idle composition.
   */
  let pointerEase = 0; // 0..1, 80 ms follow — how much the pointer is influencing the field
  let hoverTile = -1; // index of the stat tile under the pointer, -1 for none
  let headlineHover = false;
  const surges: { x: number; y: number; at: number; seed: number }[] = [];
  let surgeLife = 0; // ms since the most recent surge started

  /** The drafting plate is rasterised once per geometry/theme and blitted thereafter. */
  let plate: Surface | null = null;
  let plateKey = "";
  let grainDots: Float32Array | null = null;
  const createSurface = options.createSurface ?? null;

  const strandBufs: Float32Array[] = Array.from(
    { length: MAX_STRANDS },
    () => new Float32Array((STRAND_STEPS + 1) * 2),
  );
  /** one dendritic fork's vertices, reused for every fork on every frame */
  const forkBuf = new Float32Array((FORK_STEPS + 1) * 2);
  /** jitter changes on a 24 fps bucket, not every frame: deliberate, not noisy */
  let jitterBucket = -1;
  let jitterFrame = 0;

  /** Parameter along each strand nearest the pointer for this frame (0..1). */
  const bowCenters = new Float32Array(MAX_STRANDS);
  const bowCenter = (index: number) => bowCenters[index] ?? 0.5;

  /** Per-strand pointer proximity, filled while the strand buffer is built. */
  const catches: { strand: number; x: number; y: number; distance: number }[] = [];

  /** Snap the plasma jitter to the next 24 fps bucket. Below a bucket the field is frozen. */
  const advanceJitter = () => {
    const bucket = Math.floor(time * JITTER_FPS);
    if (bucket !== jitterBucket) {
      jitterBucket = bucket;
      jitterFrame = bucket;
    }
  };

  /* ---------------------------------------------------------------- stage build */

  const buildGeometry = () => {
    if (!layout) return;
    const { heroW, heroH, thesisLine, copyRight, container } = layout;
    const mobile = heroW < 768;

    const prismSize = mobile
      ? clamp(Math.min(heroW, heroH) * 0.26, 84, 136)
      : clamp(Math.min(heroW, heroH) * 0.32, 150, 262);

    // Equilateral prism, apex up. Circumradius r = size / √3.
    const r = prismSize / Math.sqrt(3);

    /**
     * The core is the one fixed point of the composition: the dispersion origin, the exit
     * point on the right facet, and the thing the eye lands on. On desktop it sits on the
     * hero's optical centre-right — clear of the copy, central enough to be the centrepiece.
     */
    // Portrait: the glass hangs in the top-right corner and the dispersion falls down the
    // page like a curtain. The copy is full-width there, so the light goes where the words
    // are not — down, and out to the left along the bottom third.
    const core: Vec = mobile
      ? { x: heroW * 0.84, y: heroH * 0.13 }
      : {
          x: clamp(heroW * 0.665, copyRight + prismSize * 0.85, heroW - prismSize * 0.55),
          y: heroH * 0.44,
        };

    // The core rides the right facet at u = 0.56 of the way down from the apex, so the
    // prism's position is *derived* from the core rather than tuned beside it.
    const exitU = 0.56;
    const apex = { x: 0, y: -r };
    const bottomRight = { x: r * 0.866, y: r * 0.5 };
    const exitRel = {
      x: apex.x + (bottomRight.x - apex.x) * exitU,
      y: apex.y + (bottomRight.y - apex.y) * exitU,
    };
    const prismCenter: Vec = { x: core.x - exitRel.x, y: core.y - exitRel.y };
    const topV: Vec = { x: prismCenter.x, y: prismCenter.y - r };
    const leftV: Vec = { x: prismCenter.x - r * 0.866, y: prismCenter.y + r * 0.5 };
    const rightV: Vec = { x: prismCenter.x + r * 0.866, y: prismCenter.y + r * 0.5 };
    const exit = onFacet(topV, rightV, exitU);
    const hit = onFacet(topV, leftV, mobile ? 0.46 : 0.4);

    // The beam leaves the sentence's full stop — unless that would be a stub, in which case
    // it enters from the top edge over the copy-safe right column.
    let source: Vec = {
      x: Math.min(thesisLine.right + 6, container.right),
      y: thesisLine.baselineY,
    };
    let entryMode: HeroGeometry["entryMode"] = "sentence";
    if (dist(source, hit) < ENTRY_MIN_SPAN) {
      source = { x: Math.min(copyRight + 40, container.right - 24), y: heroH * 0.06 };
      entryMode = "top-edge";
    }

    /**
     * The sweep. On desktop the fan opens from up-left (-128°) through the right (0°) to
     * down-left (+118°): 246° of dispersion, which is what puts light on the top edge, the
     * bottom edge, the right edge and both left corners without aiming bands at the words.
     * Portrait screens turn the same fan to face the empty right-hand side.
     */
    const sweep = mobile ? { from: 12, to: 178 } : { from: -166, to: 164 };
    const count = BANDS.length * BAND_STRANDS;

    const quiet = layout.ledger.quietRects;
    const damped = (angle: number) => {
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };
      let hits = 0;
      for (let k = 1; k <= 10; k++) {
        const t = (k / 10) * rayExit(core, dir, heroW, heroH);
        const x = core.x + dir.x * t;
        const y = core.y + dir.y * t;
        if (
          quiet.some((rect) => x > rect.left && x < rect.right && y > rect.top && y < rect.bottom)
        )
          hits += 1;
      }
      return 1 - (hits / 10) * 0.16;
    };

    const makeStrand = (spec: {
      index: number;
      band: number;
      angle: number;
      ghost: boolean;
    }): Strand => {
      const dir = { x: Math.cos(spec.angle), y: Math.sin(spec.angle) };
      const band = BANDS[spec.band];
      const reach = rayExit(core, dir, heroW, heroH);
      const spine = !spec.ghost && spec.index % BAND_STRANDS === 1;
      return {
        index: spec.index,
        band: spec.band,
        angle: spec.angle,
        dir,
        normal: { x: -dir.y, y: dir.x },
        length: Math.max(120, reach * OVERSHOOT),
        amplitude:
          band.amplitude * (1.05 + hash(spec.index * 19 + 3, 5) * 0.6) * (mobile ? 0.8 : 1),
        cycles: band.cycles * (0.86 + hash(spec.index * 29 + 7, 9) * 0.35),
        hz: band.hz * (0.9 + hash(spec.index * 37 + 1, 13) * 0.3),
        phase: hash(spec.index * 31 + 11, 5) * TAU,
        width: band.width * (spec.ghost ? 0.85 : 1),
        ribbon: spine ? band.ribbon * (mobile ? 1 : 1.55) : 0,
        // 0° (straight out of the frame) resolves first; the further from it, the longer the
        // strand stays as specks and dashes.
        resolve: spec.ghost
          ? 2.3
          : 0.75 + Math.min(1, Math.abs(Math.sin(spec.angle / 2)) * 1.5) * 0.55,
        alpha: (spec.ghost ? 0.4 : 1) * (mobile ? 0.86 : 1) * damped(spec.angle),
        ghost: spec.ghost,
      };
    };

    const strands: Strand[] = [];
    for (let i = 0; i < count; i++) {
      const uniform = i / (count - 1);
      // Push the spacing toward the middle of the sweep: the strands that leave the frame
      // quickly are the ones with room to be seen, so they get the company.
      const eased =
        0.5 + (Math.sign(uniform - 0.5) * Math.pow(Math.abs(uniform - 0.5) * 2, 1.3)) / 2;
      const band = Math.min(BANDS.length - 1, Math.floor(i / BAND_STRANDS));
      // A little angular scatter so the fan never reads as a protractor…
      const jitter = (hash(i * 13 + 7, 3) - 0.5) * 3.4;
      strands.push(
        makeStrand({
          index: i,
          band,
          angle: (lerp(sweep.from, sweep.to, eased) + jitter) * DEG,
          ghost: false,
        }),
      );
    }

    // …plus three ghosts that cross the copy itself. They are far too faint to compete with
    // the type, and they are what stops the left half of the hero from looking abandoned.
    const ghostAngles = mobile ? [196] : [171, 184, 199];
    for (const [k, degrees] of ghostAngles.entries()) {
      strands.push(
        makeStrand({
          index: count + k,
          band: k === 1 ? 4 : 2,
          angle: degrees * DEG,
          ghost: true,
        }),
      );
    }

    /**
     * The prime line: the one strand that grows out of the dot.
     *
     * It takes the lane that leaves the glass horizontally (on portrait: straight down), and
     * it takes the clay hue whatever band it landed on — the accent is the point, this is the
     * single stroke the eye is meant to follow. Its growth is on the scene clock, so a still
     * is always the finished line and reduced motion never sees it half-drawn.
     */
    const primeTarget = (mobile ? 92 : 0) * DEG;
    let prime = 0;
    let primeGap = Number.POSITIVE_INFINITY;
    for (const strand of strands) {
      if (strand.ghost) continue;
      // Spines only: a hairline cannot carry an accent.
      if (strand.ribbon <= 0) continue;
      const gap = Math.abs(strand.angle - primeTarget);
      if (gap < primeGap) {
        primeGap = gap;
        prime = strand.index;
      }
    }

    const targets = strands.map((strand) => ({
      x: core.x + strand.dir.x * strand.length,
      y: core.y + strand.dir.y * strand.length,
    }));

    // --- grounding filaments ----------------------------------------------------------
    // Each tile is fed by the nearest strand that passes above its own centre: a stub, not a
    // leader line, so nothing crosses the layout to reach a tile.
    const grounds: { from: Vec; to: Vec; band: number }[] = [];
    for (const tile of layout.tiles) {
      let best: { from: Vec; band: number; distance: number } | null = null;
      for (const strand of strands) {
        if (strand.ghost) continue;
        for (let k = 1; k <= 24; k++) {
          const s = k / 24;
          const x = core.x + strand.dir.x * (s * strand.length);
          const y = core.y + strand.dir.y * (s * strand.length);
          if (y > tile.top - 8) continue;
          const d = Math.abs(x - tile.cx);
          if (d > 260) continue;
          if (!best || d < best.distance) best = { from: { x, y }, band: strand.band, distance: d };
        }
      }
      const from = best?.from ?? { x: tile.cx, y: tile.top - 46 };
      grounds.push({ from, to: { x: tile.cx, y: tile.top - 6 }, band: best?.band ?? 2 });
    }

    geo = {
      heroW,
      heroH,
      mobile,
      prismSize,
      topV,
      leftV,
      rightV,
      prismCenter,
      hit,
      exit,
      source,
      entryMode,
      core,
      strands,
      targets,
      normals: strands.map((strand) => strand.normal),
      spans: strands.map((strand) => strand.length),
      grounds,
      sweep,
      prime,
    };
    version += 1;
  };

  /* -------------------------------------------------------------- strand maths */

  /**
   * Fill one strand's point buffer.
   *
   * off(s) = (A·sin(2πf·s − ωt + φ) + 0.26A·sin(2π·2.35f·s + 1.3ωt)) · E(s)
   * P(s)   = core + dir·s·L + n̂·(off(s) + shiver) + catch(s)
   *
   * E(0) = E(1) = 0 exactly, so the root is welded to the core and the tip stays on its
   * lane. The catch term is the current reaching for the cursor: it pulls the nearest part of
   * the strand toward the pointer, with the same envelope, so a strand never detaches.
   */
  const fillStrand = (index: number) => {
    if (!geo) return;
    const strand = geo.strands[index];
    if (!strand) return;
    const band = BANDS[strand.band];
    const buf = strandBufs[index];
    const core = geo.core;

    const amp = strand.amplitude * (1 + surgeEnergy * 0.35);
    const omega = time * TAU * strand.hz;
    const catching = pointerEase > 0.015;
    const shiver = (catching ? 1 : 0.45) * (strand.ghost ? 0.4 : 1);

    /**
     * The bow.
     *
     * A strand is not dragged toward the cursor from end to end — it bends where it is
     * closest, the way a plucked string bends, and the bend dies away fast. So the catch is
     * a Gaussian centred on the projection of the pointer onto the strand's own lane, not a
     * half-sine over the whole length: a local detour instead of a sag.
     */
    let catchWeight = 0;
    if (catching) {
      const rel = { x: leanX - core.x, y: leanY - core.y };
      const along = clamp(
        (rel.x * strand.dir.x + rel.y * strand.dir.y) / strand.length,
        0.05,
        0.95,
      );
      const gx = core.x + strand.dir.x * (along * strand.length);
      const gy = core.y + strand.dir.y * (along * strand.length);
      const gap = Math.hypot(leanX - gx, leanY - gy);
      if (gap < CATCH_RADIUS) catchWeight = Math.pow(1 - gap / CATCH_RADIUS, 1.05) * pointerEase;
    }

    let nearest = Number.POSITIVE_INFINITY;
    let nearestX = 0;
    let nearestY = 0;

    for (let i = 0; i <= STRAND_STEPS; i++) {
      const s = i / STRAND_STEPS;
      const env = Math.pow(Math.sin(Math.PI * s), 0.85);
      const travel = Math.pow(s, 0.4);

      const off =
        (Math.sin(TAU * strand.cycles * s - omega + strand.phase) * amp +
          Math.sin(TAU * 2.35 * strand.cycles * s + omega * 1.3) * amp * 0.26) *
        env *
        (0.45 + 0.55 * travel);
      // Electric shiver: quantised to the 24 fps bucket, so it crackles. The caught section
      // shivers hardest — that is the part the current is running through.
      let x = core.x + strand.dir.x * (s * strand.length) + strand.normal.x * off;
      let y = core.y + strand.dir.y * (s * strand.length) + strand.normal.y * off;

      /**
       * The catch, per sample: each point leans toward the cursor by a fraction of its own
       * distance. Points next to the pointer move a lot, points at the ends of the lane do
       * not move at all — so the strand bows into a smooth lens instead of kinking to a
       * corner, and it can never overshoot the cursor.
       */
      let lean = 0;
      if (catchWeight > 0) {
        const dx = leanX - x;
        const dy = leanY - y;
        const d = Math.hypot(dx, dy);
        if (d < CATCH_RADIUS) {
          // Standoff: the strands bend *around* the cursor, not into it. A field that
          // pinches to a single point reads as a knot; a field that wraps a small gap
          // reads as charge, and the gap is what the spark below bridges.
          const excess = d - CATCH_STANDOFF;
          if (excess > 0) {
            const w = Math.pow(1 - d / CATCH_RADIUS, 1.25) * catchWeight;
            lean = Math.min(excess * 0.88, CATCH_MAX) * w;
            x += (dx / (d || 1)) * lean;
            y += (dy / (d || 1)) * lean;
          }
        }
      }

      // Electric shiver, quantised to the 24 fps bucket. The caught section shivers hardest.
      const jitter =
        (hash(index * 97 + i * 13 + 1, jitterFrame) - 0.5) *
        shiver *
        env *
        (1 + (lean > 0 ? 1 : 0) * 0.9);
      x += strand.normal.x * jitter;
      y += strand.normal.y * jitter;

      if (catching) {
        const d = Math.hypot(leanX - x, leanY - y);
        if (d < nearest) {
          nearest = d;
          nearestX = x;
          nearestY = y;
        }
      }

      buf[i * 2] = x;
      buf[i * 2 + 1] = y;
    }

    if (catching && !strand.ghost) {
      const existing = catches.find((entry) => entry.strand === index);
      if (existing) {
        existing.x = nearestX;
        existing.y = nearestY;
        existing.distance = nearest;
      } else {
        catches.push({ strand: index, x: nearestX, y: nearestY, distance: nearest });
      }
    }
  };

  const fillAll = () => {
    if (geo) {
      for (const strand of geo.strands) {
        const rel = { x: leanX - geo.core.x, y: leanY - geo.core.y };
        bowCenters[strand.index] = clamp(
          (rel.x * strand.dir.x + rel.y * strand.dir.y) / strand.length,
          0.05,
          0.95,
        );
      }
    }
    catches.length = 0;
    for (let i = 0; i < (geo?.strands.length ?? 0); i++) fillStrand(i);
  };

  /* -------------------------------------------------------------------- caches */

  let cacheKey = "";
  let cacheCtx: Ctx | null = null;
  let strandGrads: (Gradient | null)[] = [];
  let ribbonGrads: Gradient[] = [];
  let beamGrad: Gradient | null = null;
  let glassGrad: Gradient | null = null;

  const ensureCaches = (ctx: Ctx) => {
    if (!geo) return;
    const key = `${version}:${isDark ? "dark" : "light"}`;
    if (key === cacheKey && ctx === cacheCtx && beamGrad && glassGrad) return;

    const { core, topV, rightV, strands } = geo;

    // One gradient per strand: the dot → line continuum is carried by the alpha ramp, so a
    // speck near the core and a filament at the tip are the same stroke, just thinner.
    strandGrads = strands.map((strand, i) => {
      const band = BANDS[strand.band];
      const body = isDark ? band.dark : band.light;
      const target = geo?.targets[i];
      if (!target) return null;
      const g = ctx.createLinearGradient(core.x, core.y, target.x, target.y);
      g.addColorStop(0, rgba(body, 0.34));
      g.addColorStop(0.07, rgba(body, 0.5));
      g.addColorStop(0.22, rgba(body, 0.72));
      g.addColorStop(0.45, rgba(body, 0.92));
      g.addColorStop(1, rgba(body, 1));
      return g;
    });

    ribbonGrads = strands.map((strand, i) => {
      const band = BANDS[strand.band];
      const body = isDark ? band.dark : band.light;
      const target = geo?.targets[i] ?? { x: core.x + 1, y: core.y + 1 };
      const alpha = band.ribbonAlpha * (isDark ? 1.2 : 1.6);
      const g = ctx.createLinearGradient(core.x, core.y, target.x, target.y);
      g.addColorStop(0, rgba(body, 0));
      g.addColorStop(0.07, rgba(body, alpha * 0.5));
      g.addColorStop(0.42, rgba(body, alpha));
      g.addColorStop(1, rgba(body, alpha * 0.85));
      return g;
    });

    // The beam warms as it travels: it starts as ink on paper, arrives as light.
    const { source, hit } = geo;
    const clay = BANDS[2];
    const b = ctx.createLinearGradient(source.x, source.y, hit.x, hit.y);
    b.addColorStop(0, rgba(isDark ? clay.dark : clay.light, 0));
    b.addColorStop(0.2, rgba(isDark ? clay.dark : clay.light, isDark ? 0.3 : 0.22));
    b.addColorStop(0.78, rgba(isDark ? clay.dark : clay.light, isDark ? 0.62 : 0.5));
    b.addColorStop(1, rgba(isDark ? PAPER : INK, isDark ? 0.5 : 0.26));
    beamGrad = b;

    // Glass shell stays white-only: any warm stop in the shell reads as beige paper.
    const glass = ctx.createLinearGradient(topV.x, topV.y, rightV.x, rightV.y);
    if (isDark) {
      glass.addColorStop(0, "rgba(255,255,255,0.14)");
      glass.addColorStop(0.6, "rgba(255,255,255,0.09)");
      glass.addColorStop(1, "rgba(255,255,255,0.06)");
    } else {
      glass.addColorStop(0, "rgba(255,255,255,0.97)");
      glass.addColorStop(0.55, "rgba(255,255,255,0.9)");
      glass.addColorStop(1, "rgba(255,255,255,0.82)");
    }
    glassGrad = glass;

    cacheKey = key;
    cacheCtx = ctx;
  };

  /* -------------------------------------------------------------------- layers */

  /**
   * The dissolve.
   *
   * A veil hides the field behind a gradient, which is why it produced a seam: the page and
   * the drawing sat on two planes. A dissolve instead thins the light where the words are and
   * lets paper show through, so strands pass *behind* type, fade, and resume — one plane, no
   * edge, no legibility cost.
   *
   * Three passes, applied to the field only (plate, glass, core and filaments stay at full
   * strength):
   *
   *   1. a radial paper lift centred on the copy block;
   *   2. per-rect radial stencils, so nothing bright runs under a word;
   *   3. the type's ink extent as a soft halo.
   */
  const drawDissolve = (ctx: Ctx) => {
    if (!geo || !layout) return;
    const { heroW, heroH } = geo;
    const paper = isDark ? INK : PAPER;
    const rects = layout.textRects;
    if (rects.length === 0) return;

    // 1. One gentle lift over the copy block. This is the whole of the page-level veil — the
    //    field is allowed to stay visible behind the words, so it must not be a wash.
    const copyCenter = copyCenterOf();
    const radius = 0.52 * Math.max(heroW, heroH);
    const lift = ctx.createRadialGradient(
      copyCenter.x,
      copyCenter.y,
      0,
      copyCenter.x,
      copyCenter.y,
      radius,
    );
    lift.addColorStop(0, rgba(paper, 0.1));
    lift.addColorStop(0.5, rgba(paper, 0.042));
    lift.addColorStop(1, rgba(paper, 0));
    ctx.fillStyle = lift;
    ctx.fillRect(0, 0, heroW, heroH);

    // 2. Per-line stencils, sized to the line rather than to the merged block: bold display
    //    type survives a hairline behind it, body copy does not. Small text gets the stronger
    //    pass, a headline line gets just enough to keep its counters clean.
    for (const rect of rects) {
      const height = rect.bottom - rect.top;
      const body = height < 60;
      const cx = (rect.left + rect.right) / 2;
      const cy = (rect.top + rect.bottom) / 2;
      const halfW = (rect.right - rect.left) / 2;
      const halfH = height / 2;
      const stencilRadius = Math.hypot(halfW, halfH) * (body ? 1.05 : 0.92);
      const stencil = ctx.createRadialGradient(cx, cy, stencilRadius * 0.5, cx, cy, stencilRadius);
      stencil.addColorStop(0, rgba(paper, body ? 0.66 : 0.3));
      stencil.addColorStop(0.66, rgba(paper, body ? 0.34 : 0.12));
      stencil.addColorStop(1, rgba(paper, 0));
      ctx.fillStyle = stencil;
      ctx.fillRect(
        rect.left - stencilRadius,
        rect.top - stencilRadius,
        stencilRadius * 2 + (rect.right - rect.left),
        stencilRadius * 2 + height,
      );
    }
  };

  /** Centre of the copy block, derived from the quiet rects — no extra measurement pass. */
  const copyCenterOf = () => {
    if (!layout || layout.ledger.quietRects.length === 0) {
      return { x: (geo?.heroW ?? 0) / 2, y: (geo?.heroH ?? 0) / 2 };
    }
    const rects = layout.ledger.quietRects;
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return { x: (left + right) / 2, y: (top + bottom) / 2 };
  };

  /**
   * The ambient wash: one warm radial centred on the core and scaled to the viewport
   * diagonal, so the whole section reads as lit rather than decorated on one side. This is
   * what carries the field across the copy without drawing a single line there.
   */
  const drawAmbient = (ctx: Ctx) => {
    if (!geo) return;
    const { core, heroW, heroH } = geo;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;
    const radius = Math.hypot(heroW, heroH) * 0.95;
    const g = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, radius);
    g.addColorStop(0, rgba(warm, isDark ? 0.12 : 0.075));
    g.addColorStop(0.32, rgba(warm, isDark ? 0.055 : 0.036));
    g.addColorStop(0.68, rgba(warm, isDark ? 0.018 : 0.012));
    g.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, heroW, heroH);
  };

  /**
   * The drafting plate: column rules, crop marks, baseline ticks, the caustic ellipse under
   * the glass, grain. It never changes between frames, so it is rasterised once per geometry
   * and theme into an offscreen surface and blitted — the difference between a plate that
   * costs nothing and one that costs twenty strokes a frame.
   */
  const paintPlate = (ctx: Ctx) => {
    if (!geo || !layout) return;
    const { heroH } = geo;
    const ink = isDark ? 248 : 27;
    const rule = (a: number) => (isDark ? `rgba(${ink},246,240,${a})` : `rgba(27,24,21,${a})`);

    // 12 column rules at 4% ink, across the container.
    ctx.strokeStyle = rule(0.04);
    ctx.lineWidth = 1;
    for (const x of layout.columns) {
      ctx.beginPath();
      ctx.moveTo(Math.round(x) + 0.5, 0);
      ctx.lineTo(Math.round(x) + 0.5, heroH);
      ctx.stroke();
    }

    // Corner crop marks on the container: registration marks, not decoration.
    const { left, right } = layout.container;
    const top = layout.textRects[0]?.top ?? heroH * 0.1;
    const bottom = layout.tiles.length
      ? Math.max(...layout.tiles.map((t) => t.bottom))
      : heroH * 0.9;
    const tick = 9;
    ctx.strokeStyle = rule(0.16);
    for (const [x, y, sx, sy] of [
      [left, top, 1, 1],
      [right, top, -1, 1],
      [left, bottom, 1, -1],
      [right, bottom, -1, -1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * tick);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * tick, y);
      ctx.stroke();
    }

    // Baseline ticks: short marks off the left of each line's ink.
    ctx.strokeStyle = rule(0.1);
    for (const baseline of layout.ledger.baselines) {
      ctx.beginPath();
      ctx.moveTo(baseline.x0 - 26, Math.round(baseline.y) + 0.5);
      ctx.lineTo(baseline.x0 - 8, Math.round(baseline.y) + 0.5);
      ctx.stroke();
    }

    // Grain: 2.5% static dots. Generated once, reused forever.
    if (!grainDots) {
      const count = Math.round((geo.heroW * geo.heroH) / 9000);
      grainDots = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        grainDots[i * 3] = hash(i * 7 + 1, 11) * geo.heroW;
        grainDots[i * 3 + 1] = hash(i * 13 + 5, 23) * geo.heroH;
        grainDots[i * 3 + 2] = 0.014 + hash(i * 17 + 3, 37) * 0.018;
      }
    }
    for (let i = 0; i < grainDots.length; i += 3) {
      ctx.fillStyle = rule(grainDots[i + 2] * (isDark ? 1.6 : 1));
      ctx.fillRect(grainDots[i], grainDots[i + 1], 1, 1);
    }
  };

  /** The plate's own copy-safe stencil, painted in at build time so it costs nothing. */
  const dissolvePlate = (ctx: Ctx) => {
    if (!layout || !geo) return;
    const paper = isDark ? INK : PAPER;
    for (const rect of layout.ledger.quietRects) {
      const cx = (rect.left + rect.right) / 2;
      const cy = (rect.top + rect.bottom) / 2;
      const halfW = (rect.right - rect.left) / 2;
      const halfH = (rect.bottom - rect.top) / 2;
      const radius = Math.hypot(halfW, halfH) * 1.12;
      const stencil = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
      stencil.addColorStop(0, rgba(paper, 1));
      stencil.addColorStop(0.7, rgba(paper, 0.9));
      stencil.addColorStop(1, rgba(paper, 0));
      ctx.fillStyle = stencil;
      ctx.fillRect(
        rect.left - radius,
        rect.top - radius,
        radius * 2 + (rect.right - rect.left),
        radius * 2 + (rect.bottom - rect.top),
      );
    }
  };

  /** Blit the cached plate, rebuilding it only when geometry or theme changes. */
  const drawPlate = (ctx: Ctx) => {
    if (!geo) return;
    const key = `${version}:${isDark ? "dark" : "light"}`;

    if (createSurface) {
      if (!plate || plateKey !== key) {
        const surface = createSurface(Math.ceil(geo.heroW), Math.ceil(geo.heroH));
        if (surface) {
          plate = surface;
          paintPlate(surface.ctx);
          dissolvePlate(surface.ctx);
          plateKey = key;
        }
      }
      const blit = plate?.image ?? plate?.ctx;
      if (plate && blit && ctx.drawImage) {
        ctx.drawImage(blit, 0, 0);
        return;
      }
    }

    // No surface factory: paint directly (stills and the node harness only).
    paintPlate(ctx);
  };

  /**
   * Per-band alpha multiplier for tile coupling: hovering a tile lights its own band and dims
   * the rest. At rest every band returns 1, so the still never changes.
   */
  const bandVoice = (index: number) => {
    if (hoverTile < 0) return 1;
    const ground = geo?.grounds[hoverTile];
    if (!ground) return 1;
    return ground.band === index ? 1.4 : TILE_DIM;
  };

  /** Trace a stretch of a strand's buffer, in sample indices. */
  const traceRange = (ctx: Ctx, buf: Float32Array, from: number, to: number) => {
    ctx.beginPath();
    ctx.moveTo(buf[from * 2], buf[from * 2 + 1]);
    for (let i = from + 1; i <= to; i++) ctx.lineTo(buf[i * 2], buf[i * 2 + 1]);
  };

  /**
   * One strand, drawn as the dot → line continuum.
   *
   * Six overlapping stretches, each with its own dash pattern: specks, denser specks, dashes,
   * a light dashed line, then a continuous filament. The gradient carries the alpha ramp, so
   * the strokes never show a seam where one stretch hands over to the next.
   */
  const drawStrand = (ctx: Ctx, index: number) => {
    if (!geo) return;
    const strand = geo.strands[index];
    const buf = strandBufs[index];
    if (!strand || !buf) return;
    const band = BANDS[strand.band];
    const voice = bandVoice(strand.band) * strand.alpha;
    const alpha = (isDark ? band.darkAlpha : band.lightAlpha) * voice * (1 + surgeEnergy * 0.2);
    if (alpha <= 0.004) return;

    const colour = isDark ? band.dark : band.light;
    const gradient = strandGrads[index] ?? rgba(colour, 1);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = clamp(alpha, 0, 1);

    // Haze: a wide, faint version of the solid length, so strands have body, not just an edge.
    const solidFrom = Math.round(Math.min(0.95, 0.38 * strand.resolve) * STRAND_STEPS);
    traceRange(ctx, buf, solidFrom, STRAND_STEPS);
    ctx.lineWidth = strand.width * (strand.ribbon > 0 ? 7 : 5);
    ctx.globalAlpha = clamp(alpha * (strand.ribbon > 0 ? 0.14 : 0.1), 0, 1);
    ctx.stroke();

    ctx.globalAlpha = clamp(alpha, 0, 1);
    for (const region of REGIONS) {
      const from = Math.round(Math.min(1, region.from * strand.resolve) * STRAND_STEPS);
      const to = Math.round(Math.min(1, region.to * strand.resolve) * STRAND_STEPS);
      if (to - from < 1) continue;
      traceRange(ctx, buf, from, to);
      if (ctx.setLineDash) ctx.setLineDash(region.dash ?? []);
      ctx.lineWidth = region.width * strand.width * (isDark ? 1.05 : 1);
      ctx.stroke();
    }
    if (ctx.setLineDash) ctx.setLineDash([]);

    // White-hot filament: only the clay spine carries one, and only past the halfway mark —
    // that is where the dispersion's centre of energy reads as light rather than pigment.
    if (band.flagship && !strand.ghost) {
      traceRange(ctx, buf, Math.round(0.55 * STRAND_STEPS), STRAND_STEPS);
      ctx.strokeStyle = isDark ? "rgba(255,252,246,0.85)" : "rgba(255,255,255,0.6)";
      ctx.globalAlpha = clamp(alpha * 0.4, 0, 1);
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.strokeStyle = gradient;
    }

    // A packet of current travelling outward: short, bright, and fast enough to read as
    // movement at the edge of vision.
    if (!strand.ghost && index % 2 === 0) {
      const speed = 0.075 + hash(index * 7 + 3, 21) * 0.055;
      const p = (time * speed + hash(index * 11 + 5, 23)) % 1;
      const head = Math.round(p * STRAND_STEPS);
      const tail = Math.max(0, head - 4);
      if (head - tail >= 2 && p > 0.06) {
        traceRange(ctx, buf, tail, head);
        ctx.strokeStyle = isDark ? "rgba(255,252,246,0.95)" : rgba(mix(colour, INK, 0.2), 1);
        ctx.globalAlpha = clamp(alpha * 0.55 * Math.sin(Math.PI * p), 0, 1);
        ctx.lineWidth = 1.1 * strand.width;
        ctx.stroke();
        ctx.strokeStyle = gradient;
      }
    }

    ctx.globalAlpha = 1;
  };

  /**
   * The prime line — "one line should come: it starts as a dot, then it becomes a line."
   *
   * Every other strand in the field is a continuum read all at once. This one is read as a
   * *gesture*: a single point of light at the origin, then a short comet tail, then a line
   * that keeps extending along its lane until it leaves the frame. It is drawn first and
   * heaviest of the whole fan — solid where the others are still specks — so the eye follows
   * it out of the glass before it notices the fan at all.
   *
   * The growth rides the scene clock, which means a composed still (t = 4.6 s) is always the
   * finished line, and reduced motion never sees a half-drawn one.
   */
  const drawPrime = (ctx: Ctx) => {
    if (!geo) return;
    const strand = geo.strands[geo.prime];
    const buf = strandBufs[geo.prime];
    if (!strand || !buf) return;
    // Clay, whatever band the prime lane landed on: this is the accent stroke of the hero.
    const band = BANDS[2];
    const colour = isDark ? band.dark : band.light;
    const voice = bandVoice(strand.band) * strand.alpha;

    const raw = clamp((time - PRIME_DELAY_S) / PRIME_DRAW_S, 0, 1);
    // Decelerating growth: the head leaves fast and settles into its lane.
    const grown = raw >= 1 ? 1 : 1 - Math.pow(1 - raw, 3);
    // A minimum of two samples, so the first frames are a dot rather than nothing.
    const head = Math.max(2, Math.round(grown * STRAND_STEPS));

    const gradient = ctx.createLinearGradient(
      geo.core.x,
      geo.core.y,
      strand.dir.x * strand.length + geo.core.x,
      strand.dir.y * strand.length + geo.core.y,
    );
    gradient.addColorStop(0, rgba(colour, 0.55));
    gradient.addColorStop(0.18, rgba(colour, 0.9));
    gradient.addColorStop(1, rgba(colour, 1));

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Haze: the line has body, a ruler-thin stroke does not read as light.
    traceRange(ctx, buf, 0, head);
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = clamp(voice * 0.22, 0, 1);
    ctx.lineWidth = 10;
    ctx.stroke();

    // The line itself: heavier than any other stroke in the field, by design.
    ctx.globalAlpha = clamp(voice * 0.98, 0, 1);
    ctx.lineWidth = 2.1;
    ctx.stroke();

    // White-hot core, on ink. On paper it would vanish into the cream, so light theme keeps
    // the saturated clay and only adds a hairline of pale ink-mixed light.
    ctx.strokeStyle = isDark ? "rgba(255,252,246,0.9)" : rgba(mix(colour, INK, 0.18), 1);
    ctx.globalAlpha = clamp(voice * (isDark ? 0.65 : 0.8), 0, 1);
    ctx.lineWidth = 0.9;
    ctx.stroke();

    /**
     * The dot it started from. While the line is still growing this is the only thing on
     * screen; once grown it stays as the seed point at the origin, which is also why the
     * core looks like it has a pin in it.
     */
    const seed = 1 - grown * 0.45;
    const seedR = 3.4 * seed;
    const seedGradient = ctx.createRadialGradient(
      geo.core.x,
      geo.core.y,
      0,
      geo.core.x,
      geo.core.y,
      seedR * 6,
    );
    seedGradient.addColorStop(0, isDark ? "rgba(255,255,252,0.95)" : "rgba(255,255,255,0.98)");
    seedGradient.addColorStop(0.28, rgba(colour, 0.7));
    seedGradient.addColorStop(1, rgba(colour, 0));
    ctx.fillStyle = seedGradient;
    ctx.beginPath();
    ctx.arc(geo.core.x, geo.core.y, seedR * 6, 0, TAU);
    ctx.fill();

    // The head of the line: a bright bead that leads the growth and dissolves into the lane.
    const headFade = 1 - Math.pow(grown, 3);
    if (headFade > 0.02) {
      const hx = buf[head * 2];
      const hy = buf[head * 2 + 1];
      const r = 14 * headFade + 5;
      const headGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
      headGlow.addColorStop(0, isDark ? "rgba(255,255,252,0.95)" : "rgba(255,255,255,0.98)");
      headGlow.addColorStop(0.22, rgba(colour, 0.75));
      headGlow.addColorStop(1, rgba(colour, 0));
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(hx, hy, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = isDark ? "rgba(255,252,246,0.95)" : rgba(mix(colour, INK, 0.1), 1);
      ctx.beginPath();
      ctx.arc(hx, hy, 1.9 * headFade + 0.6, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  /** Soft spectral wedges: the broad wash the hairlines travel inside. */
  const drawRibbons = (ctx: Ctx) => {
    if (!geo) return;
    for (let i = 0; i < geo.strands.length; i++) {
      const strand = geo.strands[i];
      if (strand.ribbon <= 0) continue;
      const buf = strandBufs[i];
      const nx = strand.normal.x;
      const ny = strand.normal.y;
      const voice = bandVoice(strand.band) * strand.alpha;
      const start = Math.round(0.14 * STRAND_STEPS);

      ctx.globalAlpha = clamp(voice * (1 + surgeEnergy * 0.2), 0, 1);
      ctx.fillStyle =
        ribbonGrads[i] ?? rgba(isDark ? BANDS[strand.band].dark : BANDS[strand.band].light, 0.06);
      ctx.beginPath();
      for (let j = start; j <= STRAND_STEPS; j++) {
        const t = j / STRAND_STEPS;
        const half = 0.6 + Math.pow(t, 1.35) * strand.ribbon;
        const x = buf[j * 2] + nx * half;
        const y = buf[j * 2 + 1] + ny * half;
        if (j === start) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let j = STRAND_STEPS; j >= start; j--) {
        const t = j / STRAND_STEPS;
        const half = 0.6 + Math.pow(t, 1.35) * strand.ribbon;
        ctx.lineTo(buf[j * 2] - nx * half, buf[j * 2 + 1] - ny * half);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /**
   * Tesla plasma, braided over the spine of each band.
   *
   * A discharge is angular: current takes the shortest path between strike points, so the
   * channel is a polyline through a handful of anchors with a large lateral offset and only a
   * pixel of micro-jitter — not a smooth sine displaced sideways. Jitter is quantised to a
   * 24 fps bucket so the crackle snaps instead of shimmering, and every value comes from a
   * hash: no allocation and no Math.random inside a frame.
   */
  const drawPlasma = (ctx: Ctx) => {
    if (!geo) return;
    const frame = jitterFrame;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < geo.strands.length; i++) {
      const strand = geo.strands[i];
      if (strand.ribbon <= 0) continue;
      const band = BANDS[strand.band];
      const buf = strandBufs[i];
      const lane = strand.length;
      const nrm = strand.normal;
      const colour = isDark ? band.dark : band.light;
      const weight =
        band.plasma * (isDark ? 0.95 : 0.86) * (1 + surgeEnergy * 0.3) * bandVoice(strand.band);
      const base = (isDark ? band.darkAlpha : band.lightAlpha) * weight * strand.alpha;
      const strikeAmp = clamp(lane * 0.035, 5, 15);

      // --- anchors: sparse, so the segments between them are straight and angular
      ctx.beginPath();
      ctx.moveTo(buf[0], buf[1]);
      for (let k = 1; k <= STRIKE_ANCHORS; k++) {
        const s = k / STRIKE_ANCHORS;
        const at = Math.round(s * STRAND_STEPS);
        const env = Math.pow(Math.sin(Math.PI * s), 0.9);
        const offset =
          (hash(i * 97 + k * 31 + 7, frame) - 0.5) * 2 * strikeAmp * Math.pow(s, 0.45) * env;
        const jx = (hash(i * 41 + k * 17 + 3, frame) - 0.5) * 1.6;
        ctx.lineTo(buf[at * 2] + nrm.x * (offset + jx), buf[at * 2 + 1] + nrm.y * (offset + jx));
      }

      // ionised haze: wide, faint, coloured
      ctx.strokeStyle = rgba(colour, 1);
      ctx.globalAlpha = clamp(base * (isDark ? 0.16 : 0.2), 0, 1);
      ctx.lineWidth = isDark ? 7 : 6;
      ctx.stroke();

      // the channel proper
      ctx.globalAlpha = clamp(base * 0.68, 0, 1);
      ctx.lineWidth = isDark ? 1.9 : 1.7;
      ctx.stroke();

      // Hot core. On ink it is white-hot; on paper a white core would vanish into the cream,
      // so light theme drops to a saturated filament instead — the same read, inverted.
      ctx.strokeStyle = isDark ? "rgba(255,252,246,0.95)" : rgba(mix(colour, INK, 0.42), 1);
      ctx.globalAlpha = clamp(base * (isDark ? 0.5 : 0.45), 0, 1);
      ctx.lineWidth = 0.85;
      ctx.stroke();

      // --- dendrites: one fork per site, one level deep, tapering to nothing at the tip.
      for (let b = 0; b < FORK_AT.length; b++) {
        const sPos = FORK_AT[b] + (hash(i * 19 + b * 7 + 3, 0) - 0.5) * 0.08;
        const at = Math.round(sPos * STRAND_STEPS);
        const rootX = buf[at * 2];
        const rootY = buf[at * 2 + 1];
        const seed = hash(i * 131 + b * 37 + 17, frame);
        const reach = Math.min(lane * 0.09 * (0.82 + seed * 0.36), STRIKE_REACH_MAX);
        const sway = (hash(i * 61 + b * 23 + 5, frame) - 0.5) * 0.9;
        const side = ((i + b) % 2 === 0 ? 1 : -1) * (0.6 + seed * 0.3);
        const angle = Math.atan2(nrm.y, nrm.x) + side;
        const dx = Math.cos(angle) * reach;
        const dy = Math.sin(angle) * reach;
        const wobAmp = reach * 0.22;

        for (let k = 0; k <= FORK_STEPS; k++) {
          const t = k / FORK_STEPS;
          const wander = (hash(i * 17 + b * 71 + k * 11, frame) - 0.5) * wobAmp * t * t;
          const bend = sway * reach * t * t * 0.35;
          forkBuf[k * 2] = rootX + dx * t - dy * (wander / reach) - dy * (bend / reach);
          forkBuf[k * 2 + 1] = rootY + dy * t + dx * (wander / reach) + dx * (bend / reach);
        }

        let runStart = 0;
        for (let run = 0; run < FORK_RUNS.length; run++) {
          const runEnd = runStart + Math.round(FORK_RUNS[run] * FORK_STEPS);
          const fade = 1 - run / FORK_RUNS.length;
          ctx.beginPath();
          ctx.moveTo(forkBuf[runStart * 2], forkBuf[runStart * 2 + 1]);
          for (let k = runStart + 1; k <= Math.min(runEnd, FORK_STEPS); k++) {
            ctx.lineTo(forkBuf[k * 2], forkBuf[k * 2 + 1]);
          }
          const isTip = run === FORK_RUNS.length - 1;
          ctx.strokeStyle = isTip
            ? isDark
              ? "rgba(255,252,246,0.95)"
              : rgba(mix(colour, INK, 0.4), 1)
            : rgba(colour, 1);
          ctx.globalAlpha = clamp(base * (isTip ? 0.45 : 0.6) * fade, 0, 1);
          ctx.lineWidth = isTip ? 0.55 : 1.3 * (1 - run * 0.22);
          ctx.stroke();
          runStart = runEnd;
        }
      }
    }

    ctx.globalAlpha = 1;
  };

  /** Layer — the incident ray, overshooting its facet a touch so it can't read as a stub. */
  const drawBeam = (ctx: Ctx) => {
    if (!geo || !beamGrad) return;
    const { source, hit } = geo;
    const dx = hit.x - source.x;
    const dy = hit.y - source.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const steps = 36;
    const amp = 2.4 * (1 + surgeEnergy * 0.4);
    const overshoot = 6;

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const env = Math.sin(Math.PI * s);
      const wobble =
        (Math.sin(s * 2.4 * Math.PI - time * 1.5) + Math.sin(s * 4.9 * Math.PI + time) * 0.22) *
        amp *
        env;
      const t = s + (overshoot / len) * s;
      const x = source.x + dx * t + nx * wobble;
      const y = source.y + dy * t + ny * wobble;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = beamGrad;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const beamBoost = headlineHover ? 1.3 : 1;
    ctx.globalAlpha = Math.min(1, 0.16 * beamBoost);
    ctx.lineWidth = 6.5;
    ctx.stroke();
    ctx.globalAlpha = Math.min(1, 0.82 * beamBoost);
    ctx.lineWidth = 1.2 * (headlineHover ? 1.2 : 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  /**
   * The glass.
   *
   * Read as a solid, not an outline: a shell with a value split across its facets, a crisp rim
   * (ink edge + inner white), the dispersion that happens *inside* it — seven hairlines
   * leaving the entry point and converging on the exit — a caustic pool under the base, and a
   * glint at each vertex. The internal fan is the drawing's one piece of exposition: it shows
   * where the colours come from instead of asserting them.
   */
  const drawGlass = (ctx: Ctx) => {
    if (!geo) return;
    const { topV, leftV, rightV, hit, exit, prismSize } = geo;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;

    const centroid = {
      x: (topV.x + leftV.x + rightV.x) / 3,
      y: (topV.y + leftV.y + rightV.y) / 3,
    };

    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(leftV.x, leftV.y);
      ctx.lineTo(rightV.x, rightV.y);
      ctx.closePath();
    };

    // --- 1. the caustic pool: light that did not leave the prism, pooled warm on the paper
    const poolX = rightV.x - prismSize * 0.34;
    const poolY = rightV.y + prismSize * 0.11;
    const poolR = prismSize * 0.58;
    const pool = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, poolR);
    pool.addColorStop(0, rgba(warm, isDark ? 0.2 : 0.14));
    pool.addColorStop(0.45, rgba(warm, isDark ? 0.07 : 0.05));
    pool.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(poolX, poolY, poolR, 0, TAU);
    ctx.fill();

    // --- 2. the body: light enters at the apex and pools toward the base
    trace();
    ctx.fillStyle = glassGrad ?? (isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.72)");
    ctx.fill();

    // --- 3. the three faces. A prism seen head-on is one shape; a prism seen as glass is
    //        three faces at three values with one bright edge between them.
    const nearFace = ctx.createLinearGradient(topV.x, topV.y, leftV.x, leftV.y);
    nearFace.addColorStop(0, isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)");
    nearFace.addColorStop(1, isDark ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.12)");
    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y);
    ctx.lineTo(leftV.x, leftV.y);
    ctx.lineTo(centroid.x, centroid.y);
    ctx.closePath();
    ctx.fillStyle = nearFace;
    ctx.fill();

    const farFace = ctx.createLinearGradient(rightV.x, rightV.y, centroid.x, centroid.y);
    farFace.addColorStop(0, isDark ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.045)");
    farFace.addColorStop(1, isDark ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.006)");
    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y);
    ctx.lineTo(rightV.x, rightV.y);
    ctx.lineTo(centroid.x, centroid.y);
    ctx.closePath();
    ctx.fillStyle = farFace;
    ctx.fill();

    // A whisper of the hue the glass is bending, so the body is not colourless paper.
    const tint = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, prismSize * 0.8);
    tint.addColorStop(0, rgba(warm, isDark ? 0.16 : 0.1));
    tint.addColorStop(1, rgba(warm, 0));
    trace();
    ctx.fillStyle = tint;
    ctx.fill();

    // --- 4. the dispersion inside the glass: seven hairlines, hit → exit. This is the one
    //        piece of exposition in the drawing — it shows where the colours come from.
    for (const [i, band] of BANDS.entries()) {
      const colour = isDark ? band.dark : band.light;
      const bow = (i - 3) * prismSize * 0.026;
      ctx.beginPath();
      ctx.moveTo(hit.x, hit.y);
      ctx.quadraticCurveTo(
        (hit.x + exit.x) / 2 + bow * 0.3,
        (hit.y + exit.y) / 2 + bow,
        exit.x,
        exit.y,
      );
      ctx.strokeStyle = rgba(colour, 1);
      ctx.globalAlpha = band.flagship ? 0.5 : 0.34;
      ctx.lineWidth = band.flagship ? 1.05 : 0.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // The undispersed core of the beam, continuing through the glass.
    ctx.beginPath();
    ctx.moveTo(hit.x, hit.y);
    ctx.lineTo(exit.x, exit.y);
    ctx.strokeStyle = isDark ? "rgba(255,252,246,0.55)" : "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // --- 5. the rim: ink edge outside, a white highlight just inside it. Two hairlines at
    //        two values is what makes a shape read as an object with thickness.
    trace();
    ctx.strokeStyle = isDark ? "rgba(248,246,240,0.62)" : "rgba(27,24,21,0.55)";
    ctx.lineWidth = 1.35;
    ctx.stroke();

    const inset = Math.max(1.6, prismSize * 0.014) / prismSize;
    ctx.beginPath();
    ctx.moveTo(lerp(topV.x, centroid.x, inset), lerp(topV.y, centroid.y, inset));
    ctx.lineTo(lerp(leftV.x, centroid.x, inset), lerp(leftV.y, centroid.y, inset));
    ctx.lineTo(lerp(rightV.x, centroid.x, inset), lerp(rightV.y, centroid.y, inset));
    ctx.closePath();
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // --- 6. specular streak along the incident facet: the highlight that sells the glass
    const streakFrom = onFacet(topV, leftV, 0.1);
    const streakTo = onFacet(topV, leftV, 0.44);
    const streak = ctx.createLinearGradient(streakFrom.x, streakFrom.y, streakTo.x, streakTo.y);
    streak.addColorStop(0, "rgba(255,255,255,0)");
    streak.addColorStop(0.5, isDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,1)");
    streak.addColorStop(1, "rgba(255,255,255,0)");
    // The streak sits just inside the facet, where a real edge catches the light.
    const insetPx = Math.max(2, prismSize * 0.02) / prismSize;
    ctx.beginPath();
    ctx.moveTo(lerp(streakFrom.x, centroid.x, insetPx), lerp(streakFrom.y, centroid.y, insetPx));
    ctx.lineTo(lerp(streakTo.x, centroid.x, insetPx), lerp(streakTo.y, centroid.y, insetPx));
    ctx.strokeStyle = streak;
    ctx.lineWidth = Math.max(1.2, prismSize * 0.014);
    ctx.lineCap = "round";
    ctx.stroke();

    // --- 7. vertex glints, warm-white, sized so the corners read as cut crystal
    for (const vertex of [topV, leftV, rightV]) {
      const r = Math.max(4, prismSize * 0.06);
      const glint = ctx.createRadialGradient(vertex.x, vertex.y, 0, vertex.x, vertex.y, r);
      glint.addColorStop(0, isDark ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,1)");
      glint.addColorStop(0.4, rgba(warm, isDark ? 0.1 : 0.07));
      glint.addColorStop(1, rgba(warm, 0));
      ctx.fillStyle = glint;
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = isDark ? "rgba(248,246,240,0.55)" : "rgba(27,24,21,0.4)";
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, 0.9, 0, TAU);
      ctx.fill();
    }
  };

  /** Entry spark: the facet lights where the beam lands. */
  const drawEntrySpark = (ctx: Ctx) => {
    if (!geo) return;
    const { hit } = geo;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;
    const r = 6.5 * (1 + surgeEnergy * 0.4);
    const spark = ctx.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, r);
    spark.addColorStop(0, "rgba(255,255,252,0.92)");
    spark.addColorStop(0.3, rgba(warm, 0.4));
    spark.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = spark;
    ctx.beginPath();
    ctx.arc(hit.x, hit.y, r, 0, TAU);
    ctx.fill();
  };

  /**
   * The core: where refraction becomes emission — the single dot every strand is born from.
   *
   * A clay corona that reaches past the glass, a white-hot bloom inside it, the point itself,
   * and four micro-sparks in orbit so it never looks like a drawn circle.
   */
  const drawCore = (ctx: Ctx) => {
    if (!geo) return;
    const { exit, prismSize } = geo;
    const pulse = 1 + Math.sin(time * TAU * 1.5) * 0.05 + surgeEnergy * 0.5;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;
    const voice = isDark ? 1 : 0.94;

    const coronaR = prismSize * (0.72 + surgeEnergy * 0.35);
    const corona = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, coronaR);
    const bandAlpha = isDark ? BANDS[2].darkAlpha : BANDS[2].lightAlpha;
    corona.addColorStop(0, rgba(warm, bandAlpha * 0.34 * voice));
    corona.addColorStop(0.45, rgba(warm, bandAlpha * 0.12 * voice));
    corona.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, coronaR, 0, TAU);
    ctx.fill();

    const r = prismSize * 0.36 * pulse;
    const bloom = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, r);
    bloom.addColorStop(0, "rgba(255,255,252,0.98)");
    bloom.addColorStop(0.16, rgba(warm, isDark ? 0.8 : 0.74));
    bloom.addColorStop(0.46, rgba(warm, isDark ? 0.22 : 0.15));
    bloom.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, r, 0, TAU);
    ctx.fill();

    // A pair of thin flares crossing at the point: the shortest way to read "light source"
    // rather than "pale circle".
    const flare = prismSize * (0.42 + surgeEnergy * 0.2);
    for (const [ax, ay, alpha] of [
      [1, 0, 0.22],
      [0, 1, 0.14],
    ] as const) {
      const gradient = ctx.createLinearGradient(
        exit.x - ax * flare,
        exit.y - ay * flare,
        exit.x + ax * flare,
        exit.y + ay * flare,
      );
      gradient.addColorStop(0, rgba(warm, 0));
      gradient.addColorStop(0.5, rgba(warm, alpha));
      gradient.addColorStop(1, rgba(warm, 0));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(exit.x - ax * flare, exit.y - ay * flare);
      ctx.lineTo(exit.x + ax * flare, exit.y + ay * flare);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.99)";
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 2.4 * pulse, 0, TAU);
    ctx.fill();

    for (let k = 0; k < 4; k++) {
      const orbit = prismSize * (0.13 + k * 0.032);
      const angle = time * TAU * (0.085 + k * 0.021) + k * 1.7;
      const alpha = 0.5 - k * 0.09;
      ctx.fillStyle = isDark ? `rgba(255,252,246,${alpha})` : rgba(BANDS[2].light, alpha * 0.9);
      ctx.beginPath();
      ctx.arc(
        exit.x + Math.cos(angle) * orbit,
        exit.y + Math.sin(angle) * orbit * 0.72,
        1.1 - k * 0.12,
        0,
        TAU,
      );
      ctx.fill();
    }
  };

  /** Layer — grounding filaments: the field is reasoned onto the catalogue, one per tile. */
  const drawGrounds = (ctx: Ctx) => {
    // At rest the field is full-bleed and needs no leader lines; the filaments appear when a
    // tile is hovered, which is the only moment they mean anything.
    if (!geo || hoverTile < 0) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const [index, ground] of geo.grounds.entries()) {
      const hovered = hoverTile === index;
      const band = BANDS[ground.band];
      const colour = isDark ? band.dark : band.light;
      const alpha =
        (isDark ? band.darkAlpha : band.lightAlpha) *
        (isDark ? 0.42 : 0.34) *
        (hoverTile < 0 ? 1 : hovered ? 2.6 : 0.24);
      const { from, to } = ground;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;

      // A tap, not a leader line: it bows slightly and never quite runs straight.
      ctx.beginPath();
      for (let k = 0; k <= 18; k++) {
        const t = k / 18;
        const env = Math.sin(Math.PI * t);
        const bow = Math.sin(t * Math.PI * 1.15) * 8 * env;
        const jitter = (hash(ground.band * 31 + k * 7, jitterFrame) - 0.5) * 0.9 * env;
        const x = from.x + dx * t + nx * (bow + jitter);
        const y = from.y + dy * t + ny * (bow + jitter);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(colour, 1);
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.lineWidth = 0.8;
      ctx.stroke();

      if (hovered) {
        const bloom = ctx.createRadialGradient(to.x, to.y, 0, to.x, to.y, 38);
        bloom.addColorStop(0, rgba(colour, 0.32));
        bloom.addColorStop(0.45, rgba(colour, 0.15));
        bloom.addColorStop(1, rgba(colour, 0));
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(to.x, to.y, 38, 0, TAU);
        ctx.fill();
      }

      // Terminal node where the light lands on the tile.
      ctx.globalAlpha = Math.min(1, alpha * 2);
      ctx.fillStyle = rgba(colour, 1);
      ctx.beginPath();
      ctx.arc(to.x, to.y, 1.7, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = rgba(colour, 1);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(to.x, to.y, 4.6, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  /**
   * The current catching the cursor.
   *
   * The strands themselves already bend toward the pointer (see fillStrand). This layer adds
   * the part you can only see when it happens: the nearest strand of each hue throws a jittered
   * filament at the cursor, stopping one gap short, and the contact point crackles. Everything
   * is on the 24 fps bucket, so it snaps like discharge rather than sliding like rubber.
   */
  const drawCatch = (ctx: Ctx) => {
    if (!geo || pointerEase <= 0.02 || catches.length === 0) return;
    const near = [...catches].sort((a, b) => a.distance - b.distance).slice(0, 2);
    const charge = isDark ? "rgba(255,252,246,0.95)" : rgba(mix(BANDS[2].light, INK, 0.15), 1);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // The field itself: a soft ionised halo around the cursor. This is what makes the
    // pointer feel charged before a single spark has been drawn.
    const halo = 74 + pointerEase * 26;
    const field = ctx.createRadialGradient(leanX, leanY, 0, leanX, leanY, halo);
    field.addColorStop(0, rgba(isDark ? BANDS[3].dark : BANDS[3].light, isDark ? 0.16 : 0.1));
    field.addColorStop(0.42, rgba(isDark ? BANDS[4].dark : BANDS[4].light, isDark ? 0.07 : 0.045));
    field.addColorStop(1, rgba(isDark ? BANDS[4].dark : BANDS[4].light, 0));
    ctx.fillStyle = field;
    ctx.beginPath();
    ctx.arc(leanX, leanY, halo, 0, TAU);
    ctx.fill();

    for (const [rank, entry] of near.entries()) {
      if (entry.distance > CATCH_RADIUS * 0.95) continue;
      const strand = geo.strands[entry.strand];
      const band = BANDS[strand.band];
      const colour = isDark ? band.dark : band.light;
      const proximity = Math.pow(1 - entry.distance / CATCH_RADIUS, 1.2);
      const strength = pointerEase * proximity * (hoverTile >= 0 ? 0.3 : 1);
      if (strength <= 0.02) continue;

      // The length of strand that the charge is running through: it brightens where the
      // bend is tightest, which is what makes the *strand* feel live, not just the arc.
      const buf = strandBufs[entry.strand];
      let nearestAt = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i <= STRAND_STEPS; i++) {
        const d = Math.hypot(buf[i * 2] - entry.x, buf[i * 2 + 1] - entry.y);
        if (d < nearestDistance) {
          nearestDistance = d;
          nearestAt = i;
        }
      }
      const span = 8;
      const from = Math.max(0, nearestAt - span);
      const to = Math.min(STRAND_STEPS, nearestAt + span);
      traceRange(ctx, buf, from, to);
      ctx.strokeStyle = charge;
      ctx.globalAlpha = clamp(strength * 0.5, 0, 1);
      ctx.lineWidth = 1.6 * strand.width;
      ctx.stroke();

      const dx = leanX - entry.x;
      const dy = leanY - entry.y;
      const gap = Math.hypot(dx, dy);
      if (gap < 14) continue;
      const reach = gap - CATCH_GAP;
      const ux = dx / gap;
      const uy = dy / gap;
      const nx = -uy;
      const ny = ux;
      const segments = 7;

      /**
       * A discharge is mostly *straight* with one clean break in it. Big alternating offsets
       * make a Christmas-tree squiggle, which is the tell of a drawn lightning bolt; a small
       * drift plus a single kink reads as current.
       */
      const kink = 2 + Math.floor(hash(entry.strand * 61 + 9, jitterFrame) * 3);
      const kinkDir = hash(entry.strand * 97 + 1, jitterFrame) > 0.5 ? 1 : -1;
      const offsets: number[] = [0];
      let walk = 0;
      for (let k = 1; k < segments; k++) {
        const env = Math.pow(Math.sin(Math.PI * (k / segments)), 0.6);
        // Amplitude follows the span: a 30 px arc with 18 px of wobble is a scribble.
        const wobble = clamp(reach * 0.1, 1.5, 9);
        walk += (hash(entry.strand * 71 + k * 13, jitterFrame) - 0.5) * wobble * 0.9;
        walk = clamp(walk, -wobble, wobble);
        const kick = k === kink ? kinkDir * wobble * 0.95 : 0;
        offsets.push((walk + kick) * env);
      }
      offsets.push(0);

      ctx.beginPath();
      ctx.moveTo(entry.x, entry.y);
      for (let k = 1; k <= segments; k++) {
        const t = k / segments;
        ctx.lineTo(
          entry.x + ux * reach * t + nx * offsets[k],
          entry.y + uy * reach * t + ny * offsets[k],
        );
      }

      // Haze → channel → hot core, with real weight so the filament survives on paper.
      ctx.strokeStyle = rgba(colour, 1);
      ctx.globalAlpha = clamp(strength * 0.22, 0, 1);
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.globalAlpha = clamp(strength * 0.85, 0, 1);
      ctx.lineWidth = 1.45;
      ctx.stroke();
      ctx.strokeStyle = charge;
      ctx.globalAlpha = clamp(strength * 0.9, 0, 1);
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Tip fray: two short forks where the charge hasn't landed yet.
      const tipX = entry.x + ux * reach;
      const tipY = entry.y + uy * reach;
      for (let fork = 0; fork < 2; fork++) {
        const swing = (hash(entry.strand * 17 + fork * 7, jitterFrame) - 0.5) * 1.1;
        const len = 8 + hash(entry.strand * 23 + fork, jitterFrame) * 12;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
          tipX + Math.cos(Math.atan2(uy, ux) + swing) * len,
          tipY + Math.sin(Math.atan2(uy, ux) + swing) * len,
        );
        ctx.strokeStyle = charge;
        ctx.globalAlpha = clamp(strength * (0.55 - fork * 0.2), 0, 1);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // The tightest arc gets the contact bloom.
      if (rank === 0) {
        const r = 34 + strength * 22;
        const bloom = ctx.createRadialGradient(leanX, leanY, 0, leanX, leanY, r);
        bloom.addColorStop(0, rgba(colour, 0.3 * strength));
        bloom.addColorStop(0.4, rgba(colour, 0.11 * strength));
        bloom.addColorStop(1, rgba(colour, 0));
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(leanX, leanY, r, 0, TAU);
        ctx.fill();
      }
    }

    // The charge itself: a hot point at the cursor, a ring, and three orbiting sparks.
    ctx.globalAlpha = clamp(pointerEase * 0.9, 0, 1);
    ctx.fillStyle = charge;
    ctx.beginPath();
    ctx.arc(leanX, leanY, 2.1, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = clamp(pointerEase * 0.4, 0, 1);
    ctx.strokeStyle = charge;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(leanX, leanY, 6.5, 0, TAU);
    ctx.stroke();
    for (let k = 0; k < 3; k++) {
      const angle = time * TAU * (0.3 + k * 0.12) + k * 2.1;
      ctx.globalAlpha = clamp(pointerEase * (0.5 - k * 0.11), 0, 1);
      ctx.beginPath();
      ctx.arc(
        leanX + Math.cos(angle) * (9 + k * 4),
        leanY + Math.sin(angle) * (9 + k * 4),
        1,
        0,
        TAU,
      );
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  /** Click surge: a wavefront leaves the point of contact and the field brightens. */
  const drawSurges = (ctx: Ctx) => {
    if (!geo) return;
    for (const surge of surges) {
      const age = surgeLife - surge.at;
      if (age < 0 || age > SURGE_LIFE_MS) continue;
      const t = age / SURGE_LIFE_MS;
      const energy = Math.pow(1 - t, 1.6);
      const radius = 12 + Math.pow(t, 0.62) * 190;
      const warm = isDark ? BANDS[surge.seed % 3 === 0 ? 0 : 2].dark : BANDS[2].light;

      const front = (r: number, width: number, haze: number, coreA: number, seed: number) => {
        ctx.beginPath();
        ctx.arc(surge.x, surge.y, r, 0, TAU);
        ctx.strokeStyle = rgba(warm, 1);
        ctx.globalAlpha = clamp(haze, 0, 1);
        ctx.lineWidth = width + 8;
        ctx.stroke();
        ctx.globalAlpha = clamp(coreA, 0, 1);
        ctx.lineWidth = width * 0.7;
        ctx.stroke();
        void seed;
      };

      front(radius, 11, energy * 0.05, energy * 0.3, surge.seed);
      if (t < 0.55) front(radius * 0.66, 6, energy * 0.03, energy * 0.2, surge.seed + 3);

      if (age < 90) {
        const flash = 1 - age / 90;
        const flashR = 16 + (1 - flash) * 26;
        const bloom = ctx.createRadialGradient(surge.x, surge.y, 0, surge.x, surge.y, flashR);
        bloom.addColorStop(0, `rgba(255,255,255,${(0.5 * flash).toFixed(3)})`);
        bloom.addColorStop(0.5, rgba(warm, 0.26 * flash));
        bloom.addColorStop(1, rgba(warm, 0));
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(surge.x, surge.y, flashR, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  /**
   * Atmosphere — motes and photon packets.
   *
   * Density is deliberate: motes are twice as likely on the fan side as over the copy, and
   * there are none inside a quiet rect. Photons climb the beam, then ride the clay spine out
   * of the frame, parametrised by arc length so their speed is constant across the two legs.
   */
  const drawAtmosphere = (ctx: Ctx) => {
    if (!geo) return;
    const { core, source, hit, heroW, heroH } = geo;
    const spine = geo.strands.find((strand) => BANDS[strand.band].flagship && strand.ribbon > 0);
    const spineTarget = spine ? geo.targets[spine.index] : { x: heroW + 40, y: heroH * 0.5 };
    const beamLen = dist(source, hit) || 1;
    const fanLen = spine ? dist(core, spineTarget) || 1 : 1;
    const totalLen = beamLen + fanLen;

    // --- motes: a fixed field drifting slowly, brighter toward the fan
    const moteCount = isDark ? 26 : 20;
    for (let i = 0; i < moteCount; i++) {
      const seedX = hash(i * 13 + 1, 0);
      const seedY = hash(i * 29 + 5, 0);
      const speed = 0.00004 + hash(i * 7 + 3, 0) * 0.00006;
      // Cheap deterministic drift: fold time into the seed space rather than storing state.
      const x = ((seedX + time * speed) % 1) * heroW;
      const y = ((seedY + time * speed * 0.6) % 1) * heroH;
      if (isQuiet(x, y) > 0.02) continue;
      const r = 0.6 + hash(i * 11 + 7, 0) * 1.1;
      const a = (0.05 + hash(i * 17 + 9, 0) * 0.07) * (x > heroW * 0.55 ? 1.15 : 0.75);
      ctx.fillStyle = isDark
        ? `rgba(248,246,240,${a.toFixed(3)})`
        : `rgba(27,24,21,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }

    // --- photon packets: climb the beam, then ride the clay spine out of the frame
    const packets = isDark ? 3 : 2;
    for (let p = 0; p < packets; p++) {
      const head = ((time * 0.16 + p / packets) % 1) * totalLen;
      const fade = Math.min(1, Math.min(head, totalLen - head) / 40);
      if (fade <= 0) continue;
      const point =
        head <= beamLen
          ? {
              x: lerp(source.x, hit.x, head / beamLen),
              y: lerp(source.y, hit.y, head / beamLen),
            }
          : {
              x: lerp(core.x, spineTarget.x, (head - beamLen) / fanLen),
              y: lerp(core.y, spineTarget.y, (head - beamLen) / fanLen),
            };
      ctx.globalAlpha = 0.5 * fade * (1 + surgeEnergy * 0.6);
      ctx.fillStyle = isDark ? "rgba(255,252,246,0.95)" : rgba(BANDS[2].light, 0.95);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.4, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  /** Distance from a point to the nearest quiet rect, 0 inside one. */
  const isQuiet = (x: number, y: number) => {
    if (!layout) return 1;
    let best = 1;
    for (const r of layout.ledger.quietRects) {
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      const d = Math.hypot(dx, dy);
      best = Math.min(best, d / 48);
    }
    return 1 - Math.min(1, best);
  };

  /** ?heroDebug=1 — the register check: columns, facets, fan order, sweep. */
  const drawDebug = (ctx: Ctx) => {
    if (!geo || !layout) return;

    ctx.save();
    ctx.lineWidth = 0.75;
    if (ctx.setLineDash) ctx.setLineDash([3, 5]);

    ctx.strokeStyle = "rgba(0,120,255,0.35)";
    for (const x of layout.columns) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, geo.heroH);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255,0,140,0.4)";
    ctx.beginPath();
    ctx.moveTo(geo.source.x, geo.source.y);
    ctx.lineTo(geo.hit.x, geo.hit.y);
    ctx.stroke();

    if (ctx.setLineDash) ctx.setLineDash([2, 4]);
    ctx.strokeStyle = "rgba(0,160,90,0.5)";
    for (const t of geo.targets) {
      ctx.beginPath();
      ctx.moveTo(geo.exit.x, geo.exit.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }
    if (ctx.setLineDash) ctx.setLineDash([]);

    const mark = (p: Vec, label: string, colour: string) => {
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, TAU);
      ctx.stroke();
      if (ctx.fillText) {
        ctx.font = "11px ui-monospace, monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = colour;
        ctx.fillText(`${label} ${p.x.toFixed(0)},${p.y.toFixed(0)}`, p.x + 7, p.y - 6);
      }
    };
    mark(geo.source, `S/${geo.entryMode}`, "rgba(255,0,140,0.9)");
    mark(geo.hit, "P_in", "rgba(255,0,140,0.9)");
    mark(geo.exit, "P_exit", "rgba(0,120,255,0.9)");
    mark(geo.topV, "V_top", "rgba(0,0,0,0.55)");
    mark(geo.leftV, "V_left", "rgba(0,0,0,0.55)");
    mark(geo.rightV, "V_right", "rgba(0,0,0,0.55)");

    for (const tile of layout.tiles) {
      ctx.strokeStyle = "rgba(255,140,0,0.55)";
      ctx.beginPath();
      ctx.moveTo(tile.cx, tile.top);
      ctx.lineTo(tile.cx, tile.bottom);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawScene = (ctx: Ctx) => {
    if (!geo) return;
    ctx.clearRect(0, 0, geo.heroW, geo.heroH);

    ensureCaches(ctx);

    // Layer 1 — the plate (cached raster) and the ambient wash that lights the whole section
    drawPlate(ctx);
    drawAmbient(ctx);

    // Layers 2–3 — the spectral body, the hairline continuum it lives in, and the plasma
    fillAll();
    drawRibbons(ctx);
    for (let i = 0; i < geo.strands.length; i++) {
      if (geo.strands[i].ghost) drawStrand(ctx, i);
    }
    for (let i = 0; i < geo.strands.length; i++) {
      if (!geo.strands[i].ghost) drawStrand(ctx, i);
    }
    drawPlasma(ctx);
    drawPrime(ctx);

    // The dissolve sits between the field and the things that must stay bright: the light
    // behind the words is thinned here, then the beam, glass, core and filaments are painted
    // over it at full strength.
    drawDissolve(ctx);

    // The incident ray, then the glass that receives it
    drawBeam(ctx);
    drawGlass(ctx);
    drawEntrySpark(ctx);

    // The core, then the filaments that ground the fan on the catalogue
    drawCore(ctx);
    drawGrounds(ctx);

    // Interaction: the current reaching for the cursor, then the click wavefronts
    drawCatch(ctx);
    drawSurges(ctx);

    // Layer 6 — atmosphere
    drawAtmosphere(ctx);

    if (debug) drawDebug(ctx);
  };

  /* ----------------------------------------------------------------- public API */

  let fallbackW = 0;
  let fallbackH = 0;

  return {
    /** Layout snapshot from ./hero-layout. Rebuilds geometry and invalidates caches. */
    setLayout(next: LayoutSnapshot) {
      layout = next;
      buildGeometry();
    },
    /** Kept for API compatibility: sizes the stage when no measured layout is available. */
    resize(width: number, height: number) {
      fallbackW = Math.max(1, width);
      fallbackH = Math.max(1, height);
      if (!layout) {
        const margin = Math.min(96, fallbackW * 0.06);
        layout = {
          heroW: fallbackW,
          heroH: fallbackH,
          copyRight: margin * 0.6,
          thesisLine: { left: margin, right: margin, baselineY: fallbackH * 0.3 },
          tiles: [],
          container: { left: margin, right: fallbackW - margin },
          columns: [],
          textRects: [],
          ledger: { quietRects: [], baselines: [], balance: 0.5 },
        };
        buildGeometry();
      }
    },
    setTheme(dark: boolean) {
      if (dark === isDark) return;
      isDark = dark;
    },
    setDebug(on: boolean) {
      debug = on;
    },
    setPointer(x: number, y: number, active: boolean) {
      pointerX = x;
      pointerY = y;
      if (active && !pointerActive) {
        leanX = x;
        leanY = y;
      }
      pointerActive = active;
    },
    /** Which stat tile the pointer is over (-1 for none). Drives tile coupling. */
    setTileHover(index: number) {
      const last = Math.max(0, (geo?.grounds.length ?? 1) - 1);
      hoverTile = index < 0 ? -1 : Math.max(0, Math.min(last, index));
    },
    /** Hovering the headline brightens the incident ray ×1.3. */
    setHeadlineHover(on: boolean) {
      headlineHover = on;
    },
    addSurge(x: number, y: number) {
      surges.push({ x, y, at: surgeLife, seed: surges.length });
      if (surges.length > 4) surges.shift();
      surgeEnergy = 1;
    },
    /** advance one frame and paint. */
    paint(ctx: Ctx, dtMs: number) {
      time += dtMs / 1000;
      advanceJitter();
      surgeLife += dtMs;
      surgeEnergy = Math.max(0, surgeEnergy - dtMs / 900);

      // τ = 80 ms follow for the lean, and the same ease for how much the pointer is allowed
      // to influence the field — so the current arrives and leaves together instead of popping.
      const ease = Math.min(1, dtMs / POINTER_TAU_MS);
      leanX += (pointerX - leanX) * ease;
      leanY += (pointerY - leanY) * ease;
      pointerEase += ((pointerActive ? 1 : 0) - pointerEase) * ease;

      drawScene(ctx);
    },
    /** one composed still, for reduced-motion visitors and for design review. */
    paintStill(ctx: Ctx) {
      time = 4.6;
      surgeEnergy = 0;
      pointerActive = false;
      pointerEase = 0;
      hoverTile = -1;
      headlineHover = false;
      surges.length = 0;
      catches.length = 0;
      advanceJitter();
      drawScene(ctx);
    },
    /** QA/motion reel: jump to an exact scene time so frames are reproducible. */
    setTime(seconds: number) {
      time = seconds;
      advanceJitter();
    },
    /** Debug/QA: the full geometry, including the strand roots the invariant test pins. */
    geometry() {
      return {
        ...(geo ?? {
          heroW: fallbackW,
          heroH: fallbackH,
          mobile: false,
          prismSize: 0,
          topV: { x: 0, y: 0 },
          leftV: { x: 0, y: 0 },
          rightV: { x: 0, y: 0 },
          prismCenter: { x: 0, y: 0 },
          hit: { x: 0, y: 0 },
          exit: { x: 0, y: 0 },
          core: { x: 0, y: 0 },
          source: { x: 0, y: 0 },
          entryMode: "top-edge" as const,
          strands: [] as Strand[],
          targets: [] as Vec[],
          normals: [] as Vec[],
          spans: [] as number[],
          grounds: [] as { from: Vec; to: Vec; band: number }[],
          sweep: { from: 0, to: 0 },
          prime: 0,
        }),
        version,
        /** The strand specs themselves (angle, band, span, resolve point) — QA reads these. */
        specs: geo?.strands ?? [],
        strands: (geo?.strands ?? []).map((_, index) => ({
          root: { x: strandBufs[index][0], y: strandBufs[index][1] },
          tip: {
            x: strandBufs[index][STRAND_STEPS * 2],
            y: strandBufs[index][STRAND_STEPS * 2 + 1],
          },
        })),
        steps: STRAND_STEPS,
        jitterBucket,
        branches: (geo?.strands.length ?? 0) * FORK_AT.length,
        interaction: {
          pointerEase,
          hoverTile,
          headlineHover,
          surges: surges.length,
          surgeEnergy,
          catches: catches.map((entry) => entry.distance),
        },
      };
    },
    /** QA: one strand's live point buffer (x, y pairs). */
    strandBuffer(index: number) {
      return strandBufs[index] ?? null;
    },
    /** QA: sample a strand's curve without painting. */
    sampleStrand(index: number, s: number) {
      if (!geo) return { x: 0, y: 0 };
      const strand = geo.strands[index];
      if (!strand) return { x: 0, y: 0 };
      const env = Math.pow(Math.sin(Math.PI * s), 0.85);
      const travel = Math.pow(s, 0.4);
      const amp = strand.amplitude;
      const omega = time * TAU * strand.hz;
      const off =
        (Math.sin(TAU * strand.cycles * s - omega + strand.phase) * amp +
          Math.sin(TAU * 2.35 * strand.cycles * s + omega * 1.3) * amp * 0.26) *
        env *
        (0.45 + 0.55 * travel);
      return {
        x: geo.core.x + strand.dir.x * (s * strand.length) + strand.normal.x * off,
        y: geo.core.y + strand.dir.y * (s * strand.length) + strand.normal.y * off,
      };
    },
    /** QA: settle the strand buffers without painting (pointer off, t = 4.6). */
    settle() {
      time = 4.6;
      surgeEnergy = 0;
      pointerActive = false;
      pointerEase = 0;
      hoverTile = -1;
      headlineHover = false;
      surges.length = 0;
      catches.length = 0;
      advanceJitter();
      fillAll();
    },
  };
}
