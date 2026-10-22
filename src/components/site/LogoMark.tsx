/**
 * Logo: Half thought, half built. One line breaks through.
 * Left half: smooth semi-circle (thinking, philosophy) with a line cutting through.
 * Right half: 26 pixel blocks (building, tech) with the 4-pixel row turning clay (#A8471B / #E67E54).
 */

export function LogoMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Smooth left half with curiosity cut (the wall) and standard pixel blocks */}
      <g fill="currentColor">
        <path d="M16 4.8A11.2 11.2 0 0 0 5.329 12.6H16Z" />
        <path d="M16 15.7H4.804A11.2 11.2 0 0 0 16 27.2Z" />
        <rect x="16.3" y="5.2" width="3.1" height="3.1" rx="0.5" />
        <rect x="16.3" y="8.9" width="3.1" height="3.1" rx="0.5" />
        <rect x="16.3" y="16.3" width="3.1" height="3.1" rx="0.5" />
        <rect x="16.3" y="20" width="3.1" height="3.1" rx="0.5" />
        <rect x="16.3" y="23.7" width="3.1" height="3.1" rx="0.5" />
        <rect x="20" y="8.9" width="3.1" height="3.1" rx="0.5" />
        <rect x="20" y="16.3" width="3.1" height="3.1" rx="0.5" />
        <rect x="20" y="20" width="3.1" height="3.1" rx="0.5" />
        <rect x="23.7" y="16.3" width="3.1" height="3.1" rx="0.5" />
      </g>
      {/* Clay pixel row continuing through the cut gap */}
      <g fill="var(--color-mark-dot, #E67E54)">
        <rect
          x="16.3"
          y="12.6"
          width="3.1"
          height="3.1"
          rx="0.5"
          className="logo-clay-pixel [animation-delay:0.2s]"
        />
        <rect
          x="20"
          y="12.6"
          width="3.1"
          height="3.1"
          rx="0.5"
          className="logo-clay-pixel [animation-delay:0.28s]"
        />
        <rect
          x="23.7"
          y="12.6"
          width="3.1"
          height="3.1"
          rx="0.5"
          className="logo-clay-pixel [animation-delay:0.36s]"
        />
      </g>
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
