import type { Metadata } from "next";
import Link from "next/link";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";
import ProviderDiscoverySection from "@/components/providers/ProviderDiscoverySection";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  getEnergyComparisonApplianceCityPilotPages,
  getEnergyComparisonApplianceSlugs,
  getEnergyComparisonCityPages,
  getEnergyComparisonPairs,
  getEnergyComparisonStateFocus,
  getEnergyComparisonUsageStates,
  getEnergyComparisonUsageTiers,
} from "@/lib/longtail/energyComparisonHub";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbListJsonLd,
  buildFaqPageJsonLd,
  buildItemListJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo/jsonld";
import { buildCommercialPathwayItemListJsonLd } from "@/lib/seo/jsonld";
import {
  buildProviderDiscoveryItemListEntries,
  buildProviderDiscoveryLinks,
} from "@/lib/providers/providerDiscovery";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Energy Comparison Hub: State, Usage, Appliance & Bill Paths | PriceOfElectricity.com",
  description:
    "Compare electricity pathways across state-vs-state prices, usage tiers, appliance operating costs, city context, and bill-estimator routes using curated links to canonical pages.",
  canonicalPath: "/energy-comparison",
});

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function EnergyComparisonHubPage() {
  const [pairs] = await Promise.all([getEnergyComparisonPairs(18)]);
  const focusStates = getEnergyComparisonStateFocus();
  const usageTiers = getEnergyComparisonUsageTiers();
  const usageStates = getEnergyComparisonUsageStates();
  const applianceSlugs = getEnergyComparisonApplianceSlugs(8);
  const cityPages = getEnergyComparisonCityPages(8);
  const applianceCityPilotPages = getEnergyComparisonApplianceCityPilotPages(6);

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Energy Comparison Hub", url: "/energy-comparison" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Energy Comparison Hub",
    description:
      "Structured comparison discovery hub that routes users into canonical comparison, usage, appliance, and city electricity pages.",
    url: "/energy-comparison",
    isPartOf: "/",
    about: [
      "energy comparison hub",
      "state electricity comparison",
      "appliance operating cost comparison",
      "usage tier electricity comparison",
    ],
  });
  const faqJsonLd = buildFaqPageJsonLd([
    {
      question: "Does the Energy Comparison Hub create new canonical comparison pages?",
      answer:
        "No. It is a curated discovery layer that links into existing canonical state, usage, appliance, and city comparison routes.",
    },
    {
      question: "Where are state-to-state comparison pages canonicalized?",
      answer:
        "State pair comparisons remain canonical in /electricity-cost-comparison/[pair].",
    },
    {
      question: "How does this hub reinforce topical authority?",
      answer:
        "It provides curated pathways across state, usage, appliance, city, and bill clusters while preserving canonical ownership in the destination families.",
    },
  ]);
  const clusterItemListJsonLd = buildItemListJsonLd("Energy comparison canonical clusters", [
    { name: "State comparison cluster", url: "/electricity-cost-comparison" },
    { name: "Fixed-usage cost cluster", url: "/electricity-usage-cost/1000/texas" },
    { name: "Appliance cost cluster", url: "/cost-to-run/refrigerator/texas" },
    { name: "City electricity context cluster", url: "/electricity-cost/texas/houston" },
    { name: "Bill estimator cluster", url: "/electricity-bill-estimator" },
    { name: "Average bill benchmark cluster", url: "/average-electricity-bill" },
  ]);
  const providerDiscoveryItemListJsonLd = buildItemListJsonLd(
    "Provider comparison discovery pathways",
    buildProviderDiscoveryItemListEntries(focusStates),
  );
  const commercialPathwaysJsonLd = buildCommercialPathwayItemListJsonLd(
    "Energy comparison commercial pathways",
    [
      { name: "Electricity providers by state", url: "/electricity-providers", pathwayType: "provider-marketplace" },
      { name: "Offers and savings hub", url: "/offers", pathwayType: "offers" },
      { name: "State electricity cluster", url: "/electricity-cost", pathwayType: "state-cluster" },
      { name: "Bill estimator cluster", url: "/electricity-bill-estimator", pathwayType: "estimator-cluster" },
    ],
  );
  const providerDiscoveryLinks = buildProviderDiscoveryLinks(focusStates);

  return (
    <>
      <JsonLdScript
        data={[
          breadcrumbJsonLd,
          webPageJsonLd,
          faqJsonLd,
          clusterItemListJsonLd,
          providerDiscoveryItemListJsonLd,
          commercialPathwaysJsonLd,
        ]}
      />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <span aria-current="page">Energy Comparison Hub</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Energy Comparison Hub</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "75ch", lineHeight: 1.7 }}>
          This hub is a curated comparison index that links into existing canonical systems. It does not create a new
          comparison dataset; it organizes entry points for state comparisons, usage-tier checks, appliance cost
          pathways, and city electricity context.
        </p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>State electricity comparisons</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Canonical ownership remains in the existing state pair family at{" "}
            <Link href="/electricity-cost-comparison">/electricity-cost-comparison</Link>.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/energy-comparison/states">Browse curated state comparison routes</Link></li>
            {pairs.slice(0, 6).map((item) => (
              <li key={item.pair}>
                <Link href={`/electricity-cost-comparison/${item.pair}`}>
                  {toTitle(item.stateA)} vs {toTitle(item.stateB)}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>Usage tier comparisons</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Compare fixed-kWh cost scenarios using canonical usage intent pages.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/energy-comparison/usage">Open usage comparison slice</Link></li>
            {usageTiers.slice(0, 3).map((tier) =>
              usageStates.slice(0, 2).map((state) => (
                <li key={`${tier}-${state.slug}`}>
                  <Link href={`/electricity-usage-cost/${tier}/${state.slug}`}>
                    {tier.toLocaleString()} kWh in {state.name}
                  </Link>
                </li>
              )),
            )}
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>Appliance operating cost comparisons</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Appliance cost intent remains canonical at <code>/cost-to-run/[appliance]/[state]</code>. This hub links to
            high-signal appliance/state entries and pilot appliance-city comparisons where enabled.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/energy-comparison/appliances">Open appliance comparison slice</Link></li>
            {applianceSlugs.slice(0, 4).map((slug) => (
              <li key={slug}>
                <Link href={`/cost-to-run/${slug}/${focusStates[0]?.slug ?? "california"}`}>
                  {toTitle(slug)} in {focusStates[0]?.name ?? "California"}
                </Link>
              </li>
            ))}
            {applianceCityPilotPages.map((page) => (
              <li key={`${page.applianceSlug}-${page.stateSlug}-${page.citySlug}`}>
                <Link href={`/cost-to-run/${page.applianceSlug}/${page.stateSlug}/${page.citySlug}`}>
                  Pilot: {toTitle(page.applianceSlug)} in {toTitle(page.citySlug)}, {toTitle(page.stateSlug)}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>City electricity context comparisons</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            City authority/context intent remains canonical at <code>/electricity-cost/[state]/[city]</code>.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {cityPages.map((city) => (
              <li key={`${city.stateSlug}-${city.slug}`}>
                <Link href={`/electricity-cost/${city.stateSlug}/${city.slug}`}>
                  Electricity cost in {city.name}, {toTitle(city.stateSlug)}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>Bill estimator and benchmark pathways</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Use estimator and benchmark bill pages to connect comparison discovery with household-intent cost context.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {focusStates.slice(0, 4).map((state) => (
              <li key={`estimator-${state.slug}`}>
                <Link href={`/electricity-bill-estimator/${state.slug}`}>
                  {state.name} bill estimator scenarios
                </Link>
                {" · "}
                <Link href={`/average-electricity-bill/${state.slug}`}>
                  {state.name} average bill benchmark
                </Link>
              </li>
            ))}
            <li>
              <Link href="/electricity-hubs">Electricity hubs discovery index</Link>
            </li>
          </ul>
        </section>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>Authority cluster map</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            Use these cluster entry pages to move from comparison intent into state authority, benchmark bill context,
            and calculator/scenario routes without changing canonical ownership.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-cost">State electricity cost authority cluster</Link></li>
            <li><Link href="/average-electricity-bill">Average electricity bill benchmark cluster</Link></li>
            <li><Link href="/electricity-bill-estimator">Electricity bill estimator cluster</Link></li>
            <li><Link href="/electricity-cost-calculator">Electricity cost calculator cluster</Link></li>
            <li><Link href="/electricity-hubs">Electricity hubs discovery cluster</Link></li>
          </ul>
        </section>

        <ProviderDiscoverySection links={providerDiscoveryLinks} />

        <CommercialPlacement
          pageFamily="energy-comparison-hub-pages"
          context={{
            pageType: "hub-comparisons",
          }}
        />

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
