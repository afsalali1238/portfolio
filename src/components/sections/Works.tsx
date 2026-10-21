import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, LayoutGrid, List, Sparkles } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projects, projectCount, numberWord, type Project } from "../../data/projects";
import {
  PROJECT_FILTERS,
  FILTER_LABELS,
  countFor,
  matchesFilter,
  type ProjectFilter,
} from "../../data/filters";

/** The full catalogue on /works. Every build features rich visuals, media preview, and teardowns. */
export function Works({ filter }: { filter: ProjectFilter }) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const filtered = projects.filter((p) => matchesFilter(p, filter));

  return (
    <section className="pb-24 pt-14 md:pb-32 md:pt-20">
      <Container>
        <SectionReveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-medium text-ink-mute">Catalogue of builds</div>
              <h1 className="mt-2 font-serif text-5xl md:text-7xl">Selected pieces.</h1>
              <p className="mt-3 max-w-xl text-base text-ink-soft">
                Sixteen quiet tools, clinical companions, and experiments. Each built for someone
                specific, with public source code and architecture notes.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View Switcher */}
              <div className="inline-flex items-center rounded-lg border rule-hair bg-paper p-1 text-xs text-ink-mute">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                    viewMode === "grid" ? "bg-ink text-paper shadow-xs" : "hover:text-ink"
                  }`}
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Visual gallery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors ${
                    viewMode === "table" ? "bg-ink text-paper shadow-xs" : "hover:text-ink"
                  }`}
                  aria-pressed={viewMode === "table"}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Index table</span>
                </button>
              </div>

              <p className="text-xs text-ink-mute" aria-live="polite">
                {numberWord(filtered.length)} of {numberWord(projectCount).toLowerCase()}
              </p>
            </div>
          </div>

          {/* Filter Pills */}
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
                  className={`inline-flex min-h-10 items-center rounded-full px-4 text-xs md:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                    active
                      ? "bg-ink text-paper"
                      : "bg-paper-deep/70 text-ink-soft hover:bg-paper-deep hover:text-ink"
                  }`}
                >
                  {FILTER_LABELS[key]}
                  <span className="ml-1.5 text-[11px] opacity-60">{countFor(key)}</span>
                </Link>
              );
            })}
          </nav>
        </SectionReveal>

        {/* Visual Gallery View (Default) */}
        {viewMode === "grid" ? (
          <ul className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const posterSrc = p.media?.poster ?? `/works/${p.id}/poster.jpg`;
              const isMobile = p.media?.kind === "mobile";

              return (
                <li key={p.id}>
                  <div className="group flex h-full flex-col justify-between overflow-hidden rounded-xl border rule-hair bg-paper transition-all duration-300 hover:border-ink/50 hover:bg-paper-deep/20 hover:shadow-md">
                    <div>
                      {/* Media Container with Image Preview */}
                      <Link
                        to="/works/$id"
                        params={{ id: p.id }}
                        className="relative block aspect-[16/10] overflow-hidden border-b rule-hair bg-paper-deep"
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        <img
                          src={posterSrc}
                          alt={`${p.name} preview`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Device / Kind Badge */}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/85 px-2.5 py-0.5 text-[10px] font-medium text-paper backdrop-blur-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" />
                          <span>{isMobile ? "Mobile app" : "Desktop app"}</span>
                        </div>

                        {/* Status Badge */}
                        {p.status && (
                          <div className="absolute right-3 top-3 rounded-full bg-paper/90 px-2.5 py-0.5 text-[10px] font-medium text-ink shadow-xs backdrop-blur-xs capitalize">
                            {p.status}
                          </div>
                        )}
                      </Link>

                      {/* Card Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between text-xs text-ink-mute">
                          <span className="font-medium">Built for {p.for}</span>
                          <span>{p.year}</span>
                        </div>

                        <div className="mt-3 flex items-baseline gap-2">
                          <Link
                            to="/works/$id"
                            params={{ id: p.id }}
                            className="font-serif text-3xl leading-none text-ink hover:text-accent-ink transition-colors focus-visible:outline-none"
                          >
                            {p.name}
                          </Link>
                          {p.featured && (
                            <span className="inline-flex items-center gap-1 rounded-xs bg-ink px-1.5 py-0.5 text-[10px] font-medium text-paper">
                              <Sparkles className="h-2.5 w-2.5" />
                              Spotlight
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-ink-soft">{p.blurb}</p>

                        {/* Tech Stack Chips */}
                        {p.stack && p.stack.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {p.stack.slice(0, 4).map((tech) => (
                              <span
                                key={tech}
                                className="rounded-md bg-paper-deep px-2 py-0.5 text-[10px] font-mono text-ink-soft"
                              >
                                {tech}
                              </span>
                            ))}
                            {p.stack.length > 4 && (
                              <span className="text-[10px] text-ink-mute self-center">
                                +{p.stack.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between border-t rule-hair px-6 py-4 text-xs font-medium">
                      <Link
                        to="/works/$id"
                        params={{ id: p.id }}
                        className="inline-flex items-center gap-1.5 text-ink hover:text-accent-ink transition-colors"
                      >
                        <span>Case study</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>

                      <div className="flex items-center gap-3">
                        {p.github && (
                          <a
                            href={p.github}
                            target="_blank"
                            rel="noreferrer"
                            className="text-ink-mute hover:text-ink transition-colors"
                          >
                            Source ↗
                          </a>
                        )}
                        {p.live && (
                          <a
                            href={p.live}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-ink hover:text-accent-ink transition-colors"
                          >
                            <span>Live site</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          /* Index Table View */
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
        )}
      </Container>
    </section>
  );
}
