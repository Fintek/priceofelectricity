import { CITIES, type City } from "@/data/cities";
import {
  getActiveCityPages,
  getActiveApplianceCityPages,
  isActiveCityPageKey,
  isActiveApplianceCityPageKey,
} from "@/lib/longtail/rollout";
import {
  calculateApplianceOperatingCost,
  type ApplianceOperatingCost,
} from "@/lib/longtail/applianceLongtail";
import { getApplianceConfig, isSupportedApplianceSlug, type ApplianceSlug } from "@/lib/longtail/applianceConfig";
import {
  calculateUsageCost,
  loadLongtailStateData,
  type LongtailStateData,
} from "@/lib/longtail/stateLongtail";

export const CITY_REFERENCE_USAGE_KWH = 900;

const CITY_POPULATION_MODIFIER_RULES: Array<{
  minPopulation: number;
  multiplier: number;
}> = [
  { minPopulation: 3_000_000, multiplier: 1.06 },
  { minPopulation: 1_000_000, multiplier: 1.04 },
  { minPopulation: 500_000, multiplier: 1.02 },
  { minPopulation: 250_000, multiplier: 1.01 },
];

export type CityEstimateBasis = "city-config-reference" | "modeled-from-state";

export type CityElectricitySummary = {
  city: City;
  state: LongtailStateData;
  cityRateCentsPerKwh: number;
  stateRateCentsPerKwh: number;
  nationalRateCentsPerKwh: number | null;
  monthlyCostEstimate: number;
  annualCostEstimate: number;
  stateMonthlyCostEstimate: number;
  monthlyDifferenceVsState: number;
  estimateBasis: CityEstimateBasis;
  estimateMethodNote: string;
};

export type ApplianceCityElectricitySummary = {
  applianceSlug: ApplianceSlug;
  applianceConfig: ReturnType<typeof getApplianceConfig>;
  citySummary: CityElectricitySummary;
  applianceUsage: ApplianceOperatingCost;
  cityMonthlyCostEstimate: number | null;
  cityYearlyCostEstimate: number | null;
  stateMonthlyCostEstimate: number | null;
  monthlyDifferenceVsState: number | null;
  nationalMonthlyCostEstimate: number | null;
};

function getPopulationModifier(population: number | undefined): number {
  if (!population || population <= 0) return 1;
  for (const rule of CITY_POPULATION_MODIFIER_RULES) {
    if (population >= rule.minPopulation) {
      return rule.multiplier;
    }
  }
  return 1;
}

export function getCityRolloutStaticParams(): Array<{ state: string; city: string }> {
  return getActiveCityPages().map((city) => ({
    state: city.stateSlug,
    city: city.slug,
  }));
}

export function resolveCityFromRoute(stateSlug: string, citySlug: string): City | null {
  return (
    CITIES.find((city) => city.stateSlug === stateSlug && city.slug === citySlug) ?? null
  );
}

export async function loadCityElectricitySummary(
  stateSlug: string,
  citySlug: string,
): Promise<CityElectricitySummary | null> {
  if (!isActiveCityPageKey(stateSlug, citySlug)) return null;

  const city = resolveCityFromRoute(stateSlug, citySlug);
  if (!city) return null;

  const state = await loadLongtailStateData(stateSlug);
  if (!state) return null;

  const stateRate = state.avgRateCentsPerKwh;
  if (stateRate == null) return null;

  const hasCityConfigRate = typeof city.avgRateCentsPerKwh === "number";
  const modeledRate = stateRate * getPopulationModifier(city.population);
  const cityRateCentsPerKwh = hasCityConfigRate ? city.avgRateCentsPerKwh ?? null : modeledRate;
  if (cityRateCentsPerKwh == null) return null;

  const monthlyCostEstimate = (cityRateCentsPerKwh / 100) * CITY_REFERENCE_USAGE_KWH;
  const annualCostEstimate = monthlyCostEstimate * 12;
  const stateMonthlyCostEstimate = (stateRate / 100) * CITY_REFERENCE_USAGE_KWH;

  const estimateBasis: CityEstimateBasis = hasCityConfigRate
    ? "city-config-reference"
    : "modeled-from-state";

  const estimateMethodNote =
    estimateBasis === "city-config-reference"
      ? "City configured reference rate when available; still an estimate for comparison context."
      : "Modeled estimate derived from state average rate with deterministic population-based modifier.";

  return {
    city,
    state,
    cityRateCentsPerKwh,
    stateRateCentsPerKwh: stateRate,
    nationalRateCentsPerKwh: state.nationalAverageCentsPerKwh,
    monthlyCostEstimate,
    annualCostEstimate,
    stateMonthlyCostEstimate,
    monthlyDifferenceVsState: monthlyCostEstimate - stateMonthlyCostEstimate,
    estimateBasis,
    estimateMethodNote,
  };
}

export async function loadActiveCityElectricitySummariesForState(
  stateSlug: string,
): Promise<CityElectricitySummary[]> {
  const cities = getActiveCityPages()
    .filter((city) => city.stateSlug === stateSlug)
    .sort((a, b) => (b.population ?? 0) - (a.population ?? 0));

  const rows = await Promise.all(
    cities.map((city) => loadCityElectricitySummary(city.stateSlug, city.slug)),
  );

  return rows.filter((row): row is CityElectricitySummary => row != null);
}

export function getApplianceCityRolloutStaticParams(): Array<{
  appliance: string;
  state: string;
  city: string;
}> {
  return getActiveApplianceCityPages().map((page) => ({
    appliance: page.applianceSlug,
    state: page.stateSlug,
    city: page.citySlug,
  }));
}

export async function loadApplianceCityElectricitySummary(
  applianceSlugRaw: string,
  stateSlug: string,
  citySlug: string,
): Promise<ApplianceCityElectricitySummary | null> {
  if (!isSupportedApplianceSlug(applianceSlugRaw)) return null;
  const applianceSlug = applianceSlugRaw as ApplianceSlug;
  if (!isActiveApplianceCityPageKey(applianceSlug, stateSlug, citySlug)) return null;

  const citySummary = await loadCityElectricitySummary(stateSlug, citySlug);
  if (!citySummary) return null;

  const applianceConfig = getApplianceConfig(applianceSlug);
  const applianceUsage = calculateApplianceOperatingCost(null, applianceConfig);

  const cityMonthlyCostEstimate = calculateUsageCost(
    citySummary.cityRateCentsPerKwh,
    applianceUsage.kwhPerMonth,
  );
  const cityYearlyCostEstimate = calculateUsageCost(
    citySummary.cityRateCentsPerKwh,
    applianceUsage.kwhPerYear,
  );
  const stateMonthlyCostEstimate = calculateUsageCost(
    citySummary.stateRateCentsPerKwh,
    applianceUsage.kwhPerMonth,
  );
  const nationalMonthlyCostEstimate = calculateUsageCost(
    citySummary.nationalRateCentsPerKwh,
    applianceUsage.kwhPerMonth,
  );

  const monthlyDifferenceVsState =
    cityMonthlyCostEstimate != null && stateMonthlyCostEstimate != null
      ? cityMonthlyCostEstimate - stateMonthlyCostEstimate
      : null;

  return {
    applianceSlug,
    applianceConfig,
    citySummary,
    applianceUsage,
    cityMonthlyCostEstimate,
    cityYearlyCostEstimate,
    stateMonthlyCostEstimate,
    monthlyDifferenceVsState,
    nationalMonthlyCostEstimate,
  };
}
