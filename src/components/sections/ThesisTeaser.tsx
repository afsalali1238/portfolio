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
      className="py-20 md:py-28"
      style={{ borderTop: "1px solid var(--hairline)" }}
    >
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <SectionReveal className="lg:col-span-5 space-y-6">
          <p className="t-label">IV ── MANIFESTO</p>
          <div>
            <p className="t-label">Dispatch Nº {String(latest.number).padStart(2, "0")} · {latest.readTime}</p>
            <h2 id="notes-heading" className="t-display-2 mt-2">
              <Link to={latest.path} className="hover:is-lit transition-colors">
                {latest.title}
              </Link>
            </h2>
            <p className="t-small mt-3" style={{ color: "var(--fg-muted)" }}>{latest.subtitle}</p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/thesis"
              className="btn-primary group"
            >
              Read Manifesto
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/notes"
              className="btn-secondary"
            >
              All notes
            </Link>
          </div>
        </SectionReveal>

        <SectionReveal className="space-y-6 lg:col-span-7">
          <p className="t-display-3" style={{ maxWidth: "500px" }}>
            An idea in your head <span style={{ fontStyle: "italic" }}>costs nothing and proves nothing</span>.
            It is invisible until it collides with real glass.
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {NOTES.map((n) => (
              <li key={n.k} className="p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--bg)", borderRadius: "4px" }}>
                <div className="t-label">{n.k}</div>
                <div className="mt-1.5" style={{ fontFamily: "var(--font-display)", fontSize: "18px", lineHeight: "1.2", color: "var(--fg)" }}>{n.v}</div>
              </li>
            ))}
          </ul>
        </SectionReveal>
      </Container>
    </section>
  );
}
