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
  title: "Fuel Costs and Electricity Prices | PriceOfElectricity.com",
  description:
    "How fuel costs can influence electricity prices. Electricity systems more exposed to fuel-cost changes may see more pressure on electricity prices.",
  canonicalPath: "/power-generation-mix/fuel-costs-and-electricity-prices",
});

export default async function FuelCostsAndElectricityPricesPage() {
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
    { name: "Power Generation Mix", url: "/power-generation-mix" },
    { name: "Fuel Costs and Electricity Prices", url: "/power-generation-mix/fuel-costs-and-electricity-prices" },
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
          <Link href="/power-generation-mix">Power Generation Mix</Link>
          {" · "}
          <span aria-current="page">Fuel Costs and Electricity Prices</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Fuel Costs and Electricity Prices</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Fuel can be a major input cost for electricity generation. When natural gas, coal, or other fuel prices rise, electricity prices in regions that rely on those fuels may respond. This page explains how fuel cost sensitivity can matter for electricity prices and state-level differences.
          </p>
        </section>

        {/* B) Why Fuel Cost Sensitivity Matters */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Fuel Cost Sensitivity Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity systems more exposed to fuel-cost changes may see more pressure on electricity-price discussions. Regions with a higher share of fuel-based generation may experience price volatility when fuel markets move. This is one factor among many—transmission, regulation, and demand also matter.
          </p>
        </section>

        {/* C) Why This Matters for States */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for States</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity price differences between states may partly reflect different generation contexts. States with different fuel mixes, market structures, and infrastructure may see different price levels and stability. This site provides electricity-cost context; we do not publish detailed generation mix or fuel-cost data by state.
          </p>
        </section>

        {/* D) National Electricity Context */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Electricity Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              Current national average residential electricity rate and estimated monthly bill at 900 kWh:
            </p>
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
                {derived?.highestState && (
                  <li>
                    <strong>Highest state:</strong>{" "}
                    <Link href={`/electricity-cost/${derived.highestState.slug}`}>
                      {derived.highestState.name}
                    </Link>
                    {" "}({derived.highestState.rate?.toFixed(2)}¢/kWh)
                  </li>
                )}
                {derived?.lowestState && (
                  <li>
                    <strong>Lowest state:</strong>{" "}
                    <Link href={`/electricity-cost/${derived.lowestState.slug}`}>
                      {derived.lowestState.name}
                    </Link>
                    {" "}({derived.lowestState.rate?.toFixed(2)}¢/kWh)
                  </li>
                )}
              </ul>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Source: <Link href="/knowledge/national">national snapshot</Link>. Data from EIA residential retail sales.
            </p>
          </section>
        )}

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-trends">Electricity trends</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/power-generation-mix">Power generation mix hub</Link></li>
            <li><Link href="/electricity-data">Electricity data</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/power-generation-mix">Power generation mix</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/electricity-cost">Electricity cost</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
