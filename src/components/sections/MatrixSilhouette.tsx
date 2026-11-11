import { useEffect, useRef, useState } from "react";
import { CICADA_GRID_W, CICADA_GRID_H, CICADA_GRID_DATA } from "./cicadaGridData";

export type MatrixArtworkId = "man-behind" | "ape-ak47" | "cicada";

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
    badge: "OPERATOR_BACKVIEW",
    telemetry: "IDENTITY: THE_MAN_BEHIND | MODEL: OPERATOR_CONTOUR",
    hint: "Hover to scan operator contour & matrix rain",
  },
  {
    id: "ape-ak47",
    label: "Ape AK-47 (Video)",
    badge: "CHIMP_AK47_LIVE_MATRIX",
    telemetry: "IDENTITY: TACTICAL_OPERATOR | CALIBER: 7.62×39MM",
    hint: "Live video matrix feed · Hover to illuminate reticle",
  },
  {
    id: "cicada",
    label: "Cicada (Emergence)",
    badge: "17_YEAR_PERIODICAL",
    telemetry: "IDENTITY: CICADA · WINGS FIRST | CYCLE: 17_YEARS",
    hint: "Move to bend digital rain · Click / Tap for chirp wave",
  },
];

/**
 * MatrixSilhouette — the interactive fit-to-screen Matrix Artworks Studio.
 *
 * Houses all 3 iconic artworks in a single, high-contrast, responsive terminal stage:
 * 1. "The Man Behind": Original human backview operator contour in green digital code.
 * 2. "Ape AK-47": Live real-time video matrix feed sampling /chimp-ak47.mp4 with object-cover fit.
 * 3. "Cicada": Living 17-year periodical cicada with wing shimmer, rain bending, and chirp waves.
 *
 * Presentation:
 * - Rendered as a prominent, full-width centerpiece (not washed out behind text in the background,
 *   and not squashed into a side column).
 * - Fit-to-screen widescreen 16:9 presentation + one-click Fullscreen toggle (ESC to exit).
 */
export function MatrixSilhouette({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeArtwork, setActiveArtwork] = useState<MatrixArtworkId>("man-behind");
  const activeArtworkRef = useRef<MatrixArtworkId>(activeArtwork);
  activeArtworkRef.current = activeArtwork;

  const [isFullscreen, setIsFullscreen] = useState(false);

  const mouseRef = useRef<{ x: number; y: number; active: boolean; lastMove: number }>({
    x: -9999,
    y: -9999,
    active: false,
    lastMove: 0,
  });

  const pulsesRef = useRef<{ t0: number }[]>([]);

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

    const CHARS = "0123456789ABCDEFVUGX#$@&*%";

    // 1. Offscreen mask for human silhouette
    const humanMaskCanvas = document.createElement("canvas");
    const humanMaskCtx = humanMaskCanvas.getContext("2d");

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
     * Draws the mathematical human operator backside silhouette
     */
    const drawHumanSilhouette = (mCtx: CanvasRenderingContext2D, w: number, h: number) => {
      mCtx.clearRect(0, 0, w, h);
      mCtx.fillStyle = "#ffffff";

      const centerX = w * 0.5;
      const headY = h * 0.28;
      const headRadius = Math.min(w, h) * 0.16;

      // Head
      mCtx.beginPath();
      mCtx.ellipse(centerX, headY, headRadius * 0.82, headRadius * 1.05, 0.04, 0, Math.PI * 2);
      mCtx.fill();

      // Neck
      const neckWidth = headRadius * 0.54;
      const neckTop = headY + headRadius * 0.7;
      const neckBottom = headY + headRadius * 1.34;
      mCtx.beginPath();
      mCtx.moveTo(centerX - neckWidth, neckTop);
      mCtx.lineTo(centerX + neckWidth, neckTop);
      mCtx.lineTo(centerX + neckWidth * 1.25, neckBottom);
      mCtx.lineTo(centerX - neckWidth * 1.25, neckBottom);
      mCtx.closePath();
      mCtx.fill();

      // Trapezius and shoulders
      const shoulderY = neckBottom;
      const shoulderSpan = Math.min(w * 0.44, 280);
      const waistY = h * 0.99;
      const waistSpan = shoulderSpan * 0.75;

      mCtx.beginPath();
      mCtx.moveTo(centerX - neckWidth * 1.1, neckTop + 5);
      // Left shoulder curve
      mCtx.bezierCurveTo(
        centerX - neckWidth * 1.8,
        shoulderY - 5,
        centerX - shoulderSpan * 0.75,
        shoulderY + 15,
        centerX - shoulderSpan,
        shoulderY + 45,
      );
      // Down to left torso / waist
      mCtx.bezierCurveTo(
        centerX - shoulderSpan * 0.95,
        shoulderY + 120,
        centerX - waistSpan * 1.05,
        waistY - 50,
        centerX - waistSpan,
        waistY,
      );
      // Across back bottom
      mCtx.lineTo(centerX + waistSpan, waistY);
      // Up right torso
      mCtx.bezierCurveTo(
        centerX + waistSpan * 1.05,
        waistY - 50,
        centerX + shoulderSpan * 0.95,
        shoulderY + 120,
        centerX + shoulderSpan,
        shoulderY + 45,
      );
      // Right shoulder curve back to neck
      mCtx.bezierCurveTo(
        centerX + shoulderSpan * 0.75,
        shoulderY + 15,
        centerX + neckWidth * 1.8,
        shoulderY - 5,
        centerX + neckWidth * 1.1,
        neckTop + 5,
      );
      mCtx.closePath();
      mCtx.fill();

      // Hair silhouette top bump
      mCtx.beginPath();
      mCtx.ellipse(
        centerX - headRadius * 0.08,
        headY - headRadius * 0.75,
        headRadius * 0.65,
        headRadius * 0.45,
        -0.08,
        0,
        Math.PI * 2,
      );
      mCtx.fill();
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

      // Human mask resize
      humanMaskCanvas.width = width;
      humanMaskCanvas.height = height;
      if (humanMaskCtx) {
        drawHumanSilhouette(humanMaskCtx, width, height);
      }

      // Video mask resize
      videoMaskCanvas.width = Math.max(10, Math.floor(width / 2));
      videoMaskCanvas.height = Math.max(10, Math.floor(height / 2));
    };

    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    const getCellSize = (w: number) => {
      if (w < 480) return 9;
      if (w < 768) return 10;
      if (w < 1280) return 11;
      return 12;
    };

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

      ctx.clearRect(0, 0, width, height);

      // Deep CRT terminal black
      ctx.fillStyle = "#070a08";
      ctx.fillRect(0, 0, width, height);

      const mode = activeArtworkRef.current;
      const cellSize = getCellSize(width);
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);

      ctx.font = `600 ${cellSize - 2}px "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const mouse = mouseRef.current;
      const pulses = pulsesRef.current;

      // Ensure video is playing only when active
      if (mode === "ape-ak47") {
        if (video.paused) video.play().catch(() => {});
      } else {
        if (!video.paused) video.pause();
      }

      // ==========================================
      // ARTWORK 1: The Man Behind (Human Silhouette)
      // ==========================================
      if (mode === "man-behind") {
        const maskData = humanMaskCtx?.getImageData(0, 0, width, height);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const x = c * cellSize + cellSize / 2;
            const y = r * cellSize + cellSize / 2;

            let isInside = false;
            let isEdge = false;

            if (maskData) {
              const px = Math.min(Math.floor(x), width - 1);
              const py = Math.min(Math.floor(y), height - 1);
              const idx = (py * width + px) * 4;
              isInside = maskData.data[idx] > 128;

              if (isInside) {
                const checkLeft = Math.max(0, px - 6);
                const checkRight = Math.min(width - 1, px + 6);
                const checkUp = Math.max(0, py - 6);
                const checkDown = Math.min(height - 1, py + 6);
                const leftIdx = (py * width + checkLeft) * 4;
                const rightIdx = (py * width + checkRight) * 4;
                const upIdx = (checkUp * width + px) * 4;
                const downIdx = (checkDown * width + px) * 4;

                if (
                  maskData.data[leftIdx] < 128 ||
                  maskData.data[rightIdx] < 128 ||
                  maskData.data[upIdx] < 128 ||
                  maskData.data[downIdx] < 128
                ) {
                  isEdge = true;
                }
              }
            }

            const seed = (r * 1337 + c * 31 + Math.floor(tick / 16)) % CHARS.length;
            const char = CHARS[seed];

            let mouseDist = 999;
            if (mouse.active) {
              mouseDist = Math.hypot(x - mouse.x, y - mouse.y);
            }

            if (isInside) {
              if (isEdge) {
                // High contrast silhouette contour
                ctx.fillStyle = mouseDist < 80 ? "#22c55e" : "#e4e4e7";
              } else {
                // Silhouette interior
                const depthVariance = ((r + c) % 4) * 0.1;
                if (mouseDist < 95) {
                  ctx.fillStyle = `rgba(74, 222, 128, ${0.85 - mouseDist / 140})`;
                } else {
                  ctx.fillStyle = `rgba(212, 212, 216, ${0.45 + depthVariance})`;
                }
              }
            } else {
              // Background matrix rain
              if (mouseDist < 85) {
                ctx.fillStyle = `rgba(161, 161, 170, ${0.55 - mouseDist / 120})`;
              } else {
                const subtleAlpha = (r * 7 + c * 11) % 5 === 0 ? 0.14 : 0.04;
                ctx.fillStyle = `rgba(34, 197, 94, ${subtleAlpha})`;
              }
            }

            ctx.fillText(char, x, y);
          }
        }
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

          // Centered cover scaling to fit screen without letterbox
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
                  ? `rgba(240, 253, 244, ${0.92 + intensity * 0.08})`
                  : `rgba(110, 231, 183, ${0.72 + intensity * 0.28})`;
            } else {
              if (lum > 170) {
                // Bright muzzle bursts
                ctx.fillStyle = `rgba(240, 253, 244, ${0.92 + (tick % 3) * 0.04})`;
              } else if (lum > 115) {
                // Upper mid-tones & reflections
                ctx.fillStyle = `rgba(110, 231, 183, ${0.82 + ((r + c) % 3) * 0.06})`;
              } else if (lum > 60) {
                // Chimp body & rifle
                ctx.fillStyle = `rgba(34, 197, 94, ${0.68 + ((r * 2 + c) % 4) * 0.06})`;
              } else if (lum > 24) {
                // Subtle shadows
                ctx.fillStyle = `rgba(22, 101, 52, ${0.42 + ((r + c) % 3) * 0.05})`;
              } else {
                // Ambient rain
                const ambientAlpha = (r * 7 + c * 11) % 6 === 0 ? 0.14 : 0.05;
                ctx.fillStyle = `rgba(34, 197, 94, ${ambientAlpha})`;
              }
            }

            ctx.fillText(char, x, y);
          }
        }
      }

      // ==========================================
      // ARTWORK 3: Cicada (Living Emergence)
      // ==========================================
      else if (mode === "cicada") {
        // Cicada body geometry calculation
        const breathe = 1 + Math.sin(now * 0.0011) * 0.005;
        const sway = Math.sin(now * 0.0006) * 3;
        const targetH = height * 0.9 * breathe;
        const targetW = targetH * (CICADA_GRID_W / CICADA_GRID_H);
        const ox = (width - targetW) / 2 + sway;
        const oy = (height - targetH) / 2;
        const tSec = now / 1000;

        // Background rain that bends toward pointer
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
              k === 0 ? `rgba(52,211,153,${a + 0.08})` : `rgba(250,247,240,${a * 0.5})`;
            ctx.fillText(
              CHARS[(c * 31 + r * 7 + (tick >> 3)) % 16],
              c * cellSize + cellSize / 2 + bend * k * 2,
              r * cellSize + cellSize / 2,
            );
          }
        }

        // Draw Cicada character matrix
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
            if (val >= 8) {
              // Wing shimmer
              boost += 0.22 * (0.5 + 0.5 * Math.sin(tSec * 3 + gx * 0.18 + gy * 0.11));
            }
            if (mouse.active) {
              const d = Math.hypot(x - mouse.x, y - mouse.y);
              if (d < 110) boost += (1 - d / 110) * 0.45;
            }

            // Chirp wave pulses
            for (const p of pulses) {
              const age = (now - p.t0) / 700;
              if (age > 1) continue;
              const wave = Math.abs(
                Math.hypot(x - width / 2, y - height / 2) - age * Math.max(width, height) * 0.7,
              );
              if (wave < 26) boost += (1 - wave / 26) * (1 - age) * 0.9;
            }

            const a = Math.min(1, 0.25 + (val / 9) * 0.65 + boost);
            ctx.fillStyle =
              edge || val >= 8
                ? `rgba(52,211,153,${a})`
                : val >= 5
                  ? `rgba(250,247,240,${a * 0.9})`
                  : `rgba(52,211,153,${a * 0.45})`;

            ctx.fillText(CHARS[(r * 31 + c * 17 + (tick >> 4)) % 16], x, y);
          }
        }

        // Clean up expired pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
          if (now - pulses[i].t0 > 750) pulses.splice(i, 1);
        }
      }

      // Pointer tactical reticle when mouse is active
      if (mouse.active && mouse.x > 0 && mouse.y > 0) {
        ctx.save();
        ctx.strokeStyle = "rgba(52, 211, 153, 0.55)";
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
        ctx.fillStyle = "rgba(167, 243, 208, 0.9)";
        ctx.fillText(
          `${mode.toUpperCase()} // ${(mouse.x / width).toFixed(2)}, ${(mouse.y / height).toFixed(2)}`,
          mouse.x + 26,
          mouse.y - 6,
        );
        ctx.restore();
      }

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
      pulsesRef.current.push({ t0: performance.now() });
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointerdown", handlePointerDown);

    // Performance: Pause when scrolled offscreen
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

  // Handle ESC key to exit fullscreen
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
      className={`transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-black h-screen w-screen"
          : `relative overflow-hidden rounded-xl border rule-hair bg-zinc-950 shadow-2xl ${className}`
      }`}
    >
      {/* Terminal Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-200 font-semibold tracking-wider">
            {currentMeta.badge}
          </span>
          <span className="text-zinc-500 hidden sm:inline">:: [DUBAI_NODE]</span>
        </div>

        {/* 3 Artwork Selectors (Centered / Prominent) */}
        <div
          role="tablist"
          aria-label="Matrix Artworks"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-black/60 p-1"
        >
          {ARTWORKS.map((artwork) => (
            <button
              key={artwork.id}
              role="tab"
              aria-selected={activeArtwork === artwork.id}
              type="button"
              onClick={() => setActiveArtwork(artwork.id)}
              className={`rounded-md px-3 py-1 text-[11px] font-mono transition-all ${
                activeArtwork === artwork.id
                  ? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              {artwork.label}
            </button>
          ))}
        </div>

        {/* Fit to Screen / Fullscreen Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-black/60 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Fit to Screen / Fullscreen"}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M10 4H4m0 0v6m0-6l7 7m10-7h-6m0 0v6m0-6l7 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
            <span>{isFullscreen ? "Exit Fullscreen" : "Fit to Screen"}</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display (Widescreen 16:9 Fit-to-Screen) */}
      <div
        className={`relative w-full bg-black ${
          isFullscreen
            ? "flex-1 h-full min-h-0"
            : "aspect-[16/9] min-h-[440px] md:min-h-[560px] lg:min-h-[640px]"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full block cursor-crosshair select-none touch-none"
        />

        {/* CRT Scanline Grid Texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-25 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px]"
        />

        {/* Vignette edge falloff */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60"
        />

        {/* Live telemetry badges */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-400 border border-zinc-800 backdrop-blur">
          <span className="text-emerald-400">SYS_LOC:</span> 25.2048° N, 55.2708° E · UTC+4
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-mono text-zinc-500 hidden sm:block">
          {currentMeta.hint}
        </div>
      </div>

      {/* Terminal Footer info */}
      <div className="flex flex-wrap items-center justify-between border-t border-zinc-800 bg-zinc-900/70 px-4 py-2.5 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span>PORT: 0x443</span>
          <span className="text-zinc-600">|</span>
          <span>{currentMeta.telemetry}</span>
        </div>
        <div className="text-emerald-400/90 font-mono">STATUS: COMPILED &amp; ACTIVE</div>
      </div>
    </div>
  );
}
