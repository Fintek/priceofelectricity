import type { Metadata } from "next";
import Link from "next/link";
import {
  loadComparePairs,
  loadElectricityComparisonPairs,
} from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";

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

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">Electricity Cost Comparison</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>Electricity Cost Comparison by State</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Comparing electricity prices between states helps you understand cost differences when relocating,
            planning a move, or evaluating where to live. Electricity rates vary widely across the U.S.—some
            states pay nearly three times more per kilowatt-hour than others.
          </p>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Comparisons use each state&apos;s average residential rate and a typical monthly usage of 900 kWh.
            The difference is shown in dollars and as a percentage. Rates come from EIA data.
          </p>
          <p className="muted" style={{ margin: "0 0 24px 0", maxWidth: "65ch", fontSize: 14 }}>
            All figures are build-generated and deterministic.
          </p>
        </section>

        {/* B) Featured Comparisons */}
        {featuredPairs.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Featured Comparisons</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {featuredPairs.map((pair) => (
                <Link
                  key={pair}
                  href={`/electricity-cost-comparison/${pair}`}
                  style={{
                    display: "block",
                    padding: 16,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {pairToDisplayLabel(pair)}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* C) Compare by Popular States */}
        {byAnchor.size > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Compare by Popular States</h2>
            <p className="muted" style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 14 }}>
              Select a high-interest state to see how it compares to others.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {ANCHOR_ORDER.filter((a) => byAnchor.has(a.slug)).map((anchor) => {
                const list = byAnchor.get(anchor.slug) ?? [];
                if (list.length === 0) return null;
                return (
                  <div key={anchor.slug}>
                    <h3 style={{ fontSize: 16, marginBottom: 8, fontWeight: 600 }}>
                      {anchor.name} vs other states
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {list.slice(0, 12).map(({ pair, otherSlug }) => (
                        <Link
                          key={pair}
                          href={`/electricity-cost-comparison/${pair}`}
                          style={{
                            display: "block",
                            padding: 10,
                            border: "1px solid var(--color-border, #e5e7eb)",
                            borderRadius: 6,
                            backgroundColor: "var(--color-surface-alt, #f9fafb)",
                            textDecoration: "none",
                            color: "inherit",
                            fontSize: 14,
                          }}
                        >
                          {anchor.name} vs {slugToDisplayName(otherSlug)}
                        </Link>
                      ))}
                      {list.length > 12 && (
                        <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>
                          +{list.length - 12} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* D) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-cost">Electricity cost by state</Link>
              {" — "}
              Average electricity price per kWh and estimated costs
            </li>
            <li>
              <Link href="/average-electricity-bill">Average Electricity Bill</Link>
              {" — "}
              Monthly and annual bill estimates
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity Affordability</Link>
              {" — "}
              Cost burden and affordability by state
            </li>
            <li>
              <Link href="/electricity-providers">Electricity providers by state</Link>
              {" — "}
              Provider context and market structure
            </li>
            <li>
              <Link href="/electricity-cost-of-living">Electricity Cost of Living</Link>
              {" — "}
              How electricity fits into cost of living
            </li>
            <li>
              <Link href="/moving-to-electricity-cost">Electricity Costs When Moving</Link>
              {" — "}
              Cost differences when relocating
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
