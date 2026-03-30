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
  title: "Operating Playbook for PriceOfElectricity.com | PriceOfElectricity.com",
  description:
    "Operational documentation for maintaining and expanding the site: data updates, content expansion, and quality verification.",
  canonicalPath: "/operating-playbook",
  robots: { index: false, follow: false },
});

export default async function OperatingPlaybookHubPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Operating Playbook", url: "/operating-playbook" },
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
          <span aria-current="page">Operating Playbook</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Operating Playbook for PriceOfElectricity.com</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This playbook documents the structure and operational approach for maintaining a structured electricity
            analysis site. It explains how the site can be updated, expanded, verified, and maintained over time.
          </p>
        </section>

        {/* Data Updates */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Data Updates</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity datasets may change over time. The site structure allows controlled rebuilds so state pages,
            rankings, and comparisons reflect updated data.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/operating-playbook/data-updates">Updating electricity data</Link>
          </p>
        </section>

        {/* Expanding the Site */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Expanding the Site</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New topic clusters and programmatic pages can be added while preserving structure. The expansion model
            covers topic hubs, state pages, comparison pages, and discovery layers.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/operating-playbook/expanding-the-site">Expanding the electricity analysis site</Link>
          </p>
        </section>

        {/* Quality and Verification */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Quality and Verification</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Build and verification scripts help ensure consistency. Sitemap, discovery assets, and launch checklist
            reviews support long-term maintainability.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/operating-playbook/quality-and-verification">Quality and verification systems</Link>
          </p>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/future-expansion">Future expansion framework</Link></li>
            <li><Link href="/site-maintenance">Site maintenance</Link></li>
            <li><Link href="/growth-roadmap">Growth roadmap</Link></li>
            <li><Link href="/launch-checklist">Launch checklist</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/datasets">Datasets</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
