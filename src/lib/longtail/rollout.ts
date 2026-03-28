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
import { SUPPORTED_APPLIANCE_SLUGS, type ApplianceSlug } from "@/lib/longtail/applianceConfig";

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
 * This is an explicit allowlist and is intentionally decoupled from
 * SUPPORTED_APPLIANCE_SLUGS so newly added appliance configs do not
 * automatically roll out across route families or sitemap surfaces.
 */
export const ACTIVE_APPLIANCE_SLUGS: readonly ApplianceSlug[] = [
  "refrigerator",
  "space-heater",
  "window-ac",
  "portable-ac",
  "central-ac",
  "clothes-dryer",
  "washing-machine",
  "dishwasher",
  "electric-oven",
  "microwave",
  "gaming-pc",
  "electric-vehicle-charger",
  "air-purifier",
  "dehumidifier",
  "ceiling-fan",
  "box-fan",
  "laptop",
  "television",
  "toaster-oven",
  "electric-kettle",
  "coffee-maker",
  "hair-dryer",
  "freezer",
  "instant-pot",
  "air-fryer",
  "heat-pump",
  "electric-blanket",
  "pool-pump",
  "hot-tub",
  "iron",
  "vacuum-cleaner",
  "desktop-computer",
  "electric-stove-top",
  "garage-door-opener",
  "water-heater",
  "sump-pump",
  "electric-furnace",
  "rice-cooker",
  "humidifier",
  "slow-cooker",
  "blender",
  "treadmill",
  "gaming-console",
  "wi-fi-router",
];
const ACTIVE_APPLIANCE_SLUG_SET = new Set(ACTIVE_APPLIANCE_SLUGS);
const SUPPORTED_APPLIANCE_SLUG_SET = new Set(SUPPORTED_APPLIANCE_SLUGS);

function assertActiveApplianceRolloutIsValid(): void {
  if (ACTIVE_APPLIANCE_SLUG_SET.size !== ACTIVE_APPLIANCE_SLUGS.length) {
    throw new Error("ACTIVE_APPLIANCE_SLUGS contains duplicate appliance slugs");
  }
  for (const slug of ACTIVE_APPLIANCE_SLUGS) {
    if (!SUPPORTED_APPLIANCE_SLUG_SET.has(slug)) {
      throw new Error(`ACTIVE_APPLIANCE_SLUGS contains unsupported slug: ${slug}`);
    }
  }
}

assertActiveApplianceRolloutIsValid();

/**
 * City pages enabled for rollout in phases 1 and 2.
 *
 * Key format: `${stateSlug}/${citySlug}`
 * This limits initial fan-out while city methodology and operations mature.
 */
export const ACTIVE_CITY_PAGE_KEYS: readonly string[] = [
  // Original 10 cities
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
  // Phase 1 expansion — existing cities activated
  "california/san-jose",
  "california/san-francisco",
  "texas/dallas",
  "texas/san-antonio",
  "florida/jacksonville",
  "florida/tampa",
  "florida/orlando",
  "ohio/cleveland",
  "ohio/cincinnati",
  "pennsylvania/pittsburgh",
  // Phase 1 expansion — new high-population cities
  "arizona/phoenix",
  "arizona/tucson",
  "north-carolina/charlotte",
  "north-carolina/raleigh",
  "michigan/detroit",
  "washington/seattle",
  "massachusetts/boston",
  "colorado/denver",
  "tennessee/nashville",
  "tennessee/memphis",
  "maryland/baltimore",
  "indiana/indianapolis",
  "minnesota/minneapolis",
  "missouri/kansas-city",
  "missouri/st-louis",
  "nevada/las-vegas",
  "virginia/virginia-beach",
  "wisconsin/milwaukee",
  // Phase 2 expansion — controlled city-authority increment (+12)
  "california/fresno",
  "california/sacramento",
  "texas/fort-worth",
  "texas/el-paso",
  "florida/st-petersburg",
  "florida/hialeah",
  "new-york/buffalo",
  "illinois/aurora",
  "pennsylvania/allentown",
  "ohio/toledo",
  "georgia/augusta",
  "georgia/columbus",
];

/**
 * City average-bill benchmark rollout keys.
 *
 * Key format: `${stateSlug}/${citySlug}`
 *
 * Phase 1 keeps city-bill rollout tightly bounded to a small explicit allowlist.
 * Keys must point to cities already active in city authority rollout and
 * must use configured city reference rates.
 */
export const ACTIVE_CITY_BILL_PAGE_KEYS: readonly string[] = [
  "california/los-angeles",
  "california/san-diego",
  "california/san-jose",
  "california/san-francisco",
  "texas/houston",
  "texas/dallas",
  "texas/austin",
  "texas/san-antonio",
  "florida/miami",
  "florida/jacksonville",
  "florida/tampa",
  "florida/orlando",
  // Wave 2 — Ohio (4th state, Midwest geographic diversity)
  "ohio/columbus",
  "ohio/cleveland",
  "ohio/cincinnati",
  "ohio/toledo",
];

export const CITY_BILL_ROLLOUT_LIMITS = {
  maxStates: 4,
  maxKeys: 16,
} as const;

/**
 * Appliance x City pilot rollout keys.
 *
 * Key format: `${applianceSlug}/${stateSlug}/${citySlug}`
 *
 * This is intentionally separate from appliance-only and city-only rollout so
 * we can cap fan-out and pilot safely before broader expansion.
 *
 * Expansion policy (see docs/ROADMAP_EXPANSION_NEXT_PHASES.md §3):
 * - Keys must only reference appliances in ACTIVE_APPLIANCE_SLUGS
 * - Keys must only reference cities in ACTIVE_CITY_PAGE_KEYS
 * - Hard caps below are enforced at runtime by assertApplianceCityRolloutLimits()
 * - Caps may only be raised after: build passes, payload audit passes,
 *   sitemap diff is reviewed, and no thin-content or duplicate-intent risk exists
 */
export const ACTIVE_APPLIANCE_CITY_PAGE_KEYS: readonly string[] = [
  // Original pilot keys
  "refrigerator/california/los-angeles",
  "space-heater/texas/houston",
  "window-ac/florida/miami",
  "electric-vehicle-charger/california/san-diego",
  // Phase 1 expansion appliances × existing pilot cities
  "heat-pump/new-york/new-york-city",
  "pool-pump/florida/miami",
  "hot-tub/texas/austin",
  "central-ac/georgia/atlanta",
  // Phase 2 expansion — configured-reference cities, geographic diversity
  "central-ac/arizona/phoenix",
  "space-heater/massachusetts/boston",
  "electric-vehicle-charger/colorado/denver",
  "heat-pump/washington/seattle",
  "pool-pump/nevada/las-vegas",
  "window-ac/maryland/baltimore",
  // Final 2 keys — fill remaining pilot capacity
  "hot-tub/michigan/detroit",
  "refrigerator/wisconsin/milwaukee",
  // Phase 3 expansion — one additional key per pilot appliance, city-diverse and configured
  "refrigerator/north-carolina/charlotte",
  "space-heater/minnesota/minneapolis",
  "window-ac/texas/dallas",
  "electric-vehicle-charger/illinois/chicago",
  "heat-pump/pennsylvania/pittsburgh",
  "pool-pump/florida/jacksonville",
  "hot-tub/new-york/buffalo",
  "central-ac/virginia/virginia-beach",
  // Phase 4 bounded continuation — +8 keys (4 new cities x 2 appliances)
  "pool-pump/florida/orlando",
  "central-ac/florida/orlando",
  "window-ac/california/sacramento",
  "electric-vehicle-charger/california/sacramento",
  "heat-pump/north-carolina/raleigh",
  "refrigerator/north-carolina/raleigh",
  "space-heater/missouri/kansas-city",
  "hot-tub/missouri/kansas-city",
  // Phase 5 final bounded increment — +8 keys (4 new configured-reference cities x 2 appliances)
  "electric-vehicle-charger/indiana/indianapolis",
  "heat-pump/indiana/indianapolis",
  "central-ac/tennessee/nashville",
  "pool-pump/tennessee/nashville",
  "refrigerator/california/san-francisco",
  "hot-tub/california/san-francisco",
  "space-heater/ohio/cleveland",
  "window-ac/ohio/cleveland",
  // Phase 6 bounded re-entry increment — +4 keys (1 new city x 4 high-intent appliances)
  "central-ac/pennsylvania/philadelphia",
  "heat-pump/pennsylvania/philadelphia",
  "electric-vehicle-charger/pennsylvania/philadelphia",
  "window-ac/pennsylvania/philadelphia",
  // Phase 7 second bounded re-entry increment — +4 keys (balance-restoring: 1 key each for 4 underrepresented appliances in high-value single-key cities)
  "refrigerator/texas/houston",
  "space-heater/new-york/new-york-city",
  "pool-pump/california/los-angeles",
  "hot-tub/washington/seattle",
  // Phase 8 third bounded re-entry increment — +4 keys (geographic depth: 1 key each in 4 high-value single-key cities)
  "pool-pump/arizona/phoenix",
  "heat-pump/illinois/chicago",
  "pool-pump/georgia/atlanta",
  "space-heater/colorado/denver",
  // Phase 9 fourth bounded re-entry increment — +4 keys (balance-restoring: 4 underrepresented appliances in climate-appropriate single-key cities)
  "central-ac/texas/dallas",
  "refrigerator/nevada/las-vegas",
  "hot-tub/minnesota/minneapolis",
  "electric-vehicle-charger/massachusetts/boston",
  // Phase 10 fifth bounded re-entry increment — +4 keys (window-ac parity + geographic depth in single-key cities)
  "window-ac/florida/jacksonville",
  "space-heater/michigan/detroit",
  "central-ac/texas/austin",
  "heat-pump/virginia/virginia-beach",
];

export const APPLIANCE_CITY_ROLLOUT_LIMITS = {
  maxAppliances: 8,
  maxCities: 32,
  maxKeys: 60,
} as const;

export type ApplianceCityRolloutPage = {
  applianceSlug: string;
  stateSlug: string;
  citySlug: string;
};

export type CityBillRolloutPage = {
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
  return ACTIVE_APPLIANCE_SLUG_SET.has(value as ApplianceSlug);
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

function parseCityBillPageKey(value: string): CityBillRolloutPage | null {
  const [stateSlug, citySlug, extra] = value.split("/");
  if (!stateSlug || !citySlug || extra) return null;
  return { stateSlug, citySlug };
}

function isValidCityBillPage(page: CityBillRolloutPage): boolean {
  if (!isActiveCityPageKey(page.stateSlug, page.citySlug)) return false;
  const city = CITIES.find((row) => row.stateSlug === page.stateSlug && row.slug === page.citySlug);
  if (!city) return false;
  if (typeof city.avgRateCentsPerKwh !== "number") return false;
  return true;
}

function assertCityBillRolloutLimits(pages: CityBillRolloutPage[]): void {
  const stateCount = new Set(pages.map((page) => page.stateSlug)).size;
  if (pages.length > CITY_BILL_ROLLOUT_LIMITS.maxKeys) {
    throw new Error(
      `ACTIVE_CITY_BILL_PAGE_KEYS exceeds key cap (${pages.length} > ${CITY_BILL_ROLLOUT_LIMITS.maxKeys})`,
    );
  }
  if (stateCount > CITY_BILL_ROLLOUT_LIMITS.maxStates) {
    throw new Error(
      `ACTIVE_CITY_BILL_PAGE_KEYS exceeds state cap (${stateCount} > ${CITY_BILL_ROLLOUT_LIMITS.maxStates})`,
    );
  }
}

export function getActiveCityBillPages(): CityBillRolloutPage[] {
  const pages = ACTIVE_CITY_BILL_PAGE_KEYS
    .map(parseCityBillPageKey)
    .filter((page): page is CityBillRolloutPage => page != null);
  const uniqueKeyCount = new Set(ACTIVE_CITY_BILL_PAGE_KEYS).size;
  if (uniqueKeyCount !== ACTIVE_CITY_BILL_PAGE_KEYS.length) {
    throw new Error("ACTIVE_CITY_BILL_PAGE_KEYS contains duplicate keys");
  }
  const validPages = pages.filter(isValidCityBillPage);
  if (validPages.length !== pages.length) {
    throw new Error("ACTIVE_CITY_BILL_PAGE_KEYS contains invalid or unsupported city bill rollout keys");
  }
  assertCityBillRolloutLimits(validPages);
  return validPages;
}

export function isActiveCityBillPageKey(stateSlug: string, citySlug: string): boolean {
  return getActiveCityBillPages().some(
    (page) => page.stateSlug === stateSlug && page.citySlug === citySlug,
  );
}

export function getActiveCityBillPagesForState(stateSlug: string): CityBillRolloutPage[] {
  return getActiveCityBillPages().filter((page) => page.stateSlug === stateSlug);
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
