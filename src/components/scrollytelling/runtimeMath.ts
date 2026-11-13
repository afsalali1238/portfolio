import { clamp } from "./opticsEngine";

export interface TrackMetrics {
  start: number;
  span: number;
}

export function progressAt(scrollY: number, metrics: TrackMetrics) {
  if (
    !Number.isFinite(scrollY) ||
    !Number.isFinite(metrics.start) ||
    !Number.isFinite(metrics.span) ||
    metrics.span <= 0
  )
    return 0;
  return clamp((scrollY - metrics.start) / metrics.span);
}

export function scrollAt(progress: number, metrics: TrackMetrics) {
  const start = Number.isFinite(metrics.start) ? metrics.start : 0;
  const span = Number.isFinite(metrics.span) ? Math.max(0, metrics.span) : 0;
  return start + clamp(Number.isFinite(progress) ? progress : 0) * span;
}

/** offsetTop is relative to an offset parent, not necessarily the document. */
export function measureTrack(track: HTMLElement, stage: HTMLElement): TrackMetrics {
  return {
    start: track.getBoundingClientRect().top + window.scrollY,
    span: Math.max(0, track.offsetHeight - stage.clientHeight),
  };
}

export function dampedStep(
  current: number,
  target: number,
  deltaSeconds: number,
  immediate = false,
) {
  if (immediate || Math.abs(target - current) < 0.00001) return target;
  const weight = 1 - Math.pow(0.92, Math.max(0, Math.min(deltaSeconds, 0.05)) * 60);
  const result = current + (target - current) * weight;
  return Math.abs(target - result) < 0.00001 ? target : result;
}

export const MAX_CANVAS_PIXELS = 4_000_000;

/** Bound memory on large/high-DPI monitors, and never allocate a zero-sized source canvas. */
export function canvasSize(width: number, height: number, devicePixelRatio: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  const requested =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const ratio = Math.min(
    requested,
    2,
    Math.sqrt(MAX_CANVAS_PIXELS / (width * height)),
    8192 / width,
    8192 / height,
  );
  return {
    ratio,
    width: Math.max(1, Math.floor(width * ratio)),
    height: Math.max(1, Math.floor(height * ratio)),
  };
}
