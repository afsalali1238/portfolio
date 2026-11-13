import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "../layout/Container";
import { SectionReveal } from "../animations/SectionReveal";
import { getProjectById, projectCount, numberWord, type Project } from "../../data/projects";

const FEATURED_IDS = ["provia", "doomscholar", "kine"];

const featured = FEATURED_IDS.map(getProjectById).filter((p): p is Project => Boolean(p));

export function FeaturedWorks() {
  return (
    <section aria-labelledby="featured-heading" className="py-20 md:py-28" style={{ borderTop: "1px solid var(--hairline)" }}>
      <Container>
        <SectionReveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="t-label">I ── FEATURED</p>
            <h2 id="featured-heading" className="t-display-2 mt-2">Made for someone.</h2>
          </div>
          <Link
            to="/works"
            className="group inline-flex min-h-11 items-center gap-2 t-small transition-colors hover:is-lit"
          >
            All {numberWord(projectCount).toLowerCase()} builds
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </SectionReveal>

        <ul className="mt-10 space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
          {featured.map((p) => {
            const isMobile = p.media?.kind === "mobile" || p.platform === "pwa";
            return (
              <li key={p.id}>
                <Link
                  to="/works/$id"
                  params={{ id: p.id }}
                  className="card-row group"
                  style={{ padding: "16px 0", borderRadius: "0", borderTop: "none" }}
                >
                  <div className="flex flex-col gap-2">
                    {p.media && (
                      <div className="aspect-[16/10] overflow-hidden rounded-md" style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--hairline)" }}>
                        <img
                          src={p.media.poster}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="t-label" style={{ color: "var(--fg-muted)" }}>
                        Built for {p.for.toLowerCase() === "wife" ? "my wife" : p.for}
                      </p>
                      <h3 className="t-display-3 card-title">{p.name}</h3>
                      <p className="t-small" style={{ color: "var(--fg-muted)" }}>{p.blurb}</p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 t-label">
                      <span>Read case study</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Secondary CTA Button */}
        <div className="mt-14 flex flex-col items-center justify-center text-center">
          <Link
            to="/works"
            className="btn-secondary group"
          >
            <span>Explore all {numberWord(projectCount).toLowerCase()} builds</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="t-small mt-2.5" style={{ color: "var(--fg-muted)" }}>
            Explore 3D tools, clinical Arabic apps, and quiet software with open architecture notes.
          </p>
        </div>
      </Container>
    </section>
  );
}
