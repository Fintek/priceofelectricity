import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import {
  buildApplianceCalculatorSummary,
  buildApplianceScenarioRows,
  buildCalculatorApplianceLinks,
  getCalculatorApplianceStaticParams,
  parseApplianceCalculatorSlug,
} from "@/lib/longtail/calculatorCluster";
import { getRelease } from "@/lib/knowledge/fetch";
import { loadActiveCityElectricitySummariesForState } from "@/lib/longtail/cityElectricity";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { getApplianceConfig } from "@/lib/longtail/applianceConfig";
import {
  getActiveApplianceCityPagesForStateAppliance,
  isActiveApplianceSlug,
} from "@/lib/longtail/rollout";
import {
  calculateApplianceOperatingCost,
  formatHoursPerDay,
  formatKwh,
  formatWattageRange,
} from "@/lib/longtail/applianceLongtail";
import { formatRate, formatUsd, loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;



export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; appliance: string }>;
}): Promise<Metadata> {
  const { slug, appliance } = await params;
  const applianceSlug = parseApplianceCalculatorSlug(appliance);
  if (!applianceSlug || !isActiveApplianceSlug(applianceSlug)) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-cost-calculator/${slug}/${appliance}`,
    });
  }
  const state = await loadLongtailStateData(slug);
  if (!state) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-cost-calculator/${slug}/${applianceSlug}`,
    });
  }

  const applianceConfig = getApplianceConfig(applianceSlug);
  const summary = buildApplianceCalculatorSummary(state.name, applianceConfig, state.avgRateCentsPerKwh);
  return buildMetadata({
    title: `${applianceConfig.displayName} Electricity Calculator in ${state.name} | PriceOfElectricity.com`,
    description: summary,
    canonicalPath: `/electricity-cost-calculator/${slug}/${applianceSlug}`,
  });
}

export default async function StateApplianceCalculatorPage({
  params,
}: {
  params: Promise<{ slug: string; appliance: string }>;
}) {
  const { slug, appliance } = await params;
  const applianceSlug = parseApplianceCalculatorSlug(appliance);
  if (!applianceSlug || !isActiveApplianceSlug(applianceSlug)) notFound();

  const state = await loadLongtailStateData(slug);
  if (!state) notFound();

  const applianceConfig = getApplianceConfig(applianceSlug);
  const typicalStateScenario = calculateApplianceOperatingCost(state.avgRateCentsPerKwh, applianceConfig);
  const typicalNationalScenario = calculateApplianceOperatingCost(state.nationalAverageCentsPerKwh, applianceConfig);
  const monthlyDifference =
    typicalStateScenario.costPerMonth != null && typicalNationalScenario.costPerMonth != null
      ? typicalStateScenario.costPerMonth - typicalNationalScenario.costPerMonth
      : null;

  const applianceScenarioRows = buildApplianceScenarioRows(
    state.avgRateCentsPerKwh,
    state.nationalAverageCentsPerKwh,
    applianceSlug,
  );
  const relatedCalculatorLinks = buildCalculatorApplianceLinks(state, 8).filter(
    (link) => link.href !== `/electricity-cost-calculator/${slug}/${applianceSlug}`,
  );
  const relatedLongtailSections = await buildLongtailLinkSections({
    pageType: "appliance-cost",
    stateData: state,
    usageKwh: Math.max(1, Math.round(typicalStateScenario.kwhPerMonth)),
  });
  const citySummaries = await loadActiveCityElectricitySummariesForState(state.slug);
  const activeApplianceCityKeys = new Set(
    getActiveApplianceCityPagesForStateAppliance(state.slug, applianceSlug).map((page) => page.citySlug),
  );
  const calculatorCityRows = citySummaries.slice(0, 4).map((citySummary) => {
    const monthlyCost = (citySummary.cityRateCentsPerKwh / 100) * typicalStateScenario.kwhPerMonth;
    return {
      citySummary,
      monthlyCost,
      hasApplianceCityPilot: activeApplianceCityKeys.has(citySummary.city.slug),
    };
  });

  const canonicalPath = `/electricity-cost-calculator/${slug}/${applianceSlug}`;
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost Calculator", url: "/electricity-cost-calculator" },
    { name: state.name, url: `/electricity-cost-calculator/${slug}` },
    { name: applianceConfig.displayName, url: canonicalPath },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `${applianceConfig.displayName} Electricity Calculator in ${state.name}`,
    description: buildApplianceCalculatorSummary(state.name, applianceConfig, state.avgRateCentsPerKwh),
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `${applianceConfig.displayName} electricity calculator`,
      `${state.name} appliance electricity cost`,
      "monthly electric bill calculator appliance",
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Cost Calculator", href: "/electricity-cost-calculator" },
          { label: state.name, href: `/electricity-cost-calculator/${slug}` },
          { label: applianceConfig.displayName },
        ]}
        title={`${applianceConfig.displayName} Electricity Calculator in ${state.name}`}
        intro={`Use this appliance electricity calculator to estimate ${applianceConfig.displayName.toLowerCase()} operating cost in ${state.name} using deterministic wattage and runtime assumptions tied to the statewide residential electricity rate.`}
        stats={[
          { label: `${state.name} average rate`, value: formatRate(state.avgRateCentsPerKwh) },
          { label: "Assumed wattage", value: `${applianceConfig.averageWattage.toLocaleString()} W` },
          { label: "Typical usage pattern", value: formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay) },
          { label: "Typical monthly cost", value: formatUsd(typicalStateScenario.costPerMonth) },
          { label: "Typical yearly cost", value: formatUsd(typicalStateScenario.costPerYear) },
        ]}
        comparisonTitle={`${applianceConfig.displayName} in ${state.name} vs U.S. benchmark`}
        comparisonRows={[
          { label: `${state.name} monthly estimate`, value: formatUsd(typicalStateScenario.costPerMonth) },
          { label: "U.S. monthly estimate", value: formatUsd(typicalNationalScenario.costPerMonth) },
          {
            label: "Difference",
            value:
              monthlyDifference != null
                ? `${monthlyDifference >= 0 ? "+" : "-"}${formatUsd(Math.abs(monthlyDifference))}`
                : "N/A",
          },
          { label: "State rate", value: formatRate(state.avgRateCentsPerKwh) },
        ]}
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: `Other appliance calculators in ${state.name}`,
            links: relatedCalculatorLinks,
          },
          ...relatedLongtailSections,
        ]}
        monetizationContext={{
          pageType: "longtail-usage",
          state: slug,
          stateName: state.name,
          usageKwh: Math.max(1, Math.round(typicalStateScenario.kwhPerMonth)),
        }}
        sourceAttribution={{
          sourceName: state.sourceName,
          sourceUrl: state.sourceUrl,
          updatedLabel: state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Calculator assumptions</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            This calculator uses a typical wattage range of {formatWattageRange(applianceConfig)}, with a standard
            working assumption of {applianceConfig.averageWattage.toLocaleString()} watts for{" "}
            {formatHoursPerDay(applianceConfig.typicalUsageHoursPerDay)}. The deterministic formula is{" "}
            <code>kWh = (watts × hours) / 1000</code>.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            At this profile, the appliance uses {formatKwh(typicalStateScenario.kwhPerMonth)} per month and{" "}
            {formatKwh(typicalStateScenario.kwhPerYear)} per year in the model.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Appliance calculator scenarios</h2>
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
                  {["Scenario", "Hours/day", "Annual energy", `${state.name} monthly`, "U.S. monthly", `${state.name} yearly`].map(
                    (label) => (
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
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {applianceScenarioRows.map((row) => (
                  <tr key={row.profile.id}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.profile.label}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatHoursPerDay(row.profile.hoursPerDay)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>{row.annualKwh}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.stateMonthlyCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.nationalMonthlyCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.stateYearlyCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Canonical appliance cost route</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Appliance-intent cost pages remain canonical at the dedicated route below. This calculator page is additive
            for scenario-focused calculator queries and links into the same state rate context.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/cost-to-run/${applianceSlug}/${slug}`}>
                Cost to run {applianceConfig.displayName.toLowerCase()} in {state.name}
              </Link>
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>{state.name} state calculator hub</Link>
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Comparison discovery routes</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            For comparison-first navigation, use the curated Energy Comparison Hub slices below. These are discovery
            routes and preserve canonical ownership in the existing calculator, appliance-cost, and state-comparison
            systems.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/energy-comparison">Energy comparison hub</Link>
            </li>
            <li>
              <Link href="/energy-comparison/appliances">Appliance comparison slice</Link>
            </li>
            <li>
              <Link href="/energy-comparison/usage">Usage comparison slice</Link>
            </li>
          </ul>
        </section>

        {calculatorCityRows.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>
              City authority context for {state.name}
            </h2>
            <p style={{ marginTop: 0, lineHeight: 1.7 }}>
              For local context, rollout-enabled city electricity pages can be used alongside this calculator scenario.
              These links are supplemental and do not change calculator or appliance-cost canonicals.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {calculatorCityRows.map((row) => (
                <li key={row.citySummary.city.slug}>
                  {row.hasApplianceCityPilot ? (
                    <Link href={`/cost-to-run/${applianceSlug}/${state.slug}/${row.citySummary.city.slug}`}>
                      {row.citySummary.city.name} appliance city pilot
                    </Link>
                  ) : (
                    <Link href={`/electricity-cost/${state.slug}/${row.citySummary.city.slug}`}>
                      {row.citySummary.city.name} electricity context
                    </Link>
                  )}{" "}
                  - {formatRate(row.citySummary.cityRateCentsPerKwh)}; est. monthly appliance profile cost{" "}
                  {formatUsd(row.monthlyCost)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </LongtailStateTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
