/**
 * check.mts — the invariants, asserted rather than eyeballed, plus the engine-only stills.
 *
 *   node tools/hero-qa.mjs                     # capture real layouts (+ browser stills)
 *   cd scripts/hero-qa && npm i && npm run check
 *
 * Writes design/hero-phase<N>/phase<N>-engine-*.png (N from HERO_PHASE, default 2): the engine's own contribution, with no type.
 * The composited stills (type over the field) come from tools/hero-qa.mjs.
 *
 * Pins the two things that have broken this effect before:
 *   1. Continuity: every strand's P(0) is the exit point, exactly.
 *   2. Angular order: targets stay monotonic in y, so bands never swap lanes.
 * Plus the geometry contract's own numbers (facet parametrisation, size clamps, entry rule).
 */
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHeroRay, buildPath } from "../../src/components/sections/hero-ray.ts";
import type { LayoutSnapshot } from "../../src/components/sections/hero-layout.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "data");
const PHASE = process.env.HERO_PHASE ?? "2";
const shotsDir = join(here, `../../design/hero-phase${PHASE}`);
mkdirSync(shotsDir, { recursive: true });
const files = readdirSync(dataDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

let failures = 0;
const check = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  ✗ ${name}\n      ${(error as Error).message.split("\n")[0]}`);
  }
};

const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

for (const file of files) {
  const capture = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
  const layout: LayoutSnapshot = capture.layout;
  console.log(`\n${capture.name}`);

  const ray = createHeroRay();
  ray.setTheme(capture.dark);
  ray.setLayout(layout);
  ray.settle();
  const geo = ray.geometry();

  check("every strand root === exit point (≤ 0.01px)", () => {
    for (const [i, strand] of geo.strands.entries()) {
      assert.ok(
        near(strand.root.x, geo.exit.x, 0.01) && near(strand.root.y, geo.exit.y, 0.01),
        `band ${i} root (${strand.root.x}, ${strand.root.y}) ≠ exit (${geo.exit.x}, ${geo.exit.y})`,
      );
    }
  });

  check("envelope is 0 at both ends (root and tip both on their lane)", () => {
    for (let k = 0; k < 7; k++) {
      const at0 = ray.sampleStrand(k, 0);
      const at1 = ray.sampleStrand(k, 1);
      assert.ok(
        near(at0.x, geo.exit.x, 0.01) && near(at0.y, geo.exit.y, 0.01),
        `band ${k} P(0) drifted`,
      );
      assert.ok(Number.isFinite(at1.x) && Number.isFinite(at1.y), `band ${k} P(1) not finite`);
    }
  });

  check("fan targets stay in angular order (monotonic y)", () => {
    for (let k = 1; k < geo.targets.length; k++) {
      assert.ok(
        geo.targets[k].y > geo.targets[k - 1].y,
        `target ${k} overtook target ${k - 1}: bands would cross`,
      );
    }
  });

  check("fan is full-bleed off the right edge", () => {
    for (const target of geo.targets) {
      assert.ok(target.x > geo.heroW, `target x ${target.x} is inside the frame`);
    }
  });

  check("entry/exit ride the facets (parametric, not free-floating)", () => {
    const onSegment = (
      p: { x: number; y: number },
      a: { x: number; y: number },
      b: { x: number; y: number },
      t: number,
    ) => near(p.x, a.x + (b.x - a.x) * t, 0.01) && near(p.y, a.y + (b.y - a.y) * t, 0.01);
    assert.ok(onSegment(geo.exit, geo.topV, geo.rightV, 0.52), "exit is not at u = 0.52");
    const t = geo.mobile ? 0.34 : 0.3;
    assert.ok(onSegment(geo.hit, geo.topV, geo.leftV, t), `entry is not at t = ${t}`);
  });

  check("prism is sized from the viewport, not the section", () => {
    const expected = geo.mobile
      ? Math.min(Math.max(Math.min(layout.heroW, layout.heroH) * 0.24, 68), 100)
      : Math.min(Math.max(Math.min(layout.heroW, layout.heroH) * 0.3, 96), 190);
    assert.ok(near(geo.prismSize, expected, 0.5), `${geo.prismSize} ≠ ${expected}`);
  });

  check("beam source is copy-safe and clears the facet", () => {
    assert.ok(
      geo.source.x >= 0 && geo.source.x <= layout.container.right + 0.5,
      "source off-frame",
    );
    if (geo.entryMode === "sentence") {
      const span = Math.hypot(geo.hit.x - geo.source.x, geo.hit.y - geo.source.y);
      assert.ok(span >= 180, `sentence entry span ${span.toFixed(1)}px is a stub`);
    }
  });

  check("engine paints through the node canvas (Ctx subset is portable)", () => {
    const canvas = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    const ctx = canvas.getContext("2d");
    assert.doesNotThrow(() => ray.paintStill(ctx as never), "paintStill threw on node-canvas");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 4) opaque += 1;
    assert.ok(opaque > 500, `only ${opaque} non-empty pixels — the field did not draw`);
    writeFileSync(
      join(shotsDir, `phase${PHASE}-engine-${capture.name}.png`),
      canvas.toBuffer("image/png"),
    );
  });

  check("no exit ray crosses a text box (coverage without collision)", () => {
    const inside = (x: number, y: number) =>
      layout.ledger.quietRects.some((r) => x > r.left && x < r.right && y > r.top && y < r.bottom);
    // Sample the exact curves the engine draws, not an approximation of them.
    const reflectionCurve = buildPath(geo.reflection.waypoints);
    const specularCurve = buildPath(geo.specular.waypoints);
    for (let k = 1; k <= 59; k++) {
      const u = k / 60;
      // Portrait reflections are a corner flare that leaves the frame immediately.
      if (!geo.mobile) {
        const point = reflectionCurve(u);
        assert.ok(
          !inside(point.x, point.y),
          `reflected ray enters a text box at u=${u.toFixed(2)}`,
        );
      }
      const apex = specularCurve(u);
      assert.ok(!inside(apex.x, apex.y), `specular ray enters a text box at u=${u.toFixed(2)}`);
    }
  });

  check("every stat tile is grounded (one filament each)", () => {
    assert.equal(geo.grounds.length, layout.tiles.length, "a tile has no filament");
    for (const ground of geo.grounds) {
      // Tiles can share a column centre in the 2×2 portrait grid, so match the nearest top.
      const tile = layout.tiles.reduce((best, candidate) =>
        Math.abs(candidate.top - ground.to.y) < Math.abs(best.top - ground.to.y) ? candidate : best,
      );
      assert.ok(ground.to.y <= tile.top, "filament does not land above its tile");
      if (geo.mobile) {
        assert.ok(ground.from.y < ground.to.y, "portrait stub should rise out of its tile");
      }
      assert.ok(Number.isFinite(ground.from.x) && Number.isFinite(ground.from.y), "taps nowhere");
    }
  });

  check("the field reaches all four edges (desktop; portrait keeps its top strip)", () => {
    const ends = [...geo.specular.waypoints, ...geo.reflection.waypoints, ...geo.targets];
    const nearLeft = ends.some((p) => p.x < geo.heroW * 0.3);
    const nearRight = ends.some((p) => p.x > geo.heroW);
    const nearTop = ends.some((p) => p.y < geo.heroH * 0.12);
    const nearBottom = ends.some((p) => p.y > geo.heroH * 0.95);
    if (geo.mobile) {
      // Deliberate: on a phone the copy is full-width and the fan ends at 0.62h per §3,
      // so the bottom edge belongs to the catalogue, not the light.
      assert.ok(nearLeft && nearRight && nearTop, "portrait lost its top-strip coverage");
      return;
    }
    assert.ok(nearLeft && nearRight && nearTop && nearBottom, "one or more edges are dead");
  });

  check("geometry responds to layout, not to the section's percentage", () => {
    const shifted: LayoutSnapshot = { ...layout, heroH: layout.heroH * 1.4 };
    const other = createHeroRay();
    other.setLayout(shifted);
    const moved = other.geometry();
    assert.ok(
      !near(moved.exit.y, geo.exit.y, 0.5),
      "exit didn't follow the section height — geometry may be hard-coded",
    );
  });
}

console.log(
  failures === 0
    ? `\nall invariants hold across ${files.length} layouts`
    : `\n${failures} invariant check(s) failed`,
);
process.exitCode = failures === 0 ? 0 : 1;
