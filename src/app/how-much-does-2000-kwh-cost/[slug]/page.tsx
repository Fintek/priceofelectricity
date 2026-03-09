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

const USAGE_KWH = 2000;
const BASE_PATH = "/how-much-does-2000-kwh-cost";

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
      canonicalPath: `${BASE_PATH}/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const cost = avgRate != null ? (avgRate / 100) * USAGE_KWH : null;
  const description =
    avgRate != null && cost != null
      ? `How much does 2000 kWh cost in ${stateName}? At ${avgRate.toFixed(2)}¢/kWh, approximately $${cost.toFixed(2)}. State electricity cost estimate.`
      : `Electricity cost for 2000 kWh in ${stateName}. State electricity price data.`;
  return buildMetadata({
    title: `How Much Does 2000 kWh Cost in ${stateName}? | PriceOfElectricity.com`,
    description,
    canonicalPath: `${BASE_PATH}/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function HowMuchDoes2000KwhCostStatePage({
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
  const estimatedCost = rateDollarsPerKwh * USAGE_KWH;
  const nationalCost = nationalAvg != null ? (nationalAvg / 100) * USAGE_KWH : null;
  const diffDollars = nationalCost != null ? estimatedCost - nationalCost : null;
  const diffPercent =
    nationalCost != null && nationalCost > 0
      ? ((estimatedCost - nationalCost) / nationalCost) * 100
      : null;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "How Much Does 2000 kWh Cost?", url: BASE_PATH },
    { name: stateName, url: `${BASE_PATH}/${slug}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href={BASE_PATH}>How Much Does 2000 kWh Cost?</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>
          How Much Does 2000 kWh Cost in {stateName}?
        </h1>

        {avgRate != null && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 16,
              marginBottom: 32,
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{stateName} average rate</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Estimated cost (2000 kWh)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedCost.toFixed(2)}</div>
            </div>
          </div>
        )}

        {nationalCost != null && diffDollars != null && diffPercent != null && avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Compared to National Average</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
                At 2000 kWh, electricity in {stateName} costs approximately{" "}
                {Math.abs(diffPercent) < 0.5
                  ? "the same as"
                  : diffPercent > 0
                    ? `${diffPercent.toFixed(1)}% more than`
                    : `${Math.abs(diffPercent).toFixed(1)}% less than`}{" "}
                the U.S. national average. That&apos;s {diffDollars >= 0 ? "+" : ""}${diffDollars.toFixed(2)} per month.
              </p>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link></li>
            <li><Link href={`/electricity-cost-calculator/${slug}`}>Electricity cost calculator for {stateName}</Link></li>
            <li><Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link></li>
            <li><Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link></li>
            <li><Link href={`/electricity-cost-of-living/${slug}`}>Electricity cost of living in {stateName}</Link></li>
            <li><Link href={BASE_PATH}>How much does 2000 kWh cost? (all states)</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
