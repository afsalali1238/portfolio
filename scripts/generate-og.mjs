import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// Set THESIS_CHROMIUM to an executable path when Edge is not installed; OG_OUTPUT_DIR can
// redirect generated files for a safe preview without overwriting the checked-in cards.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "..");

// Import data from typescript source using pathToFileURL on Windows
const { projects } = await import(pathToFileURL(path.join(repo, "src/data/projects.ts")).href);
const { DISPATCHES } = await import(pathToFileURL(path.join(repo, "src/data/dispatches.ts")).href);

const font = (relativePath) =>
  "data:font/woff2;base64," +
  fs.readFileSync(path.join(repo, "node_modules", relativePath)).toString("base64");
// Brand Guide v1 · Versions: colour on ink is the primary version for share cards.
const brandLockup =
  "data:image/svg+xml;base64," +
  fs.readFileSync(path.join(repo, "public/brand/svg/lockup_on-ink-colour.svg")).toString("base64");

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function builtForLabel(forWho) {
  const lower = String(forWho || "").toLowerCase();
  if (lower === "wife") return "Built for my wife";
  if (lower === "me") return "Built for me";
  if (lower === "friends") return "Built for friends";
  return `Built for ${forWho}`;
}

const css = `
@font-face {
  font-family: 'Instrument Serif';
  src: url(${font("@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2")}) format('woff2');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Instrument Serif';
  src: url(${font("@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2")}) format('woff2');
  font-weight: 400;
  font-style: italic;
}
@font-face {
  font-family: 'DM Sans';
  src: url(${font("@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2")}) format('woff2');
  font-weight: 100 900;
  font-style: normal;
}
@font-face {
  font-family: 'IBM Plex Mono';
  src: url(${font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2")}) format('woff2');
  font-weight: 400;
  font-style: normal;
}
* { box-sizing: border-box; }
body { margin: 0; padding: 0; background: #0B0C0E; }
.card {
  width: 1200px;
  height: 630px;
  background: #0B0C0E;
  color: #EEEAE1;
  padding: 64px 72px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: 'DM Sans', sans-serif;
  position: relative;
  overflow: hidden;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
}
.brand img {
  display: block;
  /* 40 px lockup = 30 px wordmark type; clear space X ≈ 21 px is kept by the card padding. */
  height: 40px;
  width: auto;
}
.kick {
  color: #9A9EA5;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
h1 {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  margin: 0;
  line-height: 0.95;
  letter-spacing: -0.01em;
  color: #EEEAE1;
}
h1 em {
  font-style: italic;
}
p {
  margin: 18px 0 0;
  font-size: 28px;
  line-height: 1.4;
  color: #EEEAE1;
  max-width: 980px;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  letter-spacing: 0.12em;
  color: #9A9EA5;
  border-top: 1px solid #55585E;
  padding-top: 22px;
}
`;

const renderHtml = ({ kicker, title, sub, url, right, size = 120 }) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <style>${css}</style>
</head>
<body>
  <div class="card">
    <div class="top">
      <div class="brand"><img src="${brandLockup}" alt="forthe.tech"></div>
      <div class="kick">${esc(kicker)}</div>
    </div>
    <div class="mid">
      <h1 style="font-size: ${size}px;">${esc(title)
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>")}</h1>
      ${sub ? `<p>${esc(sub).replace(/\n/g, "<br>")}</p>` : ""}
    </div>
    <div class="foot">
      <span>${esc(url)}</span>
      <span>${esc(right)}</span>
    </div>
  </div>
</body>
</html>`;

const items = [
  {
    id: "home",
    kicker: "The Curious Issue — Vol. I",
    // Guide §5: the name is always lower case, full stop included.
    title: "for the tech.",
    size: 150,
    sub: "Documenting what happens when the wall between having an idea and building it disappears.",
    url: "www.forthe.tech",
    right: `${projects.length} builds · Dubai`,
  },
  {
    id: "works",
    kicker: "Catalogue of builds",
    title: "The catalogue.",
    size: 140,
    sub: `${projects.length} quiet tools, clinical companions, and experiments.`,
    url: "www.forthe.tech/works",
    right: `${projects.filter((p) => p.live).length} live · ${projects.filter((p) => p.github).length} open source`,
  },
  {
    id: "the-man-behind",
    kicker: "Operator dossier",
    title: "The Man Behind.",
    size: 124,
    sub: "The builder behind forthe.tech — an operations-minded maker building focused tools in Dubai.",
    url: "www.forthe.tech/the-man-behind",
    right: "Dubai · UTC+4",
  },
  ...projects.map((p) => ({
    id: p.id,
    kicker: `${builtForLabel(p.for)} · ${p.year}`,
    title: p.name,
    size: p.name.length > 16 ? 104 : 132,
    sub: p.blurb,
    url: `www.forthe.tech/works/${p.id}`,
    right: p.tags.slice(0, 3).join(" · "),
  })),
  ...DISPATCHES.filter((d) => d.path !== "/thesis").map((d) => ({
    id: path.basename(d.path),
    kicker: `Notes · Dispatch No. ${d.number}`,
    title: d.title,
    size: d.title.length > 20 ? 104 : 124,
    sub: d.subtitle,
    url: `www.forthe.tech${d.path}`,
    right: `${d.readTime} · forthe.tech`,
  })),
  {
    id: "thesis",
    kicker: "A thesis in seven movements",
    title: "The Refraction\nof *Thought.*",
    size: 120,
    sub: "Curiosity enters. Craft bends it.\nReality catches the colour.",
    url: "www.forthe.tech/thesis",
    right: "forthe.tech · Dubai",
  },
];

const out = path.resolve(process.env.OG_OUTPUT_DIR ?? path.join(repo, "public/og"));
fs.mkdirSync(out, { recursive: true });

console.log(`Generating ${items.length} share cards...`);
const browser = await chromium.launch(
  process.env.THESIS_CHROMIUM
    ? { executablePath: process.env.THESIS_CHROMIUM }
    : { channel: "msedge" },
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

for (const it of items) {
  const html = renderHtml(it);
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const targetPath = path.join(out, `${it.id}.png`);
  await page.screenshot({ path: targetPath, type: "png" });
  console.log(`  ✓ ${it.id}.png`);
}

await browser.close();
console.log(`Successfully generated all ${items.length} share cards.`);
