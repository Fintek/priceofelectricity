import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  loadEntityIndex,
  loadRankingsIndex,
  loadRelatedIndex,
  loadInsights,
  resolveEntityRefs,
} from "@/lib/knowledge/loadKnowledgePage";
import { getGlossaryMap } from "@/lib/knowledge/glossary";
import { getGlossary, getRelease } from "@/lib/knowledge/fetch";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import RankingHeader from "@/components/knowledge/RankingHeader";
import RankingDetailClient from "./RankingDetailClient";
import MiniBarChart from "@/components/charts/MiniBarChart";
import Sparkline from "@/components/charts/Sparkline";
import FreshnessBox from "@/app/components/knowledge/FreshnessBox";
import JsonPreview from "@/app/components/knowledge/JsonPreview";
import RelatedEntitiesSidebar from "@/app/components/knowledge/RelatedEntitiesSidebar";
import Disclaimers from "@/app/components/policy/Disclaimers";
import Section from "@/components/common/Section";
import ShareBar from "@/components/common/ShareBar";
import StatusFooter from "@/components/common/StatusFooter";
import RecommendedNext from "@/components/knowledge/RecommendedNext";
import ExploreMore from "@/components/navigation/ExploreMore";
import SummarySnippet from "@/components/knowledge/SummarySnippet";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd, buildDatasetJsonLd, buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  const index = await loadEntityIndex();
  return index.entities
    .filter((e) => e.type === "rankings")
    .map((e) => ({ id: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = await loadKnowledgePage("rankings", id);
  if (!page) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/knowledge/rankings/${id}`,
    });
  }
  const meta = page.meta as { excerpt?: string; description: string; title: string; canonicalUrl?: string };
  const title = `${meta.title} | PriceOfElectricity.com`;
  const description = meta.excerpt ?? meta.description ?? `${meta.title} ranking of U.S. states.`;
  const canonicalPath = (meta.canonicalUrl ?? `/knowledge/rankings/${id}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/rankings/${id}`;
  return buildMetadata({ title, description, canonicalPath });
}

export default async function KnowledgeRankingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [page, entityIndex, rankingsIndex, glossary, release, relatedMap, insights] = await Promise.all([
    loadKnowledgePage("rankings", id),
    loadEntityIndex(),
    loadRankingsIndex(),
    getGlossary(),
    getRelease(),
    loadRelatedIndex(),
    loadInsights("ranking", id),
  ]);

  if (!page) notFound();

  const indexItem = rankingsIndex?.items.find((i) => i.id === id);
  const metricField = indexItem?.metricField ?? "";
  const metricId = metricField.split(".").pop() ?? undefined;
  const direction = indexItem?.sortDirection;
  const methodologyRefs = indexItem?.methodologiesUsed?.map(
    (m) => `/knowledge/methodology/${m.id}`,
  );
  const enabled = (page.data as { enabled?: boolean }).enabled !== false;
  const windowYears = (page.data as { windowYears?: number }).windowYears;
  const glossaryMap = getGlossaryMap(glossary);

  const meta = page.meta as { excerpt?: string; description: string; title: string; canonicalUrl?: string };
  const rankingType = (page.data as { rankingType?: string }).rankingType ?? id;
  const canonicalPath = (meta.canonicalUrl ?? `/knowledge/rankings/${id}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/rankings/${id}`;

  const webPageJsonLd = buildWebPageJsonLd({
    title: meta.title,
    description: meta.excerpt ?? meta.description ?? `${meta.title} ranking of U.S. states.`,
    url: canonicalPath,
    dateModified: (page.meta.freshness as { computedAt?: string })?.computedAt ?? (page.meta as { updatedAt?: string }).updatedAt,
    isPartOf: "/",
    about: [rankingType, "state rankings"],
  });

  const datasetJsonLd = buildDatasetJsonLd({
    name: meta.title,
    description: meta.excerpt ?? meta.description ?? `${meta.title} ranking of U.S. states.`,
    url: canonicalPath,
    dateModified: (page.meta.freshness as { computedAt?: string })?.computedAt ?? (page.meta as { updatedAt?: string }).updatedAt,
  });

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Knowledge", url: "/knowledge" },
    { name: "Rankings", url: "/knowledge/rankings" },
    { name: meta.title, url: canonicalPath },
  ]);

  const relatedEntities = (page.data.relatedEntities as {
    states?: string[];
    rankings?: string[];
    methodologies?: string[];
  }) ?? {};
  const refs = resolveEntityRefs(entityIndex, relatedEntities);

  const sortedStates = (page.data.sortedStates as Array<{
    rank: number;
    slug: string;
    name: string;
    metricValue: number;
  }>) ?? [];

  return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd]} />
      <main className="container">
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "Rankings", href: "/knowledge/rankings" },
          { label: page.meta.title },
        ]}
        title={page.meta.title}
        jsonUrl={page.meta.jsonUrl}
        canonicalUrl={meta.canonicalUrl?.startsWith("http") ? meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        qualityScore={(page.meta as { qualityScore?: number }).qualityScore}
        freshnessStatus={page.meta.freshness?.status}
        ageDays={page.meta.freshness?.ageDays}
        sourceVersion={(page.meta as { sourceVersion?: string }).sourceVersion}
        semanticCluster={(page.meta as { llmHints?: { semanticCluster?: string } }).llmHints?.semanticCluster}
      />

      <RankingHeader
        title={page.meta.title}
        excerpt={(meta as { excerpt?: string }).excerpt ?? page.meta.description}
        metricId={metricId}
        direction={direction}
        methodologyRefs={methodologyRefs}
        methodologyHubUrl="/methodology"
        glossary={glossaryMap}
        jsonUrl={page.meta.jsonUrl}
        enabled={enabled}
        windowYears={windowYears}
      />

      <ShareBar
        canonicalUrl={meta.canonicalUrl?.startsWith("http") ? meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        jsonUrl={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/rankings/${id}.json`}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32 }}>
        <div>
          {page.meta.freshness && (
            <FreshnessBox freshness={page.meta.freshness} />
          )}
          {id === "momentum-signal" && (
            <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 15 }}>
              This ranking summarizes recent electricity price direction and is not a forecast.
            </p>
          )}
          {insights?.insights && insights.insights.length > 0 && (
            <Section title="Key Insights">
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                {insights.insights.map((i, idx) => (
                  <li key={idx}>{i.statement}</li>
                ))}
              </ul>
            </Section>
          )}
          <Section title="Summary">
            <SummarySnippet
              title="Shareable summary"
              lines={[
                page.meta.title,
                ...(sortedStates.length >= 3
                  ? [
                      `Top 3: 1) ${sortedStates[0].name} ${sortedStates[0].metricValue}, 2) ${sortedStates[1].name} ${sortedStates[1].metricValue}, 3) ${sortedStates[2].name} ${sortedStates[2].metricValue}`,
                      `Bottom 3: 1) ${sortedStates[sortedStates.length - 3].name} ${sortedStates[sortedStates.length - 3].metricValue}, 2) ${sortedStates[sortedStates.length - 2].name} ${sortedStates[sortedStates.length - 2].metricValue}, 3) ${sortedStates[sortedStates.length - 1].name} ${sortedStates[sortedStates.length - 1].metricValue}`,
                    ]
                  : sortedStates.length > 0
                    ? [`States: ${sortedStates.map((s) => `${s.rank}) ${s.name} ${s.metricValue}`).join(", ")}`]
                    : []),
                `More: ${meta.canonicalUrl?.startsWith("http") ? meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}`,
              ]}
            />
          </Section>
          <Section title="Chart">
            {enabled && sortedStates.length > 0 ? (
              <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                <MiniBarChart
                  rows={sortedStates.slice(0, 10).map((s) => ({
                    label: s.name || s.slug,
                    value: s.metricValue,
                  }))}
                  width={720}
                  height={240}
                  title={`Top 10: ${page.meta.title}`}
                  subtitle={`Rank 1–10 by ${metricId ?? "metric"}`}
                  formatValue={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(2))}
                />
                <div style={{ marginTop: 16 }}>
                  <Sparkline
                    points={sortedStates.slice(0, 10).map((s) => s.metricValue)}
                    width={240}
                    height={48}
                    title={`Trend: ${page.meta.title} top 10`}
                    subtitle="Values 1–10"
                    formatValue={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(2))}
                  />
                </div>
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Chart unavailable: {enabled ? "No data." : "History required."}
              </p>
            )}
          </Section>
          <RankingDetailClient
            sortedStates={sortedStates}
            excludedStates={(page.data as { excludedStates?: { count?: number; reason?: string } }).excludedStates}
            pageId={id}
            enabled={enabled}
            windowYears={windowYears}
            metricLabel={
              id === "price-trend"
                ? "Annualized Price Growth (%)"
                : id === "momentum-signal"
                  ? "Momentum Score"
                  : id === "electricity-inflation-1y"
                    ? "1-Year Inflation (%)"
                    : id === "electricity-inflation-5y"
                      ? "5-Year Inflation (%)"
                      : id === "electricity-affordability"
                        ? "Est. Monthly Bill (900 kWh)"
                        : id === "most-expensive-electricity"
                          ? "Est. Monthly Bill (900 kWh)"
                          : undefined
            }
          />
          <Section title="JSON preview" defaultCollapsed collapseSummary="Show JSON">
          <JsonPreview
            jsonUrl={page.meta.jsonUrl}
            jsonPreview={JSON.stringify({ meta: page.meta, data: page.data }, null, 2)}
            copyValue={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/rankings/${id}.json`}
          />
          </Section>
          {(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs && (
            <Disclaimers
              disclaimerRefs={(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs ?? []}
            />
          )}
          <ExploreMore
            title="Explore more"
            links={[
              { href: "/knowledge", label: "Knowledge hub" },
              { href: "/electricity-insights", label: "Electricity insights" },
              { href: "/electricity-trends", label: "Electricity trends" },
              { href: "/datasets/electricity-rankings", label: "Electricity rankings dataset" },
              { href: "/methodology", label: "Methodology" },
            ]}
          />
          <RecommendedNext entityId={page.meta.id} relatedMap={relatedMap?.byEntity ?? null} />
        </div>
        <div>
          <RelatedEntitiesSidebar
            states={refs.states}
            rankings={refs.rankings}
            methodologies={refs.methodologies}
          />
        </div>
      </div>
      <StatusFooter release={release} />
    </main>
    </>
  );
}
