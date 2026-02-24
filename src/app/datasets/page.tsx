import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import TrackLink from "@/app/components/TrackLink";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Electricity Data Downloads | PriceOfElectricity.com",
  description:
    "Download electricity rate datasets for all 50 U.S. states in JSON and CSV format. Includes affordability index and value score rankings.",
  alternates: { canonical: `${BASE_URL}/datasets` },
  openGraph: {
    title: "Electricity Data Downloads | PriceOfElectricity.com",
    description:
      "Download electricity rate datasets for all 50 U.S. states in JSON and CSV format.",
    url: `${BASE_URL}/datasets`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Electricity Data Downloads | PriceOfElectricity.com",
    description:
      "Download electricity rate datasets for all 50 U.S. states in JSON and CSV format.",
  },
};

export default function DatasetsIndexPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Data Downloads",
    url: `${BASE_URL}/datasets`,
    description:
      "Download electricity rate datasets for all 50 U.S. states in JSON and CSV format.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Electricity Data Downloads</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Download structured electricity rate data for all 50 U.S. states. All
        datasets are derived from the same normalized data pipeline and updated
        monthly.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Available datasets</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <TrackLink
              href="/api/datasets/states.json"
              eventName="data_download_click"
              payload={{ dataset: "states-json" }}
            >
              States (JSON)
            </TrackLink>{" "}
            — All states
            with rate, affordability index, value score, and freshness status
          </li>
          <li>
            <TrackLink
              href="/api/datasets/states.csv"
              eventName="data_download_click"
              payload={{ dataset: "states-csv" }}
            >
              States (CSV)
            </TrackLink>{" "}
            — Same dataset
            in CSV format, sorted alphabetically
          </li>
          <li>
            <TrackLink
              href="/api/datasets/value-ranking.csv"
              eventName="data_download_click"
              payload={{ dataset: "value-ranking-csv" }}
            >
              Value Ranking (CSV)
            </TrackLink>{" "}
            — States ranked by Electricity Value Score™, highest first
          </li>
          <li>
            <TrackLink
              href="/api/datasets/affordability.csv"
              eventName="data_download_click"
              payload={{ dataset: "affordability-csv" }}
            >
              Affordability (CSV)
            </TrackLink>{" "}
            — States ranked by affordability index, most affordable first
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>About this data</h2>
        <p style={{ marginTop: 0 }}>
          Rates reflect state-level average residential electricity prices in
          ¢/kWh. All estimates are energy-only and exclude delivery fees, taxes,
          fixed charges, and other utility fees.
        </p>
        <p className="muted" style={{ marginTop: 6 }}>
          See <Link href="/methodology">methodology</Link>,{" "}
          <Link href="/about">about</Link>, and{" "}
          <Link href="/data-policy">data policy</Link> for details on sources,
          update cadence, and freshness definitions.
        </p>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/methodology">Methodology</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/compare">Compare states</Link> {" | "}
        <Link href="/research">Research</Link>
      </p>
    </main>
  );
}
