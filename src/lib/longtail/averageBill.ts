import { FEATURED_APPLIANCE_SLUGS, getApplianceConfig } from "@/lib/longtail/applianceConfig";
import { loadCityElectricitySummary, type CityEstimateBasis } from "@/lib/longtail/cityElectricity";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import {
  calculateUsageCost,
  formatRate,
  formatUsd,
  getLongtailStateStaticParams,
  loadLongtailStateData,
  type LongtailStateData,
} from "@/lib/longtail/stateLongtail";
import { getActiveCityBillPages, isActiveCityBillPageKey } from "@/lib/longtail/rollout";
import {
  emitLongtailData,
  elapsedMs,
  startRuntimeTimer,
} from "@/lib/telemetry/runtime";
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

export type AverageBillCitySummary = {
  state: AverageBillStateSummary;
  city: {
    slug: string;
    name: string;
  };
  cityRateCentsPerKwh: number;
  stateRateCentsPerKwh: number;
  cityMonthlyBill: number;
  cityAnnualBill: number;
  monthlyDifferenceVsState: number;
  estimateBasis: CityEstimateBasis;
  estimateMethodNote: string;
};

type AverageBillTelemetryOptions = {
  contextLabel?: string;
};
type AllAverageBillSummariesComputation = {
  rows: AverageBillStateSummary[];
  staticParamsMs: number;
  fanoutLoadMs: number;
  finalizeMs: number;
  fanoutCount: number;
};
let memoizedAllAverageBillSummariesPromise: Promise<AllAverageBillSummariesComputation> | null = null;

export async function getAverageBillStaticParams(
  options?: AverageBillTelemetryOptions,
): Promise<Array<{ slug: string }>> {
  const startedAt = startRuntimeTimer();
  let longtailParamsMs = 0;
  let mapMs = 0;
  const longtailStartedAt = startRuntimeTimer();
  const states = await getLongtailStateStaticParams({ contextLabel: options?.contextLabel });
  longtailParamsMs = elapsedMs(longtailStartedAt);
  const mapStartedAt = startRuntimeTimer();
  const rows = states.map(({ state }) => ({ slug: state }));
  mapMs = elapsedMs(mapStartedAt);
  emitLongtailData({
    targetId: "averageBill",
    operation: "getAverageBillStaticParams",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    sampleMeta: {
      longtail_params_ms: longtailParamsMs,
      map_ms: mapMs,
      state_count: rows.length,
    },
  });
  return rows;
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

async function computeAllAverageBillStateSummaries(
  options?: AverageBillTelemetryOptions,
): Promise<AllAverageBillSummariesComputation> {
  let staticParamsMs = 0;
  let fanoutLoadMs = 0;
  let finalizeMs = 0;
  const staticParamsStartedAt = startRuntimeTimer();
  const states = await getLongtailStateStaticParams({ contextLabel: options?.contextLabel });
  staticParamsMs = elapsedMs(staticParamsStartedAt);
  const sharedNationalPagePromise = loadKnowledgePage("national", "national");
  const fanoutLoadStartedAt = startRuntimeTimer();
  const rows = await Promise.all(
    states.map(async ({ state }) => {
      const startedAtForState = startRuntimeTimer();
      const longtailState = await loadLongtailStateData(
        state,
        { contextLabel: options?.contextLabel },
        { nationalPagePromise: sharedNationalPagePromise },
      );
      const stateLoadMs = elapsedMs(startedAtForState);
      if (!longtailState) {
        emitLongtailData({
          targetId: "averageBill",
          operation: "loadAverageBillStateSummary",
          durationMs: stateLoadMs,
          contextLabel: options?.contextLabel,
          stateSlug: state,
          sampleMeta: {
            state_load_ms: stateLoadMs,
            compute_ms: 0,
            found_state: false,
          },
        });
        return null;
      }
      const computeStartedAt = startRuntimeTimer();
      const monthlyBill = calculateAverageElectricityBill(longtailState.avgRateCentsPerKwh);
      const annualBill =
        monthlyBill != null
          ? monthlyBill * 12
          : calculateAverageElectricityBill(longtailState.avgRateCentsPerKwh, 10800);
      const nationalMonthlyBill = calculateAverageElectricityBill(longtailState.nationalAverageCentsPerKwh);
      const monthlyDifference =
        monthlyBill != null && nationalMonthlyBill != null ? monthlyBill - nationalMonthlyBill : null;
      const monthlyDifferencePercent =
        monthlyDifference != null && nationalMonthlyBill != null && nationalMonthlyBill > 0
          ? (monthlyDifference / nationalMonthlyBill) * 100
          : null;
      const computeMs = elapsedMs(computeStartedAt);
      const result: AverageBillStateSummary = {
        ...longtailState,
        monthlyBill,
        annualBill,
        nationalMonthlyBill,
        monthlyDifference,
        monthlyDifferencePercent,
      };
      emitLongtailData({
        targetId: "averageBill",
        operation: "loadAverageBillStateSummary",
        durationMs: elapsedMs(startedAtForState),
        contextLabel: options?.contextLabel,
        stateSlug: state,
        sampleMeta: {
          state_load_ms: stateLoadMs,
          compute_ms: computeMs,
          found_state: true,
        },
      });
      return result;
    }),
  );
  fanoutLoadMs = elapsedMs(fanoutLoadStartedAt);
  const finalizeStartedAt = startRuntimeTimer();
  const result = rows
    .filter((row): row is AverageBillStateSummary => row != null)
    .sort((a, b) => a.name.localeCompare(b.name));
  finalizeMs = elapsedMs(finalizeStartedAt);
  return {
    rows: result,
    staticParamsMs,
    fanoutLoadMs,
    finalizeMs,
    fanoutCount: states.length,
  };
}

function getMemoizedAllAverageBillStateSummaries(
  options?: AverageBillTelemetryOptions,
): { promise: Promise<AllAverageBillSummariesComputation>; cacheHit: boolean } {
  if (!memoizedAllAverageBillSummariesPromise) {
    memoizedAllAverageBillSummariesPromise = computeAllAverageBillStateSummaries(options).catch((error) => {
      memoizedAllAverageBillSummariesPromise = null;
      throw error;
    });
    return { promise: memoizedAllAverageBillSummariesPromise, cacheHit: false };
  }
  return { promise: memoizedAllAverageBillSummariesPromise, cacheHit: true };
}

export async function loadAverageBillStateSummary(
  slug: string,
  options?: AverageBillTelemetryOptions,
): Promise<AverageBillStateSummary | null> {
  const startedAt = startRuntimeTimer();
  let stateLoadMs = 0;
  let computeMs = 0;
  const stateLoadStartedAt = startRuntimeTimer();
  const state = await loadLongtailStateData(slug, { contextLabel: options?.contextLabel });
  stateLoadMs = elapsedMs(stateLoadStartedAt);
  if (!state) {
    emitLongtailData({
      targetId: "averageBill",
      operation: "loadAverageBillStateSummary",
      durationMs: elapsedMs(startedAt),
      contextLabel: options?.contextLabel,
      stateSlug: slug,
      sampleMeta: {
        state_load_ms: stateLoadMs,
        compute_ms: computeMs,
        found_state: false,
      },
    });
    return null;
  }

  const computeStartedAt = startRuntimeTimer();
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
  computeMs = elapsedMs(computeStartedAt);

  const result = {
    ...state,
    monthlyBill,
    annualBill,
    nationalMonthlyBill,
    monthlyDifference,
    monthlyDifferencePercent,
  };
  emitLongtailData({
    targetId: "averageBill",
    operation: "loadAverageBillStateSummary",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    stateSlug: slug,
    sampleMeta: {
      state_load_ms: stateLoadMs,
      compute_ms: computeMs,
      found_state: true,
    },
  });
  return result;
}

export async function loadAllAverageBillStateSummaries(
  options?: AverageBillTelemetryOptions,
): Promise<AverageBillStateSummary[]> {
  const startedAt = startRuntimeTimer();
  const delegateStartedAt = startRuntimeTimer();
  const { promise, cacheHit } = getMemoizedAllAverageBillStateSummaries(options);
  const computed = await promise;
  const delegateMs = elapsedMs(delegateStartedAt);
  emitLongtailData({
    targetId: "averageBill",
    operation: "loadAllAverageBillStateSummaries",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    sampleMeta: {
      static_params_ms: computed.staticParamsMs,
      fanout_load_ms: computed.fanoutLoadMs,
      finalize_ms: computed.finalizeMs,
      fanout_count: computed.fanoutCount,
      result_count: computed.rows.length,
      delegate_ms: delegateMs,
      cache_hit: cacheHit,
    },
  });
  return computed.rows;
}

export function getAverageBillCityStaticParams(): Array<{ slug: string; city: string }> {
  return getActiveCityBillPages().map((entry) => ({
    slug: entry.stateSlug,
    city: entry.citySlug,
  }));
}

export async function loadAverageBillCitySummary(
  stateSlug: string,
  citySlug: string,
  options?: AverageBillTelemetryOptions,
): Promise<AverageBillCitySummary | null> {
  const startedAt = startRuntimeTimer();
  if (!isActiveCityBillPageKey(stateSlug, citySlug)) {
    return null;
  }
  const [stateSummary, citySummary] = await Promise.all([
    loadAverageBillStateSummary(stateSlug, options),
    loadCityElectricitySummary(stateSlug, citySlug),
  ]);
  if (!stateSummary || !citySummary) {
    return null;
  }
  const result: AverageBillCitySummary = {
    state: stateSummary,
    city: {
      slug: citySummary.city.slug,
      name: citySummary.city.name,
    },
    cityRateCentsPerKwh: citySummary.cityRateCentsPerKwh,
    stateRateCentsPerKwh: citySummary.stateRateCentsPerKwh,
    cityMonthlyBill: citySummary.monthlyCostEstimate,
    cityAnnualBill: citySummary.annualCostEstimate,
    monthlyDifferenceVsState: citySummary.monthlyDifferenceVsState,
    estimateBasis: citySummary.estimateBasis,
    estimateMethodNote: citySummary.estimateMethodNote,
  };
  emitLongtailData({
    targetId: "averageBill",
    operation: "loadAverageBillCitySummary",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    stateSlug,
    sampleMeta: {
      found_city: true,
      city_slug: citySlug,
      estimate_basis: result.estimateBasis,
    },
  });
  return result;
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
