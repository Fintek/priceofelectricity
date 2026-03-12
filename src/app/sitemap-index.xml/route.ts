import { SITE_URL } from "@/lib/site";
import { SITEMAP_SEGMENT_IDS } from "@/lib/seo/sitemapSegments";

export function GET(): Response {
  const baseUrl = SITE_URL.replace(/\/+$/, "");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_SEGMENT_IDS.map(
  (segment) => `  <sitemap>
    <loc>${baseUrl}/sitemap/${segment}.xml</loc>
  </sitemap>`,
).join("\n")}
</sitemapindex>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
