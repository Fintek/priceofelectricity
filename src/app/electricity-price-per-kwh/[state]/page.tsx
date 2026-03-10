import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import {
  calculateUsageCost,
  formatRate,
  formatUsd,
  getLongtailStateStaticParams,
  loadLongtailStateData,
} from "@/lib/longtail/stateLongtail";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { isLongtailFamilyActive } from "@/lib/longtail/rollout";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  if (!isLongtailFamilyActive("state-price-per-kwh")) return [];
  return getLongtailStateStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  if (!isLongtailFamilyActive("state-price-per-kwh")) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-price-per-kwh/${state}`,
    });
  }
  const data = await loadLongtailStateData(state);

  if (!data) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-price-per-kwh/${state}`,
    });
  }

  const title = `Electricity Price per kWh in ${data.name} | PriceOfElectricity.com`;
  const cost1000 = calculateUsageCost(data.avgRateCentsPerKwh, 1000);
  const description = data.avgRateCentsPerKwh != null
    ? `See the current electricity price per kWh in ${data.name}: ${data.avgRateCentsPerKwh.toFixed(2)}¢. Estimated 1000 kWh cost: ${formatUsd(cost1000)}.`
    : `Current electricity price per kWh in ${data.name}, with state-to-national comparison and usage cost estimates.`;

  return buildMetadata({
    title,
    description,
    canonicalPath: `/electricity-price-per-kwh/${state}`,
  });
}

export default async function ElectricityPricePerKwhStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  if (!isLongtailFamilyActive("state-price-per-kwh")) notFound();
  const data = await loadLongtailStateData(state);
  if (!data) notFound();

  const canonicalPath = `/electricity-price-per-kwh/${state}`;
  const cost1000 = calculateUsageCost(data.avgRateCentsPerKwh, 1000);
  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "state-price",
    stateData: data,
  });
  const diffPercent =
    data.differencePercent != null
      ? `${data.differencePercent >= 0 ? "+" : ""}${data.differencePercent.toFixed(1)}%`
      : "N/A";

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: data.name, url: `/${state}` },
    { name: "Electricity Price per kWh", url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Price per kWh in ${data.name}`,
    description:
      data.avgRateCentsPerKwh != null
        ? `${data.name} electricity rate is ${data.avgRateCentsPerKwh.toFixed(2)}¢/kWh with estimated 1000 kWh cost of ${formatUsd(cost1000)}.`
        : `${data.name} electricity price per kWh page.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`electricity price per kWh ${data.name}`, `${data.name} electricity rates`],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: data.name, href: `/${state}` },
          { label: "Electricity Price per kWh" },
        ]}
        title={`Electricity Price per kWh in ${data.name}`}
        intro={`This page shows the latest statewide residential electricity price per kWh for ${data.name}, along with usage-based cost estimates and national comparison context.`}
        stats={[
          { label: "Current average rate", value: formatRate(data.avgRateCentsPerKwh) },
          { label: "Estimated 1000 kWh cost", value: formatUsd(cost1000) },
          {
            label: "Data period",
            value: data.updatedLabel ?? "N/A",
            hint: "Published monthly",
          },
        ]}
        comparisonTitle={`How ${data.name} compares nationally`}
        comparisonRows={[
          { label: `${data.name} rate`, value: formatRate(data.avgRateCentsPerKwh) },
          { label: "U.S. average", value: formatRate(data.nationalAverageCentsPerKwh) },
          { label: "Difference", value: diffPercent },
          { label: "Category", value: data.comparisonCategory ?? "N/A" },
        ]}
        comparisonSummary={
          data.differenceCents != null
            ? `${data.name} is ${data.differenceCents >= 0 ? "above" : "below"} the U.S. average by ${Math.abs(data.differenceCents).toFixed(2)}¢ per kWh.`
            : undefined
        }
        relatedLinks={[
          { href: `/electricity-price-trend/${state}`, label: `Electricity price trend in ${data.name}` },
          { href: `/average-electricity-bill/${state}`, label: `Average electricity bill in ${data.name}` },
          { href: `/electricity-usage-cost/1000/${state}`, label: `1000 kWh usage cost in ${data.name}` },
          { href: `/electricity-cost/${state}`, label: `Electricity cost overview for ${data.name}` },
          { href: "/compare", label: "State electricity comparison hub" },
        ]}
        relatedLinkSections={relatedLinkSections}
        monetizationContext={{
          pageType: "longtail-state-price",
          state,
          stateName: data.name,
        }}
        sourceAttribution={{
          sourceName: data.sourceName,
          sourceUrl: data.sourceUrl,
          updatedLabel: data.updatedLabel,
        }}
      />
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
