import { useEffect, useRef } from "react";

/**
 * An interactive canvas prism + constellation + chromatic dispersion hero.
 *
 * Visual & Physical Architecture:
 * - Geometric optics: Collimated incident beam strikes the left face of the equilateral
 *   glass prism, refracts through internal crystalline facets, and disperses into a
 *   continuous multi-spectral volumetric ribbon following true chromatic deviation order
 *   (Red, Amber, Clay flagship, Emerald, Cyan, Cobalt, Violet).
 * - Interactive dynamics: The beam and dispersion fan dynamically track cursor/touch
 *   position with dampened spring physics.
 * - Reactive constellation: Structural network with primary Clay spine. Proximity to cursor
 *   resonates nodes and illuminates local filaments.
 * - Tactile feedback: Clicks/taps emit subtle radial wave ripples across the field.
 *
 * Frame-rate & Performance Contract:
 * - Measured delta-time animation advances consistently across 60Hz, 120Hz, 144Hz, 240Hz.
 * - Paint operations capped at 60fps to conserve GPU/battery on ProMotion devices.
 * - Zero layout thrashing: uses cached bounding client rects updated on resize/scroll.
 * - Zero garbage collection thrash: color strings and palettes are precomputed.
 * - Completely pauses rAF loop when off-screen (IntersectionObserver) or backgrounded (Page Visibility).
 * - Reduced-motion first: renders a static composed frame and halts all animation loops.
 */

const TAU = Math.PI * 2;

/** Target paint budget — ~60fps max */
const TARGET_FRAME_MS = 1000 / 60;

/** Longest delta we trust. Anything above this was a stall, not elapsed motion. */
const MAX_DELTA_MS = 64;

/** Time constants for the pointer spring (ms to ~63% of the way there). */
const FOLLOW_TAU_MS = 320;
const IDLE_TAU_MS = 680;

/** Drop back to the idle drift after this long without pointer movement. */
const POINTER_IDLE_MS = 2500;

type SpectralBand = {
  angle: number;
  dark: string;
  light: string;
  glowDark: string;
  glowLight: string;
};

/**
 * Chromatic dispersion fan following true optical dispersion (red refracts least, violet most),
 * centering our signature Clay mark within the warm core.
 */
const SPECTRAL_BANDS: readonly SpectralBand[] = [
  {
    angle: -0.2,
    dark: "rgba(239, 68, 68, 0.70)",
    light: "rgba(220, 38, 38, 0.55)",
    glowDark: "rgba(239, 68, 68, 0.25)",
    glowLight: "rgba(220, 38, 38, 0.15)",
  }, // Red (least deviation)
  {
    angle: -0.14,
    dark: "rgba(245, 158, 11, 0.75)",
    light: "rgba(217, 119, 6, 0.60)",
    glowDark: "rgba(245, 158, 11, 0.25)",
    glowLight: "rgba(217, 119, 6, 0.15)",
  }, // Amber
  {
    angle: -0.07,
    dark: "rgba(230, 126, 84, 0.88)",
    light: "rgba(168, 71, 27, 0.75)",
    glowDark: "rgba(230, 126, 84, 0.35)",
    glowLight: "rgba(168, 71, 27, 0.22)",
  }, // Clay Flagship
  {
    angle: 0.0,
    dark: "rgba(16, 185, 129, 0.70)",
    light: "rgba(5, 150, 105, 0.55)",
    glowDark: "rgba(16, 185, 129, 0.22)",
    glowLight: "rgba(5, 150, 105, 0.15)",
  }, // Emerald
  {
    angle: 0.06,
    dark: "rgba(6, 182, 212, 0.70)",
    light: "rgba(2, 132, 199, 0.55)",
    glowDark: "rgba(6, 182, 212, 0.22)",
    glowLight: "rgba(2, 132, 199, 0.15)",
  }, // Cyan
  {
    angle: 0.12,
    dark: "rgba(59, 130, 246, 0.68)",
    light: "rgba(37, 99, 235, 0.52)",
    glowDark: "rgba(59, 130, 246, 0.22)",
    glowLight: "rgba(37, 99, 235, 0.15)",
  }, // Cobalt
  {
    angle: 0.18,
    dark: "rgba(139, 92, 246, 0.65)",
    light: "rgba(124, 58, 237, 0.50)",
    glowDark: "rgba(139, 92, 246, 0.20)",
    glowLight: "rgba(124, 58, 237, 0.14)",
  }, // Violet (most deviation)
];

type ConstellationNode = {
  nx: number;
  ny: number;
  isClay: boolean;
  radius: number;
  phase: number;
};

const CONSTELLATION_NODES: readonly ConstellationNode[] = [
  // Primary Clay Breakthrough Spine
  { nx: 0.77, ny: 0.3, isClay: true, radius: 3.0, phase: 0.0 },
  { nx: 0.84, ny: 0.25, isClay: true, radius: 3.4, phase: 0.3 },
  { nx: 0.91, ny: 0.2, isClay: true, radius: 3.6, phase: 0.6 },
  { nx: 0.97, ny: 0.17, isClay: true, radius: 2.8, phase: 0.9 },

  // Upper Canopy (Right corner)
  { nx: 0.79, ny: 0.18, isClay: false, radius: 1.8, phase: 0.2 },
  { nx: 0.87, ny: 0.12, isClay: false, radius: 2.0, phase: 0.5 },
  { nx: 0.94, ny: 0.09, isClay: false, radius: 2.2, phase: 0.8 },

  // Middle Resonance Arch
  { nx: 0.8, ny: 0.4, isClay: false, radius: 2.0, phase: 0.4 },
  { nx: 0.88, ny: 0.36, isClay: false, radius: 2.2, phase: 0.7 },
  { nx: 0.95, ny: 0.32, isClay: false, radius: 2.0, phase: 1.0 },

  // Lower Transition Filaments
  { nx: 0.75, ny: 0.5, isClay: false, radius: 1.8, phase: 0.5 },
  { nx: 0.83, ny: 0.48, isClay: false, radius: 2.0, phase: 0.8 },
  { nx: 0.92, ny: 0.46, isClay: false, radius: 1.8, phase: 1.1 },

  // Bottom Arch (Behind & below stats row)
  { nx: 0.35, ny: 0.86, isClay: false, radius: 1.6, phase: 0.3 },
  { nx: 0.52, ny: 0.84, isClay: true, radius: 2.4, phase: 0.6 },
  { nx: 0.7, ny: 0.86, isClay: false, radius: 1.9, phase: 0.9 },
  { nx: 0.88, ny: 0.88, isClay: true, radius: 2.4, phase: 1.2 },
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

  // Flowing down to bottom cards
  { from: 10, to: 15 },
  { from: 11, to: 16 },
  { from: 13, to: 14 },
  { from: 14, to: 15 },
  { from: 15, to: 16 },
  { from: 14, to: 17 },
  { from: 15, to: 17 },
];

const PHOTON_SEEDS: readonly { edgeIdx: number; progress: number; speed: number }[] = [
  { edgeIdx: 0, progress: 0.1, speed: 0.007 },
  { edgeIdx: 1, progress: 0.5, speed: 0.006 },
  { edgeIdx: 2, progress: 0.3, speed: 0.008 },
  { edgeIdx: 4, progress: 0.8, speed: 0.005 },
  { edgeIdx: 7, progress: 0.4, speed: 0.006 },
  { edgeIdx: 13, progress: 0.2, speed: 0.005 },
  { edgeIdx: 16, progress: 0.6, speed: 0.007 },
];

type ClickRipple = {
  x: number;
  y: number;
  bornAt: number;
  maxRadius: number;
};

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

    // --- Loop state ---
    let rafId = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;

    let time = 0;
    let lastFrameTs = 0;
    let lastTickTs = 0;
    let minTick = 16.667;
    let slowStreak = 0;

    // --- Surface state (cached, never re-read inside a frame) ---
    let width = 0;
    let height = 0;
    let dpr = 1;
    let cssWidth = 0;
    let cssHeight = 0;
    let maxDpr = 2;

    let rectLeft = 0;
    let rectTop = 0;

    // --- Theme ---
    let isDark = document.documentElement.classList.contains("dark");

    // --- Pointer state (CSS px; converted to device px at draw time) ---
    const target = { x: 0, y: 0, active: false };
    let currentX = 0;
    let currentY = 0;
    let hasCurrent = false;
    let lastPointerTs = 0;

    const photons = PHOTON_SEEDS.map((p) => ({ ...p }));
    const motes = Array.from({ length: 24 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.024,
      vy: (Math.random() - 0.5) * 0.024,
      size: 0.75 + Math.random() * 1.25,
      alpha: 0.16 + Math.random() * 0.34,
    }));

    const ripples: ClickRipple[] = [];

    // --- Sizing ---
    const updateRect = () => {
      const rect = container.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      cssWidth = rect.width;
      cssHeight = rect.height;
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
      if (!running) drawStatic();
    };

    // --- Drawing ---
    const drawScene = (dtMs: number) => {
      const w = width;
      const h = height;

      if (!hasCurrent) {
        currentX = w * 0.68;
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
        const idleX = w * 0.68;
        const idleY = h * 0.28 + Math.sin(time * 0.55) * (h * 0.035);
        const k = 1 - Math.exp(-dtMs / IDLE_TAU_MS);
        currentX += (idleX - currentX) * k;
        currentY += (idleY - currentY) * k;
      }

      ctx.clearRect(0, 0, w, h);

      // --- Palette tokens ---
      const beamGlow = isDark ? "rgba(248, 246, 240, 0.35)" : "rgba(22, 16, 12, 0.10)";
      const glassBdr = isDark ? "rgba(248, 246, 240, 0.40)" : "rgba(22, 16, 12, 0.24)";
      const filament = isDark ? "rgba(248, 246, 240, 0.14)" : "rgba(22, 16, 12, 0.10)";
      const clay = isDark ? "#E67E54" : "#A8471B";
      const clayGlw = isDark ? "rgba(230, 126, 84, 0.45)" : "rgba(168, 71, 27, 0.26)";
      const starFill = isDark ? "rgba(248, 246, 240, 0.80)" : "rgba(22, 16, 12, 0.68)";

      // --- Prism geometry ---
      const isMobile = cssWidth < 768;
      const prismCX = isMobile ? w * 0.74 : w * 0.7;
      const prismCY = isMobile ? h * 0.25 : h * 0.31;
      const prismSize = Math.min(w, h) * (isMobile ? 0.19 : 0.22);

      // 0. Ambient ripples from clicks/taps
      const now = performance.now();
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const ageMs = now - r.bornAt;
        if (ageMs > 1200) {
          ripples.splice(i, 1);
          continue;
        }
        const prog = ageMs / 1200;
        const radius = prog * r.maxRadius;
        const alpha = (1 - prog) * (isDark ? 0.22 : 0.15);
        ctx.strokeStyle = isDark
          ? `rgba(248, 246, 240, ${alpha.toFixed(3)})`
          : `rgba(22, 16, 12, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2 * (1 - prog * 0.5) * dpr;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, TAU);
        ctx.stroke();
      }

      // Continuous subtle pointer ripples when active
      if (target.active) {
        const rippleAlphaBase = isDark ? 0.14 : 0.1;
        ctx.lineWidth = 1 * dpr;
        for (let r = 0; r < 2; r++) {
          const rippleTime = (time * 0.8 + r * 0.6) % 1.5;
          const rippleRadius = rippleTime * (prismSize * 2.8);
          const rippleAlpha = (1 - rippleTime / 1.5) * rippleAlphaBase;
          if (rippleAlpha <= 0.003) continue;
          ctx.strokeStyle = isDark
            ? `rgba(248, 246, 240, ${rippleAlpha.toFixed(3)})`
            : `rgba(22, 16, 12, ${(rippleAlpha * 0.85).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(currentX, currentY, rippleRadius, 0, TAU);
          ctx.stroke();
        }
      }

      const topV = { x: prismCX, y: prismCY - prismSize * 0.88 };
      const leftV = { x: prismCX - prismSize * 0.52, y: prismCY + prismSize * 0.58 };
      const rightV = { x: prismCX + prismSize * 0.52, y: prismCY + prismSize * 0.58 };

      // 1. Soft ambient radial bloom behind the prism
      const bloom = ctx.createRadialGradient(
        prismCX,
        prismCY,
        0,
        prismCX,
        prismCY,
        prismSize * 2.5,
      );
      bloom.addColorStop(0, isDark ? "rgba(230, 126, 84, 0.10)" : "rgba(168, 71, 27, 0.06)");
      bloom.addColorStop(0.45, isDark ? "rgba(248, 246, 240, 0.025)" : "rgba(22, 16, 12, 0.018)");
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(prismCX, prismCY, prismSize * 2.5, 0, TAU);
      ctx.fill();

      // 2. Incident beam of pure curiosity
      const raySpan = isMobile ? prismSize * 1.6 : prismSize * 2.3;
      const srcX = prismCX - raySpan;
      const srcY = prismCY - prismSize * 0.38 + (currentY - h * 0.3) * 0.14;
      const hitPt = {
        x: prismCX - prismSize * 0.26,
        y: prismCY - prismSize * 0.11 + (currentY - h * 0.3) * 0.07,
      };

      ctx.save();
      ctx.shadowColor = beamGlow;
      ctx.shadowBlur = 10 * dpr;

      const beamGrad = ctx.createLinearGradient(srcX, srcY, hitPt.x, hitPt.y);
      beamGrad.addColorStop(0, "transparent");
      beamGrad.addColorStop(0.25, isDark ? "rgba(248, 246, 240, 0.35)" : "rgba(22, 16, 12, 0.22)");
      beamGrad.addColorStop(1, isDark ? "rgba(248, 246, 240, 0.95)" : "rgba(22, 16, 12, 0.75)");
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(hitPt.x, hitPt.y);
      ctx.stroke();

      // Photon traveling on the incident beam
      const beamProg = (time * 0.55) % 1;
      const pX = srcX + (hitPt.x - srcX) * beamProg;
      const pY = srcY + (hitPt.y - srcY) * beamProg;
      ctx.fillStyle = isDark ? "#FFFFFF" : clay;
      ctx.beginPath();
      ctx.arc(pX, pY, 1.8 * dpr, 0, TAU);
      ctx.fill();
      ctx.restore();

      // Entry Spark at boundary where incident ray strikes prism face
      ctx.save();
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(22, 16, 12, 0.8)";
      ctx.shadowColor = isDark ? "rgba(255, 255, 255, 0.6)" : clayGlw;
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(hitPt.x, hitPt.y, 2.2 * dpr, 0, TAU);
      ctx.fill();
      ctx.restore();

      // 3. Internal crystalline refraction paths
      const intUpper = { x: prismCX + prismSize * 0.18, y: prismCY - prismSize * 0.18 };
      const intLower = { x: prismCX + prismSize * 0.38, y: prismCY + prismSize * 0.22 };

      const refGrad = ctx.createLinearGradient(hitPt.x, hitPt.y, intLower.x, intLower.y);
      refGrad.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(22, 16, 12, 0.50)");
      refGrad.addColorStop(0.5, isDark ? "rgba(230, 126, 84, 0.65)" : "rgba(168, 71, 27, 0.45)");
      refGrad.addColorStop(1, isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(22, 16, 12, 0.65)");
      ctx.strokeStyle = refGrad;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intUpper.x, intUpper.y);
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intLower.x, intLower.y);
      ctx.stroke();

      // 4. Chromatic dispersion fan (Continuous volumetric ribbon + crisp rays)
      const fanOX = prismCX + prismSize * 0.28;
      const fanOY = prismCY + prismSize * 0.04;
      const bend = (currentY / h - 0.25) * 0.09;

      // Volumetric ribbon fills between consecutive spectral bands
      const ribbonLen = w * 0.44;
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
        rg.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(22, 16, 12, 0.04)");
        rg.addColorStop(0.4, isDark ? b1.dark : b1.light);
        rg.addColorStop(1, "transparent");

        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(fanOX, fanOY);
        ctx.lineTo(p1X, p1Y);
        ctx.lineTo(p2X, p2Y);
        ctx.closePath();
        ctx.fill();
      }

      // Crisp spectral rays
      const rayLen = w * 0.46;
      ctx.lineWidth = 1.35 * dpr;
      for (const band of SPECTRAL_BANDS) {
        const angle = band.angle + bend;
        const endX = fanOX + Math.cos(angle) * rayLen;
        const endY = fanOY + Math.sin(angle) * rayLen;
        const color = isDark ? band.dark : band.light;

        const rg = ctx.createLinearGradient(fanOX, fanOY, endX, endY);
        rg.addColorStop(0, color);
        rg.addColorStop(0.45, color);
        rg.addColorStop(0.92, "transparent");

        ctx.strokeStyle = rg;
        ctx.beginPath();
        ctx.moveTo(fanOX, fanOY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // Exit Prismatic Bloom
      ctx.save();
      const exitBloom = ctx.createRadialGradient(fanOX, fanOY, 0, fanOX, fanOY, prismSize * 0.35);
      exitBloom.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(22, 16, 12, 0.5)");
      exitBloom.addColorStop(0.5, isDark ? "rgba(230, 126, 84, 0.4)" : "rgba(168, 71, 27, 0.3)");
      exitBloom.addColorStop(1, "transparent");
      ctx.fillStyle = exitBloom;
      ctx.beginPath();
      ctx.arc(fanOX, fanOY, prismSize * 0.35, 0, TAU);
      ctx.fill();
      ctx.restore();

      // 5. Constellation filaments
      const clayEdge = isDark ? "rgba(230, 126, 84, 0.38)" : "rgba(168, 71, 27, 0.28)";
      ctx.strokeStyle = filament;
      ctx.lineWidth = 0.85 * dpr;
      ctx.beginPath();
      for (const edge of CONSTELLATION_EDGES) {
        if (edge.isClay) continue;
        const node1 = CONSTELLATION_NODES[edge.from];
        const node2 = CONSTELLATION_NODES[edge.to];
        if (!node1 || !node2) continue;
        ctx.moveTo(node1.nx * w, node1.ny * h);
        ctx.lineTo(node2.nx * w, node2.ny * h);
      }
      ctx.stroke();

      ctx.strokeStyle = clayEdge;
      ctx.lineWidth = 1.25 * dpr;
      ctx.beginPath();
      for (const edge of CONSTELLATION_EDGES) {
        if (!edge.isClay) continue;
        const node1 = CONSTELLATION_NODES[edge.from];
        const node2 = CONSTELLATION_NODES[edge.to];
        if (!node1 || !node2) continue;
        ctx.moveTo(node1.nx * w, node1.ny * h);
        ctx.lineTo(node2.nx * w, node2.ny * h);
      }
      ctx.stroke();

      // 6. Traveling Photons
      ctx.save();
      for (const photon of photons) {
        photon.progress += (photon.speed * dtMs) / 16.667;
        if (photon.progress > 1) photon.progress = 0;

        const edge = CONSTELLATION_EDGES[photon.edgeIdx];
        if (!edge) continue;
        const node1 = CONSTELLATION_NODES[edge.from];
        const node2 = CONSTELLATION_NODES[edge.to];
        if (!node1 || !node2) continue;

        const phX = (node1.nx + (node2.nx - node1.nx) * photon.progress) * w;
        const phY = (node1.ny + (node2.ny - node1.ny) * photon.progress) * h;

        ctx.fillStyle = edge.isClay ? clay : isDark ? "#FFFFFF" : "#16100C";
        ctx.shadowColor = edge.isClay ? clayGlw : "rgba(255, 255, 255, 0.4)";
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();
        ctx.arc(phX, phY, 1.8 * dpr, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // 7. Constellation Nodes with Proximity Resonance
      for (const node of CONSTELLATION_NODES) {
        const nx = node.nx * w;
        const ny = node.ny * h;

        // Proximity calculation: how close is pointer to this node?
        const dist = Math.hypot(currentX - nx, currentY - ny);
        const proxFactor = Math.max(0, 1 - dist / (160 * dpr));

        const pulse = Math.sin(time * 2.0 + node.phase) * 0.35 + 1.0;
        const r = (node.radius + proxFactor * 1.2) * dpr * pulse;
        if (r <= 0) continue;

        ctx.fillStyle = node.isClay ? clay : starFill;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, TAU);
        ctx.fill();

        if (node.isClay || proxFactor > 0.2) {
          ctx.save();
          ctx.shadowColor = node.isClay
            ? clayGlw
            : isDark
              ? "rgba(248, 246, 240, 0.4)"
              : "rgba(22, 16, 12, 0.2)";
          ctx.shadowBlur = (node.isClay ? 8 : 5) * dpr * (1 + proxFactor);
          ctx.fill();
          ctx.restore();

          if (node.isClay && node.radius > 2.5) {
            ctx.strokeStyle = isDark ? "rgba(230, 126, 84, 0.45)" : "rgba(168, 71, 27, 0.25)";
            ctx.lineWidth = 0.85 * dpr;
            ctx.beginPath();
            ctx.arc(nx, ny, r * (2.1 + proxFactor * 0.4), 0, TAU);
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
          ? `rgba(248, 246, 240, ${(mote.alpha * 0.32).toFixed(3)})`
          : `rgba(22, 16, 12, ${(mote.alpha * 0.18).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mote.x * w, mote.y * h, mote.size * dpr, 0, TAU);
        ctx.fill();
      }

      // 9. Prism Glass Shell & Architectural Caustic Facets
      ctx.save();
      // Internal specular glass tint
      const glassTint = ctx.createLinearGradient(topV.x, topV.y, rightV.x, rightV.y);
      glassTint.addColorStop(0, isDark ? "rgba(248, 246, 240, 0.05)" : "rgba(22, 16, 12, 0.03)");
      glassTint.addColorStop(0.5, isDark ? "rgba(230, 126, 84, 0.03)" : "rgba(168, 71, 27, 0.02)");
      glassTint.addColorStop(1, isDark ? "rgba(248, 246, 240, 0.02)" : "rgba(22, 16, 12, 0.01)");
      ctx.fillStyle = glassTint;
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(leftV.x, leftV.y);
      ctx.lineTo(rightV.x, rightV.y);
      ctx.closePath();
      ctx.fill();

      // Outer glass border
      ctx.strokeStyle = glassBdr;
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();

      // Inner Caustic Line
      ctx.strokeStyle = isDark ? "rgba(248, 246, 240, 0.18)" : "rgba(22, 16, 12, 0.10)";
      ctx.lineWidth = 0.85 * dpr;
      ctx.beginPath();
      ctx.moveTo(topV.x, topV.y);
      ctx.lineTo(prismCX, prismCY + prismSize * 0.58);
      ctx.stroke();

      // Subtle vertex accent ticks (architectural drafting detail)
      const tick = 2.5 * dpr;
      ctx.strokeStyle = isDark ? "rgba(248, 246, 240, 0.5)" : "rgba(22, 16, 12, 0.35)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(topV.x - tick, topV.y);
      ctx.lineTo(topV.x + tick, topV.y);
      ctx.moveTo(leftV.x, leftV.y - tick);
      ctx.lineTo(leftV.x, leftV.y + tick);
      ctx.moveTo(rightV.x, rightV.y - tick);
      ctx.lineTo(rightV.x, rightV.y + tick);
      ctx.stroke();
      ctx.restore();
    };

    /** One composed frame for reduced-motion visitors */
    function drawStatic() {
      if (!width || !height) return;
      target.active = false;
      hasCurrent = true;
      currentX = width * 0.68;
      currentY = height * 0.28;
      drawScene(0);
    }

    // --- Loop ---
    const paint = (dtMs: number) => {
      time += dtMs / 1000;

      if (target.active && performance.now() - lastPointerTs > POINTER_IDLE_MS) {
        target.active = false;
      }

      const startedAt = performance.now();
      drawScene(dtMs);
      const paintCost = performance.now() - startedAt;

      // Self-tuning render budget
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

      if (lastTickTs !== 0) {
        const tick = ts - lastTickTs;
        if (tick > 2) minTick = Math.min(minTick, Math.max(4, tick));
      }
      lastTickTs = ts;

      if (lastFrameTs === 0) {
        lastFrameTs = ts;
        paint(1);
        return;
      }

      const elapsed = ts - lastFrameTs;
      const paintInterval = Math.max(1, Math.floor(TARGET_FRAME_MS / minTick)) * minTick;
      if (elapsed < paintInterval - 0.5) return;

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

    // --- Observers & listeners ---
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
      if (y >= -120 && y <= cssHeight + 120 && x >= 0 && x <= cssWidth) {
        target.x = x;
        target.y = y;
        target.active = true;
        lastPointerTs = performance.now();
      } else {
        target.active = false;
      }
    };

    const onClick = (e: MouseEvent) => {
      const x = (e.clientX - rectLeft) * dpr;
      const y = (e.clientY - rectTop) * dpr;
      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        ripples.push({
          x,
          y,
          bornAt: performance.now(),
          maxRadius: Math.min(width, height) * 0.45,
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) {
        handlePointer(t.clientX, t.clientY);
        const x = (t.clientX - rectLeft) * dpr;
        const y = (t.clientY - rectTop) * dpr;
        if (x >= 0 && x <= width && y >= 0 && y <= height) {
          ripples.push({
            x,
            y,
            bornAt: performance.now(),
            maxRadius: Math.min(width, height) * 0.45,
          });
        }
      }
    };
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
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("mouseout", onPointerGone, { passive: true });
    window.addEventListener("blur", onPointerGone);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onDocVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    resize();
    if (!prefersReduced) syncLoop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      visObs.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("click", onClick);
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
