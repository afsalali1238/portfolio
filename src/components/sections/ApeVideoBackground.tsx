import { useEffect, useRef, useState } from "react";

/**
 * ApeVideoBackground — immersive, full-screen fit video matrix background for /the-man-behind.
 *
 * It renders the viral AK-47 chimpanzee video fitted to the hero viewport (object-fit: cover,
 * centered framing), graded with an authentic emerald Matrix terminal palette and layered
 * with dynamic falling character-matrix rain that responds to pointer movement.
 *
 * Key qualities:
 * - Immersive: mounts at z-0 behind the hero copy, blending seamlessly into the page background.
 * - Fit-to-screen: object-cover with responsive center-focus so the chimpanzee and raised AK-47
 *   remain framed across desktop, tablet, and mobile portrait screens.
 * - Performance-tuned: hidden-tab pause, offscreen pause, backing-store resolution caps,
 *   and prefers-reduced-motion support.
 */
export function ApeVideoBackground({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Start video playback safely (muted autoplay is universally permitted)
    video.play().catch(() => {});

    const hero = canvas.closest("[data-cicada-hero]") as HTMLElement | null;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Character set: cryptographic hex dumps & terminal glyphs
    const CHARS = "0123456789ABCDEFVUGX#$@&*%";

    let rafId = 0;
    let width = 0;
    let height = 0;
    let tick = 0;
    let running = true;
    let isVisible = true;

    // Pointer state
    const pointer = {
      x: -9999,
      y: -9999,
      active: false,
      lastMove: performance.now(),
    };

    // Matrix rain column simulation
    const FONT_SIZE = 14;
    let columns: {
      y: number;
      speed: number;
      length: number;
      chars: string[];
    }[] = [];

    const initColumns = (w: number, h: number) => {
      const colCount = Math.floor(w / FONT_SIZE) + 1;
      columns = new Array(colCount);
      for (let i = 0; i < colCount; i++) {
        const len = 8 + Math.floor(Math.random() * 16);
        const chars: string[] = [];
        for (let j = 0; j < len; j++) {
          chars.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
        columns[i] = {
          y: Math.random() * -h,
          speed: 1.5 + Math.random() * 2.5,
          length: len,
          chars,
        };
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(10, Math.floor(rect.width));
      height = Math.max(10, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initColumns(width, height);
    };

    resize();
    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    // Render loop
    const render = () => {
      if (!running) return;

      if (!isVisible) {
        rafId = requestAnimationFrame(render);
        return;
      }

      tick++;
      ctx.clearRect(0, 0, width, height);

      // Rain columns
      ctx.font = `600 ${FONT_SIZE - 2}px "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
      ctx.textBaseline = "top";

      const now = performance.now();
      const pointerFresh = now - pointer.lastMove < 4000;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const x = i * FONT_SIZE;

        if (!prefersReduced) {
          col.y += col.speed;
          if (col.y > height) {
            col.y = -col.length * FONT_SIZE;
            col.speed = 1.5 + Math.random() * 2.5;
          }
        }

        // Periodically mutate characters in column
        if (tick % 4 === 0 && Math.random() < 0.25) {
          const mutateIdx = Math.floor(Math.random() * col.length);
          col.chars[mutateIdx] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        for (let j = 0; j < col.length; j++) {
          const charY = col.y + j * FONT_SIZE;
          if (charY < -FONT_SIZE || charY > height + FONT_SIZE) continue;

          // Distance to interactive pointer
          let dist = 9999;
          if (pointerFresh && pointer.active) {
            dist = Math.hypot(x - pointer.x, charY - pointer.y);
          }

          if (dist < 110) {
            // Pointer proximity: bright illuminated phosphor burst
            const intensity = 1 - dist / 110;
            ctx.fillStyle =
              dist < 35
                ? `rgba(236, 253, 245, ${0.85 + intensity * 0.15})`
                : `rgba(110, 231, 183, ${0.65 + intensity * 0.3})`;
          } else if (j === col.length - 1) {
            // Head glyph: bright white-mint lead
            ctx.fillStyle = "rgba(236, 253, 245, 0.75)";
          } else {
            // Trail glyphs: cascading green phosphor alpha
            const alpha = Math.max(0.06, (j / col.length) * 0.38);
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
          }

          ctx.fillText(col.chars[j] || "0", x, charY);
        }
      }

      // Pointer HUD radar reticle
      if (pointerFresh && pointer.active) {
        ctx.save();
        ctx.strokeStyle = "rgba(52, 211, 153, 0.45)";
        ctx.lineWidth = 1;

        // Crosshair ring
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 22, 0, Math.PI * 2);
        ctx.stroke();

        // Cross ticks
        ctx.beginPath();
        ctx.moveTo(pointer.x - 30, pointer.y);
        ctx.lineTo(pointer.x - 12, pointer.y);
        ctx.moveTo(pointer.x + 12, pointer.y);
        ctx.lineTo(pointer.x + 30, pointer.y);
        ctx.moveTo(pointer.x, pointer.y - 30);
        ctx.lineTo(pointer.x, pointer.y - 12);
        ctx.moveTo(pointer.x, pointer.y + 12);
        ctx.lineTo(pointer.x, pointer.y + 30);
        ctx.stroke();

        // Monospace coordinate label
        ctx.font = `600 10px "SFMono-Regular", Menlo, Monaco, Consolas, monospace`;
        ctx.fillStyle = "rgba(167, 243, 208, 0.85)";
        ctx.fillText(
          `7.62x39MM // ${(pointer.x / width).toFixed(2)}, ${(pointer.y / height).toFixed(2)}`,
          pointer.x + 28,
          pointer.y - 8,
        );
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    // Pointer events on hero section
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      pointer.lastMove = performance.now();
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    if (hero) {
      hero.addEventListener("pointermove", onPointerMove, { passive: true });
      hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    // Visibility / intersection observer for performance
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
      running = false;
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      visObs.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (hero) {
        hero.removeEventListener("pointermove", onPointerMove);
        hero.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* 1. Underlying HTML5 Video: fitted with object-cover and centered framing */}
      <video
        ref={videoRef}
        src="/chimp-ak47.mp4"
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        onLoadedData={() => setVideoLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover object-[center_36%] transition-opacity duration-700 ${
          videoLoaded ? "opacity-45 dark:opacity-55" : "opacity-0"
        } filter contrast-[1.2] brightness-[0.78] saturate-[0.45]`}
      />

      {/* 2. Color grading overlay: authentic emerald/cyber matrix duotone tint */}
      <div className="absolute inset-0 bg-emerald-950/40 mix-blend-color pointer-events-none" />
      <div className="absolute inset-0 bg-emerald-900/15 mix-blend-screen pointer-events-none" />

      {/* 3. CRT Scanline Grid Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px]"
      />

      {/* 4. Falling Matrix Digital Rain & Tactical Pointer Reticle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full pointer-events-none"
      />

      {/* 5. Edge Vignette & Bottom Dissolve: melts the video into the theme's background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[var(--paper)]/40 via-transparent to-[var(--paper)]" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[var(--paper)]/30 via-transparent to-[var(--paper)]/30" />
    </div>
  );
}
