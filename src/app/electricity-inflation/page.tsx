import type { Metadata } from "next";
import Link from "next/link";
import {
  loadKnowledgePage,
  loadEntityIndex,
  loadRankingsIndex,
} from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import ExploreMore from "@/components/navigation/ExploreMore";
import SectionNav from "@/components/navigation/SectionNav";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Inflation in the United States | PriceOfElectricity.com",
  description:
    "Explore how electricity prices have changed over time in the United States, including national trends, state price growth, and long-term electricity inflation.",
  canonicalPath: "/electricity-inflation",
});

const INFLATION_RANKING_IDS = [
  "electricity-inflation-1y",
  "electricity-inflation-5y",
  "cagr-25y",
  "volatility-5y",
  "price-trend",
  "momentum-signal",
];

export default async function ElectricityInflationPage() {
  const [nationalPage, entityIndex, rankingsIndex] = await Promise.all([
    loadKnowledgePage("national", "national"),
    loadEntityIndex(),
    loadRankingsIndex(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    trends?: { avgRateCentsPerKwh?: { values?: number[] } };
    highestState?: { slug?: string; name?: string; rate?: number };
    lowestState?: { slug?: string; name?: string; rate?: number };
  } | undefined;

  const trendValues = derived?.trends?.avgRateCentsPerKwh?.values ?? [];
  let increase1YearPercent: number | null = null;
  let increase5YearPercent: number | null = null;
  if (trendValues.length >= 2) {
    const current = trendValues[trendValues.length - 1];
    const oneBack = trendValues[trendValues.length - 2];
    if (typeof current === "number" && typeof oneBack === "number" && oneBack > 0) {
      increase1YearPercent = ((current - oneBack) / oneBack) * 100;
    }
    if (trendValues.length >= 6) {
      const fiveBack = trendValues[trendValues.length - 6];
      if (typeof current === "number" && typeof fiveBack === "number" && fiveBack > 0) {
        increase5YearPercent = ((current - fiveBack) / fiveBack) * 100;
      }
    }
  }

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const inflationRankings =
    rankingsIndex?.items?.filter((r) => INFLATION_RANKING_IDS.includes(r.id)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Inflation", url: "/electricity-inflation" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Inflation in the United States",
    description:
      "How electricity prices have increased historically and why they vary by state. National trends, state price growth, and inflation rankings.",
    url: "/electricity-inflation",
    isPartOf: "/",
    about: ["electricity inflation", "electricity price growth", "electricity price history"],
  });

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <JsonLdScript data={webPageJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-trends">Electricity Trends</Link>
          {" · "}
          <span aria-current="page">Electricity Inflation</span>
        </nav>

        <SectionNav
          title="In this section"
          description="National trends, state growth, rankings, and methodology."
          links={[
            { href: "/knowledge/rankings/electricity-inflation-1y", label: "1-year inflation" },
            { href: "/knowledge/rankings/electricity-inflation-5y", label: "5-year inflation" },
            { href: "/knowledge/rankings/cagr-25y", label: "25-year CAGR" },
            { href: "/electricity-price-history", label: "Price history by state" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/methodology/electricity-inflation", label: "Inflation methodology" },
          ]}
        />

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Electricity Inflation in the United States
        </h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity inflation measures how residential electricity prices change over time. Unlike many consumer goods, electricity prices vary significantly by state due to generation mix, transmission costs, regulations, and demand. This page explains national trends, state-level price growth, and how we calculate inflation metrics.
          </p>
        </section>

        {/* B) National Electricity Price Trend */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>National Electricity Price Trend</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Nationally, electricity prices have generally trended upward over the past decade. Grid modernization, fuel costs, renewable mandates, and policy changes all influence the rate of change.
          </p>
          {(increase1YearPercent != null || increase5YearPercent != null) && (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
              {increase1YearPercent != null && (
                <li>
                  <strong>1-year change:</strong>{" "}
                  {increase1YearPercent >= 0 ? "+" : ""}{increase1YearPercent.toFixed(1)}%
                </li>
              )}
              {increase5YearPercent != null && (
                <li>
                  <strong>5-year change:</strong>{" "}
                  {increase5YearPercent >= 0 ? "+" : ""}{increase5YearPercent.toFixed(1)}%
                </li>
              )}
            </ul>
          )}
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            See <Link href="/electricity-trends">Electricity Trends</Link> for the full national overview and <Link href="/knowledge/national">national snapshot</Link> for current rates.
          </p>
        </section>

        {/* C) State Electricity Price Growth */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Electricity Inflation by State</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            States experience different price trajectories. Some states have seen faster electricity price growth due to policy shifts, fuel mix changes, or infrastructure investment. Others have remained relatively stable.
          </p>
          <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
            Explore electricity inflation by state:
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              lineHeight: 1.8,
              columnCount: stateEntities.length > 20 ? 3 : 2,
              columnGap: 24,
            }}
          >
            {stateEntities.map((e) => (
              <li key={e.slug}>
                <Link href={`/electricity-inflation/${e.slug}`}>
                  {e.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Link>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            See also <Link href="/electricity-price-history">electricity price history by state</Link> and{" "}
            <Link href="/knowledge/pages">all state knowledge pages</Link>.
          </p>
        </section>

        {/* D) Electricity Price Growth Rankings */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Electricity Price Growth Rankings</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Rankings help identify which states have seen the fastest electricity price increases over different time horizons.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            {inflationRankings.map((r) => (
              <li key={r.id}>
                <Link href={`/knowledge/rankings/${r.id}`}>{r.title}</Link>
                {" — "}
                {r.description}
              </li>
            ))}
          </ul>
        </section>

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/power-generation-mix/fuel-costs-and-electricity-prices">See how fuel costs can affect electricity prices</Link> — Generation mix and fuel cost sensitivity
            </li>
            <li>
              <Link href="/grid-capacity-and-electricity-demand">Explore grid capacity and electricity demand</Link> — How demand growth and capacity constraints connect to electricity prices
            </li>
            <li>
              <Link href="/ai-energy-demand/grid-strain-and-electricity-costs">Read about grid strain and electricity costs</Link> — Demand, infrastructure, and pricing
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Compare electricity prices between states</Link> — Side-by-side state comparisons
            </li>
            <li>
              <Link href="/electricity-cost">Electricity cost by state</Link> — Current rates and estimated bills
            </li>
            <li>
              <Link href="/average-electricity-bill">Average electricity bill</Link> — Monthly bill estimates by state
            </li>
            <li>
              <Link href="/electricity-cost-calculator">Electricity cost calculator</Link> — Estimate costs at different usage levels
            </li>
            <li>
              <Link href="/electricity-price-history">Electricity price history</Link> — State-level price trends and inflation
            </li>
            <li>
              <Link href="/electricity-price-volatility">Electricity price volatility</Link> — Which states have more volatile electricity prices
            </li>
          </ul>
        </section>

        {/* F) Methodology */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Methodology</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Our inflation metrics are calculated from EIA residential retail electricity data. Methodology pages explain the formulas and assumptions.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/methodology/electricity-inflation">How electricity inflation is calculated</Link> — 1-year and 5-year percentage changes
            </li>
            <li>
              <Link href="/methodology/electricity-rates">How electricity rates are presented</Link> — Rates in ¢/kWh and bill estimates
            </li>
            <li>
              <Link href="/methodology">Methodology hub</Link> — All formulas and definitions
            </li>
          </ul>
        </section>

        <TopicClusterNav
          title="Related topic clusters"
          description="Affordability, volatility, cost-of-living, and data."
          links={[
            { href: "/electricity-affordability", label: "Electricity affordability" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/electricity-cost-of-living", label: "Electricity cost of living" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/electricity-topics", label: "Electricity topics hub" },
          ]}
        />

        <ExploreMore
          title="Related pages"
          links={[
            { href: "/electricity-trends", label: "Electricity trends" },
            { href: "/electricity-insights", label: "Electricity insights" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/knowledge/rankings/electricity-inflation-1y", label: "1-year inflation ranking" },
            { href: "/knowledge/rankings/electricity-inflation-5y", label: "5-year inflation ranking" },
            { href: "/electricity-price-history", label: "Price history by state" },
            { href: "/methodology/electricity-inflation", label: "Inflation methodology" },
          ]}
        />

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-trends">Electricity Trends</Link> {" | "}
          <Link href="/electricity-insights">Electricity Insights</Link> {" | "}
          <Link href="/knowledge">Knowledge Hub</Link> {" | "}
          <Link href="/datasets">Datasets</Link>
        </p>
      </main>
    </>
  );
}
