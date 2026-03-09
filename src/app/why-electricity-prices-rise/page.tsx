import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Why Electricity Prices Rise | PriceOfElectricity.com",
  description:
    "High-level factors that can contribute to electricity price increases: fuel costs, infrastructure investment, demand, and market conditions.",
  canonicalPath: "/why-electricity-prices-rise",
});

export default async function WhyElectricityPricesRisePage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    trends?: { avgRateCentsPerKwh?: { values?: number[] } };
  } | undefined;
  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const MONTHLY_USAGE_KWH = 900;
  const nationalMonthlyBill =
    nationalAvgRate != null ? (nationalAvgRate / 100) * MONTHLY_USAGE_KWH : null;
  const trendValues = derived?.trends?.avgRateCentsPerKwh?.values ?? [];
  const hasRisingTrend = trendValues.length >= 2 &&
    typeof trendValues[trendValues.length - 1] === "number" &&
    typeof trendValues[trendValues.length - 2] === "number" &&
    (trendValues[trendValues.length - 1] as number) > (trendValues[trendValues.length - 2] as number);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Why Electricity Prices Rise", url: "/why-electricity-prices-rise" },
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
          <span aria-current="page">Why Electricity Prices Rise</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Why Electricity Prices Rise</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices can change over time. This page explains high-level factors that can contribute to electricity price increases—without claiming to predict future prices or attribute specific causes to any single state or period.
          </p>
        </section>

        {/* B) Common Factors */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Common Factors</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Fuel costs</strong> — Natural gas, coal, and other fuels used for generation can affect wholesale electricity prices.</li>
            <li><strong>Infrastructure investment</strong> — Grid upgrades, transmission, and reliability investments can influence retail rates.</li>
            <li><strong>Electricity demand</strong> — Higher demand can put upward pressure on prices, especially during peak periods.</li>
            <li><strong>Market conditions</strong> — Regional market structure, regulation, and supply-demand balance can affect pricing.</li>
          </ul>
        </section>

        {/* C) National Context Block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The U.S. national average residential electricity rate is {nationalAvgRate.toFixed(2)} ¢/kWh.
              {nationalMonthlyBill != null && (
                <> At 900 kWh monthly usage, that represents about ${nationalMonthlyBill.toFixed(0)} per month.</>
              )}
              {hasRisingTrend && " Recent national trends show upward movement in average rates."}
            </p>
            <p style={{ margin: 0 }}>
              <Link href="/electricity-inflation">Electricity inflation</Link>
              {" — "}
              How electricity prices have changed over time
            </p>
          </section>
        )}

        {/* D) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-inflation">Electricity inflation</Link> — How electricity prices have changed over time</li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link> — Which states have more volatile electricity prices</li>
            <li><Link href="/electricity-generation-cost-drivers">Electricity generation cost drivers</Link> — Fuel costs, infrastructure, and cost drivers</li>
            <li><Link href="/power-generation-mix">Power generation mix</Link> — How fuel mix and generation context can influence prices</li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
