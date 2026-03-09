export type KnowledgeRegistryItem = {
  id: string;
  type: "national" | "state" | "methodology" | "rankings" | "vertical";
  slug: string;
  title: string;
  description: string;
  url: string;
  canonicalUrl: string;
  jsonUrl: string;
  relatedMethodologyUrls: string[];
  relatedDataEndpoints: string[];
  verticalGroup?: string;
  contentHash: string;
  updatedAt: string;
  sourceVersion: string;
  freshnessStatus?: string;
  datasetUpdatedAt?: string;
  qualityScore?: number;
};

export type KnowledgeCitation = {
  sourceName: string;
  sourceUrl?: string;
  retrievedAt?: string;
  notes?: string;
};

export type ProvenanceRef = {
  id: string;
  sourceName: string;
  sourceUrl?: string;
  publisher?: string;
  license?: string;
  retrievedAt?: string;
  notes?: string;
};

export type FieldProvenance = {
  field: string;
  provenanceIds: string[];
  /** True if field is computed/transformed from raw data. */
  isDerived?: boolean;
  /** For derived fields: paths to raw fields this derives from (e.g. "data.raw.avgRateCentsPerKwh"). */
  derivedFromFields?: string[];
};

export type KnowledgeLlmHints = {
  priority: "high" | "medium" | "low";
  entityType: string;
  semanticTopics: string[];
  semanticCluster: string;
};

export type FreshnessMeta = {
  datasetUpdatedAt: string;
  computedAt: string;
  status: "fresh" | "aging" | "stale" | "unknown";
  ageDays?: number;
  methodology: {
    id: "freshness";
    version: string;
    url: string;
    canonicalUrl: string;
  };
};

export type ChangeSummary = {
  comparedToVersion: string;
  significantChanges: Array<{
    field: string;
    absoluteDelta: number;
    percentDelta: number;
  }>;
};

export type KnowledgeMeta = {
  schemaVersion: "1.0";
  id: string;
  type: KnowledgeRegistryItem["type"];
  slug: string;
  title: string;
  description: string;
  canonicalUrl: string;
  jsonUrl: string;
  updatedAt: string;
  sourceVersion: string;
  temporalContext: {
    sourceVersion: string;
    isLatest: boolean;
  };
  contentHash: string;
  provenance: ProvenanceRef[];
  fieldProvenance: FieldProvenance[];
  citations: KnowledgeCitation[];
  llmHints: KnowledgeLlmHints;
  /** Present on methodology pages only. */
  methodology?: MethodologyMeta;
  /** Freshness transparency on all pages. */
  freshness: FreshnessMeta;
  /** Change intelligence: significant metric changes vs previous snapshot. */
  changeSummary?: ChangeSummary;
  /** Deterministic quality score 0–100 (rule-based, build-time only). Added at build. */
  qualityScore?: number;
  /** Integrity metadata (added at build, not included in contentHash). */
  integrity?: {
    contentHash: string;
    registryHash?: string;
    integrityAlgorithm: "sha256";
    signedAtBuild: string;
  };
  /** Disclaimer IDs from /knowledge/policy/disclaimers.json. */
  disclaimerRefs?: string[];
};

export type KnowledgePage<T> = {
  meta: KnowledgeMeta;
  data: T;
};

export type RelatedEntities = {
  states?: string[];
  rankings?: string[];
  methodologies?: string[];
  verticals?: string[];
  national?: boolean;
};

export type NationalKnowledgeDataRaw = {
  stateCount: number;
  datasetUpdatedAt: string;
};

export type TrendSeries = {
  values: number[];
  min: number;
  max: number;
};

export type NationalKnowledgeDataDerived = {
  averageRate: number;
  medianRate: number;
  dispersionMetrics: {
    stdDev: number;
    min: number;
    max: number;
    spread: number;
  };
  highestState: { slug: string; name: string; rate: number };
  lowestState: { slug: string; name: string; rate: number };
  top5Highest: { slug: string; name: string; rate: number }[];
  top5Lowest: { slug: string; name: string; rate: number }[];
  /** Build-time trend arrays for sparklines (e.g. avgRateCentsPerKwh). */
  trends?: {
    avgRateCentsPerKwh?: TrendSeries;
  };
};

export type NationalKnowledgeData = {
  raw: NationalKnowledgeDataRaw;
  derived: NationalKnowledgeDataDerived;
  derivedMeta: DerivedMeta;
  relatedEntities: RelatedEntities;
};

export type StateKnowledgeDataRaw = {
  slug: string;
  name: string;
  postal: string | null;
  avgRateCentsPerKwh: number | null;
  updated: string;
};

export type StateKnowledgeDataDerived = {
  valueScore: number | null;
  affordabilityIndex: number | null;
  freshnessStatus: string;
  exampleBills: {
    kwh500: number | null;
    kwh1000: number | null;
    kwh1500: number | null;
  };
  relatedUrls: {
    statePage: string;
    utilitiesPage: string;
    plansPage: string;
    methodology: string[];
  };
  percentileRankings?: {
    ratePercentile: number | null;
    valueScorePercentile: number | null;
    affordabilityPercentile: number | null;
  };
  /** Build-time trend arrays for sparklines (e.g. avgRateCentsPerKwh). */
  trends?: {
    avgRateCentsPerKwh?: TrendSeries;
  };
  /** State vs national average comparison (build-time). */
  comparison?: {
    nationalAverage: number;
    differenceCents: number;
    differencePercent: number;
    category: string;
  };
  /** Electricity price momentum signal (build-time, requires history). */
  momentum: {
    enabled: boolean;
    signal: "accelerating" | "rising" | "stable" | "falling" | "unavailable";
    score: number | null;
    shortWindowChangePercent: number | null;
    longWindowChangePercent: number | null;
    windowPointsUsed: number;
    note?: string;
  };
};

export type OffersRef = {
  offersIndexUrl: string;
  offersConfigUrl: string;
  enabled: boolean;
};

export type StateKnowledgeData = {
  raw: StateKnowledgeDataRaw;
  derived: StateKnowledgeDataDerived;
  derivedMeta: DerivedMeta;
  relatedEntities: RelatedEntities;
  /** Reference to offers catalog. Monetization-ready, disabled by default. */
  offersRef?: OffersRef;
};

export type MethodologyMeta = {
  id: "epi" | "value-score" | "freshness" | "cagr" | "volatility" | "price-trend" | "momentum-signal";
  version: string;
  lastReviewedAt: string;
  relatedDerivedFields: string[];
};

export type DerivedMetaMethodology = {
  id: string;
  version: string;
  url: string;
  appliesToFields: string[];
};

export type DerivedMeta = {
  methodologiesUsed: DerivedMetaMethodology[];
};

export type MethodologyKnowledgeData = {
  definition: string;
  inputs: string[];
  steps: string[];
  limitations: string[];
  relatedInternalUrls: string[];
  relatedEntities: RelatedEntities;
};

export type RankingsKnowledgeData = {
  rankingType:
    | "affordability"
    | "value-score"
    | "rate-low-to-high"
    | "rate-high-to-low"
    | "cagr-25y"
    | "volatility-5y"
    | "price-trend"
    | "momentum-signal"
    | "electricity-inflation-1y"
    | "electricity-inflation-5y"
    | "electricity-affordability"
    | "most-expensive-electricity";
  sortedStates: Array<{
    rank: number;
    slug: string;
    name: string;
    metricValue: number;
    startRate?: number;
    endRate?: number;
    changePercent?: number;
    signal?: "accelerating" | "rising" | "stable" | "falling" | "unavailable";
    shortWindowChangePercent?: number;
    longWindowChangePercent?: number;
    value?: number;
    displayValue?: string;
  }>;
  generatedAt: string;
  derivedMeta: DerivedMeta;
  relatedEntities: RelatedEntities;
};

export type VerticalKnowledgeData = {
  status: "active" | "stub";
  summary: string;
  keyThemes: string[];
  relatedStates: string[];
  relatedRankings: string[];
  relatedMethodologies: string[];
  monitoringEndpoints: string[];
  expansionReadiness: {
    dataAvailable: boolean;
    plannedDatasets: string[];
    lastEvaluated: string;
  };
  relatedEntities: RelatedEntities;
};
