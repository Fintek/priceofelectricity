import { buildAllNormalizedStates } from "@/lib/stateBuilder";

export type ElectricityPriceIndex = {
  slug: string;
  name: string;
  rawRate: number;
  indexValue: number;
  relativePosition: "Above National Average" | "Below National Average";
};

let _cache: ElectricityPriceIndex[] | null = null;

export function computeElectricityPriceIndex(): ElectricityPriceIndex[] {
  if (_cache) return _cache;

  const states = buildAllNormalizedStates();
  const nationalAvg =
    states.reduce((sum, s) => sum + s.avgRateCentsPerKwh, 0) / states.length;

  _cache = states.map((s) => {
    const indexValue = Math.round((s.avgRateCentsPerKwh / nationalAvg) * 100);
    return {
      slug: s.slug,
      name: s.name,
      rawRate: s.avgRateCentsPerKwh,
      indexValue,
      relativePosition:
        indexValue >= 100 ? "Above National Average" : "Below National Average",
    };
  });

  return _cache;
}

export function getElectricityPriceIndexForState(
  slug: string
): ElectricityPriceIndex | undefined {
  return computeElectricityPriceIndex().find((e) => e.slug === slug);
}

export function getNationalAverageRate(): number {
  const states = buildAllNormalizedStates();
  return states.reduce((sum, s) => sum + s.avgRateCentsPerKwh, 0) / states.length;
}
