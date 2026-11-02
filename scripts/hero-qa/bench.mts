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
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHeroRay, type Ctx } from "../../src/components/sections/hero-ray.ts";
import type { LayoutSnapshot } from "../../src/components/sections/hero-layout.ts";

const here = dirname(fileURLToPath(import.meta.url));
const files = process.env.HERO_LAYOUT
  ? [process.env.HERO_LAYOUT]
  : ["layout-1440x780-dark.json", "layout-390x820.json"];
const available = readdirSync(join(here, "data"));
const FRAMES = Number(process.env.HERO_FRAMES ?? 300);

for (const file of files) {
  if (!available.includes(file)) {
    console.error(`No such layout: ${file}`);
    process.exit(1);
  }
  const capture = JSON.parse(readFileSync(join(here, "data", file), "utf8"));
  const layout: LayoutSnapshot = capture.layout;
  const W = Math.round(layout.heroW);
  const H = Math.round(layout.heroH);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d") as unknown as Ctx;

  for (const mode of ["still", "live", "scroll", "ignite"] as const) {
    let plateSurface: ReturnType<typeof createCanvas> | undefined;
    const ray = createHeroRay({
      createSurface: (width, height) => {
        const s = plateSurface ?? createCanvas(Math.max(1, width), Math.max(1, height));
        plateSurface = s;
        if (s.width !== width || s.height !== height) {
          s.width = Math.max(1, width);
          s.height = Math.max(1, height);
        }
        const sCtx = s.getContext("2d") as unknown as SKRSContext2D;
        sCtx.clearRect(0, 0, s.width, s.height);
        return { ctx: sCtx as unknown as Ctx, width, height, image: s as unknown };
      },
    });
    ray.setTheme(Boolean(capture.dark));
    ray.setLayout(layout);
    if (mode === "live") ray.setPointer(layout.heroW * 0.45, layout.heroH * 0.62, true);
    if (mode === "scroll") ray.setScroll(0.55);
    // Warm up: the first frames build the offscreen plate and steady-state caches.
    for (let i = 0; i < 30; i++) mode === "still" ? ray.paintStill(ctx) : ray.paint(ctx, 16);

    const samples: number[] = [];
    for (let i = 0; i < FRAMES; i++) {
      if (mode === "scroll") ray.setScroll(0.5 + 0.45 * Math.sin(i * 0.04));
      if (mode === "ignite" && i % 45 === 0) {
        ray.placeSource(W * (0.12 + 0.7 * ((i / 45) % 2)), H * 0.58);
        ray.addSurge(W * 0.55, H * 0.48);
      }
      const started = performance.now();
      if (mode === "still") ray.paintStill(ctx);
      else ray.paint(ctx, 16);
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    console.log(
      `${mode.padEnd(7)} ${String(W).padStart(4)}×${String(H).padEnd(4)}  median ${median.toFixed(2)} ms  p95 ${p95.toFixed(2)} ms`,
    );
  }
}
