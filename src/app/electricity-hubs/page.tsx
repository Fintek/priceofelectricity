import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import Link from "next/link";
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
} from "@/lib/providers/providerDiscovery";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Hubs: State, Usage, Bill & Appliance Discovery | PriceOfElectricity.com",
  description:
    "Explore electricity data by state, usage level, household profile, and appliance. Find rates, compare costs, estimate bills, and browse providers.",
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
      title: "Electricity rates by state",
      intro:
        "Start with a state to see current rates, usage scenarios, trends, and cost comparisons.",
      cards: [
        {
          href: "/electricity-hubs/states",
          title: "Browse all states",
          description: "Find electricity data for any U.S. state.",
          meta: `${states.length} states covered`,
        },
        ...stateCards,
      ],
    },
    {
      title: "Usage &amp; scenario estimates",
      intro:
        "See what electricity costs at common usage levels, by household size, and for specific industries.",
      cards: [
        {
          href: "/electricity-hubs/scenarios",
          title: "Usage scenarios",
          description: "Residential and industry electricity cost scenarios.",
        },
        ...usageCards,
        ...industryCards.slice(0, 3),
      ],
    },
    {
      title: "State comparisons",
      intro:
        "Compare electricity rates and bills between states side by side.",
      cards: [
        {
          href: "/electricity-hubs/comparisons",
          title: "Comparison index",
          description: "Head-to-head state electricity cost comparisons.",
          meta: `${compareManifest?.pairs.length ?? 0} comparison pairs`,
        },
        ...comparisonCards,
      ],
    },
    {
      title: "Cost data &amp; city details",
      intro:
        "Detailed electricity cost pages for states and cities.",
      cards: [
        {
          href: "/electricity-cost",
          title: "Electricity cost by state",
          description: "Average residential rates and cost estimates for every state.",
        },
        ...(representativeState
          ? [
              {
                href: `/electricity-cost/${representativeState.slug}`,
                title: `${representativeState.name} electricity cost`,
                description: `Detailed cost data for ${representativeState.name}.`,
              },
            ]
          : []),
        ...(representativeState && isLongtailFamilyActive("state-price-per-kwh")
          ? [
              {
                href: `/electricity-price-per-kwh/${representativeState.slug}`,
                title: `${representativeState.name} price per kWh`,
                description: "Per-kWh pricing details.",
              },
            ]
          : []),
        ...activeCities.slice(0, 2).map((city) => ({
          href: `/electricity-cost/${city.stateSlug}/${city.slug}`,
          title: `${city.name} electricity cost`,
          description: `City-level electricity cost data for ${city.name}.`,
        })),
      ],
    },
    {
      title: "Bills, estimators &amp; calculators",
      intro:
        "Estimate your bill, see average costs, calculate appliance running costs, and compare energy use.",
      cards: [
        {
          href: "/average-electricity-bill",
          title: "Average electricity bills",
          description: "Typical monthly bills by state.",
        },
        {
          href: "/electricity-bill-estimator",
          title: "Bill estimator",
          description: "Estimate your bill by household profile.",
        },
        {
          href: "/electricity-cost-calculator",
          title: "Cost calculator",
          description: "Calculate costs for any usage amount.",
        },
        {
          href: "/electricity-usage",
          title: "Usage data",
          description: "Electricity usage patterns and costs.",
        },
        {
          href: "/energy-comparison",
          title: "Energy comparison hub",
          description: "Compare across states, appliances, usage, and cities.",
        },
      ],
    },
    {
      title: "Electricity providers",
      intro:
        "Explore electricity providers and plans available in your state.",
      cards: [
        {
          href: "/electricity-providers",
          title: "All providers",
          description: "Browse electricity providers by state.",
        },
        ...states.slice(0, 3).map((state) => ({
          href: `/electricity-providers/${state.slug}`,
          title: `${state.name} providers`,
          description: `Electricity providers and plans in ${state.name}.`,
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
      question: "What can I find on the Electricity Hubs page?",
      answer:
        "This page is a central directory for all electricity data on the site — state rates, bill estimators, cost comparisons, usage scenarios, and provider information.",
    },
    {
      question: "How is the data organized?",
      answer:
        "Data is grouped by topic: state rates, usage scenarios, comparisons, cost details, bill tools, and providers. Each section links to detailed pages.",
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
        intro="Explore electricity data across all 50 states — rates, bills, comparisons, usage scenarios, and provider information. Choose a topic below to get started."
        stats={[
          { label: "States", value: String(states.length) },
          { label: "Cities", value: String(activeCities.length) },
          { label: "Usage scenarios", value: String(getActiveUsageKwhTiers().length) },
          { label: "Industry sectors", value: String(getActiveIndustrySlugs().length) },
          { label: "Comparisons", value: String(compareManifest?.pairs.length ?? 0) },
        ]}
        monetizationContext={{ pageType: "hub-index" }}
        sections={sections}
      >
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Quick links</h2>
          <ul style={{ marginTop: 0, marginBottom: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-hubs/states">Browse by state</Link> — find rates, bills, and providers for your state
            </li>
            <li>
              <Link href="/electricity-hubs/scenarios">Usage scenarios</Link> — see costs at different usage levels
            </li>
            <li>
              <Link href="/electricity-hubs/comparisons">State comparisons</Link> — compare rates between states
            </li>
            <li>
              <Link href="/energy-comparison">Energy comparison hub</Link> — compare across states, appliances, and cities
            </li>
          </ul>
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
