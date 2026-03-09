import type { Metadata } from "next";
import Link from "next/link";
import KnowledgeHeader from "@/app/components/knowledge/KnowledgeHeader";
import CompareStatesClient from "./CompareStatesClient";
import {
  loadCompareStates,
  loadLeaderboards,
  loadCoverageStates,
} from "@/lib/knowledge/loadKnowledgePage";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { getGlossaryMap } from "@/lib/knowledge/glossary";
import { getGlossary } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Compare States | PriceOfElectricity.com",
  description:
    "Compare electricity rates, value scores, affordability, and example bills across multiple U.S. states.",
  canonicalPath: "/knowledge/compare",
});

export default async function KnowledgeComparePage() {
  const [compareData, leaderboards, coverage, glossary] = await Promise.all([
    loadCompareStates(),
    loadLeaderboards(),
    loadCoverageStates(),
    getGlossary(),
  ]);

  const glossaryMap = getGlossaryMap(glossary);
  const coverageBySlug: Record<string, number> = {};
  if (coverage?.states) {
    for (const s of coverage.states) {
      if (s.slug && typeof s.coveragePct === "number") {
        coverageBySlug[s.slug] = s.coveragePct;
      }
    }
  }

  return (
    <main className="container">
      <nav aria-label="Knowledge navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/data">Data Hub</Link>
        {" · "}
        <Link href="/knowledge">Knowledge</Link>
        {" · "}
        <Link href="/knowledge/pages">States directory</Link>
      </nav>
      <KnowledgeHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Knowledge", href: "/knowledge" },
          { label: "Compare" },
        ]}
        title="State Comparison"
        jsonUrl="/knowledge/compare/states.json"
      />
      <p className="muted" style={{ marginTop: 0 }}>
        Select 2–4 states to compare key metrics side by side. Use presets for quick comparisons or search to pick
        specific states. Data is static and build-generated.
      </p>
      <CompareStatesClient
        compareData={compareData}
        leaderboards={leaderboards}
        glossaryMap={glossaryMap}
        coverageBySlug={Object.keys(coverageBySlug).length > 0 ? coverageBySlug : {}}
      />
      <Disclaimers disclaimerRefs={["general-site"]} />
    </main>
  );
}
