/**
 * bench.mts — what a frame of the hero field actually costs, headlessly.
 *
 *   cd scripts/hero-qa && npm run bench
 *
 * Paints the engine through the same `Ctx` subset the browser uses (node-canvas), at
 * 1440×720, over the captured dark desktop layout: one composed still per frame, and a live
 * frame with the pointer parked on the field. Median and p95 over 300 frames.
 *
 * This is a relative measurement — a headless rasteriser is not a compositor — so it is meant
 * for before/after comparisons on the same machine, not as a browser budget.
 */
import { createCanvas } from "@napi-rs/canvas";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHeroRay } from "../../src/components/sections/hero-ray.ts";
import type { LayoutSnapshot } from "../../src/components/sections/hero-layout.ts";

const here = dirname(fileURLToPath(import.meta.url));
const file = process.env.HERO_LAYOUT ?? "layout-1440x780-dark.json";
if (!readdirSync(join(here, "data")).includes(file)) {
  console.error(`No such layout: ${file}`);
  process.exit(1);
}
const capture = JSON.parse(readFileSync(join(here, "data", file), "utf8"));
const layout: LayoutSnapshot = capture.layout;
const canvas = createCanvas(Math.round(layout.heroW), Math.round(layout.heroH));
const ctx = canvas.getContext("2d") as never;

const FRAMES = Number(process.env.HERO_FRAMES ?? 300);

for (const mode of ["still", "live"] as const) {
  const ray = createHeroRay();
  ray.setTheme(Boolean(capture.dark));
  ray.setLayout(layout);
  if (mode === "live") ray.setPointer(layout.heroW * 0.45, layout.heroH * 0.62, true);
  // Warm up: the first frames build the plate and the caches.
  for (let i = 0; i < 30; i++) (mode === "still" ? ray.paintStill(ctx) : ray.paint(ctx, 16));

  const samples: number[] = [];
  for (let i = 0; i < FRAMES; i++) {
    const started = performance.now();
    if (mode === "still") ray.paintStill(ctx);
    else ray.paint(ctx, 16);
    samples.push(performance.now() - started);
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  console.log(
    `${mode.padEnd(6)} ${String(layout.heroW)}×${layout.heroH}  median ${median.toFixed(2)} ms  p95 ${p95.toFixed(2)} ms`,
  );
}
