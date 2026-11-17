import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Container } from "../layout/Container";
import { LogoTile, Wordmark } from "./LogoMark";
import { useEffect, useState } from "react";

function GSTClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Dubai",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }).format(new Date()),
      );
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <time className="gst-clock">{time || "--:--:--"} GST (UTC+4)</time>;
}

export function SiteFooter() {
  return (
    <footer id="contact" className="site-footer">
      <Container className="container">
        <section
          aria-labelledby="footer-conversation-heading"
          className="footer-conversation grid gap-6 border-b pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div>
            <p className="t-label">START A CONVERSATION</p>
            <h2 id="footer-conversation-heading" className="t-display-3 mt-2 max-w-2xl">
              Have a difficult problem worth making simpler?
            </h2>
            <p className="t-small mt-3 max-w-xl" style={{ color: "var(--fg-muted)" }}>
              I work across product thinking, interaction design, and implementation to make focused
              tools for real people.
            </p>
          </div>
          <a
            href="mailto:here@forthe.tech?subject=Project%20enquiry%20via%20forthe.tech"
            className="btn-primary group justify-center md:justify-self-end"
          >
            Start a conversation
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </section>

        <div className="footer-main">
          <div className="footer-brand-group">
            <Link
              to="/"
              className="footer-brand rounded-md py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              aria-label="forthe.tech — home"
            >
              <LogoTile className="h-7 w-7" small />
              <Wordmark className="h-[15px] w-auto" />
            </Link>
            <p className="footer-tagline">Independent thought, made real.</p>
          </div>

          <nav aria-label="Footer" className="footer-links">
            <Link to="/works" className="inline-flex min-h-11 items-center hover:text-ink">
              Work
            </Link>
            <Link to="/thesis" className="inline-flex min-h-11 items-center hover:text-ink">
              Manifesto
            </Link>
            <Link to="/notes" className="inline-flex min-h-11 items-center hover:text-ink">
              Notes
            </Link>
            <Link to="/the-man-behind" className="inline-flex min-h-11 items-center hover:text-ink">
              The Man Behind
            </Link>
            <Link to="/" hash="origin" className="inline-flex min-h-11 items-center hover:text-ink">
              About
            </Link>
          </nav>

          <div className="footer-contact">
            <a
              href="mailto:here@forthe.tech"
              className="inline-flex min-h-11 items-center hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              here@forthe.tech
            </a>
            <span aria-hidden="true"> · </span>
            <span>25.2048° N / 55.2708° E</span>
            <span aria-hidden="true"> · </span>
            <GSTClock />
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
          <div className="text-sm text-ink-soft">
            © {new Date().getFullYear()} forthe.tech. All rights reserved.
          </div>
        </div>
      </Container>
    </footer>
  );
}
