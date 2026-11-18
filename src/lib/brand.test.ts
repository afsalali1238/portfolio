import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { gunzipSync } from "node:zlib";
import {
  BRAND_COLOURS,
  BRAND_VERSIONS,
  BRAND_VERSION_NAMES,
  LOCKUP,
  MARK_CUTS,
  PRISM_PATH,
  WORDMARK,
  lockupSvg,
  markSvg,
  tileSvg,
  wordmarkSvg,
} from "./brand";

const repo = join(import.meta.dirname, "..", "..");
const read = (...p: string[]) => readFileSync(join(repo, ...p), "utf8");

/** Unpacks the self-contained guide export into { pageTitle: pageHtml }. */
function guidePages(): Record<string, string> {
  const block = (html: string, type: string) => {
    const m = html.match(new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`));
    assert.ok(m, `guide is missing its ${type} block`);
    return m[1];
  };
  const unpack = (entry: { data: string; compressed?: boolean }) => {
    const bytes = Buffer.from(entry.data, "base64");
    return (entry.compressed ? gunzipSync(bytes) : bytes).toString("utf8");
  };
  const root = read("design/brand/forthe.tech-brand-guide-v1.html");
  const pages: Record<string, string> = {};
  for (const entry of Object.values(JSON.parse(block(root, "manifest"))) as Array<{
    data: string;
    compressed?: boolean;
  }>) {
    const page = unpack(entry);
    const title = page.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    pages[title] = JSON.parse(block(page, "template"));
  }
  return pages;
}

const pages = guidePages();
const norm = (s: string) => s.toLowerCase();

test("the guide export contains all six sections", () => {
  for (const t of ["Cover", "The mark", "Versions", "Colour", "Typography", "Rules and voice"]) {
    assert.ok(pages[t], `missing guide section: ${t}`);
  }
});

test("mark geometry matches the guide drawings for both cuts", () => {
  const html = pages["The mark"];
  for (const cut of Object.values(MARK_CUTS)) {
    const svg = html.match(
      new RegExp(`<svg[^>]*sc-camel-view-box="${cut.viewBox}"[^>]*>([\\s\\S]*?)</svg>`),
    );
    assert.ok(svg, `guide has no mark drawn at viewBox ${cut.viewBox}`);
    const paths = [...svg[1].matchAll(/<path d="([^"]+)"[^>]*stroke-width="([^"]+)"/g)];
    assert.deepEqual(
      paths.map((p) => p[1]),
      [cut.beam, ...cut.rays, PRISM_PATH],
    );
    assert.ok(paths.every((p) => Number(p[2]) === cut.strokeWidth));
  }
});

test("outlined wordmark and its full stop match the guide", () => {
  const cover = pages.Cover;
  assert.ok(cover.includes(`sc-camel-view-box="${WORDMARK.viewBox}"`));
  assert.ok(cover.includes(`<path d="${WORDMARK.path}"`), "wordmark outline differs from guide");
  const { cx, cy, r } = WORDMARK.stop;
  assert.ok(cover.includes(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#d96346">`));
});

test("four versions use exactly the guide's inks", () => {
  const html = pages.Versions;
  const drawn = [
    ...html.matchAll(/aria-label="forthe.tech prism mark"[^>]*>([\s\S]*?)<\/svg>/g),
  ].map((m) => [...m[1].matchAll(/stroke="([^"]+)"/g)].map((s) => norm(s[1])));
  const ours = BRAND_VERSION_NAMES.map((v) => {
    const k = BRAND_VERSIONS[v];
    return [k.body, ...k.rays, k.body].map(norm);
  });
  assert.deepEqual(drawn, ours);
});

test("palette matches the guide and both token files", () => {
  const colour = pages.Colour;
  for (const hex of Object.values(BRAND_COLOURS)) {
    assert.ok(
      colour.includes(
        `<span style="font-family:'IBM Plex Mono',monospace;font-size:12px">${hex}</span>`,
      ),
      `${hex} is not a guide swatch`,
    );
  }
  const names: Record<string, string> = {
    ink: "ink",
    bone: "bone",
    clay: "clay",
    gold: "gold",
    slate: "slate",
    clayDeep: "clay-deep",
    goldDeep: "gold-deep",
    slateDeep: "slate-deep",
    grey: "grey",
    line: "line",
  };
  for (const file of ["src/styles/tokens.css", "public/brand/tokens.css"]) {
    const css = norm(read(file));
    for (const [key, hex] of Object.entries(BRAND_COLOURS)) {
      assert.ok(css.includes(`--${names[key]}: ${norm(hex)};`), `${file}: --${names[key]}`);
    }
  }
});

test("labels use grey, not the line colour reserved for rules", () => {
  const css = norm(read("src/styles/tokens.css"));
  assert.match(css, /--text-faint: #9a9ea5;/);
  assert.match(css, /--lit: #eeeae1;/);
});

test("checked-in pack is exactly what scripts/generate-brand.mjs produces", () => {
  for (const v of BRAND_VERSION_NAMES) {
    assert.equal(read("public/brand/svg", `mark_${v}.svg`), markSvg(v, "standard"));
    assert.equal(read("public/brand/svg", `mark-small_${v}.svg`), markSvg(v, "small"));
    assert.equal(read("public/brand/svg", `wordmark_${v}.svg`), wordmarkSvg(v));
    assert.equal(read("public/brand/svg", `lockup_${v}.svg`), lockupSvg(v));
  }
  assert.equal(read("public/favicon.svg"), tileSvg("on-ink-colour", "small", 0.1));
});

test("lockup places the standard mark and wordmark as the guide's export does", () => {
  const svg = lockupSvg("on-ink-colour");
  const m = LOCKUP.mark;
  assert.ok(svg.includes(`<svg x="${m.x}" y="${m.y}" width="${m.width}" height="${m.height}"`));
  assert.ok(svg.includes(`translate(${LOCKUP.wordmarkX} 0)`));
});

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test("no legacy identity colours or asset paths remain in source or public vectors", () => {
  const legacy = /#(f7f5ef|e67e54|16100c|a8471b|0f0a06|f8f6f0)\b/i;
  const legacyFiles =
    /\/brand\/(mark-(paper|ink|16cut|32cut)|wordmark-(paper|ink)|lockup-(paper|ink|stacked)|avatar-(dark|light))/;
  const files = [
    ...walk(join(repo, "src")),
    ...walk(join(repo, "scripts")),
    ...walk(join(repo, "public")).filter((f) => /\.(svg|webmanifest|txt|css)$/.test(f)),
  ].filter((f) => /\.(tsx?|css|mjs|svg|webmanifest|txt)$/.test(f) && !f.endsWith("brand.test.ts"));
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    assert.doesNotMatch(text, legacy, `${relative(repo, f)} uses a legacy identity colour`);
    assert.doesNotMatch(text, legacyFiles, `${relative(repo, f)} references a removed brand file`);
  }
});
