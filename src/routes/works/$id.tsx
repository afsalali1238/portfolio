import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Github, ExternalLink } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { LogoMark } from "../../components/sections/Nav";
import { getProjectById, getNextAndPrevProjects } from "../../data/projects";

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
    return {
      meta: [
        { title: `${project.name} · forthe.tech` },
        { name: "description", content: project.blurb },
        { property: "og:title", content: `${project.name} · forthe.tech` },
        { property: "og:description", content: project.detail },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: ProjectCaseStudy,
  notFoundComponent: ProjectNotFound,
});

function ProjectCaseStudy() {
  const { project, prev, next } = Route.useLoaderData();

  return (
    <div className="min-h-svh bg-paper text-ink pb-24">
      {/* Top back navigation */}
      <header className="sticky top-0 z-30 border-b rule-hair backdrop-blur bg-paper/80 py-4">
        <Container className="flex items-center justify-between">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to ledger</span>
          </Link>

          <Link to="/" className="flex items-center gap-2 text-sm font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-ink text-paper">
              <LogoMark className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif text-lg">forthe.tech</span>
          </Link>
        </Container>
      </header>

      {/* Main case study */}
      <main>
        <Container className="max-w-4xl pt-12 md:pt-20">
          <SectionReveal>
            {/* Meta badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-mute">
              <span className="rounded-full bg-paper-deep px-3 py-1 font-medium text-ink-soft">
                {project.year}
              </span>
              <span>·</span>
              <span className="rounded-full bg-paper-deep px-3 py-1 font-medium text-ink-soft">
                Built for {project.for}
              </span>
              {project.featured && (
                <>
                  <span>·</span>
                  <span className="rounded-full bg-ink px-3 py-1 font-medium text-paper">
                    Spotlight Build
                  </span>
                </>
              )}
            </div>

            {/* Title & One-liner */}
            <h1 className="mt-6 font-serif text-5xl md:text-7xl leading-[1.02] text-ink">
              {project.name}
            </h1>
            <p className="mt-6 font-serif text-2xl md:text-3xl leading-relaxed text-ink-soft italic">
              {project.blurb}
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-b rule-hair pb-10">
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-transform hover:-translate-y-0.5"
                >
                  Visit Live Site <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border rule-hair bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-deep"
                >
                  Source Code <Github className="h-4 w-4" />
                </a>
              )}
            </div>
          </SectionReveal>

          {/* Deep-dive sections */}
          <div className="mt-12 space-y-12">
            {/* The Human Friction */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                01 · The Human Friction
              </div>
              <h2 className="font-serif text-3xl text-ink">Why this exists.</h2>
              <p className="text-base md:text-lg leading-relaxed text-ink-soft">
                {project.problem || project.detail}
              </p>
            </SectionReveal>

            {/* The Build & Architecture */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                02 · The Solution
              </div>
              <h2 className="font-serif text-3xl text-ink">How it was built.</h2>
              <p className="text-base md:text-lg leading-relaxed text-ink-soft">
                {project.solution || project.detail}
              </p>
            </SectionReveal>

            {/* Key Highlights */}
            {project.highlights && project.highlights.length > 0 && (
              <SectionReveal className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                  03 · Engineering Highlights
                </div>
                <h2 className="font-serif text-3xl text-ink">Concrete Capabilities</h2>
                <ul className="space-y-3 pt-2">
                  {project.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 text-base text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ink shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </SectionReveal>
            )}

            {/* Tech Stack */}
            <SectionReveal className="space-y-4 rounded-lg bg-paper-deep/50 p-6 md:p-8">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                04 · Technical Stack & Standards
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {(project.stack || project.tags).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border rule-hair bg-paper px-3 py-1.5 text-xs font-medium text-ink"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </SectionReveal>
          </div>

          {/* Next / Previous Project Footer */}
          <div className="mt-16 border-t rule-hair pt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            {prev ? (
              <Link
                to="/works/$id"
                params={{ id: prev.id }}
                className="group flex flex-col text-left"
              >
                <span className="text-xs text-ink-mute flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                  Previous build
                </span>
                <span className="font-serif text-xl text-ink group-hover:text-ink-soft transition-colors mt-1">
                  {prev.name}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                to="/works/$id"
                params={{ id: next.id }}
                className="group flex flex-col text-right sm:text-right"
              >
                <span className="text-xs text-ink-mute flex items-center justify-end gap-1">
                  Next build
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="font-serif text-xl text-ink group-hover:text-ink-soft transition-colors mt-1">
                  {next.name}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </Container>
      </main>
    </div>
  );
}

function ProjectNotFound() {
  return (
    <div className="min-h-svh flex items-center justify-center bg-paper px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-6xl text-ink">404</h1>
        <h2 className="mt-2 font-serif text-2xl text-ink-soft">Build not found</h2>
        <p className="mt-2 text-sm text-ink-mute">
          The requested project does not exist in the public ledger.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper"
          >
            <ArrowLeft className="h-4 w-4" /> Return to ledger
          </Link>
        </div>
      </div>
    </div>
  );
}
