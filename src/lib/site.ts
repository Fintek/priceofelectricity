import { getCurrentSnapshot } from "@/lib/snapshotLoader";

export const SITE_NAME = "PriceOfElectricity.com";

function normalizeSiteUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return normalizeSiteUrl(fromEnv);
  }

  if (process.env.NODE_ENV === "production") {
    return "https://www.priceofelectricity.com";
  }

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const LAUNCH_MODE = process.env.LAUNCH_MODE === "true";
export const UPDATE_CADENCE_TEXT = "Updated monthly";

export type SocialLink = {
  /** Platform display name */
  name: string;
  /** Public profile URL */
  url: string;
  /** Public handle including the leading @ (when applicable) */
  handle?: string;
};

/**
 * Official POE social accounts. Add new platforms (YouTube, Instagram,
 * Facebook, …) here and they automatically appear in the footer and in the
 * Organization `sameAs` structured data.
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "X",
    url: "https://x.com/priceofelectric",
    handle: "@priceofelectric",
  },
];

/** Primary X/Twitter handle used for the twitter card metadata. */
export const SITE_TWITTER_HANDLE = "@priceofelectric";

const snapshotReleasedAt = getCurrentSnapshot().releasedAt;
/** ISO calendar date (YYYY-MM-DD) for structured data and machine use */
export const LAST_REVIEWED = snapshotReleasedAt.includes("T")
  ? snapshotReleasedAt.slice(0, 10)
  : snapshotReleasedAt;

/** Long-form editorial date for visible freshness/review copy (e.g. “February 22, 2026”). */
export function formatPublicReviewDate(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!trimmed) return "—";
  const normalized = trimmed.includes("T")
    ? trimmed
    : `${trimmed.slice(0, 10)}T12:00:00.000Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** U.S.-style long date for visible “Last reviewed …” copy */
export const LAST_REVIEWED_DISPLAY = formatPublicReviewDate(LAST_REVIEWED);
