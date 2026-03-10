import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
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
import { getActiveIndustrySlugs, getActiveUsageKwhTiers } from "@/lib/longtail/rollout";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Hubs | PriceOfElectricity.com",
  description:
    "Discovery hubs for state electricity pages, usage scenarios, comparison pages, and industry electricity cost pages.",
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

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs" },
        ]}
        title="Electricity Hubs"
        intro="This discovery layer helps search engines and users find the site's expanding longtail electricity pages through structured, high-context entry points. Each hub is designed to be useful on its own while routing visitors into deeper state, usage, industry, and comparison pages."
        stats={[
          { label: "State hubs", value: String(states.length) },
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
        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </div>
    </>
  );
}
