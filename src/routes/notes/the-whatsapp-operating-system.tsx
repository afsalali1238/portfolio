import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageShell } from "../../components/site/PageShell";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The WhatsApp Operating System: Local Trust vs Aggregator Taxes",
  description:
    "What building NxtDoorChef in Dubai taught me about community trust and why direct communication beats 30% delivery fees.",
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
  datePublished: "2026-09-24",
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/notes/the-whatsapp-operating-system")({
  head: () => ({
    ...seo({
      title: "The WhatsApp OS: No. 05 · forthe.tech",
      description:
        "What building NxtDoorChef in Dubai taught me about community trust and why direct communication beats 30% delivery fees.",
      path: "/notes/the-whatsapp-operating-system",
      image: "/og/the-whatsapp-operating-system.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: WhatsAppOSPage,
});

function WhatsAppOSPage() {
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
              No. 05 · 24 September 2026
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
              The WhatsApp operating system.
            </h1>
            <p className="mt-4 font-serif text-xl italic text-ink-mute">
              What building NxtDoorChef in Dubai taught me about local trust and platform taxes.
            </p>
          </SectionReveal>

          <article className="mt-12 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>In modern software architecture, the instinct is to build a cathedral.</p>

            <p>
              You build user authentication. You integrate Stripe. You build order tracking, push
              notifications, driver mapping, in-app chat, refund dispute consoles, and ratings
              algorithms. And to justify the cost of maintaining this cathedral, you extract a 30%
              commission from every exchange.
            </p>

            <p>Then you look at how real communities actually trade.</p>

            <p>
              In Dubai — from Karama to Al Barsha — some of the most authentic cooking in the city
              comes from home kitchens. A grandmother making regional Kerala biryani, a neighbour
              crafting Hyderabadi haleem, an Egyptian family baking fresh baladi bread.
            </p>

            <p>
              When I built{" "}
              <Link
                to="/works/$id"
                params={{ id: "nxtdoorchef" }}
                className="text-ink underline hover:text-ink-soft"
              >
                NxtDoorChef
              </Link>
              , the temptation was to build a full delivery marketplace. But when you talk to the
              cooks and the neighbours, you realise they don&rsquo;t want an aggregator standing
              between them with surge pricing and credit card processing holds.
            </p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                Across the Middle East and South Asia, WhatsApp isn&rsquo;t just a messaging app.
                WhatsApp is the commercial operating system of society.
              </p>
            </div>

            <p>
              Neighbours want to see who is cooking within walking distance, tap a button to say
              hello on WhatsApp, agree on the tiffin, and walk upstairs. The software&rsquo;s only
              job is discovery and connection — then get completely out of the way. Zero commission.
              Zero middleman fee.
            </p>

            <p>
              We applied the exact same philosophy to{" "}
              <Link
                to="/works/$id"
                params={{ id: "craftersunited" }}
                className="text-ink underline hover:text-ink-soft"
              >
                CraftersUnited
              </Link>{" "}
              for independent Indian artisans. Artisans don&rsquo;t need another marketplace that
              takes 25% of every handmade piece. They need a clean window to display their work, and
              a direct line to someone who values the craft.
            </p>

            <p>
              Sometimes the most sophisticated engineering decision you can make is deciding what{" "}
              <em>not</em> to build.
            </p>

            <div className="mt-16 flex items-center justify-between border-t rule-hair pt-8">
              <Link
                to="/notes/the-15-minute-rule"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Prev: No. 04 · The 15-minute rule</span>
              </Link>
              <Link
                to="/notes/the-reality-test"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <span>Next: No. 06 · The reality test</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        </Container>
      </div>
    </PageShell>
  );
}
