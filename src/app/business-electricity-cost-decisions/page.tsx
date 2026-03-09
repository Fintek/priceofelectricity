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
  title: "Business Electricity Cost Decisions | PriceOfElectricity.com",
  description:
    "How electricity prices can influence business planning and location decisions. Explore electricity cost context for businesses comparing states or budgeting operating costs.",
  canonicalPath: "/business-electricity-cost-decisions",
});

export default async function BusinessElectricityCostDecisionsPage() {
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
          <span aria-current="page">Business Electricity Cost Decisions</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Business Electricity Cost Decisions</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity is a recurring operating cost for many businesses. This section explains how electricity prices can influence business planning and location decisions—using state-level electricity price context as a baseline for understanding cost differences across regions.
          </p>
        </section>

        {/* B) Why Electricity Prices Matter for Businesses */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Electricity Prices Matter for Businesses</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity costs can matter more for some businesses than others—especially those with refrigeration, extended hours, equipment loads, warehousing, or computing needs. Higher electricity rates increase operating costs; lower rates reduce them. State-level electricity price context helps illustrate the scale of cost differences across regions.
          </p>
        </section>

        {/* C) National Context Block */}
        {nationalAvgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Electricity Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The U.S. national average residential electricity rate is {nationalAvgRate.toFixed(2)} ¢/kWh.
              {nationalMonthlyBill != null && (
                <> At 900 kWh monthly usage, that represents a baseline of about ${nationalMonthlyBill.toFixed(0)} per month. Actual commercial rates vary by utility, service class, and demand.</>
              )}
            </p>
            <p style={{ margin: 0 }}>
              <Link href="/electricity-data">Electricity data</Link>
              {" — "}
              Datasets and methodology
            </p>
          </section>
        )}

        {/* D) Explore This Section */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore This Section</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/business-electricity-options">Explore business electricity options by state</Link>
              {" — "}
              State-level context for evaluating business electricity options
            </li>
            <li>
              <Link href="/business-electricity-cost-decisions/choosing-a-state-for-electricity-costs">
                Choosing a state based on electricity costs
              </Link>
              {" — "}
              How state electricity prices can be part of location decision-making
            </li>
            <li>
              <Link href="/business-electricity-cost-decisions/electricity-costs-for-small-businesses">
                Electricity costs for small businesses
              </Link>
              {" — "}
              How electricity costs can affect small business budgeting
            </li>
          </ul>
        </section>

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/data-center-electricity-cost">Data center electricity cost</Link>
              {" — "}
              Electricity price context for data centers and AI infrastructure
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity cost comparison</Link>
              {" — "}
              Compare electricity prices between states
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity affordability</Link>
              {" — "}
              How electricity costs vary by state
            </li>
            <li>
              <Link href="/electricity-data">Electricity data</Link>
              {" — "}
              Datasets and methodology
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
