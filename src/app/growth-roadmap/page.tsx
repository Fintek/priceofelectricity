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
  title: "Electricity Content Growth Roadmap | PriceOfElectricity.com",
  description:
    "Expansion model: programmatic pages, topic clusters, and linkable assets.",
  canonicalPath: "/growth-roadmap",
  robots: { index: false, follow: false },
});

export default async function GrowthRoadmapPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Content Growth Roadmap", url: "/growth-roadmap" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-topics">Electricity Topics</Link>
          {" · "}
          <span aria-current="page">Growth Roadmap</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Content Growth Roadmap</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            How the site&apos;s electricity content model can expand: programmatic pages, topic clusters, and linkable assets.
          </p>
        </section>

        {/* Programmatic Expansion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Programmatic Expansion</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            State pages, comparison pages, and fixed-scenario pages can expand coverage. Each programmatic route family uses the same underlying data and methodology, enabling consistent analysis across states and usage assumptions.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/growth-roadmap/programmatic-pages">Programmatic electricity page expansion</Link>
          </p>
        </section>

        {/* Topic Cluster Expansion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Topic Cluster Expansion</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity economics topics can deepen over time. Connected topic clusters—consumer costs, price dynamics, market structure, energy transition, and data—strengthen authority and discoverability.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/growth-roadmap/topic-clusters">Electricity topic cluster expansion</Link>
          </p>
        </section>

        {/* Linkable / Research Assets */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Linkable / Research Assets</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Datasets, methodology, and structured authority pages create durable value. These assets are especially useful for researchers, journalists, analysts, and AI systems seeking transparent, reusable electricity data.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/growth-roadmap/linkable-assets">Linkable electricity data and analysis assets</Link>
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/future-expansion">Future expansion framework</Link></li>
            <li><Link href="/operating-playbook">Operating playbook</Link></li>
            <li><Link href="/electricity-topics">Electricity topics</Link></li>
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
