import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, "..");

// Import data from typescript source using pathToFileURL on Windows
const { projects } = await import(pathToFileURL(path.join(repo, "src/data/projects.ts")).href);
const { DISPATCHES } = await import(pathToFileURL(path.join(repo, "src/data/dispatches.ts")).href);

const fontDir = path.join(repo, "node_modules/@fontsource");
const ff = (f) =>
  "data:font/woff2;base64," + fs.readFileSync(path.join(fontDir, f)).toString("base64");

// Clean 50px favicon tile
const fav = fs
  .readFileSync(path.join(repo, "public/favicon.svg"), "utf8")
  .replace("<svg ", '<svg width="50" height="50" ');

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
  src: url(${ff("instrument-serif/files/instrument-serif-latin-400-normal.woff2")}) format('woff2');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Instrument Serif';
  src: url(${ff("instrument-serif/files/instrument-serif-latin-400-italic.woff2")}) format('woff2');
  font-weight: 400;
  font-style: italic;
}
@font-face {
  font-family: 'Inter';
  src: url(${ff("inter/files/inter-latin-400-normal.woff2")}) format('woff2');
  font-weight: 400;
}
@font-face {
  font-family: 'Inter';
  src: url(${ff("inter/files/inter-latin-500-normal.woff2")}) format('woff2');
  font-weight: 500;
}
* { box-sizing: border-box; }
body { margin: 0; padding: 0; background: #F8F6F0; }
.card {
  width: 1200px;
  height: 630px;
  background: #F8F6F0;
  color: #16100C;
  padding: 64px 72px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-family: 'Inter', sans-serif;
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
  gap: 16px;
  font-family: 'Instrument Serif', serif;
  font-size: 40px;
  color: #16100C;
}
.dot { color: #A8471B; }
.kick {
  font-size: 22px;
  color: #6E6762;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
}
h1 {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  margin: 0;
  line-height: 0.95;
  letter-spacing: -0.01em;
  color: #16100C;
}
p {
  margin: 18px 0 0;
  font-size: 28px;
  line-height: 1.4;
  color: #38322D;
  max-width: 980px;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 22px;
  color: #6E6762;
  border-top: 2px solid #C6C4BE;
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
      <div class="brand">${fav}<span>forthe<span class="dot">.</span>tech</span></div>
      <div class="kick">${esc(kicker)}</div>
    </div>
    <div class="mid">
      <h1 style="font-size: ${size}px;">${esc(title)}</h1>
      ${sub ? `<p>${esc(sub)}</p>` : ""}
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
    title: "For the tech.",
    size: 150,
    sub: "Documenting what happens when the wall between having an idea and building it disappears.",
    url: "www.forthe.tech",
    right: `${projects.length} builds · Afsal Ali · Dubai`,
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
    id: "about",
    kicker: "Origin",
    title: "What is forthe.tech?",
    size: 120,
    sub: "The wall between having an idea and building it came down. Since then, I’ve been building for the tech.",
    url: "www.forthe.tech/about",
    right: "Afsal Ali · Dubai",
  },
  {
    id: "thesis",
    kicker: "Notes · Dispatch No. 01",
    title: "The Energy Ledger.",
    size: 130,
    sub: "AI tokens are the new currency. And every token is an IOU on physical energy.",
    url: "www.forthe.tech/notes/the-energy-ledger",
    right: "Afsal Ali · Dubai",
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
  ...DISPATCHES.map((d) => ({
    id: path.basename(d.path),
    kicker: `Notes · Dispatch No. ${d.number}`,
    title: d.title,
    size: d.title.length > 20 ? 104 : 124,
    sub: d.subtitle,
    url: `www.forthe.tech${d.path}`,
    right: `${d.readTime} · Afsal Ali`,
  })),
];

const out = path.join(repo, "public/og");
fs.mkdirSync(out, { recursive: true });

console.log(`Generating ${items.length} share cards using MS Edge...`);
const browser = await chromium.launch({ channel: "msedge" });
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
