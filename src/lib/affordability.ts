export type AffordabilityRecord = {
  slug: string;
  avgRateCentsPerKwh: number;
  indexScore: number;
  category:
    | "Very Affordable"
    | "Affordable"
    | "Average"
    | "Expensive"
    | "Very Expensive";
};

type StateRateMap = Record<string, { avgRateCentsPerKwh: number }>;

function categorizeAffordability(score: number): AffordabilityRecord["category"] {
  if (score >= 80) {
    return "Very Affordable";
  }
  if (score >= 60) {
    return "Affordable";
  }
  if (score >= 40) {
    return "Average";
  }
  if (score >= 20) {
    return "Expensive";
  }
  return "Very Expensive";
}

export function computeAffordability(stateRates: StateRateMap): AffordabilityRecord[] {
  const entries = Object.entries(stateRates).map(([slug, info]) => ({
    slug,
    avgRateCentsPerKwh: Number(info.avgRateCentsPerKwh),
  }));

  if (entries.length === 0) {
    return [];
  }

  const rates = entries.map((entry) => entry.avgRateCentsPerKwh);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const range = maxRate - minRate;

  return entries.map((entry) => {
    const normalizedScore =
      range === 0 ? 100 : 100 - ((entry.avgRateCentsPerKwh - minRate) / range) * 100;
    const indexScore = Math.round(normalizedScore);
    return {
      slug: entry.slug,
      avgRateCentsPerKwh: entry.avgRateCentsPerKwh,
      indexScore,
      category: categorizeAffordability(indexScore),
    };
  });
}
