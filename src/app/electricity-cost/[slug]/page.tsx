import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  loadInsights,
} from "@/lib/knowledge/loadKnowledgePage";
import { getActiveCitiesForState } from "@/lib/longtail/rollout";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import { getRelease } from "@/lib/knowledge/fetch";
import Disclaimers from "@/app/components/policy/Disclaimers";
import ExploreMore from "@/components/navigation/ExploreMore";

const MONTHLY_USAGE_KWH = 900;
const ANNUAL_USAGE_KWH = 10800;

export const dynamicParams = true;
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [statePage] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
  ]);
  if (!statePage) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/electricity-cost/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollars = avgRate != null ? avgRate / 100 : 0;
  const monthlyCost = rateDollars * MONTHLY_USAGE_KWH;
  const description =
    avgRate != null
      ? `Average electricity cost in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly cost for 900 kWh: $${monthlyCost.toFixed(2)}. Compare to national average.`
      : `${stateName} electricity cost and rate data. Residential average rate, estimated monthly and annual costs.`;
  return buildMetadata({
    title: `Electricity Cost in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-cost/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityCostStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [statePage, nationalPage, insights] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
    loadInsights("state", slug),
  ]);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as {
    name?: string;
    avgRateCentsPerKwh?: number;
    updated?: string;
  } | undefined;
  const derived = statePage.data?.derived as {
    comparison?: {
      nationalAverage: number;
      differenceCents: number;
      differencePercent: number;
      category: string;
    };
  } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;

  const nationalData = nationalPage?.data as {
    derived?: { averageRate?: number };
  } | null;
  const nationalAvg = typeof nationalData?.derived?.averageRate === "number"
    ? nationalData.derived.averageRate
    : null;

  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const estimatedMonthlyCost = rateDollarsPerKwh * MONTHLY_USAGE_KWH;
  const estimatedAnnualCost = rateDollarsPerKwh * ANNUAL_USAGE_KWH;

  let monthlyCostDifferenceVsNational: number | null = null;
  if (nationalAvg != null && avgRate != null) {
    const nationalRateDollars = nationalAvg / 100;
    const nationalMonthly = nationalRateDollars * MONTHLY_USAGE_KWH;
    monthlyCostDifferenceVsNational = estimatedMonthlyCost - nationalMonthly;
  }

  const comparison = derived?.comparison;
  const regionRef = (statePage.data as { regionRef?: { id: string; name: string; href: string } })?.regionRef;
  const compareLinks = (statePage.data as { compareLinks?: Array<{ pairSlug: string; title: string; url: string }> })?.compareLinks ?? [];
  const activeCities = getActiveCitiesForState(slug).slice(0, 8);

  const canonicalPath = `/electricity-cost/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost", url: "/electricity-cost" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Cost in ${stateName}`,
    description: avgRate != null
      ? `Average electricity cost in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly cost for 900 kWh: $${estimatedMonthlyCost.toFixed(2)}.`
      : `${stateName} electricity cost and rate data.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`${stateName} electricity cost`, "electricity rates by state"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [];
  if (avgRate != null) {
    faqItems.push({
      question: `What is the average electricity cost in ${stateName}?`,
      answer: `The average residential electricity rate in ${stateName} is ${avgRate.toFixed(2)} cents per kWh. At 900 kWh per month, that translates to an estimated monthly cost of $${estimatedMonthlyCost.toFixed(2)}.`,
    });
    if (nationalAvg != null && monthlyCostDifferenceVsNational != null) {
      const dir = monthlyCostDifferenceVsNational > 0 ? "more" : "less";
      const absDiff = Math.abs(monthlyCostDifferenceVsNational);
      faqItems.push({
        question: `Is electricity in ${stateName} cheaper than the national average?`,
        answer: monthlyCostDifferenceVsNational === 0
          ? `Electricity in ${stateName} is close to the national average.`
          : `Electricity in ${stateName} costs about $${absDiff.toFixed(2)} ${dir} per month than the U.S. national average when using 900 kWh.`,
      });
    }
    faqItems.push({
      question: `How much does 900 kWh cost in ${stateName}?`,
      answer: `At the average rate of ${avgRate.toFixed(2)}¢/kWh, 900 kWh costs approximately $${estimatedMonthlyCost.toFixed(2)} per month, or about $${estimatedAnnualCost.toFixed(2)} per year.`,
    });
  }

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
          <Link href="/electricity-cost">Electricity Cost</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Electricity Cost in {stateName}</h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          This page summarizes average residential electricity rates and estimated costs for {stateName}.
          All figures are based on EIA data and use a standard 900 kWh monthly usage for cost estimates.
        </p>
        <p className="muted" style={{ marginTop: -8, marginBottom: 24, maxWidth: "65ch" }}>
          Authority signals: deterministic state benchmark methodology, machine-readable dataset references, and
          canonical linkage to city context, estimator, and comparison families.
        </p>

        {/* Key stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {avgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Average rate</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{avgRate.toFixed(2)} ¢/kWh</div>
            </div>
          )}
          {avgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. monthly (900 kWh)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedMonthlyCost.toFixed(2)}</div>
            </div>
          )}
          {avgRate != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Est. annual (10,800 kWh)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedAnnualCost.toFixed(2)}</div>
            </div>
          )}
          {monthlyCostDifferenceVsNational != null && nationalAvg != null && (
            <div
              style={{
                padding: 20,
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: 8,
                backgroundColor: "var(--color-surface-alt, #f9fafb)",
              }}
            >
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>vs national (monthly)</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {monthlyCostDifferenceVsNational >= 0 ? "+" : ""}${monthlyCostDifferenceVsNational.toFixed(2)}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                National avg: {nationalAvg.toFixed(2)}¢/kWh
              </div>
            </div>
          )}
        </div>

        {/* How state compares */}
        {(comparison || (nationalAvg != null && avgRate != null)) && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>How {stateName} Compares</h2>
            {comparison ? (
              <div
                style={{
                  padding: 20,
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: 8,
                  backgroundColor: "var(--color-surface-alt, #f9fafb)",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>State rate</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{avgRate?.toFixed(2) ?? "—"} ¢/kWh</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>National average</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{comparison.nationalAverage.toFixed(2)} ¢/kWh</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>Difference</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>
                      {comparison.differencePercent >= 0 ? "+" : ""}{comparison.differencePercent.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 12 }}>Category</div>
                    <div style={{ fontSize: 16 }}>{comparison.category}</div>
                  </div>
                </div>
              </div>
            ) : (
              nationalAvg != null &&
              avgRate != null && (
                <p style={{ margin: 0 }}>
                  {stateName} averages {avgRate.toFixed(2)}¢/kWh vs the national average of {nationalAvg.toFixed(2)}¢/kWh.
                  That is {((avgRate - nationalAvg) / nationalAvg * 100).toFixed(1)}%{" "}
                  {avgRate > nationalAvg ? "higher" : "lower"} than the U.S. average.
                </p>
              )
            )}
          </section>
        )}

        {/* Key Insights */}
        {insights?.insights && insights.insights.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Key Insights</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {insights.insights.slice(0, 5).map((ins, idx) => (
                <li key={idx}>{ins.statement}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Data & Comparisons</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost-of-living/${slug}`}>
                See electricity cost-of-living analysis in {stateName}
              </Link>
            </li>
            <li>
              <Link href={`/moving-to-electricity-cost/${slug}`}>
                Moving to {stateName}? See estimated electricity costs.
              </Link>
            </li>
            <li>
              <Link href={`/electricity-price-history/${slug}`}>
                See electricity price history in {stateName}
              </Link>
            </li>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>
                Need usage-based estimates? Try the electricity cost calculator for {stateName}.
              </Link>
            </li>
            <li>
              <Link href={`/battery-recharge-cost/${slug}`}>
                Interested in backup power? See battery recharge cost in {stateName}.
              </Link>
            </li>
            <li>
              <Link href={`/generator-vs-battery-cost/${slug}`}>
                Compare battery recharge cost with generator operating cost in {stateName}.
              </Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
              {" — "}
              Estimated monthly and annual bills
            </li>
            <li>
              <Link href={`/knowledge/state/${slug}`}>Full {stateName} knowledge page</Link>
              {" — "}
              Rates, value score, affordability, trends
            </li>
            {regionRef && (
              <li>
                <Link href={regionRef.href}>{regionRef.name} region</Link>
                {" — "}
                Compare with neighboring states
              </li>
            )}
            <li>
              <Link href="/knowledge/rankings/rate-high-to-low">Rate rankings (high to low)</Link>
            </li>
            <li>
              <Link href="/knowledge/rankings/rate-low-to-high">Rate rankings (low to high)</Link>
            </li>
            <li>
              <Link href="/how-much-does-500-kwh-cost">How much does 500 kWh cost?</Link>
              {" · "}
              <Link href="/how-much-does-1000-kwh-cost">1000 kWh</Link>
              {" · "}
              <Link href="/how-much-does-2000-kwh-cost">2000 kWh</Link>
              {" — "}
              Fixed electricity cost examples
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Compare electricity prices between states</Link>
              {" — "}
              See state-to-state electricity comparisons
            </li>
            {compareLinks.length > 0 && (
              <li>
                {compareLinks.slice(0, 3).map((link) => (
                  <span key={link.pairSlug} style={{ marginRight: 12 }}>
                    <Link href={link.url}>{link.title}</Link>
                  </span>
                ))}
              </li>
            )}
          </ul>
        </section>

        {activeCities.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Rollout-enabled city electricity pages</h2>
            <p style={{ marginTop: 0, maxWidth: "70ch", lineHeight: 1.7 }}>
              These city pages provide deterministic city-level estimate context and methodology disclosure. They are
              supplemental to the canonical state benchmark and do not replace utility tariff quotes.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              {activeCities.map((city) => (
                <li key={city.slug}>
                  <Link href={`/electricity-cost/${slug}/${city.slug}`}>
                    Electricity cost in {city.name}, {stateName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ExploreMore
          title="Related electricity pages"
          links={[
            { href: `/average-electricity-bill/${slug}`, label: "Average electricity bill" },
            { href: `/electricity-affordability/${slug}`, label: "Electricity affordability analysis" },
            { href: `/electricity-cost-calculator/${slug}`, label: "Electricity cost calculator" },
            { href: `/battery-recharge-cost/${slug}`, label: "Battery recharge cost" },
            { href: `/generator-vs-battery-cost/${slug}`, label: "Generator vs battery cost" },
            { href: `/electricity-price-history/${slug}`, label: "Electricity price history" },
            { href: `/knowledge/state/${slug}`, label: "State overview" },
          ]}
        />

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
