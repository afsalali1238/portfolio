import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projects, projectCount, numberWord } from "../../data/projects";
import {
  PROJECT_FILTERS,
  FILTER_LABELS,
  countFor,
  matchesFilter,
  type ProjectFilter,
} from "../../data/filters";

/** The full catalogue on /works. Every row is a link straight to its case study. */
export function Works({ filter }: { filter: ProjectFilter }) {
  const filtered = projects.filter((p) => matchesFilter(p, filter));

  return (
    <section className="pb-20 pt-14 md:pb-28 md:pt-20">
      <Container>
        <SectionReveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-medium text-ink-mute">Catalogue of builds</div>
              <h1 className="mt-2 font-serif text-5xl md:text-7xl">Selected pieces.</h1>
            </div>
            <p className="text-sm text-ink-mute" aria-live="polite">
              {numberWord(filtered.length)} of {numberWord(projectCount).toLowerCase()} shown
            </p>
          </div>

          <nav aria-label="Filter builds" className="mt-8 flex flex-wrap items-center gap-2">
            {PROJECT_FILTERS.map((key) => {
              const active = filter === key;
              return (
                <Link
                  key={key}
                  to="/works"
                  search={key === "all" ? {} : { filter: key }}
                  replace
                  resetScroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                    active
                      ? "bg-ink text-paper"
                      : "bg-paper-deep/70 text-ink-soft hover:bg-paper-deep hover:text-ink"
                  }`}
                >
                  {FILTER_LABELS[key]}
                  <span className="ml-1.5 text-xs opacity-60">{countFor(key)}</span>
                </Link>
              );
            })}
          </nav>
        </SectionReveal>

        <ul className="mt-10 border-t rule-hair">
          {filtered.map((p) => (
            <li key={p.id} className="border-b rule-hair">
              <Link
                to="/works/$id"
                params={{ id: p.id }}
                className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 py-6 transition-colors hover:bg-paper-deep/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute md:px-3"
              >
                <span className="col-span-2 text-sm text-ink-mute md:col-span-1">{p.year}</span>
                <span className="col-span-10 flex flex-wrap items-baseline gap-3 md:col-span-4">
                  <span className="font-serif text-2xl leading-tight transition-transform duration-300 group-hover:translate-x-1.5 md:text-3xl">
                    {p.name}
                  </span>
                  {p.featured && (
                    <span className="rounded-xs bg-ink px-2 py-0.5 text-xs font-medium text-paper">
                      Spotlight
                    </span>
                  )}
                </span>
                <span className="col-span-12 text-sm text-ink-soft md:col-span-5">{p.blurb}</span>
                <span className="col-span-12 flex items-center justify-between gap-3 text-xs text-ink-mute md:col-span-2 md:justify-end">
                  <span>For {p.for}</span>
                  <ArrowRight className="h-4 w-4 text-ink transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
