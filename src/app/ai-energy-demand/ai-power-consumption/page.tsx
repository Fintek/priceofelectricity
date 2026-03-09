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
  title: "AI Power Consumption and Electricity Costs | PriceOfElectricity.com",
  description:
    "Why AI training and inference increase electricity usage and how electricity price differences by state matter for infrastructure and affordability.",
  canonicalPath: "/ai-energy-demand/ai-power-consumption",
});

export default async function AIPowerConsumptionPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    top5Highest?: Array<{ name: string; rate: number }>;
    top5Lowest?: Array<{ name: string; rate: number }>;
  } | undefined;

  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * 900;

  const top5Highest = derived?.top5Highest ?? [];
  const top5Lowest = derived?.top5Lowest ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "AI Energy Demand", url: "/ai-energy-demand" },
    { name: "AI Power Consumption", url: "/ai-energy-demand/ai-power-consumption" },
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
          <span aria-current="page">AI Power Consumption</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>AI Power Consumption and Electricity Costs</h1>

        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          AI training and inference can increase electricity usage compared to traditional computing. Training
          large models requires significant compute power over extended periods; inference—running models
          to answer queries—also consumes electricity at scale. This has drawn attention to how AI
          infrastructure affects electricity demand and costs.
        </p>

        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Electricity price differences by state matter economically. Operators building or expanding
          AI infrastructure may consider electricity costs when choosing locations. Higher electricity
          prices can increase operating costs; lower prices can reduce them. This affects infrastructure
          planning, investment decisions, and the affordability of power for households and businesses
          in regions with growing electricity demand.
        </p>

        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Rising demand can influence cost discussions, infrastructure planning, and affordability.
          This site focuses on electricity prices—our state-by-state data helps explain why prices vary
          and how they matter for different stakeholders.
        </p>

        {/* Data-driven block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Prices Matter</h2>
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
                Electricity prices vary by state—among the highest are {top5Highest.length > 0 ? top5Highest.slice(0, 3).map((s) => s.name).join(", ") : "Hawaii, California, Connecticut"};
                among the lowest are {top5Lowest.length > 0 ? top5Lowest.slice(0, 3).map((s) => s.name).join(", ") : "Idaho, North Dakota, Nebraska"}.
                See our site&apos;s state-by-state coverage for detailed rates and affordability.
              </p>
            </div>
          </section>
        )}

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
              <Link href="/electricity-cost-calculator">Electricity Cost Calculator</Link>
              {" — "}
              Usage-based cost estimates by state
            </li>
            <li>
              <Link href="/battery-recharge-cost">Battery Recharge Cost</Link>
              {" — "}
              Estimate cost to recharge a home battery by state
            </li>
            <li>
              <Link href="/knowledge">Knowledge Hub</Link>
              {" — "}
              National overview, rankings, methodology
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
