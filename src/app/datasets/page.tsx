import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import ExploreMore from "@/components/navigation/ExploreMore";
import SectionNav from "@/components/navigation/SectionNav";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Price Datasets – JSON & CSV Downloads | PriceOfElectricity.com",
  description:
    "Download electricity price and ranking datasets by state. JSON and CSV exports for research, analysis, and transparency. No API required.",
  canonicalPath: "/datasets",
});

export default function DatasetsHubPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Datasets",
    description:
      "Downloadable electricity price and ranking datasets derived from build-time electricity data.",
    url: `${BASE_URL}/datasets`,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Datasets</h1>

      <SectionNav
        title="In this section"
        description="Download electricity data and explore methodology."
        links={[
          { href: "/datasets/electricity-prices-by-state", label: "Prices by state" },
          { href: "/datasets/electricity-rankings", label: "Electricity rankings" },
          { href: "/methodology", label: "Methodology" },
          { href: "/data-registry", label: "Data registry" },
          { href: "/knowledge", label: "Knowledge Hub" },
          { href: "/site-map", label: "Site map" },
        ]}
      />

      <p className="intro muted" style={{ marginTop: 0 }}>
        The downloadable evidence layer. PriceOfElectricity.com publishes electricity price and ranking datasets. Use these for research, analysis, or to verify our numbers—no API or runtime computation required.
      </p>
      <p style={{ marginTop: 8, marginBottom: 0, maxWidth: "65ch", fontSize: 14, lineHeight: 1.5 }}>
        <strong>Why download?</strong> Researchers, analysts, and journalists use these datasets to study electricity prices, build models, or cite our data. All exports are static and deterministic.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Available datasets</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <h3 style={{ fontSize: 18, margin: "0 0 8px 0" }}>
              <Link href="/datasets/electricity-prices-by-state">
                Electricity Prices by State
              </Link>
            </h3>
            <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
              State-level rates, national comparison, momentum. JSON and CSV.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/datasets/electricity-prices-by-state.json" download>
                JSON
              </a>
              <a href="/datasets/electricity-prices-by-state.csv" download>
                CSV
              </a>
            </div>
          </div>
          <div
            style={{
              padding: 20,
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 8,
              backgroundColor: "var(--color-surface-alt, #f9fafb)",
            }}
          >
            <h3 style={{ fontSize: 18, margin: "0 0 8px 0" }}>
              <Link href="/datasets/electricity-rankings">
                Electricity Rankings
              </Link>
            </h3>
            <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
              All state rankings in one dataset. Rate, affordability, inflation.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/datasets/electricity-rankings.json" download>
                JSON
              </a>
              <a href="/datasets/electricity-rankings.csv" download>
                CSV
              </a>
            </div>
          </div>
        </div>
      </section>

      <ExploreMore
        title="Explore more"
        links={[
          { href: "/electricity-data", label: "Explore electricity datasets" },
          { href: "/methodology", label: "Methodology" },
          { href: "/data-registry", label: "Data registry" },
          { href: "/knowledge", label: "Knowledge Hub" },
          { href: "/site-map", label: "Site map" },
          { href: "/site-maintenance", label: "Site maintenance" },
          { href: "/electricity-trends", label: "Electricity trends" },
        ]}
      />

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/methodology">Methodology</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/data-policy">Data policy</Link>
      </p>
    </main>
  );
}
