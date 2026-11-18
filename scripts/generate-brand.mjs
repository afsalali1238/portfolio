// Builds the forthe.tech brand pack from src/lib/brand.ts (transcribed from Brand Guide v1).
//
//   node scripts/generate-brand.mjs            write SVGs + rasters (needs Chromium)
//   node scripts/generate-brand.mjs --svg-only write SVGs only (no browser needed)
//
// Rasters use Playwright with the system Edge/Chrome, or THESIS_CHROMIUM=<path> like
// scripts/generate-og.mjs. Never hand-edit the outputs; change src/lib/brand.ts and re-run.
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brand = await import(pathToFileURL(path.join(repo, "src/lib/brand.ts")).href);
const { BRAND_VERSION_NAMES, markSvg, wordmarkSvg, lockupSvg, tileSvg } = brand;

const pub = (...p) => path.join(repo, "public", ...p);
const write = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log("wrote", path.relative(repo, file));
};

// 1 · Vector pack: four versions of each drawing.
for (const v of BRAND_VERSION_NAMES) {
  write(pub("brand/svg", `mark_${v}.svg`), markSvg(v, "standard"));
  write(pub("brand/svg", `mark-small_${v}.svg`), markSvg(v, "small"));
  write(pub("brand/svg", `wordmark_${v}.svg`), wordmarkSvg(v));
  write(pub("brand/svg", `lockup_${v}.svg`), lockupSvg(v));
}

// The SVG favicon renders at 16-32 px, so it uses the small cut on an ink tile.
const faviconSvg = tileSvg("on-ink-colour", "small", 0.1);
write(pub("favicon.svg"), faviconSvg);

if (process.argv.includes("--svg-only")) process.exit(0);

// 2 · Rasters.
const browser = await chromium.launch(
  process.env.THESIS_CHROMIUM
    ? { executablePath: process.env.THESIS_CHROMIUM }
    : { channel: "msedge" },
);
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function rasterise(svg, width, height = width) {
  const src = "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="${src}" style="display:block;width:${width}px;height:${height}px"></body></html>`,
  );
  await page.waitForFunction(() => document.images[0]?.complete);
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height } });
}

// Small cut below 24 px of mark height, standard cut above (guide §1).
const smallTile = (px) => rasterise(tileSvg("on-ink-colour", "small", 0.1), px);
const appTile = (px) => rasterise(tileSvg("on-ink-colour", "standard"), px);

const favicon16 = await smallTile(16);
const favicon32 = await smallTile(32);
const favicon48 = await smallTile(48);
write(pub("favicon.png"), favicon32);
write(pub("brand/png/favicon-32.png"), favicon32);
write(pub("favicon.ico"), ico([favicon16, favicon32, favicon48], [16, 32, 48]));

const touch = await appTile(180);
write(pub("apple-touch-icon.png"), touch);
write(pub("brand/png/app-icon-180.png"), touch);
write(pub("icon-192.png"), await appTile(192));
const icon512 = await appTile(512);
write(pub("icon-512.png"), icon512);
write(pub("brand/png/avatar-512.png"), icon512);

for (const v of BRAND_VERSION_NAMES) {
  write(pub("brand/png", `lockup_${v}.png`), await rasterise(lockupSvg(v), 1600, 271));
}

await browser.close();

/** Packs PNG buffers into a multi-size .ico (PNG-in-ICO, supported by every current browser). */
function ico(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach((png, i) => {
    const s = sizes[i] >= 256 ? 0 : sizes[i];
    dir.writeUInt8(s, i * 16);
    dir.writeUInt8(s, i * 16 + 1);
    dir.writeUInt8(0, i * 16 + 2);
    dir.writeUInt8(0, i * 16 + 3);
    dir.writeUInt16LE(1, i * 16 + 4);
    dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(png.length, i * 16 + 8);
    dir.writeUInt32LE(offset, i * 16 + 12);
    offset += png.length;
  });
  return Buffer.concat([header, dir, ...pngs]);
}
