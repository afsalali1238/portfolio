/**
 * hero-ray — the drawing engine behind the hero's dispersion field.
 *
 * Phase 8 composition: one beam crosses the page, the glass bends it, the page dissolves it.
 *
 *   light enters from the left edge of the hero
 *     → it travels across the composition, passing *behind* the headline
 *     → it strikes the left facet of a glass prism
 *     → it travels through the glass as one neutral ray
 *     → colours appear only as the light leaves the glass
 *     → and that point disperses in every direction that has room,
 *       growing from specks of dust into whole strands of light,
 *       until the strands cross the entire section and leave the frame.
 *
 * ## The beam: one ray, one illustrated field
 *
 * The incident beam has two separable things on it, and keeping them apart is what makes the
 * page honest:
 *
 *   1. **The optical axis** is a *straight* ray from the source to the live entry point on the
 *      left facet. Light travels in a straight line in a uniform medium, so every optical
 *      quantity comes from this axis: the angle of incidence, the hinge on the facet, Snell's
 *      law inside the glass, the Fresnel ghost. It is the only thing the physics sees.
 *   2. **The visible ripple** around that axis is an illustration of the electromagnetic field,
 *      not the path a photon takes. A page-scale drawing cannot be literal here: visible light
 *      is ~400–700 nm, some six orders of magnitude below one pixel, so the drawn wavelength is
 *      magnified accordingly and the drawn amplitude is a stylistic exaggeration. Its envelope
 *      is exactly zero at the source and at the facet, so the ripple can never detach the beam
 *      from its origin or land anywhere but on the hinge.
 *
 * The colour is generated at the exit facet, never in the incident beam: the light that enters
 * the glass is neutral warm-white on ink and neutral silver on paper.
 *
 * The resting ray is a *traced* ray, not a composed chord: `buildGeometry` runs the same
 * `tracePrism` the pointer uses, so the internal leg is refracted at rest too. The full-bleed
 * fan around the exit remains an artistic exaggeration (see BANDS and the sweep below).
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
 *      white), a single neutral ray through the glass, a caustic pool under the base and
 *      glints at the vertices. Dispersion begins at the exit.
 *   4. **The current catches the cursor.** Strands within reach bend toward the pointer, and
 *      the nearest ones throw a jittered filament at it. Inside the glass the catch releases,
 *      and a Snell/Fresnel ray trace takes over instead.
 *
 * Three invariants this file exists to protect:
 *
 *   1. Layout-derived geometry. Every position comes from a LayoutSnapshot measured off the
 *      real DOM (see ./hero-layout). Nothing is a percentage of the section — except the
 *      sweep of the fan, which is a direction, not a position.
 *   2. Continuity. Each strand's displacement envelope E(s) = sin(πs)^0.85 is exactly 0 at
 *      both ends, so P(0) is the exit point to the last float and no tip detaches. The beam's
 *      ripple obeys the same rule against its own axis.
 *   3. Legibility. The dissolve thins everything that crosses a type box — including the beam,
 *      which is painted *before* it — so light can pass behind the words without ever costing
 *      one of them its contrast. The facet contact is painted after it, so the hinge stays
 *      crisp where there is no type to protect.
 *
 * No canvas shadow blur anywhere: every soft edge is a gradient or a cached sprite, and every
 * geometry-dependent background gradients are cached per geometry version and theme.
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

/**
 * How much of a lane may run inside the prism before the stroke is cut at the far rim, in px.
 * Above this the lane is crossing the body; below it the lane only clips a corner and keeps
 * its origin at the core.
 */
const GLASS_MAX_INK = 20;
/** Hovering a tile dims every other band to this fraction. */
const TILE_DIM = 0.42;

/* --------------------------------------------------------------- the incident beam */

/**
 * The illustrated field on the beam (see the file header): a slow travelling ripple around a
 * straight optical axis.
 *
 * The numbers are deliberately conservative. The previous pass drew 0.4 px of wobble, which
 * nobody can see; a loose cable is the opposite failure. One spatial frequency plus a weak
 * second harmonic, two cycles across the run and a crest every six seconds reads as *light
 * with a field*, not as a drawn wire.
 */
const BEAM_WAVE = {
  /** spatial cycles along the visible run (long enough to read as a wavelength, not a comb) */
  cycles: 2.0,
  /** second harmonic: breaks the pure sine so crests are not all identical */
  harmonic: 0.26,
  harmonicCycles: 2.35,
  /** phase speed, Hz — one crest travels the whole run in about six seconds */
  hz: 0.16,
  /** fraction of the run over which the ripple grows in from the source … */
  fadeIn: 0.17,
  /** … and settles onto the facet: exactly zero at s = 1, so the hinge is never tugged */
  fadeOut: 0.2,
  /** amplitude as a fraction of the run, clamped: ~19 px at 1440, ~7 px on a phone */
  amplitudeOfRun: 0.021,
  amplitudeMin: 5,
  amplitudeMax: 19,
} as const;

/**
 * The beam's approach angle, radians, in screen space (y down): on wide screens the light
 * descends into the left facet from upper-left; on portrait it rises from lower-left, because
 * the copy is full width and there is no upper-left corner left to enter from.
 *
 * A beam that approaches the left facet from the left **must** descend into it, otherwise the
 * incident ray crosses the prism's own left facet before reaching the entry point and the
 * geometry stops describing a prism. Within that family the resting behaviour is a property of
 * the triangle, not a choice: at 13° of descent the entry lands near 41° of incidence, close to
 * the critical angle, and the refracted ray inside the glass is at ~24° to the far facet normal
 * — past that facet's own critical angle. It is therefore **totally internally reflected** and
 * leaves through the base. Shallow descents (≈ 36–41° of incidence) refract straight out of the
 * right facet instead. Both are drawn as traced rays; `restOptics` says which one this layout
 * produced, and QA asserts the reflection never emits from the facet it reflects off.
 *
 * Portrait rises at 14°, which lands well inside the window where the ray refracts out of the
 * right facet.
 */
const BEAM_ANGLE_WIDE = 13 * DEG;
const BEAM_ANGLE_PORTRAIT = -14 * DEG;

/** Pointer hover eases the beam: this is the time constant, ms. */
const BEAM_HOVER_TAU_MS = 160;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Hermite step: 0 at e0, 1 at e1, with zero slope at both ends. */
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
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

/** Below this width the hero uses the portrait composition (the copy is full-bleed). */
const PORTRAIT_MAX_W = 768;

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
  /** the beam's origin: where the light enters the frame */
  source: Vec;
  /**
   * Where the composition put the beam's landing on the left facet:
   * "left-run" = it crosses the hero from the left edge (wide screens),
   * "corner-rise" = it rises from the lower-left into the corner glass (portrait).
   * Both are a straight approach; neither is a reroute.
   */
  entryMode: "left-run" | "corner-rise";
  /** resting parameter on the left facet, top → bottom */
  entryU: number;
  /** the beam's approach angle in radians (screen space, y down) */
  beamAngle: number;
  /** the traced optics at rest: the internal leg is refracted even when nobody is pointing */
  restOptics: ReturnType<typeof tracePrism>;
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
 * The prism's keep-clear zone: the triangle, grown by a margin.
 *
 * Nothing but glass is drawn inside it. A strand that leaves the core toward the left would
 * otherwise be seen *through* the glass — a cable of near-parallel hairlines crossing the
 * body — which is what turned the left facet into a tangle. The zone lets a strand start
 * where it actually leaves the glass, so the fracture stays a fracture: one ray in, light out.
 */
type ClearZone = { a: Vec; b: Vec; c: Vec; k: number };

const makeClear = (a: Vec, b: Vec, c: Vec, pad: number): ClearZone => {
  const cx = (a.x + b.x + c.x) / 3;
  const cy = (a.y + b.y + c.y) / 3;
  const reach = (p: Vec) => Math.hypot(p.x - cx, p.y - cy);
  const r = Math.max(reach(a), reach(b), reach(c)) || 1;
  return {
    a,
    b,
    c,
    k: Math.min(2, (r + pad) / r),
  };
};

const inTri = (a: Vec, b: Vec, c: Vec, x: number, y: number) => {
  const side = (p: Vec, q: Vec) => (q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x);
  const d1 = side(a, b);
  const d2 = side(b, c);
  const d3 = side(c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
};

const inClear = (z: ClearZone, x: number, y: number) => {
  const cx = (z.a.x + z.b.x + z.c.x) / 3;
  const cy = (z.a.y + z.b.y + z.c.y) / 3;
  // Pull the *point* in by k, so the test is against the triangle grown by k — not shrunk.
  return inTri(z.a, z.b, z.c, cx + (x - cx) / z.k, cy + (y - cy) / z.k);
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

/** A geometrical ray in an equilateral glass prism. Angles are measured from normals. */
export function tracePrism(source: Vec, entry: Vec, top: Vec, left: Vec, right: Vec) {
  const n = 1.5;
  const critical = Math.asin(1 / n);
  const normalize = (v: Vec): Vec => {
    const length = Math.hypot(v.x, v.y) || 1;
    return { x: v.x / length, y: v.y / length };
  };
  const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y;
  const cross = (a: Vec, b: Vec) => a.x * b.y - a.y * b.x;
  const tangent = normalize({ x: left.x - top.x, y: left.y - top.y });
  const inward = { x: tangent.y, y: -tangent.x };
  const incident = normalize({ x: entry.x - source.x, y: entry.y - source.y });
  const cosIn = clamp(dot(incident, inward), 0, 1);
  const sinIn = clamp(dot(incident, tangent), -1, 1);
  const theta1 = Math.atan2(Math.abs(sinIn), cosIn);
  const theta2 = Math.asin(sinIn / n);
  let direction = {
    x: inward.x * Math.cos(theta2) + tangent.x * Math.sin(theta2),
    y: inward.y * Math.cos(theta2) + tangent.y * Math.sin(theta2),
  };
  const reflected = {
    x: incident.x - 2 * cosIn * inward.x,
    y: incident.y - 2 * cosIn * inward.y,
  };
  const fresnel = Math.min(0.12, 0.04 + 0.96 * Math.pow(1 - cosIn, 5));
  const facets = [
    { name: "left" as const, a: top, b: left },
    { name: "base" as const, a: left, b: right },
    { name: "right" as const, a: right, b: top },
  ];
  let point = entry;
  let last = "left";
  let firstAngle = 0;
  let firstFacet = "";
  let tir = false;
  let exitDirection = direction;
  let exitFacet = "";
  const legs: { from: Vec; to: Vec; facet: string; tir: boolean }[] = [];
  // Multiple bounces matter: the reflected ray can also undergo TIR at the base.
  for (let bounce = 0; bounce < 8; bounce++) {
    let best = Infinity;
    let face: (typeof facets)[number] | undefined;
    for (const f of facets) {
      if (f.name === last) continue;
      const edge = { x: f.b.x - f.a.x, y: f.b.y - f.a.y };
      const delta = { x: f.a.x - point.x, y: f.a.y - point.y };
      const den = cross(direction, edge);
      if (Math.abs(den) < 1e-9) continue;
      const distance = cross(delta, edge) / den;
      const u = cross(delta, direction) / den;
      if (distance > 1e-6 && u >= -1e-8 && u <= 1 + 1e-8 && distance < best) {
        best = distance;
        face = f;
      }
    }
    if (!face) break;
    const end = { x: point.x + direction.x * best, y: point.y + direction.y * best };
    const edge = normalize({ x: face.b.x - face.a.x, y: face.b.y - face.a.y });
    let normal = { x: -edge.y, y: edge.x };
    if (dot(direction, normal) < 0) normal = { x: -normal.x, y: -normal.y };
    const cosine = clamp(dot(direction, normal), 0, 1);
    const angle = Math.acos(cosine);
    const reflects = angle > critical;
    if (bounce === 0) {
      firstAngle = angle;
      firstFacet = face.name;
      tir = reflects;
    }
    legs.push({ from: point, to: end, facet: face.name, tir: reflects });
    point = end;
    if (!reflects) {
      const signedSin = dot(direction, edge) * n;
      const outCos = Math.sqrt(Math.max(0, 1 - signedSin * signedSin));
      exitDirection = {
        x: normal.x * outCos + edge.x * signedSin,
        y: normal.y * outCos + edge.y * signedSin,
      };
      exitFacet = face.name;
      break;
    }
    direction = { x: direction.x - 2 * cosine * normal.x, y: direction.y - 2 * cosine * normal.y };
    last = face.name;
  }
  const deviation = exitFacet ? Math.acos(clamp(dot(incident, exitDirection), -1, 1)) : 0;
  return {
    theta1,
    theta2: Math.abs(theta2),
    firstAngle,
    firstFacet,
    critical,
    tir,
    legs,
    exit: point,
    exitFacet,
    exitDirection,
    reflected,
    fresnel,
    deviation,
  };
}

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
  let pointerInGlass = 0;
  let pointerEase = 0; // 0..1, 80 ms follow — how much the pointer is influencing the field
  let hoverTile = -1; // index of the stat tile under the pointer, -1 for none
  let headlineHover = false;
  /** Eased copy of `headlineHover`: the beam answers the cursor, it does not snap at it. */
  let beamGlow = 0;
  const surges: { x: number; y: number; at: number; seed: number }[] = [];
  let surgeLife = 0; // ms since the most recent surge started

  let liveHit: Vec | null = null;
  let optics: ReturnType<typeof tracePrism> | null = null;
  let fanOrigin: Vec | null = null;
  let fanTurn = 0;
  let fanSpread = 1;
  let opticalWeight = 0;
  let entryU = 0.4;
  const deltaMin = 2 * Math.asin(1.5 * Math.sin(Math.PI / 6)) - Math.PI / 3;

  const updateOptics = () => {
    if (!geo) return;
    if (pointerInGlass === 0) {
      liveHit = null;
      optics = null;
      fanOrigin = null;
      fanTurn = 0;
      fanSpread = 1;
      opticalWeight = 0;
      entryU = geo.entryU;
      return;
    }
    const { topV, leftV, rightV, source, exit, prismSize } = geo;
    const dx = leftV.x - topV.x;
    const dy = leftV.y - topV.y;
    const projection = ((pointerX - topV.x) * dx + (pointerY - topV.y) * dy) / (dx * dx + dy * dy);
    const baseU = geo.entryU;
    entryU = lerp(baseU, clamp(projection, 0.12, 0.86), pointerInGlass);
    liveHit = onFacet(topV, leftV, entryU);
    // Distance from the facet gives the boundary a gentle, local onset.
    const depth = clamp(
      Math.hypot(pointerX - liveHit.x, pointerY - liveHit.y) / (prismSize * 0.2),
      0,
      1,
    );
    const active = pointerInGlass * depth;
    opticalWeight = active;
    const target = tracePrism(source, liveHit, topV, leftV, rightV);
    optics = target;
    fanOrigin = { x: lerp(exit.x, target.exit.x, active), y: lerp(exit.y, target.exit.y, active) };
    // The full-bleed field is an artistic sweep, not a literal narrow beam. Rotate it
    // relative to its resting lane while preserving its coverage and ordering.
    const targetAngle = Math.atan2(target.exitDirection.y, target.exitDirection.x);
    const restAngle = geo.mobile ? Math.PI / 2 : 0;
    const difference = Math.atan2(
      Math.sin(targetAngle - restAngle),
      Math.cos(targetAngle - restAngle),
    );
    fanTurn = clamp(difference, -0.45, 0.45) * active;
    fanSpread = 1 + 0.35 * clamp((target.deviation - deltaMin) / deltaMin, 0, 1) * active;
  };

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
    const { heroW, heroH, thesisLine } = layout;
    const mobile = heroW < PORTRAIT_MAX_W;

    // Portrait gets a slightly smaller prism on purpose: it has to sit clear of the display
    // type *and* stay inside a 390 px frame, and those two constraints only meet here.
    const prismSize = mobile
      ? clamp(Math.min(heroW, heroH) * 0.24, 76, 108)
      : clamp(Math.min(heroW, heroH) * 0.32, 150, 262);

    // Equilateral prism, apex up. Circumradius r = size / √3, half-width r·cos30°.
    const r = prismSize / Math.sqrt(3);
    const halfW = r * 0.866;

    /**
     * The composition hangs off one point: **where the beam lands on the left facet**.
     *
     * Everything else is derived from it. The glass is hung so that the landing sits on its
     * facet at `entryU`; the beam is a straight run back from that landing to the frame edge;
     * and the dispersion origin is whatever the traced refracted ray exits through. Moving a
     * single anchor therefore moves the whole picture coherently, and no part of it can drift
     * away from the optics.
     *
     * `entryU` sits near the apex on wide screens. That is not decorative: with the beam
     * descending from upper-left, the refracted ray leaves the near-apex entry heading down
     * the body, strikes the far facet **above** the critical angle (total internal
     * reflection — a real, measured consequence of this geometry, not a chosen effect),
     * reflects down through the glass and leaves through the base. Entering lower on the
     * facet makes that reflected leg long and flat, and it ends up doubling the base rim;
     * entering near the apex makes it a clean vertical drop through the middle of the glass.
     */
    const entryU = mobile ? 0.56 : 0.26;
    const beamAngle = mobile ? BEAM_ANGLE_PORTRAIT : BEAM_ANGLE_WIDE;
    const tanA = Math.tan(beamAngle);

    // Offsets of the landing point from the prism's centroid, for this entryU.
    const entryRelX = -halfW * entryU;
    const entryRelY = -r * (1 - 1.5 * entryU);

    /**
     * The landing height: in the gap between the closing sentence and the body copy — above
     * the lede, below the italic line — so the beam crosses the display type and never has to
     * run through a paragraph to reach the glass. Portrait has no such gap (the copy is full
     * width), so the glass hangs in the top-right corner instead and the beam rises to it.
     */
    let centre: Vec;
    if (mobile) {
      /**
       * Portrait: the copy is full width, so there is no quiet band to land in — the glass
       * hangs in the top-right corner instead and the beam rises to it from the lower left.
       * The landing height is chosen so the beam crosses the two display lines at a workable
       * angle of incidence; the summary above explains why the *angle*, not the length, is
       * the constraint. The lower bound keeps the landing below the display type outright if
       * a layout ever squeezes it out of the gap.
       */
      // Clear the display type horizontally, and the top edge vertically. Both are measured:
      // on portrait the glass has nowhere to hide, so it has to be placed rather than tuned.
      const displayRight = layout.textRects
        .slice(0, 2)
        .reduce((acc, rect) => Math.max(acc, rect.right), layout.container.left);
      const margin = Math.max(8, heroW * 0.026);
      const clearOfType = displayRight + halfW + margin;
      centre = {
        x: Math.min(heroW - halfW - 6, Math.max(clearOfType, heroW * 0.72)),
        // The apex stays on the page: a clipped vertex is the one thing that stops the shape
        // reading as a solid object.
        y: r + Math.max(7, heroH * 0.014),
      };
    } else {
      const landingY = clamp(thesisLine.baselineY + prismSize * 0.1, heroH * 0.28, heroH * 0.44);
      const centreY = landingY - entryRelY;
      // Whatever copy shares the glass's vertical band has to stay clear of the body: the
      // clearance is derived from the rects that actually overlap that band, not from the
      // widest text on the page (the CTA row is far below the glass and must not push it).
      const bandTop = centreY - r;
      const bandBottom = centreY + r * 0.5;
      const bandRight = layout.textRects.reduce(
        (acc, rect) =>
          rect.bottom > bandTop && rect.top < bandBottom ? Math.max(acc, rect.right) : acc,
        layout.container.left,
      );
      const centreX = Math.min(heroW - halfW - 14, Math.max(heroW * 0.625, bandRight + halfW + 22));
      centre = { x: centreX, y: centreY };
    }

    const prismCenter: Vec = centre;
    const topV: Vec = { x: centre.x, y: centre.y - r };
    const leftV: Vec = { x: centre.x - halfW, y: centre.y + r * 0.5 };
    const rightV: Vec = { x: centre.x + halfW, y: centre.y + r * 0.5 };
    const hit = onFacet(topV, leftV, entryU);

    /**
     * The beam's origin, walked back along the optical axis from the landing.
     *
     * The light should enter **at the frame edge**, not somewhere inside the picture: a beam
     * that begins in the middle of the hero reads as a decorative leader line, which is
     * exactly what this pass is fixing. So the run is whatever takes the axis to x = 0 (or to
     * the top edge on a short, wide viewport) — the *length* gives way, never the angle: the
     * incidence is what the optics read.
     */
    const edge = mobile ? 2 : 0;
    const runToEdge = (hit.x - edge) / Math.max(0.2, Math.cos(beamAngle));
    const run = clamp(runToEdge, 260, 1400);
    let source: Vec = { x: hit.x - run * Math.cos(beamAngle), y: hit.y - run * tanA };
    // A short hero: keep the length it can hold and give up the run, not the direction.
    const margin = mobile ? 2 : 18;
    if (source.y < margin) source = { x: hit.x - (hit.y - margin) / tanA, y: margin };
    else if (source.y > heroH - margin)
      source = { x: hit.x - (hit.y - (heroH - margin)) / tanA, y: heroH - margin };
    if (source.x < edge) source = { x: edge, y: hit.y - (hit.x - edge) * tanA };

    /**
     * The resting optics: the same `tracePrism` the pointer drives, run once on the resting
     * axis. The internal leg is therefore a refracted ray at rest as well — the still, the
     * reduced-motion frame and the first frame of interaction all show a real solution.
     */
    const restOptics = tracePrism(source, hit, topV, leftV, rightV);
    const exitU = 0.56;
    // A degenerate trace (a ray that never leaves) still needs an origin on the exit facet.
    const exit = restOptics.exitFacet ? restOptics.exit : onFacet(topV, rightV, exitU);

    /**
     * The dispersion origin is the traced exit point: refraction — or, where the geometry
     * demands it, total internal reflection followed by refraction — is what decides where the
     * light leaves, not a fixed corner of the glass. Move the beam, the pointer or the prism and
     * the fan's origin moves with the optics.
     */
    const core = exit;

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
        resolve:
          dir.x < -0.15
            ? 1.85
            : spec.ghost
              ? 2.3
              : 0.75 + Math.min(1, Math.abs(Math.sin(spec.angle / 2)) * 1.5) * 0.55,
        // Left-side lanes are the ones the beam has to outshine: they are deliberately
        // near-invisible on ink, where a stray warm hairline competes with the beam's own
        // halo, and a touch more present on paper, where the plate grain swallows them.
        alpha:
          (dir.x < -0.15
            ? spec.index === 1 || spec.index === 19
              ? isDark
                ? 0.03
                : 0.07
              : 0.006
            : spec.ghost
              ? 0.008
              : 1) *
          (mobile ? 0.86 : 1) *
          damped(spec.angle),
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
    const ghostAngles = mobile ? [196] : [171, 199];
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
      entryMode: mobile ? "corner-rise" : "left-run",
      entryU,
      beamAngle,
      restOptics,
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
    const core = fanOrigin ?? geo.core;
    const angle =
      strand.angle +
      fanTurn +
      (strand.angle - (geo.mobile ? Math.PI / 2 : 0)) * (fanSpread - 1) * 0.15;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    const normal = { x: -dir.y, y: dir.x };
    const length =
      fanTurn || fanSpread !== 1
        ? Math.max(120, rayExit(core, dir, geo.heroW, geo.heroH) * OVERSHOOT)
        : strand.length;

    const amp = strand.amplitude * (1 + surgeEnergy * 0.35);
    const omega = time * TAU * strand.hz;
    const catchEase = pointerEase * (1 - pointerInGlass);
    const catching = catchEase > 0.015;
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
      const along = clamp((rel.x * dir.x + rel.y * dir.y) / length, 0.05, 0.95);
      const gx = core.x + dir.x * (along * length);
      const gy = core.y + dir.y * (along * length);
      const gap = Math.hypot(leanX - gx, leanY - gy);
      if (gap < CATCH_RADIUS) catchWeight = Math.pow(1 - gap / CATCH_RADIUS, 1.05) * catchEase;
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
      let x = core.x + dir.x * (s * length) + normal.x * off;
      let y = core.y + dir.y * (s * length) + normal.y * off;

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
      x += normal.x * jitter;
      y += normal.y * jitter;

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
    computeGates();
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

    // A neutral beam: dark silver on paper for contrast, warm white on ink.
    const { source, hit } = geo;
    const b = ctx.createLinearGradient(source.x, source.y, hit.x, hit.y);
    const silver: Rgb = isDark ? [255, 251, 241] : [105, 99, 90];
    b.addColorStop(0, rgba(silver, 0.6));
    b.addColorStop(0.2, rgba(silver, 0.9));
    b.addColorStop(1, rgba(silver, 1));
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

  /* ----------------------------------------------------------- the incident beam */

  /**
   * The straight optical axis of the incident beam, source → live entry.
   *
   * This is the only geometry the light *has*: the source is fixed, the entry slides along
   * the facet while the pointer is inside the glass, and the axis between them is a chord.
   * Everything drawn on top of it is illustration.
   */
  const beamAxis = () => {
    if (!geo) return null;
    const hit = liveHit ?? geo.hit;
    const dx = hit.x - geo.source.x;
    const dy = hit.y - geo.source.y;
    const len = Math.hypot(dx, dy) || 1;
    return { hit, dx, dy, len, nx: -dy / len, ny: dx / len };
  };

  /** Peak transverse displacement of the ripple, px. Scales with the run, never off the page. */
  const beamAmplitude = (len: number) =>
    clamp(len * BEAM_WAVE.amplitudeOfRun, BEAM_WAVE.amplitudeMin, BEAM_WAVE.amplitudeMax) *
    (1 + beamGlow * 0.4) *
    (1 + surgeEnergy * 0.3);

  /**
   * The ripple's envelope: zero at the source, zero at the facet, one in between.
   *
   * Both ends are exact, not asymptotic. At s = 1 the displacement is 0 to the last float, so
   * the illustrated field lands on the hinge the ray tracer computed and can never tug the
   * refracting point sideways — that is what keeps the surface response attached to the facet
   * instead of following a decorative curve.
   */
  const beamEnvelope = (s: number) =>
    smoothstep(0, BEAM_WAVE.fadeIn, s) * smoothstep(1, 1 - BEAM_WAVE.fadeOut, s);

  /**
   * Transverse displacement of the illustrated field at s ∈ [0, 1], in px.
   *
   * One slow travelling wave plus a weak second harmonic. The harmonic is what stops the beam
   * reading as a bent wire: a single sine has evenly spaced identical crests, and the eye reads
   * that as a shape. A little asymmetry around a long wavelength reads as a *field*.
   */
  const beamOffset = (s: number, amp: number) => {
    const phase = time * TAU * BEAM_WAVE.hz;
    const wave =
      Math.sin(TAU * BEAM_WAVE.cycles * s - phase + 0.7) +
      Math.sin(TAU * BEAM_WAVE.harmonicCycles * s - phase * 1.7 + 2.1) * BEAM_WAVE.harmonic;
    // Normalised by the harmonic sum, so `amp` is a true bound: the crest can reach it and
    // never exceed it. That is what lets the corridor be asserted instead of estimated.
    return (wave / (1 + BEAM_WAVE.harmonic)) * amp * beamEnvelope(s);
  };

  /** A point on the illustrated beam. `s = 1` is the live entry point, by construction. */
  const beamPoint = (s: number, amp: number): Vec => {
    const axis = beamAxis();
    if (!axis || !geo) return { x: 0, y: 0 };
    const off = beamOffset(s, amp);
    return {
      x: geo.source.x + axis.dx * s + axis.nx * off,
      y: geo.source.y + axis.dy * s + axis.ny * off,
    };
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
    // Where the strand is allowed to exist. Strands that cross the glass open just past it.
    const door = gates[index] ?? 0;
    if (door >= STRAND_STEPS) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = clamp(alpha, 0, 1);

    // Haze: a wide, faint version of the solid length, so strands have body, not just an edge.
    const solidFrom = Math.max(
      door,
      Math.round(Math.min(0.95, 0.38 * strand.resolve) * STRAND_STEPS),
    );
    traceRange(ctx, buf, solidFrom, STRAND_STEPS);
    ctx.lineWidth = strand.width * (strand.ribbon > 0 ? 7 : 5);
    ctx.globalAlpha = clamp(alpha * (strand.ribbon > 0 ? 0.14 : 0.1), 0, 1);
    ctx.stroke();

    ctx.globalAlpha = clamp(alpha, 0, 1);
    for (const region of REGIONS) {
      const from = Math.max(
        door,
        Math.round(Math.min(1, region.from * strand.resolve) * STRAND_STEPS),
      );
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
      traceRange(ctx, buf, Math.max(door, Math.round(0.55 * STRAND_STEPS)), STRAND_STEPS);
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
      const tail = Math.max(door, head - 4);
      if (head - tail >= 2 && tail > door && p > 0.06) {
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
      (fanOrigin ?? geo.core).x,
      (fanOrigin ?? geo.core).y,
      strand.dir.x * strand.length + (fanOrigin ?? geo.core).x,
      strand.dir.y * strand.length + (fanOrigin ?? geo.core).y,
    );
    gradient.addColorStop(0, rgba(colour, 0.55));
    gradient.addColorStop(0.18, rgba(colour, 0.9));
    gradient.addColorStop(1, rgba(colour, 1));

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // The prime obeys the same glass keep-clear gate as every other strand.
    const door = gates[geo.prime] ?? 0;
    if (head <= door) return;
    // Haze: the line has body, a ruler-thin stroke does not read as light.
    traceRange(ctx, buf, door, head);
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
      (fanOrigin ?? geo.core).x,
      (fanOrigin ?? geo.core).y,
      0,
      (fanOrigin ?? geo.core).x,
      (fanOrigin ?? geo.core).y,
      seedR * 6,
    );
    seedGradient.addColorStop(0, isDark ? "rgba(255,255,252,0.95)" : "rgba(255,255,255,0.98)");
    seedGradient.addColorStop(0.28, rgba(colour, 0.7));
    seedGradient.addColorStop(1, rgba(colour, 0));
    ctx.fillStyle = seedGradient;
    ctx.beginPath();
    ctx.arc((fanOrigin ?? geo.core).x, (fanOrigin ?? geo.core).y, seedR * 6, 0, TAU);
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
  /** The prism's keep-clear zone, rebuilt whenever the geometry changes. */
  let clearZone: ClearZone | null = null;
  let clearKey = "";
  const zone = (): ClearZone | null => {
    if (!geo) return null;
    const key = `${version}:${geo.prismSize}:${Math.round(geo.exit.x)}`;
    if (clearZone && key === clearKey) return clearZone;
    clearZone = makeClear(geo.topV, geo.leftV, geo.rightV, 18);
    clearKey = key;
    return clearZone;
  };

  /**
   * Where each strand is allowed to open, as a sample index. `0` means "at the core".
   *
   * A lane that merely grazes the glass keeps its origin, so the fan still converges on the
   * point of light the composition hangs on. A lane that would *cross* the body (the ones
   * heading out of the left side, and the ones that run down through the base) opens on the
   * far side instead — otherwise the prism is a window onto a cable of hairlines, which is
   * exactly what made its left flank read as a tangle. On paper the glass hides them anyway;
   * on ink it does not, and that is where the tangle was visible.
   */
  const gates: number[] = [];
  const glassInk: number[] = [];
  const computeGates = () => {
    gates.length = 0;
    glassInk.length = 0;
    const z = zone();
    for (let i = 0; i < (geo?.strands.length ?? 0); i++) {
      const strand = geo!.strands[i];
      const buf = strandBufs[i];
      if (!z) {
        gates.push(0);
        glassInk.push(0);
        continue;
      }
      let inside = 0;
      let door = 0;
      for (let k = 0; k <= STRAND_STEPS; k++) {
        if (inClear(z, buf[k * 2], buf[k * 2 + 1])) inside += 1;
        else if (door === 0) door = k;
      }
      const ink = (inside / (STRAND_STEPS + 1)) * strand.length;
      glassInk.push(ink);
      gates.push(ink > GLASS_MAX_INK ? door : 0);
    }
  };

  const drawRibbons = (ctx: Ctx) => {
    if (!geo) return;
    for (let i = 0; i < geo.strands.length; i++) {
      const strand = geo.strands[i];
      if (strand.ribbon <= 0) continue;
      const buf = strandBufs[i];
      const nx = strand.normal.x;
      const ny = strand.normal.y;
      const voice = bandVoice(strand.band) * strand.alpha;
      const start = Math.max(Math.round(0.14 * STRAND_STEPS), gates[i] ?? 0);
      if (start >= STRAND_STEPS) continue;

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
      const gate = gates[i] ?? 0;
      if (gate >= STRAND_STEPS) continue;
      const lane = strand.length;
      const nrm = strand.normal;
      const colour = isDark ? band.dark : band.light;
      const weight =
        band.plasma * (isDark ? 0.95 : 0.86) * (1 + surgeEnergy * 0.3) * bandVoice(strand.band);
      const base = (isDark ? band.darkAlpha : band.lightAlpha) * weight * strand.alpha;
      const strikeAmp = clamp(lane * 0.035, 5, 15);

      // --- anchors: sparse, so the segments between them are straight and angular
      ctx.beginPath();
      ctx.moveTo(buf[gate * 2], buf[gate * 2 + 1]);
      for (let k = 1; k <= STRIKE_ANCHORS; k++) {
        const s = k / STRIKE_ANCHORS;
        const at = Math.max(gate, Math.round(s * STRAND_STEPS));
        if (at === gate) continue;
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
        if (at <= gate) continue;
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

  /**
   * Layer — the incident beam.
   *
   * Four parts, each doing one job:
   *
   *   1. **The body of light**: a straight, soft halo along the optical axis. Straight because
   *      that is where the ray is; soft because light that crosses a page has bloom.
   *   2. **The illustrated field**: the travelling ripple, drawn as the beam's hairline core
   *      plus a hot inner filament. This is the part the eye reads as "wave", and it rides the
   *      axis rather than replacing it — the envelope is zero at both ends, so the ripple can
   *      neither detach from the source nor miss the facet.
   *   3. **The photon packet**: a short bright bunch climbing the same curve, so the beam has a
   *      direction of travel instead of being a static shape.
   *   4. **The Fresnel ghost**: the small fraction of the beam that reflects off the entry face,
   *      drawn from the axis only when the pointer is inside the glass.
   *
   * This runs *before* `drawDissolve` on purpose. The type stencils are paper-coloured, so the
   * beam is thinned exactly where it passes behind a word and stays bright in the gaps between
   * glyphs: light behind type, not light over it. The facet end of the beam is clear of every
   * text rect, so the hinge and the entry spark keep their full strength after the dissolve.
   */
  const drawBeam = (ctx: Ctx) => {
    if (!geo || !beamGrad) return;
    const axis = beamAxis();
    if (!axis) return;
    const { hit, dx, dy, len, nx, ny } = axis;
    const source = geo.source;
    const amp = beamAmplitude(len);
    const steps = len > 360 ? 46 : 24;

    /** The rippled centreline into the current path. */
    const trace = (scale: number) => {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const s = i / steps;
        const off = beamOffset(s, amp) * scale;
        const x = source.x + dx * s + nx * off;
        const y = source.y + dy * s + ny * off;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    };

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = beamGrad;

    /**
     * 1. The bloom. Straight along the axis, and *stacked* rather than drawn as one wide
     *    stroke: a single 13 px stroke at 9% is a flat grey band with two hard edges, which
     *    reads as a smear on the paper and as a shadow on the ink. Three diminishing strokes
     *    fall off the way a real glow does. On paper everything is tighter and fainter — ink
     *    spreads, so the same alpha reads as a smudge rather than as light.
     */
    const halo = isDark
      ? ([
          [19, 0.028],
          [11, 0.05],
        ] as const)
      : ([
          [14, 0.018],
          [8, 0.03],
        ] as const);
    const bloomGain = 1 + beamGlow * 0.3;
    for (const [width, alpha] of halo) {
      ctx.globalAlpha = Math.min(1, alpha * bloomGain);
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(hit.x, hit.y);
      ctx.stroke();
    }

    // 2. The field. A faint wide pass gives the ripple a body so its crests are not wires…
    ctx.globalAlpha = (isDark ? 0.13 : 0.085) + beamGlow * 0.07;
    ctx.lineWidth = 5;
    trace(1);
    ctx.stroke();
    // …the hairline is the beam itself, and it carries the weight of the composition…
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.8 * (1 + beamGlow * 0.15);
    trace(1);
    ctx.stroke();
    // …and a hot filament down the middle keeps it reading as light rather than ink.
    ctx.strokeStyle = "rgba(255,252,245,0.55)";
    ctx.lineWidth = 0.9;
    trace(1);
    ctx.stroke();
    ctx.strokeStyle = beamGrad;

    // 3. The packet: a short bunch riding the same curve, brightest mid-run.
    const p = (time * 0.11) % 1;
    const tail = Math.max(0, p - 0.07);
    if (p > 0.02 && tail > 0) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const s = lerp(tail, p, i / 8);
        const off = beamOffset(s, amp);
        const x = source.x + dx * s + nx * off;
        const y = source.y + dy * s + ny * off;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2.1;
      ctx.globalAlpha = Math.sin(Math.PI * p) * 0.66;
      ctx.stroke();
      ctx.strokeStyle = beamGrad;
    }

    // 4. The Fresnel ghost: measured from the axis, never from the ripple.
    if (optics && pointerInGlass > 0.01) {
      ctx.beginPath();
      ctx.moveTo(hit.x, hit.y);
      ctx.lineTo(hit.x + optics.reflected.x * 100, hit.y + optics.reflected.y * 100);
      ctx.strokeStyle = isDark ? "#fffaf0" : "#655f57";
      ctx.globalAlpha = optics.fresnel * pointerInGlass;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  /**
   * The glass.
   *
   * Read as a solid, not an outline: a shell with a value split across its facets, a crisp rim
   * (ink edge + inner white), one neutral ray, a caustic pool and glints at each vertex.
   * Spectral colour is drawn separately, outside the exit facet.
   */
  const drawGlass = (ctx: Ctx) => {
    if (!geo) return;
    const { topV, leftV, rightV, prismSize } = geo;
    // `geo` is a mutable capture: read what the closures need into locals first.
    const rest = geo.restOptics;
    const hit = liveHit ?? geo.hit;
    const exit = fanOrigin ?? geo.exit;
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
    const poolX =
      rightV.x -
      prismSize * 0.34 +
      (optics
        ? clamp(
            (optics.deviation - deltaMin) * prismSize * 0.3,
            -prismSize * 0.2,
            prismSize * 0.2,
          ) * pointerInGlass
        : 0);
    const poolY = rightV.y + prismSize * 0.11;
    const poolR = prismSize * 0.58;
    const pool = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, poolR);
    pool.addColorStop(0, rgba(warm, (isDark ? 0.2 : 0.14) * (1 + pointerInGlass * 0.7)));
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
    // The near face: the one turned toward the light, from the apex down the incident side.
    const nearFace = ctx.createLinearGradient(topV.x, topV.y, leftV.x, leftV.y);
    nearFace.addColorStop(0, isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)");
    nearFace.addColorStop(1, isDark ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.12)");
    trace();
    ctx.fillStyle = nearFace;
    ctx.fill();

    /**
     * The far face, over it. The fold between the two faces is a *ramp*, not a cut: a polygon
     * seam is a value step of one pixel, and on ink that step reads as a hairline crossing the
     * body — a stroke where there should be glass. Twelve pixels of transition is still a fold
     * (the eye reads an edge at any gradient above ~3 levels) and it is no longer a line.
     */
    const foldX = centroid.x - topV.x;
    const foldY = centroid.y - topV.y;
    const foldLen = Math.hypot(foldX, foldY) || 1;
    const nx = -foldY / foldLen;
    const ny = foldX / foldLen;
    const ramp = Math.max(8, prismSize * 0.055);
    const farFace = ctx.createLinearGradient(
      topV.x - nx * ramp,
      topV.y - ny * ramp,
      topV.x + nx * ramp,
      topV.y + ny * ramp,
    );
    farFace.addColorStop(0, "rgba(0,0,0,0)");
    farFace.addColorStop(0.55, isDark ? "rgba(0,0,0,0.09)" : "rgba(0,0,0,0.03)");
    farFace.addColorStop(1, isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.045)");
    trace();
    ctx.fillStyle = farFace;
    ctx.fill();

    // A whisper of the hue the glass is bending, so the body is not colourless paper.
    const tint = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, prismSize * 0.8);
    tint.addColorStop(0, rgba(warm, isDark ? 0.16 : 0.1));
    tint.addColorStop(1, rgba(warm, 0));
    trace();
    ctx.fillStyle = tint;
    ctx.fill();

    // Cross-fade the resting ray into the live traced one. Both are real solutions — the
    // resting one is `buildGeometry`'s trace of the resting axis — so the cross-fade is a
    // move from one refracted path to another, never from a decorative chord. In particular,
    // a TIR bounce must not snap on at full strength on the first boundary pixel.
    const strokeInternal = (legs: typeof rest.legs, alpha: number) => {
      if (alpha <= 0.001) return;
      ctx.beginPath();
      ctx.moveTo(hit.x, hit.y);
      for (const leg of legs) ctx.lineTo(leg.to.x, leg.to.y);
      const pathLength = legs.reduce((sum, leg) => sum + dist(leg.from, leg.to), 0) || 1;
      // Beer–Lambert attenuation: longer paths through the glass lose more light.
      ctx.globalAlpha = alpha * Math.exp((-0.12 * pathLength) / prismSize);
      ctx.strokeStyle = isDark ? "rgba(255,251,242,0.95)" : "rgba(105,99,90,0.95)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,250,0.55)";
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    strokeInternal(rest.legs, 1 - opticalWeight);
    if (optics) strokeInternal(optics.legs, opticalWeight);

    if (optics && opticalWeight > 0.01 && optics.tir && optics.legs.length) {
      const rim = optics.legs[0].to;
      const flash = ctx.createRadialGradient(rim.x, rim.y, 0, rim.x, rim.y, prismSize * 0.09);
      flash.addColorStop(0, `rgba(255,255,255,${0.7 * opticalWeight})`);
      flash.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(rim.x, rim.y, prismSize * 0.09, 0, TAU);
      ctx.fill();
    }

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

  /** Short wavelength-dependent rays begin on the exit surface, never inside glass.
   * Cauchy's approximation n(λ) = A + B / λ², λ in micrometres. The full-bleed
   * field remains an artistic exaggeration of these physically ordered directions.
   */
  const drawSpectralExit = (ctx: Ctx) => {
    if (!geo || !optics || opticalWeight <= 0.01 || !optics.exitFacet || !optics.legs.length)
      return;
    const last = optics.legs[optics.legs.length - 1];
    const facet =
      optics.exitFacet === "right"
        ? [geo.rightV, geo.topV]
        : optics.exitFacet === "base"
          ? [geo.leftV, geo.rightV]
          : [geo.topV, geo.leftV];
    const edgeLength = dist(facet[0], facet[1]) || 1;
    const tangent = {
      x: (facet[1].x - facet[0].x) / edgeLength,
      y: (facet[1].y - facet[0].y) / edgeLength,
    };
    const legLength = dist(last.from, last.to) || 1;
    const incoming = {
      x: (last.to.x - last.from.x) / legLength,
      y: (last.to.y - last.from.y) / legLength,
    };
    let normal = { x: -tangent.y, y: tangent.x };
    if (incoming.x * normal.x + incoming.y * normal.y < 0) normal = { x: -normal.x, y: -normal.y };
    const sinInternal = incoming.x * tangent.x + incoming.y * tangent.y;
    const wavelengths = [0.65, 0.61, 0.59, 0.55, 0.5, 0.46, 0.43];
    for (const [i, wavelength] of wavelengths.entries()) {
      const index = 1.4868 + 0.004 / (wavelength * wavelength);
      const sinOut = index * sinInternal;
      if (Math.abs(sinOut) >= 1) continue; // this wavelength is still totally reflected
      const cosOut = Math.sqrt(1 - sinOut * sinOut);
      const direction = {
        x: normal.x * cosOut + tangent.x * sinOut,
        y: normal.y * cosOut + tangent.y * sinOut,
      };
      const length = geo.prismSize * 0.22;
      const band = BANDS[i];
      const gradient = ctx.createLinearGradient(
        optics.exit.x,
        optics.exit.y,
        optics.exit.x + direction.x * length,
        optics.exit.y + direction.y * length,
      );
      const color = isDark ? band.dark : band.light;
      const pathLength = optics.legs.reduce((sum, leg) => sum + dist(leg.from, leg.to), 0);
      // A gentle blue-weighted scattering loss (Rayleigh ∝ 1/λ⁴), combined with absorption.
      const transmission = Math.exp(
        (-pathLength / geo.prismSize) * (0.08 + 0.005 / wavelength ** 4),
      );
      gradient.addColorStop(0, rgba(color, 0.7 * transmission));
      gradient.addColorStop(1, rgba(color, 0));
      ctx.strokeStyle = gradient;
      ctx.globalAlpha = opticalWeight;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(optics.exit.x, optics.exit.y);
      ctx.lineTo(optics.exit.x + direction.x * length, optics.exit.y + direction.y * length);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  /** Entry spark: the facet lights where the beam lands. */
  const drawEntrySpark = (ctx: Ctx) => {
    if (!geo) return;
    const hit = liveHit ?? geo.hit;
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
    const { prismSize } = geo;
    const exit = fanOrigin ?? geo.exit;
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
    const beamAmp = beamAmplitude(beamLen);

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
      // On the incident run the packets ride the illustrated field (the same curve the beam
      // is drawn on); past the exit they ride the clay spine. Same param, same speed.
      const point =
        head <= beamLen
          ? beamPoint(head / beamLen, beamAmp)
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

  /**
   * The layer order, as data.
   *
   * Two things about this list are contracts, not style:
   *
   *   - `beam` is painted **before** `dissolve`. The dissolve's stencils are paper-coloured
   *     and radial, so the beam is thinned exactly where it crosses type and stays bright in
   *     the gaps between glyphs. That is what lets light pass *behind* the headline instead of
   *     over it, and it is why nothing has to be redrawn on top of the words.
   *   - `glass`, `core` and the colour in `glass`/`spectrum` are painted **after** it, at full
   *     strength. The glass and its hinge never overlap a text rect at any supported layout,
   *     so they can stay crisp — and the exit spectrum must never be dimmed by a stencil.
   *
   * QA reads this through `geometry().layers` and asserts the order, so the list cannot drift
   * from the painting without the suite failing.
   */
  const SCENE_LAYERS = [
    "plate",
    "fan",
    "beam",
    "dissolve",
    "glass",
    "core",
    "interaction",
    "atmosphere",
  ] as const;

  const paintLayer = (ctx: Ctx, layer: (typeof SCENE_LAYERS)[number]) => {
    if (!geo) return;
    switch (layer) {
      // The drafting plate (cached raster) and the ambient wash that lights the section.
      case "plate": {
        drawPlate(ctx);
        drawAmbient(ctx);
        break;
      }
      // The spectral body, the hairline continuum it lives in, and the plasma.
      case "fan": {
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
        break;
      }
      // The incident beam — behind the type, see above.
      case "beam": {
        drawBeam(ctx);
        break;
      }
      // Type is thinned here; everything below is painted after it.
      case "dissolve": {
        drawDissolve(ctx);
        break;
      }
      // The glass that receives the beam, the colour that leaves it, and the contact point.
      case "glass": {
        drawGlass(ctx);
        drawSpectralExit(ctx);
        drawEntrySpark(ctx);
        break;
      }
      // The core, then the filaments that ground the fan on the catalogue.
      case "core": {
        drawCore(ctx);
        drawGrounds(ctx);
        break;
      }
      // The current reaching for the cursor, then the click wavefronts.
      case "interaction": {
        drawCatch(ctx);
        drawSurges(ctx);
        break;
      }
      case "atmosphere": {
        drawAtmosphere(ctx);
        break;
      }
    }
  };

  const drawScene = (ctx: Ctx) => {
    if (!geo) return;
    ctx.clearRect(0, 0, geo.heroW, geo.heroH);
    ensureCaches(ctx);
    for (const layer of SCENE_LAYERS) paintLayer(ctx, layer);
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
      const inside =
        !!geo && pointerActive && inTri(geo.topV, geo.leftV, geo.rightV, pointerX, pointerY);
      pointerInGlass += ((inside ? 1 : 0) - pointerInGlass) * (1 - Math.exp(-dtMs / 180));
      if (pointerInGlass < 0.001 && !inside) pointerInGlass = 0;
      // Hovering the headline eases the beam up rather than switching it: a snap at the
      // boundary reads as a bug, a 160 ms rise reads as the light noticing the cursor.
      beamGlow += ((headlineHover ? 1 : 0) - beamGlow) * (1 - Math.exp(-dtMs / BEAM_HOVER_TAU_MS));
      updateOptics();

      drawScene(ctx);
    },
    /** one composed still, for reduced-motion visitors and for design review. */
    paintStill(ctx: Ctx) {
      time = 4.6;
      surgeEnergy = 0;
      pointerActive = false;
      pointerEase = 0;
      pointerInGlass = 0;
      liveHit = null;
      optics = null;
      fanOrigin = null;
      fanTurn = 0;
      fanSpread = 1;
      opticalWeight = 0;
      hoverTile = -1;
      headlineHover = false;
      beamGlow = 0;
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
          entryMode: "left-run" as const,
          entryU: 0.58,
          beamAngle: BEAM_ANGLE_WIDE,
          restOptics: tracePrism(
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
          ),
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
        /** The paint order, in order: QA pins the beam-before-dissolve contract here. */
        layers: SCENE_LAYERS,
        /** QA: how much of each lane runs through the body, and where the stroke opens. */
        glass: { ink: glassInk, gates, pad: GLASS_MAX_INK },
        jitterBucket,
        branches: (geo?.strands.length ?? 0) * FORK_AT.length,
        interaction: {
          pointerEase,
          pointerInGlass,
          entryU,
          optics,
          fanOrigin,
          fanTurn,
          fanSpread,
          /**
           * The incident beam's drawn weight, read by the QA dominance invariant. The width
           * includes the soft halo: on ink the beam's read is the halo as much as the core,
           * so comparing only the 1.8 px hairline would understate it by 7×.
           */
          beam: {
            width: (1.8 + (isDark ? 13 : 10)) * (1 + beamGlow * 0.15),
            alpha: 1,
            glow: beamGlow,
            amplitude: geo
              ? beamAmplitude(Math.hypot(geo.hit.x - geo.source.x, geo.hit.y - geo.source.y))
              : 0,
          },
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
    /**
     * QA: sample the incident beam's *illustrated* curve (axis + ripple) without painting.
     * `s = 1` is byte-identical to the live entry point the ray tracer used.
     */
    sampleBeam(s: number) {
      if (!geo) return { x: 0, y: 0, offset: 0 };
      const axis = beamAxis();
      if (!axis) return { x: 0, y: 0, offset: 0 };
      const amp = beamAmplitude(axis.len);
      const offset = beamOffset(s, amp);
      return {
        x: geo.source.x + axis.dx * s + axis.nx * offset,
        y: geo.source.y + axis.dy * s + axis.ny * offset,
        offset,
      };
    },
    /** QA: the beam's optical axis as a function of s (a straight line, by definition). */
    beamAxisAt(s: number) {
      if (!geo) return { x: 0, y: 0 };
      const hit = liveHit ?? geo.hit;
      return {
        x: lerp(geo.source.x, hit.x, s),
        y: lerp(geo.source.y, hit.y, s),
      };
    },
    /** QA: settle the strand buffers without painting (pointer off, t = 4.6). */
    settle() {
      time = 4.6;
      surgeEnergy = 0;
      pointerActive = false;
      pointerEase = 0;
      pointerInGlass = 0;
      liveHit = null;
      optics = null;
      fanOrigin = null;
      fanTurn = 0;
      fanSpread = 1;
      opticalWeight = 0;
      hoverTile = -1;
      headlineHover = false;
      beamGlow = 0;
      surges.length = 0;
      catches.length = 0;
      advanceJitter();
      fillAll();
    },
  };
}
