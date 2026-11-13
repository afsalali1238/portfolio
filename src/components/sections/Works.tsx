import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projects, projectCount, sourceCount, numberWord, type Project } from "../../data/projects";
import {
  PROJECT_FILTERS,
  FILTER_LABELS,
  countFor,
  matchesFilter,
  type ProjectFilter,
} from "../../data/filters";

function platformBadge(p: Project) {
  if (p.platform === "windows") return "Windows app";
  if (p.platform === "cli") return "CLI tool";
  if (p.platform === "pwa") return "Phone app (PWA)";
  if (p.media?.kind === "mobile") return "Phone app";
  return "Web app";
}

function builtForLabel(forWho: string) {
  const lower = forWho.toLowerCase();
  if (lower === "wife") return "Built for my wife";
  if (lower === "me") return "Built for me";
  if (lower === "friends") return "Built for friends";
  return `Built for ${forWho}`;
}

/** The full catalogue on /works. Every build features rich visuals, media preview, and teardowns. */
export function Works({
  filter,
  view = "grid",
}: {
  filter: ProjectFilter;
  view?: "grid" | "table";
}) {
  const filtered = projects.filter((p) => matchesFilter(p, filter));

  return (
    <section className="pb-24 pt-14 md:pb-32 md:pt-20">
      <Container>
        <SectionReveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="t-label">II ── CATALOGUE</p>
              <h1 className="t-display-1">The builds.</h1>
              <p className="t-lede mt-4 max-w-xl">
                {numberWord(projectCount)} quiet tools, clinical companions, and experiments.{" "}
                {numberWord(sourceCount)} have public source code.
              </p>
            </div>

            <p className="t-small" aria-live="polite">
              {numberWord(filtered.length)} of {numberWord(projectCount).toLowerCase()} shown
            </p>
          </div>

          {/* Filter Pills: chips */}
          <nav aria-label="Filter builds" className="mt-8 flex flex-wrap items-center gap-2">
            {PROJECT_FILTERS.map((key) => {
              const active = filter === key;
              return (
                <Link
                  key={key}
                  to="/works"
                  search={(prev) => ({
                    ...prev,
                    filter: key === "all" ? undefined : key,
                  })}
                  replace
                  resetScroll={false}
                  aria-current={active ? "true" : undefined}
                  className={`chip ${active ? "selected" : ""}`}
                >
                  {FILTER_LABELS[key]}
                  {active && <span className="chip-dot" />}
                  <span className="ml-1.5 opacity-60">{countFor(key)}</span>
                </Link>
              );
            })}
          </nav>
        </SectionReveal>

        {/* Hairline rows - no boxes */}
        <ul className="mt-8 border-t" style={{ borderColor: "var(--hairline)" }}>
          {filtered.map((p, index) => (
            <li key={p.id} className="card-row">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="t-label" style={{ minWidth: "40px" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Link
                  to="/works/$id"
                  params={{ id: p.id }}
                  className="t-display-3 card-title flex-1 min-w-0"
                >
                  {p.name}
                </Link>
                <span className="t-small flex-1 min-w-0 truncate">{p.blurb}</span>
                <span className="t-label flex items-center gap-2 text-nowrap">
                  {p.status && <span className="status-dot" style={{ backgroundColor: p.status === "live" ? "var(--lit)" : "transparent", borderColor: p.status === "live" ? "var(--lit)" : "var(--fg-faint)" }} />}
                  <span>{platformBadge(p)}</span>
                  <span>·</span>
                  <span>{builtForLabel(p.for)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
