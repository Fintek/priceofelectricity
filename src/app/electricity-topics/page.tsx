import type { Metadata } from "next";
import Link from "next/link";
import { getRelease } from "@/lib/knowledge/fetch";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";
import AboutThisSite from "@/components/navigation/AboutThisSite";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Economics Topics | PriceOfElectricity.com",
  description:
    "Topic navigation hub: consumer costs, price trends, market structure, energy transition, and data. Browse electricity analysis by theme.",
  canonicalPath: "/electricity-topics",
});

export default async function ElectricityTopicsPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Economics Topics", url: "/electricity-topics" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/electricity-trends">Electricity Trends</Link>
          {" · "}
          <span aria-current="page">Electricity Economics Topics</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Economics Topics</h1>

        <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
          The main topic hub for electricity analysis. Browse major topic clusters—consumer costs, price trends, market structure, energy transition, and data—to find the analysis you need.
        </p>
        <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 14, maxWidth: "50ch" }}>
          <strong>Best for:</strong> Browsing topics by theme, understanding how the site&apos;s electricity coverage is organized.
        </p>

        {/* How to navigate this site */}
        <section style={{ marginBottom: 32, padding: "12px 16px", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 6, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0" }}>How to navigate this site</h2>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
            <li><strong>Topic hubs</strong> (like this page) explain major areas and link to related pages.</li>
            <li><strong>State pages</strong> provide local electricity cost context for each state.</li>
            <li><strong>Comparison pages</strong> compare electricity costs between states.</li>
            <li><strong>Datasets and methodology</strong> — <Link href="/electricity-data">Electricity data</Link>, <Link href="/methodology">methodology</Link>, and <Link href="/datasets">downloadable datasets</Link> explain the evidence and how we calculate rates, inflation, and rankings.</li>
            <li><strong>Discovery pages</strong> (page index, site map, entity registry) help browse the system by category.</li>
          </ul>
        </section>

        <AboutThisSite
          title="About this site"
          description="Data-driven electricity analysis. Methodology and datasets are published for verification."
          links={[
            { href: "/future-expansion", label: "Future expansion framework" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/methodology", label: "Methodology" },
            { href: "/datasets", label: "Datasets" },
            { href: "/entity-registry", label: "Entity registry" },
            { href: "/discovery-graph", label: "Discovery graph" },
          ]}
        />

        {/* Section 1 — Electricity Prices */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity Prices</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            These pages analyze household electricity costs, estimated bills, and affordability.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-cost">Electricity cost by state</Link></li>
            <li><Link href="/electricity-cost-calculator">Electricity cost calculator</Link></li>
            <li><Link href="/how-much-does-500-kwh-cost">How much does 500 kWh cost?</Link></li>
            <li><Link href="/how-much-does-1000-kwh-cost">How much does 1000 kWh cost?</Link></li>
            <li><Link href="/how-much-does-2000-kwh-cost">How much does 2000 kWh cost?</Link></li>
            <li><Link href="/electricity-cost-comparison">Compare electricity prices between states</Link></li>
            <li><Link href="/average-electricity-bill">Average electricity bill</Link></li>
            <li><Link href="/electricity-cost-of-living">Electricity cost of living</Link></li>
            <li><Link href="/electricity-affordability">Electricity affordability</Link></li>
            <li><Link href="/shop-electricity">Shop for electricity by state</Link></li>
            <li><Link href="/electricity-shopping">Electricity shopping by state</Link></li>
            <li><Link href="/compare-electricity-plans">Compare electricity plans</Link></li>
            <li><Link href="/electricity-providers">Electricity providers by state</Link></li>
            <li><Link href="/solar-savings">Solar savings potential by state</Link></li>
          </ul>
        </section>

        {/* Section 2 — Electricity Price Trends */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity Price Trends</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            These pages analyze how electricity prices change over time—inflation, volatility, and national trends.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/why-electricity-prices-rise">Why electricity prices rise</Link></li>
            <li><Link href="/electricity-inflation">Electricity inflation</Link></li>
            <li><Link href="/electricity-price-volatility">Electricity price volatility</Link></li>
            <li><Link href="/electricity-trends">Electricity trends</Link></li>
          </ul>
        </section>

        {/* Section 3 — Business and Infrastructure */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Business and Infrastructure</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            How electricity costs affect businesses and computing infrastructure—data centers, AI energy demand, and large-scale power consumers.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/business-electricity-options">Explore business electricity options by state</Link></li>
            <li><Link href="/business-electricity-cost-decisions">Explore business electricity cost decisions</Link></li>
            <li><Link href="/data-center-electricity-cost">Data center electricity cost</Link></li>
            <li><Link href="/ai-energy-demand">AI energy demand</Link></li>
          </ul>
        </section>

        {/* Section 4 — Power Generation Mix */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Power Generation Mix</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            How the mix of fuels and generation resources can influence electricity prices and price stability.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/power-generation-mix">Power generation mix and electricity prices</Link></li>
            <li><Link href="/electricity-generation-cost-drivers">Explore electricity generation cost drivers</Link></li>
            <li><Link href="/power-generation-mix/fuel-costs-and-electricity-prices">Fuel costs and electricity prices</Link></li>
            <li><Link href="/power-generation-mix/generation-mix-and-price-volatility">Generation mix and price volatility</Link></li>
          </ul>
        </section>

        {/* Section 5 — Electricity Market Structures */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Electricity Market Structures</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            How different market structures and regulation can influence electricity pricing patterns across states.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-markets">Explore electricity market structures</Link></li>
            <li><Link href="/regional-electricity-markets">Explore regional electricity markets</Link></li>
            <li><Link href="/electricity-markets/iso-rto-markets">ISO and RTO electricity markets</Link></li>
            <li><Link href="/electricity-markets/regulated-electricity-markets">Regulated electricity markets</Link></li>
          </ul>
        </section>

        {/* Section 6 — Grid and Infrastructure */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Grid and Infrastructure</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            How electricity demand and grid capacity affect pricing—power demand growth, capacity constraints, and infrastructure pressure.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/grid-capacity-and-electricity-demand">Grid capacity and electricity demand</Link></li>
            <li><Link href="/grid-capacity-and-electricity-demand/power-demand-growth">Power demand growth</Link></li>
            <li><Link href="/grid-capacity-and-electricity-demand/grid-capacity-constraints">Grid capacity constraints</Link></li>
          </ul>
        </section>

        {/* Section 7 — Energy Transition */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Energy Transition</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Electricity economics related to solar and energy storage—grid vs solar cost context and battery recharge costs.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/solar-vs-grid-electricity-cost">Solar vs grid electricity cost</Link></li>
            <li><Link href="/battery-backup-electricity-cost">Battery backup electricity cost</Link></li>
          </ul>
        </section>

        {/* Section 8 — Data and Methodology */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Data and Methodology</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Datasets, methodology, and the analysis framework—how the site computes rates, inflation, affordability, and rankings.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2.2 }}>
            <li><Link href="/electricity-data">Electricity data</Link> — See the datasets and data-driven analysis foundation</li>
            <li><Link href="/datasets">Datasets</Link> — Download JSON and CSV exports</li>
            <li><Link href="/methodology">Methodology</Link> — How rates, inflation, and affordability are calculated</li>
            <li><Link href="/page-index">Page index</Link> — Browse all major pages by category</li>
            <li><Link href="/site-map">Site map</Link> — See the high-level site structure</li>
            <li><Link href="/entity-registry">Entity registry</Link> — Explore the site&apos;s core electricity entities</li>
            <li><Link href="/discovery-graph">Discovery graph</Link> — View the machine-readable topic relationship map</li>
          </ul>
        </section>

        <TopicClusterNav
          title="Related pages"
          description="Navigate across electricity economics, price dynamics, and data."
          links={[
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/electricity-price-volatility", label: "Electricity price volatility" },
            { href: "/electricity-data", label: "Electricity data" },
            { href: "/power-generation-mix", label: "Power generation mix" },
            { href: "/electricity-markets", label: "Electricity market structures" },
          ]}
        />

        <p className="muted" style={{ marginTop: 32 }}>
          <Link href="/page-index">Browse all pages by category</Link> {" | "}
          <Link href="/site-map">Site map</Link> {" | "}
          <Link href="/electricity-trends">Electricity trends</Link> {" | "}
          <Link href="/knowledge">Knowledge Hub</Link>
        </p>

        <StatusFooter release={release} />
      </main>
    </>
  );
}
