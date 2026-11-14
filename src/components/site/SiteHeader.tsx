import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Container } from "../layout/Container";
import { LogoTile, Wordmark } from "./LogoMark";

const NAV_LINKS = [
  { label: "Work", to: "/works" },
  { label: "Manifesto", to: "/thesis" },
  { label: "Notes", to: "/notes" },
  { label: "The Man Behind", to: "/the-man-behind" },
] as const;

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-md text-ink-mute transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

export function SiteHeader() {
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

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0c0e]/80 backdrop-blur-md">
        <Container className="flex items-center justify-between py-2.5">
          <Link
            to="/"
            className="group flex items-center gap-3 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            aria-label="for the tech. — home"
          >
            <LogoTile className="h-8 w-10 transition-opacity duration-150 group-hover:opacity-85" />
            <Wordmark className="text-xl sm:text-2xl" />
          </Link>

          <nav aria-label="Site" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group relative rounded-md px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-[#9a9ea5] transition-colors hover:text-white data-[status=active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {l.label}
                <span className="absolute inset-x-3 bottom-1.5 h-px origin-left scale-x-0 bg-accent-ink transition-transform duration-150 ease-out group-hover:scale-x-100 group-data-[status=active]:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="-mr-2 flex items-center md:hidden">
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
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-150 md:hidden ${
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
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-1 border-l border-white/[0.08] bg-paper px-6 pt-20 transition-transform duration-200 ease-out md:hidden ${
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
          className="mb-6 flex min-h-11 items-center gap-3 rounded-md border-b border-white/[0.08] pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          aria-label="for the tech. — home"
        >
          <LogoTile className="h-8 w-10" />
          <Wordmark className="text-xl" />
        </Link>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            onClick={handleClose}
            className="flex min-h-11 items-center rounded-md py-3 font-mono text-xs uppercase tracking-wider text-ink-mute transition-colors hover:text-white data-[status=active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
