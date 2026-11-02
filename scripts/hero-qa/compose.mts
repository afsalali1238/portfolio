/**
 * compose.mts — compose the hero offline, with its real type, for design review.
 *
 *   cd scripts/hero-qa
 *   npm run compose                       # every captured layout → design/hero-phase8
 *   npm run compose -- 1440x780-dark live # one layout, mid-interaction
 *
 * Why this exists: the engine is DOM-free, so it can paint anywhere — but a still of the
 * *engine* cannot answer the questions this pass is about (does the beam read behind the
 * headline? is the type still legible over it? is the composition centred?). Those need the
 * page: paper, ink, the display serif, the paragraph, the buttons and the tiles.
 *
 * `tools/hero-qa.mjs` takes real browser screenshots, which is the better answer when a
 * browser is available. This is the same idea without one: it draws the hero's type at the
 * rects `hero-layout.ts` measured from the live page, in the page's own fonts and tokens, over
 * the engine's canvas. It is a faithful proxy, not a screenshot: line-box metrics and optical
 * margins differ by a pixel or two.
 *
 * Fonts come straight out of `node_modules/@fontsource` (node-canvas reads woff), so there is
 * nothing to install and no absolute path to break.
 */
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHeroRay } from "../../src/components/sections/hero-ray.ts";
import type { LayoutSnapshot } from "../../src/components/sections/hero-layout.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../..");
const PHASE = process.env.HERO_PHASE ?? "10";
const outDir = join(repo, `design/hero-phase${PHASE}`);
mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------ fonts */
const FONT_FILES = [
  ["@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff", "Instrument Serif"],
  [
    "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff",
    "Instrument Serif Italic",
  ],
  ["@fontsource/inter/files/inter-latin-400-normal.woff", "Inter"],
  ["@fontsource/inter/files/inter-latin-500-normal.woff", "Inter Medium"],
  ["@fontsource/inter/files/inter-latin-600-normal.woff", "Inter SemiBold"],
] as const;
for (const [file, family] of FONT_FILES) {
  GlobalFonts.registerFromPath(join(repo, "node_modules", file), family);
}

/* ------------------------------------------- the page's tokens, oklch → rgb */
const oklch = (L: number, C: number, hDeg: number) => {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const cube = (v: number) => v ** 3;
  const l = cube(L + 0.3963377774 * a + 0.2158037573 * b);
  const m = cube(L - 0.1055613458 * a - 0.0638541728 * b);
  const s = cube(L - 0.0894841775 * a - 1.291485548 * b);
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const encode = (v: number) => {
    const c = Math.max(0, Math.min(1, v));
    return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
  };
  return `rgb(${lin.map(encode).join(",")})`;
};

const theme = (dark: boolean) => ({
  paper: dark ? oklch(0.15, 0.012, 60) : oklch(0.972, 0.008, 90),
  paperDeep: dark ? oklch(0.18, 0.012, 60) : oklch(0.945, 0.012, 88),
  ink: dark ? oklch(0.97, 0.008, 90) : oklch(0.18, 0.012, 60),
  inkSoft: dark ? oklch(0.8, 0.01, 80) : oklch(0.32, 0.012, 60),
  inkThesis: dark ? oklch(0.71, 0.01, 75) : oklch(0.52, 0.012, 60),
  inkMute: dark ? oklch(0.6, 0.01, 70) : oklch(0.52, 0.012, 60),
  rule: dark ? oklch(0.25, 0.01, 60) : oklch(0.82, 0.008, 88),
});

/** Type sizes per breakpoint, read off the Tailwind classes in Hero.tsx. */
const displayScale = (heroW: number) => {
  if (heroW >= 1280) return { h1: 108.8, thesis: 54.4 };
  if (heroW >= 1024) return { h1: 96, thesis: 52.8 };
  if (heroW >= 768) return { h1: 88, thesis: 51.2 };
  return { h1: heroW * 0.12, thesis: heroW * 0.075 };
};

type Rect = { left: number; top: number; right: number; bottom: number };

const baselineOf = (ctx: SKRSContext2D, font: string, rect: Rect) => {
  ctx.font = font;
  const m = ctx.measureText("Ay");
  const ascent = m.fontBoundingBoxAscent ?? 0;
  const descent = m.fontBoundingBoxDescent ?? 0;
  return rect.top + (rect.bottom - rect.top - (ascent + descent)) / 2 + ascent;
};

/** Draw the hero's type at the measured rects. */
const drawType = (ctx: SKRSContext2D, layout: LayoutSnapshot, dark: boolean) => {
  const t = theme(dark);
  const mobile = layout.heroW < 768;
  const scale = displayScale(layout.heroW);
  const [h1, thesis, lede, cta] = layout.textRects;
  if (!h1 || !thesis) return;

  const headlineFont = `${scale.h1}px "Instrument Serif"`;
  ctx.font = headlineFont;
  ctx.fillStyle = t.ink;
  ctx.fillText("For the tech.", h1.left, baselineOf(ctx, headlineFont, h1));

  const thesisFont = `italic ${scale.thesis}px "Instrument Serif Italic"`;
  ctx.font = thesisFont;
  ctx.fillStyle = t.inkThesis;
  ctx.fillText("Not because anyone asked.", thesis.left, layout.thesisLine.baselineY);

  if (lede) {
    const size = mobile ? 16 : 18;
    const font = `${size}px Inter`;
    ctx.font = font;
    ctx.fillStyle = t.inkSoft;
    const copy =
      "Documenting what happens when the wall between having an idea and building it disappears. Twelve quiet tools, public code, and honest field notes.";
    const lineHeight = size * 1.625;
    const first = lede.top + size * 1.06;
    let line = "";
    let row = 0;
    for (const word of copy.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > lede.right - lede.left && line) {
        ctx.fillText(line, lede.left, first + row * lineHeight);
        row += 1;
        line = word;
      } else line = next;
    }
    ctx.fillText(line, lede.left, first + row * lineHeight);
  }

  if (cta) {
    const button = (label: string, x: number, w: number, primary: boolean) => {
      const top = cta.top + 8;
      const h = cta.bottom - cta.top - 8;
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(x + r, top);
      ctx.arcTo(x + w, top, x + w, top + h, r);
      ctx.arcTo(x + w, top + h, x, top + h, r);
      ctx.arcTo(x, top + h, x, top, r);
      ctx.arcTo(x, top, x + w, top, r);
      ctx.closePath();
      ctx.fillStyle = primary ? t.ink : t.paper;
      ctx.fill();
      if (!primary) {
        ctx.strokeStyle = t.rule;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.font = `500 14px "Inter Medium"`;
      ctx.fillStyle = primary ? t.paper : t.ink;
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + 20, top + h / 2 + 1);
      ctx.textBaseline = "alphabetic";
    };
    if (mobile) {
      button("See the builds", cta.left, cta.right - cta.left, true);
      button("Read the notes", cta.left, cta.right - cta.left, false);
    } else {
      button("See the builds", cta.left, 168, true);
      button("Read the notes", cta.left + 180, 170, false);
    }
  }

  if (layout.tiles.length) {
    const [first, , third] = layout.tiles;
    const top = Math.min(...layout.tiles.map((x) => x.top)) - 24;
    const bottom = Math.max(...layout.tiles.map((x) => x.bottom)) + 24;
    const left = Math.max(0, first.cx - first.width / 2 - 16);
    const right = layout.tiles[layout.tiles.length - 1].cx + third.width / 2;
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    // The tiles sit on `bg-paper/90 backdrop-blur`; over the plate that blends to paper-deep.
    ctx.fillStyle = t.paperDeep;
    ctx.fill();
    ctx.strokeStyle = t.rule;
    ctx.lineWidth = 1;
    ctx.stroke();
    const values = ["12", "9", "3", "7"];
    const labels = [
      "Total shipped",
      "Live on the internet",
      "Open source",
      "For wife, friends, me",
    ];
    layout.tiles.forEach((tile, i) => {
      ctx.font = `${mobile ? 30 : 36}px "Instrument Serif"`;
      ctx.fillStyle = t.ink;
      ctx.fillText(values[i], tile.cx - tile.width / 2 + 14, tile.top + 34);
      ctx.font = `500 ${mobile ? 11 : 12}px "Inter Medium"`;
      ctx.fillStyle = t.inkMute;
      ctx.fillText(labels[i], tile.cx - tile.width / 2 + 14, tile.bottom - 12);
    });
  }
};

/* ------------------------------------------------------------------- main */
const [, , only, modeArg = "still", outArg] = process.argv;
const layouts = only
  ? [{ name: only }]
  : [{ name: "1440x780" }, { name: "1440x780-dark" }, { name: "1024x768" }, { name: "390x820" }];

for (const entry of layouts) {
  const capture = JSON.parse(readFileSync(join(here, "data", `layout-${entry.name}.json`), "utf8"));
  const layout: LayoutSnapshot = capture.layout;
  const dark = process.env.REVIEW_DARK ? process.env.REVIEW_DARK === "1" : Boolean(capture.dark);
  const W = Math.round(layout.heroW);
  const H = Math.round(layout.heroH);

  const ray = createHeroRay();
  ray.setTheme(dark);
  ray.setLayout(layout);

  const layer = createCanvas(W, H);
  const layerCtx = layer.getContext("2d") as never;

  if (modeArg === "live") {
    // Park the pointer just inside the entry facet: the optical response at its most visible.
    const g = ray.geometry();
    ray.setPointer((g.topV.x + g.leftV.x) / 2 + 40, (g.topV.y + g.leftV.y) / 2 + 60, true);
    for (let i = 0; i < 150; i++) ray.paint(layerCtx, 16);
  } else if (modeArg === "scroll") {
    ray.setScroll(1);
    ray.setTime(3.0);
    for (let i = 0; i < 100; i++) ray.paint(layerCtx, 16);
  } else {
    ray.paintStill(layerCtx);
  }

  const out = createCanvas(W, H);
  const ctx = out.getContext("2d") as unknown as SKRSContext2D;
  ctx.fillStyle = theme(dark).paper;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(layer, 0, 0);
  drawType(ctx, layout, dark);

  const suffix = modeArg === "still" ? "" : `-${modeArg}`;
  const outPath = outArg ?? join(outDir, `phase${PHASE}-page-${entry.name}${suffix}.png`);
  writeFileSync(outPath, out.toBuffer("image/png"));
  console.log(`wrote ${outPath}`);
}
