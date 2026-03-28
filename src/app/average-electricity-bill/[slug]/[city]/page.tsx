import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
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
    description: `City benchmark bill estimate page for ${summary.city.name}, ${summary.state.name}. Deterministic benchmark bill framing at ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `average electricity bill in ${summary.city.name}`,
      `${summary.state.name} city electricity bill benchmark`,
      "deterministic benchmark electricity bill estimate",
    ],
  });
  const faqJsonLd = buildFaqPageJsonLd([
    {
      question: `What does the average electricity bill estimate for ${summary.city.name} assume?`,
      answer: `This benchmark assumes ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh per month and applies a deterministic city electricity-rate estimate.`,
    },
    {
      question: `Is this page a calculator?`,
      answer:
        "No. This page is a benchmark-bill reference page. Calculator intent remains in the electricity-cost-calculator family.",
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
        intro={`This city page provides a deterministic benchmark electricity-bill estimate for ${summary.city.name} at ${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh per month. It complements, but does not replace, city electricity-cost authority pages and calculator scenarios.`}
        stats={[
          { label: `${summary.city.name} estimated rate`, value: formatRate(summary.cityRateCentsPerKwh) },
          { label: "Estimated monthly bill", value: formatUsd(summary.cityMonthlyBill) },
          { label: "Estimated annual bill", value: formatUsd(summary.cityAnnualBill) },
          { label: `${summary.state.name} benchmark monthly bill`, value: formatUsd(summary.state.monthlyBill) },
          { label: "Difference vs state benchmark", value: differenceLabel },
        ]}
        comparisonTitle="Benchmark methodology and intent boundary"
        comparisonRows={[
          {
            label: "Benchmark usage assumption",
            value: `${AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()} kWh/month`,
          },
          {
            label: "City estimate basis",
            value:
              summary.estimateBasis === "city-config-reference"
                ? "Configured city reference rate"
                : "Modeled from state baseline",
          },
          {
            label: "Canonical city bill route",
            value: canonicalPath,
          },
          {
            label: "State bill benchmark route",
            value: `/average-electricity-bill/${summary.state.slug}`,
          },
        ]}
        comparisonSummary={`${summary.estimateMethodNote} This route is benchmark-bill intent only and stays distinct from calculator and city-authority intent families.`}
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: `Related benchmark and city context pages for ${summary.city.name}`,
            links: [
              {
                href: `/average-electricity-bill/${summary.state.slug}`,
                label: `${summary.state.name} average electricity bill`,
                description: "State-level benchmark bill owner route",
              },
              {
                href: `/electricity-cost/${summary.state.slug}/${summary.city.slug}`,
                label: `${summary.city.name} electricity cost context`,
                description: "City electricity authority route (separate intent)",
              },
              {
                href: `/electricity-cost-calculator/${summary.state.slug}`,
                label: `${summary.state.name} electricity cost calculator`,
                description: "Calculator-intent route for custom usage scenarios",
              },
              {
                href: `/electricity-bill-estimator/${summary.state.slug}`,
                label: `${summary.state.name} electricity bill estimator`,
                description: "Household profile scenario family",
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
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How to read this city benchmark bill</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            This benchmark applies the city electricity-rate estimate to a standard
            {" "}
            {AVERAGE_ELECTRICITY_BILL_USAGE_KWH.toLocaleString()}
            {" "}
            kWh monthly profile so cities can be compared on a consistent basis.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            It is not a utility quote and not a custom calculator flow. For scenario changes, use the state calculator
            route; for local electricity-cost authority context, use the city electricity-cost route.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Intent separation guardrails</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/average-electricity-bill/${summary.state.slug}`}>State bill benchmark route</Link> remains
              the state-level owner for benchmark bill intent.
            </li>
            <li>
              <Link href={`/electricity-cost/${summary.state.slug}/${summary.city.slug}`}>City authority route</Link>
              {" "}
              remains the owner for city electricity-cost context intent.
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${summary.state.slug}`}>Calculator route</Link> remains the
              owner for custom scenario calculator intent.
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
