import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { getKnowledgeDataEndpoints } from "@/lib/knowledge/common";
import { loadStarterPack } from "@/lib/knowledge/loadKnowledgePage";
import { getPublicEndpoints, getCapabilities, getRelease } from "@/lib/knowledge/fetch";
import DataHubHero from "@/components/datahub/DataHubHero";
import EndpointGroupCards from "@/components/datahub/EndpointGroupCards";
import GettingStartedSection from "@/components/datahub/GettingStartedSection";
import CopyButton from "@/components/common/CopyButton";
import StatusFooter from "@/components/common/StatusFooter";
import Disclaimers from "@/app/components/policy/Disclaimers";
import { buildWebPageJsonLd, buildDatasetJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Data Hub | PriceOfElectricity.com",
    description:
      "Central entry point for electricity data and knowledge surfaces. Datasets for analysis, knowledge pages for LLM ingestion.",
    canonicalPath: "/data",
  });
}

export default async function DataHubPage() {
  const [publicEndpoints, capabilities, release, starterPack] = await Promise.all([
    getPublicEndpoints(),
    getCapabilities(),
    getRelease(),
    loadStarterPack(),
  ]);
  const endpoints = getKnowledgeDataEndpoints();

  const webPageJsonLd = buildWebPageJsonLd({
    title: "Data Hub | PriceOfElectricity.com",
    description:
      "Central entry point for electricity data and knowledge surfaces. Datasets for analysis, knowledge pages for LLM ingestion.",
    url: "/data",
    isPartOf: "/",
    about: ["datasets", "electricity rates data", "knowledge JSON"],
  });

  const datasetJsonLd = buildDatasetJsonLd({
    name: "Knowledge Search Index",
    description: "Searchable entity index for LLM retrieval and knowledge discovery.",
    url: "/data",
    distribution: [{ contentUrl: "/knowledge/search-index.json", encodingFormat: "application/json" }],
    publisher: "PriceOfElectricity.com",
  });

  const DATASET_LINKS: Array<{ path: string; label: string; description: string }> = [
    { path: endpoints.statesJson, label: "States (JSON)", description: "All states with rate, affordability, value score" },
    { path: endpoints.statesCsv, label: "States (CSV)", description: "Same data in CSV format" },
    { path: endpoints.valueRankingCsv, label: "Value Ranking (CSV)", description: "States ranked by Value Score" },
    { path: endpoints.affordabilityCsv, label: "Affordability (CSV)", description: "States ranked by affordability" },
  ];

  return (
    <>
      <JsonLdScript data={[webPageJsonLd, datasetJsonLd]} />
      <main className="container">
      <nav aria-label="Data hub navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/knowledge">Knowledge</Link>
        {" · "}
        <Link href="/knowledge/pages">States directory</Link>
        {" · "}
        <Link href="/datasets">Data downloads</Link>
      </nav>

      <DataHubHero release={release} capabilities={capabilities} endpoints={publicEndpoints} />

      <GettingStartedSection starterPack={starterPack} />

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Public endpoints</h2>
        <p style={{ fontSize: 14, color: "#666", margin: "0 0 16px 0" }}>
          Build-generated JSON entry points for discovery and LLM ingestion. See{" "}
          <Link href="/knowledge/public-endpoints.json">public-endpoints.json</Link> for the canonical list.
        </p>
        <EndpointGroupCards groups={publicEndpoints?.groups ?? []} />
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Crawling & Indexing</h2>
        <p style={{ fontSize: 14, color: "#666", margin: 0 }}>
          The JSON entry points (search-index, index, contract) are intended for discovery and LLM ingestion.
          Individual entity JSON pages exist under /knowledge/state/ and elsewhere, but the index is the preferred entry point for crawlers.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Datasets</h2>
        <ul style={{ paddingLeft: 20, listStyle: "disc", lineHeight: 1.8 }}>
          {DATASET_LINKS.map((item) => (
            <li key={item.path} style={{ marginBottom: 8 }}>
              <Link href={item.path}>{item.label}</Link>
              <span style={{ color: "#666", marginLeft: 8 }}>— {item.description}</span>
              <CopyButton value={`${BASE_URL}${item.path}`} label={`Copy ${item.label}`} />
            </li>
          ))}
        </ul>
      </section>

      <Disclaimers disclaimerRefs={["general-site"]} />

      <StatusFooter release={release} capabilities={capabilities} />

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> · <Link href="/datasets">Data downloads</Link> ·{" "}
        <Link href="/knowledge">Knowledge</Link> · <Link href="/methodology">Methodology</Link>
      </p>
    </main>
    </>
  );
}
