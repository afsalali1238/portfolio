import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { DISPATCHES } from "../../data/dispatches";

const NOTES = [
  {
    k: "Currency",
    v: "Tokens are energy IOUs. In time, economies will clear directly in compute.",
  },
  {
    k: "Physics",
    v: "A single 'hello' burns the watt-hours an LED reading lamp uses for minutes.",
  },
  {
    k: "Hypocrisy",
    v: "Preaching ESG while firing millions of aimless prompts is vanity pollution.",
  },
  { k: "Moat", v: "Not your pipeline complexity. Only what changes in someone's daily life." },
];

/** Home carries the latest dispatch standfirst and the Energy Ledger core thesis. */
export function ThesisTeaser() {
  const latest = DISPATCHES[0];

  return (
    <section
      aria-labelledby="notes-heading"
      className="bg-paper-deep/40 py-20 md:py-28 border-t rule-hair"
    >
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <SectionReveal className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
            <span>Notes</span>
            <span>·</span>
            <span>Latest dispatch</span>
          </div>

          <div>
            <div className="text-xs text-ink-mute">
              Dispatch No. {latest.number} · {latest.readTime}
            </div>
            <h2 id="notes-heading" className="mt-2 font-serif text-3xl md:text-4xl text-ink">
              <Link to={latest.path} className="hover:text-ink-soft transition-colors">
                {latest.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{latest.subtitle}</p>
          </div>

          <div className="pt-2">
            <Link
              to="/notes"
              className="group inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              All notes
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </SectionReveal>

        <SectionReveal className="space-y-6 lg:col-span-7">
          <p className="font-serif text-2xl leading-snug text-ink md:text-3xl">
            AI tokens are the new currency. And every token is an{" "}
            <span className="italic">IOU on physical energy</span>.
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {NOTES.map((n) => (
              <li key={n.k} className="rounded-lg bg-paper p-5 border rule-hair">
                <div className="text-xs font-medium text-ink-mute">{n.k}</div>
                <div className="mt-1.5 font-serif text-lg leading-snug text-ink">{n.v}</div>
              </li>
            ))}
          </ul>
        </SectionReveal>
      </Container>
    </section>
  );
}
