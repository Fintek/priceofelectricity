import type { Metadata } from "next";
import Link from "next/link";
import NewsletterForm from "@/app/components/NewsletterForm";
import { STATE_LIST } from "@/data/states";
import { LAST_REVIEWED, SITE_URL, UPDATE_CADENCE_TEXT } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Electricity Price Updates Newsletter | PriceOfElectricity.com",
  description: "Get monthly electricity price updates by state and bill-saving tips.",
  alternates: {
    canonical: `${BASE_URL}/newsletter`,
  },
  openGraph: {
    title: "Electricity Price Updates Newsletter | PriceOfElectricity.com",
    description: "Get monthly electricity price updates by state and bill-saving tips.",
    url: `${BASE_URL}/newsletter`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Electricity Price Updates Newsletter | PriceOfElectricity.com",
    description: "Get monthly electricity price updates by state and bill-saving tips.",
  },
};

export default function NewsletterPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Price Updates (Monthly)",
    url: `${BASE_URL}/newsletter`,
    description: "Get monthly electricity price updates by state and bill-saving tips.",
  };

  const states = STATE_LIST.map((state) => ({ slug: state.slug, name: state.name }));

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>Electricity Price Updates (Monthly)</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: 8 }}>
        {UPDATE_CADENCE_TEXT} {"•"} Last reviewed {LAST_REVIEWED} {"•"}{" "}
        <Link href="/about">Methodology</Link>
      </p>
      <p className="intro muted" style={{ marginTop: 0 }}>
        Get a lightweight monthly summary focused on practical electricity price changes and bill
        impact by state.
      </p>

      <ul style={{ paddingLeft: 20, marginTop: 10 }}>
        <li>Monthly updates for your state</li>
        <li>Alerts when a state&apos;s rate changes meaningfully</li>
        <li>Tips to reduce electricity bills</li>
      </ul>

      <NewsletterForm states={states} />
    </main>
  );
}
