import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { getProjectById, projectCount, numberWord, type Project } from "../../data/projects";

const DAILY_USE_IDS = ["provia", "doomscholar", "jobhunter-os"];

const dailyBuilds = DAILY_USE_IDS.map(getProjectById).filter((p): p is Project => Boolean(p));

function DailyPoster({ src, isMobile }: { src: string; isMobile: boolean }) {
  const [landscape, setLandscape] = useState(false);
  const check = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth) {
      setLandscape(img.naturalWidth > img.naturalHeight);
    }
  };
  const framed = isMobile && !landscape;
  return (
    <div className="flex h-full w-full items-center justify-center p-3 bg-paper-deep">
      <img
        ref={check}
        src={src}
        alt=""
        loading="lazy"
        onLoad={(e) => check(e.currentTarget)}
        className={`block h-auto max-h-full w-auto max-w-full bg-paper transition-opacity duration-150 ${
          framed
            ? "rounded-[1.25rem] border-[4px] border-ink"
            : "rounded-md border rule-hair object-contain"
        }`}
      />
    </div>
  );
}

export function InDailyUse() {
  return (
    <section aria-labelledby="daily-heading" className="py-20 md:py-28 border-t rule-hair">
      <Container>
        <SectionReveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-medium text-ink-mute">Active routines</div>
            <h2 id="daily-heading" className="mt-2 font-serif text-4xl md:text-5xl">
              In daily use.
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              Software proven by real, repeated use — not demo prototypes.
            </p>
          </div>
          <Link
            to="/works"
            search={{ filter: "live" }}
            className="group inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-ink md:self-auto hover:text-ink-soft transition-colors"
          >
            All {numberWord(projectCount).toLowerCase()} builds
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </SectionReveal>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {dailyBuilds.map((p) => {
            const isMobile = p.media?.kind === "mobile" || p.platform === "pwa";
            return (
              <li key={p.id}>
                <div className="group flex h-full flex-col justify-between overflow-hidden rounded-lg border rule-hair bg-paper p-6 transition-colors duration-150 hover:border-ink/40 hover:bg-paper-deep/40">
                  <div>
                    {p.media && (
                      <Link
                        to="/works/$id"
                        params={{ id: p.id }}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="relative block -mx-6 -mt-6 mb-5 aspect-[16/10] overflow-hidden rounded-t-lg border-b rule-hair bg-paper-deep"
                      >
                        <DailyPoster src={p.media.poster} isMobile={isMobile} />
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1 text-xs font-medium text-paper backdrop-blur-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-paper" />
                          <span>In daily use</span>
                        </div>
                      </Link>
                    )}

                    <div className="flex items-center justify-between text-xs text-ink-mute">
                      <span>
                        Built for{" "}
                        {p.for.toLowerCase() === "wife"
                          ? "my wife"
                          : p.for.toLowerCase() === "me"
                            ? "me"
                            : p.for}
                      </span>
                      <span>{p.year}</span>
                    </div>
                    <h3 className="mt-3 font-serif text-3xl leading-none text-ink">
                      <Link
                        to="/works/$id"
                        params={{ id: p.id }}
                        className="hover:text-ink-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-sm"
                      >
                        {p.name}
                      </Link>
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                      {p.outcome ?? p.blurb}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t rule-hair pt-4 text-xs font-medium text-ink">
                    <Link
                      to="/works/$id"
                      params={{ id: p.id }}
                      className="inline-flex items-center gap-1 hover:text-ink-soft transition-colors"
                    >
                      <span>Case study</span>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-mute transition-transform group-hover:translate-x-1" />
                    </Link>
                    {p.live ? (
                      <a
                        href={p.live}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-ink-mute hover:text-ink transition-colors"
                      >
                        <span>Open app</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : p.github ? (
                      <a
                        href={p.github}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-ink-mute hover:text-ink transition-colors"
                      >
                        <span>Source ↗</span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
