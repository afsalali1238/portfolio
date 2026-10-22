import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../components/site/PageShell";
import { Origin } from "../components/sections/Origin";
import { seo } from "../lib/site";

export const Route = createFileRoute("/about")({
  head: () =>
    seo({
      title: "About · forthe.tech",
      description:
        "Why forthe.tech exists: the wall between having an idea and building it came down, so Afsal Ali started building — around a full-time job and family in Dubai — and documenting it in public.",
      path: "/about",
      image: "/og/about.png",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <Origin isPage />
    </PageShell>
  );
}
