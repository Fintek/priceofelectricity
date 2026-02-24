import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";
import { computeElectricityPriceIndex } from "@/lib/priceIndex";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "National Electricity Price Rankings";
const DESCRIPTION =
  "All U.S. states ranked by average residential electricity rate, with Electricity Price Index™ and Value Score™ for each state.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/national/rankings` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/rankings`,
  },
};

export default function NationalRankingsPage() {
  const states = buildAllNormalizedStates();
  const indexMap = new Map(
    computeElectricityPriceIndex().map((e) => [e.slug, e.indexValue])
  );

  const rows = states
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      rate: s.avgRateCentsPerKwh,
      index: indexMap.get(s.slug) ?? 0,
      valueScore: s.valueScore,
      valueTier: s.valueTier,
    }))
    .sort((a, b) => b.rate - a.rate);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/rankings`,
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${r.name}: ${r.rate.toFixed(2)}¢/kWh`,
      url: `${BASE_URL}/${r.slug}`,
    })),
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/national">National Overview</Link> {" → "} Rankings
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        All {rows.length} states ranked by average residential electricity rate
        (highest to lowest). Index values use a national baseline of 100.
      </p>

      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd" }}>
              <th style={{ textAlign: "left", padding: "8px 8px 8px 0", width: 40 }}>
                #
              </th>
              <th style={{ textAlign: "left", padding: "8px 12px" }}>
                State
              </th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>
                Rate (¢/kWh)
              </th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>
                Index
              </th>
              <th style={{ textAlign: "right", padding: "8px 12px" }}>
                Value Score
              </th>
              <th style={{ textAlign: "left", padding: "8px 0 8px 12px" }}>
                Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.slug}
                style={{
                  borderBottom: "1px solid #eee",
                  backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa",
                }}
              >
                <td style={{ padding: "6px 8px 6px 0" }}>{i + 1}</td>
                <td style={{ padding: "6px 12px" }}>
                  <Link href={`/${r.slug}`}>{r.name}</Link>
                </td>
                <td style={{ padding: "6px 12px", textAlign: "right" }}>
                  {r.rate.toFixed(2)}
                </td>
                <td style={{ padding: "6px 12px", textAlign: "right" }}>
                  {r.index}
                </td>
                <td style={{ padding: "6px 12px", textAlign: "right" }}>
                  {r.valueScore}
                </td>
                <td style={{ padding: "6px 0 6px 12px" }}>{r.valueTier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/national/extremes">Extremes</Link> {" | "}
        <Link href="/national/affordability">Affordability</Link> {" | "}
        <Link href="/compare">Compare</Link>
      </p>
    </main>
  );
}
