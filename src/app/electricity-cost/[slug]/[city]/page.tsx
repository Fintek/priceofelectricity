import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  CITY_REFERENCE_USAGE_KWH,
  getCityRolloutStaticParams,
  loadCityElectricitySummary,
} from "@/lib/longtail/cityElectricity";
import { getActiveApplianceSlugs, getActiveCitiesForState } from "@/lib/longtail/rollout";
import { formatRate, formatUsd, slugToName } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildDatasetJsonLd, buildFaqPageJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

export async function generateStaticParams() {
  return getCityRolloutStaticParams().map(({ state, city }) => ({
    slug: state,
    city,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}): Promise<Metadata> {
  const { slug, city } = await params;
  const summary = await loadCityElectricitySummary(slug, city);
  if (!summary) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-cost/${slug}/${city}`,
    });
  }

  const description = `Estimated electricity cost context for ${summary.city.name}, ${summary.state.name}: ${summary.cityRateCentsPerKwh.toFixed(
    2,
  )} cents per kWh and ${formatUsd(summary.monthlyCostEstimate)} per month at ${CITY_REFERENCE_USAGE_KWH.toLocaleString()} kWh. Modeled city estimate with methodology disclosure.`;

  return buildMetadata({
    title: `Electricity Cost in ${summary.city.name}, ${summary.state.name} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-cost/${summary.state.slug}/${summary.city.slug}`,
  });
}

export default async function ElectricityCostCityPage({
  params,
}: {
  params: Promise<{ slug: string; city: string }>;
}) {
  const { slug, city } = await params;
  const summary = await loadCityElectricitySummary(slug, city);
  if (!summary) notFound();

  const canonicalPath = `/electricity-cost/${summary.state.slug}/${summary.city.slug}`;
  const siblingCities = getActiveCitiesForState(summary.state.slug)
    .filter((item) => item.slug !== summary.city.slug)
    .slice(0, 8);
  const featuredApplianceSlugs = getActiveApplianceSlugs().slice(0, 3);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost", url: "/electricity-cost" },
    { name: summary.state.name, url: `/electricity-cost/${summary.state.slug}` },
    { name: summary.city.name, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Cost in ${summary.city.name}, ${summary.state.name}`,
    description: `City electricity estimate page for ${summary.city.name}, ${summary.state.name}. Values are deterministic modeled estimates with disclosure and source attribution.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `electricity cost in ${summary.city.name}`,
      `${summary.state.name} city electricity estimate`,
      "city electricity cost modeled estimate",
    ],
  });
  const datasetJsonLd = buildDatasetJsonLd({
    name: `${summary.state.name} Residential Electricity Dataset Reference`,
    description:
      "State-level residential electricity rate dataset used as the deterministic baseline for city electricity modeled estimates.",
    url: `/electricity-cost/${summary.state.slug}/${summary.city.slug}`,
    publisher: "PriceOfElectricity.com",
    sameAs: summary.state.sourceUrl ? [summary.state.sourceUrl] : undefined,
    distribution: [
      { contentUrl: "/datasets/electricity-prices-by-state.json", encodingFormat: "application/json" },
      { contentUrl: "/datasets/electricity-prices-by-state.csv", encodingFormat: "text/csv" },
    ],
  });
  const faqJsonLd = buildFaqPageJsonLd([
    {
      question: `Is this ${summary.city.name} electricity rate a utility quote?`,
      answer:
        "No. This page provides a deterministic modeled estimate for local context and comparison, not a utility tariff quote or enrollment offer.",
    },
    {
      question: `How is the ${summary.city.name} estimate calculated?`,
      answer: `${summary.estimateMethodNote} The reference household usage assumption is ${CITY_REFERENCE_USAGE_KWH.toLocaleString()} kWh per month.`,
    },
    {
      question: `Where can I compare bill scenarios for ${summary.state.name}?`,
      answer: `Use /electricity-bill-estimator/${summary.state.slug} for household profile scenarios and /electricity-cost-calculator/${summary.state.slug} for calculator-style usage scenarios.`,
    },
  ]);

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd, faqJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Cost", href: "/electricity-cost" },
          { label: summary.state.name, href: `/electricity-cost/${summary.state.slug}` },
          { label: summary.city.name },
        ]}
        title={`Electricity Cost in ${summary.city.name}, ${summary.state.name}`}
        intro={`This city page provides deterministic electricity-cost context for ${summary.city.name} using a modeled estimate framework. It is designed for local authority intent and remains distinct from calculator and average-bill benchmark intent.`}
        stats={[
          { label: "Estimated city rate", value: formatRate(summary.cityRateCentsPerKwh) },
          {
            label: `Estimated monthly cost (${CITY_REFERENCE_USAGE_KWH.toLocaleString()} kWh)`,
            value: formatUsd(summary.monthlyCostEstimate),
          },
          { label: "Estimated annual cost", value: formatUsd(summary.annualCostEstimate) },
          { label: `${summary.state.name} state rate`, value: formatRate(summary.stateRateCentsPerKwh) },
          {
            label: "Estimated city vs state monthly",
            value: `${summary.monthlyDifferenceVsState >= 0 ? "+" : "-"}${formatUsd(
              Math.abs(summary.monthlyDifferenceVsState),
            )}`,
          },
        ]}
        comparisonTitle="Methodology and estimate disclosure"
        comparisonRows={[
          {
            label: "Estimate basis",
            value:
              summary.estimateBasis === "city-config-reference"
                ? "City configured reference rate"
                : "Modeled from state baseline",
          },
          {
            label: "Reference usage assumption",
            value: `${CITY_REFERENCE_USAGE_KWH.toLocaleString()} kWh per month`,
          },
          {
            label: "State benchmark route",
            value: `/electricity-cost/${summary.state.slug}`,
          },
          {
            label: "Canonical city route",
            value: canonicalPath,
          },
        ]}
        comparisonSummary="City values on this page are deterministic estimates for local context and comparison. They are not utility tariff quotes and should not be interpreted as exact billed rates."
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: `Related electricity cost pages for ${summary.city.name}`,
            links: [
              {
                href: `/electricity-cost/${summary.state.slug}`,
                label: `${summary.state.name} electricity cost overview`,
                description: "Canonical state-level electricity cost benchmark page",
              },
              {
                href: `/average-electricity-bill/${summary.state.slug}`,
                label: `${summary.state.name} average electricity bill`,
                description: "Benchmark bill-intent page (separate from city cost context)",
              },
              {
                href: `/electricity-cost-calculator/${summary.state.slug}`,
                label: `${summary.state.name} electricity cost calculator`,
                description: "Calculator-intent route for custom scenarios",
              },
              {
                href: "/energy-comparison",
                label: "Energy comparison hub",
                description: "Curated discovery hub linking city, state, usage, and appliance clusters",
              },
              ...featuredApplianceSlugs.map((applianceSlug) => ({
                href: `/cost-to-run/${applianceSlug}/${summary.state.slug}`,
                label: `${slugToName(applianceSlug.replace(/-/g, " "))} cost in ${summary.state.name}`,
                description: "Canonical appliance operating-cost route for this state",
              })),
              {
                href: `/electricity-bill-estimator/${summary.state.slug}/medium-home`,
                label: `${summary.state.name} medium-home bill scenario`,
                description: "Representative household estimator profile with deterministic assumptions",
              },
            ],
          },
          ...(siblingCities.length > 0
            ? [
                {
                  title: `Other rollout-enabled cities in ${summary.state.name}`,
                  links: siblingCities.map((item) => ({
                    href: `/electricity-cost/${item.stateSlug}/${item.slug}`,
                    label: `Electricity cost in ${item.name}`,
                    description: "City electricity context page",
                  })),
                },
              ]
            : []),
        ]}
        sourceAttribution={{
          sourceName: summary.state.sourceName,
          sourceUrl: summary.state.sourceUrl,
          updatedLabel: summary.state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>How this city estimate is derived</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            This page starts from the statewide residential electricity baseline and applies a deterministic city
            estimate rule. Where a city reference value exists in the internal city dataset, that value is used as the
            estimate basis; otherwise a deterministic population-based modifier is applied to the state baseline.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            {summary.estimateMethodNote} This methodology is intended for consistent local context, not utility-plan
            quoting or bill prediction precision.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Intent separation and canonical scope</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost/${summary.state.slug}`}>State authority cost route</Link> remains the
              canonical state benchmark.
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${summary.state.slug}`}>State calculator route</Link> remains
              canonical for interactive/custom scenario intent.
            </li>
            <li>
              <Link href={`/average-electricity-bill/${summary.state.slug}`}>State average bill route</Link> remains
              canonical for monthly benchmark bill intent.
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
