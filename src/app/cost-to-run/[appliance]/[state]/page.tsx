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
      "State-level residential electricity rate data used to price deterministic appliance operating-cost scenarios.",
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
          ? `Using ${formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)} and a state average rate of ${formatRate(stateData.avgRateCentsPerKwh)}, this deterministic model estimates about ${formatUsd(stateEstimate.costPerMonth)} per month.`
          : "This route uses deterministic wattage and runtime assumptions to estimate energy-only operating cost.",
    },
    {
      question: "Does this estimate include delivery fees and taxes?",
      answer:
        "No. This model is energy-only and excludes delivery charges, taxes, fixed monthly fees, and plan-specific adjustments.",
    },
    {
      question: `Where can I compare this appliance across more routes?`,
      answer: `Use /energy-comparison/appliances for curated appliance comparisons and /electricity-bill-estimator/${stateData.slug} for household bill profiles in ${stateData.name}.`,
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
        intro={`This page estimates the energy-only cost to run ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name} using ${applianceConfig.introFragment}, an average load of ${applianceConfig.averageWattage.toLocaleString()} watts, and a typical runtime of ${formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)}.`}
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
            ? `At the statewide average residential rate, running ${article} ${applianceConfig.displayName.toLowerCase()} in ${stateData.name} costs ${monthlyDifference >= 0 ? "more" : "less"} per month by ${formatUsd(Math.abs(monthlyDifference))} than the same usage pattern priced at the current U.S. average electricity rate.`
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
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>
            How much electricity does {article} {applianceConfig.displayName.toLowerCase()} use?
          </h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            This estimate uses a typical wattage range of {formatWattageRange(applianceConfig)} and a modeling
            assumption of {applianceConfig.averageWattage.toLocaleString()} watts for {formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)}.
            Using the formula <code>kWh = (watts × hours) / 1000</code>, that works out to{" "}
            <strong>{formatKwh(stateEstimate.kwhPerDay)}</strong> per day,{" "}
            <strong>{formatKwh(stateEstimate.kwhPerMonth)}</strong> per 30-day month, and{" "}
            <strong>{formatKwh(stateEstimate.kwhPerYear)}</strong> per year.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            {applianceConfig.usageNote} In {stateData.name}, that energy is priced using the statewide residential
            average of {formatRate(stateData.avgRateCentsPerKwh)}, with a national benchmark of{" "}
            {formatRate(stateData.nationalAverageCentsPerKwh)} for comparison.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>
            {applianceConfig.displayName} operating cost estimate in {stateData.name}
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid var(--color-border, #e5e7eb)",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderBottom: "1px solid var(--color-border, #e5e7eb)",
                      backgroundColor: "var(--color-surface-alt, #f9fafb)",
                    }}
                  >
                    Time period
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderBottom: "1px solid var(--color-border, #e5e7eb)",
                      backgroundColor: "var(--color-surface-alt, #f9fafb)",
                    }}
                  >
                    Energy use
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderBottom: "1px solid var(--color-border, #e5e7eb)",
                      backgroundColor: "var(--color-surface-alt, #f9fafb)",
                    }}
                  >
                    Cost
                  </th>
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
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.label}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatKwh(row.kwh)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginBottom: 0, marginTop: 12, lineHeight: 1.7 }}>
            These estimates isolate electricity usage only. Real utility bills can be higher because delivery
            charges, taxes, seasonal pricing, and fixed monthly fees are not included in this appliance model.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What changes the cost the most?</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            The biggest cost drivers for {article} {applianceConfig.displayName.toLowerCase()} are the local
            electricity rate and real-world usage intensity. For this appliance, the main swing factors are{" "}
            {applianceConfig.variabilityFactors.join(", ")}.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            If your usage is lighter or heavier than the assumption on this page, the linked state calculator and
            usage-cost pages below are the fastest way to model a custom scenario with the same state electricity rate.
          </p>
          <p style={{ marginBottom: 0, marginTop: 12, lineHeight: 1.7 }}>
            For calculator-focused intent, use{" "}
            <Link href={`/electricity-cost-calculator/${state}/${applianceSlug}`}>
              the {applianceConfig.displayName} calculator in {stateData.name}
            </Link>{" "}
            to compare light, typical, and heavy usage profiles.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Comparison discovery pathways</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Use the curated Energy Comparison Hub to move between appliance, state, and usage comparison routes
            without changing canonical ownership for appliance cost intent.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/energy-comparison/appliances">Appliance comparison slice</Link>
            </li>
            <li>
              <Link href="/energy-comparison/states">State comparison slice</Link>
            </li>
            <li>
              <Link href="/energy-comparison/usage">Usage comparison slice</Link>
            </li>
            <li>
              <Link href={`/electricity-bill-estimator/${stateData.slug}`}>State bill estimator scenarios</Link>
            </li>
          </ul>
        </section>

        {applianceCityRows.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>
              Rollout-enabled city context in {stateData.name}
            </h2>
            <p style={{ marginTop: 0, lineHeight: 1.7 }}>
              These city pages provide supplemental local context for this same appliance usage profile. City values are
              deterministic estimates and remain secondary to the canonical appliance-state route.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid var(--color-border, #e5e7eb)",
                }}
              >
                <thead>
                  <tr>
                    {["City", "City rate", "Monthly estimate", "Yearly estimate", "City route"].map((label) => (
                      <th
                        key={label}
                        style={{
                          textAlign: "left",
                          padding: 10,
                          borderBottom: "1px solid var(--color-border, #e5e7eb)",
                          backgroundColor: "var(--color-surface-alt, #f9fafb)",
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applianceCityRows.map((row) => (
                    <tr key={row.citySummary.city.slug}>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        {row.citySummary.city.name}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        {formatRate(row.citySummary.cityRateCentsPerKwh)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        {formatUsd(row.monthlyCost)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        {formatUsd(row.yearlyCost)}
                      </td>
                      <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                        {row.hasApplianceCityPilot ? (
                          <Link
                            href={`/cost-to-run/${applianceSlug}/${stateData.slug}/${row.citySummary.city.slug}`}
                          >
                            Appliance city pilot page
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
              City pages are authority/context routes and not appliance-by-city canonical pages. Appliance cost intent
              remains canonical at this state-level route.
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
