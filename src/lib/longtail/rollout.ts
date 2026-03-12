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
 * `ACTIVE_INDUSTRY_SLUGS` / `ACTIVE_APPLIANCE_SLUGS` /
 * `ACTIVE_CITY_PAGE_KEYS` / `ACTIVE_APPLIANCE_CITY_PAGE_KEYS` as needed.
 * No route code changes required.
 */

import { CITIES, type City } from "@/data/cities";
import { SUPPORTED_APPLIANCE_SLUGS } from "@/lib/longtail/applianceConfig";

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

/**
 * Appliances enabled for static generation and sitemap inclusion.
 * Default: all supported appliances. To gate new appliances, add them to
 * APPLIANCE_CONFIGS but omit from this list until rollout is ready.
 */
export const ACTIVE_APPLIANCE_SLUGS: readonly string[] = [...SUPPORTED_APPLIANCE_SLUGS];

/**
 * City pages enabled for rollout in phase 1.
 *
 * Key format: `${stateSlug}/${citySlug}`
 * This limits initial fan-out while city methodology and operations mature.
 */
export const ACTIVE_CITY_PAGE_KEYS: readonly string[] = [
  "california/los-angeles",
  "california/san-diego",
  "texas/houston",
  "texas/austin",
  "florida/miami",
  "new-york/new-york-city",
  "illinois/chicago",
  "pennsylvania/philadelphia",
  "ohio/columbus",
  "georgia/atlanta",
];

/**
 * Appliance x City pilot rollout keys.
 *
 * Key format: `${applianceSlug}/${stateSlug}/${citySlug}`
 *
 * This is intentionally separate from appliance-only and city-only rollout so
 * we can cap fan-out and pilot safely before broader expansion.
 */
export const ACTIVE_APPLIANCE_CITY_PAGE_KEYS: readonly string[] = [
  "refrigerator/california/los-angeles",
  "space-heater/texas/houston",
  "window-ac/florida/miami",
  "electric-vehicle-charger/california/san-diego",
];

export const APPLIANCE_CITY_ROLLOUT_LIMITS = {
  maxAppliances: 4,
  maxCities: 4,
  maxKeys: 8,
} as const;

export type ApplianceCityRolloutPage = {
  applianceSlug: string;
  stateSlug: string;
  citySlug: string;
};

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

export function getActiveApplianceSlugs(): readonly string[] {
  return ACTIVE_APPLIANCE_SLUGS;
}

export function isActiveApplianceSlug(value: string): boolean {
  return ACTIVE_APPLIANCE_SLUGS.includes(value);
}

export function buildCityPageKey(stateSlug: string, citySlug: string): string {
  return `${stateSlug}/${citySlug}`;
}

export function getActiveCityPageKeys(): readonly string[] {
  return ACTIVE_CITY_PAGE_KEYS;
}

export function isActiveCityPageKey(stateSlug: string, citySlug: string): boolean {
  return ACTIVE_CITY_PAGE_KEYS.includes(buildCityPageKey(stateSlug, citySlug));
}

export function getActiveCityPages(): City[] {
  return CITIES.filter((city) => isActiveCityPageKey(city.stateSlug, city.slug));
}

export function getActiveCitiesForState(stateSlug: string): City[] {
  return getActiveCityPages().filter((city) => city.stateSlug === stateSlug);
}

export function buildApplianceCityPageKey(
  applianceSlug: string,
  stateSlug: string,
  citySlug: string,
): string {
  return `${applianceSlug}/${stateSlug}/${citySlug}`;
}

function parseApplianceCityPageKey(value: string): ApplianceCityRolloutPage | null {
  const [applianceSlug, stateSlug, citySlug, extra] = value.split("/");
  if (!applianceSlug || !stateSlug || !citySlug || extra) return null;
  return { applianceSlug, stateSlug, citySlug };
}

function isValidApplianceCityPage(page: ApplianceCityRolloutPage): boolean {
  if (!isActiveApplianceSlug(page.applianceSlug)) return false;
  if (!isActiveCityPageKey(page.stateSlug, page.citySlug)) return false;
  return CITIES.some((city) => city.stateSlug === page.stateSlug && city.slug === page.citySlug);
}

function assertApplianceCityRolloutLimits(pages: ApplianceCityRolloutPage[]): void {
  const applianceCount = new Set(pages.map((page) => page.applianceSlug)).size;
  const cityCount = new Set(pages.map((page) => buildCityPageKey(page.stateSlug, page.citySlug))).size;
  if (applianceCount > APPLIANCE_CITY_ROLLOUT_LIMITS.maxAppliances) {
    throw new Error(
      `ACTIVE_APPLIANCE_CITY_PAGE_KEYS exceeds appliance cap (${applianceCount} > ${APPLIANCE_CITY_ROLLOUT_LIMITS.maxAppliances})`,
    );
  }
  if (cityCount > APPLIANCE_CITY_ROLLOUT_LIMITS.maxCities) {
    throw new Error(
      `ACTIVE_APPLIANCE_CITY_PAGE_KEYS exceeds city cap (${cityCount} > ${APPLIANCE_CITY_ROLLOUT_LIMITS.maxCities})`,
    );
  }
  if (pages.length > APPLIANCE_CITY_ROLLOUT_LIMITS.maxKeys) {
    throw new Error(
      `ACTIVE_APPLIANCE_CITY_PAGE_KEYS exceeds key cap (${pages.length} > ${APPLIANCE_CITY_ROLLOUT_LIMITS.maxKeys})`,
    );
  }
}

export function getActiveApplianceCityPages(): ApplianceCityRolloutPage[] {
  const pages = ACTIVE_APPLIANCE_CITY_PAGE_KEYS
    .map(parseApplianceCityPageKey)
    .filter((page): page is ApplianceCityRolloutPage => page != null)
    .filter(isValidApplianceCityPage);
  assertApplianceCityRolloutLimits(pages);
  return pages;
}

export function isActiveApplianceCityPageKey(
  applianceSlug: string,
  stateSlug: string,
  citySlug: string,
): boolean {
  return getActiveApplianceCityPages().some(
    (page) =>
      page.applianceSlug === applianceSlug &&
      page.stateSlug === stateSlug &&
      page.citySlug === citySlug,
  );
}

export function getActiveApplianceCityPagesForStateAppliance(
  stateSlug: string,
  applianceSlug: string,
): ApplianceCityRolloutPage[] {
  return getActiveApplianceCityPages().filter(
    (page) => page.stateSlug === stateSlug && page.applianceSlug === applianceSlug,
  );
}
