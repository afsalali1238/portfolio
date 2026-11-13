import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
            <p className="t-label">III ── NOTES</p>
            <h1 className="t-display-1">Dispatches.</h1>
            <p className="t-lede mt-4 max-w-2xl">
              Essays and field notes on what happens when anyone can build software, what
              constitutes a real moat, and the discipline of solving friction for real people.
            </p>
          </SectionReveal>

          <div className="mt-12 space-y-4">
            {DISPATCHES.map((d) => (
              <SectionReveal key={d.number}>
                <Link
                  to={d.path}
                  className="card-row group"
                  style={{ padding: "24px 0", borderRadius: "0" }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 t-label" style={{ color: "var(--fg-muted)" }}>
                    <span className="tabular-nums">Dispatch Nº {String(d.number).padStart(2, "0")} · {d.date} · {d.readTime}</span>
                  </div>
                  <div className="t-display-3 card-title mt-4">{d.title}</div>
                  <div className="t-small mt-2" style={{ color: "var(--fg-muted)" }}>{d.subtitle}</div>
                  <div className="inline-flex items-center gap-1.5 t-label">
                    <span>Read dispatch</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </SectionReveal>
            ))}
          </div>
        </Container>
      </div>
    </PageShell>
  );
}
