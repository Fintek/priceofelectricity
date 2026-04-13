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
    "Compare average residential electricity prices by state, estimate monthly bills, and track rate changes across the United States.",
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

      {/* ── HERO ── */}
      <h1>Average Electricity Prices by State</h1>
      <p style={{ marginTop: 0, marginBottom: 16, maxWidth: "60ch", lineHeight: 1.6 }}>
        Compare residential electricity rates across all 50 states, estimate your monthly bill, and see how your state ranks.
      </p>
      <p className="muted" style={{ marginTop: 0, marginBottom: 20, fontSize: 13 }}>
        {UPDATE_CADENCE_TEXT} · Last reviewed {LAST_REVIEWED} ·{" "}
        <Link href="/methodology">Methodology</Link> ·{" "}
        <Link href="/datasets">Data</Link>
      </p>

      {/* ── PRIMARY PATHWAYS ── */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <Link href="/compare" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Compare States</div>
            <div className="stat-card-label">Side-by-side rate comparison</div>
          </Link>
          <Link href="/electricity-cost-calculator" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bill Calculator</div>
            <div className="stat-card-label">Estimate your monthly cost</div>
          </Link>
          <Link href="/electricity-bill-estimator" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Bill Estimator</div>
            <div className="stat-card-label">Household-specific estimates</div>
          </Link>
          <Link href="/electricity-cost" className="stat-card" style={{ textDecoration: "none", color: "inherit", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Cost by State</div>
            <div className="stat-card-label">Detailed state cost data</div>
          </Link>
        </div>
      </section>

      <HomepagePersonalization
        statesMap={Object.fromEntries(
          Object.entries(STATES).map(([k, v]) => [k, v.name])
        )}
      />

      {/* ── STATE LIST ── */}
      <section>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Select your state</h2>
        <div className="homepage-state-grid">
          {coverageEntries.map((entry) => (
            <Link
              key={entry.slug}
              href={entry.href}
              prefetch={false}
              className="homepage-state-item"
            >
              <span className="homepage-state-name">{entry.label}</span>
              <span className="homepage-state-rate">
                {entry.avgRateCentsPerKwh}¢
                <span className="chip" style={{ marginLeft: 6 }}>
                  {getRateTierLabel(getRateTier(entry.avgRateCentsPerKwh))}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── EXPLORE MORE ── */}
      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>Explore more</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, fontSize: 14 }}>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Analysis</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li><Link href="/electricity-trends">Trends</Link></li>
              <li><Link href="/electricity-insights">Insights</Link></li>
              <li><Link href="/electricity-affordability">Affordability</Link></li>
              <li><Link href="/electricity-inflation">Inflation &amp; volatility</Link></li>
            </ul>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Data</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li><Link href="/datasets">Datasets</Link></li>
              <li><Link href="/methodology">Methodology</Link></li>
              <li><Link href="/knowledge">Knowledge</Link></li>
              <li><Link href="/research">Research</Link></li>
            </ul>
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>Tools</p>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2 }}>
              <li><Link href="/electricity-cost-comparison">Cost comparisons</Link></li>
              <li><Link href="/energy-comparison">Energy comparison</Link></li>
              <li><Link href="/electricity-topics">Topics</Link></li>
              <li><Link href="/about">About &amp; trust</Link></li>
            </ul>
          </div>
        </div>
      </section>

      <div style={{ paddingTop: 24 }}>
        <AboutThisSite
          title="About PriceOfElectricity.com"
          description="Independent electricity price data covering all 50 states. Methodology and downloadable datasets are published for verification."
          links={[
            { href: "/methodology", label: "Methodology" },
            { href: "/datasets", label: "Datasets" },
            { href: "/electricity-data", label: "Data" },
            { href: "/about", label: "About" },
          ]}
        />
      </div>
    </main>
  );
}
