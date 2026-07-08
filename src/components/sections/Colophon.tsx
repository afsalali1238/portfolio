import { motion } from "motion/react";
import { ArrowUpRight, Github } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

export function Colophon() {
  return (
    <section id="colophon">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 05 · Colophon</div>
        </SectionReveal>
        <SectionReveal className="md:col-span-9">
          <h2 className="font-serif text-5xl md:text-6xl">Say hello.</h2>
          <p className="mt-4 max-w-xl text-base text-ink-soft">
            Best found on GitHub, LinkedIn, or by email. I answer slowly, but I answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
              href="https://github.com/afsalali1238"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 border rule-hair bg-ink px-5 py-3 text-sm text-paper transition-colors hover:bg-ink-soft"
            >
              GitHub · @afsalali1238
              <Github className="h-4 w-4" />
            </motion.a>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
              href="https://www.linkedin.com/in/afsalali1238/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border rule-hair px-5 py-3 text-sm hover:bg-paper-deep transition-colors"
            >
              LinkedIn <ArrowUpRight className="h-4 w-4" />
            </motion.a>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
              href="https://medium.com/@afsalali1238"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border rule-hair px-5 py-3 text-sm hover:bg-paper-deep transition-colors"
            >
              Medium <ArrowUpRight className="h-4 w-4" />
            </motion.a>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
              href="mailto:afsalali1238@gmail.com"
              className="inline-flex items-center gap-2 border rule-hair px-5 py-3 text-sm hover:bg-paper-deep transition-colors"
            >
              Email <ArrowUpRight className="h-4 w-4" />
            </motion.a>
          </div>
          <div className="mt-16 flex flex-wrap items-end justify-between gap-4 border-t rule-hair pt-6 text-[11px] uppercase tracking-[0.24em] text-ink-mute">
            <div>Set in Instrument Serif & Inter. Printed to pixels, {new Date().getFullYear()}.</div>
            <div>© Afsal Ali · All curiosities reserved.</div>
          </div>
        </SectionReveal>
      </Container>
    </section>
  );
}
