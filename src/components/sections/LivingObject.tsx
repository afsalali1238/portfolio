import { useState, type ReactNode } from "react";
import { Container } from "../layout/Container";
import { CicadaMatrix } from "./CicadaMatrix";
import { MatrixSilhouette } from "./MatrixSilhouette";

type Mode = "cicada" | "ape-video" | "ape-silhouette";
const MODES: { id: Mode; label: string }[] = [
  { id: "cicada", label: "Cicada (natural)" },
  { id: "ape-video", label: "Ape AK-47 (video)" },
  { id: "ape-silhouette", label: "Ape (silhouette)" },
];

/**
 * LivingObject — the immersive hero of /the-man-behind.
 *
 * The cicada lives in the page background behind the intro copy (canvas spans the hero,
 * painted with the page background so it melts into the section), while the mode toggle and
 * the emergence line float above it on a legibility wash. Ape modes keep their boxed terminal
 * presentation as easter eggs; switching to them unmounts the cicada engine cleanly.
 *
 * Responsive layout:
 *  - Desktop (lg+): intro copy and controls on the left, ape panel on the right — side by side.
 *  - Mobile: stacked — intro and controls on top, height-limited ape panel below.
 *  - Never forces everything into one viewport; scrolling is preserved.
 */
export function LivingObject({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("cicada");
  const immersive = mode === "cicada";

  const apePanel = !immersive ? (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0">
        {/* On desktop, an empty spacer column keeps the ape panel aligned with the intro copy. */}
        <div className="hidden lg:flex lg:w-1/3" />
      </div>
      <div className="flex-1 min-w-[320px] max-w-[720px]">
        <Container className="max-w-none p-0">
          <MatrixSilhouette
            key={mode}
            defaultMode={mode === "ape-video" ? "video" : "silhouette"}
            hideToggle
          />
        </Container>
      </div>
    </div>
  ) : null;

  return (
    <section
      data-cicada-hero
      className={`cicada-hero relative overflow-hidden flex flex-col ${
        immersive ? "min-h-[560px] md:min-h-[86vh]" : ""
      } ${className}`}
    >
      {immersive && <CicadaMatrix variant="background" />}
      <div aria-hidden="true" className="cicada-wash pointer-events-none absolute inset-0 z-[1]" />
      <div className="relative z-10 flex flex-1 flex-col">
        <Container className="max-w-5xl pt-12 md:pt-16">{children}</Container>

        {/* Mode controls are always visible so they never disappear below the ape panel. */}
        <Container className="max-w-none pb-10">
          {!immersive && (
            <p className="font-serif text-lg italic text-ink-soft">
              Seventeen years underground. Then it emerges — wings first.
            </p>
          )}
          <div
            role="tablist"
            aria-label="Living object mode"
            className="mt-5 flex flex-wrap gap-1.5"
          >
            {MODES.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] font-mono transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  mode === m.id
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 font-semibold"
                    : "rule-hair bg-paper text-ink-mute hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {!immersive && (
            <>
              <p className="mt-3 text-[11px] font-mono tracking-wide text-ink-mute">
                Move to stir the wings · Tap to chirp
              </p>
            </>
          )}
        </Container>

        {apePanel}
      </div>
    </section>
  );
}
