#!/usr/bin/env node
/**
 * Site-wide optical-lab regression checks, against the real production page.
 *
 *   pnpm build && node tools/hero-serve-prod.mjs             # terminal 1
 *   pnpm audit:optical-lab                                  # terminal 2
 *   HERO_CHROMIUM=/path/to/chromium HERO_URL=http://... pnpm audit:optical-lab
 *
 * No screenshots or generated artifacts are written. The separate hero-qa suite covers
 * ray physics, gestures, lifecycle and reduced motion; this checks the shared visual contract.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const base = process.env.HERO_URL ?? "http://127.0.0.1:4212/";
const origin = new URL(base).origin;
const browser = await chromium.launch(
  process.env.HERO_CHROMIUM ? { executablePath: process.env.HERO_CHROMIUM } : {},
);

const palette = {
  "--paper": "#0b0c0e",
  "--paper-deep": "#121519",
  "--paper-glass": "rgba(18, 21, 25, 0.75)",
  "--ink": "#eeeae1",
  "--ink-soft": "#a6a7a7",
  "--ink-mute": "#8a8e95",
  "--faint": "#8a8e95",
  "--rule": "rgba(205, 211, 221, 0.12)",
  "--hairline": "rgba(205, 211, 221, 0.12)",
  "--accent-ink": "#c95135",
  "--mark-dot": "#c95135",
};

async function checkPalette(page) {
  const result = await page.evaluate((expected) => {
    const root = document.documentElement;
    const probe = document.createElement("span");
    root.appendChild(probe);
    const resolve = (color) => {
      probe.style.color = color;
      return getComputedStyle(probe).color;
    };
    const mismatches = Object.entries(expected).flatMap(([name, color]) => {
      const actual = resolve(`var(${name})`);
      return actual === resolve(color) ? [] : [`${name}: ${actual} instead of ${color}`];
    });
    probe.remove();
    return {
      mismatches,
      scheme: getComputedStyle(root).colorScheme,
      background: getComputedStyle(document.body).backgroundColor,
      overflow: root.scrollWidth - innerWidth,
    };
  }, palette);
  assert.deepEqual(result.mismatches, []);
  assert.equal(result.scheme, "dark");
  assert.equal(result.background, "rgb(11, 12, 14)");
  assert.ok(result.overflow <= 1, `Horizontal overflow: ${result.overflow}px`);
}

async function checkButtons(page) {
  const buttons = await page.locator("[data-hero-ctas] a").evaluateAll((links) =>
    links.map((link) => {
      const style = getComputedStyle(link);
      return { color: style.color, background: style.backgroundColor };
    }),
  );
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].color, "rgb(11, 12, 14)");
  assert.equal(buttons[0].background, "rgb(238, 234, 225)");
  assert.equal(buttons[1].color, "rgb(238, 234, 225)");
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  // Stale preferences and third-party analytics must not affect the visual contract.
  await context.addInitScript(() => localStorage.setItem("theme", "light"));
  await context.route("**/*", (route) =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort(),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const visit = async (path) => {
    const response = await page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
    assert.equal(response.status(), 200, path);
    await page.evaluate(() => document.fonts.ready);
  };

  for (const path of [
    "/",
    "/works",
    "/works/provia",
    "/notes",
    "/notes/the-energy-ledger",
    "/the-man-behind",
    "/lab/refraction",
    "/thesis",
  ]) {
    await visit(path);
    await checkPalette(page);
    console.log(`✓ ${path}: obsidian tokens, native dark scheme, no horizontal overflow`);
  }

  await visit("/");
  await checkButtons(page);
  const brand = await page.locator("header > div > a").evaluate((link) => ({
    text: link.textContent.trim(),
    viewBox: link.querySelector("svg").getAttribute("viewBox"),
    weight: getComputedStyle(link.querySelector("span > span") ?? link.lastElementChild).fontWeight,
  }));
  assert.equal(brand.text, "for the tech.");
  assert.equal(brand.viewBox, "0 0 40 34");
  assert.equal(brand.weight, "700");
  const clock = await page.locator("#contact time").textContent();
  assert.match(clock, /^\d{2}:\d{2}:\d{2} GST$/);
  console.log("✓ Shared prism lockup, CTA polarity and live GST timestamp");

  // Load the thesis CSS via client navigation, then return without reloading the document.
  // Scoped thesis anchor/button resets must not turn bone-filled CTAs into white-on-white links.
  await page.getByRole("navigation", { name: "Site", exact: true }).getByText("Manifesto").click();
  await page.waitForSelector(".page-shell");
  await page.goBack();
  await page.waitForSelector("[data-hero-painted]");
  await checkButtons(page);
  await checkPalette(page);
  console.log("✓ Thesis → home client navigation does not leak styles into CTA buttons");

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await visit("/");
    await page.waitForSelector("[data-hero-painted]");
    await checkPalette(page);
    const coordinates = await page.locator("[data-hero-tile] > span").allTextContents();
    assert.deepEqual(
      coordinates.map((text) => text.trim().toUpperCase()),
      ["01 / TOTAL SHIPPED", "02 / LIVE DEPLOYMENTS", "03 / OPEN SOURCE", "04 / FOR PEOPLE"],
    );
    if (width === 390) {
      await page.getByRole("button", { name: "Open menu", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Navigation menu" });
      const close = dialog.getByRole("button", { name: "Close menu" });
      assert.equal(await close.evaluate((button) => button === document.activeElement), true);
      assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
      await page.keyboard.press("Shift+Tab");
      assert.equal(
        await dialog
          .getByRole("link")
          .last()
          .evaluate((link) => link === document.activeElement),
        true,
      );
      await page.keyboard.press("Tab");
      assert.equal(await close.evaluate((button) => button === document.activeElement), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#mobile-nav").evaluate((nav) => nav.inert), true);
      assert.equal(await page.evaluate(() => document.body.style.overflow), "");
      assert.equal(
        await page
          .getByRole("button", { name: "Open menu", exact: true })
          .evaluate((button) => button === document.activeElement),
        true,
      );
      console.log(
        "✓ Mobile navigation: prism lockup, focus trap, Escape, scroll lock and inert close",
      );
    }
    console.log(`✓ ${width}px: responsive hero and all four telemetry coordinates`);
  }
  assert.deepEqual(errors, [], "Browser runtime errors");
  await context.close();

  const noScript = await browser.newContext({ javaScriptEnabled: false, colorScheme: "light" });
  const initialPage = await noScript.newPage();
  await initialPage.goto(new URL("/", base).href, { waitUntil: "networkidle" });
  await checkPalette(initialPage);
  assert.equal(await initialPage.locator("html").getAttribute("class"), "dark");
  await checkButtons(initialPage);
  await noScript.close();
  console.log("✓ Server-rendered first paint is dark without JavaScript or a theme script");
  console.log("\nAll optical-lab visual regression checks passed.");
} finally {
  await browser.close();
}
