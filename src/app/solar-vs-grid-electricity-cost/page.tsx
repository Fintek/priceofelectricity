import type { Metadata } from "next";
import Link from "next/link";
import { loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Solar vs Grid Electricity Cost by State | PriceOfElectricity.com",
  description:
    "Grid electricity price context relevant to solar economics. How state electricity prices influence the financial value of rooftop solar and solar vs grid electricity cost comparisons.",
  canonicalPath: "/solar-vs-grid-electricity-cost",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function SolarVsGridElectricityCostPage() {
  const [entityIndex, release] = await Promise.all([
    loadEntityIndex(),
    getRelease(),
  ]);

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Solar vs Grid Electricity Cost", url: "/solar-vs-grid-electricity-cost" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-cost">Electricity Cost</Link>
          {" · "}
          <span aria-current="page">Solar vs Grid Electricity Cost</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Solar vs Grid Electricity Cost by State</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Solar economics depend heavily on local grid electricity prices. This section provides grid electricity price context relevant to rooftop solar—how state-level electricity rates can influence the financial value of solar generation and solar vs grid cost comparisons.
          </p>
        </section>

        {/* B) Why Grid Electricity Price Matters */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Grid Electricity Price Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Rooftop solar offsets grid electricity consumption. Higher electricity prices can increase the financial value of solar generation—each kilowatt-hour produced by solar avoids paying the grid rate. Lower grid prices reduce that value. State electricity price context helps illustrate how solar economics vary by location.
          </p>
        </section>

        {/* C) State Electricity Price Variation */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Variation</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices vary widely across states. These differences affect the potential value of solar in each state. Our state pages provide grid electricity price context as a baseline—not solar production estimates or installation cost projections.
          </p>
        </section>

        {/* D) Explore by State */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Grid electricity price context for solar economics by state:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {stateEntities.map((e) => (
              <Link
                key={e.slug}
                href={`/solar-vs-grid-electricity-cost/${e.slug}`}
                style={{
                  display: "block",
                  padding: 16,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/solar-savings">Explore solar savings potential by state</Link>
              {" — "}
              See how electricity prices affect solar savings
            </li>
            <li>
              <Link href="/battery-backup-electricity-cost">Explore battery recharge electricity costs</Link>
              {" — "}
              Grid electricity cost for charging home battery systems
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              State-level rates and estimated costs
            </li>
            <li>
              <Link href="/electricity-cost-of-living">Electricity Cost of Living</Link>
              {" — "}
              How electricity affects household budgets
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity Affordability</Link>
              {" — "}
              Affordability by state
            </li>
            <li>
              <Link href="/electricity-inflation">Electricity Inflation</Link>
              {" — "}
              Rate trends over time
            </li>
            <li>
              <Link href="/electricity-data">Electricity Data</Link>
              {" — "}
              Datasets and methodology
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
