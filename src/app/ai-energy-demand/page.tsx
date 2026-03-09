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
import MiniBarChart from "@/components/charts/MiniBarChart";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "AI Energy Demand and Electricity Prices | PriceOfElectricity.com",
  description:
    "How AI infrastructure and data centers affect electricity demand and costs. Explore the electricity-cost implications of AI energy demand.",
  canonicalPath: "/ai-energy-demand",
});

export default async function AIEnergyDemandPage() {
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
  const chartRows = top5Highest.map((s) => ({ label: s.name, value: s.rate }));
  const hasChartData = chartRows.length >= 2;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "AI Energy Demand", url: "/ai-energy-demand" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">AI Energy Demand</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>AI Energy Demand and Electricity Prices</h1>

        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          AI infrastructure and data centers are increasing electricity demand in many regions. This section
          focuses on the electricity-cost implications of these trends—how rising demand connects to the
          site&apos;s core mission of understanding electricity prices and affordability.
        </p>

        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          We explore data center electricity use, AI power consumption, and why state-level electricity
          prices matter for understanding the economics of AI infrastructure.
        </p>

        {/* Subpage cards */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            <Link
              href="/ai-energy-demand/data-centers-electricity"
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
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Data Centers and Electricity Demand</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                Why data centers consume large amounts of electricity and why state-level electricity prices matter.
              </p>
            </Link>
            <Link
              href="/ai-energy-demand/ai-power-consumption"
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
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>AI Power Consumption and Electricity Costs</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                Why AI training and inference increase electricity usage and how electricity prices matter.
              </p>
            </Link>
            <Link
              href="/ai-energy-demand/electricity-prices-and-ai"
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
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Electricity Prices and AI Infrastructure</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                How AI infrastructure expansion can matter for electricity prices and why electricity-cost analysis matters.
              </p>
            </Link>
            <Link
              href="/ai-energy-demand/grid-strain-and-electricity-costs"
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
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>Grid Strain and Electricity Costs</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                How rising demand, infrastructure constraints, and grid pressure can be part of electricity-cost discussions.
              </p>
            </Link>
          </div>
        </section>

        {/* Data-driven block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 32 }}>
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
                Electricity prices vary by state—see the chart below and our rankings for state-by-state data.
              </p>
            </div>
          </section>
        )}

        {/* Chart - top 5 most expensive states */}
        {hasChartData && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Top 5 Most Expensive States (¢/kWh)</h2>
            <MiniBarChart
              rows={chartRows}
              title="Highest electricity rates by state"
              subtitle="¢/kWh — data from national dataset"
              formatValue={(v) => `${v.toFixed(2)}¢`}
              minValue={0}
              ariaLabel="Top 5 most expensive electricity states"
            />
          </section>
        )}

        <TopicClusterNav
          title="Related topic clusters"
          description="Data centers, grid capacity, electricity data, and trends."
          links={[
            { href: "/data-center-electricity-cost", label: "Data center electricity cost" },
            { href: "/grid-capacity-and-electricity-demand", label: "Grid capacity and electricity demand" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/electricity-trends", label: "Electricity trends" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-topics", label: "Electricity topics hub" },
          ]}
        />

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-trends">Electricity Price Trends</Link>
              {" — "}
              National trends and inflation
            </li>
            <li>
              <Link href="/electricity-insights">National Electricity Insights</Link>
              {" — "}
              Price conditions, affordability, inflation
            </li>
            <li>
              <Link href="/knowledge">Knowledge Hub</Link>
              {" — "}
              National overview, rankings, methodology
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Compare rates and costs
            </li>
            <li>
              <Link href="/grid-capacity-and-electricity-demand">Explore grid capacity and electricity demand</Link>
              {" — "}
              How power demand growth and grid capacity constraints connect to electricity prices
            </li>
            <li>
              <Link href="/data-center-electricity-cost">Explore data center electricity costs by state</Link>
              {" — "}
              Electricity price context for AI infrastructure
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
