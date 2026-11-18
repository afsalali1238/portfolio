import {
  BRAND_ASPECT,
  BRAND_ASSETS,
  LOCKUP_MIN_TYPE_PX,
  MARK_MIN_PX,
  MARK_SMALL_CUT_BELOW_PX,
  WORDMARK,
  type BrandVersion,
} from "../../lib/brand";

/**
 * forthe.tech identity primitives (Brand Guide v1).
 *
 * Every drawing comes from the generated pack in /brand/svg, which is built from src/lib/brand.ts.
 * Components size by height in CSS pixels, so the guide's size rules can be enforced here rather
 * than remembered at each call site.
 */

interface MarkProps {
  /** Rendered height in CSS px. Below 24 px the small cut is used; 16 px is the floor. */
  height: number;
  version?: BrandVersion;
  className?: string;
}

/** The prism alone. Use where the name is close by. */
export function LogoMark({ height, version = "on-ink-colour", className = "" }: MarkProps) {
  const h = Math.max(height, MARK_MIN_PX);
  const small = h < MARK_SMALL_CUT_BELOW_PX;
  const width = Math.round(h * (small ? BRAND_ASPECT.markSmall : BRAND_ASPECT.mark));
  return (
    <img
      src={small ? BRAND_ASSETS.markSmall(version) : BRAND_ASSETS.mark(version)}
      width={width}
      height={h}
      style={{ width, height: h }}
      className={`block shrink-0 ${className}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/**
 * Horizontal lockup: mark and wordmark as one drawing, so their proportion and spacing can't drift.
 * `height` is the drawing's height; the wordmark's type size is about 0.75 × that.
 */
export function Lockup({ height, version = "on-ink-colour", className = "" }: MarkProps) {
  const typePx = (height * 1000) / 1340;
  if (typePx < LOCKUP_MIN_TYPE_PX) {
    // Guide §5: no lockup below 14 px type; use the mark alone.
    return <LogoMark height={height} version={version} className={className} />;
  }
  const width = Math.round(height * BRAND_ASPECT.lockup);
  return (
    <img
      src={BRAND_ASSETS.lockup(version)}
      width={width}
      height={height}
      style={{ width, height }}
      className={`block shrink-0 ${className}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/** The outlined wordmark alone, sized by cap height so it can sit on a text baseline. */
export function Wordmark({
  capHeight,
  version = "on-ink-colour",
  className = "",
}: {
  capHeight: number;
  version?: BrandVersion;
  className?: string;
}) {
  const height = Math.round((capHeight * 780) / WORDMARK.capHeight);
  const width = Math.round(height * BRAND_ASPECT.wordmark);
  return (
    <img
      src={BRAND_ASSETS.wordmark(version)}
      width={width}
      height={height}
      style={{ width, height }}
      className={`block shrink-0 ${className}`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
