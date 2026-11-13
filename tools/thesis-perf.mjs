#!/usr/bin/env node
/**
 * Measure the thesis route on simulated cellular 4G, including actual canvas draw cost.
 *
 *   pnpm build && pnpm preview --host 0.0.0.0   # terminal 1
 *   THESIS_URL=http://127.0.0.1:4173/thesis node tools/thesis-perf.mjs
 *   THESIS_CPU_THROTTLE=6 THESIS_URL=... node tools/thesis-perf.mjs
 *
 * Canvas costs are measured inside the production draw loop. This measures JavaScript draw
 * time, not asynchronous GPU rasterisation. Browser and real-device results will vary.
 */
import { gzipSync } from "node:zlib";
import { chromium } from "playwright-core";

const PAGE_URL = process.env.THESIS_URL ?? "http://127.0.0.1:4173/thesis";
const CPU_THROTTLE = Number(process.env.THESIS_CPU_THROTTLE ?? "1");
const SAMPLE_SECONDS = Number(process.env.THESIS_SAMPLE_SECONDS ?? "4");
const JS_BUDGET = 200 * 1024;
const LCP_BUDGET = 2500;
const CLS_BUDGET = 0.01;
const PAINT_BUDGET = CPU_THROTTLE >= 6 ? 12 : 4;

const browser = await chromium.launch(
  process.env.THESIS_CHROMIUM ? { executablePath: process.env.THESIS_CHROMIUM } : {},
);
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const client = await page.context().newCDPSession(page);
const targetOrigin = new URL(PAGE_URL).origin;
const scriptResponses = [];
const scriptBodies = [];

await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 120,
  downloadThroughput: (8 * 1024 * 1024) / 8,
  uploadThroughput: (1.5 * 1024 * 1024) / 8,
  connectionType: "cellular4g",
});
if (CPU_THROTTLE > 1) await client.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });

await page.addInitScript(() => {
  window.__thesisCanvasDraws = 0;
  window.__thesisCanvasPaintCosts = [];
  window.__thesisMetrics = { lcp: 0, cls: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) window.__thesisMetrics.lcp = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    /* Browser has no LCP observer. */
  }
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.__thesisMetrics.cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  } catch {
    /* Browser has no layout-shift observer. */
  }
});

page.on("response", (response) => {
  const request = response.request();
  if (request.resourceType() !== "script" || new URL(response.url()).origin !== targetOrigin)
    return;
  scriptResponses.push(response);
});

const testURL = new URL(PAGE_URL);
testURL.searchParams.set("thesisPerf", "1");
await page.goto(testURL.href, { waitUntil: "networkidle", timeout: 60_000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);
for (const response of scriptResponses) {
  try {
    scriptBodies.push(await response.body());
  } catch {
    /* A script response may be evicted before it can be read. */
  }
}

await page.evaluate(() => {
  window.__thesisCanvasDraws = 0;
  window.__thesisCanvasPaintCosts = [];
});
await page.waitForTimeout(SAMPLE_SECONDS * 1000);
const sample = await page.evaluate(() => ({
  draws: window.__thesisCanvasDraws ?? 0,
  paintCosts: window.__thesisCanvasPaintCosts ?? [],
  lcp: window.__thesisMetrics?.lcp ?? 0,
  cls: window.__thesisMetrics?.cls ?? 0,
}));
const visibleFps = sample.draws / SAMPLE_SECONDS;
const jsGzipBytes = scriptBodies.reduce((total, body) => total + gzipSync(body).byteLength, 0);
const sortedCosts = sample.paintCosts.filter(Number.isFinite).sort((a, b) => a - b);
const percentile = (values, fraction) =>
  values.length ? values[Math.min(values.length - 1, Math.floor(values.length * fraction))] : 0;
const paintMedian = percentile(sortedCosts, 0.5);
const paintP95 = percentile(sortedCosts, 0.95);

await page.evaluate(() =>
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
);
await page.waitForTimeout(350);
const offscreenStart = await page.evaluate(() => window.__thesisCanvasDraws ?? 0);
await page.waitForTimeout(1000);
const offscreenEnd = await page.evaluate(() => window.__thesisCanvasDraws ?? 0);
const offscreenDraws = offscreenEnd - offscreenStart;

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await page.waitForTimeout(450);
const hiddenStart = await page.evaluate(() => window.__thesisCanvasDraws ?? 0);
let hiddenDraws = null;
try {
  await client.send("Emulation.setPageVisibilityOverride", { visibilityState: "hidden" });
  await page.waitForTimeout(1000);
  const hiddenEnd = await page.evaluate(() => window.__thesisCanvasDraws ?? 0);
  hiddenDraws = hiddenEnd - hiddenStart;
  await client.send("Emulation.setPageVisibilityOverride", { visibilityState: "visible" });
} catch {
  /* Some Chromium builds do not expose the page-visibility override. */
}

const results = [
  {
    label: "LCP",
    value: `${(sample.lcp / 1000).toFixed(2)} s`,
    pass: sample.lcp > 0 && sample.lcp < LCP_BUDGET,
    budget: "< 2.50 s",
  },
  {
    label: "CLS",
    value: sample.cls.toFixed(4),
    pass: sample.cls <= CLS_BUDGET,
    budget: "≤ 0.0100",
  },
  {
    label: "First-party JavaScript (gzip)",
    value: `${(jsGzipBytes / 1024).toFixed(1)} KB`,
    pass: jsGzipBytes > 0 && jsGzipBytes < JS_BUDGET,
    budget: "< 200 KB",
  },
  {
    label: "Canvas draw median",
    value: `${paintMedian.toFixed(2)} ms (${sortedCosts.length} frames)`,
    pass: sortedCosts.length > 0 && paintMedian <= PAINT_BUDGET,
    budget: `≤ ${PAINT_BUDGET} ms at ${CPU_THROTTLE}× CPU`,
  },
  {
    label: "Canvas draw p95",
    value: `${paintP95.toFixed(2)} ms`,
    pass: sortedCosts.length > 0 && paintP95 <= PAINT_BUDGET * 2,
    budget: `≤ ${(PAINT_BUDGET * 2).toFixed(0)} ms`,
  },
  {
    label: "Visible canvas rate",
    value: `${visibleFps.toFixed(1)} fps`,
    pass: visibleFps > 0 && visibleFps <= 30.5,
    budget: "> 0 and ≤ 30 fps on mobile",
  },
  {
    label: "Off-screen canvas draws",
    value: String(offscreenDraws),
    pass: offscreenDraws === 0,
    budget: "0",
  },
  {
    label: "Hidden-page canvas draws",
    value: hiddenDraws === null ? "not supported by this Chromium" : String(hiddenDraws),
    pass: hiddenDraws === null || hiddenDraws === 0,
    budget: "0 when visibility override is supported",
  },
];

console.log(`Thesis route performance · simulated cellular 4G · ${CPU_THROTTLE}× CPU`);
for (const result of results)
  console.log(
    `${result.pass ? "PASS" : "FAIL"}  ${result.label.padEnd(30)} ${result.value.padEnd(28)} ${result.budget}`,
  );

await browser.close();
process.exitCode = results.every((result) => result.pass) ? 0 : 1;
