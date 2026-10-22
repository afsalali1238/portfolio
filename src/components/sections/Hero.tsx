import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container } from "../layout/Container";
import { projectCount, numberWord } from "../../data/projects";
import { RevealWord } from "./hero-helpers";
import { BuildDetails, BuildIndex, BuildStage } from "./hero-bench";
import { useBench } from "./hero-bench-state";

/**
 * The hero is the index: the thesis on the left, every build underneath it as a cell,
 * and on the right the build you're pointing at, shown for real (screenshot, facts, links).
 *
 * Layout: one grid. On phones the order is thesis → stage → cells → details, so a tap on
 * a cell changes the screenshot just above it and the facts just below. From lg up the
 * right-hand wrapper becomes a column that spans both rows (thesis + cells on the left).
 */
export function Hero() {
  const bench = useBench();

  return (
    <section aria-labelledby="hero-heading" className="pb-14 pt-10 md:pb-20 md:pt-14">
      <Container>
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr]">
          <div className="order-1 lg:col-span-7 lg:row-start-1">
            <h1 id="hero-heading" className="font-serif tracking-tight">
              <span className="block text-[12vw] leading-[0.88] text-ink md:text-[5.5rem] lg:text-[6rem] xl:text-[6.8rem]">
                <RevealWord delay={0.05}>For the tech.</RevealWord>
              </span>
              <span className="mt-2 block text-[7.5vw] italic leading-[1.02] text-ink-mute md:text-[3.2rem] lg:text-[3.3rem] xl:text-[3.8rem]">
                <RevealWord delay={0.18} italic>
                  Not because anyone asked.
                </RevealWord>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft md:text-lg">
              Documenting what happens when the wall between having an idea and building it
              disappears. {numberWord(projectCount)} quiet tools, public code, and honest field
              notes.
            </p>

            <div className="mt-7 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center">
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

          <BuildIndex
            bench={bench}
            className="order-3 lg:order-none lg:col-span-7 lg:row-start-2 lg:self-end"
          />

          {/* On phones this wrapper dissolves (display: contents) so its two children can sit
              either side of the cells; from lg up it's the right-hand column. */}
          <div className="contents lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:flex lg:flex-col lg:gap-6">
            <BuildStage bench={bench} className="order-2 lg:order-none" />
            <BuildDetails bench={bench} className="order-4 lg:order-none" />
          </div>
        </div>
      </Container>
    </section>
  );
}
