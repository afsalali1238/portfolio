import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "../../components/site/PageShell";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";
import {
  ArticlePlatformBar,
  RelatedBuildsSection,
  ArticleDiscussionFooter,
} from "../../components/site/ArticleConnect";
import { getDispatchByPath, getNextAndPrevDispatches } from "../../data/dispatches";

const PATH = "/notes/the-15-minute-rule";
const dispatch = getDispatchByPath(PATH)!;
const { prev, next } = getNextAndPrevDispatches(PATH);

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The 15-Minute Rule: The Case for Bounded Software",
  description:
    "Why infinite scroll loops and aggressive gamification destroy retention, and why software that respects human time survives.",
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
  datePublished: "2026-08-30",
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/notes/the-15-minute-rule")({
  head: () => ({
    ...seo({
      title: "The 15-Minute Rule: No. 04 · forthe.tech",
      description:
        "Why infinite scroll loops and aggressive gamification destroy retention, and why software that respects human time survives.",
      path: PATH,
      image: "/og/the-15-minute-rule.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: FifteenMinuteRulePage,
});

function FifteenMinuteRulePage() {
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
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
              No. 04 · 30 August 2026
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
              The 15-minute rule.
            </h1>
            <p className="mt-4 font-serif text-xl italic text-ink-mute">
              Why most habit, study, and health apps get abandoned, and the case for bounded daily
              loops.
            </p>

            <ArticlePlatformBar
              external={dispatch.external}
              readTime={dispatch.readTime}
              words={dispatch.words}
            />
          </SectionReveal>

          <article className="mt-10 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>Every product designer has been trained to optimise for time-in-app.</p>

            <p>
              More sessions. Longer sessions. Red badge notifications at 9:00 PM reminding you that
              your imaginary streak is about to reset. In consumer software, attention is treated as
              an infinite resource to be mined.
            </p>

            <p>The result is predictable: exhaustion and abandonment.</p>

            <p>
              Ask any physiotherapist how many patients complete their home exercise regimens. The
              answer is close to zero. Patients receive an intimidating sheet of twelve complex
              biomechanical routines, do them twice, feel overwhelmed, and quit entirely.
            </p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                Good software does not demand residence in your life. It arrives, solves the
                friction in fifteen minutes, and gives your day back.
              </p>
            </div>

            <p>
              When I designed the rehabilitation engine for{" "}
              <Link
                to="/works/$id"
                params={{ id: "kine" }}
                className="text-ink underline hover:text-ink-soft"
              >
                kinē
              </Link>
              , we set an uncompromising constraint: the progressive plan (Calm → Load → Capacity)
              had to be hard-capped at fifteen minutes a day. No marathon workouts. No clinical
              jargon. Just targeted, progressive loading you can execute before your morning coffee.
            </p>

            <p>
              We applied the exact same principle to licensing exam prep with{" "}
              <Link
                to="/works/$id"
                params={{ id: "provia" }}
                className="text-ink underline hover:text-ink-soft"
              >
                Provia
              </Link>
              . Pharmacists preparing for DHA and MOH examinations in Dubai work demanding retail or
              hospital shifts. They don&rsquo;t have three-hour study blocks.
            </p>

            <p>
              So Provia broke the curriculum into 15-minute high-yield sprints. Duel mode pits you
              against another pharmacist on ten rapid clinical scenarios during lunch. You get in,
              test your clinical recall, and get out.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Anti-Gamification Philosophy
            </h2>

            <p>
              The moment you introduce streaks, XP points, and virtual leaderboards, you distort the
              user&rsquo;s motivation.
            </p>

            <p>
              People stop learning clinical pharmacy or rehabilitating their patellar tendon because
              they care about the outcome; they do it to avoid breaking an arbitrary flame icon. And
              the day life interrupts and the streak breaks, they don&rsquo;t just miss one day —
              they delete the application in disgust.
            </p>

            <div className="my-8 rounded-lg bg-paper-deep/70 p-6 md:p-8">
              <p className="font-serif text-2xl text-ink">
                Software should be like a good hammer: you pick it up, drive the nail into the wall,
                and put the hammer back in the drawer. The hammer doesn&rsquo;t send you a push
                notification at midnight asking why you haven&rsquo;t hammered anything today.
              </p>
            </div>

            <p>
              Bounded software respects human cognitive sovereignty. When you design for completion
              rather than addiction, you build products that users genuinely trust and keep for
              years.
            </p>
          </article>

          <RelatedBuildsSection projectIds={dispatch.relatedWorks} />

          <ArticleDiscussionFooter dispatch={dispatch} prev={prev} next={next} />
        </Container>
      </div>
    </PageShell>
  );
}
