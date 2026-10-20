import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Container } from "../layout/Container";
import { projectCount, liveCount, forPeopleCount, sourceCount } from "../../data/projects";

const EASE = [0.22, 1, 0.36, 1] as const;

export const rise = {
  hidden: { y: 30, opacity: 0 },
  show: (i = 0) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, delay: i * 0.08, ease: EASE },
  }),
} as const;

export function RevealWord({ children, delay = 0, italic = false }: { children: React.ReactNode; delay?: number; italic?: boolean }) {
  return (
    <span className="inline-block overflow-hidden align-top">
      <motion.span
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`inline-block ${italic ? "italic" : ""}`}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div variants={rise}>
      <div className="font-serif text-3xl leading-none">{value}</div>
      <div className="mt-2 text-xs text-ink-mute">{label}</div>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <section ref={ref} className="py-16 md:py-24">
      <motion.div style={{ y, opacity }}>
        <Container>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="flex items-center justify-between text-sm font-medium text-ink-mute"
          >
            <motion.span variants={rise}>Dubai, UAE</motion.span>
            <motion.span variants={rise}>Public Ledger</motion.span>
            <motion.span variants={rise} className="hidden sm:inline">Afsal Ali</motion.span>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-8">
              <h1 className="font-serif text-[13vw] leading-[0.88] tracking-tight md:text-[6.5rem] lg:text-[8rem]">
                <RevealWord delay={0.1}>For the</RevealWord>
                <br />
                <RevealWord delay={0.25}>tech.</RevealWord>
              </h1>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-end md:col-span-4"
            >
              <p className="font-serif text-2xl leading-tight">
                Building <span className="italic">forthe.tech</span>
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Documenting what happens when the wall between having an idea and building it disappears.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="mt-16 grid grid-cols-2 gap-6 rounded-lg bg-paper-deep/50 p-6 md:p-8 text-sm md:grid-cols-4"
          >
            <Stat label="Projects shipped" value={String(projectCount)} />
            <Stat label="Live on the internet" value={String(liveCount)} />
            <Stat label="Open source" value={String(sourceCount)} />
            <Stat label="For wife, friends, me" value={String(forPeopleCount)} />
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
}
