/** Prism refraction: one incident beam, a wireframe optical body, three spectral rays. */
export function LogoMark({ className = "h-8 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 34"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17 4 30 29H4L17 4Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M0 19h9.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.2 19h15.6" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <path d="M24.8 19 40 14" stroke="#c95135" strokeWidth="1.2" />
      <path d="M24.8 19 40 23" stroke="#cba666" strokeWidth="1.2" />
      <path d="M24.8 19 40 31" stroke="#899fcc" strokeWidth="1.2" />
    </svg>
  );
}

/** Keep the shared mark wrapper; the wireframe now sits directly on the obsidian surface. */
export function LogoTile({ className = "h-8 w-10" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center text-white ${className}`}>
      <LogoMark className="h-full w-full" />
    </span>
  );
}

/** Lowercase sans-serif lockup, with the clay full stop as its only typographic accent. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`whitespace-nowrap font-sans font-bold leading-none tracking-tight text-white ${className}`}
    >
      for the tech<span className="text-[#c95135]">.</span>
    </span>
  );
}
