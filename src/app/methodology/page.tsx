import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Methodology | PriceOfElectricity.com",
  description:
    "Transparent, reproducible scoring systems for electricity prices: Electricity Price Index™, Value Score™, and freshness scoring.",
  alternates: { canonical: `${BASE_URL}/methodology` },
  openGraph: {
    title: "Methodology | PriceOfElectricity.com",
    description:
      "Transparent, reproducible scoring systems for electricity prices.",
    url: `${BASE_URL}/methodology`,
  },
};

export default function MethodologyPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Methodology",
    description:
      "Transparent, reproducible scoring systems for electricity prices on PriceOfElectricity.com.",
    url: `${BASE_URL}/methodology`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Methodology</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        PriceOfElectricity.com publishes transparent, reproducible scoring
        systems used across the site. All formulas are documented below and
        implemented in open source. Rankings and indices are computed from the
        same normalized state data pipeline.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Proprietary metrics</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/methodology/electricity-price-index">
              Electricity Price Index™
            </Link>{" "}
            — State rates normalized to a national baseline of 100
          </li>
          <li>
            <Link href="/methodology/value-score">Value Score™</Link> — Composite
            score combining affordability, price, and data freshness
          </li>
          <li>
            <Link href="/methodology/freshness-scoring">Freshness Scoring</Link> —
            How we classify data as fresh, aging, or stale
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Data foundation</h2>
        <p style={{ marginTop: 0 }}>
          All metrics use state-level average residential electricity prices
          (¢/kWh) from our normalized data pipeline. See{" "}
          <Link href="/sources">sources</Link>,{" "}
          <Link href="/data-policy">data policy</Link>, and{" "}
          <Link href="/about">about</Link> for data provenance and update
          cadence.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Context</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/v/ai-energy/overview">
              AI data centers and demand growth
            </Link>{" "}
            — How emerging demand patterns may affect electricity prices
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/about">About</Link> {" | "}
        <Link href="/research">Research</Link> {" | "}
        <Link href="/datasets">Data downloads</Link> {" | "}
        <Link href="/attribution">How to cite</Link> {" | "}
        <Link href="/citations">Citations</Link>
      </p>
    </main>
  );
}
