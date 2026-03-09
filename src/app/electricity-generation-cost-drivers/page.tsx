import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Generation Cost Drivers | PriceOfElectricity.com",
  description:
    "Major forces that can influence electricity generation costs and electricity prices. Fuel costs, infrastructure, and delivery systems.",
  canonicalPath: "/electricity-generation-cost-drivers",
});

export default async function ElectricityGenerationCostDriversPage() {
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
  const monthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Generation Cost Drivers", url: "/electricity-generation-cost-drivers" },
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
          <span aria-current="page">Generation Cost Drivers</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Generation Cost Drivers</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices reflect more than just consumer demand. Generation costs can be influenced by multiple underlying factors—fuel costs, infrastructure investment, grid constraints, and policy. This section explains the major forces that can influence electricity generation costs and, in turn, electricity prices.
          </p>
        </section>

        {/* National context block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Electricity Context</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>
                  <strong>National average rate:</strong> {nationalAvgRate.toFixed(2)}¢/kWh
                </li>
                <li>
                  <strong>Estimated monthly bill at 900 kWh:</strong> ${monthlyBill.toFixed(2)}
                </li>
              </ul>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Source: <Link href="/knowledge/national">national snapshot</Link>. See <Link href="/electricity-inflation">electricity inflation</Link> and <Link href="/electricity-price-volatility">electricity price volatility</Link> for trends.
            </p>
          </section>
        )}

        {/* Fuel Prices */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Fuel Prices</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Fuel costs can influence generation economics for systems dependent on fuel-based power generation. Natural gas, coal, and other fuels are inputs to electricity production; when fuel prices change, generation costs can shift. This site does not track real-time fuel prices.
          </p>
        </section>

        {/* Infrastructure and Delivery */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Infrastructure and Delivery</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Generation costs are only part of the story. Infrastructure and grid systems—transmission, distribution, and system buildout—can affect electricity economics too. Investment needs, transmission constraints, and grid upgrades can be part of electricity-cost discussions.
          </p>
        </section>

        {/* Why This Matters for Consumers and Businesses */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for Consumers and Businesses</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            These cost drivers can affect price levels, volatility, and affordability. Households and businesses in regions with higher generation or infrastructure costs may face higher electricity bills. Understanding cost drivers helps with budgeting and planning.
          </p>
        </section>

        {/* Explore This Section */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore This Section</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/electricity-generation-cost-drivers/fuel-prices-and-generation-costs">Fuel Prices and Electricity Generation Costs</Link>
              {" — "}
              How fuel prices can affect generation economics
            </li>
            <li>
              <Link href="/electricity-generation-cost-drivers/infrastructure-and-electricity-costs">Infrastructure and Electricity Costs</Link>
              {" — "}
              How infrastructure influences electricity costs
            </li>
          </ul>
        </section>

        <TopicClusterNav
          title="Related topic clusters"
          description="Power generation mix, markets, pricing dynamics, and data."
          links={[
            { href: "/power-generation-mix", label: "Power generation mix" },
            { href: "/electricity-markets", label: "Electricity market structures" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-data", label: "Electricity data" },
          ]}
        />

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-trends">Electricity trends</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/power-generation-mix">Power generation mix</Link></li>
            <li><Link href="/electricity-markets">Electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-topics">Electricity topics</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/power-generation-mix">Power generation mix</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
