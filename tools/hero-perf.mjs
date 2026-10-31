#!/usr/bin/env node
/**
 * tools/hero-perf.mjs — measure what the frame actually costs.
 *
 *   npm run dev
 *   node tools/hero-perf.mjs            # median / p95 / max paint, long tasks, resize hitches
 *   HERO_THROTTLE=6 node tools/hero-perf.mjs   # same, under a 6× CPU throttle
 *
 * The engine reports its own paint cost through ?heroDebug=1, so this reads the real loop
 * rather than a synthetic benchmark. Budget (§8): ≤ 4 ms median at 1×, ≤ 12 ms at 6×.
 *
 * Long frames are split with the Long Animation Frame API. That distinction matters: a
 * 70 ms frame that is 0 ms script and 70 ms render is the compositor rasterising a
 * full-hero canvas in software, not a main-thread bug — and only one of those is fixable in
 * JavaScript.
 */
import { chromium } from "playwright-core";

const URL_BASE = process.env.HERO_URL ?? "http://127.0.0.1:5173/";
const THROTTLE = Number(process.env.HERO_THROTTLE ?? "1");
const SAMPLES = Number(process.env.HERO_SAMPLES ?? "180");

const browser = await chromium.launch(
  process.env.HERO_CHROMIUM ? { executablePath: process.env.HERO_CHROMIUM } : {},
);
const context = await browser.newContext({ viewport: { width: 1440, height: 800 } });
const page = await context.newPage();
const client = await context.newCDPSession(page);
if (THROTTLE > 1) await client.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });

const costs = [];
const longTasks = [];
const resizeCosts = [];
page.on("console", (msg) => {
  const m = /\[hero\] paint ([\d.]+)/.exec(msg.text());
  if (m) costs.push(Number(m[1]));
  const r = /\[hero\] resize ([\d.]+)/.exec(msg.text());
  if (r) resizeCosts.push(Number(r[1]));
});

await page.goto(`${URL_BASE}?heroDebug=1`, { waitUntil: "networkidle", timeout: 60_000 });
await page.evaluate(() => document.fonts.ready);
// Drop everything recorded during load/hydration: this measures the steady state.
await page.evaluate(() => {
  window.__long = [];
  window.__loaf = [];
  window.__costs = [];
});
// Sample every frame instead of the engine's 1-in-20 log.
await page.evaluate(() => {
  window.__long = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__long.push(entry.duration);
    }).observe({ entryTypes: ["longtask"] });
  } catch {
    /* longtask isn't observable everywhere */
  }
  // Script vs. render split for long frames (Chromium).
  window.__loaf = [];
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const script = entry.scripts?.reduce((sum, s) => sum + s.duration, 0) ?? 0;
        window.__loaf.push({
          total: entry.duration,
          script,
          render: entry.duration - script,
        });
      }
    }).observe({ type: "long-animation-frame" });
  } catch {
    /* older engines: the split is simply unavailable */
  }
});
// Force the engine to log every frame for the sampling window.
await page.evaluate(() => {
  const hero = document.querySelector("section[data-hero]");
  hero.dataset.perf = "1";
});
await page.waitForTimeout(SAMPLES * 17);

const measured = await page.evaluate(() => ({ long: window.__long ?? [] }));

// Resize hitch: change the viewport six times and watch for long tasks.
await page.evaluate(() => {
  window.__long.length = 0;
});
for (const width of [1400, 1280, 1180, 1024, 900, 1440]) {
  await page.setViewportSize({ width, height: 800 });
  await page.waitForTimeout(120);
}
const resizeLong = await page.evaluate(() => window.__long ?? []);
const loaf = await page.evaluate(() => window.__loaf ?? []);
const resizeReport = resizeCosts.slice(-8);
const worstScript = loaf.length ? Math.max(...loaf.map((e) => e.script)) : 0;
const worstRender = loaf.length ? Math.max(...loaf.map((e) => e.render)) : 0;

const all = costs.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
const pick = (p) => all[Math.min(all.length - 1, Math.floor(all.length * p))] ?? 0;
const budget = THROTTLE > 1 ? 12 : 4;
const median = pick(0.5);
const p95 = pick(0.95);
const worstLong = Math.max(0, ...[...measured.long, ...resizeLong]);

console.log(
  [
    `throttle       ${THROTTLE}x`,
    `resize cost    ${resizeReport.length ? resizeReport.map((n) => n.toFixed(1)).join(", ") + " ms" : "n/a"}`,
    `frames         ${all.length}`,
    `paint median   ${median.toFixed(2)} ms   (budget ${budget} ms)`,
    `paint p95      ${p95.toFixed(2)} ms`,
    `paint max      ${all[all.length - 1]?.toFixed(2) ?? "n/a"} ms`,
    `longest frame  ${worstLong.toFixed(0)} ms  ${worstLong > 50 ? "(over 50 ms, see split)" : "(under 50 ms)"}`,
    loaf.length
      ? `  of which     script ≤ ${worstScript.toFixed(0)} ms · raster ≤ ${worstRender.toFixed(0)} ms`
      : "  of which     no long frames were recorded",
    `verdict        ${median <= budget && worstScript <= 50 ? "PASS" : "FAIL"}`,
  ].join("\n"),
);

await browser.close();
process.exitCode = median <= budget && worstScript <= 50 ? 0 : 1;
