import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  buildUsageTierCardsForStates,
  loadAllTrafficHubStates,
  parseTrafficHubUsageKwh,
  sortStatesByRate,
} from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kwh: string }>;
}): Promise<Metadata> {
  const { kwh } = await params;
  const parsedKwh = parseTrafficHubUsageKwh(kwh);
  if (parsedKwh == null) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that electricity usage hub.",
      canonicalPath: `/electricity-hubs/usage/${kwh}`,
    });
  }

  return buildMetadata({
    title: `${parsedKwh.toLocaleString()} kWh Electricity Hub | PriceOfElectricity.com`,
    description:
      `Browse state-by-state electricity cost pages for ${parsedKwh.toLocaleString()} kWh usage and compare how the same usage tier costs across states.`,
    canonicalPath: `/electricity-hubs/usage/${parsedKwh}`,
  });
}

export default async function ElectricityUsageHubPage({
  params,
}: {
  params: Promise<{ kwh: string }>;
}) {
  const { kwh } = await params;
  const parsedKwh = parseTrafficHubUsageKwh(kwh);
  if (parsedKwh == null) notFound();

  const states = await loadAllTrafficHubStates();
  const cheapestStates = sortStatesByRate(states, "asc").slice(0, 8);
  const highestStates = sortStatesByRate(states, "desc").slice(0, 8);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "Electricity Usage Hubs", url: "/electricity-hubs/usage" },
    { name: `${parsedKwh} kWh Electricity Hub`, url: `/electricity-hubs/usage/${parsedKwh}` },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `${parsedKwh.toLocaleString()} kWh Electricity Hub`,
    description:
      `Browse state-by-state electricity cost pages for ${parsedKwh.toLocaleString()} kWh usage and compare how the same usage tier costs across states.`,
    url: `/electricity-hubs/usage/${parsedKwh}`,
    isPartOf: "/",
    about: [
      `${parsedKwh} kWh electricity cost`,
      "electricity usage hub",
      "state electricity usage comparisons",
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "Electricity Usage Hubs", href: "/electricity-hubs/usage" },
          { label: `${parsedKwh.toLocaleString()} kWh Electricity Hub` },
        ]}
        title={`${parsedKwh.toLocaleString()} kWh Electricity Hub`}
        intro={`This hub groups the site's state-level electricity pages for ${parsedKwh.toLocaleString()} kWh usage. It is designed for users who already know the usage tier they care about and want to compare that scenario across multiple states.`}
        stats={[
          { label: "States covered", value: String(states.length) },
          { label: "Usage tier", value: `${parsedKwh.toLocaleString()} kWh` },
        ]}
        monetizationContext={{
          pageType: "hub-usage-detail",
          usageKwh: parsedKwh,
        }}
        sections={[
          {
            title: `Lower-cost states for ${parsedKwh.toLocaleString()} kWh`,
            intro: "These state pages sit at the lower end of the current rate distribution for this usage tier.",
            cards: buildUsageTierCardsForStates(cheapestStates, parsedKwh),
          },
          {
            title: `Higher-cost states for ${parsedKwh.toLocaleString()} kWh`,
            intro: "These state pages represent the higher end of the current rate distribution for this same usage tier.",
            cards: buildUsageTierCardsForStates(highestStates, parsedKwh),
          },
          {
            title: "Browse all states for this usage tier",
            intro: "Use the state-specific longtail pages below to answer usage cost questions in individual states.",
            cards: buildUsageTierCardsForStates(states, parsedKwh),
          },
        ]}
      />
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
