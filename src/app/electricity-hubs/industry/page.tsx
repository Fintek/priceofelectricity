import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { getIndustryHubOverviewCards } from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Industry Electricity Cost Hubs | PriceOfElectricity.com",
  description:
    "Browse industry electricity cost hubs for active scenario families such as EV charging, mining, and data centers.",
  canonicalPath: "/electricity-hubs/industry",
});

export default async function IndustryElectricityHubIndexPage() {
  const industryCards = getIndustryHubOverviewCards();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "Industry Electricity Cost Hubs", url: "/electricity-hubs/industry" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Industry Electricity Cost Hubs",
    description:
      "Browse industry electricity cost hubs for active scenario families such as EV charging, mining, and data centers.",
    url: "/electricity-hubs/industry",
    isPartOf: "/",
    about: ["industry electricity cost hubs", "EV charging electricity cost", "data center electricity cost"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "Industry Electricity Cost Hubs" },
        ]}
        title="Industry Electricity Cost Hubs"
        intro="These hubs organize the site's industry electricity scenario pages. Each industry hub links to state-level scenario pages and related electricity cost discovery pages, giving users a path into higher-value commercial electricity queries."
        stats={[{ label: "Active industry hubs", value: String(industryCards.length) }]}
        monetizationContext={{ pageType: "hub-industry-index" }}
        sections={[
          {
            title: "Browse industry scenario hubs",
            intro: "Open an industry hub to explore active state-by-state scenario pages for that electricity use case.",
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
