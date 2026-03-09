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
  title: "Programmatic Scaling Framework | PriceOfElectricity.com",
  description:
    "How to safely expand programmatic page families. State-based, comparison, and fixed-usage families with clear guardrails.",
  canonicalPath: "/future-expansion/programmatic-scaling",
});

export default async function FutureExpansionProgrammaticPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Future Expansion Framework", url: "/future-expansion" },
    { name: "Programmatic Scaling", url: "/future-expansion/programmatic-scaling" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/future-expansion">Future Expansion Framework</Link>
          {" · "}
          <span aria-current="page">Programmatic Scaling</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Programmatic Scaling Framework</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Programmatic pages work best when they are based on consistent data, repeatable templates, and clear
            user intent. New page families should follow the same principles.
          </p>
        </section>

        {/* What to Scale */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What to Scale</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Examples of expansion types:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>State-based page families</strong> — One page per state from shared data and templates</li>
            <li><strong>Comparison families</strong> — State-to-state or scenario comparisons</li>
            <li><strong>Fixed-usage families</strong> — Pages at specific kWh assumptions (e.g. 500, 900, 1500 kWh)</li>
            <li><strong>Business or household use-case families</strong> — Context pages for specific audiences</li>
          </ul>
        </section>

        {/* What to Avoid */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What to Avoid</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Avoid thin pages</strong> — Each page should offer meaningful context, not minimal placeholder content</li>
            <li><strong>Avoid duplicate route families</strong> — Do not create overlapping families that serve the same intent</li>
            <li><strong>Avoid pages with no clear search intent</strong> — New pages should answer real user questions</li>
            <li><strong>Avoid route explosions without discovery support</strong> — Sitemap, search index, and discovery assets must cover new routes</li>
          </ul>
        </section>

        {/* How the Site Supports This */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How the Site Supports This</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/growth-roadmap/programmatic-pages">Programmatic electricity page expansion</Link></li>
            <li><Link href="/operating-playbook/expanding-the-site">Expanding the electricity analysis site</Link></li>
            <li><Link href="/site-maintenance/content-expansion">Content expansion</Link></li>
          </ul>
        </section>

        <p style={{ marginBottom: 24, fontSize: 14 }}>
          <Link href="/future-expansion">← Back to Future Expansion Framework</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
