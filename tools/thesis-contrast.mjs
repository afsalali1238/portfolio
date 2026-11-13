#!/usr/bin/env node
/**
 * Measure visible text contrast against the actual thesis canvas and the light reading view.
 *
 *   pnpm dev --host 0.0.0.0
 *   THESIS_URL=http://127.0.0.1:5173/thesis node tools/thesis-contrast.mjs
 *   THESIS_CHROMIUM=/path/to/chromium THESIS_URL=... node tools/thesis-contrast.mjs
 *
 * For the animated stage, text is temporarily hidden and screenshots sample the pixels behind
 * each real text line. The report uses the 5th percentile of per-pixel WCAG ratios, not the
 * average of the whole paragraph. The static reading view uses its opaque paper surface.
 */
import { chromium } from "playwright-core";

const PAGE_URL = process.env.THESIS_URL ?? "http://127.0.0.1:5173/thesis";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];
const browser = await chromium.launch(
  process.env.THESIS_CHROMIUM ? { executablePath: process.env.THESIS_CHROMIUM } : {},
);
let failures = 0;
let auditedTextNodes = 0;

const parseColour = (value) => {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const channels = match[1].split(/[,/]/).map((part) => Number.parseFloat(part.trim()));
  if (channels.some((channel) => !Number.isFinite(channel))) return null;
  return { r: channels[0], g: channels[1], b: channels[2], a: channels[3] ?? 1 };
};
const channel = (value) => {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (foreground, background) => {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
};
const composite = (foreground, background) => ({
  r: foreground.r * foreground.a + background.r * (1 - foreground.a),
  g: foreground.g * foreground.a + background.g * (1 - foreground.a),
  b: foreground.b * foreground.a + background.b * (1 - foreground.a),
  a: 1,
});

function report({ viewport, mode, label, foreground, fontSize, fontWeight, ratios }) {
  const large = fontSize >= 24 || (fontSize >= 18.67 && fontWeight >= 700);
  const minimum = large ? 3 : 4.5;
  const sorted = ratios.filter(Number.isFinite).sort((a, b) => a - b);
  const ratio = sorted.length ? sorted[Math.floor((sorted.length - 1) * 0.05)] : 0;
  const pass = sorted.length > 0 && ratio >= minimum;
  auditedTextNodes += 1;
  if (!pass) failures += 1;
  console.log(
    `${pass ? "PASS" : "FAIL"} ${viewport} ${mode} ${JSON.stringify(label)} · ` +
      `${ratio.toFixed(2)}:1 (minimum ${minimum.toFixed(2)}:1; ` +
      `${fontSize}px ${fontWeight}; ${sorted.length} pixels; ${foreground})`,
  );
}

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

  for (let chapter = 0; chapter <= 6; chapter++) {
    await page.locator(".chapter-rail .rail-stop").nth(chapter).click();
    await page.waitForFunction(
      (index) =>
        document.querySelector(".pinned-stage")?.getAttribute("data-chapter") === String(index) &&
        document.querySelectorAll(".editorial .beat")[index]?.getAttribute("aria-hidden") ===
          "false",
      chapter,
      { timeout: 8_000 },
    );
    await page.waitForTimeout(350);

    const textTargets = await page.evaluate(() => {
      const active = document.querySelector('.editorial .beat[aria-hidden="false"]');
      if (!active) return [];
      const candidates = [...active.querySelectorAll("*")].filter((element) =>
        [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        ),
      );
      const seen = new Set();
      const targets = [];
      for (const element of candidates) {
        if (seen.has(element) || element.closest('[aria-hidden="true"]')) continue;
        seen.add(element);
        const style = getComputedStyle(element);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          Number(style.opacity) < 0.1
        )
          continue;
        const rects = [];
        for (const node of element.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects())
            if (rect.width > 0 && rect.height > 0)
              rects.push({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              });
        }
        if (!rects.length) continue;
        const id = String(targets.length);
        element.setAttribute("data-thesis-contrast-target", id);
        targets.push({
          id,
          label: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 64),
          foreground: style.color,
          fontSize: Number.parseFloat(style.fontSize),
          fontWeight: Number.parseFloat(style.fontWeight) || 400,
          rects,
        });
      }
      return targets;
    });

    await page.addStyleTag({
      content: "[data-thesis-contrast-target] { opacity: 0 !important; }",
    });
    const screenshot = await page.screenshot({ type: "png" });
    const backgrounds = await page.evaluate(
      async ({ base64, targets }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return targets.map(() => []);
        context.drawImage(image, 0, 0);
        const scaleX = image.width / window.innerWidth;
        const scaleY = image.height / window.innerHeight;
        return targets.map(({ rects }) => {
          const ratios = [];
          for (const rect of rects) {
            const x = Math.max(0, Math.floor(rect.left * scaleX));
            const y = Math.max(0, Math.floor(rect.top * scaleY));
            const right = Math.min(image.width, Math.ceil((rect.left + rect.width) * scaleX));
            const bottom = Math.min(image.height, Math.ceil((rect.top + rect.height) * scaleY));
            const width = right - x;
            const height = bottom - y;
            if (width < 1 || height < 1) continue;
            const pixels = context.getImageData(x, y, width, height).data;
            for (let index = 0; index < pixels.length; index += 4)
              ratios.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
          }
          return ratios;
        });
      },
      { base64: screenshot.toString("base64"), targets: textTargets },
    );
    await page.locator("[data-thesis-contrast-target]").evaluateAll((elements) => {
      for (const element of elements) element.removeAttribute("data-thesis-contrast-target");
    });

    for (const [index, target] of textTargets.entries()) {
      const foreground = parseColour(target.foreground);
      if (!foreground) {
        failures += 1;
        console.log(
          `FAIL ${viewport.name} movement ${chapter} could not parse ${target.foreground}`,
        );
        continue;
      }
      const ratios = (backgrounds[index] ?? []).map(([r, g, b]) => {
        const background = { r, g, b, a: 1 };
        return contrast(
          foreground.a < 1 ? composite(foreground, background) : foreground,
          background,
        );
      });
      report({
        viewport: `${viewport.width}x${viewport.height}`,
        mode: `dark stage ${chapter}`,
        ...target,
        ratios,
      });
    }
  }

  const readingButton = page.getByRole("button", { name: /read the words/i });
  await readingButton.click();
  await page.locator("dialog[open]").waitFor();
  const readingTargets = await page.locator("dialog[open]").evaluate((dialog) => {
    const targets = [];
    const candidates = [...dialog.querySelectorAll("*")].filter((element) =>
      [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      ),
    );
    const seen = new Set();
    for (const element of candidates) {
      if (seen.has(element) || element.closest('[aria-hidden="true"]')) continue;
      seen.add(element);
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      targets.push({
        label: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 64),
        foreground: style.color,
        background: getComputedStyle(dialog).backgroundColor,
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: Number.parseFloat(style.fontWeight) || 400,
      });
    }
    return targets;
  });
  for (const target of readingTargets) {
    const foreground = parseColour(target.foreground);
    const background = parseColour(target.background);
    if (!foreground || !background) {
      failures += 1;
      console.log(`FAIL ${viewport.name} reading view could not parse a computed colour`);
      continue;
    }
    report({
      viewport: `${viewport.width}x${viewport.height}`,
      mode: "light reading",
      ...target,
      ratios: [
        contrast(foreground.a < 1 ? composite(foreground, background) : foreground, background),
      ],
    });
  }
  await page.keyboard.press("Escape");
  await context.close();
}

await browser.close();
console.log(
  `Thesis contrast audit: ${failures ? `${failures} failure(s)` : "all sampled checks passed"} across ${auditedTextNodes} text nodes`,
);
process.exitCode = failures ? 1 : 0;
