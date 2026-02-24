import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { buildAllNormalizedStates } from "@/lib/stateBuilder";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Annual Electricity Price Report | PriceOfElectricity.com",
  description:
    "National electricity price summary: averages, highest and lowest states, affordability breakdown, and value score analysis.",
  alternates: { canonical: `${BASE_URL}/research/annual-report` },
  openGraph: {
    title: "Annual Electricity Price Report | PriceOfElectricity.com",
    description:
      "National electricity price summary across all 50 U.S. states.",
    url: `${BASE_URL}/research/annual-report`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Annual Electricity Price Report | PriceOfElectricity.com",
    description:
      "National electricity price summary across all 50 U.S. states.",
  },
};

function computeReport() {
  const states = buildAllNormalizedStates();
  const sorted = [...states].sort(
    (a, b) => a.avgRateCentsPerKwh - b.avgRateCentsPerKwh
  );

  const nationalAvg =
    states.reduce((sum, s) => sum + s.avgRateCentsPerKwh, 0) / states.length;
  const avgValueScore =
    states.reduce((sum, s) => sum + s.valueScore, 0) / states.length;

  const categories: Record<string, number> = {};
  for (const s of states) {
    categories[s.affordabilityCategory] =
      (categories[s.affordabilityCategory] ?? 0) + 1;
  }

  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const bottom5 = sorted.slice(0, 5);
  const top5 = sorted.slice(-5).reverse();

  return {
    nationalAvg,
    avgValueScore,
    lowest,
    highest,
    bottom5,
    top5,
    categories,
    stateCount: states.length,
  };
}

export default function AnnualReportPage() {
  const r = computeReport();

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Annual Electricity Price Report",
    url: `${BASE_URL}/research/annual-report`,
    dateModified: LAST_REVIEWED,
    author: { "@type": "Organization", name: "PriceOfElectricity.com" },
    description:
      "National electricity price summary across all 50 U.S. states.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Annual Electricity Price Report</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        A summary of residential electricity prices across {r.stateCount} U.S.
        states, computed from the normalized data pipeline as of the latest
        update.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Executive summary</h2>
        <p style={{ marginTop: 0 }}>
          The national average residential electricity rate across{" "}
          {r.stateCount} states is{" "}
          <strong>{r.nationalAvg.toFixed(2)}¢/kWh</strong>. Rates range from{" "}
          <strong>
            {r.lowest.avgRateCentsPerKwh}¢/kWh ({r.lowest.name})
          </strong>{" "}
          to{" "}
          <strong>
            {r.highest.avgRateCentsPerKwh}¢/kWh ({r.highest.name})
          </strong>
          . The average Electricity Value Score™ is{" "}
          <strong>{r.avgValueScore.toFixed(0)}</strong>.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Key highlights</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            National average: <strong>{r.nationalAvg.toFixed(2)}¢/kWh</strong>
          </li>
          <li>
            Most expensive: <strong>{r.highest.name}</strong> at{" "}
            {r.highest.avgRateCentsPerKwh}¢/kWh
          </li>
          <li>
            Cheapest: <strong>{r.lowest.name}</strong> at{" "}
            {r.lowest.avgRateCentsPerKwh}¢/kWh
          </li>
          <li>
            Average Value Score: {r.avgValueScore.toFixed(0)} / 100
          </li>
          {Object.entries(r.categories)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, count]) => (
              <li key={cat}>
                {cat}: {count} state{count !== 1 ? "s" : ""}
              </li>
            ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Top 5 most expensive states
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>State</th>
              <th style={{ textAlign: "right", padding: "8px 4px" }}>
                Rate (¢/kWh)
              </th>
              <th style={{ textAlign: "right", padding: "8px 4px" }}>
                Value Score
              </th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>
                Affordability
              </th>
            </tr>
          </thead>
          <tbody>
            {r.top5.map((s) => (
              <tr
                key={s.slug}
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <td style={{ padding: "6px 4px" }}>
                  <Link href={`/${s.slug}`} prefetch={false}>
                    {s.name}
                  </Link>
                </td>
                <td style={{ textAlign: "right", padding: "6px 4px" }}>
                  {s.avgRateCentsPerKwh}
                </td>
                <td style={{ textAlign: "right", padding: "6px 4px" }}>
                  {s.valueScore}
                </td>
                <td style={{ padding: "6px 4px" }}>
                  {s.affordabilityCategory}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          Top 5 cheapest states
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>State</th>
              <th style={{ textAlign: "right", padding: "8px 4px" }}>
                Rate (¢/kWh)
              </th>
              <th style={{ textAlign: "right", padding: "8px 4px" }}>
                Value Score
              </th>
              <th style={{ textAlign: "left", padding: "8px 4px" }}>
                Affordability
              </th>
            </tr>
          </thead>
          <tbody>
            {r.bottom5.map((s) => (
              <tr
                key={s.slug}
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <td style={{ padding: "6px 4px" }}>
                  <Link href={`/${s.slug}`} prefetch={false}>
                    {s.name}
                  </Link>
                </td>
                <td style={{ textAlign: "right", padding: "6px 4px" }}>
                  {s.avgRateCentsPerKwh}
                </td>
                <td style={{ textAlign: "right", padding: "6px 4px" }}>
                  {s.valueScore}
                </td>
                <td style={{ padding: "6px 4px" }}>
                  {s.affordabilityCategory}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p style={{ marginTop: 16 }}>
        <Link href="/value-ranking">View full 50-state value ranking</Link>
      </p>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/research">Research & Insights</Link> {" | "}
        <Link href="/datasets">Data downloads</Link> {" | "}
        <Link href="/about">Methodology</Link>
      </p>
    </main>
  );
}
