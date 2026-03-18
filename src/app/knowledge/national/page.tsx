import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  loadEntityIndex,
  loadLeaderboards,
  loadRelatedIndex,
  loadCompareStates,
  loadInsights,
  resolveEntityRefs,
} from "@/lib/knowledge/loadKnowledgePage";
import { getGlossaryMap } from "@/lib/knowledge/glossary";
import { getGlossary, getRelease } from "@/lib/knowledge/fetch";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import FreshnessBox from "@/app/components/knowledge/FreshnessBox";
import KeyStatsGrid from "@/app/components/knowledge/KeyStatsGrid";
import MetricCard from "@/components/knowledge/MetricCard";
import BulletBar from "@/components/knowledge/BulletBar";
import JsonPreview from "@/app/components/knowledge/JsonPreview";
import ChangeHighlights from "@/app/components/knowledge/ChangeHighlights";
import RelatedEntitiesSidebar from "@/app/components/knowledge/RelatedEntitiesSidebar";
import LeaderboardsSection from "@/app/components/knowledge/LeaderboardsSection";
import Disclaimers from "@/app/components/policy/Disclaimers";
import Section from "@/components/common/Section";
import ShareBar from "@/components/common/ShareBar";
import StatusFooter from "@/components/common/StatusFooter";
import RecommendedNext from "@/components/knowledge/RecommendedNext";
import SummarySnippet from "@/components/knowledge/SummarySnippet";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { t } from "@/lib/knowledge/labels";
import { buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadKnowledgePage("national", "national");
  if (!page) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: "/knowledge/national",
    });
  }
  const meta = page.meta as { excerpt?: string; description: string; canonicalUrl?: string };
  const description = meta.excerpt ?? meta.description ?? "US electricity rates overview and national metrics.";
  const canonicalPath = (meta.canonicalUrl ?? "/knowledge/national").replace(/^https?:\/\/[^/]+/, "") || "/knowledge/national";
  return buildMetadata({
    title: "US Electricity Rates Overview | PriceOfElectricity.com",
    description,
    canonicalPath,
  });
}

export default async function KnowledgeNationalPage() {
  const [page, entityIndex, leaderboards, glossary, release, relatedMap, compareData, insights] = await Promise.all([
    loadKnowledgePage("national", "national"),
    loadEntityIndex(),
    loadLeaderboards(),
    getGlossary(),
    getRelease(),
    loadRelatedIndex(),
    loadCompareStates(),
    loadInsights("national", "national"),
  ]);
  const glossaryMap = getGlossaryMap(glossary);

  if (!page) notFound();

  const canonicalPath = (page.meta.canonicalUrl ?? "/knowledge/national").replace(/^https?:\/\/[^/]+/, "") || "/knowledge/national";
  const webPageJsonLd = buildWebPageJsonLd({
    title: page.meta.title,
    description: (page.meta as { excerpt?: string }).excerpt ?? page.meta.description ?? "US electricity rates overview and national metrics.",
    url: canonicalPath,
    dateModified: (page.meta.freshness as { computedAt?: string })?.computedAt ?? (page.meta as { updatedAt?: string }).updatedAt,
    isPartOf: "/",
    about: ["United States electricity rates", "residential electricity prices"],
  });

  const relatedEntities = (page.data.relatedEntities as {
    states?: string[];
    rankings?: string[];
    methodologies?: string[];
  }) ?? {};
  const refs = resolveEntityRefs(entityIndex, relatedEntities);

  const derived = page.data.derived as Record<string, unknown>;
  const trends = derived.trends as { avgRateCentsPerKwh?: { values?: number[] } } | undefined;
  const avgRateTrendValues = trends?.avgRateCentsPerKwh?.values;
  const disp = derived.dispersionMetrics as Record<string, unknown> | undefined;
  const highestState = derived.highestState as { slug?: string; name?: string; rate?: number } | undefined;
  const lowestState = derived.lowestState as { slug?: string; name?: string; rate?: number } | undefined;
  const avgRate = derived.averageRate as number | undefined;
  const medianRate = derived.medianRate as number | undefined;
  const freshnessStatus = derived.freshnessStatus as string | undefined;

  return (
    <>
      <JsonLdScript data={webPageJsonLd} />
      <main className="container">
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "National" },
        ]}
        title={page.meta.title}
        jsonUrl={page.meta.jsonUrl}
        canonicalUrl={page.meta.canonicalUrl?.startsWith("http") ? page.meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        qualityScore={(page.meta as { qualityScore?: number }).qualityScore}
        freshnessStatus={page.meta.freshness?.status}
        ageDays={page.meta.freshness?.ageDays}
        sourceVersion={(page.meta as { sourceVersion?: string }).sourceVersion}
        semanticCluster={(page.meta as { llmHints?: { semanticCluster?: string } }).llmHints?.semanticCluster}
      />

      <ShareBar
        canonicalUrl={page.meta.canonicalUrl?.startsWith("http") ? page.meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        jsonUrl={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/national.json`}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32 }}>
        <div>
          <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>
            {page.meta.description}
          </p>
          {page.meta.freshness && (
            <FreshnessBox freshness={page.meta.freshness} />
          )}
          {page.meta.changeSummary && (
            <ChangeHighlights
              changeSummary={page.meta.changeSummary}
              data={page.data as Record<string, unknown>}
            />
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
          {compareData?.states && compareData.states.length > 0 && typeof avgRate === "number" && (() => {
            const rates = compareData.states
              .map((s) => s.metrics.avgRateCentsPerKwh)
              .filter((v): v is number => typeof v === "number");
            const minR = Math.min(...rates);
            const maxR = Math.max(...rates);
            if (maxR <= minR) return null;
            return (
              <Section title="National rate in context" subtitle="US average and median within state range.">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <BulletBar
                    value={avgRate}
                    min={minR}
                    max={maxR}
                    labelLeft="Lowest state"
                    labelRight="Highest state"
                    format={(n) => `${n.toFixed(2)} ¢/kWh`}
                  />
                  {typeof medianRate === "number" && (
                    <BulletBar
                      value={medianRate}
                      min={minR}
                      max={maxR}
                      labelLeft="Lowest state"
                      labelRight="Highest state"
                      format={(n) => `${n.toFixed(2)} ¢/kWh (median)`}
                    />
                  )}
                </div>
              </Section>
            );
          })()}
          <Section title="Key Metrics">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 16,
              }}
            >
              <MetricCard
                label={t("field.avgRateCentsPerKwh")}
                value={typeof avgRate === "number" ? avgRate : "—"}
                unit="¢/kWh"
                glossaryMap={glossaryMap}
                fieldId="avgRateCentsPerKwh"
                sparklineValues={Array.isArray(avgRateTrendValues) ? avgRateTrendValues : undefined}
              />
              {typeof medianRate === "number" && (
                <MetricCard
                  label={t("field.medianRateCentsPerKwh")}
                  value={medianRate}
                  unit="¢/kWh"
                  glossaryMap={glossaryMap}
                />
              )}
              {highestState && typeof highestState.rate === "number" && (
                <MetricCard
                  label="Highest rate"
                  value={highestState.rate}
                  unit="¢/kWh"
                  description={highestState.name ?? highestState.slug}
                  glossaryMap={glossaryMap}
                />
              )}
              {lowestState && typeof lowestState.rate === "number" && (
                <MetricCard
                  label="Lowest rate"
                  value={lowestState.rate}
                  unit="¢/kWh"
                  description={lowestState.name ?? lowestState.slug}
                  glossaryMap={glossaryMap}
                />
              )}
              <MetricCard
                label={t("section.freshness")}
                value={freshnessStatus ? t(`status.${freshnessStatus}`) : "—"}
                glossaryMap={glossaryMap}
                fieldId="freshnessStatus"
              />
            </div>
          </Section>
          <Section title="Summary">
            <SummarySnippet
              title="Shareable summary"
              lines={[
                ...(typeof avgRate === "number"
                  ? [`US average residential rate: ${avgRate} ¢/kWh`]
                  : []),
                ...(highestState && lowestState && typeof highestState.rate === "number" && typeof lowestState.rate === "number"
                  ? [
                      `Highest: ${highestState.name ?? highestState.slug} ${highestState.rate} ¢/kWh | Lowest: ${lowestState.name ?? lowestState.slug} ${lowestState.rate} ¢/kWh`,
                    ]
                  : []),
                ...(freshnessStatus
                  ? (() => {
                      const dt =
                        (page.meta.freshness as { computedAt?: string })?.computedAt ??
                        (page.meta as { updatedAt?: string }).updatedAt;
                      const dateStr = typeof dt === "string" ? dt.slice(0, 10) : "—";
                      return [`Freshness: ${t(`status.${freshnessStatus}`)} (as of ${dateStr})`];
                    })()
                  : []),
                `More: ${page.meta.canonicalUrl?.startsWith("http") ? page.meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}`,
              ]}
            />
          </Section>
          <LeaderboardsSection data={leaderboards} />
          <Section title="All fields" subtitle="Field-level stats and dispersion.">
          <KeyStatsGrid
            stats={[
              { label: t("field.avgRateCentsPerKwh"), value: derived.averageRate, fieldId: "avgRateCentsPerKwh" },
              { label: t("field.medianRateCentsPerKwh"), value: derived.medianRate },
              ...(disp
                ? [
                    {
                      label: t("field.dispersionMinMax"),
                      value: `${disp.min} – ${disp.max} (spread: ${disp.spread})`,
                    },
                  ]
                : []),
            ]}
            glossaryMap={glossaryMap}
          />
          </Section>
          <Section title="JSON preview" defaultCollapsed collapseSummary="Show JSON">
          <JsonPreview
            jsonUrl={page.meta.jsonUrl}
            copyValue={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/national.json`}
          />
          </Section>
          {(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs && (
            <Disclaimers
              disclaimerRefs={(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs ?? []}
            />
          )}
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
