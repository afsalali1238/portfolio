#!/usr/bin/env node
/**
 * Measure the reading-first thesis route on simulated cellular 4G.
 *
 *   pnpm build && pnpm preview --host 0.0.0.0   # terminal 1
 *   THESIS_URL=http://127.0.0.1:4173/thesis node tools/thesis-perf.mjs
 *   THESIS_CPU_THROTTLE=6 THESIS_URL=... node tools/thesis-perf.mjs
 *
 * The optical field is event-driven: it redraws when reading position changes and is idle while
 * prose is being read. The audit protects that contract as well as LCP, CLS, and JS weight.
 */
import { gzipSync } from "node:zlib";
import { chromium } from "playwright-core";

const PAGE_URL = process.env.THESIS_URL ?? "http://127.0.0.1:4173/thesis";
const CPU_THROTTLE = Number(process.env.THESIS_CPU_THROTTLE ?? "1");
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

const resetCanvasMetrics = () =>
  page.evaluate(() => {
    window.__thesisCanvasDraws = 0;
    window.__thesisCanvasPaintCosts = [];
  });
const canvasMetrics = () =>
  page.evaluate(() => ({
    draws: window.__thesisCanvasDraws ?? 0,
    paintCosts: window.__thesisCanvasPaintCosts ?? [],
    lcp: window.__thesisMetrics?.lcp ?? 0,
    cls: window.__thesisMetrics?.cls ?? 0,
  }));

await resetCanvasMetrics();
await page.waitForTimeout(1000);
const idle = await canvasMetrics();

await resetCanvasMetrics();
await page.evaluate(() =>
  document.querySelector(".flow-movement")?.scrollIntoView({ behavior: "instant", block: "start" }),
);
await page.waitForTimeout(500);
const afterScroll = await canvasMetrics();
await page.waitForTimeout(1000);
const settled = await canvasMetrics();

const jsGzipBytes = scriptBodies.reduce((total, body) => total + gzipSync(body).byteLength, 0);
const sortedCosts = afterScroll.paintCosts.filter(Number.isFinite).sort((a, b) => a - b);
const percentile = (values, fraction) =>
  values.length ? values[Math.min(values.length - 1, Math.floor(values.length * fraction))] : 0;
const paintMedian = percentile(sortedCosts, 0.5);
const paintP95 = percentile(sortedCosts, 0.95);

await page.evaluate(() =>
  document.getElementById("discussion")?.scrollIntoView({ behavior: "instant" }),
);
await page.waitForTimeout(400);
const offscreenStart = (await canvasMetrics()).draws;
await page.waitForTimeout(1000);
const offscreenDraws = (await canvasMetrics()).draws - offscreenStart;

let hiddenDraws = null;
try {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(250);
  await resetCanvasMetrics();
  await client.send("Emulation.setPageVisibilityOverride", { visibilityState: "hidden" });
  await page.waitForTimeout(1000);
  hiddenDraws = (await canvasMetrics()).draws;
  await client.send("Emulation.setPageVisibilityOverride", { visibilityState: "visible" });
} catch {
  /* Some Chromium builds do not expose the page-visibility override. */
}

const results = [
  {
    label: "LCP",
    value: `${(afterScroll.lcp / 1000).toFixed(2)} s`,
    pass: afterScroll.lcp > 0 && afterScroll.lcp < LCP_BUDGET,
    budget: "< 2.50 s",
  },
  {
    label: "CLS",
    value: afterScroll.cls.toFixed(4),
    pass: afterScroll.cls <= CLS_BUDGET,
    budget: "≤ 0.0100",
  },
  {
    label: "First-party JavaScript (gzip)",
    value: `${(jsGzipBytes / 1024).toFixed(1)} KB`,
    pass: jsGzipBytes > 0 && jsGzipBytes < JS_BUDGET,
    budget: "< 200 KB",
  },
  {
    label: "Canvas draw median after scroll",
    value: `${paintMedian.toFixed(2)} ms (${sortedCosts.length} draws)`,
    pass: sortedCosts.length > 0 && paintMedian <= PAINT_BUDGET,
    budget: `≤ ${PAINT_BUDGET} ms at ${CPU_THROTTLE}× CPU`,
  },
  {
    label: "Canvas draw p95 after scroll",
    value: `${paintP95.toFixed(2)} ms`,
    pass: sortedCosts.length > 0 && paintP95 <= PAINT_BUDGET * 2,
    budget: `≤ ${(PAINT_BUDGET * 2).toFixed(0)} ms`,
  },
  {
    label: "Idle canvas draws",
    value: String(idle.draws),
    pass: idle.draws === 0,
    budget: "0 while the reader is at rest",
  },
  {
    label: "Canvas draws after a reading scroll",
    value: String(afterScroll.draws),
    pass: afterScroll.draws > 0 && afterScroll.draws <= 4,
    budget: "1–4 event-driven draws",
  },
  {
    label: "Settled canvas draws",
    value: String(settled.draws - afterScroll.draws),
    pass: settled.draws === afterScroll.draws,
    budget: "0 after the scroll settles",
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
    `${result.pass ? "PASS" : "FAIL"}  ${result.label.padEnd(32)} ${result.value.padEnd(28)} ${result.budget}`,
  );

await browser.close();
process.exitCode = results.every((result) => result.pass) ? 0 : 1;
