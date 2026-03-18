import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import ExploreMore from "@/components/navigation/ExploreMore";
import { getRelease } from "@/lib/knowledge/fetch";
import MiniBarChart from "@/components/charts/MiniBarChart";

const PORTABLE_BATTERY_KWH = 1;
const BACKUP_BATTERY_KWH = 5;
const HOME_BATTERY_KWH = 13.5;
const CHARGING_EFFICIENCY = 0.9;

export const dynamicParams = true;
export const revalidate = 86400;

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
      canonicalPath: `/battery-recharge-cost/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollars = avgRate != null ? avgRate / 100 : 0;
  const homeRechargeCost = rateDollars * HOME_BATTERY_KWH;
  const description =
    avgRate != null
      ? `Battery recharge cost in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated 13.5 kWh recharge: $${homeRechargeCost.toFixed(2)}. See 1, 5, 13.5 kWh examples.`
      : `Battery recharge cost in ${stateName}. Estimate recharge costs by battery size.`;
  return buildMetadata({
    title: `Battery Recharge Cost in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/battery-recharge-cost/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BatteryRechargeCostStatePage({
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

  const portableRechargeCost = PORTABLE_BATTERY_KWH * rateDollarsPerKwh;
  const backupRechargeCost = BACKUP_BATTERY_KWH * rateDollarsPerKwh;
  const homeBatteryRechargeCost = HOME_BATTERY_KWH * rateDollarsPerKwh;

  const portableRechargeCostWithLosses = (PORTABLE_BATTERY_KWH / CHARGING_EFFICIENCY) * rateDollarsPerKwh;
  const backupRechargeCostWithLosses = (BACKUP_BATTERY_KWH / CHARGING_EFFICIENCY) * rateDollarsPerKwh;
  const homeBatteryRechargeCostWithLosses = (HOME_BATTERY_KWH / CHARGING_EFFICIENCY) * rateDollarsPerKwh;

  let nationalHomeRechargeCost: number | null = null;
  let homeDiffDollars: number | null = null;
  let homeDiffPercent: number | null = null;
  if (nationalAvg != null && avgRate != null) {
    const nationalRateDollars = nationalAvg / 100;
    nationalHomeRechargeCost = HOME_BATTERY_KWH * nationalRateDollars;
    homeDiffDollars = homeBatteryRechargeCost - nationalHomeRechargeCost;
    homeDiffPercent =
      nationalHomeRechargeCost > 0
        ? ((homeBatteryRechargeCost - nationalHomeRechargeCost) / nationalHomeRechargeCost) * 100
        : null;
  }

  const canonicalPath = `/battery-recharge-cost/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Battery Recharge Cost", url: "/battery-recharge-cost" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Battery Recharge Cost in ${stateName}`,
    description:
      avgRate != null
        ? `Battery recharge cost in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated 13.5 kWh recharge: $${homeBatteryRechargeCost.toFixed(2)}.`
        : `${stateName} battery recharge cost estimates.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`battery recharge cost ${stateName}`, "home battery recharge cost"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [];
  if (avgRate != null) {
    faqItems.push({
      question: `How much does it cost to recharge a 13.5 kWh home battery in ${stateName}?`,
      answer: `At the average rate of ${avgRate.toFixed(2)}¢/kWh, recharging a 13.5 kWh home battery costs approximately $${homeBatteryRechargeCost.toFixed(2)} (baseline) or about $${homeBatteryRechargeCostWithLosses.toFixed(2)} with 10% charging losses.`,
    });
    faqItems.push({
      question: `How much does it cost to recharge a 5 kWh backup battery in ${stateName}?`,
      answer: `At the average rate of ${avgRate.toFixed(2)}¢/kWh, recharging a 5 kWh backup battery costs approximately $${backupRechargeCost.toFixed(2)} (baseline) or about $${backupRechargeCostWithLosses.toFixed(2)} with 10% charging losses.`,
    });
    faqItems.push({
      question: "Why does battery recharge cost vary by state?",
      answer:
        "Electricity prices vary significantly by state due to generation mix, transmission costs, regulations, and demand. Higher state rates mean higher recharge costs for the same battery capacity.",
    });
    faqItems.push({
      question: "Does charging efficiency affect battery recharge cost?",
      answer:
        "Yes. Real-world charging typically has 5–15% losses (inverter, heat, etc.). At 90% efficiency, you draw about 11% more electricity from the grid than the battery stores. Our efficiency-adjusted estimates use a 90% charging efficiency factor.",
    });
  }

  const faqJsonLd =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  const chartRows =
    avgRate != null
      ? [
          { label: "1 kWh", value: portableRechargeCost },
          { label: "5 kWh", value: backupRechargeCost },
          { label: "13.5 kWh", value: homeBatteryRechargeCost },
        ]
      : [];

  return (
    <>
      <JsonLdScript
        data={[breadcrumbJsonLd, webPageJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])]}
      />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/battery-recharge-cost">Battery Recharge Cost</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          Battery Recharge Cost in {stateName}
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Battery recharge cost depends on battery size and your local electricity price. Below are estimates
          for {stateName} based on the average residential rate. Data comes from EIA.
        </p>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>1 kWh recharge</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${portableRechargeCost.toFixed(2)}</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>5 kWh recharge</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${backupRechargeCost.toFixed(2)}</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>13.5 kWh recharge</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${homeBatteryRechargeCost.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Recharge scenarios table */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Recharge Scenarios</h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                      Battery size
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                      Baseline recharge cost
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                      Recharge cost with 10% charging losses
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>1 kWh</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${portableRechargeCost.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${portableRechargeCostWithLosses.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>5 kWh</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${backupRechargeCost.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${backupRechargeCostWithLosses.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>13.5 kWh</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${homeBatteryRechargeCost.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${homeBatteryRechargeCostWithLosses.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* National comparison */}
        {nationalHomeRechargeCost != null && homeDiffDollars != null && homeDiffPercent != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>13.5 kWh Recharge vs National Average</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>13.5 kWh in {stateName}</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>${homeBatteryRechargeCost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>13.5 kWh nationally</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>${nationalHomeRechargeCost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Difference</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {homeDiffDollars >= 0 ? "+" : ""}${homeDiffDollars.toFixed(2)} ({homeDiffPercent >= 0 ? "+" : ""}{homeDiffPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Scope-control note */}
        <section style={{ marginBottom: 32 }}>
          <p className="muted" style={{ margin: 0, maxWidth: "65ch", fontSize: 14 }}>
            This page estimates the electricity cost to recharge a battery. It does not review products,
            battery chemistry, installation, or total ownership cost.
          </p>
        </section>

        {/* Chart */}
        {chartRows.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Recharge Cost by Battery Size</h2>
            <MiniBarChart
              rows={chartRows}
              title="Recharge cost by battery size"
              subtitle={`${stateName} at ${avgRate?.toFixed(2) ?? "—"}¢/kWh`}
              formatValue={(v) => `$${v.toFixed(2)}`}
              minValue={0}
              ariaLabel="Battery recharge cost by battery size"
            />
          </section>
        )}

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Data & Comparisons</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/generator-vs-battery-cost/${slug}`}>
                Compare battery recharge cost with generator operating cost in {stateName}.
              </Link>
            </li>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
              {" — "}
              Rates, value score, affordability
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>Electricity cost calculator for {stateName}</Link>
              {" — "}
              Usage-based estimates
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
              {" — "}
              Monthly and annual bill estimates
            </li>
            <li>
              <Link href={`/knowledge/state/${slug}`}>Full {stateName} knowledge page</Link>
              {" — "}
              Rates, value score, affordability, trends
            </li>
            <li>
              <Link href="/battery-recharge-cost">All states battery recharge cost</Link>
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Related electricity pages"
          links={[
            { href: `/electricity-cost/${slug}`, label: "Electricity cost" },
            { href: `/average-electricity-bill/${slug}`, label: "Average electricity bill" },
            { href: `/electricity-cost-calculator/${slug}`, label: "Electricity cost calculator" },
            { href: `/generator-vs-battery-cost/${slug}`, label: "Generator vs battery cost" },
            { href: `/electricity-price-history/${slug}`, label: "Electricity price history" },
            { href: `/knowledge/state/${slug}`, label: "State overview" },
          ]}
        />

        {/* FAQ */}
        {faqItems.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Frequently Asked Questions</h2>
            <dl style={{ margin: 0 }}>
              {faqItems.map((item, idx) => (
                <div key={idx} style={{ marginBottom: 16 }}>
                  <dt style={{ fontWeight: 600, marginBottom: 4 }}>{item.question}</dt>
                  <dd style={{ margin: 0, marginLeft: 0 }}>{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
