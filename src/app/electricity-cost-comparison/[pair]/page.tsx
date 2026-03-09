import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadComparePair, loadComparePairs } from "@/lib/knowledge/loadKnowledgePage";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd, buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getRelease } from "@/lib/knowledge/fetch";
import MiniBarChart from "@/components/charts/MiniBarChart";

const MONTHLY_USAGE_KWH = 900;

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  const pairsData = await loadComparePairs();
  if (!pairsData?.pairs?.length) return [];
  return pairsData.pairs.map((pair) => ({ pair }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const data = await loadComparePair(pair);
  if (!data) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that comparison.",
      canonicalPath: `/electricity-cost-comparison/${pair}`,
    });
  }
  const nameA = data.nameA ?? data.stateA;
  const nameB = data.nameB ?? data.stateB;
  const rateA = data.rateA / 100;
  const rateB = data.rateB / 100;
  const monthlyCostA = rateA * MONTHLY_USAGE_KWH;
  const monthlyCostB = rateB * MONTHLY_USAGE_KWH;
  const differenceDollars = monthlyCostA - monthlyCostB;
  const differencePercent =
    monthlyCostB > 0 ? ((monthlyCostA - monthlyCostB) / monthlyCostB) * 100 : 0;
  const description =
    Math.abs(differencePercent) < 0.5
      ? `Electricity in ${nameA} and ${nameB} cost about the same. ${nameA}: ${data.rateA.toFixed(2)}¢/kWh, ${nameB}: ${data.rateB.toFixed(2)}¢/kWh. Estimated 900 kWh bill: $${monthlyCostA.toFixed(2)} vs $${monthlyCostB.toFixed(2)}.`
      : `Electricity in ${nameA} costs ${Math.abs(differencePercent).toFixed(1)}% ${differencePercent > 0 ? "more" : "less"} than in ${nameB}. ${data.rateA.toFixed(2)}¢/kWh vs ${data.rateB.toFixed(2)}¢/kWh. 900 kWh: $${monthlyCostA.toFixed(2)} vs $${monthlyCostB.toFixed(2)} ($${Math.abs(differenceDollars).toFixed(2)} difference).`;
  return buildMetadata({
    title: `Electricity Cost Comparison: ${nameA} vs ${nameB} | PriceOfElectricity.com`,
    description,
    canonicalPath: `/electricity-cost-comparison/${pair}`,
  });
}

export default async function ElectricityCostComparisonPairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const data = await loadComparePair(pair);

  if (!data) notFound();

  const nameA = data.nameA ?? data.stateA;
  const nameB = data.nameB ?? data.stateB;
  const stateA = data.stateA;
  const stateB = data.stateB;

  const rateA = data.rateA / 100;
  const rateB = data.rateB / 100;
  const monthlyCostA = rateA * MONTHLY_USAGE_KWH;
  const monthlyCostB = rateB * MONTHLY_USAGE_KWH;
  const differenceDollars = monthlyCostA - monthlyCostB;
  const differencePercent =
    monthlyCostB > 0 ? ((monthlyCostA - monthlyCostB) / monthlyCostB) * 100 : 0;

  const higherCostName = monthlyCostA >= monthlyCostB ? nameA : nameB;
  const lowerCostName = monthlyCostA < monthlyCostB ? nameA : nameB;

  const canonicalPath = `/electricity-cost-comparison/${pair}`;

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Cost Comparison", url: "/electricity-cost-comparison" },
    { name: `${nameA} vs ${nameB}`, url: canonicalPath },
  ]);

  const webPageJsonLd = buildWebPageJsonLd({
    title: `Electricity Cost: ${nameA} vs ${nameB}`,
    description: `Compare electricity costs between ${nameA} and ${nameB}. ${nameA}: ${data.rateA.toFixed(2)}¢/kWh, ${nameB}: ${data.rateB.toFixed(2)}¢/kWh. Estimated 900 kWh monthly bill: $${monthlyCostA.toFixed(2)} vs $${monthlyCostB.toFixed(2)}.`,
    url: canonicalPath,
    isPartOf: "/",
    about: [`electricity cost ${nameA} vs ${nameB}`, "electricity rates comparison"],
  });

  const faqItems: Array<{ question: string; answer: string }> = [
    {
      question: `Which state has cheaper electricity: ${nameA} or ${nameB}?`,
      answer:
        monthlyCostA < monthlyCostB
          ? `${nameA} has cheaper electricity. At 900 kWh/month, the estimated bill is $${monthlyCostA.toFixed(2)} in ${nameA} vs $${monthlyCostB.toFixed(2)} in ${nameB}—about ${Math.abs(differencePercent).toFixed(1)}% less.`
          : monthlyCostA > monthlyCostB
            ? `${nameB} has cheaper electricity. At 900 kWh/month, the estimated bill is $${monthlyCostB.toFixed(2)} in ${nameB} vs $${monthlyCostA.toFixed(2)} in ${nameA}—about ${Math.abs(differencePercent).toFixed(1)}% less.`
            : `Electricity costs about the same in both states at typical usage (900 kWh/month): approximately $${monthlyCostA.toFixed(2)}.`,
    },
    {
      question: `How much more expensive is electricity in ${higherCostName}?`,
      answer:
        Math.abs(differencePercent) < 0.5
          ? `Electricity costs about the same in both states at 900 kWh/month.`
          : `At 900 kWh/month, electricity in ${higherCostName} costs about $${Math.abs(differenceDollars).toFixed(2)} more per month than in ${lowerCostName}—roughly ${Math.abs(differencePercent).toFixed(1)}% higher.`,
    },
    {
      question: "Why do electricity prices vary between states?",
      answer:
        "Electricity prices vary due to generation mix (coal, gas, nuclear, renewables), transmission costs, regulations, taxes, and demand. States with more hydropower or natural gas often have lower rates; those relying on imported power or with higher renewable mandates may have higher rates.",
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

  const chartRows = [
    { label: nameA, value: monthlyCostA },
    { label: nameB, value: monthlyCostB },
  ];

  const summaryText =
    Math.abs(differencePercent) < 0.5
      ? `Electricity in ${nameA} and ${nameB} cost about the same based on typical household electricity use.`
      : `Electricity in ${higherCostName} costs approximately ${Math.abs(differencePercent).toFixed(0)}% more than in ${lowerCostName} based on typical household electricity use.`;

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, faqJsonLd]} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-cost-comparison">Electricity Cost Comparison</Link>
          {" · "}
          <span aria-current="page">{nameA} vs {nameB}</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>
          Electricity Cost: {nameA} vs {nameB}
        </h1>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{nameA} rate</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{data.rateA.toFixed(2)} ¢/kWh</div>
          </div>
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{nameB} rate</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{data.rateB.toFixed(2)} ¢/kWh</div>
          </div>
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{nameA} 900 kWh bill</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>${monthlyCostA.toFixed(2)}</div>
          </div>
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{nameB} 900 kWh bill</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>${monthlyCostB.toFixed(2)}</div>
          </div>
        </div>

        {/* Comparison table */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Comparison</h2>
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
                    State
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                    Electricity rate
                  </th>
                  <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                    Estimated monthly bill
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                    {nameA}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                    {data.rateA.toFixed(2)} ¢/kWh
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                    ${monthlyCostA.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                    {nameB}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                    {data.rateB.toFixed(2)} ¢/kWh
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border, #e5e7eb)", textAlign: "right" }}>
                    ${monthlyCostB.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Difference summary */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Difference Summary</h2>
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>{summaryText}</p>
            <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
              Difference: {differenceDollars >= 0 ? "+" : ""}${differenceDollars.toFixed(2)} (
              {differencePercent >= 0 ? "+" : ""}{differencePercent.toFixed(1)}%) at 900 kWh/month
            </p>
          </div>
        </section>

        {/* Chart */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Monthly Bill Comparison</h2>
          <MiniBarChart
            rows={chartRows}
            title="Estimated monthly bill at 900 kWh"
            subtitle={`${nameA} vs ${nameB}`}
            formatValue={(v) => `$${v.toFixed(2)}`}
            minValue={0}
            ariaLabel="Estimated monthly electricity bill comparison"
          />
        </section>

        {/* Internal links */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Related Pages</h2>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href={`/electricity-cost/${stateA}`}>Electricity cost in {nameA}</Link>
            </li>
            <li>
              <Link href={`/electricity-cost/${stateB}`}>Electricity cost in {nameB}</Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${stateA}`}>Average electricity bill in {nameA}</Link>
            </li>
            <li>
              <Link href={`/average-electricity-bill/${stateB}`}>Average electricity bill in {nameB}</Link>
            </li>
            <li>
              <Link href={`/electricity-affordability/${stateA}`}>Electricity affordability in {nameA}</Link>
            </li>
            <li>
              <Link href={`/electricity-affordability/${stateB}`}>Electricity affordability in {nameB}</Link>
            </li>
            <li>
              <Link href="/electricity-cost-comparison">Compare electricity prices between states</Link>
            </li>
          </ul>
        </section>

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
        <StatusFooter release={await getRelease()} />
      </main>
    </>
  );
}
