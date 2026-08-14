const ITEMS = [
  "Curious",
  "Indie",
  "Bilingual",
  "Cozy",
  "Handmade",
  "For friends",
  "Quiet software",
  "Still shipping",
];

export function Marquee() {
  // Tripled so the -33.333% translate lands back on an identical frame — seamless loop.
  const loop = [...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div
      className="marquee overflow-hidden border-b rule-hair bg-paper-deep/40 py-4 cursor-default"
      aria-hidden="true"
    >
      <div className="marquee-track flex gap-10 whitespace-nowrap font-serif text-2xl italic text-ink-soft">
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span className="text-ink-mute">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
