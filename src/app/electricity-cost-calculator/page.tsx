import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURED_APPLIANCE_SLUGS, getApplianceConfig } from "@/lib/longtail/applianceConfig";
import {
  AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
  loadAllAverageBillStateSummaries,
  sortAverageBillStates,
} from "@/lib/longtail/averageBill";
import { CALCULATOR_USAGE_TIERS } from "@/lib/longtail/calculatorCluster";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import PageMonetization from "@/components/monetization/PageMonetization";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Cost Calculator by State – Bill Estimator | PriceOfElectricity.com",
  description:
    "Electricity cost calculator hub for national and state bill estimates. Compare 500, 1000, 1500, and 2000 kWh scenarios, appliance calculator pages, and average bill context.",
  canonicalPath: "/electricity-cost-calculator",
});

export default async function ElectricityCostCalculatorIndexPage() {
  const states = await loadAllAverageBillStateSummaries();
  const representativeState = sortAverageBillStates(states, "asc")[Math.floor(states.length / 2)];
  if (!representativeState) notFound();
  const highestBillState = sortAverageBillStates(states, "desc")[0];
  const lowestBillState = sortAverageBillStates(states, "asc")[0];
  if (!highestBillState || !lowestBillState) notFound();
  const nationalRate = representativeState.nationalAverageCentsPerKwh;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost Calculator", url: "/electricity-cost-calculator" },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Cost Calculator",
    description:
      nationalRate != null
        ? `Estimate monthly electric bills using the U.S. benchmark rate of ${formatRate(
            nationalRate,
          )} and state-specific rates across the calculator cluster.`
        : "Electricity bill and kWh cost calculator hub.",
    url: "/electricity-cost-calculator",
    isPartOf: "/",
    about: ["electricity cost calculator", "electric bill calculator", "kwh cost calculator"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <span aria-current="page">Electricity Cost Calculator</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Cost Calculator by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Estimate your electric bill with deterministic state-level pricing. This calculator cluster uses the core
          formula <strong>cost = kWh × electricity rate</strong> and then links into state, usage-tier, bill, and
          appliance pages so you can move from quick estimates to deeper scenario analysis.
        </p>
        <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "65ch", fontSize: 14 }}>
          Rates come from the same EIA-backed dataset used across the longtail, average-bill, usage-cost, and
          appliance clusters.
        </p>

        <section style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                U.S. benchmark rate
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatRate(nationalRate)}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                From national comparison baseline
              </div>
            </div>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Highest modeled monthly bill
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatUsd(highestBillState.monthlyBill)}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {highestBillState.name} at {AVERAGE_ELECTRICITY_BILL_USAGE_KWH} kWh
              </div>
            </div>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Lowest modeled monthly bill
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatUsd(lowestBillState.monthlyBill)}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {lowestBillState.name} at {AVERAGE_ELECTRICITY_BILL_USAGE_KWH} kWh
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How electricity cost is calculated</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Monthly electric bill estimate = monthly kWh usage × state electricity rate (in dollars per kWh). That
            means the same home usage can produce very different bill outcomes as you move between states.
          </p>
          <p style={{ marginBottom: 12, lineHeight: 1.7 }}>
            To support common consumer search intent, this cluster provides fixed usage examples and state-specific
            calculator pages that all map into the canonical `electricity-usage-cost` route family.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {CALCULATOR_USAGE_TIERS.map((kwh) => (
              <li key={kwh}>
                <Link href={`/electricity-usage-cost/${kwh}/${representativeState.slug}`}>
                  {kwh.toLocaleString()} kWh cost example in {representativeState.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>State calculator pages</h2>
          <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
            Each state calculator links to average bill pages, price-per-kWh pages, usage-tier pages, trend pages,
            appliance calculators, and canonical appliance cost-to-run pages.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {states.map((state) => (
              <Link
                key={state.slug}
                href={`/electricity-cost-calculator/${state.slug}`}
                style={{
                  display: "block",
                  padding: 16,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {state.name}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Appliance calculator entry points</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {FEATURED_APPLIANCE_SLUGS.map((slug) => {
              const appliance = getApplianceConfig(slug);
              return (
                <li key={slug}>
                  <Link href={`/electricity-cost-calculator/${representativeState.slug}/${slug}`}>
                    {appliance.displayName} calculator in {representativeState.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related consumer energy paths</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/average-electricity-bill">Average electricity bill hub</Link>
            </li>
            <li>
              <Link href="/electricity-bill-estimator">Household-profile bill estimator hub</Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${representativeState.slug}`}>
                Average electricity bill in {representativeState.name}
              </Link>
            </li>
            <li>
              <Link href={`/electricity-price-per-kwh/${representativeState.slug}`}>
                Electricity price per kWh in {representativeState.name}
              </Link>
            </li>
            <li>
              <Link href={`/electricity-price-trend/${representativeState.slug}`}>
                Electricity price trend in {representativeState.name}
              </Link>
            </li>
            <li>
              <Link href="/electricity-hubs/usage">Electricity usage hubs</Link>
            </li>
            <li>
              <Link href="/electricity-cost-comparison">State comparison hub</Link>
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Source & Method</h2>
          <p style={{ margin: 0, lineHeight: 1.7 }}>
            Source:{" "}
            {representativeState.sourceUrl ? (
              <a href={representativeState.sourceUrl} rel="noopener noreferrer" target="_blank">
                {representativeState.sourceName}
              </a>
            ) : (
              representativeState.sourceName
            )}
            .{" "}
            {representativeState.updatedLabel
              ? `Last dataset period: ${representativeState.updatedLabel}.`
              : "Data period label is currently unavailable."}{" "}
            Calculator outputs are deterministic, energy-only estimates and exclude fixed fees, delivery charges, and
            taxes.
          </p>
        </section>

        <PageMonetization context={{ pageType: "calculator-national" }} />

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
