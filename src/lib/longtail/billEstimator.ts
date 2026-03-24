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

/**
 * Explicit rollout keys for estimator profile pages.
 *
 * Key format: `${stateSlug}/${profileSlug}`
 *
 * Phase 2 keeps profile routes deferred by default for payload safety.
 * Add keys intentionally in later phases after verification.
 */
export const ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS: readonly string[] = [
  "california/apartment",
  "california/small-home",
  "california/medium-home",
  "california/large-home",
  "florida/apartment",
  "florida/small-home",
  "florida/medium-home",
  "florida/large-home",
  "texas/apartment",
  "texas/small-home",
  "texas/medium-home",
  "texas/large-home",
];
/**
 * Phase 4 keeps estimator profile rollout intentionally small and reviewable.
 * Future expansion should raise these limits only after payload and sitemap review.
 */
export const BILL_ESTIMATOR_PROFILE_ROLLOUT_LIMITS = {
  maxStates: 3,
  maxKeys: 12,
} as const;

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

export function buildBillEstimatorProfilePageKey(
  stateSlug: string,
  profileSlug: BillEstimatorProfileSlug,
): string {
  return `${stateSlug}/${profileSlug}`;
}

function parseBillEstimatorProfilePageKey(
  value: string,
): { slug: string; profile: BillEstimatorProfileSlug } | null {
  const [slug, profile, extra] = value.split("/");
  if (!slug || !profile || extra) return null;
  if (!isBillEstimatorProfileSlug(profile)) return null;
  return { slug, profile };
}

export function getActiveBillEstimatorProfilePages(): Array<{
  slug: string;
  profile: BillEstimatorProfileSlug;
}> {
  const rows = ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS
    .map(parseBillEstimatorProfilePageKey)
    .filter((item): item is { slug: string; profile: BillEstimatorProfileSlug } => item != null);
  const activeStateCount = new Set(rows.map((row) => row.slug)).size;
  if (rows.length > BILL_ESTIMATOR_PROFILE_ROLLOUT_LIMITS.maxKeys) {
    throw new Error(
      `ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS exceeds key cap (${rows.length} > ${BILL_ESTIMATOR_PROFILE_ROLLOUT_LIMITS.maxKeys})`,
    );
  }
  if (activeStateCount > BILL_ESTIMATOR_PROFILE_ROLLOUT_LIMITS.maxStates) {
    throw new Error(
      `ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS exceeds state cap (${activeStateCount} > ${BILL_ESTIMATOR_PROFILE_ROLLOUT_LIMITS.maxStates})`,
    );
  }
  return rows;
}

export function getBillEstimatorProfileRolloutSummary(): {
  activeKeyCount: number;
  activeStateCount: number;
  activeStateSlugs: string[];
} {
  const rows = getActiveBillEstimatorProfilePages();
  const activeStateSlugs = Array.from(new Set(rows.map((row) => row.slug))).sort();
  return {
    activeKeyCount: rows.length,
    activeStateCount: activeStateSlugs.length,
    activeStateSlugs,
  };
}

export function isActiveBillEstimatorProfilePage(
  stateSlug: string,
  profileSlug: BillEstimatorProfileSlug,
): boolean {
  return ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS.includes(
    buildBillEstimatorProfilePageKey(stateSlug, profileSlug),
  );
}

export function getActiveBillEstimatorProfilesForState(stateSlug: string): BillEstimatorProfile[] {
  return BILL_ESTIMATOR_PROFILES.filter((profile) =>
    isActiveBillEstimatorProfilePage(stateSlug, profile.slug),
  );
}

export function getFirstActiveBillEstimatorProfileForState(
  stateSlug: string,
): BillEstimatorProfileSlug | null {
  return getActiveBillEstimatorProfilesForState(stateSlug)[0]?.slug ?? null;
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

export async function getActiveBillEstimatorProfileStaticParams(
  options?: BillEstimatorTelemetryOptions,
): Promise<Array<{ slug: string; profile: BillEstimatorProfileSlug }>> {
  const startedAt = startRuntimeTimer();
  const knownStates = new Set(
    (await getMemoizedAllBillEstimatorStateSummaries(options)).map((state) => state.slug),
  );
  const rows = getActiveBillEstimatorProfilePages().filter((row) => knownStates.has(row.slug));
  emitLongtailData({
    targetId: "billEstimator",
    operation: "getActiveBillEstimatorProfileStaticParams",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    sampleMeta: {
      configured_key_count: ACTIVE_BILL_ESTIMATOR_PROFILE_PAGE_KEYS.length,
      valid_row_count: rows.length,
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
