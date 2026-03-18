import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  emitKnowledgeArtifactAccess,
  elapsedMs,
  startRuntimeTimer,
} from "@/lib/telemetry/runtime";

const KNOWLEDGE_ROOT = path.join(process.cwd(), "public", "knowledge");

export type KnowledgePageData = {
  meta: {
    id: string;
    type: string;
    slug: string;
    title: string;
    description: string;
    canonicalUrl: string;
    jsonUrl: string;
    freshness?: {
      datasetUpdatedAt: string;
      computedAt: string;
      status: "fresh" | "aging" | "stale" | "unknown";
      ageDays?: number;
      methodology: {
        id: string;
        version: string;
        url: string;
        canonicalUrl: string;
      };
    };
    changeSummary?: {
      comparedToVersion: string;
      significantChanges: Array<{
        field: string;
        absoluteDelta: number;
        percentDelta: number;
      }>;
    };
  };
  data: Record<string, unknown>;
};

export async function loadKnowledgePage(
  type: "national" | "state" | "methodology" | "rankings" | "vertical",
  slug: string,
  options?: { routeId?: string },
): Promise<KnowledgePageData | null> {
  let relPath: string;
  switch (type) {
    case "national":
      relPath = "national.json";
      break;
    case "state":
      relPath = `state/${slug}.json`;
      break;
    case "methodology":
      relPath = `methodology/${slug}.json`;
      break;
    case "rankings":
      relPath = `rankings/${slug}.json`;
      break;
    case "vertical":
      relPath = `vertical/${slug}.json`;
      break;
    default:
      return null;
  }
  const fullPath = path.join(KNOWLEDGE_ROOT, relPath);
  try {
    const readStartedAt = startRuntimeTimer();
    const raw = await readFile(fullPath, "utf8");
    const readMs = elapsedMs(readStartedAt);
    const parseStartedAt = startRuntimeTimer();
    const parsed = JSON.parse(raw) as { meta: KnowledgePageData["meta"]; data: Record<string, unknown> };
    const parseMs = elapsedMs(parseStartedAt);
    const artifactPath = `knowledge/${relPath.replace(/\\/g, "/")}`;
    emitKnowledgeArtifactAccess({
      artifactPath,
      routeId: options?.routeId,
      readMs,
      parseMs,
      totalMs: readMs + parseMs,
      bytes: Buffer.byteLength(raw, "utf8"),
    });
    return {
      meta: parsed.meta,
      data: parsed.data,
    };
  } catch {
    return null;
  }
}

export type InsightEntry = {
  type: string;
  statement: string;
  confidence: "high" | "medium" | "low";
};

export type InsightsData = {
  schemaVersion: string;
  generatedAt: string;
  subject: "state" | "national" | "ranking";
  id: string;
  insights: InsightEntry[];
};

export async function loadInsights(
  subject: "national" | "state" | "ranking",
  id: string,
): Promise<InsightsData | null> {
  let relPath: string;
  switch (subject) {
    case "national":
      relPath = "insights/national.json";
      break;
    case "state":
      relPath = `insights/state/${id}.json`;
      break;
    case "ranking":
      relPath = `insights/rankings/${id}.json`;
      break;
    default:
      return null;
  }
  const fullPath = path.join(KNOWLEDGE_ROOT, relPath);
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as InsightsData;
  } catch {
    return null;
  }
}

export type EntityIndexItem = {
  id: string;
  type: string;
  slug: string;
  title?: string;
  canonicalUrl: string;
};

export type EntityIndex = {
  entities: EntityIndexItem[];
};

export async function loadEntityIndex(): Promise<EntityIndex> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "entity-index.json");
  const raw = await readFile(fullPath, "utf8");
  const parsed = JSON.parse(raw) as EntityIndex;
  return parsed;
}

export type OffersIndex = {
  schemaVersion: string;
  enabled: boolean;
  disclaimer: string;
  states: Array<{
    slug: string;
    name: string;
    offers: Array<{
      id: string;
      title: string;
      description: string;
      url: string | null;
      enabled: boolean;
      partner: { name: string; type: string };
    }>;
  }>;
};

export type DisclaimersIndex = {
  schemaVersion: string;
  disclaimers: Array<{ id: string; title: string; text: string }>;
  defaultSets: Record<string, string[]>;
};

export async function loadDisclaimers(): Promise<DisclaimersIndex | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "policy", "disclaimers.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as DisclaimersIndex;
  } catch {
    return null;
  }
}

export async function loadOffersIndex(): Promise<OffersIndex | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "offers", "index.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as OffersIndex;
  } catch {
    return null;
  }
}

export type OffersConfig = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  offers: {
    enabled: boolean;
    mode: "disabled" | "enabled";
    allowOutboundLinks: boolean;
    defaultDisclaimerId: string;
    allowedPartners: string[];
    stateOverrides: Record<string, unknown>;
  };
};

export async function loadOffersConfig(): Promise<OffersConfig | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "policy", "offers-config.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as OffersConfig;
  } catch {
    return null;
  }
}

export type Capabilities = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  contractVersion: string;
  capabilities: Record<string, boolean>;
  urls: Record<string, string>;
};

export async function loadCapabilities(): Promise<Capabilities | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "capabilities.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as Capabilities;
  } catch {
    return null;
  }
}

export type Release = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  contractVersion: string;
  releaseId: string;
  publicEndpointsUrl: string;
  integrityManifestUrl: string | null;
  integrity: { algorithm: string; manifestHash: string | null };
  notes: string[];
};

export async function loadRelease(): Promise<Release | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "release.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as Release;
  } catch {
    return null;
  }
}

export type RankingsIndexItem = {
  id: string;
  title: string;
  description: string;
  metricField: string;
  sortDirection: "asc" | "desc";
  jsonUrl: string;
  canonicalUrl: string;
  methodologiesUsed?: Array<{ id: string; version: string }>;
};

export type RankingsIndex = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  items: RankingsIndexItem[];
};

export async function loadRankingsIndex(): Promise<RankingsIndex | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "rankings", "index.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as RankingsIndex;
  } catch {
    return null;
  }
}

export type LeaderboardsData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  leaderboards: Array<{
    id: string;
    title: string;
    metricId: string;
    direction: "asc" | "desc";
    items: Array<{ rank: number; slug: string; name: string; value: number }>;
    jsonUrl: string;
    canonicalUrl: string;
  }>;
};

export type KnowledgeContract = {
  schemaVersion: string;
  sourceVersion: string;
  provenanceCatalogUrl?: string;
  querySurfaces?: Record<string, string>;
  snapshotSupport?: { enabled: boolean; historyIndexUrl?: string; historyBundlesIndexUrl?: string };
  stability?: { regressionGuardUrl?: string };
  integrity?: { indexIntegrityField?: string; pageIntegrityField?: string };
};

export async function loadContract(): Promise<KnowledgeContract | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "contract.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as KnowledgeContract;
  } catch {
    return null;
  }
}

export type RelatedIndex = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  byEntity: Record<string, Array<{ id: string; title: string; canonicalUrl: string; type: string; reason: string }>>;
};

export async function loadRelatedIndex(): Promise<RelatedIndex | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "related", "index.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as RelatedIndex;
  } catch {
    return null;
  }
}

export type KnowledgeIndex = {
  schemaVersion: string;
  sourceVersion: string;
  contractUrl?: string;
  provenanceUrl?: string;
  schemaMapUrl?: string;
  entityIndexUrl?: string;
  methodologyIndexUrl?: string;
  compareUrl?: string;
  rankingsIndexUrl?: string;
  bundlesIndexUrl?: string;
  historyBundlesIndexUrl?: string;
  integritySignature?: string;
  registryHash?: string;
};

export async function loadIndex(): Promise<KnowledgeIndex | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "index.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as KnowledgeIndex;
  } catch {
    return null;
  }
}

export type SchemaMapEntity = {
  type: string;
  jsonPattern?: string;
  metaFields?: string[];
  dataFields?: string[];
};

export type KnowledgeSchemaMap = {
  schemaVersion: string;
  entities?: SchemaMapEntity[];
};

export type StarterPack = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  recommendedOrder: Array<{ step: number; id: string; url: string; why: string }>;
  notes?: string[];
};

export type PublicEndpoints = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  groups: Array<{
    id: string;
    title: string;
    items: Array<{ id: string; url: string; kind: "json" | "page"; description: string }>;
  }>;
};

export async function loadPublicEndpoints(): Promise<PublicEndpoints | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "public-endpoints.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as PublicEndpoints;
  } catch {
    return null;
  }
}

export async function loadStarterPack(): Promise<StarterPack | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "ingest", "starter-pack.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as StarterPack;
  } catch {
    return null;
  }
}

export async function loadSchemaMap(): Promise<KnowledgeSchemaMap | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "schema-map.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as KnowledgeSchemaMap;
  } catch {
    return null;
  }
}

export async function loadLeaderboards(): Promise<LeaderboardsData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "leaderboards", "states.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as LeaderboardsData;
  } catch {
    return null;
  }
}

export type CompareStatesData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  fields: string[];
  states: Array<{
    slug: string;
    name: string;
    postal?: string | null;
    metrics: Record<string, number | string | null>;
    canonicalUrl: string;
    jsonUrl: string;
  }>;
};

export async function loadCompareStates(): Promise<CompareStatesData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "compare", "states.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as CompareStatesData;
  } catch {
    return null;
  }
}

export type ComparePairsData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  contractVersion?: string;
  pairs: string[];
};

export type ElectricityComparisonPairsManifest = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  pairs: Array<{ pair: string; stateA: string; stateB: string }>;
};

export async function loadElectricityComparisonPairs(): Promise<ElectricityComparisonPairsManifest | null> {
  const fullPath = path.join(process.cwd(), "public", "electricity-comparison-pairs.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as ElectricityComparisonPairsManifest;
  } catch {
    return null;
  }
}

export type ComparePairData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  contractVersion?: string;
  stateA: string;
  stateB: string;
  nameA?: string;
  nameB?: string;
  rateA: number;
  rateB: number;
  differenceCents: number;
  differencePercent: number;
  higherCostState: string;
  lowerCostState: string;
};

export async function loadComparePairs(): Promise<ComparePairsData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "compare", "pairs.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as ComparePairsData;
  } catch {
    return null;
  }
}

export async function loadComparePair(pair: string): Promise<ComparePairData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "compare", `${pair}.json`);
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as ComparePairData;
  } catch {
    return null;
  }
}

export type RegionsIndexData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  contractVersion?: string;
  regions: Array<{
    id: string;
    name: string;
    href: string;
    excerpt: string;
    enabled: boolean;
  }>;
};

export async function loadRegionsIndex(): Promise<RegionsIndexData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "regions", "index.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as RegionsIndexData;
  } catch {
    return null;
  }
}

export type RegionDetailData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  contractVersion?: string;
  id: string;
  name: string;
  excerpt: string;
  enabled: boolean;
  stateCount: number;
  averageRateCentsPerKwh: number;
  medianRateCentsPerKwh: number;
  highestState: { slug: string; name: string; rate: number };
  lowestState: { slug: string; name: string; rate: number };
  top5Highest: Array<{ slug: string; name: string; rate: number }>;
  top5Lowest: Array<{ slug: string; name: string; rate: number }>;
};

export async function loadRegionDetail(id: string): Promise<RegionDetailData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "regions", `${id}.json`);
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as RegionDetailData;
  } catch {
    return null;
  }
}

export type RegionRankingsData = {
  schemaVersion: string;
  generatedAt: string;
  sourceVersion: string;
  contractVersion?: string;
  regionId: string;
  regionName: string;
  cheapestStates: Array<{ slug: string; name: string; rate: number }>;
  mostExpensiveStates: Array<{ slug: string; name: string; rate: number }>;
};

export async function loadRegionRankings(id: string): Promise<RegionRankingsData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "regions", `${id}-rankings.json`);
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as RegionRankingsData;
  } catch {
    return null;
  }
}

export type CoverageStatesData = {
  schemaVersion?: string;
  states?: Array<{ slug: string; coveragePct?: number }>;
};

export async function loadCoverageStates(): Promise<CoverageStatesData | null> {
  const fullPath = path.join(KNOWLEDGE_ROOT, "coverage", "states.json");
  try {
    const raw = await readFile(fullPath, "utf8");
    return JSON.parse(raw) as CoverageStatesData;
  } catch {
    return null;
  }
}

export function resolveEntityRefs(
  entityIndex: EntityIndex,
  relatedEntities: {
    states?: string[];
    rankings?: string[];
    methodologies?: string[];
    verticals?: string[];
  },
): {
  states: Array<{ type: string; slug: string; label: string; href: string }>;
  rankings: Array<{ type: string; slug: string; label: string; href: string }>;
  methodologies: Array<{ type: string; slug: string; label: string; href: string }>;
  verticals: Array<{ type: string; slug: string; label: string; href: string }>;
} {
  const byTypeSlug = new Map<string, EntityIndexItem>();
  for (const e of entityIndex.entities) {
    byTypeSlug.set(`${e.type}:${e.slug}`, e);
  }

  const toHref = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url.startsWith("/") ? url : `/${url}`;
    }
  };

  const resolve = (type: string, slugs: string[]) =>
    slugs
      .map((slug) => {
        const item = byTypeSlug.get(`${type}:${slug}`);
        if (!item) return null;
        return {
          type,
          slug,
          label: item.title ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          href: toHref(item.canonicalUrl),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    states: resolve("state", relatedEntities.states ?? []),
    rankings: resolve("rankings", relatedEntities.rankings ?? []),
    methodologies: resolve("methodology", relatedEntities.methodologies ?? []),
    verticals: resolve("vertical", relatedEntities.verticals ?? []),
  };
}
