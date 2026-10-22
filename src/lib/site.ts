/**
 * Single source of truth for the public origin. The site is served on www; the apex
 * (forthe.tech) must redirect here. Every canonical, og:url, og:image, sitemap entry and
 * JSON-LD URL is built from this constant — social scrapers will not resolve relative
 * paths, and a canonical on a host that doesn't resolve is worse than none.
 */
import { projectCount, numberWord } from "../data/projects";

export const SITE_URL = "https://www.forthe.tech";
export const SITE_NAME = "forthe.tech";
export const AUTHOR = "Afsal Ali";

export const DEFAULT_DESCRIPTION = `Documenting what happens when the wall between having an idea and building it disappears. ${numberWord(projectCount)} builds by Afsal Ali, made in Dubai for the people around him.`;

type SeoInput = {
  title: string;
  description: string;
  /** Path on this site, starting with "/". Becomes the canonical and og:url. */
  path: string;
  /** Path of a 1200×630 share card under /public. Defaults to the home card. */
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
};

/**
 * Per-route head tags. TanStack merges meta by name/property with the deepest route
 * winning, but it never dedupes links — so the canonical lives here, never in __root.
 */
export function seo({
  title,
  description,
  path,
  image = "/og/home.png",
  imageAlt,
  type = "website",
}: SeoInput) {
  const url = `${SITE_URL}${path}`;
  const img = `${SITE_URL}${image}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:image", content: img },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: imageAlt ?? title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: img },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
