#!/usr/bin/env node
/**
 * tools/hero-contrast.mjs — does the light actually leave the words readable?
 *
 *   npm run build && node tools/hero-serve-prod.mjs      # shell 1
 *   node tools/hero-contrast.mjs                         # all breakpoints, both themes
 *
 * Measures two things instead of trusting a screenshot:
 *
 *   1. CONTRAST — hides the hero's text, photographs the field behind it, and computes WCAG
 *      contrast between each text element's real computed colour and the mean luminance of
 *      what is actually behind that element. Resting large text is judged at 3:1 and body at
 *      4.5:1. Desktop layouts are also audited after `aimSourcePreset("right")` settles, with
 *      a strict 4.5:1 floor on the headline, thesis, lede and stat tiles under the leftward fan.
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

/** Average the composited page behind each target box from a text-hidden screenshot. */
const readBackdrops = async (page, targets) => {
  const shot = await page.screenshot({ type: "png" });
  return page.evaluate(
    async ({ b64, boxes }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${b64}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      return boxes.map(({ rect }) => {
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
    { b64: shot.toString("base64"), boxes: targets },
  );
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

    // Resolve every computed colour to sRGB by painting it: the theme tokens are oklch, and a
    // regex can't read those. Opaque ancestors inside the hero (filled button, tile panel)
    // stand in for the drawing as the text's real backdrop.
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

    const targets = await page.evaluate(() => {
      const out = [];
      const push = (el, label, kind) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width < 4 || rect.height < 4) return;
        out.push({
          label,
          kind,
          rect: {
            left: rect.left + scrollX,
            top: rect.top + scrollY,
            width: rect.width,
            height: rect.height,
          },
          fontSize: parseFloat(getComputedStyle(el).fontSize),
        });
      };
      push(document.querySelector("#hero-heading"), "headline", "large");
      push(document.querySelector("[data-hero-thesis]"), "thesis", "large");
      push(document.querySelector("[data-hero-copy] p"), "lede", "body");
      const ctas = [...document.querySelectorAll("[data-hero-copy] a")];
      push(ctas[0], "cta (filled)", "body");
      push(ctas[1], "cta (outline)", "body");
      [...document.querySelectorAll("[data-hero-tile]")].forEach((tile, i) => {
        const spans = [...tile.querySelectorAll("span")].filter(
          (span) => span.getAttribute("aria-hidden") !== "true",
        );
        push(spans[0], `tile ${i + 1} value`, "large");
        push(spans[spans.length - 1], `tile ${i + 1} label`, "body");
      });
      return out;
    });

    // Hide the text once; both resting and pinned audits photograph the same boxes.
    await page.addStyleTag({
      content: `#hero-heading, [data-hero-thesis], [data-hero-copy] p, [data-hero-copy] a, [data-hero-tile] span { opacity: 0 !important; }`,
    });
    await page.waitForTimeout(120);

    const report = (label, backdrops, strict) => {
      console.log(`\n${vp.name} ${dark ? "dark" : "light"} · ${label}`);
      for (const [index, entry] of targets.entries()) {
        const behind = backdrops[index];
        if (!behind) continue;
        const resolved = textColours[index] ?? { colour: [0, 0, 0], surface: null };
        const backdrop = resolved.surface ?? [behind.r, behind.g, behind.b];
        const ratio = contrast(luminance(...resolved.colour), luminance(...backdrop));
        const large = entry.kind === "large" || entry.fontSize >= 24;
        const required = strict ? 4.5 : large ? 3 : 4.5;
        const ok = ratio >= required;
        if (!ok) failures += 1;
        console.log(
          `  ${ok ? "✓" : "✗"} ${entry.label.padEnd(18)} ${ratio.toFixed(2)}:1 (needs ${required}) · ${
            resolved.surface
              ? "on its own surface"
              : `behind rgb(${behind.r.toFixed(0)},${behind.g.toFixed(0)},${behind.b.toFixed(0)})`
          }`,
        );
      }
    };

    const restingBackdrops = await readBackdrops(page, targets);
    report("rest", restingBackdrops, false);

    // Opposite-side regression: a right-pinned source throws the fan across the copy column.
    // Give the full ignition choreography time to reach fieldLight() === 1 before measuring.
    if (vp.w >= 1024) {
      await page.evaluate(() => {
        const ray = window.__heroRay;
        if (!ray?.aimSourcePreset) throw new Error("debug engine unavailable");
        ray.aimSourcePreset("right");
      });
      await page.waitForTimeout(950);
      const pinned = await page.evaluate(() => {
        const state = window.__heroRay.geometry().interaction;
        return {
          ok:
            state.sourcePlacement.pinned &&
            state.sourcePlacement.facet === "right" &&
            state.optics?.exitFacet === "left" &&
            state.sourcePlacement.light === 1,
          facet: state.sourcePlacement.facet,
          exit: state.optics?.exitFacet,
          light: state.sourcePlacement.light,
        };
      });
      if (!pinned.ok) {
        failures += 1;
        console.log(`  ✗ right-pinned audit did not settle: ${JSON.stringify(pinned)}`);
      }
      const pinnedBackdrops = await readBackdrops(page, targets);
      report("right-pinned leftward fan", pinnedBackdrops, true);
    }

    // Seam: a row band with no type in it, full width, on the resting page plate.
    await page.evaluate(() => window.__heroRay?.resetSource?.());
    await page.waitForTimeout(950);
    const restingShot = await page.screenshot({ type: "png" });
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
        // Compare 24-column means so single-pixel noise is not mistaken for a seam.
        const windowSize = 24;
        const means = [];
        for (let x = 0; x + windowSize <= columns.length; x++) {
          let sum = 0;
          for (let k = 0; k < windowSize; k++) sum += columns[x + k];
          means.push(sum / windowSize);
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
        return { worst, at };
      },
      { b64: restingShot.toString("base64") },
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
