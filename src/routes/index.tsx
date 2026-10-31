import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/site/PageShell";
import { Hero } from "../components/sections/Hero";
import { FeaturedWorks } from "../components/sections/FeaturedWorks";
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
 * Home presents the whole arc:
 * 1. Hero (the idea ray: prism dispersion canvas, thesis, stat tiles)
 * 2. Featured builds (selected showcase — kinē, Provia, Doomscholar)
 * 3. Thesis teaser (dispatch standfirst + Energy Ledger thesis)
 * 4. Origin (concise About story + static posture drawing)
 */
function Index() {
  return (
    <PageShell>
      <Hero />
      <FeaturedWorks />
      <ThesisTeaser />
      <Origin />
    </PageShell>
  );
}
