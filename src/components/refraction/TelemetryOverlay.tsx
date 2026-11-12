import { useEffect, useRef, type FormEvent, type MutableRefObject } from "react";
import {
  MATERIAL_PRESETS,
  SPECTRAL_BANDS,
  type MaterialPresetId,
  type RefractionControls,
  type SurfaceMode,
} from "./types";

type TelemetryOverlayProps = {
  controlsRef: MutableRefObject<RefractionControls>;
  activePreset: MaterialPresetId;
  surfaceMode: SurfaceMode;
  muted: boolean;
  onDensityInput: (density: number) => void;
  onPreset: (presetId: MaterialPresetId) => void;
  onSurfaceMode: (surfaceMode: SurfaceMode) => void;
  onToggleMute: () => void;
  showHud?: boolean;
  showControls?: boolean;
};

const statusCopy = {
  tracking: "TRANSMISSION",
  "no-impact": "NO IMPACT",
  reflection: "SPECULAR RETURN",
  "total-internal-reflection": "TOTAL INTERNAL REFLECTION",
} as const;

/**
 * A DOM HUD for the canvas. It updates output nodes directly at a restrained cadence instead of
 * subscribing React state to every pointer frame, keeping the pointer-to-photon path immediate.
 */
export function TelemetryOverlay({
  controlsRef,
  activePreset,
  surfaceMode,
  muted,
  onDensityInput,
  onPreset,
  onSurfaceMode,
  onToggleMute,
  showHud = true,
  showControls = true,
}: TelemetryOverlayProps) {
  const angleRef = useRef<HTMLOutputElement>(null);
  const indexRef = useRef<HTMLOutputElement>(null);
  const velocityRef = useRef<HTMLOutputElement>(null);
  const dispersionRef = useRef<HTMLOutputElement>(null);
  const densityValueRef = useRef<HTMLOutputElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!showHud || typeof window === "undefined") return;
    let rafId = 0;
    let lastUpdate = -Infinity;

    const update = (time: number) => {
      if (time - lastUpdate > 80) {
        const telemetry = controlsRef.current.telemetry;
        if (angleRef.current)
          angleRef.current.textContent = `${telemetry.incidentAngleDegrees.toFixed(1)}°`;
        if (indexRef.current) indexRef.current.textContent = telemetry.density.toFixed(3);
        if (velocityRef.current) {
          velocityRef.current.textContent = `${(telemetry.velocity / 100_000_000).toFixed(3)} × 10⁸`;
        }
        if (dispersionRef.current)
          dispersionRef.current.textContent = `Δ ${telemetry.dispersion.toFixed(3)}`;
        if (densityValueRef.current)
          densityValueRef.current.textContent = `n = ${telemetry.density.toFixed(3)}`;
        if (statusRef.current) {
          statusRef.current.textContent = statusCopy[telemetry.status];
          statusRef.current.dataset.alert = telemetry.isInternalReflection ? "true" : "false";
        }
        lastUpdate = time;
      }
      rafId = window.requestAnimationFrame(update);
    };

    rafId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(rafId);
  }, [controlsRef, showHud]);

  const handleDensityInput = (event: FormEvent<HTMLInputElement>) => {
    const density = Number(event.currentTarget.value);
    if (densityValueRef.current) densityValueRef.current.textContent = `n = ${density.toFixed(3)}`;
    onDensityInput(density);
  };

  return (
    <>
      {showHud && (
        <aside
          className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-end sm:inset-x-5 sm:top-5"
          aria-label="Optical telemetry"
        >
          <div className="w-[min(15rem,calc(100vw-3rem))] border rule-hair bg-paper/90 p-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 border-b rule-hair pb-2">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink-mute">
                Optical telemetry
              </span>
              <button
                type="button"
                onClick={onToggleMute}
                className="pointer-events-auto min-h-7 border rule-hair px-2 font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                aria-pressed={!muted}
                aria-label={muted ? "Enable laboratory sound" : "Mute laboratory sound"}
              >
                Audio {muted ? "off" : "on"}
              </button>
            </div>

            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 font-mono text-[10px] tabular-nums">
              <div>
                <dt className="uppercase tracking-[0.1em] text-ink-mute">θ1 incident</dt>
                <dd className="mt-0.5 text-sm text-ink">
                  <output ref={angleRef}>—</output>
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.1em] text-ink-mute">n medium</dt>
                <dd className="mt-0.5 text-sm text-ink">
                  <output ref={indexRef}>1.520</output>
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.1em] text-ink-mute">v medium</dt>
                <dd className="mt-0.5 whitespace-nowrap text-[11px] text-ink">
                  <output ref={velocityRef}>—</output> <span className="text-ink-mute">m/s</span>
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-[0.1em] text-ink-mute">dispersion</dt>
                <dd className="mt-0.5 text-sm text-ink">
                  <output ref={dispersionRef}>—</output>
                </dd>
              </div>
            </dl>

            <div className="mt-2 border-t rule-hair pt-2">
              <span
                ref={statusRef}
                className="font-mono text-[9px] font-medium tracking-[0.08em] text-accent-ink data-[alert=true]:text-ink"
                data-alert="false"
              >
                TRACKING
              </span>
            </div>
          </div>
        </aside>
      )}

      {showControls && (
        <section
          className="border-x border-b rule-hair bg-paper px-4 py-4 sm:px-5"
          aria-label="Refraction engine controls"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <label
                  htmlFor="refraction-density"
                  className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink"
                >
                  Craft density · refractive index
                </label>
                <output
                  ref={densityValueRef}
                  className="font-mono text-xs tabular-nums text-accent-ink"
                >
                  n = {controlsRef.current.density.toFixed(3)}
                </output>
              </div>
              <input
                key={activePreset}
                id="refraction-density"
                type="range"
                min="1"
                max="2.4"
                step="0.005"
                defaultValue={controlsRef.current.density}
                onInput={handleDensityInput}
                className="mt-3 h-2 w-full cursor-ew-resize accent-[var(--accent-ink)]"
                aria-describedby="refraction-density-help"
              />
              <p
                id="refraction-density-help"
                className="mt-2 font-mono text-[10px] leading-relaxed text-ink-mute"
              >
                n = 1.000 is vacuum. Increase density to slow the beam and separate its measured
                bands.
              </p>
            </div>

            <div className="min-w-0 lg:w-[22rem]">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ink">
                Surface response
              </span>
              <div className="mt-2 flex gap-2" role="group" aria-label="Surface response">
                <button
                  type="button"
                  onClick={() => onSurfaceMode("prism")}
                  className={`min-h-9 border px-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                    surfaceMode === "prism"
                      ? "border-ink bg-ink text-paper"
                      : "rule-hair bg-paper text-ink hover:bg-paper-deep"
                  }`}
                >
                  Prism
                </button>
                <button
                  type="button"
                  onClick={() => onSurfaceMode("wall")}
                  className={`min-h-9 border px-3 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                    surfaceMode === "wall"
                      ? "border-ink bg-ink text-paper"
                      : "rule-hair bg-paper text-ink hover:bg-paper-deep"
                  }`}
                >
                  Stone wall
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t rule-hair pt-3">
            <div
              className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
              aria-label="Material presets"
            >
              {MATERIAL_PRESETS.map((preset) => {
                const active = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onPreset(preset.id)}
                    className={`shrink-0 border px-3 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                      active
                        ? "border-ink bg-ink text-paper"
                        : "rule-hair bg-paper text-ink hover:bg-paper-deep"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t rule-hair pt-3 sm:grid-cols-5">
            {SPECTRAL_BANDS.map((band) => (
              <div
                key={band.id}
                className="flex items-center gap-2 font-mono text-[10px] text-ink-soft"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: band.color }}
                  aria-hidden="true"
                />
                <span>{band.label}</span>
                <span className="text-ink-mute">{band.wavelengthNm} nm</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
