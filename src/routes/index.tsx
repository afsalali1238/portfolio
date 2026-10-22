import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/site/PageShell";
import { Hero } from "../components/sections/Hero";
import { InDailyUse } from "../components/sections/InDailyUse";
import { ThesisTeaser } from "../components/sections/ThesisTeaser";
import { Origin } from "../components/sections/Origin";
import { seo, DEFAULT_DESCRIPTION } from "../lib/site";

export const Route = createFileRoute("/")({
  head: () =>
    seo({
      title: "forthe.tech — builds by Afsal Ali",
      description: DEFAULT_DESCRIPTION,
      path: "/",
      image: "/og/home.png",
    }),
  component: Index,
});

/**
 * Suggested order (review section 4):
 * 1. Hero (the build index)
 * 2. In daily use (Provia, Doomscholar, JobHunter OS)
 * 3. Latest note (Dispatch standfirst + Energy Ledger thesis)
 * 4. Origin (concise About story + static posture drawing)
 */
function Index() {
  return (
    <PageShell>
      <Hero />
      <InDailyUse />
      <ThesisTeaser />
      <Origin />
    </PageShell>
  );
}
