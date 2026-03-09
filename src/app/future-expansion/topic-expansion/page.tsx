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
  title: "Topic Expansion Framework | PriceOfElectricity.com",
  description:
    "How new electricity topic clusters should be added. Hub pages, supporting pages, and links into adjacent clusters.",
  canonicalPath: "/future-expansion/topic-expansion",
});

export default async function FutureExpansionTopicPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Future Expansion Framework", url: "/future-expansion" },
    { name: "Topic Expansion", url: "/future-expansion/topic-expansion" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/future-expansion">Future Expansion Framework</Link>
          {" · "}
          <span aria-current="page">Topic Expansion</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Topic Expansion Framework</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New topics should fit into the site&apos;s existing electricity economics structure. Each cluster
            should connect to adjacent clusters and the broader topic hub.
          </p>
        </section>

        {/* How to Add New Topic Clusters */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to Add New Topic Clusters</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New clusters should usually have:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>A clear hub page that explains the topic and links to supporting pages</li>
            <li>Supporting pages that deepen the topic</li>
            <li>Data or methodology context where appropriate</li>
            <li>Internal links into adjacent clusters and the main topic hub</li>
          </ul>
        </section>

        {/* Examples of Expansion Types */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Examples of Expansion Types</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Household electricity decisions</strong> — Cost, affordability, bill estimates, plan comparison context</li>
            <li><strong>Business electricity decisions</strong> — Commercial cost context, data center economics, location decisions</li>
            <li><strong>Energy transition topics</strong> — Solar vs grid, battery backup, electrification</li>
            <li><strong>Market structure topics</strong> — Regulated vs choice markets, regional grids, generation mix</li>
            <li><strong>Infrastructure and demand topics</strong> — Grid capacity, AI energy demand, data center load</li>
          </ul>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-topics">Electricity topics</Link></li>
            <li><Link href="/growth-roadmap/topic-clusters">Topic cluster expansion</Link></li>
            <li><Link href="/entity-registry">Entity registry</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
            <li><Link href="/future-expansion">Future expansion framework</Link></li>
          </ul>
        </section>

        <p style={{ marginBottom: 24, fontSize: 14 }}>
          <Link href="/future-expansion">← Back to Future Expansion Framework</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
