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

const PATH = "/notes/the-reality-test";
const dispatch = getDispatchByPath(PATH)!;
const { prev, next } = getNextAndPrevDispatches(PATH);

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
      path: PATH,
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

            <ArticlePlatformBar
              external={dispatch.external}
              readTime={dispatch.readTime}
              words={dispatch.words}
            />
          </SectionReveal>

          <article className="mt-10 space-y-6 text-base leading-relaxed text-ink-soft md:text-lg">
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
                git push
              </code>{" "}
              trust.
            </p>

            <p>
              When you step out of your editor and show your creation to a stranger, you enter the
              arena of unvarnished truth. The market doesn&rsquo;t care that you didn&rsquo;t sleep on
              Thursday. It doesn&rsquo;t care that your backend is a masterclass in clean architecture.
              If the tool doesn&rsquo;t eliminate their specific, agonizing friction within sixty
              seconds, they close the tab and never return.
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The Founder&rsquo;s Hiding Place
            </h2>

            <p>
              Faced with this brutal indifference, most builders retreat. But they don&rsquo;t admit
              they are retreating. Instead, they disguise their fear as diligence:
            </p>

            <ul className="space-y-3 pl-4 border-l rule-hair text-ink-soft">
              <li>
                <em>&ldquo;The conversion rate is low because we don&rsquo;t have dark mode yet.&rdquo;</em>
              </li>
              <li>
                <em>&ldquo;People aren&rsquo;t signing up because the onboarding flow needs three more steps.&rdquo;</em>
              </li>
              <li>
                <em>&ldquo;Let me rewrite the database layer in Rust before we do customer outreach.&rdquo;</em>
              </li>
            </ul>

            <p>
              This is the classic founder hiding place. Rewriting code feels like work, but it is
              actually cowardice. It is an emotional insurance policy against hearing the one
              sentence that will crush your ego:{" "}
              <strong className="text-ink">&ldquo;This doesn&rsquo;t matter to me.&rdquo;</strong>
            </p>

            <h2 className="pt-6 font-serif text-3xl text-ink md:text-4xl">
              The 14-Day Reality Rule
            </h2>

            <p>
              To survive as an operator, you must cure yourself of this romantic disease. At{" "}
              <strong className="text-ink">forthe.tech</strong>, every build is subjected to a strict
              operating contract:
            </p>

            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-paper-deep/50 p-6">
                <h3 className="font-serif text-xl text-ink">1. Name the Person</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Never build for an anonymous demographic. Before writing a line of code, name the
                  exact human who has the problem. If it&rsquo;s your wife, a pharmacist in Deira, or
                  a logistics dispatcher in Jebel Ali, you know who has to say yes.
                </p>
              </div>

              <div className="rounded-lg bg-paper-deep/50 p-6">
                <h3 className="font-serif text-xl text-ink">2. The Two-Week Verdict</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Deploy a working version within 14 days and put it directly into their hands. If
                  they aren&rsquo;t using it organically by day 15, do not add ten more features. Ask
                  why the pain wasn&rsquo;t sharp enough.
                </p>
              </div>

              <div className="rounded-lg bg-paper-deep/50 p-6">
                <h3 className="font-serif text-xl text-ink">3. Kill Without Ceremony</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  If the software failed the reality test, shut down the server, archive the repo,
                  and write down what broke. Never keep zombie apps alive to protect your founder ego.
                </p>
              </div>
            </div>

            <p className="pt-4">
              Your software is not your child. It is a tool. If the wrench doesn&rsquo;t turn the
              bolt, you don&rsquo;t polish the handle for six months — you put it down and find a
              different tool.
            </p>
          </article>

          <RelatedBuildsSection projectIds={dispatch.relatedWorks} />

          <ArticleDiscussionFooter dispatch={dispatch} prev={prev} next={next} />
        </Container>
      </div>
    </PageShell>
  );
}
