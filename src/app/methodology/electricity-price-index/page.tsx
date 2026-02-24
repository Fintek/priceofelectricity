import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Electricity Price Index™ Methodology | PriceOfElectricity.com",
  description:
    "How the Electricity Price Index™ is calculated: national average baseline, formula, and interpretation rules.",
  alternates: { canonical: `${BASE_URL}/methodology/electricity-price-index` },
  openGraph: {
    title: "Electricity Price Index™ Methodology | PriceOfElectricity.com",
    description:
      "How the Electricity Price Index™ is calculated with a national baseline of 100.",
    url: `${BASE_URL}/methodology/electricity-price-index`,
  },
};

export default function ElectricityPriceIndexMethodologyPage() {
  const creativeWorkStructuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Electricity Price Index™ Methodology",
    description:
      "Methodology for the Electricity Price Index™: state rates normalized to a national baseline of 100.",
    url: `${BASE_URL}/methodology/electricity-price-index`,
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
        <Link href="/methodology">Methodology</Link> {"→"} Electricity Price
        Index™
      </p>
      <h1>Electricity Price Index™ Methodology</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        The Electricity Price Index™ (EPI) normalizes state electricity rates
        to a national baseline, making it easy to compare states at a glance.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>National average baseline</h2>
        <p style={{ marginTop: 0 }}>
          The national average residential electricity rate (¢/kWh) across all 50
          states is used as the baseline. This baseline is assigned an index
          value of <strong>100</strong>.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Formula</h2>
        <p style={{ marginTop: 0 }}>
          For each state:
        </p>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 16,
            borderRadius: 4,
            overflow: "auto",
            fontSize: 14,
          }}
        >
          {`indexValue = round((stateRate / nationalAverage) × 100)`}
        </pre>
        <p style={{ marginTop: 12 }}>
          Where <code>stateRate</code> is the state&apos;s average residential
          electricity price in ¢/kWh, and <code>nationalAverage</code> is the
          mean across all 50 states.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Interpretation</h2>
        <ul style={{ paddingLeft: 20, marginTop: 0 }}>
          <li>
            <strong>Index &gt; 100</strong> — Above national average (higher
            electricity prices)
          </li>
          <li>
            <strong>Index = 100</strong> — At national average
          </li>
          <li>
            <strong>Index &lt; 100</strong> — Below national average (lower
            electricity prices)
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Limitations</h2>
        <p style={{ marginTop: 0 }}>
          The EPI uses state-level averages only. It does not account for
          within-state variation, time-of-use rates, or customer class
          differences. Rates are energy-only and exclude delivery, taxes, and
          fixed fees.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Data sources</h2>
        <p style={{ marginTop: 0 }}>
          State rates come from our normalized data pipeline. See{" "}
          <Link href="/sources">sources</Link> for provenance.
        </p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/index-ranking">View full Electricity Price Index™ ranking</Link>
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link href="/methodology">← Back to Methodology</Link>
      </p>
    </main>
  );
}
