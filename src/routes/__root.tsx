import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

import { PageShell } from "../components/site/PageShell";
import { SITE_URL, SITE_NAME, AUTHOR, DEFAULT_DESCRIPTION } from "../lib/site";

function NotFoundComponent() {
  return (
    <PageShell>
      <div className="flex min-h-[60svh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-7xl text-ink">404</h1>
          <p className="mt-3 font-serif text-2xl text-ink-soft">Not in the ledger.</p>
          <p className="mt-2 text-sm text-ink-mute">
            This page doesn&rsquo;t exist, or it moved when the site split into pages.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper"
            >
              Home
            </Link>
            <Link
              to="/works"
              className="inline-flex min-h-11 items-center rounded-md border rule-hair px-5 text-sm font-medium text-ink"
            >
              All work
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <PageShell>
      <div className="flex min-h-[60svh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-5xl text-ink">Something broke.</h1>
          <p className="mt-3 font-serif text-2xl text-ink-soft">A glitch in the ledger.</p>
          <p className="mt-2 text-sm text-ink-mute">
            The page encountered an unexpected runtime error. Try reloading, or return to safety.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="inline-flex min-h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              Try again
            </button>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-md border rule-hair bg-paper px-5 text-sm font-medium text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export const Route = createRootRoute({
  // Site-wide defaults only. Each route adds its own title, description, canonical,
  // og:url and share image through seo() in src/lib/site.ts — never a canonical here,
  // because TanStack doesn't dedupe links and every page would inherit it.
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "forthe.tech" },
      { name: "description", content: DEFAULT_DESCRIPTION },
      { name: "author", content: AUTHOR },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_GB" },
      { name: "theme-color", content: "#F8F6F0", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0F0A06", media: "(prefers-color-scheme: dark)" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Runs before first paint so dark-mode visitors never see a white flash.
 * Must stay inline and blocking — a useEffect runs too late.
 */
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem("theme");var d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

const PERSON_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: AUTHOR,
  url: SITE_URL,
  image: `${SITE_URL}/og/home.png`,
  jobTitle: "Indie builder",
  description:
    "Curious builder and indie shipper. AI tools, learning maps, cozy games, and quiet software.",
  email: "mailto:here@forthe.tech",
  sameAs: [
    "https://github.com/afsalali1238",
    "https://www.linkedin.com/in/afsalali1238/",
    "https://medium.com/@afsalali1238",
  ],
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_SCHEMA) }}
        />
        <script
          defer
          data-domain="forthe.tech,www.forthe.tech"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>
        {children}
        <Scripts />
        <script defer src="https://cdn.vercel-insights.com/v1/script.js" />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
