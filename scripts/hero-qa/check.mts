/**
 * check.mts — the invariants, asserted rather than eyeballed, plus the engine-only stills.
 *
 *   node tools/hero-qa.mjs                     # capture real layouts (+ browser stills)
 *   cd scripts/hero-qa && npm i && npm run check
 *
 * Writes design/hero-phase<N>/phase<N>-engine-*.png (N from HERO_PHASE, default 7): the
 * engine's own contribution, with no type. The composited stills come from tools/hero-qa.mjs.
 *
 * Pins the things that have broken this effect before, plus the four contracts of the phase 6
 * composition (full-bleed fan, dot → line continuum, glass on its facets, current that catches
 * the cursor):
 *
 *   1. Continuity: every strand's P(0) is the dispersion origin, exactly.
 *   2. Coverage: the fan reaches all four edges of the section, not just the right third.
 *   3. Optics: entry and exit are parametric points on the prism's facets, never free-floating.
 *   4. Interaction: strands bend toward the pointer, and never overshoot it.
 */
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHeroRay } from "../../src/components/sections/hero-ray.ts";

/** Mirrors the engine's CATCH_STANDOFF: strands wrap the cursor, they never land on it. */
const STANDOFF = 36;
import type { LayoutSnapshot } from "../../src/components/sections/hero-layout.ts";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "data");
const PHASE = process.env.HERO_PHASE ?? "7";
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

/** Engine stills are transparent by design; review them on the page's own paper. */
const composite = (
  layer: ReturnType<typeof createCanvas>,
  layout: LayoutSnapshot,
  dark: boolean,
) => {
  const out = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
  const ctx = out.getContext("2d");
  ctx.fillStyle = dark ? "#1b1815" : "#f7f4ee";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(layer, 0, 0);
  return out;
};

for (const file of files) {
  const capture = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
  const layout: LayoutSnapshot = capture.layout;
  console.log(`\n${capture.name}`);

  const ray = createHeroRay();
  ray.setTheme(capture.dark);
  ray.setLayout(layout);
  ray.settle();
  const geo = ray.geometry();

  check("every strand root === the dispersion origin (≤ 0.01px)", () => {
    for (const [i, strand] of geo.strands.entries()) {
      assert.ok(
        near(strand.root.x, geo.exit.x, 0.01) && near(strand.root.y, geo.exit.y, 0.01),
        `strand ${i} root (${strand.root.x}, ${strand.root.y}) ≠ origin (${geo.exit.x}, ${geo.exit.y})`,
      );
    }
  });

  check("envelope is 0 at both ends (root at the origin, tip finite)", () => {
    for (let k = 0; k < geo.strands.length; k++) {
      const at0 = ray.sampleStrand(k, 0);
      const at1 = ray.sampleStrand(k, 1);
      assert.ok(
        near(at0.x, geo.exit.x, 0.01) && near(at0.y, geo.exit.y, 0.01),
        `strand ${k} P(0) drifted`,
      );
      assert.ok(Number.isFinite(at1.x) && Number.isFinite(at1.y), `strand ${k} P(1) not finite`);
    }
  });

  check("fan stays in angular order (no two strands swap lanes)", () => {
    // Compare the strands' own angles: atan2 on the targets wraps at ±180°, and the sweep
    // genuinely crosses that seam on the quiet side of the fan.
    for (let k = 1; k < geo.specs.length; k++) {
      assert.ok(
        geo.specs[k].angle > geo.specs[k - 1].angle,
        `strand ${k} (${((geo.specs[k].angle * 180) / Math.PI).toFixed(1)}°) overtook strand ${
          k - 1
        }: the lanes would cross`,
      );
    }
    // …and each target really is at the end of its own strand, not of a neighbour's.
    geo.specs.forEach((strand, i) => {
      const target = geo.targets[i];
      const dx = target.x - geo.exit.x;
      const dy = target.y - geo.exit.y;
      const along = (dx * strand.dir.x + dy * strand.dir.y) / (Math.hypot(dx, dy) || 1);
      assert.ok(along > 0.995, `target ${i} is off its own lane (cos ${along.toFixed(3)})`);
    });
  });

  check("every strand leaves the frame instead of stopping inside it", () => {
    for (const [i, target] of geo.targets.entries()) {
      const outside = target.x < 0 || target.x > geo.heroW || target.y < 0 || target.y > geo.heroH;
      assert.ok(
        outside,
        `target ${i} (${target.x.toFixed(0)}, ${target.y.toFixed(0)}) is inside the frame`,
      );
    }
  });

  check("the field is full-bleed: targets reach all four edges", () => {
    const xsRel = geo.targets.map((t) => t.x / geo.heroW);
    const ysRel = geo.targets.map((t) => t.y / geo.heroH);
    const edges = {
      left: xsRel.some((x) => x < 0.02),
      right: xsRel.some((x) => x > 0.98),
      top: ysRel.some((y) => y < 0.02),
      bottom: ysRel.some((y) => y > 0.98),
    };
    assert.ok(edges.left && edges.right && edges.top && edges.bottom, JSON.stringify(edges));
  });

  check("the sweep is a fan, not a wedge", () => {
    // Desktop opens ~330°; portrait deliberately faces the empty side of the page.
    const minimum = geo.mobile ? 140 : 240;
    const span = geo.sweep.to - geo.sweep.from;
    assert.ok(span >= minimum, `sweep is only ${span}° (needs ${minimum}°)`);
  });

  check("entry and exit ride the facets (parametric, not free-floating)", () => {
    const onSegment = (
      p: { x: number; y: number },
      a: { x: number; y: number },
      b: { x: number; y: number },
      t: number,
    ) => near(p.x, a.x + (b.x - a.x) * t, 0.01) && near(p.y, a.y + (b.y - a.y) * t, 0.01);
    assert.ok(onSegment(geo.exit, geo.topV, geo.rightV, 0.56), "exit is not on the right facet");
    const t = geo.mobile ? 0.46 : 0.4;
    assert.ok(
      onSegment(geo.hit, geo.topV, geo.leftV, t),
      `entry is not on the left facet at t = ${t}`,
    );
  });

  check("the prism is an equilateral triangle built on its own centroid", () => {
    const e1 = Math.hypot(geo.rightV.x - geo.topV.x, geo.rightV.y - geo.topV.y);
    const e2 = Math.hypot(geo.leftV.x - geo.rightV.x, geo.leftV.y - geo.rightV.y);
    const e3 = Math.hypot(geo.topV.x - geo.leftV.x, geo.topV.y - geo.leftV.y);
    assert.ok(
      near(e1, e2, 0.5) && near(e2, e3, 0.5),
      `edges ${e1.toFixed(1)}/${e2.toFixed(1)}/${e3.toFixed(1)}`,
    );
    const cx = (geo.topV.x + geo.leftV.x + geo.rightV.x) / 3;
    const cy = (geo.topV.y + geo.leftV.y + geo.rightV.y) / 3;
    assert.ok(
      near(cx, geo.prismCenter.x, 0.5) && near(cy, geo.prismCenter.y, 0.5),
      "prism vertices are not centred on prismCenter",
    );
  });

  check("the origin sits on the exit facet, not beside it", () => {
    assert.ok(
      near(geo.core.x, geo.exit.x, 0.01) && near(geo.core.y, geo.exit.y, 0.01),
      "core ≠ exit",
    );
  });

  check("beam source is copy-safe and clears the facet", () => {
    assert.ok(
      geo.source.x >= 0 && geo.source.x <= layout.container.right + 0.5,
      "source off-frame",
    );
    if (geo.entryMode === "sentence") {
      const span = Math.hypot(geo.hit.x - geo.source.x, geo.hit.y - geo.source.y);
      assert.ok(span >= 90, `sentence entry span ${span.toFixed(1)}px is a stub`);
    }
  });

  check("no strand is allowed to shout over the copy", () => {
    // Ghosts carry the copy-crossing beams at a fraction of the weight; anything damped by a
    // quiet rect must still be visible, or the fan reads as cut off at the type.
    assert.ok(
      geo.specs.some((strand) => strand.ghost),
      "the field has no quiet-side strands",
    );
    for (const strand of geo.specs) {
      assert.ok(
        strand.alpha > 0.3 && strand.alpha <= 1,
        `strand ${strand.index} alpha ${strand.alpha}`,
      );
    }
  });

  check("dots resolve into a line: every lit strand ends as a continuous filament", () => {
    for (const strand of geo.specs) {
      if (strand.ghost) continue;
      const resolvesAt = 0.39 * strand.resolve;
      assert.ok(
        resolvesAt > 0.2 && resolvesAt < 0.75,
        `strand ${strand.index} resolves at ${resolvesAt.toFixed(2)} of its length`,
      );
    }
  });

  check("one prime line grows out of the dot, on the open lane", () => {
    const prime = geo.specs[geo.prime];
    assert.ok(prime, `prime index ${geo.prime} is not a strand`);
    assert.ok(
      !prime.ghost,
      "the prime line is a ghost — it has to be the loudest stroke, not the quietest",
    );
    assert.ok(prime.ribbon > 0, "the prime line is a hairline");
    // Desktop: out of the glass horizontally. Portrait: straight down the page.
    const target = ((geo.mobile ? 92 : 0) * Math.PI) / 180;
    const off = Math.abs(
      Math.atan2(Math.sin(prime.angle - target), Math.cos(prime.angle - target)),
    );
    assert.ok(
      off < (20 * Math.PI) / 180,
      `prime lane is ${((off * 180) / Math.PI).toFixed(0)}° off target`,
    );
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
      composite(canvas, layout, capture.dark).toBuffer("image/png"),
    );
  });

  check("the glass stays clear: crossings open past the rim, one ray through the body", () => {
    // The gates are computed while the buffers are filled, so a paint has to land first.
    const canvas = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    ray.paintStill(canvas.getContext("2d") as never);
    const live = ray.geometry() as typeof geo & {
      glass: { ink: number[]; gates: number[]; pad: number };
    };
    const { topV, leftV, rightV, hit, exit } = live;
    const inPrism = (x: number, y: number) => {
      const side = (p: { x: number; y: number }, q: { x: number; y: number }) =>
        (q.x - p.x) * (y - p.y) - (q.y - p.y) * (x - p.x);
      const d1 = side(topV, leftV);
      const d2 = side(leftV, rightV);
      const d3 = side(rightV, topV);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    };

    let crossings = 0;
    for (let i = 0; i < live.strands.length; i += 1) {
      const ink = live.glass.ink[i];
      const gate = live.glass.gates[i];
      assert.ok(ink >= 0 && Number.isFinite(ink), `strand ${i} has no glass measurement`);
      if (ink > live.glass.pad) {
        crossings += 1;
        assert.ok(gate > 0, `strand ${i} runs ${ink.toFixed(0)}px through the body unclipped`);
        if (gate < live.steps) {
          const buf = ray.strandBuffer(i);
          assert.ok(buf, `strand ${i} has no buffer`);
          assert.ok(
            !inPrism(buf[gate * 2], buf[gate * 2 + 1]),
            `strand ${i} still opens inside the glass`,
          );
        }
      } else {
        assert.equal(gate, 0, `strand ${i} was cut but only grazes the body`);
      }
    }
    assert.ok(crossings >= 3, `only ${crossings} lanes cross the body — the clip is not exercised`);

    // The one line that is allowed through: the incident ray, from the facet to the core.
    const px = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const lum = (x: number, y: number) => {
      const i = (y * canvas.width + x) * 4;
      return 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    };
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (let t = 0.3; t <= 0.8; t += 0.02) {
      const l = lum(
        Math.round(hit.x + (exit.x - hit.x) * t),
        Math.round(hit.y + (exit.y - hit.y) * t),
      );
      if (l < lo) lo = l;
      if (l > hi) hi = l;
    }
    assert.ok(hi - lo > 30, `the incident ray is missing (contrast ${(hi - lo).toFixed(1)})`);
  });

  check("the current catches the pointer, and never overshoots it", () => {
    const canvas = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    const ctx = canvas.getContext("2d") as never;
    const pointer = { x: geo.heroW * 0.5, y: geo.heroH * 0.78 };

    const idle = createHeroRay();
    idle.setTheme(capture.dark);
    idle.setLayout(layout);
    idle.settle();
    const before = Array.from({ length: geo.strands.length }, (_, i) =>
      Math.min(
        ...Array.from({ length: 49 }, (_, k) => {
          const p = idle.sampleStrand(i, k / 48);
          return Math.hypot(p.x - pointer.x, p.y - pointer.y);
        }),
      ),
    );

    const live = createHeroRay();
    live.setTheme(capture.dark);
    live.setLayout(layout);
    live.setPointer(pointer.x, pointer.y, true);
    for (let i = 0; i < 30; i++) live.paint(ctx, 16);

    const nearest = (index: number) => {
      const buf = live.strandBuffer(index);
      assert.ok(buf, "no buffer");
      let best = Number.POSITIVE_INFINITY;
      for (let k = 0; k <= 48; k++) {
        best = Math.min(
          best,
          Math.hypot(
            (buf as Float32Array)[k * 2] - pointer.x,
            (buf as Float32Array)[k * 2 + 1] - pointer.y,
          ),
        );
      }
      return best;
    };

    let pulled = 0;
    for (let i = 0; i < geo.strands.length; i++) {
      if (before[i] > 260) continue;
      const after = nearest(i);
      assert.ok(after < before[i] + 0.5, `strand ${i} was pushed away from the pointer`);
      const floor = Math.min(before[i], STANDOFF) - 8;
      assert.ok(after > floor, `strand ${i} was dragged onto the pointer (${after.toFixed(1)}px)`);
      if (after < before[i] - 4) pulled += 1;
    }
    assert.ok(pulled > 0, "the pointer did not move a single strand");
    assert.ok(live.geometry().interaction.pointerEase > 0.8, "pointer influence never settled in");

    // Photograph the caught frame for design review, alongside the idle still.
    writeFileSync(
      join(shotsDir, `phase${PHASE}-engine-${capture.name}-catch.png`),
      composite(canvas, layout, capture.dark).toBuffer("image/png"),
    );
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
    ? "\nAll invariants hold.\n"
    : `\n${failures} invariant${failures === 1 ? "" : "s"} failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
