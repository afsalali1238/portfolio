#!/usr/bin/env node
/**
 * tools/hero-idle-hash.mjs — hash the deterministic still.
 *
 *   node tools/hero-idle-hash.mjs [label]
 *
 * The animated page can never be pixel-stable, so "interaction is additive" is only provable
 * on the frame the user with reduced motion actually gets: one static paint, no rAF. This
 * hashes that canvas and writes it next to the other evidence, so the same command run
 * against two builds gives an A/B.
 */
import { chromium } from "playwright-core";
import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const label = process.argv[2] ?? "current";
const outDir = join(repo, `design/hero-phase${process.env.HERO_PHASE ?? "5"}`);
mkdirSync(outDir, { recursive: true });
const URL_BASE = process.env.HERO_URL ?? "http://127.0.0.1:4212/";

const browser = await chromium.launch(
  process.env.HERO_CHROMIUM ? { executablePath: process.env.HERO_CHROMIUM } : {},
);
const context = await browser.newContext({
  viewport: { width: 1440, height: 780 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const page = await context.newPage();
// No ?heroDebug here on purpose: the debug guides are cleared from inside the rAF loop, and
// a reduced-motion page never runs it — a debug URL would bake dashed columns into the very
// frame this tool exists to hash.
await page.goto(URL_BASE, { waitUntil: "networkidle", timeout: 60_000 });
await page.waitForTimeout(2000);

const result = await page.evaluate(() => {
  const canvas = document.querySelector("section[data-hero] canvas");
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // FNV-1a over the RGBA bytes: cheap in the page, stable across runs.
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return { hash: hash.toString(16).padStart(8, "0"), w: canvas.width, h: canvas.height };
});

const shotPath = join(outDir, `idle-reduced-motion-${label}.png`);
const clip = await page.evaluate(() => {
  const rect = document.querySelector("section[data-hero]").getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
});
const png = await page.screenshot({ clip });
writeFileSync(shotPath, png);

const fileHash = createHash("sha256").update(png).digest("hex").slice(0, 16);
console.log(`[${label}] canvas ${result.w}x${result.h} · fnv ${result.hash} · png ${fileHash}`);
console.log(`[${label}] wrote ${shotPath}`);
await browser.close();
