import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canvasSize, dampedStep, MAX_CANVAS_PIXELS, progressAt, scrollAt } from './runtimeMath'
import { lockDocumentScroll } from './scrollLock'

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`)

describe('Track-local progress and cinematic damping', () => {
  const metrics = { start: 600, span: 4500 }
  it('excludes content before and after the track', () => {
    assert.equal(progressAt(100, metrics), 0)
    assert.equal(progressAt(9000, metrics), 1)
    near(progressAt(600 + 4500 * 0.625, metrics), 0.625)
  })
  it('maps chapter navigation into the same document coordinate space', () => {
    near(scrollAt(0.625, metrics), 3412.5)
    assert.equal(scrollAt(-1, metrics), 600)
    assert.equal(scrollAt(2, metrics), 5100)
  })
  it('guards empty/invalid measurement inputs', () => {
    assert.equal(progressAt(300, { start: 0, span: 0 }), 0)
    assert.equal(progressAt(NaN, metrics), 0)
    assert.equal(progressAt(500, { start: NaN, span: 200 }), 0)
    assert.equal(progressAt(500, { start: 0, span: NaN }), 0)
    assert.equal(progressAt(500, { start: 0, span: Infinity }), 0)
    assert.equal(scrollAt(0.5, { start: NaN, span: NaN }), 0)
    assert.equal(scrollAt(NaN, metrics), metrics.start)
  })
  it('is equivalent at 60Hz and 120Hz', () => {
    let sixty = 0,
      oneTwenty = 0
    for (let i = 0; i < 30; i++) sixty = dampedStep(sixty, 1, 1 / 60)
    for (let i = 0; i < 60; i++) oneTwenty = dampedStep(oneTwenty, 1, 1 / 120)
    near(sixty, oneTwenty)
    near(dampedStep(0, 1, 1 / 60), 0.08)
  })
  it('snaps for reduced motion and settles exactly', () => {
    assert.equal(dampedStep(0.2, 0.8, 1 / 60, true), 0.8)
    assert.equal(dampedStep(0.7999999, 0.8, 1 / 60), 0.8)
  })
  it('does not jump after a long suspended frame', () =>
    near(dampedStep(0, 1, 10), dampedStep(0, 1, 0.05)))
})

describe('Canvas backing-store safety', () => {
  it('does not create a zero-sized source canvas in forced colours or hidden containers', () => {
    assert.equal(canvasSize(0, 800, 2), null)
    assert.equal(canvasSize(390, 0, 2), null)
    assert.equal(canvasSize(NaN, 800, 2), null)
    assert.equal(canvasSize(-1, 800, 2), null)
  })
  it('honours normal DPR and caps very large allocations', () => {
    assert.deepEqual(canvasSize(390, 844, 2), { ratio: 2, width: 780, height: 1688 })
    const large = canvasSize(7680, 4320, 4)!
    assert.ok(large.width * large.height <= MAX_CANVAS_PIXELS)
    assert.ok(large.ratio < 1)
  })
  it('clamps extreme dimensions and preserves a minimum one-pixel store', () => {
    const wide = canvasSize(1_000_000, 1, 2)!
    assert.equal(wide.width, 8192)
    assert.equal(wide.height, 1)
    assert.equal(canvasSize(0.1, 0.1, 1)!.width, 1)
  })
  it('handles missing or invalid pixel ratio values', () => {
    assert.equal(canvasSize(500, 500, NaN)!.ratio, 1)
    assert.equal(canvasSize(500, 500, 0)!.ratio, 1)
  })
})

function fakeDocument() {
  return {
    body: { style: { overflow: 'scroll' } },
    documentElement: { style: { overflow: 'auto', overscrollBehavior: 'contain' } },
  } as unknown as Document
}
describe('Owned reading-view scroll locks', () => {
  it('restores the exact styles that existed before opening', () => {
    const doc = fakeDocument(),
      release = lockDocumentScroll(doc)
    assert.equal(doc.body.style.overflow, 'hidden')
    assert.equal(doc.documentElement.style.overflow, 'hidden')
    release()
    assert.equal(doc.body.style.overflow, 'scroll')
    assert.equal(doc.documentElement.style.overflow, 'auto')
    assert.equal(doc.documentElement.style.overscrollBehavior, 'contain')
  })
  it('does not release another overlay’s lock', () => {
    const doc = fakeDocument(),
      first = lockDocumentScroll(doc),
      second = lockDocumentScroll(doc)
    first()
    assert.equal(doc.body.style.overflow, 'hidden')
    second()
    assert.equal(doc.body.style.overflow, 'scroll')
  })
  it('is safe to release twice and in reverse order', () => {
    const doc = fakeDocument(),
      first = lockDocumentScroll(doc),
      second = lockDocumentScroll(doc)
    second()
    second()
    assert.equal(doc.body.style.overflow, 'hidden')
    first()
    first()
    assert.equal(doc.body.style.overflow, 'scroll')
  })
})
