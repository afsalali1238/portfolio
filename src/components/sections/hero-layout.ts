/**
 * hero-layout — the only module in the hero that touches the DOM.
 *
 * The drawing engine is geometry-driven: every position it paints comes from a measured
 * rect, never from a percentage of the section. This module reads those rects once per
 * resize and hands the engine a plain snapshot, so the engine stays DOM-free and can be
 * rendered headlessly.
 *
 * All coordinates are CSS pixels, relative to the hero's own top-left corner.
 *
 * Hooks (added in Hero.tsx, no visual change):
 *   data-hero-copy        the copy column (headline + lede + CTAs)
 *   data-hero-thesis      the last line of the headline (the italic sentence)
 *   data-hero-tiles       the stats grid
 *   data-hero-tile        each stat tile (repeatable)
 *   data-hero-container   the Container wrapper, for the 12-column drafting grid
 */

export type Rect = { left: number; top: number; right: number; bottom: number };

export type TileRect = {
  /** hero-relative left edge */
  x: number;
  top: number;
  bottom: number;
  /** hero-relative horizontal centre */
  cx: number;
  width: number;
};

/**
 * The ledger: one derived object every layer reads from, so the drawing never crosses into
 * the type. A fan ray that would land inside a text box is pushed below it — the dispersion
 * keeps its angular order while the copy keeps its quiet.
 */
export type Ledger = {
  /** hero-relative boxes where nothing but the plate may draw */
  quietRects: Rect[];
  /** baseline ticks for the drafting plate: (y, x0, x1) */
  baselines: { y: number; x0: number; x1: number }[];
  /** where the fan may be dense: the right edge is hot, the left edge is quiet */
  balance: number;
};

export type LayoutSnapshot = {
  heroW: number;
  heroH: number;
  /** right edge of the copy block (h1 ∪ ledger), hero-relative */
  copyRight: number;
  /**
   * The closing sentence's ink extent, its true baseline and its line-box bottom. The beam's
   * landing height is solved against the gap between this box and the paragraph below it, so
   * this is the one piece of type the whole composition is anchored to.
   */
  thesisLine: { left: number; right: number; baselineY: number; bottom: number };
  /** the four stat tiles, left → right */
  tiles: TileRect[];
  /** the Container's content box */
  container: { left: number; right: number };
  /** 12 vertical rules across the container: the interior boundaries plus the right edge */
  columns: number[];
  /** type boxes used by the dissolve mask (h1 lines, lede, CTA row) */
  textRects: Rect[];
  /** the derived quiet zones + drafting references */
  ledger: Ledger;
};

const MIN_RECT = 8;

/**
 * Interactive elements inside the hero whose clicks/taps belong to UI controls rather than
 * placing or resetting a light source on the canvas.
 */
export const HERO_INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "details",
  "audio[controls]",
  "video[controls]",
  "iframe",
  "object",
  "embed",
  "[contenteditable]:not([contenteditable='false'])",
  "[data-hero-control]",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='menuitem']",
  "[role='menuitemcheckbox']",
  "[role='menuitemradio']",
  "[role='option']",
  "[role='tab']",
  "[role='textbox']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='searchbox']",
  "[role='slider']",
  "[role='spinbutton']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * Returns `true` when a window pointer/mouse event target should NOT place or reset the hero
 * light source — either because the target is outside `<section data-hero>` (e.g. sticky site
 * header, mobile drawer backdrop, floating back-to-top button, modals) or because it lands on
 * an interactive / editable control inside the hero.
 */
export function shouldIgnoreHeroPointerTarget(
  target: EventTarget | null,
  hero: HTMLElement,
): boolean {
  const el =
    target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  if (!el || !hero.contains(el)) return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  const hit = el.closest(HERO_INTERACTIVE_SELECTOR);
  if (hit && hit !== hero) return true;
  return false;
}

/** Merge overlapping/near-touching rects so a text column reads as one quiet zone. */
function mergeRects(rects: Rect[]): Rect[] {
  const sorted = [...rects].sort((a, b) => a.top - b.top || a.left - b.left);
  const out: Rect[] = [];
  for (const rect of sorted) {
    const last = out[out.length - 1];
    if (last && rect.top <= last.bottom && rect.left <= last.right && rect.right >= last.left) {
      last.top = Math.min(last.top, rect.top);
      last.left = Math.min(last.left, rect.left);
      last.right = Math.max(last.right, rect.right);
      last.bottom = Math.max(last.bottom, rect.bottom);
    } else {
      out.push({ ...rect });
    }
  }
  return out;
}

function toLocal(rect: DOMRect, originLeft: number, originTop: number): Rect {
  return {
    left: rect.left - originLeft,
    top: rect.top - originTop,
    right: rect.right - originLeft,
    bottom: rect.bottom - originTop,
  };
}

/**
 * The tight line box of an element's text.
 *
 * A range around inline content can report more than one rect (the clip box that the
 * headline's reveal animation uses is taller than the glyphs). The line itself is the
 * shortest of those rects, which is also the one that sits on the baseline.
 */
function lineRect(el: Element | null, originLeft: number, originTop: number): Rect | null {
  if (!el) return null;
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = Array.from(range.getClientRects()).filter((r) => r.height > MIN_RECT);
  range.detach?.();
  if (rects.length === 0) return null;
  const tightest = rects.reduce((a, b) => (b.height < a.height ? b : a));
  return toLocal(tightest, originLeft, originTop);
}

/**
 * A measuring context for font metrics. Created once, never attached to the document.
 *
 * The previous implementation appended a zero-height probe span and read its rect, which is
 * exact but forces a synchronous layout — on a resize that cost 40–70 ms per gesture. The
 * baseline can be derived from the line box and the font's own ascent/descent instead, with
 * no DOM mutation at all.
 */
let metricsCtx: CanvasRenderingContext2D | null = null;
const getMetricsCtx = () => {
  if (metricsCtx) return metricsCtx;
  try {
    metricsCtx = document.createElement("canvas").getContext("2d");
  } catch {
    metricsCtx = null;
  }
  return metricsCtx;
};

/**
 * Baseline y of a text line, derived from its line box:
 *
 *   baseline = lineTop + (lineHeight − (ascent + descent)) / 2 + ascent
 *
 * The half-leading term is what keeps this exact for short line-heights (the headline runs at
 * 0.88, so the leading is negative and the glyphs overflow the box — hence the clamp).
 */
function baselineOf(el: Element | null, line: Rect, fallback: number): number {
  if (!el) return fallback;
  const ctx = getMetricsCtx();
  if (!ctx) return fallback;
  try {
    const cs = window.getComputedStyle(el);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const metrics = ctx.measureText("Ay");
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;
    if (!Number.isFinite(ascent) || !Number.isFinite(descent)) return fallback;
    const lineHeight = line.bottom - line.top;
    const leading = lineHeight - (ascent + descent);
    return line.top + leading / 2 + ascent;
  } catch {
    return fallback;
  }
}

/** A defensive snapshot for the first frame, before the hooks are measurable. */
function fallbackSnapshot(w: number, h: number): LayoutSnapshot {
  const margin = Math.min(96, w * 0.06);
  const left = margin;
  const right = w - margin;
  return {
    heroW: w,
    heroH: h,
    copyRight: right * 0.58,
    thesisLine: { left, right: right * 0.56, baselineY: h * 0.3, bottom: h * 0.3 + h * 0.03 },
    tiles: [0, 1, 2, 3].map((i) => {
      const cx = lerpNumbers(left, right, (i + 0.5) / 4);
      return { x: cx - 60, top: h * 0.72, bottom: h * 0.9, cx, width: 120 };
    }),
    container: { left, right },
    columns: Array.from({ length: 12 }, (_, i) => left + ((right - left) * (i + 1)) / 12),
    textRects: [{ left, top: h * 0.16, right: right * 0.56, bottom: h * 0.52 }],
    ledger: {
      quietRects: [{ left, top: h * 0.16, right: right * 0.56, bottom: h * 0.52 }],
      baselines: [],
      balance: 0.5,
    },
  };
}

const lerpNumbers = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Read the hero's real layout.
 *
 * `hero` is the <section> element. Returns a snapshot in hero-relative CSS pixels.
 * Never throws: a missing hook degrades that one field rather than the whole scene.
 */
export function measureHero(hero: HTMLElement): LayoutSnapshot {
  const heroRect = hero.getBoundingClientRect();
  const heroW = Math.max(1, heroRect.width);
  const heroH = Math.max(1, heroRect.height);
  const ox = heroRect.left;
  const oy = heroRect.top;

  const fallback = fallbackSnapshot(heroW, heroH);

  const containerEl = hero.querySelector<HTMLElement>("[data-hero-container]");
  const containerRect = containerEl?.getBoundingClientRect();
  /**
   * The Container is `mx-auto max-w-6xl px-6 md:px-10`, so its border box includes the page
   * gutter. The drafting plate's 12 rules have to land on the *content* grid — the one the
   * grid columns and the copy are laid out on — or the plate reads as rules drawn beside the
   * text instead of under it. Reading the computed padding is exact and costs no extra layout,
   * because the box has already been measured.
   */
  const containerPadding = (() => {
    if (!containerEl) return { left: 0, right: 0 };
    const style = window.getComputedStyle(containerEl);
    const px = (value: string) => Number.parseFloat(value) || 0;
    return { left: px(style.paddingLeft), right: px(style.paddingRight) };
  })();
  const container = containerRect
    ? {
        left: containerRect.left - ox + containerPadding.left,
        right: containerRect.right - ox - containerPadding.right,
      }
    : fallback.container;

  const copyEl = hero.querySelector<HTMLElement>("[data-hero-copy]");
  const copyRect = copyEl?.getBoundingClientRect();
  const containerWidth = container.right - container.left;
  const columns = Array.from(
    { length: 12 },
    (_, i) => container.left + (containerWidth * (i + 1)) / 12,
  );

  const headline = hero.querySelector<HTMLElement>("[data-hero-copy] h1") ?? null;
  const headlineLines = Array.from(headline?.children ?? [])
    .map((child) => lineRect(child, ox, oy))
    .filter((r): r is Rect => r !== null);

  const thesisEl = hero.querySelector<HTMLElement>("[data-hero-thesis]");
  const thesisRect =
    lineRect(thesisEl, ox, oy) ?? headlineLines[headlineLines.length - 1] ?? fallback.textRects[0];

  const thesisLine = {
    left: thesisRect.left,
    right: thesisRect.right,
    baselineY: baselineOf(
      thesisEl,
      thesisRect,
      thesisRect.bottom - (thesisRect.bottom - thesisRect.top) * 0.24,
    ),
    /**
     * The bottom of the line box, not of the ink. `hero-ray` threads the incident beam through
     * the gap between this sentence and the paragraph below, and that gap is measured from the
     * box the browser actually laid out — a descender extent would leave the beam sitting on
     * the baseline, which is exactly where it used to cut through the last word.
     */
    bottom: thesisRect.bottom,
  };

  const ledeEl = copyEl?.querySelector<HTMLElement>("p") ?? null;
  const ledeRect = ledeEl ? toLocal(ledeEl.getBoundingClientRect(), ox, oy) : null;

  const ctaEl = ledeEl?.parentElement
    ? (ledeEl.parentElement.querySelector<HTMLElement>(":scope > div") ?? null)
    : null;
  const ctaRect = ctaEl ? toLocal(ctaEl.getBoundingClientRect(), ox, oy) : null;

  const copyRight = Math.max(
    copyRect ? copyRect.right - ox : 0,
    ...headlineLines.map((r) => r.right),
    ledeRect?.right ?? 0,
    ctaRect?.right ?? 0,
    fallback.copyRight,
  );

  const tiles = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-tile]"))
    .map((el) => el.getBoundingClientRect())
    .sort((a, b) => a.left - b.left)
    .map((r) => ({
      x: r.left - ox,
      top: r.top - oy,
      bottom: r.bottom - oy,
      cx: r.left - ox + r.width / 2,
      width: r.width,
    }));

  const textRects: Rect[] = [...headlineLines];
  if (ledeRect) textRects.push(ledeRect);
  if (ctaRect) textRects.push(ctaRect);
  if (textRects.length === 0) textRects.push(...fallback.textRects);

  // Quiet zones are the type boxes plus a margin, merged when they touch: the dissolve mask
  // and the ray ledger both work off this, so they can never disagree.
  const QUIET_MARGIN = 10;
  const quietRects = mergeRects(
    textRects.map((r) => ({
      left: r.left - QUIET_MARGIN,
      top: r.top - QUIET_MARGIN,
      right: r.right + QUIET_MARGIN,
      bottom: r.bottom + QUIET_MARGIN,
    })),
  );

  // The fan is hottest on the side away from the copy: the drawing balances the page instead
  // of crowding the words. Measured, not assumed.
  const balance =
    copyRect && containerWidth > 0
      ? Math.min(1, Math.max(0, (copyRect.right - ox - container.left) / containerWidth))
      : 0.5;

  // Baseline ticks for the plate: the headline lines and the lede, with their ink extents.
  const baselines: { y: number; x0: number; x1: number }[] = [];
  const headlineEls = Array.from(headline?.children ?? []);
  for (const [index, child] of headlineEls.entries()) {
    const rect = headlineLines[index];
    if (!rect) continue;
    const el = child as HTMLElement;
    baselines.push({
      y: baselineOf(el.querySelector("[data-hero-thesis]") ? thesisEl : el, rect, rect.bottom - 4),
      x0: rect.left,
      x1: rect.right,
    });
  }
  if (ledeRect) {
    baselines.push({
      y: ledeRect.top + (ledeRect.bottom - ledeRect.top) / 2,
      x0: ledeRect.left,
      x1: ledeRect.right,
    });
  }

  return {
    heroW,
    heroH,
    copyRight,
    thesisLine,
    tiles: tiles.length === 4 ? tiles : fallback.tiles,
    container,
    columns,
    textRects,
    ledger: { quietRects, baselines, balance },
  };
}
