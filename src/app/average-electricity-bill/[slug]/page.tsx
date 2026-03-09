import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  loadEntityIndex,
} from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import ExploreMore from "@/components/navigation/ExploreMore";
import MiniBarChart from "@/components/charts/MiniBarChart";
import { getRelease } from "@/lib/knowledge/fetch";

const MONTHLY_USAGE_KWH = 900;
const ANNUAL_USAGE_KWH = 10800;

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
  const [statePage] = await Promise.all([
    loadKnowledgePage("state", slug),
    loadKnowledgePage("national", "national"),
  ]);
  if (!statePage) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/average-electricity-bill/${slug}`,
    });
  }
  const raw = statePage.data?.raw as { name?: string; avgRateCentsPerKwh?: number } | undefined;
  const stateName = raw?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const avgRate = typeof raw?.avgRateCentsPerKwh === "number" ? raw.avgRateCentsPerKwh : null;
  const rateDollars = avgRate != null ? avgRate / 100 : 0;
  const monthlyBill = rateDollars * MONTHLY_USAGE_KWH;
  const description =
    avgRate != null
      ? `Average electricity bill in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly bill for 900 kWh: $${monthlyBill.toFixed(2)}. Compare to national average.`
      : `${stateName} average electricity bill. Residential rate, estimated monthly and annual bills.`;
  return buildMetadata({
    title: `Average Electricity Bill in ${stateName} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/average-electricity-bill/${slug}`,
  });
}

function slugToDisplayName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AverageElectricityBillStatePage({
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
    typeof nationalData?.derived?.averageRate === "number"
      ? nationalData.derived.averageRate
      : null;

  const rateDollarsPerKwh = avgRate != null ? avgRate / 100 : 0;
  const estimatedMonthlyBill = rateDollarsPerKwh * MONTHLY_USAGE_KWH;
  const estimatedAnnualBill = rateDollarsPerKwh * ANNUAL_USAGE_KWH;

  let nationalMonthlyBill: number | null = null;
  let percentVsNational: number | null = null;
  if (nationalAvg != null && avgRate != null) {
    const nationalRateDollars = nationalAvg / 100;
    nationalMonthlyBill = nationalRateDollars * MONTHLY_USAGE_KWH;
    percentVsNational =
      nationalMonthlyBill > 0
        ? ((estimatedMonthlyBill - nationalMonthlyBill) / nationalMonthlyBill) * 100
        : null;
  }

  const canonicalPath = `/average-electricity-bill/${slug}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Average Electricity Bill", url: "/average-electricity-bill" },
    { name: stateName, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Average Electricity Bill in ${stateName}`,
    description:
      avgRate != null
        ? `Average electricity bill in ${stateName}: ${avgRate.toFixed(2)}¢/kWh. Estimated monthly bill for 900 kWh: $${estimatedMonthlyBill.toFixed(2)}.`
        : `${stateName} average electricity bill.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`${stateName} electricity bill`, "average electricity bill by state"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [];
  if (avgRate != null) {
    faqItems.push({
      question: `What is the average electricity bill in ${stateName}?`,
      answer: `The average residential electricity rate in ${stateName} is ${avgRate.toFixed(2)} cents per kWh. At 900 kWh per month, that translates to an estimated monthly bill of $${estimatedMonthlyBill.toFixed(2)} and an annual bill of about $${estimatedAnnualBill.toFixed(2)}.`,
    });
    faqItems.push({
      question: "Why are electricity bills higher in some states?",
      answer:
        "Electricity bills vary by state due to differences in generation mix, transmission costs, regulations, and local demand. States with higher renewable mandates or limited fossil fuel resources often have higher rates.",
    });
    faqItems.push({
      question: "How much electricity does a typical home use per month?",
      answer:
        "The U.S. Energy Information Administration reports that the average U.S. residential customer uses about 899 kWh per month. We use 900 kWh as a standard assumption for bill estimates.",
    });
    if (nationalAvg != null && percentVsNational != null) {
      const dir = percentVsNational > 0 ? "more" : "less";
      const absPct = Math.abs(percentVsNational).toFixed(1);
      faqItems.push({
        question: `How does ${stateName} compare to the U.S. average electricity bill?`,
        answer: `${stateName} households pay approximately ${absPct}% ${dir} than the U.S. average when using 900 kWh per month.`,
      });
    }
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

  const chartRows: Array<{ label: string; value: number }> = [];
  if (avgRate != null && nationalMonthlyBill != null) {
    chartRows.push({ label: stateName, value: estimatedMonthlyBill });
    chartRows.push({ label: "U.S. average", value: nationalMonthlyBill });
  }

  return (
    <>
      <JsonLdScript
        data={[breadcrumbJsonLd, webPageJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])]}
      />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/average-electricity-bill">Average Electricity Bill</Link>
          {" · "}
          <span aria-current="page">{stateName}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 16 }}>
          Average Electricity Bill in {stateName}
        </h1>
        <p style={{ marginTop: 0, marginBottom: 24, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          Estimated average electricity bills for {stateName} based on the state&apos;s residential rate and a
          standard 900 kWh monthly usage.
        </p>

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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Electricity rate
              </div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Est. monthly bill (900 kWh)
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedMonthlyBill.toFixed(2)}</div>
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
              <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                Est. annual bill (10,800 kWh)
              </div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>${estimatedAnnualBill.toFixed(2)}</div>
            </div>
          )}
        </div>

        {percentVsNational != null && nationalMonthlyBill != null && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Comparison to U.S. Average</h2>
            <p style={{ margin: 0 }}>
              {stateName} households pay approximately{" "}
              {Math.abs(percentVsNational).toFixed(1)}%{" "}
              {percentVsNational > 0 ? "more" : "less"} than the U.S. average.
            </p>
          </section>
        )}

        {chartRows.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Monthly Bill Comparison</h2>
            <MiniBarChart
              rows={chartRows}
              title="State vs U.S. average monthly bill"
              subtitle="900 kWh usage"
              formatValue={(v) => `$${v.toFixed(2)}`}
              minValue={0}
            />
          </section>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Data</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost-calculator/${slug}`}>
                Need usage-based estimates? Try the electricity cost calculator for {stateName}.
              </Link>
            </li>
            <li>
              <Link href={`/electricity-cost/${slug}`}>Electricity cost in {stateName}</Link>
              {" — "}
              Rates and cost breakdown
            </li>
            <li>
              <Link href={`/knowledge/state/${slug}`}>Full {stateName} knowledge page</Link>
              {" — "}
              Rates, value score, affordability
            </li>
            <li>
              <Link href="/average-electricity-bill">Average electricity bill by state</Link>
            </li>
          </ul>
        </section>

        <ExploreMore
          title="Related electricity pages"
          links={[
            { href: `/electricity-cost/${slug}`, label: "Electricity cost" },
            { href: `/electricity-affordability/${slug}`, label: "Electricity affordability analysis" },
            { href: `/electricity-cost-calculator/${slug}`, label: "Electricity cost calculator" },
            { href: `/battery-recharge-cost/${slug}`, label: "Battery recharge cost" },
            { href: `/generator-vs-battery-cost/${slug}`, label: "Generator vs battery cost" },
            { href: `/electricity-price-history/${slug}`, label: "Electricity price history" },
            { href: `/knowledge/state/${slug}`, label: "State overview" },
          ]}
        />

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
