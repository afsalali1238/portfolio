import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../../components/site/PageShell";
import { Works } from "../../components/sections/Works";
import { parseFilter, type ProjectFilter } from "../../data/filters";
import { projectCount, numberWord } from "../../data/projects";
import { seo } from "../../lib/site";

export const Route = createFileRoute("/works/")({
  validateSearch: (search: Record<string, unknown>): { filter?: ProjectFilter } => {
    const filter = parseFilter(search.filter);
    return filter === "all" ? {} : { filter };
  },
  head: () =>
    seo({
      title: "Work · forthe.tech",
      description: `${numberWord(projectCount)} builds by Afsal Ali — learning tools, clinical Arabic courses, a 3D physio guide, cozy games and quiet software, most of them made for someone he knows.`,
      path: "/works",
      image: "/og/works.png",
    }),
  component: WorksPage,
});

function WorksPage() {
  const { filter } = Route.useSearch();
  return (
    <PageShell>
      <Works filter={filter ?? "all"} />
    </PageShell>
  );
}
