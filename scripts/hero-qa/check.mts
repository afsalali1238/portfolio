/**
 * check.mts — the invariants, asserted rather than eyeballed, plus the engine-only stills.
 *
 *   node tools/hero-qa.mjs                     # capture real layouts (+ browser stills)
 *   cd scripts/hero-qa && npm i && npm run check
 *   npm run compose                            # the same layouts, composed with the page's type
 *   npm run bench                              # what a frame costs, headlessly
 *
 * Writes design/hero-phase<N>/phase<N>-engine-*.png (N from HERO_PHASE, default 7): the
 * engine's own contribution, with no type. The composited stills come from compose.mts (or,
 * with a browser, tools/hero-qa.mjs).
 *
 * Pins the things that have broken this effect before, plus the contracts of the current
 * composition:
 *
 *   1. Continuity: every strand's P(0) is the dispersion origin, exactly.
 *   2. Coverage: the fan reaches all four edges of the section.
 *   3. Optics: the resting ray is a real refraction (or TIR then refraction), entry and exit are
 *      parametrised on the facets the trace names, and the source is outside the entry plane.
 *   4. Composition: the beam enters at the frame edge, crosses a headline line, and is painted
 *      *before* the dissolve while everything crisp around the glass is painted after it.
 *   5. The wave: the illustrated ripple is visible, bounded by its envelope, and exactly zero at
 *      both ends, so it lands on the hinge the tracer computed.
 *   6. Interaction: strands bend toward the pointer and never overshoot it; inside the glass the
 *      catch releases and the fan follows the traced exit.
 */
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BANDS, createHeroRay, tracePrism } from "../../src/components/sections/hero-ray.ts";

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

  check("entry and exit ride the facets the trace names (parametric, not free-floating)", () => {
    const onSegment = (
      p: { x: number; y: number },
      a: { x: number; y: number },
      b: { x: number; y: number },
      t: number,
    ) => near(p.x, a.x + (b.x - a.x) * t, 0.01) && near(p.y, a.y + (b.y - a.y) * t, 0.01);
    assert.ok(
      onSegment(geo.hit, geo.topV, geo.leftV, geo.entryU),
      `entry is not on the left facet at u = ${geo.entryU}`,
    );
    // The exit is wherever refraction (or TIR then refraction) actually put it — so it is
    // checked against the facet the trace names, not against a hard-coded corner.
    const facets = {
      left: [geo.topV, geo.leftV] as const,
      base: [geo.leftV, geo.rightV] as const,
      right: [geo.rightV, geo.topV] as const,
    };
    const facet = facets[geo.restOptics.exitFacet as keyof typeof facets];
    assert.ok(facet, `the resting ray never leaves the glass (facet "${geo.restOptics.exitFacet}")`);
    const [a, b] = facet;
    const edgeLength = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const t = ((geo.exit.x - a.x) * (b.x - a.x) + (geo.exit.y - a.y) * (b.y - a.y)) / edgeLength ** 2;
    assert.ok(t >= -1e-6 && t <= 1 + 1e-6, `exit parameter ${t.toFixed(2)} is past the facet ends`);
    assert.ok(onSegment(geo.exit, a, b, t), "exit is not on the facet the trace names");
    assert.ok(
      near(geo.exit.x, geo.restOptics.exit.x, 0.01) &&
        near(geo.exit.y, geo.restOptics.exit.y, 0.01),
      "the dispersion origin is not the traced exit",
    );
  });

  check("the resting ray is a real refraction, not a composed chord", () => {
    const traced = geo.restOptics;
    assert.ok(traced.legs.length >= 1, "the resting ray has no internal leg");
    // Snell, on the resting trace.
    assert.ok(
      near(Math.sin(traced.theta1), 1.5 * Math.sin(traced.theta2), 1e-6),
      "Snell's law fails on the resting ray",
    );
    // The drawn internal leg has to obey it too: compare the first leg's direction with the
    // refracted direction the trace computed from the incident axis.
    const leg = traced.legs[0];
    const dx = leg.to.x - leg.from.x;
    const dy = leg.to.y - leg.from.y;
    const length = Math.hypot(dx, dy) || 1;
    const facetLength = Math.hypot(geo.leftV.x - geo.topV.x, geo.leftV.y - geo.topV.y) || 1;
    const tx = (geo.leftV.x - geo.topV.x) / facetLength;
    const ty = (geo.leftV.y - geo.topV.y) / facetLength;
    assert.ok(
      near(Math.abs((dx * tx + dy * ty) / length), Math.sin(traced.theta2), 1e-6),
      "the drawn resting leg does not obey Snell",
    );
    // …and if the resting geometry does reflect internally, it must not emit from the
    // reflecting facet. This is measured, not assumed: it is a property of the entry angle.
    if (traced.tir) {
      assert.notEqual(
        traced.exitFacet,
        traced.firstFacet,
        "the resting fan leaves the totally reflecting facet",
      );
    }
  });

  check("the glass is whole and centre-right, sized to the room it has", () => {
    // The prism is the right-hand anchor of a left-aligned composition. Three things have to
    // be true together, and they are what the "put the triangle centre-right" note asked for:
    //   1. no vertex is clipped by the frame;
    //   2. the body sits in the centre-right band of the *content column*, not of the viewport;
    //   3. when the copy leaves it a narrow slot (one-column layouts below `lg`), the glass
    //      shrinks to fit rather than crowding or clipping the right edge.
    const inside =
      geo.leftV.x >= 0 &&
      geo.rightV.x <= geo.heroW + 0.5 &&
      geo.topV.y >= 0 &&
      geo.rightV.y <= geo.heroH + 0.5;
    assert.ok(
      inside,
      `glass is clipped: left ${geo.leftV.x.toFixed(0)}, right ${geo.rightV.x.toFixed(0)} of ${geo.heroW}, apex ${geo.topV.y.toFixed(0)}`,
    );
    // The triangle's half-width is exactly size / 2, so this also checks that the size really
    // is what the frames show.
    assert.ok(
      near(geo.rightV.x - geo.topV.x, geo.prismSize / 2, 0.5),
      "the prism's half-width does not match its size",
    );
    const column = layout.container.right - layout.container.left;
    const relative = (geo.prismCenter.x - layout.container.left) / (column || 1);
    if (geo.mobile) {
      // Portrait: the glass hangs in the top-right corner of a full-width column.
      assert.ok(relative > 0.6, `portrait glass is not in the right corner (${relative.toFixed(2)})`);
    } else {
      assert.ok(
        relative >= 0.55 && relative <= 0.88,
        `glass sits at ${(relative * 100).toFixed(0)}% of the column, not centre-right`,
      );
    }
  });

  check("the source is outside the entry plane, at the frame edge", () => {
    // Outer side of the left facet: the prism's centroid is inside, the source must not be.
    const fx = geo.leftV.x - geo.topV.x;
    const fy = geo.leftV.y - geo.topV.y;
    const side = (p: { x: number; y: number }) =>
      Math.sign((fx) * (p.y - geo.topV.y) - fy * (p.x - geo.topV.x));
    assert.notEqual(side(geo.source), side(geo.prismCenter), "source is behind the entry plane");
    const span = Math.hypot(geo.hit.x - geo.source.x, geo.hit.y - geo.source.y);
    assert.ok(span >= 240, `incident span ${span.toFixed(1)}px is a stub`);
    // The light enters at the frame boundary, not in the middle of the picture: that is what
    // separates a beam from a decorative leader line. It leaves through the left edge on the
    // captured layouts, and through the top edge when the frame is wider than the run is long.
    assert.ok(
      geo.source.x <= 0.5 || geo.source.y <= 0.5,
      `source (${geo.source.x.toFixed(1)}, ${geo.source.y.toFixed(1)}) is inside the frame`,
    );
    assert.ok(
      geo.source.y >= -0.5 && geo.source.y <= geo.heroH + 0.5,
      "source left the frame vertically",
    );
  });

  check("the beam crosses the headline, and the type stays above it", () => {
    // The optical axis must pass through a display line — the point of the pass.
    const crosses = (rect: { left: number; top: number; right: number; bottom: number }) => {
      for (let i = 0; i <= 200; i++) {
        const s = i / 200;
        const p = ray.beamAxisAt(s);
        if (p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom)
          return true;
      }
      return false;
    };
    const displayLines = layout.textRects.slice(0, 2);
    assert.ok(
      displayLines.some(crosses),
      "the beam does not cross the headline: it is still a leader line",
    );

    // Layering, as a contract: the beam is painted before the dissolve (so type stencils thin
    // it where it passes behind a word) and the glass is painted after it.
    const layers = (geo as unknown as { layers: readonly string[] }).layers;
    const at = (name: string) => layers.indexOf(name);
    assert.ok(at("beam") >= 0 && at("dissolve") > at("beam"), "the beam is not behind the type");
    assert.ok(at("glass") > at("dissolve"), "the glass is thinned by the dissolve");
    // …and the HTML text really is above the canvas: the shell paints at z-0, the copy at z-10.
    const heroSource = readFileSync(join(here, "../../src/components/sections/Hero.tsx"), "utf8");
    assert.ok(
      /<HeroPrism[^>]*className="[^"]*z-0/.test(heroSource),
      "the canvas is not behind the content (HeroPrism is not z-0)",
    );
    assert.ok(
      /<Container[^>]*className="[^"]*z-10/.test(heroSource),
      "the content is not above the canvas (Container is not z-10)",
    );
  });

  check("everything painted over the type is clear of it", () => {
    // Order is: beam → dissolve → glass/core/colour. The dissolve stencils are paper-coloured
    // and radial, so whatever is painted *after* it must not overlap type — otherwise the
    // stencil would be painted over by a crisp facet and the word behind it would lose its
    // contrast. That is checked here on the geometry, not on pixels: a dark-theme hairline and
    // the plate grain have comparable amplitude, so a pixel diff would prove nothing.
    const rects = [
      ...layout.textRects.map((r) => ({ name: "type", ...r })),
      ...layout.tiles.map((tile) => ({
        name: "tile",
        left: tile.x,
        right: tile.x + tile.width,
        top: tile.top,
        bottom: tile.bottom,
      })),
    ];
    const pad = 4;
    const inside = (p: { x: number; y: number }) =>
      rects.find(
        (r) =>
          p.x > r.left - pad && p.x < r.right + pad && p.y > r.top - pad && p.y < r.bottom + pad,
      )?.name;
    const probes: { what: string; p: { x: number; y: number } }[] = [];
    for (const vertex of [geo.topV, geo.leftV, geo.rightV, geo.hit, geo.exit]) {
      probes.push({ what: "prism", p: vertex });
    }
    for (const leg of geo.restOptics.legs) {
      for (let i = 0; i <= 40; i++) {
        const f = i / 40;
        probes.push({
          what: `refracted leg (${leg.facet})`,
          p: { x: leg.from.x + (leg.to.x - leg.from.x) * f, y: leg.from.y + (leg.to.y - leg.from.y) * f },
        });
      }
    }
    for (const probe of probes) {
      assert.ok(
        !inside(probe.p),
        `${probe.what} at (${probe.p.x.toFixed(0)}, ${probe.p.y.toFixed(0)}) lands on ${
          inside(probe.p) ?? "type"
        } and is painted over the dissolve`,
      );
    }
    // The incident beam, by contrast, is *meant* to cross the headline.
    const beamCrosses = Array.from({ length: 200 }, (_, i) => inside(ray.beamAxisAt(i / 200)));
    assert.ok(beamCrosses.some(Boolean), "the beam no longer crosses any type box");
  });

  check("the illustrated field is wavy, bounded, and lands exactly on the hinge", () => {
    // The ripple is an illustration of the electromagnetic field around a straight optical
    // axis (see hero-ray.ts). Three properties make it safe to draw at page scale:
    //   1. it is exactly zero at both ends — it cannot detach the beam from its source, and it
    //      cannot tug the beam off the hinge the ray tracer computed;
    //   2. it is visible: a wavy line nobody can see is a straight line;
    //   3. it is bounded by its amplitude, so it can never wander into the copy as a scribble.
    const start = ray.sampleBeam(0);
    assert.ok(near(start.offset, 0, 1e-9), `ripple is ${start.offset} at the source`);
    const end = ray.sampleBeam(1);
    assert.ok(near(end.offset, 0, 1e-9), `ripple is ${end.offset} at the facet`);
    assert.ok(
      near(end.x, geo.hit.x, 0.01) && near(end.y, geo.hit.y, 0.01),
      "the illustrated beam does not end on the live entry point",
    );
    const amplitude = geo.interaction.beam.amplitude;
    let peak = 0;
    for (let i = 1; i < 200; i++) {
      const p = ray.sampleBeam(i / 200);
      peak = Math.max(peak, Math.abs(p.offset));
      assert.ok(Math.abs(p.offset) <= amplitude * 1.02, `ripple ${p.offset} exceeds its envelope`);
    }
    assert.ok(
      peak >= amplitude * 0.6,
      `peak ripple ${peak.toFixed(1)}px of a ${amplitude.toFixed(1)}px envelope: the wave is not visible`,
    );
    // A hairline nobody can see is what the previous pass shipped: 0.4 px. Below ~6 px on a
    // desktop the crest is indistinguishable from the beam's own bloom.
    assert.ok(
      amplitude >= (geo.mobile ? 4 : 6),
      `ripple amplitude ${amplitude.toFixed(1)}px is not visible`,
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

  check("no strand is allowed to shout over the copy", () => {
    // Ghosts carry the copy-crossing beams at a fraction of the weight; anything damped by a
    // quiet rect must still be visible, or the fan reads as cut off at the type.
    assert.ok(
      geo.specs.some((strand) => strand.ghost),
      "the field has no quiet-side strands",
    );
    for (const strand of geo.specs) {
      assert.ok(
        strand.alpha > 0 && strand.alpha <= 1,
        `strand ${strand.index} alpha ${strand.alpha}`,
      );
      if (strand.dir.x < -0.15)
        assert.ok(strand.alpha <= 0.12, `left-side strand ${strand.index} is too bright`);
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

    // The one line that is allowed through: the refracted ray. It is sampled along the legs the
    // trace actually returned — not along the straight chord from entry to exit, which is only
    // the same line when nothing reflects. The bright stroke has to be *on the path*, so its
    // luminance must beat the glass around it at every step.
    const px = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    const lum = (x: number, y: number) => {
      const i = (y * canvas.width + x) * 4;
      return 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    };
    const legs = live.restOptics.legs;
    assert.ok(legs.length >= 1, "the resting ray has no internal leg");
    let lo = Number.POSITIVE_INFINITY;
    let hi = Number.NEGATIVE_INFINITY;
    for (const leg of legs) {
      for (let t = 0.25; t <= 0.8; t += 0.02) {
        const x = Math.round(leg.from.x + (leg.to.x - leg.from.x) * t);
        const y = Math.round(leg.from.y + (leg.to.y - leg.from.y) * t);
        const l = lum(x, y);
        if (l < lo) lo = l;
        if (l > hi) hi = l;
      }
    }
    assert.ok(hi - lo > 30, `the refracted ray is missing (contrast ${(hi - lo).toFixed(1)})`);
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

  check("one light enters: the incident beam outweighs every left lane", () => {
    const beam = geo.interaction.beam;
    for (const strand of geo.specs.filter((item) => item.dir.x < -0.15)) {
      const band = BANDS[strand.band];
      const laneInk =
        strand.alpha * Math.max(band.lightAlpha, band.darkAlpha) * 1.4 * strand.width * 1.5;
      assert.ok(beam.alpha * beam.width >= 4 * laneInk, `left lane ${strand.index} competes`);
    }
  });

  check("inside glass bends toward the normal at three pointer depths", () => {
    const canvas = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    const live = createHeroRay();
    live.setLayout(layout);
    const facet = { x: (geo.topV.x + geo.leftV.x) / 2, y: (geo.topV.y + geo.leftV.y) / 2 };
    for (const depth of [0.3, 0.6, 0.9]) {
      live.setPointer(
        facet.x + (geo.prismCenter.x - facet.x) * depth,
        facet.y + (geo.prismCenter.y - facet.y) * depth,
        true,
      );
      for (let i = 0; i < 120; i++) live.paint(canvas.getContext("2d") as never, 16);
      const state = live.geometry().interaction;
      assert.ok(state.optics && state.optics.legs.length, "missing internal ray");
      const optics = state.optics!;
      assert.ok(
        near(Math.sin(optics.theta1), 1.5 * Math.sin(optics.theta2), 1e-6),
        "Snell's law failed",
      );
      assert.ok(optics.theta2 <= optics.theta1 + 1e-8, "ray bent away from normal");
      assert.equal(
        optics.legs[0].tir,
        optics.firstAngle > optics.critical,
        "critical angle ignored",
      );
      assert.ok(state.pointerInGlass > 0.99, "glass mode did not settle");
      const leg = optics.legs[0];
      const dx = leg.to.x - leg.from.x,
        dy = leg.to.y - leg.from.y;
      const length = Math.hypot(dx, dy);
      const facetLength = Math.hypot(geo.leftV.x - geo.topV.x, geo.leftV.y - geo.topV.y);
      const tx = (geo.leftV.x - geo.topV.x) / facetLength;
      const ty = (geo.leftV.y - geo.topV.y) / facetLength;
      assert.ok(
        near(Math.abs((dx * tx + dy * ty) / length), Math.sin(optics.theta2), 1e-6),
        "drawn internal leg does not obey Snell",
      );
    }
  });

  check("total internal reflection follows the facet and exits elsewhere", () => {
    const entry = {
      x: geo.topV.x + (geo.leftV.x - geo.topV.x) * 0.4,
      y: geo.topV.y + (geo.leftV.y - geo.topV.y) * 0.4,
    };
    const source = { x: entry.x - Math.sqrt(3) * 100, y: entry.y - 100 };
    const traced = tracePrism(source, entry, geo.topV, geo.leftV, geo.rightV);
    assert.equal(traced.firstFacet, "right");
    assert.ok(traced.firstAngle > traced.critical && traced.tir, "TIR was not detected");
    assert.ok(traced.legs.length >= 2 && traced.legs[0].tir, "reflected leg is missing");
    assert.notEqual(traced.exitFacet, "right", "fan incorrectly exits the reflecting facet");
    const a = traced.legs[0],
      b = traced.legs[1];
    const incoming = { x: a.to.x - a.from.x, y: a.to.y - a.from.y };
    const reflected = { x: b.to.x - b.from.x, y: b.to.y - b.from.y };
    const tangent = {
      x: (geo.rightV.x - geo.topV.x) / geo.prismSize,
      y: (geo.rightV.y - geo.topV.y) / geo.prismSize,
    };
    const projection = (v: { x: number; y: number }) =>
      (v.x * tangent.x + v.y * tangent.y) / Math.hypot(v.x, v.y);
    assert.ok(near(projection(incoming), projection(reflected), 1e-6), "reflection angle is wrong");
  });

  check("the catch releases when the pointer settles inside the glass", () => {
    const canvas = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    const live = createHeroRay();
    live.setLayout(layout);
    live.setPointer(geo.prismCenter.x, geo.prismCenter.y, true);
    for (let i = 0; i < 120; i++) live.paint(canvas.getContext("2d") as never, 16);
    assert.equal(live.geometry().interaction.catches.length, 0);
  });

  check("the live fan follows the actual exit and still reaches the frame", () => {
    const canvas = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    const live = createHeroRay();
    live.setLayout(layout);
    live.setPointer(geo.prismCenter.x, geo.prismCenter.y, true);
    for (let i = 0; i < 150; i++) live.paint(canvas.getContext("2d") as never, 16);
    const state = live.geometry();
    assert.ok(state.interaction.optics?.exitFacet, "traced light has no exit");
    const exit = state.interaction.optics!.exit;
    const origin = state.interaction.fanOrigin!;
    assert.ok(
      Math.hypot(origin.x - exit.x, origin.y - exit.y) < 0.1,
      "fan is not at the traced exit",
    );
    if (state.interaction.optics!.tir && state.interaction.optics!.firstFacet === "right") {
      assert.notEqual(
        state.interaction.optics!.exitFacet,
        "right",
        "fan leaves a totally reflecting face",
      );
    }
    for (const [i, strand] of state.strands.entries()) {
      assert.ok(
        strand.tip.x <= 0 ||
          strand.tip.x >= layout.heroW ||
          strand.tip.y <= 0 ||
          strand.tip.y >= layout.heroH,
        `live strand ${i} stops inside frame`,
      );
    }
  });

  check("reduced motion paints one stable, complete still", () => {
    // The still is what a `prefers-reduced-motion` visitor sees. It must be finished (the prime
    // line fully grown, no half-drawn state), and it must be identical frame to frame: two
    // paints from the same settled engine have to be byte-identical, or the page is animating
    // behind a preference that says it should not be.
    const still = createHeroRay();
    still.setTheme(capture.dark);
    still.setLayout(layout);
    const a = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    const b = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
    still.paintStill(a.getContext("2d") as never);
    still.paintStill(b.getContext("2d") as never);
    const da = a.getContext("2d").getImageData(0, 0, a.width, a.height).data;
    const db = b.getContext("2d").getImageData(0, 0, b.width, b.height).data;
    assert.equal(da.length, db.length, "still dimensions differ between paints");
    let changed = 0;
    let painted = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (da[i + 3] > 4) painted += 1;
      if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) changed += 1;
    }
    assert.equal(changed, 0, `${changed} pixels drift between two stills: the still animates`);
    assert.ok(painted > 500, `only ${painted} painted pixels — the still is empty`);
    // The beam is part of that still.
    const axis = still.beamAxisAt(0.5);
    assert.ok(Number.isFinite(axis.x) && Number.isFinite(axis.y), "the still has no beam");
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
