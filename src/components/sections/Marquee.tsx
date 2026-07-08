import { motion, useAnimationControls } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function Marquee() {
  const items = ["Curious", "Indie", "Bilingual", "Cozy", "Handmade", "For friends", "Quiet software", "Made in '25"];
  const loop = [...items, ...items, ...items];
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="overflow-hidden border-b rule-hair bg-paper-deep/40 py-4 cursor-default"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        className="flex gap-10 whitespace-nowrap font-serif text-2xl italic text-ink-soft"
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
        style={{ animationPlayState: paused ? "paused" : "running" }}
        whileHover={{ animationPlayState: "paused" }}
      >
        {loop.map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span className="text-ink-mute">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
