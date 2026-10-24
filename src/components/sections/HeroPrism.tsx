import { useEffect, useRef } from "react";

/**
 * An interactive canvas prism + constellation + chromatic dispersion hero.
 *
 * Frame-rate contract (this is the important part):
 * - Every animation value advances on measured delta time, not a hard-coded 0.016.
 *   A 144Hz laptop and a 60Hz laptop show the *same* speed; before, high-refresh
 *   screens ran the whole hero ~2.4× fast.
 * - Painting is capped at ~60fps. On a 120Hz phone the loop still ticks, but we skip
 *   the expensive gradient/shadow work for frames nobody can perceive, which roughly
 *   halves the GPU/CPU cost of the hero on ProMotion devices.
 * - Delta time is clamped after a stall (background tab, GC pause) so the scene never
 *   teleports when the visitor comes back.
 * - If painting is consistently slow, the render scale steps down once instead of
 *   letting the hero stutter forever.
 *
 * Other behaviour:
 * - Completely stops the rAF loop when off-screen (IntersectionObserver) or when the
 *   tab is hidden.
 * - Reads dark mode via a cached MutationObserver instead of 60×/s DOM reads.
 * - Respects `prefers-reduced-motion`: renders one static frame then stops, and
 *   re-renders that frame on theme change.
 * - Pointer math uses a cached bounding rect, so mousemove never forces layout.
 * - Touch support: touchmove maps to the same interaction as mousemove.
 * - Canvas is sized via ResizeObserver, not a window resize listener.
 */

const TAU = Math.PI * 2;

/** Target paint budget — ~60fps is plenty for a soft, slow-moving decorative canvas. */
const TARGET_FRAME_MS = 1000 / 60;

/** Longest delta we trust. Anything above this was a stall, not elapsed motion. */
const MAX_DELTA_MS = 64;

/** Time constants for the pointer spring (ms to ~63% of the way there). */
const FOLLOW_TAU_MS = 325;
const IDLE_TAU_MS = 660;

/** Drop back to the idle drift after this long without pointer movement. */
const POINTER_IDLE_MS = 2600;

type SpectralBand = { angle: number; dark: string; light: string };

/** Chromatic dispersion fan. Palettes are precomputed, not rebuilt as strings every frame. */
const SPECTRAL_BANDS: readonly SpectralBand[] = [
  { angle: -0.22, dark: "rgba(236,72,153,0.70)", light: "rgba(219,39,119,0.55)" }, // pink
  { angle: -0.16, dark: "rgba(168,85,247,0.65)", light: "rgba(147,51,234,0.50)" }, // purple
  { angle: -0.1, dark: "rgba(59,130,246,0.60)", light: "rgba(37,99,235,0.45)" }, // blue
  { angle: -0.05, dark: "rgba(6,182,212,0.65)", light: "rgba(2,132,199,0.50)" }, // cyan
  { angle: 0.0, dark: "rgba(230,126,84,0.75)", light: "rgba(168,71,27,0.60)" }, // clay
  { angle: 0.06, dark: "rgba(245,158,11,0.70)", light: "rgba(217,119,6,0.55)" }, // amber
  { angle: 0.12, dark: "rgba(239,68,68,0.65)", light: "rgba(220,38,38,0.50)" }, // red
];

type ConstellationNode = {
  nx: number;
  ny: number;
  isClay: boolean;
  radius: number;
  phase: number;
};

const CONSTELLATION_NODES: readonly ConstellationNode[] = [
  // Primary clay breakthrough spine
  { nx: 0.77, ny: 0.3, isClay: true, radius: 2.8, phase: 0.0 },
  { nx: 0.84, ny: 0.25, isClay: true, radius: 3.2, phase: 0.3 },
  { nx: 0.91, ny: 0.2, isClay: true, radius: 3.5, phase: 0.6 },
  { nx: 0.97, ny: 0.17, isClay: true, radius: 2.8, phase: 0.9 },
  // Upper canopy (right corner)
  { nx: 0.79, ny: 0.18, isClay: false, radius: 1.8, phase: 0.2 },
  { nx: 0.87, ny: 0.12, isClay: false, radius: 2.0, phase: 0.5 },
  { nx: 0.94, ny: 0.09, isClay: false, radius: 2.2, phase: 0.8 },
  // Middle resonance arch
  { nx: 0.8, ny: 0.4, isClay: false, radius: 2.0, phase: 0.4 },
  { nx: 0.88, ny: 0.36, isClay: false, radius: 2.2, phase: 0.7 },
  { nx: 0.95, ny: 0.32, isClay: false, radius: 2.0, phase: 1.0 },
  // Lower transition filaments
  { nx: 0.75, ny: 0.5, isClay: false, radius: 1.8, phase: 0.5 },
  { nx: 0.83, ny: 0.48, isClay: false, radius: 2.0, phase: 0.8 },
  { nx: 0.92, ny: 0.46, isClay: false, radius: 1.8, phase: 1.1 },
  // Bottom arch (behind & below stats row)
  { nx: 0.35, ny: 0.86, isClay: false, radius: 1.6, phase: 0.3 },
  { nx: 0.52, ny: 0.84, isClay: true, radius: 2.2, phase: 0.6 },
  { nx: 0.7, ny: 0.86, isClay: false, radius: 1.9, phase: 0.9 },
  { nx: 0.88, ny: 0.88, isClay: true, radius: 2.2, phase: 1.2 },
  { nx: 0.6, ny: 0.95, isClay: false, radius: 1.7, phase: 1.5 },
];

const CONSTELLATION_EDGES: readonly { from: number; to: number; isClay?: boolean }[] = [
  // Clay spine
  { from: 0, to: 1, isClay: true },
  { from: 1, to: 2, isClay: true },
  { from: 2, to: 3, isClay: true },
  // Upper canopy
  { from: 0, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 1, to: 5 },
  { from: 2, to: 6 },
  // Middle arch
  { from: 0, to: 7 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
  { from: 1, to: 8 },
  { from: 2, to: 9 },
  // Lower transition
  { from: 7, to: 10 },
  { from: 10, to: 11 },
  { from: 11, to: 12 },
  { from: 8, to: 11 },
  { from: 9, to: 12 },
  // Flowing down to bottom
  { from: 10, to: 15 },
  { from: 11, to: 16 },
  { from: 13, to: 14 },
  { from: 14, to: 15 },
  { from: 15, to: 16 },
  { from: 14, to: 17 },
  { from: 15, to: 17 },
];

/** Seeds only — photons mutate their own progress, so each effect gets its own copy. */
const PHOTON_SEEDS: readonly { edgeIdx: number; progress: number; speed: number }[] = [
  { edgeIdx: 0, progress: 0.1, speed: 0.007 },
  { edgeIdx: 1, progress: 0.5, speed: 0.006 },
  { edgeIdx: 2, progress: 0.3, speed: 0.008 },
  { edgeIdx: 4, progress: 0.8, speed: 0.005 },
  { edgeIdx: 7, progress: 0.4, speed: 0.006 },
  { edgeIdx: 13, progress: 0.2, speed: 0.005 },
  { edgeIdx: 16, progress: 0.6, speed: 0.007 },
];

export function HeroPrism({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReduced = motionQuery.matches;

    // ─── Loop state ──────────────────────────────────────────────────
    let rafId = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;

    let time = 0;
    let lastFrameTs = 0;
    let lastTickTs = 0;
    /** Measured vsync interval, refined from rAF timestamps (8.3ms on 120Hz, etc.). */
    let minTick = 16.667;
    let slowStreak = 0;

    // ─── Surface state (cached, never re-read inside a frame) ────────
    let width = 0;
    let height = 0;
    let dpr = 1;
    let cssWidth = 0;
    let cssHeight = 0;
    let maxDpr = 2;

    // Cached bounds so pointer handling never triggers layout.
    let rectLeft = 0;
    let rectTop = 0;

    // ─── Theme ───────────────────────────────────────────────────────
    let isDark = document.documentElement.classList.contains("dark");

    // ─── Pointer state (CSS px; converted to device px at draw time) ─
    const target = { x: 0, y: 0, active: false };
    let currentX = 0;
    let currentY = 0;
    let hasCurrent = false;
    let lastPointerTs = 0;

    const photons = PHOTON_SEEDS.map((p) => ({ ...p }));
    const motes = Array.from({ length: 24 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.012, // units per second
      vy: (Math.random() - 0.5) * 0.012,
      size: 0.7 + Math.random() * 1.2,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    // ─── Sizing ──────────────────────────────────────────────────────
    const updateRect = () => {
      const rect = canvas.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      width = Math.max(1, Math.round(cssWidth * dpr));
      height = Math.max(1, Math.round(cssHeight * dpr));
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      updateRect();
      // Resizing clears the bitmap, so a paused (reduced-motion) hero must repaint.
      if (!running) drawStatic();
    };

    // ─── Drawing ─────────────────────────────────────────────────────
    const drawScene = (dtMs: number) => {
      const w = width;
      const h = height;

      // Smooth pointer motion, expressed as a time constant instead of a per-frame
      // magic number, so the easing feels identical at 60 and 144Hz.
      if (!hasCurrent) {
        currentX = w * 0.65;
        currentY = h * 0.28;
        hasCurrent = true;
      }

      const px = target.x * dpr;
      const py = target.y * dpr;

      if (target.active) {
        const k = 1 - Math.exp(-dtMs / FOLLOW_TAU_MS);
        currentX += (px - currentX) * k;
        currentY += (py - currentY) * k;
      } else {
        const idleX = w * 0.65;
        const idleY = h * 0.28 + Math.sin(time * 0.6) * (h * 0.03);
        const k = 1 - Math.exp(-dtMs / IDLE_TAU_MS);
        currentX += (idleX - currentX) * k;
        currentY += (idleY - currentY) * k;
      }

      ctx.clearRect(0, 0, w, h);

      // ── Palette (brand tokens) ─────────────────────────────────────
      const beamGlow = isDark ? "rgba(248,246,240,0.3)" : "rgba(22,16,12,0.08)";
      const glassBdr = isDark ? "rgba(248,246,240,0.35)" : "rgba(22,16,12,0.22)";
      const filament = isDark ? "rgba(248,246,240,0.12)" : "rgba(22,16,12,0.09)";
      const clay = isDark ? "#E67E54" : "#A8471B";
      const clayGlw = isDark ? "rgba(230,126,84,0.4)" : "rgba(168,71,27,0.22)";
      const starFill = isDark ? "rgba(248,246,240,0.75)" : "rgba(22,16,12,0.65)";

      // ── Prism geometry ─────────────────────────────────────────────
      const isMobile = cssWidth < 768;
      const prismCX = isMobile ? w * 0.74 : w * 0.7;
      const prismCY = isMobile ? h * 0.26 : h * 0.32;
      const prismSize = Math.min(w, h) * (isMobile ? 0.2 : 0.24);

      // 0. Ripple waves from the pointer, drawn first so everything sits on top.
      if (target.active) {
        const rippleAlphaBase = isDark ? 0.15 : 0.12;
        ctx.lineWidth = 1 * dpr;
        for (let r = 0; r < 3; r++) {
          const rippleTime = (time + r * 0.5) % 2;
          const rippleRadius = rippleTime * (prismSize * 3.5);
          const rippleAlpha = (1 - rippleTime / 2) * rippleAlphaBase;
          if (rippleAlpha <= 0.002) continue;
          ctx.strokeStyle = isDark
            ? `rgba(248,246,240,${rippleAlpha.toFixed(3)})`
            : `rgba(22,16,12,${(rippleAlpha * 0.8).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(currentX, currentY, rippleRadius, 0, TAU);
          ctx.stroke();
        }
      }

      const topV = { x: prismCX, y: prismCY - prismSize * 0.88 };
      const leftV = { x: prismCX - prismSize * 0.52, y: prismCY + prismSize * 0.58 };
      const rightV = { x: prismCX + prismSize * 0.52, y: prismCY + prismSize * 0.58 };

      // 1. Soft ambient radial bloom
      const bloom = ctx.createRadialGradient(
        prismCX,
        prismCY,
        0,
        prismCX,
        prismCY,
        prismSize * 2.4,
      );
      bloom.addColorStop(0, isDark ? "rgba(230,126,84,0.09)" : "rgba(168,71,27,0.05)");
      bloom.addColorStop(0.5, isDark ? "rgba(248,246,240,0.02)" : "rgba(22,16,12,0.015)");
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(prismCX, prismCY, prismSize * 2.4, 0, TAU);
      ctx.fill();

      // 2. Incident beam
      const raySpan = isMobile ? prismSize * 1.8 : prismSize * 2.6;
      const srcX = prismCX - raySpan;
      const srcY = prismCY - prismSize * 0.4 + (currentY - h * 0.3) * 0.15;
      const hitPt = {
        x: prismCX - prismSize * 0.26,
        y: prismCY - prismSize * 0.12 + (currentY - h * 0.3) * 0.08,
      };

      ctx.save();
      ctx.shadowColor = beamGlow;
      ctx.shadowBlur = 10 * dpr;

      const beamGrad = ctx.createLinearGradient(srcX, srcY, hitPt.x, hitPt.y);
      beamGrad.addColorStop(0, "transparent");
      beamGrad.addColorStop(0.25, isDark ? "rgba(248,246,240,0.3)" : "rgba(22,16,12,0.2)");
      beamGrad.addColorStop(1, isDark ? "rgba(248,246,240,0.85)" : "rgba(22,16,12,0.65)");
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(hitPt.x, hitPt.y);
      ctx.stroke();

      // Photon on the incident beam
      const beamProg = (time * 0.6) % 1;
      ctx.fillStyle = isDark ? "#FFF" : clay;
      ctx.beginPath();
      ctx.arc(
        srcX + (hitPt.x - srcX) * beamProg,
        srcY + (hitPt.y - srcY) * beamProg,
        1.8 * dpr,
        0,
        TAU,
      );
      ctx.fill();
      ctx.restore();

      // 3. Internal refraction paths
      const intUpper = { x: prismCX + prismSize * 0.18, y: prismCY - prismSize * 0.18 };
      const intLower = { x: prismCX + prismSize * 0.38, y: prismCY + prismSize * 0.22 };

      const refGrad = ctx.createLinearGradient(hitPt.x, hitPt.y, intLower.x, intLower.y);
      refGrad.addColorStop(0, isDark ? "rgba(255,255,255,0.7)" : "rgba(22,16,12,0.45)");
      refGrad.addColorStop(0.5, isDark ? "rgba(230,126,84,0.6)" : "rgba(168,71,27,0.4)");
      refGrad.addColorStop(1, isDark ? "rgba(255,255,255,0.8)" : "rgba(22,16,12,0.6)");
      ctx.strokeStyle = refGrad;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intUpper.x, intUpper.y);
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intLower.x, intLower.y);
      ctx.stroke();

      // 4. Chromatic dispersion fan (the Dark Side ribbon)
      const fanOX = prismCX + prismSize * 0.28;
      const fanOY = prismCY + prismSize * 0.04;
      const bend = (currentY / h - 0.25) * 0.1;

      // Continuous ribbon fills between bands
      const ribbonLen = w * 0.42;
      for (let i = 0; i < SPECTRAL_BANDS.length - 1; i++) {
        const b1 = SPECTRAL_BANDS[i];
        const b2 = SPECTRAL_BANDS[i + 1];
        const a1 = b1.angle + bend;
        const a2 = b2.angle + bend;

        const p1X = fanOX + Math.cos(a1) * ribbonLen;
        const p1Y = fanOY + Math.sin(a1) * ribbonLen;
        const p2X = fanOX + Math.cos(a2) * ribbonLen;
        const p2Y = fanOY + Math.sin(a2) * ribbonLen;

        const rg = ctx.createLinearGradient(fanOX, fanOY, p1X, p1Y);
        rg.addColorStop(0, isDark ? "rgba(255,255,255,0.06)" : "rgba(22,16,12,0.03)");
        rg.addColorStop(0.5, isDark ? b1.dark : b1.light);
        rg.addColorStop(1, "transparent");

        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(fanOX, fanOY);
        ctx.lineTo(p1X, p1Y);
        ctx.lineTo(p2X, p2Y);
        ctx.closePath();
        ctx.fill();
      }

      // Crisp spectral rays — no per-ray save/restore, they all share one line width.
      const rayLen = w * 0.45;
      ctx.lineWidth = 1.3 * dpr;
      for (const band of SPECTRAL_BANDS) {
        const angle = band.angle + bend;
        const endX = fanOX + Math.cos(angle) * rayLen;
        const endY = fanOY + Math.sin(angle) * rayLen;
        const color = isDark ? band.dark : band.light;

        const rg = ctx.createLinearGradient(fanOX, fanOY, endX, endY);
        rg.addColorStop(0, color);
        rg.addColorStop(0.4, color);
        rg.addColorStop(0.9, "transparent");

        ctx.strokeStyle = rg;
        ctx.beginPath();
        ctx.moveTo(fanOX, fanOY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // 5. Constellation filaments — one path per style group instead of per edge.
      const clayEdge = isDark ? "rgba(230,126,84,0.35)" : "rgba(168,71,27,0.25)";
      ctx.strokeStyle = filament;
      ctx.lineWidth = 0.8 * dpr;
      ctx.beginPath();
      for (const edge of CONSTELLATION_EDGES) {
        if (edge.isClay) continue;
        const p1 = CONSTELLATION_NODES[edge.from];
        const p2 = CONSTELLATION_NODES[edge.to];
        if (!p1 || !p2) continue;
        ctx.moveTo(p1.nx * w, p1.ny * h);
        ctx.lineTo(p2.nx * w, p2.ny * h);
      }
      ctx.stroke();

      ctx.strokeStyle = clayEdge;
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      for (const edge of CONSTELLATION_EDGES) {
        if (!edge.isClay) continue;
        const p1 = CONSTELLATION_NODES[edge.from];
        const p2 = CONSTELLATION_NODES[edge.to];
        if (!p1 || !p2) continue;
        ctx.moveTo(p1.nx * w, p1.ny * h);
        ctx.lineTo(p2.nx * w, p2.ny * h);
      }
      ctx.stroke();

      // 6. Traveling photons
      ctx.save();
      for (const photon of photons) {
        photon.progress += (photon.speed * dtMs) / 16.667;
        if (photon.progress > 1) photon.progress = 0;

        const edge = CONSTELLATION_EDGES[photon.edgeIdx];
        if (!edge) continue;
        const p1 = CONSTELLATION_NODES[edge.from];
        const p2 = CONSTELLATION_NODES[edge.to];
        if (!p1 || !p2) continue;

        const px = (p1.nx + (p2.nx - p1.nx) * photon.progress) * w;
        const py = (p1.ny + (p2.ny - p1.ny) * photon.progress) * h;

        ctx.fillStyle = edge.isClay ? clay : isDark ? "#FFF" : "#16100C";
        ctx.shadowColor = edge.isClay ? clayGlw : "rgba(255,255,255,0.4)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(px, py, 1.8 * dpr, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // 7. Constellation nodes. Stars skip shadowBlur entirely — 14 blurred fills a
      //    frame is the single most expensive thing this canvas used to do.
      for (const node of CONSTELLATION_NODES) {
        const nx = node.nx * w;
        const ny = node.ny * h;
        const pulse = Math.sin(time * 2.0 + node.phase) * 0.4 + 1.0;
        const r = node.radius * dpr * pulse;
        if (r <= 0) continue;

        ctx.fillStyle = node.isClay ? clay : starFill;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, TAU);
        ctx.fill();

        if (node.isClay) {
          ctx.save();
          ctx.shadowColor = clayGlw;
          ctx.shadowBlur = 8 * dpr;
          ctx.fill();
          ctx.restore();

          if (node.radius > 2.5) {
            ctx.strokeStyle = isDark ? "rgba(230,126,84,0.4)" : "rgba(168,71,27,0.22)";
            ctx.lineWidth = 0.8 * dpr;
            ctx.beginPath();
            ctx.arc(nx, ny, r * 2.2, 0, TAU);
            ctx.stroke();
          }
        }
      }

      // 8. Atmospheric ambient dust motes
      const moteStep = dtMs / 1000;
      for (const mote of motes) {
        mote.x += mote.vx * moteStep;
        mote.y += mote.vy * moteStep;
        if (mote.x < 0) mote.x = 1;
        if (mote.x > 1) mote.x = 0;
        if (mote.y < 0) mote.y = 1;
        if (mote.y > 1) mote.y = 0;

        ctx.fillStyle = isDark
          ? `rgba(248,246,240,${(mote.alpha * 0.3).toFixed(3)})`
          : `rgba(22,16,12,${(mote.alpha * 0.16).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mote.x * w, mote.y * h, mote.size * dpr, 0, TAU);
        ctx.fill();
      }

      // 9. Prism glass shell
      ctx.save();
      ctx.fillStyle = isDark ? "rgba(248,246,240,0.03)" : "rgba(22,16,12,0.02)";
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(leftV.x, leftV.y);
      ctx.lineTo(rightV.x, rightV.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = glassBdr;
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();

      // Inner caustic line
      ctx.strokeStyle = isDark ? "rgba(248,246,240,0.15)" : "rgba(22,16,12,0.08)";
      ctx.lineWidth = 0.8 * dpr;
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(prismCX, prismCY + prismSize * 0.58);
      ctx.stroke();
      ctx.restore();
    };

    /** One composed frame for reduced-motion visitors (and after a resize while paused). */
    function drawStatic() {
      if (!width || !height) return;
      target.active = false;
      hasCurrent = true;
      currentX = width * 0.65;
      currentY = height * 0.28;
      drawScene(0);
    }

    // ─── Loop ────────────────────────────────────────────────────────
    const paint = (dtMs: number) => {
      time += dtMs / 1000;

      if (target.active && performance.now() - lastPointerTs > POINTER_IDLE_MS) {
        target.active = false;
      }

      const startedAt = performance.now();
      drawScene(dtMs);
      const paintCost = performance.now() - startedAt;

      // Self-tuning: if we're consistently over budget, step the render scale down
      // once rather than stuttering for the rest of the visit.
      if (paintCost > 9) {
        slowStreak += 1;
        if (slowStreak > 90 && maxDpr > 1) {
          maxDpr = 1;
          slowStreak = 0;
          resize();
        }
      } else if (slowStreak > 0) {
        slowStreak -= 1;
      }
    };

    const frame = (ts: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);

      // Learn the display's vsync interval from consecutive rAF timestamps. Guarded
      // against jitter so one odd tick can't make the cap nonsense.
      if (lastTickTs !== 0) {
        const tick = ts - lastTickTs;
        if (tick > 2) minTick = Math.min(minTick, Math.max(4, tick));
      }
      lastTickTs = ts;

      // First tick after (re)start: paint at once and take it as the baseline.
      if (lastFrameTs === 0) {
        lastFrameTs = ts;
        paint(1);
        return;
      }

      const elapsed = ts - lastFrameTs;

      // Frame cap, snapped to whole vsync multiples: paint on every Nth tick where N is
      // the largest number that still keeps us at or above ~60fps. 60Hz paints every
      // tick, 90Hz every tick (45fps would look worse than 90), 120Hz every other, 144Hz
      // every other, 240Hz every fourth. Floor — not round — because dropping *below*
      // 60fps to save work is a bad trade on a hero that is supposed to feel liquid.
      // lastFrameTs is deliberately NOT advanced when we skip, so the skipped time
      // carries into the next paint and motion speed is identical at any refresh rate.
      const paintInterval = Math.max(1, Math.floor(TARGET_FRAME_MS / minTick)) * minTick;
      if (elapsed < paintInterval - 0.5) return;

      // Clamp after a stall (background tab, GC pause) so the scene never teleports.
      const dtMs = Math.min(elapsed, MAX_DELTA_MS);
      lastFrameTs = ts;
      paint(dtMs);
    };

    const syncLoop = () => {
      const shouldRun = inView && docVisible && !prefersReduced;
      if (shouldRun && !running) {
        running = true;
        lastFrameTs = 0;
        rafId = requestAnimationFrame(frame);
        return;
      }
      if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
        return;
      }
      if (!shouldRun && prefersReduced) drawStatic();
    };

    // ─── Observers & listeners ───────────────────────────────────────
    const resizeObs = new ResizeObserver(() => resize());
    resizeObs.observe(container);

    const visObs = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncLoop();
      },
      { threshold: 0.05 },
    );
    visObs.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark");
      if (!running) drawStatic();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const handlePointer = (clientX: number, clientY: number) => {
      const y = clientY - rectTop;
      const x = clientX - rectLeft;
      if (y >= -100 && y <= cssHeight + 100 && x >= 0 && x <= cssWidth) {
        target.x = x;
        target.y = y;
        target.active = true;
        lastPointerTs = performance.now();
      } else {
        target.active = false;
      }
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handlePointer(t.clientX, t.clientY);
    };
    const onPointerGone = () => {
      target.active = false;
    };
    const onDocVisibility = () => {
      docVisible = !document.hidden;
      syncLoop();
    };
    const onScroll = () => updateRect();
    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      syncLoop();
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseout", onPointerGone, { passive: true });
    window.addEventListener("blur", onPointerGone);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onDocVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    resize(); // paints one composed frame, since the loop isn't running yet
    if (!prefersReduced) syncLoop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      visObs.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseout", onPointerGone);
      window.removeEventListener("blur", onPointerGone);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onDocVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div ref={containerRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
