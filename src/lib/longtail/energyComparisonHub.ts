import { STATES } from "@/data/states";
import { loadElectricityComparisonPairs } from "@/lib/knowledge/loadKnowledgePage";
import {
  getActiveApplianceCityPages,
  getActiveApplianceSlugs,
  getActiveCityPages,
  getActiveUsageKwhTiers,
} from "@/lib/longtail/rollout";

const STATE_COMPARISON_FOCUS_SLUGS = ["california", "texas", "florida", "new-york", "illinois", "georgia"] as const;
const USAGE_COMPARISON_FOCUS_STATE_SLUGS = ["california", "texas", "florida", "new-york"] as const;

export type EnergyComparisonPairItem = {
  pair: string;
  stateA: string;
  stateB: string;
};

export async function getEnergyComparisonPairs(limit = 24): Promise<EnergyComparisonPairItem[]> {
  const manifest = await loadElectricityComparisonPairs();
  const pairs = manifest?.pairs ?? [];
  return pairs.slice(0, limit).map((item) => ({
    pair: item.pair,
    stateA: item.stateA,
    stateB: item.stateB,
  }));
}

export function getEnergyComparisonStateFocus(): Array<{ slug: string; name: string }> {
  return STATE_COMPARISON_FOCUS_SLUGS.filter((slug) => Boolean(STATES[slug])).map((slug) => ({
    slug,
    name: STATES[slug].name,
  }));
}

export function getEnergyComparisonUsageTiers(): number[] {
  return getActiveUsageKwhTiers().slice(0, 4);
}

export function getEnergyComparisonUsageStates(): Array<{ slug: string; name: string }> {
  return USAGE_COMPARISON_FOCUS_STATE_SLUGS.filter((slug) => Boolean(STATES[slug])).map((slug) => ({
    slug,
    name: STATES[slug].name,
  }));
}

export function getEnergyComparisonApplianceSlugs(limit = 8): string[] {
  return getActiveApplianceSlugs().slice(0, limit);
}

export function getEnergyComparisonCityPages(limit = 10) {
  return getActiveCityPages().slice(0, limit);
}

export function getEnergyComparisonApplianceCityPilotPages(limit = 8) {
  return getActiveApplianceCityPages().slice(0, limit);
}
