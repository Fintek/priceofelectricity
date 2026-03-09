import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage, loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";
import MiniBarChart from "@/components/charts/MiniBarChart";

const MONTHLY_USAGE_KWH = 900;
const ANNUAL_USAGE_KWH = 10800;

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
  const [statePage] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
  ]);
  if (!statePage) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/moving-to-electricity-cost/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollars = avgRate != null ? avgRate / 100 : 0;
  const monthlyCost = rateDollars * MONTHLY_USAGE_KWH;
  const description =
    avgRate != null
      ? `Electricity cost when moving to ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly bill for 900 kWh: $${monthlyCost.toFixed(2)}. Compare to national average.`
      : `Electricity cost expectations when moving to ${stateName}. Estimated monthly and annual costs.`;
  return buildMetadata({
    title: `Electricity Cost When Moving to ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/moving-to-electricity-cost/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function MovingToElectricityCostStatePage({
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
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;

  const nationalData = nationalPage?.data as {
    derived?: { averageRate?: number };
  } | null;
  const nationalAvg =
    typeof nationalData?.derived?.averageRate === "number" ? nationalData.derived.averageRate : null;

  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const monthlyCost = rateDollarsPerKwh * MONTHLY_USAGE_KWH;
  const annualCost = rateDollarsPerKwh * ANNUAL_USAGE_KWH;

  let nationalMonthlyCost: number | null = null;
  let diffPercent: number | null = null;
  if (nationalAvg != null && avgRate != null) {
    const nationalRateDollars = nationalAvg / 100;
    nationalMonthlyCost = nationalRateDollars * MONTHLY_USAGE_KWH;
    diffPercent = ((monthlyCost - nationalMonthlyCost) / nationalMonthlyCost) * 100;
  }

  const canonicalPath = `/moving-to-electricity-cost/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Costs When Moving", url: "/moving-to-electricity-cost" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Cost When Moving to ${stateName}`,
    description:
      avgRate != null
        ? `Electricity cost when moving to ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly bill for 900 kWh: $${monthlyCost.toFixed(2)}.`
        : `${stateName} electricity cost expectations for new residents.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`moving to ${stateName} electricity cost`, "electricity bill when relocating"],
  });

  const chartRows =
    avgRate != null && nationalMonthlyCost != null
      ? [
          { label: stateName, value: monthlyCost },
          { label: "National average", value: nationalMonthlyCost },
        ]
      : [];

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/moving-to-electricity-cost">Electricity Costs When Moving</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          Electricity Cost When Moving to {stateName}
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          If you are moving to {stateName}, here is what to expect for electricity costs. Average residential
          rates and estimated bills below are based on EIA data and assume 900 kWh monthly usage.
        </p>

        {/* Key stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {avgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Electricity rate</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{avgRate.toFixed(2)} ¢/kWh</div>
            </div>
          )}
          {avgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. monthly (900 kWh)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${monthlyCost.toFixed(2)}</div>
            </div>
          )}
          {avgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. annual (10,800 kWh)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${annualCost.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Comparison with national average */}
        {diffPercent != null && nationalAvg != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Compared to National Average</h2>
            <p style={{ margin: 0 }}>
              Households moving to {stateName} pay approximately{" "}
              {diffPercent >= 0 ? (
                <>{diffPercent.toFixed(1)}% more</>
              ) : (
                <>{Math.abs(diffPercent).toFixed(1)}% less</>
              )}{" "}
              for electricity than the national average.
            </p>
          </section>
        )}

        {/* Chart */}
        {chartRows.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Monthly Cost Comparison</h2>
            <MiniBarChart
              rows={chartRows}
              title="State vs national monthly cost"
              subtitle="Based on 900 kWh usage"
              formatValue={(v) => `$${v.toFixed(2)}`}
              minValue={0}
              ariaLabel="Monthly electricity cost comparison"
            />
          </section>
        )}

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Data & Comparisons</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
              {" — "}
              Rates, value score, affordability
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
              {" — "}
              Monthly and annual bill estimates
            </li>
            <li>
              <Link href={`/electricity-cost-of-living/${slug}`}>Explore electricity cost of living in {stateName}</Link>
            </li>
            <li>
              <Link href={`/knowledge/state/${slug}`}>Full {stateName} knowledge page</Link>
              {" — "}
              Rates, value score, affordability, trends
            </li>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
            </li>
            <li>
              <Link href="/knowledge">Knowledge Hub</Link>
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
