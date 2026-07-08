import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "../layout/Container";

const NAV_LINKS = [
  ["About", "#about"],
  ["Posture", "#posture"],
  ["Works", "#works"],
  ["Contact", "#colophon"],
] as const;

export function Nav() {
  const [isDark, setIsDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Dark mode: read from localStorage on mount, respect system preference as fallback
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else if (stored === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
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
    const sectionIds = ["about", "posture", "works", "colophon"];
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

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 border-b rule-hair backdrop-blur bg-paper/70"
      >
        <Container className="flex items-center justify-between py-4">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-2xl leading-none">Afsal Ali</span>
            <span className="hidden text-xs uppercase tracking-[0.2em] text-ink-mute sm:inline">
              The Curious Issue
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.2em] text-ink-soft md:flex">
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} className="group relative">
                <span className={`transition-colors group-hover:text-ink ${activeSection === href ? "text-ink" : ""}`}>
                  {label}
                </span>
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
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>

          {/* Mobile controls */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-paper-deep transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-paper-deep transition-colors"
              aria-label="Toggle menu"
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
              className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <motion.nav
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
