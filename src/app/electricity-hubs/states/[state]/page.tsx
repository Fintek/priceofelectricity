import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { getActiveIndustrySlugs, getActiveUsageKwhTiers, isLongtailFamilyActive } from "@/lib/longtail/rollout";
import {
  buildStateHubSections,
  getTrafficHubStateStaticParams,
  type TrafficHubMetric,
} from "@/lib/longtail/trafficHubs";
import { formatRate, loadLongtailStateData } from "@/lib/longtail/stateLongtail";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  return getTrafficHubStateStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const data = await loadLongtailStateData(state);

  if (!data) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that electricity hub.",
      canonicalPath: `/electricity-hubs/states/${state}`,
    });
  }

  return buildMetadata({
    title: `${data.name} Electricity Hub | PriceOfElectricity.com`,
    description:
      `Explore longtail electricity pages for ${data.name}, including price-per-kWh pages, usage scenario pages, comparison pages, and calculators.`,
    canonicalPath: `/electricity-hubs/states/${state}`,
  });
}

export default async function StateElectricityHubPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const data = await loadLongtailStateData(state);
  if (!data) notFound();

  const sections = await buildStateHubSections(data);
  const stats: TrafficHubMetric[] = [
    { label: "Current average rate", value: formatRate(data.avgRateCentsPerKwh) },
    { label: "Active usage scenarios", value: String(getActiveUsageKwhTiers().length) },
    { label: "Trend page active", value: isLongtailFamilyActive("state-price-trend") ? "Yes" : "No" },
    { label: "Industry scenarios", value: String(getActiveIndustrySlugs().length) },
  ];

  const canonicalPath = `/electricity-hubs/states/${state}`;
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "State Electricity Hubs", url: "/electricity-hubs/states" },
    { name: `${data.name} Electricity Hub`, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `${data.name} Electricity Hub`,
    description:
      `Explore longtail electricity pages for ${data.name}, including price-per-kWh pages, usage scenario pages, comparison pages, and calculators.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [
      `${data.name} electricity pages`,
      `${data.name} electricity cost`,
      `${data.name} usage scenarios`,
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "State Electricity Hubs", href: "/electricity-hubs/states" },
          { label: `${data.name} Electricity Hub` },
        ]}
        title={`${data.name} Electricity Hub`}
        intro={`This hub organizes the site's electricity pages for ${data.name} into one discovery layer. Use it to move from broad state context into dedicated longtail pages for current rates, usage cost scenarios, trend pages, comparisons, and calculators.`}
        stats={stats}
        monetizationContext={{
          pageType: "hub-state-detail",
          state,
          stateName: data.name,
        }}
        sections={sections}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>How to use this hub</h2>
          <p style={{ marginTop: 0, maxWidth: "65ch", lineHeight: 1.6 }}>
            Start with the current rate and overview pages if you need a quick answer. Move into usage scenarios to
            answer concrete household cost questions, or use the comparison section if you are evaluating
            {` ${data.name}`} against other states.
          </p>
        </section>
      </TrafficHubTemplate>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
