import { useState, type ReactNode } from "react";
import { Container } from "../layout/Container";
import { CicadaMatrix } from "./CicadaMatrix";
import { ApeVideoBackground } from "./ApeVideoBackground";

type Mode = "cicada" | "ape-video";
const MODES: { id: Mode; label: string }[] = [
  { id: "cicada", label: "Cicada (natural)" },
  { id: "ape-video", label: "Ape AK-47 (video)" },
];

/**
 * LivingObject — the immersive hero of /the-man-behind.
 *
 * Both the natural cicada and the AK-47 chimpanzee video live in the page background
 * behind the intro copy (canvas/video spans the hero, painted with the page background
 * and legibility wash so they melt into the section).
 *
 * Modes:
 * - "cicada": reactive living character-matrix insect engine.
 * - "ape-video": full-bleed, fit-to-screen video matrix background with falling glyph rain.
 */
export function LivingObject({
  className = "",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("cicada");

  return (
    <section
      data-cicada-hero
      className={`cicada-hero relative overflow-hidden flex flex-col min-h-[560px] md:min-h-[86vh] ${className}`}
    >
      {mode === "cicada" ? <CicadaMatrix variant="background" /> : <ApeVideoBackground />}
      <div aria-hidden="true" className="cicada-wash pointer-events-none absolute inset-0 z-[1]" />
      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <Container className="max-w-5xl pt-12 md:pt-16">{children}</Container>

        <Container className="max-w-5xl pb-10 mt-auto">
          <p className="font-serif text-lg italic text-ink-soft transition-opacity duration-300">
            {mode === "cicada"
              ? "Seventeen years underground. Then it emerges — wings first."
              : "Giving an operator modern tools is like handing a chimpanzee an AK-47: zero committees, lethal execution speed."}
          </p>
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
          <p className="mt-3 text-[11px] font-mono tracking-wide text-ink-mute">
            {mode === "cicada"
              ? "Move to stir the wings · Tap to chirp"
              : "Move cursor to illuminate matrix rain · Fit-to-screen live feed"}
          </p>
        </Container>
      </div>
    </section>
  );
}
