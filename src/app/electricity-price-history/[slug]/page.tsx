import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";
import Sparkline from "@/components/charts/Sparkline";

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
      canonicalPath: `/electricity-price-history/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const derived = statePage.data?.derived as {
    priceHistory?: {
      increase1YearPercent?: number;
      increase5YearPercent?: number;
    };
  } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const increase5 = typeof derived?.priceHistory?.increase5YearPercent === "number"
    ? derived.priceHistory.increase5YearPercent
    : null;
  const description =
    avgRate != null
      ? increase5 != null
        ? increase5 > 0.05
          ? `Electricity price history in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Prices increased ${increase5.toFixed(1)}% over 5 years.`
          : increase5 < -0.05
            ? `Electricity price history in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Prices decreased ${Math.abs(increase5).toFixed(1)}% over 5 years.`
            : `Electricity price history in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Prices remained flat over 5 years.`
        : `Electricity price history in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. See rate trends and historical data.`
      : `${stateName} electricity price history and rate trends.`;
  return buildMetadata({
    title: `Electricity Price History in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-price-history/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityPriceHistoryStatePage({
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
      rateSeries?: { periods: string[]; values: number[] };
      rate1YearAgo?: number;
      rate5YearsAgo?: number | null;
      increase1YearPercent?: number;
      increase5YearPercent?: number;
      annualizedIncrease5Year?: number;
    };
  } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const currentRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const priceHistory = derived?.priceHistory;

  const rate1YearAgo = typeof priceHistory?.rate1YearAgo === "number" ? priceHistory.rate1YearAgo : null;
  const rate5YearsAgo =
    typeof priceHistory?.rate5YearsAgo === "number" ? priceHistory.rate5YearsAgo : null;
  const increase1YearPercent =
    typeof priceHistory?.increase1YearPercent === "number" ? priceHistory.increase1YearPercent : null;
  const increase5YearPercent =
    typeof priceHistory?.increase5YearPercent === "number" ? priceHistory.increase5YearPercent : null;
  const annualizedIncrease5Year =
    typeof priceHistory?.annualizedIncrease5Year === "number" ? priceHistory.annualizedIncrease5Year : null;

  const rateSeries = priceHistory?.rateSeries;
  const chartPoints = rateSeries?.values ?? [];
  const hasHistory = chartPoints.length > 0;

  const canonicalPath = `/electricity-price-history/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Price History", url: "/electricity-price-history" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Price History in ${stateName}`,
    description:
      currentRate != null
        ? increase5YearPercent != null
          ? increase5YearPercent > 0.05
            ? `Electricity price history in ${stateName}: ${currentRate.toFixed(2)}¢/kWh. Prices increased ${increase5YearPercent.toFixed(1)}% over 5 years.`
            : increase5YearPercent < -0.05
              ? `Electricity price history in ${stateName}: ${currentRate.toFixed(2)}¢/kWh. Prices decreased ${Math.abs(increase5YearPercent).toFixed(1)}% over 5 years.`
              : `Electricity price history in ${stateName}: ${currentRate.toFixed(2)}¢/kWh. Prices remained flat over 5 years.`
          : `Electricity price history in ${stateName}: ${currentRate.toFixed(2)}¢/kWh.`
        : `${stateName} electricity price history.`,
    url: canonicalPath,
    isPartOf: "/electricity-price-history",
    about: [`electricity price history ${stateName}`, "electricity inflation", "electricity rate history"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [];
  if (increase5YearPercent != null) {
    const verb5 = increase5YearPercent > 0.05 ? "increased" : increase5YearPercent < -0.05 ? "decreased" : "remained flat";
    const pct5 = increase5YearPercent > 0.05 ? increase5YearPercent.toFixed(1) : increase5YearPercent < -0.05 ? Math.abs(increase5YearPercent).toFixed(1) : null;
    const parts: string[] = [verb5 === "remained flat" ? `Electricity prices in ${stateName} have remained flat over the past 5 years.` : `Electricity prices in ${stateName} have ${verb5} ${pct5}% over the past 5 years.`];
    if (increase1YearPercent != null) {
      const verb1 = increase1YearPercent > 0.05 ? "increase" : increase1YearPercent < -0.05 ? "decrease" : "change";
      const pct1 = increase1YearPercent > 0.05 ? increase1YearPercent.toFixed(1) : increase1YearPercent < -0.05 ? Math.abs(increase1YearPercent).toFixed(1) : "0";
      parts.push(`The 1-year ${verb1} is ${pct1}%.`);
    }
    if (annualizedIncrease5Year != null) {
      const verbAnn = annualizedIncrease5Year > 0.05 ? "increase" : annualizedIncrease5Year < -0.05 ? "decrease" : "change";
      const pctAnn = annualizedIncrease5Year > 0.05 ? annualizedIncrease5Year.toFixed(1) : annualizedIncrease5Year < -0.05 ? Math.abs(annualizedIncrease5Year).toFixed(1) : "0";
      parts.push(`The annualized 5-year ${verbAnn} is approximately ${pctAnn}% per year.`);
    }
    faqItems.push({
      question: `How much have electricity prices changed in ${stateName}?`,
      answer: parts.join(" "),
    });
  }
  faqItems.push({
    question: "Why do electricity prices change?",
    answer:
      "Electricity prices change due to fuel costs (natural gas, coal, renewables), transmission and distribution investments, regulatory policies, demand patterns, and weather. State-level rates also reflect local generation mix and market structure.",
  });
  faqItems.push({
    question: "Are electricity prices rising faster than inflation?",
    answer:
      "It varies by state and period. The U.S. Bureau of Labor Statistics reports that electricity prices have often risen faster than overall inflation in recent years due to grid modernization, renewable mandates, and fuel cost volatility. Compare your state's annualized increase to CPI inflation.",
  });

  const faqJsonLd =
    faqItems.length > 0
      ? {
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
        }
      : null;

  return (
    <>
      <JsonLdScript
        data={[breadcrumbJsonLd, webPageJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])]}
      />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-price-history">Electricity Price History</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          Electricity Price History in {stateName}
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Electricity cost depends on monthly usage and your state&apos;s rate. Below are historical rate
          trends and price change metrics for {stateName}. Data comes from EIA residential retail sales.
        </p>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {currentRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Current rate</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{currentRate.toFixed(2)} ¢/kWh</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>1-year {increase1YearPercent > 0.05 ? "increase" : increase1YearPercent < -0.05 ? "decrease" : "change"}</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>5-year {increase5YearPercent > 0.05 ? "increase" : increase5YearPercent < -0.05 ? "decrease" : "change"}</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {increase5YearPercent >= 0 ? "+" : ""}{increase5YearPercent.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Trend chart */}
        {hasHistory && chartPoints.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Price Trend</h2>
            <Sparkline
              points={chartPoints}
              width={720}
              height={200}
              title={`${stateName} electricity rate history`}
              subtitle={rateSeries?.periods?.length
                ? `${rateSeries.periods[0] ?? ""} to ${rateSeries.periods[rateSeries.periods.length - 1] ?? ""}`
                : "Monthly residential rate (¢/kWh)"}
              formatValue={(v) => `${v.toFixed(2)}¢`}
              ariaLabel="Electricity rate over time"
            />
          </section>
        )}

        {/* Fallback when no history */}
        {!hasHistory && (
          <section style={{ marginBottom: 32 }}>
            <p className="muted" style={{ margin: 0 }}>
              Historical rate series is not available for {stateName} at this time. Current rate and
              comparison data are shown above. Check back after the next data update.
            </p>
          </section>
        )}

        {/* Insight text */}
        {increase5YearPercent != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Summary</h2>
            <p style={{ margin: 0 }}>
              Electricity prices in {stateName} have {increase5YearPercent > 0.05 ? `increased ${increase5YearPercent.toFixed(1)}%` : increase5YearPercent < -0.05 ? `decreased ${Math.abs(increase5YearPercent).toFixed(1)}%` : "remained flat"} over the
              past 5 years.
              {rate1YearAgo != null && currentRate != null && (
                <> One year ago the rate was {rate1YearAgo.toFixed(2)}¢/kWh; it is now {currentRate.toFixed(2)}¢/kWh.</>
              )}
              {rate5YearsAgo != null && currentRate != null && (
                <> Five years ago the rate was {rate5YearsAgo.toFixed(2)}¢/kWh.</>
              )}
            </p>
          </section>
        )}

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Data & Comparisons</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-inflation/${slug}`}>Electricity inflation in {stateName}</Link>
              {" — "}
              Price growth, trends, rankings
            </li>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
              {" — "}
              Rates, value score, affordability
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
              {" — "}
              Monthly and annual bill estimates
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>Electricity cost calculator for {stateName}</Link>
              {" — "}
              Usage-based estimates
            </li>
            <li>
              <Link href={`/knowledge/state/${slug}`}>Full {stateName} knowledge page</Link>
              {" — "}
              Rates, value score, affordability, trends
            </li>
            <li>
              <Link href="/electricity-price-history">All states price history</Link>
            </li>
          </ul>
        </section>

        {/* FAQ */}
        {faqItems.length > 0 && (
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
        )}

        <Disclaimers disclaimerRefs={["general-site"]} />
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
