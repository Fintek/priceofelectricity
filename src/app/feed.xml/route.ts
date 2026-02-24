import { STATES } from "@/data/states";
import { escapeXml } from "@/lib/xml";

const BASE_URL = "https://priceofelectricity.com";

export const dynamic = "force-static";
export const revalidate = 2592000;

function toDate(updated: string): Date {
  const parsed = Date.parse(updated);
  if (Number.isNaN(parsed)) {
    return new Date();
  }
  return new Date(parsed);
}

export function GET() {
  const items = Object.entries(STATES)
    .map(([slug, state]) => {
      const link = `${BASE_URL}/${slug}`;
      const date = toDate(state.updated);
      return {
        slug,
        state,
        link,
        date,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 50);

  const itemXml = items
    .map(({ state, link, date }) => {
      const title = escapeXml(`${state.name} electricity price updated`);
      const description = escapeXml(
        `Avg residential rate: ${state.avgRateCentsPerKwh}¢/kWh (updated ${state.updated}).`
      );
      const escapedLink = escapeXml(link);
      return `<item>
  <title>${title}</title>
  <link>${escapedLink}</link>
  <guid>${escapedLink}</guid>
  <pubDate>${date.toUTCString()}</pubDate>
  <description>${description}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml("PriceOfElectricity.com Updates")}</title>
  <link>${escapeXml(`${BASE_URL}/`)}</link>
  <description>${escapeXml("Updates to state electricity price snapshots and tools.")}</description>
${itemXml}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
