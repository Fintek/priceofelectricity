import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  loadKnowledgePage,
  loadEntityIndex,
  loadRelatedIndex,
  resolveEntityRefs,
} from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import FreshnessBox from "@/app/components/knowledge/FreshnessBox";
import JsonPreview from "@/app/components/knowledge/JsonPreview";
import RelatedEntitiesSidebar from "@/app/components/knowledge/RelatedEntitiesSidebar";
import Disclaimers from "@/app/components/policy/Disclaimers";
import Section from "@/components/common/Section";
import ShareBar from "@/components/common/ShareBar";
import StatusFooter from "@/components/common/StatusFooter";
import RecommendedNext from "@/components/knowledge/RecommendedNext";
import { SITE_URL } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildWebPageJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  const index = await loadEntityIndex();
  return index.entities
    .filter((e) => e.type === "vertical")
    .map((e) => ({ id: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = await loadKnowledgePage("vertical", id);
  if (!page) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/knowledge/vertical/${id}`,
    });
  }
  const meta = page.meta as { excerpt?: string; description: string; title: string; canonicalUrl?: string };
  const title = `${meta.title} | PriceOfElectricity.com`;
  const description = meta.excerpt ?? meta.description ?? `${meta.title} vertical overview.`;
  const canonicalPath = (meta.canonicalUrl ?? `/knowledge/vertical/${id}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/vertical/${id}`;
  return buildMetadata({ title, description, canonicalPath });
}

export default async function KnowledgeVerticalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [page, entityIndex, release, relatedMap] = await Promise.all([
    loadKnowledgePage("vertical", id),
    loadEntityIndex(),
    getRelease(),
    loadRelatedIndex(),
  ]);

  if (!page) notFound();

  const meta = page.meta as { excerpt?: string; description: string; title: string; canonicalUrl?: string };
  const keyThemes = (page.data as { keyThemes?: string[] }).keyThemes ?? [];
  const canonicalPath = (meta.canonicalUrl ?? `/knowledge/vertical/${id}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/vertical/${id}`;

  const webPageJsonLd = buildWebPageJsonLd({
    title: meta.title,
    description: meta.excerpt ?? meta.description ?? `${meta.title} vertical overview.`,
    url: canonicalPath,
    dateModified: (page.meta.freshness as { computedAt?: string })?.computedAt ?? (page.meta as { updatedAt?: string }).updatedAt,
    isPartOf: "/",
    about: keyThemes.length > 0 ? keyThemes : [meta.title, "vertical"],
  });

  const relatedEntities = (page.data.relatedEntities as {
    states?: string[];
    rankings?: string[];
    methodologies?: string[];
    verticals?: string[];
  }) ?? {};
  const refs = resolveEntityRefs(entityIndex, relatedEntities);

  const data = page.data as Record<string, unknown>;

  return (
    <>
      <JsonLdScript data={webPageJsonLd} />
      <main className="container">
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "Vertical", href: "/knowledge/pages" },
          { label: page.meta.title },
        ]}
        title={page.meta.title}
        jsonUrl={page.meta.jsonUrl}
        canonicalUrl={meta.canonicalUrl?.startsWith("http") ? meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        qualityScore={(page.meta as { qualityScore?: number }).qualityScore}
        sourceVersion={(page.meta as { sourceVersion?: string }).sourceVersion}
        semanticCluster={(page.meta as { llmHints?: { semanticCluster?: string } }).llmHints?.semanticCluster}
      />

      <ShareBar
        canonicalUrl={meta.canonicalUrl?.startsWith("http") ? meta.canonicalUrl : `${BASE_URL}${canonicalPath}`}
        jsonUrl={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/vertical/${id}.json`}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32 }}>
        <div>
          <p className="muted" style={{ marginTop: 0 }}>
            {page.meta.description}
          </p>
          {page.meta.freshness && (
            <FreshnessBox freshness={page.meta.freshness} />
          )}
          <Section title="JSON preview" defaultCollapsed collapseSummary="Show JSON">
          <JsonPreview
            jsonUrl={page.meta.jsonUrl}
            jsonPreview={JSON.stringify({ meta: page.meta, data: page.data }, null, 2)}
            copyValue={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/vertical/${id}.json`}
          />
          </Section>
          {(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs && (
            <Disclaimers
              disclaimerRefs={(page.meta as { disclaimerRefs?: string[] }).disclaimerRefs ?? []}
            />
          )}
          <Section title="Summary">
            <p style={{ margin: 0 }}>{String(data.summary ?? "")}</p>
          </Section>
          {Array.isArray(data.keyThemes) && data.keyThemes.length > 0 && (
            <Section title="Key themes">
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {(data.keyThemes as string[]).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </Section>
          )}
          <RecommendedNext entityId={page.meta.id} relatedMap={relatedMap?.byEntity ?? null} />
        </div>
        <div>
          <RelatedEntitiesSidebar
            states={refs.states}
            rankings={refs.rankings}
            methodologies={refs.methodologies}
            verticals={refs.verticals}
          />
        </div>
      </div>
      <StatusFooter release={release} />
    </main>
    </>
  );
}
