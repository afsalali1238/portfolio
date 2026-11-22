import { useEffect, useState, type ReactNode } from "react";
import { SiteHeader } from "../site/SiteHeader";

/**
 * Reader-scoped hairline progress: completes when the essay does, not when the
 * page does — the notebook after the essay is not part of the read.
 */
function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const reader = document.querySelector<HTMLElement>(".immersive-reader");
      if (!reader) return;
      const readerTop = reader.getBoundingClientRect().top + window.scrollY;
      const span = Math.max(reader.offsetHeight - window.innerHeight, 1);
      const value = Math.min(1, Math.max(0, (window.scrollY - readerTop) / span));
      setProgress(value);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-ink transition-transform duration-75"
      style={{ transform: `scaleX(${progress})`, transformOrigin: "0% 50%" }}
    />
  );
}

export function ScrollyPageShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.location.hash !== "#discussion") return;
    requestAnimationFrame(() => {
      document.getElementById("discussion")?.focus({ preventScroll: true });
    });
  }, []);

  return (
    <div className="page-shell thesis-page">
      {/* Skip link first in the tab order, matching PageShell on every other route. */}
      <a
        className="skip-link"
        href="#discussion"
        onClick={() => {
          requestAnimationFrame(() => {
            document.getElementById("discussion")?.focus({ preventScroll: true });
          });
        }}
      >
        Skip to the private notebook
      </a>
      <ReadingProgress />
      <SiteHeader />
      <main id="main-content">{children}</main>
    </div>
  );
}
