import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container } from "../layout/Container";
import {
  projectCount,
  liveCount,
  forPeopleCount,
  sourceCount,
  numberWord,
} from "../../data/projects";
import { RevealWord } from "./hero-helpers";
import { HeroPrism } from "./HeroPrism";
import type { ProjectFilter } from "../../data/filters";

/** A stat tile that opens the catalogue pre-filtered, e.g. /works?filter=live. CSS-only, no motion. */
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
      className="group -m-2 flex flex-col rounded-md p-2 text-left transition-colors duration-150 hover:bg-paper-deep/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      aria-label={`${value} builds — ${label}. See them.`}
    >
      <span className="font-serif text-3xl leading-none text-ink">{value}</span>
      <span className="mt-2 flex items-center justify-between text-xs text-ink-mute transition-colors group-hover:text-ink">
        <span>{label}</span>
        <span
          aria-hidden="true"
          className="text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
        >
          see →
        </span>
      </span>
    </Link>
  );
}

/**
 * The hero: thesis on the left, interactive prism + constellation on the right,
 * and four stat links at the bottom that filter the catalogue.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-14 pb-12 md:pt-24 md:pb-16"
    >
      {/* Background interactive prism canvas */}
      <HeroPrism className="absolute inset-0 z-0 h-full w-full opacity-90 transition-opacity" />

      {/* Soft edge overlay for readability */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-paper/10 via-transparent to-paper/50"
        aria-hidden="true"
      />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          {/* Left column: headline + CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <h1 id="hero-heading" className="font-serif tracking-tight">
              <span className="block text-[12vw] leading-[0.88] md:text-[5.5rem] lg:text-[6rem] xl:text-[6.8rem] text-ink">
                <RevealWord delay={0.05}>For the tech.</RevealWord>
              </span>
              <span className="block mt-2 text-[7.5vw] leading-[1.02] italic text-ink-mute md:text-[3.2rem] lg:text-[3.3rem] xl:text-[3.8rem]">
                <RevealWord delay={0.18} italic>
                  Not because anyone asked.
                </RevealWord>
              </span>
            </h1>

            <p className="max-w-xl text-base md:text-lg leading-relaxed text-ink-soft">
              Documenting what happens when the wall between having an idea and building it
              disappears. {numberWord(projectCount)} quiet tools, public code, and honest field
              notes.
            </p>

            <div className="flex flex-col gap-3 pt-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/works"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-ink px-6 text-paper transition-colors duration-150 hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                See the builds
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                to="/notes"
                className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-md border rule-hair bg-paper px-6 text-ink transition-colors duration-150 hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                Read the notes
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* Right column: open visual space for the prism, spectrum & constellation */}
          <div
            className="hidden lg:block lg:col-span-5 h-[360px] pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Shipped & verified metrics — stat tiles that filter the catalogue */}
        <div className="mt-14 grid grid-cols-2 gap-6 rounded-lg bg-paper/90 p-6 backdrop-blur-xs text-sm md:grid-cols-4 md:p-8 border rule-hair">
          <StatLink label="Total shipped" value={String(projectCount)} filterKey="all" />
          <StatLink label="Live on the internet" value={String(liveCount)} filterKey="live" />
          <StatLink label="Open source" value={String(sourceCount)} filterKey="oss" />
          <StatLink
            label="For wife, friends, me"
            value={String(forPeopleCount)}
            filterKey="for-people"
          />
        </div>
      </Container>
    </section>
  );
}
