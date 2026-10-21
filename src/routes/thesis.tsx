import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowDown, ArrowUpRight } from "lucide-react";
import { Container } from "../components/layout/Container";
import { SectionReveal } from "../components/animations/SectionReveal";
import { LogoMark } from "../components/sections/Nav";

export const Route = createFileRoute("/thesis")({
  head: () => ({
    meta: [
      { title: "The Energy Ledger: AI Tokens as Currency · forthe.tech" },
      {
        name: "description",
        content:
          "On AI tokens as currency, the thermodynamic debt of a prompt, and the moral requirement of building with intention.",
      },
      { property: "og:title", content: "The Energy Ledger: AI Tokens as Currency · forthe.tech" },
      {
        property: "og:description",
        content:
          "A frontier model saying hello back burns the watt-hours a reading lamp uses for minutes. Firing off millions of aimless prompts while preaching ESG is pure hypocrisy.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://www.forthe.tech/thesis" },
    ],
  }),
  component: ThesisPage,
});

function ThesisPage() {
  const ARTICLE_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "The Energy Ledger: AI Tokens as Currency",
    description:
      "On AI tokens as currency, the thermodynamic debt of a prompt, and the moral requirement of building with intention.",
    author: {
      "@type": "Person",
      name: "Afsal Ali",
      url: "https://www.forthe.tech",
    },
    publisher: {
      "@type": "Organization",
      name: "forthe.tech",
      url: "https://www.forthe.tech",
    },
    datePublished: "2026-10-21",
    inLanguage: "en-US",
  };

  return (
    <div className="min-h-svh bg-paper text-ink pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }}
      />

      {/* Top back navigation */}
      <header className="sticky top-0 z-30 border-b rule-hair backdrop-blur bg-paper/80 py-4">
        <Container className="flex items-center justify-between">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to ledger</span>
          </Link>

          <Link to="/" className="flex items-center gap-2 text-sm font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-ink text-paper">
              <LogoMark className="h-3.5 w-3.5" />
            </div>
            <span className="font-serif text-lg">forthe.tech</span>
          </Link>
        </Container>
      </header>

      {/* Article Content */}
      <main>
        <Container className="max-w-3xl pt-14 md:pt-24">
          <SectionReveal>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
              Manifesto · Dispatch No. 01
            </div>

            <h1 className="mt-4 font-serif text-5xl md:text-7xl leading-[1.02] text-ink">
              The Energy Ledger.
            </h1>
            <p className="mt-6 font-serif text-2xl md:text-3xl leading-snug text-ink-soft italic">
              AI tokens are the new currency. And every token is an IOU on physical energy.
            </p>
          </SectionReveal>

          <article className="mt-12 space-y-8 text-base md:text-lg leading-relaxed text-ink-soft">
            <p>
              The wall between imagining software and making it exist just collapsed. For decades,
              the limiting bottleneck was syntax. People had clear, painful visions for things that
              ought to exist, and were stopped dead by the compiler. That barrier is gone. It feels
              miraculous, and we have the strange privilege of standing inside the shift.
            </p>

            <p>It also arrives with an unspoken debt.</p>

            <div className="border-l-2 border-ink pl-6 py-2 my-8">
              <p className="font-serif text-2xl italic text-ink leading-snug">
                We speak about artificial intelligence as though it floats weightlessly in the
                ether. It does not. Silicon runs on substations, cooling towers, and diverted river
                water. We are transacting directly in joules.
              </p>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-ink pt-6">
              The Physics of a Prompt
            </h2>

            <p>
              A frontier model returning a breezy{" "}
              <strong className="text-ink font-medium">&ldquo;hello&rdquo;</strong> consumes the
              watt-hours that could have kept an LED reading lamp burning in your room for minutes.*
              Silicon compute is physical work. Soon, people will transact directly in tokens:
              compute will be the reserve currency of the intelligent economy, and energy will be
              the underlying peg.
            </p>

            <p className="text-xs italic text-ink-mute border-l-2 border-ink-mute/30 pl-3 py-1 mt-2">
              *Google published 0.24 Wh as the median Gemini text prompt (Aug 2025) — roughly three minutes of a standard 5 W LED reading lamp.
            </p>

            <p>
              Which exposes an uncomfortable truth:{" "}
              <strong className="text-ink font-medium">
                people who lecture about ESG, sustainability targets, and energy conservation while
                aimlessly burning AI tokens are being hypocrites.
              </strong>{" "}
              Firing off millions of automated inference cycles to produce corporate sludge, bloated
              slide decks, and speculative noise is not innovation; it is digital pollution.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-ink pt-6">
              The Antidote: Absolute Intention
            </h2>

            <p>
              If every prompt incurs a thermodynamic withdrawal from the electrical grid, the only
              moral defense for using this much power is{" "}
              <strong className="text-ink font-medium">intention</strong>: building software that
              genuinely lightens the friction of someone’s real, physical day.
            </p>

            <div className="rounded-lg bg-paper-deep/60 p-6 md:p-8 space-y-4 my-8">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-mute">
                Intention over novelty in practice
              </div>
              <ul className="space-y-3 text-base text-ink">
                <li>
                  <strong>My wife is a pharmacist:</strong> so I spent energy building{" "}
                  <Link
                    to="/works/$id"
                    params={{ id: "pharmarab" }}
                    className="underline underline-offset-4 font-serif italic text-lg"
                  >
                    PharmaRab
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/works/$id"
                    params={{ id: "provia" }}
                    className="underline underline-offset-4 font-serif italic text-lg"
                  >
                    Provia
                  </Link>{" "}
                  to help her and her colleagues conquer grueling licensing exams.
                </li>
                <li>
                  <strong>My friends are physiotherapists:</strong> so I spent energy building{" "}
                  <Link
                    to="/works/$id"
                    params={{ id: "physioarab" }}
                    className="underline underline-offset-4 font-serif italic text-lg"
                  >
                    PhysioArab
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/works/$id"
                    params={{ id: "kine" }}
                    className="underline underline-offset-4 font-serif italic text-lg"
                  >
                    kinē
                  </Link>{" "}
                  to build clinical rehabilitation tools that therapists needed.
                </li>
                <li>
                  <strong>Dubai’s finest cooking was hidden next door:</strong> so I built{" "}
                  <Link
                    to="/works/$id"
                    params={{ id: "nxtdoorchef" }}
                    className="underline underline-offset-4 font-serif italic text-lg"
                  >
                    NxtDoorChef
                  </Link>{" "}
                  to connect neighbors directly to authentic home kitchens.
                </li>
                <li>
                  <strong>I collect mental models:</strong> so I built{" "}
                  <Link
                    to="/works/$id"
                    params={{ id: "doomscholar" }}
                    className="underline underline-offset-4 font-serif italic text-lg"
                  >
                    Doomscholar
                  </Link>{" "}
                  to map frameworks that survive the hype cycles.
                </li>
              </ul>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-ink pt-6">The True Moat</h2>

            <p>
              Tech is never the moat. What it alters in someone’s real, physical day is. Nobody
              values how convoluted your build pipeline was. They only value whether it helped.
            </p>

            <p>
              Around a full-time job and family in Dubai, I don’t just read release notes. I test
              new tools by building tools that work. This domain is where they live: an open ledger
              of software built in public.
            </p>

            <div className="pt-8 border-t rule-hair mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper"
              >
                <ArrowLeft className="h-4 w-4" /> Return to Ledger
              </Link>

              <span className="text-xs text-ink-mute">
                Published to pixels · Dubai, UAE · forthe.tech
              </span>
            </div>
          </article>
        </Container>
      </main>
    </div>
  );
}
