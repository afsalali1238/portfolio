/**
 * hero-ray — the drawing engine behind the hero's dispersion field.
 *
 * One continuous, physically coherent light chain:
 *
 *   coherent ray leaves the last sentence → glass prism → internal caustics
 *   → incandescent core → spectral fan → grounds on the stat tiles
 *
 * Phase 1 (this revision): layout-driven geometry, the seven spectral ribbons, the glass
 * and the core. Tesla plasma, grounding filaments, the drafting plate and the dissolve mask
 * land in later phases.
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

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

export type Rgb = readonly [number, number, number];

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
};

const onFacet = (a: Vec, b: Vec, t: number): Vec => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

const dist = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.y - b.y);

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
  translate?(x: number, y: number): void;
  /** debug overlay only */
  font?: string;
  textAlign?: string;
  fillText?(text: string, x: number, y: number): void;
};

export type Gradient = { addColorStop(stop: number, color: string): void };

export type HeroRay = ReturnType<typeof createHeroRay>;

/* -------------------------------------------------------------------------- engine */

export function createHeroRay() {
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

  const strandBufs = BANDS.map(() => new Float32Array((STRAND_STEPS + 1) * 2));
  /** the incident beam's own scratch buffer: no allocation inside the loop */
  const beamBuf = new Float32Array((36 + 1) * 2);

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

    // Fan targets sit off the right edge and stay in angular order: no crossings.
    const yTop = heroH * (mobile ? -0.05 : -0.02);
    const yBottom = heroH * (mobile ? 0.55 : 1.02);
    const targets = BANDS.map((_, i) => ({
      x: heroW + 80,
      y: lerp(yTop, yBottom, i / (BANDS.length - 1)),
    }));

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

      // Ripples grow with distance: the core is dense, the frame edges are calm.
      const scale = amp * Math.pow(s, 0.35);

      let off =
        (Math.sin(TAU * band.cycles * s - omega + phase) * scale +
          Math.sin(TAU * 2.3 * band.cycles * s + omega * 1.35) * scale * 0.26) *
        env;

      // Magnetic lean toward the pointer: ≤10px, strongest mid-span, never at the root.
      if (pointerActive) {
        const bx = exit.x + dx * s;
        const by = exit.y + dy * s;
        const d = Math.hypot(leanX - bx, leanY - by);
        if (d < 170) {
          const pull = Math.pow(1 - d / 170, 2) * 10;
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

  /** Layer 2 — spectral body: seven tapered ribbons, one gradient each. */
  const drawRibbons = (ctx: Ctx) => {
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
      const maxHalf = band.ribbon * (1 + surgeEnergy * 0.22);

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
  };

  /** Spine pass: thin, bright centre lines that give the ribbons an edge of light. */
  const drawSpines = (ctx: Ctx) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < BANDS.length; i++) {
      const band = BANDS[i];
      const colour = isDark ? band.dark : band.light;
      const alpha = (isDark ? band.darkAlpha : band.lightAlpha) * (1 + surgeEnergy * 0.25);
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

    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 6.5;
    ctx.stroke();

    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1.2;
    ctx.stroke();
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

  /** The core: where refraction becomes emission. Provisional in phase 1. */
  const drawCore = (ctx: Ctx) => {
    if (!geo) return;
    const { exit, prismSize } = geo;
    const pulse = 1 + Math.sin(time * TAU * 1.5) * 0.05 + surgeEnergy * 0.5;
    const r = prismSize * 0.28 * pulse;
    const warm = isDark ? BANDS[2].dark : BANDS[2].light;

    const bloom = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, r);
    bloom.addColorStop(0, "rgba(255,255,252,0.96)");
    bloom.addColorStop(0.18, rgba(warm, isDark ? 0.72 : 0.6));
    bloom.addColorStop(0.5, rgba(warm, isDark ? 0.18 : 0.13));
    bloom.addColorStop(1, rgba(warm, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, r, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.97)";
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 1.9 * pulse, 0, TAU);
    ctx.fill();
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
    for (let i = 0; i < BANDS.length; i++) fillStrand(strandBufs[i], BANDS[i], i);

    drawRibbons(ctx);
    drawSpines(ctx);
    drawBeam(ctx);
    drawGlass(ctx);
    drawEntrySpark(ctx);
    drawCore(ctx);
    if (debug) drawDebug(ctx);
    void dtMs;
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
    addSurge(x: number, y: number, at: number) {
      void x;
      void y;
      void at;
      surgeEnergy = 1;
    },
    /** advance one frame and paint. */
    paint(ctx: Ctx, dtMs: number, now: number) {
      void now;
      time += dtMs / 1000;
      surgeEnergy = Math.max(0, surgeEnergy - dtMs / 900);
      leanX += (pointerX - leanX) * Math.min(1, dtMs / 90);
      leanY += (pointerY - leanY) * Math.min(1, dtMs / 90);
      drawScene(ctx, dtMs);
    },
    /** one composed still, for reduced-motion visitors and for design review. */
    paintStill(ctx: Ctx) {
      time = 4.6;
      surgeEnergy = 0;
      pointerActive = false;
      drawScene(ctx, 0);
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
      for (let i = 0; i < BANDS.length; i++) fillStrand(strandBufs[i], BANDS[i], i);
    },
  };
}
