import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import ExploreMore from "@/components/navigation/ExploreMore";

export const dynamicParams = true;
export const revalidate = 86400;

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
      canonicalPath: `/electricity-inflation/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return buildMetadata({
    title: `Electricity Inflation in ${stateName} | PriceOfElectricity.com`,
    description: `Explore how electricity prices have changed over time in ${stateName}, including historical electricity rate trends and long-term electricity inflation.`,
    canonicalPath: `/electricity-inflation/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityInflationStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const statePage = await loadKnowledgePage("state", slug);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as {
    name?: string;
    avgRateCentsPerKwh?: number;
  } | undefined;
  const derived = statePage.data?.derived as {
    priceHistory?: {
      increase1YearPercent?: number;
      increase5YearPercent?: number;
      annualizedIncrease5Year?: number;
    };
    momentum?: { signal?: string; enabled?: boolean };
    comparison?: { nationalAverage?: number; differencePercent?: number; category?: string };
  } | undefined;

  const stateName = raw?.name ?? slugToDisplayName(slug);
  const currentRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const priceHistory = derived?.priceHistory;
  const increase1YearPercent =
    typeof priceHistory?.increase1YearPercent === "number" ? priceHistory.increase1YearPercent : null;
  const increase5YearPercent =
    typeof priceHistory?.increase5YearPercent === "number" ? priceHistory.increase5YearPercent : null;
  const annualizedIncrease5Year =
    typeof priceHistory?.annualizedIncrease5Year === "number" ? priceHistory.annualizedIncrease5Year : null;
  const momentumSignal = derived?.momentum?.enabled ? derived.momentum.signal : null;

  const canonicalPath = `/electricity-inflation/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Inflation", url: "/electricity-inflation" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Inflation in ${stateName}`,
    description:
      currentRate != null
        ? increase5YearPercent != null
          ? increase5YearPercent > 0.05
            ? `Electricity prices in ${stateName}: ${currentRate.toFixed(2)}¢/kWh. Prices increased ${increase5YearPercent.toFixed(1)}% over 5 years.`
            : increase5YearPercent < -0.05
              ? `Electricity prices in ${stateName}: ${currentRate.toFixed(2)}¢/kWh. Prices decreased ${Math.abs(increase5YearPercent).toFixed(1)}% over 5 years.`
              : `Electricity prices in ${stateName}: ${currentRate.toFixed(2)}¢/kWh. Prices remained flat over 5 years.`
          : `Electricity prices in ${stateName}: ${currentRate.toFixed(2)}¢/kWh. See rate trends and inflation.`
        : `${stateName} electricity inflation and price trends.`,
    url: canonicalPath,
    isPartOf: "/electricity-inflation",
    about: ["electricity inflation", "electricity price growth", "electricity price history"],
  });

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <JsonLdScript data={webPageJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-inflation">Electricity Inflation</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Electricity Inflation in {stateName}
        </h1>

        {/* A) Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity prices in {stateName} have changed over time. This page summarizes historical price movement, current rate context, and how {stateName} compares to national trends.
          </p>
        </section>

        {/* B) Current Electricity Price Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Current Electricity Price</h2>
          {currentRate != null && (
            <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
              The average residential electricity rate in {stateName} is{" "}
              <strong>{currentRate.toFixed(2)}¢/kWh</strong>. At 900 kWh per month, that translates to an estimated bill of about{" "}
              <strong>${((currentRate / 100) * 900).toFixed(2)}</strong>.
            </p>
          )}
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            See <Link href={`/electricity-cost/${slug}`}>electricity cost in {stateName}</Link> and{" "}
            <Link href={`/average-electricity-bill/${slug}`}>average electricity bill in {stateName}</Link> for more context.
          </p>
        </section>

        {/* C) Electricity Price Trend Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Electricity Price Trend</h2>
          {(increase1YearPercent != null || increase5YearPercent != null) ? (
            <>
              <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
                Historical electricity price movement in {stateName}:
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                {increase1YearPercent != null && (
                  <li>
                    <strong>1-year change:</strong>{" "}
                    {increase1YearPercent > 0.05
                      ? `${increase1YearPercent.toFixed(1)}% increase`
                      : increase1YearPercent < -0.05
                        ? `${Math.abs(increase1YearPercent).toFixed(1)}% decrease`
                        : "unchanged"}
                  </li>
                )}
                {increase5YearPercent != null && (
                  <li>
                    <strong>5-year change:</strong>{" "}
                    {increase5YearPercent > 0.05
                      ? `${increase5YearPercent.toFixed(1)}% increase`
                      : increase5YearPercent < -0.05
                        ? `${Math.abs(increase5YearPercent).toFixed(1)}% decrease`
                        : "unchanged"}
                  </li>
                )}
                {annualizedIncrease5Year != null && (
                  <li>
                    <strong>5-year annualized:</strong>{" "}
                    {annualizedIncrease5Year > 0.05
                      ? `${annualizedIncrease5Year.toFixed(2)}% increase per year`
                      : annualizedIncrease5Year < -0.05
                        ? `${Math.abs(annualizedIncrease5Year).toFixed(2)}% decrease per year`
                        : `${annualizedIncrease5Year.toFixed(2)}% per year`}
                  </li>
                )}
              </ul>
              {momentumSignal && (
                <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
                  Price momentum: {momentumSignal.replace(/-/g, " ")}.
                </p>
              )}
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>
              See <Link href={`/electricity-price-history/${slug}`}>electricity price history in {stateName}</Link> for detailed rate trends and historical data.
            </p>
          )}
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
            <Link href={`/electricity-price-history/${slug}`}>Full price history in {stateName}</Link> — rate series, trends, and inflation metrics.
          </p>
        </section>

        {/* D) Rankings Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Rankings</h2>
          <p style={{ margin: 0, marginBottom: 16, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            {stateName} appears in several electricity price rankings. See where {stateName} ranks for price growth, volatility, and long-term trends:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
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
              <Link href="/knowledge/rankings/cagr-25y">25-Year Rate Growth (CAGR)</Link>
              {" — "}
              Long-term compound annual growth
            </li>
            <li>
              <Link href="/knowledge/rankings/volatility-5y">5-Year Rate Volatility</Link>
              {" — "}
              Price stability over time
            </li>
            <li>
              <Link href="/knowledge/rankings/price-trend">Electricity Price Trend</Link>
              {" — "}
              States where prices are rising fastest
            </li>
          </ul>
        </section>

        {/* E) Related Pages */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>Electricity cost calculator for {stateName}</Link>
            </li>
            <li>
              <Link href={`/electricity-price-history/${slug}`}>Electricity price history in {stateName}</Link>
            </li>
          </ul>
        </section>

        {/* F) National Context */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>National Context</h2>
          <p style={{ margin: 0, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
            Explore national electricity inflation trends and how all states compare:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li>
              <Link href="/electricity-inflation">Electricity Inflation in the United States</Link>
              {" — "}
              National hub for electricity price growth
            </li>
            <li>
              <Link href="/electricity-trends">Electricity Trends</Link>
              {" — "}
              National price trends and affordability
            </li>
            <li>
              <Link href="/electricity-insights">Electricity Insights</Link>
              {" — "}
              Most expensive and cheapest states
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Explore more"
          links={[
            { href: "/electricity-inflation", label: "Electricity inflation hub" },
            { href: `/electricity-affordability/${slug}`, label: "Electricity affordability analysis" },
            { href: `/electricity-price-history/${slug}`, label: `Price history in ${stateName}` },
            { href: `/electricity-cost/${slug}`, label: `Electricity cost in ${stateName}` },
            { href: "/knowledge/rankings/electricity-inflation-1y", label: "1-year inflation ranking" },
            { href: "/knowledge/rankings/electricity-inflation-5y", label: "5-year inflation ranking" },
            { href: "/methodology/electricity-inflation", label: "Inflation methodology" },
          ]}
        />

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/electricity-inflation">Electricity Inflation</Link> {" | "}
          <Link href="/electricity-trends">Electricity Trends</Link> {" | "}
          <Link href="/electricity-price-history">Price History</Link> {" | "}
          <Link href="/knowledge">Knowledge Hub</Link>
        </p>
      </main>
    </>
  );
}
