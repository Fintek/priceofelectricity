import type { Metadata } from "next";
import Link from "next/link";
import { STATE_LIST, STATES } from "@/data/states";
import HomepagePersonalization from "@/app/components/HomepagePersonalization";
import { getRateTier, getRateTierLabel } from "@/lib/insights";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Price of Electricity by State (¢/kWh) + Bill Estimator | PriceOfElectricity.com",
  description:
    "Compare average residential electricity prices by state and estimate your monthly bill.",
  alternates: {
    canonical: `${BASE_URL}/`,
  },
  openGraph: {
    title: "Price of Electricity by State (¢/kWh) + Bill Estimator | PriceOfElectricity.com",
    description:
      "Compare average residential electricity prices by state and estimate your monthly bill.",
    url: `${BASE_URL}/`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Price of Electricity by State (¢/kWh) + Bill Estimator | PriceOfElectricity.com",
    description:
      "Compare average residential electricity prices by state and estimate your monthly bill.",
  },
};

export default function HomePage() {
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
      <h1>Price of Electricity</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p style={{ marginTop: 0, marginBottom: 12 }}>
        <Link href="/about" className="muted">
          About / Methodology
        </Link>{" "}
        |{" "}
        <Link href="/compare" className="muted">
          Compare states
        </Link>{" "}
        |{" "}
        <Link href="/affordability" className="muted">
          Affordability index
        </Link>{" "}
        |{" "}
        <Link href="/value-ranking" className="muted">
          Value ranking
        </Link>{" "}
        |{" "}
        <Link href="/calculator" className="muted">
          National calculator
        </Link>
      </p>
      <p className="intro muted">
        Select a state to see residential electricity rates and estimate your
        bill.
      </p>

      <HomepagePersonalization
        statesMap={Object.fromEntries(
          Object.entries(STATES).map(([k, v]) => [k, v.name])
        )}
      />

      <ul className="list-unstyled" style={{ marginTop: 24 }}>
        {STATE_LIST.map((state) => (
          <li key={state.slug} style={{ marginBottom: 12 }}>
            <Link
              href={`/${encodeURIComponent(state.slug)}`}
              prefetch={false}
              style={{ fontSize: 18, textDecoration: "underline" }}
            >
              {state.name}
            </Link>
            <span className="chip">
              {getRateTierLabel(getRateTier(state.avgRateCentsPerKwh))}
            </span>
            <span className="muted" style={{ marginLeft: 12 }}>
              {state.avgRateCentsPerKwh}¢/kWh
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
