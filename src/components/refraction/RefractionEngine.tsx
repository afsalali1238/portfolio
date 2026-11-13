import { useCallback, useEffect, useRef, useState } from "react";
import { OpticalAudioSynthesizer } from "./audioSynthesizer";
import { RefractionCanvas } from "./RefractionCanvas";
import { TelemetryOverlay } from "./TelemetryOverlay";
import {
  CROWN_GLASS_REFRACTIVE_INDEX,
  MATERIAL_PRESETS,
  SPEED_OF_LIGHT,
  type MaterialPresetId,
  type RefractionControls,
  type SurfaceMode,
} from "./types";

type RefractionEngineProps = {
  className?: string;
  /** Makes the control copy a little tighter for the standalone laboratory route. */
  standalone?: boolean;
};

const INITIAL_CONTROLS: RefractionControls = {
  density: CROWN_GLASS_REFRACTIVE_INDEX,
  surfaceMode: "prism",
  beamAngleDegrees: 0,
  telemetry: {
    incidentAngleDegrees: 30,
    density: CROWN_GLASS_REFRACTIVE_INDEX,
    velocity: SPEED_OF_LIGHT / CROWN_GLASS_REFRACTIVE_INDEX,
    dispersion: 0.04,
    isInternalReflection: false,
    didHitSurface: true,
    status: "tracking",
  },
};

/**
 * SSR-safe composition shell. React owns only deliberate interface state; the mutable physics
 * control object is read by the canvas and HUD without making a render part of every ray update.
 */
export function RefractionEngine({ className = "", standalone = false }: RefractionEngineProps) {
  const controlsRef = useRef<RefractionControls>({
    ...INITIAL_CONTROLS,
    telemetry: { ...INITIAL_CONTROLS.telemetry },
  });
  const audioRef = useRef<OpticalAudioSynthesizer | null>(null);
  const [activePreset, setActivePreset] = useState<MaterialPresetId>("crown");
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>("prism");
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new OpticalAudioSynthesizer();
    audio.initialize();
    audio.setMuted(true);
    audio.setDensity(controlsRef.current.density);
    audioRef.current = audio;

    return () => {
      audio.destroy();
      audioRef.current = null;
    };
  }, []);

  const activateAudio = useCallback(() => {
    audioRef.current?.activate();
  }, []);

  const handleDensityInput = useCallback((density: number) => {
    controlsRef.current.density = density;
    audioRef.current?.activate();
    audioRef.current?.setDensity(density);
  }, []);

  const handlePreset = useCallback((presetId: MaterialPresetId) => {
    const preset = MATERIAL_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    controlsRef.current.density = preset.density;
    controlsRef.current.surfaceMode = preset.surfaceMode;
    audioRef.current?.activate();
    audioRef.current?.setDensity(preset.density);
    setActivePreset(presetId);
    setSurfaceMode(preset.surfaceMode);
  }, []);

  const handleSurfaceMode = useCallback((nextSurfaceMode: SurfaceMode) => {
    controlsRef.current.surfaceMode = nextSurfaceMode;
    audioRef.current?.activate();
    setSurfaceMode(nextSurfaceMode);
    setActivePreset(nextSurfaceMode === "wall" ? "wall" : "crown");
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = !muted;
    activateAudio();
    audioRef.current?.setMuted(nextMuted);
    setMuted(nextMuted);
  }, [activateAudio, muted]);

  return (
    <section
      className={`overflow-hidden border rule-hair bg-paper shadow-[0_12px_36px_color-mix(in_oklch,var(--ink)_8%,transparent)] ${className}`}
      aria-labelledby="refraction-engine-title"
    >
      <header className="flex flex-col gap-4 border-b rule-hair bg-paper px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
          <div className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-accent-ink">
            Instrument 01 · Optical metrology
          </div>
          <h2
            id="refraction-engine-title"
            className="mt-2 font-serif text-3xl leading-none text-ink sm:text-4xl"
          >
            The Refraction Engine
          </h2>
        </div>
        <p className="max-w-md font-mono text-[10px] leading-relaxed text-ink-mute sm:text-right">
          Adjust the incident beam, index, and surface. The trace applies vector Snell&rsquo;s law
          at each interface; no decorative interpolation.
        </p>
      </header>

      <div className="relative aspect-[3/2] min-h-[20rem] overflow-hidden bg-paper-deep md:aspect-[16/9] md:min-h-[28rem]">
        <RefractionCanvas
          controlsRef={controlsRef}
          onInteraction={activateAudio}
          onBoundaryImpact={() => audioRef.current?.triggerBoundaryImpact()}
          onSpectrum={() => audioRef.current?.triggerSpectrum()}
        />
        <TelemetryOverlay
          showControls={false}
          controlsRef={controlsRef}
          activePreset={activePreset}
          surfaceMode={surfaceMode}
          muted={muted}
          onDensityInput={handleDensityInput}
          onPreset={handlePreset}
          onSurfaceMode={handleSurfaceMode}
          onToggleMute={handleToggleMute}
        />
        <div className="pointer-events-none absolute bottom-3 left-3 border rule-hair bg-paper/90 px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-mute sm:bottom-5 sm:left-5">
          Drag field to set beam angle · ↑ ↓ for fine control
        </div>
      </div>

      <TelemetryOverlay
        showHud={false}
        controlsRef={controlsRef}
        activePreset={activePreset}
        surfaceMode={surfaceMode}
        muted={muted}
        onDensityInput={handleDensityInput}
        onPreset={handlePreset}
        onSurfaceMode={handleSurfaceMode}
        onToggleMute={handleToggleMute}
      />

      <div className="border-t rule-hair bg-paper-deep/45 px-4 py-3 sm:px-5">
        <div className="grid gap-2 font-mono text-[10px] leading-relaxed text-ink-soft sm:grid-cols-[auto_1fr] sm:gap-x-4">
          <span className="font-medium uppercase tracking-[0.12em] text-ink">Method note</span>
          <p>
            {standalone
              ? "Five discrete wavelength bands are traced through the triangle. The density slider is the red-reference refractive index; Cauchy dispersion offsets shorter wavelengths."
              : "At a boundary between media with different refractive indices, a ray may bend. Entering a denser medium lowers its speed from c to c/n, while wavelength-dependent indices make the separation observable. The ray can bend again on exit."}
          </p>
        </div>
      </div>
    </section>
  );
}
