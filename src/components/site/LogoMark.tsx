interface LogoMarkProps {
  className?: string;
  /** Uses the simplified cut intended for small renderings. */
  small?: boolean;
  /** Uses the single-colour version of the mark. */
  mono?: boolean;
}

/**
 * The current forthe.tech identity.
 *
 * The brand pack is the single source of truth for this mark. Keeping it as an image rather than
 * redrawing the geometry in React prevents the header, favicon, social assets, and future exports
 * drifting into different versions of the logo.
 */
export function LogoMark({ className = "h-6 w-6", small = false, mono = false }: LogoMarkProps) {
  const src = mono
    ? "/brand/mark-paper-mono.svg"
    : small
      ? "/brand/mark-16cut-paper.svg"
      : "/brand/mark-paper.svg";

  return (
    <img
      src={src}
      width={32}
      height={32}
      className={`block h-full w-full object-contain ${className}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/** The standalone mark, sized by the calling component. */
export function LogoTile({
  className = "h-7 w-7",
  small = false,
}: {
  className?: string;
  small?: boolean;
}) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      <LogoMark small={small} />
    </span>
  );
}

/** Official outlined wordmark from the brand pack, for use on the dark site surface. */
export function Wordmark({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <img
      src="/brand/wordmark-paper.svg"
      width={370}
      height={100}
      className={`brand-wordmark block aspect-[3.704/1] max-w-full object-contain ${className}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
