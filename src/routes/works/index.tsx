import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "../../components/site/PageShell";
import { Works } from "../../components/sections/Works";
import { parseFilter, type ProjectFilter } from "../../data/filters";
import { projectCount, numberWord } from "../../data/projects";
import { seo } from "../../lib/site";

export const Route = createFileRoute("/works/")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { filter?: ProjectFilter; view?: "grid" | "table" } => {
    const filter = parseFilter(search.filter);
    const view = search.view === "table" ? "table" : search.view === "grid" ? "grid" : undefined;
    return {
      ...(filter === "all" ? {} : { filter }),
      ...(view ? { view } : {}),
    };
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
  const { filter, view } = Route.useSearch();
  return (
    <PageShell>
      <Works filter={filter ?? "all"} view={view ?? "grid"} />
    </PageShell>
  );
}
