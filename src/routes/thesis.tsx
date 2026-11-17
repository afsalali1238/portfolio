import { createFileRoute } from "@tanstack/react-router";
import { ScrollyPageShell } from "../components/scrollytelling/ScrollyPageShell";
import { ScrollyStage } from "../components/scrollytelling/ScrollyStage";
import { DiscussionFooter } from "../components/DiscussionFooter";
import { seo, SITE_URL, SITE_NAME, AUTHOR } from "../lib/site";
import { THESIS_PUBLISHED_AT } from "../components/scrollytelling/story";
import "../styles/app.css";
import "../styles/compact.css";
import "../styles/accessibility.css";
import "../styles/thesis-immersive.css";
import "../styles/thesis-interactive-field.css";

const PATH = "/thesis";

const MANIFESTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Refraction of Thought: A Manifesto of Light, Friction, Effort, and Becoming",
  description:
    "A seven-movement manifesto on light, friction, craft, and human becoming: why an idea in your head proves nothing until it collides with the dense glass of honest effort.",
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
        "A thesis in seven movements. Curiosity enters. Craft bends it. Reality catches the colour.",
      path: PATH,
      image: "/og/thesis.png",
      imageAlt:
        "A cream-coloured forthe.tech social card for The Refraction of Thought, a thesis in seven movements.",
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
