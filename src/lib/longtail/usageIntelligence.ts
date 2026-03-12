import {
  APPLIANCE_CONFIGS,
  getApplianceConfig,
  isSupportedApplianceSlug,
  type ApplianceSlug,
} from "@/lib/longtail/applianceConfig";
import { getActiveApplianceSlugs } from "@/lib/longtail/rollout";
import {
  calculateUsageCost,
  formatUsd,
  getLongtailStateStaticParams,
  loadLongtailStateData,
  type LongtailStateData,
} from "@/lib/longtail/stateLongtail";

export const NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH = 899;
export const USAGE_INTELLIGENCE_TIERS = [500, 1000, 1500, 2000] as const;

type ClimateUsageProfile = "low" | "normal" | "high";

export type UsageStateSummary = LongtailStateData & {
  estimatedMonthlyUsageKwh: number;
  estimatedAnnualUsageKwh: number;
  usageVsNationalPercent: number;
};

export type HomeSizeScenario = {
  slug: string;
  label: string;
  squareFeet: number;
  lowKwh: number;
  typicalKwh: number;
  highKwh: number;
  assumptions: string[];
};

export type ApplianceUsageReference = {
  appliance: ApplianceSlug;
  kwhPerHour: number;
  kwhPerDay: number;
  kwhPerMonth: number;
  kwhPerYear: number;
  lowRuntimeHoursPerDay: number;
  highRuntimeHoursPerDay: number;
};

const CLIMATE_HIGH_USAGE_STATES = new Set([
  "texas",
  "florida",
  "arizona",
  "louisiana",
  "mississippi",
  "alabama",
  "georgia",
  "south-carolina",
  "oklahoma",
]);

const CLIMATE_LOW_USAGE_STATES = new Set([
  "california",
  "new-york",
  "massachusetts",
  "new-jersey",
  "rhode-island",
  "connecticut",
  "hawaii",
  "district-of-columbia",
]);

export const HOME_SIZE_SCENARIOS: readonly HomeSizeScenario[] = [
  {
    slug: "1000-sqft",
    label: "1,000 sq ft home electricity usage",
    squareFeet: 1000,
    lowKwh: 550,
    typicalKwh: 750,
    highKwh: 980,
    assumptions: [
      "Smaller conditioned space with fewer large appliances",
      "Moderate heating/cooling profile",
      "Typical occupant count of 1-2 people",
    ],
  },
  {
    slug: "1500-sqft",
    label: "1,500 sq ft home electricity usage",
    squareFeet: 1500,
    lowKwh: 800,
    typicalKwh: 1050,
    highKwh: 1350,
    assumptions: [
      "Balanced household appliance mix",
      "Average HVAC runtime in mixed climate",
      "Typical occupant count of 2-3 people",
    ],
  },
  {
    slug: "2000-sqft",
    label: "2,000 sq ft home electricity usage",
    squareFeet: 2000,
    lowKwh: 1050,
    typicalKwh: 1350,
    highKwh: 1750,
    assumptions: [
      "Larger conditioned space and longer HVAC runtime",
      "More appliance and plug load diversity",
      "Typical occupant count of 3-4 people",
    ],
  },
  {
    slug: "3000-sqft",
    label: "3,000 sq ft home electricity usage",
    squareFeet: 3000,
    lowKwh: 1450,
    typicalKwh: 1900,
    highKwh: 2450,
    assumptions: [
      "High HVAC share from larger floor area",
      "Higher baseline appliance and lighting load",
      "Typical occupant count of 4+ people",
    ],
  },
] as const;

export function getClimateUsageProfile(stateSlug: string): ClimateUsageProfile {
  if (CLIMATE_HIGH_USAGE_STATES.has(stateSlug)) return "high";
  if (CLIMATE_LOW_USAGE_STATES.has(stateSlug)) return "low";
  return "normal";
}

function roundUsage(value: number): number {
  return Math.round(value / 10) * 10;
}

export function estimateStateMonthlyUsageKwh(state: LongtailStateData): number {
  const rateDiffPercent = state.differencePercent ?? 0;
  const rateAdjustment = 1 - rateDiffPercent * 0.0022;
  const climateProfile = getClimateUsageProfile(state.slug);
  const climateAdjustment = climateProfile === "high" ? 1.12 : climateProfile === "low" ? 0.92 : 1;
  const usage = NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH * rateAdjustment * climateAdjustment;
  return roundUsage(Math.min(1650, Math.max(550, usage)));
}

export function formatKwh(value: number): string {
  return `${value.toLocaleString()} kWh`;
}

export function getHomeSizeScenario(slug: string): HomeSizeScenario | null {
  return HOME_SIZE_SCENARIOS.find((scenario) => scenario.slug === slug) ?? null;
}

export function getHomeSizeStaticParams(): Array<{ size: string }> {
  return HOME_SIZE_SCENARIOS.map((scenario) => ({ size: scenario.slug }));
}

export async function getUsageStateStaticParams(): Promise<Array<{ state: string }>> {
  return getLongtailStateStaticParams();
}

export async function loadUsageStateSummary(slug: string): Promise<UsageStateSummary | null> {
  const state = await loadLongtailStateData(slug);
  if (!state) return null;
  const estimatedMonthlyUsageKwh = estimateStateMonthlyUsageKwh(state);
  const estimatedAnnualUsageKwh = estimatedMonthlyUsageKwh * 12;
  const usageVsNationalPercent =
    ((estimatedMonthlyUsageKwh - NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH) / NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH) * 100;

  return {
    ...state,
    estimatedMonthlyUsageKwh,
    estimatedAnnualUsageKwh,
    usageVsNationalPercent,
  };
}

export async function loadAllUsageStateSummaries(): Promise<UsageStateSummary[]> {
  const states = await getLongtailStateStaticParams();
  const rows = await Promise.all(states.map(({ state }) => loadUsageStateSummary(state)));
  return rows
    .filter((row): row is UsageStateSummary => row != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildUsageTierCostRows(state: UsageStateSummary): Array<{
  kwh: number;
  monthlyCost: number | null;
  annualCost: number | null;
  href: string;
}> {
  return USAGE_INTELLIGENCE_TIERS.map((kwh) => {
    const monthlyCost = calculateUsageCost(state.avgRateCentsPerKwh, kwh);
    return {
      kwh,
      monthlyCost,
      annualCost: monthlyCost != null ? monthlyCost * 12 : null,
      href: `/electricity-usage-cost/${kwh}/${state.slug}`,
    };
  });
}

export function buildHomeSizeCostRows(
  scenario: HomeSizeScenario,
  rateCentsPerKwh: number | null,
): Array<{
  label: string;
  monthlyKwh: number;
  monthlyCost: number | null;
  annualCost: number | null;
}> {
  return [
    { label: "Low usage pattern", monthlyKwh: scenario.lowKwh },
    { label: "Typical usage pattern", monthlyKwh: scenario.typicalKwh },
    { label: "High usage pattern", monthlyKwh: scenario.highKwh },
  ].map((row) => {
    const monthlyCost = calculateUsageCost(rateCentsPerKwh, row.monthlyKwh);
    return {
      ...row,
      monthlyCost,
      annualCost: monthlyCost != null ? monthlyCost * 12 : null,
    };
  });
}

export function getUsageApplianceStaticParams(): Array<{ appliance: string }> {
  const activeSlugs = new Set(getActiveApplianceSlugs());
  return APPLIANCE_CONFIGS.filter((appliance) => activeSlugs.has(appliance.slug)).map((appliance) => ({
    appliance: appliance.slug,
  }));
}

export function parseUsageApplianceSlug(value: string): ApplianceSlug | null {
  if (!isSupportedApplianceSlug(value)) return null;
  return value;
}

export function getApplianceUsageReference(applianceSlug: ApplianceSlug): ApplianceUsageReference {
  const appliance = getApplianceConfig(applianceSlug);
  const kwhPerHour = appliance.averageWattage / 1000;
  const kwhPerDay = kwhPerHour * appliance.typicalUsageHoursPerDay;
  const kwhPerMonth = kwhPerDay * 30;
  const kwhPerYear = kwhPerDay * 365;
  return {
    appliance: applianceSlug,
    kwhPerHour,
    kwhPerDay,
    kwhPerMonth,
    kwhPerYear,
    lowRuntimeHoursPerDay: Math.max(0.5, appliance.typicalUsageHoursPerDay * 0.5),
    highRuntimeHoursPerDay: Math.min(24, Math.max(appliance.typicalUsageHoursPerDay + 2, appliance.typicalUsageHoursPerDay * 1.5)),
  };
}

export function buildUsageNarrativeForState(state: UsageStateSummary): string {
  const direction = state.usageVsNationalPercent >= 0 ? "above" : "below";
  return `${state.name} is modeled at ${formatKwh(
    state.estimatedMonthlyUsageKwh,
  )} per month, about ${Math.abs(state.usageVsNationalPercent).toFixed(1)}% ${direction} the U.S. household benchmark of ${formatKwh(
    NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH,
  )}. At ${state.avgRateCentsPerKwh != null ? `${state.avgRateCentsPerKwh.toFixed(2)} ¢/kWh` : "the available state rate"}, that usage translates to roughly ${formatUsd(
    calculateUsageCost(state.avgRateCentsPerKwh, state.estimatedMonthlyUsageKwh),
  )} per month.`;
}
