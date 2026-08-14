import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import postureDrawing from "@/assets/posture-drawing.png";

export function Posture() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const drawingY = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <section
      id="posture"
      ref={ref}
      className="border-b rule-hair"
    >
      <Container className="grid min-h-[70vh] grid-cols-1 items-center gap-10 py-24 md:grid-cols-12">
        <SectionReveal className="md:col-span-6">
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

        <motion.div
          style={{ y: drawingY }}
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center md:col-span-6"
        >
          <img
            src={postureDrawing}
            className="w-full max-w-md"
            alt="Line drawing of a person sitting cross-legged on the floor, hunched over a laptop"
          />
        </motion.div>
      </Container>
    </section>
  );
}
