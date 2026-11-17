import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

/* ------------------------------------------- opposite-side dispersion regressions */

const here = dirname(fileURLToPath(import.meta.url));
const desktopLayout = JSON.parse(readFileSync(join(here, "data/layout-1440x780.json"), "utf8"))
  .layout as import("../../src/components/sections/hero-layout").LayoutSnapshot;

const makeRay = (dark: boolean, desktop: boolean) => {
  const ray = createHeroRay();
  ray.setTheme(dark);
  if (desktop) ray.setLayout(desktopLayout);
  else ray.resize(800, 600);
  return ray;
};

const exitOutwardFor = (g: ReturnType<ReturnType<typeof createHeroRay>["geometry"]>) => {
  const facet = g.interaction.optics?.exitFacet;
  const a = facet === "left" ? g.topV : facet === "base" ? g.leftV : g.rightV;
  const b = facet === "left" ? g.leftV : facet === "base" ? g.rightV : g.topV;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
};

for (const desktop of [false, true]) {
  const w = desktop ? desktopLayout.heroW : 800;
  const h = desktop ? desktopLayout.heroH : 600;
  const x = desktop ? 1300 : 740;
  const elevations = desktop ? [155, 290, 460] : [110, 290, 460];
  for (const dark of [false, true]) {
    for (const y of elevations) {
      const ray = makeRay(dark, desktop);
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext("2d") as never;
      // Empty plate at the same scene clock as the pinned frame below.
      ray.paintStill(ctx);
      ray.paint(ctx, 700);
      const empty = canvas.getContext("2d").getImageData(0, 0, w, h).data;

      ray.placeSource(x, y);
      ray.paint(ctx, 700);
      const g = ray.geometry();
      const state = g.interaction;
      const label = `${desktop ? "1440" : "800"} ${dark ? "dark" : "light"} right(${x},${y})`;
      assert.equal(state.sourcePlacement.pinned, true, `${label}: source did not pin`);
      assert.equal(state.sourcePlacement.light, 1, `${label}: fan did not re-illuminate`);
      assert.equal(state.sourcePlacement.facet, "right", `${label}: wrong entry facet`);
      assert.equal(state.optics?.exitFacet, "left", `${label}: did not exit opposite side`);
      assert.ok((state.optics?.exitDirection.x ?? 0) < -0.5, `${label}: exit is not leftward`);

      const prime = g.strands[g.prime];
      assert.ok(prime.tip.x < prime.root.x - 200, `${label}: prime fan still points right`);
      const outward = exitOutwardFor(g);
      let closedBackwardLanes = 0;
      for (const [i, strand] of g.strands.entries()) {
        const dx = strand.tip.x - strand.root.x;
        const dy = strand.tip.y - strand.root.y;
        const len = Math.hypot(dx, dy) || 1;
        if ((dx * outward.x + dy * outward.y) / len < -0.12) {
          closedBackwardLanes += 1;
          assert.equal(g.glass.gates[i], g.steps, `${label}: backward lane ${i} reopened`);
        }
      }
      assert.ok(closedBackwardLanes > 0, `${label}: exterior gate was not exercised`);

      // The left exit corridor must carry real pigment, not a transparent cached gradient.
      const live = canvas.getContext("2d").getImageData(0, 0, w, h).data;
      let maxDelta = 0;
      for (let t = 0.1; t < 1; t += 0.02) {
        const px = prime.root.x + (prime.tip.x - prime.root.x) * t;
        const py = prime.root.y + (prime.tip.y - prime.root.y) * t;
        for (let oy = -12; oy <= 12; oy += 3) {
          for (let ox = -12; ox <= 12; ox += 3) {
            const sx = Math.round(px + ox);
            const sy = Math.round(py + oy);
            if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
            const at = (sy * w + sx) * 4;
            for (let c = 0; c < 3; c++)
              maxDelta = Math.max(maxDelta, Math.abs(empty[at + c] - live[at + c]));
          }
        }
      }
      assert.ok(maxDelta > 20, `${label}: left corridor is empty (maxDelta=${maxDelta})`);
    }
  }

  // The high-right Dove window must not collapse back to a base exit between samples.
  const ray = makeRay(false, desktop);
  const g = ray.geometry();
  for (let y = 80; y <= 300; y += 10) {
    const source = { x, y };
    const landing = sourceLanding(source, g.topV, g.leftV, g.rightV);
    const traced = tracePrism(source, landing.hit, g.topV, g.leftV, g.rightV, landing.facet);
    assert.equal(landing.facet, "right", `high-right y=${y}: wrong entry`);
    assert.equal(traced.exitFacet, "left", `high-right y=${y}: lost opposite exit`);
    assert.ok(traced.exitDirection.x < -0.5, `high-right y=${y}: exit turned backward`);
  }
}

// Cauchy order is a physical invariant, not a rotation convention: violet is lower on
// both horizontal Newton passes. Dove TIR cancels angular spread but keeps lateral spread.
{
  const ray = makeRay(false, false);
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d") as never;
  for (const [source, entry, exit, chirality] of [
    [{ x: 60, y: 420 }, "left", "right", 1],
    [{ x: 740, y: 420 }, "right", "left", -1],
  ] as const) {
    ray.placeSource(source.x, source.y);
    ray.paint(ctx, 700);
    const state = ray.geometry().interaction;
    assert.equal(state.sourcePlacement.facet, entry);
    assert.equal(state.optics?.exitFacet, exit);
    assert.equal(state.optics?.legs.length, 1, "Newton regression must be a single pass");
    assert.equal(state.optics?.tir, false);
    assert.equal(state.fanChirality, chirality);
    const rays = state.spectralRays;
    assert.equal(rays.length, 7);
    const red = rays.find((r) => r.band === 0)!;
    const violet = rays.find((r) => r.band === 6)!;
    assert.ok(violet.direction.y > red.direction.y, "violet inverted above red");
    assert.ok(violet.to.y - violet.from.y > red.to.y - red.from.y, "violet tip is not lower");
  }
  for (const [source, exit] of [
    [{ x: 60, y: 110 }, "right"],
    [{ x: 740, y: 110 }, "left"],
  ] as const) {
    ray.placeSource(source.x, source.y);
    ray.paint(ctx, 700);
    const state = ray.geometry().interaction;
    assert.equal(state.optics?.exitFacet, exit);
    assert.equal(state.optics?.legs.length, 2);
    assert.equal(state.optics?.legs[0].tir, true);
    const rays = state.spectralRays;
    assert.equal(rays.length, 7);
    const red = rays.find((r) => r.band === 0)!;
    const violet = rays.find((r) => r.band === 6)!;
    const angularSpread = Math.abs(
      Math.atan2(violet.direction.y, violet.direction.x) -
        Math.atan2(red.direction.y, red.direction.x),
    );
    assert.ok(angularSpread < 1e-6, "Dove TIR should cancel angular dispersion");
    assert.ok(violet.from.y > red.from.y, "Dove lateral dispersion moved violet away from base");
  }
}

// Every assistive preset must produce a real exit and a prime strand aligned with it.
{
  const ray = makeRay(false, false);
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext("2d") as never;
  for (const preset of ["left", "base", "right"] as const) {
    ray.aimSourcePreset(preset);
    ray.paint(ctx, 700);
    const g = ray.geometry();
    const optics = g.interaction.optics!;
    assert.ok(optics.exitFacet, `preset ${preset} stalled inside the glass`);
    const prime = g.strands[g.prime];
    const dx = prime.tip.x - prime.root.x;
    const dy = prime.tip.y - prime.root.y;
    const len = Math.hypot(dx, dy) || 1;
    const gap = Math.hypot(dx / len - optics.exitDirection.x, dy / len - optics.exitDirection.y);
    assert.ok(gap < 0.25, `preset ${preset}: prime is ${gap.toFixed(3)} away from the exit axis`);
  }
}

console.log(
  "Source placement, facet tracing, choreography, interruption, overlap release and still-frame checks pass.",
);
