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
  title: "Power Demand Growth and Electricity Prices | PriceOfElectricity.com",
  description:
    "How rising electricity demand can matter for electricity prices. Plain-language explanation of demand growth, infrastructure needs, and electricity-cost connections.",
  canonicalPath: "/grid-capacity-and-electricity-demand/power-demand-growth",
});

export default async function PowerDemandGrowthPage() {
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
    { name: "Power Demand Growth", url: "/grid-capacity-and-electricity-demand/power-demand-growth" },
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
          <span aria-current="page">Power Demand Growth</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Power Demand Growth and Electricity Prices</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Power demand growth means the total amount of electricity consumed is increasing over time. This can come from population growth, economic activity, electrification of vehicles and buildings, data centers, AI infrastructure, and industrial expansion. This page explains in plain language how rising electricity demand can matter for electricity prices.
          </p>
        </section>

        {/* B) Why Demand Can Affect Electricity Costs */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Demand Can Affect Electricity Costs</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Higher demand can influence infrastructure needs, system stress, and cost discussions. When demand grows faster than capacity, utilities and markets may need to invest in new generation, transmission, or distribution. Those investments can be reflected in electricity prices over time. This site provides historical electricity-cost context—not forecasts or real-time demand data.
          </p>
        </section>

        {/* C) Why This Matters for States */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for States</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            States can face different electricity-cost outcomes depending on their price structure and infrastructure context. Some states have seen rapid demand growth from data centers or industry; others have more stable demand. Our <Link href="/electricity-cost">electricity cost by state</Link> and <Link href="/electricity-price-volatility">price volatility</Link> pages provide data-driven context. Demand growth is one factor among many that can influence outcomes.
          </p>
        </section>

        {/* D) National Electricity Price Context */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Electricity Price Context</h2>
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
                See <Link href="/electricity-cost">electricity cost by state</Link>, <Link href="/electricity-inflation">inflation</Link>, and <Link href="/knowledge/rankings/volatility-5y">volatility rankings</Link> for more context.
              </p>
            </div>
          </section>
        )}

        {/* E) Related Pages */}
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
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              State-level rates and estimated costs
            </li>
            <li>
              <Link href="/ai-energy-demand/electricity-prices-and-ai">Electricity Prices and AI Infrastructure</Link>
              {" — "}
              How AI expansion can matter for electricity prices
            </li>
            <li>
              <Link href="/data-center-electricity-cost">Data Center Electricity Cost</Link>
              {" — "}
              Electricity price context for data center infrastructure
            </li>
          </ul>
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
