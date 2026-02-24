import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/data/guides";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Electricity Guides | PriceOfElectricity.com",
  description:
    "Educational guides on electricity bills, kWh, plan types, and state-level price drivers.",
  alternates: {
    canonical: `${BASE_URL}/guides`,
  },
  openGraph: {
    title: "Electricity Guides | PriceOfElectricity.com",
    description:
      "Educational guides on electricity bills, kWh, plan types, and state-level price drivers.",
    url: `${BASE_URL}/guides`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Electricity Guides | PriceOfElectricity.com",
    description:
      "Educational guides on electricity bills, kWh, plan types, and state-level price drivers.",
  },
};

export default function GuidesIndexPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Electricity Guides",
    url: `${BASE_URL}/guides`,
    description:
      "Educational guides on electricity bills, kWh, plan types, and state-level price drivers.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>Electricity Guides</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Practical explainers for common electricity questions, pricing concepts, and plan decisions.
      </p>
      <ul style={{ paddingLeft: 20 }}>
        {GUIDES.map((guide) => (
          <li key={guide.slug} style={{ marginBottom: 12 }}>
            <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
            <div className="muted">{guide.description}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
