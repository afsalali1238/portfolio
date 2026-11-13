import { createFileRoute } from "@tanstack/react-router";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";
import { getDispatchByPath, getNextAndPrevDispatches } from "../../data/dispatches";
import { ArticleLayout } from "../../components/site/ArticleConnect";

const PATH = "/notes/the-first-hit-is-free";
const dispatch = getDispatchByPath(PATH)!;
const { prev, next } = getNextAndPrevDispatches(PATH);

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The First Hit Is Free: AI, Usage Limits, and the Unfinished Horse",
  description:
    "AI, usage limits, and the unfinished horse: why cognitive offloading feels like genius until the rate limit hits.",
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
  datePublished: "2026-10-30",
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/notes/the-first-hit-is-free")({
  head: () => ({
    ...seo({
      title: "The First Hit Is Free: No. 07 · forthe.tech",
      description:
        "AI, usage limits, and the unfinished horse: why cognitive offloading feels like genius until the rate limit hits.",
      path: PATH,
      image: "/og/home.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: ArticlePage,
});

function ArticlePage() {
  return (
    <ArticleLayout dispatch={dispatch} prev={prev} next={next}>
      <>
<p>The first time you try it, they don&rsquo;t ask you for anything.</p>

            <p>
              They hand it to you with an open palm. Take as much as you want. Try it on your
              hardest problem.
            </p>

            <p>So you take a hit.</p>

            <p>
              Twenty seconds later, the brain fog is gone. It&rsquo;s like the scene in{" "}
              <em>Limitless</em> when the pill kicks in. Grey turns to gold.
            </p>

            <p>
              The thoughts you&rsquo;ve been fighting for weeks fall effortlessly into place. Words
              pour out. The answer shows up before you even finish formulating the question.
            </p>

            <p>
              It feels like someone just wired your nervous system directly into a higher
              intelligence. You look at the glowing screen and think:
            </p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                &ldquo;I am a genius.&rdquo;
              </p>
            </div>

            <p>
              In two hours, you do what used to take two weeks. Everyone around you seems to be
              walking underwater.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              Then It Becomes Normal
            </h2>

            <p>The magic doesn&rsquo;t stay magic for long.</p>

            <p>
              Soon you need it every single morning. Two weeks of work compressed into two hours
              stops feeling special. It becomes your baseline. That is the new benchmark for your
              daily output. Nobody wrote it down; it just settled in.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">Then It Costs Money</h2>

            <p>The free tier runs out by 10:30 AM.</p>

            <p>
              So you pull out your credit card and pay $20 a month. Fair enough. A few weeks later,
              you hit the rate limit again during a critical sprint. So you upgrade to $100. Then
              $200 across multiple API keys.
            </p>

            <p>The dose didn&rsquo;t get more expensive. You just need more of it to function.</p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              Then the Wall Hits: The Unfinished Horse
            </h2>

            <p>
              Everyone knows the famous drawing of the horse: the rear half is rendered in
              hyper-realistic, meticulous Da Vinci Renaissance detail, and the front half degrades
              into a childish stick figure scribbled with a dying crayon.
            </p>

            <p>
              That is what happens to your work the moment the red banner appears:{" "}
              <code className="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-sm">
                You have reached your usage limit. Resets at 3:00 PM.
              </code>
            </p>

            <p>
              Suddenly, the prosthetic brain is unplugged. You sit at your desk staring at an
              unfinished document, and you realize with sudden panic:{" "}
              <em>you have forgotten how to think without the accelerator.</em>
            </p>

            <p>
              Your unassisted brain feels heavy, sluggish, and easily distracted. You can&rsquo;t
              even write a crisp three-line email without wanting to prompt a model for tone.
            </p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                If the model is doing the synthesis, the model is building the muscle. When you
                delegate all struggle, you delegate the intellect.
              </p>
            </div>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Operator&rsquo;s Rule of Bounded Leverage
            </h2>

            <p>
              AI is the most astounding cognitive lever ever constructed. But like any lever, if you
              lean your full body weight on it without keeping your own feet planted on the floor,
              the moment it snaps, you smash your face on the ground.
            </p>

            <p>
              I use frontier AI daily across logistics, clinical translation tools, and systems. But
              I maintain strict operating hygiene:
            </p>

            <ul className="space-y-3 pl-4 border-l rule-hair text-ink-soft">
              <li>
                <strong className="text-ink">1. Never prompt what you cannot verify.</strong> If you
                don&rsquo;t understand the output deeply enough to spot a subtle hallucination in
                production, you have no business shipping it.
              </li>
              <li>
                <strong className="text-ink">2. Do the first 20 minutes in analog.</strong>{" "}
                Structure the problem in your own journal or whiteboard before touching the
                keyboard.
              </li>
              <li>
                <strong className="text-ink">3. Maintain unassisted reps.</strong> Write long-form
                thoughts by hand. Debate with real operators in the room. If you can&rsquo;t hold
                the logic in your head, the software will collapse under you.
              </li>
            </ul>

            <p>
              The first hit is free. The second hit costs twenty dollars. The third hit costs your
              attention. Use the tool with ruthless clarity — but never surrender your judgment.
            </p>
      </>
    </ArticleLayout>
  );
}
