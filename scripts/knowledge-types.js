/**
 * knowledge-types.js — Validates knowledge index.json has required type/shape fields.
 * Run: node scripts/knowledge-types.js
 */
const fs = require("node:fs");
const path = require("node:path");

function fail(message) {
  console.error(`knowledge:types failed - ${message}`);
  process.exit(1);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`unable to parse ${label}: ${error.message}`);
  }
}

const root = path.join(process.cwd(), "public", "knowledge");
const indexPath = path.join(root, "index.json");

if (!fs.existsSync(indexPath)) {
  fail("index.json not found");
}

const index = readJson(indexPath, "index.json");

if (typeof index.integrityManifestUrl !== "string" || index.integrityManifestUrl.length === 0) {
  fail("index.json missing or empty integrityManifestUrl");
}

if (index.integrityManifestUrl !== "/knowledge/integrity/manifest.json") {
  fail(`index.json integrityManifestUrl must be /knowledge/integrity/manifest.json, got: ${index.integrityManifestUrl}`);
}

if (typeof index.capabilitiesUrl !== "string" || index.capabilitiesUrl.length === 0) {
  fail("index.json missing or empty capabilitiesUrl");
}
if (index.capabilitiesUrl !== "/knowledge/capabilities.json") {
  fail(`index.json capabilitiesUrl must be /knowledge/capabilities.json, got: ${index.capabilitiesUrl}`);
}
if (typeof index.releaseUrl !== "string" || index.releaseUrl.length === 0) {
  fail("index.json missing or empty releaseUrl");
}
if (index.releaseUrl !== "/knowledge/release.json") {
  fail(`index.json releaseUrl must be /knowledge/release.json, got: ${index.releaseUrl}`);
}

console.log("knowledge:types passed");
