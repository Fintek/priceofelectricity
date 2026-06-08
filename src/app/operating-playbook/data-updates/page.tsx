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
  title: "Updating Electricity Data | PriceOfElectricity.com",
  description:
    "How electricity datasets power programmatic pages. Refreshing data, rebuilds, and derived outputs for state pages, rankings, and comparisons.",
  canonicalPath: "/operating-playbook/data-updates",
  robots: { index: false, follow: false },
});

export default async function OperatingPlaybookDataUpdatesPage() {
  const release = await getRelease();

  const breadcrumbTrail: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Operating Playbook", url: "/operating-playbook" },
    { name: "Updating Electricity Data" },
  ];
  const breadcrumbJsonLd = breadcrumbsToJsonLd(breadcrumbTrail);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <Breadcrumbs trail={breadcrumbTrail} />

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Updating Electricity Data</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity datasets are used to build programmatic pages. State pages, rankings, comparisons, and
            downloadable exports all derive from structured source data. When that data changes, a rebuild updates
            the site outputs.
          </p>
        </section>

        {/* How Data Flows */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How Data Flows Through the Site</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Refreshing datasets may change rankings, state pages, and comparisons. The knowledge build scripts
            generate derived outputs—national snapshots, state-level metrics, rankings, and search indexes—from
            the source data. A full rebuild ensures all outputs stay consistent.
          </p>
        </section>

        {/* Rebuild Process */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Rebuild Process</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            At a high level, a rebuild loads source data, normalizes state metrics, computes national and ranking
            outputs, and writes knowledge pages and navigation aids. The process is repeatable and does not
            expose internal secrets or infrastructure details.
          </p>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/datasets">Datasets</Link></li>
            <li><Link href="/methodology">Methodology</Link></li>
            <li><Link href="/operating-playbook">Operating playbook</Link></li>
          </ul>
        </section>

        <p style={{ marginBottom: 24, fontSize: 14 }}>
          <Link href="/operating-playbook">← Back to Operating Playbook</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
