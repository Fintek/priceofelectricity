import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import {
  AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
  buildAverageBillApplianceLinks,
  buildAverageBillComparisonSummary,
  buildAverageBillUsageExamples,
  loadAverageBillStateSummary,
} from "@/lib/longtail/averageBill";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const state = await loadAverageBillStateSummary(slug);
  if (!state) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/average-electricity-bill/${slug}`,
    });
  }

  const description =
    state.monthlyBill != null
      ? `Average electricity bill in ${state.name}: ${formatUsd(state.monthlyBill)} per month at ${formatRate(
          state.avgRateCentsPerKwh,
        )} using a ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh benchmark.`
      : `${state.name} average electricity bill. Residential rate, estimated monthly and annual bills.`;

  return buildMetadata({
    title: `Average Electricity Bill in ${state.name} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/average-electricity-bill/${slug}`,
  });
}

export default async function AverageElectricityBillStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = await loadAverageBillStateSummary(slug);
  if (!state) notFound();

  const canonicalPath = `/average-electricity-bill/${slug}`;
  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "average-bill",
    stateData: state,
    usageKwh: AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
  });
  const usageExamples = buildAverageBillUsageExamples(state);
  const applianceLinks = buildAverageBillApplianceLinks(state);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Average Electricity Bill", url: "/average-electricity-bill" },
    { name: state.name, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Average Electricity Bill in ${state.name}`,
    description:
      state.monthlyBill != null
        ? `Average electricity bill in ${state.name}: ${formatUsd(state.monthlyBill)} per month using a ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh residential benchmark.`
        : `${state.name} average electricity bill.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`${state.name} electricity bill`, "average electricity bill by state", "consumer electricity costs"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Average Electricity Bill", href: "/average-electricity-bill" },
          { label: state.name },
        ]}
        title={`Average Electricity Bill in ${state.name}`}
        intro={state.monthlyBill != null
          ? `A typical household in ${state.name} pays about ${formatUsd(state.monthlyBill)} per month for electricity, based on the state average rate of ${formatRate(state.avgRateCentsPerKwh)} and a ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh monthly usage benchmark.`
          : `Estimated monthly and annual electricity bills for ${state.name}, based on the state average residential rate and a ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh monthly usage benchmark.`}
        stats={[
          { label: `${state.name} average rate`, value: formatRate(state.avgRateCentsPerKwh) },
          { label: "Estimated monthly bill", value: formatUsd(state.monthlyBill) },
          { label: "Estimated annual bill", value: formatUsd(state.annualBill) },
          { label: "500 kWh example", value: formatUsd(usageExamples.find((row) => row.kwh === 500)?.cost ?? null) },
          {
            label: "1,500 kWh example",
            value: formatUsd(usageExamples.find((row) => row.kwh === 1500)?.cost ?? null),
          },
        ]}
        comparisonTitle={`${state.name} vs U.S. average bill`}
        comparisonRows={[
          { label: `${state.name} monthly bill`, value: formatUsd(state.monthlyBill) },
          { label: "U.S. monthly bill", value: formatUsd(state.nationalMonthlyBill) },
          {
            label: "Monthly difference",
            value:
              state.monthlyDifference != null
                ? `${state.monthlyDifference >= 0 ? "+" : "-"}${formatUsd(Math.abs(state.monthlyDifference))}`
                : "N/A",
          },
          { label: `${state.name} average rate`, value: formatRate(state.avgRateCentsPerKwh) },
        ]}
        comparisonSummary={buildAverageBillComparisonSummary(state)}
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: `${state.name} appliance electricity examples`,
            links: applianceLinks,
          },
          ...relatedLinkSections,
        ]}
        monetizationContext={{
          pageType: "state-authority",
          state: slug,
          stateName: state.name,
        }}
        sourceAttribution={{
          sourceName: state.sourceName,
          sourceUrl: state.sourceUrl,
          updatedLabel: state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">How to interpret this bill estimate</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            The statewide residential rate in {state.name} is {formatRate(state.avgRateCentsPerKwh)}. Applying that
            rate to {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh of monthly use produces an estimated bill
            of {formatUsd(state.monthlyBill)} before delivery charges, taxes, and fixed utility fees.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            That benchmark is useful for comparing states, but real households can land above or below it depending on
            cooling load, heating type, home size, appliance intensity, and local utility rate design.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">Usage-level bill examples in {state.name}</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {["Monthly usage", "Estimated cost", "Canonical page"].map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usageExamples.map((example) => (
                  <tr key={example.kwh}>
                    <td>{example.kwh.toLocaleString()} kWh</td>
                    <td>{formatUsd(example.cost)}</td>
                    <td>
                      <Link href={example.href}>{example.consumerLabel}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginBottom: 0, marginTop: 12, lineHeight: 1.7 }}>
            These usage pages are the canonical route family for fixed-kWh consumer electricity searches. The bill page
            uses them as supporting examples rather than duplicating the same intent under another URL.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">What usually moves a household bill?</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            In practice, the biggest bill drivers are air conditioning, space heating, electric water heating, laundry,
            EV charging, and the length of time high-wattage appliances run each month.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            That is why this page links to both usage-cost routes and appliance operating-cost pages: one shows what a
            whole-home kWh pattern looks like, and the other shows how specific devices contribute to the final bill.
          </p>
        </section>
      </LongtailStateTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
