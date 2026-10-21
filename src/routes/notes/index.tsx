import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { PageShell } from "../../components/site/PageShell";
import { seo } from "../../lib/site";

const DISPATCHES = [
  {
    number: "02",
    date: "October 2026",
    title: "The moat moved.",
    subtitle: "Ideas were cheap. Then building was. Now even being first is.",
    path: "/notes/the-moat-moved",
    readTime: "3 min read",
  },
  {
    number: "01",
    date: "October 2026",
    title: "The Energy Ledger.",
    subtitle: "AI tokens are the new currency. And every token is an IOU on physical energy.",
    path: "/notes/the-energy-ledger",
    readTime: "4 min read",
  },
];

export const Route = createFileRoute("/notes/")({
  head: () => ({
    ...seo({
      title: "Notes & Dispatches · forthe.tech",
      description:
        "Essays on software, the collapsing build barrier, energy ledgers, and shifting moats.",
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
              Ledger Dispatches
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-tight text-ink md:text-6xl">
              Notes on the shift.
            </h1>
            <p className="mt-4 max-w-xl text-base text-ink-mute">
              Arguments and field notes on what happens when anyone can build software, what
              constitutes a real moat, and the thermodynamic cost of intelligence.
            </p>
          </SectionReveal>

          <div className="mt-14 space-y-6">
            {DISPATCHES.map((d) => (
              <SectionReveal key={d.number}>
                <Link
                  to={d.path}
                  className="group block rounded-lg border rule-hair bg-paper p-6 transition-all hover:border-ink hover:bg-paper-deep md:p-8"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-mute">
                    <span>
                      Dispatch No. {d.number} · {d.date}
                    </span>
                    <span>{d.readTime}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-3xl text-ink transition-colors group-hover:text-ink md:text-4xl">
                    {d.title}
                  </h2>
                  <p className="mt-2 text-base text-ink-soft">{d.subtitle}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink">
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
