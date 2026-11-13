import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "../components/site/PageShell";
import { Container } from "../components/layout/Container";
import { SectionReveal } from "../components/animations/SectionReveal";
import { RefractionEngine } from "../components/refraction/RefractionEngine";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../lib/site";
import { ArticlePlatformBar, ArticleDiscussionFooter } from "../components/site/ArticleConnect";
import { getDispatchByPath, getNextAndPrevDispatches } from "../data/dispatches";

const PATH = "/thesis";
const dispatch = getDispatchByPath(PATH);
const { prev, next } = getNextAndPrevDispatches(PATH);

const MANIFESTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Refraction of Thought: A Manifesto of Light, Friction, Effort, and Becoming",
  description:
    "A foundational manifesto on light, friction, craft, and human becoming: why an idea in your head proves nothing until it collides with the dense glass of honest effort.",
  author: {
    "@type": "Person",
    name: AUTHOR,
    url: SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  datePublished: "2026-11-12",
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/thesis")({
  head: () => ({
    ...seo({
      title: "The Refraction of Thought: A Manifesto · forthe.tech",
      description:
        "A foundational manifesto on light, friction, craft, and human becoming: why an idea in your head proves nothing until it collides with the dense glass of honest effort.",
      path: PATH,
      image: "/og/home.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(MANIFESTO_SCHEMA) }],
  }),
  component: ManifestoPage,
});

export function ManifestoPage() {
  return (
    <PageShell readingProgress>
      <div className="pb-24">
        <Container className="max-w-3xl pt-14 md:pt-24">
          <SectionReveal>
            <Link
              to="/notes"
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-mute transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Notes
            </Link>

            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink-mute">
              <span>Foundation Manifesto</span>
              <span>·</span>
              <span>forthe.tech</span>
            </div>

            <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-7xl">
              The Refraction of Thought.
            </h1>

            <p className="mt-6 font-serif text-2xl italic leading-snug text-ink-soft md:text-3xl">
              Curiosity enters. Craft bends it. Reality catches the colour.
            </p>

            {/* 3-Step Journey Box Triad */}
            <div className="mt-8 grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-3">
              <div className="rounded-lg border rule-hair bg-paper p-4 transition-colors">
                <div className="text-[10px] uppercase text-ink-mute">Phase 01</div>
                <div className="mt-1 font-semibold text-ink">YOU (THE LIGHT)</div>
                <div className="mt-1 text-xs text-ink-soft">Curiosity in vacuum</div>
              </div>

              <div className="rounded-lg border rule-hair bg-paper-deep/60 p-4 transition-colors">
                <div className="text-[10px] uppercase text-accent-ink">Phase 02</div>
                <div className="mt-1 font-semibold text-ink">LIFE AS THE MEDIUM</div>
                <div className="mt-1 text-xs text-ink-soft">People · Places · Effort</div>
              </div>

              <div className="rounded-lg border rule-hair bg-paper p-4 transition-colors">
                <div className="text-[10px] uppercase text-ink-mute">Phase 03</div>
                <div className="mt-1 font-semibold text-ink">WHAT REFRACTS</div>
                <div className="mt-1 text-xs text-ink-soft">Expression · Becoming</div>
              </div>
            </div>

            {dispatch && (
              <div className="mt-6">
                <ArticlePlatformBar
                  external={dispatch.external}
                  readTime={dispatch.readTime}
                  words={dispatch.words}
                />
              </div>
            )}
          </SectionReveal>

          {/* Interactive Refraction Instrument */}
          <SectionReveal className="mt-10 md:mt-14">
            <RefractionEngine />
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-mute">
              Field note: use the density slider or drag the source line. The instrument is a
              physical companion to the argument below, not a metaphor in place of one.
            </p>
          </SectionReveal>

          {/* Core Essay Article */}
          <article className="mt-14 space-y-14 text-base leading-relaxed text-ink-soft md:text-lg">
            {/* Section I */}
            <SectionReveal className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-mute">
                I · The dark
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                Every real thing begins in the dark.
              </h2>
              <div className="space-y-3 pt-2 font-serif text-lg leading-relaxed text-ink-soft">
                <p>Every real thing begins in the dark.</p>
                <p>Just like the universe.</p>
                <p>
                  Out of nothing, a bang. It could have happened sooner. It could have happened
                  later. It happened when the right things coincided.
                </p>
                <p className="font-serif text-xl italic text-ink font-medium">
                  Nobody asked for it.
                </p>
              </div>
            </SectionReveal>

            {/* Section II */}
            <SectionReveal className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-mute">
                II · The light
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                An idea in your head costs nothing and proves nothing.
              </h2>
              <div className="space-y-3 pt-2 font-serif text-lg leading-relaxed text-ink-soft">
                <p>
                  There is a light in each of us. It arrives before it has a name. A question. An
                  itch. A what if.
                </p>
                <blockquote className="my-5 rounded-r-lg border-l-2 border-ink bg-paper-deep/50 py-3 pl-5 pr-4 font-serif text-xl italic text-ink md:text-2xl">
                  An idea in your head costs nothing and proves nothing.
                </blockquote>
                <p>Like light in empty space, it is invisible until it touches something real.</p>
                <p className="font-serif text-xl text-ink font-medium">So we shine.</p>
              </div>
            </SectionReveal>

            {/* Section III */}
            <SectionReveal className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-mute">
                III · What we meet
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                Finding the right medium is the play.
              </h2>
              <div className="space-y-4 pt-2 font-serif text-lg leading-relaxed text-ink-soft">
                <p>
                  We shine on people. On places. On problems. What comes back depends on what
                  surrounds us.
                </p>
                <ul className="space-y-3 pt-1">
                  <li className="rounded-lg border rule-hair bg-paper p-4">
                    <strong className="text-ink">Some mirror us.</strong> We arrive open and leave
                    exactly as we came.
                  </li>
                  <li className="rounded-lg border rule-hair bg-paper p-4">
                    <strong className="text-ink">Some throw us back hard.</strong> It stings, and it
                    tempts us to dim. That is the nature of the wall.
                  </li>
                  <li className="rounded-lg border rule-hair bg-paper p-4">
                    <strong className="text-ink">Some absorb us.</strong> Everything we pour in
                    disappears without a sound.
                  </li>
                  <li className="rounded-lg border rule-hair bg-paper-deep/80 p-4">
                    <strong className="text-ink">And a few refract.</strong>
                  </li>
                </ul>
                <p className="font-serif text-xl italic text-ink font-medium">
                  Finding the right medium is the play.
                </p>
              </div>
            </SectionReveal>

            {/* Section IV */}
            <SectionReveal className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-mute">
                IV · The bend
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                Slowing down is what bends it.
              </h2>
              <div className="space-y-3 pt-2 font-serif text-lg leading-relaxed text-ink-soft">
                <p>
                  Light only refracts when it enters a{" "}
                  <strong className="text-ink">denser medium</strong>.
                </p>
                <p>It slows down. Slowing down is what bends it.</p>
                <p>
                  The density is the work. The 1 AM rebuild. The fourth draft. The hours beside
                  someone else’s problem, until it becomes yours.
                </p>
              </div>
            </SectionReveal>

            {/* Section V */}
            <SectionReveal className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-mute">
                V · The colours
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                The glass didn’t add them. It revealed them.
              </h2>
              <div className="space-y-3 pt-2 font-serif text-lg leading-relaxed text-ink-soft">
                <p>
                  White light was never only white. The colours were in it all along. The glass
                  didn’t add them. It revealed them.
                </p>
                <p>People are like this.</p>
                <p>
                  At times you are nothing. Then you find the right people, the right place, and you
                  start to shine.
                </p>
                <blockquote className="my-5 rounded-r-lg border-l-2 border-accent-ink bg-paper-deep/50 py-3 pl-5 pr-4 font-serif text-xl italic text-ink md:text-2xl">
                  Sometimes we don’t need to change ourselves. We need the right medium.
                </blockquote>
                <p>
                  Don’t spend your whole life trying to fit into one that cannot bring out your
                  colours.
                </p>
              </div>
            </SectionReveal>

            {/* Section VI */}
            <SectionReveal className="space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-ink-mute">
                VI · Becoming
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                You were never meant to remain a single beam of light.
              </h2>
              <div className="space-y-4 pt-2 font-serif text-lg leading-relaxed text-ink-soft">
                <p>
                  The light that comes out is not the light that went in. It slowed. It bent. It
                  gave up the easy straight line.
                </p>
                <p>
                  This place holds what came out the other side. Tools, notes, fragments. Not
                  because anyone asked.
                </p>
                <div className="my-8 rounded-xl border rule-hair bg-paper-deep/60 p-6 text-center space-y-2">
                  <p className="font-serif text-2xl text-ink md:text-3xl leading-snug">
                    You were never meant to remain a single beam of light.
                  </p>
                  <p className="font-mono text-sm text-ink-mute">For the tech.</p>
                </div>
              </div>
            </SectionReveal>
          </article>

          {/* Discussion Footer */}
          {dispatch && (
            <div className="mt-16">
              <ArticleDiscussionFooter dispatch={dispatch} prev={prev} next={next} />
            </div>
          )}
        </Container>
      </div>
    </PageShell>
  );
}
