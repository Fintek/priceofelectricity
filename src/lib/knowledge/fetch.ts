import { cache } from "react";
import {
  loadIndex,
  loadContract,
  loadRelease,
  loadCapabilities,
  loadPublicEndpoints,
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
