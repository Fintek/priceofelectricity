import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { FEATURED_APPLIANCE_SLUGS, getApplianceConfig } from "@/lib/longtail/applianceConfig";
import {
  AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
  AVERAGE_ELECTRICITY_BILL_USAGE_EXAMPLES,
  buildAverageBillRankingRows,
  loadAllAverageBillStateSummaries,
  sortAverageBillStates,
} from "@/lib/longtail/averageBill";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import { getCanonicalUsageCostPath } from "@/lib/longtail/usageEntryRoutes";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Average Electricity Bill by State – Monthly & Annual Estimates | PriceOfElectricity.com",
  description:
    "Average electricity bill estimates by state using a 900 kWh monthly usage benchmark. Compare national and state bill levels, usage examples, calculators, and appliance electricity cost pages.",
  canonicalPath: "/average-electricity-bill",
});

export default async function AverageElectricityBillIndexPage() {
  const states = await loadAllAverageBillStateSummaries();
  const rankedStates = buildAverageBillRankingRows(states);
  const highestBillState = sortAverageBillStates(states, "desc")[0];
  const lowestBillState = sortAverageBillStates(states, "asc")[0];
  const representativeState =
    [...states]
      .filter((state) => state.monthlyDifference != null)
      .sort(
        (a, b) =>
          Math.abs(a.monthlyDifference ?? Number.POSITIVE_INFINITY) -
          Math.abs(b.monthlyDifference ?? Number.POSITIVE_INFINITY),
      )[0] ?? states[0];
  if (!representativeState || !highestBillState || !lowestBillState) notFound();
  const nationalMonthlyBill = representativeState?.nationalMonthlyBill ?? null;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Average Electricity Bill", url: "/average-electricity-bill" },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Average Electricity Bill by State",
    description:
      nationalMonthlyBill != null
        ? `National average electricity bill estimate for ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH} kWh is ${formatUsd(
            nationalMonthlyBill,
          )}, with full state-by-state bill pages and linked usage-cost examples.`
        : "Average electricity bill by state with linked consumer electricity cost pages.",
    url: "/average-electricity-bill",
    isPartOf: "/",
    about: [
      "average electricity bill by state",
      "monthly electricity bill estimates",
      "consumer electricity cost comparisons",
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <span aria-current="page">Average Electricity Bill</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Average Electricity Bill by State</h1>
        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          This consumer electricity-bill hub estimates what a typical household pays each month in every U.S. state
          using the latest statewide residential electricity rate and a standard{" "}
          {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh monthly usage assumption.
        </p>
        <p className="muted" style={{ margin: "0 0 32px 0", maxWidth: "65ch", fontSize: 14 }}>
          The goal is to make bill-level electricity searches easier to navigate: compare state bill estimates, jump
          into exact kWh scenarios, open the calculator for a custom bill, or move into appliance cost pages using the
          same rate dataset.
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
                National average bill
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatUsd(nationalMonthlyBill)}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Based on {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh per month
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
                Highest modeled state bill
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatUsd(highestBillState.monthlyBill)}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {highestBillState.name}
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
                Lowest modeled state bill
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{formatUsd(lowestBillState.monthlyBill)}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {lowestBillState.name}
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
                Representative rate benchmark
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {formatRate(representativeState.avgRateCentsPerKwh)}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {representativeState.name} is closest to the U.S. bill average
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What affects the average electricity bill?</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            A household bill depends on two inputs: the electricity rate and the amount of electricity used. This hub
            holds usage constant at {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh per month so you can see
            how much state-by-state pricing alone changes the estimated bill.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            Real bills move above or below this benchmark when homes use more cooling or heating, have different
            appliance loads, or face utility delivery charges and taxes. That is why each bill page links onward to
            usage-specific cost pages, calculators, and appliance operating-cost examples.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Average electricity bill ranking</h2>
          <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 14 }}>
            All states link into dedicated bill pages with state-vs-national comparison, usage examples, trend links,
            appliance cost pages, and calculators.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid var(--color-border, #e5e7eb)",
              }}
            >
              <thead>
                <tr>
                  {["Rank", "State", "Estimated monthly bill", "Average rate"].map((label) => (
                    <th
                      key={label}
                      style={{
                        textAlign: "left",
                        padding: 10,
                        borderBottom: "1px solid var(--color-border, #e5e7eb)",
                        backgroundColor: "var(--color-surface-alt, #f9fafb)",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankedStates.map((row) => (
                  <tr key={row.slug}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.rank}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      <Link href={`/average-electricity-bill/${row.slug}`}>{row.name}</Link>
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.monthlyBill}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Common household usage examples</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {AVERAGE_ELECTRICITY_BILL_USAGE_EXAMPLES.map((kwh) => (
              <li key={kwh}>
                <Link href={getCanonicalUsageCostPath(kwh, representativeState.slug)}>
                  How much does {kwh.toLocaleString()} kWh cost in {representativeState.name}?
                </Link>
                {` `}
                <span className="muted">
                  Representative usage page using a state close to the national average bill benchmark.
                </span>
              </li>
            ))}
            <li>
              <Link href="/electricity-cost-calculator">National electricity cost calculator</Link>
              {` `}
              <span className="muted">Model a custom bill instead of using the standard 900 kWh assumption.</span>
            </li>
            <li>
              <Link href="/electricity-bill-estimator">Household-profile bill estimator hub</Link>
              {` `}
              <span className="muted">
                Compare deterministic apartment, small-home, medium-home, and large-home scenarios.
              </span>
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Featured appliance electricity cost pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {FEATURED_APPLIANCE_SLUGS.map((slug) => {
              const appliance = getApplianceConfig(slug);
              return (
                <li key={slug}>
                  <Link href={`/cost-to-run/${slug}/${representativeState.slug}`}>
                    Cost to run a {appliance.displayName.toLowerCase()} in {representativeState.name}
                  </Link>
                  {` `}
                  <span className="muted">
                    Connects the statewide electricity rate to a common household appliance scenario.
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More bill-navigation paths</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/${representativeState.slug}`}>{representativeState.name} electricity overview</Link>
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
              <Link href="/electricity-hubs/states">State electricity hubs</Link>
            </li>
            <li>
              <Link href="/electricity-hubs/usage">Electricity usage hubs</Link>
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Electricity cost comparison hub</Link>
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
              representativeState.sourceName ?? "U.S. Energy Information Administration (EIA)"
            )}
            .{" "}
            {representativeState.updatedLabel
              ? `Last dataset period: ${representativeState.updatedLabel}.`
              : "Data period label is currently unavailable."}{" "}
            Monthly bill estimates use a fixed {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh assumption
            so the state ranking is driven by the electricity rate rather than changing household usage.
          </p>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
