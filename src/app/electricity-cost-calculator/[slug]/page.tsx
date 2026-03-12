import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import {
  buildCalculatorApplianceLinks,
  buildCalculatorUsageScenarios,
  getCalculatorStateStaticParams,
} from "@/lib/longtail/calculatorCluster";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { formatRate, formatUsd, loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

const TYPICAL_MONTHLY_KWH = 900;

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return getCalculatorStateStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const state = await loadLongtailStateData(slug);
  if (!state) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-cost-calculator/${slug}`,
    });
  }

  const typicalCost = (state.avgRateCentsPerKwh != null ? state.avgRateCentsPerKwh / 100 : 0) * TYPICAL_MONTHLY_KWH;
  const description =
    state.avgRateCentsPerKwh != null
      ? `Electricity cost calculator for ${state.name}. At ${formatRate(
          state.avgRateCentsPerKwh,
        )}, a ${TYPICAL_MONTHLY_KWH.toLocaleString()} kWh month is about ${formatUsd(typicalCost)}.`
      : `Electricity cost calculator for ${state.name}.`;

  return buildMetadata({
    title: `Electricity Cost Calculator for ${state.name} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-cost-calculator/${slug}`,
  });
}

export default async function ElectricityCostCalculatorStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = await loadLongtailStateData(slug);
  if (!state) notFound();

  const usageScenarios = buildCalculatorUsageScenarios(state);
  const applianceLinks = buildCalculatorApplianceLinks(state, 8);
  const typicalScenario = usageScenarios.find((scenario) => scenario.kwh === TYPICAL_MONTHLY_KWH) ?? usageScenarios[1];
  const monthlyDifference =
    typicalScenario?.monthlyCost != null && state.nationalAverageCentsPerKwh != null
      ? typicalScenario.monthlyCost - (state.nationalAverageCentsPerKwh / 100) * TYPICAL_MONTHLY_KWH
      : null;
  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "average-bill",
    stateData: state,
    usageKwh: TYPICAL_MONTHLY_KWH,
  });

  const canonicalPath = `/electricity-cost-calculator/${slug}`;
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost Calculator", url: "/electricity-cost-calculator" },
    { name: state.name, url: canonicalPath },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Cost Calculator for ${state.name}`,
    description:
      typicalScenario?.monthlyCost != null
        ? `${state.name} electricity calculator with deterministic ${TYPICAL_MONTHLY_KWH.toLocaleString()} kWh monthly estimate of ${formatUsd(
            typicalScenario.monthlyCost,
          )}.`
        : `${state.name} electricity cost calculator.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`electricity cost calculator ${state.name}`, "monthly electric bill calculator", "kwh cost calculator"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Cost Calculator", href: "/electricity-cost-calculator" },
          { label: state.name },
        ]}
        title={`Electricity Cost Calculator for ${state.name}`}
        intro={`Estimate your monthly electric bill in ${state.name} using deterministic statewide residential pricing. This page connects fixed usage scenarios, bill interpretation, appliance calculators, and canonical usage-cost routes.`}
        stats={[
          { label: `${state.name} average rate`, value: formatRate(state.avgRateCentsPerKwh) },
          {
            label: `${TYPICAL_MONTHLY_KWH.toLocaleString()} kWh estimate`,
            value: formatUsd(typicalScenario?.monthlyCost ?? null),
          },
          {
            label: "U.S. benchmark rate",
            value: formatRate(state.nationalAverageCentsPerKwh),
          },
          {
            label: "Difference vs U.S. (900 kWh)",
            value:
              monthlyDifference != null
                ? `${monthlyDifference >= 0 ? "+" : "-"}${formatUsd(Math.abs(monthlyDifference))}`
                : "N/A",
          },
        ]}
        comparisonTitle={`${state.name} monthly bill context`}
        comparisonRows={[
          { label: `${state.name} rate`, value: formatRate(state.avgRateCentsPerKwh) },
          { label: "U.S. average rate", value: formatRate(state.nationalAverageCentsPerKwh) },
          {
            label: `${TYPICAL_MONTHLY_KWH.toLocaleString()} kWh in ${state.name}`,
            value: formatUsd(typicalScenario?.monthlyCost ?? null),
          },
          {
            label: "Average bill benchmark (900 kWh)",
            value: formatUsd((state.avgRateCentsPerKwh != null ? state.avgRateCentsPerKwh / 100 : 0) * 900),
          },
        ]}
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: `${state.name} appliance calculator pages`,
            links: applianceLinks,
          },
          ...relatedLinkSections,
        ]}
        monetizationContext={{
          pageType: "calculator-state",
          state: slug,
          stateName: state.name,
        }}
        sourceAttribution={{
          sourceName: state.sourceName,
          sourceUrl: state.sourceUrl,
          updatedLabel: state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Usage scenario calculator outputs</h2>
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
                  {["Monthly usage", "Estimated monthly cost", "Estimated annual cost", "Canonical usage page"].map(
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
                {usageScenarios.map((scenario) => (
                  <tr key={scenario.kwh}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {scenario.kwh.toLocaleString()} kWh
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(scenario.monthlyCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(scenario.annualCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      <Link href={scenario.href}>Open {scenario.kwh.toLocaleString()} kWh page</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Calculator-to-bill interpretation</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            This calculator page focuses on usage-based scenarios. The average-bill page for {state.name} keeps usage
            fixed at 900 kWh to help compare states cleanly, while usage pages let you change the load profile.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {state.name}</Link>
            </li>
            <li>
              <Link href={`/electricity-price-per-kwh/${slug}`}>Electricity price per kWh in {state.name}</Link>
            </li>
            <li>
              <Link href={`/electricity-price-trend/${slug}`}>Electricity price trend in {state.name}</Link>
            </li>
            <li>
              <Link href={`/electricity-hubs/states/${slug}`}>{state.name} electricity hub</Link>
            </li>
            <li>
              <Link href="/energy-comparison/states">State comparison discovery hub</Link>
            </li>
            <li>
              <Link href="/energy-comparison/usage">Usage comparison discovery slice</Link>
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
