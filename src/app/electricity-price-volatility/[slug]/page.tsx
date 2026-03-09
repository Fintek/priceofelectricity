import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  loadEntityIndex,
} from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

type VolatilityState = { slug: string; name: string; metricValue: number; rank: number };

export async function generateStaticParams() {
  const index = await loadEntityIndex();
  return index.entities
    .filter((e) => e.type === "state")
    .map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const statePage = await loadKnowledgePage("state", slug);
  if (!statePage) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-price-volatility/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const description = `Electricity price volatility in ${stateName}. How stable or unstable electricity prices are historically.`;
  return buildMetadata({
    title: `Electricity Price Volatility in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-price-volatility/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityPriceVolatilityStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [statePage, volatilityRanking, release] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("rankings", "volatility-5y"),
    getRelease(),
  ]);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as {
    name?: string;
    avgRateCentsPerKwh?: number;
  } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;

  const sortedStates =
    (volatilityRanking?.data?.sortedStates as VolatilityState[] | undefined) ?? [];
  const stateVolatility = sortedStates.find((s) => s.slug === slug);
  const volatilityPct =
    typeof stateVolatility?.metricValue === "number" ? stateVolatility.metricValue : null;
  const volatilityRank = typeof stateVolatility?.rank === "number" ? stateVolatility.rank : null;

  const nationalAvgVolatility =
    sortedStates.length > 0
      ? sortedStates.reduce((sum, s) => sum + s.metricValue, 0) / sortedStates.length
      : null;

  const canonicalPath = `/electricity-price-volatility/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Price Volatility", url: "/electricity-price-volatility" },
    { name: stateName, url: canonicalPath },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-price-volatility">Electricity Price Volatility</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Price Volatility in {stateName}</h1>

        {/* A) State Electricity Price Context */}
        {avgRate != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Price Context</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is <strong>{avgRate.toFixed(2)} ¢/kWh</strong>.
              This page focuses on how stable or volatile those prices have been over time.
            </p>
          </section>
        )}

        {/* B) Volatility Metric */}
        {volatilityPct != null && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>5-Year Volatility</h2>
            <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
              The 5-year volatility for {stateName} is <strong>{volatilityPct.toFixed(2)}%</strong>
              {volatilityRank != null && ` (rank #${volatilityRank} among states)`}.
              This measures the coefficient of variation of monthly electricity rates over the last 5 years—higher values mean more fluctuation.
            </p>
            {nationalAvgVolatility != null && (
              <p style={{ margin: 0, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
                The national average volatility is about {nationalAvgVolatility.toFixed(2)}%. {stateName}&apos;s volatility is{" "}
                {volatilityPct > nationalAvgVolatility ? "higher" : "lower"} than the national average, meaning electricity prices in {stateName} have historically been{" "}
                {volatilityPct > nationalAvgVolatility ? "more volatile" : "more stable"} than typical across the U.S.
              </p>
            )}
          </section>
        )}

        {/* C) What Can Cause Electricity Price Volatility */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>What Can Cause Electricity Price Volatility</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Possible drivers of electricity price volatility include:
          </p>
          <ul style={{ margin: "0 0 16px 20px", lineHeight: 1.8 }}>
            <li><strong>Fuel price changes</strong> — Natural gas, coal, and other fuel costs can swing with commodity markets.</li>
            <li><strong>Extreme weather</strong> — Heat waves and cold snaps affect demand and can strain supply.</li>
            <li><strong>Grid constraints</strong> — Transmission limits and congestion can cause regional price spikes.</li>
            <li><strong>Market structure</strong> — Deregulated markets may see more price variation than regulated utilities.</li>
          </ul>
        </section>

        {/* D) Related Pages */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-inflation/${slug}`}>Electricity inflation in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-affordability/${slug}`}>Electricity affordability in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-cost-of-living/${slug}`}>Electricity cost of living in {stateName}</Link>
            </li>
          </ul>
        </section>

        {/* E) Hub Link */}
        <p style={{ marginBottom: 32 }}>
          <Link href="/electricity-price-volatility">← All states: Electricity Price Volatility</Link>
        </p>

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={release} />
      </main>
    </>
  );
}
