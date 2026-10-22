import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageShell } from "../../components/site/PageShell";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The Empathy Moat: Building for Someone You Love",
  description:
    "Why building for your wife or friends beats building for anonymous metrics, and why personal friction produces software that survives.",
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
  datePublished: "2026-07-28",
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/notes/the-empathy-moat")({
  head: () => ({
    ...seo({
      title: "The Empathy Moat: No. 03 · forthe.tech",
      description:
        "Why building for your wife or friends beats building for anonymous metrics, and why personal friction produces software that survives.",
      path: "/notes/the-empathy-moat",
      image: "/og/the-empathy-moat.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: EmpathyMoatPage,
});

function EmpathyMoatPage() {
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
              No. 03 · 28 July 2026
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
              The empathy moat.
            </h1>
            <p className="mt-4 font-serif text-xl italic text-ink-mute">
              Why building for someone you love beats every product framework ever written.
            </p>
          </SectionReveal>

          <article className="mt-12 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>
              Silicon Valley loves to talk about &ldquo;target user personas.&rdquo; They invent
              synthetic characters named &ldquo;Sarah, 32, Marketing Manager&rdquo; and map her
              journey across Miro boards.
            </p>

            <p>I don&rsquo;t know Sarah. But I know my wife.</p>

            <p>
              My wife is a clinical pharmacist in Dubai. I watched her come home after gruelling
              twelve-hour hospital shifts, sit at the kitchen table, and stare into 800-page dry PDF
              question banks for her DHA licensing exams. The existing prep tools were hostile:
              clunky desktop portals that required constant Wi-Fi, loaded slowly on mobile, and
              treated pharmacology like a punishment rather than a discipline.
            </p>

            <p>
              You don&rsquo;t need customer discovery interviews when the friction is sitting across
              from you drinking cold tea.
            </p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                When you build for an anonymous metric, you stop when the metric hits a quarterly
                target. When you build for someone you care about, you don&rsquo;t stop until the
                friction is gone.
              </p>
            </div>

            <p>
              That was the genesis of{" "}
              <Link
                to="/works/$id"
                params={{ id: "provia" }}
                className="text-ink underline hover:text-ink-soft"
              >
                Provia
              </Link>
              . It wasn&rsquo;t built to flip to an acquirer or raise a seed round. It was built as
              a 45-day game with offline caching because studying happens on the metro between Deira
              and Healthcare City. It was built with genuine encouragement because studying for
              licensing exams is lonely, terrifying work.
            </p>

            <p>
              The same thing happened with{" "}
              <Link
                to="/works/$id"
                params={{ id: "pharmarab" }}
                className="text-ink underline hover:text-ink-soft"
              >
                PharmaRab
              </Link>
              . General language apps teach you how to ask where the museum is. They don&rsquo;t
              teach a retail pharmacist how to explain paediatric dosage contraindications to an
              anxious Arabic-speaking mother at the counter.
            </p>

            <p>
              The same thing happened with my physiotherapist friends. They didn&rsquo;t need
              another telehealth dashboard; they needed a way for patients to pin pain on an
              anatomical 3D body because patients freeze when asked to name cervical vertebrae. That
              became{" "}
              <Link
                to="/works/$id"
                params={{ id: "kine" }}
                className="text-ink underline hover:text-ink-soft"
              >
                kinē
              </Link>
              .
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              Software without tourists.
            </h2>

            <p>
              In an era where anyone can prompt an AI to generate a full SaaS codebase in twenty
              minutes, surface-level software has collapsed to near-zero value.
            </p>

            <p>
              The only software that endures is software rooted in deep, un-faked empathy. Tools
              built for specific human beings whose day-to-day struggle you actually understand.
            </p>

            <p>Not users. People.</p>

            <div className="mt-16 flex items-center justify-between border-t rule-hair pt-8">
              <Link
                to="/notes/the-moat-moved"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Prev: No. 02 · The moat moved</span>
              </Link>
              <Link
                to="/notes/the-15-minute-rule"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <span>Next: No. 04 · The 15-minute rule</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        </Container>
      </div>
    </PageShell>
  );
}
