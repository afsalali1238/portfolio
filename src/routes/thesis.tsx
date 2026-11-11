import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Compass, Shield, Feather, Layers } from "lucide-react";
import { PageShell } from "../components/site/PageShell";
import { Container } from "../components/layout/Container";
import { SectionReveal } from "../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../lib/site";
import {
  ArticlePlatformBar,
  RelatedBuildsSection,
  ArticleDiscussionFooter,
} from "../components/site/ArticleConnect";
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

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
              <span>Foundation Manifesto</span>
              <span>·</span>
              <span>forthe.tech</span>
            </div>

            <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-tight text-ink md:text-7xl">
              The Refraction of Thought.
            </h1>

            <p className="mt-6 font-serif text-2xl italic leading-snug text-ink-soft md:text-3xl">
              A manifesto of light, friction, effort, and becoming.
            </p>

            {dispatch && (
              <ArticlePlatformBar
                external={dispatch.external}
                readTime={dispatch.readTime}
                words={dispatch.words}
              />
            )}
          </SectionReveal>

          {/* Core Essay Article */}
          <article className="mt-12 space-y-12 text-base leading-relaxed text-ink-soft md:text-lg">
            {/* Section I */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                I. The Incident Beam: Curiosity in the Dark
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                Every real thing begins in the dark.
              </h2>
              <p>
                Every real thing begins in the dark, before there is an audience, a client invoice, a
                formal brief, or a roadmap.
              </p>
              <p>
                It begins as a solitary line of light entering from outside the frame: a quiet
                intuition, an unbidden question, an itch that refuses to go away.{" "}
                <em className="text-ink">
                  Why does this process feel so broken? What happens if I connect these two distant
                  ideas? What if this existed?
                </em>
              </p>
              <p>
                In a vacuum, that light travels unchecked and unrevealed. When an idea lives only
                inside your head, it is weightless, frictionless, and safe. You can imagine a
                flawless tool, a profound essay, or an elegant life, and because it hasn&rsquo;t touched
                the world, it has never failed.
              </p>
              <blockquote className="my-6 rounded-r-lg border-l-2 border-ink bg-paper-deep/50 py-3 pl-5 pr-4 font-serif text-xl italic text-ink md:text-2xl">
                An idea in your head costs nothing and proves nothing. Like light in empty space, it
                is invisible until it collides with something real.
              </blockquote>
            </SectionReveal>

            {/* Section II */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                II. The Landscape of Mediums
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                Reflect, absorb, and the violent kickback.
              </h2>
              <p>
                You don&rsquo;t get to choose a world of clean, cooperative glass. When you step out of
                your head with your curiosity, you encounter a world made of vastly different
                mediums. Every person, problem, organization, and situation reacts to your light
                according to its own nature:
              </p>
              <ul className="space-y-4 pt-2">
                <li className="rounded-lg border rule-hair bg-paper p-5">
                  <div className="font-serif text-lg font-medium text-ink">
                    Some mediums simply reflect you.
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    They are cold mirrors. When you arrive with your sincerity and questions, they
                    don&rsquo;t let you enter. A rigid corporate culture, an indifferent bureaucracy,
                    or a person wrapped entirely in their own reflection bounces you right back to
                    where you started. You leave with nothing gained and nothing learned.
                  </p>
                </li>
                <li className="rounded-lg border rule-hair bg-paper p-5">
                  <div className="font-serif text-lg font-medium text-ink">
                    Some mediums reflect violently.
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    You pour your honest energy into a room, an idea, or a person, and the collision
                    kicks back like glass hitting concrete. Harsh criticism, territorial pushback,
                    cynical dismissal, or sudden failure. It stings. It tempts you to withdraw, to dim
                    your beam, to stop showing up. But violent reflection is simply a physical fact:
                    some surfaces cannot bear your frequency. It is not an indictment of your light;
                    it is the nature of the wall.
                  </p>
                </li>
                <li className="rounded-lg border rule-hair bg-paper p-5">
                  <div className="font-serif text-lg font-medium text-ink">
                    Some mediums absorb you.
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    These are the black holes of life. You pour in weeks of sleepless effort,
                    emotional energy, and deep care, and the medium simply swallows it without a
                    sound. No reflection, no bending into colour—just exhaustion and burnout.
                  </p>
                </li>
                <li className="rounded-lg border rule-hair bg-paper-deep/60 p-5">
                  <div className="font-serif text-lg font-medium text-ink">
                    And then, you find the rare medium that refracts.
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    A medium that is dense, demanding, and honest. It does not repel you, and it does
                    not swallow you. It forces you to slow down, offers deep resistance, and lets you
                    pass through.
                  </p>
                </li>
              </ul>
            </SectionReveal>

            {/* Section III */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                III. The Crucible: Putting in the Effort
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                The price of admission is density.
              </h2>
              <p>
                Light only refracts when it enters a <strong className="text-ink">denser medium</strong>.
                In optics, the beam slows down the moment it touches glass. That sudden deceleration
                bends its path.
              </p>
              <p>
                In life, that dense medium is <strong className="text-ink">the raw effort of craft</strong>:
              </p>
              <ul className="space-y-2 border-l-2 border-ink-mute/30 pl-4 text-base italic text-ink-soft">
                <li>
                  • It is the unglamorous grit of sitting in a chair at 1:00 AM, tearing apart code that
                  broke, and rebuilding it from scratch.
                </li>
                <li>
                  • It is rewriting an essay four times because the words sound clever but don&rsquo;t
                  ring true.
                </li>
                <li>
                  • It is standing beside a pharmacist, a driver, or a cook during the worst hours of a
                  chaotic Tuesday, listening until their daily misery becomes your design constraint.
                </li>
                <li>
                  • It is dismantling your own pet assumptions the second the medium proves them wrong.
                </li>
              </ul>
              <p>
                Getting a real result is never an accident of effortless genius. It is a wrestling match
                with materials, syntax, human habits, and hard reality. You enter the glass with a raw,
                unverified thought. You only get to pull the spectrum out on the other side if you are
                willing to pay the price of admission:{" "}
                <strong className="text-ink">patience, sweat, and genuine labour.</strong>
              </p>
            </SectionReveal>

            {/* Section IV */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                IV. The Magic of Resonance
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                The right light and the right prism.
              </h2>
              <p>
                Look closely at the prism. It sits in silence.
              </p>
              <p>
                Every day, hundreds of stray lights cross its surface—distracted beams, hurried beams,
                cynical beams looking for a shortcut. Most glance off or produce only dull, muddy
                shadows.
              </p>
              <blockquote className="my-4 rounded-r-lg border-l-2 border-ink bg-paper-deep/50 py-3 pl-5 pr-4 font-serif text-xl italic text-ink md:text-2xl">
                Magic only happens when the right light enters the right medium.
              </blockquote>
              <p>
                When your specific, lived frequency—your strange curiosities, your scars, the books you
                digested, the specific problems that genuinely bother you—collides with a problem or a
                person tuned to receive it, the reaction is instantaneous.
              </p>
              <p>
                The resistance stops feeling like punishment; it turns into harmony. You find a problem
                that others dismissed as tedious, but to you, it feels like an obsession. You meet someone
                who felt unseen, and suddenly you speak the same dialect. The friction of the work stops
                draining you—it electrifies you.
              </p>
            </SectionReveal>

            {/* Section V */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                V. Technology in Its Proper Place
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                The wall has fallen.
              </h2>
              <p>Where does tech fit into this philosophy?</p>
              <p>
                For decades, an invisible wall separated thinkers from makers. If you had an
                intuition for a tool or an experience, you had to ask permission from engineers, raise
                capital, or spend years mastering arcane syntax just to see if your thought had legs.
              </p>
              <div className="my-6 rounded-lg border rule-hair bg-paper-deep/50 p-6 text-center">
                <p className="font-serif text-2xl text-ink md:text-3xl">
                  &ldquo;Today, the wall between having an idea and making it real is gone.&rdquo;
                </p>
              </div>
              <p>
                That is the gift of modern technology. The barrier has collapsed. A single operator
                with taste and clear thinking can now ship in a weekend what used to require an entire
                department.
              </p>
              <p>
                Yet technology is not an idol. We do not worship the silicon, the model weights, or the
                hype cycle. Tech is merely <strong className="text-ink">a modern piece of glass</strong>—a
                rapid, malleable medium through which we test our thoughts and build things that take
                friction away from living human beings.
              </p>
            </SectionReveal>

            {/* Section VI */}
            <SectionReveal className="space-y-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                VI. The Real Moats: Empathy, Taste, and Systems
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                What cannot be automated or faked.
              </h2>
              <p>
                In a world where anyone can prompt an AI model and generate ten thousand lines of code or
                filler prose in five seconds,{" "}
                <strong className="text-ink">syntax is no longer a moat. Code is cheap. Ideas are cheap.</strong>
              </p>
              <p>What actually matters now? What cannot be automated or faked?</p>

              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                <div className="rounded-lg border rule-hair bg-paper p-5 space-y-2">
                  <div className="flex items-center gap-2 text-ink">
                    <Feather className="h-4 w-4" />
                    <span className="font-serif text-lg font-medium">1. Radical Empathy</span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    The greatest moat in this era is radical empathy. Stepping completely out of your own
                    ego to stand in another person&rsquo;s shoes until you feel where the shoe pinches. You
                    don&rsquo;t build software to show off your cleverness; you build it to heal a
                    specific human friction.
                  </p>
                </div>

                <div className="rounded-lg border rule-hair bg-paper p-5 space-y-2">
                  <div className="flex items-center gap-2 text-ink">
                    <Shield className="h-4 w-4" />
                    <span className="font-serif text-lg font-medium">2. Taste (Subtraction)</span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    When building is cheap, the world fills with bloat. Taste is the quiet courage to say
                    no. It is knowing what to remove, what to leave unsaid, and how to preserve clarity in
                    an age of deafening noise.
                  </p>
                </div>

                <div className="rounded-lg border rule-hair bg-paper p-5 space-y-2">
                  <div className="flex items-center gap-2 text-ink">
                    <Compass className="h-4 w-4" />
                    <span className="font-serif text-lg font-medium">3. First Principles</span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Refusing to copy the recipes of the crowd. Breaking every problem down to its essential
                    physics, its raw human constraints, and building upward from bedrock truth.
                  </p>
                </div>

                <div className="rounded-lg border rule-hair bg-paper p-5 space-y-2">
                  <div className="flex items-center gap-2 text-ink">
                    <Layers className="h-4 w-4" />
                    <span className="font-serif text-lg font-medium">4. Systems Thinking</span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Understanding that no idea lives in isolation. Understanding how feedback loops, human
                    emotions, energy costs, and physical realities compound together over time.
                  </p>
                </div>
              </div>
            </SectionReveal>

            {/* Section VII */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                VII. The Living Gallery
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                The joy of doing it &ldquo;for the tech&rdquo;.
              </h2>
              <p>
                When the light makes it through the glass, it does not produce one single, narrow output.
                It refracts into an entire spectrum.
              </p>
              <p>
                That is why <strong className="text-ink">forthe.tech</strong> is not a sterile corporate
                portfolio. It is an open gallery, a living workshop, and a public notebook. It holds
                whatever form the curiosity demanded:
              </p>
              <ul className="space-y-2 border-l-2 border-ink-mute/30 pl-4 text-base text-ink-soft">
                <li>
                  <strong className="text-ink">The Tools and Operational Engines:</strong> Practical
                  software that solves ugly, real-world friction for people with names and phone numbers.
                </li>
                <li>
                  <strong className="text-ink">The Essays:</strong> Deep explorations into
                  thermodynamics, human attention, and the craft of making.
                </li>
                <li>
                  <strong className="text-ink">The Poems and Fragments:</strong> Quiet verses written
                  when an emotion was too complex for prose.
                </li>
                <li>
                  <strong className="text-ink">The Philosophical Explorations:</strong> Thoughts on why
                  we create and what is worth keeping.
                </li>
              </ul>
              <p>
                &ldquo;For the tech&rdquo; is a quiet, personal parable. It sounds like someone building
                tech for tech&rsquo;s sake. The truth is the opposite:{" "}
                <strong className="text-ink">
                  it means doing it for the pure, unasked-for joy of doing it.
                </strong>
              </p>
              <p>
                No client ordered it. No boss assigned the ticket. You did it because you loved the
                problem, you loved the people, and you wanted to bring something honest into the world.
              </p>
            </SectionReveal>

            {/* Section VIII */}
            <SectionReveal className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-mute">
                VIII. What You Become: Passing the Light On
              </div>
              <h2 className="font-serif text-3xl text-ink md:text-4xl">
                You are the one who is refracted.
              </h2>
              <p>
                The final and most vital truth is what happens to the person doing the work.
              </p>
              <p>
                We often gaze at the spectrum shooting out of the prism and praise the finished
                artifact—the app that launched, the published book, the visual work.
              </p>
              <p>
                <strong className="text-ink">
                  But the light that passed through the glass was permanently transformed.
                </strong>
              </p>
              <p>
                To bend into colour, the beam had to slow down. It had to endure the density. It had to
                surrender its easy, weightless straight line.
              </p>
              <p>
                When you refuse to skim through life; when you let hard problems break your shallow
                certainties; when you put in the daily effort and take the violent reflections on the chin
                without turning bitter—<strong className="text-ink">you are the one who is refracted.</strong>
              </p>
              <p className="font-serif text-xl italic text-ink md:text-2xl">
                You started as a single, narrow beam of untested thought.
                <br />
                You emerge from the work widened, humbled, patient, and full of depth.
              </p>
              <div className="mt-8 rounded-lg border rule-hair bg-paper-deep/60 p-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-ink-mute">
                  The Mandate
                </p>
                <p className="mt-2 font-serif text-2xl leading-snug text-ink md:text-3xl">
                  To keep shining, to seek out the honest glass, and to pass the light on to someone else.
                </p>
              </div>
            </SectionReveal>
          </article>

          {/* Related Builds */}
          {dispatch?.relatedWorks && (
            <RelatedBuildsSection projectIds={dispatch.relatedWorks} />
          )}

          {/* Discussion Footer */}
          {dispatch && (
            <ArticleDiscussionFooter dispatch={dispatch} prev={prev} next={next} />
          )}
        </Container>
      </div>
    </PageShell>
  );
}