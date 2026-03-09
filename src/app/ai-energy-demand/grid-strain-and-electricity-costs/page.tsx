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
  title: "Grid Strain and Electricity Costs | PriceOfElectricity.com",
  description:
    "How rising demand, infrastructure constraints, and grid pressure can be part of electricity-cost discussions. Regional and state price differences explained.",
  canonicalPath: "/ai-energy-demand/grid-strain-and-electricity-costs",
});

export default async function GridStrainAndElectricityCostsPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    top5Highest?: Array<{ slug: string; name: string; rate: number }>;
  } | undefined;

  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * 900;
  const top5Highest = derived?.top5Highest ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "AI Energy Demand", url: "/ai-energy-demand" },
    { name: "Grid Strain and Electricity Costs", url: "/ai-energy-demand/grid-strain-and-electricity-costs" },
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
          <span aria-current="page">Grid Strain and Electricity Costs</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Grid Strain and Electricity Costs</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Grid strain refers to pressure on the electric grid when demand approaches or exceeds available capacity. Transmission constraints, generation limits, and localized congestion can affect how electricity is delivered and priced. This page explains how rising demand and infrastructure constraints can be part of electricity-cost discussions—without making unsupported claims about live grid conditions.
          </p>
        </section>

        {/* B) Why Demand Can Influence Electricity Cost Discussions */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Demand Can Influence Electricity Cost Discussions</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            When demand grows—whether from residential use, commercial activity, or data centers—it can influence how electricity markets and utilities plan for capacity, transmission, and pricing. Higher demand in a region may lead to different cost outcomes over time. This site focuses on electricity prices as reported in historical data, not real-time grid monitoring.
          </p>
        </section>

        {/* C) Why Regional and State Price Differences Matter */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Regional and State Price Differences Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices vary by region and state. Generation mix, transmission costs, regulations, and local demand all contribute. Understanding these differences helps contextualize cost discussions and affordability. Our state-by-state data provides electricity-cost context that can inform broader discussions about demand, infrastructure, and pricing.
          </p>
        </section>

        {/* D) How to Explore the Site's Data */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to Explore the Site&apos;s Data</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-cost">Electricity cost by state</Link>
              {" — "}
              Average rates and estimated bills
            </li>
            <li>
              <Link href="/electricity-inflation">Electricity inflation</Link>
              {" — "}
              How prices have changed over time
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity affordability</Link>
              {" — "}
              Cost burden and affordability rankings
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity cost comparison</Link>
              {" — "}
              Compare two states side by side
            </li>
          </ul>
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
                Among the highest-cost states are {top5Highest.length > 0 ? top5Highest.slice(0, 3).map((s) => s.name).join(", ") : "Hawaii, California, Connecticut"}.
                See our <Link href="/knowledge/rankings/most-expensive-electricity">rankings</Link> and <Link href="/electricity-cost">state pages</Link> for detailed data.
              </p>
            </div>
          </section>
        )}

        {/* E) Methodology / Limits */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Methodology / Limits</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides electricity-cost context based on EIA residential retail data. We do not provide live grid monitoring, real-time congestion data, or operational grid status. Our figures are build-generated and deterministic. For real-time grid conditions, consult your utility or regional grid operator.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
