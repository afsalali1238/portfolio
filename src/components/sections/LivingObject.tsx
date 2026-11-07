import { useState } from "react";
import { CicadaMatrix } from "./CicadaMatrix";
import { MatrixSilhouette } from "./MatrixSilhouette";

type Mode = "cicada" | "ape-video" | "ape-silhouette";
const MODES: { id: Mode; label: string }[] = [
  { id: "cicada", label: "Cicada (natural)" },
  { id: "ape-video", label: "Ape AK-47 (video)" },
  { id: "ape-silhouette", label: "Ape (silhouette)" },
];

/** Mode switcher for /the-man-behind: natural cicada by default, armed ape as easter egg. */
export function LivingObject({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<Mode>("cicada");
  return (
    <div className={className}>
      <div role="tablist" aria-label="Living object mode" className="mb-3 flex flex-wrap gap-1.5">
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
      {mode === "cicada" ? (
        <CicadaMatrix />
      ) : (
        <MatrixSilhouette
          key={mode}
          defaultMode={mode === "ape-video" ? "video" : "silhouette"}
          hideToggle
        />
      )}
      <p className="mt-4 font-serif text-lg italic text-ink-soft">
        Seventeen years underground. Then it emerges — wings first.
      </p>
    </div>
  );
}
