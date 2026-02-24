import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;

export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Licensing | PriceOfElectricity.com",
  description:
    "Licensing terms for PriceOfElectricity.com electricity rate data, including commercial usage guidance and contact information.",
  alternates: { canonical: `${BASE_URL}/licensing` },
  openGraph: {
    title: "Licensing | PriceOfElectricity.com",
    description:
      "Licensing terms for PriceOfElectricity.com electricity rate data, including commercial usage guidance and contact information.",
    url: `${BASE_URL}/licensing`,
    siteName: "PriceOfElectricity.com",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Licensing | PriceOfElectricity.com",
    description:
      "Licensing terms for PriceOfElectricity.com electricity rate data, including commercial usage guidance and contact information.",
  },
};

export default function LicensingPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Licensing",
    url: `${BASE_URL}/licensing`,
    description:
      "Licensing terms for PriceOfElectricity.com electricity rate data, including commercial usage guidance and contact information.",
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageStructuredData),
        }}
      />

      <h1>Licensing</h1>

      <p className="intro muted" style={{ marginTop: 0 }}>
        PriceOfElectricity.com data is available for free personal and
        non-commercial use, including viewing pages and linking to public
        content.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Usage terms</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
          <li>Personal and non-commercial viewing and linking is permitted.</li>
          <li>
            For commercial use (including embedding, redistribution, or bulk
            downloads in commercial products), please contact us.
          </li>
          <li>All data is provided &quot;as-is&quot; without warranties.</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>
          Commercial licensing inquiries
        </h2>
        <p style={{ marginTop: 0 }}>
          For commercial licensing, partnerships, or custom data usage terms,
          please reach out through the contact page.
        </p>
        <p style={{ marginTop: 6 }}>
          <Link href="/contact">Contact us</Link>
        </p>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        <Link href="/datasets">Data downloads</Link> {" | "}
        <Link href="/sources">Sources</Link> {" | "}
        <Link href="/contact">Contact</Link>
      </p>
    </main>
  );
}
