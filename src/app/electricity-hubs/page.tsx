import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import { getRelease } from "@/lib/knowledge/fetch";
import { loadElectricityComparisonPairs } from "@/lib/knowledge/loadKnowledgePage";
import {
  buildFeaturedComparisonCards,
  getIndustryHubOverviewCards,
  getStateHubDirectoryCards,
  getUsageHubOverviewCards,
  loadAllTrafficHubStates,
  type TrafficHubSection,
} from "@/lib/longtail/trafficHubs";
import {
  getActiveCityPages,
  getActiveIndustrySlugs,
  getActiveUsageKwhTiers,
  isLongtailFamilyActive,
} from "@/lib/longtail/rollout";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildItemListJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/jsonld";
import {
  buildProviderDiscoveryItemListEntries,
  PROVIDER_DISCOVERY_SECTION_TITLE,
} from "@/lib/providers/providerDiscovery";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Hubs: State, Usage, Bill & Appliance Discovery | PriceOfElectricity.com",
  description:
    "Discovery hubs for state electricity pages, usage scenarios, bill estimators, appliance cost routes, comparison pages, and industry electricity cost pages.",
  canonicalPath: "/electricity-hubs",
});

export default async function ElectricityHubsIndexPage() {
  const [states, compareManifest] = await Promise.all([
    loadAllTrafficHubStates(),
    loadElectricityComparisonPairs(),
  ]);

  const stateCards = getStateHubDirectoryCards(states, 12);
  const usageCards = getUsageHubOverviewCards();
  const industryCards = getIndustryHubOverviewCards();
  const comparisonCards = await buildFeaturedComparisonCards(6);
  const activeCities = getActiveCityPages().slice(0, 4);
  const representativeState = states[0];

  const sections: TrafficHubSection[] = [
    {
      title: "State electricity hubs",
      intro:
        "State hubs are the main discovery gateways for each state. They group current price pages, usage scenarios, trend pages, comparison links, and calculators in one place.",
      cards: [
        {
          href: "/electricity-hubs/states",
          title: "Browse all state electricity hubs",
          description: "Directory of all state-level electricity hub pages.",
          eyebrow: "Traffic hub",
          meta: `${states.length} state hubs`,
        },
        ...stateCards,
      ],
    },
    {
      title: "Electricity cost scenario hubs",
      intro:
        "Scenario hubs organize the longtail inventory by common residential usage patterns and, when active, by industry-specific electricity use cases.",
      cards: [
        {
          href: "/electricity-hubs/scenarios",
          title: "Electricity cost scenario hub",
          description: "Overview hub for residential usage scenarios and industry electricity scenarios.",
          eyebrow: "Traffic hub",
        },
        ...usageCards,
        ...industryCards.slice(0, 3),
      ],
    },
    {
      title: "Comparison hubs",
      intro:
        "Comparison hubs help users move from a single-state lookup into broader state-vs-state electricity cost discovery paths.",
      cards: [
        {
          href: "/electricity-hubs/comparisons",
          title: "Electricity comparison hub",
          description: "Discovery page for head-to-head state electricity comparison pages and state comparison pathways.",
          eyebrow: "Traffic hub",
          meta: `${compareManifest?.pairs.length ?? 0} comparison pairs available`,
        },
        ...comparisonCards,
      ],
    },
    {
      title: "State and city authority clusters",
      intro:
        "These pages anchor state-level electricity authority and city context discovery while preserving canonical separation between state, city, and scenario intent families.",
      cards: [
        {
          href: "/electricity-cost",
          title: "Electricity cost by state index",
          description: "Canonical state-cost authority cluster index.",
          eyebrow: "Canonical cluster",
        },
        ...(representativeState
          ? [
              {
                href: `/electricity-cost/${representativeState.slug}`,
                title: `${representativeState.name} electricity cost authority page`,
                description: "Representative state authority route inside the electricity cost cluster.",
                eyebrow: "Canonical cluster",
              },
            ]
          : []),
        ...(representativeState && isLongtailFamilyActive("state-price-per-kwh")
          ? [
              {
                href: `/electricity-price-per-kwh/${representativeState.slug}`,
                title: `${representativeState.name} price-per-kWh page`,
                description: "Canonical state pricing route for per-kWh search intent.",
                eyebrow: "Canonical cluster",
              },
            ]
          : []),
        ...activeCities.slice(0, 2).map((city) => ({
          href: `/electricity-cost/${city.stateSlug}/${city.slug}`,
          title: `${city.name} city electricity context`,
          description: "Rollout-enabled city authority page with deterministic methodology disclosure.",
          eyebrow: "Canonical cluster",
        })),
      ],
    },
    {
      title: "Bill and appliance clusters",
      intro:
        "These entry points connect benchmark bill intent, estimator scenarios, appliance operating-cost pages, and calculator pathways into one consumer-intent discovery set.",
      cards: [
        {
          href: "/average-electricity-bill",
          title: "Average electricity bill hub",
          description: "National and state benchmark bill context pages.",
          eyebrow: "Canonical cluster",
        },
        {
          href: "/electricity-bill-estimator",
          title: "Electricity bill estimator hub",
          description: "Household-profile estimator pages with deterministic assumptions.",
          eyebrow: "Canonical cluster",
        },
        {
          href: "/electricity-cost-calculator",
          title: "Electricity cost calculator hub",
          description: "Calculator entry points for state and appliance scenarios.",
          eyebrow: "Canonical cluster",
        },
        {
          href: "/electricity-usage",
          title: "Electricity usage hub",
          description: "Usage intelligence pages connecting kWh patterns to cost routes.",
          eyebrow: "Canonical cluster",
        },
        {
          href: "/energy-comparison",
          title: "Energy comparison hub",
          description: "Curated comparison entry point across state, appliance, usage, and city clusters.",
          eyebrow: "Discovery hub",
        },
      ],
    },
    {
      title: PROVIDER_DISCOVERY_SECTION_TITLE,
      intro:
        "Provider marketplace pages are discovery/support surfaces that help users compare provider context by state without replacing canonical cost, bill, or estimator cluster ownership.",
      cards: [
        {
          href: "/electricity-providers",
          title: "Electricity providers index",
          description: "State-by-state provider context and marketplace discovery entry point.",
          eyebrow: "Marketplace discovery",
        },
        ...states.slice(0, 3).map((state) => ({
          href: `/electricity-providers/${state.slug}`,
          title: `${state.name} provider context`,
          description: "State-scoped provider discovery page connected to canonical cost and comparison clusters.",
          eyebrow: "Marketplace discovery",
        })),
      ],
    },
  ].filter((section) => section.cards.length > 0);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Hubs",
    description:
      "Discovery hubs for state electricity pages, usage scenarios, comparison pages, and industry electricity cost pages.",
    url: "/electricity-hubs",
    isPartOf: "/",
    about: [
      "electricity hubs",
      "state electricity pages",
      "usage cost scenarios",
      "electricity comparisons",
    ],
  });
  const faqJsonLd = buildFaqPageJsonLd([
    {
      question: "Does this hub replace canonical state, city, or appliance routes?",
      answer:
        "No. The hub is a discovery layer that links to canonical clusters and does not replace canonical ownership for state, city, appliance, or comparison intent routes.",
    },
    {
      question: "How does this hub support authority scaling?",
      answer:
        "It centralizes navigation into core canonical clusters, reinforces cross-cluster pathways, and improves crawl entry depth without adding new route families.",
    },
  ]);
  const clusterItemListJsonLd = buildItemListJsonLd("Electricity authority clusters", [
    { name: "State electricity cost cluster", url: "/electricity-cost" },
    { name: "City electricity context cluster", url: "/electricity-cost/texas/houston" },
    { name: "Average electricity bill cluster", url: "/average-electricity-bill" },
    { name: "Electricity bill estimator cluster", url: "/electricity-bill-estimator" },
    { name: "Appliance operating cost cluster", url: "/cost-to-run/refrigerator/texas" },
    { name: "Energy comparison cluster", url: "/energy-comparison" },
  ]);
  const providerDiscoveryItemListJsonLd = buildItemListJsonLd(
    "Provider marketplace discovery clusters",
    buildProviderDiscoveryItemListEntries(states),
  );

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd,
          webPageJsonLd,
          faqJsonLd,
          clusterItemListJsonLd,
          providerDiscoveryItemListJsonLd,
        ]}
      />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs" },
        ]}
        title="Electricity Hubs"
        intro="This discovery layer helps search engines and users find the site's expanding longtail electricity pages through structured, high-context entry points. Each hub is designed to be useful on its own while routing visitors into deeper state, usage, industry, and comparison pages."
        stats={[
          { label: "State hubs", value: String(states.length) },
          { label: "Active city contexts", value: String(activeCities.length) },
          { label: "Active usage hubs", value: String(getActiveUsageKwhTiers().length) },
          { label: "Active industry hubs", value: String(getActiveIndustrySlugs().length) },
          { label: "Comparison pairs", value: String(compareManifest?.pairs.length ?? 0) },
        ]}
        monetizationContext={{ pageType: "hub-index" }}
        sections={sections}
      >
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>How this traffic engine works</h2>
          <p style={{ marginTop: 0, maxWidth: "65ch", lineHeight: 1.6 }}>
            The hub layer sits above the longtail page families and exposes them through a smaller number of structured
            entry points. That keeps the site crawlable as inventory grows, while giving visitors a clear path from
            broad discovery pages into specific state, usage, trend, and comparison pages.
          </p>
        </section>
      </TrafficHubTemplate>
      <div className="container">
        <CommercialPlacement
          pageFamily="energy-comparison-hub-pages"
          context={{
            pageType: "hub-index",
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
