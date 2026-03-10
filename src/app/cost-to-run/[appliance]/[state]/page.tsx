import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailRelatedLinks from "@/components/longtail/LongtailRelatedLinks";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
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
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { formatRate, formatUsd, loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return getApplianceLongtailStaticParams();
}

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

  if (!applianceSlug) {
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
  if (!applianceSlug) notFound();

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

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
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
        monetizationContext={{
          pageType: "longtail-usage",
          state,
          stateName: stateData.name,
          usageKwh: Math.max(1, Math.round(stateEstimate.kwhPerMonth)),
        }}
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

        <LongtailRelatedLinks sections={relatedApplianceSections} />
      </LongtailStateTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
