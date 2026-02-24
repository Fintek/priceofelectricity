import type { Metadata } from "next";
import Link from "next/link";
import { LAST_REVIEWED, SITE_URL } from "@/lib/site";

const BASE_URL = SITE_URL;
export const dynamic = "force-static";
export const revalidate = 2592000;

export const metadata: Metadata = {
  title: "Disclosures | PriceOfElectricity.com",
  description:
    "Monetization, advertising, data, and editorial disclosures for PriceOfElectricity.com.",
  alternates: { canonical: `${BASE_URL}/disclosures` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Disclosures | PriceOfElectricity.com",
    description:
      "Monetization, advertising, data, and editorial disclosures for PriceOfElectricity.com.",
    url: `${BASE_URL}/disclosures`,
  },
};

export default function DisclosuresPage() {
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Disclosures",
    description:
      "Monetization, advertising, data, and editorial disclosures for PriceOfElectricity.com.",
    url: `${BASE_URL}/disclosures`,
    dateModified: LAST_REVIEWED,
  };

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageStructuredData) }}
      />

      <h1>Disclosures</h1>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Affiliate / referral disclosure</h2>
        <p style={{ marginTop: 0 }}>
          Some outbound links may be affiliate or referral links. The site may
          earn revenue at no additional cost to users. Offers are optional.
        </p>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Advertising / sponsored placements</h2>
        <p style={{ marginTop: 0 }}>
          Sponsored placements, if present, will be clearly labeled as sponsored.
        </p>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Data / methodology disclosure</h2>
        <p style={{ marginTop: 0 }}>
          Electricity rates on this site are energy-only estimates and may not
          equal full bills, which can include delivery charges, taxes, fixed
          fees, and other utility line items. See our{" "}
          <Link href="/methodology">methodology</Link> for how rates are
          calculated.
        </p>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Editorial independence</h2>
        <p style={{ marginTop: 0 }}>
          Rankings are derived from the published methodology. Commercial
          relationships do not change the core calculation framework.
        </p>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Corrections</h2>
        <p style={{ marginTop: 0 }}>
          To report a correction or request an update, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </section>
    </main>
  );
}
