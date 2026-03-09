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

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Affordability in the United States | PriceOfElectricity.com",
  description:
    "Explore how electricity affordability varies by state. Compare electricity cost burden, estimated bills, and affordability rankings across the United States.",
  canonicalPath: "/electricity-affordability",
});

const AFFORDABILITY_RANKING_IDS = [
  "electricity-affordability",
  "most-expensive-electricity",
  "affordability",
  "rate-low-to-high",
  "rate-high-to-low",
];

export default async function ElectricityAffordabilityPage() {
  const [nationalPage, entityIndex, rankingsIndex] = await Promise.all([
    loadKnowledgePage("national", "national"),
    loadEntityIndex(),
    loadRankingsIndex(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    medianRate?: number;
    highestState?: { slug?: string; name?: string; rate?: number };
    lowestState?: { slug?: string; name?: string; rate?: number };
    top5Highest?: Array<{ slug: string; name: string; rate: number }>;
    top5Lowest?: Array<{ slug: string; name: string; rate: number }>;
  } | undefined;

  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const MONTHLY_USAGE_KWH = 900;
  const nationalMonthlyBill =
    nationalAvgRate != null ? (nationalAvgRate / 100) * MONTHLY_USAGE_KWH : null;

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const affordabilityRankings =
    rankingsIndex?.items?.filter((r) => AFFORDABILITY_RANKING_IDS.includes(r.id)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Affordability", url: "/electricity-affordability" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Affordability in the United States",
    description:
      "How electricity affordability varies by state. Cost burden, estimated bills, and affordability rankings.",
    url: "/electricity-affordability",
    isPartOf: "/",
    about: ["electricity affordability", "electricity cost burden", "electricity affordability by state"],
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
          <span aria-current="page">Electricity Affordability</span>
        </nav>

        <SectionNav
          title="In this section"
          description="Affordability by state, rankings, and related pages."
          links={[
            { href: "/knowledge/rankings/electricity-affordability", label: "Most affordable states" },
            { href: "/knowledge/rankings/most-expensive-electricity", label: "Least affordable states" },
            { href: "/average-electricity-bill", label: "Average electricity bill" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-cost-comparison", label: "Compare electricity prices between states" },
            { href: "/shop-electricity", label: "Shop for electricity by state" },
            { href: "/compare-electricity-plans", label: "Compare electricity plans" },
            { href: "/electricity-providers", label: "See state electricity provider context" },
            { href: "/solar-savings", label: "Explore solar savings potential by state" },
            { href: "/methodology/electricity-affordability", label: "Affordability methodology" },
          ]}
        />

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Electricity Affordability in the United States
        </h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity affordability measures how expensive electricity is relative to typical usage. States with lower rates and lower estimated bills are generally more affordable. This page explains how affordability varies across the United States and links to state-level analysis.
          </p>
        </section>

        {/* B) National Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>National Context</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Nationally, electricity prices vary widely. At 900 kWh per month—a common residential usage level—estimated monthly bills range from under $100 in some states to over $350 in others.
          </p>
          {nationalAvgRate != null && nationalMonthlyBill != null && (
            <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
              The national average residential rate is <strong>{nationalAvgRate.toFixed(2)}¢/kWh</strong>, 
              which translates to an estimated monthly bill of about <strong>${nationalMonthlyBill.toFixed(2)}</strong> at 900 kWh.
            </p>
          )}
          {derived?.highestState && derived?.lowestState && (
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              {derived.highestState.name} has the highest average rate ({derived.highestState.rate?.toFixed(2)}¢/kWh);{" "}
              {derived.lowestState.name} has the lowest ({derived.lowestState.rate?.toFixed(2)}¢/kWh).
            </p>
          )}
        </section>

        {/* C) State Differences */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>State Differences</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity costs vary widely across states due to generation mix, transmission costs, regulations, and demand. States with abundant hydropower or natural gas often have lower rates; those with higher renewable mandates or imported power may have higher rates and higher estimated bills.
          </p>
        </section>

        {/* D) State Affordability Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Electricity Affordability by State</h2>
          <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
            Explore electricity affordability in each state:
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
                <Link href={`/electricity-affordability/${e.slug}`}>
                  {e.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Affordability Rankings */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Affordability Rankings</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            {affordabilityRankings.map((r) => (
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
              <Link href="/electricity-cost">Electricity cost by state</Link> — Current rates and estimated costs
            </li>
            <li>
              <Link href="/average-electricity-bill">Average electricity bill</Link> — Monthly bill estimates by state
            </li>
            <li>
              <Link href="/electricity-inflation">Electricity inflation</Link> — How prices have changed over time
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity cost comparison</Link> — Compare costs between states
            </li>
            <li>
              <Link href="/electricity-cost-of-living">Electricity cost of living</Link> — Electricity&apos;s role in household cost of living
            </li>
            <li>
              <Link href="/solar-vs-grid-electricity-cost">Explore solar vs grid electricity economics</Link> — Grid electricity price context for solar
            </li>
            <li>
              <Link href="/electricity-price-volatility">Electricity price volatility</Link> — Which states have more volatile electricity prices
            </li>
          </ul>
        </section>

        <p className="muted" style={{ marginBottom: 24, fontSize: 14 }}>
          Related topics: <Link href="/electricity-inflation">Electricity inflation</Link>
          {" · "}
          <Link href="/electricity-price-volatility">Electricity price volatility</Link>
          {" · "}
          <Link href="/electricity-topics">Electricity topics hub</Link>
          {" · "}
          <Link href="/electricity-data">Electricity data</Link>
        </p>

        <ExploreMore
          title="Related pages"
          links={[
            { href: "/average-electricity-bill", label: "Average electricity bill" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/knowledge/rankings/electricity-affordability", label: "Most affordable states" },
            { href: "/methodology/electricity-affordability", label: "Affordability methodology" },
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
