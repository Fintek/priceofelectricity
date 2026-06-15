import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { feature } from "topojson-client";
import { geoAlbersUsa, geoPath } from "d3-geo";
import statesTopo from "us-atlas/states-10m.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outputPath = join(root, "src/data/usStateMapPaths.generated.json");
const stateSlugsPath = join(root, "src/data/stateSlugs.ts");

const VIEW_BOX = "0 0 975 610";
const FIT_EXTENT = [
  [0, 0],
  [975, 610],
];

/**
 * @param {number} value
 * @returns {number}
 */
function roundCoord(value) {
  return Number(value.toFixed(1));
}

/**
 * Round every numeric token in an SVG path `d` string to one decimal place.
 * @param {string} d
 * @returns {string}
 */
function roundPathD(d) {
  return d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (match) => {
    const n = Number(match);
    if (!Number.isFinite(n)) {
      return match;
    }
    const rounded = roundCoord(n);
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  });
}

/**
 * @param {string} name
 * @returns {string}
 */
function nameToSlug(name) {
  if (name === "District of Columbia") {
    return "district-of-columbia";
  }
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * @returns {Set<string>}
 */
function loadCanonicalSlugs() {
  const src = readFileSync(stateSlugsPath, "utf8");
  const match = src.match(/export const STATE_SLUGS = \[([\s\S]*?)\] as const/);
  if (!match) {
    console.error("Could not parse STATE_SLUGS from src/data/stateSlugs.ts");
    process.exit(1);
  }
  const slugs = [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return new Set(slugs);
}

const canonicalSlugs = loadCanonicalSlugs();
const statesFeature = feature(statesTopo, statesTopo.objects.states);
const projection = geoAlbersUsa();
projection.fitExtent(FIT_EXTENT, statesFeature);
const path = geoPath(projection);

/** @type {Record<string, { d: string; cx: number; cy: number }>} */
const states = {};

for (const geoFeature of statesFeature.features) {
  const name = geoFeature.properties?.name;
  if (typeof name !== "string" || name.length === 0) {
    continue;
  }

  const dRaw = path(geoFeature);
  if (!dRaw || dRaw.trim().length === 0) {
    continue;
  }

  const slug = nameToSlug(name);
  if (!canonicalSlugs.has(slug)) {
    console.error(`Atlas feature "${name}" -> slug "${slug}" is not in STATE_SLUGS`);
    process.exit(1);
  }

  const centroid = path.centroid(geoFeature);
  states[slug] = {
    d: roundPathD(dRaw),
    cx: roundCoord(centroid[0]),
    cy: roundCoord(centroid[1]),
  };
}

const emittedSlugs = new Set(Object.keys(states));
for (const slug of canonicalSlugs) {
  if (!emittedSlugs.has(slug)) {
    console.warn(`Warning: canonical slug "${slug}" missing from atlas output`);
  }
}

if (emittedSlugs.size !== canonicalSlugs.size) {
  console.warn(
    `Warning: emitted ${emittedSlugs.size} states, expected ${canonicalSlugs.size} canonical slugs`,
  );
}

const output = {
  viewBox: VIEW_BOX,
  states,
};

writeFileSync(outputPath, `${JSON.stringify(output)}\n`, "utf8");
console.log(`Wrote ${outputPath} (${emittedSlugs.size} states)`);
