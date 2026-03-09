import type { Metadata } from "next";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import { loadGlossary, getGlossaryMap } from "@/lib/knowledge/glossary";
import RankingsExplorerClient from "./RankingsExplorerClient";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Rankings Explorer | PriceOfElectricity.com",
  description:
    "Browse all electricity rate rankings: affordability, value score, and rate comparisons across U.S. states.",
  canonicalPath: "/knowledge/rankings",
});

export default async function KnowledgeRankingsIndexPage() {
  const glossary = await loadGlossary();
  const glossaryMap = getGlossaryMap(glossary);
  return (
    <main className="container">
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "Rankings" },
        ]}
        title="Rankings Explorer"
        jsonUrl="/knowledge/rankings/index.json"
      />
      <p className="muted" style={{ marginTop: 0 }}>
        Browse all ranking pages. Each ranking provides a deterministic ordering
        of states by a specific metric.
      </p>
      <RankingsExplorerClient glossaryMap={glossaryMap} />
    </main>
  );
}
