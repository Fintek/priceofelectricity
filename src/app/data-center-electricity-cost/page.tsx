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
  title: "Data Center Electricity Cost by State | PriceOfElectricity.com",
  description:
    "Electricity price context relevant to data center infrastructure. How state electricity prices influence the economics of large computing and AI infrastructure.",
  canonicalPath: "/data-center-electricity-cost",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function DataCenterElectricityCostPage() {
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
    { name: "Data Center Electricity Cost", url: "/data-center-electricity-cost" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/ai-energy-demand">AI Energy Demand</Link>
          {" · "}
          <span aria-current="page">Data Center Electricity Cost</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Data Center Electricity Cost by State</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Data centers and AI infrastructure consume large amounts of electricity. This section provides electricity price context relevant to large computing infrastructure—how state-level electricity prices can influence the economics of data center operations and location decisions.
          </p>
        </section>

        {/* B) Why Electricity Price Matters for Data Centers */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Price Matters for Data Centers</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity is a major operating cost for computing infrastructure. Higher electricity prices increase operating costs; lower prices reduce them. State electricity price context helps illustrate the scale of cost differences across regions.
          </p>
        </section>

        {/* C) State Electricity Price Context */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices vary widely by state. These differences can influence location decisions for data centers and other power-intensive infrastructure. Our state pages provide electricity price context as a baseline illustration—not exact hyperscaler or wholesale pricing.
          </p>
        </section>

        {/* D) Example Electricity Consumption Scale */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Example Electricity Consumption Scale</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            For illustrative purposes, consider these approximate monthly usage levels:
          </p>
          <ul style={{ margin: "0 0 16px 20px", lineHeight: 1.8 }}>
            <li><strong>1 MW continuous load</strong> ≈ 720,000 kWh/month</li>
            <li><strong>10 MW continuous load</strong> ≈ 7,200,000 kWh/month</li>
          </ul>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            At different state electricity rates, these loads translate to very different monthly cost estimates. Our state pages show illustrative scenarios using state average residential rates as context.
          </p>
        </section>

        {/* E) Explore by State */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity price context for data center infrastructure by state:
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
                href={`/data-center-electricity-cost/${e.slug}`}
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

        {/* F) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/business-electricity-options">Explore business electricity options by state</Link>
              {" — "}
              State-level context for how businesses compare electricity options
            </li>
            <li>
              <Link href="/business-electricity-cost-decisions">Explore business electricity cost decisions</Link>
              {" — "}
              How electricity prices influence business planning and location decisions
            </li>
            <li>
              <Link href="/grid-capacity-and-electricity-demand">Explore grid capacity and electricity demand</Link>
              {" — "}
              How power demand growth and grid capacity constraints connect to electricity prices
            </li>
            <li>
              <Link href="/ai-energy-demand">AI Energy Demand</Link>
              {" — "}
              Data centers, AI power consumption, electricity prices
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              State-level rates and estimated costs
            </li>
            <li>
              <Link href="/electricity-data">Electricity Data</Link>
              {" — "}
              Datasets and methodology
            </li>
            <li>
              <Link href="/datasets">Datasets</Link>
              {" — "}
              Download electricity price data
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
