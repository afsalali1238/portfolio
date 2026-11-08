import { useEffect, useRef, useState } from "react";
import { CHIMP_GRID_W, CHIMP_GRID_H, CHIMP_GRID_DATA } from "./chimpGridData";

/**
 * MatrixSilhouette renders an interactive digital matrix canvas.
 * Monospace alphanumeric characters form the contours of a chimpanzee holding an AK-47,
 * with both a high-contrast tactical silhouette and live animated video matrix feed.
 *
 * The panel is now sized to fit the available viewport: it caps its height, lets the
 * artwork use contain-style sizing with a safe margin, adapts character density to the
 * panel dimensions, reduces chrome on small screens, and pauses when the tab is hidden.
 */
export function MatrixSilhouette({
  className = "",
  defaultMode = "silhouette",
  hideToggle = false,
}: {
  className?: string;
  defaultMode?: "silhouette" | "video";
  hideToggle?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<"silhouette" | "video">(defaultMode);
  const modeRef = useRef<"silhouette" | "video">(mode);
  modeRef.current = mode;

  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1,
    y: -1,
    active: false,
  });

  const visibilityRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Characters commonly found in cryptographic hex dumps & terminal art
    const CHARS = "0123456789ABCDEFVUGX#$@&*%";

    // Offscreen mask canvas for live video sampling
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

    // Video element for live video matrix mode
    const video = document.createElement("video");
    video.src = "/chimp-ak47.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.crossOrigin = "anonymous";
    video.play().catch(() => {});

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(10, rect.width);
      height = Math.max(10, rect.height);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      maskCanvas.width = Math.floor(width);
      maskCanvas.height = Math.floor(height);
    };

    // Grid sizing: adapts cell size to panel dimensions while bounding render cost.
    const MIN_CELL_SIZE = 10;
    const MAX_CELL_SIZE = 16;
    const MAX_COLS = 80;
    const MAX_ROWS = 50;

    const getCellSize = (w: number, h: number) => {
      // Larger panels afford smaller cells (more detail); small screens get larger,
      // more readable cells. Then bound by max cell count for performance.
      const densityScale = Math.min(w, h) / 400;
      let cellSize = Math.round(14 / densityScale);
      cellSize = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, cellSize));
      const sizeByCols = Math.ceil(w / MAX_COLS);
      const sizeByRows = Math.ceil(h / MAX_ROWS);
      return Math.max(cellSize, sizeByCols, sizeByRows);
    };

    let cellSize = getCellSize(width, height);
    let tick = 0;

    const render = () => {
      tick++;
      if (width <= 0 || height <= 0) {
        resize();
        cellSize = getCellSize(width, height);
      }

      ctx.clearRect(0, 0, width, height);

      // Deep dark terminal background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      const currentMode = modeRef.current;
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);

      let videoMaskData: ImageData | null = null;
      if (currentMode === "video" && maskCtx && video.readyState >= 2) {
        maskCtx.clearRect(0, 0, width, height);
        const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
        const canvasAspect = width / height;
        let drawW = width;
        let drawH = height;
        let drawX = 0;
        let drawY = 0;

        // Contain-style: fit video within canvas, preserving aspect ratio.
        if (canvasAspect > videoAspect) {
          drawH = width / videoAspect;
          drawY = (height - drawH) / 2;
        } else {
          drawW = height * videoAspect;
          drawX = (width - drawW) / 2;
        }

        maskCtx.drawImage(video, drawX, drawY, drawW, drawH);
        videoMaskData = maskCtx.getImageData(0, 0, Math.floor(width), Math.floor(height));
      }

      ctx.font = `600 ${cellSize - 2}px "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const mouse = mouseRef.current;

      // Scaling for embedded chimp grid in silhouette mode — contain-style with a
      // small safe margin so the artwork never touches the panel edges.
      const chimpAspect = CHIMP_GRID_W / CHIMP_GRID_H;
      const margin = 0.06; // 6% safe margin on each side
      const availW = width * (1 - margin * 2);
      const availH = height * (1 - margin * 2);
      let targetH = availH;
      let targetW = targetH * chimpAspect;
      if (targetW > availW) {
        targetW = availW;
        targetH = targetW / chimpAspect;
      }
      const offsetX = (width - targetW) / 2;
      const offsetY = (height - targetH) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize + cellSize / 2;
          const y = r * cellSize + cellSize / 2;

          let isInside = false;
          let isEdge = false;
          let intensity = 0; // 0 to 1

          if (currentMode === "video" && videoMaskData) {
            const px = Math.min(Math.floor(x), Math.floor(width) - 1);
            const py = Math.min(Math.floor(y), Math.floor(height) - 1);
            const idx = (py * Math.floor(width) + px) * 4;
            const lum =
              0.299 * videoMaskData.data[idx] +
              0.587 * videoMaskData.data[idx + 1] +
              0.114 * videoMaskData.data[idx + 2];
            isInside = lum > 40;
            intensity = lum / 255;
          } else {
            // Silhouette mode: sample from embedded CHIMP_GRID_DATA
            const gx = Math.floor(((x - offsetX) / targetW) * CHIMP_GRID_W);
            const gy = Math.floor(((y - offsetY) / targetH) * CHIMP_GRID_H);

            if (gx >= 0 && gx < CHIMP_GRID_W && gy >= 0 && gy < CHIMP_GRID_H) {
              const val = parseInt(CHIMP_GRID_DATA[gy * CHIMP_GRID_W + gx] || "0", 10);
              if (val > 0) {
                isInside = true;
                intensity = val / 9.0;

                // Check 4-neighbor boundary for contour highlight
                const leftVal =
                  gx > 0 ? parseInt(CHIMP_GRID_DATA[gy * CHIMP_GRID_W + (gx - 1)] || "0", 10) : 0;
                const rightVal =
                  gx < CHIMP_GRID_W - 1
                    ? parseInt(CHIMP_GRID_DATA[gy * CHIMP_GRID_W + (gx + 1)] || "0", 10)
                    : 0;
                const upVal =
                  gy > 0 ? parseInt(CHIMP_GRID_DATA[(gy - 1) * CHIMP_GRID_W + gx] || "0", 10) : 0;
                const downVal =
                  gy < CHIMP_GRID_H - 1
                    ? parseInt(CHIMP_GRID_DATA[(gy + 1) * CHIMP_GRID_W + gx] || "0", 10)
                    : 0;

                if (leftVal === 0 || rightVal === 0 || upVal === 0 || downVal === 0) {
                  isEdge = true;
                }
              }
            }
          }

          // Deterministic character pick with dynamic matrix flicker
          const seed = (r * 1337 + c * 31 + Math.floor(tick / 14)) % CHARS.length;
          const char = CHARS[seed];

          // Distance to interactive mouse pointer
          let mouseDist = 999;
          if (mouse.active) {
            mouseDist = Math.hypot(x - mouse.x, y - mouse.y);
          }

          if (isInside) {
            if (isEdge) {
              // High contrast silhouette contour
              ctx.fillStyle = mouseDist < 85 ? "#22c55e" : "#e4e4e7";
            } else {
              // Silhouette interior: matrix glow
              if (mouseDist < 110) {
                const glow = 1 - mouseDist / 110;
                ctx.fillStyle = `rgba(74, 222, 128, ${Math.min(1, 0.55 + glow * 0.45 + intensity * 0.2)})`;
              } else {
                // Luminance shading for muzzle, gun receiver, banana magazine, face & hands
                if (intensity > 0.65) {
                  ctx.fillStyle = `rgba(235, 245, 238, ${0.85 + (tick % 3) * 0.05})`;
                } else if (intensity > 0.35) {
                  ctx.fillStyle = `rgba(74, 222, 128, ${0.7 + ((r + c) % 3) * 0.08})`;
                } else {
                  ctx.fillStyle = `rgba(34, 130, 65, ${0.45 + ((r * 3 + c) % 4) * 0.08})`;
                }
              }
            }
          } else {
            // Background digital matrix: faint terminal numbers
            if (mouseDist < 85) {
              ctx.fillStyle = `rgba(161, 161, 170, ${0.5 - mouseDist / 120})`;
            } else {
              const subtleAlpha = (r * 7 + c * 11) % 5 === 0 ? 0.12 : 0.04;
              ctx.fillStyle = `rgba(113, 113, 122, ${subtleAlpha})`;
            }
          }

          ctx.fillText(char, x, y);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const start = () => {
      if (!visibilityRef.current) return;
      animationFrameId = requestAnimationFrame(render);
    };

    const stop = () => {
      cancelAnimationFrame(animationFrameId);
    };

    const handleVisibilityChange = () => {
      visibilityRef.current = !document.hidden;
      if (visibilityRef.current) {
        start();
      } else {
        stop();
        video.pause();
      }
    };

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      video.pause();
      video.src = "";
    };
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border rule-hair bg-zinc-950 shadow-2xl ${className}`}
    >
      {/* Header Bar — compact on mobile */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 ${
          isMobile ? "px-3 py-2" : "px-4 py-2.5"
        } text-xs font-mono text-zinc-400`}
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span
            className={`text-zinc-200 font-semibold tracking-wider ${isMobile ? "text-xs" : ""}`}
          >
            CHIMP_AK47_TACTICAL_OPERATOR
          </span>
          <span className="text-zinc-500 hidden sm:inline">:: [DUBAI_NODE]</span>
        </div>

        {/* Mode Selector Toggle */}
        <div
          className={`items-center gap-1.5 rounded-lg border border-zinc-800 bg-black/60 p-1 ${
            hideToggle ? "hidden" : "flex"
          }`}
        >
          <button
            type="button"
            onClick={() => setMode("silhouette")}
            className={`rounded px-2.5 py-1 text-[11px] font-mono transition-colors ${
              mode === "silhouette"
                ? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tactical Silhouette
          </button>
          <button
            type="button"
            onClick={() => setMode("video")}
            className={`rounded px-2.5 py-1 text-[11px] font-mono transition-colors ${
              mode === "video"
                ? "bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Live Matrix Feed
          </button>
        </div>
      </div>

      {/* Main Visual Display — height-limited, artwork contained with safe margin */}
      <div className="relative w-full max-h-[65vh] min-h-[320px] md:min-h-[420px] bg-black">
        <canvas ref={canvasRef} className="h-full w-full block cursor-crosshair select-none" />
        {/* Subtle overlay vignette & terminal status */}
        <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60" />
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-400 border border-zinc-800 backdrop-blur">
          <span className="text-emerald-400">SYS_LOC:</span> 25.2048° N, 55.2708° E · UTC+4
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-mono text-zinc-500">
          Interactive Matrix · Hover to scan
        </div>
      </div>

      {/* Terminal Footer info — compact on mobile */}
      <div
        className={`flex flex-wrap items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-4 py-2 ${
          isMobile ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-[11px]"
        } font-mono text-zinc-400`}
      >
        <div className="flex items-center gap-3">
          <span>PORT: 0x443</span>
          <span className="text-zinc-600">|</span>
          <span className={`hidden ${isMobile ? "" : "sm:inline"}`}>IDENTITY: CHIMP_WITH_AK47</span>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <span className={`hidden ${isMobile ? "" : "sm:inline"}`}>CALIBER: 7.62×39MM</span>
        </div>
        <div className="text-emerald-400/90 font-mono">STATUS: ARMED &amp; COMPILED</div>
      </div>
    </div>
  );
}
