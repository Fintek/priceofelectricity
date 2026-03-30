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
  title: "Electricity Site Quality Checks | PriceOfElectricity.com",
  description:
    "Types of checks that help keep a structured electricity analysis site reliable: build checks, verification, sitemap, and discovery checks.",
  canonicalPath: "/site-maintenance/quality-checks",
  robots: { index: false, follow: false },
});

export default async function QualityChecksPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Site Maintenance", url: "/site-maintenance" },
    { name: "Quality Checks", url: "/site-maintenance/quality-checks" },
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
          <span aria-current="page">Quality Checks</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Site Quality Checks</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Quality checks help catch missing pages, missing datasets, broken discovery assets, and crawl issues. A structured electricity analysis site benefits from repeatable checks that run as part of the build pipeline.
          </p>
        </section>

        {/* EXAMPLE CHECK TYPES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Example Check Types</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Build checks</strong> — Ensure the site builds successfully and all route families are backed by data.</li>
            <li><strong>Verification checks</strong> — Confirm core pages, datasets, sitemap, robots, and discovery assets exist and are correctly configured.</li>
            <li><strong>Sitemap / discovery checks</strong> — Verify sitemap includes key routes and discovery pages (site-map, page-index, entity-registry) are present.</li>
            <li><strong>Launch readiness checks</strong> — A consolidated set of checks that run before deployment to catch common issues.</li>
          </ul>
        </section>

        {/* WHY THIS MATTERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            A large electricity analysis site with many state pages, rankings, and programmatic routes benefits from repeatable quality checks. Catching missing datasets or broken links before deployment helps keep the site reliable for users, crawlers, and researchers.
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/launch-checklist">Launch checklist</Link></li>
            <li><Link href="/growth-roadmap">Growth roadmap</Link></li>
            <li><Link href="/site-map">Site map</Link></li>
            <li><Link href="/page-index">Page index</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
            <li><Link href="/site-maintenance">Site maintenance</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
