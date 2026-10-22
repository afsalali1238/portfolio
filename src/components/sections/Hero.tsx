import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container } from "../layout/Container";
import { projectCount, liveCount, forPeopleCount, sourceCount } from "../../data/projects";
import { RevealWord, StatLink } from "./hero-helpers";
import { HeroPrism } from "./HeroPrism";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-12 md:pt-20 md:pb-16">
      {/* Background Interactive Prism Canvas (Pink Floyd Dark Side + Constellation Motif) */}
      <HeroPrism className="absolute inset-0 z-0 h-full w-full opacity-90 transition-opacity" />

      {/* Gentle soft edge overlay - preserves readability while letting the constellation breathe */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-paper/10 via-transparent to-paper/50"
        aria-hidden="true"
      />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Authoritative Editorial Presentation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border rule-hair bg-paper/80 px-3.5 py-1 text-xs font-medium text-ink-mute backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" />
              <span>Afsal Ali · Dubai, UAE · Open ledger</span>
            </div>

            <h1 className="font-serif tracking-tight">
              <span className="block text-[12vw] leading-[0.88] md:text-[5.5rem] lg:text-[6.8rem] text-ink">
                <RevealWord delay={0.05}>For the tech.</RevealWord>
              </span>
              <span className="block mt-2 text-[7.5vw] leading-[1.02] italic text-ink-mute md:text-[3.2rem] lg:text-[4rem]">
                <RevealWord delay={0.18} italic>
                  Not because anyone asked.
                </RevealWord>
              </span>
            </h1>

            <p className="max-w-xl text-base md:text-lg leading-relaxed text-ink-soft">
              Documenting what happens when the wall between having an idea and building it
              disappears. Sixteen quiet tools, public code, and honest field notes.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-sm">
              <Link
                to="/works"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-ink px-6 text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                See the builds <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/notes"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border rule-hair bg-paper px-6 text-ink transition-colors hover:bg-paper-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                Read the notes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Open visual space for the Prism, Spectrum & Constellation */}
          <div className="hidden lg:block lg:col-span-5 h-[360px] pointer-events-none" aria-hidden="true">
            {/* Acts as spacer reserving the visual stage for the canvas artwork */}
          </div>
        </div>

        {/* Shipped & verified metrics card: Grounded below the hero */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="mt-14 grid grid-cols-2 gap-6 rounded-lg bg-paper/90 p-6 backdrop-blur-xs text-sm md:grid-cols-4 md:p-8 border rule-hair"
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
