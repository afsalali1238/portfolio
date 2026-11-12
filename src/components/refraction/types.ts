export type Vec2 = {
  x: number;
  y: number;
};

export type Ray = {
  origin: Vec2;
  direction: Vec2;
};

export type RaySegment = {
  start: Vec2;
  end: Vec2;
};

export type RayHit = {
  point: Vec2;
  distance: number;
  edgeIndex: number;
  normal: Vec2;
};

export type SurfaceMode = "prism" | "wall";

export type SpectrumBand = {
  id: "red" | "amber" | "emerald" | "cyan" | "violet";
  label: string;
  wavelengthNm: number;
  color: string;
  outcome: string;
};

/**
 * The wavelengths are discrete measurement bands rather than a decorative gradient. Red is
 * the Cauchy reference band; the other indices rise as their wavelengths shorten.
 */
export const SPECTRAL_BANDS: readonly SpectrumBand[] = [
  { id: "red", label: "Red", wavelengthNm: 680, color: "#ef4444", outcome: "Perception" },
  { id: "amber", label: "Amber", wavelengthNm: 590, color: "#f59e0b", outcome: "Empathy" },
  { id: "emerald", label: "Emerald", wavelengthNm: 520, color: "#10b981", outcome: "Craft" },
  { id: "cyan", label: "Cyan", wavelengthNm: 480, color: "#0ea5e9", outcome: "Rigor" },
  { id: "violet", label: "Violet", wavelengthNm: 410, color: "#a855f7", outcome: "Becoming" },
] as const;

export const SPEED_OF_LIGHT = 299_792_458;
export const VACUUM_REFRACTIVE_INDEX = 1;
export const CROWN_GLASS_REFRACTIVE_INDEX = 1.52;
export const DIAMOND_REFRACTIVE_INDEX = 2.4;

export type MaterialPresetId = "vacuum" | "crown" | "diamond" | "wall";

export type MaterialPreset = {
  id: MaterialPresetId;
  label: string;
  density: number;
  surfaceMode: SurfaceMode;
};

export const MATERIAL_PRESETS: readonly MaterialPreset[] = [
  { id: "vacuum", label: "Vacuum · 1.000", density: VACUUM_REFRACTIVE_INDEX, surfaceMode: "prism" },
  {
    id: "crown",
    label: "Crown glass · 1.520",
    density: CROWN_GLASS_REFRACTIVE_INDEX,
    surfaceMode: "prism",
  },
  {
    id: "diamond",
    label: "Diamond · 2.400",
    density: DIAMOND_REFRACTIVE_INDEX,
    surfaceMode: "prism",
  },
  { id: "wall", label: "Stone wall", density: CROWN_GLASS_REFRACTIVE_INDEX, surfaceMode: "wall" },
] as const;

export type SnellResult = {
  direction: Vec2;
  /** True when the incident ray has no transmitted solution at this interface. */
  isInternalReflection: boolean;
  cosIncident: number;
  sinTransmittedSquared: number;
};

export type SpectralRayTrace = {
  band: SpectrumBand;
  refractiveIndex: number;
  entry: RayHit | null;
  internalSegments: RaySegment[];
  exitOrigin: Vec2 | null;
  exitDirection: Vec2 | null;
  isInternalReflection: boolean;
  didExit: boolean;
};

export type RefractionTelemetry = {
  incidentAngleDegrees: number;
  density: number;
  velocity: number;
  dispersion: number;
  isInternalReflection: boolean;
  didHitSurface: boolean;
  status: "tracking" | "no-impact" | "reflection" | "total-internal-reflection";
};

/** Mutable live values shared by the canvas and DOM HUD without frame-by-frame React renders. */
export type RefractionControls = {
  density: number;
  surfaceMode: SurfaceMode;
  beamAngleDegrees: number;
  telemetry: RefractionTelemetry;
};
