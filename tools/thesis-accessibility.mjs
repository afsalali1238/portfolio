#!/usr/bin/env node
/**
 * Keyboard, focus-order, reduced-motion, local-notebook, and axe smoke audit for /thesis.
 *
 *   pnpm dev --host 0.0.0.0
 *   THESIS_URL=http://127.0.0.1:5173/thesis node tools/thesis-accessibility.mjs
 *   THESIS_CHROMIUM=/path/to/chromium THESIS_URL=... node tools/thesis-accessibility.mjs
 */
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright-core";

const PAGE_URL = process.env.THESIS_URL ?? "http://127.0.0.1:5173/thesis";
const STORAGE_KEY = "forthe-tech:thoughts:v1";
const browser = await chromium.launch(
  process.env.THESIS_CHROMIUM ? { executablePath: process.env.THESIS_CHROMIUM } : {},
);
let failures = 0;
let postRequests = 0;
const check = (label, pass, detail = "") => {
  console.log(`${pass ? "PASS" : "FAIL"} ${label}${detail ? `: ${detail}` : ""}`);
  if (!pass) failures += 1;
};

const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.on("pageerror", (error) => check("no page errors", false, error.message));
page.on("request", (request) => {
  if (request.method() === "POST") postRequests += 1;
});
await page.goto(PAGE_URL, { waitUntil: "networkidle", timeout: 60_000 });
await page.evaluate(() => document.fonts.ready);

const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
check(
  "axe WCAG 2.1 AA",
  axe.violations.length === 0,
  axe.violations.map((item) => `${item.id} (${item.nodes.length})`).join(", "),
);

const metaContent = async (selector) => page.locator(selector).first().getAttribute("content");
const articleSchemas = await page
  .locator('script[type="application/ld+json"]')
  .evaluateAll((scripts) =>
    scripts.flatMap((script) => {
      try {
        const schema = JSON.parse(script.textContent || "null");
        return schema && !Array.isArray(schema) ? [schema] : (schema ?? []);
      } catch {
        return [];
      }
    }),
  );
const articleSchema = articleSchemas.find((schema) => schema["@type"] === "Article");
const socialImageAlt = await metaContent('meta[property="og:image:alt"]');
check(
  "document language is British English",
  (await page.locator("html").getAttribute("lang")) === "en-GB",
);
check(
  "thesis canonical and article metadata are correct",
  (await page.locator('link[rel="canonical"]').getAttribute("href")) ===
    "https://www.forthe.tech/thesis" &&
    (await metaContent('meta[property="og:type"]')) === "article" &&
    (await metaContent('meta[name="description"]'))?.includes("colour"),
);
// seo() appends a cache-busting ?v= query — compare the path, not the exact string.
const socialImageUrl = await metaContent('meta[property="og:image"]');
const socialImageTwitterUrl = await metaContent('meta[name="twitter:image"]');
check(
  "social cards have a titled image and alternative text",
  socialImageUrl?.startsWith("https://www.forthe.tech/og/thesis.png") &&
    socialImageTwitterUrl?.startsWith("https://www.forthe.tech/og/thesis.png") &&
    Boolean(socialImageAlt) &&
    (await metaContent('meta[name="twitter:image:alt"]')) === socialImageAlt,
);
check(
  "Article structured data has the shared date and language",
  articleSchema?.datePublished === "2026-11-12" && articleSchema?.inLanguage === "en-GB",
);

const brand = page.locator("header .brand");
check(
  "visible wordmark links home",
  (await brand.isVisible()) && (await brand.getAttribute("href")) === "/",
  `text="${(await brand.innerText()).trim()}" href=${await brand.getAttribute("href")}`,
);

await page.keyboard.press("Tab");
check("first tab reaches skip link", (await page.locator(".skip-link:focus").count()) === 1);
await page.keyboard.press("Enter");
await page.waitForFunction(() => document.activeElement?.id === "discussion");
check(
  "skip link reaches the private notebook",
  (await page.locator(".discussion-footer:focus").count()) === 1,
);
check(
  "chapter index retires over the notebook",
  await page
    .waitForFunction(
      () => document.querySelector(".chapter-rail")?.getAttribute("data-visible") === "false",
      null,
      { timeout: 5_000 },
    )
    .then(() => true)
    .catch(() => false),
);

// The native immersive essay replaced the pinned stage: seven labelled movement
// sections plus a prologue are the current chapter structure.
const movements = page.locator(".flow-movement");
check(
  "essay exposes seven labelled movements",
  (await movements.count()) === 7 &&
    (await page.locator(".flow-movement[aria-labelledby]").count()) === 7 &&
    (await page.locator(".flow-opening h1").count()) === 1,
);

// The chapter index is real anchors (works without JS), one active stop at a time.
check(
  "chapter index links the prologue and all seven movements",
  (await page.locator(".chapter-rail a.rail-stop").count()) === 8 &&
    (await page.locator('.chapter-rail a[href="#prologue"]').count()) === 1 &&
    (await page.locator('.chapter-rail a[href="#movement-07"]').count()) === 1 &&
    (await page.locator('.chapter-rail [aria-current="step"]').count()) === 1,
);

// The optical field is an optional enhancement: its control must be named, and the
// essay must not depend on it.
const fieldAction = page.getByRole("button", { name: /release the spectrum/i });
check(
  "optical field control has an accessible name",
  (await fieldAction.count()) === 1 && Boolean(await fieldAction.getAttribute("aria-describedby")),
);
check(
  "essay remains readable without the optical field",
  (await page.locator(".flow-copy p").count()) > 10 &&
    (await page.locator(".flow-footnote").count()) >= 4,
);

const noteText = "A private note for the automated accessibility test.";
const form = page.locator(".thought-form");
check(
  "notebook form has no POST destination",
  (await form.getAttribute("action")) === null && (await form.getAttribute("method")) !== "post",
);
check(
  "notebook explains local privacy",
  (await page.getByText("Stored in this browser, not sent to a server.").count()) === 1,
);
const postRequestsBeforeSave = postRequests;
await page.locator("#thought-message").fill(noteText);
await page.locator(".submit-thought").click();
await page.waitForFunction(
  (text) => window.localStorage.getItem("forthe-tech:thoughts:v1")?.includes(text),
  noteText,
);
check("notebook saves locally", (await page.locator(".saved-thought").count()) === 1);
check("saved note appears in the page", (await page.getByText(noteText).count()) === 1);
check("saving a note does not make a network submission", postRequests === postRequestsBeforeSave);
await page.reload({ waitUntil: "networkidle" });
await page.waitForFunction(
  (text) => document.querySelector(".saved-thought")?.textContent?.includes(text),
  noteText,
);
check("saved notes persist after reload", (await page.locator(".saved-thought").count()) === 1);

const secondNoteText = "A second private note to check individual removal.";
const postRequestsBeforeSecondSave = postRequests;
await page.locator("#thought-name").fill("Audit guest");
await page.locator("#thought-message").fill(secondNoteText);
await page.locator(".submit-thought").click();
await page.waitForFunction(
  (text) => window.localStorage.getItem("forthe-tech:thoughts:v1")?.includes(text),
  secondNoteText,
);
check("notebook can save more than one note", (await page.locator(".saved-thought").count()) === 2);
check(
  "saving a second note makes no network submission",
  postRequests === postRequestsBeforeSecondSave,
);

const postRequestsBeforeRemove = postRequests;
await page.getByRole("button", { name: "Remove thought by A curious mind" }).click();
await page.waitForFunction(
  ({ removed, retained }) => {
    const notes = window.localStorage.getItem("forthe-tech:thoughts:v1") ?? "[]";
    return !notes.includes(removed) && notes.includes(retained);
  },
  { removed: noteText, retained: secondNoteText },
);
check(
  "remove deletes one local note and preserves another",
  (await page.locator(".saved-thought").count()) === 1 &&
    (await page.getByText(secondNoteText).count()) === 1 &&
    (await page.getByText(noteText).count()) === 0,
);
check("removing a note makes no network submission", postRequests === postRequestsBeforeRemove);

const postRequestsBeforeClear = postRequests;
await page.getByRole("button", { name: /clear all saved field notes/i }).click();
await page.waitForFunction(() => window.localStorage.getItem("forthe-tech:thoughts:v1") === "[]");
check("clear removes all local notes", (await page.locator(".saved-thought").count()) === 0);
check(
  "clear announces completion",
  (await page
    .getByRole("status")
    .filter({ hasText: /cleared/i })
    .count()) > 0,
);
check("notebook does not submit notes to a server", postRequests === postRequestsBeforeClear);

const reducedContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});
const reducedPage = await reducedContext.newPage();
reducedPage.on("pageerror", (error) =>
  check("reduced-motion page has no errors", false, error.message),
);
await reducedPage.goto(PAGE_URL, { waitUntil: "networkidle", timeout: 60_000 });
await reducedPage.evaluate(() => document.fonts.ready);
check(
  "reduced-motion reading flow is visible",
  await reducedPage.locator(".reading-flow").isVisible(),
);
check(
  "reduced-motion removes the optical canvas and field controls",
  (await reducedPage.locator("canvas").count()) === 0 &&
    (await reducedPage.locator(".field-gesture-zone").count()) === 0 &&
    (await reducedPage.locator(".flow-field-action").count()) === 0,
);
check(
  "reduced-motion still includes all seven movements",
  (await reducedPage.locator(".flow-movement").count()) === 7,
);
check(
  "reduced-motion keeps the physics note and closing links",
  (await reducedPage.getByText(/Light can refract at a boundary/).count()) === 1 &&
    (await reducedPage.locator(".flow-next-step").count()) === 2,
);
check(
  "reduced-motion does not lock document scrolling",
  await reducedPage.evaluate(
    () => !document.documentElement.style.overflow && !document.body.style.overflow,
  ),
);

await reducedContext.close();
await context.close();

const noScriptContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  javaScriptEnabled: false,
});
const noScriptPage = await noScriptContext.newPage();
await noScriptPage.goto(PAGE_URL, { waitUntil: "networkidle", timeout: 60_000 });
// The essay is server-rendered: without JavaScript the reader still gets the full
// text; only the local notebook form degrades (with a noscript explanation).
const noScriptReader = noScriptPage.locator(".reading-flow");
check("no-script reading fallback is visible", await noScriptReader.isVisible());
check(
  "no-script reading fallback includes the movements and the physics note",
  (await noScriptPage.locator(".flow-movement").count()) === 7 &&
    (await noScriptPage.getByText(/Light can refract at a boundary/).count()) === 1,
);
check(
  "no-script chapter index renders as plain anchors",
  (await noScriptPage.locator('.chapter-rail a.rail-stop[href^="#movement-"]').count()) === 7 &&
    (await noScriptPage.locator('.chapter-rail a[href="#prologue"]').count()) === 1,
);
check(
  "no-script notebook explains that field notes need JavaScript",
  (await noScriptPage.getByText(/Field notes need JavaScript/).count()) === 1,
);
await noScriptContext.close();
await browser.close();
console.log(
  `Thesis accessibility audit: ${failures ? `${failures} failure(s)` : "all checks passed"}`,
);
process.exitCode = failures ? 1 : 0;
