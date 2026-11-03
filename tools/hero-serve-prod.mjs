#!/usr/bin/env node
/**
 * tools/hero-serve-prod.mjs — serve the production build locally, for measurement.
 *
 *   npm run build && node tools/hero-serve-prod.mjs        # http://127.0.0.1:4212
 *
 * The dev server is not a fair place to measure this hero: it runs React in development mode
 * and pays Vite's HMR bookkeeping on every resize, which showed up as 50–70 ms long tasks that
 * vanished entirely in the production bundle. Every perf and contrast number in
 * design/hero-phase< N >/README.md comes from this server.
 *
 * It serves `.vercel/output/static` for assets and delegates everything else to the SSR
 * function, which is what the Vercel preset would do in production.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(repo, ".vercel/output");
const PORT = Number(process.env.HERO_PORT ?? "4212");

const mime = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".html": "text/html",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".ico": "image/x-icon",
};

const handler = (await import(pathToFileURL(join(root, "functions/__server.func/index.mjs")).href))
  .default;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const candidate = join(root, "static", decodeURIComponent(url.pathname));
  try {
    const info = await stat(candidate);
    if (info.isFile()) {
      res.writeHead(200, {
        "content-type": mime[extname(candidate)] ?? "application/octet-stream",
        "cache-control": "no-cache",
      });
      res.end(await readFile(candidate));
      return;
    }
  } catch {
    /* not a static asset: fall through to SSR */
  }

  try {
    const response = await handler.fetch(
      new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: req.headers,
      }),
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end(`500 ${error instanceof Error ? error.message : String(error)}`);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`production build served on http://127.0.0.1:${PORT}`);
});
