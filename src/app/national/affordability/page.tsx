import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import { getAffordabilityDistribution, getStateCount } from "@/lib/nationalStats";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "Electricity Affordability Distribution";
const DESCRIPTION =
  "How U.S. states are distributed across electricity affordability tiers, from Very Affordable to Very Expensive.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/national/affordability` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/affordability`,
  },
};

const TIER_COLORS: Record<string, string> = {
  "Very Affordable": "#2a7",
  Affordable: "#5b5",
  Average: "#888",
  Expensive: "#c93",
  "Very Expensive": "#c44",
};

export default function NationalAffordabilityPage() {
  const distribution = getAffordabilityDistribution();
  const total = getStateCount();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/national/affordability`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "}
        <Link href="/national">National Overview</Link> {" → "} Affordability
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        The Electricity Affordability Index normalizes state rates on a 0–100
        scale (100 = most affordable). States are grouped into five tiers based
        on their score. This page shows how all {total} states are distributed
        across those tiers.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>
          Distribution by tier
        </h2>

        {distribution.map((tier) => {
          const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0;
          return (
            <div
              key={tier.category}
              style={{
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: TIER_COLORS[tier.category] ?? "#888",
                    flexShrink: 0,
                  }}
                />
                <h3 style={{ margin: 0, fontSize: 18 }}>{tier.category}</h3>
                <span className="muted" style={{ fontSize: 14 }}>
                  — {tier.count} state{tier.count !== 1 ? "s" : ""} ({pct}%)
                </span>
              </div>

              <div
                style={{
                  height: 8,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    backgroundColor: TIER_COLORS[tier.category] ?? "#888",
                    borderRadius: 4,
                    minWidth: tier.count > 0 ? 4 : 0,
                  }}
                />
              </div>

              {tier.states.length > 0 && (
                <ul
                  style={{
                    paddingLeft: 20,
                    margin: 0,
                    lineHeight: 1.8,
                    fontSize: 14,
                    columns: tier.states.length > 8 ? 2 : 1,
                  }}
                >
                  {tier.states.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/${s.slug}`} prefetch={false}>
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Related</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/affordability">
              Full affordability ranking table
            </Link>
          </li>
          <li>
            <Link href="/national/rankings">National price rankings</Link>
          </li>
          <li>
            <Link href="/methodology/value-score">
              Value Score™ methodology
            </Link>
          </li>
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/national">National overview</Link> {" | "}
        <Link href="/national/extremes">Extremes</Link> {" | "}
        <Link href="/compare">Compare</Link>
      </p>
    </main>
  );
}
