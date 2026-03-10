import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { getIndustryHubOverviewCards, getUsageHubOverviewCards } from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Cost Scenario Hub | PriceOfElectricity.com",
  description:
    "Browse residential usage scenarios and industry electricity cost scenarios built from the site's existing electricity dataset.",
  canonicalPath: "/electricity-hubs/scenarios",
});

export default async function ElectricityScenarioHubPage() {
  const usageCards = getUsageHubOverviewCards();
  const industryCards = getIndustryHubOverviewCards();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "Electricity Cost Scenario Hub", url: "/electricity-hubs/scenarios" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Cost Scenario Hub",
    description:
      "Browse residential usage scenarios and industry electricity cost scenarios built from the site's existing electricity dataset.",
    url: "/electricity-hubs/scenarios",
    isPartOf: "/",
    about: ["electricity cost scenarios", "usage cost pages", "industry electricity scenarios"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "Electricity Cost Scenario Hub" },
        ]}
        title="Electricity Cost Scenario Hub"
        intro="This hub organizes the site's scenario-style electricity pages. It connects common household usage tiers with higher-load industry scenarios so users can move from general discovery into specific cost pages that match their use case."
        stats={[
          { label: "Residential usage hubs", value: String(usageCards.length) },
          { label: "Industry scenario hubs", value: String(industryCards.length) },
        ]}
        monetizationContext={{ pageType: "hub-scenarios" }}
        sections={[
          {
            title: "Residential usage scenarios",
            intro:
              "These hub pages group longtail electricity pages by common household usage tiers such as 500, 1000, and 2000 kWh.",
            cards: usageCards,
          },
          {
            title: "Industry electricity scenarios",
            intro:
              "These hub pages organize active industry scenario pages for EV charging, mining, and data center electricity cost discovery.",
            cards: industryCards,
          },
        ].filter((section) => section.cards.length > 0)}
      />
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
