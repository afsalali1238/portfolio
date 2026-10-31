/**
 * hero-ray — the drawing engine behind the hero's dispersion field.
 *
 * One continuous, physically coherent light chain:
 *
 *   coherent ray leaves the last sentence → glass prism → internal caustics
 *   → incandescent core → spectral fan → grounds on the stat tiles
 *
 * Phase 1: layout-driven geometry, the seven spectral ribbons, the glass and the core.
 * Phase 2: Tesla plasma braided over the spectral body.
 * Phase 3 (this revision): full-bleed coverage, the drafting plate, grounding filaments,
 * atmosphere, and a core that actually erupts. The dissolve mask and interaction are phase 4–5.
 *
 * Coverage is the point of this revision: the field occupies the whole hero — a return sweep
 * above the copy, a fan that spans the full height and leaves both the top and the bottom
 * edge, and filaments that land on every stat tile.
 *
 * Three invariants this file exists to protect:
 *
 *   1. Layout-derived geometry. Every position comes from a LayoutSnapshot measured off the
 *      real DOM (see ./hero-layout). Nothing is a percentage of the section.
 *   2. Continuity. Each strand's displacement envelope E(s) = sin(πs)^0.9 is exactly 0 at
 *      both ends, so P(0) is the exit point to the last float and no tip detaches.
 *   3. Straight optics. Entry and exit are parametric points on the prism's facets, and the
 *      fan targets stay in angular order, so bands never cross lanes.
 *
 * No canvas shadow blur anywhere: every soft edge is a gradient or a cached sprite, and every
 * gradient is cached per geometry version and theme.
 *
 * The engine is framework-free and DOM-free (Ctx is a structural subset of the browser's
 * CanvasRenderingContext2D) so the same code paints in React and renders headlessly.
 */

import type { LayoutSnapshot } from "./hero-layout";

const TAU = Math.PI * 2;
const STRAND_STEPS = 40;
/** Lane overshoot as a fraction of span: tips must leave the frame, not stop inside it. */
const OVERSHOOT = 1.06;

/* --------------------------------------------------------------- plasma constants */

/** Dendritic branch sites along s, and their reach as a fraction of the strand's span. */
const BRANCH_AT = [0.36, 0.64, 0.82] as const;
/**
 * Reach as a fraction of the lane's span. §5 says 24–46%; at a ~700px span that is a 300px
 * scratch across three neighbouring lanes, which reads as damage, not discharge. 12–20% is
 * long enough to fork and short enough to stay in its band.
 */
const BRANCH_LEN = [0.2, 0.14, 0.11] as const;
const BRANCH_STEPS = 12;
/** A branch is stroked in three runs so it tapers to nothing instead of ending in a cut. */
const BRANCH_RUNS = [0.42, 0.32, 0.26] as const;
/** The channel is a polyline through this many anchors: sparse enough to stay angular. */
const STRIKE_ANCHORS = 9;
/** No fork reaches further than this from its root, in px. */
const STRIKE_REACH_MAX = 96;
/** Jitter is quantised to 24 fps, so the lightning crackles at a deliberate cadence. */
const JITTER_FPS = 24;
/** A surge's whole life, and the pointer's follow time constant (§7). */
const SURGE_LIFE_MS = 950;
const POINTER_TAU_MS = 90;
/** Hovering a tile dims every other band to this fraction (§7). */
const TILE_DIM = 0.45;
/** No branches closer than this to the core: density there is already deliberate. */
const BRANCH_MIN_DIST = 70;
/** Branches stay out of the type column. */
const BRANCH_MAX_X = 0.86;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

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
  /** displacement amplitude at mid-span, 6–12 px for a ~700 px throw */
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
    lightAlpha: 0.46,
    dark: [232, 106, 85],
    darkAlpha: 0.62,
    width: 1.05,
    amplitude: 8.5,
    cycles: 1.05,
    hz: 0.19,
    ribbon: 16,
    ribbonAlpha: 0.072,
    plasma: 0.85,
  },
  {
    name: "amber",
    light: [191, 106, 24],
    lightAlpha: 0.54,
    dark: [240, 165, 68],
    darkAlpha: 0.7,
    width: 1.25,
    amplitude: 9.5,
    cycles: 0.95,
    hz: 0.17,
    ribbon: 19,
    ribbonAlpha: 0.086,
    plasma: 0.9,
  },
  {
    name: "clay",
    light: [168, 71, 27],
    lightAlpha: 0.92,
    dark: [230, 126, 84],
    darkAlpha: 1,
    width: 2.2,
    amplitude: 12,
    cycles: 0.82,
    hz: 0.15,
    ribbon: 26,
    ribbonAlpha: 0.12,
    plasma: 1.0,
    flagship: true,
  },
  {
    name: "emerald",
    light: [47, 125, 94],
    lightAlpha: 0.44,
    dark: [49, 200, 154],
    darkAlpha: 0.58,
    width: 1.1,
    amplitude: 10.5,
    cycles: 0.9,
    hz: 0.21,
    ribbon: 20,
    ribbonAlpha: 0.08,
    plasma: 0.9,
  },
  {
    name: "cyan",
    light: [42, 111, 134],
    lightAlpha: 0.4,
    dark: [57, 192, 218],
    darkAlpha: 0.56,
    width: 1.05,
    amplitude: 9,
    cycles: 1.0,
    hz: 0.23,
    ribbon: 17,
    ribbonAlpha: 0.07,
    plasma: 0.85,
  },
  {
    name: "cobalt",
    light: [51, 81, 142],
    lightAlpha: 0.36,
    dark: [90, 138, 240],
    darkAlpha: 0.52,
    width: 1,
    amplitude: 8,
    cycles: 1.1,
    hz: 0.25,
    ribbon: 15,
    ribbonAlpha: 0.06,
    plasma: 0.8,
  },
  {
    name: "violet",
    light: [91, 74, 140],
    lightAlpha: 0.32,
    dark: [155, 123, 240],
    darkAlpha: 0.48,
    width: 0.95,
    amplitude: 6.5,
    cycles: 1.2,
    hz: 0.18,
    ribbon: 13,
    ribbonAlpha: 0.05,
    plasma: 0.75,
  },
];

/* ------------------------------------------------------------------ geometry contract */

/**
 * Prism placement, in CSS px.
 *
 * Desktop: apex-down equilateral-ish glass in the right third of the hero.
 * Mobile: portrait variant — the glass sits high and right, the fan is kept (not stripped).
 *
 * This offset is the one number to change if the entry point should ride the closing
 * sentence more tightly; see the note in the build report.
 */
const PRISM_OFFSET = 2.05;
const ENTRY_MIN_SPAN = 180;

type Vec = { x: number; y: number };

export type HeroGeometry = {
  heroW: number;
  heroH: number;
  mobile: boolean;
  prismSize: number;
  topV: Vec;
  leftV: Vec;
  rightV: Vec;
  /** where the beam meets the incident facet */
  hit: Vec;
  /** the sole dispersion origin: P(0) of every strand */
  exit: Vec;
  /** the beam's origin */
  source: Vec;
  /** how far the beam had to be rerouted to reach the facet */
  entryMode: "sentence" | "top-edge";
  targets: Vec[];
  /** unit normal per band, ⟂ to its lane: cached so the plasma pass never recomputes it */
  normals: Vec[];
  /** lane span per band, in px: branch reach is a fraction of this */
  spans: number[];
  /**
   * The reflected half of the beam: prism-side hit, bowed through the gutter above the
   * catalogue, ending off the left edge. This is what reaches the quiet side of the hero.
   */
  reflection: { waypoints: Vec[]; sample: (u: number) => Vec; gutterY: number };
  /** the apex exit: the least of the three ways light leaves the glass */
  specular: { waypoints: Vec[]; sample: (u: number) => Vec };
  /** one grounding filament per tile: the fan ray nearest the tile's top-centre */
  grounds: { from: Vec; to: Vec; band: number }[];
};

const onFacet = (a: Vec, b: Vec, t: number): Vec => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Catmull-Rom sampler through a list of waypoints.
 *
 * The exit rays have to obey two constraints at once: stay out of the type boxes (which forces
 * waypoints near the corridor edges) and still look like light rather than drafting. Sampling
 * a spline through the waypoints gives both — the elbows disappear, the corridor holds.
 *
 * Pure and exported so the invariant check samples exactly the curve that gets drawn.
 */
export function buildPath(waypoints: Vec[], tension = 0.5): (u: number) => Vec {
  const points = waypoints;
  const segments = Math.max(1, points.length - 1);
  const clampIndex = (i: number) => Math.min(points.length - 1, Math.max(0, i));
  return (u: number) => {
    const scaled = Math.min(0.999999, Math.max(0, u)) * segments;
    const index = Math.min(segments - 1, Math.floor(scaled));
    const t = scaled - index;
    const p0 = points[clampIndex(index - 1)];
    const p1 = points[index];
    const p2 = points[clampIndex(index + 1)];
    const p3 = points[clampIndex(index + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    const m1x = (p2.x - p0.x) * tension;
    const m1y = (p2.y - p0.y) * tension;
    const m2x = (p3.x - p1.x) * tension;
    const m2y = (p3.y - p1.y) * tension;
    return {
      x:
        (2 * t3 - 3 * t2 + 1) * p1.x +
        (t3 - 2 * t2 + t) * m1x +
        (-2 * t3 + 3 * t2) * p2.x +
        (t3 - t2) * m2x,
      y:
        (2 * t3 - 3 * t2 + 1) * p1.y +
        (t3 - 2 * t2 + t) * m1y +
        (-2 * t3 + 3 * t2) * p2.y +
        (t3 - t2) * m2y,
    };
  };
}

/** Quadratic Bézier point. Used for the reflected ray and for tapping the tiles off it. */
const quadratic = (a: Vec, control: Vec, b: Vec, t: number): Vec => {
  const inv = 1 - t;
  return {
    x: inv * inv * a.x + 2 * inv * t * control.x + t * t * b.x,
    y: inv * inv * a.y + 2 * inv * t * control.y + t * t * b.y,
  };
};

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

/* -------------------------------------------------------------------------- engine */

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
  let veil: Surface | null = null;
  let veilKeyValue = "";
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
   * the reduced-motion frame all come out identical to phase 4's composition.
   */
  let pointerEase = 0; // 0..1, 90 ms follow — how much the pointer is influencing the field
  let hoverTile = -1; // index of the stat tile under the pointer, -1 for none
  let headlineHover = false;
  const surges: { x: number; y: number; at: number; seed: number }[] = [];
  let surgeLife = 0; // ms since the most recent surge started

  /** The drafting plate is rasterised once per geometry/theme and blitted thereafter. */
  let plate: Surface | null = null;
  let plateKey = "";
  let grainDots: Float32Array | null = null;
  const createSurface = options.createSurface ?? null;

  const strandBufs = BANDS.map(() => new Float32Array((STRAND_STEPS + 1) * 2));
  /** the incident beam's own scratch buffer: no allocation inside the loop */
  const beamBuf = new Float32Array((36 + 1) * 2);
  /** one dendritic branch's vertices, reused for all 21 branches every frame */
  const branchBuf = new Float32Array((BRANCH_STEPS + 1) * 2);
  /** jitter changes on a 24 fps bucket, not every frame: deliberate, not noisy */
  let jitterBucket = -1;
  let jitterFrame = 0;

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
    const { heroW, heroH, container, thesisLine, copyRight } = layout;
    const mobile = heroW < 768;

    const prismSize = mobile
      ? clamp(Math.min(heroW, heroH) * 0.24, 68, 100)
      : clamp(Math.min(heroW, heroH) * 0.3, 96, 190);

    const cx = mobile ? heroW * 0.78 : container.right - prismSize * PRISM_OFFSET;
    const cy = mobile ? heroH * 0.13 : heroH * 0.47;

    const topV: Vec = { x: cx, y: cy - prismSize * 0.88 };
    const leftV: Vec = { x: cx - prismSize * 0.52, y: cy + prismSize * 0.58 };
    const rightV: Vec = { x: cx + prismSize * 0.52, y: cy + prismSize * 0.58 };

    // Entry and exit are parametric points on the facets, never free-floating offsets.
    const hit = onFacet(topV, leftV, mobile ? 0.34 : 0.3);
    const exit = onFacet(topV, rightV, 0.52);

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

    // Fan targets sit off the right edge and stay in angular order: no crossings. The spread
    // is the whole hero, not a wedge beside the copy — the fan has to leave the top edge and
    // the bottom edge so the light occupies the section rather than decorating one side.
    const yTop = mobile ? -0.08 * heroH : -0.06 * heroH;
    const yBottom = mobile ? 0.62 * heroH : 1.08 * heroH;
    const targets = BANDS.map((_, i) => ({
      x: heroW + 80,
      y: lerp(yTop, yBottom, i / (BANDS.length - 1)),
    }));

    const normals: Vec[] = [];
    const spans: number[] = [];
    for (const target of targets) {
      const dx = (target.x - exit.x) * OVERSHOOT;
      const dy = (target.y - exit.y) * OVERSHOOT;
      const len = Math.hypot(dx, dy) || 1;
      normals.push({ x: -dy / len, y: dx / len });
      spans.push(len);
    }

    // --- the reflected ray --------------------------------------------------------------
    // A prism does not only refract: part of the beam reflects. That reflection is what
    // carries the light into the quiet half of the hero — it runs the gutter between the copy
    // and the catalogue, and every stat tile taps off it. Physically honest, and it is the
    // reason the field occupies the whole section instead of one side of it.
    const firstTextTop = Math.min(...layout.textRects.map((r) => r.top), heroH * 0.2);
    const copyBottom = Math.max(...layout.textRects.map((r) => r.bottom), heroH * 0.5);
    const tilesTop = layout.tiles.length
      ? Math.min(...layout.tiles.map((t) => t.top))
      : heroH * 0.86;
    const gutterY = Math.min(
      tilesTop - Math.max(16, heroH * 0.03),
      Math.max(copyBottom + 22, (copyBottom + tilesTop) / 2),
    );
    // The specular exit: light leaving through the apex facet, drawn up and left across the
    // top margin. Faint by nature — it is the least of the three exits — but it is what keeps
    // the upper-left of the page from being dead paper.
    //
    // On portrait screens the copy is full-width, so there is only one corridor: the strip
    // above the headline. The apex ray takes it, which is what keeps the top of a phone hero
    // from being empty paper, and the reflection gives up on crossing the page.
    const stripBottom = Math.max(14, firstTextTop - 12);
    // Same corridor logic as the reflection: rise past the copy's right edge first, then run
    // the top margin. A single curve would clip the headline's box on its way left.
    const specularWaypoints: Vec[] = mobile
      ? [topV, { x: heroW * 0.45, y: 8 }, { x: -20, y: stripBottom }]
      : [
          topV,
          { x: container.right + 8, y: topV.y - 56 },
          { x: container.right - 30, y: Math.max(14, firstTextTop * 0.24) },
          { x: container.left - 60, y: Math.max(12, firstTextTop * 0.34) },
        ];
    const specular = { waypoints: specularWaypoints, sample: buildPath(specularWaypoints) };

    // Two segments, not one: from the facet the ray must fall *past* the copy's right edge
    // before it may turn left under it. A single curve cuts the lede's corner, which the
    // invariant check catches — so the corridor is walked in order: down, then across.
    const reflectionWaypoints: Vec[] = mobile
      ? // Portrait: the corner is the only room left. A short reflected flare, off the frame.
        [hit, { x: heroW * 0.95, y: 34 }, { x: heroW + 26, y: 16 }]
      : [
          hit,
          { x: layout.copyRight + 44, y: (hit.y + gutterY) / 2 },
          { x: layout.copyRight + 26, y: gutterY - 18 },
          { x: container.left - 34, y: gutterY },
        ];
    const reflection = {
      waypoints: reflectionWaypoints,
      sample: buildPath(reflectionWaypoints),
      gutterY,
    };

    // --- grounding filaments ----------------------------------------------------------
    // Each tile taps the reflected ray directly above its own centre: a stub, not a leader
    // line, so nothing crosses the layout to reach a tile.
    const grounds: { from: Vec; to: Vec; band: number }[] = [];
    for (const tile of layout.tiles) {
      if (mobile) {
        // Portrait: a stub rising out of the tile into the gap above the catalogue.
        const reach = Math.min(44, Math.max(24, tile.top - copyBottom - 8));
        const lean = tile.cx < heroW * 0.5 ? -0.5 : 0.5;
        grounds.push({
          from: { x: tile.cx + lean * 10, y: tile.top - 6 - reach },
          to: { x: tile.cx, y: tile.top - 6 },
          band: tile.cx < heroW * 0.5 ? 2 : 4,
        });
        continue;
      }
      // Nearest point on the reflected path, sampled segment by segment.
      let best = { x: tile.cx, y: reflection.gutterY };
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let k = 0; k <= 60; k++) {
        const point = reflection.sample(k / 60);
        const d = Math.abs(point.x - tile.cx);
        if (d < bestDistance) {
          bestDistance = d;
          best = point;
        }
      }
      const band = clamp(Math.round((best.y / heroH + 1) * 3), 0, BANDS.length - 1);
      grounds.push({
        from: best,
        to: { x: tile.cx, y: tile.top - 6 },
        band,
      });
    }

    geo = {
      heroW,
      heroH,
      mobile,
      prismSize,
      topV,
      leftV,
      rightV,
      hit,
      exit,
      source,
      entryMode,
      targets,
      normals,
      spans,
      reflection,
      specular,
      grounds,
    };
    version += 1;
  };

  /* -------------------------------------------------------------- strand maths */

  /**
   * Fill one band's point buffer.
   *
   * off(s) = (A·sin(2πf·s − ωt + φ) + 0.26A·sin(2π·2.3f·s + 1.35ωt)) · E(s)
   * P(s)   = P_exit + s·(T − P_exit) + off(s)·n̂
   *
   * E(0) = E(1) = 0 exactly, so the root is welded to the core and the tip stays on its
   * lane. Phase scatter is small (φ = k·0.55) or the fan stops reading as dispersion.
   */
  const fillStrand = (buf: Float32Array, band: BandSpec, index: number) => {
    if (!geo) return;
    const { exit, targets } = geo;
    const target = targets[index];
    // Overshoot the lane end by a few percent so ribbon tips die off-canvas, never inside it.
    const reach = OVERSHOOT;
    const dx = (target.x - exit.x) * reach;
    const dy = (target.y - exit.y) * reach;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const amp = band.amplitude * (1 + surgeEnergy * 0.35);
    const omega = time * TAU * band.hz;
    const phase = index * 0.55;

    for (let i = 0; i <= STRAND_STEPS; i++) {
      const s = i / STRAND_STEPS;
      const env = Math.pow(Math.sin(Math.PI * s), 0.9);

      // Ripples grow with distance (the core is dense, the frame edges are calm), and only
      // the upper bands carry real travel — lower bands keep just enough to read as motion.
      const scale = amp * (0.55 + 0.45 * band.plasma) * Math.pow(s, 0.35);

      let off =
        (Math.sin(TAU * band.cycles * s - omega + phase) * scale +
          Math.sin(TAU * 2.3 * band.cycles * s + omega * 1.35) * scale * 0.26) *
        env;

      // Magnetic lean toward the pointer: ≤10 px, strongest mid-span, never at the root. The
      // radius is deliberately generous (250 px): at 170 px only the root end of a ribbon came
      // within reach, where the envelope is ~0, so the whole effect measured 1.7 px — legal
      // under the spec and invisible on screen.
      if (pointerActive) {
        const bx = exit.x + dx * s;
        const by = exit.y + dy * s;
        const d = Math.hypot(leanX - bx, leanY - by);
        if (d < 250) {
          const pull = Math.pow(1 - d / 250, 1.6) * 10;
          const side = Math.sign((leanX - bx) * nx + (leanY - by) * ny) || 1;
          off += pull * side * env;
        }
      }

      buf[i * 2] = exit.x + dx * s + nx * off;
      buf[i * 2 + 1] = exit.y + dy * s + ny * off;
    }
  };

  const trace = (ctx: Ctx, buf: Float32Array) => {
    ctx.beginPath();
    ctx.moveTo(buf[0], buf[1]);
    for (let i = 1; i <= STRAND_STEPS; i++) ctx.lineTo(buf[i * 2], buf[i * 2 + 1]);
  };

  /* -------------------------------------------------------------------- caches */

  let cacheKey = "";
  let cacheCtx: Ctx | null = null;
  let ribbonGrads: Gradient[] = [];
  let beamGrad: Gradient | null = null;
  let glassGrad: Gradient | null = null;

  const ensureCaches = (ctx: Ctx) => {
    if (!geo) return;
    const key = `${version}:${isDark ? "dark" : "light"}`;
    if (key === cacheKey && ctx === cacheCtx && beamGrad && glassGrad) return;

    const { exit, targets, topV, rightV } = geo;

    ribbonGrads = BANDS.map((band, i) => {
      const target = targets[i];
      const body = isDark ? band.dark : band.light;
      const ribbonAlpha = band.ribbonAlpha * (isDark ? 1.2 : 1.25);
      const g = ctx.createLinearGradient(exit.x, exit.y, target.x, target.y);
      g.addColorStop(0, rgba(body, 0));
      g.addColorStop(0.06, rgba(body, ribbonAlpha * 0.5));
      g.addColorStop(0.42, rgba(body, ribbonAlpha));
      g.addColorStop(1, rgba(body, ribbonAlpha * 0.9));
      return g;
    });

    // The beam warms as it travels: it starts as ink on paper, arrives as light.
    const { source, hit } = geo;
    const b = ctx.createLinearGradient(source.x, source.y, hit.x, hit.y);
    b.addColorStop(0, rgba(isDark ? BANDS[2].dark : BANDS[2].light, 0));
    b.addColorStop(0.2, rgba(isDark ? BANDS[2].dark : BANDS[2].light, isDark ? 0.3 : 0.24));
    b.addColorStop(0.78, rgba(isDark ? BANDS[2].dark : BANDS[2].light, isDark ? 0.62 : 0.52));
    b.addColorStop(1, rgba(isDark ? PAPER : INK, isDark ? 0.55 : 0.32));
    beamGrad = b;

    // Glass shell stays white-only: any warm stop in the shell reads as beige paper.
    const glass = ctx.createLinearGradient(topV.x, topV.y, rightV.x, rightV.y);
    if (isDark) {
      glass.addColorStop(0, "rgba(255,255,255,0.085)");
      glass.addColorStop(0.62, "rgba(255,255,255,0.03)");
      glass.addColorStop(1, "rgba(255,255,255,0.015)");
    } else {
      glass.addColorStop(0, "rgba(255,255,255,0.86)");
      glass.addColorStop(0.55, "rgba(255,255,255,0.6)");
      glass.addColorStop(1, "rgba(255,255,255,0.44)");
    }
    glassGrad = glass;

    cacheKey = key;
    cacheCtx = ctx;
  };

  /* -------------------------------------------------------------------- layers */

  /**
   * Layer 0 — the dissolve.
   *
   * This replaces the two veil divs. A veil hides the field behind a gradient, which is why it
   * produced a seam: the page and the drawing sat on two planes. A dissolve instead thins the
   * light where the words are and lets paper show through, so lines pass *behind* type, fade,
   * and resume — one plane, no edge, no legibility cost.
   *
   * Three passes, applied to the body and plasma layers only (plate, glass, core and filaments
   * stay at full strength):
   *
   *   1. the type's ink extent at a clean 0.16 — this is a halo, not a box;
   *   2. a blurred clip over each quiet rect at 0.45, so nothing bright runs under a word;
   *   3. a radial paper lift centred on the copy block, peaking at 0.35.
   *
   * The result is measured, not eyeballed: `tools/hero-contrast.mjs` reads the rendered pixels
   * and reports the contrast of the real words against what is actually behind them.
   */
  const drawDissolve = (ctx: Ctx) => {
    if (!geo || !layout) return;
    const { heroW, heroH } = geo;
    const paper = isDark ? INK : PAPER;
    const rects = layout.ledger.quietRects;
    if (rects.length === 0) return;

    // 3. The lift first, so the ink halo below it stays legible.
    const copyCenter = copyCenterOf();
    const radius = 0.55 * Math.max(heroW, heroH);
    const lift = ctx.createRadialGradient(
      copyCenter.x,
      copyCenter.y,
      0,
      copyCenter.x,
      copyCenter.y,
      radius,
    );
    lift.addColorStop(0, rgba(paper, 0.35));
    lift.addColorStop(0.45, rgba(paper, 0.16));
    lift.addColorStop(1, rgba(paper, 0));
    ctx.fillStyle = lift;
    ctx.fillRect(0, 0, heroW, heroH);

    // 2. Per-rect radial stencils. A blurred rectangle still reads as a rectangle once the
    //    field behind it has any structure; a radial has no edge at all, so this pass can be
    //    generous without ever drawing a box around the copy.
    for (const rect of rects) {
      const cx = (rect.left + rect.right) / 2;
      const cy = (rect.top + rect.bottom) / 2;
      const halfW = (rect.right - rect.left) / 2;
      const halfH = (rect.bottom - rect.top) / 2;
      const radius = Math.hypot(halfW, halfH) * 1.18;
      const stencil = ctx.createRadialGradient(cx, cy, radius * 0.42, cx, cy, radius);
      stencil.addColorStop(0, rgba(paper, 0.5));
      stencil.addColorStop(0.62, rgba(paper, 0.26));
      stencil.addColorStop(1, rgba(paper, 0));
      ctx.fillStyle = stencil;
      ctx.fillRect(
        rect.left - radius,
        rect.top - radius,
        radius * 2 + (rect.right - rect.left),
        radius * 2 + (rect.bottom - rect.top),
      );
    }

    // 1. The halo: the type's own ink extent, at a weight that reads as paper, not as a patch.
    ctx.fillStyle = rgba(paper, 0.1);
    for (const rect of rects) {
      ctx.fillRect(
        rect.left + 6,
        rect.top + 6,
        rect.right - rect.left - 12,
        rect.bottom - rect.top - 12,
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
   * Layer 1 — the drafting plate.
   *
   * Column rules, crop marks, baseline ticks, the caustic ellipse under the glass, grain and
   * a corner vignette. It never changes between frames, so it is rasterised once per
   * geometry/theme into an offscreen surface and blitted — the §8 rule, and the difference
   * between a plate that costs nothing and one that costs twenty strokes a frame.
   *
   * Without a surface factory (a bare node harness) it draws straight to the target, which is
   * only ever used for stills.
   */
  const paintPlate = (ctx: Ctx) => {
    if (!geo || !layout) return;
    const { heroW, heroH, prismSize, exit } = geo;
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

    // Caustic ellipse under the glass: the light that did not leave the prism.
    ctx.strokeStyle = rule(isDark ? 0.1 : 0.07);
    ctx.beginPath();
    if (ctx.ellipse) {
      ctx.ellipse(
        exit.x - prismSize * 0.1,
        exit.y + prismSize * 0.72,
        prismSize * 0.86,
        prismSize * 0.16,
        0,
        0,
        TAU,
      );
    } else {
      ctx.arc(exit.x, exit.y + prismSize * 0.72, prismSize * 0.5, 0, TAU);
    }
    ctx.stroke();

    // Grain: 2.5% static dots. Generated once, reused forever.
    if (!grainDots) {
      const count = Math.round((heroW * heroH) / 9000);
      grainDots = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        grainDots[i * 3] = hash(i * 7 + 1, 11) * heroW;
        grainDots[i * 3 + 1] = hash(i * 13 + 5, 23) * heroH;
        grainDots[i * 3 + 2] = 0.014 + hash(i * 17 + 3, 37) * 0.018;
      }
    }
    for (let i = 0; i < grainDots.length; i += 3) {
      ctx.fillStyle = rule(grainDots[i + 2] * (isDark ? 1.6 : 1));
      ctx.fillRect(grainDots[i], grainDots[i + 1], 1, 1);
    }

    // No vignette, no border: §0 forbids an edge around the field. What keeps the plate from
    // reading as a box is that every mark in it is derived from the layout, not from the frame.
    void heroW;
    void heroH;
  };

  /**
   * The plate has no mask of its own — it is a raster — so the dissolve under the copy is
   * painted *into* the plate at build time: same quiet rects, same radial falloff. That closes
   * phase 4's known gap (column rules and crop marks crossing the headline at 4% ink) without
   * paying for it in the frame loop.
   */
  const dissolvePlate = (ctx: Ctx) => {
    if (!layout || !geo) return;
    // The copy column never moves without a layout change, so the veil is only stale when the
    // version or the theme changes — not on every viewport step of a drag. Building five
    // full-height radial gradients per resize is what turns a cheap resize into a 70 ms frame.
    const veilKey = `${version}:${isDark ? "dark" : "light"}`;
    if (!veil || veilKey !== veilKeyValue) {
      const surface = createSurface
        ? createSurface(Math.ceil(geo.heroW), Math.ceil(geo.heroH))
        : null;
      if (surface) {
        const vctx = surface.ctx;
        const paper = isDark ? INK : PAPER;
        vctx.clearRect(0, 0, geo.heroW, geo.heroH);
        for (const rect of layout.ledger.quietRects) {
          const cx = (rect.left + rect.right) / 2;
          const cy = (rect.top + rect.bottom) / 2;
          const halfW = (rect.right - rect.left) / 2;
          const halfH = (rect.bottom - rect.top) / 2;
          const radius = Math.hypot(halfW, halfH) * 1.12;
          const stencil = vctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
          stencil.addColorStop(0, rgba(paper, 1));
          stencil.addColorStop(0.7, rgba(paper, 0.9));
          stencil.addColorStop(1, rgba(paper, 0));
          vctx.fillStyle = stencil;
          vctx.fillRect(
            rect.left - radius,
            rect.top - radius,
            radius * 2 + (rect.right - rect.left),
            radius * 2 + (rect.bottom - rect.top),
          );
        }
        veil = surface;
        veilKeyValue = veilKey;
      }
    }
    const blit = veil?.image ?? veil?.ctx;
    if (veil && blit) ctx.drawImage?.(blit, 0, 0);
  };

  /** Blit the cached plate, rebuilding it only when geometry or theme changes. */
  const drawPlate = (ctx: Ctx) => {
    if (!geo) return;
    const key = `${version}:${isDark ? "dark" : "light"}`;

    if (createSurface) {
      if (!plate || plateKey !== key) {
        const surface = createSurface(Math.ceil(geo.heroW), Math.ceil(geo.heroH));
        if (surface) {
          const previous = plate;
          plate = surface;
          paintPlate(surface.ctx);
          dissolvePlate(surface.ctx);
          plateKey = key;
          void previous;
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
   * the rest to 0.45 (§7). At rest every band returns 1, so the still never changes.
   */
  const bandVoice = (index: number) => {
    if (hoverTile < 0) return 1;
    const ground = geo?.grounds[hoverTile];
    if (!ground) return 1;
    // The chosen band doesn't merely hold still while the rest fade: it gains weight, which
    // is what makes the coupling legible at the far end of a 1400 px fan.
    return ground.band === index ? 1.45 : TILE_DIM;
  };

  /** Layer 2 — spectral body: seven tapered ribbons, one gradient each. */
  const drawRibbons = (ctx: Ctx, layer: "fan" | "bend" = "fan") => {
    if (!geo) return;
    const { targets, exit } = geo;

    for (let i = 0; i < BANDS.length; i++) {
      const band = BANDS[i];
      const buf = strandBufs[i];
      const target = targets[i];
      const dx = (target.x - exit.x) * OVERSHOOT;
      const dy = (target.y - exit.y) * OVERSHOOT;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const maxHalf =
        (layer === "bend" ? band.ribbon * 0.55 : band.ribbon) * (1 + surgeEnergy * 0.22);

      ctx.globalAlpha = (layer === "bend" ? 0.62 : 1) * bandVoice(i);
      ctx.fillStyle = ribbonGrads[i] ?? rgba(isDark ? band.dark : band.light, band.ribbonAlpha);
      ctx.beginPath();
      for (let j = 0; j <= STRAND_STEPS; j++) {
        const t = j / STRAND_STEPS;
        const half = 0.4 + Math.pow(t, 1.3) * maxHalf;
        const x = buf[j * 2] + nx * half;
        const y = buf[j * 2 + 1] + ny * half;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let j = STRAND_STEPS; j >= 0; j--) {
        const t = j / STRAND_STEPS;
        const half = 0.4 + Math.pow(t, 1.3) * maxHalf;
        ctx.lineTo(buf[j * 2] - nx * half, buf[j * 2 + 1] - ny * half);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /** Spine pass: thin, bright centre lines that give the ribbons an edge of light. */
  const drawSpines = (ctx: Ctx) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < BANDS.length; i++) {
      const band = BANDS[i];
      const colour = isDark ? band.dark : band.light;
      const alpha =
        (isDark ? band.darkAlpha : band.lightAlpha) * (1 + surgeEnergy * 0.25) * bandVoice(i);
      const stroke = rgba(colour, 1);

      trace(ctx, strandBufs[i]);

      ctx.strokeStyle = stroke;
      ctx.globalAlpha = alpha * (band.flagship ? 0.1 : 0.07);
      ctx.lineWidth = band.width * 5.2;
      ctx.stroke();

      ctx.globalAlpha = alpha * (isDark ? 1 : 0.9);
      ctx.lineWidth = band.width;
      ctx.stroke();

      if (band.flagship) {
        // A white-hot filament down the clay band only: the dispersion's centre of energy.
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = isDark ? "rgba(255,252,246,0.9)" : "rgba(255,255,255,0.62)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  /**
   * Layer 3 — Tesla plasma, braided over each band.
   *
   * A discharge is angular: current takes the shortest path between strike points, so the
   * channel is a polyline through a handful of anchors with a large lateral offset and only
   * a pixel of micro-jitter — not a smooth sine displaced sideways (that reads as a fuzzy
   * twin of the ribbon, which is what v1 of this pass looked like).
   *
   * Per band: three stroke passes (ionised haze → coloured channel → white-hot core), three
   * discharge knots, and three dendritic forks, one level deep. Jitter is quantised to a
   * 24 fps bucket so the crackle snaps instead of shimmering, and every value comes from a
   * hash: no allocation and no Math.random inside a frame.
   */
  const drawPlasma = (ctx: Ctx) => {
    if (!geo) return;
    const { exit } = geo;
    const frame = jitterFrame;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < BANDS.length; i++) {
      const band = BANDS[i];
      const buf = strandBufs[i];
      const lane = geo.spans[i];
      const nrm = geo.normals[i];
      const colour = isDark ? band.dark : band.light;
      const weight = band.plasma * (isDark ? 0.95 : 0.86) * (1 + surgeEnergy * 0.3) * bandVoice(i);
      const base = (isDark ? band.darkAlpha : band.lightAlpha) * weight;
      // Offset anchors must never throw the strike into a neighbouring lane.
      const strikeAmp = clamp(lane * 0.035, 5, 15);

      // --- anchors: sparse, so the segments between them are straight and angular
      ctx.beginPath();
      let prevX = buf[0];
      let prevY = buf[1];
      ctx.moveTo(prevX, prevY);
      for (let k = 1; k <= STRIKE_ANCHORS; k++) {
        const s = k / STRIKE_ANCHORS;
        const at = Math.round(s * STRAND_STEPS);
        const env = Math.pow(Math.sin(Math.PI * s), 0.9);
        // The same three-quarter pull the ribbon uses, so the strike tracks its band.
        const offset =
          (hash(i * 97 + k * 31 + 7, frame) - 0.5) * 2 * strikeAmp * Math.pow(s, 0.45) * env;
        const x = buf[at * 2] + nrm.x * offset;
        const y = buf[at * 2 + 1] + nrm.y * offset;
        // Micro-jitter on the corner itself: the crackle, not the shape.
        const jx = (hash(i * 41 + k * 17 + 3, frame) - 0.5) * 1.6;
        ctx.lineTo(x + nrm.x * jx, y + nrm.y * jx);
        prevX = x;
        prevY = y;
      }
      void prevX;
      void prevY;

      // ionised haze: wide, faint, coloured
      ctx.strokeStyle = rgba(colour, 1);
      ctx.globalAlpha = clamp(base * (isDark ? 0.16 : 0.24), 0, 1);
      ctx.lineWidth = isDark ? 7 : 6;
      ctx.stroke();

      // the channel proper
      ctx.globalAlpha = clamp(base * 0.72, 0, 1);
      ctx.lineWidth = isDark ? 1.9 : 1.7;
      ctx.stroke();

      // Hot core. On ink it is white-hot; on paper a white core would vanish into the cream,
      // so light theme drops to a saturated filament instead — the same read, inverted.
      ctx.strokeStyle = isDark ? "rgba(255,252,246,0.95)" : rgba(mix(colour, INK, 0.42), 1);
      ctx.globalAlpha = clamp(base * (isDark ? 0.55 : 0.5), 0, 1);
      ctx.lineWidth = 0.85;
      ctx.stroke();

      // --- discharge knots: where the current pools, the channel brightens
      ctx.fillStyle = isDark ? "rgba(255,252,246,0.9)" : rgba(mix(colour, INK, 0.45), 1);
      for (let k = 1; k < STRIKE_ANCHORS; k += 3) {
        const s = k / STRIKE_ANCHORS;
        if (s * lane < BRANCH_MIN_DIST) continue;
        const at = Math.round(s * STRAND_STEPS);
        const env = Math.pow(Math.sin(Math.PI * s), 0.9);
        const offset =
          (hash(i * 97 + k * 31 + 7, frame) - 0.5) * 2 * strikeAmp * Math.pow(s, 0.45) * env;
        const x = buf[at * 2] + nrm.x * offset;
        const y = buf[at * 2 + 1] + nrm.y * offset;
        if (x > geo.heroW * BRANCH_MAX_X) continue;
        ctx.globalAlpha = clamp(base * 0.8, 0, 1);
        ctx.beginPath();
        ctx.arc(x, y, 1.15, 0, TAU);
        ctx.fill();
      }

      // --- dendrites: one fork per site, one level deep, tapering to nothing at the tip.
      // Coloured at the root, white only at the hot end: a grey branch reads as a scratch.
      for (let b = 0; b < BRANCH_AT.length; b++) {
        // Per-band offset so all seven strands don't fork at the same three stations.
        const offset = (hash(i * 19 + b * 7 + 3, 0) - 0.5) * 0.06;
        const sPos = BRANCH_AT[b] + offset;
        const at = Math.round(sPos * STRAND_STEPS);
        const rootX = buf[at * 2];
        const rootY = buf[at * 2 + 1];
        // Density is already deliberate near the core, and nothing crackles over the type.
        if (dist({ x: rootX, y: rootY }, exit) < BRANCH_MIN_DIST) continue;
        if (rootX > geo.heroW * BRANCH_MAX_X) continue;

        const seed = hash(i * 131 + b * 37 + 17, frame);
        // A fork stays inside its own band: reach is capped by the lane's half-width budget.
        const reach = Math.min(lane * BRANCH_LEN[b] * (0.82 + seed * 0.36), STRIKE_REACH_MAX);
        const sway = (hash(i * 61 + b * 23 + 5, frame) - 0.5) * 0.9;
        const side = ((i + b) % 2 === 0 ? 1 : -1) * (0.6 + seed * 0.3);
        const angle = Math.atan2(nrm.y, nrm.x) + side;
        const dx = Math.cos(angle) * reach;
        const dy = Math.sin(angle) * reach;
        const wobAmp = reach * 0.22;

        // Trace once into the scratch buffer; stroke it in tapering runs.
        for (let k = 0; k <= BRANCH_STEPS; k++) {
          const t = k / BRANCH_STEPS;
          // A streamer bends: the wander grows toward the tip, never at the root.
          const wander = (hash(i * 17 + b * 71 + k * 11, frame) - 0.5) * wobAmp * t * t;
          const bend = sway * reach * t * t * 0.35;
          branchBuf[k * 2] = rootX + dx * t - dy * (wander / reach) - dy * (bend / reach);
          branchBuf[k * 2 + 1] = rootY + dy * t + dx * (wander / reach) + dx * (bend / reach);
        }

        let runStart = 0;
        for (let run = 0; run < BRANCH_RUNS.length; run++) {
          const runEnd = runStart + Math.round(BRANCH_RUNS[run] * BRANCH_STEPS);
          const fade = 1 - run / BRANCH_RUNS.length;
          ctx.beginPath();
          ctx.moveTo(branchBuf[runStart * 2], branchBuf[runStart * 2 + 1]);
          for (let k = runStart + 1; k <= Math.min(runEnd, BRANCH_STEPS); k++) {
            ctx.lineTo(branchBuf[k * 2], branchBuf[k * 2 + 1]);
          }
          const isTip = run === BRANCH_RUNS.length - 1;
          ctx.strokeStyle = isTip
            ? isDark
              ? "rgba(255,252,246,0.95)"
              : rgba(mix(colour, INK, 0.4), 1)
            : rgba(colour, 1);
          ctx.globalAlpha = clamp(base * (isTip ? 0.5 : 0.66) * fade, 0, 1);
          ctx.lineWidth = isTip ? 0.55 : 1.35 * (1 - run * 0.22);
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
    const amp = 2.6 * (1 + surgeEnergy * 0.4);
    const overshoot = 6;

    const point = (s: number, buf: Float32Array, offset: number): void => {
      const env = Math.sin(Math.PI * s);
      const wobble =
        (Math.sin(s * 2.4 * Math.PI - time * 1.5) + Math.sin(s * 4.9 * Math.PI + time) * 0.22) *
        amp *
        env;
      buf[offset] = source.x + dx * (s + (overshoot / len) * s) + nx * wobble;
      buf[offset + 1] = source.y + dy * (s + (overshoot / len) * s) + ny * wobble;
    };

    const buf = beamBuf;
    for (let i = 0; i <= steps; i++) point(i / steps, buf, i * 2);

    ctx.strokeStyle = beamGrad;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(buf[0], buf[1]);
    for (let i = 1; i <= steps; i++) ctx.lineTo(buf[i * 2], buf[i * 2 + 1]);

    const beamBoost = headlineHover ? 1.3 : 1;
    ctx.globalAlpha = Math.min(1, 0.2 * beamBoost);
    ctx.lineWidth = 6.5;
    ctx.stroke();

    ctx.globalAlpha = Math.min(1, 0.85 * beamBoost);
    ctx.lineWidth = 1.2 * (headlineHover ? 1.2 : 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  /**
   * The reflected ray — the field's other half.
   *
   * Part of the beam never refracts; it reflects, and the reflection is what carries light to
   * the quiet side of the hero. It leaves the facet, falls past the copy's right edge, then
   * runs the gutter above the catalogue and off the left edge, so the field reads as full-bleed
   * without ever crossing a word. Every stat tile taps off it.
   */
  const drawReflection = (ctx: Ctx) => {
    if (!geo) return;
    const { reflection } = geo;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;
    const baseAlpha = isDark ? 0.52 : 0.38;
    const STEPS = 90;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Same gradient language as the beam: hot at the glass, cooling as it travels.
    const gradient = ctx.createLinearGradient(
      reflection.waypoints[0].x,
      reflection.waypoints[0].y,
      reflection.waypoints[reflection.waypoints.length - 1].x,
      reflection.waypoints[reflection.waypoints.length - 1].y,
    );
    gradient.addColorStop(0, rgba(warm, 1));
    gradient.addColorStop(0.45, rgba(warm, 0.72));
    gradient.addColorStop(1, rgba(warm, 0.2));

    const tracePath = () => {
      ctx.beginPath();
      let first = true;
      for (let k = 0; k <= STEPS; k++) {
        const u = k / STEPS;
        const point = reflection.sample(u);
        // Photon-level wobble: zero at both ends so the joins stay welded.
        const wobble = Math.sin(TAU * 2.1 * u - time * 1.2) * 1.7 * Math.sin(Math.PI * u);
        if (first) {
          ctx.moveTo(point.x, point.y + wobble);
          first = false;
        } else {
          ctx.lineTo(point.x, point.y + wobble);
        }
      }
    };

    for (const pass of [
      { width: 6, alpha: baseAlpha * 0.22 },
      { width: 1.15, alpha: baseAlpha },
      { width: 0.55, alpha: baseAlpha * 0.55 },
    ]) {
      tracePath();
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = clamp(pass.alpha * (1 + surgeEnergy * 0.3), 0, 1);
      ctx.lineWidth = pass.width;
      ctx.stroke();
    }

    // The apex exit: same construction, a third of the weight, thinning as it crosses.
    const spec = geo.specular;
    const specGradient = ctx.createLinearGradient(
      spec.waypoints[0].x,
      spec.waypoints[0].y,
      spec.waypoints[spec.waypoints.length - 1].x,
      spec.waypoints[spec.waypoints.length - 1].y,
    );
    specGradient.addColorStop(0, rgba(warm, 1));
    specGradient.addColorStop(1, rgba(warm, 0.15));

    for (const pass of [
      { width: 4, alpha: baseAlpha * 0.14 },
      { width: 0.85, alpha: baseAlpha * 0.66 },
    ]) {
      ctx.beginPath();
      let first = true;
      for (let k = 0; k <= STEPS; k++) {
        const u = k / STEPS;
        const point = spec.sample(u);
        const wobble = Math.sin(TAU * 1.7 * u + time * 0.9) * 1.5 * Math.sin(Math.PI * u);
        if (first) {
          ctx.moveTo(point.x, point.y + wobble);
          first = false;
        } else {
          ctx.lineTo(point.x, point.y + wobble);
        }
      }
      ctx.strokeStyle = specGradient;
      ctx.globalAlpha = clamp(pass.alpha, 0, 1);
      ctx.lineWidth = pass.width;
      ctx.stroke();
    }

    // The tap points glow: where the reflection feeds a tile, the ray brightens.
    for (const ground of geo.grounds) {
      const spec2 = BANDS[ground.band];
      const colour = isDark ? spec2.dark : spec2.light;
      ctx.globalAlpha = isDark ? 0.5 : 0.36;
      ctx.fillStyle = rgba(colour, 1);
      ctx.beginPath();
      ctx.arc(ground.from.x, ground.from.y, 1.2, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  /** Layer 5 — grounding filaments: the fan is reasoned onto the catalogue, one per tile. */
  const drawGrounds = (ctx: Ctx) => {
    if (!geo) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const [index, ground] of geo.grounds.entries()) {
      const hovered = hoverTile === index;
      const band = BANDS[ground.band];
      const colour = isDark ? band.dark : band.light;
      const alpha =
        (isDark ? band.darkAlpha : band.lightAlpha) *
        (isDark ? 0.5 : 0.42) *
        (hoverTile < 0 ? 1 : hovered ? 3 : 0.26);
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
        const bow = Math.sin(t * Math.PI * 1.15) * 9 * env;
        const jitter = (hash(ground.band * 31 + k * 7, jitterFrame) - 0.5) * 0.9 * env;
        const x = from.x + dx * t + nx * (bow + jitter);
        const y = from.y + dy * t + ny * (bow + jitter);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = rgba(colour, 1);
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // The hovered tile gets a landing bloom above its panel edge, where the tile's own
      // 90%-opaque surface can't swallow it: without this the "light on that tile" half of
      // the coupling is invisible under the card.
      if (hovered && hoverTile >= 0) {
        const bloom = ctx.createRadialGradient(to.x, to.y, 0, to.x, to.y, 38);
        bloom.addColorStop(0, rgba(colour, 0.34));
        bloom.addColorStop(0.45, rgba(colour, 0.16));
        bloom.addColorStop(1, rgba(colour, 0));
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(to.x, to.y, 38, 0, TAU);
        ctx.fill();
      }

      // Terminal node where the light lands on the tile: a bright point and a faint ring, so
      // the eye can follow the fan all the way into the catalogue.
      ctx.globalAlpha = Math.min(1, alpha * 1.9);
      ctx.fillStyle = rgba(colour, 1);
      ctx.beginPath();
      ctx.arc(to.x, to.y, 1.7, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.75;
      ctx.strokeStyle = rgba(colour, 1);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(to.x, to.y, 4.6, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  /** Layer 4 — the glass. White-only shell, ink edge, internal chords, caustic pooling. */
  const drawGlass = (ctx: Ctx) => {
    if (!geo) return;
    const { topV, leftV, rightV, hit, exit, prismSize } = geo;

    // Body: light-collecting glass, not a wireframe. On paper the shell is brighter than the
    // page and its lower facets are cooler; the warmth stays in the caustics below.
    const body = ctx.createLinearGradient(topV.x, topV.y, leftV.x, leftV.y);
    if (isDark) {
      body.addColorStop(0, "rgba(255,255,255,0.13)");
      body.addColorStop(0.55, "rgba(255,255,255,0.055)");
      body.addColorStop(1, "rgba(255,255,255,0.035)");
    } else {
      body.addColorStop(0, "rgba(255,255,255,0.9)");
      body.addColorStop(0.55, "rgba(255,255,255,0.66)");
      body.addColorStop(1, "rgba(255,255,255,0.5)");
    }
    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y);
    ctx.lineTo(leftV.x, leftV.y);
    ctx.lineTo(rightV.x, rightV.y);
    ctx.closePath();
    ctx.fillStyle = glassGrad ?? body;
    ctx.fill();

    // Thickness: a smaller inset triangle reads as the far wall of the glass.
    const inset = ctx.createLinearGradient(topV.x, topV.y, rightV.x, rightV.y);
    inset.addColorStop(0, isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.75)");
    inset.addColorStop(1, isDark ? "rgba(255,255,255,0.012)" : "rgba(255,255,255,0.3)");
    ctx.beginPath();
    ctx.moveTo(lerp(topV.x, leftV.x, 0.2), lerp(topV.y, leftV.y, 0.2));
    ctx.lineTo(lerp(leftV.x, rightV.x, 0.16), lerp(leftV.y, rightV.y, 0.16));
    ctx.lineTo(lerp(rightV.x, topV.x, 0.24), lerp(rightV.y, topV.y, 0.24));
    ctx.closePath();
    ctx.fillStyle = inset;
    ctx.fill();

    // The far facet catches a cooler wash; the near facet stays lit. Warmth is still only
    // in the caustics — this is a value shift, not a colour shift.
    const shade = ctx.createLinearGradient(rightV.x, rightV.y, topV.x, topV.y);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, isDark ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.035)");
    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y);
    ctx.lineTo(leftV.x, leftV.y);
    ctx.lineTo(rightV.x, rightV.y);
    ctx.closePath();
    ctx.fillStyle = shade;
    ctx.fill();

    // Edges last, so the shell reads as a cut silhouette over its own glow.
    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y);
    ctx.lineTo(leftV.x, leftV.y);
    ctx.lineTo(rightV.x, rightV.y);
    ctx.closePath();
    ctx.strokeStyle = isDark ? "rgba(248,246,240,0.42)" : "rgba(27,24,21,0.34)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Apex glint: one clean specular so the eye reads "glass", not "triangle".
    const glintR = prismSize * 0.13;
    const glint = ctx.createRadialGradient(topV.x, topV.y, 0, topV.x, topV.y, glintR);
    glint.addColorStop(0, isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.88)");
    glint.addColorStop(0.55, isDark ? "rgba(255,255,255,0.012)" : "rgba(255,255,255,0.16)");
    glint.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glint;
    ctx.beginPath();
    ctx.arc(topV.x, topV.y, glintR, 0, TAU);
    ctx.fill();

    // Cut-crystal highlight along the incident facet.
    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y + 0.8);
    ctx.lineTo(leftV.x + 0.8, leftV.y);
    ctx.strokeStyle = isDark ? "rgba(255,252,246,0.3)" : "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Refraction begins inside the glass: three internal chords to the incident facet.
    const chords = [0.42, 0.52, 0.62];
    for (const u of chords) {
      const to = onFacet(topV, rightV, u);
      ctx.beginPath();
      ctx.moveTo(hit.x, hit.y);
      ctx.lineTo(to.x, to.y);
      const warm = isDark ? BANDS[2].dark : BANDS[2].light;
      ctx.strokeStyle = rgba(warm, u === 0.52 ? (isDark ? 0.4 : 0.28) : isDark ? 0.14 : 0.09);
      ctx.lineWidth = u === 0.52 ? 1 : 0.7;
      ctx.stroke();
    }

    // Warmth belongs in the caustics, never in the shell.
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;
    const caustic = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, prismSize * 0.52);
    caustic.addColorStop(0, rgba(warm, isDark ? 0.2 : 0.13));
    caustic.addColorStop(0.55, rgba(warm, isDark ? 0.06 : 0.04));
    caustic.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = caustic;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, prismSize * 0.52, 0, TAU);
    ctx.fill();

    // Drafting ticks at the vertices: the drawing admits it is a drawing.
    const t = 2.8;
    ctx.strokeStyle = isDark ? "rgba(248,246,240,0.36)" : "rgba(27,24,21,0.26)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(topV.x - t, topV.y);
    ctx.lineTo(topV.x + t, topV.y);
    ctx.moveTo(leftV.x, leftV.y - t);
    ctx.lineTo(leftV.x, leftV.y + t);
    ctx.moveTo(rightV.x, rightV.y - t);
    ctx.lineTo(rightV.x, rightV.y + t);
    ctx.stroke();
  };

  /**
   * The core: where refraction becomes emission.
   *
   * Two radials — a clay corona that reaches past the glass, and a white-hot bloom inside it.
   * Its strength follows the ledger's balance: on a page whose copy owns the left, the core
   * carries the light. On mobile the copy is full-width, so the core stays quiet.
   */
  const drawCore = (ctx: Ctx) => {
    if (!geo) return;
    const { exit, prismSize } = geo;
    const balance = layout?.ledger.balance ?? 0.5;
    const voice = geo.mobile ? 0.55 : 0.72 + balance * 0.4;
    const pulse = 1 + Math.sin(time * TAU * 1.5) * 0.05 + surgeEnergy * 0.5;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;

    // Corona: band α × 0.22 for the glow pass (§4), wide enough to wrap the glass.
    const coronaR = prismSize * (0.62 + surgeEnergy * 0.35);
    const corona = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, coronaR);
    const bandAlpha = isDark ? BANDS[2].darkAlpha : BANDS[2].lightAlpha;
    corona.addColorStop(0, rgba(warm, bandAlpha * 0.22 * voice));
    corona.addColorStop(0.45, rgba(warm, bandAlpha * 0.08 * voice));
    corona.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, coronaR, 0, TAU);
    ctx.fill();

    // Bloom: white → clay → transparent at r = size·0.28 (§5).
    const r = prismSize * 0.28 * pulse;
    const bloom = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, r);
    bloom.addColorStop(0, "rgba(255,255,252,0.97)");
    bloom.addColorStop(0.17, rgba(warm, isDark ? 0.78 : 0.72));
    bloom.addColorStop(0.48, rgba(warm, isDark ? 0.2 : 0.14));
    bloom.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, r, 0, TAU);
    ctx.fill();

    // The point itself, and four micro-sparks in orbit around it.
    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 1.9 * pulse, 0, TAU);
    ctx.fill();

    for (let k = 0; k < 4; k++) {
      const orbit = prismSize * (0.15 + k * 0.035);
      const angle = time * TAU * (0.085 + k * 0.021) + k * 1.7;
      const x = exit.x + Math.cos(angle) * orbit;
      const y = exit.y + Math.sin(angle) * orbit * 0.72;
      const alpha = 0.5 - k * 0.09;
      ctx.fillStyle = isDark ? `rgba(255,252,246,${alpha})` : rgba(BANDS[2].light, alpha * 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 1.1 - k * 0.12, 0, TAU);
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
   * Atmosphere — motes and photon packets.
   *
   * Density is deliberate: motes are twice as likely over the fan side as over the copy, and
   * there are none inside a quiet rect. Photons ride the whole chain — beam, then fan —
   * parametrised by arc length so their speed is constant across the two segments.
   */
  const drawAtmosphere = (ctx: Ctx, dtMs: number) => {
    if (!geo) return;
    const { source, hit, exit, targets, heroW, heroH } = geo;
    const beamLen = dist(source, hit) || 1;
    const fanLen = dist(exit, targets[2]) || 1;
    const totalLen = beamLen + fanLen;
    const step = dtMs / 1000;

    // --- motes: a fixed field drifting slowly, brighter toward the fan
    const moteCount = isDark ? 24 : 18;
    for (let i = 0; i < moteCount; i++) {
      const seedX = hash(i * 13 + 1, 0);
      const seedY = hash(i * 29 + 5, 0);
      const speed = 0.00004 + hash(i * 7 + 3, 0) * 0.00006;
      // Cheap deterministic drift: fold time into the seed space rather than storing state.
      const x = ((seedX + time * speed) % 1) * heroW;
      const y = ((seedY + time * speed * 0.6) % 1) * heroH;
      if (isQuiet(x, y) > 0.02) continue;
      const r = 0.6 + hash(i * 11 + 7, 0) * 1.1;
      const a = (0.05 + hash(i * 17 + 9, 0) * 0.07) * (x > heroW * 0.55 ? 1.15 : 0.8);
      ctx.fillStyle = isDark
        ? `rgba(248,246,240,${a.toFixed(3)})`
        : `rgba(27,24,21,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }

    // --- photon packets: climb the beam, then ride the clay band out of the frame
    const packets = isDark ? 3 : 2;
    for (let p = 0; p < packets; p++) {
      const head = ((time * 0.16 + p / packets) % 1) * totalLen;
      const fade = Math.min(1, Math.min(head, totalLen - head) / 40);
      if (fade <= 0) continue;
      const point = pointOnChain(head, beamLen, totalLen);
      if (!point) continue;
      ctx.globalAlpha = 0.55 * fade * (1 + surgeEnergy * 0.6);
      ctx.fillStyle = isDark ? "rgba(255,252,246,0.95)" : rgba(BANDS[2].light, 0.95);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 1.5, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    void step;
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

  /** Arc-length parametrisation over the whole light chain: beam, then the clay lane. */
  const pointOnChain = (distance: number, beamLen: number, totalLen: number) => {
    if (!geo) return null;
    const { source, hit, exit, targets } = geo;
    if (distance <= beamLen) {
      const t = distance / (beamLen || 1);
      return { x: lerp(source.x, hit.x, t), y: lerp(source.y, hit.y, t) };
    }
    const t = (distance - beamLen) / Math.max(1, totalLen - beamLen);
    const target = targets[2];
    return { x: lerp(exit.x, target.x, t), y: lerp(exit.y, target.y, t) };
  };

  /**
   * Tesla arcs pulled to the pointer.
   *
   * Two real chords from the core, plus their dendrites: the field is not decorating the
   * cursor, it is being attracted by it, so the arcs start at the glass and *reach* — the
   * pointer only gets to say which way. Everything is on the 24 fps jitter bucket, so the
   * arcs snap like discharge rather than sliding like a rubber band.
   */
  const drawPointerArcs = (ctx: Ctx) => {
    if (!geo || pointerEase <= 0.01) return;
    const { exit } = geo;
    const warm = isDark ? BANDS[0].dark : BANDS[0].light;

    // Bolts run from the facet exit out toward the cursor, but stop short of it: the field is
    // attracted, never grabbed. The gap to the cursor is what makes it read as reach.
    const toX = leanX - exit.x;
    const toY = leanY - exit.y;
    const span = Math.hypot(toX, toY);
    if (span < 40) return;
    const baseAngle = Math.atan2(toY, toX);
    // Saturating length: a cursor parked across the page doesn't stretch the bolts into
    // hairlines, and a cursor close in doesn't collapse them into the core.
    const reach = Math.min(span * 0.86, 300);
    // One gesture at a time: when a stat tile owns the interaction, the bolts step back so
    // the eye reads the band coupling rather than a discharge falling onto the tiles.
    const alpha = pointerEase * (hoverTile >= 0 ? 0.26 : 1);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let bolt = 0; bolt < 3; bolt++) {
      const spread = (bolt - 1) * 0.2;
      const angle = baseAngle + spread;
      const length = reach * (bolt === 1 ? 1 : 0.72 + hash(bolt * 53, 1) * 0.18);
      // Aim a little wide and a little high of the cursor: a bolt that lands exactly on it
      // reads as a vector drawn to a point, not as a field reaching for a rise.
      const tipX = exit.x + Math.cos(angle) * length;
      const tipY = exit.y + Math.sin(angle) * length - length * 0.06;
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const segments = 8;

      // A random walk with one hard kink, not a sawtooth: alternating the sign each vertex
      // builds a regular Christmas-tree squiggle, which is the tell of a drawn lightning
      // bolt. Real discharge drifts, then breaks once and carries on from the new heading.
      const kink = 3 + Math.floor(hash(bolt * 61 + 9, jitterFrame) * 3);
      const kinkDir = hash(bolt * 97 + 1, jitterFrame) > 0.5 ? 1 : -1;
      const offsets: number[] = [0];
      let walk = 0;
      for (let k = 1; k < segments; k++) {
        const env = Math.pow(Math.sin(Math.PI * (k / segments)), 0.45);
        walk += (hash(bolt * 71 + k * 13, jitterFrame) - 0.5) * 13;
        walk = clamp(walk, -15, 15);
        const kick = k === kink ? kinkDir * (16 + hash(bolt * 13 + 7, jitterFrame) * 12) : 0;
        offsets.push((walk + kick) * env);
      }
      offsets.push(0);

      ctx.beginPath();
      ctx.moveTo(exit.x, exit.y);
      for (let k = 1; k <= segments; k++) {
        const t = k / segments;
        ctx.lineTo(
          exit.x + (tipX - exit.x) * t + nx * offsets[k],
          exit.y + (tipY - exit.y) * t + ny * offsets[k],
        );
      }
      const lastX = exit.x + (tipX - exit.x) + nx * offsets[segments];
      const lastY = exit.y + (tipY - exit.y) + ny * offsets[segments];

      // Haze, channel, hot core — the fan's three passes, but tighter so the arc stays a
      // filament on top of the ribbons rather than a fourth ribbon.
      ctx.strokeStyle = rgba(warm, 1);
      ctx.globalAlpha = clamp(alpha * 0.1, 0, 1);
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.globalAlpha = clamp(alpha * 0.62, 0, 1);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.strokeStyle = isDark ? "rgba(255,252,246,0.95)" : rgba(mix(warm, INK, 0.35), 1);
      ctx.globalAlpha = clamp(alpha * 0.85, 0, 1);
      ctx.lineWidth = 0.55;
      ctx.stroke();

      // Fray: the tip breaks into three short filaments instead of ending on a blunt cut.
      for (let f = 0; f < 3; f++) {
        const frayAngle = angle + (f - 1) * (0.22 + hash(f * 11, jitterFrame) * 0.16);
        const frayLen = length * (0.1 + hash(f * 29 + bolt, jitterFrame) * 0.12);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(
          lastX + Math.cos(frayAngle) * frayLen - Math.sin(frayAngle) * 7,
          lastY + Math.sin(frayAngle) * frayLen + Math.cos(frayAngle) * 7,
        );
        ctx.strokeStyle = rgba(warm, 1);
        ctx.globalAlpha = clamp(alpha * (0.5 - f * 0.12), 0, 1);
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Dendrites: one per bolt, thrown off the middle of the run, shorter than the parent.
      const rootT = 0.46 + hash(bolt * 19 + 3, jitterFrame) * 0.2;
      const rootX = exit.x + (tipX - exit.x) * rootT + nx * offsets[Math.round(rootT * segments)];
      const rootY = exit.y + (tipY - exit.y) * rootT + ny * offsets[Math.round(rootT * segments)];
      const fork = 0.5 + hash(bolt * 31 + 5, jitterFrame) * 0.55;
      const forkLen = length * 0.26;
      const forkAngle = angle + (bolt % 2 === 0 ? fork : -fork);
      ctx.beginPath();
      ctx.moveTo(rootX, rootY);
      for (let k = 1; k <= 4; k++) {
        const t = k / 4;
        const sign = k % 2 === 0 ? 1 : -1;
        const wander = sign * (hash(bolt * 17 + k * 7, jitterFrame) * 10) * t;
        ctx.lineTo(
          rootX + Math.cos(forkAngle) * forkLen * t - Math.sin(forkAngle) * wander,
          rootY + Math.sin(forkAngle) * forkLen * t + Math.cos(forkAngle) * wander,
        );
      }
      ctx.strokeStyle = rgba(warm, 1);
      ctx.globalAlpha = clamp(alpha * 0.34, 0, 1);
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }

    // The cursor gets a faint halo only: it is the sink of the field, not a light source.
    const glow = ctx.createRadialGradient(leanX, leanY, 0, leanX, leanY, 54);
    glow.addColorStop(0, rgba(warm, 0.09 * alpha));
    glow.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(leanX, leanY, 54, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 1;
  };

  /**
   * The click surge: amplitude lifts, the core whites out for 80 ms, and one shockwave ring
   * runs 8 → 238 px. §7's envelope is exp(−t/280), capped at 950 ms; each ring carries its
   * own seed so two quick clicks don't pulse in lockstep.
   */
  const drawSurges = (ctx: Ctx) => {
    if (surges.length === 0) return;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;

    for (let i = surges.length - 1; i >= 0; i--) {
      const surge = surges[i];
      const age = surgeLife - surge.at;
      if (age < 0) continue;
      if (age > SURGE_LIFE_MS) {
        surges.splice(i, 1);
        continue;
      }
      const t = age / SURGE_LIFE_MS;
      const energy = Math.exp(-age / 340);
      const radius = 10 + Math.pow(t, 0.6) * 250;

      // Not a circle: a perfect ring is the one shape the eye reads as UI (a ripple from a
      // tap). The front is displaced by two seeded harmonics and dimmed where the field is
      // brightest, because a wavefront doesn't exist where the discharge already is.
      const front = (r: number, amp: number, lobes: number, phase: number) => {
        ctx.beginPath();
        for (let a = 0; a <= 96; a++) {
          const theta = (a / 96) * TAU;
          const rr = r * (1 + Math.sin(theta * lobes + phase) * amp);
          const x = surge.x + Math.cos(theta) * rr;
          const y = surge.y + Math.sin(theta) * rr;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      };

      const band = (r: number, width: number, a: number, core: number, seed: number) => {
        const inner = Math.max(0, r - width);
        const outer = r + width;
        const grad = ctx.createRadialGradient(surge.x, surge.y, inner, surge.x, surge.y, outer);
        grad.addColorStop(0, rgba(warm, 0));
        grad.addColorStop(0.62, rgba(warm, a * 0.35));
        grad.addColorStop(0.88, rgba(warm, a));
        grad.addColorStop(1, rgba(warm, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(surge.x, surge.y, outer, 0, TAU);
        ctx.fill();
        // A thin front on the outer edge pins the geometry; without it the band reads as fog.
        ctx.strokeStyle = rgba(warm, core);
        ctx.lineWidth = 1.15;
        front(r + width * 0.72, 0.05 + 0.02 * (seed % 3), 3 + (seed % 2), seed * 1.7);
        ctx.stroke();
      };

      band(radius, 9 + 13 * (1 - t), (1 - t) * 0.75 * energy, (1 - t) * 0.9 * energy, surge.seed);
      // Second, tighter ring for the first half: the wavefront, then its echo.
      if (t < 0.55)
        band(
          radius * 0.68,
          6,
          (1 - t * 1.8) * 0.4 * energy,
          (1 - t * 1.8) * 0.34 * energy,
          surge.seed + 3,
        );

      // White-out at the point of contact, 80 ms.
      if (age < 80) {
        const flash = 1 - age / 80;
        const flashR = 16 + (1 - flash) * 26;
        const bloom = ctx.createRadialGradient(surge.x, surge.y, 0, surge.x, surge.y, flashR);
        bloom.addColorStop(0, `rgba(255,255,255,${(0.55 * flash).toFixed(3)})`);
        bloom.addColorStop(0.5, rgba(warm, 0.3 * flash));
        bloom.addColorStop(1, rgba(warm, 0));
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(surge.x, surge.y, flashR, 0, TAU);
        ctx.fill();
      }
    }
  };

  /** ?heroDebug=1 — the register check: columns, facet points, target order, entry mode. */
  const drawDebug = (ctx: Ctx) => {
    if (!geo || !layout) return;
    const { columns } = layout;

    ctx.save();
    ctx.lineWidth = 0.75;
    if (ctx.setLineDash) ctx.setLineDash([3, 5]);

    ctx.strokeStyle = "rgba(0,120,255,0.35)";
    for (const x of columns) {
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

    // Tile centres + the horizontal lane each target lands on.
    for (const tile of layout.tiles) {
      ctx.strokeStyle = "rgba(255,140,0,0.55)";
      ctx.beginPath();
      ctx.moveTo(tile.cx, tile.top);
      ctx.lineTo(tile.cx, tile.bottom);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawScene = (ctx: Ctx, dtMs: number) => {
    if (!geo) return;
    ctx.clearRect(0, 0, geo.heroW, geo.heroH);

    ensureCaches(ctx);

    // Layer 1 — plate (cached raster)
    drawPlate(ctx);

    // Layers 2–3 — spectral body + Tesla plasma
    for (let i = 0; i < BANDS.length; i++) fillStrand(strandBufs[i], BANDS[i], i);
    drawReflection(ctx);
    drawRibbons(ctx);
    drawSpines(ctx);
    drawPlasma(ctx);

    // The dissolve sits between the field and the things that must stay bright: the light
    // behind the words is thinned here, then the beam, glass, core and filaments are painted
    // over it at full strength.
    drawDissolve(ctx);

    // The incident ray, then the glass that receives it
    drawBeam(ctx);
    drawGlass(ctx);
    drawEntrySpark(ctx);

    // Layer 4 — the core, then layer 5 — the filaments that ground the fan
    drawCore(ctx);
    drawGrounds(ctx);

    // Interaction: arcs reach from the core toward the pointer, surges flash on top.
    drawPointerArcs(ctx);
    drawSurges(ctx);

    // Layer 6 — atmosphere
    drawAtmosphere(ctx, dtMs);

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
    /** Which stat tile the pointer is over (-1 for none). Drives tile coupling (§7). */
    setTileHover(index: number) {
      hoverTile = index < 0 ? -1 : Math.max(0, Math.min(BANDS.length - 1, index));
    },
    /** Hovering the headline brightens the incident ray ×1.3 (§7). */
    setHeadlineHover(on: boolean) {
      headlineHover = on;
    },
    addSurge(x: number, y: number, at: number) {
      // `at` is the shell's clock; store it relative to the engine's own surge clock so the
      // ring decays on frame time rather than on wall time.
      surges.push({ x, y, at: surgeLife, seed: surges.length });
      if (surges.length > 4) surges.shift();
      surgeEnergy = 1;
    },
    /** advance one frame and paint. */
    paint(ctx: Ctx, dtMs: number, now: number) {
      void now;
      time += dtMs / 1000;
      advanceJitter();
      surgeLife += dtMs;
      surgeEnergy = Math.max(0, surgeEnergy - dtMs / 900);

      // τ = 90 ms follow for the lean, and the same ease for how much the pointer is allowed
      // to influence the arcs — so they arrive and leave together instead of popping.
      const ease = Math.min(1, dtMs / POINTER_TAU_MS);
      leanX += (pointerX - leanX) * ease;
      leanY += (pointerY - leanY) * ease;
      pointerEase += ((pointerActive ? 1 : 0) - pointerEase) * ease;

      drawScene(ctx, dtMs);
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
      advanceJitter();
      drawScene(ctx, 0);
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
          heroW: 0,
          heroH: 0,
          mobile: false,
          prismSize: 0,
          topV: { x: 0, y: 0 },
          leftV: { x: 0, y: 0 },
          rightV: { x: 0, y: 0 },
          hit: { x: 0, y: 0 },
          exit: { x: 0, y: 0 },
          source: { x: 0, y: 0 },
          entryMode: "top-edge" as const,
          targets: [] as Vec[],
        }),
        version,
        strands: strandBufs.map((buf) => ({
          root: { x: buf[0], y: buf[1] },
          tip: { x: buf[STRAND_STEPS * 2], y: buf[STRAND_STEPS * 2 + 1] },
        })),
        steps: STRAND_STEPS,
        jitterBucket,
        branches: BANDS.length * BRANCH_AT.length,
        interaction: {
          pointerEase,
          hoverTile,
          headlineHover,
          surges: surges.length,
          surgeEnergy,
        },
      };
    },
    /** QA: one band's live point buffer (x, y pairs). */
    strandBuffer(index: number) {
      return strandBufs[index] ?? null;
    },
    /** QA: sample a band's curve without painting. */
    sampleStrand(index: number, s: number) {
      if (!geo) return { x: 0, y: 0 };
      const band = BANDS[index];
      const target = geo.targets[index];
      const dx = (target.x - geo.exit.x) * OVERSHOOT;
      const dy = (target.y - geo.exit.y) * OVERSHOOT;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const omega = time * TAU * band.hz;
      const env = Math.pow(Math.sin(Math.PI * s), 0.9);
      const scale = band.amplitude * Math.pow(s, 0.35);
      const off =
        (Math.sin(TAU * band.cycles * s - omega + index * 0.55) * scale +
          Math.sin(TAU * 2.3 * band.cycles * s + omega * 1.35) * scale * 0.26) *
        env;
      return {
        x: geo.exit.x + dx * s + nx * off,
        y: geo.exit.y + dy * s + ny * off,
      };
    },
    /** QA: settle the strand buffer without painting (pointer off, t = 4.6). */
    settle() {
      time = 4.6;
      surgeEnergy = 0;
      pointerActive = false;
      pointerEase = 0;
      hoverTile = -1;
      headlineHover = false;
      surges.length = 0;
      advanceJitter();
      for (let i = 0; i < BANDS.length; i++) fillStrand(strandBufs[i], BANDS[i], i);
    },
  };
}
