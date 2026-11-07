import { useEffect, useRef } from "react";
import { CICADA_GRID_W, CICADA_GRID_H, CICADA_GRID_DATA } from "./cicadaGridData";

/**
 * CicadaBackground — the cicada living inside the page background of /the-man-behind.
 *
 * The canvas spans the whole hero section (positioned absolutely, pointer-events-none) and
 * paints a full-bleed environment: falling glyph rain across the entire hero, and the cicada
 * itself rendered with deliberate contrast hierarchy — membrane fill, emerald wing veins with
 * shimmer, dark/bright body, strongest edge contour, brightest eyes. The subject melts into
 * the page at the canvas edges (radial alpha falloff on the fill, canvas bg = page bg).
 *
 * Interaction: pointer movement illuminates nearby glyphs and bends the rain, the cicada
 * parallaxes a few px toward the pointer, taps fire a "chirp" brightness wave from the tap
 * point, and touch devices without a hover get a synthetic drifting point after 6s idle.
 *
 * Performance mirrors HeroPrism: DPR cap + backing-store cap, ResizeObserver sizing,
 * idle half-rate after 2.5s, sleep after 20s, hidden-tab pause, offscreen pause,
 * prefers-reduced-motion renders one static frame, full cleanup on unmount.
 */

/* ---- tuning constants ---- */
/** Above this many device pixels the canvas drops resolution rather than the frame rate. */
const MAX_BACKING_PIXELS = 2_200_000;
/** Ambient motion runs at half rate once nothing has interacted for this long. */
const IDLE_HALF_RATE_AFTER_MS = 2_500;
/** How long a scroll gesture keeps the loop at full 60 fps before dropping back to 30 fps idle. */
const SCROLL_WAKE_MS = 400;
/** Keep the chirp wave at display rate for this long after a tap. */
const CLICK_WAKE_MS = 850;
/** After this long without interaction, the rAF loop quietly rests at 0 fps. */
const SLEEP_IDLE_AFTER_MS = 20_000;
/** Touch screens never hover: after this long without a real touch, drift a synthetic point. */
const AUTONOMOUS_RESUME_MS = 6_000;
/** Just under one 30 fps frame, so a 60 Hz display paints every second callback. */
const HALF_RATE_MIN_STEP_MS = 1000 / 30 - 2;
/** Minimum drag distance (px) before a touch gesture is treated as scroll/pan instead of tap. */
const TOUCH_TAP_SLOP_PX = 10;
const BREATH_AMP = 0.005;
const SWAY_AMP = 3;
const PARALLAX_AMP = 6;
/** Pointer influence radius for glyph illumination. */
const POINTER_RADIUS = 120;
/** Chirp wave lifetime and geometry. */
const CHIRP_MS = 750;
const CHIRP_SPEED = 0.45;
const CHIRP_BAND = 34;
const CHIRP_ORIGIN = 60;
/** Max concurrent chirp waves (rapid taps replace the oldest). */
const MAX_PULSES = 3;

/* ---- grid precomputation (module scope: computed once) ---- */
const GRID_W = CICADA_GRID_W;
const GRID_H = CICADA_GRID_H;
const VALS = new Uint8Array(GRID_W * GRID_H);
const EDGE = new Uint8Array(GRID_W * GRID_H);
for (let i = 0; i < VALS.length; i++) VALS[i] = CICADA_GRID_DATA.charCodeAt(i) - 48;
for (let gy = 0; gy < GRID_H; gy++) {
  for (let gx = 0; gx < GRID_W; gx++) {
    const idx = gy * GRID_W + gx;
    if (VALS[idx] === 0) continue;
    const left = gx > 0 ? VALS[idx - 1] : 0;
    const right = gx < GRID_W - 1 ? VALS[idx + 1] : 0;
    const up = gy > 0 ? VALS[idx - GRID_W] : 0;
    const down = gy < GRID_H - 1 ? VALS[idx + GRID_W] : 0;
    if (left === 0 || right === 0 || up === 0 || down === 0) EDGE[idx] = 1;
  }
}

const CHARS = "0123456789ABCDEF";

/* ---- colour helpers ---- */
type RGB = [number, number, number];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** oklch → sRGB (CSS Color 4 matrices + transfer curves) so canvas gets real rgba values. */
function oklchToRgb(l: number, c: number, hDeg: number): RGB {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;
  const lin = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  return [
    Math.round(clamp01(lin(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3)) * 255),
    Math.round(clamp01(lin(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3)) * 255),
    Math.round(clamp01(lin(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3)) * 255),
  ];
}

/** Parse a `oklch(L C H)` token from the stylesheet; null means "let the browser parse it". */
function parseToken(raw: string): RGB | null {
  const m = raw
    .trim()
    .match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i);
  return m ? oklchToRgb(Number(m[1]), Number(m[2]), Number(m[3])) : null;
}

const rgba = (rgb: RGB, a: number) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a.toFixed(3)})`;

type Palette = {
  dark: boolean;
  paper: RGB;
  ink: RGB;
  inkMute: RGB;
  emerald: RGB;
};

const readPalette = (): Palette => {
  const style = getComputedStyle(document.documentElement);
  const dark = document.documentElement.classList.contains("dark");
  const fallback = dark
    ? {
        paper: oklchToRgb(0.15, 0.012, 60),
        ink: oklchToRgb(0.97, 0.008, 90),
        inkMute: oklchToRgb(0.6, 0.01, 70),
      }
    : {
        paper: oklchToRgb(0.972, 0.008, 90),
        ink: oklchToRgb(0.18, 0.012, 60),
        inkMute: oklchToRgb(0.52, 0.012, 60),
      };
  return {
    dark,
    paper: parseToken(style.getPropertyValue("--paper")) ?? fallback.paper,
    ink: parseToken(style.getPropertyValue("--ink")) ?? fallback.ink,
    inkMute: parseToken(style.getPropertyValue("--ink-mute")) ?? fallback.inkMute,
    // Emerald accent matches the site's established accent (Tailwind emerald-400).
    emerald: [52, 211, 153],
  };
};

/* ---- rendering roles ---- */
type Role = "membrane" | "membraneStrong" | "body" | "crossVein" | "mainVein" | "eye" | "edge";

/** [light theme, dark theme] base alpha per role — deliberate contrast hierarchy. */
const BASE_ALPHA: Record<Role, [number, number]> = {
  membrane: [0.11, 0.1],
  membraneStrong: [0.17, 0.15],
  body: [0.62, 0.7],
  crossVein: [0.5, 0.55],
  mainVein: [0.72, 0.78],
  eye: [0.92, 0.95],
  edge: [0.8, 0.85],
};

const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const roleColor = (role: Role, p: Palette): RGB => {
  if (role === "body") return p.ink;
  if (role === "membrane" || role === "membraneStrong") {
    return p.dark ? mix(p.ink, p.emerald, 0.45) : p.ink;
  }
  if (role === "edge") return p.dark ? mix(p.ink, p.emerald, 0.3) : p.ink;
  return p.emerald; // crossVein, mainVein, eye
};

/** Eyes stay eyes; otherwise the outline is the strongest structural signal. */
const roleOf = (val: number, isEdge: boolean): Role => {
  if (val >= 9) return "eye";
  if (isEdge) return "edge";
  if (val >= 8) return "mainVein";
  if (val >= 7) return "crossVein";
  if (val >= 5) return "body";
  if (val >= 3) return "membraneStrong";
  return "membrane";
};

export function CicadaBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // The engine listens on the hero section the canvas lives in (the canvas itself is
    // pointer-events-none so it never blocks the foreground copy or controls).
    const hero = canvas.closest<HTMLElement>("[data-cicada-hero]");
    if (!hero) return;

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReduced = reducedQuery.matches;
    const hoverQuery = window.matchMedia("(hover: hover)");
    let autonomous = !hoverQuery.matches;

    let raf = 0;
    let running = false;
    let inView = true;
    let cssW = 0;
    let cssH = 0;
    let rectLeft = 0;
    let rectTop = 0;
    let lastPaintTs = 0;
    let lastPointerTs = performance.now();
    let lastScrollTs = 0;
    let lastTapTs = -Infinity;
    let tick = 0;
    let palette = readPalette();
    let resizeQueued = false;

    // Pointer state (canvas-local CSS px).
    let pointerInside = false;
    let pointerActive = false;
    let px = 0;
    let py = 0;
    let illumActive = false;
    let parallaxX = 0;
    let lastRealPointerAt = 0;
    let touch: { id: number; x0: number; y0: number; moved: boolean } | null = null;
    const pulses: { t0: number; x: number; y: number }[] = [];

    /* ---- sizing ---- */
    const effectiveDpr = (w: number, h: number) => {
      const base = Math.min(window.devicePixelRatio || 1, 2);
      const pixels = w * h * base * base;
      if (pixels <= MAX_BACKING_PIXELS) return base;
      return Math.max(1, base * Math.sqrt(MAX_BACKING_PIXELS / pixels));
    };

    const commitCanvas = () => {
      const dpr = effectiveDpr(cssW, cssH);
      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);
      const changed =
        Math.abs(targetW - canvas.width) / Math.max(1, canvas.width) > 0.02 ||
        Math.abs(targetH - canvas.height) / Math.max(1, canvas.height) > 0.02;
      if (changed) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      // Work in CSS pixels: the context transform absorbs the device pixel ratio.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const measure = () => {
      const rect = hero.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
    };

    const resize = () => {
      measure();
      commitCanvas();
      if (!running) paintStill();
    };

    const queueResize = () => {
      if (resizeQueued) return;
      resizeQueued = true;
      const run = () => {
        resizeQueued = false;
        resize();
      };
      requestAnimationFrame(run);
    };

    /* ---- paint ---- */
    const paint = (now: number, still: boolean) => {
      const p = palette;
      // Canvas background is the page background: the cicada melts into the section.
      ctx.fillStyle = rgba(p.paper, 1);
      ctx.fillRect(0, 0, cssW, cssH);

      const cell = Math.max(7, Math.floor(Math.min(cssW / 88, cssH / 60)));
      ctx.font = `600 ${cell - 1}px Menlo, Monaco, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const cols = Math.floor(cssW / cell);
      const rows = Math.floor(cssH / cell);
      const tSec = now / 1000;

      // --- background rain: columns bend toward the illumination point ---
      if (!still) {
        const emeraldFill = rgba(p.emerald, 1);
        const trailFill = rgba(p.inkMute, 1);
        for (let c = 0; c < cols; c++) {
          const speed = 0.6 + ((c * 7) % 5) * 0.18;
          const head = ((tick * speed + c * 13) % (rows + 8)) - 4;
          let bend = 0;
          if (illumActive) {
            const dx = c * cell - px;
            bend = Math.max(-1.5, Math.min(1.5, -dx / 90)) * Math.exp(-Math.abs(dx) / 160);
          }
          const headX = c * cell + cell / 2;
          const headR = Math.floor(head);
          if (headR >= 0 && headR < rows) {
            ctx.fillStyle = emeraldFill;
            ctx.globalAlpha = illumActive ? 0.16 : 0.1;
            ctx.fillText(
              CHARS[(c * 31 + headR * 7 + (tick >> 3)) % 16],
              headX,
              headR * cell + cell / 2,
            );
          }
          ctx.fillStyle = trailFill;
          for (let k = 1; k <= 3; k++) {
            const r = headR - k;
            if (r < 0 || r >= rows) continue;
            ctx.globalAlpha = (illumActive ? 0.13 : 0.085) - k * 0.02;
            ctx.fillText(
              CHARS[(c * 31 + r * 7 + (tick >> 3)) % 16],
              headX + bend * k * 2,
              r * cell + cell / 2,
            );
          }
        }
        ctx.globalAlpha = 1;
      }

      // --- cicada ---
      const breathe = still ? 1 : 1 + Math.sin(now * 0.0011) * BREATH_AMP;
      const sway = still ? 0 : Math.sin(now * 0.0006) * SWAY_AMP;
      // Fit by height; on narrow screens the wings bleed past the canvas edges (full-bleed).
      const targetH = cssH * 0.84 * breathe;
      const targetW = targetH * (GRID_W / GRID_H);
      const ox = (cssW - targetW) / 2 + sway + parallaxX * PARALLAX_AMP;
      // Shifted down so the head sits just below the hero copy instead of behind the heading.
      const oy = (cssH - targetH) / 2 + cssH * 0.09;
      const invTW = GRID_W / targetW;
      const invTH = GRID_H / targetH;

      const roleFills = new Map<Role, string>();
      const fillFor = (role: Role) => {
        let fill = roleFills.get(role);
        if (!fill) {
          fill = rgba(roleColor(role, p), 1);
          roleFills.set(role, fill);
        }
        return fill;
      };

      const pulseCount = pulses.length;
      let lastRole: Role | null = null;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cell + cell / 2;
          const y = r * cell + cell / 2;
          // Grid cells covered by this canvas cell (a cell spans ~2 grid cells here).
          const gx0 = Math.floor((x - cell / 2 - ox) * invTW);
          const gx1 = Math.floor((x + cell / 2 - ox) * invTW);
          const gy0 = Math.floor((y - cell / 2 - oy) * invTH);
          const gy1 = Math.floor((y + cell / 2 - oy) * invTH);
          if (gx1 < 0 || gx0 >= GRID_W || gy1 < 0 || gy0 >= GRID_H) continue;
          const x0 = Math.max(0, gx0);
          const x1 = Math.min(GRID_W - 1, gx1);
          const y0 = Math.max(0, gy0);
          const y1 = Math.min(GRID_H - 1, gy1);
          let val = 0;
          let edge = 0;
          for (let gy = y0; gy <= y1; gy++) {
            const rowOff = gy * GRID_W;
            for (let gx = x0; gx <= x1; gx++) {
              const idx = rowOff + gx;
              const v = VALS[idx];
              if (v > val) val = v;
              if (EDGE[idx]) edge = 1;
            }
          }
          if (val === 0) continue;

          const role = roleOf(val, edge === 1);
          const [la, da] = BASE_ALPHA[role];
          let a = p.dark ? da : la;

          // Subtle deterministic membrane flicker.
          if (role === "membrane" || role === "membraneStrong") {
            a *=
              0.93 + 0.07 * Math.sin(tSec * 1.7 + (x - ox) * invTW * 0.3 + (y - oy) * invTH * 0.22);
          }
          // Abdominal segmentation: alternating bands across the body.
          if (role === "body") a *= y0 & 1 ? 0.88 : 1;
          // Wing-vein shimmer: phase-offset intensity traveling across the veins.
          if (role === "mainVein") {
            a *=
              1 +
              0.28 *
                (0.5 +
                  0.5 * Math.sin(tSec * 3 + (x - ox) * invTW * 0.18 + (y - oy) * invTH * 0.11));
          }

          // Pointer illumination.
          let boost = 0;
          if (illumActive) {
            const d = Math.hypot(x - px, y - py);
            if (d < POINTER_RADIUS) boost += (1 - d / POINTER_RADIUS) * 0.5;
          }
          // Chirp pulses: an expanding brightness wave from each tap.
          for (let pi = 0; pi < pulseCount; pi++) {
            const pulse = pulses[pi];
            const age = (now - pulse.t0) / CHIRP_MS;
            if (age > 1) continue;
            const d = Math.hypot(x - pulse.x, y - pulse.y);
            const ring = age * Math.hypot(cssW, cssH) * CHIRP_SPEED;
            const band = Math.abs(d - ring);
            if (band < CHIRP_BAND) boost += (1 - band / CHIRP_BAND) * (1 - age) * 0.85;
            if (d < CHIRP_ORIGIN) boost += (1 - d / CHIRP_ORIGIN) * (1 - age) * 0.45;
          }
          a = Math.min(1, a + boost);

          // Edge melt: the fill dims toward the canvas border so the subject sinks into the
          // page — never the outline, veins or eyes, which stay at full structural strength.
          if (role === "membrane" || role === "membraneStrong" || role === "body") {
            const fr = Math.max(
              Math.abs(x - cssW / 2) / (cssW / 2),
              Math.abs(y - cssH / 2) / (cssH / 2),
            );
            if (fr > 0.78) a *= 1 - 0.22 * Math.min(1, (fr - 0.78) / 0.22);
          }

          if (role !== lastRole) {
            lastRole = role;
            ctx.fillStyle = fillFor(role);
          }
          ctx.globalAlpha = a;
          ctx.fillText(CHARS[(r * 31 + c * 17 + (tick >> 4)) % 16], x, y);
        }
      }
      ctx.globalAlpha = 1;

      for (let i = pulses.length - 1; i >= 0; i--) {
        if (now - pulses[i].t0 > CHIRP_MS) pulses.splice(i, 1);
      }
    };

    const paintStill = () => {
      measure();
      commitCanvas();
      tick = 0;
      paint(performance.now(), true);
    };

    /* ---- loop ---- */
    const frame = (ts: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);

      const elapsed = lastPaintTs === 0 ? 16 : ts - lastPaintTs;
      lastPaintTs = ts;
      const now = performance.now();
      const pointerIdle = now - lastPointerTs > IDLE_HALF_RATE_AFTER_MS;
      const scrollIdle = now - lastScrollTs > SCROLL_WAKE_MS;
      const tapIdle = now - lastTapTs > CLICK_WAKE_MS;
      // Idle: paint every other callback (the ambient motion is slow; 30 fps is enough).
      if (pointerIdle && scrollIdle && tapIdle && elapsed < HALF_RATE_MIN_STEP_MS) return;

      // Synthetic drift on touch / no-pointer devices after 6s without a real touch.
      const drifting =
        autonomous && !pointerActive && now - lastRealPointerAt > AUTONOMOUS_RESUME_MS;
      if (drifting) {
        px = cssW / 2 + Math.sin(now * 0.0004) * cssW * 0.22;
        py = cssH / 2 + Math.cos(now * 0.00031) * cssH * 0.2;
        illumActive = true;
      } else if (illumActive && !pointerActive) {
        illumActive = false;
      }
      // Parallax: the cicada drifts a few px toward the illumination point, smoothly.
      const target = illumActive ? (px / cssW - 0.5) * 2 : 0;
      parallaxX += (target - parallaxX) * 0.08;

      // After prolonged total idle, quietly rest at 0 fps until interaction wakes it.
      const canSleep =
        pointerIdle &&
        scrollIdle &&
        tapIdle &&
        !pointerInside &&
        !drifting &&
        now - lastRealPointerAt > SLEEP_IDLE_AFTER_MS;
      if (canSleep) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }

      tick++;
      paint(now, false);
    };

    const syncLoop = () => {
      const shouldRun = inView && !document.hidden && !prefersReduced;
      if (shouldRun && !running) {
        running = true;
        lastPaintTs = 0;
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
        if (prefersReduced) paintStill();
      }
    };

    const wakeLoop = () => {
      if (!running && inView && !document.hidden && !prefersReduced) syncLoop();
    };

    const chirp = (x: number, y: number) => {
      pulses.push({ t0: performance.now(), x, y });
      if (pulses.length > MAX_PULSES) pulses.shift();
      lastTapTs = performance.now();
      wakeLoop();
    };

    /* ---- pointer events (on the hero section; the canvas stays pointer-events-none) ---- */
    const onPointerMove = (e: PointerEvent) => {
      if (touch && e.pointerId === touch.id) {
        if (Math.hypot(e.clientX - touch.x0, e.clientY - touch.y0) > TOUCH_TAP_SLOP_PX) {
          touch.moved = true;
        }
      }
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      const inside = x >= 0 && x <= cssW && y >= 0 && y <= cssH;
      pointerInside = inside;
      if (inside) {
        px = x;
        py = y;
        pointerActive = true;
        lastPointerTs = performance.now();
        lastRealPointerAt = performance.now();
        wakeLoop();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
      }
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      if (x >= 0 && x <= cssW && y >= 0 && y <= cssH) {
        px = x;
        py = y;
        pointerActive = true;
        pointerInside = true;
      }
      lastPointerTs = performance.now();
      lastRealPointerAt = performance.now();
      wakeLoop();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (touch) {
        if (e.pointerId !== touch.id) return;
        const t = touch;
        touch = null;
        if (t.moved) return; // a drag/scroll gesture, not a tap
        const x = e.clientX - rectLeft;
        const y = e.clientY - rectTop;
        if (x < 0 || x > cssW || y < 0 || y > cssH) return;
        chirp(x, y);
        return;
      }
      if (e.button !== 0) return;
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      if (x < 0 || x > cssW || y < 0 || y > cssH) return;
      chirp(x, y);
    };

    const onPointerLeave = () => {
      pointerInside = false;
      pointerActive = false;
      touch = null;
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (touch && e.pointerId === touch.id) touch = null;
    };

    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      if (inView) {
        lastScrollTs = performance.now();
        wakeLoop();
      }
    };

    const onVisibility = () => syncLoop();

    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      if (prefersReduced) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
        paintStill();
      } else {
        syncLoop();
      }
    };

    const onHoverChange = (e: MediaQueryListEvent) => {
      autonomous = !e.matches;
    };

    /* ---- observers ---- */
    const resizeObs = new ResizeObserver(queueResize);
    resizeObs.observe(hero);

    const visObs = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncLoop();
      },
      { threshold: 0.02 },
    );
    visObs.observe(hero);

    const themeObs = new MutationObserver(() => {
      palette = readPalette();
      if (!running) paintStill();
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    /* ---- wire up ---- */
    hero.addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("pointerdown", onPointerDown, { passive: true });
    hero.addEventListener("pointerup", onPointerUp, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave);
    hero.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reducedQuery.addEventListener("change", onMotionChange);
    hoverQuery.addEventListener("change", onHoverChange);

    resize();
    if (prefersReduced) paintStill();
    else syncLoop();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resizeObs.disconnect();
      visObs.disconnect();
      themeObs.disconnect();
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerdown", onPointerDown);
      hero.removeEventListener("pointerup", onPointerUp);
      hero.removeEventListener("pointerleave", onPointerLeave);
      hero.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onMotionChange);
      hoverQuery.removeEventListener("change", onHoverChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Character-matrix cicada living in the page background. It reacts to pointer movement and taps."
      role="img"
      className={`pointer-events-none absolute inset-0 z-0 block h-full w-full ${className}`}
    />
  );
}
