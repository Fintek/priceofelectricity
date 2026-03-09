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
  title: "Quality and Verification Systems | PriceOfElectricity.com",
  description:
    "Build checks, knowledge verification scripts, sitemap and discovery validation, and launch checklist reviews for maintaining a structured site.",
  canonicalPath: "/operating-playbook/quality-and-verification",
});

export default async function OperatingPlaybookQualityPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Operating Playbook", url: "/operating-playbook" },
    { name: "Quality and Verification", url: "/operating-playbook/quality-and-verification" },
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
          <span aria-current="page">Quality and Verification</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Quality and Verification Systems</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Build checks, knowledge verification scripts, sitemap and discovery validation, and launch checklist
            reviews help ensure a large structured site stays consistent and maintainable.
          </p>
        </section>

        {/* Build Checks */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Build Checks</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The knowledge build process validates data structure and generates derived outputs. Build failures
            surface early when source data or configuration is invalid.
          </p>
        </section>

        {/* Knowledge Verification */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Knowledge Verification Scripts</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Verification scripts confirm that core pages exist, datasets are present, sitemap and search index
            cover expected routes, and internal links resolve. These checks catch regressions before deployment.
          </p>
        </section>

        {/* Sitemap and Discovery */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Sitemap and Discovery Validation</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Sitemap and discovery assets (page index, entity registry, discovery graph) should reflect the
            actual route structure. Verification ensures new route families are registered and broken links
            are flagged.
          </p>
        </section>

        {/* Launch Checklist */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Launch Checklist Reviews</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The launch checklist provides a human-review layer: core content coverage, programmatic sections,
            technical readiness, and data trust. Combined with automated verification, it supports go/no-go
            decisions before deployment.
          </p>
        </section>

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/launch-checklist">Launch checklist</Link></li>
            <li><Link href="/site-maintenance">Site maintenance</Link></li>
            <li><Link href="/page-index">Page index</Link></li>
            <li><Link href="/site-map">Site map</Link></li>
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
