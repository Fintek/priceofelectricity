import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import CityRateDisclosure from "@/components/longtail/CityRateDisclosure";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  loadApplianceCityElectricitySummary,
} from "@/lib/longtail/cityElectricity";
import { formatHoursPerDay, formatKwh, formatWattageRange } from "@/lib/longtail/applianceLongtail";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamicParams = true;
export const revalidate = 86400;

type PageParams = Promise<{ appliance: string; state: string; city: string }>;

function getIndefiniteArticle(label: string): "a" | "an" {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { appliance, state, city } = await params;
  const summary = await loadApplianceCityElectricitySummary(appliance, state, city);
  if (!summary) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/cost-to-run/${appliance}/${state}/${city}`,
    });
  }

  const article = getIndefiniteArticle(summary.applianceConfig.displayName);
  return buildMetadata({
    title: `Cost to Run ${article} ${summary.applianceConfig.displayName} in ${summary.citySummary.city.name}, ${summary.citySummary.state.name} | PriceOfElectricity.com`,
    description: `Planning estimate for running ${article} ${summary.applianceConfig.displayName.toLowerCase()} in ${summary.citySummary.city.name}, ${summary.citySummary.state.name}, using the site's city rate methodology and published EIA state data.`,
    canonicalPath: `/cost-to-run/${summary.applianceSlug}/${summary.citySummary.state.slug}/${summary.citySummary.city.slug}`,
  });
}

export default async function ApplianceCityCostPage({
  params,
}: {
  params: PageParams;
}) {
  const { appliance, state, city } = await params;
  const summary = await loadApplianceCityElectricitySummary(appliance, state, city);
  if (!summary) notFound();

  const article = getIndefiniteArticle(summary.applianceConfig.displayName);
  const canonicalPath = `/cost-to-run/${summary.applianceSlug}/${summary.citySummary.state.slug}/${summary.citySummary.city.slug}`;
  const applianceStatePath = `/cost-to-run/${summary.applianceSlug}/${summary.citySummary.state.slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: summary.citySummary.state.name, url: `/${summary.citySummary.state.slug}` },
    { name: `Cost to run ${summary.applianceConfig.displayName}`, url: applianceStatePath },
    {
      name: `${summary.citySummary.city.name}, ${summary.citySummary.state.name}`,
      url: canonicalPath,
    },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Cost to Run ${article} ${summary.applianceConfig.displayName} in ${summary.citySummary.city.name}, ${summary.citySummary.state.name}`,
    description: `Appliance cost page for ${summary.citySummary.city.name} with modeled city rate context and methodology notes.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `${summary.applianceConfig.displayName} cost in ${summary.citySummary.city.name}`,
      "appliance city electricity estimate",
      "modeled electricity cost context",
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: summary.citySummary.state.name, href: `/${summary.citySummary.state.slug}` },
          {
            label: `Cost to run ${summary.applianceConfig.displayName}`,
            href: applianceStatePath,
          },
          { label: summary.citySummary.city.name },
        ]}
        title={`What Does It Cost to Run ${article} ${summary.applianceConfig.displayName} in ${summary.citySummary.city.name}, ${summary.citySummary.state.name}?`}
        intro={`This page estimates the energy-only cost to run ${article} ${summary.applianceConfig.displayName.toLowerCase()} in ${summary.citySummary.city.name} using city-level rate assumptions from our methodology and the same appliance runtime assumptions as the statewide pages.`}
        stats={[
          {
            label: "City estimate basis",
            value: "Modeled from state EIA baseline",
          },
          { label: "Estimated city rate", value: formatRate(summary.citySummary.cityRateCentsPerKwh) },
          { label: "Assumed wattage", value: `${summary.applianceConfig.averageWattage.toLocaleString()} W` },
          {
            label: "Typical usage assumption",
            value: formatHoursPerDay(summary.applianceConfig.typicalUsageHoursPerDay),
          },
          { label: "Estimated monthly city cost", value: formatUsd(summary.cityMonthlyCostEstimate) },
        ]}
        comparisonTitle={`City vs state estimate for ${summary.applianceConfig.displayName}`}
        comparisonRows={[
          { label: `${summary.citySummary.city.name} monthly estimate`, value: formatUsd(summary.cityMonthlyCostEstimate) },
          { label: `${summary.citySummary.state.name} monthly estimate`, value: formatUsd(summary.stateMonthlyCostEstimate) },
          {
            label: "Difference",
            value:
              summary.monthlyDifferenceVsState != null
                ? `${summary.monthlyDifferenceVsState >= 0 ? "+" : "-"}${formatUsd(
                    Math.abs(summary.monthlyDifferenceVsState),
                  )}`
                : "N/A",
          },
          {
            label: "U.S. monthly estimate",
            value: formatUsd(summary.nationalMonthlyCostEstimate),
          },
        ]}
        comparisonSummary="City values on this page are modeled estimates for context. They are not utility tariff quotes or exact bill predictions."
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: "Related pages",
            links: [
              {
                href: applianceStatePath,
                label: `State appliance cost page: ${summary.citySummary.state.name}`,
                description: "Primary appliance cost page using the statewide average rate",
              },
              {
                href: `/electricity-cost/${summary.citySummary.state.slug}/${summary.citySummary.city.slug}`,
                label: `City electricity page: ${summary.citySummary.city.name}`,
                description: "City electricity page with methodology notes",
              },
              {
                href: `/electricity-cost-calculator/${summary.citySummary.state.slug}/${summary.applianceSlug}`,
                label: `${summary.applianceConfig.displayName} calculator in ${summary.citySummary.state.name}`,
                description: "Calculator for adjusting hours and assumptions",
              },
              {
                href: `/electricity-bill-estimator/${summary.citySummary.state.slug}`,
                label: `${summary.citySummary.state.name} electricity bill estimator`,
                description: "Household profile bill scenarios for this state",
              },
              {
                href: "/energy-comparison/appliances",
                label: "Appliance comparison guide",
                description: "More appliance and city comparison links",
              },
              {
                href: "/electricity-cost-comparison",
                label: "Electricity cost comparison index",
                description: "State-to-state electricity cost comparisons",
              },
            ],
          },
        ]}
        sourceAttribution={{
          sourceName: summary.citySummary.state.sourceName,
          sourceUrl: summary.citySummary.state.sourceUrl,
          updatedLabel: summary.citySummary.state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">How this city estimate is derived</h2>
          <CityRateDisclosure eiaMonthLabel={summary.citySummary.state.updatedLabel} />
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            This methodology is intended for consistent local context, not utility-plan quoting or bill
            prediction precision.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">Methodology and disclosure</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Appliance usage assumptions use the same state-level appliance model:
            {` ${formatWattageRange(summary.applianceConfig)}`} and{" "}
            {formatHoursPerDay(summary.applianceConfig.typicalUsageHoursPerDay)}.
            Estimated monthly usage is <strong>{formatKwh(summary.applianceUsage.kwhPerMonth)}</strong>.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7, marginTop: "1rem" }}>
            City-level appliance pages are available for a limited set of city and appliance combinations and are
            intended for comparison context, not utility tariff quoting.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">How these pages fit together</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={applianceStatePath}>State appliance cost page</Link> uses the statewide average residential
              rate.
            </li>
            <li>
              <Link href={`/electricity-cost/${summary.citySummary.state.slug}/${summary.citySummary.city.slug}`}>
                City electricity page
              </Link>{" "}
              focuses on city electricity cost context.
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${summary.citySummary.state.slug}/${summary.applianceSlug}`}>
                Appliance calculator
              </Link>{" "}
              is best when you want to change hours or assumptions interactively.
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
