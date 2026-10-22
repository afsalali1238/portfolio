import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Container } from "../layout/Container";
import { LogoTile, Wordmark } from "./LogoMark";
import { AUTHOR } from "../../lib/site";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="border-t rule-hair bg-paper-deep/40 py-16 text-sm text-ink-mute"
    >
      <Container className="space-y-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="space-y-4 md:col-span-6">
            <h2 className="font-serif text-3xl text-ink md:text-4xl">Let&rsquo;s talk tech.</h2>
            <p className="max-w-md text-ink-soft">
              Have an idea, want to build something quiet, or just talk shop? Reach out.
            </p>
            <div className="pt-2">
              <a
                href="mailto:here@forthe.tech"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                here@forthe.tech
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-3 text-xs md:col-span-6 md:text-right">
            <div className="text-ink font-medium">Dubai, United Arab Emirates</div>
            <p className="text-ink-mute">Gulf Standard Time (UTC+4)</p>
            <div className="pt-4 flex flex-wrap gap-4 md:justify-end text-sm">
              <a
                href="https://github.com/afsalali1238"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
              >
                GitHub ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a
                href="https://www.linkedin.com/in/afsalali1238/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
              >
                LinkedIn ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a
                href="https://medium.com/@afsalali1238"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
              >
                Medium ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a
                href="https://substack.com/@afsalali"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-ink-soft hover:text-ink transition-colors"
              >
                Substack ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t rule-hair pt-8">
          <div className="flex flex-col gap-4 text-xs md:flex-row md:items-center md:justify-between">
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
            <div>
              © {new Date().getFullYear()} {AUTHOR} · forthe.tech
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
