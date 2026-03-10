import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import TrafficHubTemplate from "@/components/traffic-hubs/TrafficHubTemplate";
import { getRelease } from "@/lib/knowledge/fetch";
import { getStateHubDirectoryCards, loadAllTrafficHubStates } from "@/lib/longtail/trafficHubs";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "State Electricity Hubs | PriceOfElectricity.com",
  description:
    "Browse state electricity hub pages linking to current price pages, usage scenario pages, trend pages, and comparison pages.",
  canonicalPath: "/electricity-hubs/states",
});

export default async function StateElectricityHubsPage() {
  const states = await loadAllTrafficHubStates();
  const stateCards = getStateHubDirectoryCards(states);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Hubs", url: "/electricity-hubs" },
    { name: "State Electricity Hubs", url: "/electricity-hubs/states" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "State Electricity Hubs",
    description:
      "Browse state electricity hub pages linking to current price pages, usage scenario pages, trend pages, and comparison pages.",
    url: "/electricity-hubs/states",
    isPartOf: "/",
    about: ["state electricity hubs", "state electricity pages", "electricity by state"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <TrafficHubTemplate
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Electricity Hubs", href: "/electricity-hubs" },
          { label: "State Electricity Hubs" },
        ]}
        title="State Electricity Hubs"
        intro="Each state hub groups together the site's main electricity pages for that state, including price-per-kWh pages, usage cost scenarios, comparison pathways, and tools. Use this directory to jump directly into the state-level discovery layer."
        stats={[
          { label: "State hubs", value: String(states.length) },
          { label: "Coverage", value: "50 states + D.C." },
        ]}
        monetizationContext={{ pageType: "hub-state-index" }}
        sections={[
          {
            title: "Browse all state hubs",
            intro: "Open a state hub to access its linked longtail electricity pages and related authority content.",
            cards: stateCards,
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
