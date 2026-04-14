import type { Metadata } from "next";
import Link from "next/link";
import {
  loadComparePairs,
  loadElectricityComparisonPairs,
} from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import CommercialPlacement from "@/components/monetization/CommercialPlacement";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Cost Comparisons by State | PriceOfElectricity.com",
  description:
    "Compare electricity prices between U.S. states and explore how electricity rates and bills differ across the country.",
  canonicalPath: "/electricity-cost-comparison",
});

function pairToDisplayLabel(pair: string): string {
  const [a, b] = pair.split("-vs-");
  if (!a || !b) return pair;
  const toTitle = (s: string) =>
    s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${toTitle(a)} vs ${toTitle(b)}`;
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ANCHOR_ORDER = ["california", "texas", "florida", "new-york", "pennsylvania", "ohio"].map(
  (s) => ({ slug: s, name: slugToDisplayName(s) }),
);

export default async function ElectricityCostComparisonIndexPage() {
  const [pairsData, manifest] = await Promise.all([
    loadComparePairs(),
    loadElectricityComparisonPairs(),
  ]);
  const pairs = pairsData?.pairs ?? [];
  const manifestPairs = manifest?.pairs ?? [];

  const pairSet = new Set(pairs);
  const allPairsSorted = [...pairs].sort((a, b) => a.localeCompare(b));
  const featuredPairs = [
    "california-vs-texas",
    "texas-vs-florida",
    "florida-vs-georgia",
    "new-york-vs-pennsylvania",
    "california-vs-nevada",
    "texas-vs-oklahoma",
  ].filter((p) => pairSet.has(p));

  const byAnchor = new Map<string, Array<{ pair: string; otherSlug: string }>>();
  for (const { pair, stateA, stateB } of manifestPairs) {
    if (!pairSet.has(pair)) continue;
    for (const anchor of ANCHOR_ORDER) {
      if (stateA === anchor.slug) {
        const list = byAnchor.get(anchor.slug) ?? [];
        list.push({ pair, otherSlug: stateB });
        byAnchor.set(anchor.slug, list);
      } else if (stateB === anchor.slug) {
        const list = byAnchor.get(anchor.slug) ?? [];
        list.push({ pair, otherSlug: stateA });
        byAnchor.set(anchor.slug, list);
      }
    }
  }

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost Comparison", url: "/electricity-cost-comparison" },
  ]);
  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Cost Comparison by State",
    description:
      "Canonical state-to-state electricity comparison index using deterministic pair data and fixed-usage methodology.",
    url: "/electricity-cost-comparison",
    isPartOf: "/",
    about: [
      "state electricity comparison",
      "deterministic rate comparison",
      "electricity-cost-comparison canonical cluster",
    ],
  });

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <span aria-current="page">Electricity Cost Comparison</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Compare Electricity Costs by State</h1>

        <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", lineHeight: 1.6 }}>
          See how electricity prices differ between U.S. states. Each comparison uses average
          residential rates and a standard 900 kWh monthly usage, showing the difference in
          dollars and percentage.
        </p>
        <p className="muted" style={{ marginTop: 0, marginBottom: 24, fontSize: 13 }}>
          Rates from EIA data · <Link href="/methodology">Methodology</Link>
        </p>

        {/* ── FEATURED COMPARISONS ── */}
        {featuredPairs.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Popular comparisons</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {featuredPairs.map((pair) => (
                <Link key={pair} href={`/electricity-cost-comparison/${pair}`} className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
                  <div style={{ fontWeight: 600 }}>{pairToDisplayLabel(pair)}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── COMPARE BY STATE ── */}
        {byAnchor.size > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Compare by state</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {ANCHOR_ORDER.filter((a) => byAnchor.has(a.slug)).map((anchor) => {
                const list = byAnchor.get(anchor.slug) ?? [];
                if (list.length === 0) return null;
                return (
                  <div key={anchor.slug}>
                    <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
                      {anchor.name} vs other states
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                      {list.slice(0, 12).map(({ pair, otherSlug }) => (
                        <Link key={pair} href={`/electricity-cost-comparison/${pair}`} className="stat-card" style={{ textDecoration: "none", color: "inherit", fontSize: 14, padding: 10 }}>
                          vs {slugToDisplayName(otherSlug)}
                        </Link>
                      ))}
                      {list.length > 12 && (
                        <Link
                          href="#all-comparisons"
                          className="muted"
                          style={{ fontSize: 13, alignSelf: "center", textDecoration: "underline" }}
                        >
                          +{list.length - 12} more (full list below)
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {allPairsSorted.length > 0 && (
          <section id="all-comparisons" style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>All state-to-state comparisons</h2>
            <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", lineHeight: 1.6 }}>
              Alphabetical index of every published comparison. Each link opens the fixed-usage side-by-side rate
              comparison for that state pair.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
              {allPairsSorted.map((pair) => (
                <Link
                  key={pair}
                  href={`/electricity-cost-comparison/${pair}`}
                  className="stat-card"
                  style={{ textDecoration: "none", color: "inherit", fontSize: 14, padding: 10 }}
                >
                  {pairToDisplayLabel(pair)}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── RELATED ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related tools &amp; data</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, fontSize: 14 }}>
            <div>
              <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Cost data</p>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
                <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
                <li><Link href="/average-electricity-bill">Average electricity bills</Link></li>
                <li><Link href="/electricity-affordability">Affordability rankings</Link></li>
              </ul>
            </div>
            <div>
              <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Tools</p>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
                <li><Link href="/energy-comparison">Energy comparison hub</Link></li>
                <li><Link href="/energy-comparison/states">State comparison index</Link></li>
                <li><Link href="/electricity-bill-estimator">Bill estimator</Link></li>
              </ul>
            </div>
            <div>
              <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Context</p>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
                <li><Link href="/electricity-providers">Providers by state</Link></li>
                <li><Link href="/electricity-cost-of-living">Electricity &amp; cost of living</Link></li>
                <li><Link href="/moving-to-electricity-cost">Costs when moving</Link></li>
              </ul>
            </div>
          </div>
        </section>

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
