import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Press Kit";
const DESCRIPTION =
  "Media resources for PriceOfElectricity.com: site overview, dataset description, machine-readable endpoints, and media inquiry contact.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/press-kit` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/press-kit`,
  },
};

export default function PressKitPage() {
  const creativeWorkData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/press-kit`,
    dateModified: LAST_REVIEWED,
    publisher: {
      "@type": "Organization",
      name: "PriceOfElectricity.com",
      url: BASE_URL,
    },
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} Press Kit
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Resources for journalists, researchers, and publishers who want to
        reference or cite PriceOfElectricity.com data.
      </p>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Site overview</h2>
        <p style={{ marginTop: 0 }}>
          PriceOfElectricity.com is a public reference for U.S. residential
          electricity rates by state. It provides average rate data (¢/kWh),
          affordability indices, a proprietary Electricity Price Index™,
          Value Score™ rankings, and historical snapshots. All data is sourced
          from publicly available utility and government datasets and processed
          through a documented normalization pipeline.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>
          What makes it useful
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <b>State-by-state comparability</b> — Normalized average rates
            across all 50 states using a consistent methodology.
          </li>
          <li>
            <b>Proprietary benchmarking</b> — The Electricity Price Index™
            normalizes each state rate to a national baseline of 100, enabling
            direct comparison.
          </li>
          <li>
            <b>Update history</b> — Data versioning and snapshots allow
            trend analysis over time.
          </li>
          <li>
            <b>Machine-readable</b> — Structured JSON and CSV exports,
            content registry, and graph endpoints make it easy to ingest
            programmatically.
          </li>
          <li>
            <b>Transparent methodology</b> — All scoring formulas are
            publicly documented.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>
          Machine-readable endpoints
        </h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/knowledge.json" prefetch={false}>
              /knowledge.json
            </Link>{" "}
            — Single-bundle site summary for agents and LLMs
          </li>
          <li>
            <Link href="/registry.json" prefetch={false}>
              /registry.json
            </Link>{" "}
            — Canonical content registry of all pages
          </li>
          <li>
            <Link href="/graph.json" prefetch={false}>
              /graph.json
            </Link>{" "}
            — Graph of content nodes and relationships
          </li>
          <li>
            <Link href="/methodology">/methodology</Link> — Documented scoring
            formulas and interpretation guidance
          </li>
          <li>
            <Link href="/national">/national</Link> — National aggregate
            statistics (average, median, extremes)
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 10 }}>Media inquiries</h2>
        <p style={{ marginTop: 0 }}>
          For interview requests, licensing questions, or to report a
          citation, <Link href="/contact">contact us</Link>.
        </p>
        <p style={{ marginTop: 8 }}>
          See also: <Link href="/attribution">how to cite PriceOfElectricity.com</Link>{" "}
          and <Link href="/citations">citations log</Link>.
        </p>
      </section>

      <p className="muted" style={{ marginTop: 28 }}>
        <Link href="/research">Research</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/data-policy">Data policy</Link> {" | "}
        <Link href="/disclosures">Disclosures</Link>
      </p>
    </main>
  );
}
