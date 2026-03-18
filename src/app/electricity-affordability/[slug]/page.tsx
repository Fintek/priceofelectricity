import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import ExploreMore from "@/components/navigation/ExploreMore";

export const dynamicParams = true;
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;
const ANNUAL_USAGE_KWH = 10800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const statePage = await loadKnowledgePage("state", slug);
  if (!statePage) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-affordability/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const monthlyBill = avgRate != null ? (avgRate / 100) * MONTHLY_USAGE_KWH : null;
  const description =
    avgRate != null && monthlyBill != null
      ? `Electricity affordability in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly bill at 900 kWh: $${monthlyBill.toFixed(2)}.`
      : `Electricity affordability and cost burden in ${stateName}. Compare estimated bills and affordability.`;
  return buildMetadata({
    title: `Electricity Affordability in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-affordability/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityAffordabilityStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [statePage, nationalPage] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
  ]);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as {
    name?: string;
    avgRateCentsPerKwh?: number;
  } | undefined;
  const derived = statePage.data?.derived as {
    affordabilityIndex?: number;
    exampleBills?: { kwh500?: number; kwh1000?: number; kwh1500?: number };
    comparison?: { nationalAverage?: number; differencePercent?: number; category?: string };
    percentileRankings?: { affordabilityPercentile?: number };
  } | undefined;

  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;
  const estimatedAnnualBill = rateDollarsPerKwh * ANNUAL_USAGE_KWH;

  const nationalData = nationalPage?.data as { derived?: { averageRate?: number } } | null;
  const nationalAvg =
    typeof nationalData?.derived?.averageRate === "number" ? nationalData.derived.averageRate : null;
  let nationalMonthlyBill: number | null = null;
  let percentVsNational: number | null = null;
  if (nationalAvg != null && avgRate != null) {
    nationalMonthlyBill = (nationalAvg / 100) * MONTHLY_USAGE_KWH;
    percentVsNational =
      nationalMonthlyBill > 0
        ? ((estimatedMonthlyBill - nationalMonthlyBill) / nationalMonthlyBill) * 100
        : null;
  }

  const exampleBills = derived?.exampleBills;
  const comparison = derived?.comparison;
  const affordabilityPercentile = derived?.percentileRankings?.affordabilityPercentile;

  const canonicalPath = `/electricity-affordability/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Affordability", url: "/electricity-affordability" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Affordability in ${stateName}`,
    description:
      avgRate != null
        ? `Electricity affordability in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly bill at 900 kWh: $${estimatedMonthlyBill.toFixed(2)}.`
        : `${stateName} electricity affordability and cost burden.`,
    url: canonicalPath,
    isPartOf: "/electricity-affordability",
    about: ["electricity affordability", "electricity cost burden", "electricity affordability by state"],
  });

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <JsonLdScript data={webPageJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-affordability">Electricity Affordability</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Electricity Affordability in {stateName}
        </h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity affordability in {stateName} reflects how expensive electricity is relative to typical residential usage. This page summarizes the current rate, estimated bills, and how {stateName} compares to the national average.
          </p>
        </section>

        {/* B) Current Electricity Rate */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Current Electricity Rate</h2>
          {avgRate != null && (
            <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is{" "}
              <strong>{avgRate.toFixed(2)}¢/kWh</strong>.
            </p>
          )}
          {comparison?.category && (
            <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
              {stateName} is {comparison.category}.
            </p>
          )}
        </section>

        {/* C) Average Electricity Bill Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Estimated Electricity Bills</h2>
          {avgRate != null && (
            <>
              <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
                At 900 kWh per month—a common residential usage level—the estimated monthly bill in {stateName} is about{" "}
                <strong>${estimatedMonthlyBill.toFixed(2)}</strong>, or{" "}
                <strong>${estimatedAnnualBill.toFixed(2)}</strong> per year.
              </p>
              {percentVsNational != null && nationalMonthlyBill != null && (
                <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
                  That is {percentVsNational >= 0 ? "higher" : "lower"} than the national average estimated bill
                  (${nationalMonthlyBill.toFixed(2)}/month) by {Math.abs(percentVsNational).toFixed(1)}%.
                </p>
              )}
              {exampleBills && (
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                  {typeof exampleBills.kwh500 === "number" && (
                    <li>500 kWh: ~${exampleBills.kwh500.toFixed(2)}/month</li>
                  )}
                  {typeof exampleBills.kwh1000 === "number" && (
                    <li>1000 kWh: ~${exampleBills.kwh1000.toFixed(2)}/month</li>
                  )}
                  {typeof exampleBills.kwh1500 === "number" && (
                    <li>1500 kWh: ~${exampleBills.kwh1500.toFixed(2)}/month</li>
                  )}
                </ul>
              )}
            </>
          )}
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            See <Link href={`/average-electricity-bill/${slug}`}>average electricity bill in {stateName}</Link> for more bill estimates.
          </p>
        </section>

        {/* D) Affordability Discussion */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Affordability Context</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity cost affects household budgets differently depending on usage, income, and local rates. States with lower rates tend to have lower estimated bills and may be more affordable for typical usage levels.
          </p>
          {typeof affordabilityPercentile === "number" && (
            <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
              {stateName} ranks in the {affordabilityPercentile <= 25 ? "more affordable" : affordabilityPercentile >= 75 ? "less affordable" : "middle"} tier of states by affordability.
            </p>
          )}
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            See <Link href="/knowledge/rankings/electricity-affordability">most affordable electricity by state</Link> and{" "}
            <Link href="/knowledge/rankings/most-expensive-electricity">least affordable electricity</Link> for full rankings.
          </p>
        </section>

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-inflation/${slug}`}>Electricity inflation in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>Electricity cost calculator for {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-cost-of-living/${slug}`}>Explore electricity cost of living in {stateName}</Link>
            </li>
          </ul>
        </section>

        {/* F) National Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>National Context</h2>
          <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
            Compare electricity affordability across all states:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/electricity-affordability">Electricity Affordability in the United States</Link>
              {" — "}
              National hub for affordability analysis
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Rates and estimated costs
            </li>
            <li>
              <Link href="/electricity-insights">Electricity Insights</Link>
              {" — "}
              Most expensive and cheapest states
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Explore more"
          links={[
            { href: "/electricity-affordability", label: "Electricity affordability hub" },
            { href: `/average-electricity-bill/${slug}`, label: `Average bill in ${stateName}` },
            { href: `/electricity-cost/${slug}`, label: `Electricity cost in ${stateName}` },
            { href: "/knowledge/rankings/electricity-affordability", label: "Most affordable states" },
            { href: "/methodology/electricity-affordability", label: "Affordability methodology" },
          ]}
        />

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-affordability">Electricity Affordability</Link> {" | "}
          <Link href="/electricity-cost">Electricity Cost</Link> {" | "}
          <Link href="/average-electricity-bill">Average Bill</Link> {" | "}
          <Link href="/knowledge">Knowledge Hub</Link>
        </p>
      </main>
    </>
  );
}
