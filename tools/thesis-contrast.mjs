#!/usr/bin/env node
/**
 * Sample the contrast of the native thesis reader against its actual optical background.
 *
 *   pnpm dev --host 0.0.0.0
 *   THESIS_URL=http://127.0.0.1:5173/thesis node tools/thesis-contrast.mjs
 *   THESIS_CHROMIUM=/path/to/chromium THESIS_URL=... node tools/thesis-contrast.mjs
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
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const composite = (foreground, background) => ({
  r: foreground.r * foreground.a + background.r * (1 - foreground.a),
  g: foreground.g * foreground.a + background.g * (1 - foreground.a),
  b: foreground.b * foreground.a + background.b * (1 - foreground.a),
  a: 1,
});

function report({ viewport, section, label, foreground, fontSize, fontWeight, ratios }) {
  const large = fontSize >= 24 || (fontSize >= 18.67 && fontWeight >= 700);
  const minimum = large ? 3 : 4.5;
  const sorted = ratios.filter(Number.isFinite).sort((a, b) => a - b);
  const ratio = sorted.length ? sorted[Math.floor((sorted.length - 1) * 0.05)] : 0;
  const pass = sorted.length > 0 && ratio >= minimum;
  auditedTextNodes += 1;
  if (!pass) failures += 1;
  console.log(
    `${pass ? "PASS" : "FAIL"} ${viewport} section ${section} ${JSON.stringify(label)} · ` +
      `${ratio.toFixed(2)}:1 (minimum ${minimum.toFixed(2)}:1; ${fontSize}px ${fontWeight}; ${foreground})`,
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

  const sections = page.locator(".flow-opening, .flow-movement, .flow-closing");
  for (let section = 0; section < (await sections.count()); section++) {
    await sections.nth(section).scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const targets = await sections.nth(section).evaluate((root) => {
      const candidates = [
        ...root.querySelectorAll("h1,h2,h3,p,a,.flow-kicker,.flow-chapter-label"),
      ];
      return candidates.flatMap((element, index) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return [];
        const range = document.createRange();
        range.selectNodeContents(element);
        const rects = [...range.getClientRects()]
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => ({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }));
        if (!rects.length) return [];
        const id = `${index}`;
        element.setAttribute("data-thesis-contrast-target", id);
        return [
          {
            id,
            label: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 64),
            foreground: style.color,
            fontSize: Number.parseFloat(style.fontSize),
            fontWeight: Number.parseFloat(style.fontWeight) || 400,
            rects,
          },
        ];
      });
    });
    await page.addStyleTag({
      content:
        "[data-thesis-contrast-target] { color: transparent !important; text-shadow: none !important; }",
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
        return targets.map(({ rects }) =>
          rects.flatMap((rect) => {
            const x = Math.max(0, Math.floor(rect.left * scaleX));
            const y = Math.max(0, Math.floor(rect.top * scaleY));
            const right = Math.min(image.width, Math.ceil((rect.left + rect.width) * scaleX));
            const bottom = Math.min(image.height, Math.ceil((rect.top + rect.height) * scaleY));
            if (right <= x || bottom <= y) return [];
            const pixels = context.getImageData(x, y, right - x, bottom - y).data;
            const values = [];
            for (let index = 0; index < pixels.length; index += 4)
              values.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
            return values;
          }),
        );
      },
      { base64: screenshot.toString("base64"), targets },
    );
    await page.locator("[data-thesis-contrast-target]").evaluateAll((elements) => {
      for (const element of elements) element.removeAttribute("data-thesis-contrast-target");
    });

    for (const [index, target] of targets.entries()) {
      const foreground = parseColour(target.foreground);
      if (!foreground) {
        failures += 1;
        console.log(
          `FAIL ${viewport.name} section ${section} could not parse ${target.foreground}`,
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
      report({ viewport: `${viewport.width}x${viewport.height}`, section, ...target, ratios });
    }
  }
  await context.close();
}

await browser.close();
console.log(
  `Thesis contrast audit: ${failures ? `${failures} failure(s)` : "all sampled checks passed"} across ${auditedTextNodes} text nodes`,
);
process.exitCode = failures ? 1 : 0;
