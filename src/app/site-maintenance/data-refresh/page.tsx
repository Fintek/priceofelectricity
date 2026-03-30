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
  title: "Refreshing Electricity Data | PriceOfElectricity.com",
  description:
    "How the site's data-driven pages depend on updating build-time datasets. State pages, rankings, and datasets are built from structured data.",
  canonicalPath: "/site-maintenance/data-refresh",
  robots: { index: false, follow: false },
});

export default async function DataRefreshPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Site Maintenance", url: "/site-maintenance" },
    { name: "Data Refresh", url: "/site-maintenance/data-refresh" },
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
          <span aria-current="page">Data Refresh</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Refreshing Electricity Data</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity analysis pages are built from structured data files. State rates, national metrics, rankings, and derived datasets are computed at build time and baked into static pages and JSON/CSV exports.
          </p>
        </section>

        {/* WHAT DATA REFRESH MEANS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Data Refresh Means</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Refreshing data generally means rebuilding or updating the knowledge layer and related outputs. When source electricity data is updated, a rebuild can regenerate state pages, rankings, search index, and downloadable datasets so the site reflects the latest figures.
          </p>
        </section>

        {/* WHAT THIS AFFECTS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Affects</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Refreshed data can affect:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>State electricity price pages</li>
            <li>Rankings (price, affordability, inflation, etc.)</li>
            <li>Downloadable datasets (JSON and CSV)</li>
            <li>Comparison pages</li>
            <li>Fixed-usage calculation pages (e.g. 500, 900, 1500 kWh)</li>
          </ul>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/datasets">Datasets</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
            <li><Link href="/launch-checklist">Launch checklist</Link></li>
            <li><Link href="/site-maintenance">Site maintenance</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
