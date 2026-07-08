import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Container } from "../layout/Container";

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
      <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-ink-mute">{label}</div>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <section ref={ref} className="border-b rule-hair">
      <motion.div style={{ y, opacity }}>
        <Container className="py-14 md:py-24">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-ink-mute"
          >
            <motion.span variants={rise}>Vol. I · No. 01</motion.span>
            <motion.span variants={rise}>Est. 2025</motion.span>
            <motion.span variants={rise} className="hidden sm:inline">Independent</motion.span>
          </motion.div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-12">
            <div className="md:col-span-9">
              <h1 className="font-serif text-[13vw] leading-[0.88] tracking-tight md:text-[7rem] lg:text-[9rem]">
                <RevealWord delay={0.1}>The&nbsp;</RevealWord>
                <RevealWord delay={0.2} italic>Curious</RevealWord>
                <br />
                <RevealWord delay={0.35}>Issue.</RevealWord>
              </h1>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-end md:col-span-3"
            >
              <p className="font-serif text-2xl leading-tight">
                A small press of experiments by <span className="italic">Afsal Ali</span>.
              </p>
              <p className="mt-4 text-sm text-ink-soft">
                AI tools, learning maps, cozy games, and quiet software — built for friends, family, and the odd stranger.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="mt-16 grid grid-cols-2 gap-6 border-t rule-hair pt-6 text-sm md:grid-cols-4"
          >
            <Stat label="Projects shipped" value="11" />
            <Stat label="For wife, friends, me" value="10" />
            <Stat label="Live on the internet" value="09" />
            <Stat label="Shipped solo" value="Since '25" />
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
}
