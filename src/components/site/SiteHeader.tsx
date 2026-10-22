import { Link } from "@tanstack/react-router";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Container } from "../layout/Container";
import { LogoTile, Wordmark } from "./LogoMark";

const NAV_LINKS = [
  { label: "Work", to: "/works" },
  { label: "Notes", to: "/notes" },
  { label: "About", to: "/about" },
] as const;

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

function useTheme() {
  const [isDark, setIsDark] = useState(false);

  // The blocking script in __root.tsx already applied the class before paint.
  // All we do here is sync React state to whatever it decided.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode: theme still applies for this visit */
    }
  };

  return [isDark, toggle] as const;
}

export function SiteHeader() {
  const [isDark, toggleTheme] = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navPanelRef = useRef<HTMLElement>(null);

  // Focus management and scroll lock for mobile menu
  useEffect(() => {
    if (!mobileOpen) return;

    // Focus close button on open
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        menuTriggerRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && navPanelRef.current) {
        const focusable = navPanelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const handleClose = () => {
    setMobileOpen(false);
    menuTriggerRef.current?.focus();
  };

  const themeLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <>
      <header className="sticky top-0 z-30 border-b rule-hair bg-paper/75 backdrop-blur">
        <Container className="flex items-center justify-between py-2.5">
          <Link
            to="/"
            className="group flex items-center gap-3 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            aria-label="forthe.tech — home"
          >
            <LogoTile className="h-8 w-8 transition-opacity duration-150 group-hover:opacity-85" />
            <Wordmark className="text-2xl" />
          </Link>

          <nav aria-label="Site" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group relative px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink data-[status=active]:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md"
              >
                {l.label}
                <span className="absolute inset-x-3 bottom-1.5 h-px origin-left scale-x-0 bg-ink transition-transform duration-150 ease-out group-hover:scale-x-100 group-data-[status=active]:scale-x-100" />
              </Link>
            ))}
            <a
              href="#contact"
              className="px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md"
            >
              Contact
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              className={iconButton}
              aria-label={themeLabel}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className={iconButton}
              aria-label={themeLabel}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className={iconButton}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-150 md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />
      {/* Mobile Drawer Panel */}
      <nav
        ref={navPanelRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-72 flex-col gap-1 border-l rule-hair bg-paper px-8 pt-20 shadow-none transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          className={`absolute right-3 top-3 ${iconButton}`}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <Link
          to="/"
          onClick={handleClose}
          className="mb-6 flex items-center gap-3 border-b rule-hair pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md"
        >
          <LogoTile className="h-8 w-8" />
          <Wordmark className="text-2xl" />
        </Link>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={handleClose}
            className="font-serif text-3xl leading-loose text-ink-soft transition-colors hover:text-ink data-[status=active]:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md"
          >
            {l.label}
          </Link>
        ))}
        <a
          href="#contact"
          onClick={handleClose}
          className="font-serif text-3xl leading-loose text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-md"
        >
          Contact
        </a>
      </nav>
    </>
  );
}
