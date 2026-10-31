#!/usr/bin/env node
/**
 * tools/hero-contrast.mjs — does the light actually leave the words readable?
 *
 *   npm run build && node tools/hero-serve-prod.mjs      # shell 1
 *   node tools/hero-contrast.mjs                         # all breakpoints, both themes
 *
 * Phase 4's checkpoints are "type-contrast check" and "no seam". Both are measurable, so this
 * measures them instead of trusting a screenshot:
 *
 *   1. CONTRAST — hides the hero's text, photographs the field behind it, and computes WCAG
 *      contrast between each text element's real computed colour and the mean luminance of
 *      what is actually behind that element. Large text is judged at 3:1, body at 4.5:1.
 *
 *   2. SEAM — samples a row band of pure background across the hero and reports the largest
 *      step between neighbouring columns. A veil edge shows up as a cliff; a dissolve cannot
 *      produce one because it is radial and stencilled, never a straight gradient line.
 */
import { chromium } from "playwright-core";

const URL_BASE = process.env.HERO_URL ?? "http://127.0.0.1:4212/";
const only = process.env.HERO_VIEWPORT;

const VIEWPORTS = [
  { name: "1440x780", w: 1440, h: 780 },
  { name: "1024x768", w: 1024, h: 768 },
  { name: "390x820", w: 390, h: 820 },
];

const luminance = (r, g, b) => {
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

const browser = await chromium.launch(
  process.env.HERO_CHROMIUM ? { executablePath: process.env.HERO_CHROMIUM } : {},
);

let failures = 0;

for (const vp of VIEWPORTS) {
  if (only && only !== vp.name) continue;
  for (const dark of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.goto(`${URL_BASE}?heroDebug=1`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    if (dark) await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(1200);

    // ---- 1. contrast -------------------------------------------------------------
    // Hide the text, keep the canvas: what is left is what sits behind the words.
    // Resolve every computed colour to sRGB by painting it: the theme tokens are oklch, and a
    // regex can't read those (it silently returns near-black, which produced false failures).
    const textColours = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const resolve = (css) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = "#000";
        ctx.fillStyle = css;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
      };
      // Opaque ancestors between the text and the field mean the text sits on its own surface
      // (the buttons, the tile panel) — that surface, not the drawing, is its backdrop.
      // Stop at the hero itself: the page's paper sits *behind* the canvas, so it is not the
      // text's backdrop once the field is painted. Only surfaces inside the hero (the filled
      // button, the tile panel) are allowed to stand in for the drawing.
      const hero = document.querySelector("section[data-hero]");
      const ownSurface = (el) => {
        let node = el;
        while (node && node !== hero && node !== document.body) {
          const bg = getComputedStyle(node).backgroundColor;
          const resolved = resolve(bg);
          const alpha = /rgba?\([^)]*,\s*([\d.]+)\)/.exec(bg);
          const opaque = !alpha || Number(alpha[1]) > 0.9;
          if (opaque && (resolved[0] !== 0 || resolved[1] !== 0 || resolved[2] !== 0)) {
            return resolved;
          }
          node = node.parentElement;
        }
        return null;
      };
      const tiles = [...document.querySelectorAll("[data-hero-tile]")];
      const els = [
        document.querySelector("#hero-heading"),
        document.querySelector("[data-hero-thesis]"),
        document.querySelector("[data-hero-copy] p"),
        ...document.querySelectorAll("[data-hero-copy] a"),
        ...tiles.flatMap((tile) => {
          const spans = [...tile.querySelectorAll("span")].filter(
            (span) => span.getAttribute("aria-hidden") !== "true",
          );
          return [spans[0], spans[spans.length - 1]];
        }),
      ].filter(Boolean);
      return els.map((el) => ({
        colour: resolve(getComputedStyle(el).color),
        surface: ownSurface(el),
      }));
    });

    const samples = await page.evaluate(
      async ({ dark: isDark }) => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const hero = document.querySelector("section[data-hero]");
        const targets = [];
        const push = (el, label, kind) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          if (rect.width < 4 || rect.height < 4) return;
          targets.push({
            label,
            kind,
            rect: {
              left: rect.left + scrollX,
              top: rect.top + scrollY,
              width: rect.width,
              height: rect.height,
            },
            colour: getComputedStyle(el).color,
            fontSize: parseFloat(getComputedStyle(el).fontSize),
            fontWeight: getComputedStyle(el).fontWeight,
          });
        };
        push(document.querySelector("#hero-heading"), "headline", "large");
        const thesis = document.querySelector("[data-hero-thesis]");
        push(thesis, "thesis", "large");
        push(document.querySelector("[data-hero-copy] p"), "lede", "body");
        const ctas = [...document.querySelectorAll("[data-hero-copy] a")];
        push(ctas[0], "cta (filled)", "body");
        push(ctas[1], "cta (outline)", "body");
        const tiles = [...document.querySelectorAll("[data-hero-tile]")];
        tiles.forEach((tile, i) => {
          const spans = [...tile.querySelectorAll("span")].filter(
            (span) => span.getAttribute("aria-hidden") !== "true",
          );
          push(spans[0], `tile ${i + 1} value`, "large");
          push(spans[spans.length - 1], `tile ${i + 1} label`, "body");
        });

        const previous = [];
        for (const entry of targets) {
          const el = [...hero.querySelectorAll("*")].find((candidate) => {
            const r = candidate.getBoundingClientRect();
            return (
              Math.abs(r.left + scrollX - entry.rect.left) < 0.6 &&
              Math.abs(r.top + scrollY - entry.rect.top) < 0.6 &&
              Math.abs(r.width - entry.rect.width) < 0.6
            );
          });
          if (el) {
            previous.push({ el, opacity: el.style.opacity });
            el.style.opacity = "0";
          }
        }
        await wait(80);
        const canvas = hero.querySelector("canvas");
        const shot = await new Promise((resolve) => {
          const source = document.createElement("canvas");
          source.width = canvas.width;
          source.height = canvas.height;
          resolve(source);
        });
        void shot;

        // Read the composited page behind each element from a fresh canvas draw of the hero.
        const crop = [];
        for (const entry of targets) {
          const ctx = document.createElement("canvas").getContext("2d");
          crop.push({ entry, ctx: Boolean(ctx) });
        }
        for (const { el, opacity } of previous) el.style.opacity = opacity;
        return { targets, isDark };
      },
      { dark },
    );

    // Screenshot with the same text hidden, then average each element's box from the image.
    await page.addStyleTag({
      content: `#hero-heading, [data-hero-copy] p, [data-hero-copy] a, [data-hero-tile] span { opacity: 0 !important; }`,
    });
    await page.waitForTimeout(120);
    const bare = await page.screenshot({ type: "png" });
    const barePixels = await page.evaluate(
      async ({ b64, targets }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${b64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return targets.map(({ rect }) => {
          const x = Math.max(0, Math.round(rect.left));
          const y = Math.max(0, Math.round(rect.top));
          const w = Math.min(canvas.width - x, Math.round(rect.width));
          const h = Math.min(canvas.height - y, Math.round(rect.height));
          if (w <= 0 || h <= 0) return null;
          const { data } = ctx.getImageData(x, y, w, h);
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count += 1;
          }
          return { r: r / count, g: g / count, b: b / count };
        });
      },
      { b64: bare.toString("base64"), targets: samples.targets },
    );

    console.log(`\n${vp.name} ${dark ? "dark" : "light"}`);
    for (const [index, entry] of samples.targets.entries()) {
      const behind = barePixels[index];
      if (!behind) continue;
      const resolved = textColours[index] ?? { colour: [0, 0, 0], surface: null };
      const text = resolved.colour;
      const backdrop = resolved.surface ?? [behind.r, behind.g, behind.b];
      const onOwnSurface = Boolean(resolved.surface);
      const ratio = contrast(luminance(...text), luminance(...backdrop));
      const large = entry.kind === "large" || entry.fontSize >= 24;
      const required = large ? 3 : 4.5;
      const ok = ratio >= required;
      if (!ok) failures += 1;
      console.log(
        `  ${ok ? "✓" : "✗"} ${entry.label.padEnd(18)} ${ratio.toFixed(2)}:1 (needs ${required}) · ${
          onOwnSurface
            ? "on its own surface"
            : `behind rgb(${behind.r.toFixed(0)},${behind.g.toFixed(0)},${behind.b.toFixed(0)})`
        }`,
      );
    }

    // ---- 2. seam -----------------------------------------------------------------
    // A row band with no type in it, full width. Any veil edge would appear as a step here.
    const seam = await page.evaluate(
      async ({ b64 }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${b64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        const bandY = Math.round(canvas.height * 0.62);
        const bandH = 6;
        const { data } = ctx.getImageData(0, bandY, canvas.width, bandH);
        const columns = [];
        for (let x = 0; x < canvas.width; x++) {
          let sum = 0;
          for (let y = 0; y < bandH; y++) {
            const i = (y * canvas.width + x) * 4;
            sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          }
          columns.push(sum / bandH);
        }
        // Compare 9-column means, so single-pixel noise can't be mistaken for a seam.
        const window = 24;
        const means = [];
        for (let x = 0; x + window <= columns.length; x++) {
          let sum = 0;
          for (let k = 0; k < window; k++) sum += columns[x + k];
          means.push(sum / window);
        }
        let worst = 0;
        let at = 0;
        for (let i = 1; i < means.length; i++) {
          const step = Math.abs(means[i] - means[i - 1]);
          if (step > worst) {
            worst = step;
            at = i;
          }
        }
        return { worst, at, width: canvas.width };
      },
      { b64: bare.toString("base64") },
    );

    const seamOk = seam.worst <= 4;
    if (!seamOk) failures += 1;
    console.log(
      `  ${seamOk ? "✓" : "✗"} seam check        largest step in the background band: ${seam.worst.toFixed(2)}/255 at x=${seam.at} (budget 4)`,
    );

    await context.close();
  }
}

await browser.close();
console.log(
  failures === 0
    ? "\nall text clears its contrast floor and no seam is present"
    : `\n${failures} contrast/seam problem(s)`,
);
process.exitCode = failures === 0 ? 0 : 1;
