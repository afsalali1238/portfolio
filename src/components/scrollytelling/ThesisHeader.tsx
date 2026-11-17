import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LogoTile } from "../site/LogoMark";

const NAV_LINKS = [
  { label: "Work", to: "/works" },
  { label: "Manifesto", to: "/thesis" },
  { label: "Notes", to: "/notes" },
  { label: "The Man Behind", to: "/the-man-behind" },
] as const;

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-md text-[#9a9ea5] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eeeae1]";

/**
 * The historical thesis navigation is intentionally local to this route. It keeps the restored
 * reading experience visually faithful without changing the shared site header or brand assets.
 */
export function ThesisHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const navPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuTriggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !navPanelRef.current) return;
      const focusable = navPanelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
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

  const close = () => {
    setMobileOpen(false);
    menuTriggerRef.current?.focus();
  };

  const brand = (
    <>
      <LogoTile className="h-8 w-10 transition-opacity duration-150 group-hover:opacity-85" />
      <span className="font-sans text-xl font-semibold leading-none tracking-tight text-[#eeeae1] sm:text-2xl">
        for the tech<span className="text-[#d96346]">.</span>
      </span>
    </>
  );

  return (
    <>
      <header className="thesis-site-header sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0c0e]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-2.5 md:px-10">
          <Link
            to="/"
            className="thesis-brand group flex items-center gap-3 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eeeae1]"
            aria-label="for the tech. by Afsal Ali — home"
          >
            {brand}
            <span className="hidden font-mono text-xs text-[#9a9ea5] sm:inline">/ Afsal Ali</span>
          </Link>

          <nav aria-label="Site" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group relative rounded-md px-3 py-2.5 font-mono text-xs uppercase tracking-wider text-[#9a9ea5] transition-colors hover:text-white data-[status=active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eeeae1]"
              >
                {link.label}
                <span className="absolute inset-x-3 bottom-1.5 h-px origin-left scale-x-0 bg-[#d96346] transition-transform duration-150 ease-out group-hover:scale-x-100 group-data-[status=active]:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className={iconButton}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="thesis-mobile-nav"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-150 md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />
      <nav
        ref={navPanelRef}
        id="thesis-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-1 border-l border-white/[0.08] bg-[#0b0c0e] px-6 pt-20 transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          className={`absolute right-3 top-3 ${iconButton}`}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <Link
          to="/"
          onClick={close}
          className="mb-6 flex min-h-11 items-center gap-3 rounded-md border-b border-white/[0.08] pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eeeae1]"
          aria-label="for the tech. by Afsal Ali — home"
        >
          {brand}
          <span className="font-mono text-[11px] text-[#9a9ea5]">/ Afsal Ali</span>
        </Link>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={close}
            className="flex min-h-11 items-center rounded-md py-3 font-mono text-xs uppercase tracking-wider text-[#9a9ea5] transition-colors hover:text-white data-[status=active]:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eeeae1]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
