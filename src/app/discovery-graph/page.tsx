import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Discovery Graph – Topic & Data Relationships | PriceOfElectricity.com",
  description:
    "Curated relationship map of major topics, datasets, and methodology. Machine-readable JSON for crawlers.",
  canonicalPath: "/discovery-graph",
});

export default async function DiscoveryGraphPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Discovery Graph", url: "/discovery-graph" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-trends">Electricity Trends</Link>
          {" · "}
          <span aria-current="page">Discovery Graph</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Discovery Graph</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Curated relationship map of major topics, datasets, and methodology. It shows representative connections across the site rather than an exhaustive graph of every page and edge. Machine-readable JSON is available for crawlers and programmatic discovery.
          </p>
          <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 14, maxWidth: "50ch" }}>
            <strong>Best for:</strong> Understanding site structure and the machine-readable topic map.
          </p>
        </section>

        {/* B) Major Topic Clusters */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Major Topic Clusters</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <strong>Consumer electricity economics</strong> —{" "}
              <Link href="/electricity-cost">Electricity cost</Link>,{" "}
              <Link href="/average-electricity-bill">Average electricity bill</Link>,{" "}
              <Link href="/electricity-affordability">Electricity affordability</Link>,{" "}
              <Link href="/electricity-cost-of-living">Electricity cost of living</Link>
            </li>
            <li>
              <strong>Price dynamics</strong> —{" "}
              <Link href="/electricity-inflation">Electricity inflation</Link>,{" "}
              <Link href="/electricity-price-volatility">Electricity price volatility</Link>,{" "}
              <Link href="/electricity-trends">Electricity trends</Link>
            </li>
            <li>
              <strong>Business / infrastructure</strong> —{" "}
              <Link href="/business-electricity-cost-decisions">Business electricity cost decisions</Link>,{" "}
              <Link href="/data-center-electricity-cost">Data center electricity cost</Link>,{" "}
              <Link href="/ai-energy-demand">AI energy demand</Link>,{" "}
              <Link href="/grid-capacity-and-electricity-demand">Grid capacity and electricity demand</Link>
            </li>
            <li>
              <strong>Energy transition</strong> —{" "}
              <Link href="/solar-vs-grid-electricity-cost">Solar vs grid electricity cost</Link>,{" "}
              <Link href="/battery-backup-electricity-cost">Battery backup electricity cost</Link>
            </li>
            <li>
              <strong>Market structure</strong> —{" "}
              <Link href="/power-generation-mix">Power generation mix</Link>,{" "}
              <Link href="/electricity-markets">Electricity markets</Link>,{" "}
              <Link href="/regional-electricity-markets">Regional electricity markets</Link>,{" "}
              <Link href="/electricity-generation-cost-drivers">Electricity generation cost drivers</Link>
            </li>
            <li>
              <strong>Data / methodology / discovery</strong> —{" "}
              <Link href="/future-expansion">Future expansion framework</Link>,{" "}
              <Link href="/electricity-data">Electricity data</Link>,{" "}
              <Link href="/datasets">Datasets</Link>,{" "}
              <Link href="/methodology">Methodology</Link>,{" "}
              <Link href="/electricity-topics">Electricity topics</Link>,{" "}
              <Link href="/entity-registry">Entity registry</Link>
            </li>
          </ul>
        </section>

        {/* C) Key Discovery Relationships */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Key Discovery Relationships</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            A few high-level relationships across the site:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Electricity affordability depends on electricity prices and cost data.</li>
            <li>Volatility and inflation help explain electricity cost dynamics over time.</li>
            <li>Electricity data and datasets support multiple topic pages and rankings.</li>
            <li>Methodology explains how calculations, rankings, and derived metrics work.</li>
          </ul>
        </section>

        {/* D) Machine-Readable Graph */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Machine-Readable Graph</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            A lightweight, curated JSON subset of major nodes and relationships is available for programmatic discovery and LLM crawlers:
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/discovery-graph.json">/discovery-graph.json</Link>
            {" — "}
            <span className="muted" style={{ fontSize: 14 }}>Topic and data relationship graph (JSON)</span>
          </p>
        </section>

        {/* E) Related Discovery Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Discovery Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-topics">Browse the major electricity economics topic clusters</Link></li>
            <li><Link href="/electricity-data">See the datasets and data-driven analysis foundation</Link></li>
            <li><Link href="/page-index">Browse all major pages by category</Link></li>
            <li><Link href="/site-map">See the high-level site structure</Link></li>
            <li><Link href="/entity-registry">Explore the site&apos;s core electricity entities</Link></li>
            <li><Link href="/data-registry">Data registry</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
