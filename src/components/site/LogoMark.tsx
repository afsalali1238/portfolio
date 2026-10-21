/**
 * Logo: Round 4 A — Through the Crack (Recommended).
 * One line meets a wall, slips through its one gap, then branches 1 → 2 → 4
 * and joins back up; the newest node is clay.
 */

export function LogoMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="3.5" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="10" y="18.5" width="3" height="10" rx="1" fill="currentColor" />
      <path
        d="M2.5 16 L16.5 16 M16.5 16 L21.5 11 M16.5 16 L21.5 21 M21.5 11 L27.5 7.5 M21.5 11 L27.5 13.5 M21.5 21 L27.5 18.5 M21.5 21 L27.5 24.5 M27.5 13.5 L27.5 18.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        <circle cx="16.5" cy="16" r="1.75" />
        <circle cx="21.5" cy="11" r="1.75" />
        <circle cx="21.5" cy="21" r="1.75" />
        <circle cx="27.5" cy="7.5" r="1.75" />
        <circle cx="27.5" cy="13.5" r="1.75" />
        <circle cx="27.5" cy="18.5" r="1.75" />
      </g>
      <circle cx="27.5" cy="24.5" r="2.2" fill="var(--color-mark-dot, #A8471B)" />
    </svg>
  );
}

/** The mark on its ink tile, as used in the header, footer and favicon. */
export function LogoTile({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[22%] bg-ink p-1.5 text-paper ${className}`}
    >
      <LogoMark className="h-full w-full" />
    </span>
  );
}

/** "forthe.tech" with the clay full stop. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-serif leading-none ${className}`}>
      forthe<span className="text-accent-ink">.</span>tech
    </span>
  );
}
