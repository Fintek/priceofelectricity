import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
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
    "Discover state-to-state electricity comparison pages, compare hub routes, and state electricity hubs from one structured comparison entry point.",
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
      "Discover state-to-state electricity comparison pages, compare hub routes, and state electricity hubs from one structured comparison entry point.",
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
        intro="This hub acts as the comparison gateway for the traffic engine. It connects the site's main compare authority page, pair-specific comparison pages, and state electricity hubs so users can move between broad ranking views and focused head-to-head comparisons."
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
                description: "Landing page for the site's head-to-head state comparison family.",
                eyebrow: "Authority page",
              },
              {
                href: "/electricity-hubs/states",
                title: "State electricity hubs",
                description: "Directory of state-specific electricity hubs for deeper comparison pathways.",
                eyebrow: "Traffic hub",
              },
            ],
          },
          {
            title: "Featured state-vs-state comparison pages",
            intro: "These comparison pages route users directly into high-intent state-vs-state electricity cost queries.",
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
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
