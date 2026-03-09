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
  title: "Electricity Prices and AI Infrastructure | PriceOfElectricity.com",
  description:
    "How AI infrastructure expansion can matter for electricity prices and why electricity-cost analysis matters in that context. State-level rate differences and national context.",
  canonicalPath: "/ai-energy-demand/electricity-prices-and-ai",
});

export default async function ElectricityPricesAndAIPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    highestState?: { slug?: string; name?: string; rate?: number };
    lowestState?: { slug?: string; name?: string; rate?: number };
  } | undefined;

  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * 900;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "AI Energy Demand", url: "/ai-energy-demand" },
    { name: "Electricity Prices and AI", url: "/ai-energy-demand/electricity-prices-and-ai" },
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
          <span aria-current="page">Electricity Prices and AI</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Prices and AI Infrastructure</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            AI requires computing infrastructure, and computing infrastructure requires power. Large-scale AI training and inference run on data centers that consume significant electricity. Understanding electricity prices helps explain the economics of AI infrastructure and why location matters.
          </p>
        </section>

        {/* B) Why Electricity Prices Matter for AI */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Prices Matter for AI</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity is an operating-cost input for large-scale computing and data centers. Higher electricity prices increase the cost of running AI workloads; lower prices reduce it. Operators making siting and expansion decisions often consider electricity costs alongside other factors such as grid reliability and cooling requirements.
          </p>
        </section>

        {/* C) Why State-Level Electricity Prices Matter */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why State-Level Electricity Prices Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices vary by state. Generation mix, transmission costs, regulations, and demand all contribute to these differences. States with lower average rates can be more attractive for power-intensive operations; states with higher rates may face different economic tradeoffs. Our state-by-state data helps explain these variations.
          </p>
        </section>

        {/* D) National Context */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Context</h2>
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
                At 900 kWh per month—a common residential usage level—that translates to an estimated bill of about $<strong>{estimatedMonthlyBill.toFixed(2)}</strong>.
                Electricity prices vary widely by state: {derived?.highestState?.name ?? "Hawaii"} has the highest average rate at {derived?.highestState?.rate?.toFixed(2) ?? "—"}¢/kWh, while {derived?.lowestState?.name ?? "Idaho"} has the lowest at {derived?.lowestState?.rate?.toFixed(2) ?? "—"}¢/kWh.
                See our <Link href="/electricity-cost">electricity cost by state</Link> and <Link href="/knowledge/rankings/most-expensive-electricity">rankings</Link> for detailed data.
              </p>
            </div>
          </section>
        )}

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
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
              <Link href="/electricity-inflation">Electricity Inflation</Link>
              {" — "}
              How prices have changed over time
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Compare rates and costs
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
