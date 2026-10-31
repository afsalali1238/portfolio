import { useEffect, useRef } from "react";

/**
 * An interactive canvas prism + Nikola Tesla Colorado Springs (Dec 1899)
 * high-voltage electrical discharge hero.
 *
 * Visual & Physical Architecture:
 * - Collimated incident beam strikes the left face of the equilateral glass prism.
 * - Refracts and concentrates into an intensely ionized plasma discharge terminal
 *   on the right face of the prism (reminiscent of Tesla's Colorado Springs magnifying transmitter).
 * - From this terminal, majestic wavy, pulsating electrical discharges and lightning arcs
 *   explode across the right canvas — mirroring the iconic 1899 photograph of Nikola Tesla
 *   in his Colorado Springs laboratory.
 * - Color palette: Strictly anchored in the forthe.tech brand system — Flagship Clay
 *   (#E67E54 dark / #A8471B light), incandescent white-hot plasma cores, warm amber/copper
 *   coronas, and deep warm ink/paper contrast.
 * - Sinuous undulating waves + high-frequency dielectric crackle + recursive forking branches.
 * - Interactive electrostatic attraction: Cursor / touch dynamically pulls arcs toward the pointer.
 * - Constellation grounding: Discharges arc across to the constellation nodes, energizing the network.
 * - Surge feedback: Clicks / taps trigger high-voltage lightning surges and expanding electric ripples.
 *
 * Performance Contract:
 * - 60fps capped requestAnimationFrame loop with measured delta-time.
 * - Completely pauses when off-screen (IntersectionObserver) or hidden (Page Visibility).
 * - Zero layout thrashing, reduced-motion first static frame fallback.
 */

const TAU = Math.PI * 2;
const TARGET_FRAME_MS = 1000 / 60;
const MAX_DELTA_MS = 64;
const FOLLOW_TAU_MS = 280;
const IDLE_TAU_MS = 750;
const POINTER_IDLE_MS = 2400;

/** Fast deterministic pseudo-hash for high-frequency electrical crackle without GC */
function hash(i: number, seed: number): number {
  const n = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

type ConstellationNode = {
  nx: number;
  ny: number;
  isClay: boolean;
  radius: number;
  phase: number;
};

const CONSTELLATION_NODES: readonly ConstellationNode[] = [
  // Primary Clay Breakthrough Spine
  { nx: 0.77, ny: 0.3, isClay: true, radius: 3.2, phase: 0.0 },
  { nx: 0.84, ny: 0.25, isClay: true, radius: 3.6, phase: 0.3 },
  { nx: 0.91, ny: 0.2, isClay: true, radius: 3.8, phase: 0.6 },
  { nx: 0.97, ny: 0.17, isClay: true, radius: 3.0, phase: 0.9 },

  // Upper Canopy (Right corner)
  { nx: 0.79, ny: 0.18, isClay: false, radius: 2.0, phase: 0.2 },
  { nx: 0.87, ny: 0.12, isClay: false, radius: 2.2, phase: 0.5 },
  { nx: 0.94, ny: 0.09, isClay: false, radius: 2.4, phase: 0.8 },

  // Middle Resonance Arch
  { nx: 0.8, ny: 0.4, isClay: false, radius: 2.2, phase: 0.4 },
  { nx: 0.88, ny: 0.36, isClay: false, radius: 2.4, phase: 0.7 },
  { nx: 0.95, ny: 0.32, isClay: false, radius: 2.2, phase: 1.0 },

  // Lower Transition Filaments
  { nx: 0.75, ny: 0.5, isClay: false, radius: 2.0, phase: 0.5 },
  { nx: 0.83, ny: 0.48, isClay: false, radius: 2.2, phase: 0.8 },
  { nx: 0.92, ny: 0.46, isClay: false, radius: 2.0, phase: 1.1 },

  // Bottom Arch
  { nx: 0.35, ny: 0.86, isClay: false, radius: 1.8, phase: 0.3 },
  { nx: 0.52, ny: 0.84, isClay: true, radius: 2.6, phase: 0.6 },
  { nx: 0.7, ny: 0.86, isClay: false, radius: 2.1, phase: 0.9 },
  { nx: 0.88, ny: 0.88, isClay: true, radius: 2.6, phase: 1.2 },
  { nx: 0.6, ny: 0.95, isClay: false, radius: 1.9, phase: 1.5 },
];

const CONSTELLATION_EDGES: readonly { from: number; to: number; isClay?: boolean }[] = [
  { from: 0, to: 1, isClay: true },
  { from: 1, to: 2, isClay: true },
  { from: 2, to: 3, isClay: true },
  { from: 0, to: 4 },
  { from: 4, to: 5 },
  { from: 5, to: 6 },
  { from: 1, to: 5 },
  { from: 2, to: 6 },
  { from: 0, to: 7 },
  { from: 7, to: 8 },
  { from: 8, to: 9 },
  { from: 1, to: 8 },
  { from: 2, to: 9 },
  { from: 7, to: 10 },
  { from: 10, to: 11 },
  { from: 11, to: 12 },
  { from: 8, to: 11 },
  { from: 9, to: 12 },
  { from: 10, to: 15 },
  { from: 11, to: 16 },
  { from: 13, to: 14 },
  { from: 14, to: 15 },
  { from: 15, to: 16 },
  { from: 14, to: 17 },
  { from: 15, to: 17 },
];

/** Specs for the primary Tesla discharge streamers */
type StreamerDef = {
  angleOffset: number; // Base launch angle (radians)
  lengthFactor: number; // Reach across canvas width
  waveFreq: number; // Serpentine wave frequency
  waveSpeed: number; // Wave travel velocity
  waveAmp: number; // Transverse wave displacement (px)
  seed: number; // Phase/noise seed
  targetNodeIdx: number | null; // Anchored grounding node in constellation
  isPrimaryClay: boolean; // Flagship brand clay stream
};

const STREAMER_DEFS: readonly StreamerDef[] = [
  // Flagship central streamer — powerful, high-energy clay core
  {
    angleOffset: -0.06,
    lengthFactor: 0.58,
    waveFreq: 2.8,
    waveSpeed: 3.8,
    waveAmp: 22,
    seed: 1.4,
    targetNodeIdx: 0,
    isPrimaryClay: true,
  },
  // Upper undulating lightning arc reaching toward high canopy
  {
    angleOffset: -0.22,
    lengthFactor: 0.52,
    waveFreq: 3.4,
    waveSpeed: 4.6,
    waveAmp: 18,
    seed: 3.7,
    targetNodeIdx: 4,
    isPrimaryClay: false,
  },
  // Far upper leaping arc — intense crackle
  {
    angleOffset: -0.36,
    lengthFactor: 0.44,
    waveFreq: 4.1,
    waveSpeed: 5.2,
    waveAmp: 15,
    seed: 5.9,
    targetNodeIdx: null,
    isPrimaryClay: false,
  },
  // Middle-lower resonance streamer bridging into middle constellation arch
  {
    angleOffset: 0.08,
    lengthFactor: 0.54,
    waveFreq: 3.0,
    waveSpeed: -3.5,
    waveAmp: 20,
    seed: 8.2,
    targetNodeIdx: 7,
    isPrimaryClay: true,
  },
  // Lower descending plasma streamer reaching to transition filaments
  {
    angleOffset: 0.24,
    lengthFactor: 0.48,
    waveFreq: 3.6,
    waveSpeed: 4.0,
    waveAmp: 17,
    seed: 11.1,
    targetNodeIdx: 10,
    isPrimaryClay: false,
  },
  // Deep lower streamer branching downward
  {
    angleOffset: 0.38,
    lengthFactor: 0.42,
    waveFreq: 4.2,
    waveSpeed: -4.8,
    waveAmp: 14,
    seed: 14.6,
    targetNodeIdx: null,
    isPrimaryClay: false,
  },
];

type ClickSurge = {
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

    let rafId = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;

    let time = 0;
    let lastFrameTs = 0;
    let lastTickTs = 0;
    let minTick = 16.667;
    let slowStreak = 0;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let cssWidth = 0;
    let cssHeight = 0;
    let maxDpr = 2;

    let rectLeft = 0;
    let rectTop = 0;

    let isDark = document.documentElement.classList.contains("dark");

    const target = { x: 0, y: 0, active: false };
    let currentX = 0;
    let currentY = 0;
    let hasCurrent = false;
    let lastPointerTs = 0;

    // Voltage surge multiplier (decays back to 0)
    let surgeEnergy = 0;

    const surges: ClickSurge[] = [];

    // Ambient floating atmospheric particles
    const motes = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      size: 0.75 + Math.random() * 1.5,
      alpha: 0.15 + Math.random() * 0.35,
    }));

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

    /**
     * Draws a single wavy, pulsating Tesla lightning arc with high-voltage crackle,
     * optional forking branches, and multi-layered plasma glow.
     */
    const drawTeslaArc = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      options: {
        amplitude: number;
        frequency: number;
        speed: number;
        seed: number;
        glowColor: string;
        midColor: string;
        coreColor: string;
        glowWidth: number;
        midWidth: number;
        coreWidth: number;
        steps?: number;
        allowBranches?: boolean;
        surge?: number;
      },
    ) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) return;

      const steps = options.steps ?? Math.max(24, Math.min(54, Math.floor(dist / (14 * dpr))));
      const nx = -dy / dist;
      const ny = dx / dist;

      const surgeMult = 1 + (options.surge || 0) * 0.75;
      const amp = options.amplitude * dpr * surgeMult;
      const freq = options.frequency;
      const t = time * options.speed;
      const seed = options.seed;

      // Jitter phase changes at ~24fps for authentic rapid spark crackle
      const jitterTimeSlot = Math.floor(time * 24 + seed * 7);

      // Generate arc vertex coordinates
      const pointsX: number[] = [];
      const pointsY: number[] = [];

      for (let i = 0; i <= steps; i++) {
        const s = i / steps; // 0 to 1
        // Serpentine wave envelope: 0 at start and end, maximum in the center
        const env = Math.sin(s * Math.PI);
        // Multi-harmonic standing + traveling sinusoidal waves (like Colorado Springs long exposure)
        const wave1 = Math.sin(s * freq * Math.PI - t + seed) * amp;
        const wave2 = Math.sin(s * freq * 2.3 * Math.PI + t * 1.4 + seed * 1.9) * (amp * 0.35);

        // High-voltage dielectric jitter offset
        const rawHash = hash(i * 3 + jitterTimeSlot, seed);
        const jitter = (rawHash - 0.5) * (amp * 0.45);

        const totalOffset = (wave1 + wave2 + jitter) * Math.pow(env, 0.85);

        pointsX.push(x0 + dx * s + nx * totalOffset);
        pointsY.push(y0 + dy * s + ny * totalOffset);
      }

      // 1. Outer Corona Glow Pass
      ctx.save();
      ctx.strokeStyle = options.glowColor;
      ctx.lineWidth = options.glowWidth * dpr * surgeMult;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pointsX[0], pointsY[0]);
      for (let i = 1; i < pointsX.length; i++) {
        ctx.lineTo(pointsX[i], pointsY[i]);
      }
      ctx.stroke();

      // 2. Mid Plasma Ionization Sleeve Pass
      ctx.strokeStyle = options.midColor;
      ctx.lineWidth = options.midWidth * dpr * (1 + (options.surge || 0) * 0.4);
      ctx.stroke();

      // 3. Incandescent High-Voltage Core Filament Pass
      ctx.strokeStyle = options.coreColor;
      ctx.lineWidth = options.coreWidth * dpr;
      ctx.stroke();
      ctx.restore();

      // Recursive forking branches (Tesla Colorado Springs dendritic tendrils)
      if (options.allowBranches && dist > 70 * dpr) {
        // Fork 2 to 3 branches along the arc length
        const branchPoints = [0.32, 0.58, 0.78];
        for (let b = 0; b < branchPoints.length; b++) {
          const bp = branchPoints[b];
          const idx = Math.floor(bp * steps);
          if (idx <= 0 || idx >= pointsX.length) continue;

          const bx0 = pointsX[idx];
          const by0 = pointsY[idx];

          // Alternate branching angle to either side (+- 35 to 55 degrees)
          const side = b % 2 === 0 ? 1 : -1;
          const branchAngle = Math.atan2(dy, dx) + side * (0.55 + hash(b, seed) * 0.35);
          const branchLen = dist * (0.22 + hash(b * 5, seed) * 0.24) * surgeMult;

          const bx1 = bx0 + Math.cos(branchAngle) * branchLen;
          const by1 = by0 + Math.sin(branchAngle) * branchLen;

          drawTeslaArc(bx0, by0, bx1, by1, {
            amplitude: options.amplitude * 0.6,
            frequency: options.frequency * 1.5,
            speed: options.speed * 1.2,
            seed: seed + b * 13.7,
            glowColor: options.glowColor,
            midColor: options.midColor,
            coreColor: options.coreColor,
            glowWidth: options.glowWidth * 0.6,
            midWidth: Math.max(0.8, options.midWidth * 0.6),
            coreWidth: Math.max(0.6, options.coreWidth * 0.6),
            steps: 14,
            allowBranches: false, // Leaf tendril
            surge: options.surge,
          });
        }
      }
    };

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
        const idleY = h * 0.28 + Math.sin(time * 0.5) * (h * 0.035);
        const k = 1 - Math.exp(-dtMs / IDLE_TAU_MS);
        currentX += (idleX - currentX) * k;
        currentY += (idleY - currentY) * k;
      }

      // Decay surge energy
      if (surgeEnergy > 0.005) {
        surgeEnergy = Math.max(0, surgeEnergy - dtMs / 700);
      } else {
        surgeEnergy = 0;
      }

      ctx.clearRect(0, 0, w, h);

      // --- Brand System Color Tokens ---
      const clay = isDark ? "#E67E54" : "#A8471B";
      const clayGlow = isDark ? "rgba(230, 126, 84, 0.40)" : "rgba(168, 71, 27, 0.26)";
      const amberGlow = isDark ? "rgba(245, 158, 11, 0.32)" : "rgba(217, 119, 6, 0.20)";
      const amberMid = isDark ? "#F59E0B" : "#D97706";
      const coreWhite = isDark ? "#FFFFFF" : "rgba(22, 16, 12, 0.95)";
      const hotWhite = "#FFFFFF";

      const beamGlow = isDark ? "rgba(248, 246, 240, 0.35)" : "rgba(22, 16, 12, 0.12)";
      const glassBdr = isDark ? "rgba(248, 246, 240, 0.40)" : "rgba(22, 16, 12, 0.24)";
      const filament = isDark ? "rgba(248, 246, 240, 0.12)" : "rgba(22, 16, 12, 0.09)";
      const starFill = isDark ? "rgba(248, 246, 240, 0.85)" : "rgba(22, 16, 12, 0.70)";

      // --- Geometry Layout ---
      const isMobile = cssWidth < 768;
      const prismCX = isMobile ? w * 0.74 : w * 0.7;
      const prismCY = isMobile ? h * 0.25 : h * 0.31;
      const prismSize = Math.min(w, h) * (isMobile ? 0.19 : 0.22);

      // Tesla transmitter discharge terminal (exit face of the prism)
      const terminalX = prismCX + prismSize * 0.28;
      const terminalY = prismCY + prismSize * 0.04;

      // 0. Ambient Click/Surge Ripples (Radial electrical waves)
      const now = performance.now();
      for (let i = surges.length - 1; i >= 0; i--) {
        const s = surges[i];
        const ageMs = now - s.bornAt;
        if (ageMs > 1100) {
          surges.splice(i, 1);
          continue;
        }
        const prog = ageMs / 1100;
        const radius = prog * s.maxRadius;
        const alpha = (1 - prog) * (isDark ? 0.35 : 0.22);

        // Concentric electric wave ripple
        ctx.strokeStyle = isDark
          ? `rgba(230, 126, 84, ${alpha.toFixed(3)})`
          : `rgba(168, 71, 27, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.6 * (1 - prog * 0.6) * dpr;
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, TAU);
        ctx.stroke();

        // Secondary subtle white shockwave
        if (isDark && prog < 0.6) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * 0.6).toFixed(3)})`;
          ctx.lineWidth = 0.9 * dpr;
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius * 0.82, 0, TAU);
          ctx.stroke();
        }
      }

      // Pointer proximity aura
      if (target.active) {
        const auraAlpha = (isDark ? 0.18 : 0.12) * (1 + surgeEnergy * 0.5);
        ctx.lineWidth = 1.1 * dpr;
        for (let r = 0; r < 2; r++) {
          const rippleTime = (time * 0.75 + r * 0.5) % 1.4;
          const rippleRadius = rippleTime * (prismSize * 2.2);
          const alpha = (1 - rippleTime / 1.4) * auraAlpha;
          if (alpha <= 0.003) continue;
          ctx.strokeStyle = isDark
            ? `rgba(230, 126, 84, ${alpha.toFixed(3)})`
            : `rgba(168, 71, 27, ${(alpha * 0.9).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(currentX, currentY, rippleRadius, 0, TAU);
          ctx.stroke();
        }
      }

      const topV = { x: prismCX, y: prismCY - prismSize * 0.88 };
      const leftV = { x: prismCX - prismSize * 0.52, y: prismCY + prismSize * 0.58 };
      const rightV = { x: prismCX + prismSize * 0.52, y: prismCY + prismSize * 0.58 };

      // 1. Soft atmospheric bloom behind prism
      const bloom = ctx.createRadialGradient(
        prismCX,
        prismCY,
        0,
        prismCX,
        prismCY,
        prismSize * 2.6,
      );
      bloom.addColorStop(0, isDark ? "rgba(230, 126, 84, 0.12)" : "rgba(168, 71, 27, 0.07)");
      bloom.addColorStop(0.5, isDark ? "rgba(248, 246, 240, 0.03)" : "rgba(22, 16, 12, 0.02)");
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(prismCX, prismCY, prismSize * 2.6, 0, TAU);
      ctx.fill();

      // 2. Incident Laser Beam striking the prism's left face
      const raySpan = isMobile ? prismSize * 1.6 : prismSize * 2.4;
      const srcX = prismCX - raySpan;
      const srcY = prismCY - prismSize * 0.38 + (currentY - h * 0.3) * 0.12;
      const hitPt = {
        x: prismCX - prismSize * 0.26,
        y: prismCY - prismSize * 0.11 + (currentY - h * 0.3) * 0.06,
      };

      ctx.save();
      ctx.shadowColor = beamGlow;
      ctx.shadowBlur = 10 * dpr;

      const beamGrad = ctx.createLinearGradient(srcX, srcY, hitPt.x, hitPt.y);
      beamGrad.addColorStop(0, "transparent");
      beamGrad.addColorStop(0.25, isDark ? "rgba(248, 246, 240, 0.35)" : "rgba(22, 16, 12, 0.22)");
      beamGrad.addColorStop(1, isDark ? "rgba(248, 246, 240, 0.95)" : "rgba(22, 16, 12, 0.85)");
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(srcX, srcY);
      ctx.lineTo(hitPt.x, hitPt.y);
      ctx.stroke();

      // Traveling photon packet along the incident ray
      const beamProg = (time * 0.65) % 1;
      const pX = srcX + (hitPt.x - srcX) * beamProg;
      const pY = srcY + (hitPt.y - srcY) * beamProg;
      ctx.fillStyle = isDark ? "#FFFFFF" : clay;
      ctx.beginPath();
      ctx.arc(pX, pY, 2.0 * dpr, 0, TAU);
      ctx.fill();
      ctx.restore();

      // Impact spark on the prism entrance facet
      ctx.save();
      ctx.fillStyle = isDark ? "#FFFFFF" : clay;
      ctx.shadowColor = isDark ? "#FFFFFF" : clayGlow;
      ctx.shadowBlur = 8 * dpr;
      ctx.beginPath();
      ctx.arc(hitPt.x, hitPt.y, 2.4 * dpr, 0, TAU);
      ctx.fill();
      ctx.restore();

      // 3. Internal Crystalline Refraction & Ionization Channels
      const intUpper = { x: prismCX + prismSize * 0.18, y: prismCY - prismSize * 0.18 };
      const intLower = { x: prismCX + prismSize * 0.38, y: prismCY + prismSize * 0.22 };

      const refGrad = ctx.createLinearGradient(hitPt.x, hitPt.y, terminalX, terminalY);
      refGrad.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.75)" : "rgba(22, 16, 12, 0.50)");
      refGrad.addColorStop(0.5, isDark ? "rgba(230, 126, 84, 0.85)" : "rgba(168, 71, 27, 0.65)");
      refGrad.addColorStop(1, isDark ? "#FFFFFF" : clay);
      ctx.strokeStyle = refGrad;
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intUpper.x, intUpper.y);
      ctx.lineTo(terminalX, terminalY);
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intLower.x, intLower.y);
      ctx.lineTo(terminalX, terminalY);
      ctx.stroke();

      // =========================================================================
      // 4. NIKOLA TESLA COLORADO SPRINGS 1899 ELECTRICAL DISCHARGE SYSTEM
      //    + THE FORTH.TECH LOGO PLASMA TERMINAL
      // =========================================================================

      // (A) The High-Voltage Transmitter Terminal — Shaped as the forthe.tech Logo Mark
      // Half thought (smooth incandescent plasma on left), half built (quantized digital cells on right),
      // with the signature Clay line cutting through the seam and launching the Tesla discharge!
      const corePulse = Math.sin(time * 6.0) * 0.08 + 1.0 + surgeEnergy * 0.5;
      const logoRadius = prismSize * 0.16 * corePulse;
      const logoScale = logoRadius / 11.2;

      // Breakthrough launch origin at the tip of the clay pixel row:
      // (in 32x32 mark coords: right edge of clay row is at x = 26.8, y = 14.15)
      const launchX = terminalX + (26.8 - 16) * logoScale;
      const launchY = terminalY + (14.15 - 16) * logoScale;

      ctx.save();
      // Outer ambient plasma bloom behind the mark
      const termBloom = ctx.createRadialGradient(
        terminalX,
        terminalY,
        0,
        terminalX,
        terminalY,
        logoRadius * 2.8,
      );
      termBloom.addColorStop(0, isDark ? hotWhite : "#FFFFFF");
      termBloom.addColorStop(0.2, isDark ? "rgba(255, 240, 220, 0.95)" : clay);
      termBloom.addColorStop(0.5, isDark ? clayGlow : "rgba(168, 71, 27, 0.40)");
      termBloom.addColorStop(0.85, isDark ? amberGlow : "rgba(217, 119, 6, 0.18)");
      termBloom.addColorStop(1, "transparent");
      ctx.fillStyle = termBloom;
      ctx.beginPath();
      ctx.arc(terminalX, terminalY, logoRadius * 2.8, 0, TAU);
      ctx.fill();

      // Render the forthe.tech Logo Mark at the plasma core
      ctx.translate(terminalX, terminalY);
      ctx.scale(logoScale, logoScale);
      ctx.translate(-16, -16);

      // 1. Smooth Left Half (Thought / Analog Plasma Hemisphere)
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.92)" : "rgba(22, 16, 12, 0.88)";
      ctx.shadowColor = isDark ? hotWhite : clayGlow;
      ctx.shadowBlur = 8;
      // Upper quadrant (thinking)
      ctx.beginPath();
      ctx.moveTo(16, 4.8);
      ctx.arc(16, 16, 11.2, -Math.PI / 2, -Math.PI * 0.84, true);
      ctx.lineTo(16, 12.6);
      ctx.closePath();
      ctx.fill();

      // Lower quadrant (reflection)
      ctx.beginPath();
      ctx.moveTo(16, 15.7);
      ctx.lineTo(4.804, 15.7);
      ctx.arc(16, 16, 11.2, -Math.PI * 1.02, Math.PI / 2, true);
      ctx.closePath();
      ctx.fill();

      // 2. The Wall / Seam (Dielectric boundary barrier)
      ctx.strokeStyle = isDark ? "rgba(230, 126, 84, 0.85)" : "rgba(168, 71, 27, 0.75)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(16, 4.8);
      ctx.lineTo(16, 27.2);
      ctx.stroke();

      // 3. Right Half (Building / Quantized Digital Plasma Grid Cells)
      ctx.fillStyle = isDark ? "rgba(248, 246, 240, 0.85)" : "rgba(22, 16, 12, 0.78)";
      ctx.shadowColor = isDark ? "rgba(248, 246, 240, 0.5)" : "rgba(22, 16, 12, 0.3)";
      ctx.shadowBlur = 5;

      const standardCells: [number, number][] = [
        [16.3, 5.2],
        [16.3, 8.9],
        [16.3, 16.3],
        [16.3, 20.0],
        [16.3, 23.7],
        [20.0, 8.9],
        [20.0, 16.3],
        [20.0, 20.0],
        [23.7, 16.3],
      ];

      for (const [cx, cy] of standardCells) {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(cx, cy, 3.1, 3.1, 0.5);
        } else {
          ctx.rect(cx, cy, 3.1, 3.1);
        }
        ctx.fill();
      }

      // 4. The Clay Breakthrough Row (The Line of Curiosity That Ignites the Build)
      ctx.fillStyle = clay;
      ctx.shadowColor = clay;
      ctx.shadowBlur = 12 * (1 + surgeEnergy);

      const clayCells: [number, number][] = [
        [16.3, 12.6],
        [20.0, 12.6],
        [23.7, 12.6],
      ];

      for (const [cx, cy] of clayCells) {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(cx, cy, 3.1, 3.1, 0.5);
        } else {
          ctx.rect(cx, cy, 3.1, 3.1);
        }
        ctx.fill();

        // White-hot incandescent electrical spark at the center of each clay pixel
        ctx.save();
        ctx.fillStyle = isDark ? hotWhite : "#FFFFFF";
        ctx.shadowColor = hotWhite;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(cx + 1.55, cy + 1.55, 0.65, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // (B) Primary Wavy Pulsating Tesla Streamers (Discharge Channels)
      // Launched directly from the logo mark's clay breakthrough tip (launchX, launchY)
      const reachLengthBase = w * (isMobile ? 0.42 : 0.48);

      for (let sIdx = 0; sIdx < STREAMER_DEFS.length; sIdx++) {
        const def = STREAMER_DEFS[sIdx];
        const streamReach = reachLengthBase * def.lengthFactor * (1 + surgeEnergy * 0.3);

        // Calculate end target: anchored to constellation node or directional fan
        let endX: number;
        let endY: number;

        if (def.targetNodeIdx !== null && CONSTELLATION_NODES[def.targetNodeIdx]) {
          const tNode = CONSTELLATION_NODES[def.targetNodeIdx];
          endX = tNode.nx * w;
          endY = tNode.ny * h;
        } else {
          // Dynamic steering toward cursor vertical position
          const angle = def.angleOffset + (currentY / h - 0.3) * 0.18;
          endX = launchX + Math.cos(angle) * streamReach;
          endY = launchY + Math.sin(angle) * streamReach;
        }

        // Color selection strictly from brand tokens
        const glowColor = def.isPrimaryClay ? clayGlow : amberGlow;
        const midColor = def.isPrimaryClay ? clay : amberMid;
        const coreCol = isDark ? coreWhite : def.isPrimaryClay ? clay : coreWhite;

        drawTeslaArc(launchX, launchY, endX, endY, {
          amplitude: def.waveAmp,
          frequency: def.waveFreq,
          speed: def.waveSpeed,
          seed: def.seed,
          glowColor,
          midColor,
          coreColor: coreCol,
          glowWidth: def.isPrimaryClay ? 5.5 : 4.0,
          midWidth: def.isPrimaryClay ? 2.2 : 1.6,
          coreWidth: def.isPrimaryClay ? 1.2 : 0.9,
          allowBranches: true,
          surge: surgeEnergy,
        });

        // Traveling electric charge pulse (spark along the discharge channel)
        const sparkProg = (time * (def.waveSpeed > 0 ? 0.8 : 0.6) + def.seed) % 1;
        if (sparkProg > 0.05 && sparkProg < 0.95) {
          const spX = launchX + (endX - launchX) * sparkProg;
          const spY = launchY + (endY - launchY) * sparkProg;

          ctx.save();
          ctx.fillStyle = isDark ? hotWhite : clay;
          ctx.shadowColor = isDark ? hotWhite : clayGlow;
          ctx.shadowBlur = 9 * dpr;
          ctx.beginPath();
          ctx.arc(spX, spY, (def.isPrimaryClay ? 2.4 : 1.8) * dpr, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }

      // (C) Interactive High-Voltage Arc to Cursor (Electrostatic Attraction)
      if (target.active) {
        const curDist = Math.hypot(currentX - launchX, currentY - launchY);
        // Only leap if within realistic electrostatic breakdown reach
        if (curDist < w * 0.75) {
          drawTeslaArc(launchX, launchY, currentX, currentY, {
            amplitude: 24,
            frequency: 3.5,
            speed: 5.4,
            seed: 99.4,
            glowColor: isDark ? "rgba(230, 126, 84, 0.45)" : "rgba(168, 71, 27, 0.30)",
            midColor: clay,
            coreColor: isDark ? hotWhite : clay,
            glowWidth: 6.0,
            midWidth: 2.6,
            coreWidth: 1.4,
            allowBranches: true,
            surge: Math.max(0.25, surgeEnergy),
          });

          // Dancing micro-sparks grounding at cursor
          for (let m = 0; m < 3; m++) {
            const mAngle = (time * 8.0 + m * (TAU / 3)) % TAU;
            const mDist = (8 + Math.sin(time * 12 + m) * 4) * dpr;
            const mx = currentX + Math.cos(mAngle) * mDist;
            const my = currentY + Math.sin(mAngle) * mDist;

            ctx.save();
            ctx.fillStyle = isDark ? hotWhite : clay;
            ctx.shadowColor = isDark ? hotWhite : clayGlow;
            ctx.shadowBlur = 6 * dpr;
            ctx.beginPath();
            ctx.arc(mx, my, 1.4 * dpr, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // 5. Constellation Filaments & Resonance
      const clayEdge = isDark ? "rgba(230, 126, 84, 0.42)" : "rgba(168, 71, 27, 0.32)";
      ctx.strokeStyle = filament;
      ctx.lineWidth = 0.85 * dpr;
      ctx.beginPath();
      for (const edge of CONSTELLATION_EDGES) {
        if (edge.isClay) continue;
        const n1 = CONSTELLATION_NODES[edge.from];
        const n2 = CONSTELLATION_NODES[edge.to];
        if (!n1 || !n2) continue;
        ctx.moveTo(n1.nx * w, n1.ny * h);
        ctx.lineTo(n2.nx * w, n2.ny * h);
      }
      ctx.stroke();

      ctx.strokeStyle = clayEdge;
      ctx.lineWidth = 1.35 * dpr;
      ctx.beginPath();
      for (const edge of CONSTELLATION_EDGES) {
        if (!edge.isClay) continue;
        const n1 = CONSTELLATION_NODES[edge.from];
        const n2 = CONSTELLATION_NODES[edge.to];
        if (!n1 || !n2) continue;
        ctx.moveTo(n1.nx * w, n1.ny * h);
        ctx.lineTo(n2.nx * w, n2.ny * h);
      }
      ctx.stroke();

      // 6. Constellation Nodes with Proximity & Electrical Grounding Resonance
      for (let nIdx = 0; nIdx < CONSTELLATION_NODES.length; nIdx++) {
        const node = CONSTELLATION_NODES[nIdx];
        const nx = node.nx * w;
        const ny = node.ny * h;

        const dist = Math.hypot(currentX - nx, currentY - ny);
        const proxFactor = Math.max(0, 1 - dist / (160 * dpr));

        // Pulsating electrical rhythm
        const pulse = Math.sin(time * 2.4 + node.phase) * 0.3 + 1.0 + surgeEnergy * 0.5;
        const r = (node.radius + proxFactor * 1.4) * dpr * pulse;
        if (r <= 0) continue;

        ctx.fillStyle = node.isClay ? clay : starFill;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, TAU);
        ctx.fill();

        if (node.isClay || proxFactor > 0.15 || surgeEnergy > 0.1) {
          ctx.save();
          ctx.shadowColor = node.isClay ? clayGlow : isDark ? "rgba(248, 246, 240, 0.45)" : clayGlow;
          ctx.shadowBlur = (node.isClay ? 9 : 6) * dpr * (1 + proxFactor + surgeEnergy);
          ctx.fill();
          ctx.restore();

          if (node.isClay && node.radius > 2.5) {
            ctx.strokeStyle = isDark ? "rgba(230, 126, 84, 0.45)" : "rgba(168, 71, 27, 0.28)";
            ctx.lineWidth = 0.85 * dpr;
            ctx.beginPath();
            ctx.arc(nx, ny, r * (2.0 + proxFactor * 0.4), 0, TAU);
            ctx.stroke();
          }
        }
      }

      // 7. Atmospheric Ambient Dust Motes
      const moteStep = dtMs / 1000;
      for (const mote of motes) {
        mote.x += mote.vx * moteStep;
        mote.y += mote.vy * moteStep;
        if (mote.x < 0) mote.x = 1;
        if (mote.x > 1) mote.x = 0;
        if (mote.y < 0) mote.y = 1;
        if (mote.y > 1) mote.y = 0;

        ctx.fillStyle = isDark
          ? `rgba(248, 246, 240, ${(mote.alpha * 0.3).toFixed(3)})`
          : `rgba(22, 16, 12, ${(mote.alpha * 0.16).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mote.x * w, mote.y * h, mote.size * dpr, 0, TAU);
        ctx.fill();
      }

      // 8. Prism Glass Shell & Architectural Caustic Facets
      ctx.save();
      const glassTint = ctx.createLinearGradient(topV.x, topV.y, rightV.x, rightV.y);
      glassTint.addColorStop(0, isDark ? "rgba(248, 246, 240, 0.05)" : "rgba(22, 16, 12, 0.03)");
      glassTint.addColorStop(0.5, isDark ? "rgba(230, 126, 84, 0.04)" : "rgba(168, 71, 27, 0.02)");
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

      // Drafting vertex accent ticks
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

    /** One static composed frame for reduced-motion visitors */
    function drawStatic() {
      if (!width || !height) return;
      target.active = false;
      hasCurrent = true;
      currentX = width * 0.68;
      currentY = height * 0.28;
      surgeEnergy = 0;
      drawScene(0);
    }

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

    const triggerSurge = (clientX: number, clientY: number) => {
      const x = (clientX - rectLeft) * dpr;
      const y = (clientY - rectTop) * dpr;
      if (x >= 0 && x <= width && y >= 0 && y <= height) {
        surgeEnergy = 1.0;
        surges.push({
          x,
          y,
          bornAt: performance.now(),
          maxRadius: Math.min(width, height) * 0.45,
        });
      }
    };

    const onClick = (e: MouseEvent) => triggerSurge(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) {
        handlePointer(t.clientX, t.clientY);
        triggerSurge(t.clientX, t.clientY);
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
