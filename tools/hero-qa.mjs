#!/usr/bin/env node
/**
 * tools/hero-qa.mjs — capture real hero layouts + screenshots for the headless stills.
 *
 *   npm run dev                     # in one shell (port 5173)
 *   npm i -D playwright-core        # once, if it is not already available
 *   node tools/hero-qa.mjs          # writes design/hero-phase1/*.png + scripts/hero-qa/data/*.json
 *   cd scripts/hero-qa && npm run stills
 *
 * The engine is DOM-free, so it can paint anywhere — but phase 1's contract is that the
 * geometry comes from measured DOM rects. This script measures the live page at each
 * breakpoint and hands the snapshot to the Node renderer, so the stills use the same
 * numbers the browser does.
 */
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..");
const outShots = join(repo, "design/hero-phase1");
const outData = join(repo, "scripts/hero-qa/data");
mkdirSync(outShots, { recursive: true });
mkdirSync(outData, { recursive: true });

const URL_BASE = process.env.HERO_URL ?? "http://127.0.0.1:5173/";

const VIEWPORTS = [
  { name: "1440x780", w: 1440, h: 780, dark: false },
  { name: "1024x768", w: 1024, h: 768, dark: false },
  { name: "390x820", w: 390, h: 820, dark: false },
  { name: "1440x780-dark", w: 1440, h: 780, dark: true },
];

const executablePath = process.env.HERO_CHROMIUM ?? undefined;
const browser = await chromium.launch(executablePath ? { executablePath } : {});

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const paintCosts = [];
  page.on("console", (msg) => {
    const m = /\[hero\] paint ([\d.]+)ms/.exec(msg.text());
    if (m) paintCosts.push(Number(m[1]));
  });
  page.on("pageerror", (err) => console.error(`[${vp.name}] page error:`, err.message));

  await page.goto(`${URL_BASE}?heroDebug=1`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);
  if (vp.dark) {
    await page.evaluate(() => document.documentElement.classList.add("dark"));
  }
  await page.waitForTimeout(1800);
  await page.mouse.move(vp.w * 0.5, vp.h * 0.5);
  await page.waitForTimeout(400);

  const captured = await page.evaluate(() => {
    const w = window;
    const hero = document.querySelector("section[data-hero]");
    const rect = hero.getBoundingClientRect();
    const raw = w.__hero;
    if (!raw) return null;
    return {
      layout: raw.layout,
      geometry: raw.geometry,
      section: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    };
  });

  if (!captured) {
    console.error(`[${vp.name}] no __hero snapshot — is the dev server running with the patch?`);
    await context.close();
    continue;
  }

  writeFileSync(
    join(outData, `layout-${vp.name}.json`),
    JSON.stringify(
      {
        name: vp.name,
        dark: vp.dark,
        viewport: { w: vp.w, h: vp.h },
        layout: captured.layout,
        canvasDataUrl: null,
        paintCostMs: paintCosts.length
          ? paintCosts.reduce((a, b) => a + b, 0) / paintCosts.length
          : null,
        html: { serif: "", serifItalic: "", sans: "", sansMedium: "" },
        footer: { baselineY: 0, left: 0 },
      },
      null,
      1,
    ),
  );

  // the clean frame is what gets judged; the debug overlay was only for the numbers above
  await page.evaluate(() => {
    document.querySelector("section[data-hero]").dataset.hideDebug = "1";
  });
  await page.waitForTimeout(120);
  await page.screenshot({
    path: join(
      outShots,
      `phase1-page-${vp.name.replace(/-dark$/, "")}${vp.dark ? "-dark" : ""}.png`,
    ),
    clip: {
      x: captured.section.left,
      y: captured.section.top,
      width: captured.section.width,
      height: captured.section.height,
    },
  });

  const avg = paintCosts.length
    ? (paintCosts.reduce((a, b) => a + b, 0) / paintCosts.length).toFixed(2)
    : "n/a";
  console.log(
    `[${vp.name}] layout captured · paint ~${avg} ms · entry ${captured.geometry.entryMode} · prism r=${captured.geometry.prismSize.toFixed(1)}`,
  );
  await context.close();
}

/* ---------------------------------------------------------------- reduced motion audit */

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 780 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  // Count every animation frame offered to the page, before any script runs.
  await page.addInitScript(() => {
    const w = window;
    w.__rafCalls = 0;
    const original = w.requestAnimationFrame.bind(w);
    w.requestAnimationFrame = (cb) => {
      w.__rafCalls += 1;
      return original(cb);
    };
  });
  await page.goto(`${URL_BASE}?heroDebug=1`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(2000);
  const audit = await page.evaluate(() => {
    const canvas = document.querySelector("section[data-hero] canvas");
    const ctx = canvas.getContext("2d");
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 4) painted += 1;
    return { rafCalls: window.__rafCalls, painted, canvasW: canvas.width };
  });
  const ok = audit.rafCalls === 0 && audit.painted > 5000;
  console.log(
    `[reduced-motion] rAF requests: ${audit.rafCalls} · painted pixels: ${audit.painted} · ${
      ok ? "PASS (still composed, zero loop)" : "FAIL"
    }`,
  );
  if (!ok) process.exitCode = 1;
  await context.close();
}

await browser.close();
console.log(`\nwrote ${outData} + ${outShots}`);
if (!existsSync(join(outData, "layout-1440x780.json"))) process.exitCode = 1;
