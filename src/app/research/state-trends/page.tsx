import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { HISTORY } from "@/data/history";
import { buildNormalizedState } from "@/lib/stateBuilder";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "State Electricity Price Trends | PriceOfElectricity.com",
  description:
    "Which U.S. states have rising or falling electricity prices? Trend analysis based on monthly rate history.",
  alternates: { canonical: `${BASE_URL}/research/state-trends` },
  openGraph: {
    title: "State Electricity Price Trends | PriceOfElectricity.com",
    description:
      "Which U.S. states have rising or falling electricity prices?",
    url: `${BASE_URL}/research/state-trends`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "State Electricity Price Trends | PriceOfElectricity.com",
    description:
      "Which U.S. states have rising or falling electricity prices?",
  },
};

type TrendRow = {
  slug: string;
  name: string;
  first: number;
  last: number;
  change: number;
  changePct: number;
  months: number;
  direction: "up" | "down" | "flat";
};

function computeTrends(): TrendRow[] {
  return HISTORY.filter((h) => h.series.length >= 2).map((h) => {
    const first = h.series[0].avgRateCentsPerKwh;
    const last = h.series[h.series.length - 1].avgRateCentsPerKwh;
    const change = last - first;
    const changePct = (change / first) * 100;
    const ns = buildNormalizedState(h.stateSlug);
    return {
      slug: h.stateSlug,
      name: ns.name,
      first,
      last,
      change,
      changePct,
      months: h.series.length,
      direction: change > 0.05 ? "up" : change < -0.05 ? "down" : "flat",
    };
  });
}

export default function StateTrendsPage() {
  const trends = computeTrends();
  const up = trends.filter((t) => t.direction === "up");
  const down = trends.filter((t) => t.direction === "down");
  const flat = trends.filter((t) => t.direction === "flat");
  const sortedByChange = [...trends].sort((a, b) => b.changePct - a.changePct);
  const hasData = trends.length > 0;

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "State Electricity Price Trends",
    url: `${BASE_URL}/research/state-trends`,
    description:
      "Which U.S. states have rising or falling electricity prices?",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>State Electricity Price Trends</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Trend analysis based on monthly historical rate data. States are
        classified as trending up, down, or flat by comparing their earliest
        and latest recorded rates.
      </p>

      {!hasData ? (
        <p>
          Limited historical data is currently available. As more monthly
          snapshots are collected, trend analysis will become more
          comprehensive.
        </p>
      ) : (
        <>
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>Summary</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>
                States with history data: <strong>{trends.length}</strong>
              </li>
              <li>
                Trending up: <strong>{up.length}</strong>
              </li>
              <li>
                Trending down: <strong>{down.length}</strong>
              </li>
              <li>
                Flat: <strong>{flat.length}</strong>
              </li>
            </ul>
            <p className="muted" style={{ marginTop: 8, fontSize: "0.9rem" }}>
              Historical data is available for a subset of states. States
              without monthly series are not included in trend analysis. As the
              dataset grows, coverage will expand.
            </p>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 22, marginBottom: 12 }}>
              Trend table
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 4px" }}>
                    State
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    First (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Latest (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Change (¢)
                  </th>
                  <th style={{ textAlign: "right", padding: "8px 4px" }}>
                    Change %
                  </th>
                  <th style={{ textAlign: "center", padding: "8px 4px" }}>
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedByChange.map((t) => (
                  <tr
                    key={t.slug}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "6px 4px" }}>
                      <Link href={`/${t.slug}/history`} prefetch={false}>
                        {t.name}
                      </Link>
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {t.first.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {t.last.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {t.change > 0 ? "+" : ""}
                      {t.change.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right", padding: "6px 4px" }}>
                      {t.changePct > 0 ? "+" : ""}
                      {t.changePct.toFixed(1)}%
                    </td>
                    <td style={{ textAlign: "center", padding: "6px 4px" }}>
                      {t.direction === "up"
                        ? "Up"
                        : t.direction === "down"
                          ? "Down"
                          : "Flat"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/research">Research & Insights</Link> {" | "}
        <Link href="/research/price-volatility">Price volatility</Link> {" | "}
        <Link href="/compare">Compare states</Link>
      </p>
    </main>
  );
}
