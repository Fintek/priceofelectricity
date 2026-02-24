import type { AffordabilityRecord } from "@/lib/affordability";
import type { FreshnessStatus } from "@/lib/freshness";
import { computeFreshness } from "@/lib/freshness";

export type ValueScoreTier = "Excellent" | "Strong" | "Moderate" | "Weak";

export type ValueScore = {
  slug: string;
  score: number;
  tier: ValueScoreTier;
};

type StateInput = Record<
  string,
  { avgRateCentsPerKwh: number; updated: string }
>;

function getFreshnessBoost(status: FreshnessStatus): number {
  switch (status) {
    case "fresh":
      return 5;
    case "aging":
      return 2;
    case "stale":
      return 0;
  }
}

function getTier(score: number): ValueScoreTier {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Moderate";
  return "Weak";
}

export function computeValueScores(
  states: StateInput,
  affordabilityRecords: AffordabilityRecord[]
): ValueScore[] {
  const entries = Object.entries(states);
  if (entries.length === 0) return [];

  const rates = entries.map(([, s]) => s.avgRateCentsPerKwh);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const rateRange = maxRate - minRate;

  const affordabilityBySlug = Object.fromEntries(
    affordabilityRecords.map((a) => [a.slug, a])
  );

  const rawScores = entries.map(([slug, state]) => {
    const affordability = affordabilityBySlug[slug];
    const affordabilityComponent = affordability?.indexScore ?? 0;

    const inversePriceComponent =
      rateRange === 0
        ? 100
        : 100 - ((state.avgRateCentsPerKwh - minRate) / rateRange) * 100;

    const freshness = computeFreshness(state.updated);
    const freshnessBoost = getFreshnessBoost(freshness.status);

    return {
      slug,
      raw:
        0.6 * affordabilityComponent +
        0.3 * inversePriceComponent +
        freshnessBoost,
    };
  });

  const maxRaw = 95;
  const minRaw = 0;

  return rawScores.map(({ slug, raw }) => {
    const normalized = ((raw - minRaw) / (maxRaw - minRaw)) * 100;
    const score = Math.round(Math.max(0, Math.min(100, normalized)));
    return {
      slug,
      score,
      tier: getTier(score),
    };
  });
}
