import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import ExploreMore from "@/components/navigation/ExploreMore";
import SectionNav from "@/components/navigation/SectionNav";
import { buildMetadata } from "@/lib/seo/metadata";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = buildMetadata({
  title: "Electricity Price Methodology & Formulas | PriceOfElectricity.com",
  description:
    "How we calculate electricity rates, inflation, affordability, battery recharge cost, and generator vs battery comparison. Transparent, reproducible formulas.",
  canonicalPath: "/methodology",
});

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

      <SectionNav
        title="In this section"
        description="Core formulas and proprietary metrics."
        links={[
          { href: "/methodology/electricity-rates", label: "Electricity rates" },
          { href: "/methodology/electricity-inflation", label: "Electricity inflation" },
          { href: "/methodology/electricity-affordability", label: "Affordability" },
          { href: "/methodology/battery-recharge-cost", label: "Battery recharge cost" },
          { href: "/methodology/generator-vs-battery-cost", label: "Generator vs battery" },
          { href: "/knowledge", label: "Knowledge Hub" },
        ]}
      />

      <p className="intro muted" style={{ marginTop: 0 }}>
        The calculation and assumptions layer for this site. How we calculate electricity rates, inflation, affordability, battery recharge cost, and generator vs battery comparison. All formulas are documented below and implemented in open source.
      </p>
      <p style={{ marginTop: 8, marginBottom: 0, maxWidth: "65ch", fontSize: 14, lineHeight: 1.5 }}>
        <strong>Why methodology matters:</strong> Transparent formulas build trust and let you verify our numbers. We publish our assumptions so you can judge the data yourself.
      </p>

      <section style={{ marginTop: 24, padding: "14px 18px", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px 0" }}>How to verify this site</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Review the <Link href="/methodology">methodology</Link>, inspect <Link href="/datasets">downloadable datasets</Link>, browse <Link href="/electricity-topics">topic hubs</Link> and <Link href="/discovery-graph">discovery pages</Link>, and compare <Link href="/knowledge/rankings">state rankings</Link>.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Core formulas</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/methodology/electricity-rates">
              How Electricity Rates Are Presented
            </Link>{" "}
            — Rates in ¢/kWh, conversion to monthly bill estimates
          </li>
          <li>
            <Link href="/methodology/electricity-inflation">
              How Electricity Inflation Is Calculated
            </Link>{" "}
            — 1-year and 5-year percentage changes
          </li>
          <li>
            <Link href="/methodology/electricity-affordability">
              How Electricity Affordability Is Estimated
            </Link>{" "}
            — Standard usage assumption, operating-cost comparison
          </li>
          <li>
            <Link href="/methodology/battery-recharge-cost">
              How Battery Recharge Cost Is Estimated
            </Link>{" "}
            — Capacity, efficiency, and charging losses
          </li>
          <li>
            <Link href="/methodology/generator-vs-battery-cost">
              How Generator vs Battery Cost Is Compared
            </Link>{" "}
            — Fixed assumptions for operating-cost comparison
          </li>
        </ul>
      </section>

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
          <Link href="/electricity-data">electricity data</Link>,{" "}
          <Link href="/datasets">datasets</Link>,{" "}
          <Link href="/sources">sources</Link>,{" "}
          <Link href="/data-policy">data policy</Link>, and{" "}
          <Link href="/about">about</Link> for data provenance and update
          cadence.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Explore</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/knowledge">Knowledge Hub</Link> — National snapshot, state
            rankings, and methodology
          </li>
          <li>
            <Link href="/electricity-trends">Electricity Trends</Link> — National
            price trends, inflation, and affordability
          </li>
          <li>
            <Link href="/electricity-insights">Electricity Insights</Link> — Most
            expensive and cheapest states, key insights
          </li>
          <li>
            <Link href="/datasets">Download datasets</Link> — JSON and CSV exports
            for electricity prices and rankings
          </li>
          <li>
            <Link href="/site-map">View the site map</Link>
            {" · "}
            <Link href="/data-registry">Browse the data registry</Link>
            {" · "}
            <Link href="/page-index">See the page index</Link>
            {" · "}
            <Link href="/launch-checklist">Review the launch checklist</Link>
          </li>
        </ul>
      </section>

      <ExploreMore
        title="Explore more"
        links={[
          { href: "/knowledge", label: "Knowledge Hub" },
          { href: "/datasets", label: "Datasets" },
          { href: "/electricity-trends", label: "Electricity trends" },
          { href: "/site-map", label: "Site map" },
          { href: "/data-registry", label: "Data registry" },
          { href: "/launch-checklist", label: "Launch checklist" },
          { href: "/site-maintenance", label: "Site maintenance" },
        ]}
      />

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
