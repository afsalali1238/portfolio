import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Container } from "../layout/Container";
import { LogoTile, Wordmark } from "./LogoMark";
import { AUTHOR } from "../../lib/site";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="site-footer"
    >
      <Container className="container">
        <div className="footer-main">
          <div className="footer-brand-group">
            <Link
              to="/"
              className="footer-brand"
              aria-label="forthe.tech — home"
            >
              <LogoTile className="h-6 w-6" />
              <Wordmark className="text-[17px]" />
            </Link>
            <p className="footer-tagline">Independent thought, made real.</p>
          </div>
          
          <nav aria-label="Footer" className="footer-links">
            <Link to="/works" className="inline-flex min-h-11 items-center hover:text-ink">Work</Link>
            <Link to="/thesis" className="inline-flex min-h-11 items-center hover:text-ink">Manifesto</Link>
            <Link to="/notes" className="inline-flex min-h-11 items-center hover:text-ink">Notes</Link>
            <Link to="/the-man-behind" className="inline-flex min-h-11 items-center hover:text-ink">The Man Behind</Link>
            <Link to="/" hash="origin" className="inline-flex min-h-11 items-center hover:text-ink">About</Link>
          </nav>

          <div className="footer-contact">
            here@forthe.tech · Dubai · GST (UTC+4)
          </div>
        </div>

        <div className="footer-bottom">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a
              href="https://www.linkedin.com/in/afsalali1238/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://x.com/afsallali"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
            >
              X (Twitter)
            </a>
            <a
              href="https://substack.com/@afsalali"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
            >
              Substack
            </a>
            <a
              href="https://medium.com/@afsalali1238"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
            >
              Medium
            </a>
            <a
              href="https://github.com/afsalali1238"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
            >
              GitHub
            </a>
          </div>
          <div>
            © {new Date().getFullYear()} {AUTHOR} · forthe.tech
          </div>
        </div>
      </Container>
    </footer>
  );
}
