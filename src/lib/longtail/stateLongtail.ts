import { loadEntityIndex, loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import {
  emitLongtailData,
  elapsedMs,
  startRuntimeTimer,
} from "@/lib/telemetry/runtime";

type StateRaw = {
  slug?: string;
  name?: string;
  avgRateCentsPerKwh?: number;
  updated?: string;
};

type StateDerived = {
  comparison?: {
    nationalAverage?: number;
    differenceCents?: number;
    differencePercent?: number;
    category?: string;
  };
  priceHistory?: {
    rateSeries?: { periods?: string[]; values?: number[] };
    increase1YearPercent?: number;
    increase5YearPercent?: number;
    annualizedIncrease5Year?: number;
  };
};

type StateMeta = {
  provenance?: Array<{ sourceName?: string; sourceUrl?: string }>;
};

export type LongtailStateData = {
  slug: string;
  name: string;
  updatedLabel: string | null;
  avgRateCentsPerKwh: number | null;
  nationalAverageCentsPerKwh: number | null;
  differenceCents: number | null;
  differencePercent: number | null;
  comparisonCategory: string | null;
  trendPeriods: string[];
  trendValues: number[];
  increase1YearPercent: number | null;
  increase5YearPercent: number | null;
  annualizedIncrease5Year: number | null;
  sourceName: string;
  sourceUrl: string | null;
};

export const LONGTAIL_USAGE_KWH_VALUES = [500, 750, 1000, 1500, 2000, 3000] as const;

type LongtailTelemetryOptions = {
  contextLabel?: string;
};

type LongtailLoadDependencies = {
  nationalPagePromise?: Promise<Awaited<ReturnType<typeof loadKnowledgePage>>>;
};
type LongtailStaticParamsComputation = {
  rows: Array<{ state: string }>;
  entityIndexMs: number;
  mapMs: number;
};
type LongtailStateDataComputation = {
  result: LongtailStateData | null;
  statePageMs: number;
  nationalPageMs: number;
  normalizeMs: number;
  foundStatePage: boolean;
};
const MEMOIZED_KNOWLEDGE_PAGE_PROMISES = new Map<
  string,
  Promise<Awaited<ReturnType<typeof loadKnowledgePage>>>
>();
let memoizedLongtailStateStaticParamsPromise: Promise<LongtailStaticParamsComputation> | null = null;
const MEMOIZED_LONGTAIL_STATE_DATA_PROMISES = new Map<
  string,
  Promise<LongtailStateDataComputation>
>();

function getMemoizedKnowledgePage(
  type: "national" | "state",
  slug: string,
): Promise<Awaited<ReturnType<typeof loadKnowledgePage>>> {
  const key = `${type}:${slug}`;
  const existing = MEMOIZED_KNOWLEDGE_PAGE_PROMISES.get(key);
  if (existing) return existing;
  const promise = loadKnowledgePage(type, slug).catch((error) => {
    MEMOIZED_KNOWLEDGE_PAGE_PROMISES.delete(key);
    throw error;
  });
  MEMOIZED_KNOWLEDGE_PAGE_PROMISES.set(key, promise);
  return promise;
}

async function computeLongtailStateStaticParams(): Promise<LongtailStaticParamsComputation> {
  let entityIndexMs = 0;
  let mapMs = 0;
  const entityStartedAt = startRuntimeTimer();
  const entityIndex = await loadEntityIndex();
  entityIndexMs = elapsedMs(entityStartedAt);
  const mapStartedAt = startRuntimeTimer();
  const rows = entityIndex.entities
    .filter((entity) => entity.type === "state")
    .map((entity) => ({ state: entity.slug }));
  mapMs = elapsedMs(mapStartedAt);
  return { rows, entityIndexMs, mapMs };
}

function getMemoizedLongtailStateStaticParams(): {
  promise: Promise<LongtailStaticParamsComputation>;
  cacheHit: boolean;
} {
  if (!memoizedLongtailStateStaticParamsPromise) {
    memoizedLongtailStateStaticParamsPromise = computeLongtailStateStaticParams().catch((error) => {
      memoizedLongtailStateStaticParamsPromise = null;
      throw error;
    });
    return { promise: memoizedLongtailStateStaticParamsPromise, cacheHit: false };
  }
  return { promise: memoizedLongtailStateStaticParamsPromise, cacheHit: true };
}

async function computeLongtailStateData(
  state: string,
  nationalPagePromise?: Promise<Awaited<ReturnType<typeof loadKnowledgePage>>>,
): Promise<LongtailStateDataComputation> {
  let statePageMs = 0;
  let nationalPageMs = 0;
  let normalizeMs = 0;
  const statePagePromise = getMemoizedKnowledgePage("state", state);
  const nationalPromise = nationalPagePromise ?? getMemoizedKnowledgePage("national", "national");
  const [statePage, nationalPage] = await Promise.all([
    (async () => {
      const t = startRuntimeTimer();
      const value = await statePagePromise;
      statePageMs = elapsedMs(t);
      return value;
    })(),
    (async () => {
      const t = startRuntimeTimer();
      const value = await nationalPromise;
      nationalPageMs = elapsedMs(t);
      return value;
    })(),
  ]);

  if (!statePage) {
    return {
      result: null,
      statePageMs,
      nationalPageMs,
      normalizeMs,
      foundStatePage: false,
    };
  }

  const normalizeStartedAt = startRuntimeTimer();
  const raw = (statePage.data?.raw as StateRaw | undefined) ?? {};
  const derived = (statePage.data?.derived as StateDerived | undefined) ?? {};
  const meta = (statePage.meta as StateMeta | undefined) ?? {};

  const nationalRaw = (nationalPage?.data?.derived as { averageRate?: number } | undefined) ?? {};
  const comparison = derived.comparison;
  const trend = derived.priceHistory?.rateSeries;
  const primaryProvenance = meta.provenance?.[0];
  normalizeMs = elapsedMs(normalizeStartedAt);

  const result = {
    slug: raw.slug ?? state,
    name: raw.name ?? slugToName(state),
    updatedLabel: raw.updated ?? null,
    avgRateCentsPerKwh:
      typeof raw.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null,
    nationalAverageCentsPerKwh:
      typeof comparison?.nationalAverage === "number"
        ? comparison.nationalAverage
        : typeof nationalRaw.averageRate === "number"
          ? nationalRaw.averageRate
          : null,
    differenceCents:
      typeof comparison?.differenceCents === "number" ? comparison.differenceCents : null,
    differencePercent:
      typeof comparison?.differencePercent === "number" ? comparison.differencePercent : null,
    comparisonCategory: comparison?.category ?? null,
    trendPeriods: Array.isArray(trend?.periods) ? trend.periods : [],
    trendValues: Array.isArray(trend?.values) ? trend.values : [],
    increase1YearPercent:
      typeof derived.priceHistory?.increase1YearPercent === "number"
        ? derived.priceHistory.increase1YearPercent
        : null,
    increase5YearPercent:
      typeof derived.priceHistory?.increase5YearPercent === "number"
        ? derived.priceHistory.increase5YearPercent
        : null,
    annualizedIncrease5Year:
      typeof derived.priceHistory?.annualizedIncrease5Year === "number"
        ? derived.priceHistory.annualizedIncrease5Year
        : null,
    sourceName: primaryProvenance?.sourceName ?? "U.S. Energy Information Administration (EIA)",
    sourceUrl: primaryProvenance?.sourceUrl ?? null,
  };

  return {
    result,
    statePageMs,
    nationalPageMs,
    normalizeMs,
    foundStatePage: true,
  };
}

function getMemoizedLongtailStateData(state: string): {
  promise: Promise<LongtailStateDataComputation>;
  cacheHit: boolean;
} {
  const existing = MEMOIZED_LONGTAIL_STATE_DATA_PROMISES.get(state);
  if (existing) return { promise: existing, cacheHit: true };
  const promise = computeLongtailStateData(state).catch((error) => {
    MEMOIZED_LONGTAIL_STATE_DATA_PROMISES.delete(state);
    throw error;
  });
  MEMOIZED_LONGTAIL_STATE_DATA_PROMISES.set(state, promise);
  return { promise, cacheHit: false };
}

export function isValidLongtailUsageKwh(value: number): value is (typeof LONGTAIL_USAGE_KWH_VALUES)[number] {
  return LONGTAIL_USAGE_KWH_VALUES.includes(value as (typeof LONGTAIL_USAGE_KWH_VALUES)[number]);
}

export function slugToName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatRate(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value.toFixed(2)} ¢/kWh`;
}

export function formatUsd(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `$${value.toFixed(2)}`;
}

export function calculateUsageCost(avgRateCentsPerKwh: number | null, kwh: number): number | null {
  if (avgRateCentsPerKwh == null || Number.isNaN(avgRateCentsPerKwh)) return null;
  return (avgRateCentsPerKwh / 100) * kwh;
}

export async function getLongtailStateStaticParams(
  options?: LongtailTelemetryOptions,
): Promise<Array<{ state: string }>> {
  const startedAt = startRuntimeTimer();
  const delegateStartedAt = startRuntimeTimer();
  const { promise, cacheHit } = getMemoizedLongtailStateStaticParams();
  const computed = await promise;
  const delegateMs = elapsedMs(delegateStartedAt);
  emitLongtailData({
    targetId: "stateLongtail",
    operation: "getLongtailStateStaticParams",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    sampleMeta: {
      entity_index_ms: computed.entityIndexMs,
      map_ms: computed.mapMs,
      state_count: computed.rows.length,
      delegate_ms: delegateMs,
      cache_hit: cacheHit,
    },
  });
  return computed.rows;
}

export async function loadLongtailStateData(
  state: string,
  options?: LongtailTelemetryOptions,
  dependencies?: LongtailLoadDependencies,
): Promise<LongtailStateData | null> {
  const startedAt = startRuntimeTimer();
  const delegateStartedAt = startRuntimeTimer();
  const memoized =
    dependencies?.nationalPagePromise == null ? getMemoizedLongtailStateData(state) : null;
  const computed = dependencies?.nationalPagePromise
    ? await computeLongtailStateData(state, dependencies.nationalPagePromise)
    : await memoized!.promise;
  const cacheHit = dependencies?.nationalPagePromise ? false : memoized?.cacheHit === true;
  const delegateMs = elapsedMs(delegateStartedAt);
  if (!computed.foundStatePage) {
    emitLongtailData({
      targetId: "stateLongtail",
      operation: "loadLongtailStateData",
      durationMs: elapsedMs(startedAt),
      contextLabel: options?.contextLabel,
      stateSlug: state,
      sampleMeta: {
        state_page_ms: computed.statePageMs,
        national_page_ms: computed.nationalPageMs,
        normalize_ms: computed.normalizeMs,
        delegate_ms: delegateMs,
        cache_hit: cacheHit,
        found_state_page: false,
      },
    });
    return null;
  }
  emitLongtailData({
    targetId: "stateLongtail",
    operation: "loadLongtailStateData",
    durationMs: elapsedMs(startedAt),
    contextLabel: options?.contextLabel,
    stateSlug: state,
    sampleMeta: {
      state_page_ms: computed.statePageMs,
      national_page_ms: computed.nationalPageMs,
      normalize_ms: computed.normalizeMs,
      delegate_ms: delegateMs,
      cache_hit: cacheHit,
      found_state_page: true,
    },
  });
  return computed.result;
}
