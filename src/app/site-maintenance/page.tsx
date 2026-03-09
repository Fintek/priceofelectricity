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
  title: "Site Maintenance and Updates | PriceOfElectricity.com",
  description:
    "Maintenance model: data refresh, quality checks, and content expansion.",
  canonicalPath: "/site-maintenance",
});

export default async function SiteMaintenancePage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Site Maintenance", url: "/site-maintenance" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/launch-checklist">Launch Checklist</Link>
          {" · "}
          <span aria-current="page">Site Maintenance</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Site Maintenance and Updates</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Maintenance and update model: data refresh, quality checks, and content expansion.
          </p>
        </section>

        {/* Data Refresh */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Data Refresh</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Data-driven pages depend on keeping the underlying build-time datasets current. When source data is updated, the knowledge layer and related outputs can be rebuilt so state pages, rankings, and datasets reflect the latest electricity price context.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/site-maintenance/data-refresh">Refreshing electricity data</Link>
          </p>
        </section>

        {/* Quality Checks */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Quality Checks</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Verification and crawl checks help keep the site reliable. Build-time checks can confirm that core pages, datasets, sitemap, and discovery assets exist and are correctly configured.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/site-maintenance/quality-checks">Electricity site quality checks</Link>
          </p>
        </section>

        {/* Content Expansion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Content Expansion</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Topic clusters and programmatic pages can expand while preserving structure. New content should fit into existing topic hubs, route families, or data and discovery layers.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/site-maintenance/content-expansion">Expanding electricity content over time</Link>
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/future-expansion">Future expansion framework</Link></li>
            <li><Link href="/operating-playbook">Operating playbook</Link></li>
            <li><Link href="/launch-checklist">Launch checklist</Link></li>
            <li><Link href="/growth-roadmap">Growth roadmap</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/datasets">Datasets</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
