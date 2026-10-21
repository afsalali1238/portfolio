// Automated sitemap generator for forthe.tech
import { readFileSync, writeFileSync } from "fs";

// Keep in sync with SITE_URL in src/lib/site.ts (the www host is the one that serves).
const SITE_URL = "https://www.forthe.tech";

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
    { path: "/works", priority: 0.9, changefreq: "weekly" },
    { path: "/notes", priority: 0.85, changefreq: "weekly" },
    { path: "/notes/the-moat-moved", priority: 0.8, changefreq: "monthly" },
    { path: "/notes/the-energy-ledger", priority: 0.8, changefreq: "monthly" },
    { path: "/notes/the-empathy-moat", priority: 0.8, changefreq: "monthly" },
    { path: "/notes/the-15-minute-rule", priority: 0.8, changefreq: "monthly" },
    { path: "/notes/the-reality-test", priority: 0.8, changefreq: "monthly" },
    { path: "/notes/the-whatsapp-operating-system", priority: 0.8, changefreq: "monthly" },
    { path: "/about", priority: 0.6, changefreq: "monthly" },
  ];

  const projectRoutes = projectIds.map((id) => ({
    path: `/works/${id}`,
    priority: 0.7,
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
