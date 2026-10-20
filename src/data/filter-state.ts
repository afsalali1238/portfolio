import { useSyncExternalStore } from "react";

export type ProjectFilter = "all" | "live" | "oss" | "for-people";

let currentFilter: ProjectFilter = "all";
const listeners = new Set<(f: ProjectFilter) => void>();

export function getProjectFilter(): ProjectFilter {
  return currentFilter;
}

export function setProjectFilter(filter: ProjectFilter) {
  currentFilter = filter;
  listeners.forEach((l) => l(currentFilter));
}

export function subscribeProjectFilter(listener: (f: ProjectFilter) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProjectFilter() {
  const filter = useSyncExternalStore(
    subscribeProjectFilter,
    getProjectFilter,
    () => "all" as ProjectFilter,
  );
  return [filter, setProjectFilter] as const;
}
