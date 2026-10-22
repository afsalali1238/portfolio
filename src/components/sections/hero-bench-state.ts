import { useCallback, useEffect, useMemo, useState } from "react";
import { projects, getProjectById, type Project } from "../../data/projects";
import { matchesFilter, type ProjectFilter } from "../../data/filters";

/** State and labels for the hero's workbench (hero-bench.tsx draws it). */

/** Oldest year first, the data's own order inside a year. Cell numbers follow this order. */
export const YEARS = [...new Set(projects.map((p) => p.year))].sort();
export const ORDERED: Project[] = YEARS.flatMap((y) => projects.filter((p) => p.year === y));
export const NUMBER = new Map(ORDERED.map((p, i) => [p.id, String(i + 1).padStart(2, "0")]));

/** kinē opens the stage: live, open source, and the clearest screenshot. */
export const DEFAULT_ID = getProjectById("kine") ? "kine" : ORDERED[0].id;

export const FILTERS: { key: ProjectFilter; label: string; status: (n: number) => string }[] = [
  { key: "all", label: "Total shipped", status: (n) => `Showing all ${n}.` },
  {
    key: "live",
    label: "Live on the internet",
    status: (n) => `Showing the ${n} live on the internet.`,
  },
  { key: "oss", label: "Open source", status: (n) => `Showing the ${n} with public code.` },
  {
    key: "for-people",
    label: "For wife, friends, me",
    status: (n) => `Showing the ${n} made for my wife, my friends and me.`,
  },
];

const PROPER_NOUNS = new Set(["Dubai", "Kerala"]);
const FOR_WORDS: Record<string, string> = { Wife: "my wife", Friends: "friends", Me: "me" };

/** "Built for my wife", "Built for patients", "Built for Dubai". */
export function builtFor(p: Project) {
  const who = FOR_WORDS[p.for] ?? (PROPER_NOUNS.has(p.for) ? p.for : p.for.toLowerCase());
  return `Built for ${who}`;
}

export function statusLabel(p: Project) {
  if (!p.status) return null;
  return p.status.charAt(0).toUpperCase() + p.status.slice(1);
}

/* ------------------------------------------------------------------------------------ */
/* State                                                                                */
/* ------------------------------------------------------------------------------------ */

export function useBench() {
  const [filter, setFilterState] = useState<ProjectFilter>("all");
  const [selectedId, setSelectedId] = useState(DEFAULT_ID);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Screenshots are only mounted once they're wanted: the opening one, anything pointed
  // at or focused, and then the rest when the browser is idle (skipped on Save-Data).
  const [warm, setWarm] = useState<ReadonlySet<string>>(() => new Set([DEFAULT_ID]));

  const visible = useMemo(() => ORDERED.filter((p) => matchesFilter(p, filter)), [filter]);
  const visibleIds = useMemo(() => new Set(visible.map((p) => p.id)), [visible]);
  const activeId = previewId ?? selectedId;
  const active = getProjectById(activeId) ?? ORDERED[0];

  const warmUp = useCallback((id: string) => {
    setWarm((s) => (s.has(id) ? s : new Set(s).add(id)));
  }, []);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const all = () => setWarm(new Set(ORDERED.map((p) => p.id)));
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(all, { timeout: 4000 });
      return () => window.cancelIdleCallback(handle);
    }
    const handle = setTimeout(all, 2500);
    return () => clearTimeout(handle);
  }, []);

  const select = useCallback(
    (id: string) => {
      warmUp(id);
      setSelectedId(id);
    },
    [warmUp],
  );

  const setFilter = useCallback(
    (next: ProjectFilter) => {
      setFilterState(next);
      setPreviewId(null);
      const nextVisible = ORDERED.filter((p) => matchesFilter(p, next));
      if (!nextVisible.some((p) => p.id === selectedId) && nextVisible[0]) {
        select(nextVisible[0].id);
      }
    },
    [selectedId, select],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = visible.findIndex((p) => p.id === selectedId);
      const next = visible[(i + dir + visible.length) % visible.length];
      if (next) select(next.id);
    },
    [visible, selectedId, select],
  );

  const preview = useCallback(
    (id: string | null) => {
      if (id) warmUp(id);
      setPreviewId(id);
    },
    [warmUp],
  );

  return {
    filter,
    setFilter,
    selectedId,
    select,
    preview,
    step,
    active,
    activeId,
    visible,
    visibleIds,
    warm,
    warmUp,
  };
}

export type Bench = ReturnType<typeof useBench>;
