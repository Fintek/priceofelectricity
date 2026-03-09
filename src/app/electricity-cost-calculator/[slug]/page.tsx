import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadKnowledgePage, loadEntityIndex } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import ExploreMore from "@/components/navigation/ExploreMore";
import { getRelease } from "@/lib/knowledge/fetch";
import MiniBarChart from "@/components/charts/MiniBarChart";

const LOW_MONTHLY_KWH = 500;
const TYPICAL_MONTHLY_KWH = 900;
const HIGH_MONTHLY_KWH = 1500;

export const dynamic = "force-static";
export const revalidate = 86400;

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
      canonicalPath: `/electricity-cost-calculator/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollars = avgRate != null ? avgRate / 100 : 0;
  const typicalMonthlyCost = rateDollars * TYPICAL_MONTHLY_KWH;
  const description =
    avgRate != null
      ? `Electricity cost calculator for ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated cost at 900 kWh/month: $${typicalMonthlyCost.toFixed(2)}. See 500, 900, 1500 kWh scenarios.`
      : `Electricity cost calculator for ${stateName}. Estimate monthly bills by usage.`;
  return buildMetadata({
    title: `Electricity Cost Calculator for ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-cost-calculator/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ElectricityCostCalculatorStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [statePage, nationalPage] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
  ]);

  if (!statePage) notFound();

  const raw = statePage.data?.raw as {
    name?: string;
    avgRateCentsPerKwh?: number;
  } | undefined;
  const stateName = raw?.name ?? slugToDisplayName(slug);
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;

  const nationalData = nationalPage?.data as {
    derived?: { averageRate?: number };
  } | null;
  const nationalAvg =
    typeof nationalData?.derived?.averageRate === "number" ? nationalData.derived.averageRate : null;

  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;

  const lowMonthlyCost = rateDollarsPerKwh * LOW_MONTHLY_KWH;
  const typicalMonthlyCost = rateDollarsPerKwh * TYPICAL_MONTHLY_KWH;
  const highMonthlyCost = rateDollarsPerKwh * HIGH_MONTHLY_KWH;

  const lowAnnualCost = lowMonthlyCost * 12;
  const typicalAnnualCost = typicalMonthlyCost * 12;
  const highAnnualCost = highMonthlyCost * 12;

  let nationalTypicalMonthly: number | null = null;
  let diffDollars: number | null = null;
  let diffPercent: number | null = null;
  if (nationalAvg != null && avgRate != null) {
    const nationalRateDollars = nationalAvg / 100;
    nationalTypicalMonthly = nationalRateDollars * TYPICAL_MONTHLY_KWH;
    diffDollars = typicalMonthlyCost - nationalTypicalMonthly;
    diffPercent =
      nationalTypicalMonthly > 0
        ? ((typicalMonthlyCost - nationalTypicalMonthly) / nationalTypicalMonthly) * 100
        : null;
  }

  const canonicalPath = `/electricity-cost-calculator/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost Calculator", url: "/electricity-cost-calculator" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Cost Calculator for ${stateName}`,
    description:
      avgRate != null
        ? `Electricity cost calculator for ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated cost at 900 kWh/month: $${typicalMonthlyCost.toFixed(2)}.`
        : `${stateName} electricity cost calculator.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`electricity cost calculator ${stateName}`, "electricity bill calculator"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [];
  if (avgRate != null) {
    faqItems.push({
      question: `How much does 500 kWh cost in ${stateName}?`,
      answer: `At the average rate of ${avgRate.toFixed(2)}¢/kWh, 500 kWh costs approximately $${lowMonthlyCost.toFixed(2)} per month, or about $${lowAnnualCost.toFixed(2)} per year.`,
    });
    faqItems.push({
      question: `How much does 900 kWh cost in ${stateName}?`,
      answer: `At the average rate of ${avgRate.toFixed(2)}¢/kWh, 900 kWh costs approximately $${typicalMonthlyCost.toFixed(2)} per month, or about $${typicalAnnualCost.toFixed(2)} per year.`,
    });
    if (nationalAvg != null && diffPercent != null) {
      const dir = diffPercent > 0 ? "more expensive" : "less expensive";
      const absPct = Math.abs(diffPercent).toFixed(1);
      faqItems.push({
        question: `Is electricity in ${stateName} more expensive than the national average?`,
        answer: `At 900 kWh per month, electricity in ${stateName} is approximately ${absPct}% ${dir} than the U.S. national average.`,
      });
    }
    faqItems.push({
      question: "What affects monthly electricity costs?",
      answer:
        "Monthly costs depend on your usage (kWh) and your electricity rate (¢/kWh). Usage varies with home size, appliances, heating/cooling, and season. Rates vary by state, utility, and plan type.",
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

  const chartRows =
    avgRate != null
      ? [
          { label: "500 kWh", value: lowMonthlyCost },
          { label: "900 kWh", value: typicalMonthlyCost },
          { label: "1500 kWh", value: highMonthlyCost },
        ]
      : [];

  return (
    <>
      <JsonLdScript
        data={[breadcrumbJsonLd, webPageJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])]}
      />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-cost-calculator">Electricity Cost Calculator</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          Electricity Cost Calculator for {stateName}
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Electricity cost depends on monthly usage and your state&apos;s rate. Below are estimates for {stateName}
          based on the average residential rate. All figures use the formula: rate × usage.
        </p>

        {/* Summary block */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Low (500 kWh/mo)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${lowMonthlyCost.toFixed(2)}</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Typical (900 kWh/mo)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${typicalMonthlyCost.toFixed(2)}</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>High (1500 kWh/mo)</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${highMonthlyCost.toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Scenario table */}
        {avgRate != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Usage Scenarios</h2>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                      Monthly usage (kWh)
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                      Est. monthly cost
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                      Est. annual cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>500</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${lowMonthlyCost.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${lowAnnualCost.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>900</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${typicalMonthlyCost.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${typicalAnnualCost.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>1,500</td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${highMonthlyCost.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                      ${highAnnualCost.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* National comparison */}
        {nationalTypicalMonthly != null && diffDollars != null && diffPercent != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Compared to National Average (900 kWh)</h2>
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
                  <div className="muted" style={{ fontSize: 12 }}>Typical cost in {stateName}</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>${typicalMonthlyCost.toFixed(2)}/mo</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Typical cost nationally</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>${nationalTypicalMonthly.toFixed(2)}/mo</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12 }}>Difference</div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {diffDollars >= 0 ? "+" : ""}${diffDollars.toFixed(2)} ({diffPercent >= 0 ? "+" : ""}{diffPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Chart */}
        {chartRows.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Monthly Cost by Usage</h2>
            <MiniBarChart
              rows={chartRows}
              title="Monthly cost by usage scenario"
              subtitle={`${stateName} at ${avgRate?.toFixed(2) ?? "—"}¢/kWh`}
              formatValue={(v) => `$${v.toFixed(2)}`}
              minValue={0}
              ariaLabel="Monthly electricity cost by usage scenario"
            />
          </section>
        )}

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Data & Comparisons</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
              {" — "}
              Rates, value score, affordability
            </li>
            <li>
              <Link href={`/battery-recharge-cost/${slug}`}>
                Interested in backup power? See battery recharge cost in {stateName}.
              </Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${slug}`}>Average electricity bill in {stateName}</Link>
              {" — "}
              Monthly and annual bill estimates
            </li>
            <li>
              <Link href={`/moving-to-electricity-cost/${slug}`}>Electricity cost when moving to {stateName}</Link>
              {" — "}
              Relocation estimates
            </li>
            <li>
              <Link href={`/knowledge/state/${slug}`}>Full {stateName} knowledge page</Link>
              {" — "}
              Rates, value score, affordability, trends
            </li>
            <li>
              <Link href="/electricity-cost-calculator">All states calculator</Link>
            </li>
            <li>
              See fixed electricity cost examples:{" "}
              <Link href="/how-much-does-500-kwh-cost">500 kWh</Link>
              {" · "}
              <Link href="/how-much-does-1000-kwh-cost">1000 kWh</Link>
              {" · "}
              <Link href="/how-much-does-2000-kwh-cost">2000 kWh</Link>
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Related electricity pages"
          links={[
            { href: `/electricity-cost/${slug}`, label: "Electricity cost" },
            { href: `/average-electricity-bill/${slug}`, label: "Average electricity bill" },
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
