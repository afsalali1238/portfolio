import { useEffect, useRef, useState } from "react";
import { CICADA_GRID_W, CICADA_GRID_H, CICADA_GRID_DATA } from "./cicadaGridData";

export type MatrixArtworkId = "man-behind" | "ape-ak47" | "cicada";
export type ColorTheme = "emerald" | "amber" | "cyan";
export type WalkGait = "striding" | "sprinting" | "vigil";

interface ArtworkMeta {
  id: MatrixArtworkId;
  label: string;
  badge: string;
  telemetry: string;
  hint: string;
}

const ARTWORKS: ArtworkMeta[] = [
  {
    id: "man-behind",
    label: "The Man Behind",
    badge: "OPERATOR_WALKING_INTO_DARKNESS",
    telemetry: "IDENTITY: THE_MAN_BEHIND | CADENCE: WALKING_INTO_VOID",
    hint: "Dark void silhouette striding into digital matrix rain · Click to scan",
  },
  {
    id: "ape-ak47",
    label: "Ape AK-47 (Video)",
    badge: "CHIMP_AK47_LIVE_MATRIX",
    telemetry: "IDENTITY: TACTICAL_OPERATOR | CALIBER: 7.62×39MM",
    hint: "Click to FIRE BURST · Gun recoil & ejected brass casings",
  },
  {
    id: "cicada",
    label: "Cicada (Emergence)",
    badge: "17_YEAR_PERIODICAL",
    telemetry: "IDENTITY: CICADA · WINGS FIRST | CYCLE: 17_YEARS",
    hint: "Click for Chirp Wave · Move cursor to bend digital rain",
  },
];

interface CasingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  alpha: number;
  life: number;
}

interface SporeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
}

export function MatrixSilhouette({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeArtwork, setActiveArtwork] = useState<MatrixArtworkId>("man-behind");
  const activeArtworkRef = useRef<MatrixArtworkId>(activeArtwork);
  activeArtworkRef.current = activeArtwork;

  const [colorTheme, setColorTheme] = useState<ColorTheme>("emerald");
  const colorThemeRef = useRef<ColorTheme>(colorTheme);
  colorThemeRef.current = colorTheme;

  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Man Behind Walk Controls
  const [walkGait, setWalkGait] = useState<WalkGait>("striding");
  const walkGaitRef = useRef<WalkGait>(walkGait);
  walkGaitRef.current = walkGait;

  const [neuralCoreActive, setNeuralCoreActive] = useState(false);
  const neuralCoreRef = useRef(neuralCoreActive);
  neuralCoreRef.current = neuralCoreActive;

  // Ape AK-47 Controls
  const [bulletTimeActive, setBulletTimeActive] = useState(false);
  const bulletTimeRef = useRef(bulletTimeActive);
  bulletTimeRef.current = bulletTimeActive;

  const [ammoCount, setAmmoCount] = useState(30);
  const ammoRef = useRef(ammoCount);
  ammoRef.current = ammoCount;

  // Cicada Controls
  const [cicadaEmerged, setCicadaEmerged] = useState(true);
  const cicadaEmergedRef = useRef(cicadaEmerged);
  cicadaEmergedRef.current = cicadaEmerged;

  // Audio synthesizer instance
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthesizedSound = (type: "laser" | "gunshot" | "chirp") => {
    if (!soundEnabledRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const actx = audioCtxRef.current;
      if (actx.state === "suspended") actx.resume();

      if (type === "gunshot") {
        const bufferSize = actx.sampleRate * 0.18;
        const buffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (actx.sampleRate * 0.04));
        }
        const noise = actx.createBufferSource();
        noise.buffer = buffer;
        const gain = actx.createGain();
        gain.gain.setValueAtTime(0.35, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.18);
        noise.connect(gain);
        gain.connect(actx.destination);
        noise.start();
      } else if (type === "laser") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(900, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, actx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start();
        osc.stop(actx.currentTime + 0.25);
      } else if (type === "chirp") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(4400, actx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(5800, actx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start();
        osc.stop(actx.currentTime + 0.2);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const mouseRef = useRef<{ x: number; y: number; active: boolean; lastMove: number }>({
    x: -9999,
    y: -9999,
    active: false,
    lastMove: 0,
  });

  const sonarBeamRef = useRef<{ y: number; active: boolean }>({ y: 0, active: false });
  const shakeRef = useRef<{ x: number; y: number; decay: number }>({ x: 0, y: 0, decay: 0 });
  const flashAlphaRef = useRef<number>(0);
  const casingsRef = useRef<CasingParticle[]>([]);
  const sporesRef = useRef<SporeParticle[]>([]);
  const pulsesRef = useRef<{ t0: number }[]>([]);

  // Trigger Sonar Laser Sweep (The Man Behind)
  const triggerSonarSweep = () => {
    sonarBeamRef.current = { y: 0, active: true };
    playSynthesizedSound("laser");
  };

  // Trigger Fire Burst (Ape AK-47)
  const triggerBurstFire = (originX?: number, originY?: number) => {
    setAmmoCount((prev) => {
      const next = prev - 3;
      if (next <= 0) {
        setTimeout(() => setAmmoCount(30), 1200);
        return 0;
      }
      return next;
    });

    flashAlphaRef.current = 0.85;
    shakeRef.current = {
      x: (Math.random() - 0.5) * 14,
      y: (Math.random() - 0.5) * 12,
      decay: 0.82,
    };

    playSynthesizedSound("gunshot");

    const canvas = canvasRef.current;
    const baseW = canvas ? canvas.width / (window.devicePixelRatio || 1) : 800;
    const baseH = canvas ? canvas.height / (window.devicePixelRatio || 1) : 450;
    const spawnX = originX ?? baseW * 0.58;
    const spawnY = originY ?? baseH * 0.44;

    for (let i = 0; i < 3; i++) {
      casingsRef.current.push({
        x: spawnX + (Math.random() - 0.5) * 10,
        y: spawnY + (Math.random() - 0.5) * 10,
        vx: 3.5 + Math.random() * 4.5,
        vy: -4.5 - Math.random() * 4.0,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
        alpha: 1.0,
        life: 0,
      });
    }
  };

  // Trigger Cicada Chirp Pulse & Spores
  const triggerChirpPulse = () => {
    pulsesRef.current.push({ t0: performance.now() });
    playSynthesizedSound("chirp");

    const canvas = canvasRef.current;
    const baseW = canvas ? canvas.width / (window.devicePixelRatio || 1) : 800;
    const baseH = canvas ? canvas.height / (window.devicePixelRatio || 1) : 450;
    for (let i = 0; i < 18; i++) {
      sporesRef.current.push({
        x: baseW / 2 + (Math.random() - 0.5) * 120,
        y: baseH / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 3.5,
        vy: -1.5 - Math.random() * 2.5,
        alpha: 0.9,
        size: 2 + Math.random() * 3,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let tick = 0;
    let isVisible = true;
    let isRunning = true;

    // Authentic Katakana & Matrix Alphanumeric Character Set
    const CHARS = "0123456789ABCDEF$#@%&*+-/=<>~VUGX日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";
    const DECRYPT_WORDS = ["OP:AFSAL", "SYS:BUILDER", "NODE:DUBAI", "PORT:0x443", "LAT:25.2048", "LON:55.2708", "STATUS:ARMED", "VERIFIED"];

    // 1. Offscreen mask for human silhouette
    const humanMaskCanvas = document.createElement("canvas");
    const humanMaskCtx = humanMaskCanvas.getContext("2d", { willReadFrequently: true });

    // Authentic mask image extracted from the reference photo
    const maskImg = new Image();
    maskImg.src = "/man-behind-mask.png";
    let maskLoaded = false;
    maskImg.onload = () => {
      maskLoaded = true;
    };

    // 2. Offscreen mask for live AK-47 video
    const videoMaskCanvas = document.createElement("canvas");
    const videoMaskCtx = videoMaskCanvas.getContext("2d", { willReadFrequently: true });

    // Video element for live video matrix mode
    const video = document.createElement("video");
    video.src = "/chimp-ak47.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.crossOrigin = "anonymous";

    /**
     * Draws the dynamic walking human silhouette onto the offscreen mask.
     * Uses the authentic mask extracted directly from the reference photo,
     * maintaining proportional centering across all screen aspect ratios.
     */
    const drawWalkingHumanSilhouette = (
      mCtx: CanvasRenderingContext2D,
      w: number,
      h: number,
      swayX: number,
      bobY: number,
      shoulderTilt: number,
    ) => {
      mCtx.clearRect(0, 0, w, h);
      mCtx.save();

      // Reference aspect ratio of the bust silhouette (553 / 574 ≈ 0.963)
      const targetH = Math.min(h * 0.94, w * 0.92);
      const targetW = targetH * 0.963;
      const headCenterY = h * 0.44 + bobY;
      const centerX = w * 0.5 + swayX;

      mCtx.translate(centerX, headCenterY);
      mCtx.rotate(shoulderTilt);

      if (maskLoaded) {
        mCtx.drawImage(maskImg, -targetW / 2, -targetH * 0.44, targetW, targetH);
      } else {
        // Fallback while mask image loads
        const headR = targetH * 0.16;
        mCtx.fillStyle = "#ffffff";
        mCtx.beginPath();
        mCtx.ellipse(0, -headR * 1.1, headR * 0.85, headR * 1.1, 0, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.beginPath();
        mCtx.moveTo(-targetW * 0.45, targetH * 0.5);
        mCtx.lineTo(-headR * 0.6, -headR * 0.1);
        mCtx.lineTo(headR * 0.6, -headR * 0.1);
        mCtx.lineTo(targetW * 0.45, targetH * 0.5);
        mCtx.closePath();
        mCtx.fill();
      }

      mCtx.restore();
    };

    // Columns state for dense matrix digital rain simulation
    let rainDrops: {
      y: number;
      speed: number;
      length: number;
      chars: string[];
    }[] = [];

    const initRainColumns = (colsCount: number, h: number) => {
      rainDrops = new Array(colsCount);
      for (let i = 0; i < colsCount; i++) {
        const len = 12 + Math.floor(Math.random() * 22);
        const chars: string[] = [];
        for (let j = 0; j < len; j++) {
          chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
        rainDrops[i] = {
          y: Math.random() * -h * 1.5,
          speed: 1.4 + Math.random() * 2.8,
          length: len,
          chars,
        };
      }
    };

    const getCellSize = (w: number) => {
      if (w < 480) return 9;
      if (w < 768) return 10;
      if (w < 1280) return 11;
      return 12;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(10, Math.floor(rect.width));
      height = Math.max(10, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Downscaled offscreen mask for fast 60fps walking silhouette sampling
      humanMaskCanvas.width = Math.max(10, Math.floor(width / 2));
      humanMaskCanvas.height = Math.max(10, Math.floor(height / 2));

      // Video mask resize
      videoMaskCanvas.width = Math.max(10, Math.floor(width / 2));
      videoMaskCanvas.height = Math.max(10, Math.floor(height / 2));

      const cellSize = getCellSize(width);
      initRainColumns(Math.floor(width / cellSize) + 2, height);
    };

    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    // Main render loop
    const render = (now: number) => {
      if (!isRunning) return;

      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      tick++;
      if (width <= 0 || height <= 0) {
        resize();
      }

      // Recoil shake offset
      const shake = shakeRef.current;
      let offsetX = 0;
      let offsetY = 0;
      if (Math.abs(shake.x) > 0.1 || Math.abs(shake.y) > 0.1) {
        offsetX = shake.x;
        offsetY = shake.y;
        shake.x *= shake.decay;
        shake.y *= shake.decay;
      }

      ctx.save();
      ctx.translate(offsetX, offsetY);

      ctx.clearRect(-20, -20, width + 40, height + 40);

      // Pitch Black Matrix Terminal Horizon
      ctx.fillStyle = "#000000";
      ctx.fillRect(-20, -20, width + 40, height + 40);

      const mode = activeArtworkRef.current;
      const theme = colorThemeRef.current;
      const gait = walkGaitRef.current;

      const cellSize = getCellSize(width);
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);

      ctx.font = `600 ${cellSize - 2}px "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const mouse = mouseRef.current;
      const pulses = pulsesRef.current;
      const sonar = sonarBeamRef.current;

      // Handle video play/pause
      if (mode === "ape-ak47") {
        video.playbackRate = bulletTimeRef.current ? 0.35 : 1.0;
        if (video.paused) video.play().catch(() => {});
      } else {
        if (!video.paused) video.pause();
      }

      // Progress Sonar Beam
      if (sonar.active) {
        sonar.y += 14;
        if (sonar.y > height + 80) {
          sonar.active = false;
        }
      }

      // CRT Phosphor Color Palette (High-vibrancy Matrix green, Amber, Cyan)
      const getThemeColor = (type: "head" | "bright" | "mid" | "dim" | "void", alpha = 1.0) => {
        if (theme === "amber") {
          if (type === "head") return `rgba(254, 243, 199, ${alpha})`;
          if (type === "bright") return `rgba(251, 191, 36, ${alpha})`;
          if (type === "mid") return `rgba(245, 158, 11, ${alpha})`;
          if (type === "dim") return `rgba(180, 83, 9, ${alpha})`;
          return `rgba(20, 10, 0, ${alpha * 0.25})`;
        }
        if (theme === "cyan") {
          if (type === "head") return `rgba(236, 254, 255, ${alpha})`;
          if (type === "bright") return `rgba(103, 232, 249, ${alpha})`;
          if (type === "mid") return `rgba(34, 211, 238, ${alpha})`;
          if (type === "dim") return `rgba(14, 116, 144, ${alpha})`;
          return `rgba(0, 15, 25, ${alpha * 0.25})`;
        }
        // Iconic Matrix Neon Green (matching user uploaded reference image)
        if (type === "head") return `rgba(240, 253, 244, ${alpha})`; // Crisp white-mint lead
        if (type === "bright") return `rgba(0, 255, 102, ${alpha})`; // Vibrant laser matrix green
        if (type === "mid") return `rgba(34, 197, 94, ${alpha})`; // Core phosphor green
        if (type === "dim") return `rgba(21, 128, 61, ${alpha})`; // Deeper shadow rain
        return `rgba(0, 30, 12, ${alpha * 0.18})`; // Faint void trace
      };

      // Advance rain drops simulation
      for (let i = 0; i < rainDrops.length; i++) {
        const drop = rainDrops[i];
        if (!drop) continue;
        drop.y += drop.speed;
        if (drop.y > height + 100) {
          drop.y = -drop.length * cellSize - Math.random() * 80;
          drop.speed = 1.4 + Math.random() * 2.8;
        }
        // Occasional character flicker
        if (tick % 5 === 0 && Math.random() < 0.2) {
          const idx = Math.floor(Math.random() * drop.length);
          drop.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      // ==========================================
      // ARTWORK 1: The Man Behind (Walking into the Darkness)
      // Matches the exact uploaded reference: Dense Green Matrix Rain outside,
      // and a Negative Void Silhouette walking into the darkness!
      // ==========================================
      if (mode === "man-behind") {
        // Calculate dynamic walking cycle kinematics
        const walkSpeedMultiplier = gait === "sprinting" ? 1.8 : gait === "vigil" ? 0 : 1.0;
        const walkCycle = now * 0.0028 * walkSpeedMultiplier;

        const figureScale = Math.min(height * 0.92, width * 0.72);
        const swayX = gait === "vigil" ? 0 : Math.sin(walkCycle) * (figureScale * 0.018);
        const bobY = gait === "vigil" ? 0 : Math.abs(Math.sin(walkCycle * 2)) * (figureScale * 0.014);
        const shoulderTilt = gait === "vigil" ? 0 : Math.sin(walkCycle) * 0.016;
        const armSwing = gait === "vigil" ? 0 : Math.sin(walkCycle) * (figureScale * 0.026);

        const maskW = humanMaskCanvas.width;
        const maskH = humanMaskCanvas.height;

        // Draw walking silhouette on offscreen mask
        if (humanMaskCtx && maskW > 0 && maskH > 0) {
          const scaledSway = (swayX / width) * maskW;
          const scaledBob = (bobY / height) * maskH;
          drawWalkingHumanSilhouette(humanMaskCtx, maskW, maskH, scaledSway, scaledBob, shoulderTilt);
        }

        const maskData = humanMaskCtx?.getImageData(0, 0, maskW, maskH);
        const centerX = width * 0.5 + swayX;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;

            let isInside = false;
            let isEdge = false;

            if (maskData) {
              const mx = Math.min(Math.floor((x / width) * maskW), maskW - 1);
              const my = Math.min(Math.floor((y / height) * maskH), maskH - 1);
              const idx = (my * maskW + mx) * 4;
              isInside = maskData.data[idx] > 90;

              // Check boundary for razor-sharp silhouette edge contour
              if (isInside) {
                const checkDist = 3;
                const leftIdx = (my * maskW + Math.max(0, mx - checkDist)) * 4;
                const rightIdx = (my * maskW + Math.min(maskW - 1, mx + checkDist)) * 4;
                const upIdx = (Math.max(0, my - checkDist) * maskW + mx) * 4;
                const downIdx = (Math.min(maskH - 1, my + checkDist) * maskW + mx) * 4;

                if (
                  maskData.data[leftIdx] < 90 ||
                  maskData.data[rightIdx] < 90 ||
                  maskData.data[upIdx] < 90 ||
                  maskData.data[downIdx] < 90
                ) {
                  isEdge = true;
                }
              }
            }

            // Character from falling rain drop column
            const drop = rainDrops[c % rainDrops.length];
            const dropRowHead = drop ? Math.floor((drop.y / height) * rows) : 0;
            const distFromHead = r - dropRowHead;
            const charSeed = (r * 1337 + c * 31 + Math.floor(tick / 16)) % CHARS.length;
            let char = CHARS[charSeed];

            // Sonar laser beam decryption
            let sonarHit = false;
            if (sonar.active && Math.abs(y - sonar.y) < 30) {
              sonarHit = true;
              if (isInside && c % 4 === 0) {
                char = DECRYPT_WORDS[(r + c) % DECRYPT_WORDS.length][c % 4] || char;
              }
            }

            // Neural core spine illumination
            const isSpine =
              neuralCoreRef.current &&
              Math.abs(x - centerX) < 14 &&
              y > height * 0.28 + bobY &&
              y < height * 0.92;

            let mouseDist = 999;
            if (mouse.active) {
              mouseDist = Math.hypot(x - mouse.x, y - mouse.y);
            }

            // --- COLOR DETERMINATION ---
            if (sonarHit) {
              // Laser sweep illumination
              ctx.fillStyle = getThemeColor("head", 1.0);
            } else if (isSpine) {
              // Glowing neural data packets
              const spinePulse = 0.75 + 0.25 * Math.sin(now * 0.009 - y * 0.04);
              ctx.fillStyle = getThemeColor("head", spinePulse);
            } else if (isInside) {
              // INSIDE SILHOUETTE: EXACTLY LIKE REFERENCE IMAGE!
              // In the reference image, the matrix characters are still present inside the bust,
              // but very dim/dark phosphor green (~0.30 - 0.40 alpha)!
              if (isEdge) {
                // Razor-sharp illuminated green contour tracing the head & shoulders
                ctx.fillStyle = mouseDist < 85 ? getThemeColor("head", 1.0) : getThemeColor("bright", 0.95);
              } else {
                if (mouseDist < 95) {
                  // Cursor hover acts like a decryption scanner
                  const glow = 1 - mouseDist / 95;
                  ctx.fillStyle = getThemeColor("bright", glow * 0.85);
                } else {
                  // Authentic subterranean dark green characters (matches reference photo!)
                  ctx.fillStyle = getThemeColor("dim", 0.32);
                }
              }
            } else {
              // OUTSIDE SILHOUETTE: DENSE VIBRANT GREEN MATRIX RAIN!
              if (mouseDist < 85) {
                // Proximity cursor glow
                ctx.fillStyle = getThemeColor("head", 1.0);
              } else if (distFromHead === 0) {
                // White-mint head of the falling drop
                ctx.fillStyle = getThemeColor("head", 1.0);
              } else if (distFromHead > 0 && distFromHead < (drop?.length || 20)) {
                // Vivid phosphor green rain trail
                if (distFromHead < 4) {
                  ctx.fillStyle = getThemeColor("bright", 0.98);
                } else {
                  const trailAlpha = Math.max(0.40, 1 - distFromHead / (drop?.length || 20));
                  ctx.fillStyle = getThemeColor("mid", trailAlpha);
                }
              } else {
                // Dense cascading ambient matrix rain
                const ambientAlpha = ((r * 7 + c * 13) % 4 === 0) ? 0.70 : 0.46;
                ctx.fillStyle = getThemeColor("mid", ambientAlpha);
              }
            }

            ctx.fillText(char, x, y);
          }
        }

        // Draw laser sweep bar
        if (sonar.active) {
          ctx.strokeStyle = getThemeColor("head", 0.85);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, sonar.y);
          ctx.lineTo(width, sonar.y);
          ctx.stroke();

          const grad = ctx.createLinearGradient(0, sonar.y - 14, 0, sonar.y + 14);
          grad.addColorStop(0, "transparent");
          grad.addColorStop(0.5, getThemeColor("bright", 0.4));
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.fillRect(0, sonar.y - 14, width, 28);
        }

        // Deep darkness fade at bottom: walking into the digital abyss
        const bottomDarkness = ctx.createLinearGradient(0, height * 0.65, 0, height);
        bottomDarkness.addColorStop(0, "rgba(0, 0, 0, 0)");
        bottomDarkness.addColorStop(0.65, "rgba(0, 0, 0, 0.75)");
        bottomDarkness.addColorStop(1, "rgba(0, 0, 0, 0.98)");
        ctx.fillStyle = bottomDarkness;
        ctx.fillRect(0, height * 0.65, width, height * 0.35);
      }

      // ==========================================
      // ARTWORK 2: Ape AK-47 (Live Video Matrix)
      // ==========================================
      else if (mode === "ape-ak47") {
        const maskW = videoMaskCanvas.width;
        const maskH = videoMaskCanvas.height;

        let videoMaskData: ImageData | null = null;
        if (videoMaskCtx && video.readyState >= 2 && maskW > 0 && maskH > 0) {
          videoMaskCtx.clearRect(0, 0, maskW, maskH);
          const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
          const canvasAspect = maskW / maskH;
          let drawW = maskW;
          let drawH = maskH;
          let drawX = 0;
          let drawY = 0;

          if (canvasAspect > videoAspect) {
            drawH = maskW / videoAspect;
            drawY = (maskH - drawH) / 2;
          } else {
            drawW = maskH * videoAspect;
            drawX = (maskW - drawW) / 2;
          }

          videoMaskCtx.drawImage(video, drawX, drawY, drawW, drawH);
          videoMaskData = videoMaskCtx.getImageData(0, 0, maskW, maskH);
        }

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;

            let lum = 0;
            if (videoMaskData) {
              const mx = Math.min(Math.floor((x / width) * maskW), maskW - 1);
              const my = Math.min(Math.floor((y / height) * maskH), maskH - 1);
              const idx = (my * maskW + mx) * 4;
              const red = videoMaskData.data[idx];
              const green = videoMaskData.data[idx + 1];
              const blue = videoMaskData.data[idx + 2];
              lum = 0.299 * red + 0.587 * green + 0.114 * blue;
            }

            const seed = (r * 1337 + c * 31 + Math.floor(tick / 14)) % CHARS.length;
            const char = CHARS[seed];

            let mouseDist = 999;
            if (mouse.active) {
              mouseDist = Math.hypot(x - mouse.x, y - mouse.y);
            }

            if (mouseDist < 85) {
              const intensity = 1 - mouseDist / 85;
              ctx.fillStyle =
                mouseDist < 28
                  ? getThemeColor("head", 0.94 + intensity * 0.06)
                  : getThemeColor("bright", 0.72 + intensity * 0.28);
            } else {
              if (lum > 170) {
                ctx.fillStyle = getThemeColor("head", 0.92 + (tick % 3) * 0.04);
              } else if (lum > 115) {
                ctx.fillStyle = getThemeColor("bright", 0.82 + ((r + c) % 3) * 0.06);
              } else if (lum > 60) {
                ctx.fillStyle = getThemeColor("mid", 0.68 + ((r * 2 + c) % 4) * 0.06);
              } else if (lum > 24) {
                ctx.fillStyle = getThemeColor("dim", 0.38 + ((r + c) % 3) * 0.05);
              } else {
                const ambientAlpha = (r * 7 + c * 11) % 6 === 0 ? 0.14 : 0.05;
                ctx.fillStyle = getThemeColor("void", ambientAlpha);
              }
            }

            ctx.fillText(char, x, y);
          }
        }

        // Update and draw brass shell casings
        const casings = casingsRef.current;
        for (let i = casings.length - 1; i >= 0; i--) {
          const p = casings[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.38;
          p.rot += p.vRot;
          p.life++;
          p.alpha -= 0.018;

          if (p.alpha <= 0 || p.y > height + 40) {
            casings.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = theme === "amber" ? `rgba(251, 191, 36, ${p.alpha})` : `rgba(234, 179, 8, ${p.alpha})`;
          ctx.fillRect(-5, -2, 10, 4);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
          ctx.fillRect(-6, -1.5, 2, 3);
          ctx.restore();
        }

        // Muzzle flash screen flare
        if (flashAlphaRef.current > 0.02) {
          ctx.fillStyle = getThemeColor("head", flashAlphaRef.current * 0.4);
          ctx.fillRect(-20, -20, width + 40, height + 40);
          flashAlphaRef.current *= 0.72;
        }

        // Bullet-time supersonic tracer streaks
        if (bulletTimeRef.current && (tick % 6 === 0 || tick % 7 === 0)) {
          const streakY = height * 0.35 + (Math.random() - 0.5) * 60;
          ctx.strokeStyle = getThemeColor("head", 0.75);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(width * 0.56, streakY);
          ctx.lineTo(width, streakY + (Math.random() - 0.5) * 10);
          ctx.stroke();
        }
      }

      // ==========================================
      // ARTWORK 3: Cicada (Living Emergence)
      // ==========================================
      else if (mode === "cicada") {
        const emerged = cicadaEmergedRef.current;
        const breathe = 1 + Math.sin(now * 0.0011) * 0.005;
        const sway = Math.sin(now * 0.0006) * 3;
        const targetH = height * (emerged ? 0.9 : 0.72) * breathe;
        const targetW = targetH * (CICADA_GRID_W / CICADA_GRID_H);
        const ox = (width - targetW) / 2 + sway;
        const oy = (height - targetH) / 2;
        const tSec = now / 1000;

        for (let c = 0; c < cols; c++) {
          const speed = 0.6 + ((c * 7) % 5) * 0.18;
          const head = ((tick * speed + c * 13) % (rows + 8)) - 4;
          let bend = 0;
          if (mouse.active) {
            const dx = c * cellSize - mouse.x;
            bend = Math.max(-1.5, Math.min(1.5, -dx / 90)) * Math.exp(-Math.abs(dx) / 160);
          }
          for (let k = 0; k < 5; k++) {
            const r = Math.floor(head) - k;
            if (r < 0 || r >= rows) continue;
            const a = 0.16 - k * 0.03;
            ctx.fillStyle =
              k === 0 ? getThemeColor("bright", a + 0.1) : getThemeColor("head", a * 0.5);
            ctx.fillText(
              CHARS[(c * 31 + r * 7 + (tick >> 3)) % 16],
              c * cellSize + cellSize / 2 + bend * k * 2,
              r * cellSize + cellSize / 2,
            );
          }
        }

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;
            const gx = Math.floor(((x - ox) / targetW) * CICADA_GRID_W);
            const gy = Math.floor(((y - oy) / targetH) * CICADA_GRID_H);

            if (gx < 0 || gx >= CICADA_GRID_W || gy < 0 || gy >= CICADA_GRID_H) continue;
            const idx = gy * CICADA_GRID_W + gx;
            const val = CICADA_GRID_DATA.charCodeAt(idx) - 48;
            if (val <= 0) continue;

            const edge =
              gx === 0 ||
              gy === 0 ||
              gx === CICADA_GRID_W - 1 ||
              gy === CICADA_GRID_H - 1 ||
              CICADA_GRID_DATA[idx - 1] === "0" ||
              CICADA_GRID_DATA[idx + 1] === "0" ||
              CICADA_GRID_DATA[idx - CICADA_GRID_W] === "0" ||
              CICADA_GRID_DATA[idx + CICADA_GRID_W] === "0";

            let boost = 0;
            if (val >= 8 && emerged) {
              boost += 0.22 * (0.5 + 0.5 * Math.sin(tSec * 3 + gx * 0.18 + gy * 0.11));
            }
            if (mouse.active) {
              const d = Math.hypot(x - mouse.x, y - mouse.y);
              if (d < 110) boost += (1 - d / 110) * 0.45;
            }

            for (const p of pulses) {
              const age = (now - p.t0) / 700;
              if (age > 1) continue;
              const wave = Math.abs(
                Math.hypot(x - width / 2, y - height / 2) - age * Math.max(width, height) * 0.7,
              );
              if (wave < 28) boost += (1 - wave / 28) * (1 - age) * 0.95;
            }

            const a = Math.min(1, (emerged ? 0.25 : 0.15) + (val / 9) * 0.65 + boost);
            ctx.fillStyle =
              edge || val >= 8
                ? getThemeColor("bright", a)
                : val >= 5
                  ? getThemeColor("head", a * 0.9)
                  : getThemeColor("dim", a * 0.45);

            ctx.fillText(CHARS[(r * 31 + c * 17 + (tick >> 4)) % 16], x, y);
          }
        }

        const spores = sporesRef.current;
        for (let i = spores.length - 1; i >= 0; i--) {
          const sp = spores[i];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.alpha -= 0.015;
          if (sp.alpha <= 0) {
            spores.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fillStyle = getThemeColor("bright", sp.alpha);
          ctx.fill();
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
          if (now - pulses[i].t0 > 750) pulses.splice(i, 1);
        }
      }

      // Pointer tactical reticle HUD
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        ctx.save();
        ctx.strokeStyle = getThemeColor("bright", 0.55);
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(mouse.x - 28, mouse.y);
        ctx.lineTo(mouse.x - 10, mouse.y);
        ctx.moveTo(mouse.x + 10, mouse.y);
        ctx.lineTo(mouse.x + 28, mouse.y);
        ctx.moveTo(mouse.x, mouse.y - 28);
        ctx.lineTo(mouse.x, mouse.y - 10);
        ctx.moveTo(mouse.x, mouse.y + 10);
        ctx.lineTo(mouse.x, mouse.y + 28);
        ctx.stroke();

        ctx.font = `600 10px "SFMono-Regular", Menlo, Monaco, Consolas, monospace`;
        ctx.fillStyle = getThemeColor("head", 0.9);
        const subLabel =
          mode === "man-behind"
            ? `GAIT: ${gait.toUpperCase()}`
            : mode === "ape-ak47"
              ? `MAG: ${ammoRef.current}/30 · 7.62MM`
              : (cicadaEmergedRef.current ? "4.4 kHz RES" : "NYMPH PHASE");

        ctx.fillText(
          `${mode.toUpperCase()} // ${(mouse.x / width).toFixed(2)}, ${(mouse.y / height).toFixed(2)} [${subLabel}]`,
          mouse.x + 26,
          mouse.y - 6,
        );
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
        lastMove: performance.now(),
      };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    const handlePointerDown = (e: PointerEvent) => {
      handlePointerMove(e);
      const mode = activeArtworkRef.current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (mode === "man-behind") {
        triggerSonarSweep();
      } else if (mode === "ape-ak47") {
        triggerBurstFire(clickX, clickY);
      } else if (mode === "cicada") {
        triggerChirpPulse();
      }
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointerdown", handlePointerDown);

    const visObs = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible) {
        if (activeArtworkRef.current === "ape-ak47") video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
    visObs.observe(canvas);

    const onVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        video.pause();
      } else {
        isVisible = true;
        if (activeArtworkRef.current === "ape-ak47") video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      resizeObs.disconnect();
      visObs.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      video.pause();
      video.src = "";
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const currentMeta = ARTWORKS.find((a) => a.id === activeArtwork) || ARTWORKS[0];

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 w-full relative overflow-hidden bg-black select-none ${
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col h-screen w-screen"
          : `min-h-[560px] sm:min-h-[660px] md:min-h-[740px] lg:min-h-[800px] h-[78vh] max-h-[880px] ${className}`
      }`}
    >
      {/* 1. Main Canvas Display (Borderless Full-Bleed) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full block cursor-crosshair touch-none"
      />

      {/* 2. CRT Scanline Grid Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"
      />

      {/* 3. Soft Atmospheric Dissolves (No harsh box edges!) */}
      {/* Top soft fade into page header */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/60 to-transparent z-10"
      />
      {/* Bottom deep fade into page content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/80 to-transparent z-10"
      />
      {/* Side edge vignettes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-black via-black/50 to-transparent z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-black via-black/50 to-transparent z-10"
      />

      {/* 4. Top Floating Cyber HUD Pill */}
      <div className="absolute top-4 inset-x-0 z-20 flex justify-center px-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full border border-zinc-800/90 bg-zinc-950/75 px-3 py-1.5 backdrop-blur-md shadow-2xl shadow-emerald-950/20">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 border-r border-zinc-800">
            <span
              className={`h-2 w-2 rounded-full animate-pulse ${
                colorTheme === "amber"
                  ? "bg-amber-400"
                  : colorTheme === "cyan"
                    ? "bg-cyan-400"
                    : "bg-emerald-400"
              }`}
            />
            <span className="font-mono text-[10px] tracking-wider text-zinc-300 font-semibold uppercase hidden sm:inline">
              {currentMeta.badge}
            </span>
          </div>

          {/* 3 Artwork Switcher Tabs */}
          <div role="tablist" aria-label="Matrix Artworks" className="flex items-center gap-1">
            {ARTWORKS.map((artwork) => (
              <button
                key={artwork.id}
                role="tab"
                aria-selected={activeArtwork === artwork.id}
                type="button"
                onClick={() => setActiveArtwork(artwork.id)}
                className={`rounded-full px-2.5 sm:px-3 py-1 text-xs font-mono transition-all whitespace-nowrap ${
                  activeArtwork === artwork.id
                    ? colorTheme === "amber"
                      ? "bg-amber-500/25 text-amber-300 font-semibold border border-amber-500/40 shadow-sm"
                      : colorTheme === "cyan"
                        ? "bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm"
                        : "bg-emerald-500/25 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {artwork.id === "man-behind" ? (
                  <>
                    <span className="sm:hidden">Man Behind</span>
                    <span className="hidden sm:inline">The Man Behind</span>
                  </>
                ) : (
                  artwork.label
                )}
              </button>
            ))}
          </div>

          {/* Controls: Phosphor Theme + Sound + Fullscreen */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
            {/* Color CRT Theme Switcher */}
            <div className="flex items-center rounded-full border border-zinc-800 bg-black/60 p-0.5">
              <button
                type="button"
                onClick={() => setColorTheme("emerald")}
                title="Matrix Emerald Phosphor"
                className={`h-5 w-5 rounded-full text-[10px] font-bold transition-all ${
                  colorTheme === "emerald"
                    ? "bg-emerald-500 text-black shadow-sm"
                    : "text-emerald-500 hover:bg-zinc-800"
                }`}
              >
                M
              </button>
              <button
                type="button"
                onClick={() => setColorTheme("amber")}
                title="Retro Amber CRT"
                className={`h-5 w-5 rounded-full text-[10px] font-bold transition-all ${
                  colorTheme === "amber"
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-amber-500 hover:bg-zinc-800"
                }`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setColorTheme("cyan")}
                title="Cyber Cyan Phosphor"
                className={`h-5 w-5 rounded-full text-[10px] font-bold transition-all ${
                  colorTheme === "cyan"
                    ? "bg-cyan-500 text-black shadow-sm"
                    : "text-cyan-400 hover:bg-zinc-800"
                }`}
              >
                C
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono transition-colors ${
                soundEnabled
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                  : "border-zinc-800 bg-black/60 text-zinc-400 hover:text-zinc-200"
              }`}
              title={soundEnabled ? "Synthesizer SFX: ON" : "Synthesizer SFX: MUTED (Click to enable)"}
            >
              {soundEnabled ? "SFX: ON" : "SFX: OFF"}
            </button>

            {/* Fit to Screen / Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1 rounded-full border border-zinc-800 bg-black/60 px-2.5 py-0.5 text-[11px] font-mono text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
              title={isFullscreen ? "Exit Fullscreen (ESC)" : "Expand Stage"}
            >
              <span>{isFullscreen ? "✕" : "⛶"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Bottom Floating Tactical Action Dock */}
      <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center px-3 pointer-events-none">
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-950/85 px-3.5 py-1.5 backdrop-blur-md shadow-2xl max-w-[96vw]">
          {/* Man Behind Actions */}
          {activeArtwork === "man-behind" && (
            <>
              {/* Walking Cadence Selector */}
              <div className="flex items-center rounded-full border border-zinc-800 bg-black/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setWalkGait("striding")}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                    walkGait === "striding"
                      ? "bg-emerald-500/30 text-emerald-300 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Walking cadence into the darkness"
                >
                  🚶 Walk
                </button>
                <button
                  type="button"
                  onClick={() => setWalkGait("sprinting")}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                    walkGait === "sprinting"
                      ? "bg-emerald-500/30 text-emerald-300 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Accelerate pace into darkness"
                >
                  🏃 Sprint
                </button>
                <button
                  type="button"
                  onClick={() => setWalkGait("vigil")}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                    walkGait === "vigil"
                      ? "bg-emerald-500/30 text-emerald-300 font-semibold"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  title="Stationary silhouette vigil"
                >
                  🧍 Vigil
                </button>
              </div>

              {/* Sonar Decryptor */}
              <button
                type="button"
                onClick={triggerSonarSweep}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-3 py-1 text-[11px] text-emerald-300 font-medium transition-all"
              >
                <span>◈</span>
                <span>Sonar Decryptor</span>
              </button>

              {/* Neural Core */}
              <button
                type="button"
                onClick={() => setNeuralCoreActive(!neuralCoreActive)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                  neuralCoreActive
                    ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
                    : "border-zinc-800 bg-black/50 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>☵</span>
                <span>Neural Core: {neuralCoreActive ? "ON" : "OFF"}</span>
              </button>
            </>
          )}

          {/* Ape AK-47 Actions */}
          {activeArtwork === "ape-ak47" && (
            <>
              <button
                type="button"
                onClick={() => triggerBurstFire()}
                className="flex items-center gap-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 px-3.5 py-1 text-[11px] text-red-300 font-semibold tracking-wide transition-all shadow-sm"
              >
                <span>🔥</span>
                <span>FIRE BURST</span>
              </button>
              <button
                type="button"
                onClick={() => setBulletTimeActive(!bulletTimeActive)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                  bulletTimeActive
                    ? "bg-amber-500/25 border-amber-400 text-amber-300"
                    : "border-zinc-800 bg-black/50 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>⏱</span>
                <span>Bullet Time: {bulletTimeActive ? "0.35x" : "1.0x"}</span>
              </button>
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-black/60 px-3 py-1 text-[11px] text-zinc-400 font-mono">
                <span>MAG:</span>
                <span className={ammoCount < 9 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                  {ammoCount}/30
                </span>
                <span className="text-zinc-600">|</span>
                <span>7.62×39</span>
              </div>
            </>
          )}

          {/* Cicada Actions */}
          {activeArtwork === "cicada" && (
            <>
              <button
                type="button"
                onClick={triggerChirpPulse}
                className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-3 py-1 text-[11px] text-emerald-300 font-medium transition-all"
              >
                <span>♫</span>
                <span>Chirp Pulse</span>
              </button>
              <button
                type="button"
                onClick={() => setCicadaEmerged(!cicadaEmerged)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                  cicadaEmerged
                    ? "bg-emerald-500/25 border-emerald-400 text-emerald-300"
                    : "border-zinc-800 bg-black/50 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>⏳</span>
                <span>Phase: {cicadaEmerged ? "Emerged Adult" : "Nymph"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 6. Subtle Floating Ambient Telemetry */}
      <div className="pointer-events-none absolute bottom-3 left-6 hidden md:block text-[10px] font-mono text-zinc-500/70 z-20">
        SYS_LOC: 25.2048° N, 55.2708° E · DUBAI_NODE · PORT: 0x443
      </div>
      <div className="pointer-events-none absolute bottom-3 right-6 hidden md:block text-[10px] font-mono text-zinc-500/70 z-20">
        Click canvas to interact · Hover to scan
      </div>
    </div>
  );
}
