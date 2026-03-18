import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import { buildCalculatorApplianceLinks } from "@/lib/longtail/calculatorCluster";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import {
  buildUsageNarrativeForState,
  buildUsageTierCostRows,
  formatKwh,
  loadUsageStateSummary,
  NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH,
} from "@/lib/longtail/usageIntelligence";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const data = await loadUsageStateSummary(state);
  if (!data) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-usage/${state}`,
    });
  }
  return buildMetadata({
    title: `Electricity Usage in ${data.name} | PriceOfElectricity.com`,
    description: buildUsageNarrativeForState(data),
    canonicalPath: `/electricity-usage/${state}`,
  });
}

export default async function ElectricityUsageStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const data = await loadUsageStateSummary(state);
  if (!data) notFound();

  const tierRows = buildUsageTierCostRows(data);
  const applianceCalculatorLinks = buildCalculatorApplianceLinks(data, 6);
  const relatedSections = await buildLongtailLinkSections({
    pageType: "average-bill",
    stateData: data,
    usageKwh: data.estimatedMonthlyUsageKwh,
  });

  const canonicalPath = `/electricity-usage/${state}`;
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Usage", url: "/electricity-usage" },
    { name: data.name, url: canonicalPath },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Usage in ${data.name}`,
    description: buildUsageNarrativeForState(data),
    url: canonicalPath,
    isPartOf: "/",
    about: [`electricity usage in ${data.name}`, "average kwh per month", "household electricity consumption"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Usage", href: "/electricity-usage" },
          { label: data.name },
        ]}
        title={`Household Electricity Usage in ${data.name}`}
        intro={`This page estimates typical household electricity consumption in ${data.name} and maps usage levels directly to cost outcomes using the state's residential electricity rate.`}
        stats={[
          { label: `${data.name} modeled monthly usage`, value: formatKwh(data.estimatedMonthlyUsageKwh) },
          { label: `${data.name} modeled annual usage`, value: formatKwh(data.estimatedAnnualUsageKwh) },
          { label: "U.S. monthly benchmark", value: formatKwh(NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH) },
          { label: `${data.name} average rate`, value: formatRate(data.avgRateCentsPerKwh) },
          { label: "Modeled monthly cost", value: formatUsd((data.avgRateCentsPerKwh ?? 0) / 100 * data.estimatedMonthlyUsageKwh) },
        ]}
        comparisonTitle={`${data.name} usage vs U.S. household benchmark`}
        comparisonRows={[
          { label: `${data.name} monthly usage`, value: formatKwh(data.estimatedMonthlyUsageKwh) },
          { label: "U.S. monthly usage", value: formatKwh(NATIONAL_AVERAGE_HOUSEHOLD_USAGE_KWH) },
          { label: `${data.name} rate`, value: formatRate(data.avgRateCentsPerKwh) },
          { label: "U.S. benchmark rate", value: formatRate(data.nationalAverageCentsPerKwh) },
        ]}
        comparisonSummary={buildUsageNarrativeForState(data)}
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: `${data.name} appliance calculator examples`,
            links: applianceCalculatorLinks,
          },
          ...relatedSections,
        ]}
        monetizationContext={{
          pageType: "state-authority",
          state,
          stateName: data.name,
        }}
        sourceAttribution={{
          sourceName: data.sourceName,
          sourceUrl: data.sourceUrl,
          updatedLabel: data.updatedLabel,
        }}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Usage-to-cost scenarios in {data.name}</h2>
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
                  {["Monthly usage", "Estimated monthly cost", "Estimated annual cost", "Canonical cost page"].map(
                    (label) => (
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
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {tierRows.map((row) => (
                  <tr key={row.kwh}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.kwh.toLocaleString()} kWh
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.monthlyCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.annualCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      <Link href={row.href}>Open {row.kwh.toLocaleString()} kWh page</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Connected electricity tools</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href={`/electricity-cost-calculator/${state}`}>{data.name} electricity cost calculator</Link></li>
            <li><Link href={`/average-electricity-bill/${state}`}>Average electricity bill in {data.name}</Link></li>
            <li><Link href={`/electricity-price-per-kwh/${state}`}>Electricity price per kWh in {data.name}</Link></li>
            <li><Link href={`/electricity-price-trend/${state}`}>Electricity price trend in {data.name}</Link></li>
            <li><Link href={`/cost-to-run/refrigerator/${state}`}>Refrigerator cost example in {data.name}</Link></li>
            <li><Link href="/electricity-usage">Back to national usage hub</Link></li>
          </ul>
        </section>
      </LongtailStateTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
