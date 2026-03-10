import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import {
  buildIndustryEstimate,
  parseIndustrySlug,
} from "@/lib/longtail/industryLongtail";
import { getIndustryConfig } from "@/lib/longtail/industryConfig";
import { formatRate, formatUsd, getLongtailStateStaticParams, loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import {
  getActiveIndustrySlugs,
  isActiveIndustrySlug,
  isLongtailFamilyActive,
} from "@/lib/longtail/rollout";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  if (!isLongtailFamilyActive("industry-cost")) return [];
  const industrySlugs = getActiveIndustrySlugs();
  if (industrySlugs.length === 0) return [];
  const states = await getLongtailStateStaticParams();
  return industrySlugs.flatMap((industry) =>
    states.map(({ state }) => ({ industry, state })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string; state: string }>;
}): Promise<Metadata> {
  const { industry, state } = await params;
  const parsedIndustry = parseIndustrySlug(industry);
  if (
    !isLongtailFamilyActive("industry-cost") ||
    !parsedIndustry ||
    !isActiveIndustrySlug(parsedIndustry)
  ) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/industry-electricity-cost/${industry}/${state}`,
    });
  }

  const stateData = await loadLongtailStateData(state);
  if (!stateData) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/industry-electricity-cost/${industry}/${state}`,
    });
  }

  const config = getIndustryConfig(parsedIndustry);
  const estimate = buildIndustryEstimate(parsedIndustry, stateData);
  const title = `${config.displayName} in ${stateData.name} | PriceOfElectricity.com`;
  const description =
    estimate.monthlyCostState != null
      ? `${config.displayName} in ${stateData.name}: estimated ${formatUsd(estimate.monthlyCostState)} per month using ${config.monthlyUsageKwh.toLocaleString()} kWh/month example usage at ${formatRate(stateData.avgRateCentsPerKwh)}.`
      : `${config.displayName} in ${stateData.name}: scenario-based electricity estimate using state average rates.`;

  return buildMetadata({
    title,
    description,
    canonicalPath: `/industry-electricity-cost/${parsedIndustry}/${state}`,
  });
}

export default async function IndustryElectricityCostPage({
  params,
}: {
  params: Promise<{ industry: string; state: string }>;
}) {
  const { industry, state } = await params;
  const parsedIndustry = parseIndustrySlug(industry);
  if (
    !isLongtailFamilyActive("industry-cost") ||
    !parsedIndustry ||
    !isActiveIndustrySlug(parsedIndustry)
  ) notFound();

  const stateData = await loadLongtailStateData(state);
  if (!stateData) notFound();

  const config = getIndustryConfig(parsedIndustry);
  const estimate = buildIndustryEstimate(parsedIndustry, stateData);
  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "industry-cost",
    stateData,
    industry: parsedIndustry,
  });
  const canonicalPath = `/industry-electricity-cost/${parsedIndustry}/${state}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: stateData.name, url: `/${state}` },
    { name: "Industry Electricity Cost", url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `${config.displayName} in ${stateData.name}`,
    description: estimate.summary,
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `${config.shortLabel} electricity cost ${stateData.name}`,
      `${stateData.name} electricity cost`,
      "scenario-based electricity estimates",
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: stateData.name, href: `/${state}` },
          { label: config.displayName },
        ]}
        title={`${config.displayName} in ${stateData.name}`}
        intro={config.introTemplate(stateData.name)}
        stats={[
          { label: `${stateData.name} average rate`, value: formatRate(stateData.avgRateCentsPerKwh) },
          {
            label: `${config.shortLabel} example monthly cost`,
            value: formatUsd(estimate.monthlyCostState),
            hint: `${estimate.monthlyUsageKwh.toLocaleString()} kWh/month example`,
          },
          {
            label: `${config.shortLabel} example annual cost`,
            value: formatUsd(estimate.annualCostState),
            hint: `${estimate.annualUsageKwh.toLocaleString()} kWh/year example`,
          },
        ]}
        comparisonTitle="Comparison to U.S. average"
        comparisonRows={[
          { label: `${stateData.name} monthly estimate`, value: formatUsd(estimate.monthlyCostState) },
          { label: "U.S. monthly estimate", value: formatUsd(estimate.monthlyCostNational) },
          {
            label: "Monthly difference",
            value:
              estimate.monthlyDifferenceVsNational != null
                ? `${estimate.monthlyDifferenceVsNational >= 0 ? "+" : "-"}${formatUsd(Math.abs(estimate.monthlyDifferenceVsNational))}`
                : "N/A",
          },
          {
            label: "Annual difference",
            value:
              estimate.annualDifferenceVsNational != null
                ? `${estimate.annualDifferenceVsNational >= 0 ? "+" : "-"}${formatUsd(Math.abs(estimate.annualDifferenceVsNational))}`
                : "N/A",
          },
        ]}
        comparisonSummary={estimate.summary}
        relatedLinks={[
          { href: `/electricity-price-per-kwh/${state}`, label: `Electricity price per kWh in ${stateData.name}` },
          { href: `/electricity-price-trend/${state}`, label: `Electricity price trend in ${stateData.name}` },
          { href: `/average-electricity-bill/${state}`, label: `Average electricity bill in ${stateData.name}` },
          { href: `/electricity-usage-cost/1000/${state}`, label: `1000 kWh usage cost in ${stateData.name}` },
          { href: `/electricity-cost-calculator/${state}`, label: `Electricity cost calculator for ${stateData.name}` },
        ]}
        relatedLinkSections={relatedLinkSections}
        monetizationContext={{
          pageType: "longtail-industry",
          state,
          stateName: stateData.name,
          industry: parsedIndustry,
        }}
        sourceAttribution={{
          sourceName: stateData.sourceName,
          sourceUrl: stateData.sourceUrl,
          updatedLabel: stateData.updatedLabel,
        }}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{estimate.assumptionsLabel}</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>{estimate.assumptionsNotes}</p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {estimate.framingBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
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
