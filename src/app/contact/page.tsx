import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Contact | PriceOfElectricity.com",
  description:
    "Contact PriceOfElectricity.com for partnerships, advertising, and data corrections.",
  alternates: {
    canonical: `${BASE_URL}/contact`,
  },
  openGraph: {
    title: "Contact | PriceOfElectricity.com",
    description:
      "Contact PriceOfElectricity.com for partnerships, advertising, and data corrections.",
    url: `${BASE_URL}/contact`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact | PriceOfElectricity.com",
    description:
      "Contact PriceOfElectricity.com for partnerships, advertising, and data corrections.",
  },
};

export default function ContactPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Contact",
    url: `${BASE_URL}/contact`,
    description:
      "Contact PriceOfElectricity.com for partnerships, advertising, and data corrections.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>Contact</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Partnerships, supplier relationships, utility data corrections, and advertising inquiries.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Partnerships / Data corrections</h2>
        <p style={{ marginTop: 0 }}>
          For utility partnerships, supplier collaboration, or corrections to published electricity
          data, email{" "}
          <a href="mailto:contact@priceofelectricity.com">contact@priceofelectricity.com</a>.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Advertising</h2>
        <p style={{ marginTop: 0 }}>
          For sponsorships or ad placements, send your brief, target geography, and timeline to{" "}
          <a href="mailto:contact@priceofelectricity.com">contact@priceofelectricity.com</a>.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Prefer a form?</h2>
        <p style={{ marginTop: 0 }}>
          For advertising and partnership briefs, use the{" "}
          <Link href="/advertise">Advertise with Us</Link> page. For other topics, email works best.
        </p>
      </section>
    </main>
  );
}
