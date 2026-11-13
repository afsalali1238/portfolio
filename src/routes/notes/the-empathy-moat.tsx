import { createFileRoute } from "@tanstack/react-router";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";
import { getDispatchByPath, getNextAndPrevDispatches } from "../../data/dispatches";
import { ArticleLayout } from "../../components/site/ArticleConnect";

const PATH = "/notes/the-empathy-moat";
const dispatch = getDispatchByPath(PATH)!;
const { prev, next } = getNextAndPrevDispatches(PATH);

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The Empathy Moat: Why Building for Someone You Love Beats Product Frameworks",
  description:
    "Why building for someone you love beats every synthetic product persona and corporate metrics deck ever written.",
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
        "Why building for someone you love beats every synthetic product persona and corporate metrics deck ever written.",
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
              . We threw out the multi-hundred-page PDFs and built an interactive 45-day sprint
              tailored for 20-minute fragments between shifts.
            </p>

            <p>
              Then she hit a second wall: clinical Arabic. Not high-brow classical Arabic, but the
              exact dialect phrases customers say at the counter in Deira — the word someone uses
              when they mean &ldquo;burning&rdquo; instead of &ldquo;ache&rdquo;.
            </p>

            <p>
              Textbooks don&rsquo;t teach counter conversations. So I built{" "}
              <Link
                to="/works/$id"
                params={{ id: "pharmarab" }}
                className="text-ink underline hover:text-ink-soft"
              >
                PharmaRab
              </Link>
              : audio-powered, micro-gamified clinical phrase training designed for 5-minute break
              intervals on a smartphone.
            </p>

            <p>
              And when her physiotherapist colleagues asked why pharmacists got all the good tools,
              we extended the engine to create{" "}
              <Link
                to="/works/$id"
                params={{ id: "physioarab" }}
                className="text-ink underline hover:text-ink-soft"
              >
                PhysioArab
              </Link>
              .
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Audience of One Advantage
            </h2>

            <p>When you build for a single real person with a real name and phone number:</p>

            <ul className="space-y-3 pl-4 border-l rule-hair text-ink-soft">
              <li>
                <strong className="text-ink">Scope collapses:</strong> You don&rsquo;t argue over 40
                hypothetical feature requests. You ask: &ldquo;Does this help you right now?&rdquo;
                If not, it dies before you write code.
              </li>
              <li>
                <strong className="text-ink">Feedback is visceral:</strong> Strangers churn
                silently. Someone who loves you tells you the onboarding is confusing right across
                the dining table in a voice you cannot ignore.
              </li>
              <li>
                <strong className="text-ink">Finishing gets easier:</strong> The last 10% of
                software is pure grind. Summoning discipline for an imaginary user is hard.
                Summoning discipline because someone is waiting on you tomorrow morning is
                effortless.
              </li>
            </ul>

            <div className="my-8 rounded-lg bg-paper-deep/70 p-6 md:p-8">
              <p className="font-serif text-2xl text-ink">
                Start with an audience of one. If you can make Tuesday genuinely better for one
                person you love, you have built something real. The other thousand people will
                follow the relief.
              </p>
            </div>
      </>
    </ArticleLayout>
  );
}
