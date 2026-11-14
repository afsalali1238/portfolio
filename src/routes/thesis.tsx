import { createFileRoute } from "@tanstack/react-router";
import { ScrollyPageShell } from "../components/scrollytelling/ScrollyPageShell";
import { ScrollyStage } from "../components/scrollytelling/ScrollyStage";
import { DiscussionFooter } from "../components/DiscussionFooter";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../lib/site";
import { THESIS_PUBLISHED_AT } from "../components/scrollytelling/story";
import "../styles/app.css";
import "../styles/compact.css";
import "../styles/accessibility.css";
import "../styles/interactive-field.css";

const PATH = "/thesis";

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
  image: [`${SITE_URL}/og/thesis.png`],
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": `${SITE_URL}${PATH}`,
  },
  datePublished: THESIS_PUBLISHED_AT,
  inLanguage: "en-GB",
};

export const Route = createFileRoute("/thesis")({
  head: () => ({
    ...seo({
      title: "The Refraction of Thought: A Manifesto · forthe.tech",
      description:
        "Curiosity enters. Craft bends it. Reality catches the colour. An interactive manifesto on ideas, the work, and finding the right medium.",
      path: PATH,
      image: "/og/thesis.png",
      imageAlt: "A cream-coloured forthe.tech card introducing The Refraction of Thought.",
      type: "article",
    }),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(MANIFESTO_SCHEMA) }],
  }),
  component: Thesis,
});

function Thesis() {
  return (
    <ScrollyPageShell>
      <ScrollyStage />
      <DiscussionFooter />
    </ScrollyPageShell>
  );
}
