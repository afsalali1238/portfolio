import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "../layout/Container";

const NAV_LINKS = [
  ["Origin", "#about"],
  ["Thesis", "#thesis"],
  ["Confession", "#posture"],
  ["Works", "#works"],
  ["Contact", "#colophon"],
] as const;

export function LogoMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 5.5 C16 11.5 16 11.5 22.5 16 C16 20.5 16 20.5 16 26.5 C16 20.5 16 20.5 9.5 16 C16 11.5 16 11.5 16 5.5 Z"
        fill="currentColor"
      />
      <circle cx="16" cy="16" r="1.6" fill="var(--color-ink, #1a1a17)" />
    </svg>
  );
}

export function Nav() {
  const [isDark, setIsDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // The blocking script in __root.tsx already applied the class before paint.
  // All we do here is sync React state to whatever it decided.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Active section tracking via Intersection Observer
  useEffect(() => {
    const sectionIds = ["about", "thesis", "posture", "works", "colophon"];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${id}`);
          }
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Close mobile nav on anchor click
  const handleNavClick = () => {
    setMobileOpen(false);
  };

  // While the mobile panel is open: Escape closes it and the page behind stops scrolling.
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <>
      {/* taste-skill-ignore */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 border-b rule-hair backdrop-blur bg-paper/70"
      >
        <Container className="flex items-center justify-between py-4">
          <a
            href="#"
            className="group flex items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute"
            aria-label="Afsal Ali - The Curious Issue"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper shadow-xs transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6">
              <LogoMark className="h-4 w-4" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-serif text-2xl leading-none transition-colors group-hover:text-ink-soft">
                Afsal Ali
              </span>
              <span className="hidden text-sm text-ink-mute sm:inline">
                forthe.tech
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} className="group relative">
                <span className={`transition-colors group-hover:text-ink ${activeSection === href ? "text-ink" : ""}`}>
                  {label}
                </span>
                {/* taste-skill-ignore */}
                <span
                  className={`absolute -bottom-1 left-0 h-px w-full bg-ink transition-transform duration-500 ease-out ${
                    activeSection === href
                      ? "origin-left scale-x-100"
                      : "origin-right scale-x-0 group-hover:origin-left group-hover:scale-x-100"
                  }`}
                />
              </a>
            ))}
            <button
              onClick={toggleTheme}
              className="group relative flex items-center justify-center h-6 w-6 rounded-full hover:bg-paper-deep transition-colors"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-paper-deep transition-colors"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-paper-deep transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </Container>
      </motion.header>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-ink/40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            {/* taste-skill-ignore */}
            <motion.nav
              id="mobile-nav"
              aria-label="Site"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-64 bg-paper border-l rule-hair flex flex-col px-8 pt-20 gap-1 md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 flex items-center justify-center h-8 w-8 rounded-full hover:bg-paper-deep transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              {/* taste-skill-ignore */}
              <div className="mb-6 flex items-center gap-3 border-b rule-hair pb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-paper shadow-xs">
                  <LogoMark className="h-4 w-4" />
                </div>
                <span className="font-serif text-2xl leading-none">Afsal Ali</span>
              </div>
              {NAV_LINKS.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={handleNavClick}
                  className={`font-serif text-3xl leading-loose transition-colors hover:text-accent-ink ${
                    activeSection === href ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {label}
                </a>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
