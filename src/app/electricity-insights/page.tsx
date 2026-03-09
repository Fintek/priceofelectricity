import type { Metadata } from "next";
import Link from "next/link";
import {
  loadKnowledgePage,
  loadEntityIndex,
  loadInsights,
  loadRankingsIndex,
} from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import ExploreMore from "@/components/navigation/ExploreMore";
import SectionNav from "@/components/navigation/SectionNav";
import Disclaimers from "@/app/components/policy/Disclaimers";
import MiniBarChart from "@/components/charts/MiniBarChart";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;
const RANKING_IDS = [
  "electricity-inflation-1y",
  "electricity-inflation-5y",
  "electricity-affordability",
  "most-expensive-electricity",
] as const;

export const metadata: Metadata = buildMetadata({
  title: "Most Expensive & Cheapest Electricity States | PriceOfElectricity.com",
  description:
    "National electricity insights: most expensive and cheapest states, affordability rankings, and 1-year and 5-year inflation. Compare U.S. electricity prices.",
  canonicalPath: "/electricity-insights",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type RankingData = {
  data?: {
    sortedStates?: Array<{
      rank: number;
      slug: string;
      name: string;
      metricValue: number;
      displayValue?: string;
    }>;
  };
};

export default async function ElectricityInsightsPage() {
  const [nationalPage, nationalInsights, entityIndex, rankingsIndex, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    loadInsights("national", "national"),
    loadEntityIndex(),
    loadRankingsIndex(),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    highestState?: { slug?: string; name?: string; rate?: number };
    lowestState?: { slug?: string; name?: string; rate?: number };
    top5Highest?: Array<{ slug: string; name: string; rate: number }>;
  } | undefined;

  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const nationalRateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const estimatedNationalMonthlyBill = nationalRateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const highestState = derived?.highestState;
  const lowestState = derived?.lowestState;
  const top5Highest = derived?.top5Highest ?? [];

  const rankingPages = await Promise.all(
    RANKING_IDS.map((id) => loadKnowledgePage("rankings", id)),
  );
  const rankingById = new Map(
    RANKING_IDS.map((id, i) => [id, rankingPages[i] as RankingData | null]),
  );

  const mostExpensiveTop = (rankingById.get("most-expensive-electricity")?.data?.sortedStates ?? [])[0];
  const mostAffordableTop = (rankingById.get("electricity-affordability")?.data?.sortedStates ?? [])[0];
  const inflation1yTop = (rankingById.get("electricity-inflation-1y")?.data?.sortedStates ?? [])[0];
  const inflation5yTop = (rankingById.get("electricity-inflation-5y")?.data?.sortedStates ?? [])[0];

  const insights = nationalInsights?.insights ?? [];
  const hasInsights = insights.length > 0;

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const rankingItems = rankingsIndex?.items?.filter((r) => RANKING_IDS.includes(r.id as (typeof RANKING_IDS)[number])) ?? [];

  const chartRows = top5Highest.map((s) => ({ label: s.name, value: s.rate }));
  const hasChartData = chartRows.length >= 2;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "National Electricity Insights", url: "/electricity-insights" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "National Electricity Insights",
    description:
      nationalAvgRate != null
        ? `National average electricity rate: ${nationalAvgRate.toFixed(2)}¢/kWh. Most expensive: ${highestState?.name ?? "—"}, most affordable: ${lowestState?.name ?? "—"}.`
        : "National electricity price conditions, affordability, and inflation trends.",
    url: "/electricity-insights",
    isPartOf: "/",
    about: ["national electricity insights", "electricity prices United States", "electricity affordability"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [
    {
      question: "What is the average electricity price in the United States?",
      answer:
        nationalAvgRate != null
          ? `The national average residential electricity rate is approximately ${nationalAvgRate.toFixed(2)} cents per kWh. At 900 kWh per month, that translates to an estimated bill of about $${estimatedNationalMonthlyBill.toFixed(2)}.`
          : "The national average varies by data source. Check the Knowledge Hub for current figures.",
    },
    {
      question: "Which states have the most expensive electricity?",
      answer:
        highestState != null
          ? `${highestState.name ?? "Hawaii"} has the highest average rate at ${highestState.rate?.toFixed(2) ?? "—"}¢/kWh. California, Connecticut, Rhode Island, and Maine are also among the most expensive. See the most expensive electricity ranking for the full list.`
          : "Hawaii, California, and several Northeast states typically have the highest rates. See the Knowledge Hub rankings.",
    },
    {
      question: "Which states have the cheapest electricity?",
      answer:
        lowestState != null
          ? `${lowestState.name ?? "Idaho"} has the lowest average rate at ${lowestState.rate?.toFixed(2) ?? "—"}¢/kWh. North Dakota, Nebraska, Louisiana, and Arkansas are also among the most affordable. See the electricity affordability ranking for the full list.`
          : "Idaho, North Dakota, and several Plains states typically have the lowest rates. See the Knowledge Hub rankings.",
    },
    {
      question: "Are electricity prices increasing?",
      answer:
        "Electricity prices have generally trended upward over the past decade. State-level inflation varies significantly—see the 1-year and 5-year electricity inflation rankings for which states are rising fastest.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, faqJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">National Electricity Insights</span>
        </nav>
        <SectionNav
          title="In this section"
          description="Insights, trends, rankings, and state data."
          links={[
            { href: "/electricity-trends", label: "Electricity trends" },
            { href: "/electricity-inflation", label: "Electricity price growth" },
            { href: "/knowledge/rankings/most-expensive-electricity", label: "Most expensive states" },
            { href: "/knowledge/rankings/electricity-affordability", label: "Most affordable" },
            { href: "/knowledge", label: "Knowledge Hub" },
            { href: "/datasets", label: "Download datasets" },
            { href: "/methodology", label: "Methodology" },
          ]}
        />

        <h1 style={{ fontSize: 32, marginBottom: 12 }}>National Electricity Insights</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Most expensive and cheapest electricity states, affordability rankings, and inflation trends. All figures are derived from EIA residential data and are build-generated.
        </p>

        {/* National summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {nationalAvgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>National avg. rate</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{nationalAvgRate.toFixed(2)} ¢/kWh</div>
            </div>
          )}
          {nationalAvgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. monthly bill (900 kWh)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedNationalMonthlyBill.toFixed(2)}</div>
            </div>
          )}
          {highestState != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Highest-cost state</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{highestState.name ?? "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>{highestState.rate?.toFixed(2) ?? "—"} ¢/kWh</div>
            </div>
          )}
          {lowestState != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Most affordable state</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{lowestState.name ?? "—"}</div>
              <div className="muted" style={{ fontSize: 12 }}>{lowestState.rate?.toFixed(2) ?? "—"} ¢/kWh</div>
            </div>
          )}
        </div>

        {/* National insights */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Insights</h2>
          {hasInsights ? (
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {insights.map((insight, idx) => (
                <li key={idx}>{insight.statement}</li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              This page covers national electricity price levels, affordability rankings, inflation trends,
              and links to state-level data. Use the sections below to explore rankings and state costs.
            </p>
          )}
        </section>

        {/* Electricity inflation snapshot */}
        {(inflation1yTop || inflation5yTop) && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity Inflation Snapshot</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              {inflation1yTop && (
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Highest 1-year inflation:</strong>{" "}
                  <Link href={`/electricity-cost/${inflation1yTop.slug}`}>{inflation1yTop.name}</Link>
                  {" "}({inflation1yTop.metricValue.toFixed(1)}%) —{" "}
                  <Link href="/knowledge/rankings/electricity-inflation-1y">See full ranking</Link>
                </p>
              )}
              {inflation5yTop && (
                <p style={{ margin: 0 }}>
                  <strong>Highest 5-year inflation:</strong>{" "}
                  <Link href={`/electricity-cost/${inflation5yTop.slug}`}>{inflation5yTop.name}</Link>
                  {" "}({inflation5yTop.metricValue.toFixed(1)}%) —{" "}
                  <Link href="/knowledge/rankings/electricity-inflation-5y">See full ranking</Link>
                </p>
              )}
            </div>
          </section>
        )}

        {/* Affordability snapshot */}
        {(mostAffordableTop || mostExpensiveTop) && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Affordability Snapshot</h2>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              {mostAffordableTop && (
                <p style={{ margin: "0 0 8px 0" }}>
                  <strong>Most affordable:</strong>{" "}
                  <Link href={`/electricity-cost/${mostAffordableTop.slug}`}>{mostAffordableTop.name}</Link>
                  {" "}({mostAffordableTop.displayValue ?? `$${mostAffordableTop.metricValue.toFixed(2)}`} at 900 kWh) —{" "}
                  <Link href="/knowledge/rankings/electricity-affordability">See full ranking</Link>
                </p>
              )}
              {mostExpensiveTop && (
                <p style={{ margin: 0 }}>
                  <strong>Most expensive:</strong>{" "}
                  <Link href={`/electricity-cost/${mostExpensiveTop.slug}`}>{mostExpensiveTop.name}</Link>
                  {" "}({mostExpensiveTop.displayValue ?? `$${mostExpensiveTop.metricValue.toFixed(2)}`} at 900 kWh) —{" "}
                  <Link href="/knowledge/rankings/most-expensive-electricity">See full ranking</Link>
                </p>
              )}
            </div>
          </section>
        )}

        {/* Chart - top 5 most expensive states */}
        {hasChartData && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Top 5 Most Expensive States (¢/kWh)</h2>
            <MiniBarChart
              rows={chartRows}
              title="Highest electricity rates by state"
              subtitle="¢/kWh"
              formatValue={(v) => `${v.toFixed(2)}¢`}
              minValue={0}
              ariaLabel="Top 5 most expensive electricity states"
            />
          </section>
        )}

        {/* Featured rankings */}
        {rankingItems.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Featured Rankings</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {rankingItems.map((r) => (
                <li key={r.id}>
                  <Link href={`/knowledge/rankings/${r.id}`}>{r.title}</Link>
                  {" — "}
                  {r.description}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Explore by state */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore Electricity Prices by State</h2>
          <p className="muted" style={{ margin: "0 0 16px 0", fontSize: 14 }}>
            Select a state to see average rates, estimated costs, and comparison to the national average.
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
                href={`/electricity-cost/${e.slug}`}
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
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-trends">Electricity Price Trends</Link>
              {" — "}
              National trends and inflation
            </li>
            <li>
              <Link href="/ai-energy-demand/electricity-prices-and-ai">See how AI demand connects to electricity costs</Link>
              {" — "}
              Electricity prices and AI infrastructure
            </li>
            <li>
              <Link href="/knowledge">Knowledge Hub</Link>
              {" — "}
              National overview, rankings, methodology
            </li>
            <li>
              <Link href="/average-electricity-bill">Average Electricity Bill</Link>
              {" — "}
              Monthly and annual bill estimates by state
            </li>
            <li>
              <Link href="/electricity-cost-calculator">Electricity Cost Calculator</Link>
              {" — "}
              Usage-based cost estimates
            </li>
            <li>
              <Link href="/battery-recharge-cost">Battery Recharge Cost</Link>
              {" — "}
              Estimate cost to recharge a home battery by state
            </li>
            <li>
              <Link href="/generator-vs-battery-cost">Generator vs Battery Cost</Link>
              {" — "}
              Compare battery recharge cost with generator fuel cost
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Explore more"
          links={[
            { href: "/electricity-trends", label: "Electricity trends" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/knowledge", label: "Knowledge Hub" },
            { href: "/datasets", label: "Datasets" },
            { href: "/methodology", label: "Methodology" },
            { href: "/page-index", label: "Page index" },
          ]}
        />

        {/* FAQ */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Frequently Asked Questions</h2>
          <dl style={{ margin: 0 }}>
            {faqItems.map((item, idx) => (
              <div key={idx} style={{ marginBottom: 16 }}>
                <dt style={{ fontWeight: 600, marginBottom: 4 }}>{item.question}</dt>
                <dd style={{ margin: 0, marginLeft: 0 }}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
