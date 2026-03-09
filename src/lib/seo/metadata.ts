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

function getDefaultShareImageUrl(): string | null {
  try {
    const png = path.join(process.cwd(), "public", "og.png");
    const jpg = path.join(process.cwd(), "public", "og.jpg");
    if (existsSync(png)) return `${SITE_URL.replace(/\/+$/, "")}/og.png`;
    if (existsSync(jpg)) return `${SITE_URL.replace(/\/+$/, "")}/og.jpg`;
  } catch {
    // ignore
  }
  return null;
}

export type BuildMetadataInput = {
  title: string;
  description?: string | null;
  canonicalPath: string;
  ogType?: "website" | "article";
  imageUrl?: string | null;
  siteName?: string | null;
};

export function buildMetadata({
  title,
  description,
  canonicalPath,
  ogType = "website",
  imageUrl,
  siteName = SITE_NAME,
}: BuildMetadataInput): Metadata {
  const desc = truncateDescription(description ?? FALLBACK_DESCRIPTION);
  const baseUrl = SITE_URL.replace(/\/+$/, "");
  const canonicalUrl = canonicalPath.startsWith("http")
    ? canonicalPath
    : `${baseUrl}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  const resolvedImage = imageUrl ?? getDefaultShareImageUrl();
  const hasImage = !!resolvedImage;

  const openGraph: Metadata["openGraph"] = {
    title,
    description: desc,
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
    description: desc,
    ...(hasImage && resolvedImage ? { images: [resolvedImage] } : {}),
  };

  return {
    title,
    description: desc,
    alternates: { canonical: canonicalUrl },
    openGraph,
    twitter,
  };
}
