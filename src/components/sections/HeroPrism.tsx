import { useEffect, useRef, type MutableRefObject } from "react";
import { createHeroRay, type Ctx } from "./hero-ray";
import { measureHero, shouldIgnoreHeroPointerTarget, type LayoutSnapshot } from "./hero-layout";

export type HeroSourceMode = "rest" | "left" | "base" | "right" | "custom";

export type HeroPrismControl = {
  cyclePreset: () => HeroSourceMode;
  reset: () => void;
};

const MAX_DELTA_MS = 64;
/**
 * Reallocating a 2× backing store costs tens of milliseconds while the user is still dragging
 * the window, so the canvas commits its size once resizing has gone quiet. Layout is measured
 * immediately (cheap); the backing store follows.
 */
const RESIZE_COMMIT_DELAY_MS = 140;
/** Above this many device pixels the canvas drops resolution rather than the frame rate. */
const MAX_BACKING_PIXELS = 2_200_000;
/**
 * How long a still pointer keeps influencing the field. The current is what makes the hero
 * feel alive, so it should not switch itself off while the cursor is parked on the page —
 * only release when the pointer has truly gone (it also releases on pointerleave/blur).
 */
const POINTER_IDLE_RELEASE_MS = 45_000;
/**
 * Ambient motion runs at half rate once nothing has interacted for this long. The field's own
 * animation is a 0.16 Hz ripple — 30 fps and 60 fps are indistinguishable — so the idle hero
 * stops paying for frames it cannot show. The engine is handed the real time between paints,
 * so the ripple does not slow down, it just moves in bigger steps.
 */
const IDLE_HALF_RATE_AFTER_MS = 2_500;
/** Just under one 30 fps frame, so a 60 Hz display paints every second callback. */
const HALF_RATE_MIN_STEP_MS = 1000 / 30 - 2;
/**
 * Touch screens never hover, so there is nothing to refract. After this long without a real
 * touch the shell feeds the engine a synthetic point that drifts inside the glass, which keeps
 * the hero alive on phones without pretending a cursor exists. A real touch takes over
 * immediately and holds for the same window, so the two never fight.
 */
const AUTONOMOUS_RESUME_MS = 6_000;
/** How long a scroll gesture keeps the loop at full 60 fps before dropping back to 30 fps idle. */
const SCROLL_WAKE_MS = 400;
/** Keep the complete source ignition at display rate, even with a stationary pointer. */
const CLICK_WAKE_MS = 850;
/** After this long without interaction, the rAF loop quietly rests at 0 fps. */
const SLEEP_IDLE_AFTER_MS = 20_000;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

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
/** Minimum drag distance (px) before a touch gesture is treated as scroll/pan instead of tap. */
const TOUCH_TAP_SLOP_PX = 10;
/** Maximum interval (ms) and distance (px) for a double-tap reset on touch devices. */
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_DIST_PX = 28;

const PRESET_ORDER = ["left", "base", "right"] as const;

export function HeroPrism({
  className = "",
  controlRef,
  onSourceModeChange,
}: {
  className?: string;
  controlRef?: MutableRefObject<HeroPrismControl | null>;
  onSourceModeChange?: (mode: HeroSourceMode) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeCallbackRef = useRef(onSourceModeChange);
  modeCallbackRef.current = onSourceModeChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>("[data-hero]") ?? null;
    if (!canvas || !hero) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // The engine only needs the structural subset both DOM canvas and node-canvas share.
    const drawCtx = ctx as unknown as Ctx;

    // Offscreen surfaces (the drafting plate) are the shell's job: the engine stays DOM-free.
    let plateCanvas: HTMLCanvasElement | undefined;
    const ray = createHeroRay({
      createSurface: (width, height) => {
        // Reuse the element across rebuilds: assigning width/height reallocates the backing
        // store, and dropping the old canvas to the GC mid-drag keeps the free list churning.
        // One reused canvas turns a resize from "allocate + paint + collect" into "paint".
        const surface = plateCanvas ?? document.createElement("canvas");
        plateCanvas = surface;
        surface.width = Math.max(1, width);
        surface.height = Math.max(1, height);
        const surfaceCtx = surface.getContext("2d");
        // The blit target is cleared by the resize; cheap insurance if the factory is ever
        // handed a tighter box than the one it holds.
        surfaceCtx?.clearRect(0, 0, surface.width, surface.height);
        // `image` is the canvas itself: drawImage blits an element, never a context.
        return surfaceCtx
          ? { ctx: surfaceCtx as unknown as Ctx, width, height, image: surface }
          : null;
      },
    });
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReduced = motionQuery.matches;
    // A device that cannot hover has no cursor for the field to answer, so it answers itself.
    const hoverQuery = window.matchMedia("(hover: hover)");
    let autonomous = !hoverQuery.matches;
    const onHoverChange = (e: MediaQueryListEvent) => {
      autonomous = !e.matches;
    };

    let rafId = 0;
    let running = false;
    let inView = true;

    let cssW = 0;
    let cssH = 0;
    let rectLeft = 0;
    let rectTop = 0;
    let heroDocTop = 0;
    let lastPaintTs = 0;
    // Start "warm": the entrance (the prime line growing out of the dot) is the one moment the
    // hero should run at full rate, so the half-rate path only opens once it has had its 2.5 s.
    let lastPointerTs = performance.now();
    let lastScrollTs = 0;
    let lastClickTs = -Infinity;
    let scrollProgress = 0;
    let wasDrifting = false;
    let lastRealPointerAt = 0;
    let lastClientX = 0;
    let lastClientY = 0;
    let pointerInside = false;
    let activeTouch: {
      id: number;
      startX: number;
      startY: number;
      moved: boolean;
      isStageTouch: boolean;
    } | null = null;
    let lastTapAt = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let sourceMode: HeroSourceMode = "rest";
    const setMode = (next: HeroSourceMode) => {
      if (sourceMode === next) return;
      sourceMode = next;
      modeCallbackRef.current?.(next);
    };
    /** Cached per resize: the anchor the autonomous drift orbits and how wide to make it. */
    let anchor: { x: number; y: number; size: number } | null = null;
    let painted = false;

    const debug =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).has("heroDebug");
    if (debug) {
      // QA only: the harness reads live geometry instead of waiting for the next resize.
      (window as unknown as { __heroRay?: unknown }).__heroRay = ray;
    }
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

    /**
     * The hero ships with a CSS stand-in for the ambient wash (see `.hero-wash`), so the
     * section is never bare while it waits for hydration. The first real frame retires it —
     * once, and only after something has actually been painted, so a slow device keeps the
     * placeholder instead of flashing empty.
     */
    const markPainted = () => {
      if (painted) return;
      painted = true;
      hero.dataset.heroPainted = "";
    };

    const paintStill = () => {
      ray.paintStill(drawCtx);
      markPainted();
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
      if (!running) paintStill();
      if (debug) console.log(`[hero] commit ${(performance.now() - commitStarted).toFixed(2)}`);
    };

    /** Cheap enough to run on every observer callback: measure the page, hand it to the engine. */
    const resize = () => {
      const resizeStarted = performance.now();
      const rect = hero.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      heroDocTop = rect.top + window.scrollY;
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      scrollProgress = clamp01((heroDocTop - rectTop) / Math.max(1, cssH));

      ray.setTheme(document.documentElement.classList.contains("dark"));
      const tMeasure = performance.now();
      const snapshot = measureHero(hero);
      if (debug) console.log(`[hero] measure ${(performance.now() - tMeasure).toFixed(2)}`);
      ray.setLayout(snapshot);
      const measured = ray.geometry();
      anchor = {
        x: measured.prismCenter.x,
        y: measured.prismCenter.y,
        size: measured.prismSize,
      };
      if (debug) {
        // ?heroDebug=1 — hand the measured snapshot + live geometry to the QA harness.
        (window as unknown as HeroDebugWindow).__hero = {
          layout: snapshot,
          geometry: ray.geometry(),
        };
      }

      if (!running || !sized) {
        commitCanvas();
        if (!running) paintStill();
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
      if (!prefersReduced) ray.setScroll(scrollProgress);
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

      const elapsed = lastPaintTs === 0 ? 16 : ts - lastPaintTs;
      const now = performance.now();
      const pointerIdle = now - lastPointerTs > IDLE_HALF_RATE_AFTER_MS;
      const scrollIdle = now - lastScrollTs > SCROLL_WAKE_MS;
      // Idle: paint every other callback. Skipping here (rather than inside the engine) keeps
      // the ripple's phase honest, because dt is measured between paints, not between frames.
      if (
        pointerIdle &&
        scrollIdle &&
        now - lastClickTs > CLICK_WAKE_MS &&
        elapsed < HALF_RATE_MIN_STEP_MS
      )
        return;
      lastPaintTs = ts;

      const scrollOwnsField = scrollProgress > 0.02 || now - lastScrollTs <= AUTONOMOUS_RESUME_MS;
      const drifting =
        autonomous && !scrollOwnsField && now - lastRealPointerAt > AUTONOMOUS_RESUME_MS;

      // After prolonged total idle, quietly rest at 0 fps until user interaction.
      const canSleep =
        pointerIdle &&
        scrollIdle &&
        !pointerInside &&
        now - lastPointerTs > SLEEP_IDLE_AFTER_MS &&
        now - lastScrollTs > SLEEP_IDLE_AFTER_MS &&
        now - lastClickTs > SLEEP_IDLE_AFTER_MS;
      if (canSleep && !drifting) {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
        ray.paint(drawCtx, Math.min(MAX_DELTA_MS, elapsed));
        markPainted();
        return;
      }

      if (drifting && anchor && anchor.size > 0) {
        // A lissajous well inside the triangle's inradius (0.16·size < r/2), so the synthetic
        // point never crosses the body's edge and the refraction never pops.
        wasDrifting = true;
        const t = ts / 1000;
        ray.setPointer(
          anchor.x + Math.sin(t * 0.37) * anchor.size * 0.16,
          anchor.y + Math.sin(t * 0.53 + 1.1) * anchor.size * 0.16,
          true,
        );
      } else if (wasDrifting || now - lastPointerTs > POINTER_IDLE_RELEASE_MS) {
        // Release the synthetic drift as soon as scroll takes over, or release a real pointer
        // once it has genuinely gone idle beyond the hold window.
        wasDrifting = false;
        ray.setPointer(0, 0, false);
      }

      const started = performance.now();
      ray.setDebug(debugVisible());
      ray.paint(drawCtx, Math.min(MAX_DELTA_MS, elapsed));
      if (sourceMode !== "rest" && !ray.isSourcePinned()) {
        setMode("rest");
      }
      markPainted();
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
        lastPaintTs = 0;
        rafId = requestAnimationFrame(frame);
        return;
      }
      if (!shouldRun && running) {
        running = false;
        cancelAnimationFrame(rafId);
        rafId = 0;
        if (prefersReduced) paintStill();
      }
    };

    const wakeLoop = () => {
      if (!running && inView && !document.hidden && !prefersReduced) {
        syncLoop();
      }
    };

    /**
     * Pointer position in hero-local CSS px.
     *
     * The old handler called measureHero() on every move, which re-read every rect in the
     * component — a per-frame layout read during a gesture. The canvas is stretched over the
     * hero and therefore shares its coordinate space, so one cached rect is enough; it is
     * refreshed on scroll and resize, both of which already run.
     */
    const onPointerMove = (e: PointerEvent) => {
      if (activeTouch && e.pointerId === activeTouch.id) {
        if (
          Math.hypot(e.clientX - activeTouch.startX, e.clientY - activeTouch.startY) >
          TOUCH_TAP_SLOP_PX
        ) {
          activeTouch.moved = true;
        }
        if (activeTouch.isStageTouch) {
          lastPointerTs = performance.now();
          const stageX = e.clientX - rectLeft;
          const stageY = e.clientY - rectTop;
          ray.setPointer(stageX, stageY, true);
        }
      }
      lastClientX = e.clientX;
      lastClientY = e.clientY;
      lastRealPointerAt = performance.now();
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      const inside = x >= 0 && x <= cssW && y >= -40 && y <= cssH + 40;
      pointerInside = inside;
      if (!activeTouch || activeTouch.isStageTouch) {
        ray.setPointer(x, y, inside);
      }
      if (inside) {
        lastPointerTs = performance.now();
        wakeLoop();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (prefersReduced || shouldIgnoreHeroPointerTarget(e.target, hero)) return;
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      if (x < 0 || x > cssW || y < 0 || y > cssH) return;

      lastPointerTs = performance.now();
      wakeLoop();

      if (e.pointerType === "touch") {
        if (e.isPrimary === false) return;
        const targetEl = e.target as Element | null;
        const isStageTouch = Boolean(targetEl?.closest?.("[data-hero-stage]"));
        activeTouch = {
          id: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          moved: false,
          isStageTouch,
        };
        lastRealPointerAt = performance.now();
        if (isStageTouch) {
          lastPointerTs = performance.now();
          ray.setPointer(x, y, true);
        }
        return;
      }

      if (e.button !== 0 || e.ctrlKey) return;
      lastRealPointerAt = performance.now();
      lastClickTs = lastRealPointerAt;
      ray.placeSource(x, y);
      setMode(ray.isSourcePinned() ? "custom" : "rest");
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!activeTouch || e.pointerId !== activeTouch.id) return;
      const touch = activeTouch;
      activeTouch = null;
      if (prefersReduced || shouldIgnoreHeroPointerTarget(e.target, hero)) return;
      if (!touch.isStageTouch && touch.moved) return;
      const x = e.clientX - rectLeft;
      const y = e.clientY - rectTop;
      if (x < 0 || x > cssW || y < 0 || y > cssH) return;

      const now = performance.now();
      lastRealPointerAt = now;
      lastClickTs = now;
      if (
        now - lastTapAt <= DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) <= DOUBLE_TAP_DIST_PX
      ) {
        lastTapAt = 0;
        ray.resetSource();
        setMode("rest");
        return;
      }
      lastTapAt = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
      ray.placeSource(x, y);
      setMode(ray.isSourcePinned() ? "custom" : "rest");
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (activeTouch && e.pointerId === activeTouch.id) {
        activeTouch = null;
      }
    };

    const onDoubleClick = (e: MouseEvent) => {
      if (prefersReduced || shouldIgnoreHeroPointerTarget(e.target, hero)) return;
      const x = e.clientX - rectLeft,
        y = e.clientY - rectTop;
      if (x < 0 || x > cssW || y < 0 || y > cssH) return;
      lastClickTs = performance.now();
      ray.resetSource();
      setMode("rest");
    };

    const onPointerLeave = () => {
      pointerInside = false;
      ray.setPointer(0, 0, false);
    };

    const onScroll = () => {
      const rect = hero.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      // The pointer is reported in hero-local coordinates, so a scroll moves the hero out
      // from under a still cursor. Re-project the last client position instead of letting
      // the current keep reaching for a stale point.
      if (pointerInside) {
        const x = lastClientX - rectLeft;
        const y = lastClientY - rectTop;
        const inside = x >= 0 && x <= cssW && y >= -40 && y <= cssH + 40;
        pointerInside = inside;
        ray.setPointer(x, y, inside);
      }
      // Progress over the hero's own scroll travel: 0 at the page's resting top, 1 when the
      // section has scrolled past. Always update scrollProgress (even around the inView edge)
      // so fast upward scrolls back to top never drop the final p = 0 update.
      if (prefersReduced) return;
      scrollProgress = clamp01((heroDocTop - rectTop) / Math.max(1, cssH));
      ray.setScroll(scrollProgress);
      if (inView) {
        lastScrollTs = performance.now();
        wakeLoop();
      }
    };

    const onVisibility = () => syncLoop();
    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      if (prefersReduced) {
        setMode("rest");
      } else {
        ray.setScroll(scrollProgress);
      }
      syncLoop();
    };

    if (controlRef) {
      controlRef.current = {
        cyclePreset: () => {
          if (prefersReduced) return "rest";
          lastClickTs = performance.now();
          wakeLoop();
          if (sourceMode === "custom") {
            ray.resetSource();
            setMode("rest");
            return "rest";
          }
          const currentIndex = PRESET_ORDER.indexOf(sourceMode as (typeof PRESET_ORDER)[number]);
          if (currentIndex === PRESET_ORDER.length - 1) {
            ray.aimSourcePreset("reset");
            setMode("rest");
            return "rest";
          }
          const nextPreset = PRESET_ORDER[currentIndex + 1];
          ray.aimSourcePreset(nextPreset);
          const nextMode = ray.isSourcePinned() ? nextPreset : "rest";
          setMode(nextMode);
          return nextMode;
        },
        reset: () => {
          if (prefersReduced) return;
          lastClickTs = performance.now();
          wakeLoop();
          ray.resetSource();
          setMode("rest");
        },
      };
    }

    const resizeObs = new ResizeObserver(queueResize);
    resizeObs.observe(hero);

    // The headline's entrance animation settles a frame or two after mount; re-measure once
    // fonts are in so the beam's landing is derived from the real display type, not the
    // fallback snapshot.
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
      if (!running) paintStill();
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Tile coupling: read the hovered tile from data attributes rather than attaching twelve
    // listeners — the engine only needs to know which band to light.
    const onHeroPointerOver = (e: PointerEvent) => {
      wakeLoop();
      const target = e.target as Element | null;
      const tile = target?.closest?.("[data-hero-tile]");
      const tiles = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-tile]"));
      ray.setTileHover(tile ? tiles.indexOf(tile as HTMLElement) : -1);
      ray.setHeadlineHover(Boolean(target?.closest?.("#hero-heading")));
    };

    const onHeroPointerLeave = () => {
      ray.setTileHover(-1);
      ray.setHeadlineHover(false);
    };

    hero.addEventListener("pointerover", onHeroPointerOver, { passive: true });
    hero.addEventListener("pointerleave", onHeroPointerLeave);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    window.addEventListener("dblclick", onDoubleClick, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);
    hoverQuery.addEventListener("change", onHoverChange);

    resize();
    if (prefersReduced) paintStill();
    else syncLoop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      if (controlRef) controlRef.current = null;
      ray.setScroll(0);
      // The hero may remount (route change): leave the CSS stand-in armed for the next engine.
      delete hero.dataset.heroPainted;
      if (commitTimer !== undefined) clearTimeout(commitTimer);
      resizeObs.disconnect();
      visObs.disconnect();
      themeObs.disconnect();
      hero.removeEventListener("pointerover", onHeroPointerOver);
      hero.removeEventListener("pointerleave", onHeroPointerLeave);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("dblclick", onDoubleClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
      hoverQuery.removeEventListener("change", onHoverChange);
    };
  }, [controlRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 block h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
