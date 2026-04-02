import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import AdvertiserInquiryForm from "./AdvertiserInquiryForm";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Advertise with Us | PriceOfElectricity.com",
  description:
    "Reach people comparing residential electricity prices and bills. Inquire about partnerships and advertising on PriceOfElectricity.com.",
  alternates: {
    canonical: `${BASE_URL}/advertise`,
  },
  openGraph: {
    title: "Advertise with Us | PriceOfElectricity.com",
    description:
      "Reach people comparing residential electricity prices and bills. Inquire about partnerships and advertising on PriceOfElectricity.com.",
    url: `${BASE_URL}/advertise`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Advertise with Us | PriceOfElectricity.com",
    description:
      "Reach people comparing residential electricity prices and bills. Inquire about partnerships and advertising on PriceOfElectricity.com.",
  },
};

export default function AdvertisePage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Advertise with Us",
    url: `${BASE_URL}/advertise`,
    description:
      "Reach people comparing residential electricity prices and bills. Inquire about partnerships and advertising on PriceOfElectricity.com.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />
      <h1>Advertise with Us</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Independent electricity price data and tools for all 50 states. We work with a small set of
        partners whose offers align with how people research rates, bills, and providers.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Who this reaches</h2>
        <p style={{ marginTop: 0 }}>
          Visitors use PriceOfElectricity.com to compare state-level residential rates, estimate
          bills, and explore usage and provider context. Inventory and formats are kept bounded so
          editorial clarity stays first.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Who should inquire</h2>
        <p style={{ marginTop: 0 }}>
          We welcome serious inquiries from advertisers, agencies, and data partners serving
          residential electricity shoppers or adjacent energy products, provided placements respect
          our disclosures and do not misrepresent independent data.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Inquiry form</h2>
        <p style={{ marginTop: 0 }}>
          Share a short brief using the form below. We use your details only to respond to this
          inquiry.
        </p>
        <AdvertiserInquiryForm />
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Other contact</h2>
        <p style={{ marginTop: 0 }}>
          For non-advertising topics (data corrections, general partnerships), see{" "}
          <Link href="/contact">Contact</Link> or email{" "}
          <a href="mailto:contact@priceofelectricity.com">contact@priceofelectricity.com</a>.
        </p>
      </section>
    </main>
  );
}
