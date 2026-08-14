import { useId, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Github, Plus } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projects, projectCount, numberWord, type Project } from "../../data/projects";


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
              {numberWord(projectCount)} entries<br />Click a row to read
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
  const panelId = `${useId()}-panel`;
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
        aria-expanded={open}
        aria-controls={panelId}
        className="relative grid w-full grid-cols-12 items-baseline gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <div className="col-span-2 font-serif text-xl md:col-span-1 text-ink-mute">{p.no}</div>
        <div className="col-span-10 md:col-span-5">
          <motion.div
            animate={{ x: hover ? 8 : 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-2xl leading-tight md:text-3xl"
          >
            {p.name}
          </motion.div>
        </div>
        {/* One copy only: sits under the name on mobile, in its own column on desktop. */}
        <div className="col-span-12 -mt-2 text-sm text-ink-soft md:col-span-5 md:mt-0">{p.blurb}</div>
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
            id={panelId}
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
                    <dt className="text-[11px] uppercase tracking-[0.24em] text-ink-mute">Year</dt>
                    <dd className="mt-1 font-serif text-lg">{p.year}</dd>
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

                </dl>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
