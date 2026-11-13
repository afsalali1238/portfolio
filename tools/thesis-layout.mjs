#!/usr/bin/env node
/**
 * Capture the native thesis reader at desktop and mobile sizes.
 *
 *   pnpm dev --host 0.0.0.0
 *   THESIS_URL=http://127.0.0.1:5173/thesis node tools/thesis-layout.mjs
 *   THESIS_CHROMIUM=/path/to/chromium THESIS_URL=... node tools/thesis-layout.mjs
 *
 * The audit verifies that every reading section can be reached through normal document scroll,
 * has no clipped text or horizontal overflow, and keeps utility copy at a readable 12px minimum.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const PAGE_URL = process.env.THESIS_URL ?? "http://127.0.0.1:5173/thesis";
const OUTPUT = process.env.THESIS_SCREENSHOTS ?? "node_modules/.cache/thesis-layout";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "short-mobile", width: 320, height: 568 },
  { name: "landscape-mobile", width: 844, height: 390 },
];

const browser = await chromium.launch(
  process.env.THESIS_CHROMIUM ? { executablePath: process.env.THESIS_CHROMIUM } : {},
);
await fs.mkdir(OUTPUT, { recursive: true });
let failures = 0;

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => {
    failures += 1;
    console.error(`PAGE ERROR ${viewport.name}: ${error.message}`);
  });
  await page.goto(PAGE_URL, { waitUntil: "networkidle", timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);

  const sections = page.locator(".flow-opening, .flow-movement, .flow-closing");
  const count = await sections.count();
  if (count !== 8) {
    failures += 1;
    console.error(`FAIL ${viewport.name}: expected 8 reader sections, found ${count}`);
  }

  for (let index = 0; index < count; index++) {
    await sections.nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    const audit = await page.evaluate(() => {
      const root = document.querySelector(".reading-flow");
      if (!root)
        return {
          error: "reading flow is missing",
          clipped: [],
          small: [],
          horizontalOverflow: false,
        };
      const clipped = [];
      const small = [];
      for (const element of root.querySelectorAll(
        "h1,h2,h3,p,a,.flow-kicker,.flow-chapter-label,.flow-footnote",
      )) {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") continue;
        const fontSize = Number.parseFloat(style.fontSize);
        if (fontSize < 12) small.push(`${element.className || element.tagName}: ${fontSize}px`);
        for (const rect of element.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          if (rect.left < -1 || rect.right > window.innerWidth + 1)
            clipped.push(element.className || element.tagName);
        }
      }
      return {
        clipped: [...new Set(clipped)],
        small: [...new Set(small)],
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });
    const file = path.join(
      OUTPUT,
      `thesis-${viewport.width}x${viewport.height}-section-${index}.png`,
    );
    await page.screenshot({ path: file, fullPage: false });
    const ok =
      !audit.error && !audit.clipped.length && !audit.small.length && !audit.horizontalOverflow;
    if (!ok) failures += 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${viewport.name} reader section ${index} · ${file}`);
    if (audit.error) console.log(`  ${audit.error}`);
    if (audit.clipped.length) console.log(`  clipped: ${audit.clipped.join(", ")}`);
    if (audit.small.length) console.log(`  text under 12px: ${audit.small.join(", ")}`);
    if (audit.horizontalOverflow) console.log("  horizontal document overflow");
  }
  await context.close();
}

await browser.close();
console.log(`Thesis layout audit: ${failures ? `${failures} failure(s)` : "all checks passed"}`);
process.exitCode = failures ? 1 : 0;
