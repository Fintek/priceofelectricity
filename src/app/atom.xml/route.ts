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
  const entries = Object.entries(STATES)
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

  const feedUpdated =
    entries.length > 0
      ? new Date(Math.max(...entries.map((entry) => entry.date.getTime())))
      : new Date();

  const entriesXml = entries
    .map(({ state, link, date }) => {
      const title = escapeXml(`${state.name} electricity price updated`);
      const summary = escapeXml(
        `Avg residential rate: ${state.avgRateCentsPerKwh}¢/kWh (updated ${state.updated}).`
      );
      const escapedLink = escapeXml(link);
      return `<entry>
  <title>${title}</title>
  <id>${escapedLink}</id>
  <link href="${escapedLink}" />
  <updated>${date.toISOString()}</updated>
  <summary>${summary}</summary>
</entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml("PriceOfElectricity.com Updates")}</title>
  <id>${escapeXml(`${BASE_URL}/atom.xml`)}</id>
  <link href="${escapeXml(`${BASE_URL}/atom.xml`)}" rel="self" />
  <link href="${escapeXml(`${BASE_URL}/`)}" />
  <updated>${feedUpdated.toISOString()}</updated>
  <subtitle>${escapeXml("Updates to state electricity price snapshots and tools.")}</subtitle>
${entriesXml}
</feed>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
