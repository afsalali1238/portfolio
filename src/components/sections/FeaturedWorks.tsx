import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { getProjectById, projectCount, numberWord, type Project } from "../../data/projects";

/**
 * Minimal featured showcase on the homepage (3 flagship pieces).
 * Governed strictly by the brand guidelines: 8 px corners, 1 px rule, 24 px padding, no shadow.
 */
const FEATURED_IDS = ["provia", "doomscholar", "kine"];

const featured = FEATURED_IDS.map(getProjectById).filter((p): p is Project => Boolean(p));

function FeaturedPoster({ src, isMobile }: { src: string; isMobile: boolean }) {
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

export function FeaturedWorks() {
  return (
    <section aria-labelledby="featured-heading" className="py-20 md:py-28 border-t rule-hair">
      <Container>
        <SectionReveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-medium text-ink-mute">Selected builds</div>
            <h2 id="featured-heading" className="mt-2 font-serif text-4xl md:text-5xl">
              Made for someone.
            </h2>
          </div>
          <Link
            to="/works"
            className="group inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-ink md:self-auto hover:text-ink-soft transition-colors"
          >
            All {numberWord(projectCount).toLowerCase()} builds
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </SectionReveal>

        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {featured.map((p) => {
            const isMobile = p.media?.kind === "mobile" || p.platform === "pwa";
            return (
              <li key={p.id}>
                <Link
                  to="/works/$id"
                  params={{ id: p.id }}
                  className="group flex h-full flex-col justify-between overflow-hidden rounded-lg border rule-hair bg-paper p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-ink/60 hover:bg-paper-deep/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                >
                  <div>
                    {p.media && (
                      <div className="relative -mx-6 -mt-6 mb-5 aspect-[16/10] overflow-hidden rounded-t-lg border-b rule-hair bg-paper-deep transition-transform duration-200 group-hover:scale-[1.03]">
                        <FeaturedPoster src={p.media.poster} isMobile={isMobile} />
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/90 px-3 py-1 text-xs font-medium text-paper backdrop-blur-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-paper" />
                          <span className="capitalize">
                            {isMobile ? "Phone build" : "Web build"}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-ink-mute">
                      <span>Built for {p.for.toLowerCase() === "wife" ? "my wife" : p.for}</span>
                    </div>
                    <h3 className="mt-3 font-serif text-3xl leading-none text-ink">{p.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft line-clamp-3">
                      {p.blurb}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t rule-hair pt-3 text-xs font-medium text-ink">
                    <span>Read case study</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-mute transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Primary CTA Button: 44 px tall, 6 px corners, primary ink, no shadow */}
        <div className="mt-14 flex flex-col items-center justify-center text-center">
          <Link
            to="/works"
            className="group inline-flex min-h-11 items-center gap-2.5 rounded-md bg-ink px-6 text-sm font-medium text-paper transition-colors hover:bg-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <span>Explore all {numberWord(projectCount).toLowerCase()} builds</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-2.5 text-xs text-ink-mute">
            Explore 3D tools, clinical Arabic apps, and quiet software with open architecture notes.
          </p>
        </div>
      </Container>
    </section>
  );
}
