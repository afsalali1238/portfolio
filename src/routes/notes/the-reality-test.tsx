import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageShell } from "../../components/site/PageShell";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The Reality Test: Building vs. Finding Someone Who Cares",
  description:
    "Building is safe because it only involves you. Finding customers is brutal because they have zero bias toward your baby.",
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
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/notes/the-reality-test")({
  head: () => ({
    ...seo({
      title: "The Reality Test: No. 06 · forthe.tech",
      description:
        "Building is safe because it only involves you. Finding customers is brutal because they have zero bias toward your baby.",
      path: "/notes/the-reality-test",
      image: "/og/the-reality-test.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: RealityTestPage,
});

function RealityTestPage() {
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
              No. 06 · 21 October 2026
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
              The reality test.
            </h1>
            <p className="mt-4 font-serif text-xl italic text-ink-mute">
              Building is easy because it only involves you. Finding customers is brutal because
              strangers have zero bias toward your baby.
            </p>
          </SectionReveal>

          <article className="mt-12 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>
              Building a new product or a slick new feature is addictive. It feels like playing god.
              At 2:00 AM, inside your dark room with your editor glowing, you have total control.
              You tweak the padding, tune the animations to sixty frames per second, write clean
              schemas, and watch your ideas materialise from nothing.
            </p>

            <p>
              In that private sanctuary, you fall deeply in love with what you are making. You
              conceive it, deliver it, and nurture it like a newborn baby. You polish every single
              corner. In your mind, this product is at the top of the mountain. It feels important.
              It feels inevitable.
            </p>

            <p>
              And even more seductive than the code itself is what it does to your psychology:{" "}
              <em>it gives you identity</em>. Being a &ldquo;founder&rdquo; or working on a startup
              gives you immediate purpose and self-worth. You have a project to talk about. You have
              a mission. It shields you from the void because as long as you are shipping features,
              you feel like you matter.
            </p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                Building was never the hard part. Finding someone who gives a damn is the hardest
                part of technology, because building only involves you. Customers involve someone
                else.
              </p>
            </div>

            <p>
              You cannot compile another human being&rsquo;s attention. You cannot{" "}
              <code className="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-sm">
                git commit
              </code>{" "}
              their willingness to open their wallet. You cannot prompt an AI agent to manufacture
              genuine human trust.
            </p>

            <p>
              And then comes the day you finally push it public. You tweet the link. You post it on
              forums. You show it to the world.
            </p>

            <p>
              And you step directly into the coldest room on earth: the room of people who have
              absolutely <strong>zero bias</strong> toward you or your dream.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">The unbiased room.</h2>

            <p>
              Strangers do not know that you skipped sleep for three weeks. They do not care that
              you wrestled with database migrations until your eyes burned. They do not care how
              architecturally pure your codebase is or how clever your copy sounds.
            </p>

            <p>
              They are on the metro, or standing in line for coffee, or stressed about their own
              mortgage, their own children, their own exhaustion. They glance at your landing page
              for 1.8 seconds with one thumb and keep scrolling.
            </p>

            <p>
              And in that split second, the illusion collapses: the product you conceived and
              pampered like your own child is, to the outside world, just another useless link.
            </p>

            <p>
              That realisation hits like a physical blow. You suddenly see that the product gave{" "}
              <em>you</em> purpose, but it solves nothing for <em>them</em>. It fed your ego and
              inflated your self-worth, but in the harsh light of reality, it was just a monument to
              your own vanity.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">From ego to relief.</h2>

            <p>
              This is where most founders quit. They don&rsquo;t quit because their code broke; they
              quit because their pride couldn&rsquo;t survive the embarrassment of being ignored.
              They blame the algorithm, the marketing channels, or &ldquo;users who don&rsquo;t
              understand the vision.&rdquo;
            </p>

            <p>But if you survive that sting, something quietly liberating happens:</p>

            <ul className="list-disc space-y-3 pl-6">
              <li>
                <strong>You stop falling in love with your own artifacts.</strong> Software is not a
                baby to be worshipped; it is a wrench. If it doesn&rsquo;t turn the bolt, nobody
                cares what colour you painted the handle.
              </li>
              <li>
                <strong>You strip away founder vanity.</strong> Self-worth can no longer come from a
                title or an unlaunched dream. It comes from whether someone in the real world took a
                breath of relief because your software removed their friction.
              </li>
              <li>
                <strong>You start with their pain, not your itch.</strong> You stop asking
                &ldquo;What cool thing can I build today?&rdquo; and start asking &ldquo;Who around
                me is struggling with something tedious, and can I take that burden off their
                plate?&rdquo;
              </li>
            </ul>

            <p>
              The reality test is painful. But it is the only test that matters. It strips away the
              theatre of being a creator and leaves you with the only question worth answering:
            </p>

            <p className="font-serif text-xl italic text-ink">
              Did you build this for yourself, or did you build it for them?
            </p>

            <div className="mt-16 flex items-center justify-between border-t rule-hair pt-8">
              <Link
                to="/notes/the-whatsapp-operating-system"
                className="group inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                <span>Prev: No. 05 · The WhatsApp operating system</span>
              </Link>
            </div>
          </article>
        </Container>
      </div>
    </PageShell>
  );
}
