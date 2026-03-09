import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  getKnowledgeSourceVersion,
  getKnowledgeMethodologyRefs,
  getKnowledgeDataEndpoints,
  getKnowledgeNationalSummary,
} from "@/lib/knowledge/common";

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
  const methodologies = getKnowledgeMethodologyRefs();
  const endpoints = getKnowledgeDataEndpoints();
  const national = getKnowledgeNationalSummary();

  return {
    schemaVersion: "1.0",
    site: {
      name: SITE_NAME,
      url: SITE_URL,
      dataVersion: getKnowledgeSourceVersion(),
      generatedAt: new Date().toISOString(),
    },
    endpoints,
    methodologies,
    national,
    notes: [
      "Rates are energy-only estimates.",
      "See sources and methodology.",
      "Use canonical URLs.",
    ],
  };
}
