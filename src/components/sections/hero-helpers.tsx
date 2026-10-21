import React from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import type { ProjectFilter } from "../../data/filters";
import { rise } from "../../data/motion-constants";

export function RevealWord({
  children,
  delay = 0,
  italic = false,
}: {
  children: React.ReactNode;
  delay?: number;
  italic?: boolean;
}) {
  // A CSS animation, not a Motion one: it starts on first paint from the server HTML
  // instead of waiting for hydration, so the headline is never held back by JS.
  return (
    <span className="inline-block overflow-hidden align-top">
      <span
        className={`reveal-word inline-block ${italic ? "italic" : ""}`}
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </span>
    </span>
  );
}

/** A stat tile that opens the catalogue pre-filtered, e.g. /works?filter=live. */
export function StatLink({
  label,
  value,
  filterKey,
}: {
  label: string;
  value: string;
  filterKey: ProjectFilter;
}) {
  return (
    <motion.div variants={rise} whileHover={{ y: -2 }}>
      <Link
        to="/works"
        search={filterKey === "all" ? {} : { filter: filterKey }}
        className="group -m-2 flex flex-col rounded-md p-2 text-left transition-colors hover:bg-paper-deep/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        aria-label={`${value} builds — ${label}. See them.`}
      >
        <span className="font-serif text-3xl leading-none text-ink">{value}</span>
        <span className="mt-2 flex items-center justify-between text-xs text-ink-mute transition-colors group-hover:text-ink">
          <span>{label}</span>
          <span
            aria-hidden="true"
            className="text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
          >
            see →
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
