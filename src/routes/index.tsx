import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/site/PageShell";
import { Hero } from "../components/sections/Hero";
import { Marquee } from "../components/sections/Marquee";
import { FeaturedWorks } from "../components/sections/FeaturedWorks";
import { About } from "../components/sections/About";
import { Posture } from "../components/sections/Posture";
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

/** Home presents the whole arc: the hero thesis, the builds, the person & story, and the notes. */
function Index() {
  return (
    <PageShell>
      <Hero />
      <Marquee />
      <FeaturedWorks />
      <About />
      <Posture />
      <ThesisTeaser />
    </PageShell>
  );
}
