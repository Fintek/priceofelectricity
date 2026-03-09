import type { Metadata } from "next";
import Link from "next/link";
import { loadEntityIndex, loadRankingsIndex } from "@/lib/knowledge/loadKnowledgePage";
import ExploreMore from "@/components/navigation/ExploreMore";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Page Index | PriceOfElectricity.com",
  description:
    "Browse major pages by category: state pages, rankings, tools, topic clusters, datasets, and methodology.",
  canonicalPath: "/page-index",
});

export default async function PageIndexPage() {
  const [entityIndex, rankingsIndex] = await Promise.all([
    loadEntityIndex(),
    loadRankingsIndex(),
  ]);

  const stateSlugs =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .map((e) => e.slug)
      .sort((a, b) => a.localeCompare(b)) ?? [];

  const rankingItems = rankingsIndex?.items ?? [];

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Page Index",
    description: "Index of all major pages on PriceOfElectricity.com.",
    url: `${BASE_URL}/page-index`,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Page Index</h1>

      <p className="intro muted" style={{ marginTop: 0, marginBottom: 8 }}>
        Browse major pages by category: state pages, rankings, tools, topic clusters, datasets, and methodology.
      </p>
      <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 14, maxWidth: "50ch" }}>
        <strong>Best for:</strong> Finding pages by category when you know the type of content you want.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Pages</h2>
        <p className="muted" style={{ margin: "0 0 8px 0", fontSize: 14 }}>
          Electricity cost by state: <Link href="/electricity-cost">/electricity-cost</Link>
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8, columnCount: 3, columnGap: 24 }}>
          {stateSlugs.map((slug) => (
            <li key={slug}>
              <Link href={`/electricity-cost/${slug}`}>{slug.replace(/-/g, " ")}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Rankings Pages</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          {rankingItems.map((r) => (
            <li key={r.id}>
              <Link href={`/knowledge/rankings/${r.id}`}>{r.title}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Tools</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li><Link href="/electricity-cost-calculator">Electricity cost calculator</Link></li>
          <li><Link href="/battery-recharge-cost">Battery recharge cost</Link></li>
          <li><Link href="/generator-vs-battery-cost">Generator vs battery cost</Link></li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Topic Clusters</h2>
        <p className="muted" style={{ margin: "0 0 8px 0", fontSize: 14 }}>
          Navigate by theme: consumer costs, price dynamics, market structure, and data.
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li><Link href="/electricity-topics">Electricity topics hub</Link> — Browse all topic clusters</li>
          <li><Link href="/electricity-data">Electricity data</Link> — Datasets and methodology</li>
          <li><Link href="/discovery-graph">Discovery graph</Link> — Machine-readable topic relationships</li>
          <li><Link href="/electricity-inflation">Electricity inflation</Link> — Price trends</li>
          <li><Link href="/electricity-affordability">Electricity affordability</Link> — Cost burden</li>
          <li><Link href="/electricity-price-volatility">Electricity price volatility</Link> — Price stability</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Market structure & infrastructure</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li><Link href="/power-generation-mix">Power generation mix</Link></li>
          <li><Link href="/electricity-markets">Electricity markets</Link></li>
          <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
          <li><Link href="/electricity-generation-cost-drivers">Electricity generation cost drivers</Link></li>
          <li><Link href="/grid-capacity-and-electricity-demand">Grid capacity and electricity demand</Link></li>
          <li><Link href="/business-electricity-cost-decisions">Business electricity cost decisions</Link></li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Insights</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li><Link href="/electricity-trends">Electricity trends</Link></li>
          <li><Link href="/electricity-insights">Electricity insights</Link></li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Datasets</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li><Link href="/datasets">Datasets hub</Link></li>
          <li><Link href="/datasets/electricity-prices-by-state">Electricity prices by state</Link></li>
          <li><Link href="/datasets/electricity-rankings">Electricity rankings</Link></li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Methodology</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li><Link href="/methodology">Methodology hub</Link></li>
          <li><Link href="/methodology/electricity-rates">How electricity rates are presented</Link></li>
          <li><Link href="/methodology/electricity-inflation">How electricity inflation is calculated</Link></li>
          <li><Link href="/methodology/electricity-affordability">How electricity affordability is estimated</Link></li>
          <li><Link href="/methodology/battery-recharge-cost">How battery recharge cost is estimated</Link></li>
          <li><Link href="/methodology/generator-vs-battery-cost">How generator vs battery cost is compared</Link></li>
        </ul>
      </section>

      <ExploreMore
        title="Other discovery and support"
        links={[
          { href: "/electricity-topics", label: "Browse the major electricity economics topic clusters" },
          { href: "/site-map", label: "See the high-level site structure" },
          { href: "/entity-registry", label: "Explore the site's core electricity entities" },
          { href: "/discovery-graph", label: "View the machine-readable topic relationship map" },
          { href: "/electricity-data", label: "See the datasets and data-driven analysis foundation" },
          { href: "/datasets", label: "Download datasets" },
          { href: "/methodology", label: "Methodology" },
          { href: "/knowledge", label: "Knowledge Hub" },
        ]}
      />

      <p className="muted" style={{ marginTop: 32 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/site-map">Site Map</Link> {" | "}
        <Link href="/data-registry">Data Registry</Link> {" | "}
        <Link href="/launch-checklist">Launch checklist</Link>
      </p>
    </main>
  );
}
