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
  title: "Expanding the Electricity Analysis Site | PriceOfElectricity.com",
  description:
    "How the site expands: topic hubs, programmatic state pages, comparison pages, discovery layers, and marketplace-ready educational pages.",
  canonicalPath: "/operating-playbook/expanding-the-site",
  robots: { index: false, follow: false },
});

export default async function OperatingPlaybookExpandingPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Operating Playbook", url: "/operating-playbook" },
    { name: "Expanding the Site", url: "/operating-playbook/expanding-the-site" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/operating-playbook">Operating Playbook</Link>
          {" · "}
          <span aria-current="page">Expanding the Site</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Expanding the Electricity Analysis Site</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site expands through several mechanisms: topic hubs, programmatic state pages, comparison pages,
            discovery layers, and marketplace-ready educational pages. New content should fit into the existing
            architecture.
          </p>
        </section>

        {/* Expansion Mechanisms */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Expansion Mechanisms</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Topic hubs</strong> — Major theme areas (consumer costs, price trends, market structure) that link to related pages.</li>
            <li><strong>Programmatic state pages</strong> — Route families that generate one page per state from shared data and templates.</li>
            <li><strong>Comparison pages</strong> — State-to-state or scenario comparisons built from the same underlying data.</li>
            <li><strong>Discovery layers</strong> — Page index, site map, entity registry, and discovery graph help users and crawlers find content.</li>
            <li><strong>Marketplace-ready educational pages</strong> — Provider, shopping, and business electricity context pages that explain what to evaluate without offering live offers or procurement.</li>
          </ul>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/growth-roadmap">Growth roadmap</Link></li>
            <li><Link href="/electricity-topics">Electricity topics</Link></li>
            <li><Link href="/entity-registry">Entity registry</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
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
