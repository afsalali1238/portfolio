import { useEffect, useRef, useState } from "react";

/**
 * MatrixSilhouette renders an interactive digital matrix canvas inspired by
 * the Solana terminal silhouette aesthetic.
 * Monospace alphanumeric characters form the contours of a person seen from behind,
 * looking forward into the digital matrix grid.
 */
export function MatrixSilhouette({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<"matrix" | "reference">("matrix");
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1,
    y: -1,
    active: false,
  });

  useEffect(() => {
    if (viewMode !== "matrix") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Characters commonly found in cryptographic hex dumps & terminal art
    const CHARS = "0123456789ABCDEFVUGX#$@&*%";

    // Setup offscreen mask to test if a grid point is inside the person's back silhouette
    const maskCanvas = document.createElement("canvas");
    const maskCtx = maskCanvas.getContext("2d");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.scale(dpr, dpr);

      maskCanvas.width = Math.floor(width);
      maskCanvas.height = Math.floor(height);

      if (maskCtx) {
        drawSilhouetteMask(maskCtx, width, height);
      }
    };

    /**
     * Draws the silhouette shape of a person's backside (head, neck, shoulders, upper back)
     */
    const drawSilhouetteMask = (mCtx: CanvasRenderingContext2D, w: number, h: number) => {
      mCtx.clearRect(0, 0, w, h);
      mCtx.fillStyle = "#ffffff";

      const centerX = w * 0.52;
      const headY = h * 0.28;
      const headRadius = Math.min(w, h) * 0.15;

      // Head (seen from back - slightly oval, tilted slightly)
      mCtx.beginPath();
      mCtx.ellipse(centerX, headY, headRadius * 0.82, headRadius * 1.05, 0.05, 0, Math.PI * 2);
      mCtx.fill();

      // Neck
      const neckWidth = headRadius * 0.55;
      const neckTop = headY + headRadius * 0.7;
      const neckBottom = headY + headRadius * 1.35;
      mCtx.beginPath();
      mCtx.moveTo(centerX - neckWidth, neckTop);
      mCtx.lineTo(centerX + neckWidth, neckTop);
      mCtx.lineTo(centerX + neckWidth * 1.25, neckBottom);
      mCtx.lineTo(centerX - neckWidth * 1.25, neckBottom);
      mCtx.closePath();
      mCtx.fill();

      // Trapezius and shoulders slope (broad back seen from behind)
      const shoulderY = neckBottom;
      const shoulderSpan = Math.min(w * 0.46, 260);
      const waistY = h * 0.98;
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

      // Hair silhouette bump on top/back
      mCtx.beginPath();
      mCtx.ellipse(
        centerX - headRadius * 0.1,
        headY - headRadius * 0.75,
        headRadius * 0.65,
        headRadius * 0.45,
        -0.1,
        0,
        Math.PI * 2,
      );
      mCtx.fill();
    };

    resize();
    window.addEventListener("resize", resize);

    // Grid sizing
    const cellSize = 13;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Deep dark terminal background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      const maskData = maskCtx?.getImageData(0, 0, Math.floor(width), Math.floor(height));
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);

      ctx.font = `600 ${cellSize - 2}px "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const mouse = mouseRef.current;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize + cellSize / 2;
          const y = r * cellSize + cellSize / 2;

          // Check if coordinate is inside mask
          let isInside = false;
          let edgeDistance = 0;

          if (maskData) {
            const px = Math.min(Math.floor(x), width - 1);
            const py = Math.min(Math.floor(y), height - 1);
            const idx = (py * Math.floor(width) + px) * 4;
            isInside = maskData.data[idx] > 128;

            // Check neighbor for edge highlight
            if (isInside) {
              const checkLeft = Math.max(0, px - 6);
              const checkRight = Math.min(width - 1, px + 6);
              const leftIdx = (py * Math.floor(width) + checkLeft) * 4;
              const rightIdx = (py * Math.floor(width) + checkRight) * 4;
              if (maskData.data[leftIdx] < 128 || maskData.data[rightIdx] < 128) {
                edgeDistance = 1; // On silhouette boundary
              }
            }
          }

          // Deterministic character pick with occasional pseudo-random flicker
          const seed = (r * 1337 + c * 31 + Math.floor(tick / 18)) % CHARS.length;
          const char = CHARS[seed];

          // Distance to mouse pointer for interactive cursor glow
          let mouseDist = 999;
          if (mouse.active) {
            mouseDist = Math.hypot(x - mouse.x, y - mouse.y);
          }

          if (isInside) {
            if (edgeDistance === 1) {
              // High contrast silhouette contour
              ctx.fillStyle = mouseDist < 80 ? "#22c55e" : "#e4e4e7"; // Emerald or bright white contour
            } else {
              // Silhouette interior: solid digital matrix glow
              const depthVariance = ((r + c) % 4) * 0.1;
              if (mouseDist < 100) {
                ctx.fillStyle = `rgba(74, 222, 128, ${0.85 - mouseDist / 140})`;
              } else {
                ctx.fillStyle = `rgba(212, 212, 216, ${0.45 + depthVariance})`;
              }
            }
          } else {
            // Background digital matrix: faint terminal numbers
            if (mouseDist < 90) {
              ctx.fillStyle = `rgba(161, 161, 170, ${0.6 - mouseDist / 120})`;
            } else {
              // Faint background matrix numbers
              const subtleAlpha = (r * 7 + c * 11) % 5 === 0 ? 0.12 : 0.05;
              ctx.fillStyle = `rgba(113, 113, 122, ${subtleAlpha})`;
            }
          }

          ctx.fillText(char, x, y);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

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
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewMode]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border rule-hair bg-zinc-950 shadow-2xl ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-200 font-semibold">SILHOUETTE_OPERATOR_BACKVIEW</span>
          <span className="text-zinc-500 hidden sm:inline">:: [DUBAI_NODE]</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === "matrix" ? "reference" : "matrix"))}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
          >
            {viewMode === "matrix" ? "View Original Reference" : "View Matrix Terminal"}
          </button>
        </div>
      </div>

      {/* Main Visual Display */}
      <div className="relative aspect-[4/3] w-full min-h-[360px] md:min-h-[460px] bg-black">
        {viewMode === "matrix" ? (
          <>
            <canvas ref={canvasRef} className="h-full w-full block cursor-crosshair select-none" />
            {/* Subtle overlay vignette & terminal status */}
            <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/60" />
            <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-400 border border-zinc-800 backdrop-blur">
              <span className="text-emerald-400">SYS_LOC:</span> 25.2048° N, 55.2708° E · UTC+4
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-mono text-zinc-500">
              Interactive Matrix · Hover to scan
            </div>
          </>
        ) : (
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <img
              src="/the-man-behind-ref.png"
              alt="Silhouette reference of a person's backside looking into the cryptographic matrix"
              className="max-h-full max-w-full object-contain rounded"
            />
            <div className="absolute bottom-3 right-3 text-[11px] font-mono text-zinc-400 bg-zinc-900/90 px-2 py-1 rounded border border-zinc-800">
              Solana Matrix Architecture Reference
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer info */}
      <div className="flex flex-wrap items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-4 py-2 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span>PORT: 0x443</span>
          <span className="text-zinc-600">|</span>
          <span>IDENTITY: THE_MAN_BEHIND</span>
        </div>
        <div className="text-zinc-500">STATUS: COMPILED &amp; LISTENING</div>
      </div>
    </div>
  );
}
