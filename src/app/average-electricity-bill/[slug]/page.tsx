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

  const title =
    state.monthlyBill != null
      ? `Average Electricity Bill in ${state.name}: $${Math.round(state.monthlyBill)}/Month`
      : `Average Electricity Bill in ${state.name}`;

  return buildMetadata({
    title,
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
  const annualBillDifference = state.monthlyDifference != null ? state.monthlyDifference * 12 : null;
  const billComparison =
    annualBillDifference != null && Math.abs(annualBillDifference) >= 25
      ? ` That's about ${formatUsd(Math.abs(annualBillDifference))} a year ${annualBillDifference >= 0 ? "more" : "less"} than the typical U.S. household pays.`
      : "";

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
          ? `A typical household in ${state.name} pays about ${formatUsd(state.monthlyBill)} a month for electricity — roughly ${formatUsd(state.annualBill)} a year — at the state average rate of ${formatRate(state.avgRateCentsPerKwh)}.${billComparison} That's based on ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh of monthly use at the all-in average rate, before separately billed taxes and fixed fees.`
          : `Estimated monthly and annual electricity bills for ${state.name}, based on the state average residential rate and ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh of monthly use.`}
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
          <h2 className="heading-section">Is this what you&apos;ll actually pay?</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            It&apos;s a fair benchmark, not a forecast. We take {state.name}&apos;s average rate of{" "}
            {formatRate(state.avgRateCentsPerKwh)} and apply it to {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()}{" "}
            kWh a month at the all-in average rate, which comes to {formatUsd(state.monthlyBill)} before separately billed taxes
            and fixed fees.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            Your own bill can land well above or below that, depending on how much you run the air conditioning, how
            you heat your home and water, your home&apos;s size, and how your utility designs its rates.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">Usage-level bill examples in {state.name}</h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {["Monthly usage", "Estimated cost", "Canonical page"].map((label) => (
                    <th scope="col" key={label}>{label}</th>
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
            These pages answer fixed-usage questions like &quot;how much does 1,000 kWh cost?&quot;
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">What usually moves a household bill?</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            In practice, the biggest bill drivers are air conditioning, space heating, electric water heating, laundry,
            EV charging, and the length of time high-wattage appliances run each month.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            Want to see where your money actually goes? The usage-cost pages show what a whole-home kWh pattern costs,
            and the appliance pages break down how individual devices add up.
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
