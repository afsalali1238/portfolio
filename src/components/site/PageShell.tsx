import { useState, useEffect, type ReactNode } from "react";
import { ArrowUp } from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/**
 * Every page: skip link, shared header, main, shared footer (which holds contact).
 * No page-level fade — content paints on first frame; sections reveal on their own.
 */
export function PageShell({
  children,
  readingProgress = false,
}: {
  children: ReactNode;
  readingProgress?: boolean;
}) {
  return (
    <div className="min-h-svh bg-paper text-ink grain">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="pointer-events-none fixed inset-0 grain-overlay opacity-40" />
      {readingProgress && <ReadingProgress />}
      <div className="relative">
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </div>
      <BackToTop />
    </div>
  );
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setProgress(Math.min(1, Math.max(0, window.scrollY / totalScroll)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{ transform: `scaleX(${progress})`, transformOrigin: "0% 50%" }}
      className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-ink transition-transform duration-75"
    />
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? window.scrollY / totalScroll : 0;
      setVisible(progress > 0.2);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border rule-hair bg-paper transition-all duration-200 hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
        visible
          ? "pointer-events-auto opacity-100 translate-y-0"
          : "pointer-events-none opacity-0 translate-y-5"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
