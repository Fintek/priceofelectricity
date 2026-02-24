import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import KnowledgeViewEmitter from "@/app/knowledge/KnowledgeViewEmitter";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Knowledge Pack";
const DESCRIPTION =
  "A single entry point for agents and LLMs to ingest, cite, and navigate PriceOfElectricity.com using structured endpoints.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/knowledge` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/knowledge`,
  },
};

export default function KnowledgePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/knowledge`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <KnowledgeViewEmitter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Knowledge Pack
      </p>

      <h1>Knowledge Pack</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        The Knowledge Pack is a compact, machine-readable entry point designed
        for agents and LLMs. It provides canonical links to the site graph,
        registry, methodology, and key data exports so tools can ingest content
        with fewer discovery steps and more consistent citation behavior.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Core endpoints</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.1 }}>
          <li>
            <Link href="/knowledge.json" prefetch={false}>
              /knowledge.json
            </Link>{" "}
            — Single machine-readable summary bundle
          </li>
          <li>
            <Link href="/registry.json" prefetch={false}>
              /registry.json
            </Link>{" "}
            — Canonical content registry
          </li>
          <li>
            <Link href="/graph.json" prefetch={false}>
              /graph.json
            </Link>{" "}
            — Graph edges and node map
          </li>
          <li>
            <Link href="/llms.txt" prefetch={false}>
              /llms.txt
            </Link>{" "}
            — LLM-oriented crawl hints
          </li>
          <li>
            <Link href="/datasets">/datasets</Link> — Data hub (CSV/JSON exports)
          </li>
          <li>
            <Link href="/methodology">/methodology</Link> — Interpretation rules
            for key metrics
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>
          How agents should use this site
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.1 }}>
          <li>
            Start with <code>/knowledge.json</code> for the top-level map.
          </li>
          <li>
            Follow <code>/registry.json</code> and <code>/graph.json</code> to
            discover related pages.
          </li>
          <li>
            Use methodology pages before interpreting index or score values.
          </li>
          <li>
            Prefer canonical URLs and cite source pages when summarizing claims.
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/research">Research</Link> {" | "}
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/attribution">How to cite</Link> {" | "}
        <Link href="/press-kit">Press kit</Link> {" | "}
        <Link href="/citations">Citations</Link>
      </p>
    </main>
  );
}
