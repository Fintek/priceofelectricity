import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = buildMetadata({
  title: "How Electricity Inflation Is Calculated | PriceOfElectricity.com",
  description:
    "How the site compares current electricity rates with historical rates and computes 1-year and 5-year percentage changes.",
  canonicalPath: "/methodology/electricity-inflation",
});

export default function ElectricityInflationMethodologyPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How Electricity Inflation Is Calculated",
    description:
      "Methodology for computing electricity inflation and 1-year and 5-year percentage changes.",
    url: `${BASE_URL}/methodology/electricity-inflation`,
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
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/methodology">Methodology</Link> {"→"} Electricity Inflation
      </p>
      <h1>How Electricity Inflation Is Calculated</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This page explains how PriceOfElectricity.com compares current electricity
        rates with historical rates and computes percentage changes over time.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Comparing current vs historical rates</h2>
        <p style={{ marginTop: 0 }}>
          The site uses state-level average residential electricity rates from its
          normalized data pipeline. To compute inflation, the current rate is
          compared with the rate from the same period one year ago (for 1-year
          change) or five years ago (for 5-year change). Monthly data is
          aggregated by period; the most recent complete period is used as the
          &quot;current&quot; rate.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>1-year and 5-year percentage changes</h2>
        <p style={{ marginTop: 0 }}>
          Percentage change is computed as the difference between the current rate
          and the historical rate, divided by the historical rate, multiplied by
          100. Positive values indicate price increases; negative values indicate
          decreases.
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
          {`inflation1yPercent =
((currentRate - rate1YearAgo) / rate1YearAgo) * 100

inflation5yPercent =
((currentRate - rate5YearsAgo) / rate5YearsAgo) * 100`}
        </pre>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Missing historical data</h2>
        <p style={{ marginTop: 0 }}>
          If historical data is missing for a state or period, that state may be
          excluded from rankings or summaries that rely on inflation metrics.
          The site does not extrapolate or interpolate missing values.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Data sources</h2>
        <p style={{ marginTop: 0 }}>
          State rates come from the site&apos;s normalized data pipeline. See{" "}
          <Link href="/sources">sources</Link> for provenance.
        </p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/electricity-trends">View electricity trends</Link>
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link href="/methodology">← Back to Methodology</Link>
      </p>
    </main>
  );
}
