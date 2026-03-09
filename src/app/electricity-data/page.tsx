import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbListJsonLd } from "@/lib/seo/jsonld";
import JsonLdScript from "@/app/components/seo/JsonLdScript";
import StatusFooter from "@/components/common/StatusFooter";
import TopicClusterNav from "@/components/navigation/TopicClusterNav";
import AboutThisSite from "@/components/navigation/AboutThisSite";
import { getRelease } from "@/lib/knowledge/fetch";

export const dynamic = "force-static";
export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Data Hub – Datasets & Methodology | PriceOfElectricity.com",
  description:
    "Data authority hub: national metrics, state rates, rankings, and downloadable exports. Datasets and methodology used across the site.",
  canonicalPath: "/electricity-data",
});

export default async function ElectricityDataPage() {
  const release = await getRelease();

  const breadcrumbJsonLd = buildBreadcrumbListJsonLd([
    { name: "Home", url: "/" },
    { name: "Electricity Data", url: "/electricity-data" },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbJsonLd} />
      <main className="container">
        <nav aria-label="Breadcrumb" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/data">Data Hub</Link>
          {" · "}
          <span aria-current="page">Electricity Data</span>
        </nav>

        <h1 style={{ fontSize: 32, marginBottom: 24 }}>Electricity Data</h1>

        {/* Intro */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The high-level data authority hub. Explains the datasets used throughout the site—national metrics, state-level rates, rankings, and downloadable exports—and how they support cost pages, affordability analysis, and rankings.
          </p>
          <p className="muted" style={{ margin: "0 0 24px 0", fontSize: 14, maxWidth: "50ch" }}>
            <strong>Best for:</strong> Understanding data sources, seeing datasets and data structure, finding downloadable exports.
          </p>
        </section>

        <AboutThisSite
          title="About this site"
          description="Data-driven electricity analysis. Methodology and datasets are published for verification."
          links={[
            { href: "/future-expansion", label: "Future expansion framework" },
            { href: "/datasets", label: "Datasets" },
            { href: "/methodology", label: "Methodology" },
            { href: "/operating-playbook", label: "Operating playbook" },
            { href: "/electricity-shopping", label: "Electricity shopping" },
            { href: "/discovery-graph", label: "Discovery graph" },
            { href: "/entity-registry", label: "Entity registry" },
            { href: "/site-maintenance", label: "Site maintenance" },
          ]}
        />

        {/* B) National Electricity Data */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>National Electricity Data</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            National electricity metrics include the U.S. average residential rate, median rate, dispersion metrics, and highest and lowest states. These figures are derived from EIA residential retail data and used across the site for context and comparison.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/datasets">View datasets</Link>
            {" — "}
            Download JSON and CSV exports
          </p>
        </section>

        {/* C) State Electricity Data */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>State Electricity Data</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            State electricity rate datasets provide average residential rates (¢/kWh), estimated monthly and annual bills at 900 kWh, and comparison to the national average. Each state has its own data record used for cost pages, affordability analysis, and rankings.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/electricity-cost">Electricity Cost by State</Link>
              {" — "}
              Rates and estimated costs
            </li>
            <li>
              <Link href="/average-electricity-bill">Average Electricity Bill</Link>
              {" — "}
              Monthly and annual bill estimates by state
            </li>
            <li>
              <Link href="/why-electricity-prices-rise">Why electricity prices change</Link>
              {" — "}
              Factors that drive electricity price increases
            </li>
            <li>
              <Link href="/power-generation-mix">Explore power generation mix and electricity prices</Link>
              {" — "}
              How fuel mix and generation context can influence prices
            </li>
            <li>
              <Link href="/electricity-markets">Explore electricity market structures</Link>
              {" — "}
              How market structure and regulation affect pricing
            </li>
            <li>
              <Link href="/regional-electricity-markets">Explore regional electricity markets</Link>
              {" — "}
              Why electricity prices differ across regions
            </li>
            <li>
              <Link href="/electricity-providers">Explore electricity providers by state</Link>
              {" — "}
              State-level provider context and market structure
            </li>
            <li>
              <Link href="/electricity-generation-cost-drivers">Explore electricity generation cost drivers</Link>
              {" — "}
              Fuel costs, infrastructure, and cost drivers
            </li>
            <li>
              <Link href="/business-electricity-options">Explore business electricity options by state</Link>
              {" — "}
              State-level context for how businesses compare electricity options
            </li>
            <li>
              <Link href="/business-electricity-cost-decisions">Explore business electricity cost decisions</Link>
              {" — "}
              How electricity prices influence business planning and location decisions
            </li>
            <li>
              <Link href="/data-center-electricity-cost">See electricity price context for AI infrastructure</Link>
              {" — "}
              Data center electricity cost by state
            </li>
            <li>
              <Link href="/solar-vs-grid-electricity-cost">Explore solar vs grid electricity economics</Link>
              {" — "}
              Grid electricity price context for solar
            </li>
            <li>
              <Link href="/battery-backup-electricity-cost">Explore battery recharge electricity costs</Link>
              {" — "}
              Grid electricity cost for charging home battery systems
            </li>
          </ul>
        </section>

        {/* D) Rankings and Metrics */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Rankings and Metrics</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            The site generates rankings from the underlying data, including electricity price rankings (rate high-to-low, rate low-to-high), volatility rankings, inflation rankings (1-year and 5-year), affordability rankings, value score, and momentum. All rankings are build-generated and deterministic.
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/knowledge/rankings">View all rankings</Link>
          </p>
        </section>

        {/* E) Dataset Downloads */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Dataset Downloads</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            Downloadable datasets are available in JSON and CSV format. Files are served from <code>public/datasets</code> and updated at build time.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/datasets/electricity-prices-by-state">Electricity Prices by State</Link>
              {" — "}
              State-level rates, national comparison, momentum
            </li>
            <li>
              <Link href="/datasets/electricity-rankings">Electricity Rankings</Link>
              {" — "}
              All state rankings in one dataset
            </li>
          </ul>
        </section>

        {/* F) Methodology and Transparency */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Methodology and Transparency</h2>
          <p style={{ marginTop: 0, marginBottom: 12, maxWidth: "65ch", fontSize: 16, lineHeight: 1.6 }}>
            For detailed methodology, formulas, and data provenance, see our methodology pages and data registry.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>
              <Link href="/methodology">Methodology</Link>
              {" — "}
              How rates, inflation, and affordability are calculated
            </li>
            <li>
              <Link href="/data-registry">Data Registry</Link>
              {" — "}
              Registry of datasets used by the site
            </li>
          </ul>
        </section>

        {/* How to verify this site */}
        <section style={{ marginBottom: 32, padding: "14px 18px", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px 0" }}>How to verify this site</h2>
          <p style={{ margin: "0 0 8px 0", fontSize: 14, lineHeight: 1.5 }}>
            To evaluate our analysis: review the <Link href="/methodology">methodology</Link>, inspect <Link href="/datasets">downloadable datasets</Link>, browse <Link href="/electricity-topics">topic hubs</Link> and <Link href="/discovery-graph">discovery pages</Link>, and compare <Link href="/knowledge/rankings">state rankings</Link>.
          </p>
        </section>

        <TopicClusterNav
          title="Related pages"
          description="Connect to topic hubs, discovery, and data."
          links={[
            { href: "/electricity-topics", label: "Browse the major electricity economics topic clusters" },
            { href: "/electricity-cost", label: "Electricity cost by state" },
            { href: "/electricity-inflation", label: "Electricity inflation" },
            { href: "/electricity-affordability", label: "Electricity affordability" },
            { href: "/datasets", label: "Download datasets" },
            { href: "/page-index", label: "Browse all major pages by category" },
            { href: "/discovery-graph", label: "View the machine-readable topic relationship map" },
          ]}
        />

        <StatusFooter release={release} />
      </main>
    </>
  );
}
