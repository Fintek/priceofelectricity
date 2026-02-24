import { STATES } from "@/data/states";

const BASE_URL = "https://priceofelectricity.com";

export const dynamic = "force-static";
export const revalidate = 2592000;

export function GET() {
  const stateSlugs = Object.keys(STATES).sort((a, b) => a.localeCompare(b));
  const exampleStateUrls = stateSlugs
    .slice(0, 5)
    .map((slug) => `${BASE_URL}/${slug}`)
    .join("\n");

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
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
