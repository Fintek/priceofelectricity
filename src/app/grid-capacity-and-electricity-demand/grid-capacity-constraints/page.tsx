import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Grid Capacity Constraints and Electricity Costs | PriceOfElectricity.com",
  description:
    "What grid capacity constraints are and why they can matter for electricity cost discussions. Explanatory authority on infrastructure pressure and electricity-cost connections.",
  canonicalPath: "/grid-capacity-and-electricity-demand/grid-capacity-constraints",
});

export default async function GridCapacityConstraintsPage() {
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
    { name: "Grid Capacity Constraints", url: "/grid-capacity-and-electricity-demand/grid-capacity-constraints" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/grid-capacity-and-electricity-demand">Grid Capacity and Electricity Demand</Link>
          {" · "}
          <span aria-current="page">Grid Capacity Constraints</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Grid Capacity Constraints and Electricity Costs</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Grid capacity constraints refer to limits on how much electricity can be generated, transmitted, or distributed at a given time. When demand approaches or exceeds available capacity—whether from generation limits, transmission bottlenecks, or distribution constraints—it can affect how electricity is delivered and priced. This page explains in plain language what grid capacity constraints are and why they can matter for electricity cost discussions.
          </p>
        </section>

        {/* B) Infrastructure Pressure and Electricity Cost */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Infrastructure Pressure and Electricity Cost</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Limited generation, transmission, or distribution flexibility can be part of cost and reliability discussions. When infrastructure is constrained, utilities and markets may need to invest in upgrades or rely on more expensive sources of power during peak demand. Over time, these factors can influence electricity prices. This site provides electricity-cost context based on historical data—not real-time grid operations.
          </p>
        </section>

        {/* C) Why Regional and State Differences Matter */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Regional and State Differences Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices vary by state and region. Infrastructure context—including generation mix, transmission costs, and local capacity—can help explain part of that variation. Our <Link href="/electricity-price-volatility">price volatility</Link>, <Link href="/electricity-affordability">affordability</Link>, and <Link href="/electricity-cost-comparison">state comparisons</Link> provide data-driven context. Understanding regional differences helps contextualize cost discussions.
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
                See our <Link href="/electricity-cost">state pages</Link> and <Link href="/electricity-price-volatility">volatility</Link> for state-level context.
              </p>
            </div>
          </section>
        )}

        {/* D) Related Data Paths on the Site */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Data Paths on the Site</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-price-volatility">Electricity Price Volatility</Link>
              {" — "}
              Which states have more volatile rates
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity Affordability</Link>
              {" — "}
              Cost burden and affordability by state
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity Cost Comparison</Link>
              {" — "}
              Compare two states side by side
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

        {/* E) Transparency / Limits */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Transparency / Limits</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides electricity-cost context and explanatory analysis based on EIA residential retail data. We do not provide real-time grid operations data, live congestion information, or utility-specific capacity conditions. Our figures are build-generated and deterministic. For real-time grid conditions, consult your utility or regional grid operator.
          </p>
        </section>

        <p style={{ marginBottom: 32 }}>
          <Link href="/grid-capacity-and-electricity-demand">← Grid Capacity and Electricity Demand</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
