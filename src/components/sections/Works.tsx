import { useId, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, ArrowRight, Github, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { projects, projectCount, numberWord, type Project } from "../../data/projects";
import { useProjectFilter, type ProjectFilter } from "../../data/filter-state";

export function Works() {
  const [filter, setFilter] = useProjectFilter();

  const filteredProjects = projects.filter((p) => {
    if (filter === "live") return Boolean(p.live);
    if (filter === "oss") return Boolean(p.github);
    if (filter === "for-people") return ["Wife", "Friends", "Me"].includes(p.for);
    return true;
  });

  const filterButtons: { label: string; key: ProjectFilter; count: number }[] = [
    { label: "All Builds", key: "all", count: projectCount },
    { label: "Live on Web", key: "live", count: projects.filter((p) => p.live).length },
    { label: "Open Source", key: "oss", count: projects.filter((p) => p.github).length },
    {
      label: "For People",
      key: "for-people",
      count: projects.filter((p) => ["Wife", "Friends", "Me"].includes(p.for)).length,
    },
  ];

  return (
    <section id="works" className="py-20 md:py-28">
      <Container>
        <SectionReveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-medium text-ink-mute">Catalog of Builds</div>
              <h2 className="mt-2 font-serif text-5xl md:text-6xl">Selected pieces.</h2>
            </div>
            <div className="text-xs text-ink-mute">
              {numberWord(filteredProjects.length)} of {numberWord(projectCount)} shown · Click to
              expand or open case study
            </div>
          </div>

          {/* Interactive filter chips */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {filterButtons.map((fb) => (
              <button
                key={fb.key}
                type="button"
                onClick={() => setFilter(fb.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  filter === fb.key
                    ? "bg-ink text-paper"
                    : "bg-paper-deep/70 text-ink-soft hover:bg-paper-deep hover:text-ink"
                }`}
              >
                {fb.label} <span className="opacity-60 text-[10px] ml-1">({fb.count})</span>
              </button>
            ))}
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="text-xs text-ink-mute hover:text-ink transition-colors ml-2 underline underline-offset-4"
              >
                Clear filter
              </button>
            )}
          </div>
        </SectionReveal>

        {/* taste-skill-ignore */}
        <div className="mt-10 border-t rule-hair">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p, i) => (
              <ProjectRow key={p.id} p={p} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}

function ProjectRow({ p, index }: { p: Project; index: number }) {
  const [open, setOpen] = useState(Boolean(p.featured));
  const [hover, setHover] = useState(false);
  const panelId = `${useId()}-panel`;

  return (
    // taste-skill-ignore
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.25), ease: [0.22, 1, 0.36, 1] }}
      className={`relative border-b rule-hair ${p.featured ? "bg-paper-deep/30" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top" }}
            className="pointer-events-none absolute inset-0 bg-paper-deep/60"
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative grid w-full grid-cols-12 items-baseline gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <div className="col-span-2 text-sm text-ink-mute md:col-span-1">{p.year}</div>
        <div className="col-span-10 flex flex-wrap items-baseline gap-3 md:col-span-5">
          <motion.div
            animate={{ x: hover ? 6 : 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-2xl leading-tight md:text-3xl"
          >
            {p.name}
          </motion.div>
          {p.featured && (
            <span className="inline-flex items-center bg-ink px-2 py-0.5 text-xs font-medium text-paper rounded-xs">
              Spotlight
            </span>
          )}
        </div>

        <div className="col-span-12 -mt-2 text-sm text-ink-soft md:col-span-5 md:mt-0">
          {p.blurb}
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
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
            id={panelId}
          >
            <div className="grid grid-cols-12 gap-4 pb-8 pl-0 md:pl-[8.333%]">
              <div className="col-span-12 md:col-span-8">
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "SoftwareApplication",
                      name: p.name,
                      description: p.detail,
                      url: p.live,
                      applicationCategory: "DeveloperApplication",
                      operatingSystem: "Web",
                      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
                      author: {
                        "@type": "Person",
                        name: "Afsal Ali",
                        url: "https://www.forthe.tech",
                      },
                      datePublished: p.year,
                      keywords: p.tags.join(", "),
                    }),
                  }}
                />
                <p className="font-serif text-xl leading-relaxed text-ink-soft md:text-2xl">
                  {p.detail}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {p.live && (
                    <a
                      href={p.live}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm text-paper transition-transform hover:-translate-y-0.5"
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
                      className="inline-flex items-center gap-2 rounded-md border rule-hair bg-paper px-4 py-2 text-sm transition-colors hover:bg-paper-deep"
                    >
                      Source <Github className="h-4 w-4" />
                    </a>
                  )}
                  <Link
                    to="/works/$id"
                    params={{ id: p.id }}
                    className="inline-flex items-center gap-1.5 rounded-md border rule-hair bg-paper px-4 py-2 text-sm text-ink transition-colors hover:bg-paper-deep"
                  >
                    Deep Dive <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="col-span-12 md:col-span-4">
                <dl className="space-y-4 pt-4 text-sm md:pt-0">
                  <div>
                    <dt className="text-xs font-medium text-ink-mute">Built for</dt>
                    <dd className="mt-1 font-serif text-lg">{p.for}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-ink-mute">Year</dt>
                    <dd className="mt-1 font-serif text-lg">{p.year}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-ink-mute">Tags</dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-xs bg-paper-deep/70 px-2.5 py-1 text-xs text-ink-soft"
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
