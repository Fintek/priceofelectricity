import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { buildContentRegistry } from "@/lib/contentRegistry";
import { buildKnowledgePack } from "@/lib/knowledgePack";

export const dynamic = "force-static";
export const revalidate = 86400;

function urlById(pe: { groups: Array<{ items: Array<{ id: string; url: string }> }> }, id: string): string | null {
  for (const g of pe.groups) {
    const item = g.items.find((i) => i.id === id);
    if (item) return item.url;
  }
  return null;
}

export async function GET() {
  const nodes = buildContentRegistry();
  const knowledgePack = buildKnowledgePack();

  let pe: { groups: Array<{ items: Array<{ id: string; url: string }> }> } | null = null;
  try {
    const raw = await readFile(path.join(process.cwd(), "public", "knowledge", "public-endpoints.json"), "utf8");
    pe = JSON.parse(raw);
  } catch {
    /* fallback to defaults */
  }

  const u = (id: string, fallback: string) => (pe ? urlById(pe, id) ?? fallback : fallback);

  const body = {
    schemaVersion: "1.0",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    sourceVersion: knowledgePack.site.dataVersion,
    dataHubUrl: "/data",
    knowledgePublicEndpointsUrl: "/knowledge/public-endpoints.json",
    knowledgeSearchIndex: u("knowledge-search-index", "/knowledge/search-index.json"),
    knowledgeIndex: u("knowledge-index", "/knowledge/index.json"),
    knowledgeIntegrityUrl: "/knowledge/index.json",
    knowledgeContract: u("knowledge-contract", "/knowledge/contract.json"),
    knowledgeLabelsUrl: "/knowledge/labels/en.json",
    knowledgeGlossaryFieldsUrl: u("knowledge-glossary", "/knowledge/glossary/fields.json"),
    knowledgeDocsUrl: u("knowledge-docs", "/knowledge/docs"),
    knowledgeDocsJsonUrl: "/knowledge/docs/index.json",
    knowledgeIngestStarterPackUrl: u("knowledge-ingest-starter", "/knowledge/ingest/starter-pack.json"),
    knowledgeOffersIndexUrl: u("knowledge-offers", "/knowledge/offers/index.json"),
    knowledgeOffersConfigUrl: u("knowledge-offers-config", "/knowledge/policy/offers-config.json"),
    knowledgeDisclaimersUrl: u("knowledge-disclaimers", "/knowledge/policy/disclaimers.json"),
    knowledgeDeprecationsUrl: u("knowledge-deprecations", "/knowledge/policy/deprecations.json"),
    knowledgeIntegrityManifestUrl: u("knowledge-integrity-manifest", "/knowledge/integrity/manifest.json"),
    knowledgeCapabilitiesUrl: u("knowledge-capabilities", "/knowledge/capabilities.json"),
    knowledgeReleaseUrl: u("knowledge-release", "/knowledge/release.json"),
    knowledgeFingerprintUrl: u("knowledge-fingerprint", "/knowledge/fingerprint.json"),
    knowledgeChangelog: "/knowledge/changelog.json",
    knowledgeProvenance: u("knowledge-provenance", "/knowledge/provenance.json"),
    knowledgeSchemaMap: u("knowledge-schema-map", "/knowledge/schema-map.json"),
    knowledgeEntityIndex: "/knowledge/entity-index.json",
    knowledgeMethodologyIndex: "/knowledge/methodology/index.json",
    knowledgeCompareStatesUrl: "/knowledge/compare/states.json",
    knowledgeRankingsIndexUrl: "/knowledge/rankings/index.json",
    knowledgeBundlesIndexUrl: u("knowledge-bundles", "/knowledge/bundles/index.json"),
    knowledgeHistoryBundlesIndexUrl: "/knowledge/history/bundles/index.json",
    knowledgeBuildProfileUrl: "/knowledge/build-profile.json",
    knowledgeLeaderboardsUrl: u("knowledge-leaderboards", "/knowledge/leaderboards/states.json"),
    knowledgeRegression: "/knowledge/regression.json",
    knowledgeRelatedIndexUrl: u("knowledge-related", "/knowledge/related/index.json"),
    freshnessMetadata: "All knowledge pages include meta.freshness (datasetUpdatedAt, status, ageDays, methodology).",
    qualityScoreMetadata: "All knowledge pages include meta.qualityScore (0-100). Index and search-index items include qualityScore.",
    totalNodes: nodes.length,
    nodes,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
