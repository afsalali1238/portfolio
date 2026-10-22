import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageShell } from "../../components/site/PageShell";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The 15-Minute Rule: The Case for Bounded Software",
  description:
    "Why infinite scroll loops and aggressive gamification destroy retention, and why software that respects time survives.",
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
        "Why infinite scroll loops and aggressive gamification destroy retention, and why software that respects time survives.",
      path: "/notes/the-15-minute-rule",
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
              Why most habit, study, and health apps get abandoned, and the case for bounded loops.
            </p>
          </SectionReveal>

          <article className="mt-12 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
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
              guilt. Just enough stimulus to signal recovery, then close the tab.
            </p>

            <p>
              We applied the exact same constraint to{" "}
              <Link
                to="/works/$id"
                params={{ id: "provia" }}
                className="text-ink underline hover:text-ink-soft"
              >
                Provia
              </Link>{" "}
              for pharmacy exams and{" "}
              <Link
                to="/works/$id"
                params={{ id: "bodhi-pomodoro" }}
                className="text-ink underline hover:text-ink-soft"
              >
                Bodhi Pomodoro
              </Link>{" "}
              for desktop focus. Bounded sprints. A small ritual. Then done.
            </p>

            <p>
              When an app promises that using it won&rsquo;t consume your entire evening, you
              actually open it tomorrow.
            </p>

            <div className="mt-16 flex items-center justify-between border-t rule-hair pt-8">
              <Link
                to="/notes/the-empathy-moat"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Prev: No. 03 · The empathy moat</span>
              </Link>
              <Link
                to="/notes/the-whatsapp-operating-system"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <span>Next: No. 05 · The WhatsApp operating system</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        </Container>
      </div>
    </PageShell>
  );
}
