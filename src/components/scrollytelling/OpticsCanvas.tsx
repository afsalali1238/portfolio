import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  TAU,
  add,
  clamp,
  lerp,
  mix,
  normalize,
  radians,
  scale,
  smoothstep,
  sub,
  ParticleField,
  SPECTRUM,
  cauchyIndex,
  tracePrism,
  type Vec2,
} from "./opticsEngine";
import { surfaceAt } from "./story";
import { canvasSize } from "./runtimeMath";

export interface CanvasFrame {
  progress: number;
  time: number;
  delta: number;
  tilt: number;
  reducedMotion: boolean;
  /** A short-lived, user-triggered charge for the prologue field. */
  energy?: number;
}
export interface OpticsHandle {
  draw: (frame: CanvasFrame) => void;
  ignite: () => void;
}

export const OpticsCanvas = forwardRef<OpticsHandle>(function OpticsCanvas(_props, ref) {
  const element = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<OpticalRenderer | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      draw: (frame) => renderer.current?.draw(frame),
      ignite: () => renderer.current?.ignite(),
    }),
    [],
  );
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !element.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const canvas = element.current;
    let ctx: CanvasRenderingContext2D | null;
    try {
      ctx = canvas.getContext("2d", { alpha: false });
    } catch {
      return;
    }
    if (!ctx) return;
    const engine = new OpticalRenderer(canvas, ctx);
    renderer.current = engine;
    let alive = true,
      ratioQuery: MediaQueryList | null = null;
    const resize = () => engine.resize(canvas.clientWidth, canvas.clientHeight);
    const refreshRatio = () => {
      ratioQuery?.removeEventListener("change", refreshRatio);
      ratioQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      ratioQuery.addEventListener("change", refreshRatio);
      resize();
    };
    const lost = () => engine.contextState(false);
    const restored = () => engine.contextState(true);
    refreshRatio();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("contextlost", lost);
    canvas.addEventListener("contextrestored", restored);
    void document.fonts.ready.then(() => {
      if (alive) engine.resize(canvas.clientWidth, canvas.clientHeight, true);
    });
    return () => {
      alive = false;
      observer.disconnect();
      ratioQuery?.removeEventListener("change", refreshRatio);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("contextlost", lost);
      canvas.removeEventListener("contextrestored", restored);
      engine.destroy();
      if (renderer.current === engine) renderer.current = null;
    };
  }, []);
  return <canvas ref={element} className="optics-canvas" aria-hidden="true" />;
});

/** Canvas is entirely procedural: no images, shader compilation, or network work in the render loop. */
class OpticalRenderer {
  private grid: HTMLCanvasElement;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private cx = 0;
  private cy = 0;
  private radius = 0;
  private left = 0;
  private prismHeight = 0;
  private vertices: Vec2[] = [];
  private mobile = false;
  private drawable = false;
  private lost = false;
  private particles = new ParticleField();
  private previousProgress = 0;
  private previousSurface = -1;
  private shimmerAge = 20;
  private lastFrame: CanvasFrame = {
    progress: 0,
    time: 0,
    delta: 0,
    tilt: 0,
    reducedMotion: false,
    energy: 0,
  };
  private perfDebug = false;
  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {
    this.grid = document.createElement("canvas");
    this.perfDebug = new URLSearchParams(window.location.search).has("thesisPerf");
  }
  resize(width: number, height: number, force = false) {
    const backing = canvasSize(width, height, window.devicePixelRatio || 1);
    if (!backing) {
      this.drawable = false;
      return;
    }
    if (
      !force &&
      this.drawable &&
      this.w === width &&
      this.h === height &&
      this.dpr === backing.ratio
    )
      return;
    this.drawable = true;
    this.w = width;
    this.h = height;
    this.dpr = backing.ratio;
    this.mobile = width < 1024 && height > width * 0.7;
    this.canvas.width = this.grid.width = backing.width;
    this.canvas.height = this.grid.height = backing.height;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // On phones the field has its own clear upper stage rather than shrinking into a faint
    // desktop illustration behind the headline.
    this.cx = width * (this.mobile ? 0.5 : 0.735);
    this.cy = height * (this.mobile ? 0.28 : 0.49);
    this.radius = Math.min(
      width * (this.mobile ? 0.34 : 0.172),
      height * (this.mobile ? 0.22 : 0.263),
    );
    this.prismHeight = Math.min(
      width * (this.mobile ? 0.43 : 0.236),
      height * (this.mobile ? 0.265 : 0.385),
    );
    this.left = this.mobile ? -width * 0.05 : width * 0.488;
    const half = this.prismHeight / Math.sqrt(3);
    this.vertices = [
      { x: this.cx, y: this.cy - (this.prismHeight * 2) / 3 },
      { x: this.cx - half, y: this.cy + this.prismHeight / 3 },
      { x: this.cx + half, y: this.cy + this.prismHeight / 3 },
    ];
    this.cacheGrid();
    this.draw({ ...this.lastFrame, delta: 0 });
  }
  contextState(available: boolean) {
    this.lost = !available;
    if (available) this.resize(this.canvas.clientWidth, this.canvas.clientHeight, true);
  }
  destroy() {
    this.drawable = false;
    this.canvas.width = this.canvas.height = this.grid.width = this.grid.height = 1;
    this.particles.count = 0;
  }
  ignite() {
    if (!this.lastFrame.reducedMotion) this.particles.ignite({ x: this.cx, y: this.cy });
    this.shimmerAge = 0;
  }
  private cacheGrid() {
    const c = this.grid.getContext("2d");
    if (!c) {
      this.drawable = false;
      return;
    }
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = "#0b0c0e";
    c.fillRect(0, 0, this.w, this.h);
    const cell = this.mobile ? 52 : 96;
    c.lineWidth = 0.5;
    c.strokeStyle = this.mobile ? "rgba(210,218,227,0.075)" : "rgba(210,218,227,0.055)";
    c.setLineDash([1, 5]);
    c.beginPath();
    for (let x = this.cx % cell; x < this.w; x += cell) {
      c.moveTo(x, 96);
      c.lineTo(x, this.h - 78);
    }
    for (let y = this.cy % cell; y < this.h - 76; y += cell) {
      if (y < 100) continue;
      c.moveTo(32, y);
      c.lineTo(this.w - 32, y);
    }
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "rgba(210,218,227,.07)";
    for (let i = 0; i < 48; i++) {
      const x = (((i * 421 + 73) % 1237) / 1237) * this.w;
      const y = (((i * 137 + 37) % 997) / 997) * this.h;
      c.fillRect(x, y, i % 6 === 0 ? 1.3 : 0.7, i % 6 === 0 ? 1.3 : 0.7);
    }
  }
  draw(frame: CanvasFrame) {
    this.lastFrame = frame;
    if (!this.drawable || this.lost) return;
    const paintStart = this.perfDebug ? performance.now() : 0;
    const debugWindow = this.perfDebug
      ? (window as Window & {
          __thesisCanvasDraws?: number;
          __thesisCanvasPaintCosts?: number[];
        })
      : null;
    if (debugWindow) debugWindow.__thesisCanvasDraws = (debugWindow.__thesisCanvasDraws ?? 0) + 1;
    const { progress: p, time: clock, delta, reducedMotion, energy = 0 } = frame;
    const t = reducedMotion ? 0 : clock / 1000;
    const c = this.ctx;
    c.drawImage(this.grid, 0, 0, this.w, this.h);
    this.shimmerAge += Math.min(delta, 0.05);
    if (p >= 0.1 && this.previousProgress < 0.1) this.ignite();
    this.previousProgress = p;
    this.particles.update(reducedMotion ? 0.05 : delta);
    this.instrument(p, t, reducedMotion, energy);
    if (p < 0.24) this.origin(p, t);
    if (energy > 0.015 && p < 0.54) this.explorer(energy, t, frame.tilt);
    if (p >= 0.21 && p < 0.382) this.vacuum(p, t, frame.tilt);
    if (p >= 0.38 && p < 0.505) this.gauntlet(p, t);
    else this.previousSurface = -1;
    const prismAlpha = smoothstep(0.485, 0.535, p);
    if (prismAlpha > 0) this.optics(p, t, frame.tilt, prismAlpha);
    this.drawParticles(reducedMotion);
    // A single, low-luminance, indigo bloom; never a full-screen strobe.
    if (this.shimmerAge < 1.7 && !reducedMotion) {
      const fade = Math.exp(-this.shimmerAge * 3.7);
      const g = c.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, this.radius * 2.1);
      g.addColorStop(0, `rgba(105,116,184,${fade * 0.12})`);
      g.addColorStop(1, "rgba(44,47,87,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, this.w, this.h);
      c.strokeStyle = `rgba(224,227,245,${fade * 0.5})`;
      c.lineWidth = 0.6;
      c.beginPath();
      c.arc(this.cx, this.cy, 5 + this.shimmerAge * this.radius * 1.5, 0, TAU);
      c.stroke();
    }
    if (debugWindow) {
      const costs =
        debugWindow.__thesisCanvasPaintCosts ?? (debugWindow.__thesisCanvasPaintCosts = []);
      costs.push(performance.now() - paintStart);
      if (costs.length > 512) costs.splice(0, costs.length - 512);
    }
  }
  private label(text: string, x: number, y: number, alpha = 0.4, align: CanvasTextAlign = "left") {
    if (this.h < 520) return;
    const c = this.ctx;
    c.font = `12px "IBM Plex Mono", monospace`;
    c.fillStyle = `rgba(208,213,220,${alpha})`;
    c.textAlign = align;
    c.fillText(text, x, y);
    c.textAlign = "left";
  }
  private line(a: Vec2, b: Vec2, color: string, width = 0.7, alpha = 1) {
    const c = this.ctx;
    c.globalAlpha = alpha;
    c.strokeStyle = color;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
    c.globalAlpha = 1;
  }
  private ray(a: Vec2, b: Vec2, color = "#eeeee7", alpha = 1, glow = true) {
    if (glow) {
      this.line(a, b, color, 8, alpha * 0.028);
      this.line(a, b, color, 2.5, alpha * 0.12);
    }
    this.line(a, b, color, 0.85, alpha);
  }
  private instrument(p: number, time: number, reduced: boolean, energy: number) {
    const c = this.ctx,
      { cx, cy, radius: r } = this;
    // The prologue plate remains calm but intentionally legible on low-contrast phone panels.
    // A small extra charge answers deliberate pointer and tap input without becoming a dashboard.
    const interaction = clamp(energy);
    const visibility = lerp(1, 0.62, smoothstep(0.48, 0.7, p));
    c.save();
    this.line(
      { x: cx - r - 42, y: cy },
      { x: cx + r + 42, y: cy },
      "#b5bac2",
      0.6,
      (0.24 + interaction * 0.14) * visibility,
    );
    this.line(
      { x: cx, y: cy - r - 25 },
      { x: cx, y: cy + r + 25 },
      "#b5bac2",
      0.6,
      (0.24 + interaction * 0.14) * visibility,
    );
    c.lineWidth = 0.55;
    c.strokeStyle = `rgba(196,204,218,${(0.38 + interaction * 0.16) * visibility})`;
    c.beginPath();
    c.arc(cx, cy, r, 0, TAU);
    c.stroke();
    c.setLineDash([1, 7]);
    c.strokeStyle = `rgba(196,204,218,${(0.33 + interaction * 0.15) * visibility})`;
    c.beginPath();
    c.arc(cx, cy, r * 0.86, 0, TAU);
    c.stroke();
    c.setLineDash([]);
    for (let i = 0; i < 72; i++) {
      const angle = (TAU * i) / 72,
        inner = r + (i % 6 === 0 ? 7 : 2),
        outer = r + (i % 6 === 0 ? 15 : 5),
        tickAlpha = (i % 6 === 0 ? 0.5 : 0.27) * visibility + interaction * 0.08;
      c.strokeStyle = `rgba(196,204,218,${tickAlpha})`;
      c.beginPath();
      c.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      c.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      c.stroke();
    }
    if (p < 0.22) {
      c.strokeStyle = `rgba(220,224,232,${(0.4 + interaction * 0.13) * visibility})`;
      c.beginPath();
      c.arc(cx, cy, r, -1.8 + time * 0.035, -1.8 + time * 0.035 + 0.6);
      c.stroke();
      c.save();
      c.translate(cx, cy);
      c.rotate(-0.52);
      c.strokeStyle = `rgba(196,204,218,${(0.3 + interaction * 0.12) * visibility})`;
      c.beginPath();
      c.ellipse(0, 0, r * 1.15, r * 0.27, 0, 0, TAU);
      c.stroke();
      c.restore();
      const halo = c.createRadialGradient(cx, cy, 0, cx, cy, r * 0.9);
      halo.addColorStop(
        0,
        `rgba(162,169,190,${(reduced ? 0.095 : 0.1 + Math.sin(time * 0.6) * 0.018 + interaction * 0.08) * visibility})`,
      );
      halo.addColorStop(1, "rgba(162,169,190,0)");
      c.fillStyle = halo;
      c.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    const corners = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    c.strokeStyle = `rgba(196,204,218,${(0.42 + interaction * 0.12) * visibility})`;
    for (const [dx, dy] of corners) {
      const x = cx + dx * (r + 29),
        y = cy + dy * (r + 29);
      c.beginPath();
      c.moveTo(x, y - dy * 9);
      c.lineTo(x, y);
      c.lineTo(x - dx * 9, y);
      c.stroke();
    }
    c.restore();
  }
  private origin(p: number, t: number) {
    const c = this.ctx;
    const point = mix(
      { x: this.cx, y: this.cy },
      { x: this.left, y: this.cy },
      smoothstep(0.145, 0.235, p),
    );
    const pulse = 0.68 + Math.sin(t * 1.8) * 0.14;
    const g = c.createRadialGradient(point.x, point.y, 0, point.x, point.y, 26);
    g.addColorStop(0, `rgba(231,235,249,${pulse * 0.25})`);
    g.addColorStop(0.13, "rgba(231,235,249,.045)");
    g.addColorStop(1, "rgba(231,235,249,0)");
    c.fillStyle = g;
    c.fillRect(point.x - 26, point.y - 26, 52, 52);
    c.fillStyle = "#eeeee7";
    c.beginPath();
    c.arc(point.x, point.y, 1.7, 0, TAU);
    c.fill();
    c.strokeStyle = "rgba(222,226,237,.55)";
    c.lineWidth = 0.65;
    c.beginPath();
    c.moveTo(point.x - 13, point.y);
    c.lineTo(point.x - 5, point.y);
    c.moveTo(point.x + 5, point.y);
    c.lineTo(point.x + 13, point.y);
    c.moveTo(point.x, point.y - 13);
    c.lineTo(point.x, point.y - 5);
    c.moveTo(point.x, point.y + 5);
    c.lineTo(point.x, point.y + 13);
    c.stroke();
    if (p < 0.145 && !this.mobile)
      this.label("A POINT OF POSSIBILITY", point.x, point.y + this.radius * 0.63, 0.5, "center");
  }
  /**
   * A compact, touch-triggered trace for the opening field. It is intentionally separate from
   * the essay's scroll narrative: readers can test the metaphor before they begin reading.
   */
  private explorer(energy: number, time: number, tilt: number) {
    const c = this.ctx;
    const charge = clamp(energy);
    const alpha = 0.22 + charge * 0.7;
    const size = this.radius * 0.98;
    const vertices: Vec2[] = [
      { x: this.cx, y: this.cy - size * 0.58 },
      { x: this.cx - size * 0.62, y: this.cy + size * 0.5 },
      { x: this.cx + size * 0.62, y: this.cy + size * 0.5 },
    ];
    const entryAim = mix(vertices[0], vertices[1], 0.55);
    const source = { x: this.cx - this.radius * 1.45, y: this.cy };
    const baseAngle = Math.atan2(entryAim.y - source.y, entryAim.x - source.x);
    const direction = {
      x: Math.cos(baseAngle + tilt * 0.23),
      y: Math.sin(baseAngle + tilt * 0.23),
    };
    const reference = tracePrism(source, direction, vertices, cauchyIndex(680));
    if (!reference) return;

    c.save();
    c.beginPath();
    c.moveTo(vertices[0].x, vertices[0].y);
    c.lineTo(vertices[1].x, vertices[1].y);
    c.lineTo(vertices[2].x, vertices[2].y);
    c.closePath();
    const prismFill = c.createLinearGradient(
      vertices[1].x,
      vertices[0].y,
      vertices[2].x,
      vertices[1].y,
    );
    prismFill.addColorStop(0, `rgba(219,230,241,${alpha * 0.13})`);
    prismFill.addColorStop(0.52, `rgba(146,171,206,${alpha * 0.035})`);
    prismFill.addColorStop(1, `rgba(218,232,244,${alpha * 0.17})`);
    c.fillStyle = prismFill;
    c.fill();
    c.strokeStyle = `rgba(232,239,246,${alpha * 0.9})`;
    c.lineWidth = this.mobile ? 1 : 0.8;
    c.stroke();
    c.restore();

    this.ray(source, reference.entry, "#f4f1e9", alpha * 0.96);
    this.ray(reference.entry, reference.exit, "#eef1eb", alpha * 0.72);
    const exitBaseAngle = Math.atan2(reference.outgoing.y, reference.outgoing.x);

    SPECTRUM.forEach((band) => {
      const trace = tracePrism(source, direction, vertices, cauchyIndex(band.wavelength));
      if (!trace) return;
      this.ray(trace.entry, trace.exit, band.color, alpha * 0.58);
      const outgoingAngle = Math.atan2(trace.outgoing.y, trace.outgoing.x);
      const spreadAngle = exitBaseAngle + (outgoingAngle - exitBaseAngle) * 8.5;
      const reach = this.radius * (1.08 + charge * 1.1);
      const pulse = Math.sin(time * 3.5 + band.wavelength * 0.015) * this.radius * 0.025;
      const end = add(trace.exit, {
        x: Math.cos(spreadAngle) * (reach + pulse),
        y: Math.sin(spreadAngle) * (reach + pulse),
      });
      this.ray(trace.exit, end, band.color, (0.26 + charge * 0.58) * 0.9);
    });

    const impact = c.createRadialGradient(
      reference.entry.x,
      reference.entry.y,
      0,
      reference.entry.x,
      reference.entry.y,
      23,
    );
    impact.addColorStop(0, `rgba(244,247,238,${alpha * 0.55})`);
    impact.addColorStop(1, "rgba(244,247,238,0)");
    c.fillStyle = impact;
    c.fillRect(reference.entry.x - 23, reference.entry.y - 23, 46, 46);
  }
  private vacuum(p: number, t: number, tilt: number) {
    const start = { x: this.left, y: this.cy },
      angle = radians(tilt * 15);
    const distance = (this.w - this.left + 100) * smoothstep(0.22, 0.32, p);
    const end = add(start, { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
    this.ray(start, end);
    const c = this.ctx;
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(start.x, start.y, 1.9, 0, TAU);
    c.fill();
    const pulse = ((t * 0.28) % 1) * distance;
    const pos = add(start, { x: Math.cos(angle) * pulse, y: Math.sin(angle) * pulse });
    c.fillStyle = "rgba(255,255,255,.75)";
    c.fillRect(pos.x - 1, pos.y - 1, 2, 2);
  }
  private gauntlet(p: number, t: number) {
    const c = this.ctx,
      stage = surfaceAt(p),
      x = this.cx,
      y = this.cy;
    const source = { x: this.left, y },
      end = { x, y };
    const alpha = 1 - smoothstep(0.485, 0.505, p);
    if (stage === 1 && this.previousSurface !== 1 && !this.lastFrame.reducedMotion)
      this.particles.ignite(end, 0.45, 48);
    this.previousSurface = stage;
    if (stage === 0) {
      this.ray(source, end, "#edeee9", alpha);
      this.ray({ x, y: y + 3 }, { x: this.left - 30, y: y + 3 }, "#c0c5cb", 0.6 * alpha);
      this.line({ x, y: y - 112 }, { x, y: y + 112 }, "#e3e5e6", 1, alpha);
      this.line({ x: x + 4, y: y - 112 }, { x: x + 4, y: y + 112 }, "#a0a6b3", 0.5, 0.45 * alpha);
      for (let i = -5; i <= 5; i++)
        this.line(
          { x: x + 5, y: y + i * 20 },
          { x: x + 13, y: y + i * 20 - 8 },
          "#c7cbd1",
          0.5,
          0.22 * alpha,
        );
    } else if (stage === 1) {
      this.ray(source, end, "#edeee9", alpha);
      c.fillStyle = "#121316";
      c.strokeStyle = `rgba(211,215,222,${0.5 * alpha})`;
      c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(x + 26, y - 108);
      for (let i = 0; i < 15; i++) c.lineTo(x + (i % 2 === 0 ? 4 : -9), y - 108 + i * 15);
      c.lineTo(x + 48, y + 102);
      c.lineTo(x + 48, y - 108);
      c.closePath();
      c.fill();
      c.stroke();
      for (let i = 0; i < 22; i++) {
        const a = i * 2.39 + Math.sin(t) * 0.04,
          l = 12 + ((i * 19) % 56),
          start = { x: x + Math.cos(a) * 5, y: y + Math.sin(a) * 5 };
        this.line(
          start,
          { x: x + Math.cos(a) * l, y: y + Math.sin(a) * l },
          "#d7d8d4",
          0.6,
          alpha * (0.18 + Math.sin(t * 2 + i) ** 2 * 0.34),
        );
      }
    } else if (stage === 2) {
      const gradient = c.createLinearGradient(x - 40, y, x + 50, y);
      gradient.addColorStop(0, `rgba(242,242,236,${alpha})`);
      gradient.addColorStop(1, "rgba(242,242,236,0)");
      this.ray(source, { x: x - 40, y }, "#edeee9", alpha);
      c.fillStyle = "#050608";
      c.fillRect(x - 4, y - 100, 111, 200);
      c.strokeStyle = `rgba(200,205,216,${0.1 * alpha})`;
      c.lineWidth = 0.5;
      c.strokeRect(x - 4, y - 100, 111, 200);
      c.strokeStyle = gradient;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(x - 40, y);
      c.lineTo(x + 50, y);
      c.stroke();
    }
  }
  private prism(alpha: number) {
    const c = this.ctx,
      [a, b, d] = this.vertices;
    const gradient = c.createLinearGradient(b.x, a.y, d.x, b.y);
    gradient.addColorStop(0, `rgba(212,221,237,${alpha * 0.09})`);
    gradient.addColorStop(0.45, `rgba(182,203,223,${alpha * 0.017})`);
    gradient.addColorStop(0.72, `rgba(191,211,234,${alpha * 0.047})`);
    gradient.addColorStop(1, `rgba(212,227,243,${alpha * 0.11})`);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.lineTo(d.x, d.y);
    c.closePath();
    c.fillStyle = gradient;
    c.fill();
    c.lineWidth = 0.75;
    c.strokeStyle = `rgba(224,230,237,${alpha * 0.73})`;
    c.stroke();
    c.save();
    c.clip();
    const inset = this.mobile ? 3 : 4;
    c.beginPath();
    c.moveTo(a.x, a.y + inset * 2);
    c.lineTo(b.x + inset * 1.6, b.y - inset);
    c.lineTo(d.x - inset * 1.6, d.y - inset);
    c.closePath();
    c.strokeStyle = `rgba(230,235,244,${alpha * 0.18})`;
    c.lineWidth = 0.5;
    c.stroke();
    const reflection = c.createLinearGradient(a.x - 26, a.y, a.x + 30, b.y);
    reflection.addColorStop(0, "rgba(222,234,244,0)");
    reflection.addColorStop(0.48, `rgba(222,234,244,${0.07 * alpha})`);
    reflection.addColorStop(0.5, `rgba(222,234,244,${0.13 * alpha})`);
    reflection.addColorStop(0.53, "rgba(222,234,244,0)");
    c.fillStyle = reflection;
    c.fillRect(b.x, a.y, d.x - b.x, b.y - a.y);
    this.line(mix(a, b, 0.06), mix(b, d, 0.58), "#b7c4d7", 0.5, alpha * 0.08);
    this.line(mix(a, d, 0.02), mix(b, d, 0.34), "#d3dfe9", 0.5, alpha * 0.09);
    c.restore();
    // Construction lines keep the prism tactile without turning the reading field into a diagram.
    if (!this.mobile) {
      this.line({ x: b.x, y: b.y + 22 }, { x: d.x, y: d.y + 22 }, "#a0a8b8", 0.5, 0.18 * alpha);
      this.line({ x: b.x, y: b.y + 17 }, { x: b.x, y: b.y + 27 }, "#a0a8b8", 0.5, 0.32 * alpha);
      this.line({ x: d.x, y: d.y + 17 }, { x: d.x, y: d.y + 27 }, "#a0a8b8", 0.5, 0.32 * alpha);
    }
  }
  private wavefronts(
    start: Vec2,
    end: Vec2,
    spacing: number,
    velocity: number,
    time: number,
    alpha: number,
    color = "#e1e5e7",
  ) {
    const c = this.ctx,
      d = sub(end, start),
      distance = Math.hypot(d.x, d.y);
    if (distance < 1) return;
    const direction = normalize(d),
      normal = { x: -direction.y, y: direction.x };
    const offset = (time * velocity) % spacing;
    c.strokeStyle = color;
    c.globalAlpha = alpha;
    c.lineWidth = 0.6;
    c.beginPath();
    for (let pos = offset; pos < distance; pos += spacing) {
      const center = add(start, scale(direction, pos)),
        half = this.mobile ? 4 : 6;
      c.moveTo(center.x + normal.x * half, center.y + normal.y * half);
      c.lineTo(center.x - normal.x * half, center.y - normal.y * half);
    }
    c.stroke();
    c.globalAlpha = 1;
  }
  private optics(p: number, t: number, tilt: number, alpha: number) {
    const c = this.ctx;
    this.prism(alpha);
    const aim = mix(this.vertices[0], this.vertices[1], 0.6);
    // A 69.7° incidence produces a ~32° bend at n=1.52, derived using Snell's law.
    const angle = radians(lerp(0, -39.7, smoothstep(0.53, 0.61, p)) + tilt * 3);
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    const origin = sub(aim, scale(direction, (aim.x - this.left) / direction.x));
    const white = tracePrism(origin, direction, this.vertices);
    if (!white) return;
    const entry = white.entry,
      compression = smoothstep(0.54, 0.7, p),
      dispersion = smoothstep(0.72, 0.85, p),
      emergence = smoothstep(0.88, 0.987, p);
    this.ray(origin, entry, "#f3f0e8", alpha);
    c.fillStyle = "#f3f0e8";
    c.beginPath();
    c.arc(origin.x, origin.y, 1.6, 0, TAU);
    c.fill();
    this.ray(
      entry,
      mix(entry, white.exit, compression),
      "#edf1ec",
      alpha * (1 - dispersion * 0.92),
    );
    if (compression > 0) {
      this.wavefronts(origin, entry, 24, 46, t, alpha * compression * 0.5);
      this.wavefronts(
        entry,
        mix(entry, white.exit, compression),
        lerp(24, 8, compression),
        46 / 1.52,
        t,
        alpha * compression * (1 - dispersion) * 0.72,
      );
    }
    const g = c.createRadialGradient(entry.x, entry.y, 0, entry.x, entry.y, 21);
    g.addColorStop(0, `rgba(239,243,235,${alpha * 0.22})`);
    g.addColorStop(1, "rgba(239,243,235,0)");
    c.fillStyle = g;
    c.fillRect(entry.x - 21, entry.y - 21, 42, 42);
    if (p > 0.55 && p < 0.75 && !this.mobile) {
      c.setLineDash([3, 5]);
      const normal = scale(white.normal, 64);
      this.line(sub(entry, normal), add(entry, normal), "#acb8c9", 0.6, alpha * 0.32);
      c.setLineDash([]);
    }
    if (dispersion > 0) {
      const baseAngle = Math.atan2(white.outgoing.y, white.outgoing.x);
      for (let i = 0; i < SPECTRUM.length; i++) {
        const band = SPECTRUM[i],
          trace = tracePrism(origin, direction, this.vertices, cauchyIndex(band.wavelength));
        if (!trace) continue;
        // True Cauchy dispersion within the glass; separation exaggerated only after emergence.
        this.ray(trace.entry, trace.exit, band.color, dispersion * 0.91);
        if (emergence > 0 && !trace.totalInternalReflection) {
          const theta =
            baseAngle +
            (Math.atan2(trace.outgoing.y, trace.outgoing.x) - baseAngle) * (1 + emergence * 8);
          const reach = Math.hypot(this.w, this.h) * 1.35 * emergence;
          const end = add(trace.exit, { x: Math.cos(theta) * reach, y: Math.sin(theta) * reach });
          const bloom = c.createLinearGradient(trace.exit.x, trace.exit.y, end.x, end.y);
          bloom.addColorStop(0, `rgba(${band.rgb},0)`);
          bloom.addColorStop(0.4, `rgba(${band.rgb},${0.018 * emergence})`);
          bloom.addColorStop(1, `rgba(${band.rgb},${0.005 * emergence})`);
          c.fillStyle = bloom;
          c.beginPath();
          c.moveTo(trace.exit.x, trace.exit.y);
          c.lineTo(end.x, end.y - 30 * emergence);
          c.lineTo(end.x, end.y + 30 * emergence);
          c.closePath();
          c.fill();
          this.ray(trace.exit, end, band.color, dispersion * 0.88);
          c.fillStyle = band.color;
          c.globalAlpha = emergence * 0.55;
          c.beginPath();
          c.arc(trace.exit.x, trace.exit.y, 1.5, 0, TAU);
          c.fill();
          c.globalAlpha = 1;
        }
      }
    }
  }
  private drawParticles(reduced: boolean) {
    if (reduced) return;
    const c = this.ctx,
      data = this.particles.data;
    for (let i = 0; i < this.particles.count; i++) {
      const j = i * 6,
        life = data[j + 4] / data[j + 5];
      if (life <= 0) continue;
      c.strokeStyle = `rgba(219,224,238,${life * 0.8})`;
      c.lineWidth = i % 4 === 0 ? 1 : 0.55;
      c.beginPath();
      c.moveTo(data[j], data[j + 1]);
      c.lineTo(data[j] - data[j + 2] * 0.012, data[j + 1] - data[j + 3] * 0.012);
      c.stroke();
    }
  }
}
