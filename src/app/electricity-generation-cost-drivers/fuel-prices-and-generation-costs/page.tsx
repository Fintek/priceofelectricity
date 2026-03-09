import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export const metadata: Metadata = buildMetadata({
  title: "Fuel Prices and Electricity Generation Costs | PriceOfElectricity.com",
  description:
    "How fuel prices can affect electricity generation economics. Systems dependent on fuel-based generation may see costs shift when fuel markets change.",
  canonicalPath: "/electricity-generation-cost-drivers/fuel-prices-and-generation-costs",
});

export default async function FuelPricesAndGenerationCostsPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as { averageRate?: number } | undefined;
  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const monthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Generation Cost Drivers", url: "/electricity-generation-cost-drivers" },
    { name: "Fuel Prices and Electricity Generation Costs", url: "/electricity-generation-cost-drivers/fuel-prices-and-generation-costs" },
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
          <Link href="/electricity-generation-cost-drivers">Generation Cost Drivers</Link>
          {" · "}
          <span aria-current="page">Fuel Prices and Generation Costs</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Fuel Prices and Electricity Generation Costs</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Many electricity systems still depend partly on fuel-based generation. Natural gas, coal, and other fuels are inputs to power production. This page explains in plain language how fuel prices can affect electricity generation economics.
          </p>
        </section>

        {/* How Fuel Prices Can Matter */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How Fuel Prices Can Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Changing fuel costs can influence operating economics for generators. When fuel prices rise, generation costs for fuel-dependent plants can increase; when they fall, costs can decrease. This can affect broader electricity-cost discussions and retail price formation. The site does not provide live fuel-price tracking or commodity data.
          </p>
        </section>

        {/* Why This Can Affect Price Stability */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Can Affect Price Stability</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Systems more exposed to fuel-cost changes can also experience changing price conditions over time. Regions with a higher share of fuel-based generation may see electricity prices move more with fuel markets. This can contribute to volatility. See <Link href="/electricity-price-volatility">electricity price volatility</Link> for state-level volatility analysis.
          </p>
        </section>

        {/* Limits */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Limits</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This page is explanatory and does not provide live fuel-price tracking. We do not introduce external commodity datasets or claim exact causal weights for cost drivers. The site provides electricity-cost context and analysis grounded in EIA residential retail data.
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
              Source: <Link href="/knowledge/national">national snapshot</Link>.
            </p>
          </section>
        )}

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/power-generation-mix/fuel-costs-and-electricity-prices">Fuel costs and electricity prices</Link></li>
            <li><Link href="/electricity-inflation">Electricity inflation</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
            <li><Link href="/electricity-generation-cost-drivers">Generation cost drivers hub</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-generation-cost-drivers">Generation cost drivers</Link> {" | "}
          <Link href="/power-generation-mix">Power generation mix</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
