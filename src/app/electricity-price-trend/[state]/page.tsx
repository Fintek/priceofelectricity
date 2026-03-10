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
  formatRate,
  getLongtailStateStaticParams,
  loadLongtailStateData,
} from "@/lib/longtail/stateLongtail";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { isLongtailFamilyActive } from "@/lib/longtail/rollout";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  if (!isLongtailFamilyActive("state-price-trend")) return [];
  return getLongtailStateStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  if (!isLongtailFamilyActive("state-price-trend")) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-price-trend/${state}`,
    });
  }
  const data = await loadLongtailStateData(state);

  if (!data) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-price-trend/${state}`,
    });
  }

  const title = `Electricity Price Trend in ${data.name} | PriceOfElectricity.com`;
  const description = data.increase5YearPercent != null
    ? `${data.name} electricity price trend: ${data.increase5YearPercent.toFixed(1)}% change over 5 years with monthly historical rates.`
    : `Monthly electricity price trend and history for ${data.name}.`;

  return buildMetadata({
    title,
    description,
    canonicalPath: `/electricity-price-trend/${state}`,
  });
}

export default async function ElectricityPriceTrendStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  if (!isLongtailFamilyActive("state-price-trend")) notFound();
  const data = await loadLongtailStateData(state);
  if (!data) notFound();

  const canonicalPath = `/electricity-price-trend/${state}`;
  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "state-trend",
    stateData: data,
  });
  const oneYear =
    data.increase1YearPercent != null
      ? `${data.increase1YearPercent >= 0 ? "+" : ""}${data.increase1YearPercent.toFixed(1)}%`
      : "N/A";
  const fiveYear =
    data.increase5YearPercent != null
      ? `${data.increase5YearPercent >= 0 ? "+" : ""}${data.increase5YearPercent.toFixed(1)}%`
      : "N/A";

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: data.name, url: `/${state}` },
    { name: "Electricity Price Trend", url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Price Trend in ${data.name}`,
    description:
      data.increase5YearPercent != null
        ? `${data.name} electricity rates changed ${data.increase5YearPercent.toFixed(1)}% over 5 years.`
        : `${data.name} electricity rate trend page with monthly history.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`electricity price trend ${data.name}`, `${data.name} electricity history`],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: data.name, href: `/${state}` },
          { label: "Electricity Price Trend" },
        ]}
        title={`Electricity Price Trend in ${data.name}`}
        intro={`Track how residential electricity rates in ${data.name} have changed over time using monthly price history from the knowledge dataset.`}
        stats={[
          { label: "Current average rate", value: formatRate(data.avgRateCentsPerKwh) },
          { label: "1-year change", value: oneYear },
          { label: "5-year change", value: fiveYear },
          {
            label: "5-year annualized",
            value:
              data.annualizedIncrease5Year != null
                ? `${data.annualizedIncrease5Year.toFixed(1)}% / year`
                : "N/A",
          },
        ]}
        comparisonTitle={`Trend context for ${data.name}`}
        comparisonSummary={
          data.increase5YearPercent != null
            ? `Over the last 5 years, ${data.name} electricity prices moved ${fiveYear}. Use this trend view with current-rate pages for full cost planning.`
            : undefined
        }
        trend={{
          title: "Monthly electricity rate trend",
          points: data.trendValues,
          subtitle:
            data.trendPeriods.length > 1
              ? `${data.trendPeriods[0]} to ${data.trendPeriods[data.trendPeriods.length - 1]}`
              : "Historical monthly rate series",
          ariaLabel: `${data.name} monthly electricity trend`,
          formatValue: (value) => `${value.toFixed(2)}¢`,
        }}
        relatedLinks={[
          { href: `/electricity-price-history/${state}`, label: `Electricity price history in ${data.name}` },
          { href: `/electricity-price-per-kwh/${state}`, label: `Current price per kWh in ${data.name}` },
          { href: `/electricity-inflation/${state}`, label: `Electricity inflation in ${data.name}` },
          { href: `/electricity-usage-cost/1000/${state}`, label: `1000 kWh usage cost in ${data.name}` },
          { href: `/knowledge/state/${state}`, label: `Full state knowledge page for ${data.name}` },
        ]}
        relatedLinkSections={relatedLinkSections}
        monetizationContext={{
          pageType: "longtail-state-trend",
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
