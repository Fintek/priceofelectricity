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
      canonicalPath: `/solar-vs-grid-electricity-cost/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description = `Grid electricity price context for solar economics in ${stateName}. State electricity rates and estimated monthly bill at 900 kWh.`;
  return buildMetadata({
    title: `Solar vs Grid Electricity Cost in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/solar-vs-grid-electricity-cost/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function SolarVsGridElectricityCostStatePage({
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
  if (nationalAvg != null && avgRate != null) {
    nationalMonthlyBill = (nationalAvg / 100) * MONTHLY_USAGE_KWH;
  }

  const canonicalPath = `/solar-vs-grid-electricity-cost/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Solar vs Grid Electricity Cost", url: "/solar-vs-grid-electricity-cost" },
    { name: stateName, url: canonicalPath },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/solar-vs-grid-electricity-cost">Solar vs Grid Electricity Cost</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Solar vs Grid Electricity Cost in {stateName}</h1>

        {/* A) State Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is <strong>{avgRate.toFixed(2)} ¢/kWh</strong>.
              This provides baseline context for grid electricity costs in the state. Rooftop solar offsets grid consumption—higher grid rates generally increase the potential financial value of solar.
            </p>
          </section>
        )}

        {/* B) Monthly Household Electricity Cost Baseline */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Monthly Household Electricity Cost Baseline</h2>
            <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
              Using standard 900 kWh monthly usage. Grid electricity cost that solar could offset.
            </p>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                At 900 kWh per month, the estimated monthly grid electricity bill in {stateName} is about <strong>${estimatedMonthlyBill.toFixed(2)}</strong>.
              </p>
            </div>
          </section>
        )}

        {/* C) Solar Economics Context */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Solar Economics Context</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Rooftop solar offsets grid electricity consumption. Higher electricity prices increase the potential financial value of solar electricity—each kWh produced by solar avoids paying the grid rate. This page provides <strong>grid electricity price context</strong> only. It does not estimate solar production, system size, or installation cost.
          </p>
        </section>

        {/* D) National Comparison */}
        {nationalAvg != null && avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Comparison</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The national average residential rate is {nationalAvg.toFixed(2)}¢/kWh. At that rate, a 900 kWh monthly bill would be about ${nationalMonthlyBill != null ? nationalMonthlyBill.toFixed(2) : "—"}. {stateName}&apos;s rate is {avgRate > nationalAvg ? "higher" : "lower"} than the national average, which generally means solar may have {avgRate > nationalAvg ? "greater" : "less"} potential value in {stateName} compared to the U.S. average.
            </p>
          </section>
        )}

        {/* E) Transparency */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Transparency</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This page does not estimate solar production, solar installation cost, or payback periods. It provides <strong>grid electricity price context</strong> relevant to solar economics—the rates and estimated bills that solar could offset. Actual solar economics depend on system size, orientation, shading, incentives, and many other factors.
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
              <Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-cost-of-living/${slug}`}>Electricity cost of living in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-inflation/${slug}`}>Electricity inflation in {stateName}</Link>
            </li>
          </ul>
        </section>

        {/* G) Hub Link */}
        <p style={{ marginBottom: 32 }}>
          <Link href="/solar-vs-grid-electricity-cost">← All states: Solar vs Grid Electricity Cost</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
