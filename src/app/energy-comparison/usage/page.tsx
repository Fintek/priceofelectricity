import type { Metadata } from "next";
import Link from "next/link";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { getRelease } from "@/lib/knowledge/fetch";
import {
  getEnergyComparisonUsageStates,
  getEnergyComparisonUsageTiers,
} from "@/lib/longtail/energyComparisonHub";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Cost by Usage Level (kWh) | PriceOfElectricity.com",
  description:
    "See what electricity costs at different usage levels — 500, 1000, or 2000 kWh — across every U.S. state. Find exact dollar amounts for your monthly usage.",
  canonicalPath: "/energy-comparison/usage",
});

export default async function EnergyComparisonUsagePage() {
  const tiers = getEnergyComparisonUsageTiers();
  const states = getEnergyComparisonUsageStates();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Energy Comparison Hub", url: "/energy-comparison" },
    { name: "Usage Comparisons", url: "/energy-comparison/usage" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Cost by Usage Level",
    description: "See what electricity costs at different usage levels across every U.S. state.",
    url: "/energy-comparison/usage",
    isPartOf: "/",
    about: ["kWh usage cost comparisons", "electricity usage tier comparison"],
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
          <span aria-current="page">Usage Comparisons</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Cost by Usage Level</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "75ch", lineHeight: 1.7 }}>
          How much does electricity actually cost at your usage level? Browse costs by kWh tier
          and state to see exact dollar amounts for common monthly usage levels.
        </p>

        {tiers.map((tier) => (
          <section key={tier} style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 10 }}>{tier.toLocaleString()} kWh comparisons</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {states.map((state) => (
                <li key={`${tier}-${state.slug}`}>
                  <Link href={`/electricity-usage-cost/${tier}/${state.slug}`}>
                    {tier.toLocaleString()} kWh in {state.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Related comparison pathways</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/energy-comparison">Back to Energy Comparison Hub</Link></li>
            <li><Link href="/energy-comparison/states">State comparison slice</Link></li>
            <li><Link href="/energy-comparison/appliances">Appliance comparison slice</Link></li>
            <li><Link href="/electricity-usage">National electricity usage hub</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
