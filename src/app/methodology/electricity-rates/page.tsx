import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = buildMetadata({
  title: "How Electricity Rates Are Presented | PriceOfElectricity.com",
  description:
    "How the site presents electricity rates in cents per kWh, converts to dollar-based monthly estimates, and the usage assumptions behind bill estimates.",
  canonicalPath: "/methodology/electricity-rates",
});

export default function ElectricityRatesMethodologyPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "How Electricity Rates Are Presented",
    description:
      "Methodology for presenting electricity rates in cents per kWh and converting to monthly bill estimates.",
    url: `${BASE_URL}/methodology/electricity-rates`,
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
        <Link href="/methodology">Methodology</Link> {"→"} Electricity Rates
      </p>
      <h1>How Electricity Rates Are Presented</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        This page explains how PriceOfElectricity.com presents electricity rates
        and converts them into dollar-based monthly estimates.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>What an average electricity rate means</h2>
        <p style={{ marginTop: 0 }}>
          The site uses state-level average residential electricity rates. These
          are blended averages across customer classes and utilities within each
          state. They represent energy-only prices and typically exclude
          delivery charges, taxes, and fixed fees that vary by utility.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Rates in cents per kWh</h2>
        <p style={{ marginTop: 0 }}>
          All rates are presented in <strong>cents per kilowatt-hour (¢/kWh)</strong>.
          This is the standard unit for residential electricity pricing in the
          United States. To convert to dollars per kWh, divide by 100.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Conversion to monthly bill estimates</h2>
        <p style={{ marginTop: 0 }}>
          The site converts cents per kWh to dollar-based monthly estimates using
          a standard usage assumption. Household bill estimates depend on this
          usage assumption; actual bills vary with consumption, climate, home
          size, and appliance efficiency.
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
          {`rateDollarsPerKwh = avgRateCentsPerKwh / 100
monthlyBill = rateDollarsPerKwh * 900`}
        </pre>
        <p style={{ marginTop: 12 }}>
          The factor <code>900</code> represents 900 kWh of monthly usage, a
          common reference point for typical U.S. residential consumption.
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Limitations</h2>
        <p style={{ marginTop: 0 }}>
          Bill estimates are illustrative only. Actual usage varies by household.
          Time-of-use rates, demand charges, and tiered pricing are not modeled.
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
