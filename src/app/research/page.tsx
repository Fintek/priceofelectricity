import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Electricity Price Research & Insights | PriceOfElectricity.com",
  description:
    "Data-driven research on U.S. electricity prices including annual reports, state trends, and price volatility analysis.",
  alternates: { canonical: `${BASE_URL}/research` },
  openGraph: {
    title: "Electricity Price Research & Insights | PriceOfElectricity.com",
    description:
      "Data-driven research on U.S. electricity prices including annual reports, state trends, and price volatility analysis.",
    url: `${BASE_URL}/research`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Electricity Price Research & Insights | PriceOfElectricity.com",
    description:
      "Data-driven research on U.S. electricity prices including annual reports, state trends, and price volatility analysis.",
  },
};

export default function ResearchPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Price Research & Insights",
    url: `${BASE_URL}/research`,
    description:
      "Data-driven research on U.S. electricity prices including annual reports, state trends, and price volatility analysis.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Electricity Price Research & Insights</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        All analysis on this page is computed from the same normalized state
        data pipeline that powers every page on PriceOfElectricity.com. No
        figures are hardcoded — statistics are derived at build time from
        current rate data, affordability indices, value scores, and historical
        series.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Reports</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/research/annual-report">Annual Report</Link> —
            National averages, top and bottom states, affordability breakdown
          </li>
          <li>
            <Link href="/research/state-trends">State Trends</Link> — Which
            states are trending up or down based on historical rate data
          </li>
          <li>
            <Link href="/research/price-volatility">Price Volatility</Link> —
            Most stable and most volatile states ranked by rate variability
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>National</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/national">National electricity price overview</Link>{" "}
            — Averages, extremes, rankings, and affordability distribution
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Verticals</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/v/ai-energy">AI & Data Centers</Link> — How AI
            data center growth may affect electricity demand and consumer
            prices
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/methodology">Methodology</Link> — How we calculate
            Electricity Price Index™, Value Score™, and freshness
          </li>
          <li>
            <Link href="/datasets">Data downloads</Link> — JSON and CSV
            exports
          </li>
          <li>
            <Link href="/value-ranking">Value ranking</Link> — Full 50-state
            Electricity Value Score™ table
          </li>
          <li>
            <Link href="/affordability">Affordability index</Link> — State
            affordability comparison
          </li>
          <li>
            <Link href="/index-ranking">Electricity Price Index™</Link> — State
            rates normalized to a national base of 100
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/about">About</Link> {" | "}
        <Link href="/press">Press</Link> {" | "}
        <Link href="/citations">Citations</Link> {" | "}
        <Link href="/press-kit">Press kit</Link> {" | "}
        <Link href="/attribution">Attribution</Link>
      </p>
    </main>
  );
}
