import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { createHeroRay, sourceLanding, tracePrism } from "../../src/components/sections/hero-ray";

const top = { x: 100, y: 0 };
const left = { x: 0, y: 173.205 };
const right = { x: 200, y: 173.205 };
const points = [
  [{ x: -80, y: 90 }, "left"],
  [{ x: 100, y: 260 }, "base"],
  [{ x: 280, y: 90 }, "right"],
] as const;
for (const [source, expected] of points) {
  const landing = sourceLanding(source, top, left, right);
  assert.equal(landing.facet, expected);
  assert.ok(landing.u >= 0.22 && landing.u <= 0.78);
  const trace = tracePrism(source, landing.hit, top, left, right, landing.facet);
  assert.ok(trace.legs.length > 0);
  assert.ok(trace.theta2 <= trace.theta1 + 1e-9, "light bends toward the entry normal");
}

// Sweep around corners too: the incident segment must never enter glass before its landing.
const inside = (x: number, y: number) =>
  y > 0 && y < left.y && x > 100 - y / 1.73205 && x < 100 + y / 1.73205;
for (let x = -40; x <= 240; x += 4) {
  for (let y = -40; y <= 220; y += 4) {
    if (inside(x, y)) continue;
    const landing = sourceLanding({ x, y }, top, left, right);
    const before = { x: x + (landing.hit.x - x) * 0.999, y: y + (landing.hit.y - y) * 0.999 };
    assert.ok(!inside(before.x, before.y), `beam crosses glass before entry from ${x},${y}`);
  }
}

const canvas = createCanvas(800, 600);
const ctx = canvas.getContext("2d") as never;
const ray = createHeroRay();
ray.resize(800, 600);
ray.settle();
ray.paintStill(ctx);
const still = canvas.data();
ray.placeSource(40, 300);
ray.paint(ctx, 40);
let state = ray.geometry().interaction.sourcePlacement;
assert.equal(state.pinned, false);
assert.equal(state.progress, 0);
assert.ok(state.light < 1 && state.light > 0.2);
ray.paint(ctx, 40);
state = ray.geometry().interaction.sourcePlacement;
assert.equal(state.pinned, true);
assert.equal(state.progress, 0);
assert.ok(Math.abs(state.light - 0.2) < 1e-9);
ray.paint(ctx, 170);
state = ray.geometry().interaction.sourcePlacement;
assert.equal(state.progress, 0.5);
assert.equal(state.light, 0.2);
ray.paint(ctx, 130);
assert.equal(ray.geometry().interaction.sourcePlacement.progress, 1);
ray.paint(ctx, 320);
state = ray.geometry().interaction.sourcePlacement;
assert.equal(state.light, 1);
assert.deepEqual(ray.beamAxisAt(0), { x: 40, y: 300 });
ray.setPointer(750, 200, true);
ray.paint(ctx, 100);
assert.deepEqual(ray.beamAxisAt(0), { x: 40, y: 300 }, "pointer movement cannot unpin source");

// A newer click replaces an in-flight ignition; pressing the prism releases the source.
ray.placeSource(700, 500);
ray.placeSource(650, 500);
ray.paint(ctx, 80);
assert.deepEqual(ray.beamAxisAt(0), { x: 650, y: 500 });
const center = ray.geometry().prismCenter;
ray.placeSource(center.x, center.y);
ray.paint(ctx, 80);
assert.equal(ray.geometry().interaction.sourcePlacement.pinned, false);
ray.placeSource(60, 350);
ray.resetSource();
ray.paint(ctx, 80);
assert.equal(ray.geometry().interaction.sourcePlacement.pinned, false);

ray.placeSource(40, 300);
ray.paint(ctx, 200);
const stillCanvas = createCanvas(800, 600);
ray.paintStill(stillCanvas.getContext("2d") as never);
assert.equal(ray.geometry().interaction.sourcePlacement.pinned, false);
assert.deepEqual(stillCanvas.data(), still, "still frame must not retain a clicked source");

// Reused-canvas still reproducibility: painting still on the SAME canvas after live interaction
// must match the baseline still byte-for-byte.
ray.placeSource(120, 420);
ray.setPointer(center.x, center.y, true);
ray.addSurge(400, 300);
for (let i = 0; i < 30; i++) ray.paint(ctx, 16);
ray.paintStill(ctx);
assert.deepEqual(
  canvas.data(),
  still,
  "reused canvas paintStill must match baseline byte-for-byte",
);

// Rapid repeat clicks across all three facets at mid-animation checkpoints:
for (const [clickPt, waitBeforeNext] of [
  [{ x: 40, y: 260 }, 20], // during fade-out (0..80 ms)
  [{ x: 420, y: 540 }, 95], // during hush (80..120 ms)
  [{ x: 740, y: 260 }, 210], // during beam launch (120..380 ms)
  [{ x: 60, y: 310 }, 520], // during fan re-illumination (380..620 ms)
] as const) {
  ray.placeSource(clickPt.x, clickPt.y);
  ray.paint(ctx, waitBeforeNext);
}
ray.paint(ctx, 200);
assert.equal(ray.geometry().interaction.sourcePlacement.pinned, true);
assert.deepEqual(ray.beamAxisAt(0), { x: 60, y: 310 });

// Keyboard / assistive presets cycle left -> base -> right -> reset cleanly:
for (const preset of ["left", "base", "right"] as const) {
  ray.aimSourcePreset(preset);
  assert.equal(ray.isSourcePinned(), true);
  ray.paint(ctx, 120);
  const g = ray.geometry();
  const landing = sourceLanding(ray.beamAxisAt(0), g.topV, g.leftV, g.rightV);
  assert.equal(landing.facet, preset, `preset ${preset} landed on ${landing.facet}`);
}
ray.aimSourcePreset("reset");
ray.paint(ctx, 120);
assert.equal(ray.isSourcePinned(), false);
assert.equal(ray.geometry().interaction.sourcePlacement.pinned, false);

// Scroll overlap policy: a source placed just above the prism is gracefully released if scroll
// lifts the prism over that point, never leaving a degenerate enclosed source.
{
  const g0 = ray.geometry();
  const aboveX = g0.prismCenter.x;
  const aboveY = Math.max(16, g0.topV.y - Math.min(40, g0.scrollBand.up * 0.6));
  if (g0.scrollBand.up > 24) {
    ray.placeSource(aboveX, aboveY);
    ray.paint(ctx, 120);
    assert.equal(ray.geometry().interaction.sourcePlacement.pinned, true);
    ray.setScroll(1);
    for (let i = 0; i < 90; i++) ray.paint(ctx, 16);
    assert.equal(
      ray.geometry().interaction.sourcePlacement.pinned,
      false,
      "scroll enclosure must gracefully release pinned source",
    );
    const axis = ray.beamAxisAt(0.5);
    assert.ok(Number.isFinite(axis.x) && Number.isFinite(axis.y));
    ray.setScroll(0);
    for (let i = 0; i < 90; i++) ray.paint(ctx, 16);
  }
}

// Resize policy: a pinned source that falls outside a narrower resized stage or inside the
// resized prism is cleanly released back to the resting ray.
ray.placeSource(740, 300);
ray.paint(ctx, 120);
assert.equal(ray.geometry().interaction.sourcePlacement.pinned, true);
ray.resize(500, 420);
ray.paint(ctx, 16);
assert.equal(
  ray.geometry().interaction.sourcePlacement.pinned,
  false,
  "out-of-bounds source after resize must release",
);

const gSmall = ray.geometry();
ray.resize(800, 600);
ray.placeSource(gSmall.prismCenter.x, gSmall.prismCenter.y);
ray.paint(ctx, 120);
ray.resize(500, 420);
ray.paint(ctx, 16);
assert.equal(
  ray.geometry().interaction.sourcePlacement.pinned,
  false,
  "source enclosed by resized prism must release",
);

console.log(
  "Source placement, facet tracing, choreography, interruption, overlap release and still-frame checks pass.",
);
