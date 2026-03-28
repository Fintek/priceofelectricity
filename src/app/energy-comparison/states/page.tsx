import type { Metadata } from "next";
import Link from "next/link";
import { getRelease } from "@/lib/knowledge/fetch";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import Disclaimers from "@/app/components/policy/Disclaimers";
import StatusFooter from "@/components/common/StatusFooter";
import { getEnergyComparisonPairs } from "@/lib/longtail/energyComparisonHub";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "State Electricity Comparisons | Energy Comparison Hub",
  description:
    "Curated state-vs-state comparison routes that point to the canonical electricity-cost-comparison family.",
  canonicalPath: "/energy-comparison/states",
});

function toTitle(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function EnergyComparisonStatesPage() {
  const pairs = await getEnergyComparisonPairs(30);
  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Energy Comparison Hub", url: "/energy-comparison" },
    { name: "State Comparisons", url: "/energy-comparison/states" },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "State Electricity Comparisons",
    description: "Curated state-vs-state comparison route directory linking to canonical comparison pages.",
    url: "/energy-comparison/states",
    isPartOf: "/",
    about: ["state electricity comparisons", "state vs state electricity cost"],
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
          <span aria-current="page">State Comparisons</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>State Electricity Comparisons</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "75ch", lineHeight: 1.7 }}>
          This curated slice links into the canonical pair system at <Link href="/electricity-cost-comparison">/electricity-cost-comparison</Link>.
        </p>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "75ch", lineHeight: 1.7 }}>
          This page is a discovery directory only. It does not create new state-pair data and does not replace canonical
          ownership of pair pages.
        </p>

        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, columns: 2 }}>
          {pairs.map((item) => (
            <li key={item.pair}>
              <Link href={`/electricity-cost-comparison/${item.pair}`}>
                {toTitle(item.stateA)} vs {toTitle(item.stateB)}
              </Link>
            </li>
          ))}
        </ul>

        <section style={{ marginTop: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>Related comparison pathways</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li><Link href="/energy-comparison">Back to Energy Comparison Hub</Link></li>
            <li><Link href="/energy-comparison/usage">Usage tier comparison slice</Link></li>
            <li><Link href="/energy-comparison/appliances">Appliance comparison slice</Link></li>
            <li><Link href="/electricity-cost-calculator">Electricity cost calculator cluster</Link></li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
