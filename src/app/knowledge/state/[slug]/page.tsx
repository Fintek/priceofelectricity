import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  resolveEntityRefs,
} from "@/lib/knowledge/loadKnowledgePage";
import { getGlossaryMap } from "@/lib/knowledge/glossary";
import {
  getCompareStates,
  getEntityIndex,
  getGlossary,
  getOffersConfig,
  getOffersIndex,
  getRelatedIndex,
  getRelease,
  getStateInsights,
} from "@/lib/knowledge/fetch";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import FreshnessBox from "@/app/components/knowledge/FreshnessBox";
import KeyStatsGrid from "@/app/components/knowledge/KeyStatsGrid";
import MetricCard from "@/components/knowledge/MetricCard";
import BulletBar from "@/components/knowledge/BulletBar";
import Sparkline from "@/components/charts/Sparkline";
import MiniBarChart from "@/components/charts/MiniBarChart";
import JsonPreview from "@/app/components/knowledge/JsonPreview";
import ChangeHighlights from "@/app/components/knowledge/ChangeHighlights";
import RelatedEntitiesSidebar from "@/app/components/knowledge/RelatedEntitiesSidebar";
import OffersSection from "@/app/components/knowledge/OffersSection";
import Disclaimers from "@/app/components/policy/Disclaimers";
import Section from "@/components/common/Section";
import ShareBar from "@/components/common/ShareBar";
import StatusFooter from "@/components/common/StatusFooter";
import RecommendedNext from "@/components/knowledge/RecommendedNext";
import ExploreMore from "@/components/navigation/ExploreMore";
import SummarySnippet from "@/components/knowledge/SummarySnippet";
import { SITE_URL, formatPublicReviewDate } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { t } from "@/lib/knowledge/labels";
import { compareSnapshots, getSnapshotVersions } from "@/lib/snapshotLoader";
import { buildWebPageJsonLd, buildDatasetJsonLd, buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import { emitRouteRuntimeProfile, elapsedMs, startRuntimeTimer } from "@/lib/telemetry/runtime";

const BASE_URL = SITE_URL;
export const dynamicParams = true;
export const revalidate = 86400;
const SNAPSHOT_VERSIONS = getSnapshotVersions();
const SNAPSHOT_BASE_VERSION =
  SNAPSHOT_VERSIONS.length >= 2 ? SNAPSHOT_VERSIONS[SNAPSHOT_VERSIONS.length - 2] : null;
const SNAPSHOT_LATEST_VERSION =
  SNAPSHOT_VERSIONS.length >= 2 ? SNAPSHOT_VERSIONS[SNAPSHOT_VERSIONS.length - 1] : null;
const LATEST_SNAPSHOT_DELTAS_BY_SLUG =
  SNAPSHOT_BASE_VERSION && SNAPSHOT_LATEST_VERSION
    ? new Map(
        (compareSnapshots(SNAPSHOT_BASE_VERSION, SNAPSHOT_LATEST_VERSION) ?? []).map((delta) => [
          delta.slug,
          delta,
        ]),
      )
    : null;
type KnowledgeStateSharedData = {
  entityIndex: Awaited<ReturnType<typeof getEntityIndex>>;
  offersIndex: Awaited<ReturnType<typeof getOffersIndex>>;
  offersConfig: Awaited<ReturnType<typeof getOffersConfig>>;
  glossary: Awaited<ReturnType<typeof getGlossary>>;
  release: Awaited<ReturnType<typeof getRelease>>;
  relatedMap: Awaited<ReturnType<typeof getRelatedIndex>>;
  compareData: Awaited<ReturnType<typeof getCompareStates>>;
};
let memoizedKnowledgeStateSharedDataPromise: Promise<KnowledgeStateSharedData> | null = null;

function getMemoizedKnowledgeStateSharedData(): Promise<KnowledgeStateSharedData> {
  if (!memoizedKnowledgeStateSharedDataPromise) {
    memoizedKnowledgeStateSharedDataPromise = Promise.all([
      getEntityIndex(),
      getOffersIndex(),
      getOffersConfig(),
      getGlossary(),
      getRelease(),
      getRelatedIndex(),
      getCompareStates(),
    ])
      .then(([entityIndex, offersIndex, offersConfig, glossary, release, relatedMap, compareData]) => ({
        entityIndex,
        offersIndex,
        offersConfig,
        glossary,
        release,
        relatedMap,
        compareData,
      }))
      .catch((error) => {
        memoizedKnowledgeStateSharedDataPromise = null;
        throw error;
      });
  }
  return memoizedKnowledgeStateSharedDataPromise;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadKnowledgePage("state", slug);
  if (!page) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/knowledge/state/${slug}`,
    });
  }
  const raw = page.data?.raw as { name?: string } | undefined;
  const meta = page.meta as { excerpt?: string; description: string; canonicalUrl?: string };
  const stateName = raw?.name ?? slug;
  const title = `${stateName} Electricity Rates & Metrics | PriceOfElectricity.com`;
  const description = meta.excerpt ?? meta.description ?? `${stateName} electricity rates and value metrics.`;
  const canonicalPath = (meta.canonicalUrl ?? `/knowledge/state/${slug}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/state/${slug}`;
  return buildMetadata({ title, description, canonicalPath });
}

export default async function KnowledgeStatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const startedAt = startRuntimeTimer();
  const { slug } = await params;
  try {
    const [page, insights, sharedData] = await Promise.all([
      loadKnowledgePage("state", slug, { routeId: "knowledge/state/[slug]" }),
      getStateInsights(slug),
      getMemoizedKnowledgeStateSharedData(),
    ]);
  const { entityIndex, offersIndex, offersConfig, glossary, release, relatedMap, compareData } = sharedData;
  const glossaryMap = getGlossaryMap(glossary);

  if (!page) notFound();

  const raw = page.data.raw as Record<string, unknown>;
  const stateName = String(raw?.name ?? slug);
  const canonicalPath = (page.meta.canonicalUrl ?? `/knowledge/state/${slug}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/state/${slug}`;
  const jsonUrlPath = (page.meta.jsonUrl ?? `/knowledge/state/${slug}.json`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/state/${slug}.json`;

  const webPageJsonLd = buildWebPageJsonLd({
    title: page.meta.title,
    description: (page.meta as { excerpt?: string }).excerpt ?? page.meta.description ?? `${stateName} electricity rates and value metrics.`,
    url: canonicalPath,
    dateModified: (page.meta.freshness as { computedAt?: string })?.computedAt ?? (page.meta as { updatedAt?: string }).updatedAt,
    isPartOf: "/",
    about: [`${stateName} electricity rates`],
  });

  const provenance = (page.meta as { provenance?: Array<{ publisher?: string; sourceUrl?: string }> }).provenance ?? [];
  const firstProvenance = provenance[0];
  const datasetJsonLd = buildDatasetJsonLd({
    name: `${stateName} electricity prices`,
    description: (page.meta as { excerpt?: string }).excerpt ?? page.meta.description ?? `${stateName} electricity rates and metrics.`,
    url: canonicalPath,
    dateModified: (page.meta.freshness as { computedAt?: string })?.computedAt ?? (page.meta as { updatedAt?: string }).updatedAt,
    publisher: firstProvenance?.publisher ?? "PriceOfElectricity.com",
    distribution: [{ contentUrl: jsonUrlPath, encodingFormat: "application/json" }],
  });

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Knowledge", url: "/knowledge" },
    { name: "State", url: "/knowledge/pages" },
    { name: stateName, url: canonicalPath },
  ]);

  const offersRef = page.data.offersRef as { offersIndexUrl?: string; offersConfigUrl?: string; enabled?: boolean } | undefined;
  const allowOutbound = offersConfig?.offers?.allowOutboundLinks === true;
  const offersEnabled = offersIndex?.enabled === true && offersRef?.enabled === true;
  const shouldShowOffers =
    allowOutbound &&
    offersEnabled &&
    Array.isArray(offersIndex?.states);
  const stateOffersEntry = shouldShowOffers
    ? offersIndex!.states.find((s) => s.slug === slug)
    : null;
  const enabledOffers =
    stateOffersEntry?.offers?.filter(
      (o) => o.enabled === true && typeof o.url === "string" && o.url.length > 0,
    ) ?? [];

  const relatedEntities = (page.data.relatedEntities as {
    states?: string[];
    rankings?: string[];
    methodologies?: string[];
    national?: boolean;
  }) ?? {};
  const refs = resolveEntityRefs(entityIndex, relatedEntities);

  const derived = page.data.derived as Record<string, unknown>;
  const trends = derived.trends as { avgRateCentsPerKwh?: { values?: number[] } } | undefined;
  const avgRateTrendValues = trends?.avgRateCentsPerKwh?.values;
  const trendPoints = Array.isArray(avgRateTrendValues)
    ? avgRateTrendValues.slice(-60).slice(-24)
    : [];
  const hasTrendHistory = trendPoints.length > 0;

  const exampleBill1000 = (derived.exampleBills as { kwh1000?: number } | undefined)?.kwh1000;
  const avgRate = raw.avgRateCentsPerKwh as number | undefined;
  const MONTHLY_USAGE_KWH = 900;
  const benchmarkMonthlyBill =
    typeof avgRate === "number"
      ? Number(((avgRate * MONTHLY_USAGE_KWH) / 100).toFixed(2))
      : null;
  const valueScore = derived.valueScore as number | undefined;
  const affordabilityIndex = derived.affordabilityIndex as number | undefined;

  let rateMin = 0;
  let rateMax = 50;
  let valueScoreMin = 0;
  let valueScoreMax = 100;
  let affordabilityMin = 0;
  let affordabilityMax = 100;
  if (compareData?.states && compareData.states.length > 0) {
    const rates = compareData.states
      .map((s) => s.metrics.avgRateCentsPerKwh)
      .filter((v): v is number => typeof v === "number");
    const scores = compareData.states
      .map((s) => s.metrics.valueScore)
      .filter((v): v is number => typeof v === "number");
    const aff = compareData.states
      .map((s) => s.metrics.affordabilityIndex)
      .filter((v): v is number => typeof v === "number");
    if (rates.length > 0) {
      rateMin = Math.min(...rates);
      rateMax = Math.max(...rates);
    }
    if (scores.length > 0) {
      valueScoreMin = Math.min(...scores);
      valueScoreMax = Math.max(...scores);
    }
    if (aff.length > 0) {
      affordabilityMin = Math.min(...aff);
      affordabilityMax = Math.max(...aff);
    }
  }
  let rateTrend: "up" | "down" | "flat" | null = null;
  let rateTrendLabel: string | undefined;
  if (LATEST_SNAPSHOT_DELTAS_BY_SLUG && SNAPSHOT_BASE_VERSION && typeof avgRate === "number") {
    const stateDelta = LATEST_SNAPSHOT_DELTAS_BY_SLUG.get(slug);
    if (stateDelta) {
      if (stateDelta.delta > 0) rateTrend = "up";
      else if (stateDelta.delta < 0) rateTrend = "down";
      else rateTrend = "flat";
      rateTrendLabel = `vs ${SNAPSHOT_BASE_VERSION}`;
    }
  }

    return (
    <>
      <JsonLdScript data={[breadcrumbJsonLd, webPageJsonLd, datasetJsonLd]} />
      <main className="container">
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "State", href: "/knowledge/pages" },
          { label: String(raw.name ?? slug) },
        ]}
        title={page.meta.title}
        jsonUrl={page.meta.jsonUrl}
        canonicalUrl={page.meta.canonicalUrl?.startsWith("http") ? page.meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        qualityScore={(page.meta as { qualityScore?: number }).qualityScore}
        freshnessStatus={page.meta.freshness?.status}
        ageDays={page.meta.freshness?.ageDays}
        sourceVersion={(page.meta as { sourceVersion?: string }).sourceVersion}
        semanticCluster={(page.meta as { llmHints?: { semanticCluster?: string } }).llmHints?.semanticCluster}
        methodologyLink
      />

      <ShareBar
        canonicalUrl={page.meta.canonicalUrl?.startsWith("http") ? page.meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        jsonUrl={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}${jsonUrlPath}`}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32 }}>
        <div>
          <p className="muted" style={{ marginTop: 0, marginBottom: 24 }}>
            {page.meta.description}
          </p>
          {((): React.ReactNode => {
            const ref = page.data.regionRef as { id?: string; name?: string; href?: string } | undefined;
            if (!ref || !ref.name || !ref.href) return null;
            return (
              <p style={{ marginBottom: 24, fontSize: 14 }}>
                Region: <Link href={ref.href}>{ref.name}</Link>
              </p>
            );
          })()}
          {page.meta.freshness && (
            <FreshnessBox freshness={page.meta.freshness} />
          )}
          {page.meta.changeSummary && (
            <ChangeHighlights
              changeSummary={page.meta.changeSummary}
              data={page.data as Record<string, unknown>}
            />
          )}
          {((): React.ReactNode => {
            const comp = derived.comparison as { nationalAverage: number; differenceCents: number; differencePercent: number; category: string } | undefined;
            if (!comp || typeof comp.nationalAverage !== "number" || typeof comp.differencePercent !== "number") return null;
            const pct = comp.differencePercent;
            const dir = pct > 0 ? "more" : pct < 0 ? "less" : "same";
            const pctStr = Math.abs(pct).toFixed(1);
            const summary =
              comp.category === "rate data unavailable"
                ? null
                : pct === 0
                  ? `Electricity in ${stateName} is close to the national average.`
                  : `Electricity in ${stateName} costs ${pctStr}% ${dir} than the national average.`;
            return (
              <Section title="How This State Compares" subtitle="State rate vs U.S. national average.">
                {summary && (
                  <p style={{ margin: "0 0 16px 0", fontSize: 16 }}>
                    {summary}
                  </p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: 8, backgroundColor: "var(--color-surface-alt)" }}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>State rate</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{typeof avgRate === "number" ? `${avgRate.toFixed(2)} ¢/kWh` : "—"}</div>
                  </div>
                  <div style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: 8, backgroundColor: "var(--color-surface-alt)" }}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>National average</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{comp.nationalAverage.toFixed(2)} ¢/kWh</div>
                  </div>
                </div>
                {comp.category !== "rate data unavailable" && (
                  <>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                      <span><strong>Difference:</strong> {comp.differenceCents >= 0 ? "+" : ""}{comp.differenceCents.toFixed(2)} ¢/kWh</span>
                      <span><strong>Difference:</strong> {comp.differencePercent >= 0 ? "+" : ""}{comp.differencePercent.toFixed(1)}%</span>
                      <span><strong>Category:</strong> {comp.category}</span>
                    </div>
                    <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                      <MiniBarChart
                        rows={[
                          { label: stateName, value: typeof avgRate === "number" ? avgRate : 0 },
                          { label: "U.S. average", value: comp.nationalAverage },
                        ]}
                        minValue={0}
                        width={320}
                        height={80}
                        title={`${stateName} vs U.S. average`}
                        subtitle="¢/kWh"
                        formatValue={(v) => `${v.toFixed(2)} ¢/kWh`}
                      />
                    </div>
                  </>
                )}
              </Section>
            );
          })()}
          {insights?.insights && insights.insights.length > 0 && (
            <Section title="Key Insights">
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                {insights.insights.map((i, idx) => (
                  <li key={idx}>{i.statement}</li>
                ))}
              </ul>
            </Section>
          )}
          <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 14 }}>
            Looking for a consumer-friendly cost estimate?{" "}
            <Link href={`/electricity-cost/${slug}`}>See Electricity Cost in {stateName}</Link>.
          </p>
          <Section title="Rate trend" subtitle={hasTrendHistory ? (trendPoints.length >= 24 ? "Trend (last 24 months)" : "Trend (available history)") : undefined}>
            {hasTrendHistory ? (
              <div style={{ overflowX: "auto", maxWidth: "100%" }}>
                <Sparkline
                  points={trendPoints}
                  width={240}
                  height={48}
                  title={`${stateName} avg rate trend`}
                  subtitle={trendPoints.length >= 24 ? "Last 24 months" : "Available history"}
                  formatValue={(v) => `${v.toFixed(2)} ¢/kWh`}
                />
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Trend chart unavailable: History unavailable.
              </p>
            )}
          </Section>
          {((): React.ReactNode => {
            const momentum = derived.momentum as {
              enabled?: boolean;
              signal?: string;
              shortWindowChangePercent?: number | null;
              longWindowChangePercent?: number | null;
            } | undefined;
            if (!momentum) return null;
            const enabled = momentum.enabled === true && momentum.signal && momentum.signal !== "unavailable";
            const shortPct = momentum.shortWindowChangePercent;
            const longPct = momentum.longWindowChangePercent;
            const signalLabel = momentum.signal ? momentum.signal.charAt(0).toUpperCase() + momentum.signal.slice(1) : "";
            const explanation = enabled
              ? momentum.signal === "stable"
                ? `${stateName} appears stable based on recent electricity price changes.`
                : `${stateName} shows ${momentum.signal === "accelerating" ? "an" : "a"} ${signalLabel.toLowerCase()} electricity price trend based on recent historical changes.`
              : "Momentum signal unavailable due to limited history.";
            return (
              <Section title="Momentum Signal" subtitle="Directional historical signal, not a forecast.">
                <p style={{ margin: "0 0 12px 0", fontSize: 15 }}>
                  {explanation}
                </p>
                {enabled && (
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14 }}>
                    <span><strong>Signal:</strong> {signalLabel}</span>
                    {typeof shortPct === "number" && <span><strong>12‑month change:</strong> {shortPct >= 0 ? "+" : ""}{shortPct.toFixed(2)}%</span>}
                    {typeof longPct === "number" && <span><strong>24‑month change:</strong> {longPct >= 0 ? "+" : ""}{longPct.toFixed(2)}%</span>}
                  </div>
                )}
              </Section>
            );
          })()}
          {compareData?.states && compareData.states.length > 0 && (typeof avgRate === "number" || typeof valueScore === "number" || typeof affordabilityIndex === "number") && (
            <Section title="Where this state sits" subtitle="Position relative to all states.">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {typeof avgRate === "number" && rateMax > rateMin && (
                  <div>
                    <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{t("field.avgRateCentsPerKwh")}</div>
                    <BulletBar
                      value={avgRate}
                      min={rateMin}
                      max={rateMax}
                      labelLeft="Lowest"
                      labelRight="Highest"
                      format={(n) => `${n} ¢/kWh`}
                    />
                  </div>
                )}
                {typeof valueScore === "number" && valueScoreMax > valueScoreMin && (
                  <div>
                    <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{t("field.valueScore")}</div>
                    <BulletBar
                      value={valueScore}
                      min={valueScoreMin}
                      max={valueScoreMax}
                      labelLeft="Lowest"
                      labelRight="Highest"
                    />
                  </div>
                )}
                {typeof affordabilityIndex === "number" && affordabilityMax > affordabilityMin && (
                  <div>
                    <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>{t("field.affordabilityIndex")}</div>
                    <BulletBar
                      value={affordabilityIndex}
                      min={affordabilityMin}
                      max={affordabilityMax}
                      labelLeft="Lowest"
                      labelRight="Highest"
                    />
                  </div>
                )}
              </div>
            </Section>
          )}
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
                trend={rateTrend}
                trendLabel={rateTrendLabel}
                glossaryMap={glossaryMap}
                fieldId="avgRateCentsPerKwh"
                sparklineValues={Array.isArray(avgRateTrendValues) ? avgRateTrendValues : undefined}
              />
              <MetricCard
                label={t("field.benchmarkMonthlyBill900kwh")}
                value={benchmarkMonthlyBill ?? "—"}
                unit="$"
                glossaryMap={glossaryMap}
                fieldId="benchmarkMonthlyBill900kwh"
              />
              <MetricCard
                label={t("field.exampleBill1000kwh")}
                value={typeof exampleBill1000 === "number" ? exampleBill1000 : "—"}
                unit="$"
                glossaryMap={glossaryMap}
                fieldId="exampleBill1000kwh"
              />
              <MetricCard
                label={t("field.valueScore")}
                value={typeof derived.valueScore === "number" || typeof derived.valueScore === "string" ? derived.valueScore : "—"}
                glossaryMap={glossaryMap}
                fieldId="valueScore"
              />
              <MetricCard
                label={t("field.affordabilityIndex")}
                value={typeof derived.affordabilityIndex === "number" || typeof derived.affordabilityIndex === "string" ? derived.affordabilityIndex : "—"}
                glossaryMap={glossaryMap}
                fieldId="affordabilityIndex"
              />
              <MetricCard
                label={t("section.freshness")}
                value={derived.freshnessStatus ? t(`status.${String(derived.freshnessStatus)}`) : "—"}
                glossaryMap={glossaryMap}
                fieldId="freshnessStatus"
              />
            </div>
          </Section>
          {(() => {
            const compareLinks = page.data.compareLinks as Array<{ pairSlug: string; title: string; url: string }> | undefined;
            if (!Array.isArray(compareLinks) || compareLinks.length === 0) return null;
            return (
              <Section title="Compare with other states" subtitle="Direct state-to-state electricity cost comparisons.">
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                  {compareLinks.map((link) => (
                    <li key={link.pairSlug}>
                      <Link href={link.url}>{link.title}</Link>
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })()}
          <Section title="Summary">
            <SummarySnippet
              title="Shareable summary"
              lines={[
                ...(typeof avgRate === "number"
                  ? [`${stateName} electricity: ${avgRate} ¢/kWh`]
                  : []),
                ...(typeof benchmarkMonthlyBill === "number"
                  ? [`Benchmark bill (900 kWh): $${benchmarkMonthlyBill}`]
                  : []),
                ...(typeof exampleBill1000 === "number"
                  ? [`Example bill (1000 kWh): $${exampleBill1000}`]
                  : []),
                ...(derived.valueScore != null || derived.affordabilityIndex != null
                  ? [
                      `Value score: ${derived.valueScore ?? "—"} | Affordability: ${derived.affordabilityIndex ?? "—"}`,
                    ]
                  : []),
                ...(derived.freshnessStatus
                  ? (() => {
                      const dt =
                        (page.meta.freshness as { computedAt?: string })?.computedAt ??
                        (page.meta as { updatedAt?: string }).updatedAt;
                      const dateStr = typeof dt === "string" ? formatPublicReviewDate(dt) : "—";
                      return [
                        `Freshness: ${t(`status.${String(derived.freshnessStatus)}`)} (as of ${dateStr})`,
                      ];
                    })()
                  : []),
                `More: ${page.meta.canonicalUrl?.startsWith("http") ? page.meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}`,
              ]}
            />
          </Section>
          {enabledOffers.length > 0 && (
            <OffersSection
              offers={enabledOffers.map((o) => ({
                id: o.id,
                title: o.title,
                description: o.description,
                url: o.url,
                enabled: o.enabled,
              }))}
              disclaimer={offersIndex!.disclaimer}
            />
          )}
          <Section title="All fields" subtitle="Field-level stats and metadata.">
          <KeyStatsGrid
            stats={[
              { label: t("field.avgRateCentsPerKwh"), value: raw.avgRateCentsPerKwh, fieldId: "avgRateCentsPerKwh" },
              { label: t("field.updated"), value: raw.updated },
              { label: t("field.valueScore"), value: derived.valueScore, fieldId: "valueScore" },
              { label: t("field.affordabilityIndex"), value: derived.affordabilityIndex, fieldId: "affordabilityIndex" },
              { label: t("section.freshness"), value: derived.freshnessStatus ? t(`status.${String(derived.freshnessStatus)}`) : derived.freshnessStatus, fieldId: "freshnessStatus" },
            ]}
            glossaryMap={glossaryMap}
          />
          </Section>
          <Section title="JSON preview" defaultCollapsed collapseSummary="Show JSON">
          <JsonPreview
            jsonUrl={page.meta.jsonUrl}
            copyValue={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}${jsonUrlPath}`}
          />
          </Section>
          {((): React.ReactNode => {
            const links = page.data.compareLinks as Array<{ pairSlug: string; title: string; url: string }> | undefined;
            if (!Array.isArray(links) || links.length === 0) return null;
            return (
              <Section title="Compare with other states" subtitle="Direct state-to-state comparisons.">
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                  {links.map((l) => (
                    <li key={l.pairSlug}>
                      <Link href={l.url}>{l.title}</Link>
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })()}
          {(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs && (
            <Disclaimers
              disclaimerRefs={(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs ?? []}
            />
          )}
          <ExploreMore
            title="Related electricity pages"
            links={[
              { href: `/electricity-cost/${slug}`, label: "Electricity cost" },
              { href: `/average-electricity-bill/${slug}`, label: "Average electricity bill" },
              { href: `/electricity-cost-calculator/${slug}`, label: "Electricity cost calculator" },
              { href: `/battery-recharge-cost/${slug}`, label: "Battery recharge cost" },
              { href: `/generator-vs-battery-cost/${slug}`, label: "Generator vs battery cost" },
              { href: `/electricity-price-history/${slug}`, label: "Electricity price history" },
            ]}
          />
          <RecommendedNext entityId={page.meta.id} relatedMap={relatedMap?.byEntity ?? null} />
        </div>
        <div>
          <RelatedEntitiesSidebar
            states={refs.states}
            rankings={refs.rankings}
            methodologies={refs.methodologies}
            national={relatedEntities.national}
          />
        </div>
      </div>
      <StatusFooter release={release} />
    </main>
    </>
  );
  } finally {
    emitRouteRuntimeProfile({
      routeId: "knowledge/state/[slug]",
      phase: "render",
      durationMs: elapsedMs(startedAt),
      artifactCount: 8,
    });
  }
}
