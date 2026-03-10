import { FEATURED_APPLIANCE_SLUGS, getApplianceConfig } from "@/lib/longtail/applianceConfig";
import {
  calculateUsageCost,
  formatRate,
  formatUsd,
  getLongtailStateStaticParams,
  loadLongtailStateData,
  type LongtailStateData,
} from "@/lib/longtail/stateLongtail";
import { getCanonicalUsageCostPath } from "@/lib/longtail/usageEntryRoutes";

export const AVERAGE_ELECTRICITY_BILL_USAGE_KWH = 900;
export const AVERAGE_ELECTRICITY_BILL_USAGE_EXAMPLES = [500, 1000, 1500, 2000] as const;

export type AverageBillUsageExample = {
  kwh: number;
  cost: number | null;
  href: string;
  consumerLabel: string;
};

export type AverageBillApplianceLink = {
  href: string;
  label: string;
  description: string;
};

export type AverageBillStateSummary = LongtailStateData & {
  monthlyBill: number | null;
  annualBill: number | null;
  nationalMonthlyBill: number | null;
  monthlyDifference: number | null;
  monthlyDifferencePercent: number | null;
};

export async function getAverageBillStaticParams(): Promise<Array<{ slug: string }>> {
  const states = await getLongtailStateStaticParams();
  return states.map(({ state }) => ({ slug: state }));
}

export function calculateAverageElectricityBill(
  avgRateCentsPerKwh: number | null,
  usageKwh = AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
): number | null {
  return calculateUsageCost(avgRateCentsPerKwh, usageKwh);
}

export function buildAverageBillUsageExamples(state: AverageBillStateSummary): AverageBillUsageExample[] {
  return AVERAGE_ELECTRICITY_BILL_USAGE_EXAMPLES.map((kwh) => ({
    kwh,
    cost: calculateUsageCost(state.avgRateCentsPerKwh, kwh),
    href: getCanonicalUsageCostPath(kwh, state.slug),
    consumerLabel: `How much does ${kwh.toLocaleString()} kWh cost in ${state.name}?`,
  }));
}

export function buildAverageBillApplianceLinks(
  state: AverageBillStateSummary,
  limit = FEATURED_APPLIANCE_SLUGS.length,
): AverageBillApplianceLink[] {
  return FEATURED_APPLIANCE_SLUGS.slice(0, limit).map((slug) => {
    const appliance = getApplianceConfig(slug);
    return {
      href: `/cost-to-run/${slug}/${state.slug}`,
      label: `${appliance.displayName} cost in ${state.name}`,
      description: `See what ${appliance.averageWattage.toLocaleString()} W of typical ${appliance.displayName.toLowerCase()} usage looks like at ${formatRate(state.avgRateCentsPerKwh)}.`,
    };
  });
}

export async function loadAverageBillStateSummary(slug: string): Promise<AverageBillStateSummary | null> {
  const state = await loadLongtailStateData(slug);
  if (!state) return null;

  const monthlyBill = calculateAverageElectricityBill(state.avgRateCentsPerKwh);
  const annualBill =
    monthlyBill != null ? monthlyBill * 12 : calculateAverageElectricityBill(state.avgRateCentsPerKwh, 10800);
  const nationalMonthlyBill = calculateAverageElectricityBill(state.nationalAverageCentsPerKwh);
  const monthlyDifference =
    monthlyBill != null && nationalMonthlyBill != null ? monthlyBill - nationalMonthlyBill : null;
  const monthlyDifferencePercent =
    monthlyDifference != null && nationalMonthlyBill != null && nationalMonthlyBill > 0
      ? (monthlyDifference / nationalMonthlyBill) * 100
      : null;

  return {
    ...state,
    monthlyBill,
    annualBill,
    nationalMonthlyBill,
    monthlyDifference,
    monthlyDifferencePercent,
  };
}

export async function loadAllAverageBillStateSummaries(): Promise<AverageBillStateSummary[]> {
  const states = await getLongtailStateStaticParams();
  const rows = await Promise.all(states.map(({ state }) => loadAverageBillStateSummary(state)));
  return rows
    .filter((row): row is AverageBillStateSummary => row != null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function sortAverageBillStates(
  states: AverageBillStateSummary[],
  direction: "asc" | "desc",
): AverageBillStateSummary[] {
  return [...states].sort((a, b) => {
    const billA = a.monthlyBill ?? (direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    const billB = b.monthlyBill ?? (direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
    return direction === "asc" ? billA - billB : billB - billA;
  });
}

export function buildAverageBillComparisonSummary(state: AverageBillStateSummary): string | undefined {
  if (state.monthlyDifference == null || state.monthlyDifferencePercent == null) return undefined;
  const direction = state.monthlyDifference >= 0 ? "higher" : "lower";
  return `${state.name}'s typical residential bill estimate is ${direction} than the U.S. average by ${formatUsd(
    Math.abs(state.monthlyDifference),
  )} per month (${Math.abs(state.monthlyDifferencePercent).toFixed(1)}%).`;
}

export function buildAverageBillRankingRows(states: AverageBillStateSummary[]): Array<{
  rank: number;
  slug: string;
  name: string;
  monthlyBill: string;
  rate: string;
}> {
  return sortAverageBillStates(states, "desc").map((state, index) => ({
    rank: index + 1,
    slug: state.slug,
    name: state.name,
    monthlyBill: formatUsd(state.monthlyBill),
    rate: formatRate(state.avgRateCentsPerKwh),
  }));
}
