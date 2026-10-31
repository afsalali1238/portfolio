import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "../../components/site/PageShell";
import { Container } from "../../components/layout/Container";
import { SectionReveal } from "../../components/animations/SectionReveal";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../../lib/site";
import {
  ArticlePlatformBar,
  RelatedBuildsSection,
  ArticleDiscussionFooter,
} from "../../components/site/ArticleConnect";
import { getDispatchByPath, getNextAndPrevDispatches } from "../../data/dispatches";

const PATH = "/notes/the-curious-case-of-building";
const dispatch = getDispatchByPath(PATH)!;
const { prev, next } = getNextAndPrevDispatches(PATH);

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "forthe.tech: The Curious Case of Building",
  description:
    "The wall between having an idea and building it just came down. This is what happens when you build out of pure curiosity.",
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
  datePublished: "2026-10-31",
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/notes/the-curious-case-of-building")({
  head: () => ({
    ...seo({
      title: "The Curious Case of Building: No. 08 · forthe.tech",
      description:
        "The wall between having an idea and building it just came down. This is what happens when you build out of pure curiosity.",
      path: PATH,
      image: "/og/home.png",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ARTICLE_SCHEMA) }],
  }),
  component: CuriousCasePage,
});

function CuriousCasePage() {
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
              No. 08 · 31 October 2026
            </div>
            <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight text-ink md:text-6xl">
              The curious case of building.
            </h1>
            <p className="mt-4 font-serif text-xl italic text-ink-mute">
              The wall between having an idea and building it just came down. This is what happens
              when you build out of pure curiosity.
            </p>

            <ArticlePlatformBar
              external={dispatch.external}
              readTime={dispatch.readTime}
              words={dispatch.words}
            />
          </SectionReveal>

          <article className="mt-10 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
            <p>
              The wall between having an idea and building it just came down.
            </p>

            <p>
              Since then, I&rsquo;ve been building for the tech. Literally:{" "}
              <strong className="font-medium text-ink">forthe.tech</strong>.
            </p>

            <p>
              For decades, people with ideas hit the exact same wall. You could see the thing with
              total clarity in your mind. You knew how it should feel, what problem it solved, and
              who needed it. But you couldn&rsquo;t write the syntax, configure the servers, or hire
              a team of six engineers to wire it together. So the idea died quietly in a notebook.
            </p>

            <p>Now you can build it.</p>

            <p>
              You describe the problem, you guide the intelligence, and the software gets built. It
              feels like magic, and we are extraordinarily lucky to be here to witness it.
            </p>

            <div className="my-8 border-l-2 border-ink py-2 pl-6">
              <p className="font-serif text-2xl italic leading-snug text-ink">
                Tech isn&rsquo;t the moat. What it changes in someone&rsquo;s real life is.
              </p>
            </div>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Deluge and the Delusion
            </h2>

            <p>It is also impossible to keep up with.</p>

            <p>
              Something &ldquo;revolutionary&rdquo; launches every single morning. By the next
              afternoon, it is already yesterday&rsquo;s news, replaced by another drop that promises
              to rewrite how humans think and work.
            </p>

            <p>
              Entire industries get disrupted by a single feature release. Products that took small
              companies five years of sweat to construct become a throwaway checkbox in the next model
              update. We watch cycles of panic layoffs across tech, followed by sheepish rehiring six
              months later once the compute bills roll in and the sloppy, unguided code breaks in
              production.
            </p>

            <p>
              Watching from the sidelines isn&rsquo;t enough. If you just watch, you become cynical.
            </p>

            <p>
              But being online twenty-four hours a day chasing every benchmark, model leak, and
              changelog isn&rsquo;t enough either. That isn&rsquo;t building; it&rsquo;s consumption
              dressed up as research.
            </p>

            <p>So I filter.</p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Filter in Dubai
            </h2>

            <p>
              Around a demanding operations job and family life in Dubai, my time is finite. I
              don&rsquo;t have twenty hours a week to scroll through demo videos.
            </p>

            <p>
              I follow what ships, but I filter the deluge through people who see further. I&rsquo;m
              fortunate to share an office with leaders like Sathish Jeyakumar and Chakir QATAB, and
              to trade notes inside Uttam Gupta&rsquo;s community. When you put a new tool in front of
              seasoned operators and engineers, the hype evaporates fast. Between them, I can separate
              genuine step-changes from marketing noise.
            </p>

            <p>And once the noise is gone, I don&rsquo;t just read about the new tools.</p>

            <p>
              <strong className="font-medium text-ink">I test them.</strong>
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Curious Case of Building
            </h2>

            <p>The only way I know how to learn is to build.</p>

            <p>
              When a new capability drops, I don&rsquo;t read the documentation cover-to-cover and
              theorize. I open an editor, pick a problem that is irritating me or someone near me, and
              see if the tool can actually solve it.
            </p>

            <p>I build because I am insatiably curious about the possibilities:</p>

            <ul className="space-y-3 pl-4 border-l rule-hair text-ink-soft">
              <li>
                <strong className="text-ink">What happens</strong> when a non-coder is handed the
                leverage of a senior software team?
              </li>
              <li>
                <strong className="text-ink">What happens</strong> when multi-agent systems stop being
                an academic paper and start handling real workflows?
              </li>
              <li>
                <strong className="text-ink">What happens</strong> when you strip away roadmap
                committees, venture timelines, and product-positioning decks, and just build because
                the friction exists?
              </li>
            </ul>

            <p>
              I&rsquo;ve been building random things across different stacks and frontier models for
              a while now. Some worked beautifully. Some broke in production in four different ways
              before lunch.
            </p>

            <p>
              For two years, all of this lived scattered across local directories and private
              folders. If someone asked what I did, I would default to describing my day job, leaving
              this entire body of exploration hidden.
            </p>

            <p>
              So I started documenting it all in one place:{" "}
              <strong className="font-medium text-ink">forthe.tech</strong>.
            </p>

            <p>
              For the tech. For better or worse. Not as a portfolio of polished SaaS launches, but as
              an open field laboratory of what happens when curiosity meets frontier tools.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Grounding Truth
            </h2>

            <p>
              Here is the one rule that keeps me honest while exploring this frontier:
            </p>

            <div className="my-8 rounded-lg bg-paper-deep/70 p-6 md:p-8">
              <p className="font-serif text-2xl text-ink">
                Tech isn&rsquo;t the moat.
                <br />
                What it changes in someone&rsquo;s real life is.
              </p>
            </div>

            <p>
              Nobody values how complex your build was. Nobody cares what prompt scaffolding you
              chained together or what model size you ran underneath. The compute doesn&rsquo;t matter
              to the person on the other end.
            </p>

            <p>
              They only care whether their Tuesday got ten percent easier. They only care if the
              friction disappeared.
            </p>

            <p>
              The wall is down. The possibilities are wider than they have ever been in our lifetime.
            </p>

            <p className="font-serif text-2xl italic text-ink pt-4">
              Keep building. Stay curious. Till it&rsquo;s over.
            </p>
          </article>

          <RelatedBuildsSection projectIds={dispatch.relatedWorks} />

          <ArticleDiscussionFooter dispatch={dispatch} prev={prev} next={next} />
        </Container>
      </div>
    </PageShell>
  );
}
