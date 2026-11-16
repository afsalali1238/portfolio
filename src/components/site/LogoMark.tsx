/**
 * forthe.tech Brand Guide v1
 * Mark: Light in, bent twice by glass, drawn as it behaves in a prism.
 * Glass: n 1.505 at 590 nm, apex 55°.
 * Beam enters rising 16.5°, runs level inside, leaves falling.
 * Rays leave at -4°, -16.5°, -29°: red (clay) bent least, slate most.
 * Nothing is drawn inside the glass: clear glass shows no beam.
 * Below 24 px use the small cut (stroke 3.1).
 * Wordmark: DM Sans 600, lower case, full stop in clay.
 */

interface LogoMarkProps {
  className?: string;
  /** Force small cut (recommended for display below 24px) */
  small?: boolean;
  /** Force monochrome rendering using currentColor */
  mono?: boolean;
}

export function LogoMark({ className = "h-6 w-6", small = false, mono = false }: LogoMarkProps) {
  if (small) {
    return (
      <svg
        viewBox="0.42 1.45 41.22 30.1"
        fill="none"
        className={className}
        aria-hidden="true"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Incident ray */}
        <path d="M2.97 20.84L9.20 19.00" stroke="currentColor" />
        {/* Dispersed rays: Clay, Gold, Slate */}
        <path
          d="M23.28 16.07L37.84 17.09"
          stroke={mono ? "currentColor" : "var(--color-clay, #d96346)"}
        />
        <path
          d="M24.80 19.00L38.79 23.14"
          stroke={mono ? "currentColor" : "var(--color-gold, #cba666)"}
        />
        <path
          d="M26.32 21.93L39.09 29.00"
          stroke={mono ? "currentColor" : "var(--color-slate, #899fcc)"}
        />
        {/* Prism glass triangle */}
        <path d="M17 4L30 29L4 29Z" stroke="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="-2.01 1.9 44.13 29.2"
      fill="none"
      className={className}
      aria-hidden="true"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Incident ray */}
      <path d="M0.09 21.70L9.20 19.00" stroke="currentColor" />
      {/* Dispersed rays: Clay, Gold, Slate */}
      <path
        d="M23.60 16.69L39.44 17.80"
        stroke={mono ? "currentColor" : "var(--color-clay, #d96346)"}
      />
      <path
        d="M24.80 19.00L40.02 23.51"
        stroke={mono ? "currentColor" : "var(--color-gold, #cba666)"}
      />
      <path
        d="M26.00 21.31L39.89 29.00"
        stroke={mono ? "currentColor" : "var(--color-slate, #899fcc)"}
      />
      {/* Prism glass triangle */}
      <path d="M17 4L30 29L4 29Z" stroke="currentColor" />
    </svg>
  );
}

/** The mark standalone or in its container for header and footer. */
export function LogoTile({
  className = "h-7 w-7",
  small = false,
}: {
  className?: string;
  small?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center text-ink dark:text-bone ${className}`}
    >
      <LogoMark className="h-full w-full" small={small} />
    </span>
  );
}

/**
 * "forthe.tech" in DM Sans 600 with the clay full stop.
 * Governed strictly by brand guidelines: lower case name, full stop in clay.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-sans font-semibold tracking-[-0.03em] leading-none ${className}`}>
      forthe<span className="text-[var(--color-clay,#d96346)]">.</span>tech
    </span>
  );
}
