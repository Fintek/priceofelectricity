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
  title: "Why Electricity Prices Differ by Region | PriceOfElectricity.com",
  description:
    "Why electricity pricing is not uniform across the United States. Generation mix, fuel costs, grid infrastructure, and market design drive regional price variation.",
  canonicalPath: "/regional-electricity-markets/why-electricity-prices-differ-by-region",
});

export default async function WhyElectricityPricesDifferByRegionPage() {
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
    { name: "Regional Electricity Markets", url: "/regional-electricity-markets" },
    { name: "Why Electricity Prices Differ by Region", url: "/regional-electricity-markets/why-electricity-prices-differ-by-region" },
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
          <Link href="/regional-electricity-markets">Regional Electricity Markets</Link>
          {" · "}
          <span aria-current="page">Why Prices Differ by Region</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Why Electricity Prices Differ by Region</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity pricing is not uniform across the country. State-level rates can vary by a factor of three or more. Understanding why prices differ by region can help households and businesses plan for electricity costs and make informed decisions.
          </p>
        </section>

        {/* Key Drivers */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Key Drivers</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Generation mix</strong> — Regions with different fuel sources (natural gas, coal, nuclear, hydropower, renewables) face different cost structures.</li>
            <li><strong>Fuel costs</strong> — Proximity to fuel sources and fuel market conditions affect generation costs.</li>
            <li><strong>Grid infrastructure</strong> — Transmission and distribution investment varies by region; older or constrained infrastructure can add costs.</li>
            <li><strong>Market design</strong> — Organized wholesale markets vs. regulated utilities can lead to different price formation.</li>
          </ul>
        </section>

        {/* Why This Matters for Households and Businesses */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why This Matters for Households and Businesses</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Regional price differences directly affect electricity bills. Households in higher-cost regions pay more for the same usage. Businesses considering location or expansion may factor electricity costs into decisions. Understanding regional variation helps with budgeting and planning.
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
              Source: <Link href="/knowledge/national">national snapshot</Link>. Compare <Link href="/electricity-cost">electricity costs by state</Link>.
            </p>
          </section>
        )}

        {/* Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-cost-of-living">Electricity cost of living</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/regional-electricity-markets">Regional electricity markets hub</Link></li>
          </ul>
        </section>

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/regional-electricity-markets">Regional electricity markets</Link> {" | "}
          <Link href="/electricity-cost">Electricity cost</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/site-map">Site map</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
