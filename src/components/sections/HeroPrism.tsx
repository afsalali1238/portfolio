import { useEffect, useRef } from "react";

/**
 * HeroPrism — The Tesla × Pink Floyd Interactive Dispersion Field.
 *
 * Visual & Physical Architecture:
 * - Pink Floyd Optics: Light enters an architectural glass prism, refracts internally,
 *   and disperses into a wide, majestic chromatic spectrum fanning across the hero.
 * - Nikola Tesla High-Voltage Plasma (Colorado Springs, Dec 1899):
 *   The dispersed spectrum is alive — undulating volumetric wave ribbons, braided
 *   sinusoidal plasma streamers, and high-frequency crackling lightning tendrils that
 *   branch across the entire canvas.
 * - Wavy Incoming Light Beam: The incident curiosity ray is an undulating electromagnetic
 *   laser wave (traveling sine wave + photons) heading smoothly into the prism.
 * - Radiant Optic Core: The light concentrates inside the crystalline glass into an intensely
 *   blinding caustic focal point that unleashes the electrical dispersion field.
 * - Full Interactive Physics:
 *   * Cursor tracking & electrostatic attraction: Lightning arcs reach out and track the pointer.
 *   * Grounding constellation: Arcs bridge into constellation nodes, energizing the network.
 *   * Click / tap surge: Shockwaves and chromatic flash radiate across the entire hero.
 * - Brand System Tokens: Clay (#E67E54 / #A8471B) flagship core, glowing amber, warm copper,
 *   prismatic harmonics (emerald, cyan, violet), and incandescent white-hot sparks.
 * - High-Performance 60fps delta-time engine, off-screen pause, prefers-reduced-motion fallback.
 */

const TAU = Math.PI * 2;
const TARGET_FRAME_MS = 1000 / 60;
const MAX_DELTA_MS = 64;
const FOLLOW_TAU_MS = 260;
const IDLE_TAU_MS = 800;
const POINTER_IDLE_MS = 2800;

/** Fast deterministic pseudo-hash for lightning jitter without memory allocation */
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
  { nx: 0.76, ny: 0.32, isClay: true, radius: 3.4, phase: 0.0 },
  { nx: 0.83, ny: 0.27, isClay: true, radius: 3.8, phase: 0.3 },
  { nx: 0.90, ny: 0.22, isClay: true, radius: 4.0, phase: 0.6 },
  { nx: 0.96, ny: 0.18, isClay: true, radius: 3.2, phase: 0.9 },

  // Upper Canopy
  { nx: 0.78, ny: 0.19, isClay: false, radius: 2.2, phase: 0.2 },
  { nx: 0.86, ny: 0.13, isClay: false, radius: 2.4, phase: 0.5 },
  { nx: 0.93, ny: 0.09, isClay: false, radius: 2.6, phase: 0.8 },

  // Middle Resonance Arch
  { nx: 0.79, ny: 0.42, isClay: false, radius: 2.4, phase: 0.4 },
  { nx: 0.87, ny: 0.38, isClay: false, radius: 2.6, phase: 0.7 },
  { nx: 0.94, ny: 0.34, isClay: false, radius: 2.4, phase: 1.0 },

  // Lower Transition Filaments
  { nx: 0.74, ny: 0.52, isClay: false, radius: 2.2, phase: 0.5 },
  { nx: 0.82, ny: 0.50, isClay: false, radius: 2.4, phase: 0.8 },
  { nx: 0.91, ny: 0.48, isClay: false, radius: 2.2, phase: 1.1 },

  // Bottom Ground Network (behind stats row)
  { nx: 0.36, ny: 0.84, isClay: false, radius: 2.0, phase: 0.3 },
  { nx: 0.52, ny: 0.82, isClay: true, radius: 2.8, phase: 0.6 },
  { nx: 0.68, ny: 0.84, isClay: false, radius: 2.3, phase: 0.9 },
  { nx: 0.86, ny: 0.86, isClay: true, radius: 2.8, phase: 1.2 },
  { nx: 0.59, ny: 0.94, isClay: false, radius: 2.0, phase: 1.5 },
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

/** Spectral bands in true optical order, centered on Flagship Clay */
type SpectralWaveBand = {
  angle: number;
  label: string;
  darkColor: string;
  lightColor: string;
  darkGlow: string;
  lightGlow: string;
  frequency: number;
  speed: number;
  amplitude: number;
  seed: number;
  targetNodeIdx: number | null;
  isClayFlagship: boolean;
};

const SPECTRAL_WAVE_BANDS: readonly SpectralWaveBand[] = [
  {
    angle: -0.26,
    label: "Red",
    darkColor: "rgba(239, 68, 68, 0.75)",
    lightColor: "rgba(220, 38, 38, 0.58)",
    darkGlow: "rgba(239, 68, 68, 0.28)",
    lightGlow: "rgba(220, 38, 38, 0.16)",
    frequency: 2.8,
    speed: 3.2,
    amplitude: 20,
    seed: 1.2,
    targetNodeIdx: 4,
    isClayFlagship: false,
  },
  {
    angle: -0.17,
    label: "Amber",
    darkColor: "rgba(245, 158, 11, 0.82)",
    lightColor: "rgba(217, 119, 6, 0.65)",
    darkGlow: "rgba(245, 158, 11, 0.32)",
    lightGlow: "rgba(217, 119, 6, 0.20)",
    frequency: 3.3,
    speed: 4.1,
    amplitude: 22,
    seed: 3.7,
    targetNodeIdx: null,
    isClayFlagship: false,
  },
  {
    angle: -0.07,
    label: "Clay Flagship",
    darkColor: "rgba(230, 126, 84, 0.95)",
    lightColor: "rgba(168, 71, 27, 0.82)",
    darkGlow: "rgba(230, 126, 84, 0.45)",
    lightGlow: "rgba(168, 71, 27, 0.28)",
    frequency: 2.9,
    speed: 3.8,
    amplitude: 26,
    seed: 6.4,
    targetNodeIdx: 0,
    isClayFlagship: true,
  },
  {
    angle: 0.03,
    label: "Emerald",
    darkColor: "rgba(16, 185, 129, 0.78)",
    lightColor: "rgba(5, 150, 105, 0.60)",
    darkGlow: "rgba(16, 185, 129, 0.26)",
    lightGlow: "rgba(5, 150, 105, 0.16)",
    frequency: 3.6,
    speed: -3.6,
    amplitude: 21,
    seed: 8.9,
    targetNodeIdx: 7,
    isClayFlagship: false,
  },
  {
    angle: 0.13,
    label: "Cyan",
    darkColor: "rgba(6, 182, 212, 0.80)",
    lightColor: "rgba(2, 132, 199, 0.62)",
    darkGlow: "rgba(6, 182, 212, 0.28)",
    lightGlow: "rgba(2, 132, 199, 0.18)",
    frequency: 3.9,
    speed: 4.4,
    amplitude: 23,
    seed: 11.5,
    targetNodeIdx: 10,
    isClayFlagship: false,
  },
  {
    angle: 0.22,
    label: "Cobalt",
    darkColor: "rgba(59, 130, 246, 0.78)",
    lightColor: "rgba(37, 99, 235, 0.58)",
    darkGlow: "rgba(59, 130, 246, 0.26)",
    lightGlow: "rgba(37, 99, 235, 0.16)",
    frequency: 4.3,
    speed: -4.0,
    amplitude: 19,
    seed: 14.1,
    targetNodeIdx: null,
    isClayFlagship: false,
  },
  {
    angle: 0.31,
    label: "Violet",
    darkColor: "rgba(139, 92, 246, 0.75)",
    lightColor: "rgba(124, 58, 237, 0.55)",
    darkGlow: "rgba(139, 92, 246, 0.24)",
    lightGlow: "rgba(124, 58, 237, 0.15)",
    frequency: 4.7,
    speed: 4.8,
    amplitude: 18,
    seed: 17.3,
    targetNodeIdx: null,
    isClayFlagship: false,
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

    let surgeEnergy = 0;
    const surges: ClickSurge[] = [];

    // Ambient floating atmospheric dust motes
    const motes = Array.from({ length: 32 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.024,
      vy: (Math.random() - 0.5) * 0.024,
      size: 0.8 + Math.random() * 1.6,
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
     * Computes the wavy point coordinates along a line from (x0, y0) to (x1, y1).
     * Smooth undulating envelope: zero at start, maximum in mid-flight.
     */
    const computeWavePoints = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      freq: number,
      speed: number,
      amp: number,
      seed: number,
      steps: number,
      addJitter: boolean = false,
      surge: number = 0,
    ) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.hypot(dx, dy);
      const nx = -dy / (dist || 1);
      const ny = dx / (dist || 1);

      const surgeMult = 1 + surge * 0.65;
      const actualAmp = amp * dpr * surgeMult;
      const t = time * speed;
      const jitterSlot = Math.floor(time * 26 + seed * 9);

      const ptsX: number[] = [];
      const ptsY: number[] = [];

      for (let i = 0; i <= steps; i++) {
        const s = i / steps;
        // Smooth sine envelope so endpoints stay anchored
        const env = Math.sin(s * Math.PI);

        // Serpentine multi-harmonic traveling wave
        const wave1 = Math.sin(s * freq * Math.PI - t + seed) * actualAmp;
        const wave2 = Math.sin(s * freq * 2.2 * Math.PI + t * 1.5 + seed * 1.8) * (actualAmp * 0.35);

        let jitter = 0;
        if (addJitter) {
          const rawH = hash(i * 3 + jitterSlot, seed);
          jitter = (rawH - 0.5) * (actualAmp * 0.45);
        }

        const totalOffset = (wave1 + wave2 + jitter) * Math.pow(env, 0.85);
        ptsX.push(x0 + dx * s + nx * totalOffset);
        ptsY.push(y0 + dy * s + ny * totalOffset);
      }

      return { ptsX, ptsY, dist, nx, ny };
    };

    /**
     * Draws an electric plasma lightning streamer (Tesla Colorado Springs style)
     * with high-voltage crackle, glowing corona, and optional forking tendrils.
     */
    const drawTeslaArc = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      opts: {
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
        allowBranches?: boolean;
        surge?: number;
      },
    ) => {
      const dist = Math.hypot(x1 - x0, y1 - y0);
      if (dist < 5) return;

      const steps = Math.max(26, Math.min(56, Math.floor(dist / (14 * dpr))));
      const { ptsX, ptsY } = computeWavePoints(
        x0,
        y0,
        x1,
        y1,
        opts.frequency,
        opts.speed,
        opts.amplitude,
        opts.seed,
        steps,
        true,
        opts.surge || 0,
      );

      ctx.save();
      // Corona glow
      ctx.strokeStyle = opts.glowColor;
      ctx.lineWidth = opts.glowWidth * dpr * (1 + (opts.surge || 0) * 0.6);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(ptsX[0], ptsY[0]);
      for (let i = 1; i < ptsX.length; i++) ctx.lineTo(ptsX[i], ptsY[i]);
      ctx.stroke();

      // Mid ionization sleeve
      ctx.strokeStyle = opts.midColor;
      ctx.lineWidth = opts.midWidth * dpr * (1 + (opts.surge || 0) * 0.3);
      ctx.stroke();

      // Incandescent core thread
      ctx.strokeStyle = opts.coreColor;
      ctx.lineWidth = opts.coreWidth * dpr;
      ctx.stroke();
      ctx.restore();

      // Forked branching tendrils (Tesla Colorado Springs dendritic discharges)
      if (opts.allowBranches && dist > 70 * dpr) {
        const branchFractions = [0.36, 0.64, 0.82];
        for (let b = 0; b < branchFractions.length; b++) {
          const idx = Math.floor(branchFractions[b] * steps);
          if (idx <= 0 || idx >= ptsX.length) continue;

          const bx0 = ptsX[idx];
          const by0 = ptsY[idx];

          const side = b % 2 === 0 ? 1 : -1;
          const mainAngle = Math.atan2(y1 - y0, x1 - x0);
          const branchAngle = mainAngle + side * (0.55 + hash(b, opts.seed) * 0.35);
          const branchLen = dist * (0.24 + hash(b * 7, opts.seed) * 0.22);

          const bx1 = bx0 + Math.cos(branchAngle) * branchLen;
          const by1 = by0 + Math.sin(branchAngle) * branchLen;

          const branchSteps = 16;
          const sub = computeWavePoints(
            bx0,
            by0,
            bx1,
            by1,
            opts.frequency * 1.6,
            opts.speed * 1.3,
            opts.amplitude * 0.55,
            opts.seed + b * 11.3,
            branchSteps,
            true,
            opts.surge || 0,
          );

          ctx.save();
          ctx.strokeStyle = opts.glowColor;
          ctx.lineWidth = opts.glowWidth * 0.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(sub.ptsX[0], sub.ptsY[0]);
          for (let j = 1; j < sub.ptsX.length; j++) ctx.lineTo(sub.ptsX[j], sub.ptsY[j]);
          ctx.stroke();

          ctx.strokeStyle = opts.midColor;
          ctx.lineWidth = Math.max(0.8, opts.midWidth * 0.55 * dpr);
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    const drawScene = (dtMs: number) => {
      const w = width;
      const h = height;

      if (!hasCurrent) {
        currentX = w * 0.70;
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
        const idleX = w * 0.70;
        const idleY = h * 0.28 + Math.sin(time * 0.52) * (h * 0.038);
        const k = 1 - Math.exp(-dtMs / IDLE_TAU_MS);
        currentX += (idleX - currentX) * k;
        currentY += (idleY - currentY) * k;
      }

      if (surgeEnergy > 0.005) {
        surgeEnergy = Math.max(0, surgeEnergy - dtMs / 750);
      } else {
        surgeEnergy = 0;
      }

      ctx.clearRect(0, 0, w, h);

      // --- Brand System Color Tokens ---
      const clay = isDark ? "#E67E54" : "#A8471B";
      const clayGlow = isDark ? "rgba(230, 126, 84, 0.45)" : "rgba(168, 71, 27, 0.28)";
      const amberGlow = isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(217, 119, 6, 0.20)";
      const whiteHot = "#FFFFFF";

      const beamGlow = isDark ? "rgba(248, 246, 240, 0.38)" : "rgba(22, 16, 12, 0.14)";
      const glassBdr = isDark ? "rgba(248, 246, 240, 0.42)" : "rgba(22, 16, 12, 0.26)";
      const filament = isDark ? "rgba(248, 246, 240, 0.13)" : "rgba(22, 16, 12, 0.09)";
      const starFill = isDark ? "rgba(248, 246, 240, 0.85)" : "rgba(22, 16, 12, 0.70)";

      // --- Full Hero Geometry Layout ---
      const isMobile = cssWidth < 768;
      // Position the prism gracefully in the upper-right quadrant
      const prismCX = isMobile ? w * 0.72 : w * 0.68;
      const prismCY = isMobile ? h * 0.24 : h * 0.29;
      const prismSize = Math.min(w, h) * (isMobile ? 0.20 : 0.23);

      // Optic exit terminal on right prism facet
      const terminalX = prismCX + prismSize * 0.28;
      const terminalY = prismCY + prismSize * 0.04;

      // 0. Ambient Click/Surge Shockwave Ripples
      const now = performance.now();
      for (let i = surges.length - 1; i >= 0; i--) {
        const s = surges[i];
        const ageMs = now - s.bornAt;
        if (ageMs > 1200) {
          surges.splice(i, 1);
          continue;
        }
        const prog = ageMs / 1200;
        const radius = prog * s.maxRadius;
        const alpha = (1 - prog) * (isDark ? 0.4 : 0.25);

        ctx.strokeStyle = isDark
          ? `rgba(230, 126, 84, ${alpha.toFixed(3)})`
          : `rgba(168, 71, 27, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.8 * (1 - prog * 0.6) * dpr;
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, TAU);
        ctx.stroke();

        if (prog < 0.65) {
          ctx.strokeStyle = isDark
            ? `rgba(255, 255, 255, ${(alpha * 0.7).toFixed(3)})`
            : `rgba(245, 158, 11, ${(alpha * 0.7).toFixed(3)})`;
          ctx.lineWidth = 1.0 * dpr;
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius * 0.78, 0, TAU);
          ctx.stroke();
        }
      }

      // Pointer electrostatic resonance rings
      if (target.active) {
        const auraAlpha = (isDark ? 0.20 : 0.14) * (1 + surgeEnergy * 0.5);
        ctx.lineWidth = 1.2 * dpr;
        for (let r = 0; r < 2; r++) {
          const rTime = (time * 0.8 + r * 0.5) % 1.5;
          const rRadius = rTime * (prismSize * 2.4);
          const alpha = (1 - rTime / 1.5) * auraAlpha;
          if (alpha <= 0.003) continue;
          ctx.strokeStyle = isDark
            ? `rgba(230, 126, 84, ${alpha.toFixed(3)})`
            : `rgba(168, 71, 27, ${(alpha * 0.9).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(currentX, currentY, rRadius, 0, TAU);
          ctx.stroke();
        }
      }

      const topV = { x: prismCX, y: prismCY - prismSize * 0.88 };
      const leftV = { x: prismCX - prismSize * 0.52, y: prismCY + prismSize * 0.58 };
      const rightV = { x: prismCX + prismSize * 0.52, y: prismCY + prismSize * 0.58 };

      // 1. Soft atmospheric bloom around the prism
      const bloom = ctx.createRadialGradient(
        prismCX,
        prismCY,
        0,
        prismCX,
        prismCY,
        prismSize * 2.8,
      );
      bloom.addColorStop(0, isDark ? "rgba(230, 126, 84, 0.14)" : "rgba(168, 71, 27, 0.08)");
      bloom.addColorStop(0.45, isDark ? "rgba(248, 246, 240, 0.035)" : "rgba(22, 16, 12, 0.02)");
      bloom.addColorStop(1, "transparent");
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(prismCX, prismCY, prismSize * 2.8, 0, TAU);
      ctx.fill();

      // =========================================================================
      // 2. WAVY INCOMING INCIDENT LIGHT BEAM (ELECTROMAGNETIC WAVE PROPAGATION)
      // =========================================================================
      // Enters from far left across the hero, undulating with laser wave physics
      const srcX = 0; // Starts from the left edge of the hero!
      const srcY = prismCY - prismSize * 0.34 + (currentY - h * 0.3) * 0.16;
      const hitPt = {
        x: prismCX - prismSize * 0.26,
        y: prismCY - prismSize * 0.11 + (currentY - h * 0.3) * 0.07,
      };

      const beamSteps = 60;
      const beamWave = computeWavePoints(
        srcX,
        srcY,
        hitPt.x,
        hitPt.y,
        4.2, // frequency
        5.2, // speed
        14, // amplitude
        0.5, // seed
        beamSteps,
        false, // smooth laser wave
        surgeEnergy,
      );

      ctx.save();
      // Outer beam glow
      const beamGrad = ctx.createLinearGradient(srcX, srcY, hitPt.x, hitPt.y);
      beamGrad.addColorStop(0, "transparent");
      beamGrad.addColorStop(0.3, isDark ? "rgba(248, 246, 240, 0.25)" : "rgba(22, 16, 12, 0.15)");
      beamGrad.addColorStop(0.8, isDark ? "rgba(248, 246, 240, 0.75)" : "rgba(22, 16, 12, 0.65)");
      beamGrad.addColorStop(1, isDark ? "#FFFFFF" : clay);

      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 4.2 * dpr;
      ctx.shadowColor = beamGlow;
      ctx.shadowBlur = 12 * dpr;
      ctx.beginPath();
      ctx.moveTo(beamWave.ptsX[0], beamWave.ptsY[0]);
      for (let i = 1; i < beamWave.ptsX.length; i++) {
        ctx.lineTo(beamWave.ptsX[i], beamWave.ptsY[i]);
      }
      ctx.stroke();

      // Sharp core beam
      ctx.strokeStyle = isDark ? "#FFFFFF" : "rgba(22, 16, 12, 0.95)";
      ctx.lineWidth = 1.4 * dpr;
      ctx.stroke();

      // Traveling photons along the wave crests
      for (let p = 0; p < 3; p++) {
        const pProg = (time * 0.7 + p * 0.33) % 1;
        const pIdx = Math.floor(pProg * beamSteps);
        if (pIdx > 0 && pIdx < beamWave.ptsX.length) {
          const px = beamWave.ptsX[pIdx];
          const py = beamWave.ptsY[pIdx];
          ctx.fillStyle = isDark ? whiteHot : clay;
          ctx.shadowColor = isDark ? whiteHot : clayGlow;
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(px, py, 2.4 * dpr, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();

      // Spark flash where the wave strikes the prism left face
      ctx.save();
      ctx.fillStyle = isDark ? whiteHot : clay;
      ctx.shadowColor = isDark ? whiteHot : clayGlow;
      ctx.shadowBlur = 12 * dpr * (1 + surgeEnergy);
      ctx.beginPath();
      ctx.arc(hitPt.x, hitPt.y, 3.2 * dpr, 0, TAU);
      ctx.fill();
      ctx.restore();

      // 3. Internal Crystalline Refraction Caustics
      const intUpper = { x: prismCX + prismSize * 0.18, y: prismCY - prismSize * 0.18 };
      const intLower = { x: prismCX + prismSize * 0.38, y: prismCY + prismSize * 0.22 };

      const refGrad = ctx.createLinearGradient(hitPt.x, hitPt.y, terminalX, terminalY);
      refGrad.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.85)" : "rgba(22, 16, 12, 0.65)");
      refGrad.addColorStop(0.5, isDark ? "rgba(230, 126, 84, 0.90)" : "rgba(168, 71, 27, 0.75)");
      refGrad.addColorStop(1, isDark ? whiteHot : clay);
      ctx.strokeStyle = refGrad;
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intUpper.x, intUpper.y);
      ctx.lineTo(terminalX, terminalY);
      ctx.moveTo(hitPt.x, hitPt.y);
      ctx.lineTo(intLower.x, intLower.y);
      ctx.lineTo(terminalX, terminalY);
      ctx.stroke();

      // =========================================================================
      // 4. RADIANT OPTIC FOCAL CORE (BLINDING CONVERGENCE SPOT)
      // =========================================================================
      const corePulse = Math.sin(time * 8.0) * 0.15 + 1.0 + surgeEnergy * 0.6;
      const coreRadius = prismSize * 0.28 * corePulse;

      ctx.save();
      const focalBloom = ctx.createRadialGradient(
        terminalX,
        terminalY,
        0,
        terminalX,
        terminalY,
        coreRadius * 2.2,
      );
      focalBloom.addColorStop(0, whiteHot);
      focalBloom.addColorStop(0.25, isDark ? "rgba(255, 245, 230, 0.95)" : clay);
      focalBloom.addColorStop(0.55, isDark ? clayGlow : "rgba(168, 71, 27, 0.40)");
      focalBloom.addColorStop(0.85, isDark ? amberGlow : "rgba(217, 119, 6, 0.18)");
      focalBloom.addColorStop(1, "transparent");
      ctx.fillStyle = focalBloom;
      ctx.beginPath();
      ctx.arc(terminalX, terminalY, coreRadius * 2.2, 0, TAU);
      ctx.fill();

      // Blinding white-hot optic center point
      ctx.fillStyle = whiteHot;
      ctx.shadowColor = isDark ? clay : clayGlow;
      ctx.shadowBlur = 14 * dpr;
      ctx.beginPath();
      ctx.arc(terminalX, terminalY, 3.6 * dpr * corePulse, 0, TAU);
      ctx.fill();

      // Subtle orbiting dielectric micro-sparks
      for (let s = 0; s < 4; s++) {
        const sAngle = time * 6.0 + s * (TAU / 4);
        const sDist = coreRadius * (0.6 + Math.sin(time * 10 + s) * 0.2);
        const sx = terminalX + Math.cos(sAngle) * sDist;
        const sy = terminalY + Math.sin(sAngle) * sDist;
        ctx.fillStyle = isDark ? whiteHot : clay;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2 * dpr, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // =========================================================================
      // 5. THE TESLA × PINK FLOYD CHROMATIC DISPERSION FIELD
      // =========================================================================
      // Wide fanning chromatic spectrum that fills the right half of the hero!
      const fanSpan = w * (isMobile ? 0.46 : 0.55);
      const bend = (currentY / h - 0.28) * 0.14;

      // (A) Volumetric Undulating Chromatic Ribbons (Pink Floyd meets fluid wave dynamics)
      const ribbonSteps = 36;
      for (let i = 0; i < SPECTRAL_WAVE_BANDS.length - 1; i++) {
        const b1 = SPECTRAL_WAVE_BANDS[i];
        const b2 = SPECTRAL_WAVE_BANDS[i + 1];

        const a1 = b1.angle + bend;
        const a2 = b2.angle + bend;

        const end1X = terminalX + Math.cos(a1) * fanSpan;
        const end1Y = terminalY + Math.sin(a1) * fanSpan;
        const end2X = terminalX + Math.cos(a2) * fanSpan;
        const end2Y = terminalY + Math.sin(a2) * fanSpan;

        const w1 = computeWavePoints(
          terminalX,
          terminalY,
          end1X,
          end1Y,
          b1.frequency,
          b1.speed,
          b1.amplitude,
          b1.seed,
          ribbonSteps,
          false,
          surgeEnergy,
        );

        const w2 = computeWavePoints(
          terminalX,
          terminalY,
          end2X,
          end2Y,
          b2.frequency,
          b2.speed,
          b2.amplitude,
          b2.seed,
          ribbonSteps,
          false,
          surgeEnergy,
        );

        // Volumetric ribbon polygon between wave 1 and wave 2
        ctx.save();
        const rGrad = ctx.createLinearGradient(terminalX, terminalY, end1X, end1Y);
        rGrad.addColorStop(0, isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(22, 16, 12, 0.06)");
        rGrad.addColorStop(0.35, isDark ? b1.darkGlow : b1.lightGlow);
        rGrad.addColorStop(0.85, isDark ? b1.darkColor : b1.lightColor);
        rGrad.addColorStop(1, "transparent");

        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.moveTo(w1.ptsX[0], w1.ptsY[0]);
        for (let j = 1; j < w1.ptsX.length; j++) ctx.lineTo(w1.ptsX[j], w1.ptsY[j]);
        for (let j = w2.ptsX.length - 1; j >= 0; j--) ctx.lineTo(w2.ptsX[j], w2.ptsY[j]);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // (B) Braided Nikola Tesla High-Voltage Streamers (running along each spectral ribbon)
      for (const band of SPECTRAL_WAVE_BANDS) {
        const angle = band.angle + bend;
        let endX = terminalX + Math.cos(angle) * fanSpan;
        let endY = terminalY + Math.sin(angle) * fanSpan;

        // If band targets a constellation node, pull its discharge terminal toward that node!
        if (band.targetNodeIdx !== null && CONSTELLATION_NODES[band.targetNodeIdx]) {
          const tNode = CONSTELLATION_NODES[band.targetNodeIdx];
          endX = tNode.nx * w;
          endY = tNode.ny * h;
        }

        const glowCol = isDark ? band.darkGlow : band.lightGlow;
        const midCol = isDark ? band.darkColor : band.lightColor;
        const coreCol = band.isClayFlagship ? (isDark ? whiteHot : clay) : isDark ? whiteHot : midCol;

        drawTeslaArc(terminalX, terminalY, endX, endY, {
          amplitude: band.amplitude,
          frequency: band.frequency,
          speed: band.speed,
          seed: band.seed,
          glowColor: glowCol,
          midColor: midCol,
          coreColor: coreCol,
          glowWidth: band.isClayFlagship ? 6.0 : 4.2,
          midWidth: band.isClayFlagship ? 2.4 : 1.7,
          coreWidth: band.isClayFlagship ? 1.3 : 0.9,
          allowBranches: true,
          surge: surgeEnergy,
        });

        // Traveling charge pulses along the streamers
        const sparkProg = (time * 0.7 + band.seed * 0.4) % 1;
        if (sparkProg > 0.05 && sparkProg < 0.95) {
          const spX = terminalX + (endX - terminalX) * sparkProg;
          const spY = terminalY + (endY - terminalY) * sparkProg;

          ctx.save();
          ctx.fillStyle = isDark ? whiteHot : midCol;
          ctx.shadowColor = isDark ? whiteHot : glowCol;
          ctx.shadowBlur = 8 * dpr;
          ctx.beginPath();
          ctx.arc(spX, spY, (band.isClayFlagship ? 2.6 : 1.8) * dpr, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }

      // (C) Interactive High-Voltage Arc to Cursor (Magnetic Electrostatic Attraction)
      if (target.active) {
        const curDist = Math.hypot(currentX - terminalX, currentY - terminalY);
        if (curDist < w * 0.8) {
          // Primary lightning arc leaps to cursor
          drawTeslaArc(terminalX, terminalY, currentX, currentY, {
            amplitude: 26,
            frequency: 3.4,
            speed: 5.8,
            seed: 88.3,
            glowColor: isDark ? "rgba(230, 126, 84, 0.48)" : "rgba(168, 71, 27, 0.32)",
            midColor: clay,
            coreColor: isDark ? whiteHot : clay,
            glowWidth: 6.5,
            midWidth: 2.8,
            coreWidth: 1.5,
            allowBranches: true,
            surge: Math.max(0.3, surgeEnergy),
          });

          // Secondary harmonic lightning arc
          drawTeslaArc(terminalX, terminalY, currentX, currentY, {
            amplitude: 18,
            frequency: 4.8,
            speed: -4.5,
            seed: 44.1,
            glowColor: isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(217, 119, 6, 0.22)",
            midColor: isDark ? "#F59E0B" : "#D97706",
            coreColor: whiteHot,
            glowWidth: 4.5,
            midWidth: 1.8,
            coreWidth: 1.0,
            allowBranches: false,
            surge: surgeEnergy,
          });

          // Dancing micro-sparks grounding at cursor
          for (let m = 0; m < 4; m++) {
            const mAngle = (time * 9.0 + m * (TAU / 4)) % TAU;
            const mDist = (10 + Math.sin(time * 14 + m) * 5) * dpr;
            const mx = currentX + Math.cos(mAngle) * mDist;
            const my = currentY + Math.sin(mAngle) * mDist;

            ctx.save();
            ctx.fillStyle = isDark ? whiteHot : clay;
            ctx.shadowColor = isDark ? whiteHot : clayGlow;
            ctx.shadowBlur = 6 * dpr;
            ctx.beginPath();
            ctx.arc(mx, my, 1.6 * dpr, 0, TAU);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // =========================================================================
      // 6. CONSTELLATION NETWORK & ELECTRICAL GROUNDING
      // =========================================================================
      const clayEdge = isDark ? "rgba(230, 126, 84, 0.44)" : "rgba(168, 71, 27, 0.34)";
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

      // Nodes with electrical resonance
      for (let nIdx = 0; nIdx < CONSTELLATION_NODES.length; nIdx++) {
        const node = CONSTELLATION_NODES[nIdx];
        const nx = node.nx * w;
        const ny = node.ny * h;

        const dist = Math.hypot(currentX - nx, currentY - ny);
        const proxFactor = Math.max(0, 1 - dist / (160 * dpr));

        const pulse = Math.sin(time * 2.5 + node.phase) * 0.32 + 1.0 + surgeEnergy * 0.5;
        const r = (node.radius + proxFactor * 1.5) * dpr * pulse;
        if (r <= 0) continue;

        ctx.fillStyle = node.isClay ? clay : starFill;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, TAU);
        ctx.fill();

        if (node.isClay || proxFactor > 0.15 || surgeEnergy > 0.1) {
          ctx.save();
          ctx.shadowColor = node.isClay ? clayGlow : isDark ? "rgba(248, 246, 240, 0.5)" : clayGlow;
          ctx.shadowBlur = (node.isClay ? 10 : 6) * dpr * (1 + proxFactor + surgeEnergy);
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

      // =========================================================================
      // 7. ATMOSPHERIC DUST MOTES
      // =========================================================================
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

      // =========================================================================
      // 8. PRISM GLASS SHELL & ARCHITECTURAL DRAFTING ACCENTS
      // =========================================================================
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
      currentX = width * 0.70;
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
      if (y >= -160 && y <= cssHeight + 160 && x >= -50 && x <= cssWidth + 50) {
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
          maxRadius: Math.min(width, height) * 0.5,
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
