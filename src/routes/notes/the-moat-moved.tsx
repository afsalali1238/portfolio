import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageShell } from "../../components/site/PageShell";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The Moat Moved",
  description: "Ideas were cheap. Then building was. Now even being first is.",
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
  datePublished: "2026-06-20",
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/notes/the-moat-moved")({
  head: () => ({
    ...seo({
      title: "The Moat Moved: No. 02 · forthe.tech",
      description: "Ideas were cheap. Then building was. Now even being first is.",
      path: "/notes/the-moat-moved",
      image: "/og/the-moat-moved.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: TheMoatMovedPage,
});

function TheMoatMovedPage() {
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
              No. 02 · 20 June 2026
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
              The moat moved.
            </h1>
            <p className="mt-4 font-serif text-xl italic text-ink-mute">
              Ideas were cheap. Then building was. Now even being first is.
            </p>
          </SectionReveal>

          <article className="mt-12 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>
              Everyone has a friend who says it. <em>&ldquo;I had that idea. Years ago.&rdquo;</em>{" "}
              They didn&rsquo;t build it. Someone else did. Now it&rsquo;s a billion-dollar company.
            </p>

            <p>
              For a long time that was fair. Ideas were cheap. Execution was hard. Building was the
              moat.
            </p>

            <p>
              Then the wall came down. AI made building cheap, and for a moment the moat moved one
              step: to whoever got there first. An operator with AI is like a chimpanzee with an
              AK-47: terrifying firepower, zero doctrine, spraying in every direction while everyone
              else runs for cover. Being first took effort, and for a season, effort was the moat.
            </p>

            <figure className="my-8 overflow-hidden rounded-md border rule-hair bg-paper-deep/30 p-2 md:p-3">
              <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/GhxqIITtTtU?start=12&rel=0"
                  title="Operator with AI: Chimpanzee with an AK-47 meme"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-2 text-center text-xs text-ink-mute">
                The operator with AI: terrifying firepower, zero doctrine.
              </figcaption>
            </figure>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic text-ink">That moment is over.</p>
            </div>

            <p>
              Now you can be first and it barely matters. Your big idea is someone else&rsquo;s
              weekend. Anybody can copy it. What&rsquo;s hard isn&rsquo;t the build any more.
              It&rsquo;s surviving the burn long enough for people to show up.
            </p>

            <p>
              And they don&rsquo;t stay. When there are a hundred apps for the same thing, nobody is
              loyal. Anyone could build their own. What holds is what always held, underneath the
              noise: network effects. Profit.
            </p>

            <p>
              So stop marrying the idea. The product isn&rsquo;t your baby. Another feature
              isn&rsquo;t another customer.
            </p>

            <p>
              And not every customer counts. Not the tourists. Not the ones who came for the
              discount. The ones who pay full price, and keep paying. The ones who bring revenue,
              and profit.
            </p>

            <p>
              To keep them, you have to solve a real problem better than anyone else in the market,
              in a way nobody can copy.
            </p>

            <p className="italic text-ink">And even then.</p>

            <p>
              The day you start making real money, the big pockets notice. A kid with an investor
              for a father. A founder fresh off a billion-dollar exit. They build it bigger, ship it
              louder, and get all the press.
            </p>

            <p className="pt-4 font-serif text-2xl italic text-ink">Yours is just a copy.</p>

            <div className="mt-16 flex items-center justify-between border-t rule-hair pt-8">
              <Link
                to="/notes/the-energy-ledger"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Prev: No. 01 · The Energy Ledger</span>
              </Link>
              <Link
                to="/notes/the-empathy-moat"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <span>Next: No. 03 · The empathy moat</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        </Container>
      </div>
    </PageShell>
  );
}
