import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import ExploreMore from "@/components/navigation/ExploreMore";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Site Map | PriceOfElectricity.com",
  description:
    "High-level site structure and navigation. Topic clusters, electricity data, knowledge, datasets, methodology, and discovery pages.",
  canonicalPath: "/site-map",
});

const SECTIONS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Topic Clusters",
    links: [
      { href: "/electricity-topics", label: "Electricity topics hub" },
      { href: "/electricity-data", label: "Electricity data" },
      { href: "/electricity-inflation", label: "Electricity inflation" },
      { href: "/electricity-affordability", label: "Electricity affordability" },
      { href: "/electricity-price-volatility", label: "Electricity price volatility" },
    ],
  },
  {
    title: "Electricity Data",
    links: [
      { href: "/electricity-cost", label: "Electricity cost by state" },
      { href: "/average-electricity-bill", label: "Average electricity bill" },
      { href: "/electricity-cost-calculator", label: "Electricity cost calculator" },
    ],
  },
  {
    title: "Insights",
    links: [
      { href: "/electricity-trends", label: "Electricity trends" },
      { href: "/electricity-insights", label: "Electricity insights" },
    ],
  },
  {
    title: "Knowledge",
    links: [
      { href: "/knowledge", label: "Knowledge Hub" },
      { href: "/knowledge/rankings", label: "Rankings" },
      { href: "/knowledge/pages", label: "State pages" },
    ],
  },
  {
    title: "Datasets",
    links: [
      { href: "/datasets", label: "Datasets" },
      { href: "/datasets/electricity-prices-by-state", label: "Electricity prices by state" },
      { href: "/datasets/electricity-rankings", label: "Electricity rankings" },
    ],
  },
  {
    title: "Methodology",
    links: [
      { href: "/methodology", label: "Methodology" },
      { href: "/methodology/electricity-rates", label: "How electricity rates are presented" },
      { href: "/methodology/electricity-inflation", label: "How electricity inflation is calculated" },
      { href: "/methodology/electricity-affordability", label: "How electricity affordability is estimated" },
    ],
  },
  {
    title: "AI Energy",
    links: [
      { href: "/ai-energy-demand", label: "AI energy demand" },
      { href: "/ai-energy-demand/data-centers-electricity", label: "Data centers and electricity" },
      { href: "/ai-energy-demand/ai-power-consumption", label: "AI power consumption" },
    ],
  },
  {
    title: "Market structure & infrastructure",
    links: [
      { href: "/power-generation-mix", label: "Power generation mix" },
      { href: "/electricity-markets", label: "Electricity markets" },
      { href: "/regional-electricity-markets", label: "Regional electricity markets" },
      { href: "/electricity-generation-cost-drivers", label: "Electricity generation cost drivers" },
      { href: "/grid-capacity-and-electricity-demand", label: "Grid capacity and electricity demand" },
      { href: "/electricity-providers", label: "Electricity providers by state" },
      { href: "/shop-electricity", label: "Shop for electricity by state" },
      { href: "/business-electricity-options", label: "Business electricity options by state" },
      { href: "/business-electricity-cost-decisions", label: "Business electricity cost decisions" },
    ],
  },
  {
    title: "Discovery",
    links: [
      { href: "/discovery-graph", label: "Discovery graph" },
      { href: "/entity-registry", label: "Entity registry" },
      { href: "/page-index", label: "Page index" },
      { href: "/data-registry", label: "Data registry" },
      { href: "/launch-checklist", label: "Launch checklist" },
      { href: "/growth-roadmap", label: "Electricity content growth roadmap" },
      { href: "/site-maintenance", label: "Site maintenance" },
    ],
  },
];

export default function SiteMapPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Site Map",
    description: "Complete site map of PriceOfElectricity.com.",
    url: `${BASE_URL}/site-map`,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Site Map</h1>

      <p className="intro muted" style={{ marginTop: 0, marginBottom: 8 }}>
        A transparency and discovery asset. Shows the high-level site structure so visitors and crawlers can understand scope. Navigate by section: topic clusters, electricity data, insights, knowledge, datasets, methodology, and discovery.
      </p>
      <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 14, maxWidth: "50ch" }}>
        <strong>Best for:</strong> Seeing the overall site structure at a glance.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.title} style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{section.title}</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            {section.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
                {" "}
                <span className="muted" style={{ fontSize: 14 }}>({link.href})</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <ExploreMore
        title="Related discovery pages"
        links={[
          { href: "/electricity-topics", label: "Electricity topics hub" },
          { href: "/page-index", label: "Page index" },
          { href: "/entity-registry", label: "Entity registry" },
          { href: "/discovery-graph", label: "Discovery graph" },
          { href: "/electricity-data", label: "Electricity data" },
          { href: "/knowledge", label: "Knowledge Hub" },
        ]}
      />

      <p className="muted" style={{ marginTop: 32 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/data-registry">Data Registry</Link> {" | "}
        <Link href="/page-index">Page Index</Link> {" | "}
        <Link href="/launch-checklist">Launch checklist</Link>
      </p>
    </main>
  );
}
