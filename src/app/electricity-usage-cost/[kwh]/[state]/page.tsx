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
  isValidLongtailUsageKwh,
  loadLongtailStateData,
} from "@/lib/longtail/stateLongtail";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import {
  isActiveUsageKwhTier,
  isLongtailFamilyActive,
} from "@/lib/longtail/rollout";

export const dynamicParams = true;
export const revalidate = 86400;

function parseUsageKwh(kwhParam: string): number | null {
  const parsed = Number(kwhParam);
  if (!Number.isFinite(parsed)) return null;
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kwh: string; state: string }>;
}): Promise<Metadata> {
  const { kwh, state } = await params;
  const parsedKwh = parseUsageKwh(kwh);
  if (
    !isLongtailFamilyActive("usage-cost") ||
    parsedKwh == null ||
    !isValidLongtailUsageKwh(parsedKwh) ||
    !isActiveUsageKwhTier(parsedKwh)
  ) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-usage-cost/${kwh}/${state}`,
    });
  }

  const data = await loadLongtailStateData(state);
  if (!data) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-usage-cost/${parsedKwh}/${state}`,
    });
  }

  const title = `Electricity Cost for ${parsedKwh} kWh in ${data.name} | PriceOfElectricity.com`;
  const usageCost = calculateUsageCost(data.avgRateCentsPerKwh, parsedKwh);
  const description =
    usageCost != null
      ? `${parsedKwh} kWh of electricity in ${data.name} costs about ${formatUsd(usageCost)} at the current average rate of ${formatRate(data.avgRateCentsPerKwh)}.`
      : `${parsedKwh} kWh electricity cost estimate in ${data.name}.`;

  return buildMetadata({
    title,
    description,
    canonicalPath: `/electricity-usage-cost/${parsedKwh}/${state}`,
  });
}

export default async function ElectricityUsageCostPage({
  params,
}: {
  params: Promise<{ kwh: string; state: string }>;
}) {
  const { kwh, state } = await params;
  const parsedKwh = parseUsageKwh(kwh);
  if (
    !isLongtailFamilyActive("usage-cost") ||
    parsedKwh == null ||
    !isValidLongtailUsageKwh(parsedKwh) ||
    !isActiveUsageKwhTier(parsedKwh)
  ) notFound();

  const data = await loadLongtailStateData(state);
  if (!data) notFound();

  const canonicalPath = `/electricity-usage-cost/${parsedKwh}/${state}`;
  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "usage-cost",
    stateData: data,
    usageKwh: parsedKwh,
  });
  const usageCost = calculateUsageCost(data.avgRateCentsPerKwh, parsedKwh);
  const nationalUsageCost = calculateUsageCost(data.nationalAverageCentsPerKwh, parsedKwh);
  const difference =
    usageCost != null && nationalUsageCost != null ? usageCost - nationalUsageCost : null;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: data.name, url: `/${state}` },
    { name: `${parsedKwh} kWh Usage Cost`, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Cost for ${parsedKwh} kWh in ${data.name}`,
    description:
      usageCost != null
        ? `${parsedKwh} kWh electricity usage in ${data.name} is estimated at ${formatUsd(usageCost)}.`
        : `${parsedKwh} kWh electricity usage estimate in ${data.name}.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`${parsedKwh} kWh electricity cost ${data.name}`, "usage-based electricity cost"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: data.name, href: `/${state}` },
          { label: "Usage Cost" },
          { label: `${parsedKwh} kWh` },
        ]}
        title={`How Much Does ${parsedKwh.toLocaleString()} kWh Cost in ${data.name}?`}
        intro={`This usage-based electricity page estimates the energy-only cost of ${parsedKwh.toLocaleString()} kWh in ${data.name} using the latest statewide residential average rate.`}
        stats={[
          { label: `${data.name} average rate`, value: formatRate(data.avgRateCentsPerKwh) },
          { label: `Estimated ${parsedKwh.toLocaleString()} kWh cost`, value: formatUsd(usageCost) },
          { label: "U.S. average cost", value: formatUsd(nationalUsageCost) },
        ]}
        comparisonTitle="Compared to U.S. average"
        comparisonRows={[
          { label: `${data.name} (${parsedKwh.toLocaleString()} kWh)`, value: formatUsd(usageCost) },
          { label: `U.S. (${parsedKwh.toLocaleString()} kWh)`, value: formatUsd(nationalUsageCost) },
          {
            label: "Difference",
            value:
              difference != null
                ? `${difference >= 0 ? "+" : "-"}${formatUsd(Math.abs(difference))}`
                : "N/A",
          },
        ]}
        comparisonSummary={
          difference != null
            ? `${parsedKwh.toLocaleString()} kWh in ${data.name} is ${difference >= 0 ? "more" : "less"} expensive by ${formatUsd(Math.abs(difference))} compared to the U.S. average.`
            : undefined
        }
        relatedLinks={[
          { href: `/electricity-price-per-kwh/${state}`, label: `Price per kWh in ${data.name}` },
          { href: `/average-electricity-bill/${state}`, label: `Average electricity bill in ${data.name}` },
          { href: `/electricity-price-trend/${state}`, label: `Electricity price trend in ${data.name}` },
          { href: `/electricity-cost-calculator/${state}`, label: `Electricity cost calculator for ${data.name}` },
          { href: `/electricity-hubs/usage`, label: "Browse other electricity usage tiers" },
        ]}
        relatedLinkSections={relatedLinkSections}
        monetizationContext={{
          pageType: "longtail-usage",
          state,
          stateName: data.name,
          usageKwh: parsedKwh,
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
