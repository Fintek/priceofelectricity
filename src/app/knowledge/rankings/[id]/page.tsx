import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  resolveEntityRefs,
} from "@/lib/knowledge/loadKnowledgePage";
import { getGlossaryMap } from "@/lib/knowledge/glossary";
import {
  getEntityIndex,
  getGlossary,
  getRankingInsights,
  getRankingsIndex,
  getRelatedIndex,
  getRelease,
} from "@/lib/knowledge/fetch";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import RankingHeader from "@/components/knowledge/RankingHeader";
import RankingDetailClient from "./RankingDetailClient";
import MiniBarChart from "@/components/charts/MiniBarChart";
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
import { emitRouteRuntimeProfile, elapsedMs, startRuntimeTimer } from "@/lib/telemetry/runtime";
import { buildRankingChartModel } from "@/lib/knowledge/rankingCharts";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 86400;
const RANKINGS_INDEX_ITEM_BY_ID_PROMISE = getRankingsIndex().then((index) => {
  const byId = new Map<string, NonNullable<typeof index>["items"][number]>();
  for (const item of index?.items ?? []) {
    byId.set(item.id, item);
  }
  return byId;
});
type KnowledgeRankingsSharedData = {
  entityIndex: Awaited<ReturnType<typeof getEntityIndex>>;
  glossary: Awaited<ReturnType<typeof getGlossary>>;
  release: Awaited<ReturnType<typeof getRelease>>;
  relatedMap: Awaited<ReturnType<typeof getRelatedIndex>>;
};
let memoizedKnowledgeRankingsSharedDataPromise: Promise<KnowledgeRankingsSharedData> | null = null;

function getMemoizedKnowledgeRankingsSharedData(): Promise<KnowledgeRankingsSharedData> {
  if (!memoizedKnowledgeRankingsSharedDataPromise) {
    memoizedKnowledgeRankingsSharedDataPromise = Promise.all([
      getEntityIndex(),
      getGlossary(),
      getRelease(),
      getRelatedIndex(),
    ])
      .then(([entityIndex, glossary, release, relatedMap]) => ({
        entityIndex,
        glossary,
        release,
        relatedMap,
      }))
      .catch((error) => {
        memoizedKnowledgeRankingsSharedDataPromise = null;
        throw error;
      });
  }
  return memoizedKnowledgeRankingsSharedDataPromise;
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
  const startedAt = startRuntimeTimer();
  const { id } = await params;
  try {
    const [page, rankingsIndexById, insights, sharedData] = await Promise.all([
      loadKnowledgePage("rankings", id, { routeId: "knowledge/rankings/[id]" }),
      RANKINGS_INDEX_ITEM_BY_ID_PROMISE,
      getRankingInsights(id),
      getMemoizedKnowledgeRankingsSharedData(),
    ]);
  const { entityIndex, glossary, release, relatedMap } = sharedData;

  if (!page) notFound();

  const indexItem = rankingsIndexById.get(id);
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
  const chartModel = buildRankingChartModel(id, sortedStates);

    return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd]} />
      <main className="container">
      <style>{`
        figure svg[aria-label^="Trend:"][width="240"][height="48"] {
          display: none !important;
        }
        figure svg[aria-label^="Trend:"][width="240"][height="48"] + figcaption {
          display: none !important;
        }
      `}</style>
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
                  rows={chartModel.barRows}
                  width={720}
                  height={240}
                  title={`Top 10: ${page.meta.title}`}
                  subtitle={`Rank 1–10 by ${metricId ?? "metric"}`}
                  formatValue={(v) => (Number.isInteger(v) ? String(v) : v.toFixed(2))}
                />
                <p className="muted" style={{ margin: "12px 0 0 0", fontSize: 13 }}>
                  This chart shows ranked values only. No time-trend line is shown for ranking-position data.
                </p>
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
  } finally {
    emitRouteRuntimeProfile({
      routeId: "knowledge/rankings/[id]",
      phase: "render",
      durationMs: elapsedMs(startedAt),
      artifactCount: 7,
    });
  }
}
