import type { Metadata } from "next";
import Link from "next/link";
import { SOURCES } from "@/data/sources";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Data Sources | PriceOfElectricity.com",
  description:
    "Learn where our electricity rate data comes from. We use EIA, state commissions, and other authoritative sources.",
  alternates: {
    canonical: `${BASE_URL}/sources`,
  },
  openGraph: {
    title: "Data Sources | PriceOfElectricity.com",
    description:
      "Learn where our electricity rate data comes from. We use EIA, state commissions, and other authoritative sources.",
    url: `${BASE_URL}/sources`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Data Sources | PriceOfElectricity.com",
    description:
      "Learn where our electricity rate data comes from. We use EIA, state commissions, and other authoritative sources.",
  },
};

export default function SourcesPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Data Sources",
    url: `${BASE_URL}/sources`,
    description:
      "Data sources used for electricity rate information on PriceOfElectricity.com.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Data Sources</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Our electricity rate data is gathered from authoritative public sources.
        Each state page links to its specific source. We prioritize the U.S.
        Energy Information Administration (EIA) and state public utility
        commission data when available.
      </p>

      <p className="muted" style={{ marginTop: 8 }}>
        <Link href="/about">Methodology</Link> {" | "}
        <Link href="/data-policy">Data policy</Link>
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Source profiles</h2>
        <ul style={{ paddingLeft: 20, marginTop: 0 }}>
          {SOURCES.map((source) => (
            <li key={source.slug} style={{ marginBottom: 12 }}>
              <Link href={`/sources/${source.slug}`}>{source.name}</Link>
              <div className="muted" style={{ marginTop: 4 }}>
                {source.description}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/">Back to state list</Link>
      </p>
    </main>
  );
}
