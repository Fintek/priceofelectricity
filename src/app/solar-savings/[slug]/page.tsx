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

const MONTHLY_USAGE_KWH = 900;

export const dynamic = "force-static";
export const revalidate = 86400;

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
      canonicalPath: `/solar-savings/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description =
    `State-level electricity price context for solar savings potential in ${stateName}. Learn how grid electricity prices affect the value of solar.`;
  return buildMetadata({
    title: `Solar Savings Potential in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/solar-savings/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function SolarSavingsStatePage({
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

  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;

  const nationalData = nationalPage?.data as { derived?: { averageRate?: number } } | null;
  const nationalAvg =
    typeof nationalData?.derived?.averageRate === "number" ? nationalData.derived.averageRate : null;

  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;
  const nationalMonthlyBill =
    nationalAvg != null ? (nationalAvg / 100) * MONTHLY_USAGE_KWH : null;
  const diffDollars =
    nationalMonthlyBill != null ? estimatedMonthlyBill - nationalMonthlyBill : null;
  const diffPercent =
    nationalMonthlyBill != null && nationalMonthlyBill > 0
      ? ((estimatedMonthlyBill - nationalMonthlyBill) / nationalMonthlyBill) * 100
      : null;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Solar Savings", url: "/solar-savings" },
    { name: stateName, url: `/solar-savings/${slug}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/solar-savings">Solar Savings</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>
          Solar Savings Potential in {stateName}
        </h1>

        {/* B) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This page provides state-level electricity price context relevant to solar savings potential in {stateName}.
            We show how grid electricity prices in {stateName} compare to national averages and explain why that
            context matters for understanding solar value—without estimating solar production, installation costs,
            or payback periods.
          </p>
        </section>

        {/* C) State Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <div
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Average residential rate</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{avgRate.toFixed(2)} ¢/kWh</div>
              </div>
              <div
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. monthly bill (900 kWh)</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedMonthlyBill.toFixed(2)}</div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
              Rates from EIA data. Estimates use 900 kWh monthly usage.
            </p>
          </section>
        )}

        {/* D) Why Solar Value Depends on Electricity Price */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Solar Value Depends on Electricity Price</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Solar can offset grid electricity consumption. The value of that offset depends partly on local
            electricity prices—what you would have paid for the same kWh from the grid. In {stateName}, the
            average residential rate provides context for how much each kilowatt-hour of solar generation
            might be worth in avoided grid costs.
          </p>
        </section>

        {/* E) National Comparison */}
        {nationalMonthlyBill != null && diffDollars != null && diffPercent != null && avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Comparison</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                At 900 kWh per month, electricity in {stateName} costs approximately{" "}
                {Math.abs(diffPercent) < 0.5
                  ? "the same as"
                  : diffPercent > 0
                    ? `${diffPercent.toFixed(1)}% more than`
                    : `${Math.abs(diffPercent).toFixed(1)}% less than`}{" "}
                the U.S. national average. That&apos;s {diffDollars >= 0 ? "+" : ""}${diffDollars.toFixed(2)} per month.
                States with higher grid prices may see greater potential value from solar offsetting consumption.
              </p>
            </div>
          </section>
        )}

        {/* F) What This Does Not Estimate */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What This Does Not Estimate</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This page provides electricity price context only. We do not estimate:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Solar production or system output</li>
            <li>Installation costs or system pricing</li>
            <li>Tax incentives or rebates</li>
            <li>Payback periods or return on investment</li>
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            For savings estimates, consult solar installers or tools that incorporate production and cost data.
          </p>
        </section>

        {/* G) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/solar-vs-grid-electricity-cost/${slug}`}>Solar vs grid electricity cost in {stateName}</Link></li>
            <li><Link href={`/battery-backup-electricity-cost/${slug}`}>Battery backup electricity cost in {stateName}</Link></li>
            <li><Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link></li>
            <li><Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link></li>
            <li><Link href={`/electricity-cost-of-living/${slug}`}>Electricity cost of living in {stateName}</Link></li>
            <li><Link href="/solar-savings">Solar savings potential by state</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
