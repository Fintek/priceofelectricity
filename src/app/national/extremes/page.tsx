import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { getTopNByRate, getBottomNByRate } from "@/lib/nationalStats";
import { computeElectricityPriceIndex } from "@/lib/priceIndex";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Electricity Price Extremes";
const DESCRIPTION =
  "The most and least expensive U.S. states for residential electricity, plus the largest Electricity Price Index™ outliers.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/national/extremes` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/extremes`,
  },
};

export default function NationalExtremesPage() {
  const top5 = getTopNByRate(5);
  const bottom5 = getBottomNByRate(5);
  const index = computeElectricityPriceIndex();
  const indexHigh = [...index]
    .sort((a, b) => b.indexValue - a.indexValue)
    .slice(0, 5);
  const indexLow = [...index]
    .sort((a, b) => a.indexValue - b.indexValue)
    .slice(0, 5);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/extremes`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/national">National Overview</Link> {" → "} Extremes
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        The states with the highest and lowest average residential electricity
        rates, plus the largest deviations from the national average as measured
        by the Electricity Price Index™ (base = 100).
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Top 5 most expensive states
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "8px 12px 8px 0" }}>
                  State
                </th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>
                  Rate (¢/kWh)
                </th>
                <th style={{ textAlign: "left", padding: "8px 0 8px 12px" }}>
                  Affordability
                </th>
              </tr>
            </thead>
            <tbody>
              {top5.map((s, i) => (
                <tr
                  key={s.slug}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "6px 12px 6px 0" }}>
                    <Link href={`/${s.slug}`}>{s.name}</Link>
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    {s.avgRateCentsPerKwh.toFixed(2)}
                  </td>
                  <td style={{ padding: "6px 0 6px 12px" }}>
                    {s.affordabilityCategory}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Top 5 least expensive states
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "8px 12px 8px 0" }}>
                  State
                </th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>
                  Rate (¢/kWh)
                </th>
                <th style={{ textAlign: "left", padding: "8px 0 8px 12px" }}>
                  Affordability
                </th>
              </tr>
            </thead>
            <tbody>
              {bottom5.map((s, i) => (
                <tr
                  key={s.slug}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "6px 12px 6px 0" }}>
                    <Link href={`/${s.slug}`}>{s.name}</Link>
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    {s.avgRateCentsPerKwh.toFixed(2)}
                  </td>
                  <td style={{ padding: "6px 0 6px 12px" }}>
                    {s.affordabilityCategory}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Highest index values (furthest above average)
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "8px 12px 8px 0" }}>
                  State
                </th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>
                  Rate (¢/kWh)
                </th>
                <th style={{ textAlign: "right", padding: "8px 0 8px 12px" }}>
                  Index
                </th>
              </tr>
            </thead>
            <tbody>
              {indexHigh.map((e, i) => (
                <tr
                  key={e.slug}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "6px 12px 6px 0" }}>
                    <Link href={`/${e.slug}`}>{e.name}</Link>
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    {e.rawRate.toFixed(2)}
                  </td>
                  <td style={{ padding: "6px 0 6px 12px", textAlign: "right" }}>
                    <strong>{e.indexValue}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Lowest index values (furthest below average)
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "8px 12px 8px 0" }}>
                  State
                </th>
                <th style={{ textAlign: "right", padding: "8px 12px" }}>
                  Rate (¢/kWh)
                </th>
                <th style={{ textAlign: "right", padding: "8px 0 8px 12px" }}>
                  Index
                </th>
              </tr>
            </thead>
            <tbody>
              {indexLow.map((e, i) => (
                <tr
                  key={e.slug}
                  style={{
                    borderBottom: "1px solid #eee",
                    backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa",
                  }}
                >
                  <td style={{ padding: "6px 12px 6px 0" }}>
                    <Link href={`/${e.slug}`}>{e.name}</Link>
                  </td>
                  <td style={{ padding: "6px 12px", textAlign: "right" }}>
                    {e.rawRate.toFixed(2)}
                  </td>
                  <td style={{ padding: "6px 0 6px 12px", textAlign: "right" }}>
                    <strong>{e.indexValue}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/national/rankings">Rankings</Link> {" | "}
        <Link href="/index-ranking">Price Index™</Link> {" | "}
        <Link href="/compare">Compare</Link>
      </p>
    </main>
  );
}
