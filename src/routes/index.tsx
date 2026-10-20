import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/site/PageShell";
import { Hero } from "../components/sections/Hero";
import { Marquee } from "../components/sections/Marquee";
import { FeaturedWorks } from "../components/sections/FeaturedWorks";
import { ThesisTeaser } from "../components/sections/ThesisTeaser";
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

/** Home is an index, not the whole magazine: who, the work, the argument, contact. */
function Index() {
  return (
    <PageShell>
      <Hero />
      <Marquee />
      <FeaturedWorks />
      <ThesisTeaser />
    </PageShell>
  );
}
