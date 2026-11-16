import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container } from "../layout/Container";
import { projectCount, liveCount, forPeopleCount, sourceCount } from "../../data/projects";
import { RevealWord } from "./hero-helpers";
import { HeroPrism, type HeroPrismControl, type HeroSourceMode } from "./HeroPrism";
import type { ProjectFilter } from "../../data/filters";

/**
 * An interactive stat tile that opens the works catalogue pre-filtered.
 * Governed strictly by brand guidelines: tokens only, 150ms hover, 6px radius, no drop shadow.
 */
function StatLink({
  label,
  value,
  filterKey,
}: {
  label: string;
  value: string;
  filterKey: ProjectFilter;
}) {
  return (
    <Link
      to="/works"
      search={filterKey === "all" ? {} : { filter: filterKey }}
      className="group flex flex-col justify-between rounded-md p-3.5 sm:p-4 text-left transition-colors duration-150 hover:bg-paper-deep/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      aria-label={`${value} builds — ${label}. See them.`}
      data-hero-tile
    >
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-3xl sm:text-4xl leading-none text-ink transition-colors duration-150 group-hover:text-accent-ink">
          {value}
        </span>
        <span
          aria-hidden="true"
          className="text-xs text-ink-mute opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>
      <span className="mt-2.5 block text-xs font-medium text-ink-mute transition-colors duration-150 group-hover:text-ink">
        {label}
      </span>
    </Link>
  );
}

const LIGHT_MODE_COPY: Record<
  HeroSourceMode,
  { label: string; aria: string; announcement: string }
> = {
  rest: {
    label: "Aim light",
    aria: "Aim prism light source at the left facet",
    announcement: "",
  },
  left: {
    label: "Light · left facet",
    aria: "Prism light on left facet — activate for base facet",
    announcement: "Prism light aimed at left facet.",
  },
  base: {
    label: "Light · base facet",
    aria: "Prism light on base facet — activate for right facet",
    announcement: "Prism light aimed at base facet.",
  },
  right: {
    label: "Light · right facet",
    aria: "Prism light on right facet — activate to reset light",
    announcement: "Prism light aimed at right facet.",
  },
  custom: {
    label: "Reset light",
    aria: "Reset custom prism light source to resting ray",
    announcement: "Custom prism light source placed.",
  },
};

/**
 * The hero: authoritative thesis on the left, the idea ray dispersing across the right,
 * and four interactive verification stat tiles linking into the catalogue.
 */
export function Hero() {
  const prismControlRef = useRef<HeroPrismControl | null>(null);
  const [sourceMode, setSourceMode] = useState<HeroSourceMode>("rest");
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleSourceModeChange = (next: HeroSourceMode) => {
    if (next !== "rest") setHasInteracted(true);
    setSourceMode(next);
  };

  const controlCopy = LIGHT_MODE_COPY[sourceMode];

  return (
    <section
      aria-labelledby="hero-heading"
      data-hero
      className="relative overflow-hidden pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-12 md:pb-14"
    >
      {/* First paint: the field is drawn by the engine, which cannot run until hydration, so
          the section starts with the ambient wash in CSS and retires it on the engine's first
          frame (`data-hero-painted`). Without it a cold load shows an empty hero. */}
      <div aria-hidden="true" className="hero-wash pointer-events-none absolute inset-0 z-0" />

      {/* Background: one ray, one prism, one restrained dispersion fan (full-bleed) */}
      <HeroPrism
        className="absolute inset-0 z-0 h-full w-full"
        controlRef={prismControlRef}
        onSourceModeChange={handleSourceModeChange}
      />

      {/* No veils. The field stays bright under the words and the engine thins it there — the
          dissolve in hero-ray.ts replaces what used to be two gradient divs. A veil hides the
          drawing behind a gradient, which is exactly what produced the seam between the page
          and the graphic; a dissolve keeps them on one plane. */}
      <Container className="relative z-10" data-hero-container>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          {/* Left column: headline + thesis + CTAs.
              These widths are load-bearing for the composition behind them: hero-ray.ts places
              the prism as close to the column's centre line as this copy allows, so the right
              edge of the italic, the lede and the CTA row is what decides where the glass
              settles. Widening any of them pushes the whole picture back to the right. */}
          <div className="lg:col-span-7 space-y-6" data-hero-copy>
            <h1 id="hero-heading" className="font-serif tracking-tight">
              <span className="block text-[11.5vw] leading-[0.88] text-ink sm:text-[4.6rem] md:text-[5.5rem] lg:text-[6rem] xl:text-[6.8rem]">
                <RevealWord delay={0.05}>For the tech.</RevealWord>
              </span>
              <span
                data-hero-thesis
                className="mt-2 block text-[7.5vw] italic leading-[1.02] text-ink-mute dark:text-[color-mix(in_oklch,var(--ink-soft)_55%,var(--ink-mute))] sm:text-[3rem] md:text-[3.2rem] lg:text-[3.3rem] xl:text-[3.4rem]"
              >
                <RevealWord delay={0.18} italic>
                  Not because anyone asked.
                </RevealWord>
              </span>
            </h1>

            {/* Mobile centerpiece stage: interactive refraction playground */}
            <div
              data-hero-stage
              className="lg:hidden relative w-full h-[240px] sm:h-[280px] my-3 rounded-xl border border-ink/[0.08] dark:border-paper/[0.08] bg-transparent flex flex-col justify-between p-3 select-none touch-none"
              aria-label="Interactive prism refraction artwork"
            >
              {/* Subtle top indicator */}
              <div className="flex items-center justify-between w-full pointer-events-none">
                <span className="text-xs tracking-wider uppercase text-ink-mute/70 font-medium">
                  Refraction of Thought
                </span>
                <span className="text-xs text-ink-mute/60">
                  {sourceMode === "rest" ? "Resting ray" : "Pinned light"}
                </span>
              </div>

              {/* Bottom interactive controls */}
              <div className="flex items-center justify-between w-full pt-2 pointer-events-auto">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute/80 select-none">
                  {!hasInteracted && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-ink/40 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-ink/70" />
                    </span>
                  )}
                  <span>
                    {hasInteracted ? "Drag to steer · Tap to place" : "Touch & drag to refract"}
                  </span>
                </span>
                <button
                  type="button"
                  data-hero-control="cycle-light-mobile"
                  aria-label={controlCopy.aria}
                  onClick={() => {
                    setHasInteracted(true);
                    prismControlRef.current?.cyclePreset();
                  }}
                  className="inline-flex min-h-7 items-center gap-1.5 rounded-md border rule-hair bg-paper/90 dark:bg-paper-deep/90 px-2.5 py-1 text-xs font-medium text-ink shadow-xs transition-colors hover:bg-paper-deep active:scale-95"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-block h-1.5 w-1.5 rounded-full transition-colors ${
                      sourceMode === "rest" ? "bg-ink-mute/60" : "bg-accent-ink"
                    }`}
                  />
                  <span>{controlCopy.label}</span>
                </button>
              </div>
            </div>

            {/* max-w-md keeps the paragraph while clearing the glass's band. */}
            <p className="max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
              Documenting what happens when the wall between having an idea and building it
              disappears.
            </p>

            {/* `sm:w-fit`: the row's box is measured, so it must not be wider than its buttons. */}
            <div
              data-hero-ctas
              className="flex flex-col gap-3 pt-2 text-sm sm:w-fit sm:flex-row sm:flex-wrap sm:items-center"
            >
              <Link
                to="/works"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-6 text-paper transition-all duration-150 hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                See the builds
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                to="/notes"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md border rule-hair bg-paper px-6 text-ink transition-all duration-150 hover:bg-paper-deep hover:border-ink/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                Read the notes
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* Right column: breathing room so the copy never runs into the dispersion fan */}
          <div
            className="hidden lg:block lg:col-span-5 h-[360px] pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Shipped & verified metrics — stat tiles that pre-filter the catalogue */}
        <div
          data-hero-tiles
          className="mt-12 sm:mt-14 grid grid-cols-2 gap-3 sm:gap-4 rounded-lg bg-paper/[0.08] p-4 sm:p-6 backdrop-blur-[1.5px] text-sm md:grid-cols-4 border rule-hair shadow-xs"
        >
          <StatLink label="Total shipped" value={String(projectCount)} filterKey="all" />
          <StatLink label="Live on the internet" value={String(liveCount)} filterKey="live" />
          <StatLink label="Open source" value={String(sourceCount)} filterKey="oss" />
          <StatLink
            label="For wife, friends, me"
            value={String(forPeopleCount)}
            filterKey="for-people"
          />
        </div>

        {/* Quiet drafting-margin control: zero height shift (sits inside section pb-10..pb-14),
            hidden under prefers-reduced-motion, gives sighted and keyboard visitors a gentle
            way to discover and cycle prism refraction without competing with primary CTAs. */}
        <button
          type="button"
          data-hero-control="cycle-light"
          aria-label={controlCopy.aria}
          title="Tap anywhere in the hero to aim the light; activate to cycle facets; double-tap the light or press Escape to reset"
          onClick={() => {
            setHasInteracted(true);
            prismControlRef.current?.cyclePreset();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && sourceMode !== "rest") {
              e.preventDefault();
              prismControlRef.current?.reset();
            }
          }}
          className="motion-reduce:hidden hidden lg:inline-flex absolute right-6 md:right-10 -bottom-7 sm:-bottom-8 min-h-6 items-center gap-1.5 rounded px-1.5 py-0.5 text-xs font-medium tracking-wide text-ink-mute transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-150 ${
              sourceMode === "rest" ? "bg-ink-mute/60" : "bg-accent-ink"
            }`}
          />
          <span>{controlCopy.label}</span>
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {hasInteracted ? controlCopy.announcement || "Prism light reset to resting ray." : ""}
        </span>
      </Container>
    </section>
  );
}
