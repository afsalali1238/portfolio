import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { PageShell } from "../../components/site/PageShell";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The Energy Ledger: AI Tokens as Currency",
  description:
    "On AI tokens as currency, the thermodynamic debt of a prompt, and the moral requirement of building with intention.",
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
  datePublished: "2026-10-21",
  inLanguage: "en-US",
};

export const Route = createFileRoute("/notes/the-energy-ledger")({
  head: () => ({
    ...seo({
      title: "The Energy Ledger: AI tokens as currency · forthe.tech",
      description:
        "On AI tokens as currency, the thermodynamic debt of a prompt, and the moral requirement of building with intention.",
      path: "/notes/the-energy-ledger",
      image: "/og/thesis.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: EnergyLedgerPage,
});

function EnergyLedgerPage() {
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
              Manifesto · Dispatch No. 01
            </div>

            <h1 className="mt-4 font-serif text-5xl leading-[1.02] text-ink md:text-7xl">
              The Energy Ledger.
            </h1>
            <p className="mt-6 font-serif text-2xl italic leading-snug text-ink-soft md:text-3xl">
              AI tokens are the new currency. And every token is an IOU on physical energy.
            </p>
          </SectionReveal>

          <article className="mt-12 space-y-8 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>
              The wall between imagining software and making it exist just collapsed. For decades,
              the limiting bottleneck was syntax. People had clear, painful visions for things that
              ought to exist, and were stopped dead by the compiler. That barrier is gone. It feels
              miraculous, and we have the strange privilege of standing inside the shift.
            </p>

            <p>It also arrives with an unspoken debt.</p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                We speak about artificial intelligence as though it floats weightlessly in the
                ether. It does not. Silicon runs on substations, cooling towers, and diverted river
                water. We are transacting directly in joules.
              </p>
            </div>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Physics of a Prompt
            </h2>

            <p>
              A frontier model returning a breezy{" "}
              <strong className="font-medium text-ink">&ldquo;hello&rdquo;</strong> consumes the
              watt-hours that could have kept an LED reading lamp burning in your room for minutes.*
              Silicon compute is physical work. Soon, people will transact directly in tokens:
              compute will be the reserve currency of the intelligent economy, and energy will be
              the underlying peg.
            </p>

            <p className="mt-2 border-l-2 border-ink-mute/30 py-1 pl-3 text-xs italic text-ink-mute">
              *Google published 0.24 Wh as the median Gemini text prompt (Aug 2025) — roughly three
              minutes of a standard 5 W LED reading lamp.
            </p>

            <p>
              Which exposes an uncomfortable truth:{" "}
              <strong className="font-medium text-ink">
                people who lecture about ESG, sustainability targets, and energy conservation while
                aimlessly burning AI tokens are being hypocrites.
              </strong>{" "}
              Firing off millions of automated inference cycles to produce corporate sludge, bloated
              slide decks, and speculative noise is not innovation; it is digital pollution.
            </p>

            <p>
              If every prompt incurs a thermodynamic debt, the only moral justification for using
              this much power is{" "}
              <strong className="font-medium text-ink">absolute intention</strong>: building
              software that solves genuine, tangible human friction.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              Intention Over Novelty
            </h2>

            <p>
              When compute is energy and energy is finite, building another disposable clone is
              vandalism. The only honest work is solving friction for real people you can name:
            </p>

            <ul className="space-y-4 border-l rule-hair pl-6 text-base">
              <li>
                <strong className="text-ink">My wife is a pharmacist.</strong> So I spent energy
                building{" "}
                <Link
                  to="/works/$id"
                  params={{ id: "pharmarab" }}
                  className="text-ink underline hover:text-ink-soft"
                >
                  PharmaRab
                </Link>{" "}
                and{" "}
                <Link
                  to="/works/$id"
                  params={{ id: "provia" }}
                  className="text-ink underline hover:text-ink-soft"
                >
                  Provia
                </Link>{" "}
                to help her and her peers pass grueling DHA licensing exams and speak clinical
                Arabic at the counter.
              </li>
              <li>
                <strong className="text-ink">My friends are physiotherapists.</strong> So I spent
                energy building{" "}
                <Link
                  to="/works/$id"
                  params={{ id: "physioarab" }}
                  className="text-ink underline hover:text-ink-soft"
                >
                  PhysioArab
                </Link>{" "}
                and{" "}
                <Link
                  to="/works/$id"
                  params={{ id: "kine" }}
                  className="text-ink underline hover:text-ink-soft"
                >
                  kinē
                </Link>{" "}
                to give therapists clinical tools their patients actually use.
              </li>
              <li>
                <strong className="text-ink">Dubai&rsquo;s home cooking was invisible.</strong> So I
                built{" "}
                <Link
                  to="/works/$id"
                  params={{ id: "nxtdoorchef" }}
                  className="text-ink underline hover:text-ink-soft"
                >
                  NxtDoorChef
                </Link>{" "}
                to connect neighbors directly to authentic home kitchens with zero platform tax.
              </li>
            </ul>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                Tech isn&rsquo;t the moat. What it changes in someone&rsquo;s daily life is.
              </p>
            </div>

            <p>
              Nobody values how complex your build pipeline was. They only value whether it helped.
            </p>

            <div className="mt-16 flex items-center justify-between border-t rule-hair pt-8">
              <Link
                to="/notes/the-moat-moved"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <span>Next: Dispatch No. 02 · The moat moved</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        </Container>
      </div>
    </PageShell>
  );
}
