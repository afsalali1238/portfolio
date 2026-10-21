import { projects, type Project } from "./projects";

/** The catalogue filter lives in the URL (/works?filter=live), so it survives back
 * navigation and can be linked from the home stats. */
export const PROJECT_FILTERS = ["all", "live", "oss", "for-people"] as const;
export type ProjectFilter = (typeof PROJECT_FILTERS)[number];

const PEOPLE = ["Wife", "Friends", "Me"];

export const FILTER_LABELS: Record<ProjectFilter, string> = {
  all: "All builds",
  live: "Live on the web",
  oss: "Open source",
  "for-people": "For people I know",
};

export function matchesFilter(p: Project, filter: ProjectFilter) {
  if (filter === "live") return Boolean(p.live);
  if (filter === "oss") return Boolean(p.github);
  if (filter === "for-people") return PEOPLE.includes(p.for);
  return true;
}

export function countFor(filter: ProjectFilter) {
  return projects.filter((p) => matchesFilter(p, filter)).length;
}

export function parseFilter(value: unknown): ProjectFilter {
  return PROJECT_FILTERS.includes(value as ProjectFilter) ? (value as ProjectFilter) : "all";
}
