import type { Metadata } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const FALLBACK_DESCRIPTION =
  "Electricity price and energy cost data from PriceOfElectricity.com.";

const MAX_DESCRIPTION_LENGTH = 160;

function truncateDescription(desc: string): string {
  const trimmed = desc.trim();
  if (!trimmed) return FALLBACK_DESCRIPTION;
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed;
  const cut = trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 3).trim();
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > MAX_DESCRIPTION_LENGTH * 0.7) {
    return cut.slice(0, lastSpace) + "...";
  }
  return cut + "...";
}

export function getDefaultShareImageUrl(): string | null {
  try {
    const ogDefault = path.join(process.cwd(), "public", "og-default.png");
    if (existsSync(ogDefault)) {
      return `${SITE_URL.replace(/\/+$/, "")}/og-default.png`;
    }
  } catch {
    // ignore
  }
  return null;
}

export type BuildMetadataInput = {
  title: string;
  description?: string | null;
  /** When set, used for openGraph/twitter description only (meta description stays `description`). */
  socialDescription?: string | null;
  canonicalPath: string;
  ogType?: "website" | "article";
  imageUrl?: string | null;
  siteName?: string | null;
  robots?: Metadata["robots"];
};

export function buildMetadata({
  title,
  description,
  socialDescription,
  canonicalPath,
  ogType = "website",
  imageUrl,
  siteName = SITE_NAME,
  robots,
}: BuildMetadataInput): Metadata {
  const desc = truncateDescription(description ?? FALLBACK_DESCRIPTION);
  const socialDesc = truncateDescription(
    socialDescription ?? description ?? FALLBACK_DESCRIPTION,
  );
  const baseUrl = SITE_URL.replace(/\/+$/, "");
  const canonicalUrl = canonicalPath.startsWith("http")
    ? canonicalPath
    : `${baseUrl}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  const resolvedImage = imageUrl ?? getDefaultShareImageUrl();
  const hasImage = !!resolvedImage;

  const openGraph: Metadata["openGraph"] = {
    title,
    description: socialDesc,
    url: canonicalUrl,
    type: ogType,
    siteName: siteName ?? SITE_NAME,
    ...(hasImage && resolvedImage
      ? { images: [{ url: resolvedImage, width: 1200, height: 630, alt: title }] }
      : {}),
  };

  const twitter: Metadata["twitter"] = {
    card: hasImage ? "summary_large_image" : "summary",
    title,
    description: socialDesc,
    ...(hasImage && resolvedImage ? { images: [resolvedImage] } : {}),
  };

  return {
    title,
    description: desc,
    alternates: { canonical: canonicalUrl },
    openGraph,
    twitter,
    ...(robots ? { robots } : {}),
  };
}

/** Adds default OG/Twitter share image to hand-rolled metadata (e.g. when buildMetadata would alter copy). */
export function withDefaultShareImage(metadata: Metadata, altTitle?: string): Metadata {
  const imageUrl = getDefaultShareImageUrl();
  if (!imageUrl) return metadata;
  const alt =
    altTitle ??
    (typeof metadata.title === "string" ? metadata.title : "PriceOfElectricity.com");
  const openGraphBase =
    typeof metadata.openGraph === "object" && metadata.openGraph ? metadata.openGraph : {};
  const twitterBase =
    typeof metadata.twitter === "object" && metadata.twitter ? metadata.twitter : {};
  return {
    ...metadata,
    openGraph: {
      ...openGraphBase,
      images: [{ url: imageUrl, width: 1200, height: 630, alt }],
    },
    twitter: {
      ...twitterBase,
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}
