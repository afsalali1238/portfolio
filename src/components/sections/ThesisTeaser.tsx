import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { DISPATCHES } from "../../data/dispatches";

const NOTES = [
  {
    k: "Medium",
    v: "Light bends only in dense glass. In life, that density is the raw effort of craft.",
  },
  {
    k: "Kickback",
    v: "Violent reflection is a physical fact. Some surfaces cannot bear your frequency.",
  },
  {
    k: "The Wall",
    v: "The wall between idea and reality has fallen. Tech is modern glass, not an idol.",
  },
  {
    k: "Becoming",
    v: "You don't just ship the artifact — you are the one who is permanently refracted.",
  },
];

/** Home carries the flagship manifesto teaser and core thesis notes. */
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
            <span>Manifesto</span>
            <span>·</span>
            <span>Foundation Thesis</span>
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

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/thesis"
              className="group inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              Read Manifesto
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/notes"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border rule-hair bg-paper px-4 text-sm font-medium text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              All notes
            </Link>
          </div>
        </SectionReveal>

        <SectionReveal className="space-y-6 lg:col-span-7">
          <p className="font-serif text-2xl leading-snug text-ink md:text-3xl">
            An idea in your head{" "}
            <span className="italic">costs nothing and proves nothing</span>. It is invisible until
            it collides with real glass.
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
