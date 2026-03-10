/**
 * Longtail rollout configuration.
 *
 * Controls which longtail page families are active for static generation
 * and sitemap inclusion. Routes still exist in the app directory and will
 * return 404 for states/params not in the active set — this is intentional
 * so crawlers only discover pages we've chosen to expose.
 *
 * To advance to the next phase, move families from a later phase into
 * `ACTIVE_LONGTAIL_FAMILIES` and adjust `ACTIVE_USAGE_KWH_TIERS` /
 * `ACTIVE_INDUSTRY_SLUGS` as needed. No route code changes required.
 */

export type LongtailFamily =
  | "state-price-per-kwh"
  | "state-price-trend"
  | "usage-cost"
  | "industry-cost";

// ── Phase definitions (for documentation / reference) ─────────────────

export const ROLLOUT_PHASES = {
  phase1: {
    label: "Phase 1 — Core price + common usage tiers",
    families: ["state-price-per-kwh", "usage-cost"] as LongtailFamily[],
    usageKwhTiers: [500, 1000, 1500, 2000] as const,
    industrySlugs: [] as string[],
    estimatedPages: 51 + 51 * 4, // 51 price + 204 usage = 255
  },
  phase2: {
    label: "Phase 2 — Trends + expanded usage tiers",
    families: [
      "state-price-per-kwh",
      "state-price-trend",
      "usage-cost",
    ] as LongtailFamily[],
    usageKwhTiers: [500, 750, 1000, 1500, 2000, 3000] as const,
    industrySlugs: [] as string[],
    estimatedPages: 51 + 51 + 51 * 6, // 51 + 51 + 306 = 408
  },
  phase3: {
    label: "Phase 3 — Full rollout including industry pages",
    families: [
      "state-price-per-kwh",
      "state-price-trend",
      "usage-cost",
      "industry-cost",
    ] as LongtailFamily[],
    usageKwhTiers: [500, 750, 1000, 1500, 2000, 3000] as const,
    industrySlugs: [
      "ev-charging",
      "bitcoin-mining",
      "ai-data-centers",
      "data-centers",
    ],
    estimatedPages: 51 + 51 + 51 * 6 + 51 * 4, // 408 + 204 = 612
  },
} as const;

// ── Active rollout settings ───────────────────────────────────────────
// Change these to advance rollout. Only the values below affect build
// output and sitemap. Route files themselves are always present.

export const ACTIVE_LONGTAIL_FAMILIES: ReadonlySet<LongtailFamily> = new Set([
  "state-price-per-kwh",
  "usage-cost",
]);

export const ACTIVE_USAGE_KWH_TIERS: readonly number[] = [500, 1000, 1500, 2000];

export const ACTIVE_INDUSTRY_SLUGS: readonly string[] = [];

// ── Helpers for route files and sitemap ───────────────────────────────

export function isLongtailFamilyActive(family: LongtailFamily): boolean {
  return ACTIVE_LONGTAIL_FAMILIES.has(family);
}

export function getActiveUsageKwhTiers(): readonly number[] {
  if (!isLongtailFamilyActive("usage-cost")) return [];
  return ACTIVE_USAGE_KWH_TIERS;
}

export function isActiveUsageKwhTier(value: number): boolean {
  return getActiveUsageKwhTiers().includes(value);
}

export function getActiveIndustrySlugs(): readonly string[] {
  if (!isLongtailFamilyActive("industry-cost")) return [];
  return ACTIVE_INDUSTRY_SLUGS;
}

export function isActiveIndustrySlug(value: string): boolean {
  return getActiveIndustrySlugs().includes(value);
}
