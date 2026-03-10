import { loadEntityIndex, loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";

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

export async function getLongtailStateStaticParams(): Promise<Array<{ state: string }>> {
  const entityIndex = await loadEntityIndex();
  return entityIndex.entities
    .filter((entity) => entity.type === "state")
    .map((entity) => ({ state: entity.slug }));
}

export async function loadLongtailStateData(state: string): Promise<LongtailStateData | null> {
  const [statePage, nationalPage] = await Promise.all([
    loadKnowledgePage("state", state),
    loadKnowledgePage("national", "national"),
  ]);

  if (!statePage) return null;

  const raw = (statePage.data?.raw as StateRaw | undefined) ?? {};
  const derived = (statePage.data?.derived as StateDerived | undefined) ?? {};
  const meta = (statePage.meta as StateMeta | undefined) ?? {};

  const nationalRaw = (nationalPage?.data?.derived as { averageRate?: number } | undefined) ?? {};
  const comparison = derived.comparison;
  const trend = derived.priceHistory?.rateSeries;
  const primaryProvenance = meta.provenance?.[0];

  return {
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
}
