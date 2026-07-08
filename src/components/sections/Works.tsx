import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Github, Plus } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";

export type Project = {
  no: string;
  name: string;
  year: string;
  tags: string[];
  blurb: string;
  detail: string;
  live?: string;
  github?: string;
  for: string;
};

const projects: Project[] = [
  { no: "01", name: "Incubator", year: "2025", for: "Me", tags: ["AI Agents", "Claude Code", "CLI"], blurb: "Claude Code skill that becomes a domain-expert CEO — interviews you, researches the market, then hires a sequenced team of specialist agents.", detail: "Idea in, company out. A Claude Code plugin that role-plays a founding team: it interviews you about the hunch, spends a few hours researching the market on its own, ships a findings report, then spawns a sequenced team of specialist agents to build the first version. The interesting part is the org chart — how instruction, dissent, and review flow between agents without collapsing into noise.", github: "https://github.com/afsalali1238/Incubator" },
  { no: "02", name: "NoVibe", year: "2025", for: "Learning", tags: ["EdTech", "AI literacy", "Non-linear"], blurb: "A non-linear AI literacy map — 30 nodes across 6 clusters, learn in any order. No streaks, no XP, no locks.", detail: "Most curricula insist on a straight line. NoVibe is a map: pick a node that itches, follow the threads that pull you. Thirty concepts across six clusters — from 'what is an LLM' to 'agent orchestration'. Built for people who learn by wandering, not by grinding.", live: "https://novibe.lovable.app", github: "https://github.com/afsalali1238/novibe" },
  { no: "03", name: "NxtDoorChef", year: "2025", for: "Dubai", tags: ["Marketplace", "Food", "Community"], blurb: "Find home chefs near you — authentic homemade food from real kitchens across Dubai.", detail: "The best meal in town is next door. NxtDoorChef connects neighbours with home cooks making exactly what they feed their own families. Browse the map, tap 'Say hello' to connect on WhatsApp, walk over with a tiffin, and taste the cultures cooking right next door. From Karama to Dubai Marina.", live: "https://nxtdoorchef.vercel.app" },
  { no: "04", name: "CraftersUnited", year: "2025", for: "Makers", tags: ["Marketplace", "Handcraft", "India"], blurb: "Zero-fee marketplace for handcrafted goods — direct WhatsApp connection between makers and buyers.", detail: "No algorithms. No middlemen. No fees. CraftersUnited connects handmade stories with people who value them. Makers list their work in minutes, buyers browse a curated feed of local talent, and every transaction happens directly — no platform commission. Built because craft deserves to keep every rupee.", live: "https://cr8un8.vercel.app" },
  { no: "05", name: "Kasper", year: "2025", for: "Industry", tags: ["Logistics", "B2B", "UAE"], blurb: "Digital iron — UAE construction & port logistics. Search, book, and track a 150+ truck network instantly.", detail: "Kasper digitises the messy world of UAE construction and port logistics. Equipment rental marketplace with real-time availability, instant freight booking with 2-hour confirmation, published rate cards with no negotiation, GPS tracking with WhatsApp alerts, and digital ePOD. Fixed-rate capacity contracts for enterprise clients. Built for the Khor Fakkan–Jebel Ali corridor.", live: "https://kaslo-liard.vercel.app" },
  { no: "06", name: "Provia", year: "2025", for: "Wife", tags: ["Healthcare", "Gamified", "PWA"], blurb: "Gamified 45-day exam prep for Gulf pharmacy licensing — DHA, MOH, DOH mastery in structured sprints.", detail: "Provia turns the daunting Gulf pharmacy licensing exam into a 45-day game. Progressive difficulty, structured daily sprints, spaced repetition, and enough encouragement to keep going when the pharmacology chapters get heavy. Built as a PWA so it works offline — because studying happens on the bus.", live: "https://proviaap.vercel.app" },
  { no: "07", name: "PharmaRab", year: "2025", for: "Wife", tags: ["Healthcare", "Bilingual", "Gamified"], blurb: "Gamified Medical Arabic for pharmacists — clinical phrases, vocab bank, XP, progression. Built for my wife.", detail: "My wife is a pharmacist. Medical Arabic at the counter is hard. So I built PharmaRab — a gamified conversational course with a syllabus, a clinical phrase dictionary, a vocabulary bank, and XP for showing up. Arabic and English side by side, Tajawal and Inter, no gate-keeping.", live: "https://pharmarab.vercel.app", github: "https://github.com/afsalali1238/med-arabic-hub" },
  { no: "08", name: "PhysioArab", year: "2025", for: "Friends", tags: ["Healthcare", "Bilingual", "Physio"], blurb: "8-week Medical Arabic course for physiotherapists — assessment terms, movement commands, discharge dialogue.", detail: "Same engine as PharmaRab, retuned for the physio clinic. Eight weeks of greetings, assessment vocabulary, ROM and movement commands, and honest discharge dialogue. Built with therapist friends who wanted their patients to feel heard in their own language.", live: "https://physioarab.vercel.app", github: "https://github.com/afsalali1238/learn-med-arab" },
  { no: "09", name: "JobHunter OS", year: "2025", for: "Wife", tags: ["Productivity", "Career"], blurb: "A job hunting operating system — applications, stages, follow-ups, outcomes, moods.", detail: "Built one evening because a spreadsheet wasn't kind enough. Applications as cards, stages as columns, a small ritual for logging what actually happened in each conversation — including the mood, because job hunting is emotional labour.", github: "https://github.com/afsalali1238/jobhunter-os" },
  { no: "10", name: "Medical Coding Mastery", year: "2025", for: "Wife", tags: ["Healthcare", "AAPC CPC", "DHA"], blurb: "Self-paced 10-week AAPC CPC prep aligned with Dubai DHA and eClaimLink — weekly plans, drills, curated resources.", detail: "A calm ten-week path through the CPC syllabus with DHA and eClaimLink-specific detours. Weekly assignments, checkpoints, curated videos and articles, and clinical scenario drills. Just enough encouragement to make the coding chapters bearable.", live: "https://code-calm-path.lovable.app" },
  { no: "11", name: "Terrarium", year: "2025", for: "Fun", tags: ["Browser game", "Cozy", "Generative"], blurb: "A cozy tiny-planet god-game — warm a small world, answer its prayers, watch the myths people write about you.", detail: "A small warm world in a browser tab. You nudge the weather, answer tiny prayers, and slowly a mythology forms around your choices. Animated SVG doodles, no lose state — only weather.", live: "https://tiny-world-keeper.vercel.app", github: "https://github.com/afsalali1238/terrarium" },
];

export function Works() {
  return (
    <section id="works" className="border-b rule-hair">
      <Container className="py-16 md:py-24">
        <SectionReveal>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 04 · Works</div>
              <h2 className="mt-2 font-serif text-5xl md:text-6xl">Selected pieces.</h2>
            </div>
            <div className="hidden text-right text-[11px] uppercase tracking-[0.24em] text-ink-mute md:block">
              Eleven entries<br />Click a row to read
            </div>
          </div>
        </SectionReveal>
        <div className="mt-10 border-t rule-hair">
          {projects.map((p, i) => (
            <ProjectRow key={p.no} p={p} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProjectRow({ p, index }: { p: Project; index: number }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="relative border-b rule-hair"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
            className="pointer-events-none absolute inset-0 bg-paper-deep/60"
          />
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid w-full grid-cols-12 items-baseline gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <div className={`col-span-2 font-serif text-xl md:col-span-1 ${index < 2 ? "text-accent-ink" : "text-ink-mute"}`}>{p.no}</div>
        <div className="col-span-10 md:col-span-5">
          <motion.div
            animate={{ x: hover ? 8 : 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-2xl leading-tight md:text-3xl"
          >
            {p.name}
          </motion.div>
          <div className="mt-1 text-sm text-ink-soft md:hidden">{p.blurb}</div>
        </div>
        <div className="hidden text-sm text-ink-soft md:col-span-4 md:block">{p.blurb}</div>
        <div className="hidden text-right text-[11px] uppercase tracking-[0.24em] text-ink-mute md:col-span-1 md:block">
          {p.year}
        </div>
        <div className="col-span-12 flex items-center justify-end md:col-span-1">
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.3 }}>
            <Plus className="h-4 w-4" />
          </motion.div>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
          >
            <div className="grid grid-cols-12 gap-4 pb-8 pl-0 md:pl-[8.333%]">
              <div className="col-span-12 md:col-span-8">
                <p className="font-serif text-xl leading-relaxed text-ink-soft md:text-2xl">
                  {p.detail}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {p.live && (
                    <a
                      href={p.live}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-2 border rule-hair bg-ink px-4 py-2 text-sm text-paper transition-transform hover:-translate-y-0.5"
                    >
                      Visit site
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )}
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 border rule-hair px-4 py-2 text-sm transition-colors hover:bg-paper-deep"
                    >
                      Source <Github className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              <div className="col-span-12 md:col-span-4">
                <dl className="space-y-3 border-t rule-hair pt-4 text-sm md:border-t-0 md:pt-0">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.24em] text-ink-mute">Built for</dt>
                    <dd className="mt-1 font-serif text-lg">{p.for}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.24em] text-ink-mute">Tags</dt>
                    <dd className="mt-1 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="border rule-hair px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] text-ink-soft"
                        >
                          {t}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.24em] text-ink-mute">Year</dt>
                    <dd className="mt-1 font-serif text-lg">{p.year}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
