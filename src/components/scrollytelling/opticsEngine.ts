/** Pure optics and particle maths. This module is safe to import during SSR. */
export interface Vec2 {
  x: number
  y: number
}
export const TAU = Math.PI * 2
export const radians = (degrees: number) => (degrees * Math.PI) / 180
export const degrees = (radians: number) => (radians * 180) / Math.PI
export const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s })
export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y
export const length = (v: Vec2) => Math.hypot(v.x, v.y)
export const normalize = (v: Vec2): Vec2 => {
  const l = length(v) || 1
  return scale(v, 1 / l)
}
export const mix = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
})
export const reflect = (incident: Vec2, normal: Vec2): Vec2 =>
  sub(incident, scale(normal, 2 * dot(incident, normal)))

/** The normal must oppose the incoming direction. Null means total internal reflection. */
export function refract(incident: Vec2, normal: Vec2, n1: number, n2: number): Vec2 | null {
  const i = normalize(incident),
    n = normalize(normal),
    eta = n1 / n2
  const cosI = clamp(-dot(n, i), -1, 1)
  const discriminant = 1 - eta * eta * (1 - cosI * cosI)
  if (discriminant < 0) return null
  return normalize(add(scale(i, eta), scale(n, eta * cosI - Math.sqrt(discriminant))))
}

/** Cauchy's equation, λ in micrometres. Illustrative high-dispersion glass, n(520 nm) = 1.520. */
export function cauchyIndex(wavelengthNm: number) {
  return 1.4512 + 0.01860352 / (wavelengthNm / 1000) ** 2
}

export const SPECTRUM = [
  { name: 'Red', wavelength: 680, color: '#fb675c', rgb: '251,103,92' },
  { name: 'Amber', wavelength: 590, color: '#efbc69', rgb: '239,188,105' },
  { name: 'Emerald', wavelength: 520, color: '#94d4a0', rgb: '148,212,160' },
  { name: 'Cyan', wavelength: 480, color: '#84d6e8', rgb: '132,214,232' },
  { name: 'Violet', wavelength: 410, color: '#ad95ec', rgb: '173,149,236' },
] as const

const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x
export function raySegment(origin: Vec2, direction: Vec2, a: Vec2, b: Vec2) {
  const segment = sub(b, a),
    denominator = cross(direction, segment)
  if (Math.abs(denominator) < 1e-8) return null
  const difference = sub(a, origin)
  const t = cross(difference, segment) / denominator
  const u = cross(difference, direction) / denominator
  if (t <= 0.001 || u < -1e-8 || u > 1 + 1e-8) return null
  return { point: add(origin, scale(direction, t)), distance: t }
}

export interface PrismTrace {
  entry: Vec2
  exit: Vec2
  internal: Vec2
  outgoing: Vec2
  normal: Vec2
  incidentAngle: number
  refractedAngle: number
  totalInternalReflection: boolean
}

export function tracePrism(
  origin: Vec2,
  direction: Vec2,
  vertices: Vec2[],
  index = 1.52,
): PrismTrace | null {
  let nearest: { point: Vec2; distance: number; edge: number } | null = null
  for (let j = 0; j < vertices.length; j++) {
    const hit = raySegment(origin, direction, vertices[j], vertices[(j + 1) % vertices.length])
    if (hit && (!nearest || hit.distance < nearest.distance)) nearest = { ...hit, edge: j }
  }
  if (!nearest) return null
  const edgeVector = sub(vertices[(nearest.edge + 1) % vertices.length], vertices[nearest.edge])
  let normal = normalize({ x: edgeVector.y, y: -edgeVector.x })
  if (dot(normal, direction) > 0) normal = scale(normal, -1)
  const internal = refract(direction, normal, 1, index)
  if (!internal) return null
  let next: { point: Vec2; distance: number; edge: number } | null = null
  for (let j = 0; j < vertices.length; j++) {
    if (j === nearest.edge) continue
    const hit = raySegment(
      nearest.point,
      internal,
      vertices[j],
      vertices[(j + 1) % vertices.length],
    )
    if (hit && (!next || hit.distance < next.distance)) next = { ...hit, edge: j }
  }
  if (!next) return null
  const exitEdge = sub(vertices[(next.edge + 1) % vertices.length], vertices[next.edge])
  let exitNormal = normalize({ x: exitEdge.y, y: -exitEdge.x })
  if (dot(exitNormal, internal) > 0) exitNormal = scale(exitNormal, -1)
  const outgoing = refract(internal, exitNormal, index, 1)
  return {
    entry: nearest.point,
    exit: next.point,
    internal,
    outgoing: outgoing || reflect(internal, exitNormal),
    normal,
    incidentAngle: Math.acos(clamp(-dot(normal, normalize(direction)), -1, 1)),
    refractedAngle: Math.acos(clamp(-dot(normal, internal), -1, 1)),
    totalInternalReflection: !outgoing,
  }
}

/** An allocation-free, fixed-budget radial particle pool. */
export class ParticleField {
  readonly capacity = 120
  readonly data = new Float32Array(this.capacity * 6)
  count = 0
  age = 10
  origin: Vec2 = { x: 0, y: 0 }
  ignite(origin: Vec2, strength = 1, count = 120) {
    this.origin = origin
    this.age = 0
    this.count = Math.min(count, this.capacity)
    for (let i = 0; i < this.count; i++) {
      const seed = ((i * 7919 + 104729) % 65521) / 65521
      const angle = i * 2.3999632297,
        velocity = (70 + seed * 430) * strength
      const offset = i * 6
      this.data[offset] = origin.x
      this.data[offset + 1] = origin.y
      this.data[offset + 2] = Math.cos(angle) * velocity
      this.data[offset + 3] = Math.sin(angle) * velocity
      this.data[offset + 4] = 1.1 + seed * 2.2
      this.data[offset + 5] = 1.1 + seed * 2.2
    }
  }
  update(delta: number) {
    const dt = Math.min(delta, 0.05),
      decay = Math.exp(-dt * 1.3)
    this.age += dt
    for (let i = 0; i < this.count; i++) {
      const offset = i * 6
      this.data[offset] += this.data[offset + 2] * dt
      this.data[offset + 1] += this.data[offset + 3] * dt
      this.data[offset + 2] *= decay
      this.data[offset + 3] *= decay
      this.data[offset + 4] = Math.max(0, this.data[offset + 4] - dt)
    }
  }
}
