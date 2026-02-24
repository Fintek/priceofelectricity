import type { Metadata } from "next";
import Link from "next/link";
import BillEstimator from "../components/BillEstimator";
import { STATES } from "@/data/states";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";
import { getRelatedForTool } from "@/lib/related";
import RelatedLinks from "@/app/components/RelatedLinks";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

const stateEntries = Object.entries(STATES);
const nationalAverageRate =
  stateEntries.reduce((sum, [, state]) => sum + state.avgRateCentsPerKwh, 0) /
  stateEntries.length;

const top10Highest = [...stateEntries]
  .sort((a, b) => b[1].avgRateCentsPerKwh - a[1].avgRateCentsPerKwh)
  .slice(0, 10);

const top10Lowest = [...stateEntries]
  .sort((a, b) => a[1].avgRateCentsPerKwh - b[1].avgRateCentsPerKwh)
  .slice(0, 10);

export const metadata: Metadata = {
  title: "Electricity Bill Calculator (kWh to Dollars) | PriceOfElectricity.com",
  description:
    "Estimate your electricity bill using kWh. Convert kWh to dollars using average residential electricity rates.",
  alternates: {
    canonical: `${BASE_URL}/calculator`,
  },
  openGraph: {
    title: "Electricity Bill Calculator (kWh to Dollars) | PriceOfElectricity.com",
    description:
      "Estimate your electricity bill using kWh. Convert kWh to dollars using average residential electricity rates.",
    url: `${BASE_URL}/calculator`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Electricity Bill Calculator (kWh to Dollars) | PriceOfElectricity.com",
    description:
      "Estimate your electricity bill using kWh. Convert kWh to dollars using average residential electricity rates.",
  },
};

export default function CalculatorPage() {
  const faqQ1 = "How do you calculate electricity cost from kWh?";
  const faqA1 =
    "Multiply monthly kWh usage by the electricity rate in cents per kWh, then divide by 100 to convert cents to dollars.";
  const faqQ2 = "What is the average electricity rate?";
  const faqA2 = `This calculator uses a national average based on current state averages: ${nationalAverageRate.toFixed(2)}¢/kWh.`;
  const faqQ3 = "Does this include delivery charges?";
  const faqA3 =
    "No. This is an energy-only estimate and does not include delivery charges, taxes, or fixed utility fees.";

  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Bill Calculator (kWh to Dollars)",
    url: `${BASE_URL}/calculator`,
    description:
      "Estimate your electricity bill using kWh. Convert kWh to dollars using average residential electricity rates.",
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: faqQ1,
        acceptedAnswer: { "@type": "Answer", text: faqA1 },
      },
      {
        "@type": "Question",
        name: faqQ2,
        acceptedAnswer: { "@type": "Answer", text: faqA2 },
      },
      {
        "@type": "Question",
        name: faqQ3,
        acceptedAnswer: { "@type": "Answer", text: faqA3 },
      },
    ],
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <h1>
        Electricity Bill Calculator (kWh to Dollars)
      </h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>

      <p className="intro muted" style={{ marginTop: 0 }}>
        Enter your monthly kWh usage to estimate your electricity cost. This
        calculator uses average residential electricity rates and returns an
        energy-only estimate (no delivery fees, taxes, or fixed charges).
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        New to usage units? Read <Link href="/guides/what-is-kwh">What is kWh?</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        <Link href="/compare">View common bill examples by state</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Explore the cluster:{" "}
        <Link href="/topics/electricity-calculators">Electricity Calculators</Link>.
      </p>
      <p className="muted" style={{ marginTop: 6 }}>
        Get monthly updates - <Link href="/newsletter">join the newsletter</Link>.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>National average example</h2>
        <p style={{ marginTop: 0 }}>
          National average rate used on this page:{" "}
          <b>{nationalAverageRate.toFixed(2)}¢/kWh</b>
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>
            500 kWh: <b>${((500 * nationalAverageRate) / 100).toFixed(2)}</b>
          </li>
          <li>
            1000 kWh: <b>${((1000 * nationalAverageRate) / 100).toFixed(2)}</b>
          </li>
          <li>
            1500 kWh: <b>${((1500 * nationalAverageRate) / 100).toFixed(2)}</b>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Using national average rate</h2>
        <BillEstimator
          rateCentsPerKwh={nationalAverageRate}
          stateSlug="national-average"
        />
      </section>

      <section style={{ marginTop: 28 }}>
        <h2>Check your state’s rate</h2>
        <p className="muted" style={{ marginBottom: 8 }}>
          Top 10 highest-rate states
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 0 }}>
          {top10Highest.map(([slug, state]) => (
            <li key={`high-${slug}`}>
              <Link href={`/${slug}`}>{state.name}</Link> —{" "}
              {state.avgRateCentsPerKwh.toFixed(2)}¢/kWh
            </li>
          ))}
        </ul>

        <p className="muted" style={{ marginTop: 18, marginBottom: 8 }}>
          Top 10 lowest-rate states
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 0 }}>
          {top10Lowest.map(([slug, state]) => (
            <li key={`low-${slug}`}>
              <Link href={`/${slug}`}>{state.name}</Link> —{" "}
              {state.avgRateCentsPerKwh.toFixed(2)}¢/kWh
            </li>
          ))}
        </ul>
      </section>

      <p className="muted" style={{ marginTop: 16, fontSize: 14 }}>
        Looking for deals? <Link href="/offers">Browse offers & savings</Link>.
      </p>

      <RelatedLinks links={getRelatedForTool("calculator")} />

      <section
        style={{
          marginTop: 24,
          paddingTop: 12,
          borderTop: "1px solid #eeeeee",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Partner with us</h2>
        <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
          For advertising, partnerships, or data corrections, <Link href="/contact">contact us</Link>.
        </p>
      </section>
    </main>
  );
}
