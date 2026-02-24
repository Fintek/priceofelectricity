import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

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
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
