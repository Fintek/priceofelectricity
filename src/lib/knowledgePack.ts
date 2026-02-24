import { SITE_NAME, SITE_URL } from "@/lib/site";
import { getCurrentSnapshot } from "@/lib/snapshotLoader";
import {
  getNationalAverage,
  getMedianRate,
  getHighestState,
  getLowestState,
  getTopNByRate,
  getBottomNByRate,
} from "@/lib/nationalStats";

export type KnowledgePack = {
  schemaVersion: "1.0";
  site: {
    name: string;
    url: string;
    dataVersion: string;
    generatedAt: string;
  };
  endpoints: {
    registry: string;
    graph: string;
    llms: string;
    dataHub: string;
    statesJson: string;
    statesCsv: string;
    valueRankingCsv: string;
    affordabilityCsv: string;
  };
  methodologies: {
    electricityPriceIndex: string;
    valueScore: string;
    freshnessScoring: string;
  };
  national: {
    averageRateCentsPerKwh: number;
    medianRateCentsPerKwh: number;
    highestState: { slug: string; name: string; rate: number };
    lowestState: { slug: string; name: string; rate: number };
    top5Highest: { slug: string; name: string; rate: number }[];
    top5Lowest: { slug: string; name: string; rate: number }[];
  };
  notes: string[];
};

export function buildKnowledgePack(): KnowledgePack {
  const highest = getHighestState();
  const lowest = getLowestState();

  return {
    schemaVersion: "1.0",
    site: {
      name: SITE_NAME,
      url: SITE_URL,
      dataVersion: getCurrentSnapshot().version,
      generatedAt: new Date().toISOString(),
    },
    endpoints: {
      registry: "/registry.json",
      graph: "/graph.json",
      llms: "/llms.txt",
      dataHub: "/datasets",
      statesJson: "/api/datasets/states.json",
      statesCsv: "/api/datasets/states.csv",
      valueRankingCsv: "/api/datasets/value-ranking.csv",
      affordabilityCsv: "/api/datasets/affordability.csv",
    },
    methodologies: {
      electricityPriceIndex: "/methodology/electricity-price-index",
      valueScore: "/methodology/value-score",
      freshnessScoring: "/methodology/freshness-scoring",
    },
    national: {
      averageRateCentsPerKwh: getNationalAverage(),
      medianRateCentsPerKwh: getMedianRate(),
      highestState: {
        slug: highest.slug,
        name: highest.name,
        rate: highest.avgRateCentsPerKwh,
      },
      lowestState: {
        slug: lowest.slug,
        name: lowest.name,
        rate: lowest.avgRateCentsPerKwh,
      },
      top5Highest: getTopNByRate(5).map((s) => ({
        slug: s.slug,
        name: s.name,
        rate: s.avgRateCentsPerKwh,
      })),
      top5Lowest: getBottomNByRate(5).map((s) => ({
        slug: s.slug,
        name: s.name,
        rate: s.avgRateCentsPerKwh,
      })),
    },
    notes: [
      "Rates are energy-only estimates.",
      "See sources and methodology.",
      "Use canonical URLs.",
    ],
  };
}
