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
  title: "Programmatic Electricity Page Expansion | PriceOfElectricity.com",
  description:
    "Types of programmatic electricity pages: state cost pages, average bill pages, cost-of-living pages, inflation pages, comparison pages, and fixed-kWh pages.",
  canonicalPath: "/growth-roadmap/programmatic-pages",
});

export default async function ProgrammaticPagesPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Growth Roadmap", url: "/growth-roadmap" },
    { name: "Programmatic Pages", url: "/growth-roadmap/programmatic-pages" },
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
          <span aria-current="page">Programmatic Pages</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Programmatic Electricity Page Expansion</h1>

        {/* INTRO */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Programmatic pages are generated from the same underlying data and methodology. Each page type applies a consistent template across all states or comparison pairs, enabling structured coverage of electricity costs, bills, affordability, inflation, and fixed-usage scenarios.
          </p>
        </section>

        {/* CURRENT PAGE TYPES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Current Page Types</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-cost">State electricity cost pages</Link> — Rates and estimated costs by state</li>
            <li><Link href="/average-electricity-bill">Average electricity bill pages</Link> — Monthly and annual bill estimates by state</li>
            <li><Link href="/electricity-cost-of-living">Electricity cost of living pages</Link> — Cost-of-living context by state</li>
            <li><Link href="/electricity-inflation">Electricity inflation pages</Link> — Price trends and inflation by state</li>
            <li><Link href="/electricity-cost-comparison">Comparison pages</Link> — State-to-state electricity price comparisons</li>
            <li><Link href="/how-much-does-500-kwh-cost">Fixed-kWh pages</Link> — Estimated bills at 500, 1000, 2000 kWh</li>
          </ul>
        </section>

        {/* WHY PROGRAMMATIC COVERAGE MATTERS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Programmatic Coverage Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Structured page systems help users compare states, usage assumptions, and electricity economics. Each programmatic route family uses the same methodology, so comparisons across pages are consistent and transparent.
          </p>
        </section>

        {/* RELATED PAGES */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-cost-comparison">Electricity cost comparison</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/electricity-inflation">Electricity inflation</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/growth-roadmap">Growth roadmap hub</Link></li>
          </ul>
        </section>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
