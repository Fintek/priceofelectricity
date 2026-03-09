import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage, loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export async function generateStaticParams() {
  const index = await loadEntityIndex();
  return index.entities
    .filter((e) => e.type === "state")
    .map((e) => ({ slug: e.slug }));
}

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
      canonicalPath: `/electricity-cost-of-living/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const monthlyBill = avgRate != null ? (avgRate / 100) * MONTHLY_USAGE_KWH : null;
  const description =
    avgRate != null && monthlyBill != null
      ? `Electricity cost of living in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly bill at 900 kWh: $${monthlyBill.toFixed(2)}.`
      : `Electricity's role in cost of living in ${stateName}. Compare estimated bills and national context.`;
  return buildMetadata({
    title: `Electricity Cost of Living in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-cost-of-living/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityCostOfLivingStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [statePage, nationalPage, release] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
    getRelease(),
  ]);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as {
    name?: string;
    avgRateCentsPerKwh?: number;
  } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

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

  const canonicalPath = `/electricity-cost-of-living/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost of Living", url: "/electricity-cost-of-living" },
    { name: stateName, url: canonicalPath },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-cost-of-living">Electricity Cost of Living</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Cost of Living in {stateName}</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity is one component of cost of living in {stateName}. This page explains how electricity prices affect household budgets in the state and how they compare to national context.
          </p>
        </section>

        {/* B) Current Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Current Electricity Price Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is <strong>{avgRate.toFixed(2)} ¢/kWh</strong>.
            </p>
          </section>
        )}

        {/* C) Estimated Monthly Electricity Cost */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Estimated Monthly Electricity Cost</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                At 900 kWh per month, the estimated monthly electricity bill in {stateName} is about <strong>${estimatedMonthlyBill.toFixed(2)}</strong>.
              </p>
            </div>
          </section>
        )}

        {/* D) National Comparison */}
        {nationalMonthlyBill != null && percentVsNational != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Comparison</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The national average estimated monthly bill at 900 kWh is about ${nationalMonthlyBill.toFixed(2)}.
              {percentVsNational > 0 && (
                <> The estimated bill in {stateName} is about {percentVsNational.toFixed(1)}% higher than the national average.</>
              )}
              {percentVsNational < 0 && (
                <> The estimated bill in {stateName} is about {Math.abs(percentVsNational).toFixed(1)}% lower than the national average.</>
              )}
              {Math.abs(percentVsNational) < 0.5 && (
                <> The estimated bill in {stateName} is roughly in line with the national average.</>
              )}
            </p>
          </section>
        )}

        {/* E) Cost-of-Living Interpretation */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Cost-of-Living Interpretation</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            {percentVsNational != null && percentVsNational > 5
              ? `Electricity in ${stateName} appears relatively more expensive than the national average. Households with similar usage may pay more for electricity here.`
              : percentVsNational != null && percentVsNational < -5
                ? `Electricity in ${stateName} appears relatively cheaper than the national average. Households with similar usage may pay less for electricity here.`
                : `Electricity in ${stateName} is roughly in line with national averages. Household electricity costs here are neither notably high nor low compared to the U.S. as a whole.`}
          </p>
          <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "65ch", fontSize: 14 }}>
            This analysis focuses on electricity only. Other cost-of-living factors (housing, taxes, groceries, etc.) are not included.
          </p>
        </section>

        {/* F) Related Pages */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link>
            </li>
            <li>
              <Link href={`/moving-to-electricity-cost/${slug}`}>Electricity cost when moving to {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-inflation/${slug}`}>Electricity inflation in {stateName}</Link>
            </li>
          </ul>
        </section>

        {/* G) National Hub Link */}
        <p style={{ marginBottom: 32 }}>
          <Link href="/electricity-cost-of-living">← All states: Electricity Cost of Living</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
