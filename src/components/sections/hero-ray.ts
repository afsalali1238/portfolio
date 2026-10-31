/**
 * hero-ray — the drawing engine behind the hero's dispersion field.
 *
 * A single continuous kinematic chain:
 *
 *   incident beam (top edge) → facet hit point → internal caustic → exit core → fan
 *
 * Every strand's displacement envelope is exactly 0 at both ends, so no vertex can
 * drift off the glass or detach from the core. Entry and exit points are parametric
 * positions on the prism's facets, never free-floating offsets.
 *
 * Art direction: brand ramp only. Clay carries the chromatics; the remaining six
 * strands are warm ink tones. Dispersion is expressed through weight and opacity,
 * not hue. The fan is full-bleed, the beam is copy-safe (it enters over the empty
 * right column), and interaction is calm: photons, a breathing core, a magnetic
 * lean toward the pointer, and one soft surge per click.
 *
 * The engine is framework-free and DOM-free so it can be driven by React in the
 * browser and rendered headlessly for design review.
 */

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const STRAND_STEPS = 46;
const MOTE_COUNT = 14;

export type Rgb = readonly [number, number, number];

export type BandSpec = {
  light: { rgb: Rgb; alpha: number };
  dark: { rgb: Rgb; alpha: number };
  width: number;
  amplitude: number;
  frequency: number;
  speed: number;
  flagship?: boolean;
};

type RgbStop = readonly [number, number, number];

const CLAY_LIGHT: RgbStop = [168, 71, 27];
const CLAY_DARK: RgbStop = [230, 126, 84];
const INK_LIGHT: RgbStop = [92, 84, 75];
const INK_DARK: RgbStop = [186, 176, 166];

const mixRgb = (a: RgbStop, b: RgbStop, t: number): RgbStop => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

/**
 * A dense, centre-weighted tonal fan. Many thin rays read as light; a handful of
 * thick ones read as wires. The centre ray is the flagship: full clay, heaviest
 * weight, incandescent filament.
 */
function buildBands(count = 21): BandSpec[] {
  const mid = (count - 1) / 2;
  return Array.from({ length: count }, (_, i) => {
    const d = mid === 0 ? 0 : Math.abs(i - mid) / mid;
    const t = Math.pow(d, 0.5);
    const alpha = lerp(0.6, 0.24, Math.pow(d, 0.7));
    return {
      light: { rgb: mixRgb(CLAY_LIGHT, INK_LIGHT, t), alpha },
      dark: { rgb: mixRgb(CLAY_DARK, INK_DARK, t), alpha: lerp(0.8, 0.16, Math.pow(d, 0.85)) },
      width: lerp(1.9, 0.7, d),
      amplitude: lerp(5.2, 3.2, d),
      frequency: lerp(1.15, 1.7, d),
      speed: (i % 2 === 0 ? 1 : -1) * lerp(0.13, 0.2, d),
      flagship: d === 0,
    };
  });
}

export const BANDS: readonly BandSpec[] = buildBands();

type Vec = { x: number; y: number };
type Surge = { x: number; y: number; at: number };
type Mote = { x: number; y: number; vx: number; vy: number; r: number; a: number };

const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const onFacet = (a: Vec, b: Vec, t: number): Vec => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

/** Minimal 2D context surface — satisfied by both DOM canvas and node-canvas. */
export type Ctx = {
  save(): void;
  restore(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  fill(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  stroke(): void;
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
};

export type Gradient = { addColorStop(stop: number, color: string): void };

export type HeroRay = ReturnType<typeof createHeroRay>;

export function createHeroRay() {
  let cssW = 0;
  let cssH = 0;

  let time = 0;
  let isDark = false;
  let surgeEnergy = 0;

  let topV: Vec = { x: 0, y: 0 };
  let leftV: Vec = { x: 0, y: 0 };
  let rightV: Vec = { x: 0, y: 0 };
  let hit: Vec = { x: 0, y: 0 };
  let exit: Vec = { x: 0, y: 0 };
  let targets: Vec[] = [];
  let prismSize = 96;
  let isMobile = false;
  let beamSrc: Vec = { x: 0, y: 0 };

  const strandBuf = BANDS.map(() => new Float32Array((STRAND_STEPS + 1) * 2));

  let pointerActive = false;
  let pointerX = 0;
  let pointerY = 0;
  let leanX = 0;
  let leanY = 0;
  const surges: Surge[] = [];

  const motes: Mote[] = Array.from({ length: MOTE_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.01,
    vy: (Math.random() - 0.5) * 0.01,
    r: 0.6 + Math.random() * 0.9,
    a: 0.04 + Math.random() * 0.06,
  }));

  const buildStage = () => {
    const mobile = cssW < 768;
    isMobile = mobile;
    prismSize = mobile
      ? clamp(Math.min(cssW, cssH) * 0.2, 64, 96)
      : clamp(Math.min(cssW, cssH) * 0.3, 92, 182);

    const cx = cssW * (mobile ? 0.86 : 0.7);
    const cy = cssH * (mobile ? 0.085 : 0.47);

    topV = { x: cx, y: cy - prismSize * 0.88 };
    leftV = { x: cx - prismSize * 0.52, y: cy + prismSize * 0.58 };
    rightV = { x: cx + prismSize * 0.52, y: cy + prismSize * 0.58 };

    hit = onFacet(topV, leftV, 0.3);
    exit = onFacet(topV, rightV, 0.52);

    // The beam enters from above the prism, over the empty right column.
    beamSrc = { x: cssW * (mobile ? 0.79 : 0.6), y: -30 };

    // The fan runs off the right edge, spread across the hero's full height.
    const topY = cssH * (mobile ? 0.0 : 0.01);
    const botY = cssH * (mobile ? 0.26 : 1.02);
    stageVersion += 1;
    targets = BANDS.map((_, i) => ({
      x: cssW + 80,
      y: lerp(topY, botY, i / (BANDS.length - 1)),
    }));
  };

  /* ------------------------------------------------------- strand paths */

  // Envelope is exactly 0 at s = 0 and s = 1: roots and tips stay welded.
  const fillStrand = (buf: Float32Array, band: BandSpec, index: number) => {
    const target = targets[index];
    const dx = target.x - exit.x;
    const dy = target.y - exit.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ts = time * band.speed;
    const amp = band.amplitude * (1 + surgeEnergy * 0.35);

    for (let i = 0; i <= STRAND_STEPS; i++) {
      const s = i / STRAND_STEPS;
      const env = Math.pow(Math.sin(s * Math.PI), 0.9);

      let off =
        (Math.sin(s * band.frequency * Math.PI - ts + index * 0.55) * amp +
          Math.sin(s * band.frequency * 2.3 * Math.PI + ts * 1.2) * amp * 0.18) *
        env;

      // Magnetic lean toward the cursor, strongest mid-span, never at the root.
      if (pointerActive) {
        const bx = exit.x + dx * s;
        const by = exit.y + dy * s;
        const d = Math.hypot(leanX - bx, leanY - by);
        if (d < 170) {
          const pull = Math.pow(1 - d / 170, 2) * 10 * env;
          const side = Math.sign((leanX - bx) * nx + (leanY - by) * ny) || 1;
          off += pull * side;
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

  /* ------------------------------------------------------------ drawing */

  let sleeveGrads: Gradient[] = [];
  let strandGrads: Gradient[] = [];
  let sleeveKey = "";
  let stageVersion = 0;

  const drawApertureGlow = (ctx: Ctx) => {
    const clay: Rgb = isDark ? [230, 126, 84] : [168, 71, 27];
    const r = Math.min(cssW, cssH) * 0.72;
    const glow = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, r);
    glow.addColorStop(0, rgba(clay, isDark ? 0.08 : 0.05));
    glow.addColorStop(0.42, rgba(clay, isDark ? 0.022 : 0.014));
    glow.addColorStop(1, rgba(clay, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, cssW, cssH);
  };

  const drawFanVolumes = (ctx: Ctx) => {
    const key = `${stageVersion}:${isDark ? "d" : "l"}`;
    if (key !== sleeveKey) {
      sleeveGrads = BANDS.map((band, i) => {
        const spec = isDark ? band.dark : band.light;
        const g = ctx.createLinearGradient(exit.x, exit.y, targets[i].x, targets[i].y);
        const a = spec.alpha * (band.flagship ? 0.4 : 0.3);
        g.addColorStop(0, rgba(spec.rgb, 0));
        g.addColorStop(0.16, rgba(spec.rgb, a * 0.55));
        g.addColorStop(0.9, rgba(spec.rgb, a));
        g.addColorStop(1, rgba(spec.rgb, 0));
        return g;
      });

      const clay: Rgb = isDark ? [230, 126, 84] : [168, 71, 27];
      strandGrads = BANDS.map((band, i) => {
        const spec = isDark ? band.dark : band.light;
        const g = ctx.createLinearGradient(exit.x, exit.y, targets[i].x, targets[i].y);
        g.addColorStop(0, rgba(clay, spec.alpha * 0.9));
        g.addColorStop(0.3, rgba(spec.rgb, spec.alpha));
        g.addColorStop(1, rgba(spec.rgb, spec.alpha * 0.82));
        return g;
      });
      sleeveKey = key;
    }

    for (let i = 0; i < BANDS.length; i++) {
      const band = BANDS[i];
      const buf = strandBuf[i];
      const target = targets[i];
      const dx = target.x - exit.x;
      const dy = target.y - exit.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const maxHalf = (band.flagship ? 9 : 5.5) * (1 + surgeEnergy * 0.25);

      ctx.fillStyle = sleeveGrads[i];
      ctx.beginPath();
      // Outbound edge, widening with distance.
      for (let j = 0; j <= STRAND_STEPS; j++) {
        const t = j / STRAND_STEPS;
        const half = 0.5 + Math.pow(t, 1.35) * maxHalf;
        const x = buf[j * 2] + nx * half;
        const y = buf[j * 2 + 1] + ny * half;
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Return edge.
      for (let j = STRAND_STEPS; j >= 0; j--) {
        const t = j / STRAND_STEPS;
        const half = 0.5 + Math.pow(t, 1.35) * maxHalf;
        ctx.lineTo(buf[j * 2] - nx * half, buf[j * 2 + 1] - ny * half);
      }
      ctx.closePath();
      ctx.fill();
    }
  };

  const drawStrands = (ctx: Ctx) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (let i = 0; i < BANDS.length; i++) {
      const band = BANDS[i];
      const spec = isDark ? band.dark : band.light;
      const alpha = spec.alpha * (1 + surgeEnergy * 0.25);

      trace(ctx, strandBuf[i]);

      // Soft ionised sleeve (replaces shadowBlur entirely).
      ctx.globalAlpha = alpha * 0.18;
      ctx.strokeStyle = strandGrads[i] ?? rgba(spec.rgb, 1);
      ctx.lineWidth = band.width * 5.5;
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.lineWidth = band.width;
      ctx.stroke();

      if (band.flagship) {
        ctx.globalAlpha = alpha * 0.55;
        ctx.strokeStyle = "rgba(255,252,246,0.85)";
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  };

  const drawRay = (ctx: Ctx) => {
    const dx = hit.x - beamSrc.x;
    const dy = hit.y - beamSrc.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const steps = 52;
    const amp = 4.2 * (1 + surgeEnergy * 0.4);

    const grad = ctx.createLinearGradient(beamSrc.x, beamSrc.y, hit.x, hit.y);
    const warm: Rgb = isDark ? [230, 126, 84] : [168, 71, 27];
    grad.addColorStop(0, rgba(warm, 0));
    grad.addColorStop(0.18, rgba(warm, 0.26));
    grad.addColorStop(0.72, rgba(warm, 0.46));
    grad.addColorStop(1, rgba(isDark ? [255, 252, 246] : [168, 71, 27], 0.7));

    const point = (s: number): Vec => {
      const env = Math.sin(s * Math.PI);
      const off =
        (Math.sin(s * 2.6 * Math.PI - time * 1.8) * amp +
          Math.sin(s * 5.2 * Math.PI + time * 1.1) * amp * 0.18) *
        env;
      return { x: beamSrc.x + dx * s + nx * off, y: beamSrc.y + dy * s + ny * off };
    };

    ctx.strokeStyle = grad;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Halo pass
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const pt = point(i / steps);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Core pass
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Photons, released from the top edge into the glass.
    for (let p = 0; p < 3; p++) {
      const s = (time * 0.12 + p * 0.33) % 1;
      const pt = point(s);
      const fade = clamp((s - 0.04) / 0.14, 0, 1);
      if (fade <= 0) continue;
      ctx.globalAlpha = 0.7 * fade;
      ctx.fillStyle = isDark ? "#FFFCF6" : "#A8471B";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.5, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  const drawPrism = (ctx: Ctx) => {
    const tint = ctx.createLinearGradient(topV.x, topV.y, rightV.x, rightV.y);
    tint.addColorStop(0, isDark ? "rgba(248,246,240,0.08)" : "rgba(255,255,253,0.52)");
    tint.addColorStop(0.65, isDark ? "rgba(248,246,240,0.03)" : "rgba(255,255,253,0.24)");
    tint.addColorStop(1, isDark ? "rgba(255,252,246,0.02)" : "rgba(255,255,253,0.1)");

    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y);
    ctx.lineTo(leftV.x, leftV.y);
    ctx.lineTo(rightV.x, rightV.y);
    ctx.closePath();
    ctx.fillStyle = tint;
    ctx.fill();

    ctx.strokeStyle = isDark ? "rgba(248,246,240,0.44)" : "rgba(26,23,20,0.4)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Bright inner edge along the incident facet — reads as a cut-crystal highlight.
    ctx.beginPath();
    ctx.moveTo(topV.x, topV.y + 0.6);
    ctx.lineTo(leftV.x + 0.6, leftV.y);
    ctx.strokeStyle = isDark ? "rgba(255,252,246,0.35)" : "rgba(255,255,255,0.85)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Refraction begins inside the glass: three internal chords converging on the core.
    const chordT = [0.42, 0.52, 0.62];
    for (const t of chordT) {
      const to = onFacet(topV, rightV, t);
      ctx.beginPath();
      ctx.moveTo(hit.x, hit.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = isDark
        ? `rgba(230,126,84,${t === 0.52 ? 0.4 : 0.14})`
        : `rgba(168,71,27,${t === 0.52 ? 0.3 : 0.1})`;
      ctx.lineWidth = t === 0.52 ? 1 : 0.7;
      ctx.stroke();
    }

    // Warm caustic pooling toward the exit facet.
    const caustic = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, prismSize * 0.52);
    caustic.addColorStop(0, isDark ? "rgba(230,126,84,0.16)" : "rgba(168,71,27,0.1)");
    caustic.addColorStop(1, isDark ? "rgba(230,126,84,0)" : "rgba(168,71,27,0)");
    ctx.fillStyle = caustic;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, prismSize * 0.52, 0, TAU);
    ctx.fill();

    // Drafting ticks at the vertices.
    const t = 2.6;
    ctx.strokeStyle = isDark ? "rgba(248,246,240,0.4)" : "rgba(26,23,20,0.3)";
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

  const drawCore = (ctx: Ctx) => {
    const pulse = 1 + Math.sin(time * 1.5) * 0.05 + surgeEnergy * 0.5;
    const r = prismSize * 0.28 * pulse;
    const clay: Rgb = isDark ? [230, 126, 84] : [168, 71, 27];

    const bloom = ctx.createRadialGradient(exit.x, exit.y, 0, exit.x, exit.y, r);
    bloom.addColorStop(0, "rgba(255,255,252,0.98)");
    bloom.addColorStop(0.2, rgba(clay, isDark ? 0.7 : 0.6));
    bloom.addColorStop(0.52, rgba(clay, isDark ? 0.18 : 0.13));
    bloom.addColorStop(1, rgba(clay, 0));
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, r, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, 1.9 * pulse, 0, TAU);
    ctx.fill();
  };

  const drawEntrySpark = (ctx: Ctx) => {
    const clay: Rgb = isDark ? [230, 126, 84] : [168, 71, 27];
    const r = 7 * (1 + surgeEnergy * 0.4);
    const spark = ctx.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, r);
    spark.addColorStop(0, "rgba(255,255,252,0.95)");
    spark.addColorStop(0.28, rgba(clay, 0.45));
    spark.addColorStop(1, rgba(clay, 0));
    ctx.fillStyle = spark;
    ctx.beginPath();
    ctx.arc(hit.x, hit.y, r, 0, TAU);
    ctx.fill();
  };

  const drawMotes = (ctx: Ctx, dtMs: number) => {
    const step = dtMs / 1000;
    for (const mote of motes) {
      mote.x += mote.vx * step;
      mote.y += mote.vy * step;
      if (mote.x < 0) mote.x = 1;
      if (mote.x > 1) mote.x = 0;
      if (mote.y < 0) mote.y = 1;
      if (mote.y > 1) mote.y = 0;

      ctx.fillStyle = isDark
        ? `rgba(248,246,240,${mote.a.toFixed(3)})`
        : `rgba(26,23,20,${(mote.a * 0.7).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(mote.x * cssW, mote.y * cssH, mote.r, 0, TAU);
      ctx.fill();
    }
  };

  const drawSurges = (ctx: Ctx, now: number) => {
    for (let i = surges.length - 1; i >= 0; i--) {
      const s = surges[i];
      const age = now - s.at;
      if (age > 950) {
        surges.splice(i, 1);
        continue;
      }
      const p = age / 950;
      const radius = 8 + Math.pow(p, 0.62) * 230;
      const clay: Rgb = isDark ? [230, 126, 84] : [168, 71, 27];

      ctx.strokeStyle = rgba(clay, (1 - p) * 0.26);
      ctx.lineWidth = 1 * (1 - p * 0.5);
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, TAU);
      ctx.stroke();

      if (p < 0.55) {
        ctx.strokeStyle = rgba(clay, (1 - p * 1.7) * 0.14);
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius * 0.7, 0, TAU);
        ctx.stroke();
      }
    }
  };

  const drawScene = (ctx: Ctx, dtMs: number, now: number) => {
    ctx.clearRect(0, 0, cssW, cssH);

    for (let i = 0; i < BANDS.length; i++) fillStrand(strandBuf[i], BANDS[i], i);

    drawRay(ctx);
    if (!isMobile) {
      drawApertureGlow(ctx);
      drawFanVolumes(ctx);
      drawStrands(ctx);
    }
    drawPrism(ctx);
    drawEntrySpark(ctx);
    drawCore(ctx);
    drawMotes(ctx, dtMs);
    drawSurges(ctx, now);
  };

  return {
    resize(width: number, height: number) {
      cssW = Math.max(1, width);
      cssH = Math.max(1, height);
      buildStage();
    },
    setTheme(dark: boolean) {
      isDark = dark;
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
      surges.push({ x, y, at });
      surgeEnergy = 1;
    },
    /** advance one frame and paint. */
    paint(ctx: Ctx, dtMs: number, now: number) {
      time += dtMs / 1000;
      surgeEnergy = Math.max(0, surgeEnergy - dtMs / 900);
      // Light damping so the lean feels magnetic rather than snappy.
      leanX += (pointerX - leanX) * Math.min(1, dtMs / 90);
      leanY += (pointerY - leanY) * Math.min(1, dtMs / 90);
      drawScene(ctx, dtMs, now);
    },
    /** one composed still for reduced-motion visitors. */
    paintStill(ctx: Ctx) {
      time = 4.6;
      surgeEnergy = 0;
      pointerActive = false;
      drawScene(ctx, 0, 0);
    },
    geometry() {
      return { topV, leftV, rightV, hit, exit, targets, beamSrc, prismSize, cssW, cssH };
    },
  };
}
