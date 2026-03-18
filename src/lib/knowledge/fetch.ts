import { cache } from "react";
import {
  loadIndex,
  loadContract,
  loadRelease,
  loadCapabilities,
  loadPublicEndpoints,
  loadEntityIndex,
  loadOffersIndex,
  loadOffersConfig,
  loadRelatedIndex,
  loadCompareStates,
  loadInsights,
  loadRankingsIndex,
} from "@/lib/knowledge/loadKnowledgePage";
import { loadGlossary } from "@/lib/knowledge/glossary";

/** Cache strategy for knowledge JSON fetches. Use with fetch() when loading from URLs. */
export const KNOWLEDGE_FETCH_CACHE = "force-cache";

/** Cached loaders to deduplicate fetches within a single request. */

export const getKnowledgeIndex = cache(loadIndex);
export const getContract = cache(loadContract);
export const getGlossary = cache(loadGlossary);
export const getPublicEndpoints = cache(loadPublicEndpoints);
export const getRelease = cache(loadRelease);
export const getCapabilities = cache(loadCapabilities);
export const getEntityIndex = cache(loadEntityIndex);
export const getOffersIndex = cache(loadOffersIndex);
export const getOffersConfig = cache(loadOffersConfig);
export const getRelatedIndex = cache(loadRelatedIndex);
export const getCompareStates = cache(loadCompareStates);
export const getRankingsIndex = cache(loadRankingsIndex);
export const getStateInsights = cache((id: string) => loadInsights("state", id));
export const getRankingInsights = cache((id: string) => loadInsights("ranking", id));
