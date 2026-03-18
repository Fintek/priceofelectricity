const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function fail(message) {
  console.error(`knowledge:verify failed - ${message}`);
  process.exit(1);
}

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`missing ${label}: ${filePath}`);
  }
}

function toPublicPath(jsonUrl) {
  if (/^https?:\/\//i.test(jsonUrl)) {
    const parsed = new URL(jsonUrl);
    return parsed.pathname;
  }
  return jsonUrl;
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function stripUndefined(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => stripUndefined(item));
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out;
  }
  return obj;
}

function serializeDeterministic(obj) {
  const cleaned = stripUndefined(obj);
  if (cleaned === null || cleaned === undefined) return JSON.stringify(cleaned);
  if (Array.isArray(cleaned)) {
    return "[" + cleaned.map((item) => serializeDeterministic(item)).join(",") + "]";
  }
  if (typeof cleaned === "object") {
    const keys = Object.keys(cleaned).sort((a, b) => a.localeCompare(b));
    const pairs = keys.map((k) => JSON.stringify(k) + ":" + serializeDeterministic(cleaned[k]));
    return "{" + pairs.join(",") + "}";
  }
  return JSON.stringify(cleaned);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`unable to parse ${label}: ${error.message}`);
  }
}

function getExpectedDeterministicGeneratedAt(sourceVersion) {
  try {
    if (typeof sourceVersion === "string" && sourceVersion.length > 0) {
      const versionPath = path.join(process.cwd(), "src", "data", "snapshots", `${sourceVersion}.json`);
      if (fs.existsSync(versionPath)) {
        const byVersion = readJson(versionPath, `src/data/snapshots/${sourceVersion}.json`);
        if (byVersion && typeof byVersion.releasedAt === "string" && byVersion.releasedAt.length > 0) {
          return byVersion.releasedAt.includes("T")
            ? byVersion.releasedAt
            : `${byVersion.releasedAt}T00:00:00.000Z`;
        }
      }
    }
    const latestSnapshotPath = path.join(process.cwd(), "src", "data", "snapshots", "latest.json");
    if (!fs.existsSync(latestSnapshotPath)) return null;
    const latest = readJson(latestSnapshotPath, "src/data/snapshots/latest.json");
    if (!latest || typeof latest.releasedAt !== "string" || latest.releasedAt.length === 0) return null;
    return latest.releasedAt.includes("T")
      ? latest.releasedAt
      : `${latest.releasedAt}T00:00:00.000Z`;
  } catch {
    return null;
  }
}

function recomputeContentHash(pageObject) {
  if (!pageObject || typeof pageObject !== "object" || !pageObject.meta || typeof pageObject.meta !== "object") {
    return null;
  }
  const { integrity: _i, ...metaWithoutIntegrity } = pageObject.meta;
  void _i;
  const canonical = {
    ...pageObject,
    meta: {
      ...metaWithoutIntegrity,
      contentHash: "",
    },
  };
  return sha256(serializeDeterministic(canonical));
}

function computeQualityScore(meta, data, pageType) {
  let score = 100;
  const f = meta?.freshness;
  if (f?.status === "aging") score -= 10;
  if (f?.status === "stale") score -= 25;
  const prov = meta?.provenance;
  if (!Array.isArray(prov) || prov.length < 1) score -= 10;
  const excerpt = meta?.excerpt;
  if (typeof excerpt !== "string" || excerpt.length < 50) score -= 5;
  const factsRequired = ["state", "national", "rankings"].includes(pageType);
  if (factsRequired) {
    const facts = data?.facts;
    if (!Array.isArray(facts) || facts.length < 5) score -= 5;
  }
  const derived = data?.derived;
  const derivedMeta = data?.derivedMeta;
  if (derived && derivedMeta?.methodologiesUsed) {
    const allAppliesTo = new Set();
    for (const m of derivedMeta.methodologiesUsed) {
      for (const p of m.appliesToFields || []) allAppliesTo.add(p);
    }
    const derivedPaths = [];
    function collectPaths(obj, prefix) {
      if (!obj || typeof obj !== "object") return;
      for (const k of Object.keys(obj)) {
        const p = prefix ? `${prefix}.${k}` : k;
        const v = obj[k];
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
      let covered = allAppliesTo.has(fullPath);
      if (!covered) {
        const parts = fullPath.split(".");
        for (let i = 1; i <= parts.length; i++) {
          if (allAppliesTo.has(parts.slice(0, i).join("."))) {
            covered = true;
            break;
          }
        }
      }
      return !covered;
    });
    if (uncovered.length > 0) score -= 15;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

const STATE_REQUIRED_FIELDS = {
  meta: [
    "schemaVersion", "id", "type", "slug", "title", "description",
    "canonicalUrl", "jsonUrl", "updatedAt", "sourceVersion", "temporalContext",
    "contentHash", "provenance", "fieldProvenance", "citations", "llmHints",
    "freshness", "excerpt", "qualityScore", "integrity",
  ],
  dataRaw: ["slug", "name", "postal", "avgRateCentsPerKwh", "updated"],
  dataDerived: ["valueScore", "affordabilityIndex", "freshnessStatus", "exampleBills", "relatedUrls", "percentileRankings", "comparison", "momentum"],
  dataTop: ["raw", "derived", "derivedMeta", "relatedEntities", "facts"],
};
const NATIONAL_REQUIRED_FIELDS = {
  meta: STATE_REQUIRED_FIELDS.meta,
  dataRaw: ["stateCount", "datasetUpdatedAt"],
  dataDerived: ["averageRate", "medianRate", "dispersionMetrics", "highestState", "lowestState", "top5Highest", "top5Lowest"],
  dataTop: ["raw", "derived", "derivedMeta", "relatedEntities", "facts"],
};
const RANKING_REQUIRED_FIELDS = {
  meta: STATE_REQUIRED_FIELDS.meta,
  dataTop: ["rankingType", "sortedStates", "generatedAt", "derivedMeta", "relatedEntities", "facts"],
};
const METHODOLOGY_REQUIRED_FIELDS = {
  meta: [...STATE_REQUIRED_FIELDS.meta, "methodology"],
  dataTop: ["definition", "inputs", "steps", "limitations", "relatedInternalUrls", "relatedEntities"],
};
const VERTICAL_REQUIRED_FIELDS = {
  meta: STATE_REQUIRED_FIELDS.meta,
  dataTop: ["status", "summary", "keyThemes", "relatedStates", "relatedRankings", "relatedMethodologies", "monitoringEndpoints", "expansionReadiness", "relatedEntities"],
};

function getAtPath(obj, pathStr) {
  const parts = pathStr.replace(/\.0\./g, ".0.").split(".");
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function checkFacts(page, item, typeLabel) {
  const facts = page.data?.facts;
  if (!Array.isArray(facts)) {
    fail(`${typeLabel} page missing data.facts: ${item.jsonUrl}`);
  }
  if (facts.length < 5 || facts.length > 12) {
    fail(`${typeLabel} page data.facts must have 5-12 items: ${item.jsonUrl} (got ${facts.length})`);
  }
  const fullPage = { meta: page.meta, data: page.data };
  for (const fact of facts) {
    if (typeof fact.label !== "string") {
      fail(`${typeLabel} page fact missing label: ${item.jsonUrl}`);
    }
    if (fact.value === undefined) {
      fail(`${typeLabel} page fact missing value: ${item.jsonUrl} (${fact.label})`);
    }
    if (typeof fact.sourceField !== "string") {
      fail(`${typeLabel} page fact missing sourceField: ${item.jsonUrl} (${fact.label})`);
    }
    let pathVal;
    if (fact.sourceField.startsWith("meta.")) {
      pathVal = getAtPath(page.meta, fact.sourceField.replace(/^meta\./, ""));
    } else {
      pathVal = getAtPath(fullPage, fact.sourceField);
    }
    if (pathVal === undefined) {
      fail(`${typeLabel} page fact sourceField path not found: ${item.jsonUrl} -> ${fact.sourceField}`);
    }
  }
}

function checkRequiredFields(page, item, required, typeLabel) {
  if (!page.meta || typeof page.meta !== "object") {
    fail(`${typeLabel} page missing meta: ${item.jsonUrl}`);
  }
  if (page.meta.schemaVersion !== "1.0") {
    fail(`${typeLabel} page meta.schemaVersion must be "1.0": ${item.jsonUrl}`);
  }
  if (typeof page.meta.excerpt !== "string") {
    fail(`${typeLabel} page missing meta.excerpt: ${item.jsonUrl}`);
  }
  if (page.meta.excerpt.length > 280) {
    fail(`${typeLabel} page meta.excerpt exceeds 280 chars: ${item.jsonUrl}`);
  }
  if (/\{[^}]*\}/.test(page.meta.excerpt)) {
    fail(`${typeLabel} page meta.excerpt contains placeholder: ${item.jsonUrl}`);
  }
  for (const f of required.meta) {
    if (!Object.prototype.hasOwnProperty.call(page.meta, f)) {
      fail(`${typeLabel} page missing meta.${f}: ${item.jsonUrl}`);
    }
  }
  if (!page.data || typeof page.data !== "object") {
    fail(`${typeLabel} page missing data: ${item.jsonUrl}`);
  }
  for (const f of required.dataTop) {
    if (!Object.prototype.hasOwnProperty.call(page.data, f)) {
      fail(`${typeLabel} page missing data.${f}: ${item.jsonUrl}`);
    }
  }
  if (required.dataRaw && page.data.raw) {
    for (const f of required.dataRaw) {
      if (!Object.prototype.hasOwnProperty.call(page.data.raw, f)) {
        fail(`${typeLabel} page missing data.raw.${f}: ${item.jsonUrl}`);
      }
    }
  }
  if (required.dataDerived && page.data.derived) {
    for (const f of required.dataDerived) {
      if (!Object.prototype.hasOwnProperty.call(page.data.derived, f)) {
        fail(`${typeLabel} page missing data.derived.${f}: ${item.jsonUrl}`);
      }
    }
  }
}

function runIntegrityOnly() {
  const root = path.resolve(process.cwd(), "public", "knowledge");
  const indexPath = path.join(root, "index.json");
  ensureFileExists(indexPath, "index.json");
  const index = readJson(indexPath, "index.json");
  if (!index || !Array.isArray(index.items)) {
    fail("index.json missing items array");
  }
  if (typeof index.integritySignature !== "string" || index.integritySignature.length === 0) {
    fail("index.json missing integritySignature");
  }
  if (typeof index.registryHash !== "string" || index.registryHash.length === 0) {
    fail("index.json missing registryHash");
  }
  const typeOrder = { national: 0, state: 1, methodology: 2, rankings: 3, vertical: 4 };
  const sortedItems = [...index.items].sort((a, b) => {
    const to = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
    if (to !== 0) return to;
    return String(a.slug ?? a.id).localeCompare(String(b.slug ?? b.id));
  });
  const computedRegistryHash = sha256(serializeDeterministic(sortedItems));
  if (computedRegistryHash !== index.registryHash) {
    fail("registryHash mismatch in index.json");
  }
  const contentHashesById = [...index.items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => item.contentHash)
    .join("|");
  const computedIntegritySignature = sha256(contentHashesById);
  if (computedIntegritySignature !== index.integritySignature) {
    fail("integritySignature mismatch in index.json");
  }
  const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;
  for (const item of index.items) {
    const publicRelative = toPublicPath(item.jsonUrl);
    const localPath = path.join(process.cwd(), "public", publicRelative.replace(/^\/+/, ""));
    if (!fs.existsSync(localPath)) {
      fail(`registry item references missing file: ${item.jsonUrl}`);
    }
    const page = readJson(localPath, item.jsonUrl);
    const computedHash = recomputeContentHash(page);
    if (!computedHash) {
      fail(`unable to compute contentHash: ${item.jsonUrl}`);
    }
    if (computedHash !== page.meta.contentHash) {
      fail(`contentHash mismatch for ${item.jsonUrl}`);
    }
    const integrity = page.meta.integrity;
    if (!integrity || typeof integrity !== "object") {
      fail(`knowledge page missing meta.integrity: ${item.jsonUrl}`);
    }
    if (integrity.integrityAlgorithm !== "sha256") {
      fail(`knowledge page meta.integrity.integrityAlgorithm must be "sha256": ${item.jsonUrl}`);
    }
    if (typeof integrity.signedAtBuild !== "string" || integrity.signedAtBuild.length === 0) {
      fail(`knowledge page missing meta.integrity.signedAtBuild: ${item.jsonUrl}`);
    }
    if (!isoRe.test(integrity.signedAtBuild)) {
      fail(`knowledge page meta.integrity.signedAtBuild must be valid ISO: ${item.jsonUrl}`);
    }
    if (integrity.contentHash !== page.meta.contentHash) {
      fail(`knowledge page meta.integrity.contentHash mismatch: ${item.jsonUrl}`);
    }
  }
  console.log("knowledge:integrity passed");
  console.log(`integritySignature: ${index.integritySignature}`);
  console.log(`registryHash: ${index.registryHash}`);
}

function main() {
  const releaseMode = process.env.RELEASE_MODE === "1";
  const verifyScriptPath = path.join(process.cwd(), "scripts", "verify-knowledge.js");
  const verifyScriptSource = fs.readFileSync(verifyScriptPath, "utf8");
  if (!verifyScriptSource.includes("RELEASE_MODE")) {
    fail("verify-knowledge.js must contain RELEASE_MODE logic");
  }
  if (releaseMode) {
    console.log("RELEASE_MODE: ON");
  } else {
    console.log("RELEASE_MODE: OFF");
  }

  const integrityOnly = process.argv.includes("--integrity-only");
  if (integrityOnly) {
    runIntegrityOnly();
    return;
  }
  const root = path.resolve(process.cwd(), "public", "knowledge");
  const graphPath = path.resolve(process.cwd(), "public", "graph.json");
  const historyRoot = path.join(root, "history");
  const historyIndexPath = path.join(historyRoot, "index.json");
  const indexPath = path.join(root, "index.json");
  const nationalPath = path.join(root, "national.json");
  const contractPath = path.join(root, "contract.json");
  const changelogPath = path.join(root, "changelog.json");
  const provenancePath = path.join(root, "provenance.json");
  const schemaMapPath = path.join(root, "schema-map.json");
  const entityIndexPath = path.join(root, "entity-index.json");
  const stateDir = path.join(root, "state");

  ensureFileExists(indexPath, "index.json");
  ensureFileExists(nationalPath, "national.json");
  ensureFileExists(contractPath, "contract.json");
  ensureFileExists(changelogPath, "changelog.json");
  ensureFileExists(provenancePath, "provenance.json");
  ensureFileExists(schemaMapPath, "schema-map.json");
  ensureFileExists(entityIndexPath, "entity-index.json");
  ensureFileExists(path.join(root, "search-index.json"), "search-index.json");
  ensureFileExists(path.join(root, "regression.json"), "regression.json");
  const labelsPath = path.join(root, "labels", "en.json");
  ensureFileExists(labelsPath, "labels/en.json");
  ensureFileExists(historyIndexPath, "history/index.json");
  ensureFileExists(path.join(root, "compare", "states.json"), "compare/states.json");
  ensureFileExists(path.join(root, "compare", "pairs.json"), "compare/pairs.json");
  const pairsPath = path.join(root, "compare", "pairs.json");
  const pairsData = readJson(pairsPath, "compare/pairs.json");
  if (!Array.isArray(pairsData.pairs) || pairsData.pairs.length < 1) {
    fail("compare/pairs.json must have at least 1 pair");
  }
  let pairCount = 0;
  for (const pairSlug of pairsData.pairs) {
    const pairPath = path.join(root, "compare", `${pairSlug}.json`);
    ensureFileExists(pairPath, `compare/${pairSlug}.json`);
    const pairPage = readJson(pairPath, `compare/${pairSlug}.json`);
    if (typeof pairPage.differencePercent !== "number") {
      fail(`compare/${pairSlug}.json differencePercent must be numeric`);
    }
    pairCount++;
  }
  if (pairCount < 1) {
    fail("at least 1 comparison JSON must exist");
  }
  ensureFileExists(path.join(root, "regions", "index.json"), "regions/index.json");
  const regionsIndex = readJson(path.join(root, "regions", "index.json"), "regions/index.json");
  if (!regionsIndex || !Array.isArray(regionsIndex.regions)) {
    fail("regions/index.json must have regions array");
  }
  const requiredRegionIds = ["northeast", "midwest", "south", "west"];
  for (const rid of requiredRegionIds) {
    const regionPath = path.join(root, "regions", `${rid}.json`);
    ensureFileExists(regionPath, `regions/${rid}.json`);
    const regionPage = readJson(regionPath, `regions/${rid}.json`);
    const indexEntry = regionsIndex.regions.find((r) => r.id === rid);
    if (!indexEntry) fail(`regions/index.json missing region ${rid}`);
    if (indexEntry.enabled === true) {
      if (typeof regionPage.stateCount !== "number" || regionPage.stateCount < 2) {
        fail(`regions/${rid}.json enabled region must have stateCount >= 2`);
      }
      if (typeof regionPage.averageRateCentsPerKwh !== "number") {
        fail(`regions/${rid}.json averageRateCentsPerKwh must be numeric`);
      }
      if (typeof regionPage.medianRateCentsPerKwh !== "number") {
        fail(`regions/${rid}.json medianRateCentsPerKwh must be numeric`);
      }
      if (!Array.isArray(regionPage.top5Highest) || !Array.isArray(regionPage.top5Lowest)) {
        fail(`regions/${rid}.json must have top5Highest and top5Lowest arrays`);
      }
    }
  }
  const unknownEntry = regionsIndex.regions.find((r) => r.id === "unknown");
  if (unknownEntry) {
    if (unknownEntry.enabled !== false) {
      fail("regions/index.json unknown region must have enabled=false");
    }
    const unknownPath = path.join(root, "regions", "unknown.json");
    if (fs.existsSync(unknownPath)) {
      const unknownPage = readJson(unknownPath, "regions/unknown.json");
      const ex = (unknownPage.excerpt || "").toLowerCase();
      if (!ex.includes("mapping") && !ex.includes("incomplete") && !ex.includes("unknown")) {
        fail("regions/unknown.json excerpt must mention mapping incomplete or unknown region");
      }
    }
  }
  const glossaryPath = path.join(root, "glossary", "fields.json");
  ensureFileExists(glossaryPath, "glossary/fields.json");
  const docsJsonPath = path.join(root, "docs", "index.json");
  ensureFileExists(docsJsonPath, "docs/index.json");
  const offersIndexPath = path.join(root, "offers", "index.json");
  ensureFileExists(offersIndexPath, "offers/index.json");
  const disclaimersPath = path.join(root, "policy", "disclaimers.json");
  ensureFileExists(disclaimersPath, "policy/disclaimers.json");
  const offersConfigPath = path.join(root, "policy", "offers-config.json");
  ensureFileExists(offersConfigPath, "policy/offers-config.json");

  const insightsDir = path.join(root, "insights");
  if (!fs.existsSync(insightsDir) || !fs.statSync(insightsDir).isDirectory()) {
    fail("insights folder must exist");
  }
  const insightsNationalPath = path.join(root, "insights", "national.json");
  ensureFileExists(insightsNationalPath, "insights/national.json");

  const robotsPath = path.join(process.cwd(), "public", "robots.txt");
  if (!fs.existsSync(robotsPath)) {
    fail("public/robots.txt missing");
  }
  const robotsContent = fs.readFileSync(robotsPath, "utf8");
  const robotsAllows = [
    "/knowledge/index.json",
    "/knowledge/search-index.json",
    "/knowledge/contract.json",
    "/data",
  ];
  for (const allow of robotsAllows) {
    if (!robotsContent.includes(`Allow: ${allow}`) && !robotsContent.includes(`Allow:${allow}`)) {
      fail(`robots.txt must Allow: ${allow}`);
    }
  }
  if (/Disallow:\s*\/knowledge\/\s*$/m.test(robotsContent)) {
    fail("robots.txt must not contain blanket Disallow: /knowledge/ (too broad)");
  }
  const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
  ensureFileExists(sitemapPath, "sitemap.ts");
  const robotsTsPath = path.join(process.cwd(), "src", "app", "robots.ts");
  ensureFileExists(robotsTsPath, "robots.ts");
  const sitemapSource = fs.readFileSync(sitemapPath, "utf8");
  if (!sitemapSource.includes("/data")) {
    fail("sitemap must include /data");
  }
  if (!sitemapSource.includes("/knowledge/pages") && !sitemapSource.includes("/knowledge/national") && !sitemapSource.includes("/knowledge/state/")) {
    fail("sitemap must include at least one knowledge human page route");
  }
  if (!sitemapSource.includes("/knowledge/bundles/index.json")) {
    fail("sitemap must include /knowledge/bundles/index.json");
  }
  if (!sitemapSource.includes("/knowledge/glossary/fields.json")) {
    fail("sitemap must include /knowledge/glossary/fields.json");
  }
  if (!sitemapSource.includes("/knowledge/history/bundles/index.json")) {
    fail("sitemap must include /knowledge/history/bundles/index.json");
  }
  if (!sitemapSource.includes("/knowledge/ingest/starter-pack.json")) {
    fail("sitemap must include /knowledge/ingest/starter-pack.json");
  }
  if (!sitemapSource.includes("/knowledge/public-endpoints.json")) {
    fail("sitemap must include /knowledge/public-endpoints.json");
  }
  if (!sitemapSource.includes("/knowledge/integrity/manifest.json")) {
    fail("sitemap must include /knowledge/integrity/manifest.json");
  }
  if (!sitemapSource.includes("/knowledge/policy/offers-config.json")) {
    fail("sitemap must include /knowledge/policy/offers-config.json");
  }
  if (!sitemapSource.includes("/knowledge/capabilities.json")) {
    fail("sitemap must include /knowledge/capabilities.json");
  }
  if (!sitemapSource.includes("/knowledge/release.json")) {
    fail("sitemap must include /knowledge/release.json");
  }
  if (!sitemapSource.includes("/knowledge/fingerprint.json")) {
    fail("sitemap must include /knowledge/fingerprint.json");
  }
  if (!sitemapSource.includes("/knowledge/related/index.json")) {
    fail("sitemap must include /knowledge/related/index.json");
  }
  if (!sitemapSource.includes("/knowledge")) {
    fail("sitemap must include /knowledge");
  }

  const knowledgeHomePath = path.join(process.cwd(), "src", "app", "knowledge", "page.tsx");
  ensureFileExists(knowledgeHomePath, "knowledge home page");

  const electricityCostIndexPath = path.join(process.cwd(), "src", "app", "electricity-cost", "page.tsx");
  ensureFileExists(electricityCostIndexPath, "electricity-cost index page");
  const electricityCostSlugPath = path.join(process.cwd(), "src", "app", "electricity-cost", "[slug]", "page.tsx");
  ensureFileExists(electricityCostSlugPath, "electricity-cost [slug] page");
  if (!sitemapSource.includes("electricity-cost")) {
    fail("sitemap must include electricity-cost routes");
  }
  const averageElectricityBillIndexPath = path.join(process.cwd(), "src", "app", "average-electricity-bill", "page.tsx");
  ensureFileExists(averageElectricityBillIndexPath, "average-electricity-bill index page");
  const averageElectricityBillSlugPath = path.join(process.cwd(), "src", "app", "average-electricity-bill", "[slug]", "page.tsx");
  ensureFileExists(averageElectricityBillSlugPath, "average-electricity-bill [slug] page");
  if (!sitemapSource.includes("average-electricity-bill")) {
    fail("sitemap must include average-electricity-bill routes");
  }
  const electricityBillEstimatorIndexPath = path.join(process.cwd(), "src", "app", "electricity-bill-estimator", "page.tsx");
  ensureFileExists(electricityBillEstimatorIndexPath, "electricity-bill-estimator index page");
  const electricityBillEstimatorSlugPath = path.join(process.cwd(), "src", "app", "electricity-bill-estimator", "[slug]", "page.tsx");
  ensureFileExists(electricityBillEstimatorSlugPath, "electricity-bill-estimator [slug] page");
  const electricityBillEstimatorProfilePath = path.join(process.cwd(), "src", "app", "electricity-bill-estimator", "[slug]", "[profile]", "page.tsx");
  ensureFileExists(electricityBillEstimatorProfilePath, "electricity-bill-estimator [slug]/[profile] page");
  if (!sitemapSource.includes("electricity-bill-estimator")) {
    fail("sitemap must include electricity-bill-estimator routes");
  }
  const energyComparisonHubPath = path.join(process.cwd(), "src", "app", "energy-comparison", "page.tsx");
  ensureFileExists(energyComparisonHubPath, "energy-comparison page");
  const energyComparisonStatesPath = path.join(process.cwd(), "src", "app", "energy-comparison", "states", "page.tsx");
  ensureFileExists(energyComparisonStatesPath, "energy-comparison states page");
  const energyComparisonUsagePath = path.join(process.cwd(), "src", "app", "energy-comparison", "usage", "page.tsx");
  ensureFileExists(energyComparisonUsagePath, "energy-comparison usage page");
  const energyComparisonAppliancesPath = path.join(process.cwd(), "src", "app", "energy-comparison", "appliances", "page.tsx");
  ensureFileExists(energyComparisonAppliancesPath, "energy-comparison appliances page");
  if (!sitemapSource.includes("energy-comparison")) {
    fail("sitemap must include energy-comparison routes");
  }
  const movingToElectricityCostIndexPath = path.join(process.cwd(), "src", "app", "moving-to-electricity-cost", "page.tsx");
  ensureFileExists(movingToElectricityCostIndexPath, "moving-to-electricity-cost index page");
  const movingToElectricityCostSlugPath = path.join(process.cwd(), "src", "app", "moving-to-electricity-cost", "[slug]", "page.tsx");
  ensureFileExists(movingToElectricityCostSlugPath, "moving-to-electricity-cost [slug] page");
  if (!sitemapSource.includes("moving-to-electricity-cost")) {
    fail("sitemap must include moving-to-electricity-cost routes");
  }
  const electricityCostCalculatorIndexPath = path.join(process.cwd(), "src", "app", "electricity-cost-calculator", "page.tsx");
  ensureFileExists(electricityCostCalculatorIndexPath, "electricity-cost-calculator index page");
  const electricityCostCalculatorSlugPath = path.join(process.cwd(), "src", "app", "electricity-cost-calculator", "[slug]", "page.tsx");
  ensureFileExists(electricityCostCalculatorSlugPath, "electricity-cost-calculator [slug] page");
  if (!sitemapSource.includes("electricity-cost-calculator")) {
    fail("sitemap must include electricity-cost-calculator routes");
  }
  const electricityPriceHistoryIndexPath = path.join(process.cwd(), "src", "app", "electricity-price-history", "page.tsx");
  ensureFileExists(electricityPriceHistoryIndexPath, "electricity-price-history index page");
  const electricityPriceHistorySlugPath = path.join(process.cwd(), "src", "app", "electricity-price-history", "[slug]", "page.tsx");
  ensureFileExists(electricityPriceHistorySlugPath, "electricity-price-history [slug] page");
  if (!sitemapSource.includes("electricity-price-history")) {
    fail("sitemap must include electricity-price-history routes");
  }
  const batteryRechargeCostIndexPath = path.join(process.cwd(), "src", "app", "battery-recharge-cost", "page.tsx");
  ensureFileExists(batteryRechargeCostIndexPath, "battery-recharge-cost index page");
  const batteryRechargeCostSlugPath = path.join(process.cwd(), "src", "app", "battery-recharge-cost", "[slug]", "page.tsx");
  ensureFileExists(batteryRechargeCostSlugPath, "battery-recharge-cost [slug] page");
  if (!sitemapSource.includes("battery-recharge-cost")) {
    fail("sitemap must include battery-recharge-cost routes");
  }
  const generatorVsBatteryCostIndexPath = path.join(process.cwd(), "src", "app", "generator-vs-battery-cost", "page.tsx");
  ensureFileExists(generatorVsBatteryCostIndexPath, "generator-vs-battery-cost index page");
  const generatorVsBatteryCostSlugPath = path.join(process.cwd(), "src", "app", "generator-vs-battery-cost", "[slug]", "page.tsx");
  ensureFileExists(generatorVsBatteryCostSlugPath, "generator-vs-battery-cost [slug] page");
  if (!sitemapSource.includes("generator-vs-battery-cost")) {
    fail("sitemap must include generator-vs-battery-cost routes");
  }
  const electricityCostComparisonIndexPath = path.join(process.cwd(), "src", "app", "electricity-cost-comparison", "page.tsx");
  ensureFileExists(electricityCostComparisonIndexPath, "electricity-cost-comparison index page");
  const electricityCostComparisonPairPath = path.join(process.cwd(), "src", "app", "electricity-cost-comparison", "[pair]", "page.tsx");
  ensureFileExists(electricityCostComparisonPairPath, "electricity-cost-comparison [pair] page");
  if (!sitemapSource.includes("electricity-cost-comparison")) {
    fail("sitemap must include electricity-cost-comparison routes");
  }
  const electricityTrendsPath = path.join(process.cwd(), "src", "app", "electricity-trends", "page.tsx");
  ensureFileExists(electricityTrendsPath, "electricity-trends page");
  if (!sitemapSource.includes("electricity-trends")) {
    fail("sitemap must include electricity-trends route");
  }
  const electricityTopicsPath = path.join(process.cwd(), "src", "app", "electricity-topics", "page.tsx");
  ensureFileExists(electricityTopicsPath, "electricity-topics page");
  if (!sitemapSource.includes("electricity-topics")) {
    fail("sitemap must include electricity-topics route");
  }
  const electricityInsightsPath = path.join(process.cwd(), "src", "app", "electricity-insights", "page.tsx");
  ensureFileExists(electricityInsightsPath, "electricity-insights page");
  if (!sitemapSource.includes("electricity-insights")) {
    fail("sitemap must include electricity-insights route");
  }
  const aiEnergyDemandPath = path.join(process.cwd(), "src", "app", "ai-energy-demand", "page.tsx");
  ensureFileExists(aiEnergyDemandPath, "ai-energy-demand page");
  const aiEnergyDemandDataCentersPath = path.join(process.cwd(), "src", "app", "ai-energy-demand", "data-centers-electricity", "page.tsx");
  ensureFileExists(aiEnergyDemandDataCentersPath, "ai-energy-demand data-centers-electricity page");
  const aiEnergyDemandAIPowerPath = path.join(process.cwd(), "src", "app", "ai-energy-demand", "ai-power-consumption", "page.tsx");
  ensureFileExists(aiEnergyDemandAIPowerPath, "ai-energy-demand ai-power-consumption page");
  const aiEnergyDemandElectricityPricesPath = path.join(process.cwd(), "src", "app", "ai-energy-demand", "electricity-prices-and-ai", "page.tsx");
  ensureFileExists(aiEnergyDemandElectricityPricesPath, "ai-energy-demand electricity-prices-and-ai page");
  const aiEnergyDemandGridStrainPath = path.join(process.cwd(), "src", "app", "ai-energy-demand", "grid-strain-and-electricity-costs", "page.tsx");
  ensureFileExists(aiEnergyDemandGridStrainPath, "ai-energy-demand grid-strain-and-electricity-costs page");
  if (!sitemapSource.includes("ai-energy-demand")) {
    fail("sitemap must include ai-energy-demand routes");
  }

  const methodologyHubPath = path.join(process.cwd(), "src", "app", "methodology", "page.tsx");
  ensureFileExists(methodologyHubPath, "methodology hub page");
  const methodologyElectricityRatesPath = path.join(process.cwd(), "src", "app", "methodology", "electricity-rates", "page.tsx");
  ensureFileExists(methodologyElectricityRatesPath, "methodology electricity-rates page");
  const methodologyElectricityInflationPath = path.join(process.cwd(), "src", "app", "methodology", "electricity-inflation", "page.tsx");
  ensureFileExists(methodologyElectricityInflationPath, "methodology electricity-inflation page");
  const methodologyElectricityAffordabilityPath = path.join(process.cwd(), "src", "app", "methodology", "electricity-affordability", "page.tsx");
  ensureFileExists(methodologyElectricityAffordabilityPath, "methodology electricity-affordability page");
  const methodologyBatteryRechargeCostPath = path.join(process.cwd(), "src", "app", "methodology", "battery-recharge-cost", "page.tsx");
  ensureFileExists(methodologyBatteryRechargeCostPath, "methodology battery-recharge-cost page");
  const methodologyGeneratorVsBatteryPath = path.join(process.cwd(), "src", "app", "methodology", "generator-vs-battery-cost", "page.tsx");
  ensureFileExists(methodologyGeneratorVsBatteryPath, "methodology generator-vs-battery-cost page");
  const methodologySitemapRoutes = [
    "/methodology/electricity-rates",
    "/methodology/electricity-inflation",
    "/methodology/electricity-affordability",
    "/methodology/battery-recharge-cost",
    "/methodology/generator-vs-battery-cost",
  ];
  for (const route of methodologySitemapRoutes) {
    if (!sitemapSource.includes(route)) {
      fail(`sitemap must include ${route}`);
    }
  }

  const datasetsHubPath = path.join(process.cwd(), "src", "app", "datasets", "page.tsx");
  ensureFileExists(datasetsHubPath, "datasets hub page");
  const datasetsPricesByStatePath = path.join(process.cwd(), "src", "app", "datasets", "electricity-prices-by-state", "page.tsx");
  ensureFileExists(datasetsPricesByStatePath, "datasets electricity-prices-by-state page");
  const datasetsRankingsPath = path.join(process.cwd(), "src", "app", "datasets", "electricity-rankings", "page.tsx");
  ensureFileExists(datasetsRankingsPath, "datasets electricity-rankings page");
  const datasetsDir = path.join(process.cwd(), "public", "datasets");
  const datasetsPricesJsonPath = path.join(datasetsDir, "electricity-prices-by-state.json");
  const datasetsPricesCsvPath = path.join(datasetsDir, "electricity-prices-by-state.csv");
  const datasetsRankingsJsonPath = path.join(datasetsDir, "electricity-rankings.json");
  const datasetsRankingsCsvPath = path.join(datasetsDir, "electricity-rankings.csv");
  if (!fs.existsSync(datasetsPricesJsonPath)) {
    fail("public/datasets/electricity-prices-by-state.json must exist (run knowledge:build)");
  }
  if (!fs.existsSync(datasetsPricesCsvPath)) {
    fail("public/datasets/electricity-prices-by-state.csv must exist (run knowledge:build)");
  }
  if (!fs.existsSync(datasetsRankingsJsonPath)) {
    fail("public/datasets/electricity-rankings.json must exist (run knowledge:build)");
  }
  if (!fs.existsSync(datasetsRankingsCsvPath)) {
    fail("public/datasets/electricity-rankings.csv must exist (run knowledge:build)");
  }
  const datasetsSitemapRoutes = ["/datasets", "/datasets/electricity-prices-by-state", "/datasets/electricity-rankings"];
  for (const route of datasetsSitemapRoutes) {
    if (!sitemapSource.includes(route)) {
      fail(`sitemap must include ${route}`);
    }
  }

  const siteMapPath = path.join(process.cwd(), "src", "app", "site-map", "page.tsx");
  ensureFileExists(siteMapPath, "site-map page");
  const dataRegistryPath = path.join(process.cwd(), "src", "app", "data-registry", "page.tsx");
  ensureFileExists(dataRegistryPath, "data-registry page");
  const pageIndexPath = path.join(process.cwd(), "src", "app", "page-index", "page.tsx");
  ensureFileExists(pageIndexPath, "page-index page");
  const discoverySitemapRoutes = ["/site-map", "/data-registry", "/page-index"];
  for (const route of discoverySitemapRoutes) {
    if (!sitemapSource.includes(route)) {
      fail(`sitemap must include ${route}`);
    }
  }

  const disclaimerBlockPath = path.join(process.cwd(), "src", "components", "policy", "DisclaimerBlock.tsx");
  ensureFileExists(disclaimerBlockPath, "DisclaimerBlock.tsx");

  const buildStampPath = path.join(process.cwd(), "src", "components", "common", "BuildStamp.tsx");
  ensureFileExists(buildStampPath, "BuildStamp.tsx");

  const knowledgeNotFoundPath = path.join(process.cwd(), "src", "components", "knowledge", "KnowledgeNotFound.tsx");
  ensureFileExists(knowledgeNotFoundPath, "KnowledgeNotFound.tsx");

  const skeletonPath = path.join(process.cwd(), "src", "components", "common", "Skeleton.tsx");
  ensureFileExists(skeletonPath, "Skeleton.tsx");

  const commandPalettePath = path.join(process.cwd(), "src", "components", "common", "CommandPalette.tsx");
  ensureFileExists(commandPalettePath, "CommandPalette.tsx");
  const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
  const layoutSource = fs.readFileSync(layoutPath, "utf8");
  const hasCommandPalette = layoutSource.includes("CommandPalette") || layoutSource.includes("Ctrl+K");
  if (!hasCommandPalette) {
    fail("layout must import CommandPalette or contain Ctrl+K (command palette wiring)");
  }
  if (!layoutSource.includes("schema.org") || !layoutSource.includes("WebSite") || !layoutSource.includes("Organization")) {
    fail("layout must include WebSite and Organization JSON-LD schema blocks");
  }

  const exploreMorePath = path.join(process.cwd(), "src", "components", "navigation", "ExploreMore.tsx");
  ensureFileExists(exploreMorePath, "ExploreMore.tsx");
  const sectionNavPath = path.join(process.cwd(), "src", "components", "navigation", "SectionNav.tsx");
  ensureFileExists(sectionNavPath, "SectionNav.tsx");
  const exploreMoreTemplates = [
    path.join(process.cwd(), "src", "app", "knowledge", "page.tsx"),
    path.join(process.cwd(), "src", "app", "electricity-trends", "page.tsx"),
    path.join(process.cwd(), "src", "app", "electricity-insights", "page.tsx"),
    path.join(process.cwd(), "src", "app", "electricity-cost", "[slug]", "page.tsx"),
    path.join(process.cwd(), "src", "app", "knowledge", "rankings", "[id]", "page.tsx"),
  ];
  for (const tp of exploreMoreTemplates) {
    const src = fs.readFileSync(tp, "utf8");
    if (!src.includes("ExploreMore")) {
      fail(`${path.relative(process.cwd(), tp)} must include ExploreMore`);
    }
  }
  const sectionNavTemplates = [
    path.join(process.cwd(), "src", "app", "knowledge", "page.tsx"),
    path.join(process.cwd(), "src", "app", "electricity-trends", "page.tsx"),
    path.join(process.cwd(), "src", "app", "datasets", "page.tsx"),
    path.join(process.cwd(), "src", "app", "methodology", "page.tsx"),
  ];
  for (const tp of sectionNavTemplates) {
    const src = fs.readFileSync(tp, "utf8");
    if (!src.includes("SectionNav")) {
      fail(`${path.relative(process.cwd(), tp)} must include SectionNav`);
    }
  }

  const datasetsPricesPagePath = path.join(process.cwd(), "src", "app", "datasets", "electricity-prices-by-state", "page.tsx");
  const datasetsPricesPageSource = fs.readFileSync(datasetsPricesPagePath, "utf8");
  if (!datasetsPricesPageSource.includes("Dataset") || !datasetsPricesPageSource.includes("distribution")) {
    fail("datasets electricity-prices-by-state page must include Dataset schema with distribution");
  }
  const datasetsRankingsPagePath = path.join(process.cwd(), "src", "app", "datasets", "electricity-rankings", "page.tsx");
  const datasetsRankingsPageSource = fs.readFileSync(datasetsRankingsPagePath, "utf8");
  if (!datasetsRankingsPageSource.includes("Dataset") || !datasetsRankingsPageSource.includes("distribution")) {
    fail("datasets electricity-rankings page must include Dataset schema with distribution");
  }

  const electricityCostSlugSource = fs.readFileSync(electricityCostSlugPath, "utf8");
  if (!electricityCostSlugSource.includes("BreadcrumbList") && !electricityCostSlugSource.includes("buildBreadcrumbListJsonLd")) {
    fail("electricity-cost [slug] page must include BreadcrumbList schema");
  }
  const knowledgeStateSlugPath = path.join(process.cwd(), "src", "app", "knowledge", "state", "[slug]", "page.tsx");
  const knowledgeStateSlugSource = fs.readFileSync(knowledgeStateSlugPath, "utf8");
  if (!knowledgeStateSlugSource.includes("BreadcrumbList") && !knowledgeStateSlugSource.includes("buildBreadcrumbListJsonLd")) {
    fail("knowledge state [slug] page must include BreadcrumbList schema");
  }
  const knowledgeRankingsIdPath = path.join(process.cwd(), "src", "app", "knowledge", "rankings", "[id]", "page.tsx");
  const knowledgeRankingsIdSource = fs.readFileSync(knowledgeRankingsIdPath, "utf8");
  if (!knowledgeRankingsIdSource.includes("BreadcrumbList") && !knowledgeRankingsIdSource.includes("buildBreadcrumbListJsonLd")) {
    fail("knowledge rankings [id] page must include BreadcrumbList schema");
  }

  const contractSnapshotPath = path.join(root, "contract-snapshot.json");
  ensureFileExists(contractSnapshotPath, "contract-snapshot.json");
  const contractSnapshot = readJson(contractSnapshotPath, "contract-snapshot.json");
  if (!contractSnapshot.contractVersion) {
    fail("contract-snapshot.json must contain contractVersion");
  }
  const knowledgeBuildPath = path.join(process.cwd(), "scripts", "knowledge-build.ts");
  const knowledgeBuildSource = fs.readFileSync(knowledgeBuildPath, "utf8");
  if (!knowledgeBuildSource.includes("CONTRACT_VERSION")) {
    fail("knowledge-build.ts must reference CONTRACT_VERSION constant");
  }

  const indexForDrift = readJson(indexPath, "index.json");
  const releaseForDrift = readJson(path.join(root, "release.json"), "release.json");
  const capabilitiesForDrift = readJson(path.join(root, "capabilities.json"), "capabilities.json");
  const publicEndpointsForDrift = readJson(path.join(root, "public-endpoints.json"), "public-endpoints.json");
  const currentIndexKeys = Object.keys(indexForDrift).sort((a, b) => a.localeCompare(b));
  const currentReleaseKeys = Object.keys(releaseForDrift).sort((a, b) => a.localeCompare(b));
  const currentCapabilitiesKeys = Object.keys(capabilitiesForDrift).sort((a, b) => a.localeCompare(b));
  const currentPublicEndpointsKeys = Object.keys(publicEndpointsForDrift).sort((a, b) => a.localeCompare(b));
  const snapshotIndexKeys = (contractSnapshot.topLevelKeys?.index || []).slice().sort((a, b) => a.localeCompare(b));
  const snapshotReleaseKeys = (contractSnapshot.topLevelKeys?.release || []).slice().sort((a, b) => a.localeCompare(b));
  const snapshotCapabilitiesKeys = (contractSnapshot.topLevelKeys?.capabilities || []).slice().sort((a, b) => a.localeCompare(b));
  const snapshotPublicEndpointsKeys = (contractSnapshot.topLevelKeys?.publicEndpoints || []).slice().sort((a, b) => a.localeCompare(b));
  const keysMatch = (a, b) => a.length === b.length && a.every((k, i) => k === b[i]);
  const indexKeysMatch = keysMatch(currentIndexKeys, snapshotIndexKeys);
  const releaseKeysMatch = keysMatch(currentReleaseKeys, snapshotReleaseKeys);
  const capabilitiesKeysMatch = keysMatch(currentCapabilitiesKeys, snapshotCapabilitiesKeys);
  const publicEndpointsKeysMatch = keysMatch(currentPublicEndpointsKeys, snapshotPublicEndpointsKeys);
  const snapshotContractVersion = contractSnapshot.contractVersion;
  const currentContractVersion = releaseForDrift.contractVersion || capabilitiesForDrift.contractVersion || indexForDrift.contractVersion;
  const contractVersionChanged = snapshotContractVersion !== currentContractVersion;
  if (!indexKeysMatch || !releaseKeysMatch || !capabilitiesKeysMatch || !publicEndpointsKeysMatch) {
    if (!contractVersionChanged) {
      console.error("Schema drift detected. Bump contractVersion to acknowledge change.");
      fail("schema drift: top-level keys changed without contractVersion bump");
    }
  }

  const fetchHelperPath = path.join(process.cwd(), "src", "lib", "knowledge", "fetch.ts");
  ensureFileExists(fetchHelperPath, "fetch.ts");
  const fetchHelperSource = fs.readFileSync(fetchHelperPath, "utf8");
  if (!fetchHelperSource.includes("force-cache")) {
    fail("fetch.ts must include force-cache");
  }

  const knowledgeCheckPath = path.join(process.cwd(), "scripts", "knowledge-check.js");
  ensureFileExists(knowledgeCheckPath, "knowledge-check.js");
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
  if (!packageJsonContent.includes('"knowledge:check"')) {
    fail("package.json must contain knowledge:check script");
  }

  const metadataHelperPath = path.join(process.cwd(), "src", "lib", "seo", "metadata.ts");
  ensureFileExists(metadataHelperPath, "metadata.ts");
  const metadataHelperSource = fs.readFileSync(metadataHelperPath, "utf8");
  if (!metadataHelperSource.includes("openGraph") || !metadataHelperSource.includes("twitter")) {
    fail("metadata.ts must include openGraph and twitter");
  }

  const metricCardPath = path.join(process.cwd(), "src", "components", "knowledge", "MetricCard.tsx");
  ensureFileExists(metricCardPath, "MetricCard.tsx");
  const bulletBarPath = path.join(process.cwd(), "src", "components", "knowledge", "BulletBar.tsx");
  ensureFileExists(bulletBarPath, "BulletBar.tsx");
  const chartsSparklinePath = path.join(process.cwd(), "src", "components", "charts", "Sparkline.tsx");
  ensureFileExists(chartsSparklinePath, "charts/Sparkline.tsx");
  const chartsMiniBarPath = path.join(process.cwd(), "src", "components", "charts", "MiniBarChart.tsx");
  ensureFileExists(chartsMiniBarPath, "charts/MiniBarChart.tsx");
  const statePagePath = path.join(process.cwd(), "src", "app", "knowledge", "state", "[slug]", "page.tsx");
  const statePageSource = fs.readFileSync(statePagePath, "utf8");
  if (!statePageSource.includes("MetricCard")) {
    fail("state page must import MetricCard");
  }
  if (!statePageSource.includes("BulletBar")) {
    fail("state page must import BulletBar");
  }

  const sectionPath = path.join(process.cwd(), "src", "components", "common", "Section.tsx");
  ensureFileExists(sectionPath, "Section.tsx");
  if (!statePageSource.includes("Section")) {
    fail("state page must import Section");
  }
  const pagesPagePath = path.join(process.cwd(), "src", "app", "knowledge", "pages", "page.tsx");
  const pagesPageSource = fs.readFileSync(pagesPagePath, "utf8");
  if (!pagesPageSource.includes("Section")) {
    fail("pages page must import Section");
  }

  const shareBarPath = path.join(process.cwd(), "src", "components", "common", "ShareBar.tsx");
  ensureFileExists(shareBarPath, "ShareBar.tsx");
  if (!statePageSource.includes("ShareBar")) {
    fail("state page must import ShareBar");
  }

  const compareStateCardPath = path.join(process.cwd(), "src", "components", "knowledge", "CompareStateCard.tsx");
  ensureFileExists(compareStateCardPath, "CompareStateCard.tsx");
  const compareClientPath = path.join(process.cwd(), "src", "app", "knowledge", "compare", "CompareStatesClient.tsx");
  const compareClientSource = fs.readFileSync(compareClientPath, "utf8");
  if (!compareClientSource.includes("CompareStateCard")) {
    fail("compare page must import CompareStateCard");
  }

  const dataHubHeroPath = path.join(process.cwd(), "src", "components", "datahub", "DataHubHero.tsx");
  ensureFileExists(dataHubHeroPath, "DataHubHero.tsx");
  const endpointGroupCardsPath = path.join(process.cwd(), "src", "components", "datahub", "EndpointGroupCards.tsx");
  ensureFileExists(endpointGroupCardsPath, "EndpointGroupCards.tsx");
  const dataPagePath = path.join(process.cwd(), "src", "app", "data", "page.tsx");
  const dataPageSource = fs.readFileSync(dataPagePath, "utf8");
  if (!statePageSource.includes("generateMetadata")) {
    fail("state page must contain generateMetadata");
  }
  if (!dataPageSource.includes("generateMetadata")) {
    fail("data page must contain generateMetadata");
  }
  if (!statePageSource.includes("buildMetadata")) {
    fail("state page generateMetadata must use buildMetadata");
  }
  if (!dataPageSource.includes("buildMetadata")) {
    fail("data page generateMetadata must use buildMetadata");
  }
  if (!dataPageSource.includes("dynamic") || !dataPageSource.includes("force-static")) {
    fail("/data page must include dynamic = \"force-static\"");
  }
  if (!dataPageSource.includes("Disclaimers") && !dataPageSource.includes("DisclaimerBlock")) {
    fail("/data page must include Disclaimers or DisclaimerBlock");
  }
  if (!statePageSource.includes("Disclaimers") && !statePageSource.includes("DisclaimerBlock")) {
    fail("state page must include Disclaimers or DisclaimerBlock");
  }
  if (!statePageSource.includes("notFound(") && !statePageSource.includes("KnowledgeNotFound")) {
    fail("state route must reference notFound() or KnowledgeNotFound");
  }
  if (!dataPageSource.includes("DataHubHero")) {
    fail("/data page must import DataHubHero");
  }
  if (!dataPageSource.includes("@/lib/knowledge/fetch") && !statePageSource.includes("@/lib/knowledge/fetch")) {
    fail("at least one page must import from @/lib/knowledge/fetch");
  }

  const statusFooterPath = path.join(process.cwd(), "src", "components", "common", "StatusFooter.tsx");
  ensureFileExists(statusFooterPath, "StatusFooter.tsx");
  if (!dataPageSource.includes("StatusFooter")) {
    fail("/data page must import StatusFooter");
  }

  const relatedIndexPath = path.join(root, "related", "index.json");
  ensureFileExists(relatedIndexPath, "related/index.json");
  const relatedIndex = readJson(relatedIndexPath, "related/index.json");
  if (!relatedIndex.schemaVersion) {
    fail("related/index.json must have schemaVersion");
  }
  if (!relatedIndex.sourceVersion) {
    fail("related/index.json must have sourceVersion");
  }
  const byEntity = relatedIndex.byEntity;
  if (!byEntity || typeof byEntity !== "object") {
    fail("related/index.json must have byEntity object");
  }
  if (!byEntity["knowledge:national"]) {
    fail("related/index.json byEntity must contain knowledge:national");
  }
  const stateIds = Object.keys(byEntity).filter((id) => id.startsWith("knowledge:state:"));
  if (stateIds.length === 0) {
    fail("related/index.json byEntity must contain at least one state id");
  }

  const recommendedNextPath = path.join(process.cwd(), "src", "components", "knowledge", "RecommendedNext.tsx");
  ensureFileExists(recommendedNextPath, "RecommendedNext.tsx");
  if (!statePageSource.includes("RecommendedNext")) {
    fail("state page must import RecommendedNext");
  }

  const summarySnippetPath = path.join(process.cwd(), "src", "components", "knowledge", "SummarySnippet.tsx");
  ensureFileExists(summarySnippetPath, "SummarySnippet.tsx");
  if (!statePageSource.includes("SummarySnippet")) {
    fail("state page must import SummarySnippet");
  }

  const sparklinePath = path.join(process.cwd(), "src", "components", "knowledge", "Sparkline.tsx");
  ensureFileExists(sparklinePath, "Sparkline.tsx");

  const capsPathForSparkline = path.join(root, "capabilities.json");
  const capabilitiesForSparkline = fs.existsSync(capsPathForSparkline)
    ? readJson(capsPathForSparkline, "capabilities.json")
    : null;
  const historySnapshots = capabilitiesForSparkline?.capabilities?.historySnapshots === true;
  if (historySnapshots) {
    const stateFiles = fs.readdirSync(path.join(root, "state")).filter((f) => f.endsWith(".json"));
    let foundHistorySignal = false;
    for (const f of stateFiles) {
      const statePath = path.join(root, "state", f);
      const stateJson = readJson(statePath, f);
      const values = stateJson?.data?.derived?.trends?.avgRateCentsPerKwh?.values;
      const momentumPoints = stateJson?.data?.derived?.momentum?.windowPointsUsed;
      const hasLegacyTrends = Array.isArray(values) && values.length >= 2;
      const hasMomentumHistory =
        stateJson?.data?.derived?.momentum?.enabled === true &&
        typeof momentumPoints === "number" &&
        Number.isFinite(momentumPoints) &&
        momentumPoints >= 2;
      if (hasLegacyTrends || hasMomentumHistory) {
        foundHistorySignal = true;
        break;
      }
    }
    if (!foundHistorySignal) {
      fail(
        "historySnapshots true but no state JSON contains historical trend values or momentum window points",
      );
    }
  }

  const publicEndpointsPath = path.join(root, "public-endpoints.json");
  ensureFileExists(publicEndpointsPath, "public-endpoints.json");
  const publicEndpoints = readJson(publicEndpointsPath, "public-endpoints.json");
  if (!publicEndpoints || publicEndpoints.schemaVersion !== "1.0") {
    fail("public-endpoints.json missing or invalid schemaVersion");
  }
  if (!Array.isArray(publicEndpoints.groups) || publicEndpoints.groups.length === 0) {
    fail("public-endpoints.json missing or empty groups");
  }
  const coreGroup = publicEndpoints.groups.find((g) => g.id === "knowledge-core");
  if (!coreGroup || !Array.isArray(coreGroup.items)) {
    fail("public-endpoints.json missing knowledge-core group");
  }
  const coreIds = new Set((coreGroup.items || []).map((i) => i?.id).filter(Boolean));
  const requiredCore = ["knowledge-search-index", "knowledge-index", "knowledge-contract", "knowledge-schema-map", "knowledge-provenance"];
  for (const id of requiredCore) {
    if (!coreIds.has(id)) {
      fail(`public-endpoints.json knowledge-core missing required item: ${id}`);
    }
  }
  const allItems = (publicEndpoints.groups || []).flatMap((g) => g.items || []);
  const deprecationsInPe = allItems.some((i) => i?.url === "/knowledge/policy/deprecations.json");
  if (!deprecationsInPe) {
    fail("public-endpoints.json must include /knowledge/policy/deprecations.json");
  }
  const offersConfigInPe = allItems.some((i) => i?.url === "/knowledge/policy/offers-config.json");
  if (!offersConfigInPe) {
    fail("public-endpoints.json must include /knowledge/policy/offers-config.json");
  }
  const capabilitiesInPe = allItems.some((i) => i?.url === "/knowledge/capabilities.json");
  if (!capabilitiesInPe) {
    fail("public-endpoints.json must include /knowledge/capabilities.json");
  }
  const releaseInPe = allItems.some((i) => i?.url === "/knowledge/release.json");
  if (!releaseInPe) {
    fail("public-endpoints.json must include /knowledge/release.json");
  }

  const capabilitiesPath = path.join(root, "capabilities.json");
  ensureFileExists(capabilitiesPath, "capabilities.json");
  const capabilities = readJson(capabilitiesPath, "capabilities.json");
  if (!capabilities || capabilities.schemaVersion !== "1.0") {
    fail("capabilities.json missing or invalid schemaVersion");
  }
  const indexForCap = readJson(indexPath, "index.json");
  if (capabilities.sourceVersion !== indexForCap?.sourceVersion) {
    fail(`capabilities.json sourceVersion mismatch: ${capabilities.sourceVersion} vs index ${indexForCap?.sourceVersion}`);
  }
  const contractForCap = readJson(path.join(root, "contract.json"), "contract.json");
  if (capabilities.contractVersion !== contractForCap.contractVersion) {
    fail(`capabilities.json contractVersion mismatch: ${capabilities.contractVersion} vs contract ${contractForCap.contractVersion}`);
  }
  if (capabilities.capabilities?.integrityManifest === true && !fs.existsSync(path.join(root, "integrity", "manifest.json"))) {
    fail("capabilities.json integrityManifest true but /knowledge/integrity/manifest.json missing");
  }
  if (capabilities.capabilities?.glossary === true && !fs.existsSync(path.join(root, "glossary", "fields.json"))) {
    fail("capabilities.json glossary true but /knowledge/glossary/fields.json missing");
  }
  if (capabilities.capabilities?.coverageMap === true && !fs.existsSync(path.join(root, "coverage", "states.json"))) {
    fail("capabilities.json coverageMap true but /knowledge/coverage/states.json missing");
  }
  if (capabilities.capabilities?.leaderboards === true && !fs.existsSync(path.join(root, "leaderboards", "states.json"))) {
    fail("capabilities.json leaderboards true but /knowledge/leaderboards/states.json missing");
  }
  if (capabilities.capabilities?.bundles === true && !fs.existsSync(path.join(root, "bundles", "index.json"))) {
    fail("capabilities.json bundles true but /knowledge/bundles/index.json missing");
  }
  if (capabilities.capabilities?.ingestStarterPack === true && !fs.existsSync(path.join(root, "ingest", "starter-pack.json"))) {
    fail("capabilities.json ingestStarterPack true but /knowledge/ingest/starter-pack.json missing");
  }
  if (capabilities.capabilities?.deprecationPolicy === true && !fs.existsSync(path.join(root, "policy", "deprecations.json"))) {
    fail("capabilities.json deprecationPolicy true but /knowledge/policy/deprecations.json missing");
  }
  if (capabilities.capabilities?.disclaimersPolicy === true && !fs.existsSync(path.join(root, "policy", "disclaimers.json"))) {
    fail("capabilities.json disclaimersPolicy true but /knowledge/policy/disclaimers.json missing");
  }
  if (capabilities.capabilities?.offersPolicy === true && !fs.existsSync(path.join(root, "policy", "offers-config.json"))) {
    fail("capabilities.json offersPolicy true but /knowledge/policy/offers-config.json missing");
  }
  const offersConfigForCap = readJson(offersConfigPath, "policy/offers-config.json");
  if (capabilities.capabilities?.offersEnabled !== offersConfigForCap?.offers?.enabled) {
    fail("capabilities.json offersEnabled must mirror offers-config.offers.enabled");
  }

  const releasePath = path.join(root, "release.json");
  ensureFileExists(releasePath, "release.json");
  const release = readJson(releasePath, "release.json");
  if (!release || release.schemaVersion !== "1.0") {
    fail("release.json missing or invalid schemaVersion");
  }
  if (!/^knowledge-v1-/.test(release.releaseId)) {
    fail(`release.json releaseId must match pattern ^knowledge-v1-: ${release.releaseId}`);
  }
  if (!release.releaseId.includes(release.sourceVersion)) {
    fail(`release.json releaseId must include sourceVersion: ${release.releaseId} vs ${release.sourceVersion}`);
  }
  if (capabilities.capabilities?.integrityManifest === true) {
    if (release.integrityManifestUrl !== "/knowledge/integrity/manifest.json") {
      fail("release.json integrityManifestUrl must not be null when capabilities.integrityManifest is true");
    }
    const manifestForRelease = readJson(path.join(root, "integrity", "manifest.json"), "integrity/manifest.json");
    if (release.integrity?.manifestHash !== manifestForRelease?.manifestHash) {
      fail("release.json integrity.manifestHash must equal integrity/manifest.json manifestHash");
    }
  } else {
    if (release.integrityManifestUrl !== null) {
      fail("release.json integrityManifestUrl must be null when capabilities.integrityManifest is false");
    }
    if (release.integrity?.manifestHash !== null) {
      fail("release.json integrity.manifestHash must be null when capabilities.integrityManifest is false");
    }
  }

  const manifestPath = path.join(root, "integrity", "manifest.json");
  ensureFileExists(manifestPath, "integrity/manifest.json");
  const manifest = readJson(manifestPath, "integrity/manifest.json");
  if (!manifest || manifest.schemaVersion !== "1.0") {
    fail("integrity/manifest.json missing or invalid schemaVersion");
  }
  const expectedManifestUrls = new Set();
  for (const g of (publicEndpoints.groups || [])) {
    for (const item of g.items || []) {
      if (item.kind === "json" && typeof item.url === "string" && item.url.startsWith("/knowledge/")) {
        expectedManifestUrls.add(item.url);
      }
    }
  }
  expectedManifestUrls.add("/knowledge/public-endpoints.json");
  const manifestUrls = new Set((manifest.files || []).map((f) => f?.url).filter(Boolean));
  const manifestSelfUrl = "/knowledge/integrity/manifest.json";
  const releaseUrl = "/knowledge/release.json";
  const missingInManifest = [...expectedManifestUrls].filter((u) => !manifestUrls.has(u));
  const extraInManifest = [...manifestUrls].filter((u) => !expectedManifestUrls.has(u));
  if (missingInManifest.length > 0) {
    const fingerprintUrl = "/knowledge/fingerprint.json";
    const allowedMissing = [manifestSelfUrl, releaseUrl, fingerprintUrl];
    const disallowed = missingInManifest.filter((u) => !allowedMissing.includes(u));
    if (disallowed.length > 0) {
      fail(`integrity manifest missing files from public-endpoints: ${disallowed.join(", ")}`);
    }
  }
  if (extraInManifest.length > 0) {
    fail(`integrity manifest has extra files not in public-endpoints: ${extraInManifest.join(", ")}`);
  }
  for (const entry of manifest.files || []) {
    const filePath = path.join(process.cwd(), "public", (entry.url || "").replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      fail(`integrity manifest references missing file: ${entry.url}`);
    }
    const raw = fs.readFileSync(filePath);
    const computedHash = crypto.createHash("sha256").update(raw).digest("hex");
    if (computedHash !== entry.contentHash) {
      fail(`integrity manifest contentHash mismatch for ${entry.url}`);
    }
    if (typeof entry.bytes !== "number" || entry.bytes !== raw.length) {
      fail(`integrity manifest bytes mismatch for ${entry.url}`);
    }
  }
  const hashInput = { algorithm: "sha256", files: manifest.files };
  const computedManifestHash = sha256(serializeDeterministic(hashInput));
  if (computedManifestHash !== manifest.manifestHash) {
    fail("integrity manifest manifestHash mismatch");
  }
  const sig = manifest.signature;
  if (!sig || typeof sig !== "object") {
    fail("integrity manifest missing signature object");
  }
  if (sig.enabled !== false) {
    fail("integrity manifest signature.enabled must be false");
  }
  if (sig.signatureValue !== null) {
    fail("integrity manifest signature.signatureValue must be null");
  }

  const starterPackPath = path.join(root, "ingest", "starter-pack.json");
  ensureFileExists(starterPackPath, "ingest/starter-pack.json");
  const starterPack = readJson(starterPackPath, "ingest/starter-pack.json");
  if (!starterPack || starterPack.schemaVersion !== "1.0") {
    fail("ingest/starter-pack.json missing or invalid schemaVersion");
  }
  if (!Array.isArray(starterPack.recommendedOrder) || starterPack.recommendedOrder.length === 0) {
    fail("ingest/starter-pack.json missing or empty recommendedOrder");
  }
  for (let i = 0; i < starterPack.recommendedOrder.length; i++) {
    const item = starterPack.recommendedOrder[i];
    if (!item || typeof item.step !== "number" || item.step !== i + 1) {
      fail(`ingest/starter-pack.json recommendedOrder steps must be 1..N with no gaps (step ${i + 1})`);
    }
    if (typeof item.url !== "string" || !item.url) {
      fail(`ingest/starter-pack.json recommendedOrder item missing url`);
    }
    const urlPath = item.url.replace(/^https?:\/\/[^/]+/, "") || item.url;
    const filePath = path.join(process.cwd(), "public", urlPath.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      fail(`ingest/starter-pack.json recommendedOrder url does not exist: ${item.url}`);
    }
  }

  const buildProfilePath = path.join(root, "build-profile.json");
  ensureFileExists(buildProfilePath, "build-profile.json");
  const buildProfile = readJson(buildProfilePath, "build-profile.json");
  if (!buildProfile || buildProfile.schemaVersion !== "1.0") {
    fail("build-profile.json missing or invalid schemaVersion");
  }
  if (typeof buildProfile.durationsMs?.total !== "number") {
    fail("build-profile.json durationsMs.total must be present and a number");
  }
  if (!buildProfile.budgetsMs || typeof buildProfile.budgetsMs.total !== "number") {
    fail("build-profile.json budgetsMs.total must be present");
  }
  const budgets = buildProfile.budgetsMs;
  const durations = buildProfile.durationsMs || {};
  const phasesToCheck = ["total", "loadSnapshots", "normalizeStates", "computeNational", "generatePages", "generateIndexes", "writeFiles"];
  for (const phase of phasesToCheck) {
    const budget = budgets[phase];
    const duration = durations[phase];
    if (typeof budget === "number" && budget > 0 && typeof duration === "number" && duration > budget) {
      fail(`build-profile.json ${phase} exceeded budget: ${duration}ms > ${budget}ms`);
    }
  }

  const leaderboardsPath = path.join(root, "leaderboards", "states.json");
  ensureFileExists(leaderboardsPath, "leaderboards/states.json");
  const leaderboards = readJson(leaderboardsPath, "leaderboards/states.json");
  if (!leaderboards || leaderboards.schemaVersion !== "1.0") {
    fail("leaderboards/states.json missing or invalid schemaVersion");
  }
  const indexForLeaderboards = readJson(path.join(root, "index.json"), "index.json");
  if (leaderboards.sourceVersion !== indexForLeaderboards.sourceVersion) {
    fail(`leaderboards/states.json sourceVersion mismatch: ${leaderboards.sourceVersion} vs index ${indexForLeaderboards.sourceVersion}`);
  }
  const expectedLeaderboardIds = ["rate-lowest", "rate-highest", "value-best", "affordability-best"];
  const leaderboardIds = (leaderboards.leaderboards || []).map((lb) => lb?.id).filter(Boolean);
  for (const id of expectedLeaderboardIds) {
    if (!leaderboardIds.includes(id)) {
      fail(`leaderboards/states.json missing leaderboard id: ${id}`);
    }
  }
  for (const lb of leaderboards.leaderboards || []) {
    if (!lb || !Array.isArray(lb.items)) continue;
    const ranks = lb.items.map((i) => i.rank).filter((r) => typeof r === "number");
    const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1);
    if (JSON.stringify([...ranks].sort((a, b) => a - b)) !== JSON.stringify(expectedRanks)) {
      fail(`leaderboards/states.json ${lb.id} items must have ranks 1..N`);
    }
    if (lb.items.length > 0) {
      const first = lb.items[0];
      const jsonPathname = (lb.jsonUrl || "").replace(/^https?:\/\/[^/]+/, "") || lb.jsonUrl;
      const rankingPath = path.join(process.cwd(), "public", (jsonPathname || "").replace(/^\//, ""));
      if (fs.existsSync(rankingPath)) {
        const rankingPage = readJson(rankingPath, lb.jsonUrl);
        const sortedStates = rankingPage?.data?.sortedStates;
        if (Array.isArray(sortedStates) && sortedStates.length > 0) {
          const rankFirst = sortedStates[0];
          if (rankFirst.slug !== first.slug) {
            fail(`leaderboards ${lb.id} first item slug mismatch: ${first.slug} vs ranking ${rankFirst.slug}`);
          }
          const leaderValue = first.value;
          const rankValue = rankFirst.metricValue;
          const tolerance = 0.01;
          if (typeof leaderValue !== "number" || typeof rankValue !== "number" || Math.abs(leaderValue - rankValue) > tolerance) {
            fail(`leaderboards ${lb.id} first item value mismatch: ${leaderValue} vs ranking ${rankValue}`);
          }
        }
      }
    }
  }

  const bundlesIndexPath = path.join(root, "bundles", "index.json");
  ensureFileExists(bundlesIndexPath, "bundles/index.json");
  const bundlesIndex = readJson(bundlesIndexPath, "bundles/index.json");
  if (!bundlesIndex || bundlesIndex.schemaVersion !== "1.0") {
    fail("bundles/index.json missing or invalid schemaVersion");
  }
  if (!Array.isArray(bundlesIndex.bundles) || bundlesIndex.bundles.length !== 4) {
    fail(`bundles/index.json must list exactly 4 bundles, got ${bundlesIndex.bundles?.length ?? 0}`);
  }
  const expectedBundleIds = ["core", "methodologies", "rankings", "states-all"];
  const actualBundleIds = (bundlesIndex.bundles || []).map((b) => b?.id).filter(Boolean).sort((a, b) => a.localeCompare(b));
  const expectedSorted = [...expectedBundleIds].sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(actualBundleIds) !== JSON.stringify(expectedSorted)) {
    fail(`bundles/index.json bundle ids mismatch: expected ${expectedSorted.join(", ")}, got ${actualBundleIds.join(", ")}`);
  }
  for (const bundle of bundlesIndex.bundles) {
    if (!bundle || typeof bundle.manifestUrl !== "string") {
      fail(`bundles/index.json bundle missing manifestUrl: ${JSON.stringify(bundle)}`);
    }
    const manifestPathname = bundle.manifestUrl.replace(/^https?:\/\/[^/]+/, "") || bundle.manifestUrl;
    const manifestPath = path.join(process.cwd(), "public", manifestPathname.replace(/^\//, ""));
    if (!fs.existsSync(manifestPath)) {
      fail(`bundles manifest missing: ${bundle.manifestUrl} -> ${manifestPath}`);
    }
    const manifest = readJson(manifestPath, bundle.manifestUrl);
    if (!manifest || manifest.schemaVersion !== "1.0" || !Array.isArray(manifest.files)) {
      fail(`bundles manifest invalid: ${bundle.manifestUrl}`);
    }
    const urls = manifest.files.map((f) => (f && typeof f.url === "string" ? f.url : "")).filter(Boolean);
    const sortedUrls = [...urls].sort((a, b) => a.localeCompare(b));
    if (JSON.stringify(urls) !== JSON.stringify(sortedUrls)) {
      fail(`bundles manifest files must be sorted by url: ${bundle.manifestUrl}`);
    }
    const urlSet = new Set(urls);
    if (urlSet.size !== urls.length) {
      fail(`bundles manifest files must be unique: ${bundle.manifestUrl}`);
    }
    for (const fileUrl of urls) {
      const filePathname = fileUrl.startsWith("http") ? new URL(fileUrl).pathname : fileUrl;
      const filePath = path.join(process.cwd(), "public", filePathname.replace(/^\//, ""));
      if (!fs.existsSync(filePath)) {
        fail(`bundles manifest references missing file: ${bundle.manifestUrl} -> ${fileUrl}`);
      }
    }
    if (bundle.id === "states-all" && manifest.files.length !== 51) {
      fail(`bundles states-all manifest must have 51 entries, got ${manifest.files.length}`);
    }
  }

  const historyIndexPathForBundles = path.join(root, "history", "index.json");
  if (fs.existsSync(historyIndexPathForBundles)) {
    const historyBundlesIndexPath = path.join(root, "history", "bundles", "index.json");
    ensureFileExists(historyBundlesIndexPath, "history/bundles/index.json");
    const historyBundlesIndex = readJson(historyBundlesIndexPath, "history/bundles/index.json");
    if (!historyBundlesIndex || historyBundlesIndex.schemaVersion !== "1.0") {
      fail("history/bundles/index.json missing or invalid schemaVersion");
    }
    if (!Array.isArray(historyBundlesIndex.snapshots)) {
      fail("history/bundles/index.json missing snapshots array");
    }
    const historyIndex = readJson(historyIndexPathForBundles, "history/index.json");
    if (!historyIndex || !Array.isArray(historyIndex.snapshots)) {
      fail("history/index.json missing snapshots array");
    }
    const historySnapshotVersions = new Set((historyIndex.snapshots || []).map((s) => s?.sourceVersion).filter(Boolean));
    const bundlesSnapshotVersions = new Set((historyBundlesIndex.snapshots || []).map((s) => s?.sourceVersion).filter(Boolean));
    if (historySnapshotVersions.size !== bundlesSnapshotVersions.size) {
      fail(`history/bundles/index.json snapshot count mismatch: history has ${historySnapshotVersions.size}, bundles has ${bundlesSnapshotVersions.size}`);
    }
    for (const sv of historySnapshotVersions) {
      if (!bundlesSnapshotVersions.has(sv)) {
        fail(`history/bundles/index.json missing snapshot ${sv}`);
      }
    }
    const sortedHistoryVersions = [...historyIndex.snapshots].map((s) => s.sourceVersion).sort((a, b) => b.localeCompare(a));
    const sortedBundlesVersions = [...historyBundlesIndex.snapshots].map((s) => s.sourceVersion).sort((a, b) => b.localeCompare(a));
    if (JSON.stringify(sortedHistoryVersions) !== JSON.stringify(sortedBundlesVersions)) {
      fail("history/bundles/index.json snapshots must match history/index.json and be sorted newest first");
    }
    const latestVersion = sortedHistoryVersions[0];
    if (latestVersion) {
      const snapshotBundlesIndexPath = path.join(root, "history", latestVersion, "bundles", "index.json");
      ensureFileExists(snapshotBundlesIndexPath, `history/${latestVersion}/bundles/index.json`);
      const snapshotBundlesIndex = readJson(snapshotBundlesIndexPath, `history/${latestVersion}/bundles/index.json`);
      if (!snapshotBundlesIndex || !Array.isArray(snapshotBundlesIndex.bundles) || snapshotBundlesIndex.bundles.length !== 4) {
        fail(`history/${latestVersion}/bundles/index.json must list 4 bundles`);
      }
      for (const bundle of snapshotBundlesIndex.bundles || []) {
        if (!bundle || typeof bundle.manifestUrl !== "string") continue;
        const manifestPath = path.join(process.cwd(), "public", bundle.manifestUrl.replace(/^\//, ""));
        if (!fs.existsSync(manifestPath)) {
          fail(`history/${latestVersion} bundle manifest missing: ${bundle.manifestUrl}`);
        }
        const manifest = readJson(manifestPath, bundle.manifestUrl);
        if (!manifest || !Array.isArray(manifest.files)) {
          fail(`history/${latestVersion} bundle manifest invalid: ${bundle.manifestUrl}`);
        }
        if (bundle.id === "states-all" && manifest.files.length !== 51) {
          fail(`history/${latestVersion} states-all manifest must have 51 entries, got ${manifest.files.length}`);
        }
        for (const fileEntry of manifest.files) {
          const fileUrl = fileEntry?.url;
          if (!fileUrl || typeof fileUrl !== "string") continue;
          if (!fileUrl.includes(`/knowledge/history/${latestVersion}/`)) {
            fail(`history snapshot manifest URLs must point to snapshot paths: ${fileUrl}`);
          }
          const filePathname = fileUrl.startsWith("http") ? new URL(fileUrl).pathname : fileUrl;
          const filePath = path.join(process.cwd(), "public", filePathname.replace(/^\//, ""));
          if (!fs.existsSync(filePath)) {
            fail(`history snapshot manifest references missing file: ${fileUrl}`);
          }
        }
      }
    }
  }

  const SIZE_BUDGETS = {
    "knowledge/index.json": 250000,
    "knowledge/search-index.json": 1200000,
    "knowledge/state/*.json": 120000,
  };
  const indexPathNorm = path.join(root, "index.json");
  const indexStat = fs.statSync(indexPathNorm);
  if (indexStat.size > SIZE_BUDGETS["knowledge/index.json"]) {
    fail(`index.json exceeds budget: ${indexStat.size} > ${SIZE_BUDGETS["knowledge/index.json"]}`);
  }
  const searchIndexPath = path.join(root, "search-index.json");
  const searchIndexStat = fs.statSync(searchIndexPath);
  if (searchIndexStat.size > SIZE_BUDGETS["knowledge/search-index.json"]) {
    fail(`search-index.json exceeds budget: ${searchIndexStat.size} > ${SIZE_BUDGETS["knowledge/search-index.json"]}`);
  }
  // Compressed *.json.gz sidecar verification was intentionally retired.
  // Canonical machine artifact checks target non-.gz /knowledge/*.json files only.
  const dataRoutePath = path.join(process.cwd(), "src", "app", "data", "page.tsx");
  if (!fs.existsSync(dataRoutePath)) {
    fail("/data route missing: src/app/data/page.tsx");
  }
  const knowledgePagesPath = path.join(process.cwd(), "src", "app", "knowledge", "pages", "page.tsx");
  if (!fs.existsSync(knowledgePagesPath)) {
    fail("/knowledge/pages route missing: src/app/knowledge/pages/page.tsx");
  }
  const knowledgeNationalPath = path.join(process.cwd(), "src", "app", "knowledge", "national", "page.tsx");
  if (!fs.existsSync(knowledgeNationalPath)) {
    fail("/knowledge/national route missing: src/app/knowledge/national/page.tsx");
  }
  const knowledgeDocsPath = path.join(process.cwd(), "src", "app", "knowledge", "docs", "page.tsx");
  if (!fs.existsSync(knowledgeDocsPath)) {
    fail("/knowledge/docs route missing: src/app/knowledge/docs/page.tsx");
  }
  const knowledgeDocsSource = fs.readFileSync(knowledgeDocsPath, "utf8");
  if (!knowledgeDocsSource.includes("public-endpoints.json")) {
    fail("knowledge/docs page must reference public-endpoints.json");
  }
  const dataPagePathForPub = path.join(process.cwd(), "src", "app", "data", "page.tsx");
  if (fs.existsSync(dataPagePathForPub)) {
    const dataPagePubSource = fs.readFileSync(dataPagePathForPub, "utf8");
    if (!dataPagePubSource.includes("public-endpoints.json")) {
      fail("data page must reference public-endpoints.json");
    }
  }
  const knowledgeStatePath = path.join(process.cwd(), "src", "app", "knowledge", "state", "[slug]", "page.tsx");
  if (!fs.existsSync(knowledgeStatePath)) {
    fail("/knowledge/state/[slug] route missing: src/app/knowledge/state/[slug]/page.tsx");
  }
  const copyButtonPath = path.join(process.cwd(), "src", "components", "common", "CopyButton.tsx");
  ensureFileExists(copyButtonPath, "CopyButton.tsx");

  const knowledgeComponents = [
    "KnowledgeShell",
    "KnowledgeBadges",
    "KeyStatsGrid",
    "JsonPreview",
  ];
  const componentsDir = path.join(process.cwd(), "src", "app", "components", "knowledge");
  for (const name of knowledgeComponents) {
    const filePath = path.join(componentsDir, `${name}.tsx`);
    if (!fs.existsSync(filePath)) {
      fail(`Knowledge component missing: ${name}.tsx`);
    }
  }
  const jsonldHelperPath = path.join(process.cwd(), "src", "lib", "seo", "jsonld.ts");
  if (!fs.existsSync(jsonldHelperPath)) {
    fail("JSON-LD helper missing: src/lib/seo/jsonld.ts");
  }
  const JSONLD_PAGE_CHECKS = [
    { path: path.join(process.cwd(), "src", "app", "knowledge", "national", "page.tsx"), label: "knowledge/national/page.tsx" },
    { path: path.join(process.cwd(), "src", "app", "knowledge", "state", "[slug]", "page.tsx"), label: "knowledge/state/[slug]/page.tsx" },
    { path: path.join(process.cwd(), "src", "app", "data", "page.tsx"), label: "data/page.tsx" },
  ];
  for (const { path: filePath, label } of JSONLD_PAGE_CHECKS) {
    if (!fs.existsSync(filePath)) {
      fail(`JSON-LD page missing: ${label}`);
    }
    const source = fs.readFileSync(filePath, "utf8");
    if (!source.includes("application/ld+json") && !source.includes("JsonLdScript")) {
      fail(`${label} must include JSON-LD (application/ld+json or JsonLdScript)`);
    }
  }
  const registryRoutePath = path.join(process.cwd(), "src", "app", "registry.json", "route.ts");
  if (fs.existsSync(registryRoutePath)) {
    const registrySource = fs.readFileSync(registryRoutePath, "utf8");
    if (!registrySource.includes("dataHubUrl")) {
      fail("registry.json route missing dataHubUrl");
    }
    if (!registrySource.includes("knowledgeLabelsUrl")) {
      fail("registry.json route missing knowledgeLabelsUrl");
    }
    if (!registrySource.includes("knowledgeOffersIndexUrl")) {
      fail("registry.json route missing knowledgeOffersIndexUrl");
    }
    if (!registrySource.includes("knowledgeDisclaimersUrl")) {
      fail("registry.json route missing knowledgeDisclaimersUrl");
    }
    if (!registrySource.includes("knowledgeGlossaryFieldsUrl")) {
      fail("registry.json route missing knowledgeGlossaryFieldsUrl");
    }
    if (!registrySource.includes("knowledgeIngestStarterPackUrl")) {
      fail("registry.json route missing knowledgeIngestStarterPackUrl");
    }
    if (!registrySource.includes("knowledgeDocsUrl")) {
      fail("registry.json route missing knowledgeDocsUrl");
    }
    if (!registrySource.includes("knowledgeIntegrityManifestUrl")) {
      fail("registry.json route missing knowledgeIntegrityManifestUrl");
    }
  }
  const llmsRoutePath = path.join(process.cwd(), "src", "app", "llms.txt", "route.ts");
  if (fs.existsSync(llmsRoutePath)) {
    const llmsSource = fs.readFileSync(llmsRoutePath, "utf8");
    if (!llmsSource.includes("/data")) {
      fail("llms.txt must reference /data");
    }
    const readsFromPublicEndpoints = llmsSource.includes("public-endpoints.json") && (llmsSource.includes("readFile") || llmsSource.includes("publicEndpoints"));
    if (!readsFromPublicEndpoints) {
      const dataSection = llmsSource.match(/Data & Knowledge:[\s\S]*?`/);
      if (dataSection) {
        const content = dataSection[0];
        const searchIdx = content.indexOf("search-index.json");
        const indexIdx = content.indexOf("index.json");
        if (searchIdx === -1) {
          fail("llms.txt Data & Knowledge section missing search-index.json");
        }
        if (indexIdx === -1) {
          fail("llms.txt Data & Knowledge section missing index.json");
        }
        if (searchIdx > indexIdx) {
          fail("llms.txt must list search-index.json before index.json");
        }
      }
    }
    if (!readsFromPublicEndpoints && !llmsSource.includes("/knowledge/docs")) {
      fail("llms.txt must include /knowledge/docs");
    }
    if (!readsFromPublicEndpoints && !llmsSource.includes("/knowledge/ingest/starter-pack.json")) {
      fail("llms.txt must include /knowledge/ingest/starter-pack.json");
    }
    if (!llmsSource.includes("public-endpoints.json")) {
      fail("llms.txt must include public-endpoints.json");
    }
  }

  if (!fs.existsSync(stateDir) || !fs.statSync(stateDir).isDirectory()) {
    fail(`missing state directory: ${stateDir}`);
  }
  const sampleStateFile = fs.readdirSync(stateDir).find((n) => n.endsWith(".json"));
  if (sampleStateFile) {
    const samplePath = path.join(stateDir, sampleStateFile);
    const sampleStat = fs.statSync(samplePath);
    if (sampleStat.size > SIZE_BUDGETS["knowledge/state/*.json"]) {
      fail(`state page ${sampleStateFile} exceeds budget: ${sampleStat.size} > ${SIZE_BUDGETS["knowledge/state/*.json"]}`);
    }
  }

  const stateFiles = fs
    .readdirSync(stateDir)
    .filter((name) => name.endsWith(".json"));

  if (stateFiles.length !== 51) {
    fail(`expected 51 state JSON files, found ${stateFiles.length}`);
  }

  const index = readJson(indexPath, "index.json");

  if (!index || !Array.isArray(index.items)) {
    fail("index.json missing items array");
  }
  if (typeof index.registryHash !== "string" || index.registryHash.length === 0) {
    fail("index.json missing registryHash");
  }
  if (typeof index.integritySignature !== "string" || index.integritySignature.length === 0) {
    fail("index.json missing integritySignature");
  }
  if (typeof index.totalPages !== "number" || index.totalPages <= 0) {
    fail("index.json missing totalPages");
  }
  if (index.contractUrl !== "/knowledge/contract.json") {
    fail("index.json missing or invalid contractUrl");
  }
  if (index.changelogUrl !== "/knowledge/changelog.json") {
    fail("index.json missing or invalid changelogUrl");
  }
  if (index.provenanceUrl !== "/knowledge/provenance.json") {
    fail("index.json missing or invalid provenanceUrl");
  }
  if (index.schemaMapUrl !== "/knowledge/schema-map.json") {
    fail("index.json missing or invalid schemaMapUrl");
  }
  if (index.entityIndexUrl !== "/knowledge/entity-index.json") {
    fail("index.json missing or invalid entityIndexUrl");
  }
  if (index.methodologyIndexUrl !== "/knowledge/methodology/index.json") {
    fail("index.json missing or invalid methodologyIndexUrl");
  }
  if (index.compareUrl !== "/knowledge/compare/states.json") {
    fail("index.json missing or invalid compareUrl");
  }
  if (index.rankingsIndexUrl !== "/knowledge/rankings/index.json") {
    fail("index.json missing or invalid rankingsIndexUrl");
  }
  if (index.labelsUrl !== "/knowledge/labels/en.json") {
    fail("index.json missing or invalid labelsUrl");
  }
  if (index.glossaryFieldsUrl !== "/knowledge/glossary/fields.json") {
    fail("index.json missing or invalid glossaryFieldsUrl");
  }
  if (index.docsUrl !== "/knowledge/docs") {
    fail("index.json missing or invalid docsUrl");
  }
  if (index.docsJsonUrl !== "/knowledge/docs/index.json") {
    fail("index.json missing or invalid docsJsonUrl");
  }
  if (index.ingestStarterPackUrl !== "/knowledge/ingest/starter-pack.json") {
    fail("index.json missing or invalid ingestStarterPackUrl");
  }
  if (index.publicEndpointsUrl !== "/knowledge/public-endpoints.json") {
    fail("index.json missing or invalid publicEndpointsUrl");
  }
  if (index.deprecationsUrl !== "/knowledge/policy/deprecations.json") {
    fail("index.json missing or invalid deprecationsUrl");
  }
  if (typeof index.integrityManifestUrl !== "string" || index.integrityManifestUrl !== "/knowledge/integrity/manifest.json") {
    fail("index.json missing or invalid integrityManifestUrl (must be /knowledge/integrity/manifest.json)");
  }
  if (index.offersIndexUrl !== "/knowledge/offers/index.json") {
    fail("index.json missing or invalid offersIndexUrl");
  }
  if (index.offersConfigUrl !== "/knowledge/policy/offers-config.json") {
    fail("index.json missing or invalid offersConfigUrl");
  }
  if (index.capabilitiesUrl !== "/knowledge/capabilities.json") {
    fail("index.json missing or invalid capabilitiesUrl");
  }
  if (index.releaseUrl !== "/knowledge/release.json") {
    fail("index.json missing or invalid releaseUrl");
  }
  if (index.fingerprintUrl !== "/knowledge/fingerprint.json") {
    fail("index.json missing or invalid fingerprintUrl");
  }

  const fingerprintPath = path.join(root, "fingerprint.json");
  ensureFileExists(fingerprintPath, "fingerprint.json");
  const fingerprint = readJson(fingerprintPath, "fingerprint.json");
  if (!fingerprint.schemaVersion) {
    fail("fingerprint.json must have schemaVersion");
  }
  if (!fingerprint.sourceVersion) {
    fail("fingerprint.json must have sourceVersion");
  }
  if (!fingerprint.contractVersion) {
    fail("fingerprint.json must have contractVersion");
  }
  if (!fingerprint.releaseId) {
    fail("fingerprint.json must have releaseId");
  }

  if (index.disclaimersUrl !== "/knowledge/policy/disclaimers.json") {
    fail("index.json missing or invalid disclaimersUrl");
  }

  const offersConfig = readJson(offersConfigPath, "policy/offers-config.json");
  if (!offersConfig || offersConfig.schemaVersion !== "1.0") {
    fail("policy/offers-config.json missing or invalid schemaVersion");
  }
  if (!offersConfig.offers || typeof offersConfig.offers.enabled !== "boolean") {
    fail("policy/offers-config.json missing or invalid offers.enabled");
  }
  if (offersConfig.offers.enabled === false && offersConfig.offers.mode !== "disabled") {
    fail("policy/offers-config.json offers.mode must be 'disabled' when offers.enabled is false");
  }

  const disclaimers = readJson(disclaimersPath, "policy/disclaimers.json");
  if (!disclaimers || disclaimers.schemaVersion !== "1.0") {
    fail("policy/disclaimers.json missing or invalid schemaVersion");
  }
  const REQUIRED_DISCLAIMER_IDS = ["general-site", "rankings", "methodology", "offers-disabled"];
  const disclaimerIds = new Set((disclaimers.disclaimers || []).map((d) => d.id));
  for (const id of REQUIRED_DISCLAIMER_IDS) {
    if (!disclaimerIds.has(id)) {
      fail(`policy/disclaimers.json missing required disclaimer id: ${id}`);
    }
  }

  const offersIndex = readJson(offersIndexPath, "offers/index.json");
  if (!offersIndex || offersIndex.schemaVersion !== "1.0") {
    fail("offers/index.json missing or invalid schemaVersion");
  }
  if (offersIndex.enabled !== offersConfig.offers.enabled) {
    fail("offers/index.json enabled must mirror offers-config.offers.enabled");
  }
  if (!Array.isArray(offersIndex.states)) {
    fail("offers/index.json missing states array");
  }
  for (const stateEntry of offersIndex.states) {
    if (!Array.isArray(stateEntry.offers)) continue;
    for (const offer of stateEntry.offers) {
      const offerId = offer?.id ?? "unknown";
      if (offersConfig.offers.allowOutboundLinks === false && offer.url !== null) {
        fail(`offers/index.json offer ${offerId} must have url === null when allowOutboundLinks is false`);
      }
      if (offersConfig.offers.enabled === false) {
        if (offer.url !== null) {
          fail(`offers/index.json offer ${offerId} must have url === null when offers disabled`);
        }
        if (offer.enabled !== false) {
          fail(`offers/index.json offer ${offerId} must have enabled === false when offers disabled`);
        }
      }
    }
  }

  const labels = readJson(labelsPath, "labels/en.json");
  if (!labels || labels.schemaVersion !== "1.0") {
    fail("labels/en.json missing or invalid schemaVersion");
  }
  if (labels.sourceVersion !== index.sourceVersion) {
    fail("labels/en.json sourceVersion mismatch with index");
  }
  const requiredLabelKeys = ["nav.dataHub", "nav.viewJson", "section.freshness", "field.avgRateCentsPerKwh"];
  for (const key of requiredLabelKeys) {
    if (!labels.labels || typeof labels.labels[key] !== "string") {
      fail(`labels/en.json missing required key: ${key}`);
    }
  }
  const labelKeys = Object.keys(labels.labels || {});
  const keySet = new Set(labelKeys);
  if (keySet.size !== labelKeys.length) {
    fail("labels/en.json has duplicate keys");
  }

  const compareStatesPath = path.join(root, "compare", "states.json");
  const compareStates = readJson(compareStatesPath, "compare/states.json");
  if (!compareStates || compareStates.schemaVersion !== "1.0") {
    fail("compare/states.json missing or invalid schemaVersion");
  }
  if (compareStates.sourceVersion !== index.sourceVersion) {
    fail("compare/states.json sourceVersion mismatch with index");
  }
  const EXPECTED_COMPARE_FIELDS = [
    "avgRateCentsPerKwh",
    "valueScore",
    "affordabilityIndex",
    "freshnessStatus",
    "exampleBill1000kwh",
  ];
  if (!Array.isArray(compareStates.fields) || compareStates.fields.length === 0) {
    fail("compare/states.json fields array is empty");
  }
  for (const f of EXPECTED_COMPARE_FIELDS) {
    if (!compareStates.fields.includes(f)) {
      fail(`compare/states.json fields missing expected field: ${f}`);
    }
  }
  if (!Array.isArray(compareStates.states)) {
    fail("compare/states.json missing states array");
  }
  if (compareStates.states.length !== 51) {
    fail(`compare/states.json states length must be 51 (50 states + DC): got ${compareStates.states.length}`);
  }
  const sortedNames = [...compareStates.states].map((s) => s.name).sort((a, b) => a.localeCompare(b));
  const actualNames = compareStates.states.map((s) => s.name);
  for (let i = 0; i < sortedNames.length; i++) {
    if (sortedNames[i] !== actualNames[i]) {
      fail("compare/states.json states must be sorted by name ascending");
    }
  }
  for (const state of compareStates.states) {
    if (typeof state.canonicalUrl !== "string" || state.canonicalUrl.length === 0) {
      fail(`compare/states.json state ${state.slug} missing canonicalUrl`);
    }
    if (typeof state.jsonUrl !== "string" || state.jsonUrl.length === 0) {
      fail(`compare/states.json state ${state.slug} missing jsonUrl`);
    }
    if (!state.metrics || typeof state.metrics !== "object") {
      fail(`compare/states.json state ${state.slug} missing metrics`);
    }
    for (const f of compareStates.fields) {
      if (!Object.prototype.hasOwnProperty.call(state.metrics, f)) {
        fail(`compare/states.json state ${state.slug} metrics missing field: ${f}`);
      }
    }
  }

  const methodologyIndexPath = path.join(root, "methodology", "index.json");
  ensureFileExists(methodologyIndexPath, "methodology/index.json");
  const methodologyIndex = readJson(methodologyIndexPath, "methodology/index.json");
  if (
    !methodologyIndex ||
    methodologyIndex.schemaVersion !== "1.0" ||
    !Array.isArray(methodologyIndex.items) ||
    methodologyIndex.items.length < 5
  ) {
    fail("methodology/index.json must contain at least 5 items (epi, value-score, freshness, cagr, volatility)");
  }
  const methodologyIds = new Set(methodologyIndex.items.map((item) => item.id));
  for (const id of ["epi", "value-score", "freshness", "cagr", "volatility"]) {
    if (!methodologyIds.has(id)) {
      fail(`methodology/index.json missing methodology: ${id}`);
    }
  }
  const methodologyVersions = {};
  for (const item of methodologyIndex.items) {
    if (
      !item.id ||
      !item.title ||
      !item.jsonUrl ||
      !item.canonicalUrl ||
      !item.version ||
      !item.lastReviewedAt ||
      !Array.isArray(item.relatedDerivedFields)
    ) {
      fail(`methodology/index.json item missing required fields: ${JSON.stringify(item)}`);
    }
    methodologyVersions[item.id] = item.version;
  }

  const rankingsIndexPath = path.join(root, "rankings", "index.json");
  ensureFileExists(rankingsIndexPath, "rankings/index.json");
  const rankingsIndex = readJson(rankingsIndexPath, "rankings/index.json");
  if (!rankingsIndex || rankingsIndex.schemaVersion !== "1.0") {
    fail("rankings/index.json missing or invalid schemaVersion");
  }
  if (rankingsIndex.sourceVersion !== index.sourceVersion) {
    fail("rankings/index.json sourceVersion mismatch with index");
  }
  if (!Array.isArray(rankingsIndex.items)) {
    fail("rankings/index.json missing items array");
  }
  const rankingsDir = path.join(root, "rankings");
  for (const item of rankingsIndex.items) {
    if (typeof item.id !== "string" || !item.id) {
      fail(`rankings/index.json item missing id`);
    }
    if (typeof item.jsonUrl !== "string" || !item.jsonUrl) {
      fail(`rankings/index.json item ${item.id} missing jsonUrl`);
    }
    const jsonPathname = item.jsonUrl.startsWith("http")
      ? new URL(item.jsonUrl).pathname
      : item.jsonUrl;
    const jsonPath = path.join(process.cwd(), "public", jsonPathname.replace(/^\//, ""));
    if (!fs.existsSync(jsonPath)) {
      fail(`rankings/index.json item ${item.id} jsonUrl does not exist: ${item.jsonUrl}`);
    }
    const canonicalPath = item.canonicalUrl.replace(/^https?:\/\/[^/]+/, "") || item.canonicalUrl;
    if (!/^\/knowledge\/rankings\/[a-z0-9-]+$/.test(canonicalPath)) {
      fail(`rankings/index.json item ${item.id} canonicalUrl must follow /knowledge/rankings/<id>: ${item.canonicalUrl}`);
    }
    const pathId = canonicalPath.replace(/^\/knowledge\/rankings\//, "");
    if (pathId !== item.id) {
      fail(`rankings/index.json item ${item.id} canonicalUrl id mismatch: ${pathId}`);
    }
    if (Array.isArray(item.methodologiesUsed)) {
      for (const m of item.methodologiesUsed) {
        if (!methodologyIds.has(m.id)) {
          fail(`rankings/index.json item ${item.id} references unknown methodology: ${m.id}`);
        }
      }
    }
    const rankingPage = readJson(
      path.join(rankingsDir, `${item.id}.json`),
      `rankings/${item.id}.json`,
    );
    const sortedStates = rankingPage?.data?.sortedStates;
    const enabled = rankingPage?.data?.enabled !== false;
    if (enabled) {
      if (!Array.isArray(sortedStates) || sortedStates.length === 0) {
        fail(`rankings/${item.id}.json enabled but missing or empty data.sortedStates`);
      }
    } else {
      if (!Array.isArray(sortedStates) || sortedStates.length > 0) {
        fail(`rankings/${item.id}.json enabled=false must have empty sortedStates`);
      }
      const excerpt = rankingPage?.meta?.excerpt || "";
      if (!/history|unavailable/i.test(excerpt)) {
        fail(`rankings/${item.id}.json enabled=false must have excerpt mentioning history unavailable`);
      }
    }
    if (!Array.isArray(sortedStates)) {
      fail(`rankings/${item.id}.json missing data.sortedStates array`);
    }
    if (enabled && sortedStates.length > 0) {
      const ranks = sortedStates.map((r) => r.rank).filter((r) => typeof r === "number");
      const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1);
      const sortedRanks = [...ranks].sort((a, b) => a - b);
      for (let i = 0; i < expectedRanks.length; i++) {
        if (sortedRanks[i] !== expectedRanks[i]) {
          fail(`rankings/${item.id}.json ranks must be 1..N with no gaps`);
        }
      }
      if (item.id === "price-trend") {
        const first = sortedStates[0];
        if (!first || typeof first.metricValue !== "number") {
          fail(`rankings/price-trend.json enabled rows must have numeric metricValue`);
        }
        if (typeof first.startRate !== "number" || typeof first.endRate !== "number" || typeof first.changePercent !== "number") {
          fail(`rankings/price-trend.json enabled rows must have startRate, endRate, changePercent`);
        }
      }
      if (item.id === "momentum-signal") {
        const validSignals = ["accelerating", "rising", "stable", "falling"];
        for (const row of sortedStates) {
          if (typeof row.metricValue !== "number") {
            fail(`rankings/momentum-signal.json enabled rows must have numeric metricValue`);
          }
          if (row.signal && row.signal !== "unavailable" && !validSignals.includes(row.signal)) {
            fail(`rankings/momentum-signal.json invalid signal: ${row.signal}`);
          }
        }
      }
    }
    const insightsRankingPath = path.join(root, "insights", "rankings", `${item.id}.json`);
    if (!fs.existsSync(insightsRankingPath)) {
      fail(`insights/rankings/${item.id}.json must exist`);
    }
  }

  const requiredRankingIds = ["cagr-25y", "volatility-5y", "price-trend", "momentum-signal", "electricity-inflation-1y", "electricity-inflation-5y", "electricity-affordability", "most-expensive-electricity"];
  const rankingIds = new Set(rankingsIndex.items.map((i) => i.id));
  for (const rid of requiredRankingIds) {
    if (!rankingIds.has(rid)) {
      fail(`rankings/index.json must include ${rid}`);
    }
    const rPath = path.join(rankingsDir, `${rid}.json`);
    if (!fs.existsSync(rPath)) {
      fail(`rankings/${rid}.json must exist`);
    }
    const rPage = readJson(rPath, `rankings/${rid}.json`);
    const data = rPage?.data ?? rPage;
    const enabled = data?.enabled !== false;
    const sortedStates = data?.sortedStates ?? [];
    if (enabled) {
      if (sortedStates.length === 0) {
        fail(`rankings/${rid}.json enabled but has no rows (history expected)`);
      }
      const first = sortedStates[0];
      if (first && typeof first.metricValue !== "number") {
        fail(`rankings/${rid}.json rows must have numeric metricValue`);
      }
    } else {
      if (sortedStates.length > 0) {
        fail(`rankings/${rid}.json disabled but has non-empty rows`);
      }
      const excerpt = (rPage?.meta?.excerpt ?? rPage?.meta?.description ?? data?.excerpt ?? "").toLowerCase();
      if (!excerpt.includes("history") && !excerpt.includes("unavailable") && !excerpt.includes("historical")) {
        fail(`rankings/${rid}.json disabled excerpt must mention history unavailable or historical`);
      }
    }
  }

  const validPageIds = new Set(index.items.map((item) => item.id));
  const validEntityRefs = new Set(index.items.map((item) => `${item.type}:${item.slug}`));
  const pageQualityById = new Map();

  const canonicalPathPatterns = [
    /^\/knowledge\/national$/,
    /^\/knowledge\/state\/[a-z0-9-]+$/,
    /^\/knowledge\/methodology\/[a-z0-9-]+$/,
    /^\/knowledge\/rankings\/[a-z0-9-]+$/,
    /^\/knowledge\/vertical\/[a-z0-9-]+$/,
    /^\/affordability$/,
    /^\/value-ranking$/,
    /^\/index-ranking$/,
  ];
  function pathMatchesRoute(path) {
    return canonicalPathPatterns.some((re) => re.test(path));
  }

  const CANONICAL_SAMPLE_CHECKS = [
    { jsonPath: "national.json", expectedCanonical: "/knowledge/national" },
    { jsonPath: "state/texas.json", expectedCanonical: "/knowledge/state/texas" },
    { jsonPath: "rankings/value-score.json", expectedCanonical: "/knowledge/rankings/value-score" },
    { jsonPath: "methodology/epi.json", expectedCanonical: "/knowledge/methodology/epi" },
  ];
  for (const { jsonPath, expectedCanonical } of CANONICAL_SAMPLE_CHECKS) {
    const fullPath = path.join(root, jsonPath);
    if (fs.existsSync(fullPath)) {
      const page = readJson(fullPath, jsonPath);
      const actual = (page?.meta?.canonicalUrl || "").replace(/^https?:\/\/[^/]+/, "") || page?.meta?.canonicalUrl;
      if (actual !== expectedCanonical) {
        fail(`canonicalUrl mismatch for ${jsonPath}: expected ${expectedCanonical}, got ${actual}`);
      }
    }
  }

  const provenanceCatalog = readJson(provenancePath, "provenance.json");
  if (
    !provenanceCatalog ||
    provenanceCatalog.schemaVersion !== "1.0" ||
    !Array.isArray(provenanceCatalog.sources)
  ) {
    fail("provenance.json missing required fields");
  }
  const globalProvenanceIds = new Set();
  for (const source of provenanceCatalog.sources) {
    if (!source || typeof source !== "object" || typeof source.id !== "string" || source.id.length === 0) {
      fail("provenance catalog has invalid source entry");
    }
    if (globalProvenanceIds.has(source.id)) {
      fail(`provenance catalog has duplicate source id: ${source.id}`);
    }
    globalProvenanceIds.add(source.id);
  }

  const docsJson = readJson(docsJsonPath, "docs/index.json");
  if (
    !docsJson ||
    docsJson.schemaVersion !== "1.0" ||
    !Array.isArray(docsJson.entryPoints)
  ) {
    fail("docs/index.json missing or invalid schemaVersion/entryPoints");
  }
  if (docsJson.sourceVersion !== index.sourceVersion) {
    fail(`docs/index.json sourceVersion mismatch: ${docsJson.sourceVersion} vs index ${index.sourceVersion}`);
  }
  for (const ep of docsJson.entryPoints || []) {
    if (!ep || typeof ep.url !== "string") continue;
    const urlPath = ep.url.replace(/^https?:\/\/[^/]+/, "") || ep.url;
    const filePath = path.join(process.cwd(), "public", urlPath.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      fail(`docs/index.json entryPoint ${ep.id || ep.url} references missing file: ${ep.url}`);
    }
  }

  const glossary = readJson(glossaryPath, "glossary/fields.json");
  if (
    !glossary ||
    glossary.schemaVersion !== "1.0" ||
    !Array.isArray(glossary.fields)
  ) {
    fail("glossary/fields.json missing or invalid schemaVersion/fields");
  }
  if (glossary.sourceVersion !== index.sourceVersion) {
    fail(`glossary/fields.json sourceVersion mismatch: ${glossary.sourceVersion} vs index ${index.sourceVersion}`);
  }
  const REQUIRED_GLOSSARY_FIELD_IDS = [
    "avgRateCentsPerKwh",
    "valueScore",
    "affordabilityIndex",
    "exampleBill1000kwh",
    "freshnessStatus",
    "qualityScore",
  ];
  const glossaryFieldIds = new Set((glossary.fields || []).map((f) => f?.id).filter(Boolean));
  for (const id of REQUIRED_GLOSSARY_FIELD_IDS) {
    if (!glossaryFieldIds.has(id)) {
      fail(`glossary/fields.json missing required field id: ${id}`);
    }
  }
  for (const field of glossary.fields || []) {
    if (!field || !Array.isArray(field.provenanceIds)) continue;
    for (const pid of field.provenanceIds) {
      if (!globalProvenanceIds.has(pid)) {
        fail(`glossary field ${field.id} references unknown provenance id: ${pid}`);
      }
    }
  }
  for (const field of glossary.fields || []) {
    if (!field || !Array.isArray(field.methodologies)) continue;
    for (const m of field.methodologies) {
      if (!methodologyIds.has(m.id)) {
        fail(`glossary field ${field.id} references unknown methodology id: ${m.id}`);
      }
    }
  }

  const contract = readJson(contractPath, "contract.json");
  if (
    !contract ||
    contract.schemaVersion !== "1.0" ||
    typeof contract.contractVersion !== "string" ||
    !/^\d+\.\d+\.\d+$/.test(contract.contractVersion) ||
    typeof contract.generatedAt !== "string" ||
    typeof contract.sourceVersion !== "string" ||
    !contract.endpoints ||
    !Array.isArray(contract.pageTypes) ||
    !contract.compatibility ||
    !Array.isArray(contract.compatibility.guarantees) ||
    typeof contract.compatibility.breakingChangePolicy !== "string"
  ) {
    fail("contract.json missing required fields");
  }
  if (contract.provenanceCatalogUrl !== "/knowledge/provenance.json") {
    fail("contract.json missing or invalid provenanceCatalogUrl");
  }
  if (contract.docsUrl !== "/knowledge/docs") {
    fail("contract.json missing or invalid docsUrl");
  }
  if (contract.docsJsonUrl !== "/knowledge/docs/index.json") {
    fail("contract.json missing or invalid docsJsonUrl");
  }
  if (
    !contract.provenanceSupport ||
    contract.provenanceSupport.enabled !== true ||
    contract.provenanceSupport.fieldLevel !== true
  ) {
    fail("contract.json missing valid provenanceSupport block");
  }
  if (
    !contract.querySurfaces ||
    contract.querySurfaces.searchIndexUrl !== "/knowledge/search-index.json" ||
    contract.querySurfaces.schemaMapUrl !== "/knowledge/schema-map.json" ||
    contract.querySurfaces.entityIndexUrl !== "/knowledge/entity-index.json" ||
    contract.querySurfaces.methodologyIndexUrl !== "/knowledge/methodology/index.json" ||
    contract.querySurfaces.compareStatesUrl !== "/knowledge/compare/states.json" ||
    contract.querySurfaces.rankingsIndexUrl !== "/knowledge/rankings/index.json"
  ) {
    fail("contract.json missing valid querySurfaces block");
  }
  if (contract.querySurfaces.publicEndpointsUrl !== "/knowledge/public-endpoints.json") {
    fail("contract.json querySurfaces missing or invalid publicEndpointsUrl");
  }
  if (!contract.deprecationPolicy || contract.deprecationPolicy.enabled !== true) {
    fail("contract.json missing valid deprecationPolicy block");
  }
  if (contract.deprecationPolicy.deprecationMapUrl !== "/knowledge/policy/deprecations.json") {
    fail("contract.json deprecationPolicy.deprecationMapUrl must be /knowledge/policy/deprecations.json");
  }
  if (
    !contract.offersSupport ||
    contract.offersSupport.offersConfigUrl !== "/knowledge/policy/offers-config.json"
  ) {
    fail("contract.json offersSupport must include offersConfigUrl: /knowledge/policy/offers-config.json");
  }
  if (contract.capabilitiesUrl !== "/knowledge/capabilities.json") {
    fail("contract.json capabilitiesUrl must be /knowledge/capabilities.json");
  }
  if (contract.releaseUrl !== "/knowledge/release.json") {
    fail("contract.json releaseUrl must be /knowledge/release.json");
  }

  const deprecationsPath = path.join(root, "policy", "deprecations.json");
  ensureFileExists(deprecationsPath, "policy/deprecations.json");
  const deprecations = readJson(deprecationsPath, "policy/deprecations.json");
  if (!deprecations || deprecations.schemaVersion !== "1.0") {
    fail("policy/deprecations.json missing or invalid schemaVersion");
  }
  if (deprecations.sourceVersion !== index.sourceVersion) {
    fail(`policy/deprecations.json sourceVersion mismatch: ${deprecations.sourceVersion} vs index ${index.sourceVersion}`);
  }
  if (deprecations.contractVersion !== contract.contractVersion) {
    fail(`policy/deprecations.json contractVersion mismatch: ${deprecations.contractVersion} vs contract ${contract.contractVersion}`);
  }
  if (Array.isArray(deprecations.items)) {
    for (const item of deprecations.items) {
      if (!item || typeof item !== "object") continue;
      if (item.status === "deprecated") {
        const r = item.replacement;
        if (!r || (typeof r.fieldId !== "string" && typeof r.url !== "string")) {
          fail(`policy/deprecations.json deprecated item ${item.id} must have replacement.fieldId or replacement.url`);
        }
      }
    }
  }

  const schemaMap = readJson(schemaMapPath, "schema-map.json");
  if (
    !schemaMap ||
    schemaMap.schemaVersion !== "1.0" ||
    !Array.isArray(schemaMap.entities)
  ) {
    fail("schema-map.json missing required fields");
  }
  const schemaMapTypes = new Set();
  for (const entity of schemaMap.entities) {
    if (
      !entity ||
      typeof entity !== "object" ||
      typeof entity.type !== "string" ||
      !Array.isArray(entity.metaFields) ||
      !Array.isArray(entity.dataFields) ||
      !Array.isArray(entity.filterableFields) ||
      !Array.isArray(entity.sortableFields)
    ) {
      fail("schema-map entity has invalid shape");
    }
    schemaMapTypes.add(entity.type);
    const dataFields = new Set(entity.dataFields);
    for (const field of entity.filterableFields) {
      if (!dataFields.has(field)) {
        fail(`schema-map filterable field not in dataFields for type ${entity.type}: ${field}`);
      }
    }
    for (const field of entity.sortableFields) {
      if (!dataFields.has(field)) {
        fail(`schema-map sortable field not in dataFields for type ${entity.type}: ${field}`);
      }
    }
    if (entity.fieldGroups) {
      if (
        !entity.fieldGroups.raw ||
        !Array.isArray(entity.fieldGroups.raw) ||
        !entity.fieldGroups.derived ||
        !Array.isArray(entity.fieldGroups.derived)
      ) {
        fail(`schema-map entity ${entity.type} has invalid fieldGroups`);
      }
      for (const f of entity.fieldGroups.raw) {
        if (!dataFields.has(`raw.${f}`) && !dataFields.has(f)) {
          fail(`schema-map fieldGroups.raw field not in dataFields for type ${entity.type}: ${f}`);
        }
      }
      for (const f of entity.fieldGroups.derived) {
        if (!dataFields.has(`derived.${f}`) && !dataFields.has(f)) {
          fail(`schema-map fieldGroups.derived field not in dataFields for type ${entity.type}: ${f}`);
        }
      }
    }
  }

  const entityIndex = readJson(entityIndexPath, "entity-index.json");
  if (
    !entityIndex ||
    entityIndex.schemaVersion !== "1.0" ||
    !Array.isArray(entityIndex.entities)
  ) {
    fail("entity-index.json missing required fields");
  }
  if (entityIndex.entities.length !== index.items.length) {
    fail(
      `entity-index count mismatch: got ${entityIndex.entities.length}, expected ${index.items.length}`,
    );
  }
  for (const entity of entityIndex.entities) {
    if (
      !entity ||
      typeof entity !== "object" ||
      typeof entity.id !== "string" ||
      typeof entity.type !== "string" ||
      typeof entity.slug !== "string" ||
      typeof entity.jsonUrl !== "string" ||
      typeof entity.canonicalUrl !== "string" ||
      typeof entity.semanticCluster !== "string" ||
      !entity.temporalContext ||
      typeof entity.temporalContext !== "object"
    ) {
      fail("entity-index entry has invalid shape");
    }
    if (!schemaMapTypes.has(entity.type)) {
      fail(`entity-index type missing from schema-map: ${entity.type}`);
    }
    const publicRelative = toPublicPath(entity.jsonUrl);
    const localPath = path.join(process.cwd(), "public", publicRelative.replace(/^\/+/, ""));
    if (!fs.existsSync(localPath)) {
      fail(`entity-index references missing file: ${entity.jsonUrl}`);
    }
    if (entity.type === "state") {
      const insightsStatePath = path.join(root, "insights", "state", `${entity.slug}.json`);
      if (!fs.existsSync(insightsStatePath)) {
        fail(`insights/state/${entity.slug}.json must exist`);
      }
    }
  }
  if (
    !contract.stability ||
    contract.stability.deterministicSerialization !== true ||
    contract.stability.regressionGuardUrl !== "/knowledge/regression.json" ||
    contract.stability.schemaFreezeEnforced !== true
  ) {
    fail("contract.json missing valid stability block");
  }
  if (
    !contract.integrity ||
    contract.integrity.manifestUrl !== "/knowledge/integrity/manifest.json" ||
    typeof contract.integrity.verificationNote !== "string"
  ) {
    fail("contract.json missing valid integrity block (manifestUrl, verificationNote)");
  }
  if (
    !contract.snapshotSupport ||
    contract.snapshotSupport.enabled !== true ||
    contract.snapshotSupport.historyIndexUrl !== "/knowledge/history/index.json" ||
    contract.snapshotSupport.snapshotPattern !== "/knowledge/history/{sourceVersion}/..."
  ) {
    fail("contract.json missing valid snapshotSupport block");
  }

  const changelog = readJson(changelogPath, "changelog.json");
  if (
    !changelog ||
    changelog.schemaVersion !== "1.0" ||
    typeof changelog.generatedAt !== "string" ||
    typeof changelog.sourceVersion !== "string" ||
    typeof changelog.contractVersion !== "string" ||
    !changelog.diff ||
    !Array.isArray(changelog.diff.added) ||
    !Array.isArray(changelog.diff.removed) ||
    !Array.isArray(changelog.diff.changed)
  ) {
    fail("changelog.json missing required fields");
  }
  if (!changelog.metricChanges || !Array.isArray(changelog.metricChanges.states) || !Array.isArray(changelog.metricChanges.national)) {
    fail("changelog.json missing metricChanges.states or metricChanges.national");
  }
  const CHANGE_THRESHOLD = 1;
  for (const stateEntry of changelog.metricChanges.states) {
    for (const fc of stateEntry.fieldsChanged || []) {
      const expectedPct = fc.previousValue === 0 ? 0 : (fc.absoluteDelta / fc.previousValue) * 100;
      if (Math.abs(fc.percentDelta - expectedPct) > 0.02) {
        fail(`changelog metricChanges percentDelta mismatch: ${stateEntry.slug} ${fc.field}`);
      }
    }
  }
  for (const fc of changelog.metricChanges.national || []) {
    const expectedPct = fc.previousValue === 0 ? 0 : (fc.absoluteDelta / fc.previousValue) * 100;
    if (Math.abs(fc.percentDelta - expectedPct) > 0.02) {
      fail(`changelog metricChanges national percentDelta mismatch: ${fc.field}`);
    }
  }
  if (contract.contractVersion !== changelog.contractVersion) {
    fail("contractVersion mismatch between contract.json and changelog.json");
  }

  for (const item of index.items) {
    if (!item || typeof item !== "object") {
      fail("registry item is not an object");
    }
    if (typeof item.jsonUrl !== "string" || item.jsonUrl.length === 0) {
      fail(`registry item missing jsonUrl: ${JSON.stringify(item)}`);
    }
    if (typeof item.freshnessStatus !== "string" || !["fresh", "aging", "stale", "unknown"].includes(item.freshnessStatus)) {
      fail(`index item missing or invalid freshnessStatus: ${item.id}`);
    }
    if (typeof item.datasetUpdatedAt !== "string") {
      fail(`index item missing datasetUpdatedAt: ${item.id}`);
    }
    if (item.type === "vertical") {
      if (typeof item.verticalGroup !== "string" || item.verticalGroup.length === 0) {
        fail(`vertical registry item missing verticalGroup: ${item.id}`);
      }
    } else if (Object.prototype.hasOwnProperty.call(item, "verticalGroup")) {
      fail(`non-vertical registry item should not include verticalGroup: ${item.id}`);
    }
    const publicRelative = toPublicPath(item.jsonUrl);
    const localPath = path.join(process.cwd(), "public", publicRelative.replace(/^\/+/, ""));
    if (!fs.existsSync(localPath)) {
      fail(`registry item references missing file: ${item.jsonUrl}`);
    }

    const page = readJson(localPath, item.jsonUrl);
    const disclaimerRefs = page.meta?.disclaimerRefs;
  if (!Array.isArray(disclaimerRefs) || disclaimerRefs.length === 0) {
    fail(`knowledge page missing or empty meta.disclaimerRefs: ${item.jsonUrl}`);
  }
  for (const ref of disclaimerRefs) {
    if (!disclaimerIds.has(ref)) {
      fail(`knowledge page meta.disclaimerRefs references unknown id: ${item.jsonUrl} -> ${ref}`);
    }
  }

  if (item.type === "state") {
      checkRequiredFields(page, item, STATE_REQUIRED_FIELDS, "state");
      checkFacts(page, item, "state");
      const comp = page.data?.derived?.comparison;
      if (!comp || typeof comp !== "object") {
        fail(`state page missing data.derived.comparison: ${item.jsonUrl}`);
      }
      if (typeof comp.nationalAverage !== "number") {
        fail(`state page data.derived.comparison.nationalAverage must be numeric: ${item.jsonUrl}`);
      }
      if (typeof comp.differencePercent !== "number") {
        fail(`state page data.derived.comparison.differencePercent must be numeric: ${item.jsonUrl}`);
      }
      const offersRef = page.data?.offersRef;
      if (!offersRef || typeof offersRef !== "object") {
        fail(`state page missing data.offersRef: ${item.jsonUrl}`);
      }
      if (offersRef.offersIndexUrl !== "/knowledge/offers/index.json") {
        fail(`state page data.offersRef.offersIndexUrl must be /knowledge/offers/index.json: ${item.jsonUrl}`);
      }
      if (offersRef.offersConfigUrl !== "/knowledge/policy/offers-config.json") {
        fail(`state page data.offersRef.offersConfigUrl must be /knowledge/policy/offers-config.json: ${item.jsonUrl}`);
      }
      if (offersRef.enabled !== offersConfig.offers.enabled) {
        fail(`state page data.offersRef.enabled must mirror offers-config.offers.enabled: ${item.jsonUrl}`);
      }
    } else if (item.type === "national") {
      checkRequiredFields(page, item, NATIONAL_REQUIRED_FIELDS, "national");
      checkFacts(page, item, "national");
    } else if (item.type === "rankings") {
      checkRequiredFields(page, item, RANKING_REQUIRED_FIELDS, "rankings");
      checkFacts(page, item, "rankings");
    } else     if (item.type === "methodology") {
      checkRequiredFields(page, item, METHODOLOGY_REQUIRED_FIELDS, "methodology");
      if (
        !page.meta.methodology ||
        typeof page.meta.methodology.id !== "string" ||
        typeof page.meta.methodology.version !== "string" ||
        typeof page.meta.methodology.lastReviewedAt !== "string" ||
        !Array.isArray(page.meta.methodology.relatedDerivedFields)
      ) {
        fail(`methodology page missing meta.methodology block: ${item.jsonUrl}`);
      }
      const mid = page.meta.methodology.id;
      if (!methodologyVersions[mid]) {
        fail(`methodology page references unknown methodology id: ${mid}`);
      }
      if (page.meta.methodology.version !== methodologyVersions[mid]) {
        fail(`methodology page version mismatch for ${mid}: ${page.meta.methodology.version} vs ${methodologyVersions[mid]}`);
      }
    } else if (item.type === "vertical") {
      checkRequiredFields(page, item, VERTICAL_REQUIRED_FIELDS, "vertical");
    }
    if (!page.meta || typeof page.meta !== "object") {
      fail(`knowledge page missing meta: ${item.jsonUrl}`);
    }
    const f = page.meta.freshness;
    if (
      !f ||
      typeof f !== "object" ||
      typeof f.datasetUpdatedAt !== "string" ||
      typeof f.computedAt !== "string" ||
      typeof f.status !== "string" ||
      !["fresh", "aging", "stale", "unknown"].includes(f.status) ||
      !f.methodology ||
      typeof f.methodology.id !== "string" ||
      typeof f.methodology.version !== "string" ||
      typeof f.methodology.url !== "string" ||
      typeof f.methodology.canonicalUrl !== "string"
    ) {
      fail(`knowledge page missing valid meta.freshness block: ${item.jsonUrl}`);
    }
    if (f.methodology.id !== "freshness") {
      fail(`meta.freshness.methodology.id must be "freshness": ${item.jsonUrl}`);
    }
    if (methodologyVersions.freshness && f.methodology.version !== methodologyVersions.freshness) {
      fail(`meta.freshness.methodology.version mismatch: ${item.jsonUrl} has ${f.methodology.version}, index has ${methodologyVersions.freshness}`);
    }
    if (f.status !== "unknown") {
      if (f.ageDays === undefined || typeof f.ageDays !== "number" || !Number.isInteger(f.ageDays) || f.ageDays < 0) {
        fail(`meta.freshness: when status !== "unknown", ageDays must be integer >= 0: ${item.jsonUrl}`);
      }
    }
    if (item.freshnessStatus !== f.status) {
      fail(`index item freshnessStatus mismatch: ${item.id} has ${item.freshnessStatus}, page has ${f.status}`);
    }
    if (item.datasetUpdatedAt !== f.datasetUpdatedAt) {
      fail(`index item datasetUpdatedAt mismatch: ${item.id}`);
    }
    if (item.type === "state" && page.meta.changeSummary) {
      const cs = page.meta.changeSummary;
      if (!cs.comparedToVersion || !Array.isArray(cs.significantChanges)) {
        fail(`state page changeSummary invalid: ${item.jsonUrl}`);
      }
      const changelogState = changelog.metricChanges.states.find((s) => s.slug === item.slug);
      for (const sc of cs.significantChanges) {
        if (Math.abs(sc.percentDelta) < CHANGE_THRESHOLD) {
          fail(`state page changeSummary has percentDelta < threshold: ${item.jsonUrl} ${sc.field}`);
        }
        if (changelogState) {
          const inChangelog = (changelogState.fieldsChanged || []).some((fc) => fc.field === sc.field);
          if (!inChangelog) {
            fail(`state page changeSummary field not in changelog metricChanges: ${item.jsonUrl} ${sc.field}`);
          }
        }
      }
    }
    if (item.type === "national" && page.meta.changeSummary) {
      const cs = page.meta.changeSummary;
      if (!cs.comparedToVersion || !Array.isArray(cs.significantChanges)) {
        fail(`national page changeSummary invalid: ${item.jsonUrl}`);
      }
      for (const sc of cs.significantChanges) {
        if (Math.abs(sc.percentDelta) < CHANGE_THRESHOLD) {
          fail(`national page changeSummary has percentDelta < threshold: ${item.jsonUrl} ${sc.field}`);
        }
        const inChangelog = (changelog.metricChanges.national || []).some((fc) => fc.field === sc.field);
        if (!inChangelog) {
          fail(`national page changeSummary field not in changelog metricChanges: ${item.jsonUrl} ${sc.field}`);
        }
      }
    }
    if (!page.meta.contentHash || typeof page.meta.contentHash !== "string") {
      fail(`knowledge page missing contentHash: ${item.jsonUrl}`);
    }
    const integrity = page.meta.integrity;
    if (!integrity || typeof integrity !== "object") {
      fail(`knowledge page missing meta.integrity: ${item.jsonUrl}`);
    }
    if (integrity.integrityAlgorithm !== "sha256") {
      fail(`knowledge page meta.integrity.integrityAlgorithm must be "sha256": ${item.jsonUrl}`);
    }
    if (typeof integrity.signedAtBuild !== "string" || integrity.signedAtBuild.length === 0) {
      fail(`knowledge page missing meta.integrity.signedAtBuild: ${item.jsonUrl}`);
    }
    const isoRe = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;
    if (!isoRe.test(integrity.signedAtBuild)) {
      fail(`knowledge page meta.integrity.signedAtBuild must be valid ISO: ${item.jsonUrl}`);
    }
    if (integrity.contentHash !== page.meta.contentHash) {
      fail(`knowledge page meta.integrity.contentHash mismatch: ${item.jsonUrl}`);
    }
    if (!Array.isArray(page.meta.provenance)) {
      fail(`knowledge page missing meta.provenance: ${item.jsonUrl}`);
    }
    if (!Array.isArray(page.meta.fieldProvenance)) {
      fail(`knowledge page missing meta.fieldProvenance: ${item.jsonUrl}`);
    }
    if (
      !page.meta.llmHints ||
      typeof page.meta.llmHints !== "object" ||
      typeof page.meta.llmHints.semanticCluster !== "string" ||
      page.meta.llmHints.semanticCluster.length === 0
    ) {
      fail(`knowledge page missing llmHints.semanticCluster: ${item.jsonUrl}`);
    }
    if (
      !page.meta.temporalContext ||
      typeof page.meta.temporalContext !== "object" ||
      page.meta.temporalContext.sourceVersion !== page.meta.sourceVersion ||
      page.meta.temporalContext.isLatest !== true
    ) {
      fail(`knowledge page missing valid temporalContext: ${item.jsonUrl}`);
    }
    const pageProvenanceIds = new Set();
    for (const source of page.meta.provenance) {
      if (!source || typeof source !== "object" || typeof source.id !== "string") {
        fail(`knowledge page has invalid provenance source: ${item.jsonUrl}`);
      }
      pageProvenanceIds.add(source.id);
      if (!globalProvenanceIds.has(source.id)) {
        fail(`knowledge page references unknown global provenance id: ${source.id}`);
      }
    }
    for (const fp of page.meta.fieldProvenance) {
      if (
        !fp ||
        typeof fp !== "object" ||
        typeof fp.field !== "string" ||
        !Array.isArray(fp.provenanceIds)
      ) {
        fail(`knowledge page has invalid fieldProvenance entry: ${item.jsonUrl}`);
      }
      for (const provenanceId of fp.provenanceIds) {
        if (!pageProvenanceIds.has(provenanceId)) {
          fail(
            `fieldProvenance references provenance id not present on page: ${item.jsonUrl} -> ${provenanceId}`,
          );
        }
      }
      if (fp.isDerived === true) {
        if (!Array.isArray(fp.derivedFromFields)) {
          fail(`derived fieldProvenance missing derivedFromFields: ${item.jsonUrl} -> ${fp.field}`);
        }
      }
      if (fp.derivedFromFields && fp.derivedFromFields.length > 0) {
        const validPaths = new Set();
        const addPaths = (obj, prefix) => {
          if (!obj || typeof obj !== "object") return;
          for (const k of Object.keys(obj)) {
            const p = prefix ? `${prefix}.${k}` : k;
            validPaths.add(p);
            if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
              addPaths(obj[k], p);
            }
          }
        };
        addPaths(page.data, "data");
        for (const ref of fp.derivedFromFields) {
          const normalized = ref.startsWith("data.") ? ref : `data.${ref}`;
          if (!validPaths.has(normalized) && !validPaths.has(ref)) {
            fail(`derivedFromFields references invalid path: ${item.jsonUrl} -> ${fp.field} -> ${ref}`);
          }
        }
      }
    }

    if (item.type === "state" && page.data) {
      const data = page.data;
      if (!data.raw || typeof data.raw !== "object") {
        fail(`state page missing data.raw block: ${item.jsonUrl}`);
      }
      if (!data.derived || typeof data.derived !== "object") {
        fail(`state page missing data.derived block: ${item.jsonUrl}`);
      }
      if (!data.derivedMeta || !Array.isArray(data.derivedMeta.methodologiesUsed)) {
        fail(`state page missing data.derivedMeta.methodologiesUsed: ${item.jsonUrl}`);
      }
      const allAppliesTo = new Set();
      for (const m of data.derivedMeta.methodologiesUsed) {
        if (!Array.isArray(m.appliesToFields)) continue;
        for (const p of m.appliesToFields) {
          allAppliesTo.add(p);
        }
      }
      const derivedLeafPaths = [];
      function collectPaths(obj, prefix) {
        if (!obj || typeof obj !== "object") return;
        for (const k of Object.keys(obj)) {
          const p = prefix ? `${prefix}.${k}` : k;
          const fullPath = `data.derived.${p}`;
          const v = obj[k];
          if (v !== null && typeof v === "object" && !Array.isArray(v)) {
            collectPaths(v, p);
          } else {
            derivedLeafPaths.push(fullPath);
          }
        }
      }
      collectPaths(data.derived, "");
      for (const fp of derivedLeafPaths) {
        const covered =
          allAppliesTo.has(fp) ||
          fp.split(".").some((_, i, parts) => {
            const prefix = parts.slice(0, i + 1).join(".");
            return allAppliesTo.has(prefix);
          });
        if (!covered) {
          fail(`state page derived field not covered by methodology: ${item.jsonUrl} -> ${fp}`);
        }
      }
      for (const m of data.derivedMeta.methodologiesUsed) {
        if (typeof m.id !== "string" || typeof m.version !== "string") {
          fail(`state page derivedMeta.methodologiesUsed entry missing id/version: ${item.jsonUrl}`);
        }
        if (methodologyVersions[m.id] && m.version !== methodologyVersions[m.id]) {
          fail(
            `state page methodology version mismatch for ${m.id}: ${m.version} vs ${methodologyVersions[m.id]} in ${item.jsonUrl}`,
          );
        }
      }
      const rawKeys = ["slug", "name", "postal", "avgRateCentsPerKwh", "updated"];
      for (const k of rawKeys) {
        if (!Object.prototype.hasOwnProperty.call(data.raw, k)) {
          fail(`state page data.raw missing expected field: ${item.jsonUrl} -> ${k}`);
        }
      }
      const pr = data.derived.percentileRankings;
      if (pr) {
        const check = (val, name) => {
          if (val !== null && (typeof val !== "number" || val < 0 || val > 100)) {
            fail(`state page percentile out of range: ${item.jsonUrl} -> ${name}=${val}`);
          }
        };
        check(pr.ratePercentile, "ratePercentile");
        check(pr.valueScorePercentile, "valueScorePercentile");
        check(pr.affordabilityPercentile, "affordabilityPercentile");
      }
    }

    if (item.type === "national" && page.data) {
      const data = page.data;
      if (!data.raw || typeof data.raw !== "object") {
        fail(`national page missing data.raw block: ${item.jsonUrl}`);
      }
      if (!data.derived || typeof data.derived !== "object") {
        fail(`national page missing data.derived block: ${item.jsonUrl}`);
      }
      if (!data.derived.dispersionMetrics || typeof data.derived.dispersionMetrics !== "object") {
        fail(`national page missing data.derived.dispersionMetrics: ${item.jsonUrl}`);
      }
      if (!data.derivedMeta || !Array.isArray(data.derivedMeta.methodologiesUsed)) {
        fail(`national page missing data.derivedMeta.methodologiesUsed: ${item.jsonUrl}`);
      }
      const nationalAppliesTo = new Set();
      for (const m of data.derivedMeta.methodologiesUsed) {
        if (!Array.isArray(m.appliesToFields)) continue;
        for (const p of m.appliesToFields) nationalAppliesTo.add(p);
      }
      const nationalDerivedPaths = [];
      function collectNationalPaths(obj, prefix) {
        if (!obj || typeof obj !== "object") return;
        for (const k of Object.keys(obj)) {
          const p = prefix ? `${prefix}.${k}` : k;
          const fullPath = `data.derived.${p}`;
          const v = obj[k];
          if (v !== null && typeof v === "object" && !Array.isArray(v)) {
            collectNationalPaths(v, p);
          } else {
            nationalDerivedPaths.push(fullPath);
          }
        }
      }
      collectNationalPaths(data.derived, "");
      for (const fp of nationalDerivedPaths) {
        const covered =
          nationalAppliesTo.has(fp) ||
          fp.split(".").some((_, i, parts) => {
            const prefix = parts.slice(0, i + 1).join(".");
            return nationalAppliesTo.has(prefix);
          });
        if (!covered) {
          fail(`national page derived field not covered by methodology: ${item.jsonUrl} -> ${fp}`);
        }
      }
      for (const m of data.derivedMeta.methodologiesUsed) {
        if (methodologyVersions[m.id] && m.version !== methodologyVersions[m.id]) {
          fail(
            `national page methodology version mismatch for ${m.id}: ${m.version} vs ${methodologyVersions[m.id]} in ${item.jsonUrl}`,
          );
        }
      }
    }
    if (item.type === "rankings" && page.data) {
      const data = page.data;
      if (!data.derivedMeta || !Array.isArray(data.derivedMeta.methodologiesUsed)) {
        fail(`rankings page missing data.derivedMeta.methodologiesUsed: ${item.jsonUrl}`);
      }
      for (const m of data.derivedMeta.methodologiesUsed) {
        if (methodologyVersions[m.id] && m.version !== methodologyVersions[m.id]) {
          fail(
            `rankings page methodology version mismatch for ${m.id}: ${m.version} vs ${methodologyVersions[m.id]} in ${item.jsonUrl}`,
          );
        }
      }
    }
    const derivedCitations = page.meta.provenance.map((source) => ({
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
      retrievedAt: source.retrievedAt,
      notes: source.notes,
    }));
    if (!Array.isArray(page.meta.citations) || page.meta.citations.length !== derivedCitations.length) {
      fail(`citations do not match provenance-derived count: ${item.jsonUrl}`);
    }
    for (let i = 0; i < derivedCitations.length; i += 1) {
      const expected = derivedCitations[i];
      const actual = page.meta.citations[i];
      if (
        actual.sourceName !== expected.sourceName ||
        actual.sourceUrl !== expected.sourceUrl ||
        actual.retrievedAt !== expected.retrievedAt ||
        actual.notes !== expected.notes
      ) {
        fail(`citations do not match provenance-derived values: ${item.jsonUrl}`);
      }
    }
    const computedHash = recomputeContentHash(page);
    if (!computedHash) {
      fail(`unable to compute contentHash: ${item.jsonUrl}`);
    }
    if (computedHash !== page.meta.contentHash) {
      fail(`contentHash mismatch for ${item.jsonUrl}`);
    }
    if (item.contentHash !== page.meta.contentHash) {
      fail(`registry contentHash mismatch for ${item.id}`);
    }
    const qs = page.meta.qualityScore;
    if (typeof qs !== "number" || !Number.isInteger(qs) || qs < 0 || qs > 100) {
      fail(`page meta.qualityScore must be integer 0-100: ${item.jsonUrl} (got ${qs})`);
    }
    const pageType = item.type;
    const expectedQuality = computeQualityScore(page.meta, page.data || {}, pageType);
    if (expectedQuality !== qs) {
      fail(`qualityScore mismatch: ${item.jsonUrl} has ${qs}, recomputed ${expectedQuality}`);
    }
    if (typeof item.qualityScore !== "number" || item.qualityScore !== qs) {
      fail(`registry qualityScore mismatch for ${item.id}: registry=${item.qualityScore}, page=${qs}`);
    }
    pageQualityById.set(item.id, qs);
    const canonicalPath = item.canonicalUrl.replace(/^https?:\/\/[^/]+/, "") || "/";
    if (!pathMatchesRoute(canonicalPath)) {
      fail(`registry canonicalUrl does not match implemented route: ${item.id} -> ${item.canonicalUrl}`);
    }
    const re = page.data && page.data.relatedEntities;
    if (re && typeof re === "object") {
      const checkRefs = (type, slugs) => {
        if (!Array.isArray(slugs)) return;
        for (const slug of slugs) {
          const key = `${type}:${slug}`;
          if (!validEntityRefs.has(key)) {
            fail(`relatedEntities references non-existent entity: ${item.jsonUrl} -> ${key}`);
          }
        }
      };
      checkRefs("state", re.states);
      checkRefs("rankings", re.rankings);
      checkRefs("methodology", re.methodologies);
      checkRefs("vertical", re.verticals);
    }
    if (item.id === "knowledge:vertical:ai-energy") {
      const expansionReadiness = page.data && page.data.expansionReadiness;
      if (
        !expansionReadiness ||
        typeof expansionReadiness !== "object" ||
        typeof expansionReadiness.dataAvailable !== "boolean" ||
        !Array.isArray(expansionReadiness.plannedDatasets) ||
        typeof expansionReadiness.lastEvaluated !== "string"
      ) {
        fail("AI-energy vertical page missing valid expansionReadiness block");
      }
    }
  }

  const searchIndex = readJson(path.join(root, "search-index.json"), "search-index.json");
  if (!searchIndex || !Array.isArray(searchIndex.entities)) {
    fail("search-index.json missing or invalid");
  }
  const searchById = new Map(searchIndex.entities.map((e) => [e.id, e]));
  for (const item of index.items) {
    if (!searchById.has(item.id)) {
      fail(`search-index.json missing entity for index item: ${item.id}`);
    }
  }
  const indexById = new Map(index.items.map((it) => [it.id, it]));
  for (const entity of searchIndex.entities) {
    if (!entity || typeof entity.id !== "string") {
      fail("search-index entity missing id");
    }
    if (typeof entity.excerpt !== "string") {
      fail(`search-index entity ${entity.id} missing excerpt`);
    }
    if (!Array.isArray(entity.tokens)) {
      fail(`search-index entity ${entity.id} missing tokens`);
    }
    if (entity.excerpt.length > 0) {
      const excerptWords = entity.excerpt
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t.length > 1);
      const tokenSet = new Set(entity.tokens.map((t) => String(t).toLowerCase()));
      const overlap = excerptWords.filter((w) => tokenSet.has(w));
      if (excerptWords.length > 0 && overlap.length === 0) {
        fail(`search-index entity ${entity.id} tokens must include excerpt words`);
      }
    }
    if (typeof entity.freshnessStatus !== "string" || !["fresh", "aging", "stale", "unknown"].includes(entity.freshnessStatus)) {
      fail(`search-index entity ${entity.id} missing or invalid freshnessStatus`);
    }
    const idxItem = indexById.get(entity.id);
    if (idxItem && idxItem.freshnessStatus !== entity.freshnessStatus) {
      fail(`search-index freshnessStatus mismatch for ${entity.id}: ${entity.freshnessStatus} vs index ${idxItem.freshnessStatus}`);
    }
    if (entity.freshnessStatus !== "unknown" && entity.ageDays !== undefined) {
      if (typeof entity.ageDays !== "number" || !Number.isInteger(entity.ageDays) || entity.ageDays < 0) {
        fail(`search-index entity ${entity.id} has invalid ageDays`);
      }
    }
    const expectedQuality = pageQualityById.get(entity.id);
    if (expectedQuality !== undefined) {
      if (typeof entity.qualityScore !== "number" || entity.qualityScore !== expectedQuality) {
        fail(`search-index qualityScore mismatch for ${entity.id}: search=${entity.qualityScore}, page=${expectedQuality}`);
      }
      const qualityToken = `quality-${entity.qualityScore}`;
      if (!Array.isArray(entity.tokens) || !entity.tokens.includes(qualityToken)) {
        fail(`search-index entity ${entity.id} missing quality token: ${qualityToken}`);
      }
    }
  }

  const typeOrder = { national: 0, state: 1, methodology: 2, rankings: 3, vertical: 4 };
  const sortedItems = [...index.items].sort((a, b) => {
    const to = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
    if (to !== 0) return to;
    return String(a.slug ?? a.id).localeCompare(String(b.slug ?? b.id));
  });
  const computedRegistryHash = sha256(serializeDeterministic(sortedItems));
  if (computedRegistryHash !== index.registryHash) {
    fail("registryHash mismatch in index.json");
  }
  const contentHashesById = [...index.items]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => item.contentHash)
    .join("|");
  const computedIntegritySignature = sha256(contentHashesById);
  if (computedIntegritySignature !== index.integritySignature) {
    fail("integritySignature mismatch in index.json");
  }
  if (index.totalPages !== index.items.length + 6) {
    fail(`totalPages mismatch: got ${index.totalPages}, expected ${index.items.length + 6}`);
  }

  const historyIndex = readJson(historyIndexPath, "history/index.json");
  if (
    !historyIndex ||
    historyIndex.schemaVersion !== "1.0" ||
    !Array.isArray(historyIndex.snapshots)
  ) {
    fail("history/index.json missing required fields");
  }
  const seenVersions = new Set();
  for (const snapshot of historyIndex.snapshots) {
    if (!snapshot || typeof snapshot !== "object") {
      fail("history snapshot entry must be an object");
    }
    if (
      typeof snapshot.sourceVersion !== "string" ||
      typeof snapshot.indexUrl !== "string" ||
      typeof snapshot.generatedAt !== "string" ||
      typeof snapshot.pageCount !== "number" ||
      typeof snapshot.indexContentHash !== "string" ||
      typeof snapshot.registryHash !== "string"
    ) {
      fail("history snapshot entry missing required fields");
    }
    if (seenVersions.has(snapshot.sourceVersion)) {
      fail(`duplicate snapshot sourceVersion in history index: ${snapshot.sourceVersion}`);
    }
    seenVersions.add(snapshot.sourceVersion);
  }
  const latestSnapshot = historyIndex.snapshots.find(
    (snapshot) => snapshot.sourceVersion === index.sourceVersion,
  );
  if (!latestSnapshot) {
    fail(`missing current sourceVersion in history index: ${index.sourceVersion}`);
  }
  const latestSnapshotPath = path.join(
    process.cwd(),
    "public",
    latestSnapshot.indexUrl.replace(/^\/+/, ""),
  );
  ensureFileExists(
    latestSnapshotPath,
    `snapshot index for sourceVersion ${index.sourceVersion}`,
  );
  const snapshotIndex = readJson(latestSnapshotPath, latestSnapshot.indexUrl);
  if (snapshotIndex.registryHash !== index.registryHash) {
    fail("snapshot registryHash mismatch with current index registryHash");
  }
  const currentIndexContentHash = sha256(serializeDeterministic(index));
  if (latestSnapshot.indexContentHash !== currentIndexContentHash) {
    fail("snapshot indexContentHash mismatch with current index content hash");
  }
  if (snapshotIndex.sourceVersion !== index.sourceVersion) {
    fail("snapshot index sourceVersion does not match current index sourceVersion");
  }

  const addedUrls = new Set(changelog.diff.added.map((entry) => entry.jsonUrl));
  const removedUrls = new Set(changelog.diff.removed.map((entry) => entry.jsonUrl));
  const currentUrls = new Set(index.items.map((item) => item.jsonUrl));
  for (const entry of changelog.diff.changed) {
    if (
      !entry ||
      typeof entry.jsonUrl !== "string" ||
      typeof entry.fromHash !== "string" ||
      typeof entry.toHash !== "string"
    ) {
      fail("invalid changed entry in changelog.json");
    }
    if (!currentUrls.has(entry.jsonUrl)) {
      fail(`changed entry jsonUrl missing from current index: ${entry.jsonUrl}`);
    }
    if (addedUrls.has(entry.jsonUrl) || removedUrls.has(entry.jsonUrl)) {
      fail(`changed entry must not appear in added/removed: ${entry.jsonUrl}`);
    }
    if (entry.fromHash === entry.toHash) {
      fail(`changed entry has identical fromHash/toHash: ${entry.jsonUrl}`);
    }
  }

  const regressionPath = path.join(root, "regression.json");
  const regressionPreviousPath = path.join(root, "regression-previous.json");
  if (fs.existsSync(regressionPreviousPath)) {
    const currentRegression = readJson(regressionPath, "regression.json");
    const previousRegression = readJson(regressionPreviousPath, "regression-previous.json");
    if (!currentRegression || !previousRegression) {
      fail("regression files invalid");
    }
    const currCounts = currentRegression.entityTypeCounts || {};
    const prevCounts = previousRegression.entityTypeCounts || {};
    const types = ["national", "state", "methodology", "rankings", "vertical"];
    for (const t of types) {
      if (currCounts[t] !== prevCounts[t]) {
        fail(
          `structural drift: entityTypeCounts.${t} changed from ${prevCounts[t]} to ${currCounts[t]}`,
        );
      }
    }
    const currFp = currentRegression.fieldFingerprints || {};
    const prevFp = previousRegression.fieldFingerprints || {};
    for (const t of types) {
      if (currFp[t] !== prevFp[t]) {
        fail(
          `structural drift: fieldFingerprints.${t} changed (schema shape modified)`,
        );
      }
    }
  }

  if (fs.existsSync(graphPath)) {
    const graph = readJson(graphPath, "graph.json");
    if (graph.knowledgeEdges !== undefined) {
      if (!Array.isArray(graph.knowledgeEdges)) {
        fail("graph.json knowledgeEdges must be an array");
      }
      const validRelations = new Set(["references", "derived-from", "related-to"]);
      for (const edge of graph.knowledgeEdges) {
        if (!edge || typeof edge !== "object") {
          fail("graph knowledge edge must be an object");
        }
        if (!validPageIds.has(edge.from) || !validPageIds.has(edge.to)) {
          fail(`graph knowledge edge references invalid page id: ${JSON.stringify(edge)}`);
        }
        if (!validRelations.has(edge.relation)) {
          fail(`graph knowledge edge has invalid relation: ${JSON.stringify(edge)}`);
        }
      }
    }
  }

  if (releaseMode) {
    ensureFileExists(contractSnapshotPath, "contract-snapshot.json");
    ensureFileExists(path.join(root, "release.json"), "release.json");
    ensureFileExists(path.join(root, "capabilities.json"), "capabilities.json");
    ensureFileExists(path.join(root, "public-endpoints.json"), "public-endpoints.json");
    ensureFileExists(path.join(root, "fingerprint.json"), "fingerprint.json");
    const releaseCv = releaseForDrift.contractVersion;
    const capabilitiesCv = capabilitiesForDrift.contractVersion;
    const fingerprintCv = fingerprint.contractVersion;
    const indexCv = indexForDrift.contractVersion;
    const expectedCv = releaseCv || capabilitiesCv;
    if (!expectedCv) {
      fail("release.json and capabilities.json must contain contractVersion (release mode)");
    }
    if (fingerprintCv && fingerprintCv !== expectedCv) {
      fail(`fingerprint.json contractVersion ${fingerprintCv} must match ${expectedCv} (release mode)`);
    }
    if (indexCv && indexCv !== expectedCv) {
      fail(`index.json contractVersion ${indexCv} must match ${expectedCv} (release mode)`);
    }
    if (capabilitiesCv !== expectedCv) {
      fail(`capabilities.json contractVersion must match ${expectedCv} (release mode)`);
    }
    const manifestPath = path.join(root, "integrity", "manifest.json");
    ensureFileExists(manifestPath, "integrity/manifest.json");
    const manifest = readJson(manifestPath, "integrity/manifest.json");
    if (manifest.signature && manifest.signature.enabled === true) {
      fail("integrity/manifest.json signature.enabled must be false (release mode)");
    }
    ensureFileExists(path.join(root, "search-index.json"), "search-index.json");
    ensureFileExists(indexPath, "index.json");
    ensureFileExists(contractPath, "contract.json");
    const pe = readJson(path.join(root, "public-endpoints.json"), "public-endpoints.json");
    const allUrls = (pe.groups || []).flatMap((g) => (g.items || []).map((i) => i.url || ""));
    if (!allUrls.some((u) => u.includes("/knowledge/release.json"))) {
      fail("public-endpoints.json must include /knowledge/release.json (llms.txt source)");
    }
    if (!allUrls.some((u) => u.includes("/knowledge/search-index.json"))) {
      fail("public-endpoints.json must include /knowledge/search-index.json (llms.txt source)");
    }
    if (!allUrls.some((u) => u.includes("/knowledge/fingerprint.json"))) {
      fail("public-endpoints.json must include /knowledge/fingerprint.json (llms.txt source)");
    }
    const registryRoutePath = path.join(process.cwd(), "src", "app", "registry.json", "route.ts");
    const registrySource = fs.readFileSync(registryRoutePath, "utf8");
    if (!registrySource.includes("knowledgeReleaseUrl")) {
      fail("registry.json route must contain knowledgeReleaseUrl");
    }
    if (!registrySource.includes("knowledgeSearchIndex") && !registrySource.includes("knowledgeSearchIndexUrl")) {
      fail("registry.json route must contain knowledgeSearchIndex or knowledgeSearchIndexUrl");
    }
    if (!registrySource.includes("knowledgeFingerprintUrl")) {
      fail("registry.json route must contain knowledgeFingerprintUrl");
    }
    const fingerprintInputs = [
      "/knowledge/release.json",
      "/knowledge/capabilities.json",
      "/knowledge/public-endpoints.json",
      "/knowledge/search-index.json",
      "/knowledge/integrity/manifest.json",
    ];
    const parts = [];
    for (const url of fingerprintInputs) {
      const p = path.join(root, url.replace(/^\/knowledge\//, ""));
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        const parsed = JSON.parse(raw);
        parts.push(serializeDeterministic(parsed));
      }
    }
    if (parts.length !== fingerprintInputs.length) {
      fail("fingerprint inputs missing; cannot recompute hash in release mode");
    }
    const computedHash = sha256(parts.join(""));
    const storedHash = fingerprint.hash?.value;
    if (typeof storedHash !== "string" || storedHash.length === 0) {
      fail("fingerprint.json hash.value missing or null (release mode)");
    }
    if (computedHash !== storedHash) {
      fail(`fingerprint hash mismatch: computed ${computedHash}, stored ${storedHash}`);
    }
  }

  runPreLaunchVerification(root, sitemapSource, layoutSource);

  console.log("knowledge:verify passed");
  console.log(`index items: ${index.items.length}`);
  console.log(`state files: ${stateFiles.length}`);
  console.log(`registry hash: ${index.registryHash}`);
}

const KNOWN_STATIC_ROUTES = new Set([
  "/",
  "/knowledge",
  "/electricity-trends",
  "/electricity-topics",
  "/electricity-insights",
  "/electricity-inflation",
  "/electricity-affordability",
  "/electricity-cost-of-living",
  "/data-center-electricity-cost",
  "/solar-vs-grid-electricity-cost",
  "/battery-backup-electricity-cost",
  "/electricity-price-volatility",
  "/why-electricity-prices-rise",
  "/why-electricity-is-expensive",
  "/why-electricity-is-cheap",
  "/grid-capacity-and-electricity-demand",
  "/power-generation-mix",
  "/power-generation-mix/fuel-costs-and-electricity-prices",
  "/power-generation-mix/generation-mix-and-price-volatility",
  "/electricity-markets",
  "/electricity-markets/iso-rto-markets",
  "/electricity-markets/regulated-electricity-markets",
  "/regional-electricity-markets",
  "/regional-electricity-markets/why-electricity-prices-differ-by-region",
  "/regional-electricity-markets/regional-grid-structure",
  "/electricity-generation-cost-drivers",
  "/electricity-generation-cost-drivers/fuel-prices-and-generation-costs",
  "/electricity-generation-cost-drivers/infrastructure-and-electricity-costs",
  "/electricity-data",
  "/entity-registry",
  "/datasets",
  "/methodology",
  "/site-map",
  "/page-index",
  "/data-registry",
  "/discovery-graph",
  "/business-electricity-cost-decisions",
  "/business-electricity-cost-decisions/choosing-a-state-for-electricity-costs",
  "/business-electricity-cost-decisions/electricity-costs-for-small-businesses",
  "/electricity-cost",
  "/average-electricity-bill",
  "/electricity-cost-calculator",
  "/electricity-providers",
  "/solar-savings",
  "/battery-recharge-cost",
  "/generator-vs-battery-cost",
  "/electricity-price-history",
  "/moving-to-electricity-cost",
  "/electricity-cost-comparison",
  "/ai-energy-demand",
  "/datasets/electricity-prices-by-state",
  "/datasets/electricity-rankings",
  "/methodology/electricity-rates",
  "/methodology/electricity-inflation",
  "/methodology/electricity-affordability",
  "/methodology/battery-recharge-cost",
  "/methodology/generator-vs-battery-cost",
  "/methodology/electricity-price-index",
  "/methodology/value-score",
  "/methodology/freshness-scoring",
  "/knowledge/rankings",
  "/knowledge/pages",
  "/knowledge/national",
  "/knowledge/compare",
  "/knowledge/regions",
  "/knowledge/docs",
  "/ai-energy-demand/data-centers-electricity",
  "/ai-energy-demand/ai-power-consumption",
  "/ai-energy-demand/electricity-prices-and-ai",
  "/ai-energy-demand/grid-strain-and-electricity-costs",
  "/data",
  "/about",
  "/compare",
  "/affordability",
  "/value-ranking",
  "/index-ranking",
  "/research",
  "/sources",
  "/data-policy",
  "/contact",
  "/newsletter",
  "/changelog",
  "/press",
  "/licensing",
  "/api-docs",
  "/status",
  "/offers",
  "/disclosures",
  "/regulatory",
  "/attribution",
  "/citations",
  "/press-kit",
  "/index",
  "/launch-checklist",
  "/growth-roadmap",
  "/site-maintenance",
  "/site-maintenance/data-refresh",
  "/site-maintenance/quality-checks",
  "/site-maintenance/content-expansion",
  "/electricity-shopping",
  "/electricity-shopping/by-state",
  "/electricity-shopping/how-electricity-shopping-works",
  "/shop-electricity",
  "/business-electricity-options",
  "/future-expansion",
  "/future-expansion/programmatic-scaling",
  "/future-expansion/topic-expansion",
  "/future-expansion/data-and-discovery-expansion",
  "/operating-playbook",
  "/operating-playbook/data-updates",
  "/operating-playbook/expanding-the-site",
  "/operating-playbook/quality-and-verification",
  "/growth-roadmap/programmatic-pages",
  "/growth-roadmap/topic-clusters",
  "/growth-roadmap/linkable-assets",
  "/metrics",
  "/submit-urls",
  "/readiness",
  "/revenue",
  "/performance",
  "/data-history",
  "/v/ai-energy",
  "/drivers",
  "/regulatory/queue",
  "/alerts",
  "/knowledge.json",
  "/registry.json",
  "/graph.json",
]);

const KNOWN_ROUTE_FAMILY_PREFIXES = [
  "/electricity-cost/",
  "/average-electricity-bill/",
  "/electricity-bill-estimator/",
  "/electricity-cost-calculator/",
  "/energy-comparison/",
  "/electricity-usage/",
  "/electricity-usage/home-size/",
  "/electricity-usage/appliances/",
  "/electricity-usage-cost/",
  "/cost-to-run/",
  "/electricity-providers/",
  "/shop-electricity/",
  "/business-electricity-options/",
  "/solar-savings/",
  "/battery-recharge-cost/",
  "/generator-vs-battery-cost/",
  "/electricity-price-history/",
  "/electricity-inflation/",
  "/electricity-affordability/",
  "/electricity-cost-of-living/",
  "/data-center-electricity-cost/",
  "/solar-vs-grid-electricity-cost/",
  "/battery-backup-electricity-cost/",
  "/electricity-price-volatility/",
  "/why-electricity-is-expensive/",
  "/why-electricity-is-cheap/",
  "/moving-to-electricity-cost/",
  "/knowledge/state/",
  "/knowledge/rankings/",
  "/electricity-cost-comparison/",
  "/knowledge/compare/",
  "/knowledge/regions/",
  "/knowledge/methodology/",
  "/knowledge/vertical/",
  "/knowledge/",
  "/datasets/",
  "/methodology/",
  "/v/",
  "/regulatory/",
  "/drivers/",
  "/alerts/",
  "/offers/",
  "/data-history/",
];

function extractInternalRoutesFromSource(source) {
  const routes = new Set();
  const hrefRe = /href\s*=\s*["'](\/[^"']*)["']/g;
  const hrefObjRe = /href:\s*["'](\/[^"']*)["']/g;
  let m;
  while ((m = hrefRe.exec(source)) !== null) {
    const raw = m[1];
    if (raw && !raw.includes("${") && !raw.startsWith("//") && !/^https?:/i.test(raw) && !raw.startsWith("mailto:")) {
      const pathname = raw.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
      if (pathname.length >= 2) routes.add(pathname);
    }
  }
  while ((m = hrefObjRe.exec(source)) !== null) {
    const raw = m[1];
    if (raw && !raw.includes("${") && !raw.startsWith("//") && !/^https?:/i.test(raw)) {
      const pathname = raw.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
      if (pathname.length >= 2) routes.add(pathname);
    }
  }
  return routes;
}

function isValidInternalRoute(route) {
  if (!route || typeof route !== "string" || !route.startsWith("/")) return false;
  const normalized = route.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (KNOWN_STATIC_ROUTES.has(normalized)) return true;
  for (const prefix of KNOWN_ROUTE_FAMILY_PREFIXES) {
    if (normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)) return true;
  }
  return false;
}

const PRODUCTION_SUMMARY_GROUPS = {
  "Core pages": ["Core pages", "Broken internal link scan"],
  "Programmatic sections": ["Programmatic sections", "Static route references", "Generated route families"],
  "Data assets": [
    "Knowledge datasets",
    "Search index",
    "Canonical origin integrity",
    "Generated output determinism policy",
    "Route-family backing",
  ],
  "Dataset exports": ["Dataset exports"],
  "Sitemap/robots": [
    "Sitemap file",
    "Robots file",
    "Core static sitemap coverage",
    "Dynamic route family sitemap coverage",
    "Robots sitemap reference",
    "Robots production indexing",
  ],
  "Discovery pages": ["Discovery pages", "Internal topic link graph optimization"],
  "Navigation components": ["Navigation components"],
  "Schema layer": ["Schema layer"],
  "Launch checklist page": ["Launch checklist page"],
  "Launch checklist document": ["Launch checklist document"],
  "Launch checklist sitemap": ["Launch checklist sitemap"],
  "Launch checklist search index": ["Launch checklist search index"],
  "Launch command": ["Launch command"],
  "State electricity inflation pages": ["State electricity inflation pages"],
  "Electricity affordability pages": ["Electricity affordability pages"],
  "Business electricity decision pages": ["Business electricity decision pages"],
  "LLM discovery graph layer": ["LLM discovery graph layer"],
  "Launch SEO architecture audit": ["Launch SEO architecture audit"],
  "Authority signals layer": ["Authority signals layer"],
  "Provider plan comparison foundation": ["Provider plan comparison foundation pages"],
  "Post-launch operating and maintenance framework": ["Post-launch operating and maintenance framework"],
  "Partner-ready electricity shopping foundation": ["Partner-ready electricity shopping foundation"],
  "State marketplace-ready electricity landing pages": ["State marketplace-ready electricity landing pages"],
  "Commercial marketplace-ready electricity landing pages": ["Commercial marketplace-ready electricity landing pages"],
  "Final full-roadmap quality sweep": ["Final full-roadmap quality sweep"],
  "Operating playbook layer": ["Operating playbook layer"],
  "Future expansion framework": ["Future expansion framework"],
};

function runPreLaunchVerification(root, sitemapSource, layoutSource) {
  const checks = [];

  function runCheck(name, fn) {
    try {
      fn();
      checks.push({ name, ok: true });
    } catch (err) {
      checks.push({ name, ok: false, message: err && err.message ? err.message : String(err) });
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("PRODUCTION READINESS CHECKS");
  console.log("=".repeat(50));

  runCheck("Core pages", () => {
    const corePages = [
      path.join(process.cwd(), "src", "app", "page.tsx"),
      path.join(process.cwd(), "src", "app", "knowledge", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-trends", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-insights", "page.tsx"),
      path.join(process.cwd(), "src", "app", "datasets", "page.tsx"),
      path.join(process.cwd(), "src", "app", "methodology", "page.tsx"),
      path.join(process.cwd(), "src", "app", "site-map", "page.tsx"),
      path.join(process.cwd(), "src", "app", "page-index", "page.tsx"),
      path.join(process.cwd(), "src", "app", "data-registry", "page.tsx"),
    ];
    for (const p of corePages) {
      if (!fs.existsSync(p)) throw new Error(`missing core page: ${path.relative(process.cwd(), p)}`);
    }
  });

  runCheck("Programmatic sections", () => {
    const sections = [
      path.join(process.cwd(), "src", "app", "electricity-cost", "page.tsx"),
      path.join(process.cwd(), "src", "app", "average-electricity-bill", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-cost-calculator", "page.tsx"),
      path.join(process.cwd(), "src", "app", "battery-recharge-cost", "page.tsx"),
      path.join(process.cwd(), "src", "app", "generator-vs-battery-cost", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-price-history", "page.tsx"),
      path.join(process.cwd(), "src", "app", "moving-to-electricity-cost", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-cost-of-living", "page.tsx"),
      path.join(process.cwd(), "src", "app", "data-center-electricity-cost", "page.tsx"),
      path.join(process.cwd(), "src", "app", "solar-vs-grid-electricity-cost", "page.tsx"),
      path.join(process.cwd(), "src", "app", "battery-backup-electricity-cost", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-price-volatility", "page.tsx"),
      path.join(process.cwd(), "src", "app", "grid-capacity-and-electricity-demand", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-cost-comparison", "page.tsx"),
      path.join(process.cwd(), "src", "app", "ai-energy-demand", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-topics", "page.tsx"),
      path.join(process.cwd(), "src", "app", "power-generation-mix", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-markets", "page.tsx"),
      path.join(process.cwd(), "src", "app", "regional-electricity-markets", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-generation-cost-drivers", "page.tsx"),
    ];
    for (const p of sections) {
      if (!fs.existsSync(p)) throw new Error(`missing section page: ${path.relative(process.cwd(), p)}`);
    }
  });

  runCheck("Knowledge datasets", () => {
    const nationalPath = path.join(root, "national.json");
    if (!fs.existsSync(nationalPath)) throw new Error("public/knowledge/national.json must exist");
    const stateDir = path.join(root, "state");
    if (!fs.existsSync(stateDir) || !fs.statSync(stateDir).isDirectory()) {
      throw new Error("public/knowledge/state/ must exist and be a directory");
    }
    const stateFiles = fs.readdirSync(stateDir).filter((f) => f.endsWith(".json"));
    if (stateFiles.length === 0) throw new Error("public/knowledge/state/ must contain at least one JSON file");
    const rankingsDir = path.join(root, "rankings");
    if (!fs.existsSync(rankingsDir) || !fs.statSync(rankingsDir).isDirectory()) {
      throw new Error("public/knowledge/rankings/ must exist and be a directory");
    }
    const rankingsFiles = fs.readdirSync(rankingsDir).filter((f) => f.endsWith(".json"));
    if (rankingsFiles.length === 0) throw new Error("public/knowledge/rankings/ must contain at least one JSON file");
  });

  runCheck("Dataset exports", () => {
    const datasetsDir = path.join(process.cwd(), "public", "datasets");
    const required = [
      "electricity-prices-by-state.json",
      "electricity-prices-by-state.csv",
      "electricity-rankings.json",
      "electricity-rankings.csv",
    ];
    for (const f of required) {
      const p = path.join(datasetsDir, f);
      if (!fs.existsSync(p)) throw new Error(`missing dataset export: public/datasets/${f}`);
    }
  });

  runCheck("Discovery pages", () => {
    const discoveryPages = [
      path.join(process.cwd(), "src", "app", "site-map", "page.tsx"),
      path.join(process.cwd(), "src", "app", "page-index", "page.tsx"),
      path.join(process.cwd(), "src", "app", "data-registry", "page.tsx"),
    ];
    for (const p of discoveryPages) {
      if (!fs.existsSync(p)) throw new Error(`missing discovery page: ${path.relative(process.cwd(), p)}`);
    }
  });

  runCheck("Search index", () => {
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const content = fs.readFileSync(searchIndexPath, "utf8");
    const requiredRoutes = ["/knowledge", "/electricity-trends", "/electricity-insights", "/datasets", "/methodology"];
    for (const route of requiredRoutes) {
      if (!content.includes(route)) throw new Error(`search-index.json must reference ${route}`);
    }
  });

  runCheck("Canonical origin integrity", () => {
    const forbiddenOrigins = ["http://localhost", "http://127.0.0.1"];
    const artifactFiles = [
      path.join(root, "search-index.json"),
      path.join(root, "entity-index.json"),
      path.join(root, "index.json"),
    ];
    for (const filePath of artifactFiles) {
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf8");
      for (const origin of forbiddenOrigins) {
        if (content.includes(origin)) {
          const relPath = path.relative(process.cwd(), filePath);
          throw new Error(
            `${relPath} contains forbidden origin "${origin}". ` +
            "Generated artifacts must use production canonical origin. " +
            "See docs/CANONICAL_ARCHITECTURE_POLICY.md § B."
          );
        }
      }
    }
  });

  runCheck("Generated output determinism policy", () => {
    const indexPath = path.join(root, "index.json");
    if (!fs.existsSync(indexPath)) throw new Error("public/knowledge/index.json must exist");
    const index = readJson(indexPath, "public/knowledge/index.json");
    const sourceVersion = index && typeof index.sourceVersion === "string" ? index.sourceVersion : "";
    const expectedGeneratedAt = getExpectedDeterministicGeneratedAt(sourceVersion);
    if (!expectedGeneratedAt) return;
    const actualGeneratedAt = index && typeof index.generatedAt === "string" ? index.generatedAt : "";
    if (actualGeneratedAt !== expectedGeneratedAt) {
      throw new Error(
        "knowledge/index.json generatedAt must match deterministic snapshot release timestamp " +
          `(expected ${expectedGeneratedAt}, got ${actualGeneratedAt || "empty"})`
      );
    }
  });

  runCheck("Sitemap file", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    if (!fs.existsSync(sitemapPath)) throw new Error("src/app/sitemap.ts must exist");
  });

  runCheck("Robots file", () => {
    const robotsTsPath = path.join(process.cwd(), "src", "app", "robots.ts");
    if (!fs.existsSync(robotsTsPath)) throw new Error("src/app/robots.ts must exist");
  });

  runCheck("Monetization infrastructure files", () => {
    const required = [
      path.join(process.cwd(), "src", "components", "monetization", "CommercialModule.tsx"),
      path.join(process.cwd(), "src", "components", "monetization", "CommercialPlacement.tsx"),
      path.join(process.cwd(), "src", "components", "monetization", "CommercialComplianceNote.tsx"),
      path.join(process.cwd(), "src", "lib", "monetization", "placementConfig.ts"),
      path.join(process.cwd(), "src", "lib", "providers", "providerCatalog.ts"),
      path.join(process.cwd(), "src", "lib", "providers", "providerResolver.ts"),
      path.join(process.cwd(), "src", "lib", "providers", "providerPilot.ts"),
      path.join(process.cwd(), "src", "lib", "providers", "providerRolloutPlan.ts"),
      path.join(process.cwd(), "docs", "MONETIZATION_INFRASTRUCTURE.md"),
      path.join(process.cwd(), "docs", "PROVIDER_MARKETPLACE.md"),
      path.join(process.cwd(), "docs", "PROVIDER_ONBOARDING_PILOT.md"),
      path.join(process.cwd(), "docs", "PROVIDER_ROLLOUT_PLAN.md"),
    ];
    for (const filePath of required) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`missing monetization infrastructure file: ${path.relative(process.cwd(), filePath)}`);
      }
    }
  });

  runCheck("Provider pilot activation policy", () => {
    const pilotPath = path.join(process.cwd(), "src", "lib", "providers", "providerPilot.ts");
    if (!fs.existsSync(pilotPath)) {
      throw new Error("src/lib/providers/providerPilot.ts must exist");
    }
    const pilotSource = fs.readFileSync(pilotPath, "utf8");
    const requiredPilotSignals = [
      "enabled: true",
      "\"state-electricity-pages\"",
      "\"bill-estimator-pages\"",
      "\"energy-comparison-hub-pages\"",
      "\"provider-comparison\"",
      "\"marketplace-cta\"",
      "\"texas\"",
      "\"pennsylvania\"",
      "\"ohio\"",
      "\"illinois\"",
      "\"new-jersey\"",
      "\"new-york\"",
    ];
    for (const signal of requiredPilotSignals) {
      if (!pilotSource.includes(signal)) {
        throw new Error(`provider pilot policy must include ${signal}`);
      }
    }
    const forbiddenPilotFamilySignals = ["\"calculator-pages\"", "\"city-electricity-pages\"", "\"appliance-cost-pages\""];
    for (const signal of forbiddenPilotFamilySignals) {
      if (pilotSource.includes(signal)) {
        throw new Error(`provider pilot policy must keep family blocked: ${signal}`);
      }
    }
  });

  runCheck("Provider rollout plan integrity", () => {
    const planPath = path.join(process.cwd(), "src", "lib", "providers", "providerRolloutPlan.ts");
    if (!fs.existsSync(planPath)) {
      throw new Error("src/lib/providers/providerRolloutPlan.ts must exist");
    }
    const planSource = fs.readFileSync(planPath, "utf8");
    const requiredTierSignals = [
      "\"tier-1-pilot\"",
      "\"tier-2-deregulated\"",
      "\"tier-3-limited-marketplace\"",
      "\"tier-4-informational-only\"",
      "\"texas\"",
      "\"pennsylvania\"",
      "\"ohio\"",
      "\"illinois\"",
      "\"new-jersey\"",
      "\"new-york\"",
    ];
    for (const signal of requiredTierSignals) {
      if (!planSource.includes(signal)) {
        throw new Error(`provider rollout plan must include ${signal}`);
      }
    }
    const blockedFamilySignals = ["\"calculator-pages\"", "\"city-electricity-pages\"", "permanently-blocked"];
    for (const signal of blockedFamilySignals) {
      if (!planSource.includes(signal)) {
        throw new Error(`provider rollout plan must include blocked-family policy: ${signal}`);
      }
    }
  });

  runCheck("Provider catalog state alignment with rollout plan", () => {
    const planPath = path.join(process.cwd(), "src", "lib", "providers", "providerRolloutPlan.ts");
    const catalogPath = path.join(process.cwd(), "src", "lib", "providers", "providerCatalog.ts");
    if (!fs.existsSync(planPath) || !fs.existsSync(catalogPath)) return;
    const planSource = fs.readFileSync(planPath, "utf8");
    const catalogSource = fs.readFileSync(catalogPath, "utf8");
    const catalogStates = ["illinois", "new-jersey", "new-york", "ohio", "pennsylvania", "texas"];
    for (const state of catalogStates) {
      if (!catalogSource.includes(`"${state}"`)) continue;
      if (!planSource.includes(`"${state}"`)) {
        throw new Error(`provider rollout plan must account for provider catalog state: ${state}`);
      }
    }
  });

  runCheck("Provider catalog structure integrity", () => {
    const catalogPath = path.join(process.cwd(), "src", "lib", "providers", "providerCatalog.ts");
    if (!fs.existsSync(catalogPath)) return;
    const src = fs.readFileSync(catalogPath, "utf8");
    const entryCount = (src.match(/providerId:\s*"/g) || []).length;
    if (entryCount === 0) throw new Error("provider catalog must contain at least one provider entry");
    const requiredFieldPatterns = [
      /providerName:\s*"/g,
      /serviceStates:\s*\[/g,
      /offerType:\s*"/g,
      /offerDescription:\s*"/g,
      /coverageAreaDescription:\s*"/g,
      /planTypeSummary:\s*"/g,
      /featureHighlights:\s*\[/g,
      /signupUrl:\s*"/g,
      /enabled:\s*(true|false)/g,
      /allowedPageFamilies:\s*\[/g,
      /allowedModuleTypes:\s*\[/g,
      /priority:\s*\d+/g,
    ];
    for (const pattern of requiredFieldPatterns) {
      const count = (src.match(pattern) || []).length;
      if (count < entryCount) {
        throw new Error(`provider catalog field coverage invalid for pattern ${pattern}`);
      }
    }
    const priorities = Array.from(src.matchAll(/priority:\s*(\d+)/g)).map((m) => Number(m[1]));
    if (priorities.length < entryCount) {
      throw new Error("provider catalog entries must include numeric priority values");
    }
    if (priorities.some((p) => !Number.isFinite(p) || p < 0)) {
      throw new Error("provider catalog priority values must be finite non-negative numbers");
    }
    const providerIds = Array.from(src.matchAll(/providerId:\s*"([^"]+)"/g)).map((m) => m[1]);
    if (new Set(providerIds).size !== providerIds.length) {
      throw new Error("provider catalog providerId values must be unique");
    }
    const requiredMultiProviderStates = ["texas", "illinois", "new-york"];
    for (const state of requiredMultiProviderStates) {
      const occurrences = (src.match(new RegExp(`"${state}"`, "g")) || []).length;
      if (occurrences < 2) {
        throw new Error(`provider catalog should support multi-provider state coverage for ${state}`);
      }
    }
  });

  runCheck("Provider discovery infrastructure integrity", () => {
    const helperPath = path.join(process.cwd(), "src", "lib", "providers", "providerDiscovery.ts");
    const componentPath = path.join(process.cwd(), "src", "components", "providers", "ProviderDiscoverySection.tsx");
    ensureFileExists(helperPath, "provider discovery helper");
    ensureFileExists(componentPath, "provider discovery section component");
    const helperSrc = fs.readFileSync(helperPath, "utf8");
    const componentSrc = fs.readFileSync(componentPath, "utf8");
    const requiredHelperSignals = [
      "buildProviderDiscoveryLinks",
      "buildProviderDiscoveryItemListEntries",
      "buildProviderOfferItemListEntries",
      "getProviderDiscoveryStatesFromCatalog",
    ];
    for (const signal of requiredHelperSignals) {
      if (!helperSrc.includes(signal)) {
        throw new Error(`provider discovery helper missing signal: ${signal}`);
      }
    }
    if (!componentSrc.includes("links.map")) {
      throw new Error("provider discovery section must render deterministic link lists");
    }
  });

  runCheck("Marketplace maturity provider comparison clarity surfaces", () => {
    const providerPages = [
      path.join(process.cwd(), "src", "app", "electricity-providers", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-providers", "[slug]", "page.tsx"),
    ];
    for (const pagePath of providerPages) {
      const src = fs.readFileSync(pagePath, "utf8");
      const requiredSignals = [
        "Provider comparison clarity",
        "Provider differentiation signals",
        "Commercial pathway visibility",
        "buildCommercialPathwayItemListJsonLd",
      ];
      for (const signal of requiredSignals) {
        if (!src.includes(signal)) {
          throw new Error(`provider maturity signal missing in ${path.relative(process.cwd(), pagePath)}: ${signal}`);
        }
      }
    }
  });

  runCheck("Provider resolver deterministic ranking policy", () => {
    const resolverPath = path.join(process.cwd(), "src", "lib", "providers", "providerResolver.ts");
    if (!fs.existsSync(resolverPath)) return;
    const src = fs.readFileSync(resolverPath, "utf8");
    const requiredSignals = [
      "deterministicRank",
      "applyComparisonDiversity",
      "localeCompare",
      "isProviderPilotActiveForContext",
      "isProviderContextAllowedByRolloutPlan",
      "getEnabledProviderCatalogEntries",
      "supportsProviderState",
    ];
    for (const signal of requiredSignals) {
      if (!src.includes(signal)) {
        throw new Error(`provider resolver ranking guard missing: ${signal}`);
      }
    }
  });

  runCheck("Platform architecture documentation coverage", () => {
    const docsPath = path.join(process.cwd(), "docs", "PLATFORM_ARCHITECTURE.md");
    ensureFileExists(docsPath, "platform architecture documentation");
    const src = fs.readFileSync(docsPath, "utf8");
    const requiredSignals = [
      "Platform architecture overview",
      "Canonical cluster structure",
      "Provider marketplace architecture",
      "Monetization architecture",
      "Discovery graph system",
      "Verification infrastructure",
    ];
    for (const signal of requiredSignals) {
      if (!src.includes(signal)) {
        throw new Error(`platform architecture docs missing section: ${signal}`);
      }
    }
  });

  runCheck("Provider coverage for active rollout states", () => {
    const pilotPath = path.join(process.cwd(), "src", "lib", "providers", "providerPilot.ts");
    const catalogPath = path.join(process.cwd(), "src", "lib", "providers", "providerCatalog.ts");
    if (!fs.existsSync(pilotPath) || !fs.existsSync(catalogPath)) return;
    const pilotSource = fs.readFileSync(pilotPath, "utf8");
    const catalogSource = fs.readFileSync(catalogPath, "utf8");
    const stateMatches = Array.from(
      pilotSource.matchAll(/"state-electricity-pages"\s*:\s*\[([^\]]*)\]/g),
    )
      .flatMap((m) => Array.from(m[1].matchAll(/"([^"]+)"/g)).map((s) => s[1]));
    const uniqueStates = Array.from(new Set(stateMatches));
    for (const state of uniqueStates) {
      if (!catalogSource.includes(`"${state}"`)) {
        throw new Error(`active rollout state lacks provider catalog coverage signal: ${state}`);
      }
    }
  });

  runCheck("Provider pilot states subset of rollout tiers", () => {
    const planPath = path.join(process.cwd(), "src", "lib", "providers", "providerRolloutPlan.ts");
    const pilotPath = path.join(process.cwd(), "src", "lib", "providers", "providerPilot.ts");
    if (!fs.existsSync(planPath) || !fs.existsSync(pilotPath)) return;
    const planSource = fs.readFileSync(planPath, "utf8");
    const pilotSource = fs.readFileSync(pilotPath, "utf8");

    const familyKeys = ["state-electricity-pages", "bill-estimator-pages"];
    for (const family of familyKeys) {
      const escapedFamily = family.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const familyRegex = new RegExp(`"${escapedFamily}"\\s*:\\s*\\[([^\\]]*)\\]`);
      const match = pilotSource.match(familyRegex);
      if (!match) continue;
      const states = Array.from(match[1].matchAll(/"([^"]+)"/g)).map((m) => m[1]);
      for (const state of states) {
        if (!planSource.includes(`"${state}"`)) {
          throw new Error(`pilot activation state must exist in rollout tiers: ${state}`);
        }
      }
    }
  });

  runCheck("Blocked provider family activation policy", () => {
    const placementPath = path.join(process.cwd(), "src", "lib", "monetization", "placementConfig.ts");
    if (!fs.existsSync(placementPath)) {
      throw new Error("src/lib/monetization/placementConfig.ts must exist");
    }
    const placementSource = fs.readFileSync(placementPath, "utf8");
    const blockedSignals = [
      "\"city-electricity-pages\"",
      "\"calculator-pages\"",
      "\"affiliate-link-block\"",
      "enabled: false",
    ];
    for (const signal of blockedSignals) {
      if (!placementSource.includes(signal)) {
        throw new Error(`placement config must preserve blocked-family signal: ${signal}`);
      }
    }
  });

  runCheck("Core static sitemap coverage", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const src = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    const coreRoutes = [
      "/knowledge",
      "/electricity-trends",
      "/electricity-insights",
      "/datasets",
      "/datasets/electricity-prices-by-state",
      "/datasets/electricity-rankings",
      "/methodology",
      "/methodology/electricity-rates",
      "/methodology/electricity-inflation",
      "/methodology/electricity-affordability",
      "/methodology/battery-recharge-cost",
      "/methodology/generator-vs-battery-cost",
      "/site-map",
      "/page-index",
      "/data-registry",
      "/ai-energy-demand",
      "/electricity-cost",
      "/average-electricity-bill",
      "/electricity-bill-estimator",
      "/electricity-cost-calculator",
      "/energy-comparison",
      "/battery-recharge-cost",
      "/generator-vs-battery-cost",
      "/electricity-price-history",
      "/electricity-inflation",
      "/electricity-affordability",
      "/electricity-cost-of-living",
      "/data-center-electricity-cost",
      "/solar-vs-grid-electricity-cost",
      "/battery-backup-electricity-cost",
      "/electricity-price-volatility",
      "/grid-capacity-and-electricity-demand",
      "/moving-to-electricity-cost",
      "/electricity-cost-comparison",
    ];
    for (const route of coreRoutes) {
      if (!src.includes(route)) throw new Error(`sitemap must include ${route}`);
    }
  });

  runCheck("Dynamic route family sitemap coverage", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const src = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    const familyEvidence = [
      { pattern: "electricity-cost/", name: "electricity-cost/[slug]" },
      { pattern: "average-electricity-bill/", name: "average-electricity-bill/[slug]" },
      { pattern: "electricity-bill-estimator/", name: "electricity-bill-estimator/[slug]" },
      { pattern: "knowledge/state/", name: "knowledge/state/[slug]" },
      { pattern: "knowledge/rankings/", name: "knowledge/rankings/[id]" },
    ];
    for (const { pattern, name } of familyEvidence) {
      if (!src.includes(pattern)) throw new Error(`sitemap must include ${name} route family`);
    }
  });

  runCheck("Search authority schema coverage on key families", () => {
    const keyPages = [
      path.join(process.cwd(), "src", "app", "[state]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-cost", "[slug]", "[city]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "cost-to-run", "[appliance]", "[state]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-bill-estimator", "[slug]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "energy-comparison", "page.tsx"),
    ];
    for (const pagePath of keyPages) {
      ensureFileExists(pagePath, `schema key page ${path.relative(process.cwd(), pagePath)}`);
      const src = fs.readFileSync(pagePath, "utf8");
      if (!src.includes("application/ld+json") && !src.includes("JsonLdScript")) {
        throw new Error(`key authority page missing JSON-LD output: ${path.relative(process.cwd(), pagePath)}`);
      }
    }
  });

  runCheck("Search authority FAQ schema coverage", () => {
    const faqPages = [
      path.join(process.cwd(), "src", "app", "electricity-hubs", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-cost", "[slug]", "[city]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "cost-to-run", "[appliance]", "[state]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-bill-estimator", "[slug]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "energy-comparison", "page.tsx"),
    ];
    for (const pagePath of faqPages) {
      const src = fs.readFileSync(pagePath, "utf8");
      if (!src.includes("buildFaqPageJsonLd")) {
        throw new Error(`expected FAQ schema helper on ${path.relative(process.cwd(), pagePath)}`);
      }
    }
  });

  runCheck("Authority hub structured data reinforcement", () => {
    const hubPages = [
      path.join(process.cwd(), "src", "app", "electricity-hubs", "page.tsx"),
      path.join(process.cwd(), "src", "app", "energy-comparison", "page.tsx"),
    ];
    for (const pagePath of hubPages) {
      const src = fs.readFileSync(pagePath, "utf8");
      if (!src.includes("buildItemListJsonLd")) {
        throw new Error(`authority hub missing ItemList JSON-LD signal: ${path.relative(process.cwd(), pagePath)}`);
      }
    }
  });

  runCheck("Energy comparison hub links to canonical clusters", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "energy-comparison", "page.tsx");
    const src = fs.readFileSync(hubPath, "utf8");
    const requiredCanonicalTargets = [
      "/electricity-cost-comparison/",
      "/electricity-usage-cost/",
      "/cost-to-run/",
      "/electricity-cost/",
    ];
    for (const target of requiredCanonicalTargets) {
      if (!src.includes(target)) {
        throw new Error(`energy comparison hub must link canonical cluster: ${target}`);
      }
    }
  });

  runCheck("Marketplace growth provider discovery links on hubs", () => {
    const pagePaths = [
      path.join(process.cwd(), "src", "app", "electricity-hubs", "page.tsx"),
      path.join(process.cwd(), "src", "app", "energy-comparison", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-hubs", "comparisons", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-cost-comparison", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-bill-estimator", "[slug]", "page.tsx"),
    ];
    for (const pagePath of pagePaths) {
      const src = fs.readFileSync(pagePath, "utf8");
      const hasDirectProviderLinkSignal = src.includes("/electricity-providers");
      const hasSharedDiscoveryHelperSignal = src.includes("buildProviderDiscoveryLinks");
      if (!hasDirectProviderLinkSignal && !hasSharedDiscoveryHelperSignal) {
        throw new Error(
          `provider discovery signal missing in ${path.relative(process.cwd(), pagePath)}: /electricity-providers or buildProviderDiscoveryLinks`,
        );
      }
    }
  });

  runCheck("Provider expansion placement standardization", () => {
    const pages = [
      path.join(process.cwd(), "src", "app", "[state]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-bill-estimator", "[slug]", "page.tsx"),
      path.join(process.cwd(), "src", "app", "energy-comparison", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-hubs", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-hubs", "comparisons", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-cost-comparison", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-providers", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-providers", "[slug]", "page.tsx"),
    ];
    for (const pagePath of pages) {
      const src = fs.readFileSync(pagePath, "utf8");
      if (!src.includes("CommercialPlacement")) {
        throw new Error(`provider placement signal missing in ${path.relative(process.cwd(), pagePath)}`);
      }
    }
  });

  runCheck("Search authority sitemap priorities for discovery hubs", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const src = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    const requiredSignals = [
      "`${BASE_URL}/energy-comparison`",
      "`${BASE_URL}/electricity-hubs`",
      "priority: 0.78",
      "priority: 0.8",
    ];
    for (const signal of requiredSignals) {
      if (!src.includes(signal)) {
        throw new Error(`sitemap search-authority priority signal missing: ${signal}`);
      }
    }
  });

  runCheck("Indexing acceleration sitemap segmentation", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const src = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    const segmentLibPath = path.join(process.cwd(), "src", "lib", "seo", "sitemapSegments.ts");
    if (!fs.existsSync(segmentLibPath)) {
      throw new Error("sitemap segment library must exist: src/lib/seo/sitemapSegments.ts");
    }
    const segmentSrc = fs.readFileSync(segmentLibPath, "utf8");
    const sitemapIndexRoutePath = path.join(process.cwd(), "src", "app", "sitemap-index.xml", "route.ts");
    if (!fs.existsSync(sitemapIndexRoutePath)) {
      throw new Error("sitemap index route must exist: src/app/sitemap-index.xml/route.ts");
    }
    const requiredSignals = [
      "SITEMAP_SEGMENT_IDS",
      "getSegmentedSitemapEntries",
      "generateSitemaps",
      "\"core\"",
      "\"states\"",
      "\"cities\"",
      "\"appliances\"",
      "\"estimators\"",
      "groupSitemapEntriesBySegment",
      "assertNoDuplicateSegmentUrls",
    ];
    for (const signal of requiredSignals) {
      if (!src.includes(signal) && !segmentSrc.includes(signal)) {
        throw new Error(`sitemap segmentation signal missing: ${signal}`);
      }
    }
  });

  runCheck("Indexing acceleration canonical families in sitemap segments", () => {
    const segmentLibPath = path.join(process.cwd(), "src", "lib", "seo", "sitemapSegments.ts");
    const src = fs.readFileSync(segmentLibPath, "utf8");
    const requiredSignals = [
      "isStateScopedPath",
      "isCityScopedPath",
      "isApplianceScopedPath",
      "isEstimatorScopedPath",
      "electricity-cost",
      "cost-to-run",
      "electricity-bill-estimator",
    ];
    for (const signal of requiredSignals) {
      if (!src.includes(signal)) {
        throw new Error(`sitemap segment canonical-family coverage missing signal: ${signal}`);
      }
    }
  });

  runCheck("Indexing acceleration discovery graph pathways", () => {
    const discoveryGraphPath = path.join(process.cwd(), "public", "discovery-graph.json");
    if (!fs.existsSync(discoveryGraphPath)) {
      throw new Error("public/discovery-graph.json must exist");
    }
    const graph = readJson(discoveryGraphPath, "public/discovery-graph.json");
    const graphText = JSON.stringify(graph);
    const requiredSignals = [
      "\"state_to_city_pathway\"",
      "\"city_to_appliance_pathway\"",
      "\"estimator_pathway\"",
      "\"comparison_pathway\"",
      "\"estimator_to_appliance_pathway\"",
      "\"appliance_to_estimator_pathway\"",
      "\"state_to_appliance_pathway\"",
      "\"state_to_estimator_pathway\"",
      "\"bill_to_appliance_pathway\"",
      "\"appliance_to_comparison_pathway\"",
      "\"appliance_to_usage_pathway\"",
      "\"provider_to_comparison_cluster\"",
      "\"provider_to_state_cluster\"",
      "\"provider_to_estimator_discovery\"",
      "\"provider_marketplace_to_state_cluster\"",
      "\"provider_marketplace_to_comparison_cluster\"",
      "\"provider_marketplace_to_estimator_cluster\"",
      "\"provider_to_hub_discovery\"",
      "\"provider_to_provider_marketplace_hub\"",
      "\"provider_to_provider_information_cluster\"",
      "\"provider_to_commercial_discovery\"",
      "\"provider_to_hub_discovery_cluster\"",
      "\"provider_to_appliance_cluster\"",
      "\"commercial_surface_to_provider_marketplace\"",
      "\"comparison_to_provider_discovery\"",
      "\"hub_to_provider_discovery\"",
      "\"provider-marketplace\"",
      "\"provider-information\"",
      "\"commercial-surfaces\"",
      "\"energy-comparison\"",
      "\"electricity-bill-estimator\"",
    ];
    for (const signal of requiredSignals) {
      if (!graphText.includes(signal)) {
        throw new Error(`discovery-graph indexing pathway missing: ${signal}`);
      }
    }
  });

  runCheck("Traffic optimization longtail pathway signals", () => {
    const internalLinksPath = path.join(process.cwd(), "src", "lib", "longtail", "internalLinks.ts");
    const src = fs.readFileSync(internalLinksPath, "utf8");
    const requiredSignals = [
      "buildApplianceEstimatorPathwaySection",
      "/cost-to-run/",
      "/electricity-cost-calculator/",
      "/electricity-bill-estimator/",
      "/energy-comparison/appliances",
    ];
    for (const signal of requiredSignals) {
      if (!src.includes(signal)) {
        throw new Error(`longtail pathway signal missing: ${signal}`);
      }
    }
  });

  runCheck("Robots sitemap reference", () => {
    const robotsTsPath = path.join(process.cwd(), "src", "app", "robots.ts");
    const src = fs.readFileSync(robotsTsPath, "utf8");
    if (!src.includes("sitemap") && !src.includes("sitemap.xml")) {
      throw new Error("robots.ts must include sitemap reference");
    }
  });

  runCheck("Robots production indexing", () => {
    const robotsTsPath = path.join(process.cwd(), "src", "app", "robots.ts");
    const src = fs.readFileSync(robotsTsPath, "utf8");
    const hasProductionLogic =
      (src.includes("VERCEL_ENV") && src.includes("production")) ||
      src.includes("allowIndexing") ||
      src.includes("allow:");
    if (!hasProductionLogic) {
      throw new Error("robots.ts must allow production indexing (VERCEL_ENV/production or allow logic)");
    }
  });

  runCheck("Schema layer", () => {
    const layoutPath = path.join(process.cwd(), "src", "app", "layout.tsx");
    if (!fs.existsSync(layoutPath)) throw new Error("src/app/layout.tsx must exist");
    const src = layoutSource || fs.readFileSync(layoutPath, "utf8");
    if (!src.includes("application/ld+json")) throw new Error("layout.tsx must contain JSON-LD script block (application/ld+json)");
  });

  runCheck("Navigation components", () => {
    const exploreMorePath = path.join(process.cwd(), "src", "components", "navigation", "ExploreMore.tsx");
    const sectionNavPath = path.join(process.cwd(), "src", "components", "navigation", "SectionNav.tsx");
    if (!fs.existsSync(exploreMorePath)) throw new Error("ExploreMore.tsx must exist");
    if (!fs.existsSync(sectionNavPath)) throw new Error("SectionNav.tsx must exist");
  });

  runCheck("Static route references", () => {
    const appDir = path.join(process.cwd(), "src", "app");
    const routeFamilies = [
      ["electricity-cost", "page.tsx"],
      ["average-electricity-bill", "page.tsx"],
      ["electricity-cost-calculator", "page.tsx"],
      ["battery-recharge-cost", "page.tsx"],
      ["generator-vs-battery-cost", "page.tsx"],
      ["electricity-price-history", "page.tsx"],
      ["electricity-inflation", "page.tsx"],
      ["electricity-affordability", "page.tsx"],
      ["electricity-cost-of-living", "page.tsx"],
      ["data-center-electricity-cost", "page.tsx"],
      ["solar-vs-grid-electricity-cost", "page.tsx"],
      ["battery-backup-electricity-cost", "page.tsx"],
      ["electricity-price-volatility", "page.tsx"],
      ["moving-to-electricity-cost", "page.tsx"],
      ["electricity-cost-comparison", "page.tsx"],
      ["electricity-bill-estimator", "page.tsx"],
      ["energy-comparison", "page.tsx"],
      ["energy-comparison", "states", "page.tsx"],
      ["energy-comparison", "usage", "page.tsx"],
      ["energy-comparison", "appliances", "page.tsx"],
      ["knowledge", "state", "[slug]", "page.tsx"],
      ["knowledge", "rankings", "[id]", "page.tsx"],
      ["electricity-cost-comparison", "[pair]", "page.tsx"],
      ["electricity-bill-estimator", "[slug]", "page.tsx"],
      ["electricity-bill-estimator", "[slug]", "[profile]", "page.tsx"],
    ];
    for (const parts of routeFamilies) {
      const p = path.join(appDir, ...parts);
      if (!fs.existsSync(p)) throw new Error(`route family missing: src/app/${parts.join("/")}`);
    }
  });

  runCheck("Generated route families", () => {
    const appDir = path.join(process.cwd(), "src", "app");
    const families = [
      ["electricity-cost", "[slug]"],
      ["average-electricity-bill", "[slug]"],
      ["electricity-bill-estimator", "[slug]"],
      ["electricity-bill-estimator", "[slug]", "[profile]"],
      ["electricity-cost-calculator", "[slug]"],
      ["battery-recharge-cost", "[slug]"],
      ["generator-vs-battery-cost", "[slug]"],
      ["electricity-price-history", "[slug]"],
      ["electricity-inflation", "[slug]"],
      ["electricity-affordability", "[slug]"],
      ["electricity-cost-of-living", "[slug]"],
      ["data-center-electricity-cost", "[slug]"],
      ["solar-vs-grid-electricity-cost", "[slug]"],
      ["battery-backup-electricity-cost", "[slug]"],
      ["electricity-price-volatility", "[slug]"],
      ["moving-to-electricity-cost", "[slug]"],
      ["knowledge", "state", "[slug]"],
      ["knowledge", "rankings", "[id]"],
      ["electricity-cost-comparison", "[pair]"],
    ];
    for (const parts of families) {
      const p = path.join(appDir, ...parts, "page.tsx");
      if (!fs.existsSync(p)) throw new Error(`generated route family missing: src/app/${parts.join("/")}/page.tsx`);
    }
  });

  runCheck("Broken internal link scan", () => {
    const auditFiles = [
      path.join(process.cwd(), "src", "app", "layout.tsx"),
      path.join(process.cwd(), "src", "app", "page.tsx"),
      path.join(process.cwd(), "src", "app", "knowledge", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-trends", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-insights", "page.tsx"),
      path.join(process.cwd(), "src", "app", "datasets", "page.tsx"),
      path.join(process.cwd(), "src", "app", "methodology", "page.tsx"),
      path.join(process.cwd(), "src", "app", "site-map", "page.tsx"),
      path.join(process.cwd(), "src", "app", "page-index", "page.tsx"),
      path.join(process.cwd(), "src", "app", "data-registry", "page.tsx"),
      path.join(process.cwd(), "src", "components", "navigation", "ExploreMore.tsx"),
      path.join(process.cwd(), "src", "components", "navigation", "SectionNav.tsx"),
    ];
    const badRoutes = [];
    for (const filePath of auditFiles) {
      if (!fs.existsSync(filePath)) continue;
      const source = fs.readFileSync(filePath, "utf8");
      const routes = extractInternalRoutesFromSource(source);
      for (const route of routes) {
        const normalized = route.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
        if (normalized.length < 2) continue;
        if (!isValidInternalRoute(normalized)) {
          badRoutes.push({ file: path.relative(process.cwd(), filePath), route: normalized });
        }
      }
    }
    if (badRoutes.length > 0) {
      const first = badRoutes[0];
      throw new Error(`Broken internal route reference → ${first.route} (in ${first.file})`);
    }
  });

  runCheck("Launch checklist page", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "launch-checklist", "page.tsx");
    if (!fs.existsSync(pagePath)) throw new Error("src/app/launch-checklist/page.tsx must exist");
  });

  runCheck("Launch checklist document", () => {
    const docPath = path.join(process.cwd(), "FINAL_LAUNCH_CHECKLIST.md");
    if (!fs.existsSync(docPath)) throw new Error("FINAL_LAUNCH_CHECKLIST.md must exist");
  });

  runCheck("Launch checklist sitemap", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const src = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!src.includes("/launch-checklist")) throw new Error("sitemap must include /launch-checklist");
  });

  runCheck("Launch checklist search index", () => {
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const content = fs.readFileSync(searchIndexPath, "utf8");
    if (!content.includes("/launch-checklist")) throw new Error("search-index.json must contain /launch-checklist");
  });

  runCheck("Electricity inflation hub page", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "electricity-inflation", "page.tsx");
    if (!fs.existsSync(pagePath)) throw new Error("src/app/electricity-inflation/page.tsx must exist");
  });

  runCheck("Electricity inflation sitemap", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const src = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!src.includes("/electricity-inflation")) throw new Error("sitemap must include /electricity-inflation");
  });

  runCheck("Electricity inflation search index", () => {
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const content = fs.readFileSync(searchIndexPath, "utf8");
    if (!content.includes("/electricity-inflation")) throw new Error("search-index.json must contain /electricity-inflation");
  });

  runCheck("Electricity topics hub", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "electricity-topics", "page.tsx");
    if (!fs.existsSync(pagePath)) throw new Error("src/app/electricity-topics/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-topics")) throw new Error("sitemap must include /electricity-topics");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-topics")) throw new Error("search-index must include /electricity-topics");
  });

  runCheck("Electricity generation cost driver pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-generation-cost-drivers", "page.tsx");
    const fuelPath = path.join(process.cwd(), "src", "app", "electricity-generation-cost-drivers", "fuel-prices-and-generation-costs", "page.tsx");
    const infraPath = path.join(process.cwd(), "src", "app", "electricity-generation-cost-drivers", "infrastructure-and-electricity-costs", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-generation-cost-drivers/page.tsx must exist");
    if (!fs.existsSync(fuelPath)) throw new Error("src/app/electricity-generation-cost-drivers/fuel-prices-and-generation-costs/page.tsx must exist");
    if (!fs.existsSync(infraPath)) throw new Error("src/app/electricity-generation-cost-drivers/infrastructure-and-electricity-costs/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-generation-cost-drivers")) throw new Error("sitemap must include /electricity-generation-cost-drivers");
    if (!sitemapSrc.includes("/electricity-generation-cost-drivers/fuel-prices-and-generation-costs")) throw new Error("sitemap must include /electricity-generation-cost-drivers/fuel-prices-and-generation-costs");
    if (!sitemapSrc.includes("/electricity-generation-cost-drivers/infrastructure-and-electricity-costs")) throw new Error("sitemap must include /electricity-generation-cost-drivers/infrastructure-and-electricity-costs");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-generation-cost-drivers")) throw new Error("search-index must include /electricity-generation-cost-drivers");
  });

  runCheck("Regional electricity market analysis pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "regional-electricity-markets", "page.tsx");
    const whyPath = path.join(process.cwd(), "src", "app", "regional-electricity-markets", "why-electricity-prices-differ-by-region", "page.tsx");
    const gridPath = path.join(process.cwd(), "src", "app", "regional-electricity-markets", "regional-grid-structure", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/regional-electricity-markets/page.tsx must exist");
    if (!fs.existsSync(whyPath)) throw new Error("src/app/regional-electricity-markets/why-electricity-prices-differ-by-region/page.tsx must exist");
    if (!fs.existsSync(gridPath)) throw new Error("src/app/regional-electricity-markets/regional-grid-structure/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/regional-electricity-markets")) throw new Error("sitemap must include /regional-electricity-markets");
    if (!sitemapSrc.includes("/regional-electricity-markets/why-electricity-prices-differ-by-region")) throw new Error("sitemap must include /regional-electricity-markets/why-electricity-prices-differ-by-region");
    if (!sitemapSrc.includes("/regional-electricity-markets/regional-grid-structure")) throw new Error("sitemap must include /regional-electricity-markets/regional-grid-structure");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/regional-electricity-markets")) throw new Error("search-index must include /regional-electricity-markets");
  });

  runCheck("Electricity market structure pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-markets", "page.tsx");
    const isoPath = path.join(process.cwd(), "src", "app", "electricity-markets", "iso-rto-markets", "page.tsx");
    const regulatedPath = path.join(process.cwd(), "src", "app", "electricity-markets", "regulated-electricity-markets", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-markets/page.tsx must exist");
    if (!fs.existsSync(isoPath)) throw new Error("src/app/electricity-markets/iso-rto-markets/page.tsx must exist");
    if (!fs.existsSync(regulatedPath)) throw new Error("src/app/electricity-markets/regulated-electricity-markets/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-markets")) throw new Error("sitemap must include /electricity-markets");
    if (!sitemapSrc.includes("/electricity-markets/iso-rto-markets")) throw new Error("sitemap must include /electricity-markets/iso-rto-markets");
    if (!sitemapSrc.includes("/electricity-markets/regulated-electricity-markets")) throw new Error("sitemap must include /electricity-markets/regulated-electricity-markets");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-markets")) throw new Error("search-index must include /electricity-markets");
  });

  runCheck("Power generation mix analysis pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "power-generation-mix", "page.tsx");
    const fuelPath = path.join(process.cwd(), "src", "app", "power-generation-mix", "fuel-costs-and-electricity-prices", "page.tsx");
    const volatilityPath = path.join(process.cwd(), "src", "app", "power-generation-mix", "generation-mix-and-price-volatility", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/power-generation-mix/page.tsx must exist");
    if (!fs.existsSync(fuelPath)) throw new Error("src/app/power-generation-mix/fuel-costs-and-electricity-prices/page.tsx must exist");
    if (!fs.existsSync(volatilityPath)) throw new Error("src/app/power-generation-mix/generation-mix-and-price-volatility/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/power-generation-mix")) throw new Error("sitemap must include /power-generation-mix");
    if (!sitemapSrc.includes("/power-generation-mix/fuel-costs-and-electricity-prices")) throw new Error("sitemap must include /power-generation-mix/fuel-costs-and-electricity-prices");
    if (!sitemapSrc.includes("/power-generation-mix/generation-mix-and-price-volatility")) throw new Error("sitemap must include /power-generation-mix/generation-mix-and-price-volatility");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/power-generation-mix")) throw new Error("search-index must include /power-generation-mix");
  });

  runCheck("Electricity affordability pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-affordability", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "electricity-affordability", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-affordability/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/electricity-affordability/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-affordability")) throw new Error("sitemap must include electricity-affordability routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-affordability")) throw new Error("search-index must include electricity-affordability entries");
  });

  runCheck("Entity registry discovery layer", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "entity-registry", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/entity-registry/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/entity-registry")) throw new Error("sitemap must include /entity-registry");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/entity-registry")) throw new Error("search-index must include entity-registry entry");
  });

  runCheck("Electricity data authority hub", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-data", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-data/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-data")) throw new Error("sitemap must include /electricity-data");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-data")) throw new Error("search-index must include electricity-data entry");
  });

  runCheck("Launch SEO architecture audit", () => {
    const discoveryGraphPath = path.resolve(process.cwd(), "public", "discovery-graph.json");
    const electricityTopicsPath = path.join(process.cwd(), "src", "app", "electricity-topics", "page.tsx");
    if (!fs.existsSync(discoveryGraphPath)) throw new Error("public/discovery-graph.json must exist");
    if (!fs.existsSync(electricityTopicsPath)) throw new Error("src/app/electricity-topics/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    const requiredSitemapRoutes = [
      "/electricity-cost",
      "/electricity-topics",
      "/electricity-data",
      "/entity-registry",
      "/discovery-graph",
      "/power-generation-mix",
      "/electricity-markets",
      "/regional-electricity-markets",
      "/electricity-generation-cost-drivers",
      "/business-electricity-cost-decisions",
    ];
    for (const route of requiredSitemapRoutes) {
      if (!sitemapSrc.includes(route)) throw new Error(`sitemap must include ${route}`);
    }
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    const requiredSearchRoutes = [
      "/electricity-cost",
      "/electricity-topics",
      "/electricity-data",
      "/entity-registry",
      "/discovery-graph",
      "/power-generation-mix",
      "/electricity-markets",
      "/regional-electricity-markets",
      "/business-electricity-cost-decisions",
    ];
    for (const route of requiredSearchRoutes) {
      if (!searchContent.includes(route)) throw new Error(`search-index must include ${route}`);
    }
  });

  runCheck("LLM discovery graph layer", () => {
    const discoveryGraphPath = path.resolve(process.cwd(), "public", "discovery-graph.json");
    const discoveryGraphPagePath = path.join(process.cwd(), "src", "app", "discovery-graph", "page.tsx");
    if (!fs.existsSync(discoveryGraphPath)) throw new Error("public/discovery-graph.json must exist (generated by knowledge-build)");
    if (!fs.existsSync(discoveryGraphPagePath)) throw new Error("src/app/discovery-graph/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/discovery-graph")) throw new Error("sitemap must include /discovery-graph");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/discovery-graph")) throw new Error("search-index must include /discovery-graph entry");
  });

  runCheck("Business electricity decision pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "business-electricity-cost-decisions", "page.tsx");
    const choosingPath = path.join(process.cwd(), "src", "app", "business-electricity-cost-decisions", "choosing-a-state-for-electricity-costs", "page.tsx");
    const smallBizPath = path.join(process.cwd(), "src", "app", "business-electricity-cost-decisions", "electricity-costs-for-small-businesses", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/business-electricity-cost-decisions/page.tsx must exist");
    if (!fs.existsSync(choosingPath)) throw new Error("src/app/business-electricity-cost-decisions/choosing-a-state-for-electricity-costs/page.tsx must exist");
    if (!fs.existsSync(smallBizPath)) throw new Error("src/app/business-electricity-cost-decisions/electricity-costs-for-small-businesses/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/business-electricity-cost-decisions")) throw new Error("sitemap must include business-electricity-cost-decisions routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/business-electricity-cost-decisions")) throw new Error("search-index must include business-electricity-cost-decisions entries");
  });

  runCheck("Data center electricity cost pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "data-center-electricity-cost", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "data-center-electricity-cost", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/data-center-electricity-cost/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/data-center-electricity-cost/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/data-center-electricity-cost")) throw new Error("sitemap must include data-center-electricity-cost routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/data-center-electricity-cost")) throw new Error("search-index must include data-center-electricity-cost entries");
  });

  runCheck("Solar vs grid electricity economics pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "solar-vs-grid-electricity-cost", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "solar-vs-grid-electricity-cost", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/solar-vs-grid-electricity-cost/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/solar-vs-grid-electricity-cost/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/solar-vs-grid-electricity-cost")) throw new Error("sitemap must include solar-vs-grid-electricity-cost routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/solar-vs-grid-electricity-cost")) throw new Error("search-index must include solar-vs-grid-electricity-cost entries");
  });

  runCheck("Battery backup electricity cost pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "battery-backup-electricity-cost", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "battery-backup-electricity-cost", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/battery-backup-electricity-cost/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/battery-backup-electricity-cost/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/battery-backup-electricity-cost")) throw new Error("sitemap must include battery-backup-electricity-cost routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/battery-backup-electricity-cost")) throw new Error("search-index must include battery-backup-electricity-cost entries");
  });

  runCheck("Programmatic long-tail electricity pages", () => {
    const pricesRisePath = path.join(process.cwd(), "src", "app", "why-electricity-prices-rise", "page.tsx");
    const expensivePath = path.join(process.cwd(), "src", "app", "why-electricity-is-expensive", "page.tsx");
    const cheapPath = path.join(process.cwd(), "src", "app", "why-electricity-is-cheap", "page.tsx");
    const expensiveSlugPath = path.join(process.cwd(), "src", "app", "why-electricity-is-expensive", "[slug]", "page.tsx");
    const cheapSlugPath = path.join(process.cwd(), "src", "app", "why-electricity-is-cheap", "[slug]", "page.tsx");
    if (!fs.existsSync(pricesRisePath)) throw new Error("src/app/why-electricity-prices-rise/page.tsx must exist");
    if (!fs.existsSync(expensivePath)) throw new Error("src/app/why-electricity-is-expensive/page.tsx must exist");
    if (!fs.existsSync(cheapPath)) throw new Error("src/app/why-electricity-is-cheap/page.tsx must exist");
    if (!fs.existsSync(expensiveSlugPath)) throw new Error("src/app/why-electricity-is-expensive/[slug]/page.tsx must exist");
    if (!fs.existsSync(cheapSlugPath)) throw new Error("src/app/why-electricity-is-cheap/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/why-electricity-prices-rise")) throw new Error("sitemap must include /why-electricity-prices-rise");
    if (!sitemapSrc.includes("/why-electricity-is-expensive")) throw new Error("sitemap must include /why-electricity-is-expensive");
    if (!sitemapSrc.includes("/why-electricity-is-cheap")) throw new Error("sitemap must include /why-electricity-is-cheap");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/why-electricity-prices-rise")) throw new Error("search-index must include /why-electricity-prices-rise");
    if (!searchContent.includes("/why-electricity-is-expensive")) throw new Error("search-index must include /why-electricity-is-expensive");
    if (!searchContent.includes("/why-electricity-is-cheap")) throw new Error("search-index must include /why-electricity-is-cheap");
  });

  runCheck("Electricity price volatility pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-price-volatility", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "electricity-price-volatility", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-price-volatility/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/electricity-price-volatility/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-price-volatility")) throw new Error("sitemap must include electricity-price-volatility routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-price-volatility")) throw new Error("search-index must include electricity-price-volatility entries");
  });

  runCheck("Grid capacity and electricity demand authority pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "grid-capacity-and-electricity-demand", "page.tsx");
    const powerDemandPath = path.join(process.cwd(), "src", "app", "grid-capacity-and-electricity-demand", "power-demand-growth", "page.tsx");
    const constraintsPath = path.join(process.cwd(), "src", "app", "grid-capacity-and-electricity-demand", "grid-capacity-constraints", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/grid-capacity-and-electricity-demand/page.tsx must exist");
    if (!fs.existsSync(powerDemandPath)) throw new Error("src/app/grid-capacity-and-electricity-demand/power-demand-growth/page.tsx must exist");
    if (!fs.existsSync(constraintsPath)) throw new Error("src/app/grid-capacity-and-electricity-demand/grid-capacity-constraints/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/grid-capacity-and-electricity-demand")) throw new Error("sitemap must include grid-capacity-and-electricity-demand routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/grid-capacity-and-electricity-demand")) throw new Error("search-index must include grid-capacity-and-electricity-demand entries");
  });

  runCheck("Electricity cost-of-living pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-cost-of-living", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "electricity-cost-of-living", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-cost-of-living/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/electricity-cost-of-living/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-cost-of-living")) throw new Error("sitemap must include electricity-cost-of-living routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-cost-of-living")) throw new Error("search-index must include electricity-cost-of-living entries");
  });

  runCheck("Future expansion framework", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "future-expansion", "page.tsx");
    const programmaticPath = path.join(process.cwd(), "src", "app", "future-expansion", "programmatic-scaling", "page.tsx");
    const topicPath = path.join(process.cwd(), "src", "app", "future-expansion", "topic-expansion", "page.tsx");
    const dataDiscoveryPath = path.join(process.cwd(), "src", "app", "future-expansion", "data-and-discovery-expansion", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/future-expansion/page.tsx must exist");
    if (!fs.existsSync(programmaticPath)) throw new Error("src/app/future-expansion/programmatic-scaling/page.tsx must exist");
    if (!fs.existsSync(topicPath)) throw new Error("src/app/future-expansion/topic-expansion/page.tsx must exist");
    if (!fs.existsSync(dataDiscoveryPath)) throw new Error("src/app/future-expansion/data-and-discovery-expansion/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/future-expansion")) throw new Error("sitemap must include /future-expansion");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/future-expansion")) throw new Error("search-index must include /future-expansion coverage");
  });

  runCheck("Post-launch traffic expansion framework", () => {
   const hubPath = path.join(process.cwd(), "src", "app", "growth-roadmap", "page.tsx");
    const programmaticPath = path.join(process.cwd(), "src", "app", "growth-roadmap", "programmatic-pages", "page.tsx");
    const topicClustersPath = path.join(process.cwd(), "src", "app", "growth-roadmap", "topic-clusters", "page.tsx");
    const linkablePath = path.join(process.cwd(), "src", "app", "growth-roadmap", "linkable-assets", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/growth-roadmap/page.tsx must exist");
    if (!fs.existsSync(programmaticPath)) throw new Error("src/app/growth-roadmap/programmatic-pages/page.tsx must exist");
    if (!fs.existsSync(topicClustersPath)) throw new Error("src/app/growth-roadmap/topic-clusters/page.tsx must exist");
    if (!fs.existsSync(linkablePath)) throw new Error("src/app/growth-roadmap/linkable-assets/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/growth-roadmap")) throw new Error("sitemap must include /growth-roadmap");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/growth-roadmap")) throw new Error("search-index must include growth-roadmap coverage");
  });

  runCheck("Sitewide content architecture refinement", () => {
    const pages = [
      "electricity-topics",
      "electricity-data",
      "page-index",
      "site-map",
      "entity-registry",
      "discovery-graph",
      "growth-roadmap",
      "launch-checklist",
    ];
    for (const p of pages) {
      const pagePath = path.join(process.cwd(), "src", "app", p, "page.tsx");
      if (!fs.existsSync(pagePath)) throw new Error(`src/app/${p}/page.tsx must exist`);
    }
    const navComponents = [
      "ExploreMore",
      "SectionNav",
      "TopicClusterNav",
    ];
    const navDir = path.join(process.cwd(), "src", "components", "navigation");
    for (const c of navComponents) {
      const compPath = path.join(navDir, `${c}.tsx`);
      if (!fs.existsSync(compPath)) throw new Error(`src/components/navigation/${c}.tsx must exist`);
    }
  });

  runCheck("Launch indexing and crawl optimization", () => {
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    if (!fs.existsSync(sitemapPath)) throw new Error("src/app/sitemap.ts must exist");
    const pageIndexPath = path.join(process.cwd(), "src", "app", "page-index", "page.tsx");
    if (!fs.existsSync(pageIndexPath)) throw new Error("src/app/page-index/page.tsx must exist");
    const siteMapPath = path.join(process.cwd(), "src", "app", "site-map", "page.tsx");
    if (!fs.existsSync(siteMapPath)) throw new Error("src/app/site-map/page.tsx must exist");
    const entityRegistryPath = path.join(process.cwd(), "src", "app", "entity-registry", "page.tsx");
    if (!fs.existsSync(entityRegistryPath)) throw new Error("src/app/entity-registry/page.tsx must exist");
    const discoveryGraphPath = path.join(process.cwd(), "src", "app", "discovery-graph", "page.tsx");
    if (!fs.existsSync(discoveryGraphPath)) throw new Error("src/app/discovery-graph/page.tsx must exist");
  });

  runCheck("Final pre-launch quality pass", () => {
    const appDir = path.join(process.cwd(), "src", "app");
    const rootPage = path.join(appDir, "page.tsx");
    if (!fs.existsSync(rootPage)) throw new Error("src/app/page.tsx must exist");
    const keyPages = [
      "electricity-cost",
      "electricity-affordability",
      "electricity-price-volatility",
      "electricity-inflation",
      "electricity-topics",
      "electricity-data",
      "electricity-cost-comparison",
      "electricity-providers",
      "solar-savings",
      "page-index",
      "site-map",
      "entity-registry",
      "discovery-graph",
    ];
    for (const p of keyPages) {
      const pagePath = path.join(appDir, p, "page.tsx");
      if (!fs.existsSync(pagePath)) throw new Error(`src/app/${p}/page.tsx must exist`);
    }
  });

  runCheck("Solar savings context pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "solar-savings", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "solar-savings", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/solar-savings/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/solar-savings/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/solar-savings")) throw new Error("sitemap must include /solar-savings");
    if (!sitemapSrc.includes("solar-savings/")) throw new Error("sitemap must include solar-savings dynamic routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/solar-savings")) throw new Error("search-index must include solar-savings coverage");
  });

  runCheck("Electricity provider context pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-providers", "page.tsx");
    const slugPath = path.join(process.cwd(), "src", "app", "electricity-providers", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-providers/page.tsx must exist");
    if (!fs.existsSync(slugPath)) throw new Error("src/app/electricity-providers/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-providers")) throw new Error("sitemap must include /electricity-providers");
    if (!sitemapSrc.includes("electricity-providers/")) throw new Error("sitemap must include electricity-providers dynamic routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-providers")) throw new Error("search-index must include electricity-providers coverage");
  });

  runCheck("Fixed-usage redirect entry routes", () => {
    const p500 = path.join(process.cwd(), "src", "app", "how-much-does-500-kwh-cost", "page.tsx");
    const p500Slug = path.join(process.cwd(), "src", "app", "how-much-does-500-kwh-cost", "[slug]", "page.tsx");
    const p1000 = path.join(process.cwd(), "src", "app", "how-much-does-1000-kwh-cost", "page.tsx");
    const p1000Slug = path.join(process.cwd(), "src", "app", "how-much-does-1000-kwh-cost", "[slug]", "page.tsx");
    const p2000 = path.join(process.cwd(), "src", "app", "how-much-does-2000-kwh-cost", "page.tsx");
    const p2000Slug = path.join(process.cwd(), "src", "app", "how-much-does-2000-kwh-cost", "[slug]", "page.tsx");
    if (!fs.existsSync(p500)) throw new Error("src/app/how-much-does-500-kwh-cost/page.tsx must exist");
    if (!fs.existsSync(p500Slug)) throw new Error("src/app/how-much-does-500-kwh-cost/[slug]/page.tsx must exist");
    if (!fs.existsSync(p1000)) throw new Error("src/app/how-much-does-1000-kwh-cost/page.tsx must exist");
    if (!fs.existsSync(p1000Slug)) throw new Error("src/app/how-much-does-1000-kwh-cost/[slug]/page.tsx must exist");
    if (!fs.existsSync(p2000)) throw new Error("src/app/how-much-does-2000-kwh-cost/page.tsx must exist");
    if (!fs.existsSync(p2000Slug)) throw new Error("src/app/how-much-does-2000-kwh-cost/[slug]/page.tsx must exist");
    const p1500 = path.join(process.cwd(), "src", "app", "how-much-does-1500-kwh-cost", "page.tsx");
    const p1500Slug = path.join(process.cwd(), "src", "app", "how-much-does-1500-kwh-cost", "[slug]", "page.tsx");
    if (!fs.existsSync(p1500)) throw new Error("src/app/how-much-does-1500-kwh-cost/page.tsx must exist");
    if (!fs.existsSync(p1500Slug)) throw new Error("src/app/how-much-does-1500-kwh-cost/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (sitemapSrc.includes("/how-much-does-500-kwh-cost")) throw new Error("sitemap must exclude /how-much-does-500-kwh-cost redirect routes");
    if (sitemapSrc.includes("/how-much-does-1000-kwh-cost")) throw new Error("sitemap must exclude /how-much-does-1000-kwh-cost redirect routes");
    if (sitemapSrc.includes("/how-much-does-1500-kwh-cost")) throw new Error("sitemap must exclude /how-much-does-1500-kwh-cost redirect routes");
    if (sitemapSrc.includes("/how-much-does-2000-kwh-cost")) throw new Error("sitemap must exclude /how-much-does-2000-kwh-cost redirect routes");
    if (!sitemapSrc.includes("/electricity-usage-cost/")) throw new Error("sitemap must include canonical electricity-usage-cost routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/how-much-does-500-kwh-cost")) throw new Error("search-index must include /how-much-does-500-kwh-cost");
    if (!searchContent.includes("/how-much-does-1000-kwh-cost")) throw new Error("search-index must include /how-much-does-1000-kwh-cost");
    if (!searchContent.includes("/how-much-does-1500-kwh-cost")) throw new Error("search-index must include /how-much-does-1500-kwh-cost");
    if (!searchContent.includes("/how-much-does-2000-kwh-cost")) throw new Error("search-index must include /how-much-does-2000-kwh-cost");
  });

  runCheck("State-to-state electricity comparison generator", () => {
    const manifestPath = path.join(process.cwd(), "public", "electricity-comparison-pairs.json");
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-cost-comparison", "page.tsx");
    const pairPath = path.join(process.cwd(), "src", "app", "electricity-cost-comparison", "[pair]", "page.tsx");
    if (!fs.existsSync(manifestPath)) throw new Error("public/electricity-comparison-pairs.json must exist");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-cost-comparison/page.tsx must exist");
    if (!fs.existsSync(pairPath)) throw new Error("src/app/electricity-cost-comparison/[pair]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-cost-comparison")) throw new Error("sitemap must include /electricity-cost-comparison");
    if (!sitemapSrc.includes("electricity-cost-comparison/")) throw new Error("sitemap must include electricity-cost-comparison pair routes");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-cost-comparison")) throw new Error("search-index must include electricity-cost-comparison coverage");
  });

  runCheck("AI electricity demand authority pages", () => {
    const electricityPricesPath = path.join(process.cwd(), "src", "app", "ai-energy-demand", "electricity-prices-and-ai", "page.tsx");
    const gridStrainPath = path.join(process.cwd(), "src", "app", "ai-energy-demand", "grid-strain-and-electricity-costs", "page.tsx");
    if (!fs.existsSync(electricityPricesPath)) throw new Error("src/app/ai-energy-demand/electricity-prices-and-ai/page.tsx must exist");
    if (!fs.existsSync(gridStrainPath)) throw new Error("src/app/ai-energy-demand/grid-strain-and-electricity-costs/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/ai-energy-demand/electricity-prices-and-ai")) throw new Error("sitemap must include /ai-energy-demand/electricity-prices-and-ai");
    if (!sitemapSrc.includes("/ai-energy-demand/grid-strain-and-electricity-costs")) throw new Error("sitemap must include /ai-energy-demand/grid-strain-and-electricity-costs");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/ai-energy-demand/electricity-prices-and-ai")) throw new Error("search-index must include ai-energy-demand/electricity-prices-and-ai entry");
    if (!searchContent.includes("/ai-energy-demand/grid-strain-and-electricity-costs")) throw new Error("search-index must include ai-energy-demand/grid-strain-and-electricity-costs entry");
  });

  runCheck("State electricity inflation pages", () => {
    const slugPagePath = path.join(process.cwd(), "src", "app", "electricity-inflation", "[slug]", "page.tsx");
    if (!fs.existsSync(slugPagePath)) throw new Error("src/app/electricity-inflation/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = sitemapSource || fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("electricity-inflation/")) throw new Error("sitemap must include electricity-inflation/[slug] route family");
    const searchIndexPath = path.join(root, "search-index.json");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("electricity-inflation:state:")) throw new Error("search-index must include electricity-inflation state entries");
  });

  runCheck("Launch command", () => {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (!pkg.scripts || !pkg.scripts["launch:check"]) {
      throw new Error("package.json must include launch:check script");
    }
  });

  runCheck("Internal topic link graph optimization", () => {
    const topicClusterNavPath = path.join(process.cwd(), "src", "components", "navigation", "TopicClusterNav.tsx");
    if (!fs.existsSync(topicClusterNavPath)) throw new Error("src/components/navigation/TopicClusterNav.tsx must exist");
    const pagesWithTopicClusterNav = [
      "src/app/electricity-topics/page.tsx",
      "src/app/electricity-inflation/page.tsx",
      "src/app/ai-energy-demand/page.tsx",
      "src/app/power-generation-mix/page.tsx",
      "src/app/electricity-markets/page.tsx",
    ];
    for (const p of pagesWithTopicClusterNav) {
      const fullPath = path.join(process.cwd(), p);
      if (!fs.existsSync(fullPath)) throw new Error(`${p} must exist`);
      const content = fs.readFileSync(fullPath, "utf8");
      if (!content.includes("TopicClusterNav")) throw new Error(`${p} must import/use TopicClusterNav`);
    }
    const discoveryPages = [
      "src/app/page-index/page.tsx",
      "src/app/site-map/page.tsx",
      "src/app/entity-registry/page.tsx",
      "src/app/data-registry/page.tsx",
    ];
    for (const p of discoveryPages) {
      const fullPath = path.join(process.cwd(), p);
      if (!fs.existsSync(fullPath)) throw new Error(`${p} must exist`);
    }
  });

  runCheck("Operating playbook layer", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "operating-playbook", "page.tsx");
    const dataUpdatesPath = path.join(process.cwd(), "src", "app", "operating-playbook", "data-updates", "page.tsx");
    const expandingPath = path.join(process.cwd(), "src", "app", "operating-playbook", "expanding-the-site", "page.tsx");
    const qualityPath = path.join(process.cwd(), "src", "app", "operating-playbook", "quality-and-verification", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/operating-playbook/page.tsx must exist");
    if (!fs.existsSync(dataUpdatesPath)) throw new Error("src/app/operating-playbook/data-updates/page.tsx must exist");
    if (!fs.existsSync(expandingPath)) throw new Error("src/app/operating-playbook/expanding-the-site/page.tsx must exist");
    if (!fs.existsSync(qualityPath)) throw new Error("src/app/operating-playbook/quality-and-verification/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/operating-playbook")) throw new Error("sitemap must include /operating-playbook");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist (run knowledge:build first)");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/operating-playbook")) throw new Error("search-index must include /operating-playbook entries");
  });

  runCheck("Final full-roadmap quality sweep", () => {
    const keyPages = [
      path.join(process.cwd(), "src", "app", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-topics", "page.tsx"),
      path.join(process.cwd(), "src", "app", "electricity-data", "page.tsx"),
      path.join(process.cwd(), "src", "app", "knowledge", "page.tsx"),
      path.join(process.cwd(), "src", "app", "page-index", "page.tsx"),
      path.join(process.cwd(), "src", "app", "site-map", "page.tsx"),
      path.join(process.cwd(), "src", "app", "entity-registry", "page.tsx"),
      path.join(process.cwd(), "src", "app", "discovery-graph", "page.tsx"),
      path.join(process.cwd(), "src", "app", "growth-roadmap", "page.tsx"),
      path.join(process.cwd(), "src", "app", "site-maintenance", "page.tsx"),
      path.join(process.cwd(), "src", "app", "launch-checklist", "page.tsx"),
    ];
    for (const p of keyPages) {
      if (!fs.existsSync(p)) throw new Error(`missing key page: ${path.relative(process.cwd(), p)}`);
    }
  });

  runCheck("Commercial marketplace-ready electricity landing pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "business-electricity-options", "page.tsx");
    const statePath = path.join(process.cwd(), "src", "app", "business-electricity-options", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/business-electricity-options/page.tsx must exist");
    if (!fs.existsSync(statePath)) throw new Error("src/app/business-electricity-options/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/business-electricity-options")) throw new Error("sitemap must include /business-electricity-options");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist (run knowledge:build first)");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/business-electricity-options")) throw new Error("search-index must include /business-electricity-options entries");
  });

  runCheck("State marketplace-ready electricity landing pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "shop-electricity", "page.tsx");
    const statePath = path.join(process.cwd(), "src", "app", "shop-electricity", "[slug]", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/shop-electricity/page.tsx must exist");
    if (!fs.existsSync(statePath)) throw new Error("src/app/shop-electricity/[slug]/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/shop-electricity")) throw new Error("sitemap must include /shop-electricity");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist (run knowledge:build first)");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/shop-electricity")) throw new Error("search-index must include /shop-electricity entries");
  });

  runCheck("Partner-ready electricity shopping foundation", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "electricity-shopping", "page.tsx");
    const byStatePath = path.join(process.cwd(), "src", "app", "electricity-shopping", "by-state", "page.tsx");
    const howToPath = path.join(process.cwd(), "src", "app", "electricity-shopping", "how-electricity-shopping-works", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/electricity-shopping/page.tsx must exist");
    if (!fs.existsSync(byStatePath)) throw new Error("src/app/electricity-shopping/by-state/page.tsx must exist");
    if (!fs.existsSync(howToPath)) throw new Error("src/app/electricity-shopping/how-electricity-shopping-works/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/electricity-shopping")) throw new Error("sitemap must include /electricity-shopping");
    if (!sitemapSrc.includes("/electricity-shopping/by-state")) throw new Error("sitemap must include /electricity-shopping/by-state");
    if (!sitemapSrc.includes("/electricity-shopping/how-electricity-shopping-works")) throw new Error("sitemap must include /electricity-shopping/how-electricity-shopping-works");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist (run knowledge:build first)");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/electricity-shopping")) throw new Error("search-index must include /electricity-shopping entries");
  });

  runCheck("Post-launch operating and maintenance framework", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "site-maintenance", "page.tsx");
    const dataRefreshPath = path.join(process.cwd(), "src", "app", "site-maintenance", "data-refresh", "page.tsx");
    const qualityChecksPath = path.join(process.cwd(), "src", "app", "site-maintenance", "quality-checks", "page.tsx");
    const contentExpansionPath = path.join(process.cwd(), "src", "app", "site-maintenance", "content-expansion", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/site-maintenance/page.tsx must exist");
    if (!fs.existsSync(dataRefreshPath)) throw new Error("src/app/site-maintenance/data-refresh/page.tsx must exist");
    if (!fs.existsSync(qualityChecksPath)) throw new Error("src/app/site-maintenance/quality-checks/page.tsx must exist");
    if (!fs.existsSync(contentExpansionPath)) throw new Error("src/app/site-maintenance/content-expansion/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/site-maintenance")) throw new Error("sitemap must include /site-maintenance");
    if (!sitemapSrc.includes("/site-maintenance/data-refresh")) throw new Error("sitemap must include /site-maintenance/data-refresh");
    if (!sitemapSrc.includes("/site-maintenance/quality-checks")) throw new Error("sitemap must include /site-maintenance/quality-checks");
    if (!sitemapSrc.includes("/site-maintenance/content-expansion")) throw new Error("sitemap must include /site-maintenance/content-expansion");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist (run knowledge:build first)");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/site-maintenance")) throw new Error("search-index must include /site-maintenance entries");
  });

  runCheck("Provider plan comparison foundation pages", () => {
    const hubPath = path.join(process.cwd(), "src", "app", "compare-electricity-plans", "page.tsx");
    const byStatePath = path.join(process.cwd(), "src", "app", "compare-electricity-plans", "by-state", "page.tsx");
    const howToPath = path.join(process.cwd(), "src", "app", "compare-electricity-plans", "how-to-compare-electricity-plans", "page.tsx");
    if (!fs.existsSync(hubPath)) throw new Error("src/app/compare-electricity-plans/page.tsx must exist");
    if (!fs.existsSync(byStatePath)) throw new Error("src/app/compare-electricity-plans/by-state/page.tsx must exist");
    if (!fs.existsSync(howToPath)) throw new Error("src/app/compare-electricity-plans/how-to-compare-electricity-plans/page.tsx must exist");
    const sitemapPath = path.join(process.cwd(), "src", "app", "sitemap.ts");
    const sitemapSrc = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemapSrc.includes("/compare-electricity-plans")) throw new Error("sitemap must include /compare-electricity-plans");
    if (!sitemapSrc.includes("/compare-electricity-plans/by-state")) throw new Error("sitemap must include /compare-electricity-plans/by-state");
    if (!sitemapSrc.includes("/compare-electricity-plans/how-to-compare-electricity-plans")) throw new Error("sitemap must include /compare-electricity-plans/how-to-compare-electricity-plans");
    const searchIndexPath = path.join(root, "search-index.json");
    if (!fs.existsSync(searchIndexPath)) throw new Error("public/knowledge/search-index.json must exist (run knowledge:build first)");
    const searchContent = fs.readFileSync(searchIndexPath, "utf8");
    if (!searchContent.includes("/compare-electricity-plans")) throw new Error("search-index must include /compare-electricity-plans entries");
  });

  runCheck("Authority signals layer", () => {
    const aboutPath = path.join(process.cwd(), "src", "components", "navigation", "AboutThisSite.tsx");
    if (!fs.existsSync(aboutPath)) throw new Error("src/components/navigation/AboutThisSite.tsx must exist");
    const authorityPages = [
      "src/app/page.tsx",
      "src/app/electricity-topics/page.tsx",
      "src/app/electricity-data/page.tsx",
    ];
    for (const p of authorityPages) {
      const fullPath = path.join(process.cwd(), p);
      if (!fs.existsSync(fullPath)) throw new Error(`${p} must exist`);
      const content = fs.readFileSync(fullPath, "utf8");
      if (!content.includes("AboutThisSite")) throw new Error(`${p} must import/use AboutThisSite`);
    }
    const keyAuthorityPages = [
      "src/app/methodology/page.tsx",
      "src/app/datasets/page.tsx",
      "src/app/entity-registry/page.tsx",
      "src/app/discovery-graph/page.tsx",
    ];
    for (const p of keyAuthorityPages) {
      const fullPath = path.join(process.cwd(), p);
      if (!fs.existsSync(fullPath)) throw new Error(`${p} must exist`);
    }
  });

  runCheck("Route-family backing", () => {
    const stateDir = path.join(root, "state");
    const rankingsDir = path.join(root, "rankings");
    const rankingsIndexPath = path.join(root, "rankings", "index.json");
    const compareDir = path.join(root, "compare");
    const pairsPath = path.join(root, "compare", "pairs.json");
    if (fs.existsSync(stateDir)) {
      const stateFiles = fs.readdirSync(stateDir).filter((f) => f.endsWith(".json"));
      if (stateFiles.length === 0) throw new Error("public/knowledge/state/ must have JSON files for state routes");
    }
    if (fs.existsSync(rankingsDir)) {
      if (!fs.existsSync(rankingsIndexPath)) throw new Error("public/knowledge/rankings/index.json must exist for rankings routes");
    }
    if (fs.existsSync(compareDir) && fs.existsSync(pairsPath)) {
      const pairsData = JSON.parse(fs.readFileSync(pairsPath, "utf8"));
      if (!Array.isArray(pairsData.pairs) || pairsData.pairs.length === 0) {
        throw new Error("compare/pairs.json must have at least one pair for electricity-cost-comparison routes");
      }
    }
  });

  for (const c of checks) {
    if (c.ok) {
      console.log(`CHECK: ${c.name} — OK`);
    } else {
      console.error(`CHECK FAILED: ${c.name} — ${c.message || "verification failed"}`);
    }
  }

  const checkByName = new Map(checks.map((c) => [c.name, c]));
  const failedGroups = [];
  console.log("\n" + "-".repeat(50));
  console.log("LAUNCH READINESS SUMMARY");
  console.log("-".repeat(50));
  for (const [groupName, checkNames] of Object.entries(PRODUCTION_SUMMARY_GROUPS)) {
    const allOk = checkNames.every((n) => checkByName.get(n)?.ok);
    const status = allOk ? "OK" : "FAILED";
    console.log(`- ${groupName}: ${status}`);
    if (!allOk) failedGroups.push(groupName);
  }
  console.log("-".repeat(50));

  if (failedGroups.length > 0) {
    console.error("\nLAUNCH BLOCKER — One or more production readiness checks failed.");
    fail(failedGroups.join(", ") + " — fix the above before launch.");
  }
}

main();
