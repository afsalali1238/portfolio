// Automated sitemap generator for forthe.tech
import { readFileSync, writeFileSync } from "fs";

const SITE_URL = "https://forthe.tech";

function getProjectIds() {
  try {
    const fileContent = readFileSync("src/data/projects.ts", "utf8");
    const matches = [...fileContent.matchAll(/id:\s*"([^"]+)"/g)];
    return matches.map((m) => m[1]);
  } catch (err) {
    console.warn("Could not read projects.ts, falling back to static list", err);
    return [];
  }
}

function generateSitemap() {
  const projectIds = getProjectIds();

  const staticRoutes = [
    { path: "/", priority: 1.0, changefreq: "weekly" },
    { path: "/thesis", priority: 0.9, changefreq: "monthly" },
  ];

  const projectRoutes = projectIds.map((id) => ({
    path: `/works/${id}`,
    priority: 0.8,
    changefreq: "monthly",
  }));

  const allRoutes = [...staticRoutes, ...projectRoutes];

  const lines = allRoutes
    .map(
      (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines}
</urlset>`;

  writeFileSync("public/sitemap.xml", xml);
  console.log(`sitemap.xml generated with ${allRoutes.length} indexed URLs`);
}

generateSitemap();
