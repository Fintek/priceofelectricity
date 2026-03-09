import type { Metadata } from "next";
import Link from "next/link";
import {
  loadKnowledgePage,
  loadEntityIndex,
} from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Price Volatility by State | PriceOfElectricity.com",
  description:
    "How stable or unstable electricity prices are across states. Explore electricity price volatility, which states have historically more volatile rates, and why volatility matters for households and businesses.",
  canonicalPath: "/electricity-price-volatility",
});

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type VolatilityState = { slug: string; name: string; metricValue: number; rank: number };

export default async function ElectricityPriceVolatilityPage() {
  const [volatilityRanking, entityIndex, release] = await Promise.all([
    loadKnowledgePage("rankings", "volatility-5y"),
    loadEntityIndex(),
    getRelease(),
  ]);

  const sortedStates =
    (volatilityRanking?.data?.sortedStates as VolatilityState[] | undefined) ?? [];
  const topVolatileStates = sortedStates.slice(0, 10);

  const stateEntities =
    entityIndex?.entities
      ?.filter((e) => e.type === "state")
      .sort((a, b) => a.slug.localeCompare(b.slug)) ?? [];

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Price Volatility", url: "/electricity-price-volatility" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-trends">Electricity Trends</Link>
          {" · "}
          <span aria-current="page">Electricity Price Volatility</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Price Volatility by State</h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 24 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices change over time due to fuel costs, demand, infrastructure, and policy. This section explains how stable or unstable electricity prices are across states—which states have historically more volatile rates and why volatility matters for households and businesses.
          </p>
        </section>

        {/* B) What Electricity Price Volatility Means */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Electricity Price Volatility Means</h2>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Volatility measures the degree to which electricity prices fluctuate over time. Higher volatility means prices swing more from month to month or year to year. Lower volatility means prices are more stable and predictable. We use the coefficient of variation (standard deviation divided by mean) of monthly rates over the last 5 years to rank states.
          </p>
        </section>

        {/* C) Why Volatility Matters */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Why Volatility Matters</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Volatility affects:
          </p>
          <ul style={{ margin: "0 0 16px 20px", lineHeight: 1.8 }}>
            <li><strong>Households</strong> — Unpredictable electricity bills make budgeting harder. Higher volatility can mean surprise spikes in monthly costs.</li>
            <li><strong>Businesses</strong> — Energy-intensive businesses face greater cost uncertainty in high-volatility states.</li>
            <li><strong>Infrastructure planning</strong> — Utilities and policymakers consider price stability when planning investments and rate structures.</li>
          </ul>
        </section>

        {/* D) Volatility Rankings */}
        {topVolatileStates.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>States with Highest 5-Year Volatility</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              Based on coefficient of variation of monthly rates over the last 5 years. Higher values indicate more volatile electricity prices.
            </p>
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                {topVolatileStates.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/electricity-price-volatility/${s.slug}`}>{s.name}</Link>
                    {" — "}
                    <span className="muted">{s.metricValue.toFixed(2)}% volatility</span>
                  </li>
                ))}
              </ol>
            </div>
            <p style={{ marginTop: 12, marginBottom: 0 }}>
              <Link href="/knowledge/rankings/volatility-5y">View full volatility ranking</Link>
            </p>
          </section>
        )}

        {/* E) Explore by State */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Explore by State</h2>
          <p style={{ margin: "0 0 16px 0", maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity price volatility and stability context by state:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {stateEntities.map((e) => (
              <Link
                key={e.slug}
                href={`/electricity-price-volatility/${e.slug}`}
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
                {e.title ?? slugToDisplayName(e.slug)}
              </Link>
            ))}
          </div>
        </section>

        <TopicClusterNav
          title="Related pages"
          description="Inflation, affordability, generation mix, and data."
          links={[
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/electricity-affordability", label: "Electricity affordability" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/power-generation-mix/generation-mix-and-price-volatility", label: "Generation mix and price volatility" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/electricity-topics", label: "Electricity topics hub" },
          ]}
        />

        {/* F) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/power-generation-mix/generation-mix-and-price-volatility">Read about generation mix and price volatility</Link>
              {" — "}
              How generation context connects to electricity price stability
            </li>
            <li>
              <Link href="/grid-capacity-and-electricity-demand">Explore grid capacity and electricity demand</Link>
              {" — "}
              How demand growth and capacity constraints connect to electricity prices
            </li>
            <li>
              <Link href="/electricity-inflation">Electricity inflation</Link>
              {" — "}
              How electricity prices have changed over time
            </li>
            <li>
              <Link href="/electricity-cost">Electricity cost by state</Link>
              {" — "}
              Average electricity price per kWh and estimated costs
            </li>
            <li>
              <Link href="/electricity-cost-of-living">Electricity cost of living</Link>
              {" — "}
              How electricity affects household budgets
            </li>
            <li>
              <Link href="/electricity-affordability">Electricity affordability</Link>
              {" — "}
              Affordability by state
            </li>
            <li>
              <Link href="/electricity-data">Electricity data</Link>
              {" — "}
              Datasets and methodology
            </li>
          </ul>
        </section>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
