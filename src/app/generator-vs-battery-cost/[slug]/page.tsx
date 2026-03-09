import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage, loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import ExploreMore from "@/components/navigation/ExploreMore";
import { getRelease } from "@/lib/knowledge/fetch";
import MiniBarChart from "@/components/charts/MiniBarChart";

const BATTERY_CAPACITY_KWH = 13.5;
const BATTERY_CHARGE_EFFICIENCY = 0.9;
const GENERATOR_FUEL_USE_GALLONS_PER_HOUR = 0.75;
const GASOLINE_PRICE_PER_GALLON = 3.75;

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
      canonicalPath: `/generator-vs-battery-cost/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollars = avgRate != null ? avgRate / 100 : 0;
  const batteryRechargeCost = rateDollars * BATTERY_CAPACITY_KWH;
  const generatorCostPerHour = GENERATOR_FUEL_USE_GALLONS_PER_HOUR * GASOLINE_PRICE_PER_GALLON;
  const description =
    avgRate != null
      ? `Generator vs battery cost in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. 13.5 kWh recharge: $${batteryRechargeCost.toFixed(2)}. Generator: $${generatorCostPerHour.toFixed(2)}/hr.`
      : `Generator vs battery cost in ${stateName}. Compare recharge cost with generator fuel cost.`;
  return buildMetadata({
    title: `Generator vs Battery Cost in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/generator-vs-battery-cost/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function GeneratorVsBatteryCostStatePage({
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

  const batteryRechargeCostBaseline = BATTERY_CAPACITY_KWH * rateDollarsPerKwh;
  const batteryRechargeCostWithLosses =
    (BATTERY_CAPACITY_KWH / BATTERY_CHARGE_EFFICIENCY) * rateDollarsPerKwh;
  const generatorCostPerHour =
    GENERATOR_FUEL_USE_GALLONS_PER_HOUR * GASOLINE_PRICE_PER_GALLON;

  const batteryEquivalentRuntimeHours =
    generatorCostPerHour > 0 ? batteryRechargeCostWithLosses / generatorCostPerHour : 0;

  let nationalBatteryRechargeCost: number | null = null;
  let batteryDiffDollars: number | null = null;
  let batteryDiffPercent: number | null = null;
  if (nationalAvg != null && avgRate != null) {
    const nationalRateDollars = nationalAvg / 100;
    nationalBatteryRechargeCost = BATTERY_CAPACITY_KWH * nationalRateDollars;
    batteryDiffDollars = batteryRechargeCostBaseline - nationalBatteryRechargeCost;
    batteryDiffPercent =
      nationalBatteryRechargeCost > 0
        ? ((batteryRechargeCostBaseline - nationalBatteryRechargeCost) / nationalBatteryRechargeCost) * 100
        : null;
  }

  const canonicalPath = `/generator-vs-battery-cost/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Generator vs Battery Cost", url: "/generator-vs-battery-cost" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Generator vs Battery Cost in ${stateName}`,
    description:
      avgRate != null
        ? `Compare battery recharge cost ($${batteryRechargeCostBaseline.toFixed(2)}) with generator fuel cost ($${generatorCostPerHour.toFixed(2)}/hr) in ${stateName}.`
        : `Generator vs battery cost comparison in ${stateName}.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`generator vs battery cost ${stateName}`, "backup power cost comparison"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [];
  if (avgRate != null) {
    faqItems.push({
      question: `How much does it cost to recharge a 13.5 kWh battery in ${stateName}?`,
      answer: `At the average rate of ${avgRate.toFixed(2)}¢/kWh, recharging a 13.5 kWh home battery costs approximately $${batteryRechargeCostBaseline.toFixed(2)} (baseline) or about $${batteryRechargeCostWithLosses.toFixed(2)} with 10% charging losses.`,
    });
    faqItems.push({
      question: "How much does a gasoline generator cost to run per hour?",
      answer: `Under our assumptions (${GENERATOR_FUEL_USE_GALLONS_PER_HOUR} gal/hr at $${GASOLINE_PRICE_PER_GALLON.toFixed(2)}/gallon), a typical gasoline generator costs about $${generatorCostPerHour.toFixed(2)} per hour to run.`,
    });
    faqItems.push({
      question: `Is recharging a home battery cheaper than running a generator in ${stateName}?`,
      answer: `One 13.5 kWh battery recharge with losses costs about $${batteryRechargeCostWithLosses.toFixed(2)} in ${stateName}. That equals roughly ${batteryEquivalentRuntimeHours.toFixed(1)} hours of generator operation at $${generatorCostPerHour.toFixed(2)}/hr. Whether battery or generator is cheaper depends on how many hours you run and how often you recharge.`,
    });
    faqItems.push({
      question: "What assumptions are used on this page?",
      answer: `We use: 13.5 kWh battery, 90% charging efficiency, ${GENERATOR_FUEL_USE_GALLONS_PER_HOUR} gal/hr generator fuel use, and $${GASOLINE_PRICE_PER_GALLON.toFixed(2)}/gallon gasoline. Electricity rates come from EIA data and vary by state.`,
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
          { label: "13.5 kWh battery (baseline)", value: batteryRechargeCostBaseline },
          { label: "13.5 kWh battery (with losses)", value: batteryRechargeCostWithLosses },
          { label: "Generator per hour", value: generatorCostPerHour },
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
          <Link href="/generator-vs-battery-cost">Generator vs Battery Cost</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          Generator vs Battery Cost in {stateName}
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          This page compares the cost to recharge a standard 13.5 kWh home battery with the hourly fuel cost
          of a typical gasoline generator. Both figures are operating costs only—no purchase price or maintenance.
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>13.5 kWh recharge</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${batteryRechargeCostBaseline.toFixed(2)}</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>13.5 kWh (with losses)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${batteryRechargeCostWithLosses.toFixed(2)}</div>
            </div>
          )}
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Generator fuel/hr</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>${generatorCostPerHour.toFixed(2)}</div>
          </div>
        </div>

        {/* Comparison table */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Cost Comparison</h2>
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
                      Scenario
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      13.5 kWh battery recharge (baseline)
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${batteryRechargeCostBaseline.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      13.5 kWh battery recharge (with losses)
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${batteryRechargeCostWithLosses.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      Generator operating cost per hour
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${generatorCostPerHour.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Equal-cost comparison */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Generator Hours at Equal Cost</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
                In {stateName}, one 13.5 kWh battery recharge with charging losses costs about{" "}
                <strong>${batteryRechargeCostWithLosses.toFixed(2)}</strong>. That equals roughly{" "}
                <strong>{batteryEquivalentRuntimeHours.toFixed(1)} hours</strong> of generator operation at
                ${generatorCostPerHour.toFixed(2)}/hr under the assumptions used on this page.
              </p>
            </div>
          </section>
        )}

        {/* National comparison */}
        {nationalBatteryRechargeCost != null &&
          batteryDiffDollars != null &&
          batteryDiffPercent != null && (
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
                    <div style={{ fontSize: 18, fontWeight: 600 }}>${batteryRechargeCostBaseline.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>13.5 kWh nationally</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>${nationalBatteryRechargeCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>Difference</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {batteryDiffDollars >= 0 ? "+" : ""}${batteryDiffDollars.toFixed(2)} (
                      {batteryDiffPercent >= 0 ? "+" : ""}{batteryDiffPercent.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* Chart */}
        {chartRows.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Cost Comparison Chart</h2>
            <MiniBarChart
              rows={chartRows}
              title="Battery vs generator cost"
              subtitle={`${stateName} — electricity at ${avgRate?.toFixed(2) ?? "—"}¢/kWh, generator at $${GASOLINE_PRICE_PER_GALLON.toFixed(2)}/gal`}
              formatValue={(v) => `$${v.toFixed(2)}`}
              minValue={0}
              ariaLabel="Battery recharge cost vs generator fuel cost"
            />
          </section>
        )}

        {/* Scope-control note */}
        <section style={{ marginBottom: 32 }}>
          <p className="muted" style={{ margin: 0, maxWidth: "65ch", fontSize: 14 }}>
            This page compares operating/recharge cost only. It does not compare purchase cost, battery lifespan,
            maintenance, outage performance, noise, installation, or safety.
          </p>
        </section>

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Data & Comparisons</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/battery-recharge-cost/${slug}`}>Battery recharge cost in {stateName}</Link>
              {" — "}
              Recharge cost by battery size
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
              <Link href={`/knowledge/state/${slug}`}>Full {stateName} knowledge page</Link>
              {" — "}
              Rates, value score, affordability, trends
            </li>
            <li>
              <Link href="/generator-vs-battery-cost">All states generator vs battery cost</Link>
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Related electricity pages"
          links={[
            { href: `/electricity-cost/${slug}`, label: "Electricity cost" },
            { href: `/average-electricity-bill/${slug}`, label: "Average electricity bill" },
            { href: `/electricity-cost-calculator/${slug}`, label: "Electricity cost calculator" },
            { href: `/battery-recharge-cost/${slug}`, label: "Battery recharge cost" },
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
