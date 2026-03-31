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
    "Compare electricity costs across states, usage levels, appliances, and cities. Find side-by-side rate comparisons, usage-based cost estimates, and appliance running costs.",
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
        <p style={{ marginTop: 0, marginBottom: 20, maxWidth: "65ch", lineHeight: 1.7 }}>
          Compare electricity costs across states, usage levels, appliances, and cities.
          Choose a comparison type below to find the data that matters to you.
        </p>

        {/* ── COMPARISON PATHWAYS ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <a href="#state-comparisons" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>State vs State</div>
              <div className="stat-card-label">Side-by-side rate comparisons</div>
            </a>
            <a href="#usage-comparisons" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>By Usage Level</div>
              <div className="stat-card-label">Cost at specific kWh amounts</div>
            </a>
            <a href="#appliance-comparisons" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Appliance Costs</div>
              <div className="stat-card-label">Running cost by appliance</div>
            </a>
            <a href="#city-comparisons" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>City Costs</div>
              <div className="stat-card-label">Electricity prices by city</div>
            </a>
          </div>
        </section>

        {/* ── STATE COMPARISONS ── */}
        <section id="state-comparisons" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>State electricity comparisons</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>
            Compare average residential electricity rates between any two states.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 12 }}>
            {pairs.slice(0, 6).map((item) => (
              <Link key={item.pair} href={`/electricity-cost-comparison/${item.pair}`} className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
                <div style={{ fontWeight: 600 }}>{toTitle(item.stateA)} vs {toTitle(item.stateB)}</div>
              </Link>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            <Link href="/energy-comparison/states">Browse all state comparisons</Link>
            {" · "}
            <Link href="/electricity-cost-comparison">Full comparison index</Link>
          </p>
        </section>

        {/* ── USAGE COMPARISONS ── */}
        <section id="usage-comparisons" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Cost by usage level</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>
            See what a specific monthly usage costs in different states.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
            {usageTiers.slice(0, 3).map((tier) =>
              usageStates.slice(0, 2).map((state) => (
                <Link key={`${tier}-${state.slug}`} href={`/electricity-usage-cost/${tier}/${state.slug}`} className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
                  <div style={{ fontWeight: 600 }}>{tier.toLocaleString()} kWh</div>
                  <div className="stat-card-label">{state.name}</div>
                </Link>
              )),
            )}
          </div>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            <Link href="/energy-comparison/usage">Browse all usage comparisons</Link>
          </p>
        </section>

        {/* ── APPLIANCE COMPARISONS ── */}
        <section id="appliance-comparisons" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Appliance running costs</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", lineHeight: 1.6 }}>
            Find out how much it costs to run common household appliances in your state.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
            {applianceSlugs.slice(0, 4).map((slug) => (
              <Link key={slug} href={`/cost-to-run/${slug}/${focusStates[0]?.slug ?? "california"}`} className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
                <div style={{ fontWeight: 600 }}>{toTitle(slug)}</div>
                <div className="stat-card-label">in {focusStates[0]?.name ?? "California"}</div>
              </Link>
            ))}
          </div>
          {applianceCityPilotPages.length > 0 && (
            <ul style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: 1.8, fontSize: 14 }}>
              {applianceCityPilotPages.map((page) => (
                <li key={`${page.applianceSlug}-${page.stateSlug}-${page.citySlug}`}>
                  <Link href={`/cost-to-run/${page.applianceSlug}/${page.stateSlug}/${page.citySlug}`}>
                    {toTitle(page.applianceSlug)} in {toTitle(page.citySlug)}, {toTitle(page.stateSlug)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            <Link href="/energy-comparison/appliances">Browse all appliance comparisons</Link>
          </p>
        </section>

        {/* ── CITY COMPARISONS ── */}
        <section id="city-comparisons" style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>City electricity costs</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 12 }}>
            {cityPages.map((city) => (
              <Link key={`${city.stateSlug}-${city.slug}`} href={`/electricity-cost/${city.stateSlug}/${city.slug}`} className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
                <div style={{ fontWeight: 600 }}>{city.name}</div>
                <div className="stat-card-label">{toTitle(city.stateSlug)}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── BILL ESTIMATORS ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Bill estimators &amp; benchmarks</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 12 }}>
            {focusStates.slice(0, 4).map((state) => (
              <div key={`estimator-${state.slug}`} className="stat-card">
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{state.name}</div>
                <div style={{ fontSize: 13 }}>
                  <Link href={`/electricity-bill-estimator/${state.slug}`}>Bill estimator</Link>
                  {" · "}
                  <Link href={`/average-electricity-bill/${state.slug}`}>Average bill</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RELATED ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Related pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/average-electricity-bill">Average electricity bills</Link></li>
            <li><Link href="/electricity-bill-estimator">Bill estimator hub</Link></li>
            <li><Link href="/electricity-cost-calculator">Electricity cost calculator</Link></li>
            <li><Link href="/electricity-hubs">Electricity hubs</Link></li>
          </ul>
        </section>

        <ProviderDiscoverySection links={providerDiscoveryLinks} />

        <CommercialPlacement
          pageFamily="energy-comparison-hub-pages"
          context={{ pageType: "hub-comparisons" }}
        />

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
