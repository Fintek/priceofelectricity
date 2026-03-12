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
  title: "Usage Tier Electricity Comparisons | Energy Comparison Hub",
  description:
    "Curated usage-tier comparison links that route to canonical electricity-usage-cost pages.",
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
    title: "Usage Tier Electricity Comparisons",
    description: "Curated usage-tier links into canonical fixed-kWh cost pages.",
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

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Usage Tier Electricity Comparisons</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "75ch", lineHeight: 1.7 }}>
          This curated directory links to canonical fixed-kWh routes at <code>/electricity-usage-cost/[kwh]/[state]</code>.
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

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
