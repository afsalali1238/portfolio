import { useEffect, useRef, type MutableRefObject } from "react";
import {
  clamp,
  incidentAngleDegrees,
  intersectRaySegment,
  normalize,
  radians,
  reflect,
  traceSpectralRay,
  velocityInMedium,
  cauchyRefractiveIndex,
  dispersionForDensity,
} from "./opticsMath";
import {
  SPECTRAL_BANDS,
  type RefractionControls,
  type SpectralRayTrace,
  type SurfaceMode,
  type Vec2,
} from "./types";

type CanvasPalette = {
  paper: string;
  paperDeep: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  rule: string;
  accent: string;
};

type RefractionCanvasProps = {
  controlsRef: MutableRefObject<RefractionControls>;
  onInteraction: () => void;
  onBoundaryImpact: () => void;
  onSpectrum: () => void;
  className?: string;
};

const EMPTY_PALETTE: CanvasPalette = {
  paper: "#f7f5ee",
  paperDeep: "#efebe1",
  ink: "#302b25",
  inkSoft: "#5b534a",
  inkMute: "#887f74",
  rule: "#d7d0c4",
  accent: "#a6552d",
};

function lineToBounds(origin: Vec2, direction: Vec2, width: number, height: number): Vec2 {
  const ray = normalize(direction);
  const candidates: number[] = [];
  if (ray.x > 0) candidates.push((width - origin.x) / ray.x);
  if (ray.x < 0) candidates.push(-origin.x / ray.x);
  if (ray.y > 0) candidates.push((height - origin.y) / ray.y);
  if (ray.y < 0) candidates.push(-origin.y / ray.y);

  const validDistances = candidates.filter((value) => Number.isFinite(value) && value > 0);
  const distance = validDistances.length > 0 ? Math.min(...validDistances) : 0;
  return { x: origin.x + ray.x * distance, y: origin.y + ray.y * distance };
}

function drawLine(
  context: CanvasRenderingContext2D,
  start: Vec2,
  end: Vec2,
  color: string,
  width: number,
  alpha = 1,
) {
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.restore();
}

function drawPolygon(context: CanvasRenderingContext2D, vertices: readonly Vec2[]) {
  context.beginPath();
  context.moveTo(vertices[0].x, vertices[0].y);
  vertices.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.closePath();
}

function drawTrace(
  context: CanvasRenderingContext2D,
  trace: SpectralRayTrace,
  width: number,
  height: number,
  alpha = 0.72,
) {
  trace.internalSegments.forEach((segment) => {
    drawLine(context, segment.start, segment.end, trace.band.color, 1.35, alpha);
  });

  if (trace.exitOrigin && trace.exitDirection) {
    drawLine(
      context,
      trace.exitOrigin,
      lineToBounds(trace.exitOrigin, trace.exitDirection, width, height),
      trace.band.color,
      1.55,
      alpha,
    );
  }
}

function readPalette(): CanvasPalette {
  if (typeof window === "undefined") return EMPTY_PALETTE;
  const styles = window.getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    paper: token("--paper", EMPTY_PALETTE.paper),
    paperDeep: token("--paper-deep", EMPTY_PALETTE.paperDeep),
    ink: token("--ink", EMPTY_PALETTE.ink),
    inkSoft: token("--ink-soft", EMPTY_PALETTE.inkSoft),
    inkMute: token("--ink-mute", EMPTY_PALETTE.inkMute),
    rule: token("--rule", EMPTY_PALETTE.rule),
    accent: token("--accent-ink", EMPTY_PALETTE.accent),
  };
}

function prismVertices(width: number, height: number): Vec2[] {
  const size = Math.min(width * 0.47, height * 0.78);
  const centerX = width * 0.53;
  const centerY = height * 0.52;
  return [
    { x: centerX, y: centerY - size * 0.58 },
    { x: centerX + size * 0.62, y: centerY + size * 0.52 },
    { x: centerX - size * 0.62, y: centerY + size * 0.52 },
  ];
}

function surfaceLabel(surface: SurfaceMode): string {
  return surface === "wall" ? "REFLECTIVE FACE" : "DISPERSIVE PRISM";
}

/**
 * Canvas renderer for the instrument. Pointer values and all per-frame geometry remain mutable
 * refs, so interactions do not schedule React work while the ray is being dragged.
 */
export function RefractionCanvas({
  controlsRef,
  onInteraction,
  onBoundaryImpact,
  onSpectrum,
  className = "",
}: RefractionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacksRef = useRef({ onInteraction, onBoundaryImpact, onSpectrum });
  callbacksRef.current = { onInteraction, onBoundaryImpact, onSpectrum };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 1;
    let height = 1;
    let palette = readPalette();
    let rafId = 0;
    let visible = true;
    let pointerDown = false;
    let didPaint = false;
    let lastSignature = "";

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.round(width * devicePixelRatio);
      const nextHeight = Math.round(height * devicePixelRatio);
      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      palette = readPalette();
    };

    const drawGrid = () => {
      const gridSize = width < 520 ? 28 : 36;
      context.save();
      context.strokeStyle = palette.rule;
      context.globalAlpha = 0.5;
      context.lineWidth = 0.6;
      for (let x = gridSize / 2; x < width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = gridSize / 2; y < height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.restore();
    };

    const draw = () => {
      const controls = controlsRef.current;
      const density = clamp(controls.density, 1, 2.4);
      const beamAngleDegrees = clamp(controls.beamAngleDegrees, -30, 30);
      const direction = {
        x: Math.cos(radians(beamAngleDegrees)),
        y: Math.sin(radians(beamAngleDegrees)),
      };
      const origin = { x: width * 0.055, y: height * 0.53 };
      const vertices = prismVertices(width, height);

      context.clearRect(0, 0, width, height);
      context.fillStyle = palette.paperDeep;
      context.fillRect(0, 0, width, height);
      drawGrid();
      context.lineCap = "round";
      context.lineJoin = "round";

      let didHitSurface = false;
      let isInternalReflection = false;
      let incidentAngle = 0;
      let status: RefractionControls["telemetry"]["status"] = "no-impact";
      let incidentEnd = lineToBounds(origin, direction, width, height);
      let hasEscapingSpectrum = false;

      if (controls.surfaceMode === "prism") {
        context.save();
        drawPolygon(context, vertices);
        context.fillStyle = palette.paper;
        context.globalAlpha = 0.58;
        context.fill();
        context.globalAlpha = 0.96;
        context.strokeStyle = palette.ink;
        context.lineWidth = 1.2;
        context.stroke();
        context.restore();

        const traces = SPECTRAL_BANDS.map((band) =>
          traceSpectralRay(
            origin,
            direction,
            vertices,
            cauchyRefractiveIndex(density, band.wavelengthNm),
            band,
          ),
        );
        const referenceTrace = traces[0];
        if (referenceTrace.entry) {
          didHitSurface = true;
          incidentEnd = referenceTrace.entry.point;
          incidentAngle = incidentAngleDegrees(direction, referenceTrace.entry.normal);
        }

        isInternalReflection = traces.some((trace) => trace.isInternalReflection);
        hasEscapingSpectrum = traces.some((trace) => trace.didExit);
        const dispersion = dispersionForDensity(density);

        if (didHitSurface) {
          if (dispersion < 0.0001) {
            drawTrace(context, referenceTrace, width, height, 0.72);
          } else {
            traces.forEach((trace) => drawTrace(context, trace, width, height));
          }
        }

        if (isInternalReflection) status = "total-internal-reflection";
        else if (didHitSurface) status = "tracking";
      } else {
        const wallX = width * 0.64;
        const wallTop = height * 0.14;
        const wallBottom = height * 0.86;
        const hit = intersectRaySegment(
          { origin, direction },
          { x: wallX, y: wallTop },
          { x: wallX, y: wallBottom },
        );

        context.save();
        context.strokeStyle = palette.ink;
        context.lineWidth = 4;
        context.globalAlpha = 0.82;
        context.beginPath();
        context.moveTo(wallX, wallTop);
        context.lineTo(wallX, wallBottom);
        context.stroke();
        context.setLineDash([2, 5]);
        context.strokeStyle = palette.paper;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(wallX - 1, wallTop);
        context.lineTo(wallX - 1, wallBottom);
        context.stroke();
        context.restore();

        if (hit) {
          const normal = { x: -1, y: 0 };
          didHitSurface = true;
          incidentEnd = hit.point;
          incidentAngle = incidentAngleDegrees(direction, normal);
          drawLine(
            context,
            hit.point,
            lineToBounds(hit.point, reflect(direction, normal), width, height),
            palette.inkSoft,
            1.45,
            0.78,
          );
          status = "reflection";
        }
      }

      drawLine(context, origin, incidentEnd, palette.ink, 1.65, 0.95);
      context.save();
      context.fillStyle = palette.accent;
      context.beginPath();
      context.arc(origin.x, origin.y, 4.2, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = palette.paper;
      context.lineWidth = 1.1;
      context.beginPath();
      context.arc(origin.x, origin.y, 7.5, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      context.save();
      context.font = "500 10px ui-monospace, SFMono-Regular, Menlo, monospace";
      context.letterSpacing = "0.08em";
      context.fillStyle = palette.inkMute;
      context.fillText(
        "INCIDENT SOURCE",
        Math.min(width - 125, origin.x + 13),
        Math.max(17, origin.y - 14),
      );
      context.textAlign = "right";
      context.fillText(surfaceLabel(controls.surfaceMode), width - 16, height - 16);
      context.restore();

      const velocity = velocityInMedium(density);
      controls.telemetry = {
        incidentAngleDegrees: incidentAngle,
        density,
        velocity,
        dispersion: controls.surfaceMode === "prism" ? dispersionForDensity(density) : 0,
        isInternalReflection,
        didHitSurface,
        status,
      };

      const signature = [
        controls.surfaceMode,
        density.toFixed(3),
        beamAngleDegrees.toFixed(1),
        didHitSurface ? "hit" : "miss",
        isInternalReflection ? "tir" : "pass",
      ].join("|");
      if (didPaint && signature !== lastSignature && didHitSurface) {
        callbacksRef.current.onBoundaryImpact();
        if (controls.surfaceMode === "prism" && hasEscapingSpectrum && density > 1.001) {
          callbacksRef.current.onSpectrum();
        }
      }
      lastSignature = signature;
      didPaint = true;
    };

    const animate = () => {
      if (visible) draw();
      rafId = window.requestAnimationFrame(animate);
    };

    const updateBeam = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const origin = { x: rect.width * 0.055, y: rect.height * 0.53 };
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      if (localX <= origin.x + 12) return;
      controlsRef.current.beamAngleDegrees = clamp(
        (Math.atan2(localY - origin.y, localX - origin.x) * 180) / Math.PI,
        -30,
        30,
      );
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      canvas.setPointerCapture?.(event.pointerId);
      callbacksRef.current.onInteraction();
      updateBeam(event);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerDown) updateBeam(event);
    };
    const onPointerUp = (event: PointerEvent) => {
      pointerDown = false;
      if (canvas.hasPointerCapture?.(event.pointerId))
        canvas.releasePointerCapture?.(event.pointerId);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const increment = event.shiftKey ? 5 : 1;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        callbacksRef.current.onInteraction();
        controlsRef.current.beamAngleDegrees = clamp(
          controlsRef.current.beamAngleDegrees + (event.key === "ArrowUp" ? -increment : increment),
          -30,
          30,
        );
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible) draw();
      },
      { threshold: 0.01 },
    );
    visibilityObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("keydown", onKeyDown);
    resize();
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("keydown", onKeyDown);
    };
  }, [controlsRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`block h-full w-full touch-none cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-ink ${className}`}
      role="application"
      tabIndex={0}
      aria-label="Interactive optical ray tracing canvas. Drag to change the incident beam angle. Use the up and down arrow keys to make fine adjustments."
    />
  );
}
