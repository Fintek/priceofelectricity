import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import LongtailStateTemplate from "@/components/longtail/LongtailStateTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  buildBillEstimatorDifferenceVsBenchmark,
  buildBillEstimatorMethodologyNote,
  calculateBillEstimatorProfileMonthlyCost,
  getBillEstimatorProfile,
  getBillEstimatorProfileRolloutSummary,
  getActiveBillEstimatorProfileStaticParams,
  isBillEstimatorProfileSlug,
  loadBillEstimatorStateSummary,
} from "@/lib/longtail/billEstimator";
import { getActiveApplianceSlugs } from "@/lib/longtail/rollout";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbListJsonLd,
  buildDatasetJsonLd,
  buildFaqPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/jsonld";
import { formatRate, formatUsd } from "@/lib/longtail/stateLongtail";

export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

export async function generateStaticParams(): Promise<Array<{ slug: string; profile: string }>> {
  return getActiveBillEstimatorProfileStaticParams({
    contextLabel: "electricity-bill-estimator-profile-page",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; profile: string }>;
}): Promise<Metadata> {
  const { slug, profile } = await params;
  if (!isBillEstimatorProfileSlug(profile)) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-bill-estimator/${slug}/${profile}`,
    });
  }
  const state = await loadBillEstimatorStateSummary(slug);
  if (!state) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-bill-estimator/${slug}/${profile}`,
    });
  }
  const profileConfig = getBillEstimatorProfile(profile);
  if (!profileConfig) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-bill-estimator/${slug}/${profile}`,
    });
  }
  const monthlyEstimate = calculateBillEstimatorProfileMonthlyCost(state.avgRateCentsPerKwh, profileConfig);
  const profileLower = profileConfig.label.toLowerCase();
  const article = /^[aeiou]/i.test(profileLower.trim()) ? "an" : "a";
  const kwhDisplay = profileConfig.defaultMonthlyKwh.toLocaleString();
  const ratePhrase =
    state.avgRateCentsPerKwh != null ? `${state.avgRateCentsPerKwh.toFixed(2)}¢/kWh` : null;
  const monthlyRounded = monthlyEstimate != null ? Math.round(monthlyEstimate) : null;
  const title =
    monthlyRounded != null
      ? `${profileConfig.label} Electricity Bill in ${state.name}: ~$${monthlyRounded}/Month`
      : `${profileConfig.label} Electricity Bill in ${state.name}`;
  let description: string;
  if (monthlyRounded != null && ratePhrase != null) {
    description = `Estimated electricity bill for ${article} ${profileLower} in ${state.name}: about $${monthlyRounded}/month at ${ratePhrase} using ~${kwhDisplay} kWh of usage.`;
  } else if (monthlyRounded != null) {
    description = `Estimated electricity bill for ${article} ${profileLower} in ${state.name}: about $${monthlyRounded}/month using ~${kwhDisplay} kWh of usage.`;
  } else if (ratePhrase != null) {
    description = `Estimated electricity bill for ${article} ${profileLower} in ${state.name} at ${ratePhrase} using ~${kwhDisplay} kWh of usage.`;
  } else {
    description = `Estimated electricity bill for ${article} ${profileLower} in ${state.name} using ~${kwhDisplay} kWh of usage.`;
  }
  return buildMetadata({
    title,
    description,
    canonicalPath: `/electricity-bill-estimator/${slug}/${profile}`,
  });
}

export default async function ElectricityBillEstimatorProfilePage({
  params,
}: {
  params: Promise<{ slug: string; profile: string }>;
}) {
  const { slug, profile } = await params;
  if (!isBillEstimatorProfileSlug(profile)) notFound();
  const state = await loadBillEstimatorStateSummary(slug);
  if (!state) notFound();
  const profileConfig = getBillEstimatorProfile(profile);
  if (!profileConfig) notFound();

  const monthlyEstimate = calculateBillEstimatorProfileMonthlyCost(state.avgRateCentsPerKwh, profileConfig);
  const annualEstimate = monthlyEstimate != null ? monthlyEstimate * 12 : null;
  const benchmarkDifference = buildBillEstimatorDifferenceVsBenchmark(monthlyEstimate, state.monthlyBill);
  const profileRollout = getBillEstimatorProfileRolloutSummary();
  const featuredApplianceSlugs = getActiveApplianceSlugs().slice(0, 2);
  const canonicalPath = `/electricity-bill-estimator/${slug}/${profile}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Bill Estimator", url: "/electricity-bill-estimator" },
    { name: state.name, url: `/electricity-bill-estimator/${slug}` },
    { name: profileConfig.label, url: canonicalPath },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: `${profileConfig.label} Electricity Bill Estimate in ${state.name}`,
    description: `Deterministic ${profileConfig.label.toLowerCase()} scenario page for ${state.name}.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`${profileConfig.label} electric bill estimate ${state.name}`, "deterministic electricity scenario"],
  });
  const datasetJsonLd = buildDatasetJsonLd({
    name: `${state.name} ${profileConfig.label} Bill Estimator Inputs`,
    description:
      "Deterministic profile-level monthly kWh assumptions paired with state residential electricity rate context.",
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
      question: `What monthly usage does the ${profileConfig.label.toLowerCase()} profile assume?`,
      answer: `This deterministic profile uses ${profileConfig.defaultMonthlyKwh.toLocaleString()} kWh per month with a reference range of ${profileConfig.monthlyKwhRange.low.toLocaleString()}-${profileConfig.monthlyKwhRange.high.toLocaleString()} kWh.`,
    },
    {
      question: `Are these ${state.name} bill estimates utility quotes?`,
      answer:
        "No. These are deterministic scenario estimates for planning context and do not include delivery charges, taxes, or fixed fees.",
    },
  ]);

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd, faqJsonLd]} />
      <LongtailStateTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Bill Estimator", href: "/electricity-bill-estimator" },
          { label: state.name, href: `/electricity-bill-estimator/${slug}` },
          { label: profileConfig.label },
        ]}
        title={`${profileConfig.label} Electricity Bill Estimate in ${state.name}`}
        intro={`This deterministic household-profile estimate applies a ${profileConfig.defaultMonthlyKwh.toLocaleString()} kWh monthly usage assumption for a ${profileConfig.label.toLowerCase()} in ${state.name}, priced with the current statewide average residential electricity rate.`}
        stats={[
          { label: `${state.name} average rate`, value: formatRate(state.avgRateCentsPerKwh) },
          { label: "Profile monthly usage", value: `${profileConfig.defaultMonthlyKwh.toLocaleString()} kWh` },
          { label: "Estimated monthly bill", value: formatUsd(monthlyEstimate) },
          { label: "Estimated annual bill", value: formatUsd(annualEstimate) },
        ]}
        comparisonTitle={`${profileConfig.label} scenario vs benchmark in ${state.name}`}
        comparisonRows={[
          { label: `${profileConfig.label} scenario`, value: formatUsd(monthlyEstimate) },
          { label: "State benchmark (900 kWh)", value: formatUsd(state.monthlyBill) },
          { label: "Difference vs benchmark", value: benchmarkDifference },
          {
            label: "Profile range assumption",
            value: `${profileConfig.monthlyKwhRange.low.toLocaleString()}-${profileConfig.monthlyKwhRange.high.toLocaleString()} kWh`,
          },
        ]}
        comparisonSummary={buildBillEstimatorMethodologyNote(profileConfig)}
        relatedLinks={[]}
        relatedLinkSections={[
          {
            title: "Related canonical pages",
            links: [
              {
                href: `/electricity-bill-estimator/${slug}`,
                label: `${state.name} estimator state page`,
                description: "Profile directory for this state",
              },
              {
                href: `/average-electricity-bill/${slug}`,
                label: `Average bill benchmark in ${state.name}`,
                description: "Fixed benchmark bill intent",
              },
              {
                href: `/electricity-cost-calculator/${slug}`,
                label: `${state.name} electricity cost calculator`,
                description: "Calculator scenario intent",
              },
              {
                href: `/electricity-usage-cost/${profileConfig.defaultMonthlyKwh <= 900 ? 1000 : 1500}/${slug}`,
                label: `${state.name} fixed-kWh usage cost page`,
                description: "Fixed-kWh intent route",
              },
              ...featuredApplianceSlugs.map((applianceSlug) => ({
                href: `/cost-to-run/${applianceSlug}/${slug}`,
                label: `${applianceSlug.replace(/-/g, " ")} cost to run in ${state.name}`,
                description: "Canonical appliance operating-cost route",
              })),
            ],
          },
        ]}
        sourceAttribution={{
          sourceName: state.sourceName,
          sourceUrl: state.sourceUrl,
          updatedLabel: state.updatedLabel,
        }}
      >
        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">Scenario assumptions and variability</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>{profileConfig.usageBehavior}</p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>{profileConfig.variabilityNote}</p>
        </section>

        <section style={{ marginBottom: "var(--space-7)" }}>
          <h2 className="heading-section">Methodology and disclosure</h2>
          <p className="muted" style={{ marginTop: 0, lineHeight: 1.7 }}>
            Pilot scope: this profile route is a rollout-gated scenario surface. State estimator routes remain the
            canonical entry point for broad estimator intent. Current active pilot coverage is{" "}
            {profileRollout.activeKeyCount} routes across {profileRollout.activeStateCount} states.
          </p>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Estimates on this route are deterministic scenarios for planning context. They are not utility quotes.
            Calculations are energy-only and exclude delivery charges, taxes, and fixed monthly fees.
          </p>
          <p style={{ marginBottom: 0, lineHeight: 1.7 }}>
            For benchmark intent, use <Link href={`/average-electricity-bill/${slug}`}>average bill pages</Link>. For
            broader interactive intent, use{" "}
            <Link href={`/electricity-cost-calculator/${slug}`}>state calculator pages</Link>.
          </p>
        </section>
      </LongtailStateTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
