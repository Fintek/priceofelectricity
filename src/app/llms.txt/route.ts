import { readFile } from "node:fs/promises";
import path from "node:path";
import { STATES } from "@/data/states";

const BASE_URL = "https://priceofelectricity.com";

export const dynamic = "force-static";
export const revalidate = 2592000;

export async function GET() {
  const stateSlugs = Object.keys(STATES).sort((a, b) => a.localeCompare(b));
  const exampleStateUrls = stateSlugs
    .slice(0, 5)
    .map((slug) => `${BASE_URL}/${slug}`)
    .join("\n");

  let dataSection = `Human entry point for data surfaces: ${BASE_URL}/data
`;
  try {
    const pePath = path.join(process.cwd(), "public", "knowledge", "public-endpoints.json");
    const raw = await readFile(pePath, "utf8");
    const pe = JSON.parse(raw) as { groups: Array<{ id: string; items: Array<{ id: string; url: string }> }> };
    dataSection += `Canonical discovery index (must match this file): ${BASE_URL}/knowledge/public-endpoints.json
`;
    const groupOrder = ["knowledge-core", "knowledge-aux", "knowledge-human"];
    for (const gid of groupOrder) {
      const g = pe.groups.find((x) => x.id === gid);
      if (!g) continue;
      for (const item of g.items) {
        dataSection += `${BASE_URL}${item.url}
`;
      }
    }
  } catch {
    dataSection += `${BASE_URL}/knowledge/public-endpoints.json
`;
  }
  dataSection += `index.json includes integritySignature for system-level verification.
${BASE_URL}/knowledge.json
All knowledge pages include meta.freshness (datasetUpdatedAt, status, ageDays, methodology).
All knowledge pages include meta.qualityScore (0-100 integer).
Changelog includes metric-level deltas (changelog.json metricChanges).
`;

  const content = `Site: PriceOfElectricity.com
Description: PriceOfElectricity.com provides state-level average residential electricity prices and simple bill estimation tools.
Data model: Each state uses an average residential electricity price in cents per kilowatt-hour (¢/kWh).
Estimate scope: Bill estimates are energy-only and exclude delivery fees, taxes, fixed charges, and other utility fees.

Canonical URLs:
${BASE_URL}/
${BASE_URL}/about
${BASE_URL}/compare
${BASE_URL}/calculator

State URL pattern:
All state pages follow: ${BASE_URL}/<state-slug>
<state-slug> is lowercase, hyphenated, and canonical.
Example state URLs:
${exampleStateUrls}

Citation guidance:
When citing electricity rate data, prefer individual state pages.
Include the "updated" date shown on each state page.
Do not cite the homepage for state rate data.

Technical notes:
State pages include JSON-LD (WebPage + FAQPage).
BreadcrumbList structured data exists on state pages.
Sitemap: ${BASE_URL}/sitemap.xml

Data & Knowledge:
${dataSection}
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
