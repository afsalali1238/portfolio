import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container } from "../layout/Container";
import { projectCount, liveCount, forPeopleCount, sourceCount } from "../../data/projects";
import { RevealWord, StatButton } from "./hero-helpers";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <section ref={ref} className="py-16 md:py-24">
      <motion.div style={{ y, opacity }}>
        <Container>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="mb-3 font-serif text-lg italic text-ink-mute md:text-xl"
              >
                The Curious Issue — Vol. I
              </motion.p>
              <h1 className="font-serif text-[13vw] leading-[0.88] tracking-tight md:text-[6.5rem] lg:text-[8rem]">
                <RevealWord delay={0.1}>For the</RevealWord>
                <br />
                <RevealWord delay={0.25}>tech.</RevealWord>
              </h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-end md:col-span-4 space-y-5"
            >
              <p className="text-base leading-relaxed text-ink-soft">
                Documenting what happens when the wall between having an idea and building it
                disappears.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href="#works"
                  className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  Explore Builds <ArrowDown className="h-4 w-4" />
                </a>
                <Link
                  to="/thesis"
                  className="inline-flex items-center gap-2 rounded-md border rule-hair bg-paper px-4 py-2 text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  The Thesis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="mt-16 grid grid-cols-2 gap-6 rounded-lg bg-paper-deep/50 p-6 md:p-8 text-sm md:grid-cols-4"
          >
            <StatButton label="Total shipped" value={String(projectCount)} filterKey="all" />
            <StatButton label="Live on the internet" value={String(liveCount)} filterKey="live" />
            <StatButton label="Open source" value={String(sourceCount)} filterKey="oss" />
            <StatButton
              label="For wife, friends, me"
              value={String(forPeopleCount)}
              filterKey="for-people"
            />
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
}
