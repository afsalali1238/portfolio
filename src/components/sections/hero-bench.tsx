import { useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { countFor } from "../../data/filters";
import {
  DEFAULT_ID,
  FILTERS,
  NUMBER,
  ORDERED,
  YEARS,
  builtFor,
  statusLabel,
  type Bench,
} from "./hero-bench-state";

/**
 * The hero's workbench: every build as a cell, a stage that shows the real screenshot,
 * and the facts underneath. Hover (mouse), tap or arrow keys pick a build; the four
 * counts filter the cells and link through to the same filter in the catalogue.
 *
 * Motion follows the guidelines: the cells are built once on first paint (CSS, so it
 * never waits for hydration), every change after that is a 150 ms fade, nothing loops.
 */

/* ------------------------------------------------------------------------------------ */
/* Filters + cell grid                                                                  */
/* ------------------------------------------------------------------------------------ */

export function BuildIndex({ bench, className = "" }: { bench: Bench; className?: string }) {
  const { filter, setFilter, selectedId, select, preview, visible, visibleIds, warmUp } = bench;
  const tabStop = visibleIds.has(selectedId) ? selectedId : visible[0]?.id;
  const current = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const cells = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not([aria-disabled="true"])',
      ),
    );
    const here = document.activeElement as HTMLButtonElement | null;
    const i = here ? cells.indexOf(here) : -1;
    if (i === -1 || !here) return;
    e.preventDefault();

    let target = cells[i];
    if (e.key === "Home") target = cells[0];
    else if (e.key === "End") target = cells[cells.length - 1];
    else if (e.key === "ArrowRight") target = cells[(i + 1) % cells.length];
    else if (e.key === "ArrowLeft") target = cells[(i - 1 + cells.length) % cells.length];
    else {
      // Up and down move by row, to the cell nearest in x, however the rows have wrapped.
      const r = here.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const down = e.key === "ArrowDown";
      const others = cells
        .map((c) => ({ c, r: c.getBoundingClientRect() }))
        .filter(({ r: o }) => (down ? o.top > r.top + r.height / 2 : o.top < r.top - r.height / 2));
      if (others.length) {
        const rowTop = down
          ? Math.min(...others.map((o) => o.r.top))
          : Math.max(...others.map((o) => o.r.top));
        const row = others.filter((o) => Math.abs(o.r.top - rowTop) < 2);
        const dist = (o: { r: DOMRect }) => Math.abs(o.r.left + o.r.width / 2 - cx);
        target = row.reduce((best, o) => (dist(o) < dist(best) ? o : best)).c;
      }
    }
    target.focus();
    if (target.dataset.id) select(target.dataset.id);
  };

  return (
    <div className={className}>
      <p className="mb-4 text-sm font-medium text-ink-mute">Every build so far. Pick one.</p>
      <div
        role="group"
        aria-label="Filter the builds"
        className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
      >
        {FILTERS.map((f) => {
          const on = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.key)}
              className="group -m-1.5 flex flex-col items-start rounded-md p-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <span
                className={`font-serif text-3xl leading-none transition-colors duration-150 lg:text-4xl ${
                  on ? "text-ink" : "text-ink-mute group-hover:text-ink"
                }`}
              >
                {countFor(f.key)}
              </span>
              <span
                className={`mt-1.5 text-xs transition-colors duration-150 ${
                  on ? "text-ink" : "text-ink-mute group-hover:text-ink"
                }`}
              >
                {f.label}
              </span>
              <span
                aria-hidden="true"
                className={`mt-2 h-0.5 w-full rounded-full ${on ? "bg-ink" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      <div
        role="radiogroup"
        aria-label="Builds, oldest first. Arrow keys move between them."
        onKeyDown={onKeyDown}
        onPointerLeave={() => preview(null)}
        className="mt-5 space-y-2 border-t rule-hair pt-5"
      >
        {YEARS.map((year) => (
          <div key={year} className="flex items-start gap-3">
            <span className="w-9 shrink-0 pt-3.5 text-xs tabular-nums text-ink-mute">{year}</span>
            <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-1.5 sm:grid-cols-10">
              {ORDERED.filter((p) => p.year === year).map((p) => {
                const order = ORDERED.indexOf(p);
                const on = p.id === selectedId;
                const dim = !visibleIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    data-id={p.id}
                    aria-checked={on}
                    aria-disabled={dim || undefined}
                    aria-label={`${p.name}, ${p.year}${dim ? ", not in this filter" : ""}`}
                    tabIndex={p.id === tabStop ? 0 : -1}
                    onClick={() => !dim && select(p.id)}
                    onFocus={() => warmUp(p.id)}
                    onPointerEnter={(e) => {
                      if (e.pointerType === "mouse" && !dim) preview(p.id);
                    }}
                    style={{ ["--i" as string]: order }}
                    className={`cell-build flex aspect-square items-center justify-center rounded-md border-2 text-xs font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${
                      dim
                        ? "cursor-default border-transparent bg-paper-deep text-ink-mute/60"
                        : on
                          ? "border-ink bg-paper text-ink"
                          : "border-transparent bg-ink text-paper hover:bg-ink-soft"
                    }`}
                  >
                    {NUMBER.get(p.id)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-ink-mute">
        <span aria-live="polite">{current.status(visible.length)}</span>
        <Link
          to="/works"
          search={filter === "all" ? {} : { filter }}
          className="group inline-flex min-h-6 items-center gap-1 font-medium text-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          Open them in the catalogue
          <ArrowRight
            aria-hidden="true"
            className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-1"
          />
        </Link>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------------------ */
/* Stage: the real screenshot, in the frame the imagery guidelines give it               */
/* ------------------------------------------------------------------------------------ */

export function BuildStage({ bench, className = "" }: { bench: Bench; className?: string }) {
  const { active, activeId, warm } = bench;
  const mounted = ORDERED.filter((p) => warm.has(p.id) || p.id === activeId);
  const kind = active.media?.kind === "mobile" ? "Phone build" : "Web build";

  return (
    <Link
      to="/works/$id"
      params={{ id: active.id }}
      aria-label={`${active.name}: read the case study`}
      className={`group relative block h-[19rem] overflow-hidden rounded-lg border rule-hair bg-paper-deep transition-colors duration-150 hover:border-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink sm:h-[22rem] lg:h-[17rem] xl:h-[18rem] ${className}`}
    >
      {mounted.map((p) => {
        const on = p.id === activeId;
        return (
          <div
            key={p.id}
            aria-hidden="true"
            className={`absolute inset-0 flex items-center justify-center px-6 pb-6 pt-10 transition-opacity duration-150 ${
              on ? "opacity-100" : "opacity-0"
            }`}
          >
            {p.media ? (
              <Poster
                src={p.media.poster}
                phone={p.media.kind === "mobile"}
                priority={p.id === DEFAULT_ID}
              />
            ) : (
              // The guidelines' typographic card for a build with no footage yet.
              <div className="flex h-full w-full flex-col justify-end rounded-lg border rule-hair bg-paper p-6">
                <span className="font-serif text-4xl leading-none text-ink">{p.name}</span>
                <span className="mt-2 text-sm text-ink-soft">{p.blurb}</span>
              </div>
            )}
          </div>
        );
      })}
      <span className="absolute left-4 top-3 text-xs text-ink-mute">{kind}</span>
      <span className="absolute right-4 top-3 inline-flex items-center gap-1 text-xs font-medium text-ink-mute transition-colors duration-150 group-hover:text-ink">
        Case study
        <ArrowRight
          aria-hidden="true"
          className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

/**
 * The phone frame (ink border, round corners) only goes round a portrait
 * screenshot. Some phone builds only have a landscape poster so far (Provia), and a
 * landscape picture in a phone frame reads as a broken phone, so the frame follows the
 * picture's real shape once it has loaded.
 */
function Poster({ src, phone, priority }: { src: string; phone: boolean; priority: boolean }) {
  const [landscape, setLandscape] = useState(false);
  const check = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth) {
      setLandscape(img.naturalWidth > img.naturalHeight);
    }
  };
  const framed = phone && !landscape;
  return (
    <img
      ref={check}
      src={src}
      alt=""
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      onLoad={(e) => check(e.currentTarget)}
      className={`block h-auto max-h-full w-auto max-w-full bg-paper ${
        framed ? "rounded-[1.5rem] border-[6px] border-ink" : "rounded-lg border rule-hair"
      }`}
    />
  );
}

/* ------------------------------------------------------------------------------------ */
/* Details: the facts, and a link for each one                                           */
/* ------------------------------------------------------------------------------------ */

export function BuildDetails({ bench, className = "" }: { bench: Bench; className?: string }) {
  const { active, step, visible } = bench;
  const p = active;
  const status = statusLabel(p);
  const stack = p.stack ?? [];
  const shownStack = stack.slice(0, 3);
  const position = visible.findIndex((v) => v.id === p.id);

  const navButton =
    "inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-mute transition-colors duration-150 hover:bg-paper-deep hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

  return (
    <div className={className} aria-label="Selected build" role="region">
      <div className="flex items-center justify-between">
        <p className="text-xs tabular-nums text-ink-mute">
          Build {NUMBER.get(p.id)} of {String(ORDERED.length).padStart(2, "0")}
          {visible.length < ORDERED.length && position >= 0
            ? ` · ${position + 1} of ${visible.length} in this filter`
            : ""}
        </p>
        <div className="-mr-3 flex">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous build"
            className={navButton}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next build"
            className={navButton}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="mt-1 font-serif text-4xl leading-none text-ink">{p.name}</p>
      <p className="mt-2 text-sm text-ink-mute">
        {builtFor(p)} · {p.year}
        {status ? ` · ${status}` : ""}
      </p>

      <p className="mt-4 line-clamp-3 min-h-[4.875em] text-[15px] leading-relaxed text-ink-soft">
        {p.blurb}
      </p>

      {shownStack.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Built with">
          {shownStack.map((s) => (
            <li key={s} className="rounded-sm border rule-hair px-2 py-0.5 text-xs text-ink-soft">
              {s}
            </li>
          ))}
          {stack.length > shownStack.length && (
            <li className="px-1 py-0.5 text-xs text-ink-mute">
              +{stack.length - shownStack.length} more
            </li>
          )}
        </ul>
      )}

      {p.learned && (
        <figure className="mt-5 border-l-2 border-ink pl-3">
          <figcaption className="text-xs text-ink-mute">What it taught me</figcaption>
          <blockquote className="mt-1 line-clamp-2 min-h-[2.75em] font-serif text-lg italic leading-snug text-ink">
            {p.learned}
          </blockquote>
        </figure>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 border-t rule-hair pt-2 text-sm font-medium">
        <Link
          to="/works/$id"
          params={{ id: p.id }}
          className="group inline-flex min-h-11 items-center gap-1.5 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          Case study
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1"
          />
        </Link>
        {p.live && (
          <a
            href={p.live}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center gap-1.5 text-ink-soft transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            Live site
            <ArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
        {p.github && (
          <a
            href={p.github}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center gap-1.5 text-ink-soft transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            Source
            <ArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </div>
  );
}
