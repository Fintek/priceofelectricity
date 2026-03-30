import type { Metadata } from "next";
import Link from "next/link";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Topic Cluster Expansion | PriceOfElectricity.com",
  description:
    "Major electricity topic clusters: consumer economics, affordability, business, AI infrastructure, market structure, energy transition, and data methodology.",
  canonicalPath: "/growth-roadmap/topic-clusters",
  robots: { index: false, follow: false },
});

export default async function TopicClustersPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Growth Roadmap", url: "/growth-roadmap" },
    { name: "Topic Clusters", url: "/growth-roadmap/topic-clusters" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/growth-roadmap">Growth Roadmap</Link>
          {" · "}
          <span aria-current="page">Topic Clusters</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Topic Cluster Expansion</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site&apos;s authority is built through connected topic clusters. Each cluster covers a related set of electricity economics questions, and clusters link to each other to improve understanding and discoverability.
          </p>
        </section>

        {/* CLUSTERS TO COVER */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Clusters to Cover</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><strong>Consumer electricity economics</strong> — <Link href="/electricity-cost">Electricity cost</Link>, <Link href="/average-electricity-bill">Average bill</Link>, <Link href="/electricity-affordability">Affordability</Link></li>
            <li><strong>Affordability / cost of living</strong> — <Link href="/electricity-affordability">Electricity affordability</Link>, <Link href="/electricity-cost-of-living">Cost of living</Link></li>
            <li><strong>Business electricity</strong> — <Link href="/business-electricity-cost-decisions">Business electricity cost decisions</Link>, <Link href="/data-center-electricity-cost">Data center electricity cost</Link></li>
            <li><strong>AI / data center infrastructure</strong> — <Link href="/ai-energy-demand">AI energy demand</Link>, <Link href="/grid-capacity-and-electricity-demand">Grid capacity and demand</Link></li>
            <li><strong>Market structure</strong> — <Link href="/electricity-markets">Electricity markets</Link>, <Link href="/regional-electricity-markets">Regional markets</Link>, <Link href="/power-generation-mix">Power generation mix</Link></li>
            <li><strong>Energy transition</strong> — <Link href="/solar-vs-grid-electricity-cost">Solar vs grid</Link>, <Link href="/battery-backup-electricity-cost">Battery backup</Link></li>
            <li><strong>Data / methodology / discovery</strong> — <Link href="/electricity-data">Electricity data</Link>, <Link href="/datasets">Datasets</Link>, <Link href="/methodology">Methodology</Link>, <Link href="/entity-registry">Entity registry</Link></li>
          </ul>
        </section>

        {/* WHY CLUSTERS MATTER */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Clusters Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Connected topic coverage improves understanding and discoverability. When clusters link to each other, visitors can explore related questions, and search engines can better understand the site&apos;s topical authority.
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-topics">Electricity topics hub</Link></li>
            <li><Link href="/entity-registry">Entity registry</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/growth-roadmap">Growth roadmap hub</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
