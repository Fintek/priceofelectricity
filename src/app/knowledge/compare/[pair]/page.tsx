import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadComparePair, loadComparePairs } from "@/lib/knowledge/loadKnowledgePage";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import MiniBarChart from "@/components/charts/MiniBarChart";
import Section from "@/components/common/Section";
import ShareBar from "@/components/common/ShareBar";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { getRelease } from "@/lib/knowledge/fetch";

const BASE_URL = SITE_URL;
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
      canonicalPath: `/knowledge/compare/${pair}`,
    });
  }
  const nameA = data.nameA ?? data.stateA;
  const nameB = data.nameB ?? data.stateB;
  const title = `Electricity Cost: ${nameA} vs ${nameB} | PriceOfElectricity.com`;
  const pct = Math.abs(data.differencePercent);
  const dir = data.differencePercent > 0 ? "more" : "less";
  const description = `Electricity in ${nameA} costs ${pct.toFixed(1)}% ${dir} than in ${nameB}. Compare rates and metrics.`;
  return buildMetadata({ title, description, canonicalPath: `/knowledge/compare/${pair}` });
}

export default async function ComparePairPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair } = await params;
  const [data, release] = await Promise.all([loadComparePair(pair), getRelease()]);

  if (!data) notFound();

  const nameA = data.nameA ?? data.stateA;
  const nameB = data.nameB ?? data.stateB;
  const canonicalPath = `/knowledge/compare/${pair}`;
  const jsonUrlPath = `/knowledge/compare/${pair}.json`;

  const pct = Math.abs(data.differencePercent);
  const dir = data.differencePercent > 0 ? "more" : "less";
  const summaryText =
    data.differencePercent === 0
      ? `Electricity in ${nameA} and ${nameB} cost about the same.`
      : `Electricity in ${nameA} costs ${pct.toFixed(1)}% ${dir} than in ${nameB}.`;

  return (
    <main className="container">
      <nav aria-label="Knowledge navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/data">Data Hub</Link>
        {" · "}
        <Link href="/knowledge">Knowledge</Link>
        {" · "}
        <Link href="/knowledge/compare">Compare</Link>
      </nav>
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "Compare", href: "/knowledge/compare" },
          { label: `${nameA} vs ${nameB}` },
        ]}
        title={`Electricity Cost: ${nameA} vs ${nameB}`}
        jsonUrl={`${BASE_URL}${jsonUrlPath}`}
      />
      <ShareBar
        canonicalUrl={`${BASE_URL}${canonicalPath}`}
        jsonUrl={`${BASE_URL}${jsonUrlPath}`}
      />
      <Section title="Two-state comparison" subtitle="Electricity rate by state.">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                State
              </th>
              <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                Electricity rate
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                <Link href={`/knowledge/state/${data.stateA}`}>{nameA}</Link>
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)", textAlign: "right" }}>
                {data.rateA.toFixed(2)} ¢/kWh
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)" }}>
                <Link href={`/knowledge/state/${data.stateB}`}>{nameB}</Link>
              </td>
              <td style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)", textAlign: "right" }}>
                {data.rateB.toFixed(2)} ¢/kWh
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
      <Section title="Difference summary">
        <p style={{ margin: 0, fontSize: 16 }}>{summaryText}</p>
        <p className="muted" style={{ marginTop: 8, fontSize: 14 }}>
          Difference: {data.differenceCents >= 0 ? "+" : ""}{data.differenceCents.toFixed(2)} ¢/kWh (
          {data.differencePercent >= 0 ? "+" : ""}{data.differencePercent.toFixed(1)}%)
        </p>
      </Section>
      <Section title="Comparison chart" subtitle="¢/kWh">
        <div style={{ overflowX: "auto", maxWidth: "100%" }}>
          <MiniBarChart
            rows={[
              { label: nameA, value: data.rateA },
              { label: nameB, value: data.rateB },
            ]}
            minValue={0}
            width={320}
            height={80}
            title={`${nameA} vs ${nameB}`}
            subtitle="¢/kWh"
            formatValue={(v) => `${v.toFixed(2)} ¢/kWh`}
          />
        </div>
      </Section>
      <Disclaimers disclaimerRefs={["general-site"]} />
      <StatusFooter release={release} />
    </main>
  );
}
