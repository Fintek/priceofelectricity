import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import CopyButton from "@/components/common/CopyButton";
import StatusFooter from "@/components/common/StatusFooter";
import ExploreMore from "@/components/navigation/ExploreMore";
import AboutThisSite from "@/components/navigation/AboutThisSite";
import SectionNav from "@/components/navigation/SectionNav";
import Disclaimers from "@/app/components/policy/Disclaimers";
import MiniBarChart from "@/components/charts/MiniBarChart";
import {
  loadKnowledgePage,
  loadInsights,
  loadRankingsIndex,
  loadEntityIndex,
  loadRegionsIndex,
} from "@/lib/knowledge/loadKnowledgePage";
import { getRelease, getCapabilities } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

const FEATURED_RANKING_IDS = [
  "rate-high-to-low",
  "rate-low-to-high",
  "affordability",
  "cagr-25y",
  "volatility-5y",
  "price-trend",
  "momentum-signal",
];

function toPath(url: string): string {
  try {
    const parsed = new URL(url, BASE_URL);
    return parsed.pathname;
  } catch {
    return url.startsWith("/") ? url : `/${url}`;
  }
}

export const metadata: Metadata = buildMetadata({
  title: "U.S. Electricity Price Data & Rankings | PriceOfElectricity.com",
  description:
    "Knowledge hub: national snapshot, state rankings, affordability, value scores, and price momentum. Bridge to state pages and rankings.",
  canonicalPath: "/knowledge",
});

export default async function KnowledgeHubPage() {
  const [
    nationalPage,
    nationalInsights,
    rankingsIndex,
    entityIndex,
    regionsIndex,
    release,
    capabilities,
  ] = await Promise.all([
    loadKnowledgePage("national", "national"),
    loadInsights("national", "national"),
    loadRankingsIndex(),
    loadEntityIndex(),
    loadRegionsIndex(),
    getRelease(),
    getCapabilities(),
  ]);

  const featuredRankingItems =
    rankingsIndex?.items?.filter((r) => FEATURED_RANKING_IDS.includes(r.id)) ?? [];
  const rankingPages = await Promise.all(
    featuredRankingItems.map((r) => loadKnowledgePage("rankings", r.id)),
  );
  const rankingBySlug = new Map(
    featuredRankingItems.map((r, i) => [
      r.id,
      {
        ...r,
        enabled: (rankingPages[i]?.data as { enabled?: boolean })?.enabled !== false,
      },
    ]),
  );

  const stateEntities =
    entityIndex?.entities?.filter((e) => e.type === "state").sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];
  const enabledRegions = regionsIndex?.regions?.filter((r) => r.enabled !== false) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Knowledge", url: "/knowledge" },
  ]);

  const caps = capabilities?.capabilities ?? {};
  const badges: string[] = [];
  if (caps.bundles) badges.push("Bundles");
  if (caps.historySnapshots) badges.push("History");
  if (caps.integrityManifest) badges.push("Integrity");

  const nationalData = nationalPage?.data as {
    raw?: { stateCount?: number };
    derived?: {
      averageRate?: number;
      medianRate?: number;
      highestState?: { slug: string; name: string; rate: number };
      lowestState?: { slug: string; name: string; rate: number };
      top5Highest?: Array<{ slug: string; name: string; rate: number }>;
    };
  } | null;
  const derived = nationalData?.derived;
  const top5Highest = derived?.top5Highest ?? [];
  const hasChartData = top5Highest.length >= 2;

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">Knowledge</span>
        </nav>
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Explore Electricity Topics</h2>
          <p className="muted" style={{ margin: "0 0 8px 0", fontSize: 14 }}>
            <Link href="/electricity-topics">Electricity topics hub</Link>
            {" · "}
            <Link href="/electricity-data">Electricity data</Link>
            {" · "}
            <Link href="/electricity-inflation">Electricity inflation</Link>
            {" · "}
            <Link href="/electricity-affordability">Electricity affordability</Link>
            {" · "}
            <Link href="/electricity-price-volatility">Electricity price volatility</Link>
          </p>
        </section>

        <AboutThisSite
          title="About this site"
          description="Data-driven electricity analysis. Methodology and datasets are published for verification."
          links={[
            { href: "/methodology", label: "Methodology" },
            { href: "/datasets", label: "Datasets" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/entity-registry", label: "Entity registry" },
            { href: "/discovery-graph", label: "Discovery graph" },
          ]}
        />

        <SectionNav
          title="In this section"
          description="Jump to rankings, state pages, datasets, and methodology."
          links={[
            { href: "/knowledge/rankings/rate-high-to-low", label: "Highest rates" },
            { href: "/knowledge/rankings/rate-low-to-high", label: "Lowest rates" },
            { href: "/knowledge/rankings/affordability", label: "Affordability" },
            { href: "/electricity-insights", label: "National insights" },
            { href: "/electricity-inflation", label: "Electricity inflation analysis" },
            { href: "/datasets", label: "Download datasets" },
            { href: "/methodology", label: "Methodology" },
          ]}
        />

        {/* A) Hero / Overview */}
        <header style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, marginBottom: 12, fontWeight: 700 }}>U.S. Electricity Price Data & Rankings</h1>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 19, lineHeight: 1.5 }}>
            The main authority for U.S. electricity price data: national snapshot, state rankings, affordability, value scores, and price momentum.
          </p>
          <p className="muted" style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Explore national snapshots, state-by-state rates and metrics, rankings, regional summaries, and state comparisons. All data is build-generated and deterministic.
          </p>
        </header>

        {/* B) National Snapshot */}
        {derived && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>National Snapshot</h2>
              <span style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link href="/electricity-insights" style={{ fontSize: 14 }}>National electricity insights →</Link>
                <Link href="/knowledge/national" style={{ fontSize: 14 }}>View full national overview →</Link>
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              {typeof derived.averageRate === "number" && (
                <div
                  style={{
                    padding: 16,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  }}
                >
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Average rate</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{derived.averageRate.toFixed(2)} ¢/kWh</div>
                </div>
              )}
              {typeof derived.medianRate === "number" && (
                <div
                  style={{
                    padding: 16,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  }}
                >
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Median rate</div>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{derived.medianRate.toFixed(2)} ¢/kWh</div>
                </div>
              )}
              {derived.highestState && (
                <div
                  style={{
                    padding: 16,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  }}
                >
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Highest</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    <Link href={`/knowledge/state/${derived.highestState.slug}`}>{derived.highestState.name}</Link>
                    {" "}
                    <span className="muted" style={{ fontSize: 14 }}>({derived.highestState.rate.toFixed(2)} ¢/kWh)</span>
                  </div>
                </div>
              )}
              {derived.lowestState && (
                <div
                  style={{
                    padding: 16,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 8,
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  }}
                >
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Lowest</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    <Link href={`/knowledge/state/${derived.lowestState.slug}`}>{derived.lowestState.name}</Link>
                    {" "}
                    <span className="muted" style={{ fontSize: 14 }}>({derived.lowestState.rate.toFixed(2)} ¢/kWh)</span>
                  </div>
                </div>
              )}
            </div>
            {hasChartData && (
              <div style={{ marginTop: 20, overflowX: "auto", maxWidth: "100%" }}>
                <MiniBarChart
                  rows={top5Highest.map((s) => ({ label: s.name, value: s.rate }))}
                  width={400}
                  height={160}
                  minValue={0}
                  title="Top 5 most expensive states"
                  subtitle="¢/kWh"
                  formatValue={(v) => `${v.toFixed(2)} ¢/kWh`}
                />
              </div>
            )}
            {typeof nationalData?.raw?.stateCount === "number" && (
              <p className="muted" style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
                Covering {nationalData.raw.stateCount} states plus D.C.
              </p>
            )}
          </section>
        )}

        {/* C) Key Insights */}
        {nationalInsights?.insights && nationalInsights.insights.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Key Insights</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {nationalInsights.insights.slice(0, 5).map((ins, idx) => (
                <li key={idx}>{ins.statement}</li>
              ))}
            </ul>
          </section>
        )}

        {/* D) Featured Rankings */}
        {rankingsIndex && featuredRankingItems.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Featured Rankings</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {FEATURED_RANKING_IDS.map((id) => {
                const item = rankingBySlug.get(id) ?? rankingsIndex.items.find((r) => r.id === id);
                if (!item) return null;
                const enabled = "enabled" in item ? item.enabled : true;
                const path = toPath(item.canonicalUrl ?? `/knowledge/rankings/${item.id}`);
                return (
                  <Link
                    key={item.id}
                    href={path}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 15 }}>{item.title}</strong>
                      {!enabled && (
                        <span
                          className="muted"
                          style={{
                            padding: "2px 6px",
                            fontSize: 11,
                            borderRadius: 4,
                            backgroundColor: "var(--color-border, #e5e7eb)",
                          }}
                        >
                          Unavailable
                        </span>
                      )}
                    </div>
                    <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                      {item.description}
                    </p>
                  </Link>
                );
              })}
            </div>
            <p style={{ marginTop: 12, fontSize: 14 }}>
              <Link href="/knowledge/rankings">View all rankings →</Link>
            </p>
          </section>
        )}

        {/* E) Explore by State */}
        {stateEntities.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
            <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 14 }}>
              Browse electricity rates and metrics for all 50 states plus D.C.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              {stateEntities.map((e) => (
                <Link
                  key={e.slug}
                  href={toPath(e.canonicalUrl ?? `/knowledge/state/${e.slug}`)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid var(--color-border, #e5e7eb)",
                    borderRadius: 6,
                    fontSize: 14,
                    textDecoration: "none",
                    color: "inherit",
                    backgroundColor: "var(--color-surface-alt, #f9fafb)",
                  }}
                >
                  {e.title ?? e.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 12, fontSize: 14 }}>
              <Link href="/knowledge/pages">View full states directory →</Link>
            </p>
          </section>
        )}

        {/* F) Regions */}
        {enabledRegions.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>Regions</h2>
              <Link href="/knowledge/regions" style={{ fontSize: 14 }}>View all regions →</Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {enabledRegions.map((r) => (
                <Link
                  key={r.id}
                  href={r.href.startsWith("/") ? r.href : `/${r.href}`}
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
                  <strong style={{ fontSize: 16 }}>{r.name}</strong>
                  <p className="muted" style={{ margin: "8px 0 0 0", fontSize: 13 }}>
                    {r.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* G) Compare States */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Compare States</h2>
          <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
            Compare electricity rates, value scores, and affordability across multiple states side by side.
          </p>
          <Link
            href="/knowledge/compare"
            style={{
              display: "inline-block",
              padding: "12px 20px",
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
              fontWeight: 500,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            Compare states →
          </Link>
        </section>

        {/* H) Methodology / Transparency */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Methodology & Transparency</h2>
          <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
            Rankings and insights are generated from build-time datasets. All methodologies are documented and
            deterministic.
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.8, margin: 0 }}>
            <li>
              <Link href="/knowledge/pages">Knowledge directory</Link>
              {" — "}
              Browse states, rankings, methodologies (EPI, value score, freshness, CAGR, volatility, price trend, momentum signal)
            </li>
            <li>
              <Link href="/knowledge/docs">API docs</Link>
              {" — "}
              Ingestion guide and endpoints
            </li>
            <li>
              <Link href="/knowledge/methodology/index.json">Methodology index (JSON)</Link>
              {" — "}
              All methodology definitions.{" "}
              <CopyButton
                value={`${BASE_URL}/knowledge/methodology/index.json`}
                label="Copy methodology index URL"
              />
            </li>
            <li>
              <Link href="/knowledge/contract.json">Contract (JSON)</Link>
              {" — "}
              Schema and required fields.{" "}
              <CopyButton
                value={`${BASE_URL}/knowledge/contract.json`}
                label="Copy contract URL"
              />
            </li>
            <li>
              <Link href="/knowledge/search-index.json">Search index (JSON)</Link>
              {" — "}
              Tokens, excerpts, quality.{" "}
              <CopyButton
                value={`${BASE_URL}/knowledge/search-index.json`}
                label="Copy search-index URL"
              />
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Explore more"
          links={[
            { href: "/electricity-data", label: "See electricity datasets and metrics" },
            { href: "/datasets", label: "Download datasets" },
            { href: "/methodology", label: "Methodology" },
            { href: "/electricity-insights", label: "Electricity insights" },
            { href: "/electricity-trends", label: "Electricity trends" },
            { href: "/knowledge/rankings", label: "All rankings" },
            { href: "/site-map", label: "Site map" },
          ]}
        />

        {(release?.releaseId || badges.length > 0) && (
          <div
            className="muted"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              padding: 12,
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              marginBottom: 32,
              fontSize: 14,
            }}
          >
            <span>At a glance:</span>
            {release?.releaseId && (
              <span>
                Release: <strong>{release.releaseId}</strong>
              </span>
            )}
            {release?.sourceVersion && (
              <span>
                Data: <strong>{release.sourceVersion}</strong>
              </span>
            )}
            {badges.map((b) => (
              <span
                key={b}
                style={{
                  padding: "2px 8px",
                  backgroundColor: "var(--color-border, #e5e7eb)",
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                {b}
              </span>
            ))}
          </div>
        )}

        <Disclaimers disclaimerRefs={["general-site"]} />

        <StatusFooter release={release} capabilities={capabilities} />
      </main>
    </>
  );
}
