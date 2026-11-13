import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { PageShell } from "../../components/site/PageShell";
import { ExplainerVideo } from "../../components/site/ExplainerVideo";
import { getProjectById, getNextAndPrevProjects, type Project } from "../../data/projects";
import { getRelatedNotesForProject } from "../../data/dispatches";
import { seo, SITE_URL, AUTHOR } from "../../lib/site";

/** schema.org category from the project's tags */
function appCategory(p: Project) {
  const t = p.tags.join(" ").toLowerCase();
  if (t.includes("game")) return "GameApplication";
  if (t.includes("healthcare")) return "HealthApplication";
  if (t.includes("edtech") || t.includes("literacy")) return "EducationalApplication";
  if (t.includes("marketplace")) return "ShoppingApplication";
  if (t.includes("ai agents") || t.includes("cli")) return "DeveloperApplication";
  return "WebApplication";
}

function operatingSystem(p: Project) {
  if (p.platform === "windows") return "Windows";
  if (p.platform === "cli") return "Cross-platform CLI";
  if (p.platform === "pwa") return "iOS, Android, Web (PWA)";
  return "Web";
}

function platformBadge(p: Project) {
  if (p.platform === "windows") return "Windows app";
  if (p.platform === "cli") return "CLI tool";
  if (p.platform === "pwa") return "Phone app (PWA)";
  if (p.media?.kind === "mobile") return "Phone app";
  return "Web app";
}

function projectSchema(p: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: p.name,
    description: p.detail,
    url: p.live ?? `${SITE_URL}/works/${p.id}`,
    ...(p.github ? { codeRepository: p.github } : {}),
    applicationCategory: appCategory(p),
    operatingSystem: operatingSystem(p),
    author: { "@type": "Person", name: AUTHOR, url: SITE_URL },
    dateCreated: p.year,
    keywords: p.tags.join(", "),
  };
}

export const Route = createFileRoute("/works/$id")({
  loader: ({ params }) => {
    const project = getProjectById(params.id);
    if (!project) {
      throw notFound();
    }
    const { prev, next } = getNextAndPrevProjects(params.id);
    return { project, prev, next };
  },
  head: ({ loaderData }) => {
    if (!loaderData?.project) return {};
    const { project } = loaderData;
    const tags = seo({
      title: `${project.name} · forthe.tech`,
      description: project.blurb,
      path: `/works/${project.id}`,
      image: `/og/${project.id}.png`,
      imageAlt: `${project.name} — ${project.blurb}`,
      type: "article",
    });
    return {
      ...tags,
      scripts: [{ type: "application/ld+json", children: JSON.stringify(projectSchema(project)) }],
    };
  },
  component: ProjectCaseStudy,
  notFoundComponent: ProjectNotFound,
});

function ProjectCaseStudy() {
  const { project, prev, next } = Route.useLoaderData();

  const problemText = project.problem ?? project.detail;
  const solutionText = project.solution ?? (project.problem ? project.detail : undefined);

  return (
    <PageShell>
      <Container className="max-w-4xl pt-8">
        <Link
          to="/works"
          className="group inline-flex min-h-11 items-center gap-2 t-small text-nowrap transition-colors hover:is-lit"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          All work
        </Link>
      </Container>

      {/* Main case study */}
      <article className="pb-24">
        <Container className="max-w-4xl pt-6 md:pt-12">
          <SectionReveal>
            {/* Four-column telemetry header — like Thesis telemetry row */}
            <div 
              className="telemetry-row"
              style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr 1.18fr 1fr", 
                gap: "12px",
                paddingBottom: "12px",
                borderBottom: "1px solid var(--hairline)",
                marginBottom: "24px"
              }}
            >
              <div>
                <div className="t-label" style={{ color: "var(--fg-faint)" }}>STATUS</div>
                <div className="t-num" style={{ fontSize: "16px", color: "var(--fg)", marginTop: "8px" }}>
                  {project.status ?? "—"}
                </div>
              </div>
              <div>
                <div className="t-label" style={{ color: "var(--fg-faint)" }}>PLATFORM</div>
                <div className="t-num" style={{ fontSize: "16px", color: "var(--fg)", marginTop: "8px" }}>
                  {platformBadge(project)}
                </div>
              </div>
              <div>
                <div className="t-label" style={{ color: "var(--fg-faint)" }}>BUILT FOR</div>
                <div className="t-num" style={{ fontSize: "16px", color: "var(--fg)", marginTop: "8px" }}>
                  {project.for.toLowerCase() === "wife" ? "My wife" : project.for.toLowerCase() === "me" ? "Me" : project.for}
                </div>
              </div>
              <div>
                <div className="t-label" style={{ color: "var(--fg-faint)" }}>STACK</div>
                <div className="t-num" style={{ fontSize: "16px", color: "var(--fg)", marginTop: "8px" }}>
                  {(project.stack || project.tags).slice(0, 3).join(" · ")}
                  {(project.stack || project.tags).length > 3 && " …"}
                </div>
              </div>
            </div>

            {/* Title & Lede */}
            <h1 className="t-display-1">{project.name}</h1>
            <p className="t-lede mt-6">{project.blurb}</p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3" style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: "24px" }}>
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  {project.platform === "windows" ? "Windows app · download" : "Visit live site"}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Source code <Github className="h-4 w-4" />
                </a>
              )}
            </div>

            {/* Visual Explainer / Interactive Walkthrough */}
            {project.media && (
              <div className="mt-12" style={{ borderBottom: "1px solid var(--hairline)", paddingBottom: "24px" }}>
                <ExplainerVideo
                  media={project.media}
                  title={project.name}
                  stills={project.media.stills}
                />
              </div>
            )}
          </SectionReveal>

          {/* Deep-dive sections */}
          <div className="mt-12 space-y-12">
            {/* The Human Friction */}
            {problemText && (
              <SectionReveal className="space-y-4">
                <p className="t-label">01 ── WHY THIS EXISTS</p>
                <h2 className="t-display-2">Why this exists.</h2>
                <p className="t-body">{problemText}</p>
              </SectionReveal>
            )}

            {/* The Build & Architecture */}
            {solutionText && (
              <SectionReveal className="space-y-4">
                <p className="t-label">02 ── HOW IT WAS BUILT</p>
                <h2 className="t-display-2">How it was built.</h2>
                <p className="t-body">{solutionText}</p>
              </SectionReveal>
            )}

            {/* Outcome */}
            {project.outcome && (
              <SectionReveal className="space-y-4">
                <p className="t-label">03 ── THE OUTCOME</p>
                <h2 className="t-display-2">The real result.</h2>
                <p className="t-body">{project.outcome}</p>
              </SectionReveal>
            )}

            {/* What I Learned */}
            {project.learned && (
              <SectionReveal className="space-y-4" style={{ borderLeft: "2px solid var(--fg)", paddingLeft: "24px", paddingTop: "8px", paddingBottom: "8px" }}>
                <p className="t-label">04 ── WHAT I LEARNED</p>
                <p className="t-display-3" style={{ fontStyle: "italic" }}>"{project.learned}"</p>
              </SectionReveal>
            )}

            {/* Key Highlights */}
            {project.highlights && project.highlights.length > 0 && (
              <SectionReveal className="space-y-4">
                <p className="t-label">05 ── HIGHLIGHTS</p>
                <h2 className="t-display-2">Concrete capabilities.</h2>
                <ul className="space-y-3 pt-2">
                  {project.highlights.map((h: string, i: number) => (
                    <li key={i} className="t-body flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: "var(--fg)" }} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </SectionReveal>
            )}

            {/* Tech Stack - Section 06 */}
            <SectionReveal className="space-y-4" style={{ backgroundColor: "var(--bg-raised)", padding: "24px", borderRadius: "4px" }}>
              <p className="t-label">06 ── TECHNICAL STACK</p>
              <h2 className="t-display-3">Tools and dependencies.</h2>
              <div className="flex flex-wrap gap-2 pt-2">
                {((project.stack || project.tags) as string[]).map((tech: string) => (
                  <span
                    key={tech}
                    className="chip"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </SectionReveal>

            {/* Related Essays & Dispatches */}
            {getRelatedNotesForProject(project.id).length > 0 && (
              <SectionReveal className="space-y-4" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg)", padding: "24px", borderRadius: "4px" }}>
                <p className="t-label">07 ── RELATED ESSAYS & DISPATCHES</p>
                <h2 className="t-display-3">Read the deeper thesis.</h2>
                <p className="t-small" style={{ color: "var(--fg-muted)" }}>
                  The operational context, design philosophy, and lessons behind this build:
                </p>
                <div className="space-y-3 pt-2">
                  {getRelatedNotesForProject(project.id).map((note) => (
                    <Link
                      key={note.number}
                      to={note.path}
                      className="card-row"
                      style={{ padding: "16px", borderRadius: "4px", borderColor: "var(--hairline)" }}
                    >
                      <div className="space-y-1">
                        <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                          No. {note.number} · {note.date}
                        </div>
                        <div className="t-display-3 group-hover:is-lit transition-colors">{note.title}</div>
                        <div className="t-small" style={{ color: "var(--fg-muted)" }}>{note.subtitle}</div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 t-label">
                        <span>Read essay</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionReveal>
            )}
          </div>

          {/* Next / Previous Project Footer — hairline rows */}
          <div className="mt-16" style={{ borderTop: "1px solid var(--hairline)", paddingTop: "24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {prev ? (
                <Link
                  to="/works/$id"
                  params={{ id: prev.id }}
                  className="card-row group"
                  style={{ padding: "0", borderTop: "none", borderBottom: "none" }}
                >
                  <span className="t-label" style={{ minWidth: "100px" }}>
                    <ArrowLeft className="h-3 w-3 inline transition-transform group-hover:-translate-x-1" />
                    Previous build
                  </span>
                  <span className="t-display-3 card-title flex-1 min-w-0">{prev.name}</span>
                </Link>
              ) : null}
              {next ? (
                <Link
                  to="/works/$id"
                  params={{ id: next.id }}
                  className="card-row group"
                  style={{ padding: "0", borderTop: "none", borderBottom: "none" }}
                >
                  <span className="t-label" style={{ minWidth: "100px" }}>
                    Next build
                    <ArrowRight className="h-3 w-3 inline transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="t-display-3 card-title flex-1 min-w-0 text-right">{next.name}</span>
                </Link>
              ) : null}
            </div>
          </div>
        </Container>
      </article>
    </PageShell>
  );
}

function ProjectNotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[60svh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="t-display-1">404</h1>
          <h2 className="t-display-3 mt-4">Build not found</h2>
          <p className="t-body mt-4" style={{ color: "var(--fg-muted)" }}>
            The requested project does not exist in the public ledger.
          </p>
          <div className="mt-8">
            <Link
              to="/works"
              className="btn-primary"
            >
              <ArrowLeft className="h-4 w-4" /> See all work
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
