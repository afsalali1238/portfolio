import {
  CROWN_GLASS_REFRACTIVE_INDEX,
  SPEED_OF_LIGHT,
  SPECTRAL_BANDS,
  VACUUM_REFRACTIVE_INDEX,
  type Ray,
  type RayHit,
  type RaySegment,
  type SnellResult,
  type SpectralRayTrace,
  type SpectrumBand,
  type Vec2,
} from "./types";

const EPSILON = 1e-7;
const RED_WAVELENGTH_UM = 0.68;
/**
 * Crown-glass calibrated Cauchy coefficient in micrometres squared. It yields a 0.040 index
 * spread from 680 nm to 410 nm, with the table bands landing at approximately +0.000, +0.008,
 * +0.016, +0.023, and +0.040. The scale falls to zero in vacuum.
 */
const CAUCHY_COEFFICIENT_UM2 = 0.01057;
const MAX_INTERNAL_BOUNCES = 4;

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const subtract = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (vector: Vec2, amount: number): Vec2 => ({
  x: vector.x * amount,
  y: vector.y * amount,
});
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;
export const length = (vector: Vec2): number => Math.hypot(vector.x, vector.y);

export function normalize(vector: Vec2): Vec2 {
  const magnitude = length(vector);
  if (magnitude < EPSILON) return { x: 0, y: 0 };
  return scale(vector, 1 / magnitude);
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function radians(degreesValue: number): number {
  return (degreesValue * Math.PI) / 180;
}

/** Signed area: positive points are counter-clockwise in the canvas coordinate system. */
export function polygonSignedArea(vertices: readonly Vec2[]): number {
  return (
    vertices.reduce((area, vertex, index) => {
      const next = vertices[(index + 1) % vertices.length];
      return area + vertex.x * next.y - next.x * vertex.y;
    }, 0) / 2
  );
}

/**
 * Returns the first forward intersection between a ray and finite line segment. Parallel lines,
 * backwards intersections, and segment endpoints outside tolerance return null.
 */
export function intersectRaySegment(
  ray: Ray,
  start: Vec2,
  end: Vec2,
): { point: Vec2; t: number; u: number } | null {
  const direction = normalize(ray.direction);
  const edge = subtract(end, start);
  const denominator = cross(direction, edge);

  if (Math.abs(denominator) < EPSILON || length(direction) < EPSILON || length(edge) < EPSILON) {
    return null;
  }

  const offset = subtract(start, ray.origin);
  const t = cross(offset, edge) / denominator;
  const u = cross(offset, direction) / denominator;

  if (t <= EPSILON || u < -EPSILON || u > 1 + EPSILON) return null;

  return {
    point: add(ray.origin, scale(direction, t)),
    t,
    u: clamp(u, 0, 1),
  };
}

/**
 * Cast a ray against every edge of a simple polygon and return the nearest positive impact.
 * Normals are consistently outward regardless of clockwise or counter-clockwise vertex order.
 */
export function intersectRayPolygon(ray: Ray, vertices: readonly Vec2[]): RayHit | null {
  if (vertices.length < 3 || length(ray.direction) < EPSILON) return null;

  const winding = polygonSignedArea(vertices) >= 0 ? 1 : -1;
  let closest: RayHit | null = null;

  vertices.forEach((start, edgeIndex) => {
    const end = vertices[(edgeIndex + 1) % vertices.length];
    const intersection = intersectRaySegment(ray, start, end);
    if (!intersection || (closest && intersection.t >= closest.distance)) return;

    const edge = subtract(end, start);
    const outwardNormal = normalize({
      x: edge.y * winding,
      y: -edge.x * winding,
    });

    if (length(outwardNormal) < EPSILON) return;

    closest = {
      point: intersection.point,
      distance: intersection.t,
      edgeIndex,
      normal: outwardNormal,
    };
  });

  return closest;
}

/** Reflect a direction around a surface normal. The normal may point either way. */
export function reflect(incident: Vec2, surfaceNormal: Vec2): Vec2 {
  const incoming = normalize(incident);
  let normal = normalize(surfaceNormal);
  if (length(incoming) < EPSILON || length(normal) < EPSILON) return { x: 0, y: 0 };
  if (dot(incoming, normal) > 0) normal = scale(normal, -1);
  return normalize(add(incoming, scale(normal, -2 * dot(incoming, normal))));
}

/**
 * Vector Snell's law. `outwardNormal` is the geometric normal from the polygon. The function
 * face-forwards it internally so callers can use the same normal for entering and exiting rays.
 */
export function refract(
  incident: Vec2,
  outwardNormal: Vec2,
  incidentIndex: number,
  transmittedIndex: number,
): SnellResult {
  const incoming = normalize(incident);
  let normal = normalize(outwardNormal);

  if (
    length(incoming) < EPSILON ||
    length(normal) < EPSILON ||
    incidentIndex <= 0 ||
    transmittedIndex <= 0
  ) {
    return {
      direction: { x: 0, y: 0 },
      isInternalReflection: false,
      cosIncident: 0,
      sinTransmittedSquared: 0,
    };
  }

  // A polygon normal points out of the medium. At an exit it points with the ray, so turn it
  // against the ray before applying the vector form of Snell's law.
  if (dot(incoming, normal) > 0) normal = scale(normal, -1);

  const cosIncident = clamp(-dot(incoming, normal), 0, 1);
  const eta = incidentIndex / transmittedIndex;
  const sinTransmittedSquared = eta * eta * Math.max(0, 1 - cosIncident * cosIncident);

  if (sinTransmittedSquared > 1 + EPSILON) {
    return {
      direction: reflect(incoming, normal),
      isInternalReflection: true,
      cosIncident,
      sinTransmittedSquared,
    };
  }

  const root = Math.sqrt(Math.max(0, 1 - sinTransmittedSquared));
  return {
    direction: normalize(add(scale(incoming, eta), scale(normal, eta * cosIncident - root))),
    isInternalReflection: false,
    cosIncident,
    sinTransmittedSquared,
  };
}

/**
 * Cauchy dispersion with a red reference band. The mathematical form is n = base + C / λ²;
 * anchoring to the red band makes the user-facing density control mean exactly n at 680 nm.
 * The C coefficient scales with density so n = 1.000 remains a true vacuum (no false spectrum).
 */
export function cauchyRefractiveIndex(baseIndex: number, wavelengthNm: number): number {
  const density = Math.max(VACUUM_REFRACTIVE_INDEX, baseIndex);
  const wavelengthUm = Math.max(0.001, wavelengthNm / 1000);
  const craftScale =
    (density - VACUUM_REFRACTIVE_INDEX) / (CROWN_GLASS_REFRACTIVE_INDEX - VACUUM_REFRACTIVE_INDEX);
  const wavelengthTerm =
    1 / (wavelengthUm * wavelengthUm) - 1 / (RED_WAVELENGTH_UM * RED_WAVELENGTH_UM);

  return density + Math.max(0, craftScale) * CAUCHY_COEFFICIENT_UM2 * wavelengthTerm;
}

export function dispersionForDensity(baseIndex: number): number {
  const red = cauchyRefractiveIndex(baseIndex, SPECTRAL_BANDS[0].wavelengthNm);
  const violet = cauchyRefractiveIndex(
    baseIndex,
    SPECTRAL_BANDS[SPECTRAL_BANDS.length - 1].wavelengthNm,
  );
  return violet - red;
}

export function velocityInMedium(refractiveIndex: number): number {
  return SPEED_OF_LIGHT / Math.max(VACUUM_REFRACTIVE_INDEX, refractiveIndex);
}

/**
 * Trace one measurement band through a prism. On total internal reflection the ray remains in
 * the polygon and can bounce up to four times before the trace is safely stopped.
 */
export function traceSpectralRay(
  origin: Vec2,
  direction: Vec2,
  polygon: readonly Vec2[],
  refractiveIndex: number,
  band: SpectrumBand,
): SpectralRayTrace {
  const initialRay: Ray = { origin, direction: normalize(direction) };
  const entry = intersectRayPolygon(initialRay, polygon);
  const empty: Omit<SpectralRayTrace, "band" | "refractiveIndex"> = {
    entry,
    internalSegments: [],
    exitOrigin: null,
    exitDirection: null,
    isInternalReflection: false,
    didExit: false,
  };

  if (!entry || length(initialRay.direction) < EPSILON) {
    return { band, refractiveIndex, ...empty };
  }

  const entered = refract(
    initialRay.direction,
    entry.normal,
    VACUUM_REFRACTIVE_INDEX,
    refractiveIndex,
  );
  if (entered.isInternalReflection || length(entered.direction) < EPSILON) {
    return { band, refractiveIndex, ...empty, isInternalReflection: entered.isInternalReflection };
  }

  const internalSegments: RaySegment[] = [];
  let point = entry.point;
  let currentDirection = entered.direction;
  let sawInternalReflection = false;

  for (let bounce = 0; bounce < MAX_INTERNAL_BOUNCES; bounce += 1) {
    const insideOrigin = add(point, scale(currentDirection, EPSILON * 100));
    const exitHit = intersectRayPolygon(
      { origin: insideOrigin, direction: currentDirection },
      polygon,
    );
    if (!exitHit) break;

    internalSegments.push({ start: point, end: exitHit.point });
    const escaped = refract(
      currentDirection,
      exitHit.normal,
      refractiveIndex,
      VACUUM_REFRACTIVE_INDEX,
    );

    if (!escaped.isInternalReflection) {
      return {
        band,
        refractiveIndex,
        entry,
        internalSegments,
        exitOrigin: exitHit.point,
        exitDirection: escaped.direction,
        isInternalReflection: sawInternalReflection,
        didExit: true,
      };
    }

    sawInternalReflection = true;
    point = exitHit.point;
    currentDirection = escaped.direction;
  }

  return {
    band,
    refractiveIndex,
    entry,
    internalSegments,
    exitOrigin: null,
    exitDirection: null,
    isInternalReflection: sawInternalReflection,
    didExit: false,
  };
}

/** The physical angle between a ray and a face normal, in degrees. */
export function incidentAngleDegrees(direction: Vec2, outwardNormal: Vec2): number {
  const ray = normalize(direction);
  let normal = normalize(outwardNormal);
  if (dot(ray, normal) > 0) normal = scale(normal, -1);
  if (length(ray) < EPSILON || length(normal) < EPSILON) return 0;
  return degrees(Math.acos(clamp(-dot(ray, normal), -1, 1)));
}
