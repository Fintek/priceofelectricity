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
    .filter((e) => e.type === "methodology")
    .map((e) => ({ id: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = await loadKnowledgePage("methodology", id);
  if (!page) {
    return buildMetadata({
      title: "Not found | PriceOfElectricity.com",
      description: "We couldn't find that page.",
      canonicalPath: `/knowledge/methodology/${id}`,
    });
  }
  const title = `${page.meta.title} Methodology | PriceOfElectricity.com`;
  const meta = page.meta as { excerpt?: string; description: string; title: string; canonicalUrl?: string };
  const description = meta.excerpt ?? meta.description ?? `${meta.title} methodology and definitions.`;
  const canonicalPath = (meta.canonicalUrl ?? `/knowledge/methodology/${id}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/methodology/${id}`;
  return buildMetadata({ title, description, canonicalPath });
}

export default async function KnowledgeMethodologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [page, entityIndex, release, relatedMap] = await Promise.all([
    loadKnowledgePage("methodology", id),
    loadEntityIndex(),
    getRelease(),
    loadRelatedIndex(),
  ]);

  if (!page) notFound();

  const meta = page.meta as { excerpt?: string; description: string; title: string; canonicalUrl?: string };
  const canonicalPath = (meta.canonicalUrl ?? `/knowledge/methodology/${id}`).replace(/^https?:\/\/[^/]+/, "") || `/knowledge/methodology/${id}`;

  const webPageJsonLd = buildWebPageJsonLd({
    title: `${page.meta.title} Methodology`,
    description: meta.excerpt ?? meta.description ?? `${page.meta.title} methodology and definitions.`,
    url: canonicalPath,
    dateModified: (page.meta.freshness as { computedAt?: string })?.computedAt ?? (page.meta as { updatedAt?: string }).updatedAt,
    isPartOf: "/",
    about: ["methodology", id],
  });

  const relatedEntities = (page.data.relatedEntities as {
    rankings?: string[];
    national?: boolean;
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
          { label: "Methodology", href: "/knowledge/pages" },
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
        jsonUrl={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/methodology/${id}.json`}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32 }}>
        <div>
          <p className="muted" style={{ marginTop: 0 }}>
            {page.meta.description}
          </p>
          {page.meta.freshness && (
            <FreshnessBox freshness={page.meta.freshness} />
          )}
          <Section title="Definition">
            <p style={{ margin: 0 }}>{String(data.definition ?? "")}</p>
          </Section>
          {Array.isArray(data.steps) && data.steps.length > 0 && (
            <Section title="Steps">
              <ol style={{ paddingLeft: 20, margin: 0 }}>
                {(data.steps as string[]).map((s, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                ))}
              </ol>
            </Section>
          )}
          <Section title="JSON preview" defaultCollapsed collapseSummary="Show JSON">
            <JsonPreview
              jsonUrl={page.meta.jsonUrl}
              jsonPreview={JSON.stringify({ meta: page.meta, data: page.data }, null, 2)}
              copyValue={page.meta.jsonUrl?.startsWith("http") ? page.meta.jsonUrl : `${BASE_URL}/knowledge/methodology/${id}.json`}
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
            rankings={refs.rankings}
            national={relatedEntities.national}
          />
        </div>
      </div>
      <StatusFooter release={release} />
    </main>
    </>
  );
}
