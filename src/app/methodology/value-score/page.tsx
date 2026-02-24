import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Value Score™ Methodology | PriceOfElectricity.com",
  description:
    "How the Electricity Value Score™ is calculated: components, weighting, and tier interpretation.",
  alternates: { canonical: `${BASE_URL}/methodology/value-score` },
  openGraph: {
    title: "Value Score™ Methodology | PriceOfElectricity.com",
    description:
      "How the Electricity Value Score™ combines affordability, price, and freshness.",
    url: `${BASE_URL}/methodology/value-score`,
  },
};

export default function ValueScoreMethodologyPage() {
  const creativeWorkStructuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Value Score™ Methodology",
    description:
      "Methodology for the Electricity Value Score™: a composite of affordability, inverse price, and freshness.",
    url: `${BASE_URL}/methodology/value-score`,
    dateModified: LAST_REVIEWED,
    author: {
      "@type": "Organization",
      name: "PriceOfElectricity.com",
      url: BASE_URL,
    },
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(creativeWorkStructuredData),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/methodology">Methodology</Link> {"→"} Value Score™
      </p>
      <h1>Value Score™ Methodology</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        The Electricity Value Score™ is a composite metric that combines
        affordability, price position, and data freshness into a single 0–100
        score.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Components</h2>
        <p style={{ marginTop: 0 }}>The raw score uses three inputs:</p>
        <ol style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>
            <strong>Affordability index (60% weight)</strong> — Normalized
            0–100 score where higher = more affordable. Derived from the
            state&apos;s rate relative to the national min/max range.
          </li>
          <li>
            <strong>Inverse price component (30% weight)</strong> — 100 minus
            the normalized position within the rate range. Lower rates contribute
            more.
          </li>
          <li>
            <strong>Freshness boost (0–5 points)</strong> — Added based on data
            recency: fresh +5, aging +2, stale +0.
          </li>
        </ol>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Weighting</h2>
        <p style={{ marginTop: 0 }}>
          Raw score = 0.6 × affordability + 0.3 × inverse price + freshness boost.
          The result is normalized to a 0–100 scale for display.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Tier interpretation</h2>
        <ul style={{ paddingLeft: 20, marginTop: 0 }}>
          <li>
            <strong>80–100</strong> — Excellent
          </li>
          <li>
            <strong>60–79</strong> — Strong
          </li>
          <li>
            <strong>40–59</strong> — Moderate
          </li>
          <li>
            <strong>0–39</strong> — Weak
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Limitations</h2>
        <p style={{ marginTop: 0 }}>
          The Value Score is a relative ranking tool. It does not predict actual
          bill outcomes. Affordability and inverse price are derived from the
          same rate data, so they are correlated.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Data sources</h2>
        <p style={{ marginTop: 0 }}>
          All inputs come from our normalized state data. See{" "}
          <Link href="/sources">sources</Link> and{" "}
          <Link href="/methodology/freshness-scoring">freshness scoring</Link>.
        </p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/value-ranking">View full Value Score™ ranking</Link>
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link href="/methodology">← Back to Methodology</Link>
      </p>
    </main>
  );
}
