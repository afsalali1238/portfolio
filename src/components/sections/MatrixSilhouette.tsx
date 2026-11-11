import { useEffect, useRef, useState } from "react";

/**
 * MatrixSilhouette renders an interactive, fit-to-screen live video matrix canvas.
 *
 * It samples the viral AK-47 chimpanzee video in real time and renders it purely as
 * glowing green monospace characters and cryptographic hex glyphs on a high-density grid.
 *
 * Features:
 * - Fit-to-screen: Responsive widescreen 16:9 presentation with object-cover sampling,
 *   plus a one-click Fullscreen / Fit-to-Screen toggle with ESC key support.
 * - Multi-tier green phosphor luminance shading (deep shadow glyphs, emerald silhouette,
 *   mint highlights, and white-hot muzzle flash).
 * - Interactive pointer scanning: Hovering illuminates characters within radius and
 *   displays a tactical reticle with coordinate HUD.
 * - Hardware performance: Uses offscreen sampling canvas, DPR scaling, hidden-tab pause,
 *   and intersection observer to sleep when scrolled out of view.
 */
export function MatrixSilhouette({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1,
    y: -1,
    active: false,
  });

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

    // Cryptographic & terminal character set
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
      width = Math.max(10, Math.floor(rect.width));
      height = Math.max(10, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Downsampled mask canvas for high-performance pixel sampling
      maskCanvas.width = Math.max(10, Math.floor(width / 2));
      maskCanvas.height = Math.max(10, Math.floor(height / 2));
    };

    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    // Dynamic cell size based on screen width
    const getCellSize = (w: number) => {
      if (w < 480) return 9;
      if (w < 768) return 10;
      if (w < 1280) return 11;
      return 12;
    };

    const render = () => {
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

      const cellSize = getCellSize(width);
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);

      const maskW = maskCanvas.width;
      const maskH = maskCanvas.height;

      let videoMaskData: ImageData | null = null;
      if (maskCtx && video.readyState >= 2 && maskW > 0 && maskH > 0) {
        maskCtx.clearRect(0, 0, maskW, maskH);
        const videoAspect = (video.videoWidth || 16) / (video.videoHeight || 9);
        const canvasAspect = maskW / maskH;
        let drawW = maskW;
        let drawH = maskH;
        let drawX = 0;
        let drawY = 0;

        // Proper object-fit: cover scaling to fill screen completely
        if (canvasAspect > videoAspect) {
          drawH = maskW / videoAspect;
          drawY = (maskH - drawH) / 2;
        } else {
          drawW = maskH * videoAspect;
          drawX = (maskW - drawW) / 2;
        }

        maskCtx.drawImage(video, drawX, drawY, drawW, drawH);
        videoMaskData = maskCtx.getImageData(0, 0, maskW, maskH);
      }

      ctx.font = `600 ${cellSize - 2}px "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      const mouse = mouseRef.current;

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

          // Deterministic character pick with dynamic matrix flicker
          const seed = (r * 1337 + c * 31 + Math.floor(tick / 14)) % CHARS.length;
          const char = CHARS[seed];

          // Distance to interactive pointer
          let mouseDist = 999;
          if (mouse.active) {
            mouseDist = Math.hypot(x - mouse.x, y - mouse.y);
          }

          if (mouseDist < 85) {
            // Interactive pointer illumination
            const intensity = 1 - mouseDist / 85;
            ctx.fillStyle =
              mouseDist < 28
                ? `rgba(240, 253, 244, ${0.9 + intensity * 0.1})`
                : `rgba(110, 231, 183, ${0.7 + intensity * 0.3})`;
          } else {
            // Multi-tiered Matrix Phosphor Grading based on live video feed
            if (lum > 170) {
              // Bright highlight / muzzle flash: white-hot mint neon
              ctx.fillStyle = `rgba(240, 253, 244, ${0.92 + (tick % 3) * 0.04})`;
            } else if (lum > 115) {
              // Upper mid-tones & weapon reflections: bright mint
              ctx.fillStyle = `rgba(110, 231, 183, ${0.82 + ((r + c) % 3) * 0.06})`;
            } else if (lum > 60) {
              // Chimp silhouette & receiver: rich emerald phosphor
              ctx.fillStyle = `rgba(34, 197, 94, ${0.68 + ((r * 2 + c) % 4) * 0.06})`;
            } else if (lum > 24) {
              // Subtle shadows: darker moss green
              ctx.fillStyle = `rgba(22, 101, 52, ${0.42 + ((r + c) % 3) * 0.05})`;
            } else {
              // Ambient background matrix rain: faint terminal characters
              const ambientAlpha = (r * 7 + c * 11) % 6 === 0 ? 0.14 : 0.05;
              ctx.fillStyle = `rgba(34, 197, 94, ${ambientAlpha})`;
            }
          }

          ctx.fillText(char, x, y);
        }
      }

      // Pointer HUD radar reticle when actively hovered
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
          `7.62x39MM // ${(mouse.x / width).toFixed(2)}, ${(mouse.y / height).toFixed(2)}`,
          mouse.x + 26,
          mouse.y - 6,
        );
        ctx.restore();
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

    // Performance observer: pause when scrolled off-screen
    const visObs = new IntersectionObserver((entries) => {
      isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible) {
        video.play().catch(() => {});
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
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      resizeObs.disconnect();
      visObs.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/95 px-4 py-2.5 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-200 font-semibold tracking-wider">
            THE_MAN_BEHIND_LIVE_MATRIX
          </span>
          <span className="text-zinc-500 hidden sm:inline">:: [DUBAI_NODE]</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400/90 font-mono">
            <span>FEED: CHIMP_AK47</span>
            <span className="text-zinc-600">·</span>
            <span>7.62×39MM</span>
          </div>

          {/* Fit to Screen / Fullscreen Button */}
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

      {/* Main Matrix Video Visual Display */}
      <div
        className={`relative w-full bg-black ${
          isFullscreen
            ? "flex-1 h-full min-h-0"
            : "aspect-[16/9] min-h-[440px] md:min-h-[560px] lg:min-h-[620px]"
        }`}
      >
        <canvas ref={canvasRef} className="h-full w-full block cursor-crosshair select-none" />

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

        {/* Live status telemetry badges */}
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-400 border border-zinc-800 backdrop-blur">
          <span className="text-emerald-400">SYS_LOC:</span> 25.2048° N, 55.2708° E · UTC+4
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 text-[11px] font-mono text-zinc-500 hidden sm:block">
          Interactive Video Matrix · Hover to scan
        </div>
      </div>

      {/* Terminal Footer Info */}
      <div className="flex flex-wrap items-center justify-between border-t border-zinc-800 bg-zinc-900/70 px-4 py-2 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-3">
          <span>PORT: 0x443</span>
          <span className="text-zinc-600">|</span>
          <span>IDENTITY: THE_MAN_BEHIND</span>
          <span className="text-zinc-600">|</span>
          <span>CODEC: MONOSPACE_HEX_STREAM</span>
        </div>
        <div className="text-emerald-400/90 font-mono">STATUS: ARMED &amp; STREAMING</div>
      </div>
    </div>
  );
}
