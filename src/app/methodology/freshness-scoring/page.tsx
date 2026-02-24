import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Freshness Scoring Methodology | PriceOfElectricity.com",
  description:
    "How data freshness is classified: fresh, aging, and stale thresholds and why freshness matters.",
  alternates: { canonical: `${BASE_URL}/methodology/freshness-scoring` },
  openGraph: {
    title: "Freshness Scoring Methodology | PriceOfElectricity.com",
    description:
      "How we classify data as fresh, aging, or stale based on days since update.",
    url: `${BASE_URL}/methodology/freshness-scoring`,
  },
};

export default function FreshnessScoringMethodologyPage() {
  const creativeWorkStructuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Freshness Scoring Methodology",
    description:
      "Methodology for freshness scoring: thresholds for fresh, aging, and stale data.",
    url: `${BASE_URL}/methodology/freshness-scoring`,
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
        <Link href="/methodology">Methodology</Link> {"→"} Freshness Scoring
      </p>
      <h1>Freshness Scoring Methodology</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Freshness scoring indicates how recently a state&apos;s rate data was
        updated. It helps users and analysts assess data recency at a glance.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Thresholds</h2>
        <p style={{ marginTop: 0 }}>
          Each state has an <code>updated</code> date. We compute days since
          that date and classify as follows:
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>
            <strong>Fresh</strong> — Less than 45 days since update
          </li>
          <li>
            <strong>Aging</strong> — 45 to 90 days since update
          </li>
          <li>
            <strong>Stale</strong> — More than 90 days since update
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Why freshness matters</h2>
        <p style={{ marginTop: 0 }}>
          Electricity rates change over time. Stale data may not reflect
          current market conditions. Freshness is factored into the Value
          Score™ and displayed on state pages and comparison tables so users can
          weigh recency when making decisions.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Data update cycle</h2>
        <p style={{ marginTop: 0 }}>
          We aim for a monthly review cadence. State rates are updated when new
          data is published by our sources (e.g., EIA, state PUCs). See{" "}
          <Link href="/data-policy">data policy</Link> for details.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Display</h2>
        <p style={{ marginTop: 0 }}>
          Labels are shown as &quot;Updated X days ago&quot; or &quot;Updated X
          days ago (data may be outdated)&quot; for stale data. Invalid or
          missing dates are treated as stale.
        </p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/status">View system status and freshness summary</Link>
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link href="/methodology">← Back to Methodology</Link>
      </p>
    </main>
  );
}
