import {
  buildAllNormalizedStates,
  type NormalizedState,
} from "@/lib/stateBuilder";
import { computeElectricityPriceIndex } from "@/lib/priceIndex";

let _cache: NormalizedState[] | null = null;

function allStates(): NormalizedState[] {
  if (!_cache) _cache = buildAllNormalizedStates();
  return _cache;
}

function sortedByRate(): NormalizedState[] {
  return [...allStates()].sort(
    (a, b) => b.avgRateCentsPerKwh - a.avgRateCentsPerKwh
  );
}

export function getNationalAverage(): number {
  const states = allStates();
  const sum = states.reduce((acc, s) => acc + s.avgRateCentsPerKwh, 0);
  return Math.round((sum / states.length) * 100) / 100;
}

export function getMedianRate(): number {
  const rates = [...allStates()]
    .map((s) => s.avgRateCentsPerKwh)
    .sort((a, b) => a - b);
  const mid = Math.floor(rates.length / 2);
  const median =
    rates.length % 2 === 0
      ? (rates[mid - 1] + rates[mid]) / 2
      : rates[mid];
  return Math.round(median * 100) / 100;
}

export function getHighestState(): NormalizedState {
  return sortedByRate()[0];
}

export function getLowestState(): NormalizedState {
  const sorted = sortedByRate();
  return sorted[sorted.length - 1];
}

export function getTopNByRate(n: number): NormalizedState[] {
  return sortedByRate().slice(0, n);
}

export function getBottomNByRate(n: number): NormalizedState[] {
  return sortedByRate().slice(-n).reverse();
}

export type AffordabilityDistribution = {
  category: string;
  count: number;
  states: { slug: string; name: string }[];
};

export function getAffordabilityDistribution(): AffordabilityDistribution[] {
  const categories = [
    "Very Affordable",
    "Affordable",
    "Average",
    "Expensive",
    "Very Expensive",
  ];
  const buckets = new Map<
    string,
    { slug: string; name: string }[]
  >();
  for (const cat of categories) buckets.set(cat, []);

  for (const s of allStates()) {
    const list = buckets.get(s.affordabilityCategory);
    if (list) list.push({ slug: s.slug, name: s.name });
  }

  return categories.map((cat) => ({
    category: cat,
    count: buckets.get(cat)!.length,
    states: buckets.get(cat)!.sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

export type IndexDistribution = {
  bucket: string;
  count: number;
  states: { slug: string; name: string; indexValue: number }[];
};

export function getIndexDistribution(): IndexDistribution[] {
  const index = computeElectricityPriceIndex();
  const bucketDefs: { label: string; min: number; max: number }[] = [
    { label: "Below 70", min: 0, max: 69 },
    { label: "70–89", min: 70, max: 89 },
    { label: "90–109", min: 90, max: 109 },
    { label: "110–129", min: 110, max: 129 },
    { label: "130–149", min: 130, max: 149 },
    { label: "150+", min: 150, max: 9999 },
  ];

  return bucketDefs.map((b) => {
    const matching = index
      .filter((e) => e.indexValue >= b.min && e.indexValue <= b.max)
      .sort((x, y) => y.indexValue - x.indexValue);
    return {
      bucket: b.label,
      count: matching.length,
      states: matching.map((e) => ({
        slug: e.slug,
        name: e.name,
        indexValue: e.indexValue,
      })),
    };
  });
}

export function getStateCount(): number {
  return allStates().length;
}
