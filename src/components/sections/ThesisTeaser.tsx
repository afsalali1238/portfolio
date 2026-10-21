import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

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

/** The essay lives once, at /thesis. Home carries the argument in four lines. */
export function ThesisTeaser() {
  return (
    <section aria-labelledby="thesis-heading" className="bg-paper-deep/40 py-20 md:py-28">
      <Container className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <SectionReveal className="md:col-span-4">
          <div className="text-sm font-medium text-ink-mute">Notes</div>
          <h2 id="thesis-heading" className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
            The Energy Ledger
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-mute">
            On AI tokens as currency, the thermodynamic debt of a prompt, and the moral requirement
            of building with intention.
          </p>
          <Link
            to="/notes"
            className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm text-paper transition-colors hover:bg-ink-soft"
          >
            Read the notes
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </SectionReveal>

        <SectionReveal className="space-y-8 md:col-span-8">
          <p className="font-serif text-3xl leading-snug text-ink md:text-4xl">
            AI tokens are the new currency. And every token is an{" "}
            <span className="italic">IOU on physical energy</span>.
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {NOTES.map((n) => (
              <li key={n.k} className="rounded-lg bg-paper/80 p-5">
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
