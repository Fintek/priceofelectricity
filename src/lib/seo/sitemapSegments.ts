import type { MetadataRoute } from "next";
import { STATES } from "@/data/states";

export const SITEMAP_SEGMENT_IDS = ["core", "states", "cities", "appliances", "estimators"] as const;
export type SitemapSegmentId = (typeof SITEMAP_SEGMENT_IDS)[number];

const STATE_SLUG_SET = new Set(Object.keys(STATES));

function getPathSegments(url: string): string[] {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // Keep path-like strings as-is.
  }
  return pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
}

function isStateScopedPath(segments: string[]): boolean {
  if (segments.length === 0) return false;
  if (STATE_SLUG_SET.has(segments[0])) {
    if (segments.length === 1) return true;
    if (segments.length === 2) {
      return segments[1] === "utilities" || segments[1] === "plans" || segments[1] === "plan-types" || segments[1] === "history";
    }
    if (segments.length === 3 && segments[1] === "bill" && /^\d+$/.test(segments[2])) return true;
  }
  if (segments.length === 2 && segments[0] === "electricity-cost" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 2 && segments[0] === "average-electricity-bill" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 2 && segments[0] === "electricity-cost-calculator" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 2 && segments[0] === "electricity-usage" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 2 && segments[0] === "electricity-price-per-kwh" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 2 && segments[0] === "electricity-price-trend" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 3 && segments[0] === "electricity-usage-cost" && /^\d+$/.test(segments[1]) && STATE_SLUG_SET.has(segments[2])) return true;
  if (segments.length === 3 && segments[0] === "industry-electricity-cost" && segments[1].length > 0 && STATE_SLUG_SET.has(segments[2])) return true;
  return false;
}

function isCityScopedPath(segments: string[]): boolean {
  if (segments.length === 3 && segments[0] === "electricity-cost" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 3 && segments[0] === "average-electricity-bill" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 4 && segments[0] === "cost-to-run" && STATE_SLUG_SET.has(segments[2])) return true;
  return false;
}

function isApplianceScopedPath(segments: string[]): boolean {
  if (segments.length === 3 && segments[0] === "cost-to-run" && STATE_SLUG_SET.has(segments[2])) return true;
  if (segments.length === 3 && segments[0] === "electricity-cost-calculator" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 3 && segments[0] === "electricity-usage" && segments[1] === "appliances") return true;
  return false;
}

function isEstimatorScopedPath(segments: string[]): boolean {
  if (segments.length === 1 && segments[0] === "electricity-bill-estimator") return true;
  if (segments.length === 2 && segments[0] === "electricity-bill-estimator" && STATE_SLUG_SET.has(segments[1])) return true;
  if (segments.length === 3 && segments[0] === "electricity-bill-estimator" && STATE_SLUG_SET.has(segments[1])) return true;
  return false;
}

export function groupSitemapEntriesBySegment(entries: MetadataRoute.Sitemap): Record<SitemapSegmentId, MetadataRoute.Sitemap> {
  const grouped: Record<SitemapSegmentId, MetadataRoute.Sitemap> = {
    core: [],
    states: [],
    cities: [],
    appliances: [],
    estimators: [],
  };
  for (const entry of entries) {
    const segments = getPathSegments(entry.url);
    if (isEstimatorScopedPath(segments)) {
      grouped.estimators.push(entry);
      continue;
    }
    if (isCityScopedPath(segments)) {
      grouped.cities.push(entry);
      continue;
    }
    if (isApplianceScopedPath(segments)) {
      grouped.appliances.push(entry);
      continue;
    }
    if (isStateScopedPath(segments)) {
      grouped.states.push(entry);
      continue;
    }
    grouped.core.push(entry);
  }
  return grouped;
}

export function assertNoDuplicateSegmentUrls(grouped: Record<SitemapSegmentId, MetadataRoute.Sitemap>): void {
  const seen = new Set<string>();
  for (const id of SITEMAP_SEGMENT_IDS) {
    for (const entry of grouped[id]) {
      if (seen.has(entry.url)) {
        throw new Error(`Duplicate sitemap URL across segments: ${entry.url}`);
      }
      seen.add(entry.url);
    }
  }
}
