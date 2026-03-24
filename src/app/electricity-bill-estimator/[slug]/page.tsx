import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  buildBillEstimatorProfileRows,
  getActiveBillEstimatorProfilesForState,
  getBillEstimatorProfileRolloutSummary,
  isActiveBillEstimatorProfilePage,
  loadBillEstimatorStateSummary,
} from "@/lib/longtail/billEstimator";
import { AVERAGE_ELECTRICITY_BILL_USAGE_KWH, buildAverageBillComparisonSummary } from "@/lib/longtail/averageBill";
import { buildLongtailLinkSections } from "@/lib/longtail/internalLinks";
import { getActiveApplianceSlugs } from "@/lib/longtail/rollout";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbListJsonLd,
  buildDatasetJsonLd,
  buildFaqPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/jsonld";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";

export const dynamic = "auto";
export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const state = await loadBillEstimatorStateSummary(slug);
  if (!state) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-bill-estimator/${slug}`,
    });
  }
  return buildMetadata({
    title: `Electricity Bill Estimator in ${state.name} | PriceOfElectricity.com`,
    description: `Household-profile electricity bill estimator for ${state.name} using deterministic usage scenarios and statewide residential rate context.`,
    canonicalPath: `/electricity-bill-estimator/${slug}`,
  });
}

export default async function ElectricityBillEstimatorStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const state = await loadBillEstimatorStateSummary(slug);
  if (!state) notFound();

  const profileRows = buildBillEstimatorProfileRows(state);
  const profileRollout = getBillEstimatorProfileRolloutSummary();
  const activeProfiles = getActiveBillEstimatorProfilesForState(slug);
  const activeProfileCount = profileRows.filter((row) => isActiveBillEstimatorProfilePage(slug, row.profile.slug)).length;
  const featuredApplianceSlugs = getActiveApplianceSlugs().slice(0, 3);
  const relatedLinkSections = await buildLongtailLinkSections({
    pageType: "average-bill",
    stateData: state,
    usageKwh: AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
    maxLinksPerSection: 2,
  });
  const canonicalPath = `/electricity-bill-estimator/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Bill Estimator", url: "/electricity-bill-estimator" },
    { name: state.name, url: canonicalPath },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Bill Estimator in ${state.name}`,
    description: `Deterministic household-profile bill scenarios for ${state.name}.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`electric bill estimator ${state.name}`, "household profile electricity bill scenarios"],
  });
  const datasetJsonLd = buildDatasetJsonLd({
    name: `${state.name} Electricity Bill Estimator Scenario Inputs`,
    description:
      "Deterministic state rate and household-profile usage assumptions used by the electricity bill estimator family.",
    url: canonicalPath,
    publisher: "PriceOfElectricity.com",
    sameAs: state.sourceUrl ? [state.sourceUrl] : undefined,
    distribution: [
      { contentUrl: "/datasets/electricity-prices-by-state.json", encodingFormat: "application/json" },
      { contentUrl: "/datasets/electricity-prices-by-state.csv", encodingFormat: "text/csv" },
    ],
  });
  const faqJsonLd = buildFaqPageJsonLd([
    {
      question: `How does the electricity bill estimator work for ${state.name}?`,
      answer:
        "The estimator multiplies deterministic household-profile monthly kWh assumptions by the state average residential electricity rate and outputs energy-only monthly and annual scenarios.",
    },
    {
      question: `Is this the same as the average bill page for ${state.name}?`,
      answer:
        "No. This route covers profile-based scenarios, while the average bill page provides a fixed benchmark intent using a standard household usage baseline.",
    },
    {
      question: "Where can I compare appliance-specific operating cost estimates?",
      answer: `Use /cost-to-run/refrigerator/${slug} (and related appliance routes) for canonical appliance operating-cost intent.`,
    },
  ]);
  return (
    <>
      <JsonLdScript
        data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd, faqJsonLd]}
      />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Bill Estimator", href: "/electricity-bill-estimator" },
          { label: state.name },
        ]}
        title={`Electricity Bill Estimator in ${state.name}`}
        intro={`Estimate household-profile electricity bills in ${state.name} using deterministic monthly usage assumptions and the statewide residential rate. This family is scenario-focused and complements benchmark and calculator routes.`}
        stats={[
          { label: `${state.name} average rate`, value: formatRate(state.avgRateCentsPerKwh) },
          { label: "Benchmark monthly bill (900 kWh)", value: formatUsd(state.monthlyBill) },
          { label: "Benchmark annual bill", value: formatUsd(state.annualBill) },
          { label: "U.S. benchmark monthly bill", value: formatUsd(state.nationalMonthlyBill) },
        ]}
        comparisonTitle={`${state.name} benchmark vs U.S. benchmark`}
        comparisonRows={[
          { label: `${state.name} benchmark`, value: formatUsd(state.monthlyBill) },
          { label: "U.S. benchmark", value: formatUsd(state.nationalMonthlyBill) },
          {
            label: "Difference",
            value:
              state.monthlyDifference != null
                ? `${state.monthlyDifference >= 0 ? "+" : "-"}${formatUsd(Math.abs(state.monthlyDifference))}`
                : "N/A",
          },
          { label: `${state.name} state rate`, value: formatRate(state.avgRateCentsPerKwh) },
        ]}
        comparisonSummary={buildAverageBillComparisonSummary(state)}
        relatedLinks={[]}
        relatedLinkSections={relatedLinkSections}
        sourceAttribution={{
          sourceName: state.sourceName,
          sourceUrl: state.sourceUrl,
          updatedLabel: state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Household profile scenarios</h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: 12, maxWidth: "75ch" }}>
            Rollout note: this state page is the canonical estimator owner for {state.name}. Profile scenario pages are
            linked only when explicitly allowlisted ({activeProfileCount} active in this state).
          </p>
          <p className="muted" style={{ marginTop: 0, marginBottom: 12, maxWidth: "75ch" }}>
            Family scope: active profile pilot coverage is currently {profileRollout.activeKeyCount} routes across{" "}
            {profileRollout.activeStateCount} states, with all non-allowlisted state-profile routes deferred.
          </p>
          {activeProfiles.length > 0 && (
            <p style={{ marginTop: 0, marginBottom: 12, lineHeight: 1.7 }}>
              Active profile pilot routes for {state.name}:{" "}
              {activeProfiles.map((profile, index) => (
                <span key={profile.slug}>
                  {index > 0 ? " · " : ""}
                  <Link href={`/electricity-bill-estimator/${slug}/${profile.slug}`}>{profile.label}</Link>
                </span>
              ))}
              .
            </p>
          )}
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
                  {["Profile", "Monthly usage", "Monthly estimate", "Annual estimate", "Profile scenario"].map((label) => (
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
                {profileRows.map((row) => (
                  <tr key={row.profile.slug}>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.profile.label}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {row.profile.defaultMonthlyKwh.toLocaleString()} kWh
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.monthlyCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {formatUsd(row.annualCost)}
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                      {isActiveBillEstimatorProfilePage(slug, row.profile.slug) ? (
                        <Link href={row.href}>{row.profile.label} scenario page</Link>
                      ) : (
                        <span className="muted">{row.profile.label} (rollout-deferred)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Intent separation and related canonical routes</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>
                Average bill benchmark in {state.name}
              </Link>{" "}
              (fixed benchmark intent).
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>
                Electricity cost calculator in {state.name}
              </Link>{" "}
              (calculator/scenario intent).
            </li>
            <li>
              <Link href={`/electricity-usage-cost/1000/${slug}`}>
                1,000 kWh fixed usage cost in {state.name}
              </Link>{" "}
              (fixed-kWh intent).
            </li>
            <li>
              <Link href={`/cost-to-run/refrigerator/${slug}`}>Appliance operating cost pages in {state.name}</Link>{" "}
              (canonical appliance-cost intent).
            </li>
            <li>
              <Link href="/energy-comparison">Energy comparison hub</Link> (curated discovery across canonical clusters).
            </li>
            <li>
              <Link href={`/offers/${slug}`}>Offers and savings in {state.name}</Link> (supplemental marketplace pathway).
            </li>
            <li>
              <Link href={`/electricity-providers/${slug}`}>Electricity providers in {state.name}</Link> (provider
              discovery pathway).
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Appliance and comparison discovery pathways</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {featuredApplianceSlugs.map((applianceSlug) => (
              <li key={applianceSlug}>
                <Link href={`/cost-to-run/${applianceSlug}/${slug}`}>
                  {applianceSlug.replace(/-/g, " ")} cost to run in {state.name}
                </Link>
                {" · "}
                <Link href={`/electricity-cost-calculator/${slug}/${applianceSlug}`}>
                  {applianceSlug.replace(/-/g, " ")} calculator scenario
                </Link>
              </li>
            ))}
            <li>
              <Link href="/energy-comparison/appliances">Appliance comparison discovery slice</Link>
            </li>
          </ul>
        </section>

        <CommercialPlacement
          pageFamily="bill-estimator-pages"
          context={{
            pageType: "longtail-usage",
            state: slug,
            stateName: state.name,
            usageKwh: AVERAGE_ELECTRICITY_BILL_USAGE_KWH,
          }}
        />
      </LongtailStateTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
