import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import ExploreMore from "@/components/navigation/ExploreMore";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Data Registry – Electricity Datasets & Sources | PriceOfElectricity.com",
  description:
    "Registry of electricity datasets used by the site: rate data, rankings, and downloadable exports. Links to methodology and dataset pages.",
  canonicalPath: "/data-registry",
});

const REGISTRY_ITEMS: Array<{
  category: string;
  items: Array<{
    name: string;
    description: string;
    datasetPage?: string;
    methodologyPage?: string;
    knowledgePage?: string;
  }>;
}> = [
  {
    category: "Electricity Rate Data",
    items: [
      {
        name: "National electricity rate dataset",
        description: "National average residential electricity rate and derived metrics.",
        knowledgePage: "/knowledge/national",
        methodologyPage: "/methodology/electricity-rates",
      },
      {
        name: "State electricity datasets",
        description: "State-level average residential rates, comparison, and momentum.",
        knowledgePage: "/knowledge/pages",
        methodologyPage: "/methodology/electricity-rates",
      },
    ],
  },
  {
    category: "Ranking Datasets",
    items: [
      {
        name: "Affordability rankings",
        description: "States ranked by affordability index. Lower estimated bill = more affordable.",
        knowledgePage: "/knowledge/rankings/electricity-affordability",
        methodologyPage: "/methodology/electricity-affordability",
      },
      {
        name: "Inflation rankings",
        description: "1-year and 5-year electricity price change rankings.",
        knowledgePage: "/knowledge/rankings",
        methodologyPage: "/methodology/electricity-inflation",
      },
      {
        name: "Price rankings",
        description: "Rate high-to-low, rate low-to-high, value score, momentum.",
        knowledgePage: "/knowledge/rankings",
        methodologyPage: "/methodology/electricity-rates",
      },
    ],
  },
  {
    category: "Downloadable Datasets",
    items: [
      {
        name: "Electricity prices by state",
        description: "Flat export of state rates, national comparison, momentum. JSON and CSV.",
        datasetPage: "/datasets/electricity-prices-by-state",
        methodologyPage: "/methodology/electricity-rates",
      },
      {
        name: "Electricity rankings",
        description: "All state rankings in one flat dataset. JSON and CSV.",
        datasetPage: "/datasets/electricity-rankings",
        knowledgePage: "/knowledge/rankings",
      },
    ],
  },
];

export default function DataRegistryPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Data Registry",
    description: "Registry of datasets used by PriceOfElectricity.com.",
    url: `${BASE_URL}/data-registry`,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Data Registry</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        A transparency and discovery asset. Registry of electricity datasets used by the site. Each entry links to dataset pages, methodology, and knowledge pages for verification and discoverability.
      </p>

      <section style={{ marginTop: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Topic Clusters</h2>
        <p className="muted" style={{ margin: "0 0 8px 0", fontSize: 14 }}>
          <Link href="/discovery-graph">Explore the site&apos;s discovery graph</Link>
          {" · "}
          <Link href="/electricity-topics">Electricity topics hub</Link>
          {" · "}
          <Link href="/electricity-data">Electricity data</Link>
          {" · "}
          <Link href="/electricity-inflation">Electricity inflation</Link>
          {" · "}
          <Link href="/electricity-affordability">Electricity affordability</Link>
          {" · "}
          <Link href="/electricity-price-volatility">Electricity price volatility</Link>
        </p>
      </section>

      {REGISTRY_ITEMS.map((group) => (
        <section key={group.category} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{group.category}</h2>
          <ul style={{ paddingLeft: 20, listStyle: "none" }}>
            {group.items.map((item) => (
              <li key={item.name} style={{ marginBottom: 16 }}>
                <strong>{item.name}</strong>
                <p className="muted" style={{ margin: "4px 0 8px 0", fontSize: 14 }}>
                  {item.description}
                </p>
                <span style={{ fontSize: 14 }}>
                  {item.datasetPage && (
                    <>
                      <Link href={item.datasetPage}>Dataset page</Link>
                      {(item.methodologyPage || item.knowledgePage) && " · "}
                    </>
                  )}
                  {item.methodologyPage && (
                    <>
                      <Link href={item.methodologyPage}>Methodology</Link>
                      {item.knowledgePage && " · "}
                    </>
                  )}
                  {item.knowledgePage && <Link href={item.knowledgePage}>Knowledge</Link>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <ExploreMore
        title="Explore more"
        links={[
          { href: "/entity-registry", label: "Electricity analysis entities" },
          { href: "/electricity-data", label: "Electricity data sources" },
          { href: "/datasets", label: "Datasets" },
          { href: "/site-map", label: "Site map" },
          { href: "/page-index", label: "Page index" },
          { href: "/knowledge", label: "Knowledge Hub" },
          { href: "/methodology", label: "Methodology" },
          { href: "/launch-checklist", label: "Launch checklist" },
        ]}
      />

      <p className="muted" style={{ marginTop: 32 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/site-map">Site Map</Link> {" | "}
        <Link href="/page-index">Page Index</Link> {" | "}
        <Link href="/launch-checklist">Launch checklist</Link>
      </p>
    </main>
  );
}
