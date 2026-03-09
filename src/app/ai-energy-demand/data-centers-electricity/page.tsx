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
  title: "Data Centers and Electricity Demand | PriceOfElectricity.com",
  description:
    "Why data centers consume large amounts of electricity, why AI workloads increase power demand, and why state-level electricity prices matter.",
  canonicalPath: "/ai-energy-demand/data-centers-electricity",
});

export default async function DataCentersElectricityPage() {
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
    { name: "Data Centers and Electricity", url: "/ai-energy-demand/data-centers-electricity" },
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
          <span aria-current="page">Data Centers and Electricity</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Data Centers and Electricity Demand</h1>

        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Data centers consume large amounts of electricity to power servers, cooling systems, and network
          infrastructure. As demand for cloud computing, streaming, and AI services grows, data center
          electricity use has become a significant topic in energy and grid planning.
        </p>

        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          AI workloads—training large models and running inference—can increase power demand per server
          compared to traditional computing. This has drawn attention to how data center operators manage
          electricity costs and grid capacity.
        </p>

        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Electricity cost and grid capacity matter for data center operators. Lower electricity prices
          can reduce operating costs; higher prices can influence decisions about where to build or expand
          facilities. State-level electricity prices also affect the economics of data center development and
          the affordability of power for surrounding communities.
        </p>

        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          This site focuses on electricity prices. Our state-by-state data helps explain why electricity prices
          vary and how they matter for households, businesses, and infrastructure planning.
        </p>

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
                Electricity prices vary widely by state—{derived?.highestState?.name ?? "Hawaii"} has the highest
                average rate at {derived?.highestState?.rate?.toFixed(2) ?? "—"}¢/kWh, while
                {derived?.lowestState?.name ?? "Idaho"} has the lowest at {derived?.lowestState?.rate?.toFixed(2) ?? "—"}¢/kWh.
                See our rankings for the full list.
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
              <Link href="/knowledge/rankings/most-expensive-electricity">Most Expensive Electricity</Link>
              {" — "}
              States with highest electricity rates
            </li>
            <li>
              <Link href="/knowledge/rankings/electricity-affordability">Most Affordable Electricity</Link>
              {" — "}
              States with lowest rates
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Compare rates and costs
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
