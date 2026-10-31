#!/usr/bin/env node
/**
 * tools/hero-motion-reel.mjs — a synthetic motion reel of the hero field.
 *
 *   npm run dev                       # shell 1
 *   node tools/hero-motion-reel.mjs   # writes design/hero-phase<N>/frames/*.png + a full run
 *
 * A still can't tell you whether plasma reads as electricity or as noise. This freezes the
 * page's clock: it replaces rAF and performance.now with a clock the script drives, then
 * steps the field at a fixed 16.67 ms and screenshots the canvas at chosen frames.
 *
 * Frames land in design/hero-phase<N>/frames/ and are composited into one contact sheet so
 * consecutive frames can be compared without opening six files.
 */
import { chromium } from "playwright-core";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const phase = process.env.HERO_PHASE ?? "2";
const outDir = join(repo, `design/hero-phase${phase}/frames`);
const URL_BASE = process.env.HERO_URL ?? "http://127.0.0.1:5173/";

const CAPTURE = [0, 8, 16, 26, 40, 60]; // rAF ticks at 60 fps → 0, 133, 267, 433, 667, 1000 ms
const STEP_MS = 1000 / 60;
const DARK = process.env.HERO_DARK === "1";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(
  process.env.HERO_CHROMIUM ? { executablePath: process.env.HERO_CHROMIUM } : {},
);
const context = await browser.newContext({
  viewport: { width: 1440, height: 800 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

// Freeze time before any app code runs. The loop is driven by hand from here on.
await page.addInitScript(() => {
  const w = window;
  let now = 0;
  let queue = [];
  let nextId = 1;
  w.__reel = {
    step(ms) {
      now += ms;
      const due = queue;
      queue = [];
      for (const entry of due.sort((a, b) => a.id - b.id)) entry.cb(now);
      return now;
    },
    pending: () => queue.length,
  };
  w.requestAnimationFrame = (cb) => {
    const id = nextId++;
    queue.push({ id, cb });
    return id;
  };
  w.cancelAnimationFrame = (id) => {
    queue = queue.filter((entry) => entry.id !== id);
  };
  w.performance.now = () => now;
  Object.defineProperty(w, "devicePixelRatio", { get: () => 1, configurable: true });
});

await page.goto(`${URL_BASE}?heroDebug=1`, { waitUntil: "networkidle", timeout: 60_000 });
await page.evaluate(() => {
  document.fonts.ready.then(() => undefined);
  const hero = document.querySelector("section[data-hero]");
  hero.dataset.hideDebug = "1";
});
if (DARK) await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(600);

// Advance past the entrance animation and settle the pointer far away, then run the reel.
await page.evaluate((step) => window.__reel.step(step), 1200);
await page.mouse.move(20, 780);

const costs = [];
let ticks = 0;
const target = CAPTURE[CAPTURE.length - 1];
for (let i = 0; i <= target; i++) {
  const info = await page.evaluate((step) => {
    const started = performance.now();
    window.__reel.step(step);
    return { painted: window.__reel.pending(), cost: performance.now() - started };
  }, STEP_MS);
  costs.push(info.cost);
  ticks += 1;

  if (CAPTURE.includes(i)) {
    const ms = Math.round(i * STEP_MS);
    const name = `frame-${String(ms).padStart(4, "0")}ms${DARK ? "-dark" : ""}.png`;
    await page.screenshot({
      path: join(outDir, name),
      clip: { x: 0, y: 65, width: 1440, height: 720 },
    });
    console.log(`captured ${name} (${i} ticks, ${info.painted} rAF queued)`);
  }
}

const sorted = [...costs].sort((a, b) => a - b);
const p95 = sorted[Math.floor(sorted.length * 0.95)];
console.log(
  `\n${ticks} frames · median ${sorted[Math.floor(sorted.length / 2)].toFixed(2)} ms · p95 ${p95.toFixed(2)} ms (loop wake-up only, not GPU paint)`,
);
console.log(`frames → ${outDir}`);

await browser.close();

// Contact sheet: six crops side by side, labelled, so the reel can be judged in one glance.
const [{ createCanvas, GlobalFonts, loadImage }, { writeFileSync }] = await Promise.all([
  import(join(repo, "scripts/hero-qa/node_modules/@napi-rs/canvas/index.js")),
  import("node:fs"),
]);
const files = CAPTURE.map(
  (i) => `frame-${String(Math.round(i * STEP_MS)).padStart(4, "0")}ms${DARK ? "-dark" : ""}.png`,
);
const thumbW = 480;
const thumbH = 240;
const sheet = createCanvas(thumbW * 3, (thumbH + 26) * 2);
const sctx = sheet.getContext("2d");
sctx.fillStyle = DARK ? "#1B1815" : "#F7F4EE";
sctx.fillRect(0, 0, sheet.width, sheet.height);
void GlobalFonts;
for (const [index, file] of files.entries()) {
  const image = await loadImage(join(outDir, file));
  const col = index % 3;
  const row = Math.floor(index / 3);
  sctx.drawImage(image, col * thumbW, row * (thumbH + 26), thumbW, thumbH);
  sctx.fillStyle = DARK ? "#9A9184" : "#6B645B";
  sctx.font = "13px sans-serif";
  sctx.fillText(file.replace(".png", ""), col * thumbW + 8, row * (thumbH + 26) + thumbH + 17);
}
writeFileSync(
  join(repo, `design/hero-phase${phase}/motion-reel${DARK ? "-dark" : ""}.png`),
  sheet.toBuffer("image/png"),
);
console.log(`contact sheet → design/hero-phase${phase}/motion-reel${DARK ? "-dark" : ""}.png`);
