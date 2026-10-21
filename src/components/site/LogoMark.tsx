/**
 * Logo: Half thought, half built. One line breaks through.
 * Left half: smooth semi-circle (thinking, philosophy) with a line cutting through.
 * Right half: 26 pixel blocks (building, tech) with the 4-pixel row turning clay (#A8471B / #E67E54).
 */

export function LogoMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      {/* Smooth left half with horizontal line cut (curiosity cutting in) */}
      <path d="M 16 4.8 A 11.2 11.2 0 0 0 5.08 13.5 L 16 13.5 Z" fill="currentColor" />
      <path d="M 16 15.75 L 4.80 15.75 A 11.2 11.2 0 0 0 16 27.2 Z" fill="currentColor" />

      {/* Right half: pixel grid (tech, building) */}
      {/* Row 0: 2 pixels */}
      <rect x="16.25" y="5.25" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="19.00" y="5.25" width="2.25" height="2.25" rx="0.3" fill="currentColor" />

      {/* Row 1: 3 pixels */}
      <rect x="16.25" y="8.00" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="19.00" y="8.00" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="21.75" y="8.00" width="2.25" height="2.25" rx="0.3" fill="currentColor" />

      {/* Row 2: 4 pixels */}
      <rect x="16.25" y="10.75" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="19.00" y="10.75" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="21.75" y="10.75" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="24.50" y="10.75" width="2.25" height="2.25" rx="0.3" fill="currentColor" />

      {/* Row 3: 4 pixels in clay (the line becomes built) */}
      <rect
        x="16.25"
        y="13.50"
        width="2.25"
        height="2.25"
        rx="0.3"
        fill="var(--color-mark-dot, #E67E54)"
      />
      <rect
        x="19.00"
        y="13.50"
        width="2.25"
        height="2.25"
        rx="0.3"
        fill="var(--color-mark-dot, #E67E54)"
      />
      <rect
        x="21.75"
        y="13.50"
        width="2.25"
        height="2.25"
        rx="0.3"
        fill="var(--color-mark-dot, #E67E54)"
      />
      <rect
        x="24.50"
        y="13.50"
        width="2.25"
        height="2.25"
        rx="0.3"
        fill="var(--color-mark-dot, #E67E54)"
      />

      {/* Row 4: 4 pixels */}
      <rect x="16.25" y="16.25" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="19.00" y="16.25" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="21.75" y="16.25" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="24.50" y="16.25" width="2.25" height="2.25" rx="0.3" fill="currentColor" />

      {/* Row 5: 4 pixels */}
      <rect x="16.25" y="19.00" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="19.00" y="19.00" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="21.75" y="19.00" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="24.50" y="19.00" width="2.25" height="2.25" rx="0.3" fill="currentColor" />

      {/* Row 6: 3 pixels */}
      <rect x="16.25" y="21.75" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="19.00" y="21.75" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="21.75" y="21.75" width="2.25" height="2.25" rx="0.3" fill="currentColor" />

      {/* Row 7: 2 pixels */}
      <rect x="16.25" y="24.50" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
      <rect x="19.00" y="24.50" width="2.25" height="2.25" rx="0.3" fill="currentColor" />
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
