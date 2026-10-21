import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { getProjectById, projectCount, numberWord, type Project } from "../../data/projects";

/** Six builds on the home page; the rest live on /works. Order is editorial. */
const FEATURED_IDS = [
  "doomscholar",
  "kine",
  "pharmarab",
  "provia",
  "nxtdoorchef",
  "bodhi-pomodoro",
];

const featured = FEATURED_IDS.map(getProjectById).filter((p): p is Project => Boolean(p));

export function FeaturedWorks() {
  return (
    <section aria-labelledby="featured-heading" className="py-20 md:py-28">
      <Container>
        <SectionReveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-medium text-ink-mute">Selected builds</div>
            <h2 id="featured-heading" className="mt-2 font-serif text-5xl md:text-6xl">
              Made for someone.
            </h2>
          </div>
          <Link
            to="/works"
            className="group inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-ink md:self-auto"
          >
            All {numberWord(projectCount).toLowerCase()} builds
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </SectionReveal>

        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <li key={p.id}>
              <Link
                to="/works/$id"
                params={{ id: p.id }}
                className="group flex h-full flex-col justify-between overflow-hidden rounded-lg border rule-hair bg-paper p-6 transition-all hover:border-ink/40 hover:bg-paper-deep/40 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute"
              >
                <div>
                  {p.media && (
                    <div className="relative -mx-6 -mt-6 mb-5 aspect-[16/10] overflow-hidden rounded-t-lg border-b rule-hair bg-paper-deep">
                      <img
                        src={p.media.poster}
                        alt={`${p.name} preview`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-0.5 text-[10px] font-medium text-paper backdrop-blur-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" />
                        <span className="capitalize">{p.media.kind} build</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-ink-mute">
                    <span>Built for {p.for}</span>
                    <span>{p.year}</span>
                  </div>
                  <h3 className="mt-4 font-serif text-3xl leading-none text-ink md:text-4xl">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{p.blurb}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t rule-hair pt-4 text-sm">
                  <span className="font-medium text-ink">Read case study</span>
                  {p.live ? (
                    <ArrowUpRight className="h-4 w-4 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  ) : (
                    <ArrowRight className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Prominent CTA to explore all works */}
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <Link
            to="/works"
            className="group inline-flex min-h-12 items-center gap-3 rounded-md bg-ink px-8 text-sm md:text-base font-medium text-paper transition-all hover:bg-ink-soft hover:shadow-md"
          >
            <span>Explore all {numberWord(projectCount).toLowerCase()} builds</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </Link>
          <p className="mt-3 text-xs text-ink-mute">
            Full catalog with live sites, source code, and problem-solution teardowns
          </p>
        </div>
      </Container>
    </section>
  );
}
