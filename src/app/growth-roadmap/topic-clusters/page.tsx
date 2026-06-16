import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs, { breadcrumbsToJsonLd, type BreadcrumbItem } from "@/components/navigation/Breadcrumbs";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";

import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Topic Area Expansion | PriceOfElectricity.com",
  description:
    "Major electricity topic areas: consumer economics, affordability, business, AI infrastructure, market structure, energy transition, and data methodology.",
  canonicalPath: "/growth-roadmap/topic-clusters",
  robots: { index: false, follow: false },
});

export default async function TopicClustersPage() {
  const release = await getRelease();

  const breadcrumbTrail: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Growth Roadmap", url: "/growth-roadmap" },
    { name: "Topic areas" },
  ];
  const breadcrumbJsonLd = breadcrumbsToJsonLd(breadcrumbTrail);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <Breadcrumbs trail={breadcrumbTrail} />

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Topic Area Expansion</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site grows through linked topic areas. Each area groups related electricity economics questions, and cross-links help readers move from one subject to the next.
          </p>
        </section>

        {/* Areas TO COVER */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Areas to cover</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><strong>Consumer electricity economics</strong> — <Link href="/electricity-cost">Electricity cost</Link>, <Link href="/average-electricity-bill">Average bill</Link>, <Link href="/electricity-affordability">Affordability</Link></li>
            <li><strong>Affordability / cost of living</strong> — <Link href="/electricity-affordability">Electricity affordability</Link>, <Link href="/electricity-cost-of-living">Cost of living</Link></li>
            <li><strong>Business electricity</strong> — <Link href="/business-electricity-cost-decisions">Business electricity cost decisions</Link>, <Link href="/data-center-electricity-cost">Data center electricity cost</Link></li>
            <li><strong>AI / data center infrastructure</strong> — <Link href="/ai-energy-demand">AI energy demand</Link>, <Link href="/grid-capacity-and-electricity-demand">Grid capacity and demand</Link></li>
            <li><strong>Market structure</strong> — <Link href="/electricity-markets">Electricity markets</Link>, <Link href="/regional-electricity-markets">Regional markets</Link>, <Link href="/power-generation-mix">Power generation mix</Link></li>
            <li><strong>Energy transition</strong> — <Link href="/solar-vs-grid-electricity-cost">Solar vs grid</Link>, <Link href="/battery-backup-electricity-cost">Battery backup</Link></li>
            <li><strong>Data / methodology / navigation</strong> — <Link href="/electricity-data">Electricity data</Link>, <Link href="/datasets">Datasets</Link>, <Link href="/methodology">Methodology</Link>, <Link href="/entity-registry">Entity registry</Link></li>
          </ul>
        </section>

        {/* WHY CLUSTERS MATTER */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why grouped topics matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Organizing related articles together improves understanding and helps people find the next question they should ask. Cross-links between areas keep navigation intuitive.
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-topics">Electricity topics</Link></li>
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
