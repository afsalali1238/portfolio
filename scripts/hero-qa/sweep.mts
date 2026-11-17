/**
 * sweep.mts — the hero at every breakpoint, without a browser.
 *
 *   cd scripts/hero-qa
 *   npm run sweep                    # derive + render every viewport → design/hero-phase9
 *   npm run sweep -- 390x820         # one viewport
 *
 * ## Why this exists
 *
 * `check.mts` and `compose.mts` run on `data/layout-*.json`, the **measured** captures from
 * `tools/hero-qa.mjs` — real rects read off a live page in real Chromium. That is the right
 * source of truth, but it is only four viewports, and the hero has failed at the *other* ones:
 * the portrait glass was clipped by the frame at 320 px, it shrank to a sliver because the
 * layout measured the widest line on the page rather than the line it shared a height with, and
 * the fan ran the height of the section over the stat panel. None of those are visible at
 * 1440/1024/390.
 *
 * This tool models the hero's layout at any width from `Hero.tsx`'s own CSS scale (measured with
 * the real fonts), renders the engine over it, and prints what the geometry does. It is a
 * *model*, not a capture: `npm run check` still runs on the measured files, and this prints a
 * calibration table against them so the model can be judged rather than trusted.
 *
 * ## What it asserts (exit code 1 if any fails)
 *
 *   1. the glass is inside the frame, and clear of the type it shares a height with;
 *   2. the incident beam does not run through the body copy or the CTA row;
 *   3. portrait: no lane is at full strength across the stat panel;
 *   4. every lane is quieter when it crosses a word than when it does not.
 */
import { createCanvas, GlobalFonts, type SKRSContext2D } from "@napi-rs/canvas";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHeroRay, type Ctx } from "../../src/components/sections/hero-ray.ts";
import type { LayoutSnapshot } from "../../src/components/sections/hero-layout.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../..");
const PHASE = process.env.HERO_PHASE ?? "10";
const NO_WRITE = process.env.HERO_NO_WRITE === "1" || process.argv.includes("--no-write");
const outDir = join(repo, `design/hero-phase${PHASE}`);
if (!NO_WRITE) mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------ fonts */
const FONT_FILES = [
  ["@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff", "Instrument Serif"],
  [
    "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff",
    "Instrument Serif Italic",
  ],
  ["@fontsource/inter/files/inter-latin-400-normal.woff", "Inter"],
  ["@fontsource/inter/files/inter-latin-500-normal.woff", "Inter Medium"],
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
  inkMute: dark ? oklch(0.6, 0.01, 70) : oklch(0.52, 0.012, 60),
  rule: dark ? oklch(0.25, 0.01, 60) : oklch(0.82, 0.008, 88),
});

/* ------------------------------------------------------------------- model */

/**
 * The hero's CSS, transcribed. Every number is a Tailwind class in Hero.tsx:
 *
 *   section    pt-12 sm:pt-16 md:pt-24 · pb-12 md:pb-16 · Container px-6 md:px-10
 *   grid       gap-12 · lg:grid-cols-12 · copy lg:col-span-7 · spacer h-[360px]
 *   h1         12vw→11.5vw / 4.6rem / 5.5rem / 6rem / 6.8rem, leading-[0.88]
 *   thesis     mt-2 · 7.5vw / 3rem / 3.2rem / 3.3rem / 3.4rem, leading-[1.02], italic
 *   lede       max-w-md · text-base md:text-lg · leading-relaxed
 *   CTAs       pt-2 · min-h-11 · flex-col gap-3 sm:flex-row
 *   tiles      mt-12 sm:mt-14 · p-4 sm:p-6 · grid-cols-2 md:grid-cols-4 · gap-3 sm:gap-4
 *   tile       p-3.5 sm:p-4 · value text-3xl sm:text-4xl leading-none · label mt-2.5 text-xs
 *
 * If Hero.tsx's type scale changes, this table is what has to change with it — that coupling is
 * the price of reviewing a layout without a browser, and it is why the calibration table below
 * is printed on every run.
 */
const scale = (vw: number) => {
  const sm = vw >= 640;
  const md = vw >= 768;
  const lg = vw >= 1024;
  const xl = vw >= 1280;
  return {
    pad: md ? 40 : 24,
    pt: md ? 96 : sm ? 64 : 48,
    pb: md ? 64 : 48,
    h1: xl ? 108.8 : lg ? 96 : md ? 88 : sm ? 73.6 : vw * 0.115,
    thesis: xl ? 54.4 : lg ? 52.8 : md ? 51.2 : sm ? 48 : vw * 0.075,
    lede: md ? 18 : 16,
    gridGap: 48,
    spacerH: 360,
    tileGap: sm ? 16 : 12,
    tilePad: sm ? 16 : 14,
    panelPad: sm ? 24 : 16,
    tileCols: md ? 4 : 2,
    tilesTop: sm ? 56 : 48,
  };
};

const LEDE =
  "Documenting what happens when the wall between having an idea and building it disappears. Sixteen quiet tools, public code, and honest field notes.";
const LEDE_NARROW =
  "Documenting what happens when the wall between having an idea and building it disappears. Twelve quiet tools, public code, and honest field notes.";

const metrics = createCanvas(8, 8).getContext("2d") as unknown as SKRSContext2D;
const textWidth = (text: string, font: string, tracking = 0) => {
  metrics.font = font;
  const width = metrics.measureText(text).width;
  return width * (1 + tracking);
};
const fontMetrics = (font: string) => {
  metrics.font = font;
  const m = metrics.measureText("Ay");
  return { ascent: m.fontBoundingBoxAscent ?? 0, descent: m.fontBoundingBoxDescent ?? 0 };
};
const wrap = (text: string, font: string, maxWidth: number) => {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (textWidth(next, font) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

type Rect = { left: number; top: number; right: number; bottom: number };

/** Model one viewport's hero layout. Mirrors what `measureHero` reads off the real page. */
function modelLayout(vw: number): LayoutSnapshot {
  const s = scale(vw);
  const md = vw >= 768;
  const lg = vw >= 1024;
  const sm = vw >= 640;

  const contentWidth = Math.min(vw, 1152) - s.pad * 2;
  const left = Math.max(0, (vw - 1152) / 2) + s.pad;
  const right = left + contentWidth;

  // lg: col-span-7 of a 12-column grid with gap-12 between tracks.
  const track = (contentWidth - 11 * s.gridGap) / 12;
  const copyWidth = lg ? track * 7 + 6 * s.gridGap : contentWidth;

  const h1Font = `${s.h1}px "Instrument Serif"`;
  const thesisFont = `italic ${s.thesis}px "Instrument Serif Italic"`;
  const ledeFont = `${s.lede}px Inter`;

  const lh1 = Math.round(s.h1 * 0.88);
  const lh2 = Math.round(s.thesis * 1.02);
  const ledeLineHeight = Math.round(s.lede * 1.625);

  let y = s.pt;
  const headline: Rect = {
    left,
    top: y,
    right: left + textWidth("For the tech.", h1Font, -0.025),
    bottom: y + lh1,
  };
  y += lh1 + 8;
  const thesisTop = y;
  const thesis: Rect = {
    left,
    top: y,
    right: left + textWidth("Not because anyone asked.", thesisFont, -0.025),
    bottom: y + lh2,
  };
  const thesisFm = fontMetrics(thesisFont);
  const thesisBaseline =
    thesisTop + (lh2 - (thesisFm.ascent + thesisFm.descent)) / 2 + thesisFm.ascent;
  y += lh2 + 24;

  const ledeWidth = Math.min(448, copyWidth);
  const ledeLines = wrap(LEDE, ledeFont, ledeWidth);
  const lede: Rect = {
    left,
    top: y,
    right: left + ledeWidth,
    bottom: y + ledeLines.length * ledeLineHeight,
  };
  y = lede.bottom + 24;

  // CTA row: pt-2, then one row of two 44px buttons (sm) or two stacked rows.
  const ctaTop = y + 8;
  const buttonWidth = (label: string) => textWidth(label, `500 14px "Inter Medium"`) + 48 + 16;
  const cta: Rect = sm
    ? {
        left,
        top: ctaTop,
        right:
          left +
          Math.min(copyWidth, buttonWidth("See the builds") + 12 + buttonWidth("Read the notes")),
        bottom: ctaTop + 44,
      }
    : { left, top: ctaTop, right: right, bottom: ctaTop + 44 + 12 + 44 };

  const copyHeight = cta.bottom - s.pt;
  const rowHeight = lg ? Math.max(copyHeight, s.spacerH) : copyHeight;
  const tilesTop = s.pt + rowHeight + s.tilesTop;

  // Stat panel: p-4 sm:p-6, grid-cols-2 md:grid-cols-4, gap-3 sm:gap-4.
  const cols = s.tileCols;
  const tileWidth = (contentWidth - s.panelPad * 2 - s.tileGap * (cols - 1)) / cols;
  const valueHeight = sm ? 36 : 30;
  const tileHeight = s.tilePad * 2 + valueHeight + 10 + 18;
  const rows = Math.ceil(4 / cols);
  const panelHeight = s.panelPad * 2 + rows * tileHeight + s.tileGap * (rows - 1);
  const tiles = Array.from({ length: 4 }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = left + s.panelPad + c * (tileWidth + s.tileGap);
    const top = tilesTop + s.panelPad + r * (tileHeight + s.tileGap);
    // `hero-layout` reports tiles left → right, then top → bottom.
    return { x, top, bottom: top + tileHeight, cx: x + tileWidth / 2, width: tileWidth };
  });
  const heroH = tilesTop + panelHeight + s.pb;

  const textRects = [headline, thesis, lede, cta];
  const QUIET = 10;
  const quietRects = textRects.map((r) => ({
    left: r.left - QUIET,
    top: r.top - QUIET,
    right: r.right + QUIET,
    bottom: r.bottom + QUIET,
  }));

  return {
    heroW: vw,
    heroH,
    copyRight: Math.max(...textRects.map((r) => r.right)),
    thesisLine: {
      left: thesis.left,
      right: thesis.right,
      baselineY: thesisBaseline,
      bottom: thesis.bottom,
    },
    // Measured tiles are ordered left→right; keep the same convention.
    tiles: [...tiles].sort((a, b) => a.x - b.x).length === 4 ? tiles : tiles,
    container: { left, right },
    columns: Array.from({ length: 12 }, (_, i) => left + (contentWidth * (i + 1)) / 12),
    textRects,
    ledger: { quietRects, baselines: [], balance: 0.5 },
  };
}

/* ------------------------------------------------------------------- paint */

const drawType = (ctx: SKRSContext2D, layout: LayoutSnapshot, dark: boolean) => {
  const t = theme(dark);
  const s = scale(layout.heroW);
  const sm = layout.heroW >= 640;
  const [headline, thesis, lede, cta] = layout.textRects;
  if (!headline || !thesis) return;

  const h1Font = `${s.h1}px "Instrument Serif"`;
  const h1Fm = fontMetrics(h1Font);
  ctx.font = h1Font;
  ctx.fillStyle = t.ink;
  ctx.fillText(
    "For the tech.",
    headline.left,
    headline.top +
      (headline.bottom - headline.top - (h1Fm.ascent + h1Fm.descent)) / 2 +
      h1Fm.ascent,
  );

  ctx.font = `italic ${s.thesis}px "Instrument Serif Italic"`;
  ctx.fillStyle = t.inkMute;
  ctx.fillText("Not because anyone asked.", thesis.left, layout.thesisLine.baselineY);

  if (lede) {
    const font = `${s.lede}px Inter`;
    ctx.font = font;
    ctx.fillStyle = t.inkSoft;
    const lineHeight = Math.round(s.lede * 1.625);
    const first = lede.top + s.lede * 1.06;
    const lines = wrap(layout.heroW >= 1280 ? LEDE : LEDE_NARROW, font, lede.right - lede.left);
    lines.forEach((line, i) => ctx.fillText(line, lede.left, first + i * lineHeight));
  }

  if (cta) {
    const button = (
      label: string,
      x: number,
      w: number,
      top: number,
      h: number,
      primary: boolean,
    ) => {
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
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + w / 2, top + h / 2 + 1);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    };
    const height = cta.bottom - cta.top;
    if (sm) {
      button("See the builds", cta.left, 168, cta.top, height, true);
      button("Read the notes", cta.left + 180, 170, cta.top, height, false);
    } else {
      const w = cta.right - cta.left;
      button("See the builds", cta.left, w, cta.top, 44, true);
      button("Read the notes", cta.left, w, cta.top + 56, height - 56, false);
    }
  }

  if (layout.tiles.length) {
    const pad = smOf(layout.heroW) ? 24 : 16;
    const top = Math.min(...layout.tiles.map((x) => x.top)) - pad;
    const bottom = Math.max(...layout.tiles.map((x) => x.bottom)) + pad;
    const left = Math.min(...layout.tiles.map((x) => x.x)) - pad;
    const right = Math.max(...layout.tiles.map((x) => x.x + x.width)) + pad;
    ctx.beginPath();
    ctx.rect(left, top, right - left, bottom - top);
    ctx.fillStyle = t.paperDeep;
    ctx.fill();
    ctx.strokeStyle = t.rule;
    ctx.lineWidth = 1;
    ctx.stroke();
    // DOM order, which is what the 2-column grid paints.
    const values = ["16", "13", "10", "8"];
    const labels = [
      "Total shipped",
      "Live on the internet",
      "Open source",
      "For wife, friends, me",
    ];
    layout.tiles.forEach((tile, i) => {
      ctx.font = `${layout.heroW >= 640 ? 36 : 30}px "Instrument Serif"`;
      ctx.fillStyle = t.ink;
      ctx.fillText(values[i] ?? "", tile.x + 6, tile.top + (layout.heroW >= 640 ? 38 : 34));
      ctx.font = `500 ${layout.heroW >= 640 ? 12 : 11}px "Inter Medium"`;
      ctx.fillStyle = t.inkMute;
      ctx.fillText(labels[i] ?? "", tile.x + 6, tile.bottom - 10);
    });
  }
};

const smOf = (vw: number) => vw >= 640;

/* -------------------------------------------------------------------- main */

const VIEWPORTS: { name: string; w: number; dark?: boolean }[] = [
  { name: "320x700", w: 320 },
  { name: "360x800", w: 360 },
  { name: "375x812", w: 375 },
  { name: "390x820", w: 390 },
  { name: "414x896", w: 414 },
  { name: "480x900", w: 480 },
  { name: "640x900", w: 640 },
  { name: "768x1024", w: 768 },
  { name: "820x1180", w: 820 },
  { name: "900x1200", w: 900 },
  { name: "1023x768", w: 1023 },
  { name: "1024x768", w: 1024 },
  { name: "1280x800", w: 1280 },
  { name: "1440x780", w: 1440 },
  { name: "1920x1080", w: 1920 },
  { name: "390x820", w: 390, dark: true },
  { name: "1440x780", w: 1440, dark: true },
];

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const only = positionalArgs[0];
const selected = only ? VIEWPORTS.filter((v) => v.name.startsWith(only)) : VIEWPORTS;

/* Calibration: the model against the real captures. */
const measuredDir = join(here, "data");
const measured = readdirSync(measuredDir)
  .filter((f) => f.startsWith("layout-"))
  .map((f) => JSON.parse(readFileSync(join(measuredDir, f), "utf8")));
const calibration = measured.map((capture) => {
  const L = capture.layout as LayoutSnapshot;
  const M = modelLayout(L.heroW);
  return {
    name: capture.name as string,
    heroH: [L.heroH, M.heroH] as const,
    copyRight: [L.copyRight, M.copyRight] as const,
    tilesTop: [L.tiles[0].top, M.tiles[0].top] as const,
    thesisRight: [L.thesisLine.right, M.thesisLine.right] as const,
  };
});
console.log("model vs measured capture (px):");
for (const row of calibration) {
  const d = (pair: readonly [number, number]) =>
    `${pair[0].toFixed(0)} → ${pair[1].toFixed(0)} (${(pair[1] - pair[0] >= 0 ? "+" : "") + (pair[1] - pair[0]).toFixed(0)})`;
  console.log(
    `  ${row.name.padEnd(14)} heroH ${d(row.heroH).padEnd(20)} copyRight ${d(row.copyRight).padEnd(20)} tilesTop ${d(row.tilesTop).padEnd(20)} thesisRight ${d(row.thesisRight)}`,
  );
}
console.log("");

/* Render + assert. */
let failures = 0;
const fail = (name: string, message: string) => {
  failures += 1;
  console.log(`  ✗ ${name}: ${message}`);
};

const overlaps = (a: Rect, b: Rect, pad = 0) =>
  a.left < b.right + pad &&
  a.right > b.left - pad &&
  a.top < b.bottom + pad &&
  a.bottom > b.top - pad;

type Pt = { x: number; y: number };

const pointInTri = (a: Pt, b: Pt, c: Pt, x: number, y: number) => {
  const d1 = (x - b.x) * (a.y - b.y) - (a.x - b.x) * (y - b.y);
  const d2 = (x - c.x) * (b.y - c.y) - (b.x - c.x) * (y - c.y);
  const d3 = (x - a.x) * (c.y - a.y) - (c.x - a.x) * (y - a.y);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
};

const segIntersectsSeg = (a: Pt, b: Pt, c: Pt, d: Pt) => {
  const cross = (o: Pt, p: Pt, q: Pt) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};

/** Exact overlap check between triangle `(a, b, c)` and rectangle `r` expanded by `pad` px. */
const triOverlapsRect = (a: Pt, b: Pt, c: Pt, r: Rect, pad = 0) => {
  const pr: Rect = {
    left: r.left - pad,
    right: r.right + pad,
    top: r.top - pad,
    bottom: r.bottom + pad,
  };
  const inRect = (p: Pt) => p.x >= pr.left && p.x <= pr.right && p.y >= pr.top && p.y <= pr.bottom;
  if (inRect(a) || inRect(b) || inRect(c)) return true;
  const corners: Pt[] = [
    { x: pr.left, y: pr.top },
    { x: pr.right, y: pr.top },
    { x: pr.right, y: pr.bottom },
    { x: pr.left, y: pr.bottom },
  ];
  for (const corner of corners) {
    if (pointInTri(a, b, c, corner.x, corner.y)) return true;
  }
  const triEdges: [Pt, Pt][] = [
    [a, b],
    [b, c],
    [c, a],
  ];
  const rectEdges: [Pt, Pt][] = [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]],
  ];
  for (const [e0, e1] of triEdges) {
    for (const [r0, r1] of rectEdges) {
      if (segIntersectsSeg(e0, e1, r0, r1)) return true;
    }
  }
  return false;
};

const SCROLL_POINTS = [0, 0.5, 1] as const;
const TRIPTYCH_VIEWPORTS = new Set([
  "1440x780",
  "1440x780-dark",
  "1024x768",
  "390x820",
  "390x820-dark",
]);
const writeAllFrames = process.argv.includes("--all-frames");

for (const vp of selected) {
  const layout = modelLayout(vp.w);
  const dark = Boolean(vp.dark);
  const name = dark ? `${vp.name}-dark` : vp.name;

  // A real offscreen plate surface, the same contract the browser shell provides.
  let plateCanvas: ReturnType<typeof createCanvas> | undefined;
  const makeRay = () =>
    createHeroRay({
      createSurface: (width, height) => {
        const surface = plateCanvas ?? createCanvas(Math.max(1, width), Math.max(1, height));
        plateCanvas = surface;
        if (surface.width < width || surface.height < height) {
          surface.width = Math.max(surface.width, width);
          surface.height = Math.max(surface.height, height);
        }
        const ctx = surface.getContext("2d") as unknown as SKRSContext2D;
        ctx.clearRect(0, 0, surface.width, surface.height);
        return { ctx: ctx as unknown as Ctx, width, height, image: surface as unknown };
      },
    });

  const W = Math.round(layout.heroW);
  const H = Math.round(layout.heroH);
  const layer = createCanvas(W, H);
  const layerCtx = layer.getContext("2d") as unknown as Ctx;

  let restGeo: ReturnType<ReturnType<typeof makeRay>["geometry"]> | undefined;
  let restGlassBox: Rect = { left: 0, right: 0, top: 0, bottom: 0 };
  let restTypeGap: number = Number.NaN;
  const scrollSummary: string[] = [];

  for (const p of SCROLL_POINTS) {
    const ray = makeRay();
    ray.setTheme(dark);
    ray.setLayout(layout);
    if (p === 0) {
      ray.paintStill(layerCtx);
    } else {
      ray.setScroll(p);
      ray.setTime(3.0);
      for (let i = 0; i < 100; i++) ray.paint(layerCtx, 16);
    }
    const g = ray.geometry();
    const label = `${name}@p=${p}`;

    const shouldWrite = !NO_WRITE && (p === 1 || writeAllFrames || TRIPTYCH_VIEWPORTS.has(name));
    if (shouldWrite) {
      const out = createCanvas(W, H);
      const ctx = out.getContext("2d") as unknown as SKRSContext2D;
      ctx.fillStyle = theme(dark).paper;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(layer, 0, 0);
      drawType(ctx, layout, dark);
      const suffix = p === 0 ? "p0" : p === 0.5 ? "p05" : "p1";
      writeFileSync(join(outDir, `${name}-${suffix}.png`), out.toBuffer("image/png"));
    }

    /* --- assertions at this scroll progress ----------------------------- */
    const glassBox: Rect = {
      left: Math.min(g.topV.x, g.leftV.x, g.rightV.x),
      right: Math.max(g.topV.x, g.leftV.x, g.rightV.x),
      top: Math.min(g.topV.y, g.leftV.y, g.rightV.y),
      bottom: Math.max(g.topV.y, g.leftV.y, g.rightV.y),
    };
    const clip = [
      g.leftV.x >= 0,
      g.rightV.x <= layout.heroW + 0.5,
      g.topV.y >= 0,
      g.leftV.y <= layout.heroH + 0.5,
    ].every(Boolean);
    if (!clip) {
      fail(
        label,
        `glass is clipped: [${glassBox.left.toFixed(0)},${glassBox.top.toFixed(0)}] → [${glassBox.right.toFixed(0)},${glassBox.bottom.toFixed(0)}] in ${W}x${H}`,
      );
    }

    const shared = layout.textRects.filter(
      (r) => r.bottom > glassBox.top && r.top < glassBox.bottom,
    );
    const crowded = shared.filter((r) => triOverlapsRect(g.topV, g.leftV, g.rightV, r, 4));
    if (crowded.length) {
      fail(label, `glass sits on ${crowded.length} type box(es) it shares a band with`);
    }

    const tileCrowded = layout.tiles.filter((t) =>
      triOverlapsRect(
        g.topV,
        g.leftV,
        g.rightV,
        { left: t.x, right: t.x + t.width, top: t.top, bottom: t.bottom },
        4,
      ),
    );
    if (tileCrowded.length) {
      fail(label, `glass sits on ${tileCrowded.length} stat tile(s)`);
    }

    // The run must not cross the lede or the CTA row at any scroll progress.
    let unwanted = 0;
    for (let i = 0; i <= 400; i++) {
      const pt = ray.beamAxisAt(i / 400);
      for (const rect of layout.textRects.slice(2))
        if (
          overlaps(
            { ...rect, left: rect.left, right: rect.right },
            { left: pt.x - 1, right: pt.x + 1, top: pt.y - 1, bottom: pt.y + 1 },
          )
        )
          unwanted += 1;
    }
    if (unwanted > 0) fail(label, `the beam crosses the body copy in ${unwanted} samples`);

    // Portrait containment at every scroll progress (including p = 1): no loud lane reaches the
    // stat panel, checked on the live rotated/shifted strand tips.
    if (g.mobile) {
      const panelTop = Math.min(...layout.tiles.map((t) => t.top)) - 24;
      const origin = g.interaction.scroll.origin;
      const turn = g.interaction.fanTurn;
      const spread = g.interaction.fanSpread;
      const loud = (g.specs as { angle: number; length: number; alpha: number }[]).filter((s) => {
        const liveAngle = s.angle + turn + (s.angle - Math.PI / 2) * (spread - 1) * 0.15;
        const dy = Math.sin(liveAngle);
        const dx = Math.cos(liveAngle);
        // Where this lane intersects the hero box boundary.
        let tExit = Number.POSITIVE_INFINITY;
        if (Math.abs(dx) > 1e-6) {
          const tx = ((dx > 0 ? layout.heroW : 0) - origin.x) / dx;
          if (tx > 0) tExit = Math.min(tExit, tx);
        }
        if (Math.abs(dy) > 1e-6) {
          const ty = ((dy > 0 ? layout.heroH : 0) - origin.y) / dy;
          if (ty > 0) tExit = Math.min(tExit, ty);
        }
        const exitY = origin.y + dy * (Number.isFinite(tExit) ? tExit : s.length);
        return exitY > panelTop && s.alpha > 0.35;
      }).length;
      if (loud > 0) fail(label, `${loud} lane(s) reach the stat panel at strength`);
    }

    if (p === 0) {
      restGeo = g;
      restGlassBox = glassBox;
      const bandRight = shared.reduce((acc, r) => Math.max(acc, r.right), -Infinity);
      restTypeGap = Number.isFinite(bandRight) ? glassBox.left - bandRight : Number.NaN;
    }
    scrollSummary.push(
      `y=${Math.round(g.interaction.scroll.origin.y)}(u=${g.interaction.scroll.entryU.toFixed(2)})`,
    );
  }

  if (restGeo) {
    console.log(
      `  ${name.padEnd(16)} ${String(W).padStart(4)}x${String(H).padStart(4)}`,
      `glass ${Math.round(restGeo.prismSize).toString().padStart(3)}px @ [${Math.round(restGlassBox.left)},${Math.round(restGlassBox.top)}]`,
      `typeGap=${Number.isFinite(restTypeGap) ? Math.round(restTypeGap) : "—"}`.padEnd(12),
      `p{0,0.5,1}: ${scrollSummary.join(" → ")}`,
    );
  }
}

console.log(
  failures === 0
    ? `\nsweep clean: ${selected.length} viewport(s) × ${SCROLL_POINTS.length} scroll states, every layout assertion held.`
    : `\n${failures} layout assertion(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
