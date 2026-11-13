import { useEffect, type ReactNode } from "react";

export function ScrollyPageShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.location.hash !== "#discussion") return;
    requestAnimationFrame(() => {
      document.getElementById("discussion")?.focus({ preventScroll: true });
    });
  }, []);

  return (
    <div className="page-shell">
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
      <main id="main-content">{children}</main>
    </div>
  );
}
