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
  title: "Data and Discovery Expansion Framework | PriceOfElectricity.com",
  description:
    "How data assets, discovery systems, and methodology should evolve as the site expands. Data layer, discovery layer, and trust principles.",
  canonicalPath: "/future-expansion/data-and-discovery-expansion",
  robots: { index: false, follow: false },
});

export default async function FutureExpansionDataDiscoveryPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Future Expansion Framework", url: "/future-expansion" },
    { name: "Data and Discovery Expansion", url: "/future-expansion/data-and-discovery-expansion" },
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
          <span aria-current="page">Data and Discovery Expansion</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Data and Discovery Expansion Framework</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Content growth should be supported by data clarity and discovery structure. New datasets, discovery
            assets, and methodology should expand alongside content.
          </p>
        </section>

        {/* Data Layer Expansion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Data Layer Expansion</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New datasets and derived assets should remain structured, documented, and build-time compatible.
            Source data should be traceable; derived outputs should be reproducible from the same build process.
          </p>
        </section>

        {/* Discovery Layer Expansion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Discovery Layer Expansion</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            As the site grows, discovery assets should stay in sync:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Sitemap</strong> — All major routes should be included</li>
            <li><strong>Search index</strong> — New pages should be discoverable</li>
            <li><strong>Entity registry</strong> — New entity types should be documented</li>
            <li><strong>Discovery graph</strong> — Topic and data relationships should be updated</li>
            <li><strong>Page index</strong> — New route families should be listed</li>
            <li><strong>Site map</strong> — High-level structure should reflect new sections</li>
          </ul>
        </section>

        {/* Methodology and Trust */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Methodology and Trust</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New analytical sections should be connected to methodology and transparent assumptions where relevant.
            Rankings, derived metrics, and comparisons should be explainable.
          </p>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/datasets">Datasets</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
            <li><Link href="/entity-registry">Entity registry</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
            <li><Link href="/site-maintenance/data-refresh">Data refresh</Link></li>
            <li><Link href="/operating-playbook/data-updates">Operating playbook: data updates</Link></li>
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
