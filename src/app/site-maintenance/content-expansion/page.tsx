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
  title: "Expanding Electricity Content Over Time | PriceOfElectricity.com",
  description:
    "How the site's content model can grow while staying organized. Topic groups, templated pages, and data assets share one clear structure.",
  canonicalPath: "/site-maintenance/content-expansion",
  robots: { index: false, follow: false },
});

export default async function ContentExpansionPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Site Maintenance", url: "/site-maintenance" },
    { name: "Content Expansion", url: "/site-maintenance/content-expansion" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/site-maintenance">Site Maintenance</Link>
          {" · "}
          <span aria-current="page">Content Expansion</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Expanding Electricity Content Over Time</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site expands through topic hubs, templated pages, comparison pages, and data assets. New content should fit into the existing structure so the site stays organized and discoverable.
          </p>
        </section>

        {/* HOW EXPANSION WORKS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How Expansion Works</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New pages should usually fit into one of these layers:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Topic area</strong> — Add to an existing topic group (e.g. electricity costs, price dynamics, market structure) or start a new section with clear links from the main electricity topics page.</li>
            <li><strong>Templated state or comparison pages</strong> — Pages that follow a consistent pattern and are backed by the same data.</li>
            <li><strong>Data and transparency pages</strong> — Datasets, methodology, entity registry, and navigation aids that support reproducibility.</li>
            <li><strong>Methodology or authority layer</strong> — New formulas, metrics, or documentation that explain how the site calculates or presents data.</li>
          </ul>
        </section>

        {/* WHY STRUCTURE MATTERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Structure Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Consistent structure helps visitors, search engines, and partners understand the site. Topic hubs, navigation pages (site map, page index, entity registry, discovery graph), and data authority pages (electricity-data, datasets, methodology) keep expansion predictable.
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/growth-roadmap">Growth roadmap</Link></li>
            <li><Link href="/electricity-topics">Electricity topics</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/entity-registry">Entity registry</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
            <li><Link href="/site-maintenance">Site maintenance</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
