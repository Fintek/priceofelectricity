import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Grid Capacity and Electricity Demand | PriceOfElectricity.com",
  description:
    "How electricity demand growth and grid capacity pressures can matter for electricity prices. Explanatory authority on demand, infrastructure, and electricity-cost connections.",
  canonicalPath: "/grid-capacity-and-electricity-demand",
});

export default async function GridCapacityAndElectricityDemandPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
  } | undefined;
  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * 900;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Grid Capacity and Electricity Demand", url: "/grid-capacity-and-electricity-demand" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-trends">Electricity Trends</Link>
          {" · "}
          <span aria-current="page">Grid Capacity and Electricity Demand</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Grid Capacity and Electricity Demand</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices are influenced not only by fuel costs and policy, but also by how much power is needed and how much infrastructure is available. This section explains how electricity demand growth and grid capacity pressures can matter for electricity prices—in plain language, grounded in the site&apos;s existing electricity-cost data.
          </p>
        </section>

        {/* B) Why Electricity Demand Matters */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Demand Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Rising electricity demand can increase system stress and change electricity-cost discussions. When demand grows—from residential use, commercial activity, data centers, or electrification—it can influence how utilities and markets plan for capacity, transmission, and pricing. Understanding demand trends helps contextualize electricity price outcomes.
          </p>
        </section>

        {/* C) Why Grid Capacity Matters */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Grid Capacity Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Transmission, generation, and distribution capacity all affect how electricity systems respond to demand. When capacity is constrained—whether from aging infrastructure, transmission limits, or localized congestion—it can be part of cost and reliability discussions. This site provides electricity-cost context, not real-time grid operations data.
          </p>
        </section>

        {/* D) Why This Matters for Prices */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for Prices</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Demand growth and capacity constraints connect to electricity prices, volatility, affordability, and planning. Our <Link href="/electricity-inflation">electricity inflation</Link>, <Link href="/electricity-price-volatility">price volatility</Link>, and <Link href="/electricity-affordability">affordability</Link> pages provide data-driven context. This section adds explanatory authority on how demand and infrastructure fit into the picture.
          </p>
        </section>

        {/* Data-driven block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Current Electricity Context</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                The national average residential electricity rate is <strong>{nationalAvgRate.toFixed(2)} ¢/kWh</strong>.
                At 900 kWh per month, that translates to an estimated bill of about $<strong>{estimatedMonthlyBill.toFixed(2)}</strong>.
                See <Link href="/electricity-cost">electricity cost by state</Link> and <Link href="/electricity-price-volatility">price volatility</Link> for state-level context.
              </p>
            </div>
          </section>
        )}

        {/* E) Explore This Section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore This Section</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            <Link
              href="/grid-capacity-and-electricity-demand/power-demand-growth"
              style={{
                display: "block",
                padding: 24,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Power Demand Growth and Electricity Prices</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                How rising electricity demand can matter for electricity prices and infrastructure planning.
              </p>
            </Link>
            <Link
              href="/grid-capacity-and-electricity-demand/grid-capacity-constraints"
              style={{
                display: "block",
                padding: 24,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Grid Capacity Constraints and Electricity Costs</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                What grid capacity constraints are and why they can matter for electricity cost discussions.
              </p>
            </Link>
          </div>
        </section>

        <TopicClusterNav
          title="Related topic clusters"
          description="AI energy demand, price dynamics, and market structure."
          links={[
            { href: "/ai-energy-demand", label: "AI energy demand" },
            { href: "/data-center-electricity-cost", label: "Data center electricity cost" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/power-generation-mix", label: "Power generation mix" },
            { href: "/electricity-data", label: "Electricity data" },
          ]}
        />

        {/* F) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-trends">Electricity Trends</Link>
              {" — "}
              National trends and inflation
            </li>
            <li>
              <Link href="/electricity-inflation">Electricity Inflation</Link>
              {" — "}
              How prices have changed over time
            </li>
            <li>
              <Link href="/electricity-price-volatility">Electricity Price Volatility</Link>
              {" — "}
              Which states have more volatile rates
            </li>
            <li>
              <Link href="/ai-energy-demand">AI Energy Demand</Link>
              {" — "}
              Data centers, AI power consumption, electricity costs
            </li>
            <li>
              <Link href="/data-center-electricity-cost">Data Center Electricity Cost</Link>
              {" — "}
              Electricity price context for data center infrastructure
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
