import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import CityRateDisclosure from "@/components/longtail/CityRateDisclosure";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import {
  AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
  getAverageBillCityStaticParams,
  loadAverageBillCitySummary,
} from "@/lib/longtail/averageBill";
import { getRelease } from "@/lib/knowledge/fetch";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildFaqPageJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

export async function generateStaticParams(): Promise<Array<{ slug: string; city: string }>> {
  return getAverageBillCityStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}): Promise<Metadata> {
  const { slug, city } = await params;
  const summary = await loadAverageBillCitySummary(slug, city);
  if (!summary) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/average-electricity-bill/${slug}/${city}`,
    });
  }

  const description = `Average electricity bill estimate in ${summary.city.name}, ${summary.state.name}: ${formatUsd(
    summary.cityMonthlyBill,
  )} per month at ${formatRate(summary.cityRateCentsPerKwh)} using a ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh benchmark.`;
  return buildMetadata({
    title: `Average Electricity Bill in ${summary.city.name}, ${summary.state.name} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/average-electricity-bill/${summary.state.slug}/${summary.city.slug}`,
  });
}

export default async function AverageElectricityBillCityPage({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}) {
  const { slug, city } = await params;
  const summary = await loadAverageBillCitySummary(slug, city);
  if (!summary) notFound();

  const canonicalPath = `/average-electricity-bill/${summary.state.slug}/${summary.city.slug}`;
  const differenceLabel = `${summary.monthlyDifferenceVsState >= 0 ? "+" : "-"}${formatUsd(
    Math.abs(summary.monthlyDifferenceVsState),
  )}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Average Electricity Bill", url: "/average-electricity-bill" },
    { name: summary.state.name, url: `/average-electricity-bill/${summary.state.slug}` },
    { name: summary.city.name, url: canonicalPath },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `Average Electricity Bill in ${summary.city.name}, ${summary.state.name}`,
    description: `City benchmark bill estimate for ${summary.city.name}, ${summary.state.name} at ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh per month.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `average electricity bill in ${summary.city.name}`,
      `${summary.state.name} city electricity bill benchmark`,
      "benchmark electricity bill estimate",
    ],
  });
  const faqJsonLd = buildFaqPageJsonLd([
    {
      question: `What does the average electricity bill estimate for ${summary.city.name} assume?`,
      answer: `This benchmark assumes ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh per month and uses the site's city electricity rate estimate for ${summary.city.name}.`,
    },
    {
      question: `Is this page a calculator?`,
      answer:
        "No. It's a fixed-usage bill estimate. For an interactive calculator, use the state electricity cost calculator.",
    },
    {
      question: `How does ${summary.city.name} compare with the ${summary.state.name} state benchmark?`,
      answer: `The modeled monthly difference is ${differenceLabel} versus the state benchmark bill estimate.`,
    },
  ]);

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, faqJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Average Electricity Bill", href: "/average-electricity-bill" },
          { label: summary.state.name, href: `/average-electricity-bill/${summary.state.slug}` },
          { label: summary.city.name },
        ]}
        title={`Average Electricity Bill in ${summary.city.name}, ${summary.state.name}`}
        intro={summary.cityMonthlyBill != null
          ? `A typical household in ${summary.city.name}, ${summary.state.name} pays about ${formatUsd(summary.cityMonthlyBill)} a month for electricity at ${formatRate(summary.cityRateCentsPerKwh)}, based on ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh of monthly use.`
          : `Estimated monthly electricity bill for ${summary.city.name}, ${summary.state.name}, based on ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh of monthly use.`}
        stats={[
          { label: `${summary.city.name} estimated rate`, value: formatRate(summary.cityRateCentsPerKwh) },
          { label: "Estimated monthly bill", value: formatUsd(summary.cityMonthlyBill) },
          { label: "Estimated annual bill", value: formatUsd(summary.cityAnnualBill) },
          { label: `${summary.state.name} benchmark monthly bill`, value: formatUsd(summary.state.monthlyBill) },
          { label: "Difference vs state benchmark", value: differenceLabel },
        ]}
        comparisonTitle="How this benchmark works"
        comparisonRows={[
          {
            label: "Benchmark usage assumption",
            value: `${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh/month`,
          },
          {
            label: "City estimate basis",
            value: "Modeled from state EIA baseline",
          },
          {
            label: "This city page",
            value: canonicalPath,
          },
          {
            label: "State average bill page",
            value: `/average-electricity-bill/${summary.state.slug}`,
          },
        ]}
        comparisonSummary={`${summary.estimateMethodNote} This is a fixed-usage estimate. For custom usage, use the state calculator. For city rates, see the city electricity cost page.`}
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: `Related benchmark and city context pages for ${summary.city.name}`,
            links: [
              {
                href: `/average-electricity-bill/${summary.state.slug}`,
                label: `${summary.state.name} average electricity bill`,
                description: "State-level average bill at the same kWh benchmark",
              },
              {
                href: `/electricity-cost/${summary.state.slug}/${summary.city.slug}`,
                label: `${summary.city.name} electricity cost context`,
                description: "City electricity rates and cost overview",
              },
              {
                href: `/electricity-cost-calculator/${summary.state.slug}`,
                label: `${summary.state.name} electricity cost calculator`,
                description: "Custom usage and bill math",
              },
              {
                href: `/electricity-bill-estimator/${summary.state.slug}`,
                label: `${summary.state.name} electricity bill estimator`,
                description: "Household profile bill estimates",
              },
            ],
          },
        ]}
        sourceAttribution={{
          sourceName: summary.state.sourceName,
          sourceUrl: summary.state.sourceUrl,
          updatedLabel: summary.state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">How to read this city benchmark bill</h2>
          <CityRateDisclosure eiaMonthLabel={summary.state.updatedLabel} />
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            This benchmark applies the modeled city rate to a standard{" "}
            {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh monthly profile so cities can be compared on a
            consistent basis. It is not a utility quote and not a custom calculator. To try different usage levels, use
            the state electricity cost calculator; for local rates and electricity cost context, see the city electricity
            cost page.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">Which page fits your question?</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/average-electricity-bill/${summary.state.slug}`}>
                {summary.state.name} average electricity bill
              </Link>{" "}
              — same fixed kWh benchmark, statewide.
            </li>
            <li>
              <Link href={`/electricity-cost/${summary.state.slug}/${summary.city.slug}`}>
                {summary.city.name} electricity cost
              </Link>{" "}
              — city rates and cost context for this city.
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${summary.state.slug}`}>
                {summary.state.name} electricity cost calculator
              </Link>{" "}
              — enter your own usage and see estimated costs.
            </li>
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
