import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamicParams = true;
export const revalidate = 86400;

const BATTERY_10_KWH = 10;
const BATTERY_13_5_KWH = 13.5;
const BATTERY_20_KWH = 20;

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
      canonicalPath: `/battery-backup-electricity-cost/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description = `Grid electricity cost for charging home battery systems in ${stateName}. Battery recharge cost examples at state electricity rates.`;
  return buildMetadata({
    title: `Battery Backup Electricity Cost in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/battery-backup-electricity-cost/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BatteryBackupElectricityCostStatePage({
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

  const cost10kWh = rateDollarsPerKwh * BATTERY_10_KWH;
  const cost13_5kWh = rateDollarsPerKwh * BATTERY_13_5_KWH;
  const cost20kWh = rateDollarsPerKwh * BATTERY_20_KWH;

  const nationalData = nationalPage?.data as { derived?: { averageRate?: number } } | null;
  const nationalAvg =
    typeof nationalData?.derived?.averageRate === "number" ? nationalData.derived.averageRate : null;
  const nationalRateDollars = nationalAvg != null ? nationalAvg / 100 : 0;
  const nationalCost10 = nationalRateDollars * BATTERY_10_KWH;
  const nationalCost13_5 = nationalRateDollars * BATTERY_13_5_KWH;
  const nationalCost20 = nationalRateDollars * BATTERY_20_KWH;

  const canonicalPath = `/battery-backup-electricity-cost/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Battery Backup Electricity Cost", url: "/battery-backup-electricity-cost" },
    { name: stateName, url: canonicalPath },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/battery-backup-electricity-cost">Battery Backup Electricity Cost</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Battery Backup Electricity Cost in {stateName}</h1>

        {/* A) State Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is <strong>{avgRate.toFixed(2)} ¢/kWh</strong>.
              This provides baseline context for the cost of recharging batteries from the grid.
            </p>
          </section>
        )}

        {/* B) Battery Recharge Cost Examples */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Battery Recharge Cost Examples</h2>
            <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
              Using state average rate. Recharge cost = capacity × rate. Not including battery purchase cost.
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
                <strong>10 kWh battery</strong> recharge: about <strong>${cost10kWh.toFixed(2)}</strong>
              </p>
              <p style={{ margin: "0 0 8px 0", fontSize: 16 }}>
                <strong>13.5 kWh battery</strong> recharge: about <strong>${cost13_5kWh.toFixed(2)}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 16 }}>
                <strong>20 kWh battery</strong> recharge: about <strong>${cost20kWh.toFixed(2)}</strong>
              </p>
            </div>
          </section>
        )}

        {/* C) National Comparison */}
        {nationalAvg != null && avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Comparison</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The national average rate is {nationalAvg.toFixed(2)}¢/kWh. At that rate, a 10 kWh recharge would cost about ${nationalCost10.toFixed(2)}, 13.5 kWh about ${nationalCost13_5.toFixed(2)}, and 20 kWh about ${nationalCost20.toFixed(2)}. {stateName}&apos;s rate is {avgRate > nationalAvg ? "higher" : "lower"} than the national average.
            </p>
          </section>
        )}

        {/* D) Backup Power Context */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Backup Power Context</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Batteries may be used for backup power during outages, time-of-use optimization, or solar energy storage. When charging from the grid, the cost depends on local electricity rates. This page provides <strong>recharge cost estimates only</strong>—not battery purchase cost, solar production, or full system economics.
          </p>
        </section>

        {/* E) Transparency */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Transparency</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            This page estimates <strong>recharge cost only</strong>. Battery purchase cost is not included. Solar production is not modeled. Actual costs depend on usage patterns, round-trip efficiency, and many other factors.
          </p>
        </section>

        {/* F) Related Pages */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/solar-vs-grid-electricity-cost/${slug}`}>Solar vs grid electricity cost in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-inflation/${slug}`}>Electricity inflation in {stateName}</Link>
            </li>
          </ul>
        </section>

        {/* G) Hub Link */}
        <p style={{ marginBottom: 32 }}>
          <Link href="/battery-backup-electricity-cost">← All states: Battery Backup Electricity Cost</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
