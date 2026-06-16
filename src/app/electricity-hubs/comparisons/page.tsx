import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  buildFeaturedComparisonCards,
  getStateHubDirectoryCards,
  loadAllTrafficHubStates,
  sortStatesByRate,
} from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Comparison Hub | PriceOfElectricity.com",
  description:
    "Find state-to-state electricity comparisons, the main compare page, and state electricity hubs from one place.",
  canonicalPath: "/electricity-hubs/comparisons",
});

export default async function ElectricityComparisonHubPage() {
  const states = await loadAllTrafficHubStates();
  const cheapestStates = sortStatesByRate(states, "asc").slice(0, 6);
  const highestStates = sortStatesByRate(states, "desc").slice(0, 6);
  const comparisonCards = await buildFeaturedComparisonCards(18);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "Electricity Comparison Hub", url: "/electricity-hubs/comparisons" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Comparison Hub",
    description:
      "Find state-to-state electricity comparisons, the main compare page, and state electricity hubs from one place.",
    url: "/electricity-hubs/comparisons",
    isPartOf: "/",
    about: ["electricity comparison hub", "state electricity comparison pages", "compare electricity by state"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "Electricity Comparison Hub" },
        ]}
        title="Electricity Comparison Hub"
        intro="This page links the site’s main state comparison tools: the sortable compare page, head-to-head state pairs, and per-state hub directories."
        stats={[
          { label: "States covered", value: String(states.length) },
          { label: "Featured comparison pages", value: String(comparisonCards.length) },
        ]}
        monetizationContext={{ pageType: "hub-comparisons" }}
        sections={[
          {
            title: "Primary comparison entry points",
            intro: "Start with the broader comparison pages, then move into state-specific hubs or pair-specific pages.",
            cards: [
              {
                href: "/compare",
                title: "Compare electricity prices by state",
                description: "Primary authority page for state-by-state electricity price comparison and sorting.",
                eyebrow: "Authority page",
              },
              {
                href: "/electricity-cost-comparison",
                title: "Electricity cost comparison index",
                description: "Introduces the site’s head-to-head state comparison pages.",
                eyebrow: "Authority page",
              },
              {
                href: "/electricity-hubs/states",
                title: "State electricity hubs",
                description: "Directory of state-specific electricity hubs for deeper comparison pathways.",
                eyebrow: "Browse",
              },
              {
                href: "/electricity-providers",
                title: "Electricity providers overview",
                description:
                  "State-by-state provider context to read alongside rate comparisons.",
                eyebrow: "Plans & offers",
              },
            ],
          },
          {
            title: "Featured state-vs-state comparison pages",
            intro: "Hand-picked state pair pages you can open directly for a side-by-side view.",
            cards: comparisonCards,
          },
          {
            title: "Lower-rate states to compare",
            intro: "These state hubs are useful starting points when users want to explore lower-rate electricity markets.",
            cards: getStateHubDirectoryCards(cheapestStates),
          },
          {
            title: "Higher-rate states to compare",
            intro: "These state hubs help users explore the more expensive side of the electricity rate distribution.",
            cards: getStateHubDirectoryCards(highestStates),
          },
        ]}
      />
      <div className="container">
        <CommercialPlacement
          pageFamily="energy-comparison-hub-pages"
          context={{
            pageType: "hub-comparisons",
          }}
        />
      </div>
      <div className="container">
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
