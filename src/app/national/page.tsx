import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, LAST_REVIEWED } from "@/lib/site";
import {
  getNationalAverage,
  getMedianRate,
  getHighestState,
  getLowestState,
  getStateCount,
} from "@/lib/nationalStats";
import { getRelatedLinks } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const TITLE = "U.S. Electricity Price Overview";
const DESCRIPTION =
  "National overview of U.S. residential electricity prices including average rate, median rate, highest and lowest states, and links to detailed rankings and analysis.";

export const metadata: Metadata = {
  title: `${TITLE} | PriceOfElectricity.com`,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/national` },
  openGraph: {
    title: `${TITLE} | PriceOfElectricity.com`,
    description: DESCRIPTION,
    url: `${BASE_URL}/national`,
  },
};

export default function NationalPage() {
  const avg = getNationalAverage();
  const median = getMedianRate();
  const highest = getHighestState();
  const lowest = getLowestState();
  const count = getStateCount();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/national`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <p className="muted" style={{ marginBottom: 8 }}>
        <Link href="/">Home</Link> {" → "} National Overview
      </p>

      <h1>{TITLE}</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        A snapshot of U.S. residential electricity pricing across all {count}{" "}
        states, derived from the same normalized data pipeline used across
        PriceOfElectricity.com. All figures are energy-only estimates.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Key figures</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 6,
            }}
          >
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              National average
            </p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
              {avg.toFixed(2)}¢
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              per kWh
            </p>
          </div>
          <div
            style={{
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 6,
            }}
          >
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Median rate
            </p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
              {median.toFixed(2)}¢
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              per kWh
            </p>
          </div>
          <div
            style={{
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 6,
            }}
          >
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Highest rate
            </p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
              {highest.avgRateCentsPerKwh.toFixed(2)}¢
            </p>
            <p style={{ margin: 0, fontSize: 12 }}>
              <Link href={`/${highest.slug}`}>{highest.name}</Link>
            </p>
          </div>
          <div
            style={{
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 6,
            }}
          >
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Lowest rate
            </p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
              {lowest.avgRateCentsPerKwh.toFixed(2)}¢
            </p>
            <p style={{ margin: 0, fontSize: 12 }}>
              <Link href={`/${lowest.slug}`}>{lowest.name}</Link>
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Explore</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
          <li>
            <Link href="/national/rankings">National price rankings</Link> —
            All states ranked by electricity rate
          </li>
          <li>
            <Link href="/national/trends">Rate change trends</Link> — States
            with the largest increases and decreases
          </li>
          <li>
            <Link href="/national/affordability">
              Affordability distribution
            </Link>{" "}
            — How states are distributed across affordability tiers
          </li>
          <li>
            <Link href="/national/extremes">Price extremes</Link> — Top and
            bottom states by rate and index outliers
          </li>
        </ul>
      </section>

      <RelatedLinks links={getRelatedLinks({ kind: "hub", hub: "national" })} />

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/methodology">Methodology</Link>
      </p>
    </main>
  );
}
