import { useEffect, useRef } from "react";
import { createHeroRay, type Ctx } from "./hero-ray";

const MAX_DELTA_MS = 64;

/**
 * HeroPrism — lifecycle shell for the hero's dispersion field.
 *
 * Owns only what the browser owns: sizing, DPR, the animation loop, visibility
 * pausing, theme changes and pointer events. All composition lives in ./hero-ray,
 * which is DOM-free and can be rendered headlessly.
 */
export function HeroPrism({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // The engine only needs the structural subset both DOM canvas and node-canvas share.
    const drawCtx = ctx as unknown as Ctx;

    const ray = createHeroRay();
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReduced = motionQuery.matches;

    let rafId = 0;
    let running = false;
    let inView = true;

    let cssW = 0;
    let cssH = 0;
    let rectLeft = 0;
    let rectTop = 0;
    let lastTs = 0;
    let lastPointerTs = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      cssW = rect.width;
      cssH = rect.height;

      // Work in CSS pixels: the context transform absorbs device pixel ratio.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ray.setTheme(document.documentElement.classList.contains("dark"));
      ray.resize(cssW, cssH);
      if (!running) ray.paintStill(drawCtx);
    };

    const frame = (ts: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);

      const dt = lastTs === 0 ? 16 : Math.min(MAX_DELTA_MS, ts - lastTs);
      lastTs = ts;

      if (performance.now() - lastPointerTs > 2600) ray.setPointer(0, 0, false);
      ray.paint(drawCtx, dt, ts);
    };

    const syncLoop = () => {
      const shouldRun = inView && !document.hidden && !prefersReduced;
      if (shouldRun && !running) {
        running = true;
        lastTs = 0;
        rafId = requestAnimationFrame(frame);
        return;
      }
      if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
        if (prefersReduced) ray.paintStill(drawCtx);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      const inside = x >= 0 && x <= cssW && y >= -40 && y <= cssH + 40;
      ray.setPointer(x, y, inside);
      if (inside) lastPointerTs = performance.now();
    };

    const onPointerDown = (e: PointerEvent) => {
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      if (x < 0 || x > cssW || y < 0 || y > cssH) return;
      ray.addSurge(x, y, performance.now());
    };

    const onPointerLeave = () => ray.setPointer(0, 0, false);

    const onScroll = () => {
      const rect = container.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
    };

    const onVisibility = () => syncLoop();
    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      syncLoop();
    };

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(container);

    const visObs = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncLoop();
      },
      { threshold: 0.02 },
    );
    visObs.observe(container);

    const themeObs = new MutationObserver(() => {
      ray.setTheme(document.documentElement.classList.contains("dark"));
      if (!running) ray.paintStill(drawCtx);
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    resize();
    if (prefersReduced) ray.paintStill(drawCtx);
    else syncLoop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      resizeObs.disconnect();
      visObs.disconnect();
      themeObs.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div ref={containerRef} className={`pointer-events-none ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
