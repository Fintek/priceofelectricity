import {
  type AverageBillStateSummary,
  loadAllAverageBillStateSummaries,
  loadAverageBillStateSummary,
} from "@/lib/longtail/averageBill";
import { calculateUsageCost, formatUsd } from "@/lib/longtail/stateLongtail";
import {
  emitLongtailData,
  elapsedMs,
  startRuntimeTimer,
} from "@/lib/telemetry/runtime";

export type BillEstimatorProfile = {
  slug: string;
  label: string;
  defaultMonthlyKwh: number;
  monthlyKwhRange: { low: number; high: number };
  usageBehavior: string;
  variabilityNote: string;
};

export const BILL_ESTIMATOR_PROFILES: readonly BillEstimatorProfile[] = [
  {
    slug: "apartment",
    label: "Apartment",
    defaultMonthlyKwh: 650,
    monthlyKwhRange: { low: 450, high: 850 },
    usageBehavior: "Smaller conditioned space with fewer major electric loads and moderate HVAC runtime.",
    variabilityNote: "Usage may rise with electric resistance heating, older HVAC, or high summer cooling demand.",
  },
  {
    slug: "small-home",
    label: "Small Home",
    defaultMonthlyKwh: 900,
    monthlyKwhRange: { low: 700, high: 1150 },
    usageBehavior: "Typical small detached home profile with balanced appliance and HVAC usage.",
    variabilityNote: "Bills vary with occupancy, insulation quality, and electric water-heating share.",
  },
  {
    slug: "medium-home",
    label: "Medium Home",
    defaultMonthlyKwh: 1200,
    monthlyKwhRange: { low: 950, high: 1500 },
    usageBehavior: "Moderate-to-higher whole-home usage from larger floor area and longer HVAC operation.",
    variabilityNote: "High cooling or winter electric heating can move usage above the modeled range.",
  },
  {
    slug: "large-home",
    label: "Large Home",
    defaultMonthlyKwh: 1600,
    monthlyKwhRange: { low: 1300, high: 2100 },
    usageBehavior: "Higher household electricity demand from larger conditioned area and greater appliance intensity.",
    variabilityNote: "Pool pumps, EV charging, and intensive cooling can materially increase monthly usage.",
  },
] as const;

export type BillEstimatorProfileSlug = (typeof BILL_ESTIMATOR_PROFILES)[number]["slug"];
type BillEstimatorTelemetryOptions = {
  contextLabel?: string;
};
let memoizedAllStateSummariesPromise: Promise<AverageBillStateSummary[]> | null = null;

function getMemoizedAllBillEstimatorStateSummaries(
  options?: BillEstimatorTelemetryOptions,
): Promise<AverageBillStateSummary[]> {
  if (!memoizedAllStateSummariesPromise) {
    memoizedAllStateSummariesPromise = loadAllAverageBillStateSummaries({
      contextLabel: options?.contextLabel,
    });
  }
  return memoizedAllStateSummariesPromise;
}

export function isBillEstimatorProfileSlug(value: string): value is BillEstimatorProfileSlug {
  return BILL_ESTIMATOR_PROFILES.some((profile) => profile.slug === value);
}

export function getBillEstimatorProfile(slug: string): BillEstimatorProfile | null {
  return BILL_ESTIMATOR_PROFILES.find((profile) => profile.slug === slug) ?? null;
}

export async function getBillEstimatorStateStaticParams(
  options?: BillEstimatorTelemetryOptions,
): Promise<Array<{ slug: string }>> {
  const startedAt = startRuntimeTimer();
  const loadStartedAt = startRuntimeTimer();
  const states = await getMemoizedAllBillEstimatorStateSummaries(options);
  const loadAllMs = elapsedMs(loadStartedAt);
  const mapStartedAt = startRuntimeTimer();
  const rows = states.map((state) => ({ slug: state.slug }));
  const mapMs = elapsedMs(mapStartedAt);
  emitLongtailData({
    targetId: "billEstimator",
    operation: "getBillEstimatorStateStaticParams",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    sampleMeta: {
      load_all_states_ms: loadAllMs,
      map_ms: mapMs,
      state_count: rows.length,
    },
  });
  return rows;
}

export async function getBillEstimatorProfileStaticParams(): Promise<
  Array<{ slug: string; profile: BillEstimatorProfileSlug }>
> {
  const startedAt = startRuntimeTimer();
  const stateParamsStartedAt = startRuntimeTimer();
  const states = await getBillEstimatorStateStaticParams();
  const stateParamsMs = elapsedMs(stateParamsStartedAt);
  const flatMapStartedAt = startRuntimeTimer();
  const rows = states.flatMap(({ slug }) =>
    BILL_ESTIMATOR_PROFILES.map((profile) => ({
      slug,
      profile: profile.slug,
    })),
  );
  const flatMapMs = elapsedMs(flatMapStartedAt);
  emitLongtailData({
    targetId: "billEstimator",
    operation: "getBillEstimatorProfileStaticParams",
    durationMs: elapsedMs(startedAt),
    sampleMeta: {
      state_params_ms: stateParamsMs,
      flatmap_ms: flatMapMs,
      state_count: states.length,
      profile_count: BILL_ESTIMATOR_PROFILES.length,
      row_count: rows.length,
    },
  });
  return rows;
}

export function calculateBillEstimatorProfileMonthlyCost(
  stateRateCentsPerKwh: number | null,
  profile: BillEstimatorProfile,
): number | null {
  return calculateUsageCost(stateRateCentsPerKwh, profile.defaultMonthlyKwh);
}

export function buildBillEstimatorProfileRows(state: AverageBillStateSummary): Array<{
  profile: BillEstimatorProfile;
  monthlyCost: number | null;
  annualCost: number | null;
  href: string;
}> {
  return BILL_ESTIMATOR_PROFILES.map((profile) => {
    const monthlyCost = calculateBillEstimatorProfileMonthlyCost(state.avgRateCentsPerKwh, profile);
    return {
      profile,
      monthlyCost,
      annualCost: monthlyCost != null ? monthlyCost * 12 : null,
      href: `/electricity-bill-estimator/${state.slug}/${profile.slug}`,
    };
  });
}

export async function loadBillEstimatorStateSummary(
  slug: string,
  options?: BillEstimatorTelemetryOptions,
): Promise<AverageBillStateSummary | null> {
  const startedAt = startRuntimeTimer();
  const delegateStartedAt = startRuntimeTimer();
  const state = await loadAverageBillStateSummary(slug, { contextLabel: options?.contextLabel });
  const delegateMs = elapsedMs(delegateStartedAt);
  emitLongtailData({
    targetId: "billEstimator",
    operation: "loadBillEstimatorStateSummary",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    stateSlug: slug,
    sampleMeta: {
      delegate_ms: delegateMs,
      found_state: state != null,
    },
  });
  return state;
}

export async function loadAllBillEstimatorStateSummaries(
  options?: BillEstimatorTelemetryOptions,
): Promise<AverageBillStateSummary[]> {
  const startedAt = startRuntimeTimer();
  const delegateStartedAt = startRuntimeTimer();
  const states = await getMemoizedAllBillEstimatorStateSummaries(options);
  const delegateMs = elapsedMs(delegateStartedAt);
  emitLongtailData({
    targetId: "billEstimator",
    operation: "loadAllBillEstimatorStateSummaries",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    sampleMeta: {
      delegate_ms: delegateMs,
      state_count: states.length,
    },
  });
  return states;
}

export function buildBillEstimatorMethodologyNote(profile: BillEstimatorProfile): string {
  return `This deterministic scenario applies ${profile.defaultMonthlyKwh.toLocaleString()} kWh/month for the ${profile.label.toLowerCase()} profile and excludes delivery fees, taxes, and fixed utility charges.`;
}

export function buildBillEstimatorDifferenceVsBenchmark(
  profileMonthlyCost: number | null,
  benchmarkMonthlyCost: number | null,
): string {
  if (profileMonthlyCost == null || benchmarkMonthlyCost == null) return "N/A";
  const diff = profileMonthlyCost - benchmarkMonthlyCost;
  const direction = diff >= 0 ? "higher" : "lower";
  return `${formatUsd(Math.abs(diff))} ${direction}`;
}
