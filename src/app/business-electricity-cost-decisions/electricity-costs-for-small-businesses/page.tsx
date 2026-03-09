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
  title: "Electricity Costs for Small Businesses | PriceOfElectricity.com",
  description:
    "How electricity costs can affect small business budgeting. State-level electricity price context for lighting, HVAC, refrigeration, equipment, and office operations.",
  canonicalPath: "/business-electricity-cost-decisions/electricity-costs-for-small-businesses",
});

export default async function ElectricityCostsForSmallBusinessesPage() {
  const [nationalPage, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    medianRate?: number;
  } | undefined;
  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const MONTHLY_USAGE_KWH = 900;
  const nationalMonthlyBill =
    nationalAvgRate != null ? (nationalAvgRate / 100) * MONTHLY_USAGE_KWH : null;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Business Electricity Cost Decisions", url: "/business-electricity-cost-decisions" },
    { name: "Electricity Costs for Small Businesses", url: "/business-electricity-cost-decisions/electricity-costs-for-small-businesses" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/business-electricity-cost-decisions">Business Electricity Cost Decisions</Link>
          {" · "}
          <span aria-current="page">Electricity Costs for Small Businesses</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Costs for Small Businesses</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity is often a recurring monthly business expense. This page explains how electricity costs can affect small business budgeting and how to use state-level electricity price context as a baseline for understanding regional differences.
          </p>
        </section>

        {/* B) Illustrative Usage Context */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Illustrative Usage Context</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Without claiming tariff precision, small businesses may care about electricity costs for lighting, HVAC, refrigeration, equipment, and office operations. Higher electricity rates mean higher monthly bills for the same usage; lower rates mean lower bills. State-level electricity price context helps illustrate the scale of cost differences across regions.
          </p>
        </section>

        {/* C) How to Estimate State-Level Context */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to Estimate State-Level Context</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/data-center-electricity-cost">Data center electricity cost</Link>
              {" — "}
              Electricity price context for large computing infrastructure
            </li>
            <li>
              <Link href="/electricity-cost">Electricity cost by state</Link>
              {" — "}
              State-level rates and estimated costs
            </li>
            <li>
              <Link href="/electricity-cost-calculator">Electricity cost calculator</Link>
              {" — "}
              Estimate bills at different usage levels
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity affordability</Link>
              {" — "}
              How electricity costs vary by state
            </li>
          </ul>
        </section>

        {/* D) Why Volatility and Inflation Matter */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Volatility and Inflation Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices can change over time. Understanding inflation and volatility can help with long-term budgeting.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/electricity-inflation">Electricity inflation</Link>
              {" — "}
              How electricity prices have changed over time
            </li>
            <li>
              <Link href="/electricity-price-volatility">Electricity price volatility</Link>
              {" — "}
              Which states have more volatile electricity prices
            </li>
          </ul>
        </section>

        {/* E) National Context Block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The U.S. national average residential rate is {nationalAvgRate.toFixed(2)} ¢/kWh.
              {nationalMonthlyBill != null && (
                <> At 900 kWh monthly usage, that represents about ${nationalMonthlyBill.toFixed(0)} per month. State rates vary widely.</>
              )}
            </p>
          </section>
        )}

        {/* F) Transparency */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Transparency</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Actual commercial bills may differ based on demand charges, service class, utility territory, contracts, and business type. This site uses state-level residential electricity rates as context—not as a substitute for utility-specific commercial quotes.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
