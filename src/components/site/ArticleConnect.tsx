import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, MessageSquare, Bookmark, Share2 } from "lucide-react";
import { type Dispatch, type PlatformLinks } from "../../data/dispatches";
import { projects } from "../../data/projects";
import { PageShell } from "../site/PageShell";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

const DEFAULT_LINKS: Required<PlatformLinks> = {
  substack: "https://substack.com/@afsalali",
  medium: "https://medium.com/@afsalali1238",
  linkedin: "https://www.linkedin.com/in/afsalali1238/",
  twitter: "https://x.com/afsallali",
};

/**
 * Shared article layout: label row, title, lede, body, related builds, discussion footer.
 */
export function ArticleLayout({
  dispatch,
  children,
  prev,
  next,
}: {
  dispatch: Dispatch;
  children: React.ReactNode;
  prev?: Dispatch;
  next?: Dispatch;
}) {
  const ext = dispatch.external ?? {};
  const substackUrl = ext.substack ?? DEFAULT_LINKS.substack;
  const mediumUrl = ext.medium ?? DEFAULT_LINKS.medium;
  const linkedinUrl = ext.linkedin ?? DEFAULT_LINKS.linkedin;
  const twitterUrl = ext.twitter ?? DEFAULT_LINKS.twitter;

  return (
    <PageShell readingProgress>
      <div className="pb-24">
        <Container className="max-w-3xl pt-14 md:pt-24">
          <SectionReveal>
            <Link
              to="/notes"
              className="mb-6 inline-flex items-center gap-1.5 t-label transition-colors hover:is-lit"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Dispatches
            </Link>
            <p className="t-label">Dispatch Nº {String(dispatch.number).padStart(2, "0")} · {dispatch.date} · {dispatch.readTime}</p>
            <h1 className="t-display-1 mt-3">{dispatch.title}</h1>
            <p className="t-lede mt-4" style={{ fontStyle: "italic", color: "var(--fg-muted)" }}>{dispatch.subtitle}</p>

            <div className="my-6 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)", paddingTop: "12px", paddingBottom: "12px" }}>
              <div className="flex flex-wrap items-center gap-2 t-label" style={{ color: "var(--fg-muted)" }}>
                <span className="font-medium" style={{ color: "var(--fg)" }}>Read on:</span>
                <span style={{ color: "var(--fg)" }}>forthe.tech (canonical)</span>
                <a href={substackUrl} target="_blank" rel="noreferrer" className="chip">Substack <ArrowUpRight className="h-3 w-3" /></a>
                <a href={mediumUrl} target="_blank" rel="noreferrer" className="chip">Medium <ArrowUpRight className="h-3 w-3" /></a>
                <a href={linkedinUrl} target="_blank" rel="noreferrer" className="chip">LinkedIn <ArrowUpRight className="h-3 w-3" /></a>
                <a href={twitterUrl} target="_blank" rel="noreferrer" className="chip">X <ArrowUpRight className="h-3 w-3" /></a>
              </div>
              <div className="t-small" style={{ color: "var(--fg-muted)" }}>
                {dispatch.words} · {dispatch.readTime}
              </div>
            </div>
          </SectionReveal>

          <article className="mt-10 space-y-6 t-article">
            {children}
          </article>

          <RelatedBuildsSection projectIds={dispatch.relatedWorks} />

          {/* Discussion & cross-platform footer with next / prev links */}
          <div className="mt-16 space-y-12">
            <div style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg-raised)", padding: "24px", borderRadius: "4px" }}>
              <p className="t-label">DISCUSS</p>
              <h3 className="t-display-3 mt-2">Join the conversation across platforms.</h3>
              <p className="t-body mt-2" style={{ color: "var(--fg-muted)" }}>
                forthe.tech is an open field laboratory. We publish and debate every piece in public with
                operators, founders, and engineers. Read, critique, or share where you spend your time:
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Discuss on LinkedIn
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <a
                  href={substackUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  <Bookmark className="h-3.5 w-3.5" /> Read on Substack
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <a
                  href={mediumUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  Read on Medium
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  <Share2 className="h-3.5 w-3.5" /> Thread on X
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Next / Previous dispatch — hairline rows */}
            <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {prev ? (
                  <Link
                    to={prev.path}
                    className="card-row group"
                    style={{ padding: "0", borderTop: "none", borderBottom: "none" }}
                  >
                    <span className="t-label" style={{ minWidth: "120px" }}>
                      <ArrowLeft className="h-3 w-3 inline transition-transform group-hover:-translate-x-1" />
                      Previous dispatch
                    </span>
                    <span className="t-display-3 card-title flex-1 min-w-0">{prev.title}</span>
                  </Link>
                ) : null}
                {next ? (
                  <Link
                    to={next.path}
                    className="card-row group"
                    style={{ padding: "0", borderTop: "none", borderBottom: "none" }}
                  >
                    <span className="t-label" style={{ minWidth: "120px" }}>
                      Next dispatch
                      <ArrowRight className="h-3 w-3 inline transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="t-display-3 card-title flex-1 min-w-0 text-right">{next.title}</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </div>
    </PageShell>
  );
}

/**
 * Top bar displaying available reading & discussion destinations for an essay.
 */
export function ArticlePlatformBar({
  external = {},
  readTime,
  words,
}: {
  external?: PlatformLinks;
  readTime?: string;
  words?: string;
}) {
  // This is now handled by ArticleLayout - kept for compatibility
  return null;
}

/**
 * Cards displaying builds mentioned in the essay, linking directly to case studies.
 */
export function RelatedBuildsSection({ projectIds }: { projectIds?: string[] }) {
  if (!projectIds || projectIds.length === 0) return null;

  const related = projects.filter((p) => projectIds.includes(p.id));
  if (related.length === 0) return null;

  return (
    <section
      aria-label="Mentioned builds"
      className="my-14"
      style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg-raised)", padding: "24px", borderRadius: "4px" }}
    >
      <p className="t-label">BUILDS MENTIONED</p>
      <h2 className="t-display-3 mt-1">Builds mentioned in this dispatch.</h2>
      <p className="t-small mt-1" style={{ color: "var(--fg-muted)" }}>
        Quiet tools and operating software referenced directly in this piece:
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {related.map((p) => (
          <Link
            key={p.id}
            to="/works/$id"
            params={{ id: p.id }}
            className="card-row group"
            style={{ padding: "16px", borderRadius: "4px", borderColor: "var(--hairline)" }}
          >
            <div className="space-y-1">
              <div className="t-label" style={{ color: "var(--fg-muted)" }}>
                {p.for} · {p.year}
              </div>
              <div className="t-display-3 group-hover:is-lit transition-colors">{p.name}</div>
              <div className="t-small line-clamp-2" style={{ color: "var(--fg-muted)" }}>{p.blurb}</div>
            </div>
            <div className="inline-flex items-center gap-1.5 t-label">
              <span>View build log</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Bottom discussion & cross-platform footer with next / prev links.
 */
export function ArticleDiscussionFooter({
  dispatch,
  prev,
  next,
}: {
  dispatch: Dispatch;
  prev?: Dispatch;
  next?: Dispatch;
}) {
  // This is now handled by ArticleLayout - kept for compatibility
  return null;
}
