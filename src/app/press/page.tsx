import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import CopyBlock from "@/app/components/CopyBlock";

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  title: "Press & Media Kit | PriceOfElectricity.com",
  description:
    "Press resources, citation guidelines, brand assets, and data downloads for journalists and researchers.",
  alternates: { canonical: `${BASE_URL}/press` },
  openGraph: {
    title: "Press & Media Kit | PriceOfElectricity.com",
    description:
      "Press resources, citation guidelines, brand assets, and data downloads for journalists and researchers.",
    url: `${BASE_URL}/press`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Press & Media Kit | PriceOfElectricity.com",
    description:
      "Press resources, citation guidelines, brand assets, and data downloads for journalists and researchers.",
  },
};

const CITATION_TEMPLATE =
  "PriceOfElectricity.com. Average residential electricity prices by state (¢/kWh). Accessed {{DATE}}. https://priceofelectricity.com/";

export default function PressPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Press & Media Kit",
    url: `${BASE_URL}/press`,
    description:
      "Press resources, citation guidelines, brand assets, and data downloads for journalists and researchers.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Press & Media Kit</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        PriceOfElectricity.com provides state-level average residential
        electricity prices in cents per kilowatt-hour (¢/kWh) for all 50 U.S.
        states. The site offers comparison tools, bill estimators, downloadable
        datasets, and transparent sourcing for journalists, researchers, and
        partners.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Resources</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <Link href="/press/faq">How to cite PriceOfElectricity.com</Link>
          </li>
          <li>
            <Link href="/press/brand">Brand and attribution guidelines</Link>
          </li>
          <li>
            <Link href="/press/press-release">Press release (template)</Link>
          </li>
          <li>
            <Link href="/datasets">Data downloads</Link>
          </li>
          <li>
            <Link href="/sources">Sources</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Copy citation</h2>
        <p style={{ marginTop: 0, marginBottom: 0 }}>
          Use this plain-text citation for reports, articles, or academic work:
        </p>
        <CopyBlock text={CITATION_TEMPLATE} />
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/">Home</Link> {" | "}
        <Link href="/about">About</Link> {" | "}
        <Link href="/contact">Contact</Link>
      </p>
    </main>
  );
}
