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
  title: "Choosing a State Based on Electricity Costs | PriceOfElectricity.com",
  description:
    "How state electricity prices can be part of business location decision-making. Compare electricity costs across states when evaluating where to relocate or expand.",
  canonicalPath: "/business-electricity-cost-decisions/choosing-a-state-for-electricity-costs",
});

export default async function ChoosingAStateForElectricityCostsPage() {
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
    { name: "Choosing a State Based on Electricity Costs", url: "/business-electricity-cost-decisions/choosing-a-state-for-electricity-costs" },
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
          <span aria-current="page">Choosing a State</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Choosing a State Based on Electricity Costs</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Businesses comparing states may care about differences in electricity prices. Recurring electricity costs can affect operating budgets over time. This page explains how to use the site&apos;s state-level electricity data as part of location decision-making.
          </p>
        </section>

        {/* B) Why State Electricity Prices Can Matter */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why State Electricity Prices Can Matter</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Recurring electricity costs can affect operating budgets over time. States with higher average electricity rates can mean higher monthly electricity bills for the same usage; lower rates mean lower bills. For businesses with significant electricity needs, state-level price context can be one factor in location decisions.
          </p>
        </section>

        {/* C) How to Use the Site for Comparison */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to Use the Site for Comparison</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/data-center-electricity-cost">Data center electricity cost</Link>
              {" — "}
              Electricity price context for large computing infrastructure
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity cost comparison</Link>
              {" — "}
              Compare two states side by side
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity affordability</Link>
              {" — "}
              How electricity costs vary by state
            </li>
            <li>
              <Link href="/electricity-price-volatility">Electricity price volatility</Link>
              {" — "}
              Which states have more volatile electricity prices
            </li>
            <li>
              <Link href="/electricity-inflation">Electricity inflation</Link>
              {" — "}
              How electricity prices have changed over time
            </li>
          </ul>
        </section>

        {/* D) National Context Block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The U.S. national average residential rate is {nationalAvgRate.toFixed(2)} ¢/kWh.
              {nationalMonthlyBill != null && (
                <> At 900 kWh monthly usage, that represents about ${nationalMonthlyBill.toFixed(0)} per month. State rates vary widely.</>
              )}
            </p>
            <p style={{ margin: 0 }}>
              <Link href="/electricity-cost">Electricity cost by state</Link>
              {" — "}
              Compare rates and estimated costs
            </p>
          </section>
        )}

        {/* E) Limits */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Limits</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This site provides state-level electricity context, not complete business cost modeling. Actual commercial rates depend on utility territory, service class, demand charges, and contracts. Use state-level data as a baseline for understanding regional differences—not as a substitute for utility-specific quotes.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
