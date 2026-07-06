import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Github, Plus, Minus } from "lucide-react";

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
  {
    no: "01",
    name: "Source",
    year: "2026",
    for: "Live",
    tags: ["CLI", "Claude Code", "Agents"],
    blurb: "Incubator that acts as CEO — researches markets, hires agent teams, ships startups.",
    detail:
      "A Claude Code skill that role-plays a founding team. You hand it a hunch; it interrogates the market, sketches a company, and spawns specialist agents to build the first version. The interesting part is the org chart — how instruction, dissent, and review flow between agents without collapsing into noise.",
    github: "https://github.com",
  },
  {
    no: "02",
    name: "NoVibe",
    year: "2025",
    for: "Learning",
    tags: ["Non-linear", "AI literacy", "Map"],
    blurb: "Non-linear AI literacy map — 30 nodes across 6 clusters, learn in any order.",
    detail:
      "Most curricula insist on a straight line. NoVibe is a map: pick a node that itches, follow the threads that pull you. Thirty concepts, six clusters, no gate-keeping. Built for people who learn by wandering.",
    live: "https://novibe.lovable.app",
    github: "https://github.com",
  },
  {
    no: "03",
    name: "PharmaRab",
    year: "2025",
    for: "Branded — Friends",
    tags: ["Bilingual", "Gamified", "Pharma"],
    blurb: "Medical Arabic for pharmacists — gamified, bilingual, XP-driven drills.",
    detail:
      "A quiet drill app for expats behind the counter. Bilingual scripts, spaced repetition, XP for showing up. Built with pharmacist friends who kept forgetting the same twenty phrases.",
    github: "https://github.com",
  },
  {
    no: "04",
    name: "PhysioArab",
    year: "2025",
    for: "Branded — Friends",
    tags: ["Bilingual", "Clinical", "Physio"],
    blurb: "The physio sibling: clinical Arabic drills for assessment and rehab.",
    detail:
      "Same engine as PharmaRab, retuned for the physio clinic — palpation, ROM, pain scales, discharge advice. Written with therapists who wanted their patients to feel heard in their own language.",
    live: "https://physioarab.vercel.app",
    github: "https://github.com",
  },
  {
    no: "05",
    name: "JobHunter OS",
    year: "2025",
    for: "Wife",
    tags: ["Career", "Tracker"],
    blurb: "A career operating system — track applications, stages, follow-ups, and moods.",
    detail:
      "Built one evening because a spreadsheet wasn't kind enough. Applications as cards, stages as columns, a small ritual for logging what actually happened in each conversation.",
    github: "https://github.com",
  },
  {
    no: "06",
    name: "Medical Coding Mastery",
    year: "2025",
    for: "Wife",
    tags: ["AAPC CPC", "DHA", "Exam prep"],
    blurb: "10-week AAPC CPC exam prep aligned with Dubai DHA requirements.",
    detail:
      "A calm ten-week path through the CPC syllabus with DHA-specific detours. Weekly plans, timed drills, and just enough encouragement to make the coding chapters bearable.",
    live: "https://code-calm-path.lovable.app",
  },
  {
    no: "07",
    name: "Terrarium",
    year: "2025",
    for: "Fun",
    tags: ["God-game", "Cozy", "Browser"],
    blurb: "Cozy browser god-game — warm a world, answer prayers, watch myths grow.",
    detail:
      "A small warm world in a tab. You nudge the weather, listen to tiny prayers, and slowly a mythology forms around your choices. There is no lose state, only weather.",
    live: "https://tiny-world-keeper.vercel.app",
    github: "https://github.com",
  },
  {
    no: "08",
    name: "NxtDoor Chef",
    year: "2025",
    for: "Live",
    tags: ["Marketplace", "Food"],
    blurb: "Home cooks next door — order the dish your neighbour is already making.",
    detail:
      "A neighbourhood marketplace for home kitchens. Discovery is by street, not algorithm. Pickup windows are honest, portions are generous.",
    live: "https://nxtdoorchef.vercel.app",
  },
  {
    no: "09",
    name: "PROVIA CV",
    year: "2025",
    for: "Live",
    tags: ["CV", "Résumé", "AI"],
    blurb: "A résumé builder that writes like a person, not a keyword machine.",
    detail:
      "PROVIA CV drafts résumés in your voice, then trims them to a page without stripping personality. Templates are quiet on purpose; recruiters can read.",
    live: "https://proviacv.vercel.app",
  },
  {
    no: "10",
    name: "PROVIA AP",
    year: "2025",
    for: "Live",
    tags: ["Applications", "AI"],
    blurb: "The application companion — cover letters, follow-ups, and honest tracking.",
    detail:
      "The sibling to PROVIA CV. Generates cover letters that don't sound generated, drafts follow-ups a week later, and keeps a small honest log of what you sent where.",
    live: "https://proviaap.vercel.app",
  },
  {
    no: "11",
    name: "Cr8un8",
    year: "2025",
    for: "Live",
    tags: ["Creative", "Community"],
    blurb: "A small studio for one-of-eight creative drops — limited, dated, done.",
    detail:
      "Every drop is a run of eight. Once they're claimed, the piece is done. A quiet argument against infinite feeds.",
    live: "https://cr8un8.vercel.app",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-paper text-ink grain">
      <div className="pointer-events-none fixed inset-0 grain-overlay opacity-40" />
      <div className="relative">
        <Nav />
        <Hero />
        <About />
        <Curious />
        <Works />
        <Colophon />
      </div>
    </div>
  );
}

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-6 md:px-10 ${className}`}>{children}</div>;
}

function Nav() {
  return (
    <header className="border-b rule-hair">
      <Container className="flex items-center justify-between py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl leading-none">Afsal Ali</span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-ink-mute sm:inline">
            The Curious Issue
          </span>
        </div>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-ink-soft">
          <a href="#about" className="hover:text-ink">About</a>
          <a href="#works" className="hover:text-ink">Works</a>
          <a href="#colophon" className="hover:text-ink">Contact</a>
        </nav>
      </Container>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b rule-hair">
      <Container className="py-14 md:py-24">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-ink-mute">
          <span>Vol. I · No. 01</span>
          <span>Est. 2025</span>
          <span className="hidden sm:inline">Independent</span>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-9">
            <h1 className="font-serif text-[13vw] leading-[0.88] tracking-tight md:text-[9rem]">
              The <span className="italic">Curious</span>
              <br />
              Issue.
            </h1>
          </div>
          <div className="flex flex-col justify-end md:col-span-3">
            <p className="font-serif text-2xl leading-tight">
              A small press of experiments by <span className="italic">Afsal Ali</span>.
            </p>
            <p className="mt-4 text-sm text-ink-soft">
              AI tools, learning maps, cozy games, and quiet software — built for friends, family, and the odd stranger.
            </p>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-6 border-t rule-hair pt-6 text-sm md:grid-cols-4">
          <Stat label="Projects shipped" value="11" />
          <Stat label="For friends & family" value="04" />
          <Stat label="Live in the world" value="07" />
          <Stat label="Working alone" value="Since '25" />
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-serif text-3xl leading-none">{value}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-ink-mute">{label}</div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="border-b rule-hair">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 01 · About</div>
        </div>
        <div className="md:col-span-9">
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
        </div>
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
        <div className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 02 · Curious</div>
          <div className="mt-3 font-serif text-2xl italic">Field notes.</div>
        </div>
        <div className="md:col-span-9">
          <dl className="divide-y divide-[color:var(--rule)] border-y rule-hair">
            {notes.map((n) => (
              <div key={n.k} className="grid grid-cols-12 gap-4 py-4">
                <dt className="col-span-3 text-[11px] uppercase tracking-[0.24em] text-ink-mute md:col-span-2">
                  {n.k}
                </dt>
                <dd className="col-span-9 font-serif text-xl leading-snug md:col-span-10">{n.v}</dd>
              </div>
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
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 03 · Works</div>
            <h2 className="mt-2 font-serif text-5xl md:text-6xl">Selected pieces.</h2>
          </div>
          <div className="hidden text-right text-[11px] uppercase tracking-[0.24em] text-ink-mute md:block">
            Eleven entries<br />Click a row to read
          </div>
        </div>
        <div className="mt-10 border-t rule-hair">
          {projects.map((p) => (
            <ProjectRow key={p.no} p={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function ProjectRow({ p }: { p: Project }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b rule-hair">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid w-full grid-cols-12 items-baseline gap-4 py-6 text-left transition-colors hover:bg-paper-deep/50"
      >
        <div className="col-span-2 font-serif text-xl text-ink-mute md:col-span-1">{p.no}</div>
        <div className="col-span-10 md:col-span-5">
          <div className="font-serif text-2xl leading-tight md:text-3xl">{p.name}</div>
          <div className="mt-1 text-sm text-ink-soft md:hidden">{p.blurb}</div>
        </div>
        <div className="hidden text-sm text-ink-soft md:col-span-4 md:block">{p.blurb}</div>
        <div className="hidden text-right text-[11px] uppercase tracking-[0.24em] text-ink-mute md:col-span-1 md:block">
          {p.year}
        </div>
        <div className="col-span-12 flex items-center justify-end md:col-span-1">
          {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </div>
      </button>
      {open && (
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
                  className="inline-flex items-center gap-2 border rule-hair bg-ink px-4 py-2 text-sm text-paper transition-transform hover:-translate-y-0.5"
                >
                  Visit site <ArrowUpRight className="h-4 w-4" />
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
      )}
    </div>
  );
}

function Colophon() {
  return (
    <section id="colophon">
      <Container className="grid grid-cols-1 gap-10 py-16 md:grid-cols-12 md:py-24">
        <div className="md:col-span-3">
          <div className="text-[11px] uppercase tracking-[0.28em] text-ink-mute">§ 04 · Colophon</div>
        </div>
        <div className="md:col-span-9">
          <h2 className="font-serif text-5xl md:text-6xl">Say hello.</h2>
          <p className="mt-4 max-w-xl text-base text-ink-soft">
            Best way to reach me is email. I answer slowly, but I answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="mailto:hello@afsal.dev"
              className="inline-flex items-center gap-2 border rule-hair bg-ink px-5 py-3 text-sm text-paper hover:-translate-y-0.5"
            >
              hello@afsal.dev <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border rule-hair px-5 py-3 text-sm hover:bg-paper-deep"
            >
              GitHub <Github className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-16 flex flex-wrap items-end justify-between gap-4 border-t rule-hair pt-6 text-[11px] uppercase tracking-[0.24em] text-ink-mute">
            <div>Set in Instrument Serif & Inter. Printed to pixels, {new Date().getFullYear()}.</div>
            <div>© Afsal Ali · All curiosities reserved.</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
