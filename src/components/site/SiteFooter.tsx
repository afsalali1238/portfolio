import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Github } from "lucide-react";
import { Container } from "../layout/Container";
import { LogoTile, Wordmark } from "./LogoMark";

const CONTACT_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/afsalali1238/" },
  { label: "Medium", href: "https://medium.com/@afsalali1238" },
  { label: "Email", href: "mailto:here@forthe.tech" },
];

/** Contact lives here, on every page — not on a page of its own. */
export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 border-t rule-hair">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-3">
          <div className="text-sm font-medium text-ink-mute">Colophon</div>
        </div>
        <div className="md:col-span-9">
          <h2 className="font-serif text-5xl md:text-6xl">Say hello.</h2>
          <p className="mt-4 max-w-xl text-base text-ink-soft">
            Best found on GitHub, LinkedIn, or by email. I answer slowly, but I answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://github.com/afsalali1238"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-5 py-3 text-sm text-paper transition-colors hover:bg-ink-soft"
            >
              GitHub · @afsalali1238
              <Github className="h-4 w-4" />
            </a>
            {CONTACT_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border rule-hair px-5 py-3 text-sm transition-colors hover:bg-paper-deep"
              >
                {l.label} <ArrowUpRight className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t rule-hair pt-6 text-xs text-ink-mute">
            <Link
              to="/"
              className="flex min-h-11 items-center gap-2 text-ink"
              aria-label="forthe.tech — home"
            >
              <LogoTile className="h-6 w-6" />
              <Wordmark className="text-lg" />
            </Link>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
              <Link to="/works" className="inline-flex min-h-11 items-center hover:text-ink">
                Work
              </Link>
              <Link to="/notes" className="inline-flex min-h-11 items-center hover:text-ink">
                Notes
              </Link>
              <Link to="/about" className="inline-flex min-h-11 items-center hover:text-ink">
                About
              </Link>
            </nav>
            <div>© {new Date().getFullYear()} Afsal Ali · forthe.tech</div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
