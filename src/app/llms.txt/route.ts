import { readFile } from "node:fs/promises";
import path from "node:path";
import { STATES } from "@/data/states";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 2592000;

function itemDisplayName(id: string): string {
  const stripped = id.startsWith("knowledge-") ? id.slice("knowledge-".length) : id;
  return stripped
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET() {
  const stateSlugs = Object.keys(STATES).sort((a, b) => a.localeCompare(b));
  const stateLinks = stateSlugs
    .map((slug) => `- [${STATES[slug].name}](${BASE_URL}/${slug}): Average residential electricity price.`)
    .join("\n");

  let dataSection = `- [Data hub](${BASE_URL}/data): Human entry point for data surfaces.
`;
  try {
    const pePath = path.join(process.cwd(), "public", "knowledge", "public-endpoints.json");
    const raw = await readFile(pePath, "utf8");
    const pe = JSON.parse(raw) as {
      groups: Array<{
        id: string;
        items: Array<{ id: string; url: string; description: string }>;
      }>;
    };
    const groupOrder = ["knowledge-core", "knowledge-aux", "knowledge-human"];
    for (const gid of groupOrder) {
      const g = pe.groups.find((x) => x.id === gid);
      if (!g) continue;
      for (const item of g.items) {
        dataSection += `- [${itemDisplayName(item.id)}](${BASE_URL}${item.url}): ${item.description}
`;
      }
    }
  } catch {
    // public-endpoints.json unavailable at build time; lead bullet above still references /data
  }
  dataSection += `- [knowledge.json](${BASE_URL}/knowledge.json): Top-level knowledge payload.
- [Discovery index](${BASE_URL}/knowledge/public-endpoints.json): Canonical discovery index (must match this file).
`;

  const content = `# PriceOfElectricity.com

> State-level average residential electricity prices and a simple bill estimator for all 50 US states and DC.

Each state page reports an average residential electricity price in cents per kilowatt-hour (¢/kWh). Bill estimates use the EIA all-in average residential rate (delivery included); separately billed taxes, fixed charges, and other utility fees are not added.

Knowledge endpoints expose machine-readable data: index.json includes an integritySignature for system-level verification, every knowledge page carries meta.freshness (datasetUpdatedAt, status, ageDays, methodology) and an integer meta.qualityScore (0–100), and changelog.json records metric-level deltas (metricChanges).

## Core pages

- [Home](${BASE_URL}/): Site overview and entry point.
- [About](${BASE_URL}/about): Methodology and data sourcing.
- [Compare](${BASE_URL}/compare): Compare electricity prices across states.
- [Calculator](${BASE_URL}/calculator): Estimate a bill at the all-in average rate.

## State pages

All state and DC pages follow the pattern ${BASE_URL}/<slug>, where <slug> is lowercase, hyphenated, and canonical (e.g. district-of-columbia, new-hampshire).

${stateLinks}

## Citation guidance

When citing electricity rate data, prefer individual state pages and include the "updated" date shown on each state page. Do not cite the homepage for state rate data.

## Technical

- State pages include JSON-LD (WebPage + FAQPage).
- BreadcrumbList structured data exists on state pages.
- [Sitemap](${BASE_URL}/sitemap-index.xml): Full URL index.

## Data & Knowledge

${dataSection}`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
