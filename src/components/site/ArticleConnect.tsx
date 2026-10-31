import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, MessageSquare, Layers, Bookmark, Share2 } from "lucide-react";
import { type Dispatch, type PlatformLinks } from "../../data/dispatches";
import { projects } from "../../data/projects";

const DEFAULT_LINKS: Required<PlatformLinks> = {
  substack: "https://substack.com/@afsalali",
  medium: "https://medium.com/@afsalali1238",
  linkedin: "https://www.linkedin.com/in/afsalali1238/",
  twitter: "https://x.com/afsalali1238",
};

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
  const substackUrl = external.substack ?? DEFAULT_LINKS.substack;
  const mediumUrl = external.medium ?? DEFAULT_LINKS.medium;
  const linkedinUrl = external.linkedin ?? DEFAULT_LINKS.linkedin;
  const twitterUrl = external.twitter ?? DEFAULT_LINKS.twitter;

  return (
    <div className="my-6 flex flex-wrap items-center justify-between gap-3 border-y rule-hair py-3 text-xs text-ink-mute">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono uppercase tracking-wider text-ink font-medium">Read on:</span>
        <span className="rounded bg-paper-deep px-2 py-0.5 font-medium text-ink">forthe.tech (canonical)</span>
        <a
          href={substackUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded border rule-hair px-2 py-0.5 hover:border-ink hover:text-ink transition-colors"
        >
          Substack <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href={mediumUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded border rule-hair px-2 py-0.5 hover:border-ink hover:text-ink transition-colors"
        >
          Medium <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded border rule-hair px-2 py-0.5 hover:border-ink hover:text-ink transition-colors"
        >
          LinkedIn <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded border rule-hair px-2 py-0.5 hover:border-ink hover:text-ink transition-colors"
        >
          X (Twitter) <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
      <div className="flex items-center gap-3">
        {words && <span>{words}</span>}
        {readTime && <span>{readTime}</span>}
      </div>
    </div>
  );
}

/**
 * Cards displaying builds mentioned in the essay, linking directly to case studies.
 */
export function RelatedBuildsSection({ projectIds }: { projectIds?: string[] }) {
  if (!projectIds || projectIds.length === 0) return null;

  const related = projects.filter((p) => projectIds.includes(p.id));
  if (related.length === 0) return null;

  return (
    <section aria-label="Mentioned builds" className="my-14 rounded-lg border rule-hair bg-paper-deep/30 p-6 md:p-8">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
        <Layers className="h-3.5 w-3.5" />
        <span>Builds mentioned in this note</span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Quiet tools and operating software referenced directly in this piece:
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {related.map((p) => (
          <Link
            key={p.id}
            to="/works/$id"
            params={{ id: p.id }}
            className="group block rounded-md border rule-hair bg-paper p-4 transition-all hover:border-ink hover:bg-paper-deep/70"
          >
            <div className="flex items-center justify-between text-xs text-ink-mute">
              <span className="font-medium text-ink">{p.for}</span>
              <span className="font-mono">{p.year}</span>
            </div>
            <h3 className="mt-1.5 font-serif text-xl text-ink transition-colors group-hover:text-ink">
              {p.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{p.blurb}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ink">
              <span>View build log</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
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
  const ext = dispatch.external ?? {};
  const substackUrl = ext.substack ?? DEFAULT_LINKS.substack;
  const mediumUrl = ext.medium ?? DEFAULT_LINKS.medium;
  const linkedinUrl = ext.linkedin ?? DEFAULT_LINKS.linkedin;
  const twitterUrl = ext.twitter ?? DEFAULT_LINKS.twitter;

  return (
    <div className="mt-16 space-y-12">
      {/* Discussion & cross-platform card */}
      <div className="rounded-lg border rule-hair bg-paper-deep/50 p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Connect & Discuss</span>
        </div>
        <h3 className="mt-2 font-serif text-2xl text-ink md:text-3xl">
          Join the conversation across platforms.
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
          forthe.tech is an open field laboratory. We publish and debate every piece in public with
          operators, founders, and engineers. Read, critique, or share where you spend your time:
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-ink px-4 text-xs font-medium text-paper transition-colors hover:bg-ink-soft"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Discuss on LinkedIn
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={substackUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border rule-hair bg-paper px-4 text-xs font-medium text-ink transition-colors hover:bg-paper-deep"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Read on Substack
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={mediumUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border rule-hair bg-paper px-4 text-xs font-medium text-ink transition-colors hover:bg-paper-deep"
          >
            Read on Medium
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border rule-hair bg-paper px-4 text-xs font-medium text-ink transition-colors hover:bg-paper-deep"
          >
            <Share2 className="h-3.5 w-3.5" />
            Thread on X
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Next / Previous dispatch */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t rule-hair pt-8">
        {prev ? (
          <Link to={prev.path} className="group flex flex-col text-left">
            <span className="text-xs text-ink-mute flex items-center gap-1">
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              Previous dispatch
            </span>
            <span className="font-serif text-xl text-ink group-hover:text-ink-soft transition-colors mt-1">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link to={next.path} className="group flex flex-col text-right">
            <span className="text-xs text-ink-mute flex items-center justify-end gap-1">
              Next dispatch
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </span>
            <span className="font-serif text-xl text-ink group-hover:text-ink-soft transition-colors mt-1">
              {next.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
