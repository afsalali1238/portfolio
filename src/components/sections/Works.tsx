import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, LayoutGrid, List } from "lucide-react";
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

function CardPoster({ src, isMobile }: { src: string; isMobile: boolean }) {
  const [landscape, setLandscape] = useState(false);
  const check = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth) {
      setLandscape(img.naturalWidth > img.naturalHeight);
    }
  };
  const framed = isMobile && !landscape;
  return (
    <div className="flex h-full w-full items-center justify-center p-3" style={{ backgroundColor: "var(--bg-raised)" }}>
      <img
        ref={check}
        src={src}
        alt=""
        loading="lazy"
        onLoad={(e) => check(e.currentTarget)}
        className={`block h-auto max-h-full w-auto max-w-full transition-opacity duration-150 ${
          framed
            ? "rounded-[1.25rem] border-[4px]"
            : "rounded-md"
        }`}
        style={{
          borderColor: framed ? "var(--fg)" : "var(--hairline)",
          objectFit: framed ? undefined : "contain",
        }}
      />
    </div>
  );
}

/** The full catalogue on /works. Every build features rich visuals, media preview, and teardowns. */
export function Works({
  filter,
  view = "grid",
}: {
  filter: ProjectFilter;
  view?: "grid" | "table";
}) {
  const viewMode = view;
  const filtered = projects.filter((p) => matchesFilter(p, filter));

  return (
    <section className="pb-24 pt-14 md:pb-32 md:pt-20">
      <Container>
        <SectionReveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="t-label">II ── CATALOGUE</p>
              <h1 className="t-display-1 mt-2">The builds.</h1>
              <p className="t-lede mt-3 max-w-xl">
                {numberWord(projectCount)} quiet tools, clinical companions, and experiments.{" "}
                {numberWord(sourceCount)} have public source code.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View Switcher */}
              <div className="inline-flex items-center rounded-md" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg)", padding: "4px" }}>
                <Link
                  to="/works"
                  search={(prev) => ({ ...prev, view: undefined })}
                  replace
                  resetScroll={false}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-medium transition-colors ${
                    viewMode === "grid" ? "bg-fg text-bg" : "hover:is-lit"
                  }`}
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Visual gallery</span>
                </Link>
                <Link
                  to="/works"
                  search={(prev) => ({ ...prev, view: "table" as const })}
                  replace
                  resetScroll={false}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 font-medium transition-colors ${
                    viewMode === "table" ? "bg-fg text-bg" : "hover:is-lit"
                  }`}
                  aria-pressed={viewMode === "table"}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Index table</span>
                </Link>
              </div>

              <p className="t-small" aria-live="polite">
                {numberWord(filtered.length)} of {numberWord(projectCount).toLowerCase()} shown
              </p>
            </div>
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

        {/* Visual Gallery View (Default) */}
        {viewMode === "grid" ? (
          <ul className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const posterSrc = p.media?.poster ?? `/works/${p.id}/poster.jpg`;
              const isMobile = p.media?.kind === "mobile" || p.platform === "pwa";

              return (
                <li key={p.id}>
                  <Link
                    to="/works/$id"
                    params={{ id: p.id }}
                    className="group flex h-full flex-col justify-between overflow-hidden rounded-lg" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg)", transition: "all 150ms" }}
                  >
                    <div>
                      {/* Media Container with Phone/Desktop Frame Preview */}
                      <div className="relative block aspect-[16/10] overflow-hidden border-b" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--bg-raised)" }} tabIndex={-1} aria-hidden="true">
                        <CardPoster src={posterSrc} isMobile={isMobile} />

                        {/* Device / Platform Badge */}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full" style={{ backgroundColor: "rgba(11,12,14,0.9)", padding: "4px 12px" }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--fg)" }} />
                          <span className="capitalize text-xs font-medium" style={{ color: "var(--bg)" }}>
                            {isMobile ? "Phone build" : "Web build"}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {p.status && (
                          <div className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium capitalize" style={{ backgroundColor: "rgba(238,234,225,0.95)", color: "var(--fg)", border: "1px solid var(--hairline)" }}>
                            {p.status}
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                          <span style={{ fontWeight: "500", color: "var(--fg)" }}>{builtForLabel(p.for)}</span>
                        </div>

                        <div className="mt-3 flex items-baseline gap-2">
                          <Link
                            to="/works/$id"
                            params={{ id: p.id }}
                            className="t-display-3 card-title transition-colors hover:is-lit"
                          >
                            {p.name}
                          </Link>
                          {p.featured && (
                            <span className="rounded-xs px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--fg)", color: "var(--bg)" }}>
                              Spotlight
                            </span>
                          )}
                        </div>

                        <p className="mt-3 t-small" style={{ color: "var(--fg-muted)" }}>{p.blurb}</p>

                        {/* Tech Stack Chips */}
                        {p.stack && p.stack.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {p.stack.slice(0, 4).map((tech) => (
                              <span key={tech} className="chip">{tech}</span>
                            ))}
                            {p.stack.length > 4 && (
                              <span className="text-xs self-center" style={{ color: "var(--fg-muted)" }}>
                                +{p.stack.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between border-t px-6 py-4 text-xs font-medium" style={{ borderColor: "var(--hairline)" }}>
                      <Link
                        to="/works/$id"
                        params={{ id: p.id }}
                        className="inline-flex items-center gap-1.5 transition-colors hover:is-lit"
                        style={{ color: "var(--fg)" }}
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
                            className="transition-colors hover:is-lit"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            Source <ArrowUpRight className="h-3.5 w-3.5" />
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        )}
                        {p.live && (
                          <a
                            href={p.live}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 transition-colors hover:is-lit"
                            style={{ color: "var(--fg)" }}
                          >
                            <span>{p.platform === "windows" ? "Download" : "Live site"}</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="mt-10" style={{ borderTop: "1px solid var(--hairline)" }}>
            {filtered.map((p) => (
              <li key={p.id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <Link
                  to="/works/$id"
                  params={{ id: p.id }}
                  className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 py-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink md:px-3"
                  style={{ backgroundColor: "transparent" }}
                >
                  <span className="col-span-12 flex flex-wrap items-baseline gap-3 md:col-span-5">
                    <span className="font-serif text-2xl leading-tight transition-transform duration-150 group-hover:translate-x-1 md:text-3xl card-title" style={{ color: "var(--fg)" }}>
                      {p.name}
                    </span>
                    {p.featured && (
                      <span className="rounded-xs px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--fg)", color: "var(--bg)" }}>
                        Spotlight
                      </span>
                    )}
                  </span>
                  <span className="col-span-12 text-sm md:col-span-4" style={{ color: "var(--fg-muted)" }}>{p.blurb}</span>
                  <span className="col-span-12 flex flex-wrap items-center justify-between gap-2.5 text-xs md:col-span-3 md:justify-end" style={{ color: "var(--fg-muted)" }}>
                    <span className="rounded-full px-2.5 py-0.5 font-medium chip" style={{ backgroundColor: "var(--bg-raised)", color: "var(--fg-muted)" }}>
                      {platformBadge(p)}
                    </span>
                    <span>{builtForLabel(p.for)}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" style={{ color: "var(--fg)" }} />
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
