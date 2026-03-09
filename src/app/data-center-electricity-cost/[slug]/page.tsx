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

const MONTHLY_KWH_1MW = 720000;
const MONTHLY_KWH_10MW = 7200000;

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
      canonicalPath: `/data-center-electricity-cost/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description = `Electricity price context for data center infrastructure in ${stateName}. State electricity rates and illustrative cost scenarios.`;
  return buildMetadata({
    title: `Data Center Electricity Cost in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/data-center-electricity-cost/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function DataCenterElectricityCostStatePage({
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

  const monthlyCost1MW = MONTHLY_KWH_1MW * rateDollarsPerKwh;
  const monthlyCost10MW = MONTHLY_KWH_10MW * rateDollarsPerKwh;

  const nationalData = nationalPage?.data as { derived?: { averageRate?: number } } | null;
  const nationalAvg =
    typeof nationalData?.derived?.averageRate === "number" ? nationalData.derived.averageRate : null;
  const nationalRateDollars = nationalAvg != null ? nationalAvg / 100 : 0;
  const nationalCost1MW = nationalRateDollars * MONTHLY_KWH_1MW;
  const nationalCost10MW = nationalRateDollars * MONTHLY_KWH_10MW;

  const canonicalPath = `/data-center-electricity-cost/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Data Center Electricity Cost", url: "/data-center-electricity-cost" },
    { name: stateName, url: canonicalPath },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data-center-electricity-cost">Data Center Electricity Cost</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Data Center Electricity Cost in {stateName}</h1>

        {/* A) State Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is <strong>{avgRate.toFixed(2)} ¢/kWh</strong>.
              This provides baseline context for electricity costs in the state. Real data center pricing depends on wholesale contracts, utility tariffs, and infrastructure incentives.
            </p>
          </section>
        )}

        {/* B) Estimated Electricity Cost for Data Centers */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Illustrative Cost Scenarios</h2>
            <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
              Using state average rate as context. Not exact data center pricing.
            </p>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: 16 }}>
                <strong>1 MW continuous load</strong> (≈720,000 kWh/month): about <strong>${monthlyCost1MW.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>/month
              </p>
              <p style={{ margin: 0, fontSize: 16 }}>
                <strong>10 MW continuous load</strong> (≈7.2M kWh/month): about <strong>${monthlyCost10MW.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>/month
              </p>
            </div>
          </section>
        )}

        {/* C) National Comparison */}
        {nationalAvg != null && avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Comparison</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The national average rate is {nationalAvg.toFixed(2)}¢/kWh. At that rate, 1 MW would cost about ${nationalCost1MW.toLocaleString("en-US", { maximumFractionDigits: 0 })}/month and 10 MW about ${nationalCost10MW.toLocaleString("en-US", { maximumFractionDigits: 0 })}/month. {stateName}&apos;s rate is {avgRate > nationalAvg ? "higher" : "lower"} than the national average.
            </p>
          </section>
        )}

        {/* D) Infrastructure Context */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Infrastructure Context</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Real data center electricity pricing depends on wholesale power contracts, utility tariffs, grid access, and infrastructure incentives. This site provides <strong>state electricity price context</strong> as a baseline illustration—not precise contract pricing or hyperscaler rates.
          </p>
        </section>

        {/* E) Related Pages */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/ai-energy-demand">AI Energy Demand</Link>
              {" — "}
              Data centers and electricity
            </li>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-inflation/${slug}`}>Electricity inflation in {stateName}</Link>
            </li>
          </ul>
        </section>

        {/* F) Hub Link */}
        <p style={{ marginBottom: 32 }}>
          <Link href="/data-center-electricity-cost">← All states: Data Center Electricity Cost</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
