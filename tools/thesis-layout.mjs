#!/usr/bin/env node
/**
 * Capture and inspect the prologue and all six movements at desktop, tablet, and mobile sizes.
 *
 *   pnpm dev --host 0.0.0.0
 *   THESIS_URL=http://127.0.0.1:5173/thesis node tools/thesis-layout.mjs
 *   THESIS_CHROMIUM=/path/to/chromium THESIS_URL=... node tools/thesis-layout.mjs
 *
 * Screenshots default to the ignored node_modules/.cache/thesis-layout directory. The audit
 * checks visible text for clipping, sub-12px sizing, horizontal overflow, and collisions with
 * the header, optical HUD, chapter rail, or stage footer. It accounts for intentionally
 * scrollable editorial columns on short and landscape screens.
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
  await page.waitForSelector(".chapter-rail .rail-stop");

  for (let chapter = 0; chapter <= 6; chapter++) {
    await page.locator(".chapter-rail .rail-stop").nth(chapter).click();
    try {
      await page.waitForFunction(
        (index) =>
          document.querySelector(".pinned-stage")?.getAttribute("data-chapter") === String(index) &&
          document.querySelectorAll(".editorial .beat")[index]?.getAttribute("aria-hidden") ===
            "false",
        chapter,
        { timeout: 8_000 },
      );
    } catch {
      failures += 1;
      console.error(`FAIL ${viewport.name} movement ${chapter}: chapter did not settle`);
      continue;
    }
    await page.waitForTimeout(250);

    const audit = await page.evaluate(() => {
      const stage = document.querySelector(".pinned-stage");
      const active = document.querySelector('.editorial .beat[aria-hidden="false"]');
      if (!stage || !active)
        return {
          error: "active movement is missing",
          collisions: [],
          clipped: [],
          small: [],
          horizontalOverflow: false,
        };
      const bounds = stage.getBoundingClientRect();
      const rectOf = (rect) => ({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      });
      const intersection = (rect, clip, clipX = true, clipY = true) => {
        const visible = {
          left: clipX ? Math.max(rect.left, clip.left) : rect.left,
          right: clipX ? Math.min(rect.right, clip.right) : rect.right,
          top: clipY ? Math.max(rect.top, clip.top) : rect.top,
          bottom: clipY ? Math.min(rect.bottom, clip.bottom) : rect.bottom,
        };
        return visible.right > visible.left && visible.bottom > visible.top ? visible : null;
      };
      const clipBounds = (element) => {
        const rect = element.getBoundingClientRect();
        const left = rect.left + element.clientLeft;
        const top = rect.top + element.clientTop;
        return {
          left,
          right: left + element.clientWidth,
          top,
          bottom: top + element.clientHeight,
        };
      };
      const visibleRectFor = (element, rect) => {
        let visible = intersection(rect, rectOf(bounds));
        let scrollable = false;
        for (
          let ancestor = element;
          ancestor && ancestor !== stage;
          ancestor = ancestor.parentElement
        ) {
          const style = getComputedStyle(ancestor);
          const clipX = ["hidden", "clip", "auto", "scroll"].includes(style.overflowX);
          const clipY = ["hidden", "clip", "auto", "scroll"].includes(style.overflowY);
          if (visible && (clipX || clipY))
            visible = intersection(visible, clipBounds(ancestor), clipX, clipY);
          if (
            (style.overflowY === "auto" || style.overflowY === "scroll") &&
            ancestor.scrollHeight > ancestor.clientHeight + 1
          )
            scrollable = true;
        }
        return { visible, scrollable };
      };
      const overlaps = (a, b) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const visibleTextRects = [];
      const small = [];
      const clipped = [];
      for (const element of active.querySelectorAll(
        "h1,h2,h3,p,button,.beat-eyebrow,.beat-footnote",
      )) {
        if (element.closest('[aria-hidden="true"]')) continue;
        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) < 0.1
        )
          continue;
        const fontSize = Number.parseFloat(style.fontSize);
        const range = document.createRange();
        range.selectNodeContents(element);
        const rects = [...range.getClientRects()].filter(
          (rect) => rect.width > 0 && rect.height > 0,
        );
        const candidates = rects.length ? rects : [...element.getClientRects()];
        for (const rect of candidates) {
          const selector = element.className || element.tagName.toLowerCase();
          const { visible, scrollable } = visibleRectFor(element, rect);
          if (
            !scrollable &&
            (rect.left < bounds.left - 1 ||
              rect.right > bounds.right + 1 ||
              rect.top < bounds.top - 1 ||
              rect.bottom > bounds.bottom + 1)
          )
            clipped.push(selector);
          if (!visible) continue;
          visibleTextRects.push({ selector, rect: visible });
          if (fontSize < 12) small.push(`${selector}: ${fontSize}px`);
        }
      }
      const controls = [
        ...stage.querySelectorAll(".site-header, .telemetry, .chapter-rail, .stage-footer"),
        ...stage.querySelectorAll(".instrument-meta > span"),
      ];
      const controlRects = controls.flatMap((element) => {
        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) < 0.1
        )
          return [];
        const range = document.createRange();
        range.selectNodeContents(element);
        const rects = [...range.getClientRects()].filter(
          (rect) => rect.width > 0 && rect.height > 0,
        );
        const candidates = rects.length ? rects : [...element.getClientRects()];
        return candidates.flatMap((rect) => {
          const { visible } = visibleRectFor(element, rect);
          return visible
            ? [{ selector: element.className || element.tagName.toLowerCase(), rect: visible }]
            : [];
        });
      });
      const collisions = [];
      for (const text of visibleTextRects) {
        for (const control of controlRects) {
          if (text.selector === control.selector) continue;
          if (overlaps(text.rect, control.rect))
            collisions.push(`${text.selector} overlaps ${control.selector}`);
        }
      }
      return {
        collisions: [...new Set(collisions)],
        clipped: [...new Set(clipped)],
        small: [...new Set(small)],
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });

    const file = path.join(
      OUTPUT,
      `thesis-${viewport.width}x${viewport.height}-movement-${chapter}.png`,
    );
    await page.screenshot({ path: file, fullPage: false });
    const ok =
      !audit.error &&
      !audit.collisions.length &&
      !audit.clipped.length &&
      !audit.small.length &&
      !audit.horizontalOverflow;
    if (!ok) failures += 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${viewport.name} movement ${chapter} · ${file}`);
    if (audit.error) console.log(`  ${audit.error}`);
    if (audit.collisions.length) console.log(`  collisions: ${audit.collisions.join("; ")}`);
    if (audit.clipped.length) console.log(`  clipped: ${audit.clipped.join(", ")}`);
    if (audit.small.length) console.log(`  text under 12px: ${audit.small.join(", ")}`);
    if (audit.horizontalOverflow) console.log("  horizontal document overflow");
  }
  await context.close();
}

await browser.close();
console.log(`Thesis layout audit: ${failures ? `${failures} failure(s)` : "all checks passed"}`);
process.exitCode = failures ? 1 : 0;
