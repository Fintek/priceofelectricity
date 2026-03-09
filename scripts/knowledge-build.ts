import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const BUDGETS_MS = {
  total: 60000,
  loadSnapshots: 10000,
  normalizeStates: 10000,
  computeNational: 5000,
  generatePages: 25000,
  generateIndexes: 15000,
  writeFiles: 20000,
};

function bigintToMs(b: bigint): number {
  return Math.round(Number(b) / 1e6);
}

function checkBudget(phase: keyof typeof BUDGETS_MS, durationMs: number): void {
  const budget = BUDGETS_MS[phase];
  if (budget > 0 && durationMs > budget) {
    console.error(`knowledge:build failed - ${phase} exceeded budget: ${durationMs}ms > ${budget}ms`);
    process.exit(1);
  }
}
import { gzipSync } from "node:zlib";
import { SITE_URL } from "../src/lib/site";
import { buildKnowledgePack } from "../src/lib/knowledgePack";
import { buildContentRegistry } from "../src/lib/contentRegistry";
import { RAW_STATES } from "../src/data/raw/states.raw";
import {
  getKnowledgeNormalizedStates,
  getKnowledgeMethodologyRefs,
  getKnowledgeDataEndpoints,
} from "../src/lib/knowledge/common";
import { buildRegionMapping } from "./regions";
import { getCurrentSnapshot, getAllSnapshots } from "../src/lib/snapshotLoader";
import type {
  ChangeSummary,
  FieldProvenance,
  KnowledgeCitation,
  KnowledgeMeta,
  KnowledgePage,
  KnowledgeRegistryItem,
  MethodologyKnowledgeData,
  MethodologyMeta,
  NationalKnowledgeData,
  ProvenanceRef,
  RankingsKnowledgeData,
  StateKnowledgeData,
  VerticalKnowledgeData,
} from "../src/lib/knowledge/schema";

type KnowledgeMethodologyIndexItem = {
  id: "epi" | "value-score" | "freshness" | "cagr" | "volatility" | "price-trend" | "momentum-signal";
  title: string;
  jsonUrl: string;
  canonicalUrl: string;
  version: string;
  lastReviewedAt: string;
  relatedDerivedFields: string[];
};

type KnowledgeMethodologyIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  items: KnowledgeMethodologyIndexItem[];
};

type KnowledgeCompareStates = {
  schemaVersion: "1.0";
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

type KnowledgeRankingsIndexItem = {
  id: string;
  title: string;
  description: string;
  metricField: string;
  sortDirection: "asc" | "desc";
  jsonUrl: string;
  canonicalUrl: string;
  methodologiesUsed: Array<{ id: string; version: string }>;
};

type KnowledgeRankingsIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  items: KnowledgeRankingsIndexItem[];
};

type KnowledgeOffersIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
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
      partner: { name: string; type: "affiliate" | "leadgen" | "direct" };
    }>;
  }>;
};

type KnowledgeDisclaimers = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  disclaimers: Array<{ id: string; title: string; text: string }>;
  defaultSets: {
    dataHub: string[];
    knowledgePage: string[];
    statePage: string[];
    rankingsPage: string[];
    methodologyPage: string[];
  };
};

type KnowledgeBundlesIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  bundles: Array<{
    id: string;
    title: string;
    description: string;
    manifestUrl: string;
  }>;
};

type KnowledgeBundleManifest = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  bundleId: string;
  files: Array<{ url: string; contentHash?: string }>;
};

type KnowledgeIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  contractVersion?: string;
  registryHash: string;
  integritySignature: string;
  totalPages: number;
  contractUrl: string;
  changelogUrl: string;
  provenanceUrl: string;
  schemaMapUrl: string;
  entityIndexUrl: string;
  methodologyIndexUrl: string;
  compareUrl: string;
  rankingsIndexUrl: string;
  labelsUrl: string;
  glossaryFieldsUrl?: string;
  docsUrl?: string;
  docsJsonUrl?: string;
  ingestStarterPackUrl?: string;
  publicEndpointsUrl?: string;
  deprecationsUrl?: string;
  integrityManifestUrl?: string;
  capabilitiesUrl?: string;
  releaseUrl?: string;
  fingerprintUrl?: string;
  offersIndexUrl: string;
  offersConfigUrl: string;
  disclaimersUrl: string;
  bundlesIndexUrl?: string;
  historyBundlesIndexUrl?: string;
  buildProfileUrl?: string;
  leaderboardsUrl?: string;
  relatedIndexUrl?: string;
  items: KnowledgeRegistryItem[];
};

type KnowledgeContract = {
  schemaVersion: "1.0";
  contractVersion: string;
  generatedAt: string;
  sourceVersion: string;
  versionPolicy?: {
    schemaVersionMeaning: string;
    contractVersionMeaning: string;
    methodologyVersionMeaning: string;
    dataVersionMeaning: string;
  };
  deprecationPolicy?: {
    enabled: boolean;
    deprecationMapUrl: string;
    notice: string;
  };
  endpoints: {
    index: string;
    national: string;
    states: string;
    methodology: string;
    rankings: string;
    verticals: string;
  };
  snapshotSupport: {
    enabled: true;
    historyIndexUrl: "/knowledge/history/index.json";
    historyBundlesIndexUrl?: string;
    snapshotPattern: "/knowledge/history/{sourceVersion}/...";
  };
  provenanceCatalogUrl: string;
  /** URL to labels dictionary for Knowledge UI (i18n-ready). Used by human pages and future translation workflows. */
  labelsUrl: string;
  /** URL to policy disclaimers. Knowledge pages use meta.disclaimerRefs (array of disclaimer IDs) to reference which disclaimers apply. */
  disclaimersUrl: string;
  /** Human-readable developer documentation. */
  docsUrl?: string;
  /** Machine-friendly docs index JSON. */
  docsJsonUrl?: string;
  offersSupport?: {
    enabledByDefault: boolean;
    offersIndexUrl: string;
    offersConfigUrl: string;
    stateOffersRefField: string;
    gatingRules?: string;
  };
  provenanceSupport: {
    enabled: true;
    fieldLevel: true;
  };
  glossarySupport?: {
    enabled: boolean;
    fieldsUrl: string;
    fieldIdConvention: string;
  };
  jsonLdSupport?: {
    enabled: boolean;
    documentation: string;
  };
  querySurfaces: {
    searchIndexUrl: string;
    schemaMapUrl: string;
    entityIndexUrl: string;
    publicEndpointsUrl?: string;
    methodologyIndexUrl: string;
    compareStatesUrl: string;
    rankingsIndexUrl: string;
    bundlesIndexUrl?: string;
    buildProfileUrl?: string;
    leaderboardsUrl?: string;
    ingestStarterPackUrl?: string;
    relatedIndexUrl?: string;
  };
  pageTypes: Array<{
    type: "national" | "state" | "methodology" | "rankings" | "vertical";
    requiredMetaFields: string[];
    requiredDataFields: string[];
  }>;
  compatibility: {
    guarantees: string[];
    breakingChangePolicy: string;
  };
  stability: {
    deterministicSerialization: boolean;
    regressionGuardUrl: string;
    schemaFreezeEnforced: boolean;
  };
  integrity?: {
    algorithm: string;
    indexIntegrityField: string;
    pageIntegrityField: string;
    manifestUrl?: string;
    verificationNote?: string;
  };
  capabilitiesUrl?: string;
  capabilitiesNote?: string;
  releaseUrl?: string;
  releaseNote?: string;
  changeTracking?: {
    enabled: boolean;
    thresholdPercent: number;
    changelogUrl: string;
  };
};

/** Stable keys for Knowledge UI labels (i18n-ready). Build generates /knowledge/labels/en.json. */
const KNOWLEDGE_LABELS: Record<string, string> = {
  "nav.dataHub": "Data Hub",
  "nav.knowledgeDirectory": "Knowledge Directory",
  "nav.viewJson": "View JSON",
  "nav.downloadJson": "Download JSON",
  "nav.backToDataHub": "Back to Data Hub",
  "nav.backToKnowledgeDirectory": "Back to Knowledge Directory",
  "section.freshness": "Freshness",
  "section.provenance": "Provenance",
  "section.whatChanged": "What Changed",
  "section.relatedEntities": "Related",
  "badge.quality": "Quality",
  "badge.sourceVersion": "Source version",
  "badge.semanticCluster": "Cluster",
  "field.avgRateCentsPerKwh": "Avg rate (¢/kWh)",
  "field.valueScore": "Value score",
  "field.affordabilityIndex": "Affordability",
  "field.exampleBill1000kwh": "Example bill (1000 kWh)",
  "field.updated": "Updated",
  "field.medianRateCentsPerKwh": "Median rate (¢/kWh)",
  "field.dispersionMinMax": "Dispersion (min–max)",
  "status.fresh": "Fresh",
  "status.aging": "Aging",
  "status.stale": "Stale",
  "status.unknown": "Unknown",
  "dl.status": "Status",
  "dl.datasetUpdatedAt": "Dataset updated at",
  "dl.ageDays": "Age (days)",
  "link.freshnessMethodology": "How freshness is determined",
  "preview.label": "Preview",
  "collapse.label": "Collapse",
  "section.relatedEntitiesTitle": "Related entities",
  "entity.national": "National",
  "entity.states": "States",
  "entity.rankings": "Rankings",
  "entity.methodologies": "Methodologies",
  "entity.verticals": "Verticals",
  "entity.nationalOverview": "National overview",
  "breadcrumb.home": "Home",
  "breadcrumb.knowledge": "Knowledge",
  "breadcrumb.directory": "Directory",
  "breadcrumb.state": "State",
  "table.field": "Field",
  "table.previous": "Previous",
  "table.current": "Current",
  "change.compareToVersion": "Compared to version",
};

const CHANGE_THRESHOLD_PERCENT = 1;

type MetricFieldChange = {
  field: string;
  previousValue: number;
  currentValue: number;
  absoluteDelta: number;
  percentDelta: number;
};

type StateMetricChanges = {
  slug: string;
  fieldsChanged: MetricFieldChange[];
};

type NationalMetricChange = MetricFieldChange;

type KnowledgeChangelog = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  contractVersion: string;
  notes: "Build-generated knowledge pages.";
  diff: {
    added: Array<{ jsonUrl: string; contentHash: string }>;
    removed: Array<{ jsonUrl: string; contentHash: string }>;
    changed: Array<{ jsonUrl: string; fromHash: string; toHash: string }>;
  };
  metricChanges: {
    states: StateMetricChanges[];
    national: NationalMetricChange[];
  };
};

type KnowledgeHistorySnapshot = {
  sourceVersion: string;
  indexUrl: string;
  generatedAt: string;
  pageCount: number;
  indexContentHash: string;
  registryHash: string;
};

type KnowledgeHistoryIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  snapshots: KnowledgeHistorySnapshot[];
};

type KnowledgeSchemaEntity = {
  type: "national" | "state" | "methodology" | "rankings" | "vertical" | "compare";
  jsonPattern: string;
  metaFields: string[];
  dataFields: string[];
  filterableFields: string[];
  sortableFields: string[];
  fieldGroups?: {
    raw: string[];
    derived: string[];
  };
};

type KnowledgeSchemaMap = {
  schemaVersion: "1.0";
  generatedAt: string;
  entities: KnowledgeSchemaEntity[];
};

type KnowledgeEntityIndexItem = {
  id: string;
  type: string;
  slug: string;
  title?: string;
  jsonUrl: string;
  canonicalUrl: string;
  semanticCluster: string;
  temporalContext: {
    sourceVersion: string;
    isLatest: boolean;
  };
};

type KnowledgeEntityIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  entities: KnowledgeEntityIndexItem[];
};

type KnowledgeSearchIndexItem = {
  id: string;
  type: string;
  slug: string;
  title: string;
  canonicalUrl: string;
  excerpt: string;
  qualityScore: number;
  freshnessStatus: string;
  ageDays?: number;
  /** Searchable tokens including excerpt words, qualityScore, and freshnessStatus for filtering. */
  tokens?: string[];
};

type KnowledgeSearchInsight =
  | { type: "insight"; subject: "state" | "national" | "ranking"; id: string; statement: string }
  | { type: "comparison"; subject: "state"; id: string; statement: string; keywords?: string[] };

type KnowledgeSearchIndex = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  totalEntities: number;
  entities: KnowledgeSearchIndexItem[];
  insights?: KnowledgeSearchInsight[];
};

type KnowledgeRegression = {
  schemaVersion: "1.0";
  generatedAt: string;
  sourceVersion: string;
  entityTypeCounts: {
    national: number;
    state: number;
    methodology: number;
    rankings: number;
    vertical: number;
  };
  fieldFingerprints: Record<string, string>;
};

type KnowledgeProvenanceCatalog = {
  schemaVersion: "1.0";
  generatedAt: string;
  sources: ProvenanceRef[];
};

type GraphNode = { id: string; type: string; url: string };
type GraphEdge = { from: string; to: string; rel: string };
type KnowledgeGraphEdge = {
  from: string;
  to: string;
  relation: "references" | "derived-from" | "related-to";
};

const KNOWLEDGE_ROOT = path.join(process.cwd(), "public", "knowledge");

const EIA_HISTORY_CSV_PATH = path.join(process.cwd(), "data", "normalized", "eia", "retail_res_monthly_2000_present.csv");

const POSTAL_TO_SLUG: Record<string, string> = {
  AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california",
  CO: "colorado", CT: "connecticut", DC: "district-of-columbia", DE: "delaware",
  FL: "florida", GA: "georgia", HI: "hawaii", ID: "idaho", IL: "illinois",
  IN: "indiana", IA: "iowa", KS: "kansas", KY: "kentucky", LA: "louisiana",
  ME: "maine", MD: "maryland", MA: "massachusetts", MI: "michigan", MN: "minnesota",
  MS: "mississippi", MO: "missouri", MT: "montana", NE: "nebraska", NV: "nevada",
  NH: "new-hampshire", NJ: "new-jersey", NM: "new-mexico", NY: "new-york",
  NC: "north-carolina", ND: "north-dakota", OH: "ohio", OK: "oklahoma", OR: "oregon",
  PA: "pennsylvania", RI: "rhode-island", SC: "south-carolina", SD: "south-dakota",
  TN: "tennessee", TX: "texas", UT: "utah", VT: "vermont", VA: "virginia",
  WA: "washington", WV: "west-virginia", WI: "wisconsin", WY: "wyoming",
};

type EiaHistoryResult = {
  historyAvailable: boolean;
  firstDate?: string;
  lastDate?: string;
  count?: number;
  byState?: Map<string, { periods: string[]; values: number[] }>;
};

async function loadEiaHistory(): Promise<EiaHistoryResult> {
  try {
    if (!existsSync(EIA_HISTORY_CSV_PATH)) return { historyAvailable: false };
    const raw = await readFile(EIA_HISTORY_CSV_PATH, "utf8");
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return { historyAvailable: false };

    const header = lines[0].split(",").map((c) => c.trim().toLowerCase());
    const periodIdx = header.indexOf("period");
    const stateIdx = header.indexOf("stateid");
    const priceIdx = header.indexOf("price");
    const sectorIdx = header.indexOf("sectorid");
    if (periodIdx < 0 || stateIdx < 0 || priceIdx < 0) return { historyAvailable: false };

    const byState = new Map<string, { periods: string[]; values: number[] }>();
    const allPeriods = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const period = cols[periodIdx] ?? "";
      const stateid = (cols[stateIdx] ?? "").toUpperCase();
      const sectorid = (sectorIdx >= 0 ? cols[sectorIdx] ?? "" : "RES");
      const price = Number(cols[priceIdx] ?? "");
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) continue;
      if (!/^[A-Z]{2}$/.test(stateid) || !POSTAL_TO_SLUG[stateid]) continue;
      if (sectorid !== "RES") continue;
      if (!Number.isFinite(price) || price < 0) continue;

      const slug = POSTAL_TO_SLUG[stateid];
      let entry = byState.get(slug);
      if (!entry) {
        entry = { periods: [], values: [] };
        byState.set(slug, entry);
      }
      entry.periods.push(period);
      entry.values.push(Math.round(price * 100) / 100);
      allPeriods.add(period);
    }

    const periods = Array.from(allPeriods).sort();
    if (periods.length < 24) return { historyAvailable: false };
    const firstDate = periods[0];
    const lastDate = periods[periods.length - 1];
    const count = byState.size > 0
      ? Array.from(byState.values()).reduce((s, e) => s + e.periods.length, 0)
      : 0;
    return {
      historyAvailable: byState.size >= 10 && periods.length >= 24,
      firstDate,
      lastDate,
      count,
      byState,
    };
  } catch {
    return { historyAvailable: false };
  }
}

function slugToDisplayName(slug: string): string {
  if (slug === "district-of-columbia") return "District of Columbia";
  return slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

function computeComparisonCategory(differencePercent: number): string {
  if (differencePercent > 25) return "much higher than national average";
  if (differencePercent > 10) return "higher than national average";
  if (differencePercent < -25) return "much lower than national average";
  if (differencePercent < -10) return "lower than national average";
  return "close to national average";
}

type InsightItem = { type: string; statement: string; confidence: "high" | "medium" | "low" };

function buildNationalInsights(nat: {
  highestState?: { name?: string; rate?: number };
  lowestState?: { name?: string; rate?: number };
  averageRate?: number;
  medianRate?: number;
  top5Highest?: Array<{ name?: string; rate?: number }>;
  top5Lowest?: Array<{ name?: string; rate?: number }>;
  dispersionMetrics?: { spread?: number };
}): InsightItem[] {
  const out: InsightItem[] = [];
  const high = nat.highestState;
  const low = nat.lowestState;
  const avg = nat.averageRate;
  const median = nat.medianRate;
  const top5 = nat.top5Highest ?? [];
  const bottom5 = nat.top5Lowest ?? [];
  const spread = nat.dispersionMetrics?.spread;

  if (typeof avg === "number") {
    out.push({ type: "price", statement: `The national average electricity rate is ${avg.toFixed(2)} cents per kWh.`, confidence: "high" });
  }
  if (typeof median === "number") {
    out.push({ type: "price", statement: `The national median electricity rate is ${median.toFixed(2)} cents per kWh.`, confidence: "high" });
  }
  if (high?.name && low?.name && typeof high.rate === "number" && typeof low.rate === "number" && low.rate > 0) {
    const ratio = high.rate / low.rate;
    if (ratio >= 2.5) {
      out.push({ type: "price", statement: `Electricity prices in ${high.name} are more than ${Math.floor(ratio)} times higher than in ${low.name}.`, confidence: "high" });
    } else {
      out.push({ type: "price", statement: `${high.name} has the highest electricity rate (${high.rate.toFixed(2)} ¢/kWh); ${low.name} has the lowest (${low.rate.toFixed(2)} ¢/kWh).`, confidence: "high" });
    }
  }
  if (typeof spread === "number" && spread > 0) {
    out.push({ type: "price", statement: `The gap between the highest and lowest state electricity rates is ${spread.toFixed(2)} cents per kWh.`, confidence: "medium" });
  }
  if (top5.length >= 3) {
    const names = top5.slice(0, 3).map((s) => s.name ?? "unknown").join(", ");
    out.push({ type: "ranking", statement: `States with the highest electricity prices include ${names}.`, confidence: "medium" });
  }
  if (bottom5.length >= 3) {
    const names = bottom5.slice(0, 3).map((s) => s.name ?? "unknown").join(", ");
    out.push({ type: "ranking", statement: `States with the lowest electricity prices include ${names}.`, confidence: "medium" });
  }
  return out.slice(0, 6);
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use */
function buildStateInsights(
  state: { slug: string; name: string; avgRateCentsPerKwh: number | null },
  nationalAvg: number,
  rateRank: number,
  totalStates: number,
): InsightItem[] {
  const out: InsightItem[] = [];
  const rate = state.avgRateCentsPerKwh;
  const name = state.name || slugToDisplayName(state.slug);

  if (typeof rate === "number" && Number.isFinite(nationalAvg) && nationalAvg > 0) {
    const pct = ((rate - nationalAvg) / nationalAvg) * 100;
    if (Math.abs(pct) >= 5) {
      const dir = pct > 0 ? "more" : "less";
      out.push({ type: "price", statement: `Electricity in ${name} costs ${Math.abs(pct).toFixed(0)}% ${dir} than the national average.`, confidence: "high" });
    }
    out.push({ type: "price", statement: `${name} average electricity rate is ${rate.toFixed(2)} cents per kWh.`, confidence: "high" });
  }
  if (rateRank > 0 && totalStates > 0) {
    out.push({ type: "ranking", statement: `${name} ranks #${rateRank} among U.S. states for electricity prices.`, confidence: "high" });
    if (rateRank <= 10) {
      out.push({ type: "ranking", statement: `Electricity in ${name} is among the top 10 most expensive in the U.S.`, confidence: "medium" });
    } else if (rateRank >= totalStates - 9) {
      out.push({ type: "ranking", statement: `Electricity in ${name} is among the 10 least expensive in the U.S.`, confidence: "medium" });
    }
  }
  return out.slice(0, 6);
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use */
function _buildRankingInsights(
  rankingSlug: string,
  title: string,
  sortedStates: Array<{ rank: number; slug: string; name: string; metricValue: number }>,
  enabled: boolean,
): InsightItem[] {
  const out: InsightItem[] = [];
  if (!enabled || sortedStates.length === 0) {
    out.push({ type: "meta", statement: "This ranking requires historical data. History is currently unavailable.", confidence: "low" });
    return out;
  }
  const top = sortedStates[0];
  if (top) {
    out.push({ type: "ranking", statement: `${top.name} ranks #1 in this ${title} ranking.`, confidence: "high" });
  }
  if (sortedStates.length >= 2) {
    const first = sortedStates[0]?.metricValue;
    const last = sortedStates[sortedStates.length - 1]?.metricValue;
    if (typeof first === "number" && typeof last === "number" && first !== last) {
      const gap = Math.abs(first - last);
      out.push({ type: "price", statement: `The gap between the top and bottom states is ${gap.toFixed(2)}.`, confidence: "medium" });
    }
  }
  if (sortedStates.length >= 5) {
    const top5 = sortedStates.slice(0, 5);
    const avg = top5.reduce((s, r) => s + r.metricValue, 0) / 5;
    out.push({ type: "price", statement: `The top 5 states average ${avg.toFixed(2)}.`, confidence: "medium" });
  }
  return out.slice(0, 6);
}

function computeCagrFromHistory(
  byState: Map<string, { periods: string[]; values: number[] }>,
  targetYears: number,
  nameBySlug?: Map<string, string>,
): Array<{ slug: string; name: string; metricValue: number }> {
  const getName = (slug: string) => nameBySlug?.get(slug) ?? slugToDisplayName(slug);
  const results: Array<{ slug: string; name: string; metricValue: number }> = [];
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  const startYear = endYear - targetYears;
  const startTarget = `${startYear}-${String(endMonth).padStart(2, "0")}`;

  for (const [slug, entry] of byState.entries()) {
    const sorted = entry.periods
      .map((p, i) => ({ period: p, value: entry.values[i] }))
      .sort((a, b) => a.period.localeCompare(b.period));
    if (sorted.length < 2) continue;

    const last = sorted[sorted.length - 1];
    const startEntry = sorted.find((s) => s.period >= startTarget) ?? sorted[0];
    const startVal = startEntry.value;
    const endVal = last.value;
    if (startVal <= 0 || endVal <= 0) continue;

    const [sy, sm] = startEntry.period.split("-").map(Number);
    const [ey, em] = last.period.split("-").map(Number);
    const years = (ey - sy) + (em - sm) / 12;
    if (years < 1) continue;

    const cagr = (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
    if (!Number.isFinite(cagr)) continue;
    results.push({
      slug,
      name: getName(slug),
      metricValue: Math.round(cagr * 100) / 100,
    });
  }
  return results.sort((a, b) => b.metricValue - a.metricValue);
}

type PriceTrendRow = {
  slug: string;
  name: string;
  metricValue: number;
  startRate: number;
  endRate: number;
  changePercent: number;
  annualizedTrend: number;
};

type MomentumRow = {
  slug: string;
  name: string;
  metricValue: number;
  signal: "accelerating" | "rising" | "stable" | "falling";
  shortWindowChangePercent: number;
  longWindowChangePercent: number;
  windowPointsUsed: number;
};

function computeMomentumFromHistory(
  byState: Map<string, { periods: string[]; values: number[] }>,
  nameBySlug?: Map<string, string>,
): Array<MomentumRow> {
  const getName = (slug: string) => nameBySlug?.get(slug) ?? slugToDisplayName(slug);
  const results: MomentumRow[] = [];
  const MIN_POINTS = 6;
  const SHORT_MONTHS = 12;
  const LONG_MONTHS = 24;

  for (const [slug, entry] of byState.entries()) {
    const sorted = entry.periods
      .map((p, i) => ({ period: p, value: entry.values[i] }))
      .sort((a, b) => a.period.localeCompare(b.period));
    if (sorted.length < MIN_POINTS) continue;

    const last = sorted[sorted.length - 1];
    const lastIdx = sorted.length - 1;
    const shortIdx = Math.max(0, lastIdx - SHORT_MONTHS);
    const longIdx = Math.max(0, lastIdx - LONG_MONTHS);
    const shortEntry = sorted[shortIdx];
    const longEntry = sorted[longIdx];
    const startRate = longEntry.value;
    const shortRate = shortEntry.value;
    const endRate = last.value;
    if (startRate <= 0 || shortRate <= 0) continue;

    const shortWindowChange = ((endRate - shortRate) / shortRate) * 100;
    const longWindowChange = ((endRate - startRate) / startRate) * 100;
    const shortYears = (lastIdx - shortIdx) / 12;
    const longYears = (lastIdx - longIdx) / 12;
    const longPerYear = longYears > 0 ? longWindowChange / longYears : 0;
    const acceleration = shortWindowChange - (shortYears > 0 ? longPerYear * shortYears : 0);

    let signal: MomentumRow["signal"];
    if (shortWindowChange > 3 && acceleration > 1) signal = "accelerating";
    else if (shortWindowChange > 1) signal = "rising";
    else if (shortWindowChange < -1) signal = "falling";
    else signal = "stable";

    let momentumScore: number;
    if (signal === "accelerating") momentumScore = 2 + shortWindowChange;
    else if (signal === "rising") momentumScore = 1 + shortWindowChange;
    else if (signal === "stable") momentumScore = 0;
    else momentumScore = -1 + shortWindowChange;

    results.push({
      slug,
      name: getName(slug),
      metricValue: Math.round(momentumScore * 100) / 100,
      signal,
      shortWindowChangePercent: Math.round(shortWindowChange * 100) / 100,
      longWindowChangePercent: Math.round(longWindowChange * 100) / 100,
      windowPointsUsed: sorted.length,
    });
  }
  return results.sort((a, b) => b.metricValue - a.metricValue);
}

function computePriceTrendFromHistory(
  byState: Map<string, { periods: string[]; values: number[] }>,
  targetYears: number,
  nameBySlug?: Map<string, string>,
): Array<PriceTrendRow> {
  const getName = (slug: string) => nameBySlug?.get(slug) ?? slugToDisplayName(slug);
  const results: PriceTrendRow[] = [];
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  const startYear = endYear - targetYears;
  const startTarget = `${startYear}-${String(endMonth).padStart(2, "0")}`;

  for (const [slug, entry] of byState.entries()) {
    const sorted = entry.periods
      .map((p, i) => ({ period: p, value: entry.values[i] }))
      .sort((a, b) => a.period.localeCompare(b.period));
    if (sorted.length < 2) continue;

    const last = sorted[sorted.length - 1];
    const startEntry = sorted.find((s) => s.period >= startTarget) ?? sorted[0];
    const startRate = startEntry.value;
    const endRate = last.value;
    if (startRate <= 0) continue;

    const trendChange = ((endRate - startRate) / startRate) * 100;
    const [sy, sm] = startEntry.period.split("-").map(Number);
    const [ey, em] = last.period.split("-").map(Number);
    const years = ey - sy + (em - sm) / 12;
    if (years < 0.5) continue;

    const annualizedTrend = trendChange / years;
    if (!Number.isFinite(annualizedTrend)) continue;

    results.push({
      slug,
      name: getName(slug),
      metricValue: Math.round(annualizedTrend * 100) / 100,
      startRate: Math.round(startRate * 100) / 100,
      endRate: Math.round(endRate * 100) / 100,
      changePercent: Math.round(trendChange * 100) / 100,
      annualizedTrend: Math.round(annualizedTrend * 100) / 100,
    });
  }
  return results.sort((a, b) => b.annualizedTrend - a.annualizedTrend);
}

function computeVolatilityFromHistory(
  byState: Map<string, { periods: string[]; values: number[] }>,
  windowYears: number,
): Array<{ slug: string; name: string; metricValue: number }> {
  const slugToName = new Map<string, string>();
  for (const [slug] of byState.entries()) {
    const name = slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
    slugToName.set(slug, name);
  }
  const cutoff = `${new Date().getFullYear() - windowYears}-01`;
  const results: Array<{ slug: string; name: string; metricValue: number }> = [];

  for (const [slug, entry] of byState.entries()) {
    const windowed = entry.periods
      .map((p, i) => ({ period: p, value: entry.values[i] }))
      .filter((x) => x.period >= cutoff)
      .sort((a, b) => a.period.localeCompare(b.period));
    if (windowed.length < 12) continue;

    const vals = windowed.map((x) => x.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length - 1 || 1);
    const stdev = Math.sqrt(variance);
    const volPct = mean > 0 ? (stdev / mean) * 100 : 0;
    if (!Number.isFinite(volPct)) continue;
    results.push({
      slug,
      name: slugToName.get(slug) ?? slug,
      metricValue: Math.round(volPct * 100) / 100,
    });
  }
  return results.sort((a, b) => b.metricValue - a.metricValue);
}

const METHODOLOGY_VERSION = "1.0";

/** Single source of truth for contract version. All generated files must reference this. */
const CONTRACT_VERSION = "1.0.0";

const SIZE_BUDGETS_BYTES: Record<string, number> = {
  "knowledge/index.json": 250_000,
  "knowledge/entity-index.json": 500_000,
  "knowledge/search-index.json": 1_200_000,
  "knowledge/schema-map.json": 300_000,
  "knowledge/provenance.json": 500_000,
  "knowledge/contract.json": 200_000,
  "knowledge/changelog.json": 400_000,
  "knowledge/regression.json": 200_000,
  "knowledge/national.json": 200_000,
  "knowledge/state/*.json": 120_000,
  "knowledge/rankings/*.json": 300_000,
  "knowledge/methodology/*.json": 200_000,
  "knowledge/vertical/*.json": 200_000,
};

const COMPRESSION_TARGETS = [
  "knowledge/search-index.json",
  "knowledge/entity-index.json",
  "knowledge/schema-map.json",
  "knowledge/provenance.json",
];

const GZIP_THRESHOLD_BYTES = 100_000;

const PROVENANCE_SOURCES: Readonly<Record<string, Omit<ProvenanceRef, "retrievedAt">>> = {
  "eia-retail-sales-923": {
    id: "eia-retail-sales-923",
    sourceName: "U.S. Energy Information Administration (EIA) Retail Sales of Electricity",
    sourceUrl: "https://api.eia.gov/v2/electricity/retail-sales/data/",
    publisher: "U.S. Energy Information Administration",
    license: "U.S. Government work (public domain)",
    notes: "Primary source for state residential electricity rate series used by snapshots.",
  },
  "poe-methodology-epi": {
    id: "poe-methodology-epi",
    sourceName: "PriceOfElectricity.com methodology: Electricity Price Index",
    sourceUrl: "/methodology/electricity-price-index",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-methodology-value-score": {
    id: "poe-methodology-value-score",
    sourceName: "PriceOfElectricity.com methodology: Value Score",
    sourceUrl: "/methodology/value-score",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-methodology-freshness": {
    id: "poe-methodology-freshness",
    sourceName: "PriceOfElectricity.com methodology: Freshness Scoring",
    sourceUrl: "/methodology/freshness-scoring",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-methodology-cagr": {
    id: "poe-methodology-cagr",
    sourceName: "PriceOfElectricity.com methodology: CAGR",
    sourceUrl: "/knowledge/methodology/cagr",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-methodology-volatility": {
    id: "poe-methodology-volatility",
    sourceName: "PriceOfElectricity.com methodology: Volatility",
    sourceUrl: "/knowledge/methodology/volatility",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-methodology-price-trend": {
    id: "poe-methodology-price-trend",
    sourceName: "PriceOfElectricity.com methodology: Price Trend",
    sourceUrl: "/knowledge/methodology/price-trend",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-methodology-momentum-signal": {
    id: "poe-methodology-momentum-signal",
    sourceName: "PriceOfElectricity.com methodology: Momentum Signal",
    sourceUrl: "/knowledge/methodology/momentum-signal",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-dataset-states-json": {
    id: "poe-dataset-states-json",
    sourceName: "PriceOfElectricity.com dataset endpoint: states.json",
    sourceUrl: "/api/datasets/states.json",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-dataset-states-csv": {
    id: "poe-dataset-states-csv",
    sourceName: "PriceOfElectricity.com dataset endpoint: states.csv",
    sourceUrl: "/api/datasets/states.csv",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-dataset-affordability-csv": {
    id: "poe-dataset-affordability-csv",
    sourceName: "PriceOfElectricity.com dataset endpoint: affordability.csv",
    sourceUrl: "/api/datasets/affordability.csv",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-dataset-value-ranking-csv": {
    id: "poe-dataset-value-ranking-csv",
    sourceName: "PriceOfElectricity.com dataset endpoint: value-ranking.csv",
    sourceUrl: "/api/datasets/value-ranking.csv",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
  "poe-vertical-ai-energy": {
    id: "poe-vertical-ai-energy",
    sourceName: "PriceOfElectricity.com vertical: AI Energy",
    sourceUrl: "/v/ai-energy",
    publisher: "PriceOfElectricity.com",
    license: "Site content license",
  },
};

function ensureAbsoluteUrl(relativeOrAbsoluteUrl: string): string {
  if (relativeOrAbsoluteUrl.startsWith("http://") || relativeOrAbsoluteUrl.startsWith("https://")) {
    return relativeOrAbsoluteUrl;
  }
  const base = SITE_URL.endsWith("/") ? SITE_URL.slice(0, -1) : SITE_URL;
  return `${base}${relativeOrAbsoluteUrl.startsWith("/") ? "" : "/"}${relativeOrAbsoluteUrl}`;
}

function makeJsonPath(relativeJsonUrl: string): string {
  const local = relativeJsonUrl.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", local);
}

function buildPageProvenance(
  ids: readonly string[],
  retrievedAt: string,
): ProvenanceRef[] {
  const unique = [...new Set(ids)].sort((a, b) => a.localeCompare(b));
  return unique.map((id) => {
    const source = PROVENANCE_SOURCES[id];
    if (!source) {
      throw new Error(`Unknown provenance id: ${id}`);
    }
    return {
      ...source,
      sourceUrl: source.sourceUrl
        ? ensureAbsoluteUrl(source.sourceUrl)
        : undefined,
      retrievedAt,
    };
  });
}

function citationsFromProvenance(provenance: ProvenanceRef[]): KnowledgeCitation[] {
  return provenance.map((source) => ({
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    retrievedAt: source.retrievedAt,
    notes: source.notes,
  }));
}

function getSchemaEntityOrder(
  type: KnowledgeSchemaEntity["type"],
): number {
  const order: Record<KnowledgeSchemaEntity["type"], number> = {
    national: 0,
    state: 1,
    methodology: 2,
    rankings: 3,
    vertical: 4,
    compare: 5,
  };
  return order[type];
}

function getJsonPatternForType(type: KnowledgeSchemaEntity["type"]): string {
  switch (type) {
    case "national":
      return "/knowledge/national.json";
    case "state":
      return "/knowledge/state/{slug}.json";
    case "methodology":
      return "/knowledge/methodology/{id}.json";
    case "rankings":
      return "/knowledge/rankings/{id}.json";
    case "vertical":
      return "/knowledge/vertical/{id}.json";
    case "compare":
      return "/knowledge/compare/states.json";
    default:
      return "/knowledge/index.json";
  }
}

/** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ" to ms. Returns NaN if unparseable. */
function parseDatasetDateToMs(value: string): number {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.getTime() : NaN;
}

function buildFreshnessBlock(params: {
  datasetUpdatedAt: string;
  computedAt: string;
}): KnowledgeMeta["freshness"] {
  const { datasetUpdatedAt, computedAt } = params;
  const datasetMs = parseDatasetDateToMs(datasetUpdatedAt);
  const computedMs = parseDatasetDateToMs(computedAt);
  const ageDays =
    !Number.isNaN(datasetMs) && !Number.isNaN(computedMs)
      ? Math.floor((computedMs - datasetMs) / 86400000)
      : undefined;
  let status: "fresh" | "aging" | "stale" | "unknown";
  if (ageDays === undefined || ageDays < 0) {
    status = "unknown";
  } else if (ageDays <= 45) {
    status = "fresh";
  } else if (ageDays <= 120) {
    status = "aging";
  } else {
    status = "stale";
  }
  return {
    datasetUpdatedAt,
    computedAt,
    status,
    ...(ageDays !== undefined && ageDays >= 0 && { ageDays }),
    methodology: {
      id: "freshness",
      version: METHODOLOGY_VERSION,
      url: ensureAbsoluteUrl("/knowledge/methodology/freshness.json"),
      canonicalUrl: ensureAbsoluteUrl("/knowledge/methodology/freshness"),
    },
  };
}

const EXCERPT_MAX_LEN = 280;

type FactItem = { label: string; value: string | number; unit?: string; sourceField: string };

/** Deterministic quality score 0-100. Rule-based deductions only. */
function computeQualityScore(meta: { freshness?: { status?: string }; provenance?: unknown[]; excerpt?: string }, data: Record<string, unknown>, pageType: string): number {
  let score = 100;
  const f = meta.freshness;
  if (f?.status === "aging") score -= 10;
  if (f?.status === "stale") score -= 25;
  const prov = meta.provenance;
  if (!Array.isArray(prov) || prov.length < 1) score -= 10;
  const excerpt = meta.excerpt;
  if (typeof excerpt !== "string" || excerpt.length < 50) score -= 5;
  const factsRequired = ["state", "national", "rankings"].includes(pageType);
  if (factsRequired) {
    const facts = data?.facts;
    if (!Array.isArray(facts) || facts.length < 5) score -= 5;
  }
  const derived = data?.derived;
  const derivedMeta = data?.derivedMeta as { methodologiesUsed?: Array<{ appliesToFields?: string[] }> } | undefined;
  if (derived && derivedMeta?.methodologiesUsed) {
    const allAppliesTo = new Set<string>();
    for (const m of derivedMeta.methodologiesUsed) {
      for (const p of m.appliesToFields ?? []) allAppliesTo.add(p);
    }
    const derivedPaths: string[] = [];
    function collectPaths(obj: unknown, prefix: string) {
      if (!obj || typeof obj !== "object") return;
      for (const k of Object.keys(obj as Record<string, unknown>)) {
        const p = prefix ? `${prefix}.${k}` : k;
        const v = (obj as Record<string, unknown>)[k];
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
          collectPaths(v, p);
        } else {
          derivedPaths.push(p);
        }
      }
    }
    collectPaths(derived, "");
    const uncovered = derivedPaths.filter((fp) => {
      const fullPath = `data.derived.${fp}`;
      const covered =
        allAppliesTo.has(fullPath) ||
        fullPath.split(".").some((_, i, parts) => allAppliesTo.has(parts.slice(0, i + 1).join(".")));
      return !covered;
    });
    if (uncovered.length > 0) score -= 15;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function truncateExcerpt(s: string): string {
  if (s.length <= EXCERPT_MAX_LEN) return s;
  return s.slice(0, EXCERPT_MAX_LEN - 3) + "...";
}

function buildNationalExcerpt(data: NationalKnowledgeData): string {
  const avg = data.derived.averageRate;
  const med = data.derived.medianRate;
  const hi = data.derived.highestState;
  const lo = data.derived.lowestState;
  const parts: string[] = [];
  parts.push("US residential electricity rate overview.");
  if (typeof avg === "number" && Number.isFinite(avg))
    parts.push(`Avg ${avg.toFixed(2)}¢/kWh`);
  if (typeof med === "number" && Number.isFinite(med))
    parts.push(`median ${med.toFixed(2)}¢/kWh`);
  if (hi?.name && typeof hi.rate === "number")
    parts.push(`Highest: ${hi.name} (${hi.rate.toFixed(2)}¢)`);
  if (lo?.name && typeof lo.rate === "number")
    parts.push(`Lowest: ${lo.name} (${lo.rate.toFixed(2)}¢)`);
  return truncateExcerpt(parts.join(" "));
}

function buildStateExcerpt(data: StateKnowledgeData): string {
  const name = data.raw?.name ?? "State";
  const rate = data.raw?.avgRateCentsPerKwh;
  const vs = data.derived?.valueScore;
  const aff = data.derived?.affordabilityIndex;
  const fresh = data.derived?.freshnessStatus ?? "unknown";
  const parts: string[] = [];
  parts.push(`${name} residential electricity snapshot.`);
  if (typeof rate === "number" && Number.isFinite(rate))
    parts.push(`Avg ${rate.toFixed(2)}¢/kWh`);
  if (typeof vs === "number" && Number.isFinite(vs))
    parts.push(`Value score ${vs}`);
  if (typeof aff === "number" && Number.isFinite(aff))
    parts.push(`Affordability ${aff}`);
  parts.push(`Data freshness: ${fresh}.`);
  return truncateExcerpt(parts.join(" "));
}

function buildMethodologyExcerpt(title: string, slug: string): string {
  const metricName =
    slug === "epi"
      ? "Electricity Price Index"
      : slug === "value-score"
        ? "value score"
        : slug === "freshness"
          ? "freshness status"
          : slug === "cagr"
            ? "CAGR"
            : slug === "volatility"
              ? "volatility index"
              : "metrics";
  return truncateExcerpt(
    `${title}. Defines how ${metricName} is computed from inputs and produces derived fields used across state and ranking pages.`,
  );
}

function buildRankingsExcerpt(
  title: string,
  metricShort: string,
  direction: "asc" | "desc",
  topName?: string,
): string {
  const dir = direction === "asc" ? "asc" : "desc";
  let s = `${title}. Ranks states by ${metricShort} (${dir}).`;
  if (topName) s += ` Top 1: ${topName}.`;
  return truncateExcerpt(s);
}

function buildVerticalExcerpt(
  title: string,
  status: string,
  relatedCount: number,
): string {
  return truncateExcerpt(
    `${title}. ${status} vertical summary. Related states: ${relatedCount}.`,
  );
}

function buildNationalFacts(data: NationalKnowledgeData, freshness?: { ageDays?: number }): FactItem[] {
  const facts: FactItem[] = [];
  const d = data.derived;
  if (typeof d.averageRate === "number")
    facts.push({ label: "Average rate", value: d.averageRate, unit: "¢/kWh", sourceField: "data.derived.averageRate" });
  if (typeof d.medianRate === "number")
    facts.push({ label: "Median rate", value: d.medianRate, unit: "¢/kWh", sourceField: "data.derived.medianRate" });
  if (d.highestState?.name && typeof d.highestState.rate === "number")
    facts.push({ label: "Highest state rate", value: d.highestState.rate, unit: "¢/kWh", sourceField: "data.derived.highestState.rate" });
  if (d.lowestState?.name && typeof d.lowestState.rate === "number")
    facts.push({ label: "Lowest state rate", value: d.lowestState.rate, unit: "¢/kWh", sourceField: "data.derived.lowestState.rate" });
  if (typeof data.raw.stateCount === "number")
    facts.push({ label: "State count", value: data.raw.stateCount, sourceField: "data.raw.stateCount" });
  if (d.dispersionMetrics?.spread != null)
    facts.push({ label: "Rate spread", value: d.dispersionMetrics.spread, unit: "¢/kWh", sourceField: "data.derived.dispersionMetrics.spread" });
  if (freshness?.ageDays != null)
    facts.push({ label: "Data age", value: freshness.ageDays, unit: "days", sourceField: "meta.freshness.ageDays" });
  return facts.sort((a, b) => a.label.localeCompare(b.label));
}

function buildStateFacts(data: StateKnowledgeData, freshness?: { ageDays?: number }): FactItem[] {
  const facts: FactItem[] = [];
  const r = data.raw;
  const d = data.derived;
  if (typeof r?.avgRateCentsPerKwh === "number")
    facts.push({ label: "Average rate", value: r.avgRateCentsPerKwh, unit: "¢/kWh", sourceField: "data.raw.avgRateCentsPerKwh" });
  else if (r)
    facts.push({ label: "Average rate", value: "N/A", sourceField: "data.raw.avgRateCentsPerKwh" });
  if (typeof d?.valueScore === "number")
    facts.push({ label: "Value score", value: d.valueScore, sourceField: "data.derived.valueScore" });
  else if (d)
    facts.push({ label: "Value score", value: "N/A", sourceField: "data.derived.valueScore" });
  if (typeof d?.affordabilityIndex === "number")
    facts.push({ label: "Affordability index", value: d.affordabilityIndex, sourceField: "data.derived.affordabilityIndex" });
  else if (d)
    facts.push({ label: "Affordability index", value: "N/A", sourceField: "data.derived.affordabilityIndex" });
  if (d?.exampleBills?.kwh1000 != null)
    facts.push({ label: "Example bill 1000 kWh", value: d.exampleBills.kwh1000, unit: "$", sourceField: "data.derived.exampleBills.kwh1000" });
  else if (d?.exampleBills)
    facts.push({ label: "Example bill 1000 kWh", value: "N/A", sourceField: "data.derived.exampleBills.kwh1000" });
  if (d?.freshnessStatus)
    facts.push({ label: "Freshness status", value: d.freshnessStatus, sourceField: "data.derived.freshnessStatus" });
  if (d?.percentileRankings?.ratePercentile != null)
    facts.push({ label: "Rate percentile", value: d.percentileRankings.ratePercentile, sourceField: "data.derived.percentileRankings.ratePercentile" });
  else if (d?.percentileRankings)
    facts.push({ label: "Rate percentile", value: "N/A", sourceField: "data.derived.percentileRankings.ratePercentile" });
  if (freshness?.ageDays != null)
    facts.push({ label: "Data age", value: freshness.ageDays, unit: "days", sourceField: "meta.freshness.ageDays" });
  return facts.sort((a, b) => a.label.localeCompare(b.label));
}

function buildRankingsFacts(data: RankingsKnowledgeData): FactItem[] {
  const facts: FactItem[] = [];
  const sorted = data.sortedStates;
  if (data.rankingType)
    facts.push({ label: "Ranking type", value: data.rankingType, sourceField: "data.rankingType" });
  if (Array.isArray(sorted) && sorted.length > 0) {
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    facts.push({ label: "Top state", value: top.name, sourceField: "data.sortedStates" });
    if (typeof top.metricValue === "number")
      facts.push({ label: "Top metric value", value: top.metricValue, sourceField: "data.sortedStates" });
    facts.push({ label: "Bottom state", value: bottom.name, sourceField: "data.sortedStates" });
    if (typeof bottom.metricValue === "number")
      facts.push({ label: "Bottom metric value", value: bottom.metricValue, sourceField: "data.sortedStates" });
    facts.push({ label: "Total ranked", value: sorted.length, sourceField: "data.sortedStates" });
  }
  if (data.generatedAt)
    facts.push({ label: "Generated at", value: data.generatedAt, sourceField: "data.generatedAt" });
  return facts.sort((a, b) => a.label.localeCompare(b.label));
}

function makeMeta(params: {
  id: string;
  type: KnowledgeMeta["type"];
  slug: string;
  title: string;
  description: string;
  canonicalUrl: string;
  jsonUrl: string;
  updatedAt: string;
  sourceVersion: string;
  isLatest: boolean;
  provenance: ProvenanceRef[];
  fieldProvenance: FieldProvenance[];
  llmHints: KnowledgeMeta["llmHints"];
  freshness: KnowledgeMeta["freshness"];
  changeSummary?: ChangeSummary;
  excerpt?: string;
  disclaimerRefs?: string[];
}): Omit<KnowledgeMeta, "contentHash"> {
  return {
    schemaVersion: "1.0",
    id: params.id,
    type: params.type,
    slug: params.slug,
    title: params.title,
    description: params.description,
    canonicalUrl: ensureAbsoluteUrl(params.canonicalUrl),
    jsonUrl: ensureAbsoluteUrl(params.jsonUrl),
    updatedAt: params.updatedAt,
    sourceVersion: params.sourceVersion,
    temporalContext: {
      sourceVersion: params.sourceVersion,
      isLatest: params.isLatest,
    },
    provenance: params.provenance,
    fieldProvenance: params.fieldProvenance,
    citations: citationsFromProvenance(params.provenance),
    llmHints: params.llmHints,
    freshness: params.freshness,
    ...(params.changeSummary && { changeSummary: params.changeSummary }),
    ...(params.excerpt && { excerpt: params.excerpt }),
    ...(params.disclaimerRefs && params.disclaimerRefs.length > 0 && { disclaimerRefs: params.disclaimerRefs }),
  };
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Strip undefined values to match JSON round-trip (JSON omits undefined). */
function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => stripUndefined(item)) as T;
  }
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return obj;
}

/** Recursively serialize object with sorted keys. Arrays keep their order (caller must pre-sort unordered sets). */
function serializeDeterministic(obj: unknown): string {
  const cleaned = stripUndefined(obj);
  if (cleaned === null || cleaned === undefined) {
    return JSON.stringify(cleaned);
  }
  if (Array.isArray(cleaned)) {
    return "[" + cleaned.map((item) => serializeDeterministic(item)).join(",") + "]";
  }
  if (typeof cleaned === "object") {
    const keys = Object.keys(cleaned).sort((a, b) => a.localeCompare(b));
    const pairs = keys.map((k) => JSON.stringify(k) + ":" + serializeDeterministic((cleaned as Record<string, unknown>)[k]));
    return "{" + pairs.join(",") + "}";
  }
  return JSON.stringify(cleaned);
}

function getNumericAtPath(page: Record<string, unknown>, path: string): number | null {
  const parts = path.split(".");
  let cur: unknown = page;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (typeof cur !== "number" || !Number.isFinite(cur)) return null;
  return cur;
}

const STATE_NUMERIC_PATHS = [
  "data.raw.avgRateCentsPerKwh",
  "data.derived.valueScore",
  "data.derived.affordabilityIndex",
  "data.derived.exampleBills.kwh500",
  "data.derived.exampleBills.kwh1000",
  "data.derived.exampleBills.kwh1500",
  "data.derived.percentileRankings.ratePercentile",
  "data.derived.percentileRankings.valueScorePercentile",
  "data.derived.percentileRankings.affordabilityPercentile",
];

const NATIONAL_NUMERIC_PATHS = [
  "data.derived.averageRate",
  "data.derived.medianRate",
  "data.derived.dispersionMetrics.stdDev",
  "data.derived.dispersionMetrics.min",
  "data.derived.dispersionMetrics.max",
  "data.derived.dispersionMetrics.spread",
  "data.derived.highestState.rate",
  "data.derived.lowestState.rate",
];

function computeFieldChanges(
  current: { data?: unknown },
  previous: { data?: unknown } | null,
  paths: string[],
): MetricFieldChange[] {
  if (!previous) return [];
  const changes: MetricFieldChange[] = [];
  for (const field of paths) {
    const prevVal = getNumericAtPath(previous, field);
    const currVal = getNumericAtPath(current, field);
    if (prevVal === null || currVal === null) continue;
    const absoluteDelta = Math.round((currVal - prevVal) * 100) / 100;
    const percentDelta = prevVal === 0 ? 0 : Math.round((absoluteDelta / prevVal) * 10000) / 100;
    changes.push({
      field,
      previousValue: prevVal,
      currentValue: currVal,
      absoluteDelta,
      percentDelta,
    });
  }
  return changes;
}

function toChangeSummary(
  fieldsChanged: MetricFieldChange[],
  comparedToVersion: string,
): ChangeSummary | undefined {
  const significant = fieldsChanged
    .filter((c) => Math.abs(c.percentDelta) >= CHANGE_THRESHOLD_PERCENT)
    .sort((a, b) => a.field.localeCompare(b.field))
    .map((c) => ({ field: c.field, absoluteDelta: c.absoluteDelta, percentDelta: c.percentDelta }));
  if (significant.length === 0) return undefined;
  return { comparedToVersion, significantChanges: significant };
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for potential future use */
function _getContractVersionInNewYork(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function buildPageWithHash<T>(
  meta: Omit<KnowledgeMeta, "contentHash">,
  data: T,
): KnowledgePage<T> {
  const preHashPage = {
    meta: { ...meta, contentHash: "" },
    data,
  };
  const hash = sha256(serializeDeterministic(preHashPage));
  return {
    meta: { ...meta, contentHash: hash },
    data,
  };
}

function validatePage<T>(page: KnowledgePage<T>, expectedSourceVersion: string): void {
  if (page.meta.schemaVersion !== "1.0") {
    throw new Error(`Invalid schemaVersion for ${page.meta.id}`);
  }
  if (page.meta.sourceVersion !== expectedSourceVersion) {
    throw new Error(
      `Source version mismatch for ${page.meta.id}: got ${page.meta.sourceVersion}, expected ${expectedSourceVersion}`,
    );
  }
  if (!Array.isArray(page.meta.citations)) {
    throw new Error(`Citations missing for ${page.meta.id}`);
  }
  if (!Array.isArray(page.meta.provenance)) {
    throw new Error(`Provenance missing for ${page.meta.id}`);
  }
  if (!Array.isArray(page.meta.fieldProvenance)) {
    throw new Error(`Field provenance missing for ${page.meta.id}`);
  }
  if (!page.meta.contentHash || typeof page.meta.contentHash !== "string") {
    throw new Error(`contentHash missing for ${page.meta.id}`);
  }
}

function toRegistryItem(params: {
  meta: KnowledgeMeta & { qualityScore?: number };
  relatedMethodologyUrls: string[];
  relatedDataEndpoints: string[];
  verticalGroup?: string;
}): KnowledgeRegistryItem {
  const f = params.meta.freshness;
  return {
    id: params.meta.id,
    type: params.meta.type,
    slug: params.meta.slug,
    title: params.meta.title,
    description: params.meta.description,
    url: params.meta.canonicalUrl,
    canonicalUrl: params.meta.canonicalUrl,
    jsonUrl: params.meta.jsonUrl,
    relatedMethodologyUrls: params.relatedMethodologyUrls,
    relatedDataEndpoints: params.relatedDataEndpoints,
    verticalGroup: params.verticalGroup,
    contentHash: params.meta.contentHash,
    updatedAt: params.meta.updatedAt,
    sourceVersion: params.meta.sourceVersion,
    freshnessStatus: f.status,
    datasetUpdatedAt: f.datasetUpdatedAt,
    qualityScore: params.meta.qualityScore ?? 0,
  };
}

function getBudgetForPath(relativeJsonUrl: string): number | null {
  const normalized = relativeJsonUrl.replace(/^\/+/, "").replace(/\\/g, "/");
  if (SIZE_BUDGETS_BYTES[normalized]) return SIZE_BUDGETS_BYTES[normalized];
  const match = normalized.match(/^knowledge\/(state|rankings|methodology|vertical)\//);
  if (match) return SIZE_BUDGETS_BYTES[`knowledge/${match[1]}/*.json`] ?? null;
  return null;
}

async function checkSizeBudget(relativeJsonUrl: string, outPath: string): Promise<void> {
  const budget = getBudgetForPath(relativeJsonUrl);
  if (budget == null) return;
  const st = await stat(outPath);
  if (st.size > budget) {
    throw new Error(
      `Size budget exceeded: ${relativeJsonUrl} is ${st.size} bytes (budget: ${budget})`,
    );
  }
}

async function maybeGzip(relativeJsonUrl: string, outPath: string): Promise<void> {
  if (!COMPRESSION_TARGETS.includes(relativeJsonUrl.replace(/^\/+/, "").replace(/\\/g, "/"))) {
    return;
  }
  const st = await stat(outPath);
  if (st.size <= GZIP_THRESHOLD_BYTES) return;
  const raw = await readFile(outPath);
  const compressed = gzipSync(raw, { level: 6 });
  const gzPath = outPath + ".gz";
  await writeFile(gzPath, compressed);
}

async function writeJson(relativeJsonUrl: string, body: unknown): Promise<void> {
  const outPath = makeJsonPath(relativeJsonUrl);
  await mkdir(path.dirname(outPath), { recursive: true });
  const content = `${JSON.stringify(body, null, 2)}\n`;
  await writeFile(outPath, content, "utf8");
  await checkSizeBudget(relativeJsonUrl, outPath);
  await maybeGzip(relativeJsonUrl, outPath);
}

function stableRankedStates(
  states: ReturnType<typeof getKnowledgeNormalizedStates>,
  metric: (state: ReturnType<typeof getKnowledgeNormalizedStates>[number]) => number,
  direction: "asc" | "desc",
): Array<{ rank: number; slug: string; name: string; metricValue: number }> {
  const sorted = [...states].sort((a, b) => {
    const aValue = metric(a);
    const bValue = metric(b);
    const valueSort =
      direction === "asc" ? aValue - bValue : bValue - aValue;
    if (valueSort !== 0) return valueSort;
    const nameSort = a.name.localeCompare(b.name);
    if (nameSort !== 0) return nameSort;
    return a.slug.localeCompare(b.slug);
  });

  return sorted.map((state, index) => ({
    rank: index + 1,
    slug: state.slug,
    name: state.name,
    metricValue: metric(state),
  }));
}

/** Compute percentile (0-100) for a state given sorted list. Tie-break: name then slug. */
function computePercentile(
  states: ReturnType<typeof getKnowledgeNormalizedStates>,
  targetSlug: string,
  metric: (s: ReturnType<typeof getKnowledgeNormalizedStates>[number]) => number | null,
  direction: "asc" | "desc",
): number | null {
  const withValues = states
    .map((s) => ({ state: s, value: metric(s) }))
    .filter((x) => x.value !== null && Number.isFinite(x.value)) as Array<{
    state: ReturnType<typeof getKnowledgeNormalizedStates>[number];
    value: number;
  }>;
  if (withValues.length === 0) return null;
  const target = states.find((s) => s.slug === targetSlug);
  if (!target) return null;
  const targetValue = metric(target);
  if (targetValue === null || !Number.isFinite(targetValue)) return null;

  const sorted = [...withValues].sort((a, b) => {
    const valueSort = direction === "asc" ? a.value - b.value : b.value - a.value;
    if (valueSort !== 0) return valueSort;
    return a.state.name.localeCompare(b.state.name) || a.state.slug.localeCompare(b.state.slug);
  });
  const rank = sorted.findIndex((x) => x.state.slug === targetSlug) + 1;
  if (rank === 0) return null;
  const n = sorted.length;
  const pct = n <= 1 ? 100 : ((rank - 1) / (n - 1)) * 100;
  return Math.round(pct * 100) / 100;
}

function getStatePageRelatedUrls(slug: string): {
  statePage: string;
  utilitiesPage: string;
  plansPage: string;
  methodology: string[];
} {
  const methodology = getKnowledgeMethodologyRefs();
  return {
    statePage: ensureAbsoluteUrl(`/${slug}`),
    utilitiesPage: ensureAbsoluteUrl(`/${slug}/utilities`),
    plansPage: ensureAbsoluteUrl(`/${slug}/plans`),
    methodology: [
      ensureAbsoluteUrl(methodology.electricityPriceIndex),
      ensureAbsoluteUrl(methodology.valueScore),
      ensureAbsoluteUrl(methodology.freshnessScoring),
    ],
  };
}

async function loadPreviousPages(sourceVersion: string): Promise<{
  statesBySlug: Map<string, { data?: unknown }>;
  national: { data?: unknown } | null;
  comparedToVersion: string | null;
}> {
  const statesBySlug = new Map<string, { data?: unknown }>();
  let national: { data?: unknown } | null = null;
  let comparedToVersion: string | null = null;
  const stateDir = makeJsonPath("/knowledge/state");
  const nationalPath = makeJsonPath("/knowledge/national.json");
  try {
    const { readdir } = await import("node:fs/promises");
    const files = await readdir(stateDir);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const slug = f.replace(/\.json$/, "");
      try {
        const raw = await readFile(path.join(stateDir, f), "utf8");
        const parsed = JSON.parse(raw) as { data?: unknown };
        statesBySlug.set(slug, parsed);
      } catch {
        /* skip */
      }
    }
  } catch {
    /* no previous state dir */
  }
  try {
    const raw = await readFile(nationalPath, "utf8");
    national = JSON.parse(raw) as { data?: unknown };
  } catch {
    /* no previous national */
  }
  if (statesBySlug.size > 0 || national) {
    comparedToVersion = sourceVersion;
  }
  return { statesBySlug, national, comparedToVersion };
}

async function main(): Promise<void> {
  const t0 = process.hrtime.bigint();
  const durationsMs: Record<string, number> = {};

  let tPhase = process.hrtime.bigint();
  const pack = buildKnowledgePack();
  const sourceVersion = pack.site.dataVersion;
  const now = new Date();
  const generatedAt = now.toISOString();
  const contractVersion = CONTRACT_VERSION;
  const offersConfig = {
    enabled: false,
    mode: "disabled" as const,
    allowOutboundLinks: false,
    defaultDisclaimerId: "offers-disabled",
    allowedPartners: [] as string[],
    stateOverrides: {} as Record<string, unknown>,
  };
  const offersEnabled = offersConfig.enabled;
  const methodologyRefs = getKnowledgeMethodologyRefs();
  const dataEndpoints = getKnowledgeDataEndpoints();
  const snapshot = getCurrentSnapshot();
  const datasetUpdatedAt = snapshot.releasedAt.includes("T")
    ? snapshot.releasedAt
    : `${snapshot.releasedAt}T00:00:00.000Z`;
  const { statesBySlug: previousStatesBySlug, national: previousNational, comparedToVersion } =
    await loadPreviousPages(sourceVersion);
  const eiaHistory = await loadEiaHistory();
  durationsMs.loadSnapshots = bigintToMs(process.hrtime.bigint() - tPhase);
  checkBudget("loadSnapshots", durationsMs.loadSnapshots);

  tPhase = process.hrtime.bigint();
  const normalizedStates = getKnowledgeNormalizedStates();
  const freshnessBlock = buildFreshnessBlock({ datasetUpdatedAt, computedAt: generatedAt });
  durationsMs.normalizeStates = bigintToMs(process.hrtime.bigint() - tPhase);
  checkBudget("normalizeStates", durationsMs.normalizeStates);
  const metricChangesStates: StateMetricChanges[] = [];
  let metricChangesNational: NationalMetricChange[] = [];

  const pageWrites: Array<{ jsonUrl: string; page: KnowledgePage<unknown> }> = [];
  const registryNational: KnowledgeRegistryItem[] = [];
  const registryStates: KnowledgeRegistryItem[] = [];
  const registryMethodology: KnowledgeRegistryItem[] = [];
  const registryRankings: KnowledgeRegistryItem[] = [];
  const registryVertical: KnowledgeRegistryItem[] = [];

  tPhase = process.hrtime.bigint();
  const rates = normalizedStates
    .map((s) => s.avgRateCentsPerKwh)
    .filter((r): r is number => r !== null && Number.isFinite(r));
  const mean = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const variance =
    rates.length > 1
      ? rates.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (rates.length - 1)
      : 0;
  const stdDev = Math.sqrt(variance);
  const minRate = rates.length > 0 ? Math.min(...rates) : 0;
  const maxRate = rates.length > 0 ? Math.max(...rates) : 0;

  const nationalTopBottomSlugs = [
    ...pack.national.top5Highest.map((s) => s.slug),
    ...pack.national.top5Lowest.map((s) => s.slug),
  ]
    .filter((slug, i, arr) => arr.indexOf(slug) === i)
    .sort((a, b) => {
      const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
      const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
      return na.localeCompare(nb);
    });

  const snapshots = getAllSnapshots();
  const MAX_TREND_PERIODS = 12;
  const MAX_INSIGHTS = 6;
  const stateTrendsBySlug = new Map<
    string,
    { values: number[]; min: number; max: number }
  >();
  if (snapshots.length >= 2) {
    const snapshotsToUse = snapshots.slice(-MAX_TREND_PERIODS);
    for (const state of normalizedStates) {
      const values: number[] = [];
      for (const snap of snapshotsToUse) {
        const s = snap.states.find((st) => st.slug === state.slug);
        if (s && typeof s.rate === "number" && Number.isFinite(s.rate)) {
          values.push(Math.round(s.rate * 100) / 100);
        }
      }
      if (values.length >= 2) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        stateTrendsBySlug.set(state.slug, { values, min, max });
      }
    }
  }

  let nationalTrendSeries: { values: number[]; min: number; max: number } | undefined;
  const nameBySlug = new Map(normalizedStates.map((s) => [s.slug, s.name ?? slugToDisplayName(s.slug)]));
  const momentumBySlug = new Map<
    string,
    {
      enabled: boolean;
      signal: "accelerating" | "rising" | "stable" | "falling" | "unavailable";
      score: number | null;
      shortWindowChangePercent: number | null;
      longWindowChangePercent: number | null;
      windowPointsUsed: number;
      note?: string;
    }
  >();
  if (eiaHistory.historyAvailable && eiaHistory.byState) {
    const momentumRows = computeMomentumFromHistory(eiaHistory.byState, nameBySlug);
    for (const row of momentumRows) {
      momentumBySlug.set(row.slug, {
        enabled: true,
        signal: row.signal,
        score: row.metricValue,
        shortWindowChangePercent: row.shortWindowChangePercent,
        longWindowChangePercent: row.longWindowChangePercent,
        windowPointsUsed: row.windowPointsUsed,
      });
    }
  }
  for (const state of normalizedStates) {
    if (!momentumBySlug.has(state.slug)) {
      momentumBySlug.set(state.slug, {
        enabled: false,
        signal: "unavailable",
        score: null,
        shortWindowChangePercent: null,
        longWindowChangePercent: null,
        windowPointsUsed: 0,
        note: eiaHistory.historyAvailable ? "Insufficient history" : "History unavailable",
      });
    }
  }

  const priceHistoryBySlug = new Map<
    string,
    {
      rateSeries: { periods: string[]; values: number[] };
      rate1YearAgo: number;
      rate5YearsAgo: number | null;
      increase1YearPercent: number;
      increase5YearPercent: number | null;
      annualizedIncrease5Year: number | null;
    }
  >();
  if (eiaHistory.historyAvailable && eiaHistory.byState) {
    const RATE_SERIES_MONTHS = 60;
    for (const [slug, entry] of eiaHistory.byState.entries()) {
      const sorted = entry.periods
        .map((p, i) => ({ period: p, value: entry.values[i] }))
        .sort((a, b) => a.period.localeCompare(b.period));
      if (sorted.length < 2) continue;
      const currentRate = sorted[sorted.length - 1]!.value;
      const rateSeries = sorted.slice(-RATE_SERIES_MONTHS);
      const periods = rateSeries.map((x) => x.period);
      const values = rateSeries.map((x) => Math.round(x.value * 100) / 100);
      const oneYearIdx = Math.max(0, sorted.length - 13);
      const fiveYearIdx = Math.max(0, sorted.length - 61);
      const rate1YearAgo = sorted[oneYearIdx]!.value;
      const rate5YearsAgo = fiveYearIdx < sorted.length ? sorted[fiveYearIdx]!.value : null;
      const increase1YearPercent =
        rate1YearAgo > 0 ? Math.round(((currentRate - rate1YearAgo) / rate1YearAgo) * 1000) / 10 : 0;
      const increase5YearPercent =
        rate5YearsAgo != null && rate5YearsAgo > 0
          ? Math.round(((currentRate - rate5YearsAgo) / rate5YearsAgo) * 1000) / 10
          : null;
      const annualizedIncrease5Year =
        rate5YearsAgo != null && rate5YearsAgo > 0
          ? Math.round((Math.pow(currentRate / rate5YearsAgo, 1 / 5) - 1) * 1000) / 10
          : null;
      priceHistoryBySlug.set(slug, {
        rateSeries: { periods, values },
        rate1YearAgo: Math.round(rate1YearAgo * 100) / 100,
        rate5YearsAgo: rate5YearsAgo != null ? Math.round(rate5YearsAgo * 100) / 100 : null,
        increase1YearPercent,
        increase5YearPercent,
        annualizedIncrease5Year,
      });
    }
  }

  if (snapshots.length >= 2) {
    const snapshotsToUse = snapshots.slice(-MAX_TREND_PERIODS);
    const nationalValues: number[] = [];
    for (const snap of snapshotsToUse) {
      const rates = snap.states
        .map((s) => s.rate)
        .filter((r): r is number => typeof r === "number" && Number.isFinite(r));
      if (rates.length > 0) {
        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        nationalValues.push(Math.round(avg * 100) / 100);
      }
    }
    if (nationalValues.length >= 2) {
      nationalTrendSeries = {
        values: nationalValues,
        min: Math.min(...nationalValues),
        max: Math.max(...nationalValues),
      };
    }
  }

  const nationalData: NationalKnowledgeData = {
    raw: {
      stateCount: normalizedStates.length,
      datasetUpdatedAt,
    },
    derived: {
      averageRate: pack.national.averageRateCentsPerKwh,
      medianRate: pack.national.medianRateCentsPerKwh,
      dispersionMetrics: {
        stdDev: Math.round(stdDev * 100) / 100,
        min: Math.round(minRate * 100) / 100,
        max: Math.round(maxRate * 100) / 100,
        spread: Math.round((maxRate - minRate) * 100) / 100,
      },
      highestState: pack.national.highestState,
      lowestState: pack.national.lowestState,
      top5Highest: pack.national.top5Highest,
      top5Lowest: pack.national.top5Lowest,
      ...(nationalTrendSeries && {
        trends: { avgRateCentsPerKwh: nationalTrendSeries },
      }),
    },
    derivedMeta: {
      methodologiesUsed: [
        {
          id: "epi",
          version: METHODOLOGY_VERSION,
          url: ensureAbsoluteUrl("/knowledge/methodology/epi.json"),
          appliesToFields: [
            "data.derived.averageRate",
            "data.derived.medianRate",
            "data.derived.dispersionMetrics",
            "data.derived.highestState",
            "data.derived.lowestState",
            "data.derived.top5Highest",
            "data.derived.top5Lowest",
            "data.derived.trends",
          ],
        },
      ],
    },
    relatedEntities: {
      states: nationalTopBottomSlugs,
      methodologies: ["epi", "value-score", "freshness"],
      rankings: ["rate-low-to-high", "rate-high-to-low", "affordability", "value-score"],
    },
  };
  durationsMs.computeNational = bigintToMs(process.hrtime.bigint() - tPhase);
  checkBudget("computeNational", durationsMs.computeNational);

  const statesWithRates = normalizedStates.filter(
    (s) => typeof s.avgRateCentsPerKwh === "number" && Number.isFinite(s.avgRateCentsPerKwh),
  );
  const rateRankedForCompare = [...statesWithRates].sort(
    (a, b) => (b.avgRateCentsPerKwh ?? 0) - (a.avgRateCentsPerKwh ?? 0),
  );
  const rateRankBySlugForCompare = new Map<string, number>();
  rateRankedForCompare.forEach((s, i) => rateRankBySlugForCompare.set(s.slug, i + 1));
  const stateBySlugForCompare = new Map(statesWithRates.map((s) => [s.slug, s]));
  const allStateSlugsForCompare = statesWithRates.map((s) => s.slug);
  const ANCHOR_SLUGS = ["california", "texas", "florida", "new-york", "pennsylvania", "ohio"].filter(
    (a) => allStateSlugsForCompare.includes(a),
  );
  const pairSet = new Set<string>();
  for (const stateSlug of allStateSlugsForCompare) {
    for (const anchor of ANCHOR_SLUGS) {
      if (stateSlug === anchor) continue;
      const [slugA, slugB] = stateSlug < anchor ? [stateSlug, anchor] : [anchor, stateSlug];
      pairSet.add(`${slugA}-vs-${slugB}`);
    }
  }
  const pairs: Array<{ slugA: string; slugB: string; pairSlug: string }> = [...pairSet]
    .sort((a, b) => a.localeCompare(b))
    .map((pairSlug) => {
      const [slugA, slugB] = pairSlug.split("-vs-") as [string, string];
      return { slugA, slugB, pairSlug };
    });
  const pairDataBySlug = new Map<
    string,
    {
      stateA: { slug: string; name: string; rate: number };
      stateB: { slug: string; name: string; rate: number };
      differenceCents: number;
      differencePercent: number;
      higherCostState: string;
      lowerCostState: string;
    }
  >();
  for (const { slugA, slugB, pairSlug } of pairs) {
    const sa = stateBySlugForCompare.get(slugA);
    const sb = stateBySlugForCompare.get(slugB);
    if (!sa || !sb) continue;
    const rateA = sa.avgRateCentsPerKwh as number;
    const rateB = sb.avgRateCentsPerKwh as number;
    const differenceCents = Math.round((rateA - rateB) * 100) / 100;
    const differencePercent =
      rateB > 0 ? Math.round(((rateA - rateB) / rateB) * 1000) / 10 : 0;
    const higherCostState = rateA >= rateB ? sa.name ?? slugA : sb.name ?? slugB;
    const lowerCostState = rateA >= rateB ? sb.name ?? slugB : sa.name ?? slugA;
    pairDataBySlug.set(pairSlug, {
      stateA: { slug: slugA, name: sa.name ?? slugA, rate: rateA },
      stateB: { slug: slugB, name: sb.name ?? slugB, rate: rateB },
      differenceCents,
      differencePercent,
      higherCostState,
      lowerCostState,
    });
  }
  const stateCompareLinksBySlug = new Map<
    string,
    Array<{ pairSlug: string; title: string; url: string }>
  >();
  for (const state of statesWithRates) {
    const idx = rateRankedForCompare.findIndex((s) => s.slug === state.slug);
    const candidates: Array<{ slug: string; name: string; rankDist: number }> = [];
    for (let i = 0; i < rateRankedForCompare.length; i++) {
      if (rateRankedForCompare[i].slug === state.slug) continue;
      const other = rateRankedForCompare[i];
      const name = other.name ?? other.slug;
      candidates.push({ slug: other.slug, name, rankDist: Math.abs(i - idx) });
    }
    candidates.sort((a, b) => a.rankDist - b.rankDist);
    const links: Array<{ pairSlug: string; title: string; url: string }> = [];
    const stateName = state.name ?? state.slug;
    for (const c of candidates) {
      if (links.length >= 3) break;
      const [slugA, slugB] = state.slug < c.slug ? [state.slug, c.slug] : [c.slug, state.slug];
      const pairSlug = `${slugA}-vs-${slugB}`;
      if (!pairDataBySlug.has(pairSlug)) continue;
      const title = `${stateName} vs ${c.name}`;
      links.push({ pairSlug, title, url: `/electricity-cost-comparison/${pairSlug}` });
    }
    if (links.length > 0) stateCompareLinksBySlug.set(state.slug, links);
  }

  const allStateSlugs = normalizedStates.map((s) => s.slug);
  const regionDefs = buildRegionMapping(allStateSlugs);
  const stateBySlug = new Map(normalizedStates.map((s) => [s.slug, s]));
  type RegionData = {
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
  const regionDataById = new Map<string, RegionData>();
  for (const r of regionDefs) {
    const statesWithRates = r.stateSlugs
      .map((slug) => stateBySlug.get(slug))
      .filter((s): s is (typeof normalizedStates)[number] => !!s && typeof s.avgRateCentsPerKwh === "number" && Number.isFinite(s.avgRateCentsPerKwh));
    const rates = statesWithRates.map((s) => s.avgRateCentsPerKwh as number);
    const enabled = r.id !== "unknown" && statesWithRates.length >= 2;
    const sortedByRate = [...statesWithRates].sort((a, b) => (b.avgRateCentsPerKwh ?? 0) - (a.avgRateCentsPerKwh ?? 0));
    const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    const sortedRates = [...rates].sort((a, b) => a - b);
    const median = sortedRates.length > 0
      ? sortedRates.length % 2 === 1
        ? sortedRates[Math.floor(sortedRates.length / 2)]!
        : (sortedRates[sortedRates.length / 2 - 1]! + sortedRates[sortedRates.length / 2]!) / 2
      : 0;
    const highest = sortedByRate[0];
    const lowest = sortedByRate[sortedByRate.length - 1];
    const excerpt =
      r.id === "unknown"
        ? "States with incomplete or unknown region mapping."
        : `Electricity rates and metrics for ${r.name} U.S. states. Average ${avg.toFixed(2)} ¢/kWh.`;
    regionDataById.set(r.id, {
      id: r.id,
      name: r.name,
      excerpt,
      enabled,
      stateCount: statesWithRates.length,
      averageRateCentsPerKwh: Math.round(avg * 100) / 100,
      medianRateCentsPerKwh: Math.round(median * 100) / 100,
      highestState: highest
        ? { slug: highest.slug, name: highest.name ?? highest.slug, rate: highest.avgRateCentsPerKwh as number }
        : { slug: "", name: "", rate: 0 },
      lowestState: lowest
        ? { slug: lowest.slug, name: lowest.name ?? lowest.slug, rate: lowest.avgRateCentsPerKwh as number }
        : { slug: "", name: "", rate: 0 },
      top5Highest: sortedByRate.slice(0, 5).map((s) => ({ slug: s.slug, name: s.name ?? s.slug, rate: s.avgRateCentsPerKwh as number })),
      top5Lowest: sortedByRate.slice(-5).reverse().map((s) => ({ slug: s.slug, name: s.name ?? s.slug, rate: s.avgRateCentsPerKwh as number })),
    });
  }
  const regionByStateSlug = new Map<string, { id: string; name: string; enabled: boolean }>();
  for (const r of regionDefs) {
    for (const slug of r.stateSlugs) {
      const data = regionDataById.get(r.id);
      regionByStateSlug.set(slug, { id: r.id, name: r.name, enabled: data?.enabled ?? false });
    }
  }

  tPhase = process.hrtime.bigint();
  const nationalProvenance = buildPageProvenance(
    [
      "eia-retail-sales-923",
      "poe-methodology-epi",
      "poe-dataset-states-json",
      "poe-dataset-states-csv",
    ],
    generatedAt,
  );
  const currentNationalPage = { data: nationalData };
  metricChangesNational = computeFieldChanges(
    currentNationalPage,
    previousNational,
    NATIONAL_NUMERIC_PATHS,
  );
  const nationalChangeSummary =
    comparedToVersion && previousNational
      ? toChangeSummary(metricChangesNational, comparedToVersion)
      : undefined;
  const nationalExcerpt = buildNationalExcerpt(nationalData);
  const nationalFacts = buildNationalFacts(nationalData, freshnessBlock);
  (nationalData as Record<string, unknown>).facts = nationalFacts;
  const nationalMeta = makeMeta({
    id: "knowledge:national",
    type: "national",
    slug: "national",
    title: "U.S. National Electricity Pricing Overview",
    description: "National-level summary of U.S. residential electricity rates and extremes.",
    canonicalUrl: "/knowledge/national",
    jsonUrl: "/knowledge/national.json",
    updatedAt: generatedAt,
    sourceVersion,
    isLatest: true,
    provenance: nationalProvenance,
    freshness: freshnessBlock,
    changeSummary: nationalChangeSummary,
    fieldProvenance: [
      {
        field: "data.raw.stateCount",
        provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
        isDerived: false,
      },
      {
        field: "data.raw.datasetUpdatedAt",
        provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
        isDerived: false,
      },
      {
        field: "data.derived.averageRate",
        provenanceIds: ["eia-retail-sales-923", "poe-methodology-epi"],
        isDerived: true,
        derivedFromFields: ["data.raw.stateCount"],
      },
      {
        field: "data.derived.medianRate",
        provenanceIds: ["eia-retail-sales-923", "poe-methodology-epi"],
        isDerived: true,
        derivedFromFields: ["data.raw.stateCount"],
      },
      {
        field: "data.derived.dispersionMetrics",
        provenanceIds: ["eia-retail-sales-923", "poe-methodology-epi"],
        isDerived: true,
        derivedFromFields: ["data.raw.stateCount"],
      },
      {
        field: "data.derived.highestState",
        provenanceIds: ["eia-retail-sales-923", "poe-methodology-epi"],
        isDerived: true,
        derivedFromFields: ["data.raw.stateCount"],
      },
      {
        field: "data.derived.lowestState",
        provenanceIds: ["eia-retail-sales-923", "poe-methodology-epi"],
        isDerived: true,
        derivedFromFields: ["data.raw.stateCount"],
      },
      {
        field: "data.derived.top5Highest",
        provenanceIds: ["eia-retail-sales-923", "poe-methodology-epi"],
        isDerived: true,
        derivedFromFields: ["data.raw.stateCount"],
      },
      {
        field: "data.derived.top5Lowest",
        provenanceIds: ["eia-retail-sales-923", "poe-methodology-epi"],
        isDerived: true,
        derivedFromFields: ["data.raw.stateCount"],
      },
    ],
    llmHints: {
      priority: "high",
      entityType: "national",
      semanticTopics: ["electricity rates", "kwh pricing", "national trends", "state comparison"],
      semanticCluster: "macro-overview",
    },
    excerpt: nationalExcerpt,
    disclaimerRefs: ["general-site"],
  });
  const nationalQualityScore = computeQualityScore(nationalMeta, nationalData as Record<string, unknown>, "national");
  const nationalPage = buildPageWithHash({ ...nationalMeta, qualityScore: nationalQualityScore }, nationalData);
  validatePage(nationalPage, sourceVersion);
  pageWrites.push({ jsonUrl: "/knowledge/national.json", page: nationalPage });
  registryNational.push(
    toRegistryItem({
      meta: nationalPage.meta,
      relatedMethodologyUrls: [
        ensureAbsoluteUrl(methodologyRefs.electricityPriceIndex),
        ensureAbsoluteUrl(methodologyRefs.valueScore),
        ensureAbsoluteUrl(methodologyRefs.freshnessScoring),
      ],
      relatedDataEndpoints: [
        ensureAbsoluteUrl(dataEndpoints.statesJson),
        ensureAbsoluteUrl(dataEndpoints.statesCsv),
      ],
    }),
  );

  for (const state of normalizedStates) {
    const jsonUrl = `/knowledge/state/${state.slug}.json`;
    const ratePct = computePercentile(
      normalizedStates,
      state.slug,
      (s) => s.avgRateCentsPerKwh,
      "asc",
    );
    const valuePct = computePercentile(
      normalizedStates,
      state.slug,
      (s) => s.valueScore,
      "asc",
    );
    const affPct = computePercentile(
      normalizedStates,
      state.slug,
      (s) => s.affordabilityIndex,
      "asc",
    );
    const stateData: StateKnowledgeData = {
      raw: {
        slug: state.slug,
        name: state.name,
        postal: null,
        avgRateCentsPerKwh: state.avgRateCentsPerKwh,
        updated: state.updated,
      },
      derived: {
        valueScore: state.valueScore,
        affordabilityIndex: state.affordabilityIndex,
        freshnessStatus: state.freshnessStatus,
        exampleBills: {
          kwh500: state.exampleBills.find((b) => b.kwh === 500)?.estimated ?? null,
          kwh1000: state.exampleBills.find((b) => b.kwh === 1000)?.estimated ?? null,
          kwh1500: state.exampleBills.find((b) => b.kwh === 1500)?.estimated ?? null,
        },
        relatedUrls: getStatePageRelatedUrls(state.slug),
        percentileRankings: {
          ratePercentile: ratePct,
          valueScorePercentile: valuePct,
          affordabilityPercentile: affPct,
        },
        ...(stateTrendsBySlug.has(state.slug) && {
          trends: {
            avgRateCentsPerKwh: stateTrendsBySlug.get(state.slug)!,
          },
        }),
        momentum: momentumBySlug.get(state.slug) ?? {
          enabled: false,
          signal: "unavailable" as const,
          score: null,
          shortWindowChangePercent: null,
          longWindowChangePercent: null,
          windowPointsUsed: 0,
          note: "Momentum signal unavailable",
        },
        ...(typeof pack.national.averageRateCentsPerKwh === "number" &&
          pack.national.averageRateCentsPerKwh > 0 && {
            comparison: (() => {
              const nationalAverage = pack.national.averageRateCentsPerKwh;
              const stateRate = state.avgRateCentsPerKwh;
              const natRounded = Math.round(nationalAverage * 100) / 100;
              if (typeof stateRate !== "number" || !Number.isFinite(stateRate)) {
                return {
                  nationalAverage: natRounded,
                  differenceCents: 0,
                  differencePercent: 0,
                  category: "rate data unavailable",
                };
              }
              const differenceCents = Math.round((stateRate - nationalAverage) * 100) / 100;
              const differencePercent = Math.round(((stateRate - nationalAverage) / nationalAverage) * 1000) / 10;
              const category = computeComparisonCategory(differencePercent);
              return {
                nationalAverage: natRounded,
                differenceCents,
                differencePercent,
                category,
              };
            })(),
          }),
        ...(priceHistoryBySlug.has(state.slug) && {
          priceHistory: priceHistoryBySlug.get(state.slug)!,
        }),
      },
      ...(stateCompareLinksBySlug.get(state.slug) && {
        compareLinks: stateCompareLinksBySlug.get(state.slug)!,
      }),
      ...((): { regionRef?: { id: string; name: string; href: string } } => {
        const reg = regionByStateSlug.get(state.slug);
        if (!reg || !reg.enabled) return {};
        return { regionRef: { id: reg.id, name: reg.name, href: `/knowledge/regions/${reg.id}` } };
      })(),
      derivedMeta: {
        methodologiesUsed: [
          {
            id: "epi",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/epi.json"),
            appliesToFields: [
              "data.derived.exampleBills",
              "data.derived.percentileRankings.ratePercentile",
              "data.derived.relatedUrls",
              "data.derived.trends",
              "data.derived.comparison",
            ],
          },
          {
            id: "value-score",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/value-score.json"),
            appliesToFields: [
              "data.derived.valueScore",
              "data.derived.affordabilityIndex",
              "data.derived.percentileRankings.valueScorePercentile",
              "data.derived.percentileRankings.affordabilityPercentile",
            ],
          },
          {
            id: "freshness",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/freshness.json"),
            appliesToFields: ["data.derived.freshnessStatus"],
          },
          {
            id: "momentum-signal",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/momentum-signal.json"),
            appliesToFields: ["data.derived.momentum"],
          },
          ...(priceHistoryBySlug.has(state.slug)
            ? [
                {
                  id: "price-trend",
                  version: METHODOLOGY_VERSION,
                  url: ensureAbsoluteUrl("/knowledge/methodology/price-trend.json"),
                  appliesToFields: ["data.derived.priceHistory"],
                },
              ]
            : []),
        ],
      },
      relatedEntities: {
        methodologies: [
          "epi",
          "value-score",
          "freshness",
          "momentum-signal",
          ...(priceHistoryBySlug.has(state.slug) ? ["price-trend"] : []),
        ],
        rankings: ["rate-low-to-high", "rate-high-to-low", "affordability", "value-score", "momentum-signal"],
        national: true,
      },
      offersRef: {
        offersIndexUrl: "/knowledge/offers/index.json",
        offersConfigUrl: "/knowledge/policy/offers-config.json",
        enabled: offersEnabled,
      },
    };
    const stateFacts = buildStateFacts(stateData, freshnessBlock);
    (stateData as Record<string, unknown>).facts = stateFacts;
    const stateExcerpt = buildStateExcerpt(stateData);
    const stateProvenance = buildPageProvenance(
      [
        "eia-retail-sales-923",
        "poe-methodology-epi",
        "poe-methodology-value-score",
        "poe-methodology-freshness",
        "poe-dataset-states-json",
        "poe-dataset-states-csv",
        "poe-dataset-affordability-csv",
        "poe-dataset-value-ranking-csv",
      ],
      generatedAt,
    );
    const currentStatePage = { data: stateData };
    const prevState = previousStatesBySlug.get(state.slug) ?? null;
    const stateFieldsChanged = computeFieldChanges(currentStatePage, prevState, STATE_NUMERIC_PATHS);
    if (stateFieldsChanged.length > 0) {
      metricChangesStates.push({ slug: state.slug, fieldsChanged: stateFieldsChanged });
    }
    const stateChangeSummary =
      comparedToVersion && prevState
        ? toChangeSummary(stateFieldsChanged, comparedToVersion)
        : undefined;
    const stateMeta = makeMeta({
      id: `knowledge:state:${state.slug}`,
      type: "state",
      slug: state.slug,
      title: `${state.name} Electricity Price Knowledge`,
      description: `Machine-readable summary for ${state.name} electricity rates and ranking metrics.`,
      canonicalUrl: `/knowledge/state/${state.slug}`,
      jsonUrl,
      updatedAt: generatedAt,
      sourceVersion,
      isLatest: true,
      provenance: stateProvenance,
      freshness: freshnessBlock,
      changeSummary: stateChangeSummary,
      fieldProvenance: [
        {
          field: "data.raw.avgRateCentsPerKwh",
          provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
          isDerived: false,
        },
        {
          field: "data.raw.updated",
          provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
          isDerived: false,
        },
        {
          field: "data.derived.exampleBills",
          provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh"],
        },
        {
          field: "data.derived.affordabilityIndex",
          provenanceIds: ["poe-dataset-affordability-csv", "eia-retail-sales-923"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh"],
        },
        {
          field: "data.derived.valueScore",
          provenanceIds: ["poe-methodology-value-score", "poe-dataset-value-ranking-csv"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh", "data.derived.affordabilityIndex"],
        },
        {
          field: "data.derived.freshnessStatus",
          provenanceIds: ["poe-methodology-freshness", "poe-dataset-states-json"],
          isDerived: true,
          derivedFromFields: ["data.raw.updated"],
        },
        {
          field: "data.derived.percentileRankings",
          provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json", "poe-dataset-affordability-csv", "poe-dataset-value-ranking-csv"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh", "data.derived.valueScore", "data.derived.affordabilityIndex"],
        },
        {
          field: "data.derived.comparison",
          provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json", "poe-methodology-epi"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh"],
        },
        {
          field: "data.derived.relatedUrls",
          provenanceIds: ["poe-methodology-epi", "poe-methodology-value-score", "poe-methodology-freshness"],
          isDerived: true,
          derivedFromFields: [],
        },
      ],
      llmHints: {
        priority: "high",
        entityType: "state",
        semanticTopics: ["electricity rates", "kwh pricing", "energy affordability", "state comparison"],
        semanticCluster: "geographic-state",
      },
      excerpt: stateExcerpt,
      disclaimerRefs: ["general-site", "offers-disabled"],
    });
    const stateQualityScore = computeQualityScore(stateMeta, stateData as Record<string, unknown>, "state");
    const statePage = buildPageWithHash({ ...stateMeta, qualityScore: stateQualityScore }, stateData);
    validatePage(statePage, sourceVersion);
    pageWrites.push({ jsonUrl, page: statePage });
    registryStates.push(
      toRegistryItem({
        meta: statePage.meta,
        relatedMethodologyUrls: [
          ensureAbsoluteUrl(methodologyRefs.electricityPriceIndex),
          ensureAbsoluteUrl(methodologyRefs.valueScore),
          ensureAbsoluteUrl(methodologyRefs.freshnessScoring),
        ],
        relatedDataEndpoints: [
          ensureAbsoluteUrl(dataEndpoints.statesJson),
          ensureAbsoluteUrl(dataEndpoints.statesCsv),
          ensureAbsoluteUrl(dataEndpoints.valueRankingCsv),
          ensureAbsoluteUrl(dataEndpoints.affordabilityCsv),
        ],
      }),
    );
  }

  // Backfill a DC JSON endpoint to satisfy machine index expectations.
  if (!registryStates.some((item) => item.slug === "district-of-columbia")) {
    const dcJsonUrl = "/knowledge/state/district-of-columbia.json";
    const dcMeta = makeMeta({
      id: "knowledge:state:district-of-columbia",
      type: "state",
      slug: "district-of-columbia",
      title: "District of Columbia Electricity Price Knowledge",
      description:
        "Machine-readable state-like record for District of Columbia; values are unavailable in current normalized pipeline.",
      canonicalUrl: "/knowledge/state/district-of-columbia",
      jsonUrl: dcJsonUrl,
      updatedAt: generatedAt,
      sourceVersion,
      isLatest: true,
      provenance: buildPageProvenance(
        [
          "eia-retail-sales-923",
          "poe-methodology-epi",
          "poe-methodology-value-score",
          "poe-methodology-freshness",
          "poe-dataset-states-json",
          "poe-dataset-affordability-csv",
          "poe-dataset-value-ranking-csv",
        ],
        generatedAt,
      ),
      freshness: freshnessBlock,
      fieldProvenance: [
        {
          field: "data.raw.avgRateCentsPerKwh",
          provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
          isDerived: false,
        },
        {
          field: "data.raw.updated",
          provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
          isDerived: false,
        },
        {
          field: "data.derived.affordabilityIndex",
          provenanceIds: ["poe-dataset-affordability-csv"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh"],
        },
        {
          field: "data.derived.valueScore",
          provenanceIds: ["poe-methodology-value-score", "poe-dataset-value-ranking-csv"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh", "data.derived.affordabilityIndex"],
        },
        {
          field: "data.derived.freshnessStatus",
          provenanceIds: ["poe-methodology-freshness"],
          isDerived: true,
          derivedFromFields: ["data.raw.updated"],
        },
        {
          field: "data.derived.percentileRankings",
          provenanceIds: ["poe-dataset-affordability-csv", "poe-dataset-value-ranking-csv"],
          isDerived: true,
          derivedFromFields: ["data.raw.avgRateCentsPerKwh", "data.derived.valueScore", "data.derived.affordabilityIndex"],
        },
        {
          field: "data.derived.relatedUrls",
          provenanceIds: ["poe-methodology-epi", "poe-methodology-value-score", "poe-methodology-freshness"],
          isDerived: true,
          derivedFromFields: [],
        },
      ],
      llmHints: {
        priority: "high",
        entityType: "state",
        semanticTopics: ["electricity rates", "kwh pricing", "district data availability"],
        semanticCluster: "geographic-state",
      },
      disclaimerRefs: ["general-site", "offers-disabled"],
    });
    const dcNatAvg = typeof pack.national.averageRateCentsPerKwh === "number" && pack.national.averageRateCentsPerKwh > 0
      ? pack.national.averageRateCentsPerKwh
      : null;
    const dcData: StateKnowledgeData = {
      raw: {
        slug: "district-of-columbia",
        name: "District of Columbia",
        postal: "DC",
        avgRateCentsPerKwh: null,
        updated: "N/A",
      },
      derived: {
        valueScore: null,
        affordabilityIndex: null,
        freshnessStatus: "unavailable",
        exampleBills: { kwh500: null, kwh1000: null, kwh1500: null },
        relatedUrls: getStatePageRelatedUrls("district-of-columbia"),
        percentileRankings: {
          ratePercentile: null,
          valueScorePercentile: null,
          affordabilityPercentile: null,
        },
        ...(dcNatAvg != null && {
          comparison: {
            nationalAverage: Math.round(dcNatAvg * 100) / 100,
            differenceCents: 0,
            differencePercent: 0,
            category: "rate data unavailable",
          },
        }),
        momentum: momentumBySlug.get("district-of-columbia") ?? {
          enabled: false,
          signal: "unavailable" as const,
          score: null,
          shortWindowChangePercent: null,
          longWindowChangePercent: null,
          windowPointsUsed: 0,
          note: "History unavailable",
        },
      },
      derivedMeta: {
        methodologiesUsed: [
          {
            id: "epi",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/epi.json"),
            appliesToFields: [
              "data.derived.exampleBills",
              "data.derived.percentileRankings.ratePercentile",
              "data.derived.relatedUrls",
              "data.derived.trends",
              "data.derived.comparison",
            ],
          },
          {
            id: "value-score",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/value-score.json"),
            appliesToFields: [
              "data.derived.valueScore",
              "data.derived.affordabilityIndex",
              "data.derived.percentileRankings.valueScorePercentile",
              "data.derived.percentileRankings.affordabilityPercentile",
            ],
          },
          {
            id: "freshness",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/freshness.json"),
            appliesToFields: ["data.derived.freshnessStatus"],
          },
          {
            id: "momentum-signal",
            version: METHODOLOGY_VERSION,
            url: ensureAbsoluteUrl("/knowledge/methodology/momentum-signal.json"),
            appliesToFields: ["data.derived.momentum"],
          },
        ],
      },
      relatedEntities: {
        methodologies: ["epi", "value-score", "freshness", "momentum-signal"],
        rankings: ["rate-low-to-high", "rate-high-to-low", "affordability", "value-score", "momentum-signal"],
        national: true,
      },
      offersRef: {
        offersIndexUrl: "/knowledge/offers/index.json",
        offersConfigUrl: "/knowledge/policy/offers-config.json",
        enabled: offersEnabled,
      },
    };
    const dcFacts = buildStateFacts(dcData, freshnessBlock);
    (dcData as Record<string, unknown>).facts = dcFacts;
    const dcMetaWithExcerpt = { ...dcMeta, excerpt: buildStateExcerpt(dcData) };
    const dcQualityScore = computeQualityScore(dcMetaWithExcerpt, dcData as Record<string, unknown>, "state");
    const dcPage = buildPageWithHash({ ...dcMetaWithExcerpt, qualityScore: dcQualityScore }, dcData);
    validatePage(dcPage, sourceVersion);
    pageWrites.push({ jsonUrl: dcJsonUrl, page: dcPage });
    registryStates.push(
      toRegistryItem({
        meta: dcPage.meta,
        relatedMethodologyUrls: [
          ensureAbsoluteUrl(methodologyRefs.electricityPriceIndex),
          ensureAbsoluteUrl(methodologyRefs.valueScore),
          ensureAbsoluteUrl(methodologyRefs.freshnessScoring),
        ],
        relatedDataEndpoints: [
          ensureAbsoluteUrl(dataEndpoints.statesJson),
          ensureAbsoluteUrl(dataEndpoints.statesCsv),
        ],
      }),
    );
  }

  const methodologyPages: Array<{
    slug: "epi" | "value-score" | "freshness" | "cagr" | "volatility" | "price-trend" | "momentum-signal";
    title: string;
    description: string;
    canonicalUrl: string;
    jsonUrl: string;
    data: MethodologyKnowledgeData;
  }> = [
    {
      slug: "epi",
      title: "Electricity Price Index Methodology",
      description: "Methodology for Electricity Price Index calculations and interpretation.",
      canonicalUrl: "/knowledge/methodology/epi",
      jsonUrl: "/knowledge/methodology/epi.json",
      data: {
        definition: "Electricity Price Index compares each state's rate to the national baseline of 100.",
        inputs: ["State average residential rate", "National average residential rate"],
        steps: [
          "Collect normalized state rates from canonical pipeline.",
          "Compute index value relative to national average.",
          "Round and categorize relative position.",
        ],
        limitations: [
          "Energy-only rates do not include fees and taxes.",
          "Comparative index does not model utility plan mix.",
        ],
        relatedInternalUrls: [
          ensureAbsoluteUrl(methodologyRefs.electricityPriceIndex),
          ensureAbsoluteUrl("/index-ranking"),
        ],
        relatedEntities: {
          national: true,
          rankings: ["rate-low-to-high", "rate-high-to-low", "affordability"],
        },
      },
    },
    {
      slug: "value-score",
      title: "Value Score Methodology",
      description: "Methodology for Value Score composition and tier assignment.",
      canonicalUrl: "/knowledge/methodology/value-score",
      jsonUrl: "/knowledge/methodology/value-score.json",
      data: {
        definition: "Value Score combines affordability and freshness signals into a single ranking score.",
        inputs: ["Affordability index", "Freshness status", "Normalized state rates"],
        steps: [
          "Compute affordability records from normalized states.",
          "Apply Value Score weighting.",
          "Assign value tier labels.",
        ],
        limitations: [
          "Score is a comparative heuristic, not a utility bill forecast.",
          "Dependent on monthly cadence of source updates.",
        ],
        relatedInternalUrls: [
          ensureAbsoluteUrl(methodologyRefs.valueScore),
          ensureAbsoluteUrl("/value-ranking"),
        ],
        relatedEntities: {
          national: true,
          rankings: ["value-score"],
        },
      },
    },
    {
      slug: "freshness",
      title: "Freshness Scoring Methodology",
      description: "Methodology for data freshness status and recency labels.",
      canonicalUrl: "/knowledge/methodology/freshness",
      jsonUrl: "/knowledge/methodology/freshness.json",
      data: {
        definition: "Freshness scoring classifies data recency based on the updated field age.",
        inputs: ["Updated month", "Current date"],
        steps: [
          "Parse updated month/year into UTC date.",
          "Calculate age in days.",
          "Map age to freshness status and label.",
        ],
        limitations: [
          "Recency does not guarantee source revision significance.",
          "Cadence assumptions may vary by external publisher.",
        ],
        relatedInternalUrls: [
          ensureAbsoluteUrl(methodologyRefs.freshnessScoring),
          ensureAbsoluteUrl("/data-policy"),
        ],
        relatedEntities: {
          national: true,
        },
      },
    },
    {
      slug: "cagr",
      title: "CAGR Methodology",
      description: "Compound annual growth rate methodology for long-horizon rate trends.",
      canonicalUrl: "/knowledge/methodology/cagr",
      jsonUrl: "/knowledge/methodology/cagr.json",
      data: {
        definition: "CAGR (Compound Annual Growth Rate) measures the geometric mean annual growth of electricity rates over a specified period.",
        inputs: ["Historical monthly avgRateCentsPerKwh", "Start and end dates"],
        steps: [
          "Select start point near target years ago (e.g. 25y).",
          "Select end point (most recent).",
          "CAGR = (end/start)^(1/years) - 1.",
        ],
        limitations: [
          "Requires historical time-series data. Rankings are disabled when history is unavailable.",
          "Sensitive to start/end point selection.",
        ],
        relatedInternalUrls: [ensureAbsoluteUrl("/knowledge/rankings/cagr-25y")],
        relatedEntities: {
          national: true,
          rankings: ["cagr-25y"],
        },
      },
    },
    {
      slug: "volatility",
      title: "Volatility Index Methodology",
      description: "Coefficient of variation methodology for rate volatility over a window.",
      canonicalUrl: "/knowledge/methodology/volatility",
      jsonUrl: "/knowledge/methodology/volatility.json",
      data: {
        definition: "Volatility index uses coefficient of variation (stdev/mean) of monthly rates over a consistent window.",
        inputs: ["Historical monthly avgRateCentsPerKwh", "Window (e.g. last 5 years)"],
        steps: [
          "Filter to window (e.g. last 5 years monthly).",
          "Compute mean and standard deviation.",
          "volatilityPct = (stdev / mean) * 100.",
        ],
        limitations: [
          "Requires historical time-series data. Rankings are disabled when history is unavailable.",
          "Window choice affects comparability.",
        ],
        relatedInternalUrls: [ensureAbsoluteUrl("/knowledge/rankings/volatility-5y")],
        relatedEntities: {
          national: true,
          rankings: ["volatility-5y"],
        },
      },
    },
    {
      slug: "price-trend",
      title: "Price Trend Methodology",
      description: "Annualized linear trend methodology for electricity price growth.",
      canonicalUrl: "/knowledge/methodology/price-trend",
      jsonUrl: "/knowledge/methodology/price-trend.json",
      data: {
        definition: "Trend ranking measures historical growth in electricity prices using a linear percent change, annualized over the window.",
        inputs: ["Historical monthly avgRateCentsPerKwh", "Start and end dates (~5 years)"],
        steps: [
          "Select start point: closest data ~5 years ago. If 5y not available, use longest available window.",
          "Select end point: most recent data.",
          "trendChange = ((endRate - startRate) / startRate) * 100",
          "annualizedTrend = trendChange / years",
        ],
        limitations: [
          "Historical trends do not predict future prices.",
          "Data coverage varies by state.",
          "Requires historical time-series data. Rankings are disabled when history is unavailable.",
        ],
        relatedInternalUrls: [ensureAbsoluteUrl("/knowledge/rankings/price-trend")],
        relatedEntities: {
          national: true,
          rankings: ["price-trend"],
        },
      },
    },
    {
      slug: "momentum-signal",
      title: "Momentum Signal Methodology",
      description: "Directional historical signal for electricity price trend direction.",
      canonicalUrl: "/knowledge/methodology/momentum-signal",
      jsonUrl: "/knowledge/methodology/momentum-signal.json",
      data: {
        definition: "The momentum signal is a directional historical signal that summarizes whether a state's electricity prices appear to be accelerating, rising, stable, or falling. It is not a forecast.",
        inputs: [
          "Historical monthly avgRateCentsPerKwh",
          "Short window (~12 months ago to most recent)",
          "Long window (~24 months ago to most recent)",
        ],
        steps: [
          "Use up to 24 most recent monthly points.",
          "Require at least 6 usable points for a signal.",
          "shortWindowChange = percent change from ~12 months ago to most recent.",
          "longWindowChange = percent change from ~24 months ago to most recent.",
          "acceleration = shortWindowChange - (longWindowChange / comparable_years_factor).",
          "Classify: accelerating (shortWindowChange > 3% AND acceleration > 1%), rising (shortWindowChange > 1%), falling (shortWindowChange < -1%), otherwise stable.",
          "momentumScore: accelerating = 2 + shortWindowChange, rising = 1 + shortWindowChange, stable = 0, falling = -1 + shortWindowChange.",
        ],
        limitations: [
          "This is a directional historical signal, not a forecast.",
          "Missing or limited history can make the signal unavailable.",
          "Thresholds are deterministic and transparent.",
        ],
        relatedInternalUrls: [ensureAbsoluteUrl("/knowledge/rankings/momentum-signal")],
        relatedEntities: {
          national: true,
          rankings: ["momentum-signal"],
        },
      },
    },
  ];

  const methodologyMetaDefs: Record<
    "epi" | "value-score" | "freshness" | "cagr" | "volatility" | "price-trend" | "momentum-signal",
    MethodologyMeta
  > = {
    epi: {
      id: "epi",
      version: METHODOLOGY_VERSION,
      lastReviewedAt: generatedAt.split("T")[0] ?? generatedAt,
      relatedDerivedFields: [
        "data.derived.exampleBills",
        "data.derived.percentileRankings.ratePercentile",
        "data.derived.averageRate",
        "data.derived.medianRate",
        "data.derived.dispersionMetrics",
        "data.derived.highestState",
        "data.derived.lowestState",
        "data.derived.top5Highest",
        "data.derived.top5Lowest",
        "data.sortedStates",
      ],
    },
    "value-score": {
      id: "value-score",
      version: METHODOLOGY_VERSION,
      lastReviewedAt: generatedAt.split("T")[0] ?? generatedAt,
      relatedDerivedFields: [
        "data.derived.valueScore",
        "data.derived.affordabilityIndex",
        "data.derived.percentileRankings.valueScorePercentile",
        "data.derived.percentileRankings.affordabilityPercentile",
        "data.sortedStates",
      ],
    },
    freshness: {
      id: "freshness",
      version: METHODOLOGY_VERSION,
      lastReviewedAt: generatedAt.split("T")[0] ?? generatedAt,
      relatedDerivedFields: ["data.derived.freshnessStatus"],
    },
    cagr: {
      id: "cagr",
      version: METHODOLOGY_VERSION,
      lastReviewedAt: generatedAt.split("T")[0] ?? generatedAt,
      relatedDerivedFields: ["data.sortedStates"],
    },
    volatility: {
      id: "volatility",
      version: METHODOLOGY_VERSION,
      lastReviewedAt: generatedAt.split("T")[0] ?? generatedAt,
      relatedDerivedFields: ["data.sortedStates"],
    },
    "price-trend": {
      id: "price-trend",
      version: METHODOLOGY_VERSION,
      lastReviewedAt: generatedAt.split("T")[0] ?? generatedAt,
      relatedDerivedFields: ["data.sortedStates"],
    },
    "momentum-signal": {
      id: "momentum-signal",
      version: METHODOLOGY_VERSION,
      lastReviewedAt: generatedAt.split("T")[0] ?? generatedAt,
      relatedDerivedFields: ["data.sortedStates", "data.derived.momentum"],
    },
  };

  for (const m of methodologyPages) {
    const methodologyProvenanceId =
      m.slug === "epi"
        ? "poe-methodology-epi"
        : m.slug === "value-score"
          ? "poe-methodology-value-score"
          : m.slug === "freshness"
            ? "poe-methodology-freshness"
            : m.slug === "cagr"
              ? "poe-methodology-cagr"
              : m.slug === "volatility"
                ? "poe-methodology-volatility"
                : m.slug === "price-trend"
                  ? "poe-methodology-price-trend"
                  : "poe-methodology-momentum-signal";
    const baseMeta = makeMeta({
      id: `knowledge:methodology:${m.slug}`,
      type: "methodology",
      slug: m.slug,
      title: m.title,
      description: m.description,
      canonicalUrl: m.canonicalUrl,
      jsonUrl: m.jsonUrl,
      updatedAt: generatedAt,
      sourceVersion,
      isLatest: true,
      provenance: buildPageProvenance([methodologyProvenanceId], generatedAt),
      freshness: freshnessBlock,
      fieldProvenance: [
        {
          field: "data.definition",
          provenanceIds: [methodologyProvenanceId],
        },
        {
          field: "data.inputs",
          provenanceIds: [methodologyProvenanceId],
        },
        {
          field: "data.steps",
          provenanceIds: [methodologyProvenanceId],
        },
        {
          field: "data.limitations",
          provenanceIds: [methodologyProvenanceId],
        },
        {
          field: "data.relatedInternalUrls",
          provenanceIds: [methodologyProvenanceId],
        },
      ],
      llmHints: {
        priority: "high",
        entityType: "methodology",
        semanticTopics: ["methodology", "electricity rates", "index calculation", "data freshness"],
        semanticCluster: "calculation-framework",
      },
      excerpt: buildMethodologyExcerpt(m.title, m.slug),
      disclaimerRefs: ["methodology"],
    });
    const meta: Omit<KnowledgeMeta, "contentHash"> = {
      ...baseMeta,
      methodology: methodologyMetaDefs[m.slug],
    };
    const methodologyQualityScore = computeQualityScore(meta, m.data as Record<string, unknown>, "methodology");
    const page = buildPageWithHash({ ...meta, qualityScore: methodologyQualityScore }, m.data);
    validatePage(page, sourceVersion);
    pageWrites.push({ jsonUrl: m.jsonUrl, page });
    registryMethodology.push(
      toRegistryItem({
        meta: page.meta,
        relatedMethodologyUrls: [
          ensureAbsoluteUrl(methodologyRefs.electricityPriceIndex),
          ensureAbsoluteUrl(methodologyRefs.valueScore),
          ensureAbsoluteUrl(methodologyRefs.freshnessScoring),
        ],
        relatedDataEndpoints: [ensureAbsoluteUrl(dataEndpoints.statesJson)],
      }),
    );
  }

  const methodologyIndexBody: KnowledgeMethodologyIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    items: methodologyPages
      .map((m) => ({
        id: m.slug,
        title: m.title,
        jsonUrl: ensureAbsoluteUrl(m.jsonUrl),
        canonicalUrl: ensureAbsoluteUrl(m.canonicalUrl),
        version: METHODOLOGY_VERSION,
        lastReviewedAt: methodologyMetaDefs[m.slug].lastReviewedAt,
        relatedDerivedFields: methodologyMetaDefs[m.slug].relatedDerivedFields,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };

  const MONTHLY_USAGE_KWH = 900;
  const rankingPages: Array<{
    slug: "affordability" | "value-score" | "rate-low-to-high" | "rate-high-to-low" | "cagr-25y" | "volatility-5y" | "price-trend" | "momentum-signal" | "electricity-inflation-1y" | "electricity-inflation-5y" | "electricity-affordability" | "most-expensive-electricity";
    title: string;
    description: string;
    data: RankingsKnowledgeData & { enabled?: boolean; windowYears?: number };
  }> = [
    {
      slug: "affordability",
      title: "Affordability Rankings",
      description: "Deterministic affordability ranking across normalized states.",
      data: (() => {
        const sorted = stableRankedStates(
          normalizedStates,
          (state) => state.affordabilityIndex,
          "desc",
        );
        const top10 = sorted.slice(0, 10).map((s) => s.slug);
        const bottom10 = sorted.slice(-10).map((s) => s.slug);
        const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
          const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
          const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
          return na.localeCompare(nb);
        });
        return {
          rankingType: "affordability" as const,
          sortedStates: sorted,
          generatedAt,
          derivedMeta: {
            methodologiesUsed: [
              {
                id: "value-score",
                version: METHODOLOGY_VERSION,
                url: ensureAbsoluteUrl("/knowledge/methodology/value-score.json"),
                appliesToFields: ["data.sortedStates"],
              },
            ],
          },
          relatedEntities: {
            methodologies: ["epi"],
            states: stateSlugs,
          },
        };
      })(),
    },
    {
      slug: "value-score",
      title: "Value Score Rankings",
      description: "Deterministic value score ranking across normalized states.",
      data: (() => {
        const sorted = stableRankedStates(
          normalizedStates,
          (state) => state.valueScore,
          "desc",
        );
        const top10 = sorted.slice(0, 10).map((s) => s.slug);
        const bottom10 = sorted.slice(-10).map((s) => s.slug);
        const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
          const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
          const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
          return na.localeCompare(nb);
        });
        return {
          rankingType: "value-score" as const,
          sortedStates: sorted,
          generatedAt,
          derivedMeta: {
            methodologiesUsed: [
              {
                id: "value-score",
                version: METHODOLOGY_VERSION,
                url: ensureAbsoluteUrl("/knowledge/methodology/value-score.json"),
                appliesToFields: ["data.sortedStates"],
              },
            ],
          },
          relatedEntities: {
            methodologies: ["value-score"],
            states: stateSlugs,
          },
        };
      })(),
    },
    {
      slug: "rate-low-to-high",
      title: "Rate Rankings (Low to High)",
      description: "Deterministic ranking of average state rates from lowest to highest.",
      data: (() => {
        const sorted = stableRankedStates(
          normalizedStates,
          (state) => state.avgRateCentsPerKwh,
          "asc",
        );
        const top10 = sorted.slice(0, 10).map((s) => s.slug);
        const bottom10 = sorted.slice(-10).map((s) => s.slug);
        const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
          const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
          const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
          return na.localeCompare(nb);
        });
        return {
          rankingType: "rate-low-to-high" as const,
          sortedStates: sorted,
          generatedAt,
          derivedMeta: {
            methodologiesUsed: [
              {
                id: "epi",
                version: METHODOLOGY_VERSION,
                url: ensureAbsoluteUrl("/knowledge/methodology/epi.json"),
                appliesToFields: ["data.sortedStates"],
              },
            ],
          },
          relatedEntities: {
            methodologies: ["epi"],
            states: stateSlugs,
          },
        };
      })(),
    },
    {
      slug: "rate-high-to-low",
      title: "Rate Rankings (High to Low)",
      description: "Deterministic ranking of average state rates from highest to lowest.",
      data: (() => {
        const sorted = stableRankedStates(
          normalizedStates,
          (state) => state.avgRateCentsPerKwh,
          "desc",
        );
        const top10 = sorted.slice(0, 10).map((s) => s.slug);
        const bottom10 = sorted.slice(-10).map((s) => s.slug);
        const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
          const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
          const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
          return na.localeCompare(nb);
        });
        return {
          rankingType: "rate-high-to-low" as const,
          sortedStates: sorted,
          generatedAt,
          derivedMeta: {
            methodologiesUsed: [
              {
                id: "epi",
                version: METHODOLOGY_VERSION,
                url: ensureAbsoluteUrl("/knowledge/methodology/epi.json"),
                appliesToFields: ["data.sortedStates"],
              },
            ],
          },
          relatedEntities: {
            methodologies: ["epi"],
            states: stateSlugs,
          },
        };
      })(),
    },
    {
      slug: "electricity-affordability" as const,
      title: "Most Affordable Electricity by State",
      description: "States ranked by estimated monthly electricity bill at 900 kWh. Lower bill = more affordable.",
      data: (() => {
        const withBill = normalizedStates
          .filter((s) => typeof s.avgRateCentsPerKwh === "number" && Number.isFinite(s.avgRateCentsPerKwh))
          .map((s) => {
            const rateDollars = (s.avgRateCentsPerKwh ?? 0) / 100;
            const estimatedMonthlyBill = rateDollars * MONTHLY_USAGE_KWH;
            return {
              slug: s.slug,
              name: s.name ?? slugToDisplayName(s.slug),
              estimatedMonthlyBill: Math.round(estimatedMonthlyBill * 100) / 100,
            };
          });
        const sorted = withBill.sort((a, b) => a.estimatedMonthlyBill - b.estimatedMonthlyBill);
        const top10 = sorted.slice(0, 10).map((s) => s.slug);
        const bottom10 = sorted.slice(-10).map((s) => s.slug);
        const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
          const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
          const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
          return na.localeCompare(nb);
        });
        return {
          rankingType: "electricity-affordability" as const,
          sortedStates: sorted.map((s, i) => ({
            rank: i + 1,
            slug: s.slug,
            name: s.name,
            metricValue: s.estimatedMonthlyBill,
            value: s.estimatedMonthlyBill,
            displayValue: `$${s.estimatedMonthlyBill.toFixed(2)}`,
          })),
          generatedAt,
          derivedMeta: {
            methodologiesUsed: [
              {
                id: "epi",
                version: METHODOLOGY_VERSION,
                url: ensureAbsoluteUrl("/knowledge/methodology/epi.json"),
                appliesToFields: ["data.sortedStates"],
              },
            ],
          },
          relatedEntities: { methodologies: ["epi"], states: stateSlugs },
        };
      })(),
    },
    {
      slug: "most-expensive-electricity" as const,
      title: "Least Affordable Electricity by State",
      description: "States ranked by estimated monthly electricity bill at 900 kWh. Higher bill = less affordable.",
      data: (() => {
        const withBill = normalizedStates
          .filter((s) => typeof s.avgRateCentsPerKwh === "number" && Number.isFinite(s.avgRateCentsPerKwh))
          .map((s) => {
            const rateDollars = (s.avgRateCentsPerKwh ?? 0) / 100;
            const estimatedMonthlyBill = rateDollars * MONTHLY_USAGE_KWH;
            return {
              slug: s.slug,
              name: s.name ?? slugToDisplayName(s.slug),
              estimatedMonthlyBill: Math.round(estimatedMonthlyBill * 100) / 100,
            };
          });
        const sorted = withBill.sort((a, b) => b.estimatedMonthlyBill - a.estimatedMonthlyBill);
        const top10 = sorted.slice(0, 10).map((s) => s.slug);
        const bottom10 = sorted.slice(-10).map((s) => s.slug);
        const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
          const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
          const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
          return na.localeCompare(nb);
        });
        return {
          rankingType: "most-expensive-electricity" as const,
          sortedStates: sorted.map((s, i) => ({
            rank: i + 1,
            slug: s.slug,
            name: s.name,
            metricValue: s.estimatedMonthlyBill,
            value: s.estimatedMonthlyBill,
            displayValue: `$${s.estimatedMonthlyBill.toFixed(2)}`,
          })),
          generatedAt,
          derivedMeta: {
            methodologiesUsed: [
              {
                id: "epi",
                version: METHODOLOGY_VERSION,
                url: ensureAbsoluteUrl("/knowledge/methodology/epi.json"),
                appliesToFields: ["data.sortedStates"],
              },
            ],
          },
          relatedEntities: { methodologies: ["epi"], states: stateSlugs },
        };
      })(),
    },
    ...(eiaHistory.historyAvailable && eiaHistory.byState
      ? [
          {
            slug: "cagr-25y" as const,
            title: "25-Year Rate Growth (CAGR)",
            description: "Compound annual growth rate of residential electricity rates over ~25 years. Higher = faster rate growth.",
            data: (() => {
              const sorted = computeCagrFromHistory(eiaHistory.byState!, 25);
              const top10 = sorted.slice(0, 10).map((s) => s.slug);
              const bottom10 = sorted.slice(-10).map((s) => s.slug);
              const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
                const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
                const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
                return na.localeCompare(nb);
              });
              return {
                rankingType: "cagr-25y" as const,
                sortedStates: sorted.map((s, i) => ({ ...s, rank: i + 1 })),
                generatedAt,
                windowYears: 25,
                enabled: true,
                derivedMeta: {
                  methodologiesUsed: [
                    {
                      id: "cagr",
                      version: METHODOLOGY_VERSION,
                      url: ensureAbsoluteUrl("/knowledge/methodology/cagr.json"),
                      appliesToFields: ["data.sortedStates"],
                    },
                  ],
                },
                relatedEntities: { methodologies: ["cagr"], states: stateSlugs },
              };
            })(),
          },
          {
            slug: "volatility-5y" as const,
            title: "5-Year Rate Volatility",
            description: "Coefficient of variation (stdev/mean) of monthly rates over the last 5 years. Higher = more volatile.",
            data: (() => {
              const sorted = computeVolatilityFromHistory(eiaHistory.byState!, 5);
              const top10 = sorted.slice(0, 10).map((s) => s.slug);
              const bottom10 = sorted.slice(-10).map((s) => s.slug);
              const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
                const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
                const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
                return na.localeCompare(nb);
              });
              return {
                rankingType: "volatility-5y" as const,
                sortedStates: sorted.map((s, i) => ({ ...s, rank: i + 1 })),
                generatedAt,
                windowYears: 5,
                enabled: true,
                derivedMeta: {
                  methodologiesUsed: [
                    {
                      id: "volatility",
                      version: METHODOLOGY_VERSION,
                      url: ensureAbsoluteUrl("/knowledge/methodology/volatility.json"),
                      appliesToFields: ["data.sortedStates"],
                    },
                  ],
                },
                relatedEntities: { methodologies: ["volatility"], states: stateSlugs },
              };
            })(),
          },
        ]
      : [
          {
            slug: "cagr-25y" as const,
            title: "25-Year Rate Growth (CAGR)",
            description: "Compound annual growth rate of residential electricity rates over ~25 years. Requires historical time-series data.",
            data: {
              rankingType: "cagr-25y" as const,
              sortedStates: [],
              generatedAt,
              windowYears: 25,
              enabled: false,
              derivedMeta: { methodologiesUsed: [] },
              relatedEntities: { methodologies: ["cagr"], states: [] },
            },
          },
          {
            slug: "volatility-5y" as const,
            title: "5-Year Rate Volatility",
            description: "Coefficient of variation of monthly rates over the last 5 years. Requires historical time-series data.",
            data: {
              rankingType: "volatility-5y" as const,
              sortedStates: [],
              generatedAt,
              windowYears: 5,
              enabled: false,
              derivedMeta: { methodologiesUsed: [] },
              relatedEntities: { methodologies: ["volatility"], states: [] },
            },
          },
          {
            slug: "price-trend" as const,
            title: "Electricity Price Trend Ranking",
            description: "Historical price trend unavailable.",
            data: {
              rankingType: "price-trend" as const,
              sortedStates: [],
              generatedAt,
              windowYears: 0,
              enabled: false,
              derivedMeta: { methodologiesUsed: [] },
              relatedEntities: { methodologies: ["price-trend"], states: [] },
            },
          },
          {
            slug: "momentum-signal" as const,
            title: "Electricity Price Momentum Signal Ranking",
            description: "Momentum signal unavailable.",
            data: {
              rankingType: "momentum-signal" as const,
              sortedStates: [],
              generatedAt,
              enabled: false,
              derivedMeta: { methodologiesUsed: [] },
              relatedEntities: { methodologies: ["momentum-signal"], states: [] },
            },
          },
        ]),
    ...(eiaHistory.historyAvailable && eiaHistory.byState
      ? [
          {
            slug: "price-trend" as const,
            title: "Electricity Price Trend Ranking",
            description: "States where electricity prices are rising the fastest.",
            data: (() => {
              const nameBySlug = new Map(normalizedStates.map((s) => [s.slug, s.name ?? slugToDisplayName(s.slug)]));
              const sorted = computePriceTrendFromHistory(eiaHistory.byState!, 5, nameBySlug);
              const top10 = sorted.slice(0, 10).map((s) => s.slug);
              const bottom10 = sorted.slice(-10).map((s) => s.slug);
              const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
                const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
                const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
                return na.localeCompare(nb);
              });
              const windowYears = sorted.length > 0 ? 5 : 0;
              return {
                rankingType: "price-trend" as const,
                sortedStates: sorted.map((s, i) => ({
                  rank: i + 1,
                  slug: s.slug,
                  name: s.name,
                  metricValue: s.annualizedTrend,
                  startRate: s.startRate,
                  endRate: s.endRate,
                  changePercent: s.changePercent,
                })),
                generatedAt,
                windowYears,
                enabled: true,
                derivedMeta: {
                  methodologiesUsed: [
                    {
                      id: "price-trend",
                      version: METHODOLOGY_VERSION,
                      url: ensureAbsoluteUrl("/knowledge/methodology/price-trend.json"),
                      appliesToFields: ["data.sortedStates"],
                    },
                  ],
                },
                relatedEntities: { methodologies: ["price-trend"], states: stateSlugs },
              };
            })(),
          },
          {
            slug: "momentum-signal" as const,
            title: "Electricity Price Momentum Signal Ranking",
            description: "States where electricity prices are accelerating, rising, stable, or falling.",
            data: (() => {
              const sorted = computeMomentumFromHistory(eiaHistory.byState!, nameBySlug);
              const top10 = sorted.slice(0, 10).map((s) => s.slug);
              const bottom10 = sorted.slice(-10).map((s) => s.slug);
              const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
                const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
                const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
                return na.localeCompare(nb);
              });
              return {
                rankingType: "momentum-signal" as const,
                sortedStates: sorted.map((s, i) => ({
                  rank: i + 1,
                  slug: s.slug,
                  name: s.name,
                  metricValue: s.metricValue,
                  signal: s.signal,
                  shortWindowChangePercent: s.shortWindowChangePercent,
                  longWindowChangePercent: s.longWindowChangePercent,
                })),
                generatedAt,
                enabled: true,
                derivedMeta: {
                  methodologiesUsed: [
                    {
                      id: "momentum-signal",
                      version: METHODOLOGY_VERSION,
                      url: ensureAbsoluteUrl("/knowledge/methodology/momentum-signal.json"),
                      appliesToFields: ["data.sortedStates"],
                    },
                  ],
                },
                relatedEntities: { methodologies: ["momentum-signal"], states: stateSlugs },
              };
            })(),
          },
        ]
      : []),
    ...(priceHistoryBySlug.size > 0
      ? [
          {
            slug: "electricity-inflation-1y" as const,
            title: "1-Year Electricity Inflation Ranking",
            description: "States ranked by 1-year electricity price increase. Higher = faster price growth.",
            data: (() => {
              const nameBySlug = new Map(normalizedStates.map((s) => [s.slug, s.name ?? slugToDisplayName(s.slug)]));
              const withHistory = Array.from(priceHistoryBySlug.entries())
                .map(([slug, ph]) => ({
                  slug,
                  name: nameBySlug.get(slug) ?? slugToDisplayName(slug),
                  inflation1yPercent: ph.increase1YearPercent,
                }))
                .filter((s) => typeof s.inflation1yPercent === "number" && Number.isFinite(s.inflation1yPercent));
              const sorted = withHistory.sort((a, b) => b.inflation1yPercent - a.inflation1yPercent);
              const top10 = sorted.slice(0, 10).map((s) => s.slug);
              const bottom10 = sorted.slice(-10).map((s) => s.slug);
              const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
                const na = nameBySlug.get(a) ?? a;
                const nb = nameBySlug.get(b) ?? b;
                return na.localeCompare(nb);
              });
              return {
                rankingType: "electricity-inflation-1y" as const,
                sortedStates: sorted.map((s, i) => ({
                  rank: i + 1,
                  slug: s.slug,
                  name: s.name,
                  metricValue: s.inflation1yPercent,
                  value: s.inflation1yPercent,
                  displayValue: `${s.inflation1yPercent.toFixed(1)}%`,
                })),
                generatedAt,
                enabled: true,
                excludedStates: { count: normalizedStates.length - sorted.length, reason: "No historical data" },
                derivedMeta: {
                  methodologiesUsed: [
                    {
                      id: "price-trend",
                      version: METHODOLOGY_VERSION,
                      url: ensureAbsoluteUrl("/knowledge/methodology/price-trend.json"),
                      appliesToFields: ["data.sortedStates"],
                    },
                  ],
                },
                relatedEntities: { methodologies: ["price-trend"], states: stateSlugs },
              };
            })(),
          },
          {
            slug: "electricity-inflation-5y" as const,
            title: "5-Year Electricity Inflation Ranking",
            description: "States ranked by 5-year electricity price increase. Higher = faster price growth.",
            data: (() => {
              const nameBySlug = new Map(normalizedStates.map((s) => [s.slug, s.name ?? slugToDisplayName(s.slug)]));
              const withHistory = Array.from(priceHistoryBySlug.entries())
                .map(([slug, ph]) => ({
                  slug,
                  name: nameBySlug.get(slug) ?? slugToDisplayName(slug),
                  inflation5yPercent: ph.increase5YearPercent,
                }))
                .filter((s) => s.inflation5yPercent != null && Number.isFinite(s.inflation5yPercent));
              const sorted = withHistory.sort((a, b) => (b.inflation5yPercent ?? 0) - (a.inflation5yPercent ?? 0));
              const top10 = sorted.slice(0, 10).map((s) => s.slug);
              const bottom10 = sorted.slice(-10).map((s) => s.slug);
              const stateSlugs = [...new Set([...top10, ...bottom10])].sort((a, b) => {
                const na = nameBySlug.get(a) ?? a;
                const nb = nameBySlug.get(b) ?? b;
                return na.localeCompare(nb);
              });
              return {
                rankingType: "electricity-inflation-5y" as const,
                sortedStates: sorted.map((s, i) => ({
                  rank: i + 1,
                  slug: s.slug,
                  name: s.name,
                  metricValue: s.inflation5yPercent ?? 0,
                  value: s.inflation5yPercent ?? 0,
                  displayValue: `${(s.inflation5yPercent ?? 0).toFixed(1)}%`,
                })),
                generatedAt,
                enabled: true,
                excludedStates: { count: normalizedStates.length - sorted.length, reason: "No historical data" },
                derivedMeta: {
                  methodologiesUsed: [
                    {
                      id: "price-trend",
                      version: METHODOLOGY_VERSION,
                      url: ensureAbsoluteUrl("/knowledge/methodology/price-trend.json"),
                      appliesToFields: ["data.sortedStates"],
                    },
                  ],
                },
                relatedEntities: { methodologies: ["price-trend"], states: stateSlugs },
              };
            })(),
          },
        ]
      : [
          {
            slug: "electricity-inflation-1y" as const,
            title: "1-Year Electricity Inflation Ranking",
            description: "Requires historical electricity rate data.",
            data: {
              rankingType: "electricity-inflation-1y" as const,
              sortedStates: [],
              generatedAt,
              enabled: false,
              derivedMeta: { methodologiesUsed: [] },
              relatedEntities: { methodologies: [], states: [] },
            },
          },
          {
            slug: "electricity-inflation-5y" as const,
            title: "5-Year Electricity Inflation Ranking",
            description: "Requires historical electricity rate data.",
            data: {
              rankingType: "electricity-inflation-5y" as const,
              sortedStates: [],
              generatedAt,
              enabled: false,
              derivedMeta: { methodologiesUsed: [] },
              relatedEntities: { methodologies: [], states: [] },
            },
          },
        ]),
  ];

  const RANKING_METRIC_SHORT: Record<string, string> = {
    affordability: "affordability",
    "value-score": "value score",
    "rate-low-to-high": "rate (low to high)",
    "rate-high-to-low": "rate (high to low)",
    "cagr-25y": "25-year CAGR",
    "volatility-5y": "5-year volatility %",
    "price-trend": "annualized price growth %",
    "momentum-signal": "momentum score",
    "electricity-inflation-1y": "1-year inflation %",
    "electricity-inflation-5y": "5-year inflation %",
    "electricity-affordability": "est. monthly bill (900 kWh)",
    "most-expensive-electricity": "est. monthly bill (900 kWh)",
  };
  const RANKING_SORT_DIR: Record<string, "asc" | "desc"> = {
    affordability: "desc",
    "value-score": "desc",
    "rate-low-to-high": "asc",
    "rate-high-to-low": "desc",
    "cagr-25y": "desc",
    "volatility-5y": "desc",
    "price-trend": "desc",
    "momentum-signal": "desc",
    "electricity-inflation-1y": "desc",
    "electricity-inflation-5y": "desc",
    "electricity-affordability": "asc",
    "most-expensive-electricity": "desc",
  };

  for (const r of rankingPages) {
    const jsonUrl = `/knowledge/rankings/${r.slug}.json`;
    const rankingProvenance = buildPageProvenance(
      [
        "eia-retail-sales-923",
        "poe-methodology-epi",
        "poe-methodology-value-score",
        "poe-dataset-states-json",
        "poe-dataset-affordability-csv",
        "poe-dataset-value-ranking-csv",
      ],
      generatedAt,
    );
    const meta = makeMeta({
      id: `knowledge:rankings:${r.slug}`,
      type: "rankings",
      slug: r.slug,
      title: r.title,
      description: r.description,
      canonicalUrl: `/knowledge/rankings/${r.slug}`,
      jsonUrl,
      updatedAt: generatedAt,
      sourceVersion,
      isLatest: true,
      provenance: rankingProvenance,
      freshness: freshnessBlock,
      fieldProvenance: [
        {
          field: "data.rankingType",
          provenanceIds: ["poe-methodology-epi", "poe-methodology-value-score"],
        },
        {
          field: "data.sortedStates",
          provenanceIds: [
            "eia-retail-sales-923",
            "poe-dataset-states-json",
            "poe-dataset-affordability-csv",
            "poe-dataset-value-ranking-csv",
          ],
        },
        {
          field: "data.generatedAt",
          provenanceIds: ["poe-dataset-states-json"],
        },
      ],
      llmHints: {
        priority: "medium",
        entityType: "rankings",
        semanticTopics: ["state comparison", "electricity rates", "affordability", "ranking methodology"],
        semanticCluster: "comparative-analysis",
      },
      excerpt: (r.data as { enabled?: boolean }).enabled === false
        ? (r.slug === "price-trend"
            ? "Historical price trend unavailable."
            : r.slug === "momentum-signal"
              ? "Momentum signal unavailable."
              : r.slug === "electricity-inflation-1y" || r.slug === "electricity-inflation-5y"
                ? "Electricity inflation ranking unavailable. Requires historical rate data."
                : `${r.title}. History unavailable. Requires historical time-series data.`)
        : buildRankingsExcerpt(
            r.title,
            RANKING_METRIC_SHORT[r.slug] ?? r.slug,
            RANKING_SORT_DIR[r.slug] ?? "desc",
            r.data.sortedStates?.[0]?.name,
          ),
      disclaimerRefs: ["rankings"],
    });
    const rankingFacts = buildRankingsFacts(r.data);
    (r.data as Record<string, unknown>).facts = rankingFacts;
    const rankingQualityScore = computeQualityScore(meta, r.data as Record<string, unknown>, "rankings");
    const page = buildPageWithHash({ ...meta, qualityScore: rankingQualityScore }, r.data);
    validatePage(page, sourceVersion);
    pageWrites.push({ jsonUrl, page });
    registryRankings.push(
      toRegistryItem({
        meta: page.meta,
        relatedMethodologyUrls: [
          ensureAbsoluteUrl(methodologyRefs.electricityPriceIndex),
          ensureAbsoluteUrl(methodologyRefs.valueScore),
          ensureAbsoluteUrl(methodologyRefs.freshnessScoring),
        ],
        relatedDataEndpoints: [
          ensureAbsoluteUrl(dataEndpoints.statesJson),
          ensureAbsoluteUrl(dataEndpoints.affordabilityCsv),
        ],
      }),
    );
  }

  const LEADERBOARD_DEFS: Array<{
    id: string;
    title: string;
    metricId: string;
    direction: "asc" | "desc";
    rankingSlug: string;
  }> = [
    { id: "rate-lowest", title: "Lowest average rate", metricId: "avgRateCentsPerKwh", direction: "asc", rankingSlug: "rate-low-to-high" },
    { id: "rate-highest", title: "Highest average rate", metricId: "avgRateCentsPerKwh", direction: "desc", rankingSlug: "rate-high-to-low" },
    { id: "value-best", title: "Best value score", metricId: "valueScore", direction: "desc", rankingSlug: "value-score" },
    { id: "affordability-best", title: "Best affordability", metricId: "affordabilityIndex", direction: "desc", rankingSlug: "affordability" },
  ];
  const leaderboardsBySlug = new Map(rankingPages.map((r) => [r.slug, r]));
  const leaderboardsBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    leaderboards: LEADERBOARD_DEFS.map((def) => {
      const ranking = leaderboardsBySlug.get(
        def.rankingSlug as "affordability" | "value-score" | "rate-low-to-high" | "rate-high-to-low",
      );
      if (!ranking) return null;
      const sortedStates = ranking.data.sortedStates ?? [];
      const validItems = sortedStates.filter(
        (s) => s.metricValue != null && Number.isFinite(s.metricValue),
      );
      const top5 = validItems.slice(0, 5).map((s, i) => ({
        rank: i + 1,
        slug: s.slug,
        name: s.name,
        value: s.metricValue,
      }));
      return {
        id: def.id,
        title: def.title,
        metricId: def.metricId,
        direction: def.direction,
        items: top5,
        jsonUrl: `/knowledge/rankings/${def.rankingSlug}.json`,
        canonicalUrl: `/knowledge/rankings/${def.rankingSlug}`,
      };
    }).filter((lb): lb is NonNullable<typeof lb> => lb != null),
  };

  const RANKING_INDEX_META: Record<
    string,
    { metricField: string; sortDirection: "asc" | "desc"; windowYears?: number }
  > = {
    affordability: { metricField: "data.derived.affordabilityIndex", sortDirection: "desc" },
    "value-score": { metricField: "data.derived.valueScore", sortDirection: "desc" },
    "rate-low-to-high": { metricField: "data.raw.avgRateCentsPerKwh", sortDirection: "asc" },
    "rate-high-to-low": { metricField: "data.raw.avgRateCentsPerKwh", sortDirection: "desc" },
    "cagr-25y": { metricField: "data.derived.cagr25y", sortDirection: "desc", windowYears: 25 },
    "volatility-5y": { metricField: "data.derived.volatility5y", sortDirection: "desc", windowYears: 5 },
    "price-trend": { metricField: "data.derived.annualizedTrend", sortDirection: "desc", windowYears: 5 },
    "momentum-signal": { metricField: "data.derived.momentum.score", sortDirection: "desc" },
    "electricity-inflation-1y": { metricField: "data.derived.inflation1yPercent", sortDirection: "desc", windowYears: 1 },
    "electricity-inflation-5y": { metricField: "data.derived.inflation5yPercent", sortDirection: "desc", windowYears: 5 },
    "electricity-affordability": { metricField: "data.sortedStates.metricValue", sortDirection: "asc" },
    "most-expensive-electricity": { metricField: "data.sortedStates.metricValue", sortDirection: "desc" },
  };
  const rankingsIndexBody: KnowledgeRankingsIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    items: rankingPages
      .map((r) => {
        const meta = RANKING_INDEX_META[r.slug];
        const methodologiesUsed =
          r.data.derivedMeta?.methodologiesUsed?.map((m) => ({
            id: m.id,
            version: m.version,
          })) ?? [];
        return {
          id: r.slug,
          title: r.title,
          description: r.description,
          metricField: meta.metricField,
          sortDirection: meta.sortDirection,
          jsonUrl: ensureAbsoluteUrl(`/knowledge/rankings/${r.slug}.json`),
          canonicalUrl: ensureAbsoluteUrl(`/knowledge/rankings/${r.slug}`),
          methodologiesUsed,
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
  };

  const verticalRelatedStates = pack.national.top5Highest.map((state) => state.slug).sort((a, b) => {
    const na = normalizedStates.find((s) => s.slug === a)?.name ?? a;
    const nb = normalizedStates.find((s) => s.slug === b)?.name ?? b;
    return na.localeCompare(nb);
  });
  const verticalRelatedRankings = ["rate-high-to-low", "affordability", "value-score", "rate-low-to-high"].sort((a, b) =>
    a.localeCompare(b),
  );
  const verticalRelatedMethodologies = ["epi", "value-score", "freshness"];

  const verticalData: VerticalKnowledgeData = {
    status: "stub",
    summary:
      "AI-energy vertical is structurally active with deterministic links, while demand/load datasets remain planned.",
    keyThemes: ["ai data centers", "load growth", "regional price pressure", "grid constraints"],
    relatedStates: pack.national.top5Highest.map((state) => state.slug),
    relatedRankings: ["rate-high-to-low", "affordability", "value-score", "rate-low-to-high"],
    relatedMethodologies: ["electricity-price-index", "value-score", "freshness-scoring"],
    monitoringEndpoints: [
      ensureAbsoluteUrl("/v/ai-energy"),
      ensureAbsoluteUrl("/v/ai-energy/watchlist"),
      ensureAbsoluteUrl("/v/ai-energy/monitoring"),
      ensureAbsoluteUrl("/v/ai-energy/glossary"),
    ],
    expansionReadiness: {
      dataAvailable: false,
      plannedDatasets: [
        "Data-center load additions by region and balancing area",
        "Utility interconnection queue additions tied to AI workloads",
        "Substation/feeder congestion indicators by metro",
      ],
      lastEvaluated: generatedAt,
    },
    relatedEntities: {
      states: verticalRelatedStates,
      rankings: verticalRelatedRankings,
      methodologies: verticalRelatedMethodologies,
    },
  };
  const verticalExcerpt = buildVerticalExcerpt(
    "AI Energy Vertical Knowledge",
    verticalData.status,
    verticalData.relatedStates?.length ?? 0,
  );
  const verticalMeta = makeMeta({
    id: "knowledge:vertical:ai-energy",
    type: "vertical",
    slug: "ai-energy",
    title: "AI Energy Vertical Knowledge",
    description: "Stub machine-readable page for AI-energy vertical navigation and references.",
    canonicalUrl: "/knowledge/vertical/ai-energy",
    jsonUrl: "/knowledge/vertical/ai-energy.json",
    updatedAt: generatedAt,
    sourceVersion,
    isLatest: true,
    provenance: buildPageProvenance(
      [
        "poe-vertical-ai-energy",
        "eia-retail-sales-923",
        "poe-methodology-epi",
        "poe-methodology-value-score",
        "poe-methodology-freshness",
      ],
      generatedAt,
    ),
    freshness: freshnessBlock,
    fieldProvenance: [
      {
        field: "data.status",
        provenanceIds: ["poe-vertical-ai-energy"],
      },
      {
        field: "data.summary",
        provenanceIds: ["poe-vertical-ai-energy"],
      },
      {
        field: "data.keyThemes",
        provenanceIds: ["poe-vertical-ai-energy"],
      },
      {
        field: "data.relatedStates",
        provenanceIds: ["poe-vertical-ai-energy", "eia-retail-sales-923"],
      },
      {
        field: "data.relatedRankings",
        provenanceIds: ["poe-vertical-ai-energy", "poe-methodology-epi"],
      },
      {
        field: "data.relatedMethodologies",
        provenanceIds: ["poe-methodology-epi", "poe-methodology-value-score", "poe-methodology-freshness"],
      },
      {
        field: "data.monitoringEndpoints",
        provenanceIds: ["poe-vertical-ai-energy"],
      },
      {
        field: "data.expansionReadiness",
        provenanceIds: ["poe-vertical-ai-energy"],
      },
    ],
    llmHints: {
      priority: "low",
      entityType: "vertical",
      semanticTopics: ["ai energy", "data centers", "electricity demand", "grid impacts"],
      semanticCluster: "industry-vertical",
    },
    excerpt: verticalExcerpt,
    disclaimerRefs: ["general-site"],
  });
  const verticalQualityScore = computeQualityScore(verticalMeta, verticalData as Record<string, unknown>, "vertical");
  const verticalPage = buildPageWithHash({ ...verticalMeta, qualityScore: verticalQualityScore }, verticalData);
  validatePage(verticalPage, sourceVersion);
  pageWrites.push({ jsonUrl: "/knowledge/vertical/ai-energy.json", page: verticalPage });
  registryVertical.push(
    toRegistryItem({
      meta: verticalPage.meta,
      relatedMethodologyUrls: [
        ensureAbsoluteUrl(methodologyRefs.electricityPriceIndex),
        ensureAbsoluteUrl(methodologyRefs.valueScore),
        ensureAbsoluteUrl(methodologyRefs.freshnessScoring),
      ],
      relatedDataEndpoints: [ensureAbsoluteUrl(dataEndpoints.statesJson)],
      verticalGroup: "ai-energy",
    }),
  );
  durationsMs.generatePages = bigintToMs(process.hrtime.bigint() - tPhase);
  checkBudget("generatePages", durationsMs.generatePages);

  tPhase = process.hrtime.bigint();
  const sortedItemsForHash = [
    ...registryNational,
    ...registryStates,
    ...registryMethodology,
    ...registryRankings,
    ...registryVertical,
  ].sort((a, b) => {
    const typeOrder = getSchemaEntityOrder(a.type) - getSchemaEntityOrder(b.type);
    if (typeOrder !== 0) return typeOrder;
    return (a.slug ?? a.id).localeCompare(b.slug ?? b.id);
  });
  const registryHash = sha256(serializeDeterministic(sortedItemsForHash));
  const contentHashesById = [...sortedItemsForHash]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => item.contentHash)
    .join("|");
  const integritySignature = sha256(contentHashesById);

  const compareFields = [
    "avgRateCentsPerKwh",
    "valueScore",
    "affordabilityIndex",
    "freshnessStatus",
    "exampleBill1000kwh",
  ];
  const statesFromNormalized = normalizedStates.map((state) => {
    const example1000 = state.exampleBills.find((b) => b.kwh === 1000)?.estimated ?? null;
    const rawState = RAW_STATES[state.slug];
    return {
      slug: state.slug,
      name: state.name,
      postal: (rawState?.postal ?? null) as string | null,
      metrics: {
        avgRateCentsPerKwh: state.avgRateCentsPerKwh,
        valueScore: state.valueScore,
        affordabilityIndex: state.affordabilityIndex,
        freshnessStatus: state.freshnessStatus,
        exampleBill1000kwh: example1000,
      },
      canonicalUrl: ensureAbsoluteUrl(`/knowledge/state/${state.slug}`),
      jsonUrl: ensureAbsoluteUrl(`/knowledge/state/${state.slug}.json`),
    };
  });
  const dcEntry = {
    slug: "district-of-columbia",
    name: "District of Columbia",
    postal: "DC" as string | null,
    metrics: {
      avgRateCentsPerKwh: null,
      valueScore: null,
      affordabilityIndex: null,
      freshnessStatus: "unavailable",
      exampleBill1000kwh: null,
    },
    canonicalUrl: ensureAbsoluteUrl("/knowledge/state/district-of-columbia"),
    jsonUrl: ensureAbsoluteUrl("/knowledge/state/district-of-columbia.json"),
  };
  const allCompareStates = [...statesFromNormalized, dcEntry].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const disclaimersBody: KnowledgeDisclaimers = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    disclaimers: [
      { id: "not-legal-advice", title: "Not legal advice", text: "Information on this site is for informational purposes only and is not legal advice." },
      { id: "not-financial-advice", title: "Not financial advice", text: "Information is provided for educational purposes and does not constitute financial advice." },
      { id: "data-limits", title: "Data limitations", text: "Rates and metrics are estimates derived from published datasets and may differ from your bill due to fees, taxes, plan structures, and timing." },
      { id: "offers-disabled", title: "Offers", text: "Offers shown on this site may be informational. Availability and terms may vary by location." },
      { id: "general-site", title: "General disclaimer", text: "Rates and metrics on this site are estimates. Data is for informational purposes only." },
      { id: "rankings", title: "Rankings disclaimer", text: "Rankings are derived from published data and may not reflect your actual bills." },
      { id: "methodology", title: "Methodology disclaimer", text: "Methodology descriptions are for transparency. Results depend on data sources and assumptions." },
    ],
    defaultSets: {
      dataHub: ["general-site"],
      knowledgePage: ["general-site"],
      statePage: ["general-site", "offers-disabled"],
      rankingsPage: ["rankings"],
      methodologyPage: ["methodology"],
    },
  };

  const offersConfigBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    offers: offersConfig,
  };
  await mkdir(path.join(KNOWLEDGE_ROOT, "policy"), { recursive: true });
  await writeJson("/knowledge/policy/offers-config.json", offersConfigBody);

  const defaultDisclaimerText =
    disclaimersBody.disclaimers.find((d) => d.id === offersConfig.defaultDisclaimerId)?.text ??
    "Offers shown on this site may be informational. Availability and terms may vary by location.";
  const placeholderOffer = {
    id: "electricity-plans-placeholder",
    title: "Compare electricity plans",
    description: "Find electricity plan options and compare rates.",
    url: null as string | null,
    enabled: false,
    partner: { name: "TBD", type: "affiliate" as const },
  };
  const offersIndexBody: KnowledgeOffersIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    enabled: offersEnabled,
    disclaimer: defaultDisclaimerText,
    states: allCompareStates.map((s) => ({
      slug: s.slug,
      name: s.name,
      offers: [placeholderOffer],
    })),
  };

  const compareStatesBody: KnowledgeCompareStates = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    fields: compareFields,
    states: allCompareStates,
  };

  const glossaryFields: Array<{
    id: string;
    label: string;
    unit: string;
    description: string;
    sourcePathExamples: string[];
    methodologies: Array<{ id: string; version: string }>;
    provenanceIds: string[];
  }> = [
    {
      id: "affordabilityIndex",
      label: "Affordability",
      unit: "index",
      description:
        "Index reflecting electricity cost burden relative to typical usage assumptions used by the site.",
      sourcePathExamples: ["data.derived.affordabilityIndex"],
      methodologies: [{ id: "epi", version: "1.0" }, { id: "freshness", version: "1.0" }],
      provenanceIds: ["poe-methodology-value-score", "poe-dataset-affordability-csv"],
    },
    {
      id: "avgRateCentsPerKwh",
      label: "Avg rate (¢/kWh)",
      unit: "centsPerKwh",
      description:
        "Average residential electricity price in cents per kilowatt-hour for the state.",
      sourcePathExamples: [
        "data.raw.avgRateCentsPerKwh",
        "data.facts[*].sourceField",
      ],
      methodologies: [],
      provenanceIds: ["eia-retail-sales-923", "poe-dataset-states-json"],
    },
    {
      id: "exampleBill1000kwh",
      label: "Example bill (1000 kWh)",
      unit: "usd",
      description:
        "Estimated monthly bill at 1000 kWh using the state's average rate, excluding certain fees/taxes depending on dataset limits.",
      sourcePathExamples: ["data.derived.exampleBills.bill1000kwh"],
      methodologies: [{ id: "epi", version: "1.0" }],
      provenanceIds: ["poe-methodology-epi", "poe-dataset-states-json"],
    },
    {
      id: "freshnessStatus",
      label: "Freshness",
      unit: "status",
      description:
        "Indicates how recent the underlying dataset is relative to build time.",
      sourcePathExamples: ["meta.freshness.status", "data.derived.freshnessStatus"],
      methodologies: [{ id: "freshness", version: "1.0" }],
      provenanceIds: ["poe-methodology-freshness", "eia-retail-sales-923"],
    },
    {
      id: "qualityScore",
      label: "Quality",
      unit: "score",
      description:
        "Rule-based quality score (0–100) reflecting freshness and metadata completeness.",
      sourcePathExamples: ["meta.qualityScore"],
      methodologies: [],
      provenanceIds: ["poe-methodology-freshness"],
    },
    {
      id: "valueScore",
      label: "Value score",
      unit: "index",
      description:
        "Composite score used to compare states based on price and stability. See methodology for calculation details.",
      sourcePathExamples: ["data.derived.valueScore"],
      methodologies: [{ id: "value-score", version: "1.0" }],
      provenanceIds: ["poe-methodology-value-score", "poe-dataset-value-ranking-csv"],
    },
  ].sort((a, b) => a.id.localeCompare(b.id));

  const glossaryBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    fields: glossaryFields,
  };

  const docsEntryPoints: Array<{ id: string; url: string; description: string }> = [
    { id: "search-index", url: "/knowledge/search-index.json", description: "Primary discovery surface." },
    { id: "entity-index", url: "/knowledge/entity-index.json", description: "Entity catalog with temporal context." },
    { id: "schema-map", url: "/knowledge/schema-map.json", description: "Entity types and field definitions." },
    { id: "provenance", url: "/knowledge/provenance.json", description: "Data source catalog." },
    { id: "methodology-index", url: "/knowledge/methodology/index.json", description: "Methodology definitions." },
    { id: "rankings-index", url: "/knowledge/rankings/index.json", description: "Rankings index." },
    { id: "compare-states", url: "/knowledge/compare/states.json", description: "State comparison metrics." },
    { id: "bundles", url: "/knowledge/bundles/index.json", description: "Offline ingestion bundles." },
  ].sort((a, b) => a.id.localeCompare(b.id));

  const docsBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    canonicalUrl: "/knowledge/docs",
    contractUrl: "/knowledge/contract.json",
    indexUrl: "/knowledge/index.json",
    entryPoints: docsEntryPoints,
    notes: [
      "All knowledge artifacts are build-generated and deterministic.",
      "Use search-index for discovery; use entity pages for details.",
    ],
  };

  const starterPackSteps: Array<{ step: number; id: string; url: string; why: string }> = [
    { step: 1, id: "search-index", url: "/knowledge/search-index.json", why: "Primary discovery surface with tokens, excerpts, quality, freshness." },
    { step: 2, id: "contract", url: "/knowledge/contract.json", why: "Schema contract and required fields." },
    { step: 3, id: "schema-map", url: "/knowledge/schema-map.json", why: "Field grouping and entity patterns." },
    { step: 4, id: "provenance", url: "/knowledge/provenance.json", why: "Source metadata for citations." },
    { step: 5, id: "methodology-index", url: "/knowledge/methodology/index.json", why: "Methodology versions and relationships." },
    { step: 6, id: "rankings-index", url: "/knowledge/rankings/index.json", why: "Rankings catalog and methodology references." },
    { step: 7, id: "compare-states", url: "/knowledge/compare/states.json", why: "Compact state comparison matrix." },
    { step: 8, id: "bundles", url: "/knowledge/bundles/index.json", why: "Offline ingestion manifests." },
  ];
  const starterPackBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    recommendedOrder: starterPackSteps,
    notes: [
      "Prefer canonical human pages for display; use JSON pages for structured ingestion.",
      "Use bundles for batch download when needed.",
    ],
  };

  const indexBody: KnowledgeIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    contractVersion,
    registryHash,
    integritySignature,
    totalPages: pageWrites.length + 6,
    contractUrl: "/knowledge/contract.json",
    changelogUrl: "/knowledge/changelog.json",
    provenanceUrl: "/knowledge/provenance.json",
    schemaMapUrl: "/knowledge/schema-map.json",
    entityIndexUrl: "/knowledge/entity-index.json",
    methodologyIndexUrl: "/knowledge/methodology/index.json",
    compareUrl: "/knowledge/compare/states.json",
    rankingsIndexUrl: "/knowledge/rankings/index.json",
    labelsUrl: "/knowledge/labels/en.json",
    glossaryFieldsUrl: "/knowledge/glossary/fields.json",
    docsUrl: "/knowledge/docs",
    docsJsonUrl: "/knowledge/docs/index.json",
    ingestStarterPackUrl: "/knowledge/ingest/starter-pack.json",
    publicEndpointsUrl: "/knowledge/public-endpoints.json",
    deprecationsUrl: "/knowledge/policy/deprecations.json",
    integrityManifestUrl: "/knowledge/integrity/manifest.json",
    capabilitiesUrl: "/knowledge/capabilities.json",
    releaseUrl: "/knowledge/release.json",
    fingerprintUrl: "/knowledge/fingerprint.json",
    offersIndexUrl: "/knowledge/offers/index.json",
    offersConfigUrl: "/knowledge/policy/offers-config.json",
    disclaimersUrl: "/knowledge/policy/disclaimers.json",
    bundlesIndexUrl: "/knowledge/bundles/index.json",
    historyBundlesIndexUrl: "/knowledge/history/bundles/index.json",
    buildProfileUrl: "/knowledge/build-profile.json",
    leaderboardsUrl: "/knowledge/leaderboards/states.json",
    relatedIndexUrl: "/knowledge/related/index.json",
    items: [
      ...registryNational,
      ...registryStates.sort((a, b) => a.slug.localeCompare(b.slug)),
      ...registryMethodology,
      ...registryRankings,
      ...registryVertical,
    ],
  };

  for (const write of pageWrites) {
    const isNational = write.page.meta.id === "knowledge:national";
    (write.page.meta as KnowledgeMeta & { integrity?: unknown }).integrity = {
      contentHash: write.page.meta.contentHash,
      ...(isNational ? { registryHash } : {}),
      integrityAlgorithm: "sha256",
      signedAtBuild: generatedAt,
    };
  }

  const pageMetaById = new Map(
    pageWrites.map((write) => [write.page.meta.id, write.page.meta]),
  );
  const schemaMapBody: KnowledgeSchemaMap = {
    schemaVersion: "1.0",
    generatedAt,
    entities: [...new Set(indexBody.items.map((item) => item.type))]
      .sort((a, b) => getSchemaEntityOrder(a) - getSchemaEntityOrder(b))
      .map((type) => {
        const sample = pageWrites.find((write) => write.page.meta.type === type);
        if (!sample) {
          throw new Error(`Missing sample page for schema map type: ${type}`);
        }
        const metaFields = Object.keys(sample.page.meta).sort((a, b) =>
          a.localeCompare(b),
        );
        const data = sample.page.data as Record<string, unknown>;
        const topLevelFields = Object.keys(data).sort((a, b) => a.localeCompare(b));
        let dataFields: string[] = topLevelFields;
        let fieldGroups: { raw: string[]; derived: string[] } | undefined;
        if (type === "state" && data.raw && data.derived) {
          const raw = data.raw as Record<string, unknown>;
          const derived = data.derived as Record<string, unknown>;
          const rawKeys = Object.keys(raw).sort((a, b) => a.localeCompare(b));
          const derivedKeys = Object.keys(derived).sort((a, b) => a.localeCompare(b));
          fieldGroups = { raw: rawKeys, derived: derivedKeys };
          dataFields = [
            ...rawKeys.map((k) => `raw.${k}`),
            ...derivedKeys.map((k) => `derived.${k}`),
          ].sort((a, b) => a.localeCompare(b));
        } else if (type === "national" && data.raw && data.derived) {
          const raw = data.raw as Record<string, unknown>;
          const derived = data.derived as Record<string, unknown>;
          const rawKeys = Object.keys(raw).sort((a, b) => a.localeCompare(b));
          const derivedKeys = Object.keys(derived).sort((a, b) => a.localeCompare(b));
          fieldGroups = { raw: rawKeys, derived: derivedKeys };
          dataFields = [
            ...rawKeys.map((k) => `raw.${k}`),
            ...derivedKeys.map((k) => `derived.${k}`),
          ].sort((a, b) => a.localeCompare(b));
        }
        const filterableFields =
          type === "state"
            ? [
                "derived.affordabilityIndex",
                "raw.avgRateCentsPerKwh",
                "derived.freshnessStatus",
                "derived.valueScore",
              ]
            : [];
        const sortableFields =
          type === "state"
            ? ["derived.affordabilityIndex", "raw.avgRateCentsPerKwh", "derived.valueScore"]
            : [];
        return {
          type,
          jsonPattern: getJsonPatternForType(type),
          metaFields,
          dataFields,
          filterableFields,
          sortableFields,
          fieldGroups,
        };
      }),
  };
  schemaMapBody.entities.push({
    type: "compare",
    jsonPattern: "/knowledge/compare/states.json",
    metaFields: ["generatedAt", "schemaVersion", "sourceVersion"].sort((a, b) =>
      a.localeCompare(b),
    ),
    dataFields: ["fields", "states", ...compareFields].sort((a, b) => a.localeCompare(b)),
    filterableFields: compareFields,
    sortableFields: compareFields,
    fieldGroups: {
      raw: [],
      derived: compareFields,
    },
  });

  const metaFieldsExcluded = new Set(["updatedAt", "contentHash"]);
  const regressionFieldFingerprints: Record<string, string> = {};
  for (const entity of schemaMapBody.entities) {
    const dataFields = [...entity.dataFields].sort((a, b) => a.localeCompare(b));
    const metaStable = entity.metaFields
      .filter((f) => !metaFieldsExcluded.has(f))
      .sort((a, b) => a.localeCompare(b));
    const allFields = [...dataFields, ...metaStable].sort((a, b) => a.localeCompare(b));
    regressionFieldFingerprints[entity.type] = sha256(allFields.join("\n"));
  }

  const entityTypeCounts = {
    national: registryNational.length,
    state: registryStates.length,
    methodology: registryMethodology.length,
    rankings: registryRankings.length,
    vertical: registryVertical.length,
  };

  const regressionBody: KnowledgeRegression = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    entityTypeCounts,
    fieldFingerprints: regressionFieldFingerprints,
  };

  const entityIndexBody: KnowledgeEntityIndex = {
    schemaVersion: "1.0",
    generatedAt,
    entities: indexBody.items
      .map((item) => {
        const meta = pageMetaById.get(item.id);
        if (!meta) {
          throw new Error(`Missing page meta for entity index item: ${item.id}`);
        }
        return {
          id: item.id,
          type: item.type,
          slug: item.slug,
          title: item.title,
          jsonUrl: item.jsonUrl,
          canonicalUrl: item.canonicalUrl,
          semanticCluster: meta.llmHints.semanticCluster,
          temporalContext: meta.temporalContext,
        };
      })
      .sort(
        (a, b) =>
          a.type.localeCompare(b.type) ||
          a.slug.localeCompare(b.slug) ||
          a.id.localeCompare(b.id),
      ),
  };

  const rateRankedStates = stableRankedStates(normalizedStates, (s) => s.avgRateCentsPerKwh ?? 0, "desc");
  const rateRankBySlug = new Map<string, number>();
  rateRankedStates.forEach((r, i) => rateRankBySlug.set(r.slug, i + 1));

  const nationalInsights = buildNationalInsights(nationalData.derived);
  const searchInsights: KnowledgeSearchInsight[] = [];
  nationalInsights.forEach((ins, i) => {
    searchInsights.push({ type: "insight", subject: "national", id: `insights:national:${i}`, statement: ins.statement });
  });

  const baseEntities = indexBody.items
    .map((item) => {
      const meta = pageMetaById.get(item.id);
      const f = meta?.freshness;
      const status = f?.status ?? "unknown";
      const excerpt = (meta as { excerpt?: string } | undefined)?.excerpt ?? "";
      const qualityScore = (item as { qualityScore?: number }).qualityScore ?? (meta as { qualityScore?: number } | undefined)?.qualityScore ?? 0;
      const excerptTokens = excerpt
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1);
      const baseTokens = [
        item.slug,
        ...item.title.toLowerCase().split(/\s+/),
        ...excerptTokens,
        `quality-${qualityScore}`,
        status,
      ];
      const priceTrendKeywords =
        item.slug === "price-trend"
          ? ["electricity", "trend", "electricity-price-growth", "electricity-inflation"]
          : item.slug === "electricity-inflation-1y" || item.slug === "electricity-inflation-5y"
            ? [
                "electricity",
                "inflation",
                "electricity",
                "price",
                "history",
                "electricity",
                "inflation",
                "by",
                "state",
                "electricity",
                "price",
                "increase",
                "by",
                "state",
                "states",
                "with",
                "highest",
                "electricity",
                "price",
                "increase",
                "electricity",
                "inflation",
                "ranking",
                "electricity",
                "rate",
                "history",
              ]
            : item.slug === "electricity-affordability" || item.slug === "most-expensive-electricity"
              ? [
                  "most",
                  "expensive",
                  "electricity",
                  "states",
                  "cheapest",
                  "electricity",
                  "states",
                  "electricity",
                  "affordability",
                  "by",
                  "state",
                  "states",
                  "with",
                  "cheapest",
                  "electricity",
                ]
              : [];
      const comparisonKeywords =
        item.type === "state"
          ? ["state", "electricity", "vs", "national", "average", "electricity", "cost", "comparison"]
          : [];
      const tokens = [...baseTokens, ...priceTrendKeywords, ...comparisonKeywords].filter(Boolean);
      return {
        id: item.id,
        type: item.type,
        slug: item.slug,
        title: item.title,
        canonicalUrl: item.canonicalUrl,
        excerpt,
        qualityScore,
        freshnessStatus: status,
        ...(f?.ageDays !== undefined && { ageDays: f.ageDays }),
        tokens,
      };
    });

  const regionKeywordsById: Record<string, string[]> = {
    northeast: ["northeast", "electricity", "prices", "northeast electricity prices"],
    midwest: ["midwest", "electricity", "rates", "midwest electricity rates"],
    south: ["south", "electricity", "cost", "south electricity cost"],
    west: ["west", "electricity", "price", "ranking", "west electricity price ranking"],
    unknown: ["unknown", "region", "mapping", "incomplete"],
  };
  const regionEntities = regionDefs.map((r) => {
    const data = regionDataById.get(r.id);
    const excerpt = data?.excerpt ?? (r.id === "unknown" ? "States with incomplete or unknown region mapping." : `${r.name} U.S. states electricity metrics.`);
    const kw = regionKeywordsById[r.id] ?? regionKeywordsById.unknown;
    const excerptTokens = excerpt.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((t) => t.length > 1);
    const tokens = [...new Set([r.id, r.name.toLowerCase(), ...kw, ...excerptTokens, "quality-85", "unknown"])];
    return {
      id: `knowledge:region:${r.id}`,
      type: "region",
      slug: r.id,
      title: `${r.name} Electricity Rates`,
      canonicalUrl: ensureAbsoluteUrl(`/knowledge/regions/${r.id}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "unknown" as const,
      tokens,
    };
  });

  const electricityCostLandingEntity = {
    id: "electricity-cost:index",
    type: "landing" as const,
    slug: "electricity-cost",
    title: "Electricity Cost by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-cost"),
    excerpt: "Average electricity cost and estimated monthly bills by state. Compare residential rates and 900 kWh cost estimates.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "cost",
      "state",
      "average",
      "electricity",
      "price",
      "electricity",
      "cost",
      "in",
      "state",
      "average",
      "electricity",
      "bill",
      "quality-85",
      "aging",
    ],
  };

  const electricityCostStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity cost in ${name}. Average rate, estimated monthly and annual costs for 900 kWh.`;
    const tokens = [
      "electricity",
      "cost",
      "in",
      name.toLowerCase(),
      "average",
      "electricity",
      "price",
      "in",
      name.toLowerCase(),
      "average",
      "electricity",
      "bill",
      "in",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `electricity-cost:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Cost in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/electricity-cost/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const averageElectricityBillLandingEntity = {
    id: "average-electricity-bill:index",
    type: "landing" as const,
    slug: "average-electricity-bill",
    title: "Average Electricity Bill by State",
    canonicalUrl: ensureAbsoluteUrl("/average-electricity-bill"),
    excerpt: "Average electricity bill estimates by state. Estimated monthly and annual bills based on 900 kWh usage.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "average",
      "electricity",
      "bill",
      "state",
      "monthly",
      "electricity",
      "bill",
      "by",
      "state",
      "electricity",
      "cost",
      "per",
      "month",
      "quality-85",
      "aging",
    ],
  };

  const averageElectricityBillStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Average electricity bill in ${name}. Estimated monthly and annual bills for 900 kWh.`;
    const tokens = [
      "average",
      "electricity",
      "bill",
      name.toLowerCase(),
      "monthly",
      "electricity",
      "bill",
      name.toLowerCase(),
      "electricity",
      "cost",
      "per",
      "month",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `average-electricity-bill:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Average Electricity Bill in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/average-electricity-bill/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const movingToElectricityCostLandingEntity = {
    id: "moving-to-electricity-cost:index",
    type: "landing" as const,
    slug: "moving-to-electricity-cost",
    title: "Electricity Costs When Moving to a New State",
    canonicalUrl: ensureAbsoluteUrl("/moving-to-electricity-cost"),
    excerpt: "Electricity cost differences between states when relocating. Estimated monthly bills assume 900 kWh usage.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "cost",
      "moving",
      "relocating",
      "electricity",
      "bill",
      "moving",
      "state",
      "electricity",
      "cost",
      "moving",
      "to",
      "quality-85",
      "aging",
    ],
  };

  const movingToElectricityCostStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity cost when moving to ${name}. Estimated monthly bill for 900 kWh.`;
    const tokens = [
      "moving",
      "to",
      name.toLowerCase(),
      "electricity",
      "cost",
      "electricity",
      "bill",
      "after",
      "moving",
      "to",
      name.toLowerCase(),
      "electricity",
      "prices",
      "when",
      "relocating",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `moving-to-electricity-cost:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Cost When Moving to ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/moving-to-electricity-cost/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const electricityCostCalculatorLandingEntity = {
    id: "electricity-cost-calculator:index",
    type: "landing" as const,
    slug: "electricity-cost-calculator",
    title: "Electricity Cost Calculator by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-cost-calculator"),
    excerpt: "Estimate electricity costs by state. See low (500 kWh), typical (900 kWh), and high (1500 kWh) usage scenarios.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "cost",
      "calculator",
      "state",
      "electricity",
      "bill",
      "calculator",
      "monthly",
      "electricity",
      "cost",
      "quality-85",
      "aging",
    ],
  };

  const howMuch500KwhEntity = {
    id: "how-much-does-500-kwh-cost:index",
    type: "landing" as const,
    slug: "how-much-does-500-kwh-cost",
    title: "How Much Does 500 kWh Cost?",
    canonicalUrl: ensureAbsoluteUrl("/how-much-does-500-kwh-cost"),
    excerpt: "Estimate electricity cost for 500 kWh. National average and state-by-state estimates.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "how",
      "much",
      "does",
      "500",
      "kwh",
      "cost",
      "500",
      "kwh",
      "electricity",
      "cost",
      "electricity",
      "bill",
      "500",
      "kwh",
      "quality-85",
      "aging",
    ],
  };

  const howMuch1000KwhEntity = {
    id: "how-much-does-1000-kwh-cost:index",
    type: "landing" as const,
    slug: "how-much-does-1000-kwh-cost",
    title: "How Much Does 1000 kWh Cost?",
    canonicalUrl: ensureAbsoluteUrl("/how-much-does-1000-kwh-cost"),
    excerpt: "Estimate electricity cost for 1000 kWh. National average and state-by-state estimates.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "how",
      "much",
      "does",
      "1000",
      "kwh",
      "cost",
      "1000",
      "kwh",
      "electricity",
      "cost",
      "by",
      "state",
      "electricity",
      "bill",
      "quality-85",
      "aging",
    ],
  };

  const howMuch2000KwhEntity = {
    id: "how-much-does-2000-kwh-cost:index",
    type: "landing" as const,
    slug: "how-much-does-2000-kwh-cost",
    title: "How Much Does 2000 kWh Cost?",
    canonicalUrl: ensureAbsoluteUrl("/how-much-does-2000-kwh-cost"),
    excerpt: "Estimate electricity cost for 2000 kWh. National average and state-by-state estimates.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "how",
      "much",
      "does",
      "2000",
      "kwh",
      "cost",
      "2000",
      "kwh",
      "electricity",
      "bill",
      "electricity",
      "cost",
      "quality-85",
      "aging",
    ],
  };

  const solarSavingsLandingEntity = {
    id: "solar-savings:index",
    type: "landing" as const,
    slug: "solar-savings",
    title: "Solar Savings Potential by State",
    canonicalUrl: ensureAbsoluteUrl("/solar-savings"),
    excerpt: "State-level electricity price context relevant to solar savings potential. Learn how grid electricity prices affect the value of solar.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "solar",
      "savings",
      "by",
      "state",
      "solar",
      "savings",
      "potential",
      "solar",
      "savings",
      "texas",
      "solar",
      "savings",
      "california",
      "electricity",
      "prices",
      "and",
      "solar",
      "savings",
      "solar",
      "electricity",
      "value",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const electricityProvidersLandingEntity = {
    id: "electricity-providers:index",
    type: "landing" as const,
    slug: "electricity-providers",
    title: "Electricity Providers by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-providers"),
    excerpt: "State-level electricity provider context and market structure. Learn how provider choice and utility structure vary by state.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "providers",
      "by",
      "state",
      "electricity",
      "providers",
      "texas",
      "electricity",
      "providers",
      "california",
      "how",
      "electricity",
      "providers",
      "work",
      "electricity",
      "choice",
      "by",
      "state",
      "electricity",
      "provider",
      "options",
      "quality-85",
      "aging",
    ],
  };

  const compareElectricityPlansHubEntity = {
    id: "compare-electricity-plans:index",
    type: "landing" as const,
    slug: "compare-electricity-plans",
    title: "Compare Electricity Plans",
    canonicalUrl: ensureAbsoluteUrl("/compare-electricity-plans"),
    excerpt: "Educational plan-comparison context. How to think about comparing electricity plans, why state market structure matters, and how electricity price data supports plan research.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "compare",
      "electricity",
      "plans",
      "how",
      "to",
      "compare",
      "electricity",
      "plans",
      "electricity",
      "plan",
      "comparison",
      "electricity",
      "choice",
      "by",
      "state",
      "electricity",
      "plans",
      "and",
      "providers",
      "quality-85",
      "aging",
    ],
  };

  const compareElectricityPlansByStateEntity = {
    id: "compare-electricity-plans:by-state",
    type: "landing" as const,
    slug: "by-state",
    title: "Compare Electricity Plans by State",
    canonicalUrl: ensureAbsoluteUrl("/compare-electricity-plans/by-state"),
    excerpt: "Plan-comparison behavior differs by state. Use state electricity price, affordability, provider, and market-structure context to inform plan research.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "compare",
      "electricity",
      "plans",
      "by",
      "state",
      "electricity",
      "plan",
      "comparison",
      "by",
      "state",
      "electricity",
      "choice",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const howToCompareElectricityPlansEntity = {
    id: "compare-electricity-plans:how-to",
    type: "landing" as const,
    slug: "how-to-compare-electricity-plans",
    title: "How to Compare Electricity Plans",
    canonicalUrl: ensureAbsoluteUrl("/compare-electricity-plans/how-to-compare-electricity-plans"),
    excerpt: "Practical guide: what to check when comparing electricity plans. Contract length, rate type, bill predictability, cancellation terms, and state market structure.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "how",
      "to",
      "compare",
      "electricity",
      "plans",
      "compare",
      "electricity",
      "plans",
      "electricity",
      "plan",
      "comparison",
      "contract",
      "rate",
      "type",
      "quality-85",
      "aging",
    ],
  };

  const electricityShoppingHubEntity = {
    id: "electricity-shopping:index",
    type: "landing" as const,
    slug: "electricity-shopping",
    title: "Electricity Shopping by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-shopping"),
    excerpt: "Educational electricity-shopping context. What electricity shopping means, why it differs by state, and how price and provider data support informed decisions.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "shopping",
      "electricity",
      "shopping",
      "by",
      "state",
      "shop",
      "for",
      "electricity",
      "electricity",
      "choice",
      "by",
      "state",
      "understanding",
      "electricity",
      "shopping",
      "quality-85",
      "aging",
    ],
  };

  const electricityShoppingByStateEntity = {
    id: "electricity-shopping:by-state",
    type: "landing" as const,
    slug: "by-state",
    title: "Electricity Shopping by State Guide",
    canonicalUrl: ensureAbsoluteUrl("/electricity-shopping/by-state"),
    excerpt: "Electricity shopping conditions vary by state. Use provider, price, affordability, and market-structure context to inform decisions.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "shopping",
      "by",
      "state",
      "electricity",
      "shopping",
      "guide",
      "shop",
      "for",
      "electricity",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const howElectricityShoppingWorksEntity = {
    id: "electricity-shopping:how-it-works",
    type: "landing" as const,
    slug: "how-electricity-shopping-works",
    title: "How Electricity Shopping Works",
    canonicalUrl: ensureAbsoluteUrl("/electricity-shopping/how-electricity-shopping-works"),
    excerpt: "Plain-language explainer: what to understand before comparing electricity options. Retail choice, provider structure, price context, and plan structure.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "how",
      "electricity",
      "shopping",
      "works",
      "electricity",
      "shopping",
      "understanding",
      "electricity",
      "shopping",
      "electricity",
      "choice",
      "quality-85",
      "aging",
    ],
  };

  const shopElectricityHubEntity = {
    id: "shop-electricity:index",
    type: "landing" as const,
    slug: "shop-electricity",
    title: "Shop for Electricity by State",
    canonicalUrl: ensureAbsoluteUrl("/shop-electricity"),
    excerpt: "State-by-state electricity shopping context. Understand your state's price, provider, and market structure before comparing options. Educational context, not live shopping.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "shop",
      "electricity",
      "by",
      "state",
      "shop",
      "for",
      "electricity",
      "electricity",
      "shopping",
      "by",
      "state",
      "how",
      "to",
      "shop",
      "for",
      "electricity",
      "compare",
      "electricity",
      "options",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const businessElectricityOptionsHubEntity = {
    id: "business-electricity-options:index",
    type: "landing" as const,
    slug: "business-electricity-options",
    title: "Business Electricity Options by State",
    canonicalUrl: ensureAbsoluteUrl("/business-electricity-options"),
    excerpt: "State-by-state business electricity context. Understand price, market structure, and what to evaluate when comparing electricity options. Educational context, not live quotes or procurement.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "business",
      "electricity",
      "options",
      "by",
      "state",
      "business",
      "electricity",
      "by",
      "state",
      "business",
      "electricity",
      "options",
      "texas",
      "business",
      "electricity",
      "options",
      "california",
      "commercial",
      "electricity",
      "choices",
      "by",
      "state",
      "how",
      "businesses",
      "compare",
      "electricity",
      "options",
      "quality-85",
      "aging",
    ],
  };

  const businessElectricityOptionsStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Business electricity options in ${name}. State-level business electricity context, price, and market structure.`;
    const tokens = [
      "business",
      "electricity",
      "options",
      "in",
      name.toLowerCase(),
      "business",
      "electricity",
      name.toLowerCase(),
      "commercial",
      "electricity",
      name.toLowerCase(),
      "electricity",
      "options",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `business-electricity-options:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Business Electricity Options in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/business-electricity-options/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const shopElectricityStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Shop for electricity in ${name}. State-level electricity shopping context, price, provider, and market structure.`;
    const tokens = [
      "shop",
      "electricity",
      "in",
      name.toLowerCase(),
      "shop",
      "for",
      "electricity",
      name.toLowerCase(),
      "electricity",
      "shopping",
      name.toLowerCase(),
      "electricity",
      "options",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `shop-electricity:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Shop for Electricity in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/shop-electricity/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const siteMaintenanceHubEntity = {
    id: "site-maintenance:index",
    type: "landing" as const,
    slug: "site-maintenance",
    title: "Site Maintenance and Updates",
    canonicalUrl: ensureAbsoluteUrl("/site-maintenance"),
    excerpt: "Practical maintenance framework for a structured electricity analysis site. Data refresh, quality checks, and content expansion.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "site",
      "maintenance",
      "updates",
      "electricity",
      "data",
      "refresh",
      "quality",
      "checks",
      "content",
      "expansion",
      "maintaining",
      "data-driven",
      "websites",
      "electricity",
      "analysis",
      "site",
      "quality-85",
      "aging",
    ],
  };

  const siteMaintenanceDataRefreshEntity = {
    id: "site-maintenance:data-refresh",
    type: "landing" as const,
    slug: "data-refresh",
    title: "Refreshing Electricity Data",
    canonicalUrl: ensureAbsoluteUrl("/site-maintenance/data-refresh"),
    excerpt: "How the site's data-driven pages depend on updating build-time datasets. State pages, rankings, and datasets are built from structured data.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "data",
      "refresh",
      "refreshing",
      "electricity",
      "data",
      "build-time",
      "datasets",
      "state",
      "pages",
      "rankings",
      "quality-85",
      "aging",
    ],
  };

  const siteMaintenanceQualityChecksEntity = {
    id: "site-maintenance:quality-checks",
    type: "landing" as const,
    slug: "quality-checks",
    title: "Electricity Site Quality Checks",
    canonicalUrl: ensureAbsoluteUrl("/site-maintenance/quality-checks"),
    excerpt: "Types of checks that help keep a structured electricity analysis site reliable: build checks, verification, sitemap, and discovery checks.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "site",
      "quality",
      "checks",
      "verification",
      "sitemap",
      "discovery",
      "checks",
      "quality-85",
      "aging",
    ],
  };

  const futureExpansionHubEntity = {
    id: "future-expansion:index",
    type: "landing" as const,
    slug: "future-expansion",
    title: "Future Expansion Framework",
    canonicalUrl: ensureAbsoluteUrl("/future-expansion"),
    excerpt: "How the site can scale over time while preserving structure, clarity, and data integrity. Programmatic scaling, topic expansion, and data and discovery expansion.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "future",
      "expansion",
      "framework",
      "scaling",
      "structured",
      "websites",
      "electricity",
      "analysis",
      "sites",
      "quality-85",
      "aging",
    ],
  };

  const futureExpansionProgrammaticEntity = {
    id: "future-expansion:programmatic-scaling",
    type: "landing" as const,
    slug: "programmatic-scaling",
    title: "Programmatic Scaling Framework",
    canonicalUrl: ensureAbsoluteUrl("/future-expansion/programmatic-scaling"),
    excerpt: "How to safely expand programmatic page families: state-based, comparison, and fixed-usage families.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "programmatic",
      "scaling",
      "framework",
      "scaling",
      "structured",
      "websites",
      "electricity",
      "quality-85",
      "aging",
    ],
  };

  const futureExpansionTopicEntity = {
    id: "future-expansion:topic-expansion",
    type: "landing" as const,
    slug: "topic-expansion",
    title: "Topic Expansion Framework",
    canonicalUrl: ensureAbsoluteUrl("/future-expansion/topic-expansion"),
    excerpt: "How new electricity topic clusters should be added with hub pages, supporting pages, and internal links.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "topic",
      "expansion",
      "framework",
      "electricity",
      "topics",
      "clusters",
      "quality-85",
      "aging",
    ],
  };

  const futureExpansionDataDiscoveryEntity = {
    id: "future-expansion:data-and-discovery-expansion",
    type: "landing" as const,
    slug: "data-and-discovery-expansion",
    title: "Data and Discovery Expansion Framework",
    canonicalUrl: ensureAbsoluteUrl("/future-expansion/data-and-discovery-expansion"),
    excerpt: "How data assets, discovery systems, and methodology should evolve as the site expands.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "data",
      "discovery",
      "expansion",
      "framework",
      "electricity",
      "quality-85",
      "aging",
    ],
  };

  const operatingPlaybookHubEntity = {
    id: "operating-playbook:index",
    type: "landing" as const,
    slug: "operating-playbook",
    title: "Operating Playbook for PriceOfElectricity.com",
    canonicalUrl: ensureAbsoluteUrl("/operating-playbook"),
    excerpt: "Operational documentation for maintaining and expanding the site: data updates, content expansion, and quality verification.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "operating",
      "playbook",
      "maintaining",
      "data-driven",
      "websites",
      "electricity",
      "data",
      "updates",
      "site",
      "verification",
      "systems",
      "expanding",
      "electricity",
      "analysis",
      "sites",
      "quality-85",
      "aging",
    ],
  };

  const operatingPlaybookDataUpdatesEntity = {
    id: "operating-playbook:data-updates",
    type: "landing" as const,
    slug: "data-updates",
    title: "Updating Electricity Data",
    canonicalUrl: ensureAbsoluteUrl("/operating-playbook/data-updates"),
    excerpt: "How electricity datasets power programmatic pages. Refreshing data, rebuilds, and derived outputs.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "data",
      "updates",
      "updating",
      "electricity",
      "data",
      "rebuild",
      "programmatic",
      "pages",
      "quality-85",
      "aging",
    ],
  };

  const operatingPlaybookExpandingEntity = {
    id: "operating-playbook:expanding-the-site",
    type: "landing" as const,
    slug: "expanding-the-site",
    title: "Expanding the Electricity Analysis Site",
    canonicalUrl: ensureAbsoluteUrl("/operating-playbook/expanding-the-site"),
    excerpt: "How the site expands: topic hubs, programmatic state pages, comparison pages, discovery layers.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "expanding",
      "electricity",
      "analysis",
      "site",
      "topic",
      "hubs",
      "programmatic",
      "pages",
      "discovery",
      "layers",
      "quality-85",
      "aging",
    ],
  };

  const operatingPlaybookQualityEntity = {
    id: "operating-playbook:quality-and-verification",
    type: "landing" as const,
    slug: "quality-and-verification",
    title: "Quality and Verification Systems",
    canonicalUrl: ensureAbsoluteUrl("/operating-playbook/quality-and-verification"),
    excerpt: "Build checks, knowledge verification scripts, sitemap and discovery validation, launch checklist reviews.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "quality",
      "verification",
      "systems",
      "site",
      "verification",
      "systems",
      "build",
      "checks",
      "knowledge",
      "verification",
      "quality-85",
      "aging",
    ],
  };

  const siteMaintenanceContentExpansionEntity = {
    id: "site-maintenance:content-expansion",
    type: "landing" as const,
    slug: "content-expansion",
    title: "Expanding Electricity Content Over Time",
    canonicalUrl: ensureAbsoluteUrl("/site-maintenance/content-expansion"),
    excerpt: "How the site's content model can grow while staying organized. Topic clusters, programmatic pages, and data assets fit into a consistent architecture.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "content",
      "expansion",
      "expanding",
      "content",
      "over",
      "time",
      "topic",
      "clusters",
      "programmatic",
      "pages",
      "quality-85",
      "aging",
    ],
  };

  const electricityCostCalculatorStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity cost calculator for ${name}. Estimate monthly bills at 500, 900, 1500 kWh.`;
    const tokens = [
      "electricity",
      "cost",
      "calculator",
      name.toLowerCase(),
      "electricity",
      "bill",
      "calculator",
      name.toLowerCase(),
      "how",
      "much",
      "does",
      "900",
      "kwh",
      "cost",
      "in",
      name.toLowerCase(),
      "monthly",
      "electricity",
      "cost",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `electricity-cost-calculator:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Cost Calculator for ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/electricity-cost-calculator/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const batteryRechargeCostLandingEntity = {
    id: "battery-recharge-cost:index",
    type: "landing" as const,
    slug: "battery-recharge-cost",
    title: "Battery Recharge Cost by State",
    canonicalUrl: ensureAbsoluteUrl("/battery-recharge-cost"),
    excerpt: "Estimate what it costs to recharge a home battery or portable battery using each state's electricity price.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "battery",
      "recharge",
      "cost",
      "state",
      "home",
      "battery",
      "recharge",
      "portable",
      "battery",
      "recharge",
      "cost",
      "recharge",
      "battery",
      "electricity",
      "quality-85",
      "aging",
    ],
  };

  const batteryRechargeCostStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Battery recharge cost in ${name}. Estimate cost to recharge 1 kWh, 5 kWh, and 13.5 kWh batteries.`;
    const tokens = [
      "battery",
      "recharge",
      "cost",
      name.toLowerCase(),
      "home",
      "battery",
      "recharge",
      "cost",
      name.toLowerCase(),
      "cost",
      "to",
      "recharge",
      "battery",
      "in",
      name.toLowerCase(),
      "portable",
      "battery",
      "recharge",
      name.toLowerCase(),
      "13.5",
      "kwh",
      "battery",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `battery-recharge-cost:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Battery Recharge Cost in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/battery-recharge-cost/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const generatorVsBatteryCostLandingEntity = {
    id: "generator-vs-battery-cost:index",
    type: "landing" as const,
    slug: "generator-vs-battery-cost",
    title: "Generator vs Battery Backup Cost by State",
    canonicalUrl: ensureAbsoluteUrl("/generator-vs-battery-cost"),
    excerpt: "Compare battery recharge cost with gasoline generator fuel cost by state. Operating cost only.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "generator",
      "vs",
      "battery",
      "cost",
      "state",
      "generator",
      "vs",
      "battery",
      "backup",
      "battery",
      "vs",
      "generator",
      "quality-85",
      "aging",
    ],
  };

  const generatorVsBatteryCostStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Generator vs battery cost in ${name}. Compare recharge cost with generator fuel cost.`;
    const tokens = [
      "generator",
      "vs",
      "battery",
      "cost",
      name.toLowerCase(),
      "generator",
      "vs",
      "battery",
      "backup",
      name.toLowerCase(),
      "battery",
      "vs",
      "generator",
      name.toLowerCase(),
      "cost",
      "run",
      "generator",
      "vs",
      "recharge",
      "battery",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `generator-vs-battery-cost:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Generator vs Battery Cost in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/generator-vs-battery-cost/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const aiEnergyDemandLandingEntity = {
    id: "ai-energy-demand:index",
    type: "landing" as const,
    slug: "ai-energy-demand",
    title: "AI Energy Demand and Electricity Prices",
    canonicalUrl: ensureAbsoluteUrl("/ai-energy-demand"),
    excerpt: "How AI infrastructure and data centers affect electricity demand and costs. Explore the electricity-cost implications of AI energy demand.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "ai",
      "energy",
      "demand",
      "ai",
      "electricity",
      "demand",
      "data",
      "centers",
      "electricity",
      "ai",
      "power",
      "consumption",
      "ai",
      "electricity",
      "costs",
      "data",
      "center",
      "electricity",
      "prices",
      "quality-85",
      "aging",
    ],
  };

  const aiEnergyDemandDataCentersEntity = {
    id: "ai-energy-demand:data-centers-electricity",
    type: "landing" as const,
    slug: "data-centers-electricity",
    title: "Data Centers and Electricity Demand",
    canonicalUrl: ensureAbsoluteUrl("/ai-energy-demand/data-centers-electricity"),
    excerpt: "Why data centers consume large amounts of electricity and why state-level electricity prices matter.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "data",
      "centers",
      "electricity",
      "data",
      "center",
      "electricity",
      "demand",
      "ai",
      "workloads",
      "power",
      "demand",
      "electricity",
      "cost",
      "grid",
      "capacity",
      "quality-85",
      "aging",
    ],
  };

  const aiEnergyDemandAIPowerEntity = {
    id: "ai-energy-demand:ai-power-consumption",
    type: "landing" as const,
    slug: "ai-power-consumption",
    title: "AI Power Consumption and Electricity Costs",
    canonicalUrl: ensureAbsoluteUrl("/ai-energy-demand/ai-power-consumption"),
    excerpt: "Why AI training and inference increase electricity usage and how electricity price differences by state matter.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "ai",
      "power",
      "consumption",
      "ai",
      "electricity",
      "costs",
      "ai",
      "training",
      "inference",
      "electricity",
      "usage",
      "electricity",
      "prices",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const aiEnergyDemandElectricityPricesEntity = {
    id: "ai-energy-demand:electricity-prices-and-ai",
    type: "landing" as const,
    slug: "electricity-prices-and-ai",
    title: "Electricity Prices and AI Infrastructure",
    canonicalUrl: ensureAbsoluteUrl("/ai-energy-demand/electricity-prices-and-ai"),
    excerpt: "How AI infrastructure expansion can matter for electricity prices and why electricity-cost analysis matters in that context.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "ai",
      "electricity",
      "prices",
      "electricity",
      "prices",
      "ai",
      "ai",
      "infrastructure",
      "electricity",
      "cost",
      "quality-85",
      "aging",
    ],
  };

  const aiEnergyDemandGridStrainEntity = {
    id: "ai-energy-demand:grid-strain-and-electricity-costs",
    type: "landing" as const,
    slug: "grid-strain-and-electricity-costs",
    title: "Grid Strain and Electricity Costs",
    canonicalUrl: ensureAbsoluteUrl("/ai-energy-demand/grid-strain-and-electricity-costs"),
    excerpt: "How rising demand, infrastructure constraints, and grid pressure can be part of electricity-cost discussions.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "grid",
      "strain",
      "electricity",
      "costs",
      "electricity",
      "demand",
      "grid",
      "strain",
      "ai",
      "power",
      "demand",
      "electricity",
      "prices",
      "quality-85",
      "aging",
    ],
  };

  const electricityInsightsLandingEntity = {
    id: "electricity-insights:index",
    type: "landing" as const,
    slug: "electricity-insights",
    title: "National Electricity Insights",
    canonicalUrl: ensureAbsoluteUrl("/electricity-insights"),
    excerpt: "National electricity price conditions, affordability, and inflation trends. Most expensive and cheapest states.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "national",
      "electricity",
      "insights",
      "electricity",
      "prices",
      "united",
      "states",
      "national",
      "electricity",
      "affordability",
      "electricity",
      "inflation",
      "united",
      "states",
      "most",
      "expensive",
      "electricity",
      "states",
      "cheapest",
      "electricity",
      "states",
      "quality-90",
      "aging",
    ],
  };

  const electricityTrendsLandingEntity = {
    id: "electricity-trends:index",
    type: "landing" as const,
    slug: "electricity-trends",
    title: "Electricity Price Trends in the United States",
    canonicalUrl: ensureAbsoluteUrl("/electricity-trends"),
    excerpt: "National electricity price trends, inflation, and affordability. Average US rate, estimated monthly bills, and state rankings.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "price",
      "trends",
      "us",
      "electricity",
      "inflation",
      "united",
      "states",
      "national",
      "electricity",
      "price",
      "electricity",
      "rates",
      "in",
      "the",
      "us",
      "quality-90",
      "aging",
    ],
  };

  const electricityAffordabilityLandingEntity = {
    id: "electricity-affordability:index",
    type: "landing" as const,
    slug: "electricity-affordability",
    title: "Electricity Affordability in the United States",
    canonicalUrl: ensureAbsoluteUrl("/electricity-affordability"),
    excerpt: "How electricity affordability varies by state. Cost burden, estimated bills, and affordability rankings.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "affordability",
      "electricity",
      "cost",
      "burden",
      "electricity",
      "affordability",
      "united",
      "states",
      "electricity",
      "affordability",
      "by",
      "state",
      "quality-90",
      "aging",
    ],
  };

  const electricityInflationLandingEntity = {
    id: "electricity-inflation:index",
    type: "landing" as const,
    slug: "electricity-inflation",
    title: "Electricity Inflation in the United States",
    canonicalUrl: ensureAbsoluteUrl("/electricity-inflation"),
    excerpt: "How electricity prices have increased historically and why they vary by state. National trends, state price growth, and inflation rankings.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "inflation",
      "electricity",
      "price",
      "increase",
      "electricity",
      "price",
      "growth",
      "electricity",
      "price",
      "history",
      "electricity",
      "inflation",
      "united",
      "states",
      "quality-90",
      "aging",
    ],
  };

  const electricityCostComparisonLandingEntity = {
    id: "electricity-cost-comparison:index",
    type: "landing" as const,
    slug: "electricity-cost-comparison",
    title: "Electricity Cost Comparisons by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-cost-comparison"),
    excerpt: "Compare electricity prices between U.S. states and explore how electricity rates and bills differ across the country.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "cost",
      "comparison",
      "electricity",
      "price",
      "comparison",
      "states",
      "compare",
      "electricity",
      "prices",
      "by",
      "state",
      "electricity",
      "rates",
      "bills",
      "california",
      "vs",
      "texas",
      "quality-85",
      "aging",
    ],
  };

  const electricityCostComparisonPairEntities = pairs
    .slice(0, 50)
    .map(({ pairSlug }) => {
      const data = pairDataBySlug.get(pairSlug);
      if (!data) return null;
      const nameA = data.stateA.name;
      const nameB = data.stateB.name;
      const excerpt = `Electricity cost ${nameA} vs ${nameB}. Compare rates and estimated monthly bills.`;
      const tokens = [
        "electricity",
        "cost",
        nameA.toLowerCase(),
        "vs",
        nameB.toLowerCase(),
        "electricity",
        "rates",
        "which",
        "state",
        "cheaper",
        pairSlug,
        "quality-85",
        "aging",
      ];
      return {
        id: `electricity-cost-comparison:pair:${pairSlug}`,
        type: "landing" as const,
        slug: pairSlug,
        title: `Electricity Cost: ${nameA} vs ${nameB}`,
        canonicalUrl: ensureAbsoluteUrl(`/electricity-cost-comparison/${pairSlug}`),
        excerpt,
        qualityScore: 85,
        freshnessStatus: "aging" as const,
        tokens,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const electricityPriceHistoryLandingEntity = {
    id: "electricity-price-history:index",
    type: "landing" as const,
    slug: "electricity-price-history",
    title: "Electricity Price History by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-price-history"),
    excerpt: "Electricity price trends and inflation by state. See 1-year and 5-year rate changes.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "price",
      "history",
      "state",
      "electricity",
      "inflation",
      "electricity",
      "price",
      "increase",
      "electricity",
      "rate",
      "history",
      "quality-85",
      "aging",
    ],
  };

  const electricityPriceHistoryStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity price history in ${name}. 1-year and 5-year rate trends.`;
    const tokens = [
      "electricity",
      "price",
      "history",
      name.toLowerCase(),
      "electricity",
      "inflation",
      name.toLowerCase(),
      "electricity",
      "price",
      "increase",
      name.toLowerCase(),
      "electricity",
      "rate",
      "history",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `electricity-price-history:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Price History in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/electricity-price-history/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const electricityAffordabilityStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity affordability in ${name}. Estimated bills and cost burden.`;
    const tokens = [
      "electricity",
      "affordability",
      name.toLowerCase(),
      "electricity",
      "cost",
      "burden",
      name.toLowerCase(),
      "electricity",
      "affordability",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `electricity-affordability:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Affordability in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/electricity-affordability/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const electricityCostOfLivingLandingEntity = {
    id: "electricity-cost-of-living:index",
    type: "landing" as const,
    slug: "electricity-cost-of-living",
    title: "Electricity Cost of Living by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-cost-of-living"),
    excerpt: "How electricity prices affect household cost of living. Compare electricity's role in cost of living across U.S. states.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "cost",
      "of",
      "living",
      "electricity",
      "cost",
      "of",
      "living",
      "by",
      "state",
      "electricity",
      "bills",
      "cost",
      "of",
      "living",
      "electricity",
      "household",
      "cost",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const electricityCostOfLivingStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity cost of living in ${name}. Estimated monthly bill at 900 kWh.`;
    const tokens = [
      "electricity",
      "cost",
      "of",
      "living",
      name.toLowerCase(),
      "electricity",
      "cost",
      "of",
      "living",
      name.toLowerCase(),
      "electricity",
      "bills",
      "household",
      "cost",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `electricity-cost-of-living:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Cost of Living in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/electricity-cost-of-living/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const dataCenterElectricityCostLandingEntity = {
    id: "data-center-electricity-cost:index",
    type: "landing" as const,
    slug: "data-center-electricity-cost",
    title: "Data Center Electricity Cost by State",
    canonicalUrl: ensureAbsoluteUrl("/data-center-electricity-cost"),
    excerpt: "Electricity price context relevant to data center infrastructure. How state electricity prices influence the economics of large computing and AI infrastructure.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "data",
      "center",
      "electricity",
      "cost",
      "data",
      "center",
      "electricity",
      "cost",
      "by",
      "state",
      "electricity",
      "cost",
      "data",
      "centers",
      "ai",
      "data",
      "center",
      "energy",
      "cost",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const dataCenterElectricityCostStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Data center electricity cost in ${name}. Electricity price context for data center infrastructure.`;
    const tokens = [
      "data",
      "center",
      "electricity",
      "cost",
      name.toLowerCase(),
      "electricity",
      "cost",
      "data",
      "centers",
      name.toLowerCase(),
      "data",
      "center",
      "energy",
      "cost",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `data-center-electricity-cost:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Data Center Electricity Cost in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/data-center-electricity-cost/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const solarVsGridElectricityCostLandingEntity = {
    id: "solar-vs-grid-electricity-cost:index",
    type: "landing" as const,
    slug: "solar-vs-grid-electricity-cost",
    title: "Solar vs Grid Electricity Cost by State",
    canonicalUrl: ensureAbsoluteUrl("/solar-vs-grid-electricity-cost"),
    excerpt: "Grid electricity price context relevant to solar economics. How state electricity prices influence the financial value of rooftop solar.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "solar",
      "vs",
      "grid",
      "electricity",
      "cost",
      "solar",
      "vs",
      "grid",
      "electricity",
      "cost",
      "solar",
      "electricity",
      "economics",
      "solar",
      "electricity",
      "value",
      "by",
      "state",
      "electricity",
      "price",
      "solar",
      "comparison",
      "solar",
      "economics",
      "electricity",
      "prices",
      "quality-85",
      "aging",
    ],
  };

  const solarVsGridElectricityCostStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Solar vs grid electricity cost in ${name}. Grid electricity price context for solar economics.`;
    const tokens = [
      "solar",
      "vs",
      "grid",
      "electricity",
      "cost",
      name.toLowerCase(),
      "solar",
      "electricity",
      "economics",
      name.toLowerCase(),
      "electricity",
      "price",
      "solar",
      "comparison",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `solar-vs-grid-electricity-cost:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Solar vs Grid Electricity Cost in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/solar-vs-grid-electricity-cost/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const batteryBackupElectricityCostLandingEntity = {
    id: "battery-backup-electricity-cost:index",
    type: "landing" as const,
    slug: "battery-backup-electricity-cost",
    title: "Battery Backup Electricity Cost by State",
    canonicalUrl: ensureAbsoluteUrl("/battery-backup-electricity-cost"),
    excerpt: "How much electricity costs to recharge home battery systems using grid electricity. Grid electricity cost for charging battery backup systems by state.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "battery",
      "backup",
      "electricity",
      "cost",
      "battery",
      "charging",
      "electricity",
      "cost",
      "home",
      "battery",
      "recharge",
      "cost",
      "battery",
      "backup",
      "electricity",
      "cost",
      "battery",
      "recharge",
      "electricity",
      "price",
      "home",
      "battery",
      "electricity",
      "cost",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const batteryBackupElectricityCostStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Battery backup electricity cost in ${name}. Grid electricity cost for charging home battery systems.`;
    const tokens = [
      "battery",
      "backup",
      "electricity",
      "cost",
      name.toLowerCase(),
      "battery",
      "recharge",
      "cost",
      name.toLowerCase(),
      "home",
      "battery",
      "electricity",
      "cost",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `battery-backup-electricity-cost:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Battery Backup Electricity Cost in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/battery-backup-electricity-cost/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const electricityPriceVolatilityLandingEntity = {
    id: "electricity-price-volatility:index",
    type: "landing" as const,
    slug: "electricity-price-volatility",
    title: "Electricity Price Volatility by State",
    canonicalUrl: ensureAbsoluteUrl("/electricity-price-volatility"),
    excerpt: "How stable or unstable electricity prices are across states. Which states have historically more volatile electricity prices and why volatility matters.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "price",
      "volatility",
      "electricity",
      "price",
      "volatility",
      "electricity",
      "price",
      "stability",
      "by",
      "state",
      "electricity",
      "price",
      "fluctuations",
      "electricity",
      "volatility",
      "texas",
      "electricity",
      "price",
      "volatility",
      "california",
      "quality-85",
      "aging",
    ],
  };

  const electricityPriceVolatilityStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity price volatility in ${name}. How stable or unstable electricity prices are historically.`;
    const tokens = [
      "electricity",
      "price",
      "volatility",
      name.toLowerCase(),
      "electricity",
      "price",
      "stability",
      name.toLowerCase(),
      "electricity",
      "price",
      "fluctuations",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `electricity-price-volatility:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Price Volatility in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/electricity-price-volatility/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const electricityInflationStateEntities = normalizedStates.map((s) => {
    const name = s.name ?? s.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const excerpt = `Electricity inflation in ${name}. How electricity prices have changed over time.`;
    const tokens = [
      "electricity",
      "inflation",
      name.toLowerCase(),
      "electricity",
      "price",
      "increase",
      name.toLowerCase(),
      "electricity",
      "price",
      "growth",
      name.toLowerCase(),
      "electricity",
      "price",
      "history",
      name.toLowerCase(),
      s.slug,
      "quality-85",
      "aging",
    ];
    return {
      id: `electricity-inflation:state:${s.slug}`,
      type: "landing" as const,
      slug: s.slug,
      title: `Electricity Inflation in ${name}`,
      canonicalUrl: ensureAbsoluteUrl(`/electricity-inflation/${s.slug}`),
      excerpt,
      qualityScore: 85,
      freshnessStatus: "aging" as const,
      tokens,
    };
  });

  const methodologyElectricityRatesEntity = {
    id: "methodology:electricity-rates",
    type: "landing" as const,
    slug: "electricity-rates",
    title: "How Electricity Rates Are Presented",
    canonicalUrl: ensureAbsoluteUrl("/methodology/electricity-rates"),
    excerpt: "How the site presents electricity rates in cents per kWh and converts to monthly bill estimates.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "methodology",
      "electricity",
      "rates",
      "cents",
      "per",
      "kwh",
      "monthly",
      "bill",
      "estimate",
      "how",
      "electricity",
      "rates",
      "presented",
      "quality-90",
      "aging",
    ],
  };

  const methodologyElectricityInflationEntity = {
    id: "methodology:electricity-inflation",
    type: "landing" as const,
    slug: "electricity-inflation",
    title: "How Electricity Inflation Is Calculated",
    canonicalUrl: ensureAbsoluteUrl("/methodology/electricity-inflation"),
    excerpt: "How the site computes 1-year and 5-year electricity price percentage changes.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "methodology",
      "electricity",
      "inflation",
      "how",
      "electricity",
      "inflation",
      "calculated",
      "1-year",
      "5-year",
      "percentage",
      "change",
      "quality-90",
      "aging",
    ],
  };

  const methodologyElectricityAffordabilityEntity = {
    id: "methodology:electricity-affordability",
    type: "landing" as const,
    slug: "electricity-affordability",
    title: "How Electricity Affordability Is Estimated",
    canonicalUrl: ensureAbsoluteUrl("/methodology/electricity-affordability"),
    excerpt: "How the site estimates electricity affordability using standard usage assumptions.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "methodology",
      "electricity",
      "affordability",
      "how",
      "electricity",
      "affordability",
      "estimated",
      "operating",
      "cost",
      "quality-90",
      "aging",
    ],
  };

  const methodologyBatteryRechargeCostEntity = {
    id: "methodology:battery-recharge-cost",
    type: "landing" as const,
    slug: "battery-recharge-cost",
    title: "How Battery Recharge Cost Is Estimated",
    canonicalUrl: ensureAbsoluteUrl("/methodology/battery-recharge-cost"),
    excerpt: "How the site estimates battery recharge cost from capacity and electricity price.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "methodology",
      "battery",
      "recharge",
      "cost",
      "battery",
      "recharge",
      "cost",
      "formula",
      "capacity",
      "efficiency",
      "quality-90",
      "aging",
    ],
  };

  const methodologyGeneratorVsBatteryEntity = {
    id: "methodology:generator-vs-battery-cost",
    type: "landing" as const,
    slug: "generator-vs-battery-cost",
    title: "How Generator vs Battery Cost Is Compared",
    canonicalUrl: ensureAbsoluteUrl("/methodology/generator-vs-battery-cost"),
    excerpt: "Fixed assumptions for generator vs battery operating-cost comparison.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "methodology",
      "generator",
      "vs",
      "battery",
      "cost",
      "generator",
      "vs",
      "battery",
      "cost",
      "assumptions",
      "quality-90",
      "aging",
    ],
  };

  const methodologyHubEntity = {
    id: "methodology:index",
    type: "landing" as const,
    slug: "methodology",
    title: "Methodology",
    canonicalUrl: ensureAbsoluteUrl("/methodology"),
    excerpt: "Transparent formulas for electricity rates, inflation, affordability, battery recharge cost, and generator vs battery comparison.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "methodology",
      "how",
      "electricity",
      "rates",
      "inflation",
      "affordability",
      "battery",
      "generator",
      "formula",
      "quality-90",
      "aging",
    ],
  };

  const datasetsHubEntity = {
    id: "datasets:index",
    type: "landing" as const,
    slug: "datasets",
    title: "Datasets",
    canonicalUrl: ensureAbsoluteUrl("/datasets"),
    excerpt: "Downloadable electricity price and ranking datasets. JSON and CSV exports for research and transparency.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "dataset",
      "electricity",
      "prices",
      "by",
      "state",
      "dataset",
      "electricity",
      "rankings",
      "dataset",
      "electricity",
      "csv",
      "download",
      "electricity",
      "json",
      "download",
      "state",
      "electricity",
      "rates",
      "dataset",
      "quality-90",
      "aging",
    ],
  };

  const datasetsPricesByStateEntity = {
    id: "datasets:electricity-prices-by-state",
    type: "landing" as const,
    slug: "electricity-prices-by-state",
    title: "Electricity Prices by State Dataset",
    canonicalUrl: ensureAbsoluteUrl("/datasets/electricity-prices-by-state"),
    excerpt: "State-level electricity rates, national comparison, and momentum. JSON and CSV download.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "dataset",
      "electricity",
      "prices",
      "by",
      "state",
      "state",
      "electricity",
      "rates",
      "dataset",
      "electricity",
      "csv",
      "download",
      "quality-90",
      "aging",
    ],
  };

  const datasetsRankingsEntity = {
    id: "datasets:electricity-rankings",
    type: "landing" as const,
    slug: "electricity-rankings",
    title: "Electricity Rankings Dataset",
    canonicalUrl: ensureAbsoluteUrl("/datasets/electricity-rankings"),
    excerpt: "All state rankings in one dataset. Rate, affordability, value score, inflation. JSON and CSV download.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "dataset",
      "electricity",
      "rankings",
      "dataset",
      "electricity",
      "rankings",
      "csv",
      "download",
      "state",
      "rankings",
      "quality-90",
      "aging",
    ],
  };

  const siteMapEntity = {
    id: "discovery:site-map",
    type: "landing" as const,
    slug: "site-map",
    title: "Site Map",
    canonicalUrl: ensureAbsoluteUrl("/site-map"),
    excerpt: "Complete site map of electricity data, insights, knowledge, datasets, methodology, and AI energy pages.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "site",
      "map",
      "electricity",
      "data",
      "electricity",
      "site",
      "map",
      "electricity",
      "site",
      "structure",
      "quality-90",
      "aging",
    ],
  };

  const dataRegistryEntity = {
    id: "discovery:data-registry",
    type: "landing" as const,
    slug: "data-registry",
    title: "Data Registry",
    canonicalUrl: ensureAbsoluteUrl("/data-registry"),
    excerpt: "Registry of datasets used by the site. Electricity rate data, rankings, downloadable exports.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "data",
      "registry",
      "electricity",
      "dataset",
      "index",
      "electricity",
      "data",
      "registry",
      "quality-90",
      "aging",
    ],
  };

  const gridCapacityAndElectricityDemandEntity = {
    id: "grid-capacity-and-electricity-demand:index",
    type: "landing" as const,
    slug: "grid-capacity-and-electricity-demand",
    title: "Grid Capacity and Electricity Demand",
    canonicalUrl: ensureAbsoluteUrl("/grid-capacity-and-electricity-demand"),
    excerpt: "How electricity demand growth and grid capacity pressures can matter for electricity prices. Explanatory authority on demand, infrastructure, and electricity-cost connections.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "grid",
      "capacity",
      "electricity",
      "demand",
      "grid",
      "capacity",
      "electricity",
      "demand",
      "power",
      "demand",
      "growth",
      "electricity",
      "prices",
      "grid",
      "capacity",
      "constraints",
      "electricity",
      "costs",
      "electricity",
      "demand",
      "growth",
      "grid",
      "strain",
      "electricity",
      "costs",
      "electricity",
      "infrastructure",
      "costs",
      "quality-85",
      "aging",
    ],
  };

  const gridCapacityPowerDemandGrowthEntity = {
    id: "grid-capacity-and-electricity-demand:power-demand-growth",
    type: "landing" as const,
    slug: "power-demand-growth",
    title: "Power Demand Growth and Electricity Prices",
    canonicalUrl: ensureAbsoluteUrl("/grid-capacity-and-electricity-demand/power-demand-growth"),
    excerpt: "How rising electricity demand can matter for electricity prices. Plain-language explanation of demand growth, infrastructure needs, and electricity-cost connections.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "power",
      "demand",
      "growth",
      "electricity",
      "prices",
      "electricity",
      "demand",
      "growth",
      "electricity",
      "costs",
      "infrastructure",
      "electricity",
      "demand",
      "quality-85",
      "aging",
    ],
  };

  const gridCapacityConstraintsEntity = {
    id: "grid-capacity-and-electricity-demand:grid-capacity-constraints",
    type: "landing" as const,
    slug: "grid-capacity-constraints",
    title: "Grid Capacity Constraints and Electricity Costs",
    canonicalUrl: ensureAbsoluteUrl("/grid-capacity-and-electricity-demand/grid-capacity-constraints"),
    excerpt: "What grid capacity constraints are and why they can matter for electricity cost discussions. Explanatory authority on infrastructure pressure and electricity-cost connections.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "grid",
      "capacity",
      "constraints",
      "electricity",
      "costs",
      "grid",
      "capacity",
      "electricity",
      "infrastructure",
      "electricity",
      "costs",
      "grid",
      "strain",
      "electricity",
      "quality-85",
      "aging",
    ],
  };

  const powerGenerationMixEntity = {
    id: "power-generation-mix:index",
    type: "landing" as const,
    slug: "power-generation-mix",
    title: "Power Generation Mix and Electricity Prices",
    canonicalUrl: ensureAbsoluteUrl("/power-generation-mix"),
    excerpt: "How the mix of fuels and generation resources can influence electricity prices, price stability, and state-level electricity economics.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "power",
      "generation",
      "mix",
      "electricity",
      "prices",
      "electricity",
      "fuel",
      "mix",
      "electricity",
      "price",
      "volatility",
      "electricity",
      "costs",
      "generation",
      "mix",
      "electricity",
      "quality-85",
      "aging",
    ],
  };

  const fuelCostsAndElectricityPricesEntity = {
    id: "power-generation-mix:fuel-costs-and-electricity-prices",
    type: "landing" as const,
    slug: "fuel-costs-and-electricity-prices",
    title: "Fuel Costs and Electricity Prices",
    canonicalUrl: ensureAbsoluteUrl("/power-generation-mix/fuel-costs-and-electricity-prices"),
    excerpt: "How fuel costs can influence electricity prices. Electricity systems more exposed to fuel-cost changes may see more pressure on electricity prices.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "fuel",
      "costs",
      "electricity",
      "prices",
      "electricity",
      "fuel",
      "mix",
      "electricity",
      "price",
      "volatility",
      "causes",
      "generation",
      "mix",
      "electricity",
      "costs",
      "quality-85",
      "aging",
    ],
  };

  const electricityMarketsEntity = {
    id: "electricity-markets:index",
    type: "landing" as const,
    slug: "electricity-markets",
    title: "Electricity Market Structures and Prices",
    canonicalUrl: ensureAbsoluteUrl("/electricity-markets"),
    excerpt: "How different electricity market structures can influence electricity pricing patterns across states. Organized wholesale markets and regulated utility structures.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "market",
      "structures",
      "electricity",
      "market",
      "design",
      "electricity",
      "prices",
      "electricity",
      "markets",
      "how",
      "electricity",
      "markets",
      "work",
      "quality-85",
      "aging",
    ],
  };

  const isoRtoMarketsEntity = {
    id: "electricity-markets:iso-rto-markets",
    type: "landing" as const,
    slug: "iso-rto-markets",
    title: "ISO and RTO Electricity Markets",
    canonicalUrl: ensureAbsoluteUrl("/electricity-markets/iso-rto-markets"),
    excerpt: "What organized wholesale electricity markets are and how they can influence electricity pricing. ISO and RTO markets coordinate power generation and transmission.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "iso",
      "rto",
      "electricity",
      "markets",
      "electricity",
      "market",
      "structures",
      "electricity",
      "wholesale",
      "markets",
      "electricity",
      "prices",
      "quality-85",
      "aging",
    ],
  };

  const regulatedElectricityMarketsEntity = {
    id: "electricity-markets:regulated-electricity-markets",
    type: "landing" as const,
    slug: "regulated-electricity-markets",
    title: "Regulated Electricity Markets",
    canonicalUrl: ensureAbsoluteUrl("/electricity-markets/regulated-electricity-markets"),
    excerpt: "How regulated electricity markets work. Traditional vertically integrated utilities, rate regulation, and why electricity price levels can differ across regions.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "regulated",
      "electricity",
      "markets",
      "electricity",
      "market",
      "structures",
      "electricity",
      "utilities",
      "rate",
      "regulation",
      "electricity",
      "prices",
      "quality-85",
      "aging",
    ],
  };

  const regionalElectricityMarketsEntity = {
    id: "regional-electricity-markets:index",
    type: "landing" as const,
    slug: "regional-electricity-markets",
    title: "Regional Electricity Markets and Price Differences",
    canonicalUrl: ensureAbsoluteUrl("/regional-electricity-markets"),
    excerpt: "Why electricity prices vary across regions of the United States. Generation mix, grid infrastructure, fuel access, market structure, and regulation.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "regional",
      "electricity",
      "prices",
      "electricity",
      "prices",
      "by",
      "region",
      "regional",
      "electricity",
      "markets",
      "electricity",
      "grid",
      "regions",
      "quality-85",
      "aging",
    ],
  };

  const whyElectricityPricesDifferByRegionEntity = {
    id: "regional-electricity-markets:why-electricity-prices-differ-by-region",
    type: "landing" as const,
    slug: "why-electricity-prices-differ-by-region",
    title: "Why Electricity Prices Differ by Region",
    canonicalUrl: ensureAbsoluteUrl("/regional-electricity-markets/why-electricity-prices-differ-by-region"),
    excerpt: "Why electricity pricing is not uniform across the United States. Generation mix, fuel costs, grid infrastructure, and market design drive regional price variation.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "regional",
      "electricity",
      "prices",
      "electricity",
      "prices",
      "by",
      "region",
      "why",
      "electricity",
      "prices",
      "differ",
      "quality-85",
      "aging",
    ],
  };

  const regionalGridStructureEntity = {
    id: "regional-electricity-markets:regional-grid-structure",
    type: "landing" as const,
    slug: "regional-grid-structure",
    title: "Regional Grid Structure and Electricity Prices",
    canonicalUrl: ensureAbsoluteUrl("/regional-electricity-markets/regional-grid-structure"),
    excerpt: "How regional grid structure can influence electricity economics. Transmission networks, generation location, and interconnection capacity affect price levels and volatility.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "regional",
      "grid",
      "structure",
      "electricity",
      "prices",
      "electricity",
      "grid",
      "regions",
      "electricity",
      "infrastructure",
      "quality-85",
      "aging",
    ],
  };

  const electricityGenerationCostDriversEntity = {
    id: "electricity-generation-cost-drivers:index",
    type: "landing" as const,
    slug: "electricity-generation-cost-drivers",
    title: "Electricity Generation Cost Drivers",
    canonicalUrl: ensureAbsoluteUrl("/electricity-generation-cost-drivers"),
    excerpt: "Major forces that can influence electricity generation costs and electricity prices. Fuel costs, infrastructure, and delivery systems.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "generation",
      "cost",
      "drivers",
      "fuel",
      "prices",
      "electricity",
      "costs",
      "electricity",
      "infrastructure",
      "costs",
      "electricity",
      "cost",
      "drivers",
      "what",
      "drives",
      "electricity",
      "prices",
      "electricity",
      "generation",
      "economics",
      "quality-85",
      "aging",
    ],
  };

  const fuelPricesAndGenerationCostsEntity = {
    id: "electricity-generation-cost-drivers:fuel-prices-and-generation-costs",
    type: "landing" as const,
    slug: "fuel-prices-and-generation-costs",
    title: "Fuel Prices and Electricity Generation Costs",
    canonicalUrl: ensureAbsoluteUrl("/electricity-generation-cost-drivers/fuel-prices-and-generation-costs"),
    excerpt: "How fuel prices can affect electricity generation economics. Systems dependent on fuel-based generation may see costs shift when fuel markets change.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "fuel",
      "prices",
      "electricity",
      "generation",
      "costs",
      "electricity",
      "cost",
      "drivers",
      "electricity",
      "generation",
      "economics",
      "quality-85",
      "aging",
    ],
  };

  const infrastructureAndElectricityCostsEntity = {
    id: "electricity-generation-cost-drivers:infrastructure-and-electricity-costs",
    type: "landing" as const,
    slug: "infrastructure-and-electricity-costs",
    title: "Infrastructure and Electricity Costs",
    canonicalUrl: ensureAbsoluteUrl("/electricity-generation-cost-drivers/infrastructure-and-electricity-costs"),
    excerpt: "How infrastructure can influence electricity costs. Transmission, distribution, and grid upgrades can be part of electricity-cost discussions.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "infrastructure",
      "electricity",
      "costs",
      "electricity",
      "infrastructure",
      "costs",
      "electricity",
      "cost",
      "drivers",
      "electricity",
      "generation",
      "economics",
      "quality-85",
      "aging",
    ],
  };

  const generationMixAndPriceVolatilityEntity = {
    id: "power-generation-mix:generation-mix-and-price-volatility",
    type: "landing" as const,
    slug: "generation-mix-and-price-volatility",
    title: "Generation Mix and Electricity Price Volatility",
    canonicalUrl: ensureAbsoluteUrl("/power-generation-mix/generation-mix-and-price-volatility"),
    excerpt: "How generation context can connect to electricity price volatility. Market structure, fuel exposure, and resource mix can shape how stable or unstable electricity prices appear.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "generation",
      "mix",
      "electricity",
      "price",
      "volatility",
      "electricity",
      "fuel",
      "mix",
      "electricity",
      "price",
      "volatility",
      "causes",
      "electricity",
      "cost",
      "stability",
      "quality-85",
      "aging",
    ],
  };

  const electricityDataEntity = {
    id: "electricity-data:index",
    type: "landing" as const,
    slug: "electricity-data",
    title: "Electricity Data Used by PriceOfElectricity.com",
    canonicalUrl: ensureAbsoluteUrl("/electricity-data"),
    excerpt: "Explore the datasets used to analyze electricity prices, state electricity costs, and national electricity trends.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "datasets",
      "electricity",
      "price",
      "data",
      "electricity",
      "rate",
      "datasets",
      "electricity",
      "data",
      "united",
      "states",
      "electricity",
      "price",
      "dataset",
      "quality-90",
      "aging",
    ],
  };

  const entityRegistryEntity = {
    id: "discovery:entity-registry",
    type: "landing" as const,
    slug: "entity-registry",
    title: "Electricity Data and Analysis Entities",
    canonicalUrl: ensureAbsoluteUrl("/entity-registry"),
    excerpt: "Structured index of electricity price data, state electricity metrics, rankings, and datasets used by PriceOfElectricity.com.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "entities",
      "electricity",
      "data",
      "entities",
      "electricity",
      "metrics",
      "index",
      "electricity",
      "analysis",
      "entities",
      "quality-90",
      "aging",
    ],
  };

  const businessElectricityCostDecisionsEntity = {
    id: "business-electricity-cost-decisions:index",
    type: "landing" as const,
    slug: "business-electricity-cost-decisions",
    title: "Business Electricity Cost Decisions",
    canonicalUrl: ensureAbsoluteUrl("/business-electricity-cost-decisions"),
    excerpt: "How electricity prices can influence business planning and location decisions. Explore electricity cost context for businesses comparing states or budgeting operating costs.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "business",
      "electricity",
      "cost",
      "decisions",
      "business",
      "electricity",
      "cost",
      "by",
      "state",
      "electricity",
      "costs",
      "for",
      "businesses",
      "electricity",
      "location",
      "decisions",
      "quality-85",
      "aging",
    ],
  };

  const choosingAStateForElectricityCostsEntity = {
    id: "business-electricity-cost-decisions:choosing-a-state",
    type: "landing" as const,
    slug: "choosing-a-state-for-electricity-costs",
    title: "Choosing a State Based on Electricity Costs",
    canonicalUrl: ensureAbsoluteUrl("/business-electricity-cost-decisions/choosing-a-state-for-electricity-costs"),
    excerpt: "How state electricity prices can be part of business location decision-making. Compare electricity costs across states when evaluating where to relocate or expand.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "choosing",
      "a",
      "state",
      "electricity",
      "costs",
      "business",
      "location",
      "electricity",
      "cost",
      "by",
      "state",
      "electricity",
      "location",
      "decisions",
      "quality-85",
      "aging",
    ],
  };

  const electricityCostsForSmallBusinessesEntity = {
    id: "business-electricity-cost-decisions:small-businesses",
    type: "landing" as const,
    slug: "electricity-costs-for-small-businesses",
    title: "Electricity Costs for Small Businesses",
    canonicalUrl: ensureAbsoluteUrl("/business-electricity-cost-decisions/electricity-costs-for-small-businesses"),
    excerpt: "How electricity costs can affect small business budgeting. State-level electricity price context for lighting, HVAC, refrigeration, equipment, and office operations.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "small",
      "business",
      "electricity",
      "costs",
      "electricity",
      "costs",
      "for",
      "businesses",
      "business",
      "electricity",
      "cost",
      "by",
      "state",
      "quality-85",
      "aging",
    ],
  };

  const electricityTopicsLandingEntity = {
    id: "electricity-topics:index",
    type: "landing" as const,
    slug: "electricity-topics",
    title: "Electricity Economics Topics",
    canonicalUrl: ensureAbsoluteUrl("/electricity-topics"),
    excerpt: "Explore electricity price analysis topics including electricity costs, inflation, volatility, grid capacity, AI energy demand, and solar economics.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "economics",
      "electricity",
      "price",
      "analysis",
      "electricity",
      "topics",
      "electricity",
      "data",
      "analysis",
      "electricity",
      "cost",
      "research",
      "quality-90",
      "aging",
    ],
  };

  const pageIndexEntity = {
    id: "discovery:page-index",
    type: "landing" as const,
    slug: "page-index",
    title: "Page Index",
    canonicalUrl: ensureAbsoluteUrl("/page-index"),
    excerpt: "Index of all major site pages: state pages, rankings, tools, insights, datasets, methodology.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "page",
      "index",
      "electricity",
      "site",
      "structure",
      "electricity",
      "dataset",
      "index",
      "quality-90",
      "aging",
    ],
  };

  const discoveryGraphEntity = {
    id: "discovery:discovery-graph",
    type: "landing" as const,
    slug: "discovery-graph",
    title: "Discovery Graph",
    canonicalUrl: ensureAbsoluteUrl("/discovery-graph"),
    excerpt: "A structured overview of the major electricity topics, datasets, and analysis relationships covered by PriceOfElectricity.com. Machine-readable discovery graph for LLM crawlers and search engines.",
    qualityScore: 90,
    freshnessStatus: "aging" as const,
    tokens: [
      "discovery",
      "graph",
      "electricity",
      "site",
      "graph",
      "electricity",
      "topic",
      "graph",
      "electricity",
      "knowledge",
      "graph",
      "electricity",
      "discovery",
      "map",
      "electricity",
      "semantic",
      "graph",
      "quality-90",
      "aging",
    ],
  };

  const whyElectricityPricesRiseEntity = {
    id: "why-electricity-prices-rise:index",
    type: "landing" as const,
    slug: "why-electricity-prices-rise",
    title: "Why Electricity Prices Rise",
    canonicalUrl: ensureAbsoluteUrl("/why-electricity-prices-rise"),
    excerpt: "High-level factors that can contribute to electricity price increases: fuel costs, infrastructure investment, demand, and market conditions.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "why",
      "electricity",
      "prices",
      "rise",
      "why",
      "electricity",
      "price",
      "causes",
      "electricity",
      "price",
      "increase",
      "quality-85",
      "aging",
    ],
  };

  const whyElectricityIsExpensiveEntity = {
    id: "why-electricity-is-expensive:index",
    type: "landing" as const,
    slug: "why-electricity-is-expensive",
    title: "Why Electricity Is Expensive",
    canonicalUrl: ensureAbsoluteUrl("/why-electricity-is-expensive"),
    excerpt: "Factors that can contribute to higher electricity prices: generation mix, grid infrastructure, market structure, and fuel exposure.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "why",
      "electricity",
      "is",
      "expensive",
      "why",
      "electricity",
      "cheap",
      "electricity",
      "price",
      "causes",
      "quality-85",
      "aging",
    ],
  };

  const whyElectricityIsCheapEntity = {
    id: "why-electricity-is-cheap:index",
    type: "landing" as const,
    slug: "why-electricity-is-cheap",
    title: "Why Electricity Is Cheap",
    canonicalUrl: ensureAbsoluteUrl("/why-electricity-is-cheap"),
    excerpt: "Factors that can contribute to lower electricity prices: fuel availability, infrastructure, generation resources, and market design.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "why",
      "electricity",
      "is",
      "cheap",
      "why",
      "electricity",
      "cheap",
      "electricity",
      "price",
      "causes",
      "quality-85",
      "aging",
    ],
  };

  const launchChecklistEntity = {
    id: "discovery:launch-checklist",
    type: "landing" as const,
    slug: "launch-checklist",
    title: "Launch Checklist",
    canonicalUrl: ensureAbsoluteUrl("/launch-checklist"),
    excerpt: "A practical checklist for verifying content, data, discovery, and technical readiness before launch.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "launch",
      "checklist",
      "website",
      "launch",
      "readiness",
      "electricity",
      "site",
      "launch",
      "checklist",
      "price",
      "electricity",
      "launch",
      "readiness",
      "quality-85",
      "aging",
    ],
  };

  const growthRoadmapHubEntity = {
    id: "growth-roadmap:index",
    type: "landing" as const,
    slug: "growth-roadmap",
    title: "Electricity Content Growth Roadmap",
    canonicalUrl: ensureAbsoluteUrl("/growth-roadmap"),
    excerpt: "How the site's electricity analysis can expand over time: topic clusters, programmatic pages, datasets, and linkable authority assets.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "content",
      "roadmap",
      "electricity",
      "content",
      "structure",
      "electricity",
      "data",
      "authority",
      "roadmap",
      "programmatic",
      "electricity",
      "pages",
      "electricity",
      "topic",
      "clusters",
      "electricity",
      "linkable",
      "assets",
      "quality-85",
      "aging",
    ],
  };

  const growthRoadmapProgrammaticEntity = {
    id: "growth-roadmap:programmatic-pages",
    type: "landing" as const,
    slug: "growth-roadmap/programmatic-pages",
    title: "Programmatic Electricity Page Expansion",
    canonicalUrl: ensureAbsoluteUrl("/growth-roadmap/programmatic-pages"),
    excerpt: "Types of programmatic electricity pages: state cost pages, average bill pages, cost-of-living pages, inflation pages, comparison pages, and fixed-kWh pages.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "programmatic",
      "electricity",
      "pages",
      "electricity",
      "page",
      "expansion",
      "state",
      "electricity",
      "cost",
      "average",
      "bill",
      "comparison",
      "quality-85",
      "aging",
    ],
  };

  const growthRoadmapTopicClustersEntity = {
    id: "growth-roadmap:topic-clusters",
    type: "landing" as const,
    slug: "growth-roadmap/topic-clusters",
    title: "Electricity Topic Cluster Expansion",
    canonicalUrl: ensureAbsoluteUrl("/growth-roadmap/topic-clusters"),
    excerpt: "Major electricity topic clusters: consumer economics, affordability, business, AI infrastructure, market structure, energy transition, and data methodology.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "topic",
      "clusters",
      "electricity",
      "topics",
      "consumer",
      "affordability",
      "business",
      "market",
      "structure",
      "energy",
      "transition",
      "quality-85",
      "aging",
    ],
  };

  const growthRoadmapLinkableAssetsEntity = {
    id: "growth-roadmap:linkable-assets",
    type: "landing" as const,
    slug: "growth-roadmap/linkable-assets",
    title: "Linkable Electricity Data and Analysis Assets",
    canonicalUrl: ensureAbsoluteUrl("/growth-roadmap/linkable-assets"),
    excerpt: "Datasets, methodology, topic hubs, comparison pages, rankings, and discovery pages that create durable value for researchers, journalists, and AI systems.",
    qualityScore: 85,
    freshnessStatus: "aging" as const,
    tokens: [
      "electricity",
      "linkable",
      "assets",
      "electricity",
      "data",
      "authority",
      "datasets",
      "methodology",
      "rankings",
      "discovery",
      "electricity",
      "content",
      "structure",
      "quality-85",
      "aging",
    ],
  };

  const allSearchEntities = [
    ...baseEntities,
    ...regionEntities,
    electricityCostLandingEntity,
    ...electricityCostStateEntities,
    averageElectricityBillLandingEntity,
    ...averageElectricityBillStateEntities,
    movingToElectricityCostLandingEntity,
    ...movingToElectricityCostStateEntities,
    electricityCostCalculatorLandingEntity,
    ...electricityCostCalculatorStateEntities,
    howMuch500KwhEntity,
    howMuch1000KwhEntity,
    howMuch2000KwhEntity,
    electricityProvidersLandingEntity,
    compareElectricityPlansHubEntity,
    compareElectricityPlansByStateEntity,
    howToCompareElectricityPlansEntity,
    electricityShoppingHubEntity,
    electricityShoppingByStateEntity,
    howElectricityShoppingWorksEntity,
    shopElectricityHubEntity,
    ...shopElectricityStateEntities,
    businessElectricityOptionsHubEntity,
    ...businessElectricityOptionsStateEntities,
    futureExpansionHubEntity,
    futureExpansionProgrammaticEntity,
    futureExpansionTopicEntity,
    futureExpansionDataDiscoveryEntity,
    operatingPlaybookHubEntity,
    operatingPlaybookDataUpdatesEntity,
    operatingPlaybookExpandingEntity,
    operatingPlaybookQualityEntity,
    siteMaintenanceHubEntity,
    siteMaintenanceDataRefreshEntity,
    siteMaintenanceQualityChecksEntity,
    siteMaintenanceContentExpansionEntity,
    solarSavingsLandingEntity,
    batteryRechargeCostLandingEntity,
    ...batteryRechargeCostStateEntities,
    generatorVsBatteryCostLandingEntity,
    ...generatorVsBatteryCostStateEntities,
    aiEnergyDemandLandingEntity,
    aiEnergyDemandDataCentersEntity,
    aiEnergyDemandAIPowerEntity,
    aiEnergyDemandElectricityPricesEntity,
    aiEnergyDemandGridStrainEntity,
    electricityInsightsLandingEntity,
    electricityTrendsLandingEntity,
    electricityAffordabilityLandingEntity,
    electricityCostOfLivingLandingEntity,
    ...electricityCostOfLivingStateEntities,
    dataCenterElectricityCostLandingEntity,
    ...dataCenterElectricityCostStateEntities,
    solarVsGridElectricityCostLandingEntity,
    ...solarVsGridElectricityCostStateEntities,
    batteryBackupElectricityCostLandingEntity,
    ...batteryBackupElectricityCostStateEntities,
    electricityPriceVolatilityLandingEntity,
    ...electricityPriceVolatilityStateEntities,
    gridCapacityAndElectricityDemandEntity,
    gridCapacityPowerDemandGrowthEntity,
    gridCapacityConstraintsEntity,
    powerGenerationMixEntity,
    fuelCostsAndElectricityPricesEntity,
    generationMixAndPriceVolatilityEntity,
    electricityMarketsEntity,
    isoRtoMarketsEntity,
    regulatedElectricityMarketsEntity,
    regionalElectricityMarketsEntity,
    whyElectricityPricesDifferByRegionEntity,
    regionalGridStructureEntity,
    electricityGenerationCostDriversEntity,
    fuelPricesAndGenerationCostsEntity,
    infrastructureAndElectricityCostsEntity,
    electricityInflationLandingEntity,
    electricityCostComparisonLandingEntity,
    ...electricityCostComparisonPairEntities,
    electricityPriceHistoryLandingEntity,
    ...electricityPriceHistoryStateEntities,
    ...electricityInflationStateEntities,
    ...electricityAffordabilityStateEntities,
    methodologyHubEntity,
    methodologyElectricityRatesEntity,
    methodologyElectricityInflationEntity,
    methodologyElectricityAffordabilityEntity,
    methodologyBatteryRechargeCostEntity,
    methodologyGeneratorVsBatteryEntity,
    datasetsHubEntity,
    datasetsPricesByStateEntity,
    datasetsRankingsEntity,
    electricityDataEntity,
    entityRegistryEntity,
    businessElectricityCostDecisionsEntity,
    choosingAStateForElectricityCostsEntity,
    electricityCostsForSmallBusinessesEntity,
    siteMapEntity,
    dataRegistryEntity,
    pageIndexEntity,
    electricityTopicsLandingEntity,
    discoveryGraphEntity,
    whyElectricityPricesRiseEntity,
    whyElectricityIsExpensiveEntity,
    whyElectricityIsCheapEntity,
    launchChecklistEntity,
    growthRoadmapHubEntity,
    growthRoadmapProgrammaticEntity,
    growthRoadmapTopicClustersEntity,
    growthRoadmapLinkableAssetsEntity,
  ].sort(
    (a, b) =>
      a.type.localeCompare(b.type) ||
      a.slug.localeCompare(b.slug) ||
      a.id.localeCompare(b.id),
  );

  const searchIndexBody: KnowledgeSearchIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    totalEntities: allSearchEntities.length,
    entities: allSearchEntities,
    insights: searchInsights,
  };

  type SearchEntity = (typeof searchIndexBody.entities)[number];
  const entityById = new Map<string, SearchEntity>(searchIndexBody.entities.map((e) => [e.id, e]));
  const tokenSetById = new Map<string, Set<string>>();
  for (const e of searchIndexBody.entities) {
    tokenSetById.set(e.id, new Set(e.tokens));
  }
  const rankingTopStates = new Map<string, string[]>();
  for (const r of rankingPages) {
    const top = (r.data.sortedStates ?? []).slice(0, 5).map((s) => `knowledge:state:${s.slug}`);
    rankingTopStates.set(`knowledge:rankings:${r.slug}`, top);
  }
  const relMethodologyIds = searchIndexBody.entities.filter((e) => e.type === "methodology").map((e) => e.id);
  const relRankingIds = searchIndexBody.entities.filter((e) => e.type === "rankings").map((e) => e.id);
  const relStateIds = searchIndexBody.entities.filter((e) => e.type === "state").map((e) => e.id);

  const byEntity: Record<string, Array<{ id: string; title: string; canonicalUrl: string; type: string; reason: string }>> = {};
  for (const entity of searchIndexBody.entities) {
    const myTokens = tokenSetById.get(entity.id) ?? new Set<string>();
    const candidates: Array<{ id: string; score: number; sameType: boolean }> = [];
    for (const other of searchIndexBody.entities) {
      if (other.id === entity.id) continue;
      const otherTokens = tokenSetById.get(other.id) ?? new Set<string>();
      let intersection = 0;
      for (const t of myTokens) {
        if (otherTokens.has(t)) intersection++;
      }
      const sameType = other.type === entity.type;
      candidates.push({ id: other.id, score: intersection, sameType });
    }
    candidates.sort((a, b) => {
      if (a.sameType !== b.sameType) return a.sameType ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      const aEnt = entityById.get(a.id);
      const bEnt = entityById.get(b.id);
      return (aEnt?.canonicalUrl ?? "").localeCompare(bEnt?.canonicalUrl ?? "");
    });
    const seen = new Set<string>([entity.id]);
    const related: Array<{ id: string; title: string; canonicalUrl: string; type: string; reason: string }> = [];
    if (entity.type === "state") {
      const reg = regionByStateSlug.get(entity.slug);
      if (reg?.enabled) {
        const regionId = `knowledge:region:${reg.id}`;
        if (!seen.has(regionId)) {
          const e = entityById.get(regionId);
          if (e) {
            seen.add(regionId);
            related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "Region" });
          }
        }
      }
      for (const rid of relRankingIds) {
        if (related.length >= 6) break;
        if (!seen.has(rid)) {
          const e = entityById.get(rid);
          if (e) {
            seen.add(rid);
            related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "Ranking" });
          }
        }
      }
      for (const mid of relMethodologyIds) {
        if (related.length >= 6) break;
        if (!seen.has(mid)) {
          const e = entityById.get(mid);
          if (e) {
            seen.add(mid);
            related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "Methodology" });
          }
        }
      }
    }
    if (entity.type === "region") {
      const regionDef = regionDefs.find((r) => r.id === entity.slug);
      if (regionDef?.stateSlugs?.length) {
        for (const stateSlug of regionDef.stateSlugs.slice(0, 6)) {
          if (related.length >= 6) break;
          const stateId = `knowledge:state:${stateSlug}`;
          if (!seen.has(stateId)) {
            const e = entityById.get(stateId);
            if (e) {
              seen.add(stateId);
              related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "State in region" });
            }
          }
        }
      }
    }
    if (entity.type === "rankings") {
      const topStates = rankingTopStates.get(entity.id) ?? [];
      for (const sid of topStates) {
        if (related.length >= 6) break;
        if (!seen.has(sid)) {
          const e = entityById.get(sid);
          if (e) {
            seen.add(sid);
            related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "In ranking" });
          }
        }
      }
      for (const mid of relMethodologyIds) {
        if (related.length >= 6) break;
        if (!seen.has(mid)) {
          const e = entityById.get(mid);
          if (e) {
            seen.add(mid);
            related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "Methodology" });
          }
        }
      }
    }
    if (entity.type === "national") {
      for (const sid of relStateIds.slice(0, 4)) {
        if (related.length >= 6) break;
        if (!seen.has(sid)) {
          const e = entityById.get(sid);
          if (e) {
            seen.add(sid);
            related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "State" });
          }
        }
      }
      for (const rid of relRankingIds) {
        if (related.length >= 6) break;
        if (!seen.has(rid)) {
          const e = entityById.get(rid);
          if (e) {
            seen.add(rid);
            related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "Ranking" });
          }
        }
      }
    }
    for (const c of candidates) {
      if (related.length >= 6) break;
      if (!seen.has(c.id) && c.score > 0) {
        const e = entityById.get(c.id);
        if (e) {
          seen.add(c.id);
          related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "Related" });
        }
      }
    }
    for (const c of candidates) {
      if (related.length >= 6) break;
      if (!seen.has(c.id)) {
        const e = entityById.get(c.id);
        if (e) {
          seen.add(c.id);
          related.push({ id: e.id, title: e.title, canonicalUrl: e.canonicalUrl, type: e.type, reason: "Related" });
        }
      }
    }
    byEntity[entity.id] = related.slice(0, 6);
  }
  const relatedBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    byEntity,
  };

  type InsightEntry = { type: string; statement: string; confidence: "high" | "medium" | "low" };

  function buildNationalInsightsFromPack(): {
    insights: InsightEntry[];
    searchInsights: KnowledgeSearchInsight[];
  } {
    const insights: InsightEntry[] = [];
    const searchInsights: KnowledgeSearchInsight[] = [];
    const nat = pack.national;
    const avg = nat.averageRateCentsPerKwh;
    const median = nat.medianRateCentsPerKwh;
    const high = nat.highestState;
    const low = nat.lowestState;
    if (typeof avg === "number") {
      insights.push({ type: "price", statement: `The national average electricity rate is ${avg.toFixed(2)} cents per kWh.`, confidence: "high" });
      searchInsights.push({ type: "insight", subject: "national", id: "national-avg", statement: `The national average electricity rate is ${avg.toFixed(2)} cents per kWh.` });
    }
    if (typeof median === "number") {
      insights.push({ type: "price", statement: `The national median electricity rate is ${median.toFixed(2)} cents per kWh.`, confidence: "high" });
    }
    if (high && low && typeof high.rate === "number" && typeof low.rate === "number" && low.rate > 0) {
      const ratio = high.rate / low.rate;
      if (ratio >= 2.5) {
        insights.push({ type: "price", statement: `Electricity prices in ${high.name ?? high.slug} are more than ${Math.floor(ratio)} times higher than in ${low.name ?? low.slug}.`, confidence: "high" });
        searchInsights.push({ type: "insight", subject: "national", id: "national-spread", statement: `Electricity prices in ${high.name ?? high.slug} are more than ${Math.floor(ratio)} times higher than in ${low.name ?? low.slug}.` });
      }
    }
    const top5 = nat.top5Highest ?? [];
    if (top5.length >= 3) {
      const names = top5.slice(0, 3).map((s) => s.name ?? s.slug).join(", ");
      insights.push({ type: "ranking", statement: `States with the highest electricity rates include ${names}.`, confidence: "medium" });
    }
    insights.splice(MAX_INSIGHTS);
    return { insights, searchInsights };
  }

  function buildStateInsights(
    state: (typeof normalizedStates)[number],
    rateRank: number | null,
    nationalAvg: number,
    momentum: { enabled: boolean; signal: string } | undefined,
  ): { insights: InsightEntry[]; searchInsights: KnowledgeSearchInsight[] } {
    const insights: InsightEntry[] = [];
    const searchInsights: KnowledgeSearchInsight[] = [];
    const rate = state.avgRateCentsPerKwh;
    const name = state.name ?? state.slug;
    if (typeof rate === "number" && nationalAvg > 0) {
      const pct = ((rate - nationalAvg) / nationalAvg) * 100;
      if (Math.abs(pct) >= 5) {
        const dir = pct > 0 ? "more" : "less";
        insights.push({ type: "price", statement: `Electricity in ${name} costs ${Math.abs(pct).toFixed(0)}% ${dir} than the national average.`, confidence: "high" });
        searchInsights.push({ type: "insight", subject: "state", id: `state:${state.slug}:vs-national`, statement: `Electricity in ${name} costs ${Math.abs(pct).toFixed(0)}% ${dir} than the national average.` });
      }
      searchInsights.push({
        type: "comparison",
        subject: "state",
        id: `state:${state.slug}:comparison`,
        statement: `Electricity in ${name} costs ${Math.abs(pct).toFixed(1)}% ${pct > 0 ? "more" : "less"} than the national average.`,
        keywords: ["state electricity vs national average", "electricity cost comparison"],
      });
    }
    if (rateRank != null && rateRank >= 1) {
      insights.push({ type: "ranking", statement: `${name} ranks #${rateRank} among U.S. states for electricity prices.`, confidence: "high" });
      searchInsights.push({ type: "insight", subject: "state", id: `state:${state.slug}:rank`, statement: `${name} ranks #${rateRank} among U.S. states for electricity prices.` });
    }
    if (rateRank != null && rateRank <= 10 && rateRank >= 1) {
      insights.push({ type: "ranking", statement: `Electricity in ${name} is among the top 10 most expensive in the U.S.`, confidence: "medium" });
    } else if (rateRank != null && rateRank >= 41) {
      insights.push({ type: "ranking", statement: `Electricity in ${name} is among the 10 least expensive states.`, confidence: "medium" });
    }
    if (typeof state.valueScore === "number" && state.valueScore >= 90) {
      insights.push({ type: "value", statement: `${name} has a value score of ${state.valueScore}, indicating strong affordability and freshness.`, confidence: "medium" });
    }
    if (momentum?.enabled && momentum.signal && momentum.signal !== "unavailable") {
      const statement =
        momentum.signal === "accelerating"
          ? `${name} shows an accelerating electricity price trend based on recent historical data.`
          : momentum.signal === "stable"
            ? `${name} appears stable based on recent electricity price changes.`
            : `${name} shows a ${momentum.signal} electricity price trend based on recent historical data.`;
      insights.push({ type: "trend", statement, confidence: "medium" });
      searchInsights.push({ type: "insight", subject: "state", id: `state:${state.slug}:momentum`, statement });
    }
    insights.splice(MAX_INSIGHTS);
    return { insights, searchInsights };
  }

  function buildRankingInsightsFromPack(
    r: (typeof rankingPages)[number],
  ): { insights: InsightEntry[]; searchInsights: KnowledgeSearchInsight[] } {
    const insights: InsightEntry[] = [];
    const searchInsights: KnowledgeSearchInsight[] = [];
    const sorted = r.data.sortedStates ?? [];
    const enabled = (r.data as { enabled?: boolean }).enabled !== false;
    if (!enabled || sorted.length === 0) {
      return { insights: [], searchInsights: [] };
    }
    const top = sorted[0];
    if (top) {
      insights.push({ type: "ranking", statement: `${top.name ?? top.slug} ranks #1 for ${r.title.toLowerCase().replace(/ rankings?$/, "")} in the United States.`, confidence: "high" });
      searchInsights.push({ type: "insight", subject: "ranking", id: `ranking:${r.slug}:top1`, statement: `${top.name ?? top.slug} ranks #1 for ${r.title.toLowerCase().replace(/ rankings?$/, "")} in the United States.` });
    }
    const vals = sorted.map((s) => s.metricValue).filter((v): v is number => typeof v === "number");
    if (vals.length >= 2) {
      const minV = Math.min(...vals);
      const maxV = Math.max(...vals);
      const gap = maxV - minV;
      if (r.slug === "rate-high-to-low" || r.slug === "rate-low-to-high") {
        insights.push({ type: "price", statement: `The gap between the highest and lowest state electricity rates is ${gap.toFixed(2)} cents per kWh.`, confidence: "high" });
        searchInsights.push({ type: "insight", subject: "ranking", id: `ranking:${r.slug}:gap`, statement: `The gap between the highest and lowest state electricity rates is ${gap.toFixed(2)} cents per kWh.` });
      }
    }
    const top5 = sorted.slice(0, 5);
    if (top5.length >= 3) {
      const top5Avg = top5.reduce((a, s) => a + (typeof s.metricValue === "number" ? s.metricValue : 0), 0) / top5.length;
      if (r.slug === "rate-high-to-low" || r.slug === "rate-low-to-high") {
        insights.push({ type: "price", statement: `The top 5 states average ${top5Avg.toFixed(2)} cents per kWh.`, confidence: "medium" });
      }
    }
    insights.splice(MAX_INSIGHTS);
    return { insights, searchInsights };
  }

  const rateRankForInsights = new Map<string, number>();
  const rateRanking = rankingPages.find((r) => r.slug === "rate-high-to-low");
  if (rateRanking?.data.sortedStates) {
    for (let i = 0; i < rateRanking.data.sortedStates.length; i++) {
      rateRankForInsights.set(rateRanking.data.sortedStates[i].slug, i + 1);
    }
  }
  const nationalAvg = typeof pack.national.averageRateCentsPerKwh === "number" ? pack.national.averageRateCentsPerKwh : 0;

  const nationalInsightsResult = buildNationalInsightsFromPack();
  const allSearchInsights: KnowledgeSearchInsight[] = [...nationalInsightsResult.searchInsights];

  const insightsWrites: Array<{ path: string; body: unknown }> = [
    {
      path: "/knowledge/insights/national.json",
      body: {
        schemaVersion: "1.0",
        generatedAt,
        subject: "national",
        id: "national",
        insights: nationalInsightsResult.insights,
      },
    },
  ];

  const normalizedStateSlugs = new Set(normalizedStates.map((s) => s.slug));
  for (const state of normalizedStates) {
    const rateRank = rateRankForInsights.get(state.slug) ?? null;
    const momentum = momentumBySlug.get(state.slug);
    const { insights, searchInsights } = buildStateInsights(state, rateRank, nationalAvg, momentum);
    allSearchInsights.push(...searchInsights);
    insightsWrites.push({
      path: `/knowledge/insights/state/${state.slug}.json`,
      body: {
        schemaVersion: "1.0",
        generatedAt,
        subject: "state",
        id: state.slug,
        insights,
      },
    });
  }
  for (const item of indexBody.items) {
    if (item.type === "state" && !normalizedStateSlugs.has(item.slug)) {
      insightsWrites.push({
        path: `/knowledge/insights/state/${item.slug}.json`,
        body: {
          schemaVersion: "1.0",
          generatedAt,
          subject: "state",
          id: item.slug,
          insights: [],
        },
      });
    }
  }

  for (const r of rankingPages) {
    const { insights, searchInsights } = buildRankingInsightsFromPack(r);
    allSearchInsights.push(...searchInsights);
    insightsWrites.push({
      path: `/knowledge/insights/rankings/${r.slug}.json`,
      body: {
        schemaVersion: "1.0",
        generatedAt,
        subject: "ranking",
        id: r.slug,
        insights,
      },
    });
  }

  for (const { pairSlug } of pairs) {
    const data = pairDataBySlug.get(pairSlug);
    if (!data) continue;
    const pct = Math.abs(data.differencePercent);
    const dir = data.differencePercent > 0 ? "more" : "less";
    allSearchInsights.push({
      type: "comparison",
      subject: "state",
      id: pairSlug,
      statement: `Electricity in ${data.stateA.name} costs ${pct.toFixed(1)}% ${dir} than in ${data.stateB.name}.`,
      keywords: [
        `${data.stateA.name} vs ${data.stateB.name} electricity price`,
        "electricity cost comparison",
      ],
    });
  }

  searchIndexBody.insights = allSearchInsights;

  const contractBody: KnowledgeContract = {
    schemaVersion: "1.0",
    contractVersion,
    generatedAt,
    sourceVersion,
    versionPolicy: {
      schemaVersionMeaning: "Major-only schema version for file shape compatibility.",
      contractVersionMeaning: "SemVer for contract semantics and required fields.",
      methodologyVersionMeaning: "SemVer per methodology id when calculation changes.",
      dataVersionMeaning: "Data snapshot/version tag for inputs.",
    },
    deprecationPolicy: {
      enabled: true,
      deprecationMapUrl: "/knowledge/policy/deprecations.json",
      notice: "Deprecated fields remain for a grace period; prefer replacement fields when present.",
    },
    endpoints: {
      index: "/knowledge/index.json",
      national: "/knowledge/national.json",
      states: "/knowledge/state/{slug}.json",
      methodology: "/knowledge/methodology/{id}.json",
      rankings: "/knowledge/rankings/{id}.json",
      verticals: "/knowledge/vertical/{id}.json",
    },
    snapshotSupport: {
      enabled: true,
      historyIndexUrl: "/knowledge/history/index.json",
      historyBundlesIndexUrl: "/knowledge/history/bundles/index.json",
      snapshotPattern: "/knowledge/history/{sourceVersion}/...",
    },
    provenanceCatalogUrl: "/knowledge/provenance.json",
    labelsUrl: "/knowledge/labels/en.json",
    disclaimersUrl: "/knowledge/policy/disclaimers.json",
    docsUrl: "/knowledge/docs",
    docsJsonUrl: "/knowledge/docs/index.json",
    offersSupport: {
      enabledByDefault: false,
      offersIndexUrl: "/knowledge/offers/index.json",
      offersConfigUrl: "/knowledge/policy/offers-config.json",
      stateOffersRefField: "data.offersRef",
      gatingRules: "Offers cannot go live unless offers-config.json offers.enabled is true and allowOutboundLinks is true. All offer.url must be null unless explicitly configured.",
    },
    provenanceSupport: {
      enabled: true,
      fieldLevel: true,
    },
    glossarySupport: {
      enabled: true,
      fieldsUrl: "/knowledge/glossary/fields.json",
      fieldIdConvention: "snakeOrCamelCase ids matching coverage/search-index usage",
    },
    jsonLdSupport: {
      enabled: true,
      documentation:
        "Human pages emit JSON-LD (schema.org WebPage, Dataset) derived from knowledge JSON pages. Metadata-only; no invention. meta.canonicalUrl is the source of truth for JSON-LD url.",
    },
    querySurfaces: {
      searchIndexUrl: "/knowledge/search-index.json",
      schemaMapUrl: "/knowledge/schema-map.json",
      entityIndexUrl: "/knowledge/entity-index.json",
      methodologyIndexUrl: "/knowledge/methodology/index.json",
      compareStatesUrl: "/knowledge/compare/states.json",
      rankingsIndexUrl: "/knowledge/rankings/index.json",
      bundlesIndexUrl: "/knowledge/bundles/index.json",
      buildProfileUrl: "/knowledge/build-profile.json",
      leaderboardsUrl: "/knowledge/leaderboards/states.json",
      ingestStarterPackUrl: "/knowledge/ingest/starter-pack.json",
      publicEndpointsUrl: "/knowledge/public-endpoints.json",
      relatedIndexUrl: "/knowledge/related/index.json",
    },
    pageTypes: [
      {
        type: "national",
        requiredMetaFields: [
          "schemaVersion",
          "id",
          "type",
          "slug",
          "title",
          "description",
          "canonicalUrl",
          "jsonUrl",
          "updatedAt",
          "sourceVersion",
          "temporalContext",
          "contentHash",
          "provenance",
          "fieldProvenance",
          "citations",
          "llmHints",
          "freshness",
          "excerpt",
          "qualityScore",
          "integrity",
        ],
        requiredDataFields: ["raw", "derived", "facts"],
      },
      {
        type: "state",
        requiredMetaFields: [
          "schemaVersion",
          "id",
          "type",
          "slug",
          "title",
          "description",
          "canonicalUrl",
          "jsonUrl",
          "updatedAt",
          "sourceVersion",
          "temporalContext",
          "contentHash",
          "provenance",
          "fieldProvenance",
          "citations",
          "llmHints",
          "freshness",
          "excerpt",
          "qualityScore",
          "integrity",
        ],
        requiredDataFields: ["raw", "derived", "facts"],
      },
      {
        type: "methodology",
        requiredMetaFields: [
          "schemaVersion",
          "id",
          "type",
          "slug",
          "title",
          "description",
          "canonicalUrl",
          "jsonUrl",
          "updatedAt",
          "sourceVersion",
          "temporalContext",
          "contentHash",
          "provenance",
          "fieldProvenance",
          "citations",
          "llmHints",
          "freshness",
          "excerpt",
          "qualityScore",
          "integrity",
        ],
        requiredDataFields: [
          "definition",
          "inputs",
          "steps",
          "limitations",
          "relatedInternalUrls",
        ],
      },
      {
        type: "rankings",
        requiredMetaFields: [
          "schemaVersion",
          "id",
          "type",
          "slug",
          "title",
          "description",
          "canonicalUrl",
          "jsonUrl",
          "updatedAt",
          "sourceVersion",
          "temporalContext",
          "contentHash",
          "provenance",
          "fieldProvenance",
          "citations",
          "llmHints",
          "freshness",
          "excerpt",
          "qualityScore",
          "integrity",
        ],
        requiredDataFields: ["rankingType", "sortedStates", "generatedAt", "facts"],
      },
      {
        type: "vertical",
        requiredMetaFields: [
          "schemaVersion",
          "id",
          "type",
          "slug",
          "title",
          "description",
          "canonicalUrl",
          "jsonUrl",
          "updatedAt",
          "sourceVersion",
          "temporalContext",
          "contentHash",
          "provenance",
          "fieldProvenance",
          "citations",
          "llmHints",
          "freshness",
          "excerpt",
          "qualityScore",
          "integrity",
        ],
        requiredDataFields: [
          "status",
          "summary",
          "keyThemes",
          "relatedStates",
          "relatedRankings",
          "relatedMethodologies",
          "monitoringEndpoints",
          "expansionReadiness",
        ],
      },
    ],
    compatibility: {
      guarantees: [
        "meta.schemaVersion remains '1.0' until a breaking change",
        "new fields may be added, existing fields are not removed without schema bump",
        "all pages include meta + data",
        "contentHash is SHA-256 of final JSON string",
      ],
      breakingChangePolicy:
        "If any required field is removed or renamed, increment schemaVersion and contractVersion.",
    },
  stability: {
    deterministicSerialization: true,
    regressionGuardUrl: "/knowledge/regression.json",
    schemaFreezeEnforced: true,
  },
  integrity: {
    algorithm: "sha256",
    indexIntegrityField: "integritySignature",
    pageIntegrityField: "meta.integrity.contentHash",
    manifestUrl: "/knowledge/integrity/manifest.json",
    verificationNote:
      "Consumers should validate contentHash for each file in the manifest against the file fetched from the url. manifestHash covers {algorithm,files}. signature is reserved for future private-key signing (out of repo); validate hashes even when signature.enabled is false.",
  },
  capabilitiesUrl: "/knowledge/capabilities.json",
  capabilitiesNote: "Build-time introspection of what is present/enabled. Use for discovery and conditional logic.",
  releaseUrl: "/knowledge/release.json",
  releaseNote: "Release snapshot pins public endpoints and integrity hash for announcements, SEO, and ingestion tooling.",
  changeTracking: {
      enabled: true,
      thresholdPercent: CHANGE_THRESHOLD_PERCENT,
      changelogUrl: "/knowledge/changelog.json",
    },
  };

  const previousIndexPath = makeJsonPath("/knowledge/index.json");
  let previousItemsByUrl = new Map<string, string>();
  try {
    const previousRaw = await readFile(previousIndexPath, "utf8");
    const previousParsed = JSON.parse(previousRaw) as { items?: Array<{ jsonUrl?: string; contentHash?: string }> };
    if (Array.isArray(previousParsed.items)) {
      previousItemsByUrl = new Map(
        previousParsed.items
          .filter((item) => typeof item.jsonUrl === "string" && typeof item.contentHash === "string")
          .map((item) => [item.jsonUrl as string, item.contentHash as string]),
      );
    }
  } catch {
    previousItemsByUrl = new Map();
  }
  const nextItemsByUrl = new Map(indexBody.items.map((item) => [item.jsonUrl, item.contentHash]));
  const added: Array<{ jsonUrl: string; contentHash: string }> = [];
  const removed: Array<{ jsonUrl: string; contentHash: string }> = [];
  const changed: Array<{ jsonUrl: string; fromHash: string; toHash: string }> = [];

  for (const [jsonUrl, contentHash] of nextItemsByUrl) {
    const previousHash = previousItemsByUrl.get(jsonUrl);
    if (!previousHash) {
      added.push({ jsonUrl, contentHash });
      continue;
    }
    if (previousHash !== contentHash) {
      changed.push({ jsonUrl, fromHash: previousHash, toHash: contentHash });
    }
  }
  for (const [jsonUrl, contentHash] of previousItemsByUrl) {
    if (!nextItemsByUrl.has(jsonUrl)) {
      removed.push({ jsonUrl, contentHash });
    }
  }
  added.sort((a, b) => a.jsonUrl.localeCompare(b.jsonUrl));
  removed.sort((a, b) => a.jsonUrl.localeCompare(b.jsonUrl));
  changed.sort((a, b) => a.jsonUrl.localeCompare(b.jsonUrl));

  const changelogBody: KnowledgeChangelog = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    contractVersion,
    notes: "Build-generated knowledge pages.",
    diff: { added, removed, changed },
    metricChanges: {
      states: metricChangesStates.sort((a, b) => a.slug.localeCompare(b.slug)),
      national: metricChangesNational,
    },
  };

  const provenanceBody: KnowledgeProvenanceCatalog = {
    schemaVersion: "1.0",
    generatedAt,
    sources: Object.values(PROVENANCE_SOURCES)
      .map((source) => ({
        ...source,
        sourceUrl: source.sourceUrl
          ? ensureAbsoluteUrl(source.sourceUrl)
          : undefined,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  };

  const snapshotBaseUrl = `/knowledge/history/${sourceVersion}`;
  const snapshotPageWrites: Array<{ jsonUrl: string; page: KnowledgePage<unknown> }> = pageWrites.map(
    ({ jsonUrl, page }) => {
      const suffix = jsonUrl.replace(/^\/knowledge\//, "");
      const snapshotJsonUrl = `${snapshotBaseUrl}/${suffix}`;
      const { contentHash: _ch, integrity: _int, ...metaWithoutHash } = page.meta;
      void _ch;
      void _int;
      const snapshotMeta: Omit<KnowledgeMeta, "contentHash"> = {
        ...metaWithoutHash,
        jsonUrl: ensureAbsoluteUrl(snapshotJsonUrl),
        temporalContext: {
          sourceVersion,
          isLatest: false,
        },
      };
      const snapshotPage = buildPageWithHash(snapshotMeta, page.data);
      const isNational = snapshotPage.meta.id === "knowledge:national";
      (snapshotPage.meta as KnowledgeMeta & { integrity?: unknown }).integrity = {
        contentHash: snapshotPage.meta.contentHash,
        ...(isNational ? { registryHash: indexBody.registryHash } : {}),
        integrityAlgorithm: "sha256",
        signedAtBuild: generatedAt,
      };
      return {
        jsonUrl: snapshotJsonUrl,
        page: snapshotPage,
      };
    },
  );
  const snapshotMetaById = new Map(
    snapshotPageWrites.map((write) => [write.page.meta.id, write.page.meta]),
  );
  const snapshotItems: KnowledgeRegistryItem[] = indexBody.items.map((item) => {
    const meta = snapshotMetaById.get(item.id);
    if (!meta) {
      throw new Error(`Missing snapshot page for ${item.id}`);
    }
    return {
      ...item,
      jsonUrl: meta.jsonUrl,
      contentHash: meta.contentHash,
      updatedAt: meta.updatedAt,
      sourceVersion: meta.sourceVersion,
    };
  });
  const snapshotIntegritySignature = sha256(
    [...snapshotItems].sort((a, b) => a.id.localeCompare(b.id)).map((i) => i.contentHash).join("|"),
  );
  const snapshotIndexBody: KnowledgeIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    registryHash: indexBody.registryHash,
    integritySignature: snapshotIntegritySignature,
    totalPages: indexBody.totalPages,
    contractUrl: `${snapshotBaseUrl}/contract.json`,
    changelogUrl: `${snapshotBaseUrl}/changelog.json`,
    provenanceUrl: `${snapshotBaseUrl}/provenance.json`,
    schemaMapUrl: `${snapshotBaseUrl}/schema-map.json`,
    entityIndexUrl: `${snapshotBaseUrl}/entity-index.json`,
    methodologyIndexUrl: `${snapshotBaseUrl}/methodology/index.json`,
    compareUrl: "/knowledge/compare/states.json",
    rankingsIndexUrl: "/knowledge/rankings/index.json",
    labelsUrl: "/knowledge/labels/en.json",
    glossaryFieldsUrl: "/knowledge/glossary/fields.json",
    docsUrl: "/knowledge/docs",
    docsJsonUrl: "/knowledge/docs/index.json",
    ingestStarterPackUrl: "/knowledge/ingest/starter-pack.json",
    offersIndexUrl: "/knowledge/offers/index.json",
    offersConfigUrl: "/knowledge/policy/offers-config.json",
    capabilitiesUrl: "/knowledge/capabilities.json",
    releaseUrl: "/knowledge/release.json",
    disclaimersUrl: "/knowledge/policy/disclaimers.json",
    items: snapshotItems,
  };
  const snapshotContractBody: KnowledgeContract = {
    ...contractBody,
    generatedAt,
    sourceVersion,
    endpoints: {
      index: `${snapshotBaseUrl}/index.json`,
      national: `${snapshotBaseUrl}/national.json`,
      states: `${snapshotBaseUrl}/state/{slug}.json`,
      methodology: `${snapshotBaseUrl}/methodology/{id}.json`,
      rankings: `${snapshotBaseUrl}/rankings/{id}.json`,
      verticals: `${snapshotBaseUrl}/vertical/{id}.json`,
    },
    provenanceCatalogUrl: `${snapshotBaseUrl}/provenance.json`,
    querySurfaces: {
      searchIndexUrl: `${snapshotBaseUrl}/search-index.json`,
      schemaMapUrl: `${snapshotBaseUrl}/schema-map.json`,
      entityIndexUrl: `${snapshotBaseUrl}/entity-index.json`,
      methodologyIndexUrl: `${snapshotBaseUrl}/methodology/index.json`,
      compareStatesUrl: "/knowledge/compare/states.json",
      rankingsIndexUrl: "/knowledge/rankings/index.json",
    },
  };
  const snapshotChangelogBody: KnowledgeChangelog = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    contractVersion,
    notes: "Build-generated knowledge pages.",
    diff: {
      added: [],
      removed: [],
      changed: [],
    },
    metricChanges: { states: [], national: [] },
  };
  const snapshotProvenanceBody: KnowledgeProvenanceCatalog = {
    ...provenanceBody,
    generatedAt,
  };
  const snapshotSchemaMapBody: KnowledgeSchemaMap = {
    ...schemaMapBody,
    generatedAt,
    entities: schemaMapBody.entities.map((entity) => ({
      ...entity,
      jsonPattern: entity.jsonPattern.replace("/knowledge/", `${snapshotBaseUrl}/`),
    })),
  };
  const snapshotEntityIndexBody: KnowledgeEntityIndex = {
    ...entityIndexBody,
    generatedAt,
    entities: entityIndexBody.entities.map((entity) => ({
      ...entity,
      jsonUrl: entity.jsonUrl.replace("/knowledge/", `${snapshotBaseUrl}/`),
      temporalContext: {
        sourceVersion,
        isLatest: false,
      },
    })),
  };
  const snapshotSearchIndexBody: KnowledgeSearchIndex = {
    ...searchIndexBody,
    generatedAt,
    entities: searchIndexBody.entities,
  };
  const historyIndexEntry: KnowledgeHistorySnapshot = {
    sourceVersion,
    indexUrl: `${snapshotBaseUrl}/index.json`,
    generatedAt,
    pageCount: snapshotIndexBody.totalPages,
    indexContentHash: sha256(serializeDeterministic(indexBody)),
    registryHash: indexBody.registryHash,
  };
  let existingHistorySnapshots: KnowledgeHistorySnapshot[] = [];
  try {
    const existingHistoryRaw = await readFile(
      makeJsonPath("/knowledge/history/index.json"),
      "utf8",
    );
    const existingHistoryParsed = JSON.parse(
      existingHistoryRaw,
    ) as Partial<KnowledgeHistoryIndex>;
    if (Array.isArray(existingHistoryParsed.snapshots)) {
      existingHistorySnapshots = existingHistoryParsed.snapshots.filter(
        (entry): entry is KnowledgeHistorySnapshot =>
          !!entry &&
          typeof entry.sourceVersion === "string" &&
          typeof entry.indexUrl === "string" &&
          typeof entry.generatedAt === "string" &&
          typeof entry.pageCount === "number" &&
          typeof entry.indexContentHash === "string" &&
          typeof entry.registryHash === "string",
      );
    }
  } catch {
    existingHistorySnapshots = [];
  }
  const dedupedHistoryMap = new Map<string, KnowledgeHistorySnapshot>();
  for (const entry of existingHistorySnapshots) {
    if (!dedupedHistoryMap.has(entry.sourceVersion)) {
      dedupedHistoryMap.set(entry.sourceVersion, entry);
    }
  }
  dedupedHistoryMap.set(sourceVersion, historyIndexEntry);
  const historyIndexBody: KnowledgeHistoryIndex = {
    schemaVersion: "1.0",
    generatedAt,
    snapshots: [...dedupedHistoryMap.values()].sort((a, b) =>
      b.sourceVersion.localeCompare(a.sourceVersion),
    ),
  };

  const contentRegistry = buildContentRegistry();
  const graphNodes: GraphNode[] = contentRegistry
    .map((node) => ({
      id: node.id,
      type: node.type,
      url: node.url,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const nodeIds = new Set(contentRegistry.map((node) => node.id));
  const baseEdges: GraphEdge[] = [];
  for (const node of contentRegistry) {
    if (node.parent && nodeIds.has(node.parent)) {
      baseEdges.push({ from: node.id, to: node.parent, rel: "parent" });
    }
    if (node.related) {
      for (const related of node.related) {
        if (nodeIds.has(related)) {
          baseEdges.push({ from: node.id, to: related, rel: "related" });
        }
      }
    }
  }
  baseEdges.sort(
    (a, b) =>
      a.from.localeCompare(b.from) ||
      a.to.localeCompare(b.to) ||
      a.rel.localeCompare(b.rel),
  );

  const methodologyIds = methodologyPages
    .map((m) => `knowledge:methodology:${m.slug}`)
    .sort((a, b) => a.localeCompare(b));
  const stateIds = registryStates
    .map((item) => item.id)
    .sort((a, b) => a.localeCompare(b));
  const rankingToStates = rankingPages.flatMap((rankingPage) =>
    rankingPage.data.sortedStates.map((entry) => ({
      from: `knowledge:rankings:${rankingPage.slug}`,
      to: `knowledge:state:${entry.slug}`,
      relation: "derived-from" as const,
    })),
  );
  const verticalToStates = verticalData.relatedStates.map((slug) => ({
    from: "knowledge:vertical:ai-energy",
    to: `knowledge:state:${slug}`,
    relation: "related-to" as const,
  }));
  const verticalToRankings = verticalData.relatedRankings.map((slug) => ({
    from: "knowledge:vertical:ai-energy",
    to: `knowledge:rankings:${slug}`,
    relation: "related-to" as const,
  }));
  const stateToMethodology = stateIds.flatMap((stateId) =>
    methodologyIds.map((methodologyId) => ({
      from: stateId,
      to: methodologyId,
      relation: "references" as const,
    })),
  );
  const knowledgeEdges: KnowledgeGraphEdge[] = [
    ...stateToMethodology,
    ...rankingToStates,
    ...verticalToStates,
    ...verticalToRankings,
  ].sort(
    (a, b) =>
      a.from.localeCompare(b.from) ||
      a.to.localeCompare(b.to) ||
      a.relation.localeCompare(b.relation),
  );

  const graphBody = {
    version: "1.0",
    generatedAt,
    totalNodes: graphNodes.length,
    totalEdges: baseEdges.length,
    nodes: graphNodes,
    edges: baseEdges,
    knowledgeEdges,
  };
  durationsMs.generateIndexes = bigintToMs(process.hrtime.bigint() - tPhase);
  checkBudget("generateIndexes", durationsMs.generateIndexes);

  tPhase = process.hrtime.bigint();
  await mkdir(KNOWLEDGE_ROOT, { recursive: true });
  for (const subdir of ["state", "methodology", "rankings", "vertical"]) {
    await rm(path.join(KNOWLEDGE_ROOT, subdir), { recursive: true, force: true });
  }
  for (const file of [
    "index.json",
    "contract.json",
    "changelog.json",
    "provenance.json",
    "schema-map.json",
    "entity-index.json",
    "search-index.json",
    "national.json",
  ]) {
    await rm(path.join(KNOWLEDGE_ROOT, file), { force: true });
  }
  for (const write of pageWrites) {
    validatePage(write.page, sourceVersion);
    await writeJson(write.jsonUrl, write.page);
  }
  const labelsBody = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    locale: "en",
    labels: { ...KNOWLEDGE_LABELS },
  };
  await writeJson("/knowledge/labels/en.json", labelsBody);
  const labelsTsPath = path.join(process.cwd(), "src", "lib", "knowledge", "labels.ts");
  const labelsTsContent = `// Generated by knowledge-build. Do not edit manually.
const LABELS: Record<string, string> = ${JSON.stringify(KNOWLEDGE_LABELS, null, 2)};

/** Look up a label by key. Falls back to the key if missing. */
export function t(key: string): string {
  return LABELS[key] ?? key;
}
`;
  await writeFile(labelsTsPath, labelsTsContent, "utf8");
  await writeJson("/knowledge/index.json", indexBody);
  await writeJson("/knowledge/contract.json", contractBody);
  await writeJson("/knowledge/changelog.json", changelogBody);
  await writeJson("/knowledge/provenance.json", provenanceBody);
  await writeJson("/knowledge/schema-map.json", schemaMapBody);
  await writeJson("/knowledge/entity-index.json", entityIndexBody);
  await writeJson("/knowledge/search-index.json", searchIndexBody);
  await writeJson("/knowledge/methodology/index.json", methodologyIndexBody);
  await writeJson("/knowledge/policy/disclaimers.json", disclaimersBody);
  const deprecationsBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    contractVersion,
    items: [] as Array<{
      id: string;
      kind: "field" | "url" | "entityType";
      status: "active" | "deprecated";
      deprecatedSinceContractVersion?: string;
      replacement?: { fieldId?: string; url?: string; notes?: string };
      appliesTo?: { pageTypes?: string[]; paths?: string[] };
    }>,
  };
  await writeJson("/knowledge/policy/deprecations.json", deprecationsBody);
  await writeJson("/knowledge/offers/index.json", offersIndexBody);
  await writeJson("/knowledge/compare/states.json", compareStatesBody);
  const pairsBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    contractVersion,
    pairs: pairs.map((p) => p.pairSlug),
  };
  await writeJson("/knowledge/compare/pairs.json", pairsBody);
  const electricityComparisonPairsManifest = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    pairs: pairs.map((p) => ({ pair: p.pairSlug, stateA: p.slugA, stateB: p.slugB })),
  };
  await writeJson("electricity-comparison-pairs.json", electricityComparisonPairsManifest);
  await mkdir(path.join(KNOWLEDGE_ROOT, "compare"), { recursive: true });
  const compareDir = path.join(KNOWLEDGE_ROOT, "compare");
  const existingCompareFiles = await readdir(compareDir).catch(() => [] as string[]);
  const curatedPairSet = new Set(pairs.map((p) => p.pairSlug));
  for (const f of existingCompareFiles) {
    if (f.endsWith(".json") && f.includes("-vs-") && f !== "pairs.json" && !curatedPairSet.has(f.replace(/\.json$/, ""))) {
      await rm(path.join(compareDir, f), { force: true });
    }
  }
  for (const { pairSlug } of pairs) {
    const data = pairDataBySlug.get(pairSlug);
    if (!data) continue;
    const comparePageBody = {
      schemaVersion: "1.0" as const,
      generatedAt,
      sourceVersion,
      contractVersion,
      stateA: data.stateA.slug,
      stateB: data.stateB.slug,
      nameA: data.stateA.name,
      nameB: data.stateB.name,
      rateA: data.stateA.rate,
      rateB: data.stateB.rate,
      differenceCents: data.differenceCents,
      differencePercent: data.differencePercent,
      higherCostState: data.higherCostState,
      lowerCostState: data.lowerCostState,
    };
    await writeJson(`/knowledge/compare/${pairSlug}.json`, comparePageBody);
  }
  await mkdir(path.join(KNOWLEDGE_ROOT, "regions"), { recursive: true });
  const regionsIndexBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    contractVersion,
    regions: regionDefs.map((r) => {
      const data = regionDataById.get(r.id);
      const enabled = data?.enabled ?? (r.id !== "unknown");
      return {
        id: r.id,
        name: r.name,
        href: `/knowledge/regions/${r.id}`,
        excerpt: data?.excerpt ?? (r.id === "unknown" ? "States with incomplete or unknown region mapping." : `${r.name} U.S. states electricity metrics.`),
        enabled: r.id === "unknown" ? false : enabled,
        stateCount: data?.stateCount ?? 0,
        averageRateCentsPerKwh: data?.averageRateCentsPerKwh ?? null,
      };
    }),
  };
  await writeJson("/knowledge/regions/index.json", regionsIndexBody);
  for (const r of regionDefs) {
    const data = regionDataById.get(r.id);
    if (!data) continue;
    const regionDetailBody = {
      schemaVersion: "1.0" as const,
      generatedAt,
      sourceVersion,
      contractVersion,
      id: data.id,
      name: data.name,
      excerpt: data.excerpt,
      enabled: data.enabled,
      stateCount: data.stateCount,
      averageRateCentsPerKwh: data.averageRateCentsPerKwh,
      medianRateCentsPerKwh: data.medianRateCentsPerKwh,
      highestState: data.highestState,
      lowestState: data.lowestState,
      top5Highest: data.top5Highest,
      top5Lowest: data.top5Lowest,
    };
    await writeJson(`/knowledge/regions/${r.id}.json`, regionDetailBody);
    const statesInRegion = r.stateSlugs
      .map((slug) => stateBySlug.get(slug))
      .filter((s): s is (typeof normalizedStates)[number] => !!s && typeof s.avgRateCentsPerKwh === "number");
    const sortedDesc = [...statesInRegion].sort((a, b) => (b.avgRateCentsPerKwh ?? 0) - (a.avgRateCentsPerKwh ?? 0));
    const sortedAsc = [...statesInRegion].sort((a, b) => (a.avgRateCentsPerKwh ?? 0) - (b.avgRateCentsPerKwh ?? 0));
    const rankingsBody = {
      schemaVersion: "1.0" as const,
      generatedAt,
      sourceVersion,
      contractVersion,
      regionId: r.id,
      regionName: r.name,
      cheapestStates: sortedAsc.slice(0, 10).map((s) => ({ slug: s.slug, name: s.name ?? s.slug, rate: s.avgRateCentsPerKwh as number })),
      mostExpensiveStates: sortedDesc.slice(0, 10).map((s) => ({ slug: s.slug, name: s.name ?? s.slug, rate: s.avgRateCentsPerKwh as number })),
    };
    await writeJson(`/knowledge/regions/${r.id}-rankings.json`, rankingsBody);
  }
  await writeJson("/knowledge/rankings/index.json", rankingsIndexBody);
  await mkdir(path.join(KNOWLEDGE_ROOT, "leaderboards"), { recursive: true });
  await writeJson("/knowledge/leaderboards/states.json", leaderboardsBody);
  await mkdir(path.join(KNOWLEDGE_ROOT, "insights"), { recursive: true });
  await mkdir(path.join(KNOWLEDGE_ROOT, "insights", "state"), { recursive: true });
  await mkdir(path.join(KNOWLEDGE_ROOT, "insights", "rankings"), { recursive: true });
  for (const { path: p, body } of insightsWrites) {
    await writeJson(p, body);
  }
  await mkdir(path.join(KNOWLEDGE_ROOT, "glossary"), { recursive: true });
  await writeJson("/knowledge/glossary/fields.json", glossaryBody);
  await mkdir(path.join(KNOWLEDGE_ROOT, "docs"), { recursive: true });
  await writeJson("/knowledge/docs/index.json", docsBody);
  await mkdir(path.join(KNOWLEDGE_ROOT, "ingest"), { recursive: true });
  await writeJson("/knowledge/ingest/starter-pack.json", starterPackBody);
  await mkdir(path.join(KNOWLEDGE_ROOT, "related"), { recursive: true });
  await writeJson("/knowledge/related/index.json", relatedBody);

  const DATASETS_ROOT = path.join(process.cwd(), "public", "datasets");
  await mkdir(DATASETS_ROOT, { recursive: true });

  const statePages = pageWrites.filter(
    (w) => w.jsonUrl.startsWith("/knowledge/state/") && w.jsonUrl.endsWith(".json"),
  );
  const pricesByStateRows: Array<Record<string, string | number | null>> = statePages.map((w) => {
    const page = w.page as { data?: { raw?: unknown; derived?: unknown }; meta?: { sourceVersion?: string; updatedAt?: string } };
    const raw = page.data?.raw as { slug?: string; name?: string; avgRateCentsPerKwh?: number } | undefined;
    const derived = page.data?.derived as {
      comparison?: { nationalAverage?: number; differencePercent?: number };
      momentum?: { signal?: string };
    } | undefined;
    return {
      slug: raw?.slug ?? "",
      state: raw?.name ?? raw?.slug ?? "",
      avgRateCentsPerKwh: raw?.avgRateCentsPerKwh ?? null,
      nationalAverage: derived?.comparison?.nationalAverage ?? null,
      differencePercent: derived?.comparison?.differencePercent ?? null,
      momentumSignal: derived?.momentum?.signal ?? null,
      generatedAt: page.meta?.updatedAt ?? generatedAt,
      sourceVersion: page.meta?.sourceVersion ?? sourceVersion,
    };
  });
  const pricesByStateBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    rowCount: pricesByStateRows.length,
    columns: ["slug", "state", "avgRateCentsPerKwh", "nationalAverage", "differencePercent", "momentumSignal", "generatedAt", "sourceVersion"],
    data: pricesByStateRows,
  };
  await writeJson("/datasets/electricity-prices-by-state.json", pricesByStateBody);
  const pricesCsvHeader = "slug,state,avgRateCentsPerKwh,nationalAverage,differencePercent,momentumSignal,generatedAt,sourceVersion";
  const pricesCsvRows = pricesByStateRows.map((r) =>
    [
      String(r.slug ?? ""),
      String(r.state ?? "").replace(/"/g, '""'),
      r.avgRateCentsPerKwh ?? "",
      r.nationalAverage ?? "",
      r.differencePercent ?? "",
      r.momentumSignal ?? "",
      r.generatedAt ?? "",
      r.sourceVersion ?? "",
    ].join(","),
  );
  await writeFile(
    path.join(DATASETS_ROOT, "electricity-prices-by-state.csv"),
    [pricesCsvHeader, ...pricesCsvRows].join("\n"),
    "utf8",
  );

  const rankingsIndexMeta = rankingsIndexBody.items;
  const rankingsRows: Array<Record<string, string | number | null>> = [];
  for (const r of rankingPages) {
    const indexItem = rankingsIndexMeta.find((i) => i.id === r.slug);
    const direction = indexItem?.sortDirection ?? "desc";
    const metricId = indexItem?.metricField?.split(".").pop() ?? r.slug;
    const sortedStates = r.data.sortedStates ?? [];
    for (const s of sortedStates) {
      rankingsRows.push({
        rankingId: r.slug,
        rankingTitle: r.title,
        state: s.name ?? s.slug ?? "",
        value: s.metricValue ?? null,
        displayValue: typeof s.displayValue === "string" ? s.displayValue : null,
        direction,
        metricId,
      });
    }
  }
  const rankingsBodyExport = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    rowCount: rankingsRows.length,
    columns: ["rankingId", "rankingTitle", "state", "value", "displayValue", "direction", "metricId"],
    data: rankingsRows,
  };
  await writeJson("/datasets/electricity-rankings.json", rankingsBodyExport);
  const rankingsCsvHeader = "rankingId,rankingTitle,state,value,displayValue,direction,metricId";
  const rankingsCsvRows = rankingsRows.map((r) =>
    [
      String(r.rankingId ?? ""),
      String(r.rankingTitle ?? "").replace(/"/g, '""'),
      String(r.state ?? "").replace(/"/g, '""'),
      r.value ?? "",
      String(r.displayValue ?? "").replace(/"/g, '""'),
      r.direction ?? "",
      r.metricId ?? "",
    ].join(","),
  );
  await writeFile(
    path.join(DATASETS_ROOT, "electricity-rankings.csv"),
    [rankingsCsvHeader, ...rankingsCsvRows].join("\n"),
    "utf8",
  );

  const publicEndpointsCandidates: Array<{
    groupId: string;
    groupTitle: string;
    items: Array<{ id: string; url: string; kind: "json" | "page"; description: string }>;
  }> = [
    {
      groupId: "knowledge-core",
      groupTitle: "Knowledge core",
      items: [
        { id: "knowledge-search-index", url: "/knowledge/search-index.json", kind: "json", description: "Primary discovery surface." },
        { id: "knowledge-index", url: "/knowledge/index.json", kind: "json", description: "Registry of knowledge pages." },
        { id: "knowledge-contract", url: "/knowledge/contract.json", kind: "json", description: "Schema contract." },
        { id: "knowledge-schema-map", url: "/knowledge/schema-map.json", kind: "json", description: "Entity patterns and fields." },
        { id: "knowledge-provenance", url: "/knowledge/provenance.json", kind: "json", description: "Source/citation metadata." },
        { id: "knowledge-related", url: "/knowledge/related/index.json", kind: "json", description: "Related links by entity for recommended next pages." },
      ],
    },
    {
      groupId: "knowledge-aux",
      groupTitle: "Knowledge auxiliary",
      items: [
        { id: "knowledge-glossary", url: "/knowledge/glossary/fields.json", kind: "json", description: "Field definitions." },
        { id: "knowledge-coverage", url: "/knowledge/coverage/states.json", kind: "json", description: "Metric coverage matrix." },
        { id: "knowledge-leaderboards", url: "/knowledge/leaderboards/states.json", kind: "json", description: "Top/bottom lists." },
        { id: "knowledge-ingest-starter", url: "/knowledge/ingest/starter-pack.json", kind: "json", description: "Recommended ingestion order." },
        { id: "knowledge-bundles", url: "/knowledge/bundles/index.json", kind: "json", description: "Offline bundle manifests." },
        { id: "knowledge-offers", url: "/knowledge/offers/index.json", kind: "json", description: "Offers catalog (disabled by default)." },
        { id: "knowledge-offers-config", url: "/knowledge/policy/offers-config.json", kind: "json", description: "Build-time offers configuration (enabled, allowOutboundLinks, etc.)." },
        { id: "knowledge-disclaimers", url: "/knowledge/policy/disclaimers.json", kind: "json", description: "Central disclaimer policy." },
        { id: "knowledge-deprecations", url: "/knowledge/policy/deprecations.json", kind: "json", description: "Deprecation map for fields and URLs." },
      ],
    },
    {
      groupId: "knowledge-human",
      groupTitle: "Knowledge human pages",
      items: [
        { id: "knowledge-home", url: "/knowledge", kind: "page", description: "Knowledge landing page." },
        { id: "data-hub", url: "/data", kind: "page", description: "Human entry point for data surfaces." },
        { id: "knowledge-docs", url: "/knowledge/docs", kind: "page", description: "Knowledge API documentation." },
        { id: "knowledge-directory", url: "/knowledge/pages", kind: "page", description: "Browse knowledge pages." },
        { id: "knowledge-compare", url: "/knowledge/compare", kind: "page", description: "Compare states." },
        { id: "knowledge-rankings", url: "/knowledge/rankings", kind: "page", description: "Browse rankings." },
      ],
    },
  ];
  const publicEndpointsGroups = publicEndpointsCandidates.map((g) => ({
    id: g.groupId,
    title: g.groupTitle,
    items: g.items
      .filter((item) => {
        if (item.kind === "page") return true;
        const p = makeJsonPath(item.url);
        return existsSync(p);
      })
      .sort((a, b) => a.id.localeCompare(b.id)),
  })).filter((g) => g.items.length > 0);
  const publicEndpointsBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    groups: publicEndpointsGroups.sort((a, b) => a.id.localeCompare(b.id)),
  };
  await writeJson("/knowledge/public-endpoints.json", publicEndpointsBody);

  const regressionPath = makeJsonPath("/knowledge/regression.json");
  try {
    const prevRaw = await readFile(regressionPath, "utf8");
    void (JSON.parse(prevRaw) as KnowledgeRegression);
    await writeFile(
      makeJsonPath("/knowledge/regression-previous.json"),
      prevRaw,
      "utf8",
    );
  } catch {
    /* no previous regression */
  }
  await writeJson("/knowledge/regression.json", regressionBody);
  for (const write of snapshotPageWrites) {
    validatePage(write.page, sourceVersion);
    await writeJson(write.jsonUrl, write.page);
  }
  await writeJson(`${snapshotBaseUrl}/index.json`, snapshotIndexBody);
  await writeJson(`${snapshotBaseUrl}/contract.json`, snapshotContractBody);
  await writeJson(`${snapshotBaseUrl}/changelog.json`, snapshotChangelogBody);
  await writeJson(`${snapshotBaseUrl}/provenance.json`, snapshotProvenanceBody);
  await writeJson(`${snapshotBaseUrl}/schema-map.json`, snapshotSchemaMapBody);
  await writeJson(`${snapshotBaseUrl}/entity-index.json`, snapshotEntityIndexBody);
  await writeJson(`${snapshotBaseUrl}/search-index.json`, snapshotSearchIndexBody);
  const snapshotMethodologyIndexBody: KnowledgeMethodologyIndex = {
    ...methodologyIndexBody,
    generatedAt,
    items: methodologyIndexBody.items.map((item) => ({
      ...item,
      jsonUrl: item.jsonUrl.replace(
        /\/knowledge\/methodology\//,
        `${snapshotBaseUrl}/methodology/`,
      ),
    })),
  };
  await writeJson(`${snapshotBaseUrl}/methodology/index.json`, snapshotMethodologyIndexBody);
  const snapshotRankingsIndexBody: KnowledgeRankingsIndex = {
    ...rankingsIndexBody,
    generatedAt,
    items: rankingsIndexBody.items.map((item) => ({
      ...item,
      jsonUrl: ensureAbsoluteUrl(`${snapshotBaseUrl}/rankings/${item.id}.json`),
    })),
  };
  await writeJson(`${snapshotBaseUrl}/rankings/index.json`, snapshotRankingsIndexBody);

  const snapshotContentHashByPath = new Map<string, string>();
  for (const item of snapshotItems) {
    const pathname = item.jsonUrl.startsWith("http")
      ? new URL(item.jsonUrl).pathname
      : item.jsonUrl;
    snapshotContentHashByPath.set(pathname, item.contentHash);
  }
  const snapshotCoreFiles: Array<{ url: string; contentHash?: string }> = [
    `${snapshotBaseUrl}/search-index.json`,
    `${snapshotBaseUrl}/index.json`,
    `${snapshotBaseUrl}/contract.json`,
    `${snapshotBaseUrl}/schema-map.json`,
    `${snapshotBaseUrl}/entity-index.json`,
    `${snapshotBaseUrl}/provenance.json`,
    `${snapshotBaseUrl}/changelog.json`,
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((url) => ({ url, contentHash: snapshotContentHashByPath.get(url) }))
    .map(({ url, contentHash }) => (contentHash ? { url, contentHash } : { url }));
  const snapshotBundlesIndexBody: KnowledgeBundlesIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundles: [
      { id: "core", title: "Core knowledge entry points", description: "Small set of primary JSON entry points for ingestion.", manifestUrl: `${snapshotBaseUrl}/bundles/core.json` },
      { id: "states-all", title: "All states", description: "All state knowledge pages (50 + DC).", manifestUrl: `${snapshotBaseUrl}/bundles/states-all.json` },
      { id: "methodologies", title: "Methodologies", description: "All methodology pages and index.", manifestUrl: `${snapshotBaseUrl}/bundles/methodologies.json` },
      { id: "rankings", title: "Rankings", description: "All ranking pages and rankings index.", manifestUrl: `${snapshotBaseUrl}/bundles/rankings.json` },
    ].sort((a, b) => a.id.localeCompare(b.id)),
  };
  const snapshotStatePaths = [
    ...normalizedStates.map((s) => `${snapshotBaseUrl}/state/${s.slug}.json`),
    `${snapshotBaseUrl}/state/district-of-columbia.json`,
  ].sort((a, b) => a.localeCompare(b));
  const snapshotMethodologyPaths = [
    `${snapshotBaseUrl}/methodology/index.json`,
    ...methodologyPages.map((m) => `${snapshotBaseUrl}/methodology/${m.slug}.json`),
  ].sort((a, b) => a.localeCompare(b));
  const snapshotRankingsPaths = [
    `${snapshotBaseUrl}/rankings/index.json`,
    ...rankingPages.map((r) => `${snapshotBaseUrl}/rankings/${r.slug}.json`),
  ].sort((a, b) => a.localeCompare(b));
  await mkdir(path.join(KNOWLEDGE_ROOT, "history", sourceVersion, "bundles"), { recursive: true });
  await writeJson(`${snapshotBaseUrl}/bundles/index.json`, snapshotBundlesIndexBody);
  await writeJson(`${snapshotBaseUrl}/bundles/core.json`, {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "core",
    files: snapshotCoreFiles,
  } as KnowledgeBundleManifest);
  await writeJson(`${snapshotBaseUrl}/bundles/states-all.json`, {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "states-all",
    files: snapshotStatePaths.map((url) => {
      const h = snapshotContentHashByPath.get(url);
      return h ? { url, contentHash: h } : { url };
    }),
  } as KnowledgeBundleManifest);
  await writeJson(`${snapshotBaseUrl}/bundles/methodologies.json`, {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "methodologies",
    files: snapshotMethodologyPaths.map((url) => {
      const h = snapshotContentHashByPath.get(url);
      return h ? { url, contentHash: h } : { url };
    }),
  } as KnowledgeBundleManifest);
  await writeJson(`${snapshotBaseUrl}/bundles/rankings.json`, {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "rankings",
    files: snapshotRankingsPaths.map((url) => {
      const h = snapshotContentHashByPath.get(url);
      return h ? { url, contentHash: h } : { url };
    }),
  } as KnowledgeBundleManifest);

  const historyBundlesIndexBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    snapshots: historyIndexBody.snapshots.map((s) => ({
      sourceVersion: s.sourceVersion,
      bundlesIndexUrl: `/knowledge/history/${s.sourceVersion}/bundles/index.json`,
      bundleIds: ["core", "states-all", "methodologies", "rankings"] as const,
    })),
  };
  await mkdir(path.join(KNOWLEDGE_ROOT, "history", "bundles"), { recursive: true });
  await writeJson("/knowledge/history/bundles/index.json", historyBundlesIndexBody);

  await writeJson("/knowledge/history/index.json", historyIndexBody);
  await writeJson("/graph.json", graphBody);

  const discoveryGraphBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    site: "PriceOfElectricity.com",
    nodes: [
      { id: "electricity-cost", type: "topic" as const, title: "Electricity Cost", url: "/electricity-cost", keywords: ["electricity cost", "rates", "state"] },
      { id: "average-electricity-bill", type: "topic" as const, title: "Average Electricity Bill", url: "/average-electricity-bill", keywords: ["electricity bill", "monthly", "estimated"] },
      { id: "electricity-affordability", type: "topic" as const, title: "Electricity Affordability", url: "/electricity-affordability", keywords: ["affordability", "cost burden"] },
      { id: "electricity-cost-of-living", type: "topic" as const, title: "Electricity Cost of Living", url: "/electricity-cost-of-living", keywords: ["cost of living", "household"] },
      { id: "electricity-inflation", type: "topic" as const, title: "Electricity Inflation", url: "/electricity-inflation", keywords: ["inflation", "price trends"] },
      { id: "electricity-price-volatility", type: "topic" as const, title: "Electricity Price Volatility", url: "/electricity-price-volatility", keywords: ["volatility", "price stability"] },
      { id: "electricity-trends", type: "topic" as const, title: "Electricity Trends", url: "/electricity-trends", keywords: ["trends", "national"] },
      { id: "electricity-data", type: "section" as const, title: "Electricity Data", url: "/electricity-data", keywords: ["data", "datasets", "methodology"] },
      { id: "datasets", type: "dataset" as const, title: "Datasets", url: "/datasets", keywords: ["download", "csv", "json"] },
      { id: "methodology", type: "methodology" as const, title: "Methodology", url: "/methodology", keywords: ["methodology", "calculations"] },
      { id: "electricity-topics", type: "discovery" as const, title: "Electricity Topics", url: "/electricity-topics", keywords: ["topics", "clusters", "hub"] },
      { id: "entity-registry", type: "discovery" as const, title: "Entity Registry", url: "/entity-registry", keywords: ["entities", "index"] },
      { id: "ai-energy-demand", type: "topic" as const, title: "AI Energy Demand", url: "/ai-energy-demand", keywords: ["ai", "data centers", "infrastructure"] },
      { id: "grid-capacity-and-electricity-demand", type: "topic" as const, title: "Grid Capacity and Electricity Demand", url: "/grid-capacity-and-electricity-demand", keywords: ["grid", "capacity", "demand"] },
      { id: "power-generation-mix", type: "topic" as const, title: "Power Generation Mix", url: "/power-generation-mix", keywords: ["generation", "fuel mix"] },
      { id: "electricity-markets", type: "topic" as const, title: "Electricity Markets", url: "/electricity-markets", keywords: ["markets", "regulation"] },
      { id: "regional-electricity-markets", type: "topic" as const, title: "Regional Electricity Markets", url: "/regional-electricity-markets", keywords: ["regional", "markets"] },
      { id: "electricity-generation-cost-drivers", type: "topic" as const, title: "Electricity Generation Cost Drivers", url: "/electricity-generation-cost-drivers", keywords: ["cost drivers", "generation"] },
      { id: "data-center-electricity-cost", type: "topic" as const, title: "Data Center Electricity Cost", url: "/data-center-electricity-cost", keywords: ["data center", "ai", "infrastructure"] },
      { id: "solar-vs-grid-electricity-cost", type: "topic" as const, title: "Solar vs Grid Electricity Cost", url: "/solar-vs-grid-electricity-cost", keywords: ["solar", "grid", "energy transition"] },
      { id: "battery-backup-electricity-cost", type: "topic" as const, title: "Battery Backup Electricity Cost", url: "/battery-backup-electricity-cost", keywords: ["battery", "backup", "energy transition"] },
      { id: "business-electricity-cost-decisions", type: "topic" as const, title: "Business Electricity Cost Decisions", url: "/business-electricity-cost-decisions", keywords: ["business", "location", "decisions"] },
      { id: "discovery-graph", type: "discovery" as const, title: "Discovery Graph", url: "/discovery-graph", keywords: ["discovery graph", "topic graph", "knowledge graph"] },
      { id: "data-registry", type: "discovery" as const, title: "Data Registry", url: "/data-registry", keywords: ["data registry", "datasets"] },
      { id: "page-index", type: "discovery" as const, title: "Page Index", url: "/page-index", keywords: ["page index", "navigation"] },
      { id: "site-map", type: "discovery" as const, title: "Site Map", url: "/site-map", keywords: ["site map", "navigation"] },
    ],
    edges: [
      { from: "electricity-cost", to: "electricity-affordability", relationship: "related_topic" },
      { from: "electricity-cost", to: "electricity-inflation", relationship: "related_topic" },
      { from: "electricity-affordability", to: "electricity-cost-of-living", relationship: "related_topic" },
      { from: "electricity-inflation", to: "electricity-price-volatility", relationship: "related_topic" },
      { from: "electricity-cost", to: "electricity-data", relationship: "uses_dataset" },
      { from: "electricity-affordability", to: "methodology", relationship: "explained_by_methodology" },
      { from: "electricity-inflation", to: "methodology", relationship: "explained_by_methodology" },
      { from: "electricity-topics", to: "electricity-cost", relationship: "grouped_in_discovery" },
      { from: "electricity-topics", to: "electricity-inflation", relationship: "grouped_in_discovery" },
      { from: "electricity-topics", to: "ai-energy-demand", relationship: "grouped_in_discovery" },
      { from: "electricity-data", to: "datasets", relationship: "uses_dataset" },
      { from: "entity-registry", to: "electricity-data", relationship: "related_topic" },
      { from: "ai-energy-demand", to: "data-center-electricity-cost", relationship: "related_topic" },
      { from: "ai-energy-demand", to: "grid-capacity-and-electricity-demand", relationship: "related_topic" },
      { from: "power-generation-mix", to: "electricity-markets", relationship: "related_topic" },
      { from: "power-generation-mix", to: "electricity-generation-cost-drivers", relationship: "related_topic" },
      { from: "discovery-graph", to: "entity-registry", relationship: "grouped_in_discovery" },
      { from: "discovery-graph", to: "electricity-topics", relationship: "grouped_in_discovery" },
    ],
  };
  await writeJson("/discovery-graph.json", discoveryGraphBody);

  const contentHashByPath = new Map<string, string>();
  for (const item of indexBody.items) {
    const pathname = item.jsonUrl.startsWith("http")
      ? new URL(item.jsonUrl).pathname
      : item.jsonUrl;
    contentHashByPath.set(pathname, item.contentHash);
  }

  const coreFiles: Array<{ url: string; contentHash?: string }> = [
    "/knowledge/search-index.json",
    "/knowledge/index.json",
    "/knowledge/contract.json",
    "/knowledge/schema-map.json",
    "/knowledge/entity-index.json",
    "/knowledge/provenance.json",
  ]
    .concat(existsSync(makeJsonPath("/knowledge/changelog.json")) ? ["/knowledge/changelog.json"] : [])
    .concat(existsSync(makeJsonPath("/knowledge/regression.json")) ? ["/knowledge/regression.json"] : [])
    .concat(existsSync(makeJsonPath("/knowledge/history/index.json")) ? ["/knowledge/history/index.json"] : [])
    .concat(existsSync(makeJsonPath("/knowledge/labels/en.json")) ? ["/knowledge/labels/en.json"] : [])
    .concat(existsSync(makeJsonPath("/knowledge/policy/disclaimers.json")) ? ["/knowledge/policy/disclaimers.json"] : [])
    .sort((a, b) => a.localeCompare(b))
    .map((url) => ({ url, contentHash: contentHashByPath.get(url) }))
    .map(({ url, contentHash }) => (contentHash ? { url, contentHash } : { url }));

  const bundlesIndexBody: KnowledgeBundlesIndex = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundles: [
      { id: "core", title: "Core knowledge entry points", description: "Small set of primary JSON entry points for ingestion.", manifestUrl: "/knowledge/bundles/core.json" },
      { id: "states-all", title: "All states", description: "All state knowledge pages (50 + DC).", manifestUrl: "/knowledge/bundles/states-all.json" },
      { id: "methodologies", title: "Methodologies", description: "All methodology pages and index.", manifestUrl: "/knowledge/bundles/methodologies.json" },
      { id: "rankings", title: "Rankings", description: "All ranking pages and rankings index.", manifestUrl: "/knowledge/bundles/rankings.json" },
    ].sort((a, b) => a.id.localeCompare(b.id)),
  };

  const coreManifestBody: KnowledgeBundleManifest = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "core",
    files: coreFiles,
  };

  const statePaths = [
    ...normalizedStates.map((s) => `/knowledge/state/${s.slug}.json`),
    "/knowledge/state/district-of-columbia.json",
  ].sort((a, b) => a.localeCompare(b));
  const statesAllManifestBody: KnowledgeBundleManifest = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "states-all",
    files: statePaths.map((url) => {
      const h = contentHashByPath.get(url);
      return h ? { url, contentHash: h } : { url };
    }),
  };

  const methodologyPaths = [
    "/knowledge/methodology/index.json",
    ...methodologyPages.map((m) => {
      const u = m.jsonUrl;
      return u.startsWith("http") ? new URL(u).pathname : u;
    }),
  ]
    .sort((a, b) => a.localeCompare(b));
  const uniqueMethodologyPaths = [...new Set(methodologyPaths)];
  const methodologiesManifestBody: KnowledgeBundleManifest = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "methodologies",
    files: uniqueMethodologyPaths.map((url) => {
      const h = contentHashByPath.get(url);
      return h ? { url, contentHash: h } : { url };
    }),
  };

  const rankingsPaths = [
    "/knowledge/rankings/index.json",
    ...rankingPages.map((r) => `/knowledge/rankings/${r.slug}.json`),
  ].sort((a, b) => a.localeCompare(b));
  const uniqueRankingsPaths = [...new Set(rankingsPaths)];
  const rankingsManifestBody: KnowledgeBundleManifest = {
    schemaVersion: "1.0",
    generatedAt,
    sourceVersion,
    bundleId: "rankings",
    files: uniqueRankingsPaths.map((url) => {
      const h = contentHashByPath.get(url);
      return h ? { url, contentHash: h } : { url };
    }),
  };

  await mkdir(path.join(KNOWLEDGE_ROOT, "bundles"), { recursive: true });
  await writeJson("/knowledge/bundles/index.json", bundlesIndexBody);
  await writeJson("/knowledge/bundles/core.json", coreManifestBody);
  await writeJson("/knowledge/bundles/states-all.json", statesAllManifestBody);
  await writeJson("/knowledge/bundles/methodologies.json", methodologiesManifestBody);
  await writeJson("/knowledge/bundles/rankings.json", rankingsManifestBody);

  durationsMs.writeFiles = bigintToMs(process.hrtime.bigint() - tPhase);
  durationsMs.verifyLocal = 0;
  durationsMs.total = bigintToMs(process.hrtime.bigint() - t0);
  checkBudget("writeFiles", durationsMs.writeFiles);
  checkBudget("total", durationsMs.total);

  const buildProfileBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    budgetsMs: BUDGETS_MS,
    durationsMs,
    notes: "Build-time profiling for knowledge generation.",
  };
  await writeJson("/knowledge/build-profile.json", buildProfileBody);

  const auxGroup = publicEndpointsGroups.find((g) => g.id === "knowledge-aux");
  if (auxGroup) {
    auxGroup.items.push({
      id: "knowledge-integrity-manifest",
      url: "/knowledge/integrity/manifest.json",
      kind: "json",
      description: "Integrity manifest with content hashes for verification.",
    });
    auxGroup.items.sort((a, b) => a.id.localeCompare(b.id));
    await writeJson("/knowledge/public-endpoints.json", {
      ...publicEndpointsBody,
      groups: [...publicEndpointsGroups].sort((a, b) => a.id.localeCompare(b.id)),
    });
  }
  const integrityUrls = new Set<string>();
  for (const g of publicEndpointsGroups) {
    for (const item of g.items) {
      if (item.kind === "json" && item.url.startsWith("/knowledge/")) {
        integrityUrls.add(item.url);
      }
    }
  }
  integrityUrls.add("/knowledge/public-endpoints.json");
  integrityUrls.delete("/knowledge/integrity/manifest.json");
  const integrityFilesList = [...integrityUrls].sort((a, b) => a.localeCompare(b));
  const integrityEntries: Array<{ url: string; contentHash: string; bytes: number }> = [];
  for (const url of integrityFilesList) {
    const outPath = makeJsonPath(url);
    if (!existsSync(outPath)) continue;
    const raw = await readFile(outPath);
    const contentHash = createHash("sha256").update(raw).digest("hex");
    const bytes = raw.length;
    integrityEntries.push({ url, contentHash, bytes });
  }
  const hashInput = { algorithm: "sha256" as const, files: integrityEntries };
  const manifestHash = sha256(serializeDeterministic(hashInput));
  const manifestBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    contractVersion,
    algorithm: "sha256" as const,
    files: integrityEntries,
    manifestHash,
    signature: {
      enabled: false,
      method: null,
      signedBy: null,
      signatureValue: null,
    },
  };
  await mkdir(path.join(KNOWLEDGE_ROOT, "integrity"), { recursive: true });
  await writeJson("/knowledge/integrity/manifest.json", manifestBody);

  // Manifest excludes itself from files (circular hash dependency); it remains in public-endpoints for discovery.
  const manifestHashFinal = sha256(serializeDeterministic({ algorithm: "sha256" as const, files: integrityEntries }));
  await writeJson("/knowledge/integrity/manifest.json", {
    ...manifestBody,
    manifestHash: manifestHashFinal,
  });

  const historyIndexPath = makeJsonPath("/knowledge/history/index.json");
  let historySnapshots = false;
  try {
    const historyRaw = await readFile(historyIndexPath, "utf8");
    const historyParsed = JSON.parse(historyRaw) as { snapshots?: unknown[] };
    historySnapshots = Array.isArray(historyParsed.snapshots) && historyParsed.snapshots.length > 0;
  } catch {
    /* no history */
  }
  const ciGuardrails = existsSync(path.join(process.cwd(), ".github", "workflows", "knowledge-ci.yml"));
  let typeChecks = false;
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkgRaw = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(pkgRaw) as { scripts?: Record<string, string> };
    typeChecks =
      existsSync(path.join(process.cwd(), "scripts", "knowledge-types.js")) &&
      typeof pkg.scripts?.["knowledge:types"] === "string";
  } catch {
    /* no package.json or invalid */
  }

  const capabilitiesBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    contractVersion,
    capabilities: {
      knowledgePages: true,
      searchIndex: true,
      entityIndex: true,
      schemaMap: true,
      provenance: true,
      methodologies: true,
      rankings: true,
      compareStates: true,
      bundles: existsSync(makeJsonPath("/knowledge/bundles/index.json")),
      historySnapshots,
      leaderboards: existsSync(makeJsonPath("/knowledge/leaderboards/states.json")),
      coverageMap: existsSync(makeJsonPath("/knowledge/coverage/states.json")),
      glossary: existsSync(makeJsonPath("/knowledge/glossary/fields.json")),
      labels: existsSync(makeJsonPath("/knowledge/labels/en.json")),
      docs: true,
      dataHub: true,
      ingestStarterPack: existsSync(makeJsonPath("/knowledge/ingest/starter-pack.json")),
      integrityManifest: existsSync(makeJsonPath("/knowledge/integrity/manifest.json")),
      deprecationPolicy: existsSync(makeJsonPath("/knowledge/policy/deprecations.json")),
      disclaimersPolicy: existsSync(makeJsonPath("/knowledge/policy/disclaimers.json")),
      offersPolicy: existsSync(makeJsonPath("/knowledge/policy/offers-config.json")),
      offersEnabled: offersConfig.enabled,
      buildProfile: existsSync(makeJsonPath("/knowledge/build-profile.json")),
      typeChecks,
      ciGuardrails,
    },
    urls: {
      publicEndpointsUrl: "/knowledge/public-endpoints.json",
      indexUrl: "/knowledge/index.json",
      contractUrl: "/knowledge/contract.json",
      docsUrl: "/knowledge/docs",
      dataHubUrl: "/data",
    },
  };
  await writeJson("/knowledge/capabilities.json", capabilitiesBody);

  const coreGroup = publicEndpointsGroups.find((g) => g.id === "knowledge-core");
  if (coreGroup && !coreGroup.items.some((i) => i.id === "knowledge-capabilities")) {
    coreGroup.items.push({
      id: "knowledge-capabilities",
      url: "/knowledge/capabilities.json",
      kind: "json",
      description: "Build-time capabilities descriptor.",
    });
    coreGroup.items.sort((a, b) => a.id.localeCompare(b.id));
    await writeJson("/knowledge/public-endpoints.json", {
      ...publicEndpointsBody,
      groups: [...publicEndpointsGroups].sort((a, b) => a.id.localeCompare(b.id)),
    });
    const integrityUrlsWithCap = new Set(integrityUrls);
    integrityUrlsWithCap.add("/knowledge/capabilities.json");
    const integrityFilesListWithCap = [...integrityUrlsWithCap].sort((a, b) => a.localeCompare(b));
    const integrityEntriesWithCap: Array<{ url: string; contentHash: string; bytes: number }> = [];
    for (const url of integrityFilesListWithCap) {
      const outPath = makeJsonPath(url);
      if (!existsSync(outPath)) continue;
      const raw = await readFile(outPath);
      integrityEntriesWithCap.push({
        url,
        contentHash: createHash("sha256").update(raw).digest("hex"),
        bytes: raw.length,
      });
    }
    const manifestHashWithCap = sha256(serializeDeterministic({ algorithm: "sha256" as const, files: integrityEntriesWithCap }));
    await writeJson("/knowledge/integrity/manifest.json", {
      ...manifestBody,
      files: integrityEntriesWithCap,
      manifestHash: manifestHashWithCap,
    });
  }

  const manifestPath = makeJsonPath("/knowledge/integrity/manifest.json");
  const hasIntegrityManifest = existsSync(manifestPath);

  const releaseCoreGroup = publicEndpointsGroups.find((g) => g.id === "knowledge-core");
  let releaseManifestHash: string | null = null;
  if (releaseCoreGroup && !releaseCoreGroup.items.some((i) => i.id === "knowledge-release")) {
    releaseCoreGroup.items.push({
      id: "knowledge-release",
      url: "/knowledge/release.json",
      kind: "json",
      description: "Release snapshot: pinned endpoints and integrity hash for reproducible ingestion.",
    });
    releaseCoreGroup.items.sort((a, b) => a.id.localeCompare(b.id));
    await writeJson("/knowledge/public-endpoints.json", {
      ...publicEndpointsBody,
      groups: [...publicEndpointsGroups].sort((a, b) => a.id.localeCompare(b.id)),
    });
  }
  if (hasIntegrityManifest) {
    const peRaw = await readFile(makeJsonPath("/knowledge/public-endpoints.json"), "utf8");
    const peParsed = JSON.parse(peRaw) as { groups?: Array<{ items?: Array<{ kind?: string; url?: string }> }> };
    const integrityUrlsWithRelease = new Set<string>();
    for (const g of peParsed.groups ?? []) {
      for (const item of g.items ?? []) {
        if (item.kind === "json" && typeof item.url === "string" && item.url.startsWith("/knowledge/")) {
          integrityUrlsWithRelease.add(item.url);
        }
      }
    }
    integrityUrlsWithRelease.add("/knowledge/public-endpoints.json");
    integrityUrlsWithRelease.delete("/knowledge/integrity/manifest.json");
    integrityUrlsWithRelease.delete("/knowledge/release.json");
    const integrityFilesListWithRelease = [...integrityUrlsWithRelease].sort((a, b) => a.localeCompare(b));
    const integrityEntriesWithRelease: Array<{ url: string; contentHash: string; bytes: number }> = [];
    for (const url of integrityFilesListWithRelease) {
      const outPath = makeJsonPath(url);
      if (!existsSync(outPath)) continue;
      const raw = await readFile(outPath);
      integrityEntriesWithRelease.push({
        url,
        contentHash: createHash("sha256").update(raw).digest("hex"),
        bytes: raw.length,
      });
    }
    releaseManifestHash = sha256(serializeDeterministic({ algorithm: "sha256" as const, files: integrityEntriesWithRelease }));
    await writeJson("/knowledge/integrity/manifest.json", {
      ...manifestBody,
      files: integrityEntriesWithRelease,
      manifestHash: releaseManifestHash,
    });
  }

  const releaseId = `knowledge-v1-${sourceVersion}`;
  const releaseBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    contractVersion,
    releaseId,
    publicEndpointsUrl: "/knowledge/public-endpoints.json",
    integrityManifestUrl: hasIntegrityManifest ? "/knowledge/integrity/manifest.json" : null,
    integrity: {
      algorithm: "sha256" as const,
      manifestHash: releaseManifestHash,
    },
    notes: hasIntegrityManifest
      ? ["This release file pins the public endpoint set and integrity hash for reproducible ingestion."]
      : ["Integrity manifest unavailable. This release pins the public endpoint set only."],
  };
  await writeJson("/knowledge/release.json", releaseBody);

  const fingerprintCoreGroup = publicEndpointsGroups.find((g) => g.id === "knowledge-core");
  if (fingerprintCoreGroup && !fingerprintCoreGroup.items.some((i) => i.id === "knowledge-fingerprint")) {
    fingerprintCoreGroup.items.push({
      id: "knowledge-fingerprint",
      url: "/knowledge/fingerprint.json",
      kind: "json",
      description: "System fingerprint: deterministic hash of core artifacts for build identification.",
    });
    fingerprintCoreGroup.items.sort((a, b) => a.id.localeCompare(b.id));
    await writeJson("/knowledge/public-endpoints.json", {
      ...publicEndpointsBody,
      groups: [...publicEndpointsGroups].sort((a, b) => a.id.localeCompare(b.id)),
    });
    const integrityUrlsForManifest = new Set<string>();
    const peRaw = await readFile(makeJsonPath("/knowledge/public-endpoints.json"), "utf8");
    const peParsed = JSON.parse(peRaw) as { groups?: Array<{ items?: Array<{ kind?: string; url?: string }> }> };
    for (const g of peParsed.groups ?? []) {
      for (const item of g.items ?? []) {
        if (item.kind === "json" && typeof item.url === "string" && item.url.startsWith("/knowledge/")) {
          if (item.url !== "/knowledge/fingerprint.json") {
            integrityUrlsForManifest.add(item.url);
          }
        }
      }
    }
    integrityUrlsForManifest.add("/knowledge/public-endpoints.json");
    integrityUrlsForManifest.delete("/knowledge/integrity/manifest.json");
    integrityUrlsForManifest.delete("/knowledge/release.json");
    const integrityFilesListForManifest = [...integrityUrlsForManifest].sort((a, b) => a.localeCompare(b));
    const integrityEntriesForManifest: Array<{ url: string; contentHash: string; bytes: number }> = [];
    for (const url of integrityFilesListForManifest) {
      const outPath = makeJsonPath(url);
      if (!existsSync(outPath)) continue;
      const raw = await readFile(outPath);
      integrityEntriesForManifest.push({
        url,
        contentHash: createHash("sha256").update(raw).digest("hex"),
        bytes: raw.length,
      });
    }
    const manifestHashUpdated = sha256(serializeDeterministic({ algorithm: "sha256" as const, files: integrityEntriesForManifest }));
    await writeJson("/knowledge/integrity/manifest.json", {
      ...manifestBody,
      files: integrityEntriesForManifest,
      manifestHash: manifestHashUpdated,
    });
    await writeJson("/knowledge/release.json", {
      ...releaseBody,
      integrity: {
        algorithm: "sha256" as const,
        manifestHash: manifestHashUpdated,
      },
    });
  }

  const fingerprintInputs = [
    "/knowledge/release.json",
    "/knowledge/capabilities.json",
    "/knowledge/public-endpoints.json",
    "/knowledge/search-index.json",
    "/knowledge/integrity/manifest.json",
  ] as const;
  let fingerprintHashValue: string | null = null;
  let fingerprintNote: string | undefined;
  const fingerprintParts: string[] = [];
  for (const url of fingerprintInputs) {
    const p = makeJsonPath(url);
    if (existsSync(p)) {
      const raw = await readFile(p, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      fingerprintParts.push(serializeDeterministic(parsed));
    } else if (url === "/knowledge/integrity/manifest.json") {
      fingerprintNote = "Integrity manifest missing; hash omitted.";
    }
  }
  if (fingerprintParts.length === fingerprintInputs.length) {
    fingerprintHashValue = sha256(fingerprintParts.join(""));
  }
  const fingerprintBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    sourceVersion,
    contractVersion,
    releaseId,
    inputs: {
      release: "/knowledge/release.json",
      capabilities: "/knowledge/capabilities.json",
      publicEndpoints: "/knowledge/public-endpoints.json",
      searchIndex: "/knowledge/search-index.json",
      integrityManifest: "/knowledge/integrity/manifest.json",
    },
    hash: {
      algorithm: "sha256" as const,
      value: fingerprintHashValue,
      ...(fingerprintNote ? { note: fingerprintNote } : {}),
    },
  };
  await writeJson("/knowledge/fingerprint.json", fingerprintBody);

  const indexRaw = await readFile(makeJsonPath("/knowledge/index.json"), "utf8");
  const releaseRaw = await readFile(makeJsonPath("/knowledge/release.json"), "utf8");
  const capabilitiesRaw = await readFile(makeJsonPath("/knowledge/capabilities.json"), "utf8");
  const publicEndpointsRaw = await readFile(makeJsonPath("/knowledge/public-endpoints.json"), "utf8");
  const indexKeys = Object.keys(JSON.parse(indexRaw) as object).sort((a, b) => a.localeCompare(b));
  const releaseKeys = Object.keys(JSON.parse(releaseRaw) as object).sort((a, b) => a.localeCompare(b));
  const capabilitiesKeys = Object.keys(JSON.parse(capabilitiesRaw) as object).sort((a, b) => a.localeCompare(b));
  const publicEndpointsKeys = Object.keys(JSON.parse(publicEndpointsRaw) as object).sort((a, b) => a.localeCompare(b));
  const contractSnapshotBody = {
    schemaVersion: "1.0" as const,
    generatedAt,
    contractVersion,
    topLevelKeys: {
      index: indexKeys,
      release: releaseKeys,
      capabilities: capabilitiesKeys,
      publicEndpoints: publicEndpointsKeys,
    },
  };
  await writeJson("/knowledge/contract-snapshot.json", contractSnapshotBody);

  console.log(`Knowledge pages generated: ${pageWrites.length + 1}`);
  console.log(`State JSON files: ${registryStates.length}`);
  console.log(`Source version: ${sourceVersion}`);
  console.log(`Output root: ${KNOWLEDGE_ROOT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
