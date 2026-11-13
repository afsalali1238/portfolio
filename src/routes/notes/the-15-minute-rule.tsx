import { createFileRoute } from "@tanstack/react-router";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";
import { getDispatchByPath, getNextAndPrevDispatches } from "../../data/dispatches";
import { ArticleLayout } from "../../components/site/ArticleConnect";

const PATH = "/notes/the-15-minute-rule";
const dispatch = getDispatchByPath(PATH)!;
const { prev, next } = getNextAndPrevDispatches(PATH);

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "The 15-Minute Rule: The Case for Bounded Software",
  description:
    "Why infinite scroll loops and aggressive gamification destroy retention, and why software that respects human time survives.",
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
        "Why infinite scroll loops and aggressive gamification destroy retention, and why software that respects human time survives.",
      path: PATH,
      image: "/og/the-15-minute-rule.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: FifteenMinuteRulePage,
});

function FifteenMinuteRulePage() {
  return (
    <ArticleLayout dispatch={dispatch} prev={prev} next={next}>
      <>
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

        <div style={{ borderLeft: "2px solid var(--fg)", paddingLeft: "24px", paddingTop: "16px", paddingBottom: "16px", margin: "32px 0" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontStyle: "italic", lineHeight: "1.2", color: "var(--fg)" }}>
            Good software does not demand residence in your life. It arrives, solves the
            friction in fifteen minutes, and gives your day back.
          </p>
        </div>

        <p>
          When I designed the rehabilitation engine for{" "}
          <a
            to="/works/$id"
            params={{ id: "kine" }}
            className="text-link"
          >
            kinē
          </a>
          , we set an uncompromising constraint: the progressive plan (Calm → Load → Capacity)
          had to be hard-capped at fifteen minutes a day. No marathon workouts. No clinical
          jargon. Just targeted, progressive loading you can execute before your morning coffee.
        </p>

        <p>
          We applied the exact same principle to licensing exam prep with{" "}
          <a
            to="/works/$id"
            params={{ id: "provia" }}
            className="text-link"
          >
            Provia
          </a>
          . Pharmacists preparing for DHA and MOH examinations in Dubai work demanding retail or
          hospital shifts. They don&rsquo;t have three-hour study blocks.
        </p>

        <p>
          So Provia broke the curriculum into 15-minute high-yield sprints. Duel mode pits you
          against another pharmacist on ten rapid clinical scenarios during lunch. You get in,
          test your clinical recall, and get out.
        </p>

        <h2 className="t-display-2 pt-8">The Anti-Gamification Philosophy</h2>

        <p>
          The moment you introduce streaks, XP points, and virtual leaderboards, you distort the
          user&rsquo;s motivation.
        </p>

        <p>
          People stop learning clinical pharmacy or rehabilitating their patellar tendon because
          they care about the outcome; they do it to avoid breaking an arbitrary flame icon. And
          the day life interrupts and the streak breaks, they don&rsquo;t just miss one day —
          they delete the application in disgust.
        </p>

        <div style={{ backgroundColor: "var(--bg-raised)", padding: "24px", borderRadius: "4px", margin: "32px 0" }}>
          <p className="t-display-3">
            Software should be like a good hammer: you pick it up, drive the nail into the wall,
            and put the hammer back in the drawer. The hammer doesn&rsquo;t send you a push
            notification at midnight asking why you haven&rsquo;t hammered anything today.
          </p>
        </div>

        <p>
          Bounded software respects human cognitive sovereignty. When you design for completion
          rather than addiction, you build products that users genuinely trust and keep for
          years.
        </p>
      </>
    </ArticleLayout>
  );
}
