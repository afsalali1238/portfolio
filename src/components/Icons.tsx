import type { CSSProperties } from "react";
import { LogoMark, LogoTile, Wordmark } from "./site/LogoMark";

export function Icon({
  name,
  size = 18,
  style,
}: {
  name: "arrow" | "down" | "sound" | "mute" | "read" | "close" | "plus" | "restart";
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {name === "arrow" && (
        <>
          <path d="M5 19 19 5M5 5h14v14" />
        </>
      )}
      {name === "down" && (
        <>
          <path d="M12 4v16m-6-6 6 6 6-6" />
        </>
      )}
      {(name === "sound" || name === "mute") && (
        <>
          <path d="m11 5-5 4H3v6h3l5 4V5Z" />
          {name === "sound" ? (
            <>
              <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
            </>
          ) : (
            <path d="m16 9 5 6m0-6-5 6" />
          )}
        </>
      )}
      {name === "read" && (
        <>
          <path d="M3 5h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-3H3V5Zm18 0h-6a3 3 0 0 0-3 3v13a4 4 0 0 1 4-3h5V5Z" />
        </>
      )}
      {name === "close" && <path d="m6 6 12 12M6 18 18 6" />}
      {name === "plus" && <path d="M12 4v16M4 12h16" />}
      {name === "restart" && (
        <>
          <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
        </>
      )}
    </svg>
  );
}

export function Brand({ showAuthor = true }: { showAuthor?: boolean }) {
  return (
    <a
      href="/"
      className="brand group inline-flex items-center gap-3 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      aria-label="for the tech. by Afsal Ali — home"
    >
      <LogoTile className="h-8 w-10 transition-opacity duration-150 group-hover:opacity-85" />
      <div className="flex items-baseline gap-2">
        <Wordmark className="text-xl sm:text-2xl" />
        {showAuthor && (
          <span className="hidden font-mono text-xs text-[#9a9ea5] sm:inline">/ Afsal Ali</span>
        )}
      </div>
    </a>
  );
}
