import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = buildMetadata({
  title: "How Generator vs Battery Cost Is Compared | PriceOfElectricity.com",
  description:
    "Fixed assumptions used for generator vs battery operating-cost comparison: battery capacity, efficiency, generator fuel use, and gasoline price.",
  canonicalPath: "/methodology/generator-vs-battery-cost",
});

export default function GeneratorVsBatteryCostMethodologyPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How Generator vs Battery Cost Is Compared",
    description:
      "Methodology for comparing generator fuel cost with battery recharge cost.",
    url: `${BASE_URL}/methodology/generator-vs-battery-cost`,
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
        <Link href="/methodology">Methodology</Link> {"→"} Generator vs Battery Cost
      </p>
      <h1>How Generator vs Battery Cost Is Compared</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This page explains the fixed assumptions used on the generator vs battery
        cost comparison pages. The comparison is an operating-cost comparison
        only—battery recharge cost vs generator fuel cost per hour.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Fixed assumptions</h2>
        <p style={{ marginTop: 0 }}>
          The site uses these documented assumptions for the comparison:
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li><code>batteryCapacityKwh</code> = 13.5</li>
          <li><code>batteryChargeEfficiency</code> = 0.9</li>
          <li><code>generatorFuelUseGallonsPerHour</code> = 0.75</li>
          <li><code>gasolinePricePerGallon</code> = 3.75</li>
        </ul>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Formulas</h2>
        <p style={{ marginTop: 0 }}>
          Battery recharge cost (with losses):
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
          {`batteryRechargeCostWithLosses =
(13.5 / 0.9) * rateDollarsPerKwh`}
        </pre>
        <p style={{ marginTop: 12 }}>
          Generator cost per hour:
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
          {`generatorCostPerHour =
0.75 * 3.75`}
        </pre>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Scope</h2>
        <p style={{ marginTop: 0 }}>
          The comparison excludes:
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>Purchase price of battery or generator</li>
          <li>Maintenance costs</li>
          <li>Installation costs</li>
          <li>Outage performance (runtime, load capacity)</li>
          <li>Battery lifespan and degradation</li>
        </ul>
        <p style={{ marginTop: 12 }}>
          This is an operating-cost comparison only. Actual total cost of
          ownership depends on usage patterns, equipment lifespan, and local
          conditions.
        </p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/generator-vs-battery-cost">View generator vs battery cost by state</Link>
      </p>

      <p className="muted" style={{ marginTop: 16 }}>
        <Link href="/methodology">← Back to Methodology</Link>
      </p>
    </main>
  );
}
