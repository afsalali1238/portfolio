import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  cauchyIndex,
  degrees,
  normalize,
  ParticleField,
  radians,
  raySegment,
  reflect,
  refract,
  tracePrism,
} from './opticsEngine'
import { CHAPTERS, chapterAt, surfaceAt } from './story'

const close = (actual: number, expected: number, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≈ ${expected}`)

describe('Snell’s law', () => {
  it('preserves normal incidence', () => {
    const d = refract({ x: 1, y: 0 }, { x: -1, y: 0 }, 1, 1.52)!
    close(d.x, 1)
    close(d.y, 0)
  })
  it('bends toward the normal in glass', () => {
    const angle = radians(45),
      d = refract({ x: Math.cos(angle), y: Math.sin(angle) }, { x: -1, y: 0 }, 1, 1.52)!
    close(Math.asin(d.y), Math.asin(Math.sin(angle) / 1.52))
  })
  it('detects total internal reflection', () =>
    assert.equal(
      refract({ x: Math.cos(radians(65)), y: Math.sin(radians(65)) }, { x: -1, y: 0 }, 1.52, 1),
      null,
    ))
  it('reflects a mirror ray by 180°', () =>
    assert.deepEqual(reflect({ x: 1, y: 0 }, { x: -1, y: 0 }), { x: -1, y: 0 }))
})
describe('Prism geometry and spectral dispersion', () => {
  const vertices = [
    { x: 0, y: -200 },
    { x: -Math.sqrt(3) * 100, y: 100 },
    { x: Math.sqrt(3) * 100, y: 100 },
  ]
  const aim = { x: vertices[1].x * 0.6, y: -20 },
    a = radians(-39.7),
    direction = { x: Math.cos(a), y: Math.sin(a) }
  const origin = { x: aim.x - direction.x * 400, y: aim.y - direction.y * 400 }
  it('intersects a segment without accepting intersections behind the ray', () => {
    close(raySegment({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 5, y: -1 }, { x: 5, y: 1 })!.distance, 5)
    assert.equal(raySegment({ x: 6, y: 0 }, { x: 1, y: 0 }, { x: 5, y: -1 }, { x: 5, y: 1 }), null)
  })
  it('traces both glass boundaries with a ~32° bend', () => {
    const result = tracePrism(origin, direction, vertices)!
    assert.ok(result && !result.totalInternalReflection)
    close(result.entry.x, aim.x)
    close(result.entry.y, aim.y)
    const bend = degrees(result.incidentAngle - result.refractedAngle)
    assert.ok(bend > 31 && bend < 33)
    assert.ok(result.exit.x > result.entry.x)
    close(Math.hypot(result.outgoing.x, result.outgoing.y), 1)
  })
  it('calibrates the green index to 1.520 and bends violet more than red', () => {
    close(cauchyIndex(520), 1.52)
    assert.ok(cauchyIndex(410) > cauchyIndex(680))
    const red = tracePrism(origin, direction, vertices, cauchyIndex(680))!,
      violet = tracePrism(origin, direction, vertices, cauchyIndex(410))!
    assert.ok(red.refractedAngle > violet.refractedAngle)
  })
  it('normalizes safely', () => close(Math.hypot(...Object.values(normalize({ x: 4, y: 3 }))), 1))
})
describe('Particle budget and lifecycle', () => {
  it('has exactly 120 particles and decays velocity and lifetime', () => {
    const pool = new ParticleField()
    pool.ignite({ x: 10, y: 20 }, 1, 999)
    assert.equal(pool.count, 120)
    const vx = Math.abs(pool.data[2]),
      life = pool.data[4]
    pool.update(1 / 60)
    assert.ok(Math.abs(pool.data[2]) < vx)
    assert.ok(pool.data[4] < life)
    for (let i = 0; i < 300; i++) pool.update(1 / 60)
    assert.equal(pool.data[4], 0)
  })
})
describe('Story timing', () => {
  it('keeps the complete progress interval covered', () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000,
        chapter = CHAPTERS[chapterAt(p)]
      assert.ok(p >= chapter.start && p < chapter.end)
    }
  })
  it('synchronizes the surface order', () => {
    assert.equal(surfaceAt(0.397), 0)
    assert.equal(surfaceAt(0.431), 1)
    assert.equal(surfaceAt(0.468), 2)
    assert.equal(surfaceAt(0.516), 3)
  })
})
