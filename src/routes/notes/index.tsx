import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Bookmark, Layers, MessageSquare, Share2 } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { PageShell } from "../../components/site/PageShell";
import { seo } from "../../lib/site";
import { DISPATCHES } from "../../data/dispatches";

export const Route = createFileRoute("/notes/")({
  head: () => ({
    ...seo({
      title: "Notes & Dispatches · forthe.tech",
      description:
        "Essays on software, the collapsing build barrier, energy ledgers, shifting moats, and building for real people.",
      path: "/notes",
      image: "/og/home.png",
    }),
  }),
  component: NotesIndexPage,
});

function NotesIndexPage() {
  return (
    <PageShell>
      <div className="pb-24 pt-14 md:pt-20">
        <Container className="max-w-4xl">
          <SectionReveal>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
              Ledger Dispatches & Essays
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-tight text-ink md:text-6xl">
              Notes on the shift.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-ink-mute md:text-lg">
              Essays and field notes on what happens when anyone can build software, what
              constitutes a real moat, and the discipline of solving friction for real people.
            </p>

            {/* Cross-channel publication hub bar */}
            <div className="mt-8 rounded-lg border rule-hair bg-paper-deep/40 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Connected Publishing Hub
                  </span>
                  <p className="text-xs text-ink-soft">
                    All dispatches are mirrored and discussed across the open network:
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <a
                    href="https://www.linkedin.com/in/afsalali1238/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 font-medium text-paper transition-colors hover:bg-ink-soft"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    LinkedIn
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                  <a
                    href="https://substack.com/@afsalali"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border rule-hair bg-paper px-3 py-1.5 font-medium text-ink transition-colors hover:bg-paper-deep"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    Substack
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                  <a
                    href="https://medium.com/@afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border rule-hair bg-paper px-3 py-1.5 font-medium text-ink transition-colors hover:bg-paper-deep"
                  >
                    Medium
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                  <a
                    href="https://x.com/afsalali1238"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border rule-hair bg-paper px-3 py-1.5 font-medium text-ink transition-colors hover:bg-paper-deep"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    X / Twitter
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </SectionReveal>

          <div className="mt-12 space-y-6">
            {DISPATCHES.map((d) => (
              <SectionReveal key={d.number}>
                <div className="group block rounded-lg border rule-hair bg-paper p-6 transition-all hover:border-ink hover:bg-paper-deep/60 md:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-mute">
                    <span className="font-mono">
                      No. {d.number} · {d.date}
                    </span>
                    <div className="flex items-center gap-3">
                      {d.words && <span>{d.words}</span>}
                      <span>{d.readTime}</span>
                    </div>
                  </div>

                  <Link to={d.path} className="block group-hover:text-ink">
                    <h2 className="mt-3 font-serif text-3xl text-ink transition-colors md:text-4xl">
                      {d.title}
                    </h2>
                    <p className="mt-2 text-base text-ink-soft leading-relaxed">{d.subtitle}</p>
                  </Link>

                  {/* Connected channels + related builds footer on card */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t rule-hair pt-4 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-ink-mute">Read on:</span>
                      <Link
                        to={d.path}
                        className="rounded bg-paper-deep px-2 py-0.5 font-medium text-ink hover:underline"
                      >
                        forthe.tech
                      </Link>
                      <a
                        href={d.external?.substack ?? "https://substack.com/@afsalali"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-ink-soft hover:text-ink transition-colors"
                      >
                        Substack <ArrowUpRight className="h-3 w-3" />
                      </a>
                      <a
                        href={d.external?.linkedin ?? "https://www.linkedin.com/in/afsalali1238/"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-ink-soft hover:text-ink transition-colors"
                      >
                        LinkedIn <ArrowUpRight className="h-3 w-3" />
                      </a>
                      <a
                        href={d.external?.medium ?? "https://medium.com/@afsalali1238"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-ink-soft hover:text-ink transition-colors"
                      >
                        Medium <ArrowUpRight className="h-3 w-3" />
                      </a>
                      <a
                        href={d.external?.twitter ?? "https://x.com/afsalali1238"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-ink-soft hover:text-ink transition-colors"
                      >
                        X <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </div>

                    <Link
                      to={d.path}
                      className="inline-flex items-center gap-1.5 font-medium text-ink transition-transform group-hover:translate-x-1"
                    >
                      <span>Read essay</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </Container>
      </div>
    </PageShell>
  );
}
