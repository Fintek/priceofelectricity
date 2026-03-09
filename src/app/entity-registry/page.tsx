import type { Metadata } from "next";
import Link from "next/link";
import { loadEntityIndex, loadRankingsIndex } from "@/lib/knowledge/loadKnowledgePage";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import StatusFooter from "@/components/common/StatusFooter";
import { getRelease } from "@/lib/knowledge/fetch";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Entity Registry – Electricity Concepts & Data Structure | PriceOfElectricity.com",
  description:
    "Index of core entities: price concepts, states, rankings, datasets. For verifying site structure.",
  canonicalPath: "/entity-registry",
});

export default async function EntityRegistryPage() {
  const [entityIndex, rankingsIndex, release] = await Promise.all([
    loadEntityIndex(),
    loadRankingsIndex(),
    getRelease(),
  ]);

  const stateSlugs =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .map((e) => e.slug)
      .sort((a, b) => a.localeCompare(b)) ?? [];

  const rankingItems = rankingsIndex?.items ?? [];

  const entityGraphJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Electricity Data and Analysis Entities",
        description: "Structured index of electricity price data, state electricity metrics, rankings, and datasets.",
        url: `${BASE_URL}/entity-registry`,
      },
      {
        "@type": "DefinedTerm",
        name: "electricity price",
        description: "Residential electricity price in cents per kWh",
      },
      {
        "@type": "DefinedTerm",
        name: "electricity rate",
        description: "Average residential electricity rate by state",
      },
      {
        "@type": "Dataset",
        name: "Electricity prices by state",
        url: `${BASE_URL}/datasets/electricity-prices-by-state`,
      },
      {
        "@type": "Dataset",
        name: "Electricity rankings",
        url: `${BASE_URL}/datasets/electricity-rankings`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(entityGraphJsonLd),
        }}
      />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/site-map">Site Map</Link>
          {" · "}
          <span aria-current="page">Entity Registry</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Entity Registry</h1>

        <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Index of core entities and concepts: price concepts, states, rankings, datasets, and tools. For crawlers, researchers, and visitors verifying site structure.
        </p>
        <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 14, maxWidth: "50ch" }}>
          <strong>Best for:</strong> Browsing entities by type, understanding site structure, and verifying coverage.
        </p>

        {/* Topic clusters */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Topic Clusters</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Navigate by theme: consumer costs, price dynamics, market structure, and data.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/electricity-topics">Browse the major electricity economics topic clusters</Link>
            {" · "}
            <Link href="/electricity-data">See the datasets and data-driven analysis foundation</Link>
            {" · "}
            <Link href="/discovery-graph">View the machine-readable topic relationship map</Link>
            {" · "}
            <Link href="/electricity-inflation">Electricity inflation</Link>
            {" · "}
            <Link href="/electricity-affordability">Electricity affordability</Link>
            {" · "}
            <Link href="/electricity-price-volatility">Electricity price volatility</Link>
          </p>
        </section>

        {/* A) Electricity Price Entities */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity Price Entities</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site analyzes electricity-related concepts including: price, rate, bill, inflation, and affordability.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>electricity price</li>
            <li>electricity rate</li>
            <li>electricity bill</li>
            <li>electricity inflation</li>
            <li>electricity affordability</li>
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            <Link href="/electricity-cost">Electricity cost by state</Link>
            {" · "}
            <Link href="/electricity-inflation">Electricity inflation</Link>
            {" · "}
            <Link href="/electricity-affordability">Electricity affordability</Link>
          </p>
        </section>

        {/* B) State Electricity Entities */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Entities</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site analyzes electricity prices across U.S. states. Each state has its own data record and knowledge page.
          </p>
          <div style={{ paddingLeft: 20 }}>
            <p className="muted" style={{ margin: "0 0 8px 0", fontSize: 14 }}>
              State pages: <Link href="/knowledge/pages">/knowledge/pages</Link>
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6, columnCount: 3, columnGap: 24 }}>
              {stateSlugs.map((slug) => (
                <li key={slug}>
                  <Link href={`/knowledge/state/${slug}`}>{slug.replace(/-/g, " ")}</Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* C) Ranking Entities */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Ranking Entities</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity rankings include price rankings, inflation rankings, volatility rankings, affordability, and momentum.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            {rankingItems.slice(0, 12).map((r) => (
              <li key={r.id}>
                <Link href={`/knowledge/rankings/${r.id}`}>{r.title}</Link>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            <Link href="/knowledge/rankings">View all rankings</Link>
          </p>
        </section>

        {/* D) Dataset Entities */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Dataset Entities</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Downloadable datasets and data authority pages.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/electricity-data">Electricity data overview</Link>
            </li>
            <li>
              <Link href="/datasets">Datasets hub</Link>
            </li>
            <li>
              <Link href="/datasets/electricity-prices-by-state">Electricity prices by state</Link>
            </li>
            <li>
              <Link href="/datasets/electricity-rankings">Electricity rankings</Link>
            </li>
          </ul>
        </section>

        {/* E) Tool Entities */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Tool Entities</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Interactive tools for electricity cost analysis.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/electricity-cost-calculator">Electricity cost calculator</Link>
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity cost comparison</Link>
            </li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-topics">Browse topic clusters</Link> {" | "}
          <Link href="/page-index">Browse all pages by category</Link> {" | "}
          <Link href="/site-map">See the high-level site structure</Link> {" | "}
          <Link href="/discovery-graph">View the topic relationship map</Link> {" | "}
          <Link href="/data-registry">Data registry</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
