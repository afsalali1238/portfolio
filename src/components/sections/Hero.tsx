import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container } from "../layout/Container";
import { projectCount, liveCount, forPeopleCount, sourceCount } from "../../data/projects";
import { RevealWord, StatLink } from "./hero-helpers";

export function Hero() {
  return (
    <section className="py-14 md:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="mb-3 font-serif text-lg italic text-ink-mute md:text-xl">
              The Curious Issue — Vol. I
            </p>
            <h1 className="font-serif text-[13vw] leading-[0.88] tracking-tight md:text-[6.5rem] lg:text-[8rem]">
              <RevealWord delay={0.05}>For the</RevealWord>
              <br />
              <RevealWord delay={0.18}>tech.</RevealWord>
            </h1>
          </div>

          <div className="flex flex-col justify-end space-y-5 md:col-span-4">
            <p className="text-base leading-relaxed text-ink-soft">
              Documenting what happens when the wall between having an idea and building it
              disappears.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-sm">
              <Link
                to="/works"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-5 text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                See the builds <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/thesis"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border rule-hair bg-paper px-5 text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                The Thesis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="mt-14 grid grid-cols-2 gap-6 rounded-lg bg-paper-deep/50 p-6 text-sm md:grid-cols-4 md:p-8"
        >
          <StatLink label="Total shipped" value={String(projectCount)} filterKey="all" />
          <StatLink label="Live on the internet" value={String(liveCount)} filterKey="live" />
          <StatLink label="Open source" value={String(sourceCount)} filterKey="oss" />
          <StatLink
            label="For wife, friends, me"
            value={String(forPeopleCount)}
            filterKey="for-people"
          />
        </motion.div>
      </Container>
    </section>
  );
}
