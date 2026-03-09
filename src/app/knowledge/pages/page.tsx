import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import CopyButton from "@/components/common/CopyButton";
import { t } from "@/lib/knowledge/labels";
import { loadEntityIndex, loadLeaderboards } from "@/lib/knowledge/loadKnowledgePage";
import { getRelease } from "@/lib/knowledge/fetch";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import LeaderboardsSection from "@/app/components/knowledge/LeaderboardsSection";
import Disclaimers from "@/app/components/policy/Disclaimers";
import Section from "@/components/common/Section";
import StatusFooter from "@/components/common/StatusFooter";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Knowledge Directory | PriceOfElectricity.com",
  description:
    "Human-readable directory of all Knowledge JSON pages: states, national, methodologies, rankings, and verticals.",
  canonicalPath: "/knowledge/pages",
});

export default async function KnowledgePagesDirectoryPage() {
  const [entityIndex, leaderboards, release] = await Promise.all([
    loadEntityIndex(),
    loadLeaderboards(),
    getRelease(),
  ]);
  const byType = new Map<string, typeof entityIndex.entities>();
  for (const e of entityIndex.entities) {
    const list = byType.get(e.type) ?? [];
    list.push(e);
    byType.set(e.type, list);
  }

  const typeOrder = ["national", "state", "methodology", "rankings", "vertical"];
  const typeLabels: Record<string, string> = {
    national: t("entity.national"),
    state: t("entity.states"),
    methodology: t("entity.methodologies"),
    rankings: t("entity.rankings"),
    vertical: t("entity.verticals"),
  };

  const typeCounts = typeOrder.map((t) => ({ type: t, count: (byType.get(t) ?? []).length }));

  return (
    <main className="container">
      <nav aria-label="Knowledge navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/data">{t("nav.backToDataHub")}</Link>
        {" · "}
        <Link href="/knowledge">{t("breadcrumb.knowledge")}</Link>
        {" — "}
        <span>{t("breadcrumb.directory")}</span>
      </nav>
      <KnowledgeHeader
        breadcrumbs={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("breadcrumb.knowledge"), href: "/knowledge" },
          { label: t("breadcrumb.directory") },
        ]}
        title={t("nav.knowledgeDirectory")}
        jsonUrl="/knowledge/index.json"
      />
      <div
        role="group"
        aria-label="Entity counts by type"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          padding: 12,
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          backgroundColor: "var(--color-surface-alt)",
        }}
      >
        {typeCounts.map(({ type, count }) => (
          <span key={type} style={{ fontSize: 14 }}>
            {typeLabels[type] ?? type}: <strong>{count}</strong>
          </span>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Human-readable directory of build-generated Knowledge JSON pages.
        Each entity links to its canonical page and JSON file.
      </p>

      <LeaderboardsSection data={leaderboards} />

      <Disclaimers disclaimerRefs={["general-site"]} />

      {typeOrder.map((type) => {
        const list = byType.get(type) ?? [];
        if (list.length === 0) return null;
        const sorted = [...list].sort((a, b) => a.slug.localeCompare(b.slug));
        return (
          <Section key={type} title={typeLabels[type] ?? type}>
            <ul style={{ paddingLeft: 20, lineHeight: 2, margin: 0 }}>
              {sorted.map((e) => {
                const href = e.canonicalUrl.startsWith("http")
                  ? new URL(e.canonicalUrl).pathname
                  : e.canonicalUrl;
                const jsonPath =
                  type === "national"
                    ? "/knowledge/national.json"
                    : `/knowledge/${type}/${e.slug}.json`;
                const canonicalFull = e.canonicalUrl.startsWith("http") ? e.canonicalUrl : `${BASE_URL}${href}`;
                const jsonFull = `${BASE_URL}${jsonPath}`;
                return (
                  <li key={e.id} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                    <Link href={href}>{e.title ?? e.slug}</Link>
                    {" — "}
                    <a href={jsonPath} target="_blank" rel="noopener noreferrer" className="muted" style={{ fontSize: 14 }}>
                      JSON
                    </a>
                    <CopyButton value={canonicalFull} label={`Copy canonical URL for ${e.title ?? e.slug}`} />
                    <CopyButton value={jsonFull} label={`Copy JSON URL for ${e.title ?? e.slug}`} />
                  </li>
                );
              })}
            </ul>
          </Section>
        );
      })}

      <StatusFooter release={release} />
    </main>
  );
}
