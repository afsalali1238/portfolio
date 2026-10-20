import React from "react";
import { motion } from "motion/react";
import { type ProjectFilter, useProjectFilter } from "../../data/filter-state";
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
  return (
    <span className="inline-block overflow-hidden align-top">
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`inline-block ${italic ? "italic" : ""}`}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function StatButton({
  label,
  value,
  filterKey,
}: {
  label: string;
  value: string;
  filterKey: ProjectFilter;
}) {
  const [current, setFilter] = useProjectFilter();
  const isActive = current === filterKey;

  const handleClick = () => {
    setFilter(isActive ? "all" : filterKey);
    const el = document.getElementById("works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.button
      type="button"
      variants={rise}
      onClick={handleClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`group flex flex-col text-left transition-colors rounded-md p-2 -m-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
        isActive ? "bg-paper-deep ring-1 ring-ink/20" : "hover:bg-paper-deep/60"
      }`}
      aria-label={`Filter projects by ${label} (${value})`}
    >
      <div className="font-serif text-3xl leading-none text-ink flex items-center gap-2">
        {value}
        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
      </div>
      <div className="mt-2 text-xs text-ink-mute group-hover:text-ink transition-colors flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] text-ink-mute opacity-0 group-hover:opacity-100 transition-opacity">
          filter ↓
        </span>
      </div>
    </motion.button>
  );
}
