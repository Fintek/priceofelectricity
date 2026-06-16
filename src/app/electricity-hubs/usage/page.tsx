import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { getUsageHubOverviewCards } from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Usage Hubs | PriceOfElectricity.com",
  description:
    "Browse electricity usage hubs by common kWh tiers to discover state-by-state usage cost pages.",
  canonicalPath: "/electricity-hubs/usage",
});

export default async function ElectricityUsageHubIndexPage() {
  const usageCards = getUsageHubOverviewCards();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "Electricity Usage Hubs", url: "/electricity-hubs/usage" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Usage Hubs",
    description:
      "Browse electricity usage hubs by common kWh tiers to discover state-by-state usage cost pages.",
    url: "/electricity-hubs/usage",
    isPartOf: "/",
    about: ["electricity usage hubs", "kWh cost pages", "residential electricity scenarios"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "Electricity Usage Hubs" },
        ]}
        title="Electricity Usage Hubs"
        intro="These hubs organize pages by common monthly kWh levels so you can jump from a question like ‘how much does 1,000 kWh cost?’ into state-by-state answers."
        stats={[{ label: "Active usage hubs", value: String(usageCards.length) }]}
        monetizationContext={{ pageType: "hub-usage-index" }}
        sections={[
          {
            title: "Browse by electricity usage tier",
            intro: "Open a usage hub to compare one monthly kWh level across states, then open any state’s detailed page.",
            cards: usageCards,
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
