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
  title: "Future Expansion Framework | PriceOfElectricity.com",
  description:
    "How the site can scale over time while preserving structure, clarity, and data integrity. Programmatic scaling, topic expansion, and data discovery principles.",
  canonicalPath: "/future-expansion",
  robots: { index: false, follow: false },
});

export default async function FutureExpansionHubPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Future Expansion Framework", url: "/future-expansion" },
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
          <span aria-current="page">Future Expansion Framework</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Future Expansion Framework</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site is designed around topic hubs, programmatic pages, data layers, and discovery assets that can
            expand in a controlled way. This framework documents how to scale safely without breaking structure,
            clarity, or data integrity.
          </p>
        </section>

        {/* Programmatic Scaling */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Programmatic Scaling</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New state, comparison, and fixed-scenario page families can be added carefully. Each family should use
            consistent data, repeatable templates, and clear user intent.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/future-expansion/programmatic-scaling">Programmatic scaling framework</Link>
          </p>
        </section>

        {/* Topic Expansion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Topic Expansion</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            New topic clusters should connect to existing architecture rather than being added randomly. Each
            cluster should have a clear hub, supporting pages, and links into adjacent clusters.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/future-expansion/topic-expansion">Topic expansion framework</Link>
          </p>
        </section>

        {/* Data and Discovery Expansion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Data and Discovery Expansion</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Data assets, discovery pages, and methodology should expand alongside content. Sitemap, search index,
            entity registry, and discovery graph must stay in sync as the site grows.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/future-expansion/data-and-discovery-expansion">Data and discovery expansion framework</Link>
          </p>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/growth-roadmap">Growth roadmap</Link></li>
            <li><Link href="/site-maintenance">Site maintenance</Link></li>
            <li><Link href="/operating-playbook">Operating playbook</Link></li>
            <li><Link href="/electricity-topics">Electricity topics</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/discovery-graph">Discovery graph</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
