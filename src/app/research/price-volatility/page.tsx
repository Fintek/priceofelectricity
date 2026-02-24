import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { HISTORY } from "@/data/history";
import { buildNormalizedState } from "@/lib/stateBuilder";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Electricity Price Volatility by State | PriceOfElectricity.com",
  description:
    "Which U.S. states have the most volatile electricity prices? Standard deviation analysis of monthly rate history.",
  alternates: { canonical: `${BASE_URL}/research/price-volatility` },
  openGraph: {
    title: "Electricity Price Volatility by State | PriceOfElectricity.com",
    description:
      "Which U.S. states have the most volatile electricity prices?",
    url: `${BASE_URL}/research/price-volatility`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Electricity Price Volatility by State | PriceOfElectricity.com",
    description:
      "Which U.S. states have the most volatile electricity prices?",
  },
};

type VolatilityRow = {
  slug: string;
  name: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  range: number;
  months: number;
};

function stddev(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance);
}

function computeVolatility(): VolatilityRow[] {
  return HISTORY.filter((h) => h.series.length >= 3).map((h) => {
    const rates = h.series.map((s) => s.avgRateCentsPerKwh);
    const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
    const sd = stddev(rates);
    const ns = buildNormalizedState(h.stateSlug);
    return {
      slug: h.stateSlug,
      name: ns.name,
      mean,
      stdDev: sd,
      min: Math.min(...rates),
      max: Math.max(...rates),
      range: Math.max(...rates) - Math.min(...rates),
      months: h.series.length,
    };
  });
}

export default function PriceVolatilityPage() {
  const rows = computeVolatility();
  const byVolatility = [...rows].sort((a, b) => b.stdDev - a.stdDev);
  const hasData = rows.length > 0;

  const mostVolatile = byVolatility.slice(0, 3);
  const mostStable = [...byVolatility].reverse().slice(0, 3);

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Price Volatility by State",
    url: `${BASE_URL}/research/price-volatility`,
    description:
      "Which U.S. states have the most volatile electricity prices?",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Electricity Price Volatility by State</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Volatility measures how much a state&apos;s electricity rate fluctuates
        over time. A higher standard deviation indicates more price variability.
        This analysis uses monthly rate history where available.
      </p>

      {!hasData ? (
        <p>
          Limited historical data is currently available. As more monthly
          snapshots are collected, volatility analysis will become more
          comprehensive.
        </p>
      ) : (
        <>
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              Most volatile states
            </h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              {mostVolatile.map((v) => (
                <li key={v.slug}>
                  <Link href={`/${v.slug}/history`} prefetch={false}>
                    {v.name}
                  </Link>{" "}
                  — std dev: {v.stdDev.toFixed(3)}¢, range:{" "}
                  {v.range.toFixed(2)}¢ ({v.months} months)
                </li>
              ))}
            </ul>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              Most stable states
            </h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              {mostStable.map((v) => (
                <li key={v.slug}>
                  <Link href={`/${v.slug}/history`} prefetch={false}>
                    {v.name}
                  </Link>{" "}
                  — std dev: {v.stdDev.toFixed(3)}¢, range:{" "}
                  {v.range.toFixed(2)}¢ ({v.months} months)
                </li>
              ))}
            </ul>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              Full volatility table
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>
                    State
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Mean (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Std Dev (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Min (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Max (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Range (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Months
                  </th>
                </tr>
              </thead>
              <tbody>
                {byVolatility.map((v) => (
                  <tr
                    key={v.slug}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "6px 4px" }}>
                      <Link href={`/${v.slug}/history`} prefetch={false}>
                        {v.name}
                      </Link>
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {v.mean.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {v.stdDev.toFixed(3)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {v.min.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {v.max.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {v.range.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {v.months}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p className="muted" style={{ marginTop: 8, fontSize: "0.9rem" }}>
            Standard deviation uses the sample formula (n-1). Only states with
            at least 3 months of history are included. Coverage will expand as
            more data is collected.
          </p>
        </>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/research">Research & Insights</Link> {" | "}
        <Link href="/research/state-trends">State trends</Link> {" | "}
        <Link href="/compare">Compare states</Link>
      </p>
    </main>
  );
}
