import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { OpticsHandle } from "./OpticsCanvas";
import { clamp } from "./opticsEngine";

const INTERACTION_ENERGY_FLOOR = 0.02;
const INTERACTION_ENERGY_DECAY = 2.4;

/**
 * Maps native document reading progress onto the optical field. The field stays idle while the
 * reader reads, then briefly wakes for an intentional drag or spectrum release.
 */
export function useReadingAtmosphere({
  root,
  canvas,
}: {
  root: RefObject<HTMLElement | null>;
  canvas: RefObject<OpticsHandle | null>;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const tilt = useRef(0);
  const energy = useRef(0);
  const scheduleDraw = useRef<() => void>(() => {});

  const steer = useCallback((nextTilt: number) => {
    tilt.current = clamp(nextTilt, -0.72, 0.72);
    energy.current = Math.max(energy.current, 0.52);
    scheduleDraw.current();
  }, []);

  const ignite = useCallback(() => {
    energy.current = 1;
    canvas.current?.ignite();
    scheduleDraw.current();
  }, [canvas]);

  useEffect(() => {
    const rootElement = root.current;
    if (!rootElement) return;

    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contrastMedia = window.matchMedia("(forced-colors: active)");
    let frame = 0;
    let visible = true;
    let time = 0;
    let lastTime = 0;
    let reduced = motionMedia.matches;
    let forcedColors = contrastMedia.matches;

    const readingProgress = () => {
      const rect = rootElement.getBoundingClientRect();
      const start = window.scrollY + rect.top;
      const span = Math.max(rootElement.offsetHeight - window.innerHeight, 1);
      return clamp((window.scrollY - start) / span, 0, 1);
    };

    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || reduced || forcedColors) return;
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = now;
      time += delta * 1000;
      energy.current *= Math.exp(-delta * INTERACTION_ENERGY_DECAY);
      canvas.current?.draw({
        progress: readingProgress(),
        time,
        delta,
        tilt: tilt.current,
        reducedMotion: false,
        energy: energy.current,
      });
      // A release is legible for a short beat, then the canvas returns to a zero-draw idle state.
      if (energy.current > INTERACTION_ENERGY_FLOOR) schedule();
    };

    const schedule = () => {
      if (!frame && visible && !document.hidden && !reduced && !forcedColors)
        frame = requestAnimationFrame(draw);
    };
    scheduleDraw.current = schedule;
    const preference = () => {
      reduced = motionMedia.matches;
      forcedColors = contrastMedia.matches;
      setReducedMotion(reduced || forcedColors);
      lastTime = 0;
      schedule();
    };
    const visibility = () => {
      lastTime = 0;
      schedule();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        schedule();
      },
      { threshold: 0 },
    );
    const resize = () => schedule();

    observer.observe(rootElement);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    motionMedia.addEventListener("change", preference);
    contrastMedia.addEventListener("change", preference);
    preference();
    void document.fonts.ready.then(schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility);
      motionMedia.removeEventListener("change", preference);
      contrastMedia.removeEventListener("change", preference);
      scheduleDraw.current = () => {};
    };
  }, [root, canvas]);

  return { reducedMotion, steer, ignite };
}
