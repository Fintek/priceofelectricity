import type { Metadata } from "next";
import Link from "next/link";
import { STATES } from "@/data/states";
import HomepagePersonalization from "@/app/components/HomepagePersonalization";
import AboutThisSite from "@/components/navigation/AboutThisSite";
import { getRateTier, getRateTierLabel } from "@/lib/insights";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";
import { buildMetadata } from "@/lib/seo/metadata";
import { getHomepageCoverageEntries } from "@/lib/stateDestinations";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = buildMetadata({
  title: "Average Electricity Prices by State (¢/kWh) | PriceOfElectricity.com",
  description:
    "Data-driven electricity analysis: state prices, rankings, comparisons, and datasets. Methodology and downloadable data published for verification.",
  canonicalPath: "/",
});

export default function HomePage() {
  const coverageEntries = getHomepageCoverageEntries();

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PriceOfElectricity.com",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: "https://priceofelectricity.com/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData),
        }}
      />
      <h1>Average Electricity Prices by State</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/methodology">Methodology</Link>
      </p>
      <section style={{ marginBottom: 24, padding: "16px 20px", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: 8, backgroundColor: "var(--color-surface-alt, #f9fafb)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px 0" }}>Explore</h2>
        <p className="muted" style={{ margin: "0 0 12px 0", fontSize: 14 }}>
          <Link href="/electricity-topics">Explore electricity topics</Link>
          {" · "}
          <Link href="/electricity-cost">Electricity cost by state</Link>
          {" · "}
          <Link href="/electricity-cost-comparison">Compare electricity costs</Link>
          {" · "}
          <Link href="/electricity-data">Electricity data and datasets</Link>
          {" · "}
          <Link href="/electricity-affordability">Electricity affordability</Link>
          {" · "}
          <Link href="/methodology">Methodology</Link>
          {" · "}
          <Link href="/electricity-inflation">Inflation and volatility</Link>
        </p>
        <p style={{ margin: 0, fontSize: 14 }}>
          <Link href="/electricity-trends">Electricity trends</Link>
          {" · "}
          <Link href="/knowledge">Knowledge Hub</Link>
          {" · "}
          <Link href="/compare">Compare states</Link>
          {" · "}
          <Link href="/electricity-cost-calculator">Calculator</Link>
          {" · "}
          <Link href="/about">About</Link>
        </p>
      </section>
      <p className="intro muted">
        A data-driven electricity analysis site. Compare average electricity price per kWh by state and estimate your monthly bill. Covers state prices, rankings, comparisons, and datasets. Select a state below to see prices (¢/kWh), cost estimates, and how your state compares. Explore methodology and downloadable data for verification.
      </p>

      <AboutThisSite
        title="About this site"
        description="A data-driven electricity analysis site covering state prices, rankings, comparisons, and datasets. Methodology and downloadable data are published for verification."
        links={[
          { href: "/methodology", label: "Methodology" },
          { href: "/electricity-data", label: "Electricity data" },
          { href: "/datasets", label: "Datasets" },
          { href: "/entity-registry", label: "Entity registry" },
          { href: "/discovery-graph", label: "Discovery graph" },
        ]}
      />

      <HomepagePersonalization
        statesMap={Object.fromEntries(
          Object.entries(STATES).map(([k, v]) => [k, v.name])
        )}
      />

      <ul className="list-unstyled" style={{ marginTop: 24 }}>
        {coverageEntries.map((entry) => (
          <li key={entry.slug} style={{ marginBottom: 12 }}>
            <Link
              href={entry.href}
              prefetch={false}
              style={{ fontSize: 18, textDecoration: "underline" }}
            >
              {entry.label}
            </Link>
            {entry.avgRateCentsPerKwh != null ? (
              <>
                <span className="chip">
                  {getRateTierLabel(getRateTier(entry.avgRateCentsPerKwh))}
                </span>
                <span className="muted" style={{ marginLeft: 12 }}>
                  {entry.avgRateCentsPerKwh}¢/kWh
                </span>
              </>
            ) : (
              <span className="chip">Knowledge</span>
            )}
            <span className="muted" style={{ marginLeft: 12 }}>
              {entry.avgRateCentsPerKwh != null
                ? null
                : "State-like knowledge coverage"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
