import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailRelatedLinks from "@/components/longtail/LongtailRelatedLinks";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import { getRelease } from "@/lib/knowledge/fetch";
import { loadActiveCityElectricitySummariesForState } from "@/lib/longtail/cityElectricity";
import {
  calculateApplianceOperatingCost,
  formatHoursPerDay,
  formatKwh,
  formatWattageRange,
  getApplianceLongtailStaticParams,
  getRelatedAppliances,
  parseApplianceSlug,
} from "@/lib/longtail/applianceLongtail";
import { getApplianceConfig } from "@/lib/longtail/applianceConfig";
import {
  getActiveApplianceCityPagesForStateAppliance,
  isActiveApplianceSlug,
} from "@/lib/longtail/rollout";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { formatRate, formatUsd, loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildDatasetJsonLd, buildFaqPageJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-dynamic";
export const dynamicParams = false;
export const revalidate = 86400;


function getIndefiniteArticle(label: string): "a" | "an" {
  return /^[aeiou]/i.test(label) ? "an" : "a";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ appliance: string; state: string }>;
}): Promise<Metadata> {
  const { appliance, state } = await params;
  const applianceSlug = parseApplianceSlug(appliance);
  if (!applianceSlug || !isActiveApplianceSlug(applianceSlug)) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/cost-to-run/${appliance}/${state}`,
    });
  }

  const stateData = await loadLongtailStateData(state);
  if (!stateData) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/cost-to-run/${applianceSlug}/${state}`,
    });
  }

  const applianceConfig = getApplianceConfig(applianceSlug);
  const estimate = calculateApplianceOperatingCost(stateData.avgRateCentsPerKwh, applianceConfig);
  const article = getIndefiniteArticle(applianceConfig.displayName);
  const title = `Cost to Run ${article} ${applianceConfig.displayName} in ${stateData.name} | PriceOfElectricity.com`;
  const description =
    estimate.costPerMonth != null
      ? `See the estimated hourly, daily, monthly, and yearly electricity cost to run ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name} using the state's average residential rate of ${formatRate(stateData.avgRateCentsPerKwh)}.`
      : `Estimated electricity cost to run ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name}.`;

  return buildMetadata({
    title,
    description,
    canonicalPath: `/cost-to-run/${applianceSlug}/${state}`,
  });
}

export default async function ApplianceCostToRunPage({
  params,
}: {
  params: Promise<{ appliance: string; state: string }>;
}) {
  const { appliance, state } = await params;
  const applianceSlug = parseApplianceSlug(appliance);
  if (!applianceSlug || !isActiveApplianceSlug(applianceSlug)) notFound();

  const stateData = await loadLongtailStateData(state);
  if (!stateData) notFound();

  const applianceConfig = getApplianceConfig(applianceSlug);
  const stateEstimate = calculateApplianceOperatingCost(stateData.avgRateCentsPerKwh, applianceConfig);
  const nationalEstimate = calculateApplianceOperatingCost(stateData.nationalAverageCentsPerKwh, applianceConfig);
  const monthlyDifference =
    stateEstimate.costPerMonth != null && nationalEstimate.costPerMonth != null
      ? stateEstimate.costPerMonth - nationalEstimate.costPerMonth
      : null;
  const annualDifference =
    stateEstimate.costPerYear != null && nationalEstimate.costPerYear != null
      ? stateEstimate.costPerYear - nationalEstimate.costPerYear
      : null;
  const introComparison =
    annualDifference != null && Math.abs(annualDifference) >= 5
      ? ` That's roughly ${formatUsd(Math.abs(annualDifference))} a year ${annualDifference >= 0 ? "more" : "less"} than a household paying the national average pays for the exact same ${applianceConfig.displayName.toLowerCase()}.`
      : "";
  const article = getIndefiniteArticle(applianceConfig.displayName);
  const canonicalPath = `/cost-to-run/${applianceSlug}/${state}`;

  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "appliance-cost",
    stateData,
    usageKwh: Math.max(1, Math.round(stateEstimate.kwhPerMonth)),
  });
  const citySummaries = await loadActiveCityElectricitySummariesForState(stateData.slug);
  const activeApplianceCityKeys = new Set(
    getActiveApplianceCityPagesForStateAppliance(stateData.slug, applianceSlug).map(
      (page) => page.citySlug,
    ),
  );
  const applianceCityRows = citySummaries.slice(0, 6).map((citySummary) => {
    const monthlyCost = (citySummary.cityRateCentsPerKwh / 100) * stateEstimate.kwhPerMonth;
    const yearlyCost = monthlyCost * 12;
    return {
      citySummary,
      monthlyCost,
      yearlyCost,
      hasApplianceCityPilot: activeApplianceCityKeys.has(citySummary.city.slug),
    };
  });

  const relatedApplianceSections = [
    {
      title: `Related appliance cost pages for ${stateData.name}`,
      links: getRelatedAppliances(applianceSlug).map((item) => ({
        href: `/cost-to-run/${item.slug}/${state}`,
        label: `${item.displayName} cost in ${stateData.name}`,
        description: `Typical ${formatWattageRange(item)} estimate with state-specific pricing`,
      })),
    },
  ];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: stateData.name, url: `/${state}` },
    { name: `Cost to run ${applianceConfig.displayName}`, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Cost to Run ${article} ${applianceConfig.displayName} in ${stateData.name}`,
    description:
      stateEstimate.costPerMonth != null
        ? `${article === "an" ? "An" : "A"} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name} is estimated to cost ${formatUsd(stateEstimate.costPerMonth)} per month to operate based on statewide residential electricity pricing.`
        : `Estimated electricity cost for ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name}.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `${applianceConfig.displayName} electricity cost`,
      `${applianceConfig.displayName} energy usage in ${stateData.name}`,
      `${stateData.name} appliance operating cost`,
    ],
  });
  const datasetJsonLd = buildDatasetJsonLd({
    name: `${stateData.name} Residential Electricity Dataset Reference`,
    description:
      "State-level residential electricity rate data used for appliance operating-cost estimates on this page.",
    url: canonicalPath,
    publisher: "PriceOfElectricity.com",
    sameAs: stateData.sourceUrl ? [stateData.sourceUrl] : undefined,
    distribution: [
      { contentUrl: "/datasets/electricity-prices-by-state.json", encodingFormat: "application/json" },
      { contentUrl: "/datasets/electricity-prices-by-state.csv", encodingFormat: "text/csv" },
    ],
  });
  const faqJsonLd = buildFaqPageJsonLd([
    {
      question: `How much does it cost to run ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name}?`,
      answer:
        stateEstimate.costPerMonth != null
          ? `At ${formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)} and the state average rate of ${formatRate(stateData.avgRateCentsPerKwh)}, you'd pay about ${formatUsd(stateEstimate.costPerMonth)} a month.`
          : "We use a fixed wattage and runtime to estimate the electricity cost at the all-in average rate.",
    },
    {
      question: "Does this estimate include delivery fees and taxes?",
      answer:
        "The rate already includes delivery (T&D). The estimate doesn't add separately billed taxes, fixed monthly fees, or plan-specific adjustments.",
    },
    {
      question: `Where else can I compare this appliance?`,
      answer: `Use /energy-comparison/appliances for appliance comparison links overview and /electricity-bill-estimator/${stateData.slug} for household bill profiles in ${stateData.name}.`,
    },
  ]);

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd, faqJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: stateData.name, href: `/${state}` },
          { label: "Cost to Run" },
          { label: applianceConfig.displayName },
        ]}
        title={`What Does It Cost to Run ${article} ${applianceConfig.displayName} in ${stateData.name}?`}
        intro={stateEstimate.costPerMonth != null
          ? `Running ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name} costs about ${formatUsd(stateEstimate.costPerMonth)} a month — ${formatUsd(stateEstimate.costPerYear)} a year — at the state's average rate of ${formatRate(stateData.avgRateCentsPerKwh)}.${introComparison} The estimate assumes a typical ${applianceConfig.averageWattage.toLocaleString()}-watt ${applianceConfig.displayName.toLowerCase()} running ${formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)}, at the all-in average rate (before separately billed taxes and fixed fees).`
          : `This is an estimate of the electricity cost to run ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name}, based on a typical ${applianceConfig.averageWattage.toLocaleString()}-watt load running ${formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)} at the all-in average rate.`}
        stats={[
          { label: "Average wattage assumption", value: `${applianceConfig.averageWattage.toLocaleString()} W` },
          { label: "Typical usage assumption", value: formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay) },
          { label: "Estimated monthly electricity use", value: formatKwh(stateEstimate.kwhPerMonth) },
          { label: "Estimated monthly cost", value: formatUsd(stateEstimate.costPerMonth) },
          { label: "Estimated yearly cost", value: formatUsd(stateEstimate.costPerYear) },
        ]}
        comparisonTitle={`${applianceConfig.displayName} cost vs U.S. average`}
        comparisonRows={[
          { label: `${stateData.name} average rate`, value: formatRate(stateData.avgRateCentsPerKwh) },
          { label: `${stateData.name} monthly cost`, value: formatUsd(stateEstimate.costPerMonth) },
          { label: "U.S. monthly cost", value: formatUsd(nationalEstimate.costPerMonth) },
          {
            label: "Monthly difference",
            value:
              monthlyDifference != null
                ? `${monthlyDifference >= 0 ? "+" : "-"}${formatUsd(Math.abs(monthlyDifference))}`
                : "N/A",
          },
        ]}
        comparisonSummary={
          monthlyDifference != null
            ? `At the state average rate, ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name} costs ${formatUsd(Math.abs(monthlyDifference))} ${monthlyDifference >= 0 ? "more" : "less"} a month than it would at the U.S. average rate.`
            : undefined
        }
        relatedLinks={[]}
        relatedLinkSections={relatedLinkSections}
        sourceAttribution={{
          sourceName: stateData.sourceName,
          sourceUrl: stateData.sourceUrl,
          updatedLabel: stateData.updatedLabel,
        }}
      >
        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">
            How much electricity does {article} {applianceConfig.displayName.toLowerCase()} use?
          </h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            {article === "an" ? "An" : "A"} {applianceConfig.displayName.toLowerCase()} draws roughly{" "}
            {formatWattageRange(applianceConfig)}; we use {applianceConfig.averageWattage.toLocaleString()} watts running{" "}
            {formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)}. That comes to{" "}
            <strong>{formatKwh(stateEstimate.kwhPerDay)}</strong> a day —{" "}
            <strong>{formatKwh(stateEstimate.kwhPerMonth)}</strong> a month, or{" "}
            <strong>{formatKwh(stateEstimate.kwhPerYear)}</strong> over a year — using{" "}
            <code>kWh = watts × hours ÷ 1000</code>.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            {applianceConfig.usageNote} {stateData.name} prices that energy at{" "}
            {formatRate(stateData.avgRateCentsPerKwh)}, against a {formatRate(stateData.nationalAverageCentsPerKwh)}{" "}
            national average.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">
            {applianceConfig.displayName} operating cost estimate in {stateData.name}
          </h2>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Time period</th>
                  <th scope="col">Energy use</th>
                  <th scope="col">Cost</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Per hour", kwh: stateEstimate.kwhPerHour, cost: stateEstimate.costPerHour },
                  { label: "Per day", kwh: stateEstimate.kwhPerDay, cost: stateEstimate.costPerDay },
                  { label: "Per month", kwh: stateEstimate.kwhPerMonth, cost: stateEstimate.costPerMonth },
                  { label: "Per year", kwh: stateEstimate.kwhPerYear, cost: stateEstimate.costPerYear },
                ].map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{formatKwh(row.kwh)}</td>
                    <td>{formatUsd(row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginBottom: 0, marginTop: 12, lineHeight: 1.7 }}>
            These figures use the all-in average rate. Your actual bill can run higher when separately billed taxes,
            seasonal pricing, and fixed monthly fees apply.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">What changes the cost the most?</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Two things move this number: your state's rate, which you can't change, and how hard the appliance
            works, which you often can. For {article} {applianceConfig.displayName.toLowerCase()}, that mostly comes
            down to {applianceConfig.variabilityFactors.join(", ")}.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            Using yours more lightly or heavily than our assumption? The state calculator and usage-cost pages below
            model your exact scenario at the same rate.
          </p>
          <p style={{ marginBottom: 0, marginTop: 12, lineHeight: 1.7 }}>
            For calculator-style comparisons, use{" "}
            <Link href={`/electricity-cost-calculator/${state}/${applianceSlug}`}>
              the {applianceConfig.displayName} calculator in {stateData.name}
            </Link>{" "}
            to compare light, typical, and heavy usage profiles.
          </p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">Comparison entry points</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Browse related comparisons from the energy comparison hub:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/energy-comparison/appliances">Appliance comparisons</Link>
            </li>
            <li>
              <Link href="/energy-comparison/states">State comparisons</Link>
            </li>
            <li>
              <Link href="/energy-comparison/usage">Usage tier comparisons</Link>
            </li>
            <li>
              <Link href={`/electricity-bill-estimator/${stateData.slug}`}>State bill estimator scenarios</Link>
            </li>
          </ul>
        </section>

        {applianceCityRows.length > 0 && (
          <section style={{ marginBottom: "var(--space-7)" }}>
            <h2 className="heading-section">
              City pages for selected metros in {stateData.name}
            </h2>
            <p style={{ marginTop: 0, lineHeight: 1.7 }}>
              These city pages add local rate context for the same appliance assumptions. City values are estimates.
            </p>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {["City", "City rate", "Monthly estimate", "Yearly estimate", "More detail"].map((label) => (
                      <th scope="col" key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applianceCityRows.map((row) => (
                    <tr key={row.citySummary.city.slug}>
                      <td>{row.citySummary.city.name}</td>
                      <td>{formatRate(row.citySummary.cityRateCentsPerKwh)}</td>
                      <td>{formatUsd(row.monthlyCost)}</td>
                      <td>{formatUsd(row.yearlyCost)}</td>
                      <td>
                        {row.hasApplianceCityPilot ? (
                          <Link
                            href={`/cost-to-run/${applianceSlug}/${stateData.slug}/${row.citySummary.city.slug}`}
                          >
                            City appliance page
                          </Link>
                        ) : (
                          <Link href={`/electricity-cost/${stateData.slug}/${row.citySummary.city.slug}`}>
                            City electricity context
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginBottom: 0, marginTop: 12, lineHeight: 1.7 }}>
              City electricity pages focus on local rate context. The table above uses the statewide average rate.
            </p>
          </section>
        )}

        <CommercialPlacement
          pageFamily="appliance-cost-pages"
          context={{
            pageType: "longtail-usage",
            state,
            stateName: stateData.name,
            usageKwh: Math.max(1, Math.round(stateEstimate.kwhPerMonth)),
          }}
        />

        <LongtailRelatedLinks sections={relatedApplianceSections} />
      </LongtailStateTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
