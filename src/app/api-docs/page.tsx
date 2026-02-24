import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "API Documentation | PriceOfElectricity.com",
  description:
    "Public API documentation for PriceOfElectricity.com, including versioned v1 endpoints and legacy JSON feeds.",
  alternates: { canonical: `${BASE_URL}/api-docs` },
  openGraph: {
    title: "API Documentation | PriceOfElectricity.com",
    description:
      "Public API documentation for PriceOfElectricity.com, including versioned v1 endpoints and legacy JSON feeds.",
    url: `${BASE_URL}/api-docs`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "API Documentation | PriceOfElectricity.com",
    description:
      "Public API documentation for PriceOfElectricity.com, including versioned v1 endpoints and legacy JSON feeds.",
  },
};

export default function ApiDocsPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "API Documentation",
    url: `${BASE_URL}/api-docs`,
    description:
      "Public API documentation for PriceOfElectricity.com, including versioned v1 endpoints and legacy JSON feeds.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>API Documentation</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        PriceOfElectricity.com provides public, read-only JSON endpoints for
        electricity rate data. The versioned <strong>v1</strong> contract is
        the recommended integration point.
      </p>

      {/* ── v1 Contract ──────────────────────────────────────── */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          v1 Public Data Contract
        </h2>
        <p style={{ marginTop: 0 }}>
          The v1 endpoints return structured, deterministic JSON with a stable
          schema. Fields may be added over time but existing fields will not be
          removed or renamed within the same version.
        </p>

        <h3 style={{ fontSize: 18, marginBottom: 6, marginTop: 18 }}>
          GET /api/v1/states
        </h3>
        <p className="muted" style={{ margin: "4px 0 8px" }}>
          Returns all 50 states with summary metrics.
        </p>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 14,
            borderRadius: 6,
            fontSize: 13,
            overflowX: "auto",
            lineHeight: 1.5,
          }}
        >{`{
  "version": "v1",
  "generatedAt": "2026-02-22T00:00:00.000Z",
  "states": [
    {
      "slug": "alabama",
      "name": "Alabama",
      "avgResidentialRate": 14.53,
      "avgMonthlyBill": 145.30,
      "affordabilityIndex": 62,
      "valueScore": 58,
      "lastUpdated": "January 2026"
    }
  ]
}`}</pre>

        <h3 style={{ fontSize: 18, marginBottom: 6, marginTop: 18 }}>
          GET /api/v1/state/&lt;slug&gt;
        </h3>
        <p className="muted" style={{ margin: "4px 0 8px" }}>
          Returns detailed data for a single state, including driver IDs,
          open rate case count, and timeline event count.
        </p>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 14,
            borderRadius: 6,
            fontSize: 13,
            overflowX: "auto",
            lineHeight: 1.5,
          }}
        >{`{
  "version": "v1",
  "generatedAt": "2026-02-22T00:00:00.000Z",
  "state": {
    "slug": "texas",
    "name": "Texas",
    "avgResidentialRate": 14.01,
    "avgMonthlyBill": 140.10,
    "affordabilityIndex": 65,
    "valueScore": 60,
    "drivers": ["tx-gen-mix", "tx-demand-growth"],
    "openRateCases": 1,
    "timelineEvents": 3,
    "lastUpdated": "January 2026"
  }
}`}</pre>

        <h3 style={{ fontSize: 18, marginBottom: 6, marginTop: 18 }}>
          Response Headers
        </h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>
            <code>Content-Type: application/json</code>
          </li>
          <li>
            <code>
              Cache-Control: public, max-age=3600, stale-while-revalidate=86400
            </code>
          </li>
        </ul>

        <h3 style={{ fontSize: 18, marginBottom: 6, marginTop: 18 }}>
          Stability Guarantee
        </h3>
        <p style={{ marginTop: 0 }}>
          Within the v1 version, existing fields will not be removed or
          renamed. New fields may be added to response objects. Consumers
          should ignore unknown keys to maintain forward compatibility.
        </p>
      </section>

      {/* ── Example URLs ──────────────────────────────────────── */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Example URLs</h2>
        {/* eslint-disable @next/next/no-html-link-for-pages */}
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            <a href="/api/v1/states">/api/v1/states</a>
          </li>
          <li>
            <a href="/api/v1/state/texas">/api/v1/state/texas</a>
          </li>
          <li>
            <a href="/api/v1/state/california">/api/v1/state/california</a>
          </li>
        </ul>
        {/* eslint-enable @next/next/no-html-link-for-pages */}
      </section>

      {/* ── Legacy endpoints ──────────────────────────────────── */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          Legacy Endpoints (unversioned)
        </h2>
        <p className="muted" style={{ marginTop: 0 }}>
          These endpoints predate the v1 contract and remain available. They
          are not covered by the v1 stability guarantee.
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            <code>/api/states.json</code> &ndash; full state list
          </li>
          <li>
            <code>/api/state/&lt;slug&gt;.json</code> &ndash; single state
          </li>
          <li>
            <code>/api/compare.json?sort=low|high|alpha</code> &ndash;
            comparison feed
          </li>
        </ul>
      </section>

      {/* ── Related ──────────────────────────────────────────── */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>
            <Link href="/knowledge" prefetch={false}>
              Knowledge Pack
            </Link>{" "}
            &ndash; machine-readable site summary for agents
          </li>
          <li>
            <Link href="/methodology" prefetch={false}>
              Methodology
            </Link>{" "}
            &ndash; how metrics are computed
          </li>
          <li>
            <Link href="/datasets" prefetch={false}>
              Data Downloads
            </Link>{" "}
            &ndash; bulk CSV and JSON exports
          </li>
        </ul>
      </section>
    </main>
  );
}
