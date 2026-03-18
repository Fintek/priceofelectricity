import type { Metadata } from "next";
import Link from "next/link";
import { loadKnowledgePage, loadEntityIndex, loadRankingsIndex } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import ExploreMore from "@/components/navigation/ExploreMore";
import SectionNav from "@/components/navigation/SectionNav";
import Disclaimers from "@/app/components/policy/Disclaimers";
import Sparkline from "@/components/charts/Sparkline";

export const dynamic = "force-static";
export const revalidate = 86400;

const MONTHLY_USAGE_KWH = 900;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Price Trends & Inflation by State | PriceOfElectricity.com",
  description:
    "National electricity price trends, 1-year and 5-year inflation, and affordability. Average U.S. rate, estimated monthly bills, and state-level trend data.",
  canonicalPath: "/electricity-trends",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityTrendsPage() {
  const [nationalPage, entityIndex, rankingsIndex, release] = await Promise.all([
    loadKnowledgePage("national", "national"),
    loadEntityIndex(),
    loadRankingsIndex(),
    getRelease(),
  ]);

  const derived = nationalPage?.data?.derived as {
    averageRate?: number;
    medianRate?: number;
    trends?: { avgRateCentsPerKwh?: { values?: number[] } };
    highestState?: { slug?: string; name?: string; rate?: number };
    lowestState?: { slug?: string; name?: string; rate?: number };
  } | undefined;

  const nationalAvgRate = typeof derived?.averageRate === "number" ? derived.averageRate : null;
  const rateDollarsPerKwh = nationalAvgRate != null ? nationalAvgRate / 100 : 0;
  const monthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;

  const trendValues = derived?.trends?.avgRateCentsPerKwh?.values ?? [];
  const hasTrendChart = trendValues.length >= 2;

  let increase1YearPercent: number | null = null;
  let increase5YearPercent: number | null = null;
  if (trendValues.length >= 2) {
    const current = trendValues[trendValues.length - 1];
    const oneBack = trendValues[trendValues.length - 2];
    if (typeof current === "number" && typeof oneBack === "number" && oneBack > 0) {
      increase1YearPercent = ((current - oneBack) / oneBack) * 100;
    }
    if (trendValues.length >= 6) {
      const fiveBack = trendValues[trendValues.length - 6];
      if (typeof current === "number" && typeof fiveBack === "number" && fiveBack > 0) {
        increase5YearPercent = ((current - fiveBack) / fiveBack) * 100;
      }
    }
  }

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const rankingIds = ["electricity-inflation-1y", "electricity-inflation-5y", "electricity-affordability", "most-expensive-electricity"];
  const rankings = rankingsIndex?.items?.filter((r) => rankingIds.includes(r.id)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Trends", url: "/electricity-trends" },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Electricity Price Trends in the United States",
    description:
      nationalAvgRate != null
        ? `National average electricity rate: ${nationalAvgRate.toFixed(2)}¢/kWh. Estimated 900 kWh monthly bill: $${monthlyBill.toFixed(2)}.`
        : "National electricity price trends and affordability overview.",
    url: "/electricity-trends",
    isPartOf: "/",
    about: ["electricity price trends US", "national electricity price", "electricity inflation"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [
    {
      question: "What is the average electricity price in the United States?",
      answer:
        nationalAvgRate != null
          ? `The national average residential electricity rate is approximately ${nationalAvgRate.toFixed(2)} cents per kWh. At 900 kWh per month, that translates to an estimated bill of about $${monthlyBill.toFixed(2)}.`
          : "The national average varies by data source and period. Check the Knowledge Hub for current figures.",
    },
    {
      question: "Are electricity prices increasing?",
      answer:
        increase5YearPercent != null
          ? increase5YearPercent > 0.05
            ? `Yes. Electricity prices have increased approximately ${increase5YearPercent.toFixed(1)}% over the past five years nationally.`
            : increase5YearPercent < -0.05
              ? `No. Electricity prices have decreased approximately ${Math.abs(increase5YearPercent).toFixed(1)}% over the past five years nationally.`
              : "Electricity prices have remained roughly flat over the past five years nationally."
          : increase1YearPercent != null
            ? increase1YearPercent > 0.05
              ? `Yes. Recent data shows electricity prices increased about ${increase1YearPercent.toFixed(1)}% over the past year.`
              : increase1YearPercent < -0.05
                ? `No. Recent data shows electricity prices decreased about ${Math.abs(increase1YearPercent).toFixed(1)}% over the past year.`
                : "Electricity prices have remained roughly flat over the past year. State-level trends vary significantly."
            : "Electricity prices have generally trended upward over the past decade due to grid modernization, fuel costs, and policy changes. State-level trends vary significantly.",
    },
    {
      question: "Why do electricity prices vary by state?",
      answer:
        "Electricity prices vary due to generation mix (coal, gas, nuclear, renewables), transmission costs, regulations, taxes, and demand. States with abundant hydropower or natural gas often have lower rates; those with higher renewable mandates or imported power may have higher rates.",
    },
    {
      question: "Which states have the highest electricity prices?",
      answer:
        derived?.highestState != null
          ? `${derived.highestState.name ?? "Hawaii"} has the highest average residential electricity rate at ${derived.highestState.rate?.toFixed(2) ?? "—"}¢/kWh. See the most expensive electricity ranking for the full list.`
          : "Hawaii, California, and several Northeast states typically have among the highest rates. See the Knowledge Hub rankings for the full list.",
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

  const insightText =
    increase5YearPercent != null
      ? increase5YearPercent > 0.05
        ? `Electricity prices in the United States have increased approximately ${increase5YearPercent.toFixed(1)}% over the past five years.`
        : increase5YearPercent < -0.05
          ? `Electricity prices in the United States have decreased approximately ${Math.abs(increase5YearPercent).toFixed(1)}% over the past five years.`
          : `Electricity prices in the United States have remained roughly flat over the past five years.`
      : increase1YearPercent != null
        ? increase1YearPercent > 0.05
          ? `Electricity prices in the United States have increased approximately ${increase1YearPercent.toFixed(1)}% over the past year.`
          : increase1YearPercent < -0.05
            ? `Electricity prices in the United States have decreased approximately ${Math.abs(increase1YearPercent).toFixed(1)}% over the past year.`
            : `Electricity prices in the United States have remained roughly flat over the past year.`
        : nationalAvgRate != null
          ? `The national average electricity rate is ${nationalAvgRate.toFixed(2)}¢/kWh. State-level rates vary widely.`
          : "Electricity prices vary significantly by state. Explore state-level data for detailed trends.";

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, faqJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">Electricity Trends</span>
        </nav>
        <SectionNav
          title="In this section"
          description="Trends, insights, rankings, and state-level data."
          links={[
            { href: "/electricity-insights", label: "National insights" },
            { href: "/electricity-inflation", label: "Electricity inflation analysis" },
            { href: "/knowledge/rankings/electricity-inflation-1y", label: "1-year inflation" },
            { href: "/knowledge/rankings/electricity-affordability", label: "Affordability" },
            { href: "/electricity-price-history", label: "Price history by state" },
            { href: "/datasets", label: "Download datasets" },
            { href: "/methodology", label: "Methodology" },
          ]}
        />

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Electricity Price Trends in the United States
        </h1>
        <p style={{ marginTop: -8, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          National electricity price trends, inflation rates, and affordability. See how U.S. electricity rates have changed and which states are rising fastest.
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>National electricity rate</div>
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
              <div style={{ fontSize: 22, fontWeight: 600 }}>${monthlyBill.toFixed(2)}</div>
            </div>
          )}
          {increase1YearPercent != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>1-year price change</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {increase1YearPercent >= 0 ? "+" : ""}{increase1YearPercent.toFixed(1)}%
              </div>
            </div>
          )}
          {increase5YearPercent != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>5-year price change</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {increase5YearPercent >= 0 ? "+" : ""}{increase5YearPercent.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* National price trend chart */}
        {hasTrendChart && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Price Trend</h2>
            <Sparkline
              points={trendValues}
              width={720}
              height={200}
              title="US national electricity rate trend"
              subtitle="¢/kWh"
              formatValue={(v) => `${v.toFixed(2)}¢`}
              ariaLabel="National electricity rate over time"
            />
          </section>
        )}

        {/* Key insights */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Key Insights</h2>
          <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            {insightText}
          </p>
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            Data comes from EIA residential retail sales. All figures are build-generated and deterministic.
          </p>
        </section>

        {/* Electricity Rankings by State */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity Rankings by State</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {rankings.map((r) => (
              <li key={r.id}>
                <Link href={`/knowledge/rankings/${r.id}`}>
                  {r.title}
                </Link>
                {" — "}
                {r.description}
              </li>
            ))}
            {rankings.length === 0 && (
              <>
                <li>
                  <Link href="/knowledge/rankings/electricity-inflation-1y">1-Year Electricity Inflation</Link>
                  {" — "}
                  States ranked by 1-year price increase
                </li>
                <li>
                  <Link href="/knowledge/rankings/electricity-inflation-5y">5-Year Electricity Inflation</Link>
                  {" — "}
                  States ranked by 5-year price increase
                </li>
                <li>
                  <Link href="/knowledge/rankings/electricity-affordability">Most Affordable Electricity</Link>
                  {" — "}
                  States ranked by estimated monthly bill at 900 kWh
                </li>
                <li>
                  <Link href="/knowledge/rankings/most-expensive-electricity">Least Affordable Electricity</Link>
                  {" — "}
                  States with highest estimated monthly bills
                </li>
              </>
            )}
          </ul>
        </section>

        {/* Explore Electricity Prices by State */}
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

        {/* Internal linking */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Tools & Data</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-insights">See national electricity insights</Link>
              {" — "}
              Price conditions, affordability, inflation
            </li>
            <li>
              <Link href="/power-generation-mix">Explore power generation mix and electricity prices</Link>
              {" — "}
              How fuel mix and generation context can influence prices
            </li>
            <li>
              <Link href="/grid-capacity-and-electricity-demand">Explore grid capacity and electricity demand</Link>
              {" — "}
              How demand growth and capacity constraints connect to electricity prices
            </li>
            <li>
              <Link href="/ai-energy-demand/electricity-prices-and-ai">Explore AI and electricity prices</Link>
              {" — "}
              How AI infrastructure connects to electricity costs
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
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Compare rates and costs
            </li>
            <li>
              <Link href="/knowledge">Knowledge Hub</Link>
              {" — "}
              National overview, rankings, methodology
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Explore more"
          links={[
            { href: "/electricity-insights", label: "Electricity insights" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/knowledge/rankings", label: "Rankings" },
            { href: "/datasets", label: "Datasets" },
            { href: "/methodology", label: "Methodology" },
            { href: "/site-map", label: "Site map" },
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
