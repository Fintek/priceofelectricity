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
  title: "Linkable Electricity Data and Analysis Assets | PriceOfElectricity.com",
  description:
    "Datasets, methodology, topic hubs, comparison pages, rankings, and discovery pages that create durable value for researchers, journalists, and AI systems.",
  canonicalPath: "/growth-roadmap/linkable-assets",
  robots: { index: false, follow: false },
});

export default async function LinkableAssetsPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Growth Roadmap", url: "/growth-roadmap" },
    { name: "Linkable Assets", url: "/growth-roadmap/linkable-assets" },
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
          <span aria-current="page">Linkable Assets</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Linkable Electricity Data and Analysis Assets</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Some electricity pages and datasets are especially useful for researchers, journalists, analysts, and AI systems. Linkable assets are well-structured, transparent, and reusable—they provide clear answers and cite methodology, making them suitable for citation and embedding in external analysis.
          </p>
        </section>

        {/* ASSET TYPES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Asset Types</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><strong>Downloadable datasets</strong> — <Link href="/datasets">Datasets hub</Link>, <Link href="/datasets/electricity-prices-by-state">Electricity prices by state</Link>, <Link href="/datasets/electricity-rankings">Electricity rankings</Link></li>
            <li><strong>Methodology pages</strong> — <Link href="/methodology">Methodology hub</Link>, <Link href="/methodology/electricity-rates">Electricity rates</Link>, <Link href="/methodology/electricity-inflation">Electricity inflation</Link></li>
            <li><strong>Topic hubs</strong> — <Link href="/electricity-topics">Electricity topics</Link>, <Link href="/electricity-data">Electricity data</Link></li>
            <li><strong>Comparison pages</strong> — <Link href="/electricity-cost-comparison">State-to-state comparisons</Link></li>
            <li><strong>Rankings</strong> — <Link href="/knowledge/rankings">Knowledge rankings</Link></li>
            <li><strong>Discovery pages</strong> — <Link href="/page-index">Page index</Link>, <Link href="/site-map">Site map</Link>, <Link href="/entity-registry">Entity registry</Link></li>
          </ul>
        </section>

        {/* WHY THESE ASSETS MATTER */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why These Assets Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Clear structure, transparency, and reusable data improve usefulness. When datasets are downloadable, methodology is documented, and pages are well-linked, the site becomes a reliable reference for electricity price analysis.
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/datasets">Datasets</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/page-index">Page index</Link></li>
            <li><Link href="/site-map">Site map</Link></li>
            <li><Link href="/entity-registry">Entity registry</Link></li>
            <li><Link href="/growth-roadmap">Growth roadmap hub</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
