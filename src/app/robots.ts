import type { MetadataRoute } from "next";

const CANONICAL_SITEMAP_ORIGIN = "https://priceofelectricity.com";

export default function robots(): MetadataRoute.Robots {
  const isExplicitlyBlocked =
    process.env.VERCEL_ENV !== undefined &&
    process.env.VERCEL_ENV !== "production";
  const allowIndexing = !isExplicitlyBlocked;

  return {
    rules: allowIndexing
      ? {
          userAgent: "*",
          allow: "/",
          disallow: ["/api/", "/knowledge/state/*.json"],
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${CANONICAL_SITEMAP_ORIGIN}/sitemap-index.xml`,
  };
}
