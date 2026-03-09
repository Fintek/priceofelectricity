import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = buildMetadata({
  title: "How Electricity Affordability Is Estimated | PriceOfElectricity.com",
  description:
    "How the site estimates electricity affordability using a standard monthly usage assumption and operating-cost comparison.",
  canonicalPath: "/methodology/electricity-affordability",
});

export default function ElectricityAffordabilityMethodologyPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How Electricity Affordability Is Estimated",
    description:
      "Methodology for estimating electricity affordability using standard usage assumptions.",
    url: `${BASE_URL}/methodology/electricity-affordability`,
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
        <Link href="/methodology">Methodology</Link> {"→"} Electricity Affordability
      </p>
      <h1>How Electricity Affordability Is Estimated</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This page explains how PriceOfElectricity.com estimates electricity
        affordability for ranking and comparison purposes.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Standard usage assumption</h2>
        <p style={{ marginTop: 0 }}>
          The site estimates affordability using a standard monthly usage
          assumption of 900 kWh. This is a simplified operating-cost comparison,
          not a complete household budget model. Lower estimated monthly
          electricity cost is treated as more affordable in the current ranking
          system.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Formula</h2>
        <pre
          style={{
            background: "#f5f5f5",
            padding: 16,
            borderRadius: 4,
            overflow: "auto",
            fontSize: 14,
          }}
        >
          {`estimatedMonthlyBill =
(avgRateCentsPerKwh / 100) * 900`}
        </pre>
        <p style={{ marginTop: 12 }}>
          Where <code>avgRateCentsPerKwh</code> is the state&apos;s average
          residential electricity rate in cents per kWh.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Limitations</h2>
        <p style={{ marginTop: 0 }}>
          True affordability can vary with household usage, climate, income, home
          size, and utility structure. The site does not model income, tax
          credits, or assistance programs. This metric is intended as a
          relative operating-cost comparison across states, not a measure of
          household burden.
        </p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/affordability">View affordability ranking</Link>
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link href="/methodology">← Back to Methodology</Link>
      </p>
    </main>
  );
}
