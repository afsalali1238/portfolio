import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { getProjectById, projectCount, numberWord, type Project } from "../../data/projects";

/**
 * Minimal featured showcase on the homepage (3 flagship pieces).
 * The full 16-piece visual catalogue lives on /works.
 */
const FEATURED_IDS = ["kine", "provia", "doomscholar"];

const featured = FEATURED_IDS.map(getProjectById).filter((p): p is Project => Boolean(p));

export function FeaturedWorks() {
  return (
    <section aria-labelledby="featured-heading" className="py-20 md:py-28 border-t rule-hair">
      <Container>
        <SectionReveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-medium text-ink-mute">Selected builds</div>
            <h2 id="featured-heading" className="mt-2 font-serif text-4xl md:text-5xl">
              Made for someone.
            </h2>
          </div>
          <Link
            to="/works"
            className="group inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-ink md:self-auto hover:text-accent-ink transition-colors"
          >
            All {numberWord(projectCount).toLowerCase()} builds
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </SectionReveal>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {featured.map((p) => (
            <li key={p.id}>
              <Link
                to="/works/$id"
                params={{ id: p.id }}
                className="group flex h-full flex-col justify-between overflow-hidden rounded-xl border rule-hair bg-paper p-5 transition-all duration-300 hover:border-ink/40 hover:bg-paper-deep/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute"
              >
                <div>
                  {p.media && (
                    <div className="relative -mx-5 -mt-5 mb-5 aspect-[16/10] overflow-hidden rounded-t-xl border-b rule-hair bg-paper-deep">
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
                  <h3 className="mt-3 font-serif text-3xl leading-none text-ink">{p.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft line-clamp-3">
                    {p.blurb}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t rule-hair pt-3 text-xs font-medium text-ink">
                  <span>Read case study</span>
                  {p.live ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-ink-mute transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-ink-mute transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Minimal prominent CTA */}
        <div className="mt-14 flex flex-col items-center justify-center text-center">
          <Link
            to="/works"
            className="group inline-flex min-h-12 items-center gap-3 rounded-md bg-ink px-8 text-sm md:text-base font-medium text-paper transition-all hover:bg-ink-soft hover:shadow-md"
          >
            <span>Explore all {numberWord(projectCount).toLowerCase()} builds</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </Link>
          <p className="mt-2.5 text-xs text-ink-mute">
            Explore 3D tools, clinical Arabic apps, and quiet software with visual explainers
          </p>
        </div>
      </Container>
    </section>
  );
}
