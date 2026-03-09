import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Launch Checklist | PriceOfElectricity.com",
  description:
    "Pre-launch verification checklist: content, data, discovery, and technical readiness.",
  canonicalPath: "/launch-checklist",
});

export default function LaunchChecklistPage() {
  return (
    <main className="container">
      <h1>Launch Checklist</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Pre-launch verification checklist. Use as a go/no-go before deployment. Run <code>npm run launch:check</code> for automated verification.
      </p>

      <section style={{ marginTop: 24, padding: "14px 18px", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px 0" }}>How to verify this site</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Review the <Link href="/methodology">methodology</Link>, inspect <Link href="/datasets">downloadable datasets</Link>, browse <Link href="/electricity-topics">topic hubs</Link> and <Link href="/discovery-graph">discovery pages</Link>, and compare <Link href="/knowledge/rankings">state rankings</Link>.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>A) Core Content Coverage</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Homepage</li>
          <li>Knowledge hub</li>
          <li>Electricity trends</li>
          <li>Electricity insights</li>
          <li>Datasets</li>
          <li>Methodology</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>B) Programmatic Section Coverage</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Electricity cost pages</li>
          <li>Average electricity bill pages</li>
          <li>Electricity cost calculator pages</li>
          <li>Battery recharge cost pages</li>
          <li>Generator vs battery cost pages</li>
          <li>Electricity price history pages</li>
          <li>Electricity comparison pages</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>C) Technical Readiness</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Sitemap present</li>
          <li>Robots present</li>
          <li>Search index present</li>
          <li>Schema layer present</li>
          <li><code>npm run launch:check</code> passes</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>D) Data / Trust Layer</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Downloadable datasets exist (JSON and CSV)</li>
          <li>Methodology pages exist</li>
          <li>Data registry, site map, and page index exist</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>E) Final Human Review</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>Spot-check top pages</li>
          <li>Verify internal links on major hubs</li>
          <li>Verify state pages and ranking pages render as expected</li>
          <li>Confirm no obvious placeholder copy remains</li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/operating-playbook">Operating playbook</Link> {" | "}
        <Link href="/methodology">Methodology</Link> {" | "}
        <Link href="/data-registry">Data registry</Link> {" | "}
        <Link href="/site-map">Site map</Link> {" | "}
        <Link href="/page-index">Page index</Link> {" | "}
        <Link href="/growth-roadmap">Electricity content growth roadmap</Link>
        {" | "}
        <Link href="/site-maintenance">Site maintenance</Link>
      </p>
    </main>
  );
}
