import type { Metadata } from "next";
import Link from "next/link";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { STATES } from "@/data/states";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  getEnergyComparisonApplianceCityPilotPages,
  getEnergyComparisonApplianceSlugs,
  getEnergyComparisonStateFocus,
} from "@/lib/longtail/energyComparisonHub";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Appliance Electricity Cost by State | PriceOfElectricity.com",
  description:
    "How much does it cost to run common appliances in your state? Browse electricity costs for refrigerators, AC units, space heaters, and more across all U.S. states.",
  canonicalPath: "/energy-comparison/appliances",
});

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function EnergyComparisonAppliancesPage() {
  const applianceSlugs = getEnergyComparisonApplianceSlugs(10);
  const focusStates = getEnergyComparisonStateFocus();
  const pilotPages = getEnergyComparisonApplianceCityPilotPages(8);
  const defaultState = focusStates[0] ?? { slug: "california", name: "California" };

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Energy Comparison Hub", url: "/energy-comparison" },
    { name: "Appliance Comparisons", url: "/energy-comparison/appliances" },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Appliance Electricity Cost by State",
    description: "Find out how much it costs to run common household appliances in your state.",
    url: "/energy-comparison/appliances",
    isPartOf: "/",
    about: ["appliance electricity cost comparisons", "cost to run appliance by state"],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/energy-comparison">Energy Comparison Hub</Link>
          {" · "}
          <span aria-current="page">Appliance Comparisons</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Appliance Electricity Cost by State</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "75ch", lineHeight: 1.7 }}>
          Find out how much it costs to run common household appliances in your state.
          Each page shows estimated monthly and annual running costs based on average residential electricity rates.
        </p>

        <section style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Appliance-state comparisons</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {applianceSlugs.map((slug) => (
              <li key={slug}>
                <Link href={`/cost-to-run/${slug}/${defaultState.slug}`}>
                  {toTitle(slug)} in {defaultState.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {focusStates.slice(1, 4).length > 0 && (
          <section style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Cross-state appliance checks</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {focusStates.slice(1, 4).map((state) => (
                <li key={state.slug}>
                  <Link href={`/cost-to-run/refrigerator/${state.slug}`}>
                    Refrigerator in {state.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {pilotPages.length > 0 && (
          <section style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>Pilot appliance-city comparisons</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {pilotPages.map((page) => (
                <li key={`${page.applianceSlug}-${page.stateSlug}-${page.citySlug}`}>
                  <Link href={`/cost-to-run/${page.applianceSlug}/${page.stateSlug}/${page.citySlug}`}>
                    {toTitle(page.applianceSlug)} in {toTitle(page.citySlug)}, {STATES[page.stateSlug]?.name ?? toTitle(page.stateSlug)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Related comparison pathways</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/energy-comparison">Back to Energy Comparison Hub</Link></li>
            <li><Link href="/energy-comparison/states">State comparison slice</Link></li>
            <li><Link href="/energy-comparison/usage">Usage comparison slice</Link></li>
            <li><Link href="/electricity-bill-estimator">Bill estimator cluster</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
