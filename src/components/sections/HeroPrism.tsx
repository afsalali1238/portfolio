import { useEffect, useRef } from "react";
import { createHeroRay, type Ctx } from "./hero-ray";
import { measureHero, type LayoutSnapshot } from "./hero-layout";

const MAX_DELTA_MS = 64;
/**
 * Reallocating a 2× backing store costs tens of milliseconds while the user is still dragging
 * the window, so the canvas commits its size once resizing has gone quiet. Layout is measured
 * immediately (cheap); the backing store follows.
 */
const RESIZE_COMMIT_DELAY_MS = 140;
/** Above this many device pixels the canvas drops resolution rather than the frame rate. */
const MAX_BACKING_PIXELS = 2_200_000;

/** Debug hook shape exposed at ?heroDebug=1 so the headless harness can read real rects. */
type HeroDebugWindow = {
  __hero?: {
    layout: LayoutSnapshot;
    geometry: ReturnType<ReturnType<typeof createHeroRay>["geometry"]>;
  };
};

/**
 * HeroPrism — lifecycle shell for the hero's dispersion field.
 *
 * Owns only what the browser owns: sizing, DPR, the animation loop, visibility pausing,
 * theme changes, pointer events, and reading the real layout off the page. All composition
 * lives in ./hero-ray, which is DOM-free and can be rendered headlessly.
 *
 * The container element it measures is the hero <section> itself (`data-hero`), not a
 * wrapper: geometry has to come from the section the copy actually sits in.
 */
export function HeroPrism({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>("[data-hero]") ?? null;
    if (!canvas || !hero) return;
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

    const debug =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).has("heroDebug");
    // The QA harness sets __hideDebug on the section to photograph the clean frame.
    ray.setDebug(debug);
    const debugVisible = () => debug && !hero.dataset.hideDebug;

    let lastPaintCost = 0;
    let sized = false;
    let commitTimer: ReturnType<typeof setTimeout> | undefined;

    /** Effective DPR: capped at 2, then reduced so the backing store stays affordable. */
    const effectiveDpr = (w: number, h: number) => {
      const base = Math.min(window.devicePixelRatio || 1, 2);
      const pixels = w * h * base * base;
      if (pixels <= MAX_BACKING_PIXELS) return base;
      return Math.max(1, base * Math.sqrt(MAX_BACKING_PIXELS / pixels));
    };

    /** Measure the page, then size the canvas. Coalesced into rAF by the observer below. */
    /** Expensive: reallocate the backing store and re-register the context transform. */
    const commitCanvas = () => {
      const commitStarted = performance.now();
      const dpr = effectiveDpr(cssW, cssH);
      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);
      // Only pay for a reallocation when the surface really changed: a drag that returns to
      // (nearly) the same size is absorbed by the CSS stretch.
      const changed =
        Math.abs(targetW - canvas.width) / Math.max(1, canvas.width) > 0.02 ||
        Math.abs(targetH - canvas.height) / Math.max(1, canvas.height) > 0.02;
      if (changed) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      // Work in CSS pixels: the context transform absorbs device pixel ratio.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sized = true;
      // Outside the loop (paused, hidden, reduced motion) the still has to be re-composed.
      if (!running) ray.paintStill(drawCtx);
      if (debug) console.log(`[hero] commit ${(performance.now() - commitStarted).toFixed(2)}`);
    };

    /** Cheap enough to run on every observer callback: measure the page, hand it to the engine. */
    const resize = () => {
      const resizeStarted = performance.now();
      const rect = hero.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);

      ray.setTheme(document.documentElement.classList.contains("dark"));
      const tMeasure = performance.now();
      const snapshot = measureHero(hero);
      if (debug) console.log(`[hero] measure ${(performance.now() - tMeasure).toFixed(2)}`);
      ray.setLayout(snapshot);
      if (debug) {
        // ?heroDebug=1 — hand the measured snapshot + live geometry to the QA harness.
        (window as unknown as HeroDebugWindow).__hero = {
          layout: snapshot,
          geometry: ray.geometry(),
        };
      }

      if (!running || !sized) {
        commitCanvas();
        if (!running) ray.paintStill(drawCtx);
      } else {
        // Canvas keeps its current size and is CSS-stretched until the drag settles. The
        // commit then waits for idle time, so it never lands mid-gesture or mid-frame.
        if (commitTimer !== undefined) clearTimeout(commitTimer);
        commitTimer = setTimeout(() => {
          commitTimer = undefined;
          const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
            .requestIdleCallback;
          if (idle) idle(() => commitCanvas());
          else commitCanvas();
        }, RESIZE_COMMIT_DELAY_MS);
      }
      if (debug) console.log(`[hero] resize ${(performance.now() - resizeStarted).toFixed(2)}`);
    };

    // Coalesce resize into one frame. Under reduced motion there is no loop to borrow a
    // frame from, so the same work rides a microtask and the hero still requests zero rAF.
    let resizeQueued = false;
    const queueResize = () => {
      if (resizeQueued) return;
      resizeQueued = true;
      const run = () => {
        resizeQueued = false;
        resize();
      };
      if (prefersReduced) queueMicrotask(run);
      else requestAnimationFrame(run);
    };

    const frame = (ts: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(frame);

      const dt = lastTs === 0 ? 16 : Math.min(MAX_DELTA_MS, ts - lastTs);
      lastTs = ts;

      if (performance.now() - lastPointerTs > 2600) ray.setPointer(0, 0, false);

      const started = performance.now();
      ray.setDebug(debugVisible());
      ray.paint(drawCtx, dt, ts);
      lastPaintCost = performance.now() - started;
      // ?heroDebug=1 logs one frame in twenty; data-perf (QA only) logs every frame.
      if (debug && (hero.dataset.perf === "1" || Math.random() < 0.05)) {
        console.log(`[hero] paint ${lastPaintCost.toFixed(2)}`);
      }
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
      const rect = hero.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
    };

    const onVisibility = () => syncLoop();
    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      syncLoop();
    };

    const resizeObs = new ResizeObserver(queueResize);
    resizeObs.observe(hero);

    // The headline's entrance animation settles a frame or two after mount; re-measure once
    // fonts are in so the beam leaves the real full stop, not the fallback.
    document.fonts?.ready.then(() => queueResize()).catch(() => undefined);

    const visObs = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        syncLoop();
      },
      { threshold: 0.02 },
    );
    visObs.observe(hero);

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
      if (commitTimer !== undefined) clearTimeout(commitTimer);
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
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 block h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
