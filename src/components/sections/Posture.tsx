import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import posturePoster from "@/assets/posture.png.asset.json";

export function Posture() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0, 1, 1, 0]);

  return (
    <section
      id="posture"
      ref={ref}
      className="relative overflow-hidden border-b rule-hair"
    >
      {/* Background drawing — large, faint, atmospheric */}
      <motion.div
        style={{ y, opacity }}
        className="pointer-events-none absolute inset-0 -top-[15%] -bottom-[15%]"
      >
        <img
          src={posturePoster.url}
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-[0.14] mix-blend-multiply dark:mix-blend-screen grayscale"
        />
      </motion.div>

      {/* Soft edges so text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-paper via-transparent to-paper" />

      <Container className="relative grid min-h-[70vh] grid-cols-1 items-center gap-10 py-24 md:grid-cols-12">
        <SectionReveal className="md:col-span-7 md:col-start-1">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">
            § 03 · Confession
          </div>
          <h2 className="mt-4 font-serif text-5xl leading-[1.05] md:text-7xl">
            The line I'd never
            <br />
            say out loud.
          </h2>
          <p className="mt-8 max-w-md font-serif text-2xl italic leading-relaxed text-ink-soft">
            I haven't moved in four hours. My spine has become a question mark. But the logic is pure.
          </p>
          <p className="mt-6 text-sm text-ink-mute">
            Move to see. Sit to build. Repeat until the future arrives.
          </p>
        </SectionReveal>
      </Container>
    </section>
  );
}
