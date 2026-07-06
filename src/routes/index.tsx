import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowUpRight, Github, Plus } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "motion/react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Project = {
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
  { no: "03", name: "PharmaRab", year: "2025", for: "Wife", tags: ["Healthcare", "Bilingual", "Gamified"], blurb: "Gamified Medical Arabic for pharmacists — clinical phrases, vocab bank, XP, progression. Built for my wife.", detail: "My wife is a pharmacist. Medical Arabic at the counter is hard. So I built PharmaRab — a gamified conversational course with a syllabus, a clinical phrase dictionary, a vocabulary bank, and XP for showing up. Arabic and English side by side, Tajawal and Inter, no gate-keeping.", live: "https://pharmarab.vercel.app", github: "https://github.com/afsalali1238/med-arabic-hub" },
  { no: "04", name: "PhysioArab", year: "2025", for: "Friends", tags: ["Healthcare", "Bilingual", "Physio"], blurb: "8-week Medical Arabic course for physiotherapists — assessment terms, movement commands, discharge dialogue.", detail: "Same engine as PharmaRab, retuned for the physio clinic. Eight weeks of greetings, assessment vocabulary, ROM and movement commands, and honest discharge dialogue. Built with therapist friends who wanted their patients to feel heard in their own language.", live: "https://physioarab.vercel.app", github: "https://github.com/afsalali1238/learn-med-arab" },
  { no: "05", name: "JobHunter OS", year: "2025", for: "Wife", tags: ["Productivity", "Career"], blurb: "A job hunting operating system — applications, stages, follow-ups, outcomes, moods.", detail: "Built one evening because a spreadsheet wasn't kind enough. Applications as cards, stages as columns, a small ritual for logging what actually happened in each conversation — including the mood, because job hunting is emotional labour.", github: "https://github.com/afsalali1238/jobhunter-os" },
  { no: "06", name: "Medical Coding Mastery", year: "2025", for: "Wife", tags: ["Healthcare", "AAPC CPC", "DHA"], blurb: "Self-paced 10-week AAPC CPC prep aligned with Dubai DHA and eClaimLink — weekly plans, drills, curated resources.", detail: "A calm ten-week path through the CPC syllabus with DHA and eClaimLink-specific detours. Weekly assignments, checkpoints, curated videos and articles, and clinical scenario drills. Just enough encouragement to make the coding chapters bearable.", live: "https://code-calm-path.lovable.app" },
  { no: "07", name: "Terrarium", year: "2025", for: "Fun", tags: ["Browser game", "Cozy", "Generative"], blurb: "A cozy tiny-planet god-game — warm a small world, answer its prayers, watch the myths people write about you.", detail: "A small warm world in a browser tab. You nudge the weather, answer tiny prayers, and slowly a mythology forms around your choices. Animated SVG doodles, no lose state — only weather.", live: "https://tiny-world-keeper.vercel.app", github: "https://github.com/afsalali1238/terrarium" },
];


function Index() {
  return (
    <div className="min-h-screen bg-paper text-ink grain">
      <div className="pointer-events-none fixed inset-0 grain-overlay opacity-40" />
      <ReadingProgress />
      <div className="relative">
        <Nav />
        <Hero />
        <Marquee />
        <About />
        <Curious />
        <Works />
        <Colophon />
      </div>
    </div>
  );
}

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-ink"
    />
  );
}


function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 md:px-10 ${className}`}>{children}</div>;
}

function Nav() {
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 border-b rule-hair backdrop-blur bg-paper/70"
    >
      <Container className="flex items-center justify-between py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl leading-none">Afsal Ali</span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-ink-mute sm:inline">
            The Curious Issue
          </span>
        </div>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-ink-soft">
          {[
            ["About", "#about"],
            ["Works", "#works"],
            ["Contact", "#colophon"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="group relative">
              <span className="transition-colors group-hover:text-ink">{label}</span>
              <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100" />
            </a>
          ))}
        </nav>
      </Container>
    </motion.header>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

const rise = {
  hidden: { y: 30, opacity: 0 },
  show: (i = 0) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, delay: i * 0.08, ease: EASE },
  }),
} as const;

function Hero() {
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
              <h1 className="font-serif text-[13vw] leading-[0.88] tracking-tight md:text-[9rem]">
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
            <Stat label="For friends & family" value="04" />
            <Stat label="Live in the world" value="07" />
            <Stat label="Working alone" value="'25" />
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
}

function RevealWord({ children, delay = 0, italic = false }: { children: React.ReactNode; delay?: number; italic?: boolean }) {
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div variants={rise}>
      <div className="font-serif text-3xl leading-none">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-ink-mute">{label}</div>
    </motion.div>
  );
}

function Marquee() {
  const items = ["Curious", "Indie", "Bilingual", "Cozy", "Handmade", "For friends", "Quiet software", "Made in '25"];
  const loop = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-b rule-hair bg-paper-deep/40 py-4">
      <motion.div
        className="flex gap-10 whitespace-nowrap font-serif text-2xl italic text-ink-soft"
        animate={{ x: ["0%", "-33.333%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
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

function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function About() {
  return (
    <section id="about" className="border-b rule-hair">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 01 · About</div>
        </SectionReveal>
        <SectionReveal className="md:col-span-9">
          <p className="font-serif text-3xl leading-snug md:text-4xl">
            I build small, useful things — mostly for people I know. A CLI that acts like a
            founding team. A learning map with no straight lines. An Arabic drill for the pharmacy
            counter. A world in a browser tab.
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft">
            Nothing here is a product deck. Each piece was made because a friend, a family member,
            or my own curiosity was pulling on a thread. The through-line is the pull, not the
            stack.
          </p>
        </SectionReveal>
      </Container>
    </section>
  );
}

function Curious() {
  const notes = [
    { k: "Reading", v: "How agents disagree without collapsing." },
    { k: "Playing", v: "Cozy sims with weather but no failure." },
    { k: "Trying", v: "Non-linear syllabi for adult learners." },
    { k: "Avoiding", v: "Anything called a growth loop." },
  ];
  return (
    <section className="border-b rule-hair bg-paper-deep/60">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 02 · Curious</div>
          <div className="mt-3 font-serif text-2xl italic">Field notes.</div>
        </SectionReveal>
        <div className="md:col-span-9">
          <dl className="divide-y divide-[color:var(--rule)] border-y rule-hair">
            {notes.map((n, i) => (
              <motion.div
                key={n.k}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-12 gap-4 py-4"
              >
                <dt className="col-span-3 text-[11px] uppercase tracking-[0.24em] text-ink-mute md:col-span-2">
                  {n.k}
                </dt>
                <dd className="col-span-9 font-serif text-xl leading-snug md:col-span-10">{n.v}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}

function Works() {
  return (
    <section id="works" className="border-b rule-hair">
      <Container className="py-16 md:py-24">
        <SectionReveal>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 03 · Works</div>
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
        className="relative grid w-full grid-cols-12 items-baseline gap-4 py-6 text-left"
      >
        <div className="col-span-2 font-serif text-xl text-ink-mute md:col-span-1">{p.no}</div>
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

function Colophon() {
  return (
    <section id="colophon">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <SectionReveal className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 04 · Colophon</div>
        </SectionReveal>
        <SectionReveal className="md:col-span-9">
          <h2 className="font-serif text-5xl md:text-6xl">Say hello.</h2>
          <p className="mt-4 max-w-xl text-base text-ink-soft">
            Best way to reach me is email. I answer slowly, but I answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
              href="mailto:hello@afsal.dev"
              className="group inline-flex items-center gap-2 border rule-hair bg-ink px-5 py-3 text-sm text-paper"
            >
              hello@afsal.dev
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </motion.a>
            <motion.a
              whileHover={{ y: -3 }}
              whileTap={{ y: 0 }}
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border rule-hair px-5 py-3 text-sm hover:bg-paper-deep"
            >
              GitHub <Github className="h-4 w-4" />
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
