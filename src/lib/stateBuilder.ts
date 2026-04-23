// ARCHITECTURE:
// RAW → VALIDATED → TRANSFORMED → NORMALIZED → RENDERED
// This separation prepares the system for future automated ingestion.
import { getSourceSlugForState } from "@/data/sources";
import { computeAffordability, type AffordabilityRecord } from "@/lib/affordability";
import { computeValueScores, type ValueScore } from "@/lib/valueScore";
import { computeFreshness } from "@/lib/freshness";
import { getRateTier, getRateTierLabel } from "@/lib/insights";
import {
  getAllTransformedStates,
  transformRawState,
} from "@/lib/transformers/stateTransformer";

export type NormalizedState = {
  slug: string;
  name: string;
  avgRateCentsPerKwh: number;
  updated: string;
  methodology: string;
  disclaimer: string;
  affordabilityIndex: number;
  affordabilityCategory: string;
  valueScore: number;
  valueTier: string;
  freshnessStatus: string;
  freshnessLabel: string;
  rateTierLabel: string;
  shortSummary: string;
  exampleBills: { kwh: number; estimated: number }[];
  source: {
    name: string;
    url: string;
    slug: string;
  };
};

const EXAMPLE_KWH = [500, 900, 1000, 1500] as const;
// Source of record is the U.S. EIA Form EIA-861M retail-sales dataset. The
// monthly refresh pipeline (scripts/eia/*) is the canonical ingestion path;
// `src/data/raw/states.raw.ts` is regenerated from that CSV on each refresh.
const DEFAULT_SOURCE_NAME = "U.S. Energy Information Administration (EIA)";
const DEFAULT_SOURCE_URL = "https://www.eia.gov/electricity/data/state/";
const DEFAULT_METHODOLOGY =
  "Average residential electricity price in cents per kWh from the published state-level dataset. Values are used as a reference benchmark for comparison and estimation.";
const DEFAULT_DISCLAIMER =
  "Estimates are energy-only and exclude delivery fees, taxes, fixed charges, and other utility fees.";

function formatUpdatedMonthYear(updatedISO: string): string {
  const date = new Date(updatedISO);
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function getStateComputationInput() {
  const transformedStates = getAllTransformedStates();
  return Object.fromEntries(
    Object.entries(transformedStates).map(([slug, transformed]) => [
      slug,
      {
        avgRateCentsPerKwh: transformed.avgRateCentsPerKwh,
        updated: formatUpdatedMonthYear(transformed.updatedISO),
      },
    ])
  );
}

let _affordabilityMap: Map<string, AffordabilityRecord> | null = null;
let _valueScoreMap: Map<string, ValueScore> | null = null;

function getAffordabilityMap(): Map<string, AffordabilityRecord> {
  if (!_affordabilityMap) {
    const records = computeAffordability(getStateComputationInput());
    _affordabilityMap = new Map(records.map((r) => [r.slug, r]));
  }
  return _affordabilityMap;
}

function getValueScoreMap(): Map<string, ValueScore> {
  if (!_valueScoreMap) {
    const stateInput = getStateComputationInput();
    const records = computeAffordability(stateInput);
    const scores = computeValueScores(stateInput, records);
    _valueScoreMap = new Map(scores.map((v) => [v.slug, v]));
  }
  return _valueScoreMap;
}

export function buildAllNormalizedStates(): NormalizedState[] {
  return Object.keys(getAllTransformedStates()).map((slug) =>
    buildNormalizedState(slug)
  );
}

export function buildNormalizedState(slug: string): NormalizedState {
  const transformed = transformRawState(slug);
  const rate = Number(transformed.avgRateCentsPerKwh);
  const updated = formatUpdatedMonthYear(transformed.updatedISO);
  const sourceSlug = getSourceSlugForState(DEFAULT_SOURCE_NAME);
  const affordability = getAffordabilityMap().get(slug);
  const vs = getValueScoreMap().get(slug);
  const freshness = computeFreshness(updated);
  const rateTierLabel = getRateTierLabel(getRateTier(rate));
  const shortSummary = `${transformed.name}'s average residential electricity price is ${rate}¢/kWh as of ${updated}. This places ${transformed.name} in the ${rateTierLabel.toLowerCase()} rate tier based on the same threshold model used across all states. At 900 kWh of monthly usage, the estimated energy-only charge is about $${((900 * rate) / 100).toFixed(2)}.`;

  return {
    slug,
    name: transformed.name,
    avgRateCentsPerKwh: rate,
    updated,
    methodology: DEFAULT_METHODOLOGY,
    disclaimer: DEFAULT_DISCLAIMER,
    affordabilityIndex: affordability?.indexScore ?? 0,
    affordabilityCategory: affordability?.category ?? "Average",
    valueScore: vs?.score ?? 0,
    valueTier: vs?.tier ?? "Moderate",
    freshnessStatus: freshness.status,
    freshnessLabel: freshness.label,
    rateTierLabel,
    shortSummary,
    exampleBills: EXAMPLE_KWH.map((kwh) => ({
      kwh,
      estimated: (kwh * rate) / 100,
    })),
    source: {
      name: DEFAULT_SOURCE_NAME,
      url: DEFAULT_SOURCE_URL,
      slug: sourceSlug ?? "",
    },
  };
}
