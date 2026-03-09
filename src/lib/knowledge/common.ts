import { buildAllNormalizedStates, type NormalizedState } from "@/lib/stateBuilder";
import { getCurrentSnapshot } from "@/lib/snapshotLoader";
import {
  getNationalAverage,
  getMedianRate,
  getHighestState,
  getLowestState,
  getTopNByRate,
  getBottomNByRate,
} from "@/lib/nationalStats";

export type KnowledgeMethodologyRefs = {
  electricityPriceIndex: string;
  valueScore: string;
  freshnessScoring: string;
};

export type KnowledgeDataEndpoints = {
  registry: string;
  graph: string;
  llms: string;
  dataHub: string;
  statesJson: string;
  statesCsv: string;
  valueRankingCsv: string;
  affordabilityCsv: string;
};

export type KnowledgeNationalSummary = {
  averageRateCentsPerKwh: number;
  medianRateCentsPerKwh: number;
  highestState: { slug: string; name: string; rate: number };
  lowestState: { slug: string; name: string; rate: number };
  top5Highest: { slug: string; name: string; rate: number }[];
  top5Lowest: { slug: string; name: string; rate: number }[];
};

export function getKnowledgeSourceVersion(): string {
  return getCurrentSnapshot().version;
}

export function getKnowledgeMethodologyRefs(): KnowledgeMethodologyRefs {
  return {
    electricityPriceIndex: "/knowledge/methodology/epi",
    valueScore: "/knowledge/methodology/value-score",
    freshnessScoring: "/knowledge/methodology/freshness",
  };
}

export function getKnowledgeDataEndpoints(): KnowledgeDataEndpoints {
  return {
    registry: "/registry.json",
    graph: "/graph.json",
    llms: "/llms.txt",
    dataHub: "/datasets",
    statesJson: "/api/datasets/states.json",
    statesCsv: "/api/datasets/states.csv",
    valueRankingCsv: "/api/datasets/value-ranking.csv",
    affordabilityCsv: "/api/datasets/affordability.csv",
  };
}

export function getKnowledgeNationalSummary(): KnowledgeNationalSummary {
  const highest = getHighestState();
  const lowest = getLowestState();
  return {
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
  };
}

export function getKnowledgeNormalizedStates(): NormalizedState[] {
  return buildAllNormalizedStates().sort((a, b) => a.name.localeCompare(b.name));
}
